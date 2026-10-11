# 15 — Decisiones técnicas, historial y cambios

## 1. Registro de decisiones

### ADR-001 — Web estática en lugar de React Native
**Decisión:** mantener una interfaz HTML/CSS/JavaScript que se ejecuta en el navegador.

**Motivo:** permite una página web accesible desde navegador y aprovecha Web Bluetooth donde esté disponible.

**Consecuencias:** las capacidades dependen del navegador y de HTTPS/origen seguro; la experiencia no es idéntica a una aplicación nativa.

### ADR-002 — Supabase para autenticación y datos
**Decisión:** usar Supabase Auth y PostgreSQL.

**Consecuencias:** la identidad se obtiene de Auth; la seguridad de datos depende de RLS y validaciones de servidor. La configuración pública no debe contener secretos administrativos.

### ADR-003 — BLE para comunicación cercana
**Decisión:** el ESP32 expone un servicio y una característica GATT; el navegador recibe notificaciones.

**Consecuencias:** el dispositivo necesita estar cerca y conectado; BLE no es una conexión remota a Internet. Los UUID y el formato de mensajes son un contrato compartido.

### ADR-004 — Correo mediante función de servidor
**Decisión:** usar una Edge Function y Resend para enviar avisos predefinidos.

**Motivo:** no exponer la clave del proveedor en JavaScript del navegador.

**Consecuencias:** el correo requiere secretos, remitente autorizado y función desplegada. Un enlace `mailto:` no es equivalente al envío de servidor y por eso se retiró como botón de acción rápida de los contactos.

### ADR-005 — SOS no equivale a llamada automática
**Decisión:** los botones de teléfono y WhatsApp permiten continuar el contacto manualmente; el servidor registra la alerta y puede enviar correo.

**Consecuencias:** no prometer llamadas automáticas, activación de alarmas remotas ni respuesta garantizada de los contactos.

### ADR-006 — El prototipo no reemplaza atención médica
**Decisión:** comunicar alcance de prototipo en interfaz y documentación.

**Consecuencias:** no diagnosticar, no certificar precisión sin evidencia y no recomendar decisiones clínicas basadas en esta versión.

## 2. Registro de cambios recientes

| Fecha/periodo | Cambio | Evidencia o alcance |
|---|---|---|
| Finales de septiembre–octubre de 2026 | Evolución de firmware y aplicación | Repositorio y conversaciones de desarrollo. |
| 7–10 de octubre de 2026 | Ajustes de interfaz, historial, BLE y flujo SOS/correo | Código del cliente y funciones. |
| 11 de octubre de 2026 | Estado de correo y presentación SOS | Cambios en `js/alerts.js`, CSS y versión de caché. |
| 11 de octubre de 2026 | Documentación especializada | Guías numeradas bajo `docs/`. |
| 11 de octubre de 2026 | Retirada de botón Correo en contactos y normalización de acciones | `js/contacts.js`, `style.css` e invalidación de caché. |
| 11 de octubre de 2026 | Ampliación de documentación técnica | Diccionario de datos, catálogo de código, contratos, UX, operación, riesgos y pruebas. |

Las fechas reflejan actividad documentada, no una auditoría completa de cada minuto ni de todas las revisiones del hardware.

## 3. Registro de pruebas por versión

Para cada versión, crear una entrada con:
- Fecha y commit.
- Cambios visibles.
- Firmware cargado.
- Navegador y sistema operativo.
- Entorno Supabase al que apunta.
- Casos ejecutados y resultados.
- Incidencias conocidas.
- Evidencia sin datos personales.
- Responsable de la prueba.

## 4. Plantilla de bitácora

| Fecha | Inicio | Fin | Duración | Actividad | Evidencia/commit | Resultado |
|---|---|---|---|---|---|---|
| AAAA-MM-DD | HH:MM | HH:MM | HH:MM | Describir tarea real | Hash/archivo | Hecho / pendiente |

Calcular las horas efectivas sumando únicamente intervalos reales registrados. No inferir horas a partir del número de commits o de la fecha de una conversación.

## 5. Cómo mantener el registro

- No sobrescribir decisiones históricas: añadir una nueva ADR si una decisión cambia.
- Mantener las fechas y afirmaciones verificables.
- Vincular cada cambio de interfaz a un caso de prueba.
- Al cambiar tablas, actualizar diccionario de datos y seguridad.
- Al cambiar formato BLE, actualizar contrato, firmware y cliente.
- Al cambiar un flujo de correo, actualizar estados, plantilla y pruebas.


## Decisión vigente: repositorios separados para web y firmware

**Estado:** vigente.

- La aplicación estática y las funciones/configuración asociadas permanecen en [`Aplicacion_AMAR`](https://github.com/Tomicasgit/Aplicacion_AMAR).
- El sketch del dispositivo se mantiene como fuente canónica en [`ESP32_Proyecto2030/Completop.ino`](https://github.com/Tomicasgit/ESP32_Proyecto2030/blob/main/Completop.ino), versión declarada v5.3.
- La copia v4.1 que permanece en el repo web es histórica y no debe confundirse con el firmware actual.
- El ESP32 utiliza BLE y no Wi-Fi; la aplicación web envía el timestamp ISO 8601 al firmware.
- El dashboard del firmware canónico utiliza la paleta clara/coral y presenta LPM, promedio, calidad, estado del sensor, BLE y hora.
- Los cambios en UUID o JSON requieren actualizar firmware y `js/bluetooth.js` en coordinación.

La documentación completa de la lógica, variables, funciones, estados y parámetros está en [24 — Referencia del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md). Las pruebas físicas y de extremo a extremo deben anotarse como evidencia independiente; un commit de código no demuestra que una prueba se haya ejecutado.
