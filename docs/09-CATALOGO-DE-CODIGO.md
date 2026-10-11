# 09 — Catálogo del código fuente, archivo por archivo

Esta guía explica la responsabilidad de cada archivo rastreado. Para comentarios línea por línea, los comentarios del propio código deben ampliarse cuando se cambie una función; este catálogo registra el contrato de cada módulo para facilitar mantenimiento.

## 1. Archivos raíz

| Archivo | Responsabilidad | Qué no debería contener |
|---|---|---|
| `index.html` | Estructura semántica de las vistas, formularios, tarjetas y puntos de montaje de datos; carga CSS y scripts. | Claves privadas, consultas de servidor con privilegios o reglas de negocio duplicadas. |
| `style.css` | Variables visuales, diseño responsive, estados, componentes, modales, animaciones y accesibilidad. | Lógica de negocio o datos de usuarios. |
| `supabase-config.js` | URL del proyecto y clave pública de cliente. | Service-role key, clave privada de Resend o contraseñas. |
| `app.js` | Coordinación de eventos globales y operaciones de la interfaz, incluyendo salida de sesión. | Sustituir toda la lógica específica de cada módulo. |
| `Completop.ino` | Firmware de la placa: periféricos, sensor, cálculo, pantalla, BLE y estados. | Credenciales de usuarios o claves del proveedor de correo. |
| `package.json` / `package-lock.json` | Dependencias npm de herramientas auxiliares. | Secretos. |
| `.gitignore` | Excluir archivos locales/temporales indicados por las reglas Git. | Datos necesarios para compilar que no estén documentados. |
| `supabase/config.toml` | Configuración de Supabase CLI local. | Valores secretos de producción. |

## 2. JavaScript compartido

### `js/core.js`
- Crea el cliente de Supabase a partir de la URL y la clave pública.
- Define `$` como atajo de `document.querySelector`.
- `show(id)`: activa la vista principal indicada y desactiva las demás.
- `message(selector, text, success)`: escribe un mensaje de estado en la interfaz.
- `openModal(html)` y `closeModal()`: administran el diálogo reutilizable.
- `escapeHTML(value)`: escapa texto antes de insertarlo en HTML.
- Es una dependencia de los demás módulos; cargarlo antes de los archivos que lo usan.

### `js/auth.js`
Administra el cambio entre vistas de acceso/registro y procesa los formularios con Supabase Auth. Debe comunicar errores de credenciales sin mostrar tokens. La sesión es la fuente de identidad, no un ID escrito manualmente por el usuario.

### `app.js`
Conecta eventos de la aplicación y coordina la actualización del panel tras cambios. Las acciones de salida cierran la sesión de Supabase y devuelven la interfaz a la vista de acceso. Si se agregan nuevas vistas, verificar que se inicialicen sus formularios y controles una sola vez.

## 3. Módulos funcionales

### `js/dashboard.js`
Carga el usuario autenticado y consulta datos resumidos para el panel. Reúne perfil, lecturas, dispositivos, contactos, alertas y ubicación. Su responsabilidad es presentar un resumen; el historial detallado pertenece a `history.js`.

### `js/bluetooth.js`
Gestiona la conexión Web Bluetooth, el dispositivo seleccionado, la característica GATT, las notificaciones y el estado de conexión. Interpreta los mensajes del firmware, actualiza la lectura y persiste muestras con un intervalo mínimo configurado. Debe evitar duplicar listeners o escrituras cuando el usuario reconecta.

### `js/history.js`
Convierte marcas temporales a claves de fecha local, filtra lecturas, representa calendario y calcula resúmenes diarios, semanales y mensuales. Los resúmenes solo son representativos de los registros guardados: no deben rellenar faltantes como si fueran mediciones reales.

### `js/contacts.js`
Carga contactos del usuario autenticado, muestra nombre/teléfono/correo/relación, abre el formulario de edición y permite borrar con confirmación. “Llamar” usa un enlace `tel:`; no inicia una llamada desde el servidor. El botón “Correo” fue retirado de la lista porque el enlace `mailto:` no era un envío de correo del sistema.

### `js/devices.js`
Carga, edita y elimina los registros de dispositivos del usuario. Un registro de dispositivo no demuestra que exista conexión BLE activa: ese estado se gestiona por separado.

### `js/profile.js`
Obtiene y actualiza datos del perfil del usuario. Debe filtrar por identidad autenticada y no aceptar que el cliente actualice perfiles ajenos.

### `js/alerts.js`
Orquesta la lógica de alertas: obtiene el usuario, registra la solicitud, invoca la Edge Function SOS, solicita ubicación si está autorizada, evalúa lecturas para el flujo automático, administra una cuenta regresiva/confirmación y presenta resultados. También contiene utilidades de estado de comunicación y HTML de contactos para el modal SOS. La interfaz debe distinguir registro, aceptación de envío y entrega.

## 4. Funciones de servidor

### `supabase/functions/amar-sos/index.ts`
Punto de entrada HTTP para el SOS. Gestiona CORS, valida el Bearer token, registra la alerta, consulta contactos del usuario y solicita envíos de correo mediante Resend cuando hay configuración.

### `supabase/functions/amar-email/index.ts`
Punto de entrada HTTP para un aviso predefinido a un contacto individual. Valida sesión y pertenencia del contacto, arma el contenido y usa secretos del servidor para invocar Resend. No debe exponerse la clave del proveedor al navegador.

## 5. Firmware

### `Completop.ino`
El sketch integra las bibliotecas Arduino para GPIO, I²C, SPI, reloj/tiempo, sensor óptico, pantalla ST7789 y BLE. La secuencia de inicialización prepara pantalla y sensor, registra el servicio BLE y ejecuta el bucle principal para comprobar el sensor, procesar muestras y actualizar la interfaz.

Para cambios en el firmware, documentar:
1. Pines y periféricos afectados.
2. Bibliotecas/versión.
3. Constantes de umbral y tiempo.
4. Formato del mensaje BLE.
5. Cambio de versión del firmware.
6. Resultado de prueba física y placa utilizada.

## 6. Configuración y documentación

- `README.md`: índice principal para desarrolladores y evaluadores.
- `README-PALETA.md`: consulta rápida de colores.
- `docs/`: especificación funcional y técnica.
- `supabase/.gitignore`: reglas de exclusión para artefactos locales de Supabase.
- `supabase/functions/amar-sos/.npmrc` y `deno.json`: configuración auxiliar del entorno de función; confirmar su necesidad cuando se actualice la plataforma.

## 7. Orden de carga

El HTML debe cargar la configuración pública y las bibliotecas externas antes de los módulos que las utilizan. `core.js` debe preceder a los módulos que usan `$`, `show`, `openModal`, `escapeHTML` y `supabaseClient`. Si se cambia el orden de scripts, verificar consola del navegador y formularios de cada vista.

## 8. Regla de mantenimiento

Un módulo debe tener una responsabilidad dominante. Antes de duplicar una función común, revisar `core.js`. Antes de introducir un acceso a datos, revisar el modelo y las políticas RLS. Antes de cambiar un contrato BLE, actualizar firmware, cliente, documentación y pruebas en el mismo cambio.


## Fuente canónica del firmware

El sketch que declara v4.1 dentro de este repositorio es una copia histórica. El firmware actual del dispositivo se mantiene en [`Tomicasgit/ESP32_Proyecto2030/Completop.ino`](https://github.com/Tomicasgit/ESP32_Proyecto2030/blob/main/Completop.ino) y declara v5.3. No modificar la copia histórica esperando que ese cambio se refleje en el firmware canónico. La lógica completa se documenta en [24 — Referencia del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md).
