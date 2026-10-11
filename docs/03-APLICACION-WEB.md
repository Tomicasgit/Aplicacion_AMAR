# 03 — Aplicación web: HTML, CSS y JavaScript

## 1. Entrada y estructura

`index.html` contiene la estructura de las vistas de autenticación y del panel. Dentro del panel se alternan secciones de inicio, historial, contactos, dispositivos y perfil. Los módulos JavaScript se cargan como scripts clásicos y comparten funciones globales del proyecto.

El CSS principal está en `style.css`. Los cambios visuales deben reutilizar las variables CSS y mantener las reglas responsive y de movimiento reducido.

## 2. Mapa de módulos JavaScript

| Archivo | Responsabilidad principal | Áreas importantes |
|---|---|---|
| `js/core.js` | Utilidades compartidas | Mostrar vistas, abrir/cerrar modal, mensajes, escape de HTML y utilidades DOM. |
| `js/auth.js` | Autenticación | Registro/inicio de sesión y gestión de errores de Supabase Auth. |
| `app.js` | Arranque y coordinación | Vincula eventos de interfaz y coordina formularios y módulos. |
| `js/dashboard.js` | Panel principal | Consulta datos del usuario y actualiza indicadores, dispositivo, contactos, ubicación y última alerta. |
| `js/bluetooth.js` | Comunicación BLE | Solicita dispositivo, conecta, suscribe notificaciones, interpreta lecturas, guarda datos y maneja desconexiones. |
| `js/devices.js` | Dispositivos | Cargar, crear, editar y eliminar dispositivos asociados al usuario. |
| `js/contacts.js` | Contactos | Cargar, crear, editar y eliminar contactos de emergencia. |
| `js/history.js` | Historial | Filtrado por fecha, calendario y resúmenes diario/semanal/mensual según los datos disponibles. |
| `js/profile.js` | Perfil | Edición de los datos personales del usuario. |
| `js/alerts.js` | SOS y alertas | Registro de alertas, solicitud manual, flujo automático, ubicación y comunicación con Edge Functions. |

## 3. Navegación SPA

Las vistas se muestran mediante clases de estado como `.active`; el resto se oculta. El bloque final de `style.css` mantiene esta regla incluso en móvil. Las transiciones de entrada son breves y se desactivan con `prefers-reduced-motion`.

## 4. Interfaz del panel

El panel contiene, según los datos disponibles:
- Frecuencia cardíaca actual en LPM.
- Indicador del estado de lectura.
- Hora de la última medición.
- Resumen del día e historial.
- Estado/lista de dispositivos.
- Contactos de emergencia.
- Ubicación más reciente si se guardó.
- Última alerta registrada.
- Acción SOS.

La onda visual del pulso es una animación de interfaz. **No es un ECG, no representa la señal eléctrica del corazón y no debe presentarse como una traza médica.**

## 5. Bluetooth en el navegador

El módulo `bluetooth.js` usa Web Bluetooth y notificaciones GATT. Esto impone límites:
- No todos los navegadores y dispositivos ofrecen Web Bluetooth.
- Normalmente se necesita HTTPS o un origen local seguro.
- El usuario debe elegir y autorizar el dispositivo.
- Si el sensor no produce una lectura válida o se desconecta, el sistema debe comunicarlo.
- El dato recibido debe validarse antes de persistirlo.

## 6. Contactos

El módulo de contactos realiza operaciones de creación, lectura, edición y eliminación. El correo se conserva como dato del contacto para las notificaciones del servidor. En el resumen de contactos dentro del modal SOS se muestran acciones directas de llamada y WhatsApp; el botón de correo se retiró de esa lista porque el aviso por correo forma parte del flujo de solicitud SOS y no debe aparecer como una acción local que parezca no funcionar.

Los enlaces `tel:` y `https://wa.me/` abren una aplicación o solicitan que el usuario continúe la comunicación. No significan que el servidor haya realizado una llamada o enviado un WhatsApp.

## 7. Tratamiento de errores

- Capturar errores de red y mostrarlos con un mensaje legible.
- Mantener el detalle técnico en consola sin exponer secretos.
- No mostrar “correo no enviado” si el proveedor confirmó uno o más envíos.
- Si algunos destinatarios fallan, indicar tanto la cantidad enviada como la cantidad fallida.
- No confundir el registro de la alerta con el envío de correo.
- No presentar una ubicación como disponible si el usuario denegó el permiso o el navegador no la obtuvo.

## 8. Seguridad del HTML dinámico

Los nombres, teléfonos, direcciones de correo y mensajes pueden contener texto introducido por usuarios. Antes de interpolarlos en HTML se debe escapar el contenido. Los datos que llegan al navegador también se deben validar y el servidor debe volver a comprobar autorización y propiedad.

## 9. Mantenimiento del cliente

Cuando un archivo JavaScript o CSS cambia y el alojamiento usa caché, actualizar el parámetro de versión en la etiqueta `script` o `link` puede forzar la descarga de la versión nueva. No es un mecanismo de seguridad; solo ayuda a invalidar caché.
