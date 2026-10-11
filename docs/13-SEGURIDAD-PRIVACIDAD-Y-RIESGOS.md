# 13 — Seguridad, privacidad y análisis de riesgos

## 1. Activos que requieren protección

- Identidad y sesión del usuario.
- Historial de LPM y marcas temporales.
- Datos de perfil y contactos.
- Correos de aviso y contenido SOS.
- Ubicación precisa.
- Secretos de Resend y credenciales administrativas.
- Integridad de la lectura mostrada y del registro de alertas.

## 2. Principios

- Minimización: almacenar y compartir solo lo necesario.
- Autorización: cada usuario accede a sus propios datos.
- Transparencia: indicar qué información se envía y a quién.
- Seguridad por capas: Auth, RLS, validación de función y validación de interfaz.
- No exposición de secretos: claves privadas solo en servidor.
- Trazabilidad mínima: registrar lo necesario para investigar fallos sin almacenar datos sensibles innecesarios.

## 3. Matriz de riesgos

| Riesgo | Consecuencia | Mitigación |
|---|---|---|
| RLS abierta o incorrecta | Exposición de datos de otro usuario | Probar políticas con dos cuentas; revisar permisos por tabla. |
| Clave privada en frontend | Abuso del servicio | Guardar secretos en Supabase; revisar historial Git. |
| Token expuesto en logs | Suplantación de sesión | Redactar encabezados y nunca pegar tokens en incidencias. |
| Coordenadas compartidas sin intención | Riesgo de privacidad física | Pedir permiso, hacer ubicación opcional y limitar destinatarios. |
| Correo no entregado | Contacto no informado | Mostrar estado real, revisar Resend y ofrecer llamada directa. |
| Correo aceptado pero no leído | Falsa sensación de seguridad | Aclarar que el envío no garantiza lectura/respuesta. |
| Lectura errónea por movimiento | Interpretación incorrecta | Etiquetar como prototipo, mostrar validez/antigüedad y probar sensor. |
| Datos obsoletos mostrados como actuales | Decisiones basadas en información antigua | Mostrar marca temporal y estado de conexión. |
| HTML dinámico sin escapar | Inyección de contenido | Escapar datos del usuario y evitar concatenación insegura. |
| SOS duplicado | Correos repetidos | Diseñar idempotencia y confirmar acción cuando proceda. |
| Correo a un contacto ajeno | Divulgación no autorizada | Verificar `user_id` en la función de servidor. |
| Pérdida de conexión | Sin nuevas lecturas/notificaciones | Mostrar desconexión y permitir reconexión manual. |

## 4. Modelo de amenaza simplificado

Los actores potenciales incluyen usuario no autenticado, usuario autenticado malicioso, persona con acceso físico al dispositivo, destinatario de correo y proveedor externo. Las fronteras principales son navegador, Supabase y Resend. Nunca asumir que el navegador es confiable: puede alterarse mediante herramientas de desarrollo y sus peticiones pueden reproducirse.

## 5. RLS

Cada tabla que almacene datos personales debe tener RLS habilitada y políticas para SELECT/INSERT/UPDATE/DELETE según el caso. No basta con filtrar por `user_id` en JavaScript. La función de servidor debe validar el token y derivar la identidad desde ese token.

Lista de auditoría:
- [ ] RLS habilitada en tablas sensibles.
- [ ] SELECT limitado al propietario.
- [ ] INSERT obliga a que el propietario sea el usuario autenticado.
- [ ] UPDATE exige propietario tanto en la fila objetivo como en la nueva fila.
- [ ] DELETE limitado al propietario.
- [ ] Sin políticas públicas permisivas innecesarias.
- [ ] Pruebas con dos usuarios y acceso cruzado denegado.

## 6. Secretos

Los secretos son credenciales de Resend y cualquier clave administrativa de Supabase. Deben configurarse con la CLI/entorno de secretos, rotarse si se exponen y nunca versionarse. La URL y clave pública del cliente no son equivalentes a una clave service-role, pero su exposición solo es aceptable si RLS está correctamente configurada.

## 7. Datos sensibles y consentimiento

Antes de activar una función SOS, explicar al usuario qué contacto recibirá el correo y qué información puede incluir. Los contactos deben haber sido agregados con autorización apropiada. La ubicación debe omitirse si no se obtuvo correctamente. Evitar usar datos médicos reales en pruebas o capturas públicas.

## 8. Seguridad del mensaje de correo

- Remitente verificado.
- Destinatario derivado de un contacto propiedad del usuario.
- Texto de plantilla breve y comprensible.
- Coordenadas solo si se autorizó su obtención y están validadas.
- Sin tokens ni secretos en el cuerpo.
- Respuesta de función sin datos internos innecesarios.
- Control de errores y límites de tamaño de entrada.

## 9. Incidentes

Si una clave privada se publica, revocarla/rotarla inmediatamente, revisar el historial del repositorio y los logs de uso, y reemplazarla en los secretos del servidor. Borrar el texto del commit no invalida una clave filtrada. Si hay exposición de datos, preservar evidencia mínima y seguir las obligaciones aplicables al responsable del proyecto.

## 10. Límites

Esta documentación es una guía de ingeniería y no una auditoría formal, una certificación de seguridad ni asesoramiento legal. La configuración efectiva debe inspeccionarse en el entorno desplegado.
