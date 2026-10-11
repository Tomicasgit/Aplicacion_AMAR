# 07 — Pruebas, límites y cronología

## 1. Lista de pruebas de regresión

### Cuenta y datos
- [ ] Crear cuenta e iniciar sesión.
- [ ] Cerrar sesión y comprobar que las vistas privadas quedan ocultas.
- [ ] Editar perfil y recargar.
- [ ] Crear, editar y eliminar un contacto; comprobar persistencia.
- [ ] Crear, editar y eliminar un dispositivo; comprobar persistencia.
- [ ] Confirmar que una cuenta no ve contactos, lecturas o alertas de otra.

### Bluetooth y lecturas
- [ ] Navegador compatible y origen seguro.
- [ ] Permiso y selección de dispositivo.
- [ ] Lectura válida recibida con LPM y hora.
- [ ] Datos incompletos, inválidos o fuera de rango rechazados.
- [ ] Desconexión, reconexión y manejo de sensor no disponible.
- [ ] Una lectura guardada aparece en el historial y no se duplica.
- [ ] La animación visual no se confunde con un ECG.

### SOS y correo
- [ ] SOS manual crea un registro en `alerts`.
- [ ] Ubicación concedida se adjunta/guarda cuando está disponible.
- [ ] Denegar ubicación no bloquea el registro SOS.
- [ ] Sin contactos con correo: la UI lo explica.
- [ ] Sin secretos Resend: la alerta se registra y el mensaje indica que el correo no está configurado.
- [ ] Con Resend configurado: se observa `email_sent_count` en la respuesta.
- [ ] Si algunos destinatarios fallan, la UI informa enviados y fallidos por separado.
- [ ] El correo contiene tipo de alerta, fecha y ubicación opcional.
- [ ] La lista de contactos SOS solo presenta llamada y WhatsApp; no muestra botón de correo.
- [ ] Los enlaces telefónicos/WhatsApp abren la app y no afirman que se envió un mensaje automáticamente.
- [ ] Probar el modal en móvil, escritorio, teclado y movimiento reducido.

## 2. Matriz de estados del correo

| Configuración/respuesta | Resultado esperado en interfaz |
|---|---|
| `email_sent_count > 0`, sin fallos | Confirmar que el servicio aceptó los envíos. |
| Enviados y fallidos mayores que cero | Informar ambas cantidades; no decir que falló todo. |
| `email_configured = false` | Avisar que falta configuración de Resend. |
| `email_contacts_count = 0` | Avisar que no hay destinatarios con correo. |
| `email_failed_count > 0`, cero enviados | Indicar que el proveedor no pudo enviar los correos. |
| Respuesta sin contador ni confirmación | Decir que la alerta quedó registrada, pero el envío no fue confirmado. |

Una respuesta exitosa de Resend confirma aceptación del envío, no necesariamente entrega final o lectura. Para validar entrega, revisar los eventos y registros del proveedor.

## 3. Pruebas de seguridad
- No exponer `RESEND_API_KEY` en archivos del cliente.
- No usar claves de servicio en `supabase-config.js`.
- Revisar RLS en cada tabla que contiene datos personales o médicos.
- Validar propiedad de contactos en Edge Functions.
- Validar coordenadas y tamaño de los mensajes.
- Escapar texto del usuario antes de interpolarlo en HTML.
- No incluir tokens, claves o información personal en capturas/documentación.
- Comprobar que errores del proveedor no filtran secretos al navegador.

## 4. Límites conocidos

- El prototipo no está certificado como dispositivo médico.
- No se debe afirmar precisión clínica sin protocolo de comparación y validación.
- Web Bluetooth no está disponible en todos los navegadores.
- BLE requiere proximidad y conexión activa; no equivale a sincronización remota por Internet.
- Correo requiere dominio/remitente válido, secretos y despliegue de Edge Functions.
- El envío de correo no garantiza que el destinatario lo lea.
- Llamadas y WhatsApp se completan manualmente en el dispositivo del usuario.
- La ubicación depende del permiso y capacidades del navegador.
- El historial solo refleja datos que se hayan recibido y guardado correctamente.

