document.addEventListener('DOMContentLoaded', () => {
    console.log('Client-side JavaScript cargado y DOM listo.');

    // --- LÓGICA DE GEOLOCALIZACIÓN ---
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                latitudeInput.value = lat.toFixed(4);
                longitudeInput.value = lon.toFixed(4);
                console.log('Ubicación detectada y autocompletada.');
                // Una vez que tenemos la ubicación, disparamos la búsqueda de pases
                locationForm.requestSubmit();
            },
            (error) => {
                console.warn(`No se pudo obtener la ubicación (${error.code}): ${error.message}. Por favor, introduce las coordenadas manualmente.`);
            }
        );
    } else {
        console.warn('Geolocalización no está disponible en este navegador. Introduce las coordenadas manually.');
    }

    // --- LÓGICA DEL MAPA ---

    const map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const satMarker = L.marker([0, 0]).addTo(map);
    let mapUpdateInterval;

    async function updateSatellitePosition() {
        const group = document.getElementById('satellite-group').value;
        if (!group) return;

        try {
            const cacheBust = `&_=${new Date().getTime()}`;
            const response = await fetch(`/api/satellite-now?group=${group}${cacheBust}`);
            if (!response.ok) throw new Error(`Error en la petición: ${response.statusText}`);
            const data = await response.json();
            
            const { name, latitude, longitude } = data;
            const newLatLng = new L.LatLng(latitude, longitude);
            
            satMarker.setLatLng(newLatLng).bindPopup(name).openPopup();
            map.panTo(newLatLng);

        } catch (error) {
            console.error(`No se pudo obtener la posición para ${group}:`, error);
        }
    }

    function startMapUpdates() {
        // Limpiar intervalo anterior para evitar múltiples actualizaciones simultáneas
        if (mapUpdateInterval) {
            clearInterval(mapUpdateInterval);
        }
        updateSatellitePosition(); // Actualizar inmediatamente
        mapUpdateInterval = setInterval(updateSatellitePosition, 5000);
    }
    
    // --- LÓGICA DEL DASHBOARD DE PASOS ---

    const locationForm = document.getElementById('location-form');
    const passesTableBody = document.querySelector('#passes-table tbody');
    const satelliteGroupInput = document.getElementById('satellite-group');

    locationForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const latitude = latitudeInput.value;
        const longitude = longitudeInput.value;
        const satelliteGroup = satelliteGroupInput.value;

        if (!latitude || !longitude) {
            // No mostrar alerta si el formulario se autocompleta, solo si el usuario pulsa el botón sin datos
            if (event.submitter) { 
                alert('Por favor, introduce una latitud y longitud válidas.');
            }
            return;
        }

        passesTableBody.innerHTML = '<tr><td colspan="4">Buscando pasos...</td></tr>';

        try {
            const cacheBust = `&_=${new Date().getTime()}`;
            const response = await fetch(`/api/satellite-passes?lat=${latitude}&lon=${longitude}&group=${satelliteGroup}${cacheBust}`);
            if (!response.ok) throw new Error(`Error en el servidor: ${response.statusText}`);
            
            const passes = await response.json();
            passesTableBody.innerHTML = '';

            if (passes.length === 0) {
                passesTableBody.innerHTML = '<tr><td colspan="4">No se encontraron pasos para los próximos 10 días.</td></tr>';
                return;
            }

            passes.forEach(pass => {
                const row = document.createElement('tr');
                const startTime = new Date(pass.startTime).toLocaleString();
                const endTime = new Date(pass.endTime).toLocaleString();
                row.innerHTML = `
                    <td>${pass.satelliteName}</td>
                    <td>${startTime}</td>
                    <td>${pass.maxElevation.toFixed(2)}°</td>
                    <td>${endTime}</td>
                `;
                passesTableBody.appendChild(row);
            });

        } catch (error) {
            console.error("Error al buscar los pasos de satélites:", error);
            passesTableBody.innerHTML = '<tr><td colspan="4" style="color: red;">Error al buscar los pasos. Inténtalo de nuevo.</td></tr>';
        }
    });

    // Disparar la búsqueda y la actualización del mapa automáticamente
    satelliteGroupInput.addEventListener('change', () => {
        locationForm.requestSubmit();
        startMapUpdates(); 
    });

    // Iniciar todo al cargar la página
    startMapUpdates();

});
