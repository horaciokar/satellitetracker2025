#!/bin/bash

# ==============================================================================
# Script para reiniciar la aplicación Satellite Tracker
#
# Uso:
# 1. Guarda este archivo como 'restart.sh' en el directorio raíz de tu proyecto.
# 2. Dale permisos de ejecución con el comando: chmod +x restart.sh
# 3. Ejecútalo con: ./restart.sh
#
# Este script buscará y detendrá cualquier instancia en ejecución de la
# aplicación (node server.js) y luego la iniciará de nuevo en segundo plano.
# ==============================================================================

echo "Intentando reiniciar la aplicación del Satellite Tracker..."
echo "-----------------------------------------------------"

# Buscar el proceso del servidor Node.js que está en ejecución
# Se excluye el propio comando 'grep' de la búsqueda.
PID=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}')

# Comprobar si se encontró un PID
if [ -z "$PID" ]; then
    echo "INFO: No se encontró ningún servidor en ejecución."
else
    echo "Acción: Deteniendo el servidor actual con PID: $PID"
    # Matar el proceso
    kill $PID
    # Esperar un momento para asegurar que el proceso se ha detenido
    sleep 1 
    echo "INFO: Servidor detenido."
fi

echo "Acción: Iniciando el nuevo servidor en segundo plano..."
# Iniciar el servidor usando 'npm start'. El '&' lo envía al segundo plano.
# Redirigir la salida estándar y de error a un archivo de log para poder revisarla.
LOG_FILE="server.log"
npm start > $LOG_FILE 2>&1 &

# Obtener el PID del nuevo proceso que se acaba de iniciar
NEW_PID=$!

# Comprobar si el comando anterior (npm start) se ejecutó correctamente
if [ $? -eq 0 ]; then
    echo "ÉXITO: El servidor se ha iniciado correctamente en segundo plano."
    echo "El nuevo PID es: $NEW_PID"
    echo "Puedes ver los logs del servidor con el comando: tail -f $LOG_FILE"
    echo "-----------------------------------------------------"
else
    echo "ERROR: Hubo un problema al iniciar el servidor."
    echo "Revisa el archivo de log '$LOG_FILE' para más detalles."
    echo "-----------------------------------------------------"
    exit 1
fi

exit 0
