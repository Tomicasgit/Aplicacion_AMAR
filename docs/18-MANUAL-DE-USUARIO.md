# 18 — Manual de usuario del prototipo

Este manual describe cómo utilizar la demostración actual. Algunas funciones dependen de la configuración de Supabase, del navegador y del dispositivo físico.

## 1. ¿Qué es A.M.A.R.?

A.M.A.R. — **Asistente de Monitoreo Autónomo de Ritmo** es un prototipo que combina un dispositivo con sensor óptico y una aplicación web. Busca mostrar una estimación de LPM, guardar lecturas disponibles y facilitar el registro de una solicitud de ayuda.

No es un dispositivo médico certificado y no reemplaza consultas, diagnósticos ni tratamientos.

## 2. Acceder a la aplicación

1. Abrir el enlace de la aplicación en un navegador compatible.
2. Registrarse o iniciar sesión con la cuenta asignada.
3. Esperar a que cargue el dashboard.
4. Si aparece un error, revisar la conexión a Internet y el mensaje de la interfaz.

No compartir la contraseña ni utilizar una cuenta con datos personales reales durante una demostración pública.

## 3. Conectar el dispositivo

1. Encender la placa.
2. Esperar a que termine la inicialización de pantalla y sensor.
3. En el dashboard, iniciar la conexión Bluetooth.
4. Seleccionar el dispositivo A.M.A.R. que aparece en el selector del navegador.
5. Conceder el permiso cuando el navegador lo solicite.
6. Esperar el estado conectado y una lectura válida.

Si el dispositivo no aparece, verificar que esté encendido, cerca, anunciándose por BLE y que el navegador admita Web Bluetooth. La conexión BLE no requiere que el sensor se conecte por Wi-Fi a la web.

## 4. Interpretar la lectura

- **LPM:** estimación actual producida por el firmware.
- **Estado del sensor:** indica si el sensor responde.
- **Estado de lectura:** indica si existe una medición considerada válida.
- **Hora:** permite evaluar la antigüedad del dato.
- **Desconectado o sin lectura:** significa que no hay datos actuales confiables para mostrar.

No interpretar una pantalla con el último valor como prueba de que el dato sigue vigente si la conexión se perdió.

## 5. Consultar historial

1. Abrir la sección de historial.
2. Elegir una fecha en el calendario.
3. Revisar las lecturas guardadas para ese día.
4. Consultar los resúmenes por período si están disponibles.

El historial muestra lo que se recibió y persistió correctamente. Los cortes de conexión, permisos o fallos de red pueden dejar intervalos sin datos.

## 6. Gestionar contactos

En “Mis contactos de emergencia” se muestran nombre, teléfono, correo guardado y relación. Las acciones disponibles son:
- **Llamar:** abre el manejador telefónico del dispositivo.
- **Editar:** permite modificar los datos del contacto.
- **Eliminar:** solicita confirmación antes de borrar.

No hay botón de envío de correo directo en esta lista. El correo se conserva para que el flujo SOS del servidor pueda notificar contactos cuando esté configurado.

## 7. Solicitar SOS

1. Usar la acción SOS según la interfaz.
2. Confirmar la solicitud cuando el sistema lo pida.
3. Permitir ubicación solo si se desea y el navegador la solicita.
4. Leer el resultado del registro y el estado de comunicación.
5. Si se necesita asistencia inmediata, contactar directamente a los servicios correspondientes.

A.M.A.R. no realiza llamadas automáticas ni activa una alarma en el teléfono del contacto. Los botones de teléfono/WhatsApp abren aplicaciones para que el usuario continúe manualmente.

## 8. Comprender el correo

El sistema puede informar que el proveedor aceptó el envío. Eso no garantiza que el mensaje llegue a la bandeja principal, sea leído o reciba respuesta. Si aparece un error, el administrador debe revisar la configuración de Resend y los registros de Supabase.

## 9. Privacidad

- Añadir solo contactos que acepten ser contactos de emergencia.
- La ubicación puede compartirse en el aviso cuando se obtuvo y el flujo la incluye.
- Cerrar sesión al terminar una demostración en un equipo compartido.
- No utilizar la aplicación para compartir públicamente datos de salud, correos o coordenadas.
- No usar valores del prototipo como base única para decisiones médicas.

## 10. Problemas comunes

| Problema | Qué comprobar |
|---|---|
| No puedo entrar | Credenciales, conexión y estado del servicio. |
| No veo lecturas | Sensor, conexión BLE y estado mostrado en la placa. |
| No puedo conectar Bluetooth | Navegador compatible, permisos y distancia al dispositivo. |
| El historial está vacío | Que existan lecturas guardadas y que la sesión sea correcta. |
| No puedo editar/eliminar | Sesión, conexión y datos requeridos del formulario. |
| No llega el correo | Estado de la función, secretos, remitente y registros de Resend. |
| La página parece vieja | Recargar sin caché o abrir nuevamente después de la actualización. |
