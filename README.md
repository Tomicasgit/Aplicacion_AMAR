# A.M.A.R. — Asistente de Monitoreo Autónomo de Ritmo

A.M.A.R. es un prototipo de monitoreo de frecuencia cardíaca compuesto por una aplicación web y un dispositivo basado en ESP32.

La aplicación permite gestionar usuarios, perfiles, dispositivos vinculados, contactos de emergencia, historial de mediciones, ubicaciones y alertas. El dispositivo IdeaSpark ESP32 procesa lecturas del sensor MAX30102 y transmite las mediciones a la aplicación mediante Bluetooth Low Energy (BLE).

> A.M.A.R. es un prototipo de monitoreo. No diagnostica enfermedades ni reemplaza la atención médica profesional.

## Tecnologías

- HTML, CSS y JavaScript.
- Supabase Auth y base de datos PostgreSQL.
- Bluetooth Low Energy (BLE) para la comunicación con el dispositivo.
- Arduino para el firmware del ESP32.

## Aplicación web

La interfaz principal se encuentra en `index.html`, con estilos en `style.css` y lógica general en `app.js`.

Los módulos de `js/` separan las funciones de autenticación, perfiles, dispositivos, contactos, historial, panel principal, alertas y Bluetooth.

La configuración pública del cliente Supabase se encuentra en `supabase-config.js`. Las claves secretas nunca deben incluirse en el código del navegador.

## Identidad visual

La interfaz utiliza la paleta **A.M.A.R. Pulse**, definida en `style.css`. La documentación de colores, códigos hexadecimales, usos y criterios de consistencia está en [`README-PALETA.md`](README-PALETA.md).

## Firmware

`Completop.ino` contiene el firmware del dispositivo. El hardware y sus conexiones deben verificarse en el propio código antes de modificarlo.

## Publicación

La aplicación web está preparada para publicarse como sitio estático, por ejemplo mediante GitHub Pages. La autenticación y los datos dependen de la configuración del proyecto Supabase y de sus políticas de seguridad.

## Alertas por correo

A.M.A.R. utiliza una **plantilla de emergencia predefinida** para que el usuario no tenga que redactar el mensaje. El botón **Enviar aviso por correo** invoca la Edge Function `amar-email`, que verifica que el contacto pertenezca al usuario autenticado y envía el mensaje mediante Resend. Si se concede el permiso de ubicación, el correo agrega un enlace a Google Maps.

El envío real requiere configurar los secretos de Supabase y desplegar ambas funciones:

- `RESEND_API_KEY`: clave privada de Resend (solo en el servidor).
- `RESEND_FROM_EMAIL`: dirección remitente verificada en Resend, por ejemplo `A.M.A.R. <alertas@tu-dominio.com>`.

```bash
supabase secrets set RESEND_API_KEY=tu_clave_resend RESEND_FROM_EMAIL="A.M.A.R. <alertas@tu-dominio.com>"
supabase functions deploy amar-email
supabase functions deploy amar-sos
```

No pongas la clave de Resend en archivos del frontend ni en GitHub. El correo no se considera enviado hasta que la función devuelve confirmación. Si Resend está en modo de prueba, puede limitar los destinatarios a direcciones verificadas; para avisar a contactos reales, configurá y verificá un dominio remitente en Resend.

Los botones de teléfono y WhatsApp abren la aplicación correspondiente para que la persona confirme el contacto. A.M.A.R. no realiza llamadas automáticas ni activa una alarma remota en el teléfono de los contactos.

## Seguridad y privacidad

- Las tablas deben mantener políticas RLS adecuadas para restringir el acceso a los datos de cada usuario.
- No publicar claves secretas de Supabase.
- Probar el flujo de alertas en modo controlado para evitar notificaciones de emergencia involuntarias.
- La ubicación y las mediciones cardíacas son datos sensibles y deben tratarse con cuidado.
