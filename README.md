# A.M.A.R. — API inicial

API PHP + MySQL/MariaDB para guardar los datos del sistema **Alerta de Latidos y Monitoreo Autónomo**. Es una base de desarrollo: no diagnostica enfermedades ni sustituye atención médica.

## Inicio rápido

1. Creá la base ejecutando `mysql -u root -p < database.sql`.
2. Configurá credenciales en variables `AMAR_DB_HOST`, `AMAR_DB_NAME`, `AMAR_DB_USER` y `AMAR_DB_PASS`, o editá `api/config.php` para uso local.
3. Desde la carpeta del proyecto, iniciá el servidor: `php -S localhost:8000`.
4. La API queda disponible en `http://localhost:8000/api/index.php?action=...`.

## Endpoints

Todos reciben y devuelven JSON. Para endpoints protegidos se utiliza `Authorization: Bearer TOKEN`.

| Acción | Método | Autorización | Función |
|---|---|---|---|
| `register` | POST | No | Crea paciente/usuario y devuelve token. |
| `login` | POST | No | Inicia sesión y devuelve token. |
| `contacts` | GET/POST | Token de usuario | Consulta o agrega contactos de emergencia. |
| `devices` | GET/POST | Token de usuario | Lista o vincula un ESP32 y devuelve su clave una sola vez. |
| `dashboard` | GET | Token de usuario | Devuelve última lectura, alerta y estado de dispositivo. |
| `reading` | POST | Clave ESP32 | Guarda `{ "bpm": 76 }`. |
| `location` | POST | Clave ESP32 | Guarda `{ "latitude": -34.60, "longitude": -58.38 }`. |
| `device-status` | POST | Clave ESP32 | Actualiza `{ "status": "online" }`. |
| `alert` | POST | Clave ESP32 | Guarda alerta `panic`, `high_heart_rate` o `device`. |

Para vincular un ESP32, iniciá sesión y enviá `POST` a `devices` con `{ "name": "Mi ESP32" }`. La respuesta devuelve `device_key` **una única vez**: guardala en el firmware y enviala como Bearer token desde el dispositivo. BLE se gestiona entre el ESP32 y la aplicación cliente; el ESP32 envía luego los datos a esta API por Wi‑Fi/Internet.
