# 17 — Referencia del firmware y separación de repositorios

## Fuente de verdad

El firmware vigente se mantiene en el repositorio separado **[Tomicasgit/ESP32_Proyecto2030](https://github.com/Tomicasgit/ESP32_Proyecto2030)**. El archivo principal es [`Completop.ino`](https://github.com/Tomicasgit/ESP32_Proyecto2030/blob/main/Completop.ino), que declara la versión **v5.3**.

La explicación completa y actualizada está en:

- [24 — Referencia completa del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md)
- [24 — Referencia completa del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md), que incluye UUID, protocolo JSON, montaje lógico, diagnóstico y plan de verificación.
- [Sketch canónico v5.3](https://github.com/Tomicasgit/ESP32_Proyecto2030/blob/main/Completop.ino).

## Archivo histórico de este repositorio

El archivo `Completop.ino` que permanece en el repositorio de la aplicación declara **v4.1**. Es una versión anterior que utiliza una lógica de detección por umbral de dedo y no coincide con toda la lógica de contacto de muñeca, mediana de intervalos y configuración de v5.3.

Por lo tanto:

1. No usar la copia v4.1 para representar el estado actual del dispositivo.
2. Los cambios de firmware deben hacerse en `ESP32_Proyecto2030/Completop.ino`.
3. Cuando se cambie el contrato BLE, actualizar también el módulo `js/bluetooth.js` de la aplicación.
4. Mantener la documentación de ambos repositorios sincronizada.
5. No declarar compilación o prueba física exitosa sin evidencia del IDE y del dispositivo real.

## Resumen de funciones del firmware v5.3

| Área | Responsabilidad |
|---|---|
| Adquisición | Lectura del FIFO del MAX30102 mediante I²C. |
| Contacto | Umbrales IR distintos para confirmar contacto y pérdida, con confirmación temporal. |
| Estimación | `checkForBeat()`, intervalos de 300–2000 ms, mediana de hasta cinco intervalos, conversión a LPM y suavizado exponencial. |
| Promedio | Media de hasta cuatro estimaciones suavizadas. |
| Frescura | Invalidación de la lectura tras 5000 ms sin una estimación nueva. |
| Estado | Estados técnicos del sensor separados del estado orientativo de usuario. |
| Calidad | Indicador heurístico 0–5, no clínico. |
| Pantalla | Dashboard ST7789 de 170 × 320 con encabezado, LPM, promedio, calidad, sensor, BLE y hora. |
| BLE | Servicio GATT, característica READ/NOTIFY/WRITE y telemetría JSON. |
| Tiempo | Sincronización de fecha/hora desde la web mediante ISO 8601; el firmware no usa Wi-Fi. |
| Recuperación | Supervisión I²C y reintento de inicialización del sensor. |

Los detalles de constantes, variables, callbacks y funciones están desarrollados en la referencia v5.3.