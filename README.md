# Satellite Tracker 2025

**Repositorio en GitHub:** [https://github.com/horaciokar/satellitetracker2025](https://github.com/horaciokar/satellitetracker2025)

---

Una aplicación web para visualizar la posición en tiempo real de la Estación Espacial Internacional (ISS) y obtener un dashboard con los próximos pasos visibles de satélites (ISS, NOAA, Starlink) para una ubicación específica.

El diseño está inspirado en las interfaces de control de misión de la NASA.

## Puesta en Marcha Local

### Prerrequisitos

*   [Node.js](https://nodejs.org/) (versión 18.x o superior)
*   npm (generalmente incluido con Node.js)

### Instalación

1.  Clona este repositorio (o descarga los archivos).
2.  Abre una terminal en el directorio raíz del proyecto.
3.  Instala las dependencias del proyecto:
    ```bash
    npm install
    ```

### Ejecución

Para iniciar el servidor de desarrollo, ejecuta:
```bash
node server.js
```
> Nota: Más adelante se podría configurar un script `npm start`.

Una vez iniciado, abre tu navegador y visita `http://localhost:3000` (o el puerto que se configure).

## Puesta en Marcha en Producción (Ubuntu 24.04)

Estos pasos detallan cómo desplegar la aplicación en un servidor Ubuntu usando Nginx y Systemd.

### 1. Instalar Dependencias del Servidor

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install -y nginx

# Añadir el repositorio de Node.js 20.x e instalarlo
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalación (opcional)
node -v
npm -v
```

### 2. Subir Aplicación e Instalar Dependencias

```bash
# Clonar el repositorio en /var/www
sudo git clone https://github.com/horaciokar/satellitetracker2025.git /var/www/satellitetracker2025

# Navegar al directorio e instalar dependencias de npm
cd /var/www/satellitetracker2025
sudo npm install
```

### 3. Crear Servicio con Systemd

Crea un archivo de servicio para que el sistema gestione la aplicación.

```bash
sudo nano /etc/systemd/system/satellitetracker.service
```

Pega el siguiente contenido en el editor:

```ini
[Unit]
Description=Satellite Tracker 2025 Backend Server
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/satellitetracker2025
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=satellitetracker

[Install]
WantedBy=multi-user.target
```

### 4. Iniciar y Habilitar el Servicio

```bash
# Recargar systemd, iniciar y habilitar el servicio
sudo systemctl daemon-reload
sudo systemctl start satellitetracker
sudo systemctl enable satellitetracker

# Verificar el estado del servicio
sudo systemctl status satellitetracker

#Para debug
sudo journalctl -u satellitetracker -f
```


### 5. Configurar Nginx como Proxy Inverso

Crea un archivo de configuración para Nginx. Reemplaza `satellitetracker.backnetlabs.edu.ar` con tu dominio.

```bash
sudo nano /etc/nginx/sites-available/satellitetracker.backnetlabs.edu.ar
```

Pega la siguiente configuración:

```nginx
server {
    listen 80;
    server_name satellitetracker.backnetlabs.edu.ar;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```


## Arquitectura de Infraestructura

*   **Backend:**
    *   **Runtime:** Node.js
    *   **Framework:** Express.js
    *   **Responsabilidades:**
        *   Servir la aplicación frontend.
        *   Proveer una API REST para los datos de los satélites.
        *   Obtener y cachear datos TLE (Two-Line Element) desde Celestrak.
        *   Realizar los cálculos orbitales para predecir los pasos de los satélites.

*   **Frontend:**
    *   **Tecnologías:** HTML5, CSS3, JavaScript (ES6+)
    *   **Librería de Mapas:** Leaflet.js para la visualización geoespacial en tiempo real.
    *   **Responsabilidades:**
        *   Mostrar la interfaz de usuario.
        *   Renderizar el mapa y la posición del satélite.
        *   Permitir al usuario ingresar sus coordenadas.
        *   Consumir la API del backend para mostrar los datos.

*   **Fuente de Datos:**
    *   **Proveedor:** Celestrak
    *   **Datos:** Archivos de texto con formato TLE (Two-Line Element).
    *   **Satélites a rastrear:** ISS (Estación Espacial Internacional), NOAA, Starlink.

## Cómo Funciona: Satellite Tracker 2025

### Flujo de Datos Detallado

El funcionamiento se puede dividir en tres flujos principales:

#### Flujo A: Carga Inicial y Geolocalización

1.  El usuario abre la página `index.html`.
2.  El script `client.js` pide permiso para acceder a la geolocalización del navegador.
3.  Si se concede, las coordenadas del usuario se autocompletan en el formulario. Si no, el usuario debe introducirlas manualmente.

#### Flujo B: Visualización de la ISS en Tiempo Real

1.  El `client.js` inicializa un mapa con Leaflet.js.
2.  Cada 5 segundos, hace una petición `fetch` al endpoint del backend: `GET /api/iss-now`.
3.  El `server.js` calcula la posición actual de la ISS usando datos TLE de Celestrak y la librería `satellite.js`.
4.  El `client.js` recibe las coordenadas y actualiza la posición del marcador de la ISS en el mapa.

#### Flujo C: Búsqueda de Pasos de Satélites

1.  El usuario introduce su latitud/longitud y hace clic en "Buscar Pasos".
2.  El `client.js` hace una petición `fetch` al endpoint: `GET /api/satellite-passes` con las coordenadas.
3.  El `server.js` recibe la petición y realiza los siguientes pasos:
    *   Obtiene los TLEs para `iss`, `noaa` y `starlink` desde Celestrak (con un sistema de caché de 4 horas).
    *   Para cada satélite, simula los próximos 10 días para encontrar pases visibles (elevación > 10°).
    *   Filtra los pases para mantener solo aquellos cuyo acimut en el punto de máxima elevación sea mayor a 30°.
    *   Devuelve una lista ordenada de los pases válidos.
4.  El `client.js` recibe la lista y la muestra en la tabla del dashboard.