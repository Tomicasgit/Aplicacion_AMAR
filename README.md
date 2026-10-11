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

## Alertas por correo\n\nLa función `supabase/functions/amar-sos/index.ts` registra solicitudes SOS y puede enviar un correo a cada contacto con email usando Resend. Si la persona concede permiso de ubicación, el correo incluye un enlace a la ubicación obtenida en ese momento. Para habilitar los envíos en el proyecto Supabase, configurar estos secretos en el entorno de las Edge Functions:\n\n- `RESEND_API_KEY`: clave privada de Resend (solo del lado del servidor).\n- `RESEND_FROM_EMAIL`: remitente autorizado/verificado en Resend, por ejemplo `A.M.A.R. <alertas@tu-dominio.com>`.\n\nSi esos secretos no están configurados, la alerta se guarda, pero no se envía el correo. Después de vincular el proyecto con Supabase CLI, configurar los secretos y desplegar la función:\n\n```bash\nsupabase secrets set RESEND_API_KEY=tu_clave_resend RESEND_FROM_EMAIL="A.M.A.R. <alertas@tu-dominio.com>"\nsupabase functions deploy amar-sos\n```\n\nUsá un remitente verificado en Resend y no guardes la clave en el repositorio. Los botones de teléfono, email y WhatsApp abren la aplicación correspondiente y requieren que la persona confirme el contacto; no envían mensajes automáticamente. Esta versión no implementa notificaciones push ni una alarma remota en el dispositivo de los contactos.\n\n## Seguridad y privacidad

- Las tablas deben mantener políticas RLS adecuadas para restringir el acceso a los datos de cada usuario.
- No publicar claves secretas de Supabase.
- Probar el flujo de alertas en modo controlado para evitar notificaciones de emergencia involuntarias.
- La ubicación y las mediciones cardíacas son datos sensibles y deben tratarse con cuidado.
