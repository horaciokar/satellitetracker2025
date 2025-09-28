# Arquitectura de Infraestructura

Este documento describe la arquitectura y los componentes tecnológicos del proyecto Satellite Tracker 2025.

## Componentes Principales

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

## Flujo de Datos

1.  El **backend** descarga periódicamente los archivos TLE más recientes de **Celestrak**.
2.  Un **usuario** carga la aplicación web en su navegador.
3.  El **frontend** solicita la posición actual de la ISS al backend. El backend la calcula y la devuelve.
4.  El usuario introduce sus coordenadas para ver los próximos pasos de satélites.
5.  El **frontend** envía estas coordenadas al backend.
6.  El **backend** utiliza la librería `satellite.js` y los datos TLE para calcular los pases visibles que cumplen los criterios (próximos 10 días, acimut > 30°).
7.  El **frontend** recibe la lista de pases y la muestra al usuario en el dashboard.
