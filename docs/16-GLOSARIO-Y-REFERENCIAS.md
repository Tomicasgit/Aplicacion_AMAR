# 16 — Glosario y referencias técnicas

## 1. Glosario

| Término | Definición en el contexto de A.M.A.R. |
|---|---|
| A.M.A.R. | Asistente de Monitoreo Autónomo de Ritmo. |
| LPM | Latidos por minuto; unidad mostrada por el prototipo. |
| MAX30102 | Sensor óptico que proporciona datos relacionados con pulso y oxigenación; el prototipo utiliza la ruta de lectura implementada en el firmware. |
| ESP32 | Familia de microcontroladores con conectividad inalámbrica. |
| ST7789 | Controlador de pantalla TFT usado por la pantalla de la placa. |
| GPIO | Entrada/salida de propósito general del microcontrolador. |
| I²C | Bus serial de dos líneas, SDA y SCL, usado aquí para comunicar con el sensor. |
| SPI | Bus serial síncrono usado por la pantalla. |
| BLE | Bluetooth Low Energy, comunicación inalámbrica de bajo consumo. |
| GATT | Modelo de servicios y características de datos sobre BLE. |
| UUID | Identificador que distingue el servicio o característica BLE. |
| Web Bluetooth | API del navegador que permite interactuar con dispositivos BLE compatibles, bajo condiciones y permisos específicos. |
| HTML | Lenguaje que define la estructura de la página. |
| CSS | Lenguaje que define apariencia, distribución y estados visuales. |
| JavaScript | Lenguaje que ejecuta la lógica de interfaz en el navegador. |
| SPA | Aplicación web que alterna vistas sin cargar una página nueva completa en cada navegación. |
| API | Interfaz de software que define cómo un componente solicita servicios a otro. |
| Supabase | Plataforma usada para Auth, PostgreSQL y Edge Functions. |
| PostgreSQL | Base de datos relacional utilizada por Supabase. |
| RLS | Row Level Security: reglas de acceso aplicadas a filas de tablas. |
| Edge Function | Código ejecutado en el servidor para realizar operaciones controladas. |
| Resend | Proveedor de API de envío de correo utilizado por las funciones. |
| Token Bearer | Credencial de sesión enviada en el encabezado Authorization. |
| CORS | Política que controla qué orígenes web pueden realizar solicitudes desde navegador. |
| CRUD | Create, Read, Update, Delete: crear, consultar, actualizar y eliminar registros. |
| Cache busting | Cambio de versión de un recurso para forzar que el navegador descargue la copia actualizada. |
| Rango temporal | Período usado para agrupar lecturas por día, semana o mes. |
| Dato obsoleto | Último dato conocido que ya no debe presentarse como lectura actual. |
| Idempotencia | Propiedad que evita duplicar el efecto de una misma operación repetida. |
| SOS | Solicitud de ayuda iniciada por el flujo de alerta del prototipo. |
| Prototipo | Implementación experimental que requiere pruebas antes de considerarse apta para uso real. |

## 2. Referencias técnicas primarias

Consultar siempre la documentación oficial vigente para detalles que pueden cambiar:
- Arduino: https://docs.arduino.cc/
- Espressif ESP32: https://docs.espressif.com/projects/esp-idf/en/stable/esp32/
- Bluetooth SIG, GATT: https://www.bluetooth.com/specifications/specs/
- MDN Web Bluetooth: https://developer.mozilla.org/docs/Web/API/Web_Bluetooth_API
- MDN Geolocation API: https://developer.mozilla.org/docs/Web/API/Geolocation_API
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Database/RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Resend API: https://resend.com/docs/api-reference/emails/send-email
- HTML: https://developer.mozilla.org/docs/Web/HTML
- CSS: https://developer.mozilla.org/docs/Web/CSS
- JavaScript: https://developer.mozilla.org/docs/Web/JavaScript

## 3. Cómo citar fuentes en una presentación

Distinguir:
1. **Hecho del código:** señalar archivo y versión/commit.
2. **Hecho del fabricante:** citar ficha técnica o documentación oficial.
3. **Resultado de prueba:** indicar fecha, entorno, método y resultado observado.
4. **Hipótesis o propuesta:** identificarla como tal.
5. **Dato epidemiológico o médico:** citar la fuente sanitaria primaria y fecha de publicación.

No presentar como validación clínica una demostración funcional, una lectura aislada o una comparación informal.
