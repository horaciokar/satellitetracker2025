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

## Infraestructura

Para más detalles sobre la arquitectura y las tecnologías utilizadas, consulta el archivo [infra.md](infra.md).