## 5. Cronología documentable

| Período documentado | Trabajo registrado en el contexto del proyecto |
|---|---|
| Finales de septiembre–principios de octubre de 2026 | Trabajo sobre firmware, sensor, comunicación y presentación del prototipo. |
| 1–7 de octubre de 2026 | Ajustes de hardware/firmware, Bluetooth y proyecto web; integración y pruebas por etapas. |
| 8–10 de octubre de 2026 | Desarrollo de historial, interfaz, panel y flujo SOS/correo. |
| 11 de octubre de 2026 | Retirada del botón de correo de la lista de contactos SOS, corrección del estado parcial de correo, mejora visual del modal y ampliación de la documentación. |

Esta tabla resume hitos por período; no equivale a un registro auditado de cada commit. **No es posible calcular horas efectivas de trabajo solo a partir de los archivos o de las fechas de conversación.** Para informar horas en una presentación académica, registrar sesiones reales (inicio, fin, tarea y evidencia) en una bitácora y sumar esas duraciones.

## 6. Cómo probar un correo de punta a punta

1. Confirmar que las funciones desplegadas corresponden a los archivos del repositorio.
2. Confirmar los secretos del proyecto Supabase sin revelar sus valores.
3. Verificar en Resend que el remitente está autorizado.
4. Añadir un contacto de prueba autorizado.
5. Activar SOS y guardar la respuesta de la función sin publicar datos personales.
6. Comparar `email_sent_count` y `email_failed_count` con los eventos del proveedor.
7. Comprobar la bandeja de entrada y spam del destinatario de prueba.
8. Repetir con falta de configuración y con destinatario inválido para revisar mensajes de error.
9. Documentar fecha, versión desplegada, resultado y evidencia sin exponer correos reales.

## 7. Mantenimiento
- Mantener UUID BLE sincronizados entre firmware y cliente.
- Actualizar los parámetros de caché cuando se publique un archivo frontend modificado.
- Revisar las políticas RLS tras añadir tablas o nuevas consultas.
- Revisar esta documentación cada vez que cambie el comportamiento real.
- Registrar pruebas físicas del dispositivo y no confundirlas con pruebas de software.


## 8. Estado técnico documentado al 11 de octubre de 2026

### Observaciones registradas durante el desarrollo

- En una prueba de la versión v5.2 se observó que el dispositivo conectaba por BLE y mostraba aproximadamente 63–68 LPM con indicador de calidad 4–5/5. En esa misma etapa, la web permanecía en “Conectado, esperando datos del sensor”. Esto demostró que la conexión BLE por sí sola no bastaba para confirmar recepción y procesamiento en el navegador.
- Posteriormente se ajustó el cliente web para incluir `device_id` al guardar `heart_readings`, reintentar tras ciertos errores y procesar paquetes BLE repetidos; también se actualizaron referencias de caché de scripts.
- El firmware canónico se mantiene en el repositorio separado [ESP32_Proyecto2030](https://github.com/Tomicasgit/ESP32_Proyecto2030), en `Completop.ino`, que declara v5.3.
- La referencia completa del algoritmo, estados, pantalla, reloj y JSON se encuentra en [24 — Referencia completa del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md).

### Qué no debe darse por probado

No hay que inferir que las modificaciones posteriores resolvieron el flujo completo sin repetir la prueba. Quedan por registrar con evidencia:
- compilación del sketch canónico v5.3;
- carga del dashboard en la placa física;
- recepción de JSON por READ y NOTIFY en el navegador objetivo;
- coincidencia entre el JSON emitido y el parser de `js/bluetooth.js`;
- persistencia de lecturas y asociación correcta de `device_id`;
- recuperación tras desconexión y reconexión;
- sincronización de timestamp;
- resultado del flujo SOS/correo en el proyecto Supabase desplegado.

En la bitácora, separar “observado”, “cambiado en código” y “verificado después del cambio”. No marcar como aprobado un caso solo porque se publicó un commit.
