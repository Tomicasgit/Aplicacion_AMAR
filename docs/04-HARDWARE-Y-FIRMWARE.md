# 04 — Hardware y firmware

## 1. Componentes confirmados en el firmware

| Componente | Función |
|---|---|
| Placa IdeaSpark ESP32 | Microcontrolador, lectura de sensor, pantalla y BLE. |
| MAX30102 | Sensor óptico empleado para obtener señal relacionada con el pulso. |
| Pantalla ST7789 de 170 × 320 px | Interfaz local del dispositivo. |
| Bus I²C | Comunicación con el sensor. |
| Bus SPI | Comunicación con la pantalla. |
| Bluetooth Low Energy | Transporte de lecturas y estado hacia la web. |
| Arduino/C++ | Lenguaje y entorno del firmware en `Completop.ino`. |

El firmware del repositorio declara la versión **v4.1** en `FW_VERSION`. Confirmar la versión instalada en la placa antes de asumir que coincide con la versión de GitHub.

## 2. Responsabilidades del firmware

- Inicializar periféricos y bibliotecas.
- Comprobar el estado del MAX30102.
- Recuperarse de ciertos fallos de I²C según la lógica implementada.
- Detectar eventos de latido y calcular una estimación de LPM.
- Rechazar intervalos fuera de los límites configurados.
- Suavizar/combinar muestras según el algoritmo implementado.
- Actualizar la pantalla con estado del sensor y lectura.
- Publicar información mediante un servicio/característica BLE.
- Distinguir estado del sensor y validez/antigüedad de la medición.

## 3. Pines y conexiones

La asignación exacta debe contrastarse con el bloque de configuración de `Completop.ino` y con la revisión física de la placa antes de cablear. Los comentarios del código son la referencia primaria, porque el pinout puede cambiar entre revisiones de hardware.

| Interfaz | Señales que deben verificarse | Propósito |
|---|---|---|
| I²C | SDA / SCL declarados en firmware | Sensor MAX30102, dirección habitual del módulo 0x57. |
| SPI | MOSI / SCLK | Datos y reloj de pantalla. |
| Control ST7789 | CS / DC / RST / BL según configuración | Selección, comando/datos, reinicio y retroiluminación. |
| USB | USB-C de la placa | Alimentación, carga de firmware y puerto serie según la placa. |

No conectar basándose únicamente en una tabla resumida: verificar etiquetas serigrafiadas, voltajes admitidos y el pinout exacto de la revisión utilizada.

## 4. Cadena de medición

```mermaid
flowchart TD
  A[Señal óptica del MAX30102] --> B[Lectura por I2C]
  B --> C[Detección de latidos]
  C --> D[Validación del intervalo]
  D --> E[Cálculo y suavizado de LPM]
  E --> F[Actualización de pantalla]
  E --> G[Mensaje estructurado BLE]
  G --> H[Notificación en navegador]
```

La estimación depende del contacto del sensor con la piel, movimiento, iluminación, alimentación, calidad de la señal y parámetros del algoritmo. Un valor numérico no garantiza exactitud clínica.

## 5. Bluetooth Low Energy

El firmware implementa un servidor BLE. La web busca el servicio y característica configurados en ambos extremos y se suscribe a sus notificaciones. Los UUID del firmware y del módulo `js/bluetooth.js` deben mantenerse idénticos. Si se modifica uno, actualizar y probar ambos lados.

El transporte BLE no equivale a conexión a Internet: el navegador recibe los datos directamente desde el dispositivo y después puede guardarlos en Supabase.

## 6. Fecha y hora

El firmware declara que no usa Wi-Fi para sincronizar hora y que la aplicación participa en la sincronización temporal. Verificar el formato y la zona horaria de cada mensaje para evitar desplazar registros al día anterior/siguiente. La base debe almacenar marcas temporales consistentes y la interfaz convertirlas para mostrarlas en hora local.

## 7. Pruebas físicas recomendadas

1. Encender la placa y confirmar que la pantalla inicia.
2. Comprobar que el sensor responde por I²C.
3. Observar el estado sin dedo y confirmar que no se presenta como lectura válida.
4. Colocar el dedo estable y comparar la lectura con un dispositivo de referencia sin asumir que eso constituye validación clínica.
5. Verificar la antigüedad de la lectura y el comportamiento al retirar el dedo.
6. Conectar por BLE, recibir varias notificaciones y revisar que la web actualiza la hora.
7. Desconectar y reconectar el dispositivo.
8. Confirmar que el historial no duplica lecturas por una suscripción repetida.
9. Revisar el funcionamiento de pantalla y sensor después de un fallo I²C.
10. Probar con movimientos moderados y documentar límites de la señal.

## 8. Seguridad y limitaciones

No usar el prototipo para decidir tratamientos, suspender medicación o descartar síntomas. Si una persona presenta síntomas importantes, debe buscar asistencia médica sin esperar a que A.M.A.R. responda. El firmware y la interfaz no son un dispositivo médico certificado.
