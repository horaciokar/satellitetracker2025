# Cómo Funciona: Satellite Tracker 2025

Este documento detalla el funcionamiento interno de la aplicación, describiendo la interacción entre el frontend y el backend.

## 1. Componentes Principales

- **Backend**: Un servidor Node.js con Express.js. Es el cerebro de la aplicación, encargado de realizar todos los cálculos y de servir los datos.
- **Frontend**: Una aplicación de una sola página (SPA) construida con HTML, CSS y JavaScript puro. Es la cara visible, con la que el usuario interactúa.

## 2. Flujo de Datos Detallado

El funcionamiento se puede dividir en tres flujos principales:

### Flujo A: Carga Inicial y Geolocalización

1.  El usuario abre la página `index.html` en su navegador.
2.  El script `client.js` espera a que toda la página esté cargada (`DOMContentLoaded`).
3.  **Petición de Geolocalización**: El script comprueba si el navegador soporta la API de Geolocalización (`navigator.geolocation`).
4.  Si la soporta, llama a `getCurrentPosition()`:
    -   **Éxito (Permiso concedido)**: La función de callback recibe la posición del usuario. Las coordenadas (`latitude`, `longitude`) se extraen y se insertan automáticamente en los campos del formulario del dashboard.
    -   **Fallo (Permiso denegado o error)**: Se muestra un mensaje en la consola del navegador indicando que la ubicación no se pudo obtener y que el usuario debe introducirla manualmente.

### Flujo B: Visualización de la ISS en Tiempo Real

Este es un proceso cíclico que mantiene el mapa actualizado.

1.  **Inicialización del Mapa**: El `client.js` inicializa un mapa del mundo usando la librería Leaflet.js en el `div` con id `map`.
2.  **Petición Periódica**: Usando `setInterval`, el `client.js` ejecuta una función cada 5 segundos.
3.  **Llamada a la API**: Esta función hace una petición `fetch` al endpoint del backend: `GET /api/iss-now`.
4.  **Cálculo en el Backend**: 
    -   El `server.js` recibe la petición.
    -   Utiliza una función interna `getTles('iss')` que descarga y cachea los TLEs más recientes de Celestrak para la ISS.
    -   Usa `satellite.js` con el TLE obtenido para calcular la posición exacta (latitud, longitud, altitud) de la ISS en el instante actual.
    -   Responde a la petición con un objeto JSON que contiene estas coordenadas.
5.  **Actualización del Frontend**: 
    -   El `client.js` recibe el JSON.
    -   Actualiza la posición del marcador de la ISS en el mapa de Leaflet.
    -   Centra el mapa en la nueva posición del marcador (`map.panTo`).

### Flujo C: Búsqueda de Pasos de Satélites

Este flujo se activa cuando el usuario interactúa con el dashboard.

1.  **Interacción del Usuario**: El usuario rellena los campos de latitud y longitud y hace clic en "Buscar Pasos".
2.  **Captura del Evento**: El `client.js` captura el evento `submit` del formulario.
3.  **Llamada a la API**: 
    -   Muestra un mensaje de "Buscando..." en la tabla.
    -   Hace una petición `fetch` al endpoint: `GET /api/satellite-passes`, pasando las coordenadas como query parameters.
4.  **Procesamiento en el Backend (Implementación Real)**:
    -   El `server.js` recibe la petición con `lat` y `lon`.
    -   **Obtención de TLEs**: Llama a la función `getTles` para los grupos `iss`, `noaa` y `starlink`. Esta función utiliza un **sistema de caché**; si los datos para un grupo tienen menos de 4 horas, los devuelve inmediatamente. Si no, los descarga desde Celestrak usando `axios`, los guarda en caché y luego los devuelve.
    -   **Algoritmo de Cálculo**: Con la lista completa de TLEs, el servidor itera sobre cada satélite:
        - Simula el tiempo para los **próximos 10 días** en intervalos de 1 minuto.
        - En cada intervalo, usa `satellite.js` para calcular la **elevación** y **acimut** del satélite desde la ubicación del usuario.
        - **Detección de Pases**: Identifica un "pase" cuando la elevación del satélite sube por encima de los **10 grados** sobre el horizonte.
        - Durante el pase, registra la hora de inicio, fin, y el punto de máxima elevación.
        - **Filtro**: Al final de cada pase detectado, comprueba si el **acimut en el punto de máxima elevación fue mayor a 30 grados**.
    -   **Respuesta**: Si un pase cumple el criterio del filtro, se añade a una lista. La lista final de pases válidos, ordenada por fecha, se devuelve como una respuesta JSON.
5.  **Visualización en el Frontend**:
    -   El `client.js` recibe el array de pases reales.
    -   Limpia la tabla y la rellena, creando una fila por cada pase con sus datos correspondientes.
