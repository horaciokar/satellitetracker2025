const express = require('express');
const path = require('path');
const satellite = require('satellite.js');
const axios = require('axios');

const app = express();
const port = 3000;

// --- CACHÉ DE TLEs ---
const tleCache = {
    iss: { data: null, timestamp: null },
    noaa: { data: null, timestamp: null },
    starlink: { data: null, timestamp: null },
};
const CACHE_DURATION_HOURS = 4;

const TLE_URLS = {
    iss: 'https://celestrak.org/NORAD/elements/gp.php?NAME=ISS%20(ZARYA)&FORMAT=TLE',
    noaa: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=noaa&FORMAT=TLE',
    starlink: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=TLE',
};

// Función para obtener TLEs (con caché)
async function getTles(group) {
    const now = new Date();
    const cache = tleCache[group];

    if (cache.data && (now - cache.timestamp) / 3600000 < CACHE_DURATION_HOURS) {
        console.log(`Usando TLEs cacheados para ${group}`);
        return cache.data;
    }

    try {
        console.log(`Descargando nuevos TLEs para ${group}...`);
        const response = await axios.get(TLE_URLS[group]);
        const tleData = response.data;
        
        // Parsear TLEs
        const lines = tleData.split(/\r?\n/);
        const tles = [];
        for (let i = 0; i < lines.length - 2; i += 3) {
            if (lines[i].trim()) { // Asegurarse de que no es una línea vacía
                tles.push({
                    name: lines[i].trim(),
                    line1: lines[i + 1],
                    line2: lines[i + 2],
                });
            }
        }

        cache.data = tles;
        cache.timestamp = now;
        return tles;
    } catch (error) {
        console.error(`Error descargando TLEs para ${group}:`, error.message);
        // Si falla, intentar usar el caché antiguo si existe
        return cache.data || [];
    }
}

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// --- ENDPOINTS DE LA API ---

app.get('/api/iss-now', async (req, res) => {
    try {
        const issTles = await getTles('iss');
        if (!issTles || issTles.length === 0) {
            return res.status(500).json({ error: "No se pudo obtener el TLE de la ISS." });
        }
        const satrec = satellite.twoline2satrec(issTles[0].line1, issTles[0].line2);
        const now = new Date();
        const positionAndVelocity = satellite.propagate(satrec, now);
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        res.json({
            latitude: satellite.degreesLat(positionGd.latitude),
            longitude: satellite.degreesLong(positionGd.longitude),
            altitude: positionGd.height,
        });
    } catch (error) {
        res.status(500).json({ error: 'Error al calcular la posición de la ISS' });
    }
});

app.get('/api/satellite-passes', async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
        return res.status(400).json({ error: 'Latitud y longitud son requeridas' });
    }

    const observerGd = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        height: 0,
    };

    try {
        const allTles = [
            ...(await getTles('iss')),
            ...(await getTles('noaa')),
            ...(await getTles('starlink')),
        ];

        const passes = [];
        const now = new Date();
        const tenDays = 10 * 24 * 60 * 60 * 1000;
        const timeStep = 60 * 1000; // 1 minuto

        for (const tle of allTles) {
            const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
            let inPass = false;
            let currentPass = null;

            for (let i = 0; i < tenDays; i += timeStep) {
                const time = new Date(now.getTime() + i);
                const positionAndVelocity = satellite.propagate(satrec, time);
                const positionEci = positionAndVelocity.position;
                const gmst = satellite.gstime(time);
                const lookAngles = satellite.ecfToLookAngles(observerGd, satellite.eciToEcf(positionEci, gmst));

                const elevation = satellite.degrees(lookAngles.elevation);

                if (elevation > 10) { // Consideramos visible por encima de 10 grados
                    if (!inPass) {
                        inPass = true;
                        currentPass = {
                            satelliteName: tle.name,
                            startTime: time,
                            maxElevation: elevation,
                            maxElevationAzimuth: satellite.degrees(lookAngles.azimuth),
                            maxElevationTime: time,
                        };
                    }

                    if (elevation > currentPass.maxElevation) {
                        currentPass.maxElevation = elevation;
                        currentPass.maxElevationAzimuth = satellite.degrees(lookAngles.azimuth);
                        currentPass.maxElevationTime = time;
                    }
                } else {
                    if (inPass) {
                        inPass = false;
                        currentPass.endTime = time;
                        // Aplicar el filtro de acimut
                        if (currentPass.maxElevationAzimuth > 30) {
                            passes.push(currentPass);
                        }
                        currentPass = null;
                    }
                }
            }
        }

        // Ordenar los pases por fecha de inicio
        passes.sort((a, b) => a.startTime - b.startTime);

        res.json(passes);

    } catch (error) {
        console.error("Error calculando los pasos:", error);
        res.status(500).json({ error: 'Error interno al calcular los pasos de satélites.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
