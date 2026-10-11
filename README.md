# A.M.A.R. — Alerta de Latidos y Monitoreo Autónomo

A.M.A.R. es un prototipo de monitoreo de frecuencia cardíaca compuesto por una aplicación web y un dispositivo basado en ESP32.

La aplicación permite gestionar usuarios, perfiles, dispositivos vinculados, contactos de emergencia, historial de mediciones, ubicaciones y alertas.

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

## Firmware

`Completop.ino` contiene el firmware del dispositivo. El hardware y sus conexiones deben verificarse en el propio código antes de modificarlo.

## Publicación

La aplicación web está preparada para publicarse como sitio estático, por ejemplo mediante GitHub Pages. La autenticación y los datos dependen de la configuración del proyecto Supabase y de sus políticas de seguridad.

## Seguridad y privacidad

- Las tablas deben mantener políticas RLS adecuadas para restringir el acceso a los datos de cada usuario.
- No publicar claves secretas de Supabase.
- Probar el flujo de alertas en modo controlado para evitar notificaciones de emergencia involuntarias.
- La ubicación y las mediciones cardíacas son datos sensibles y deben tratarse con cuidado.
