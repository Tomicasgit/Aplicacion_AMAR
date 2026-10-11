# 14 — Plan de pruebas y criterios de aceptación

## 1. Estrategia

Las pruebas se separan por capa. Una prueba de sintaxis no demuestra que una integración funcione; una respuesta HTTP no demuestra que el correo haya llegado; una lectura en pantalla no demuestra que se haya persistido.

| Nivel | Qué valida | Evidencia |
|---|---|---|
| Estática | Sintaxis, referencias y estructura | Revisión de código, linter o compilación. |
| Unidad/lógica | Conversión, validación y cálculos aislados | Casos con entradas conocidas. |
| Integración | Cliente, Supabase, Edge Functions, Resend | Respuestas y registros sanitizados. |
| Hardware | Sensor, pantalla, BLE y alimentación | Registro de versión, placa y observaciones. |
| UX | Comprensión y operabilidad | Tareas observadas y problemas encontrados. |
| Seguridad | Aislamiento de cuentas y protección de secretos | Pruebas negativas y revisión de políticas. |
| Regresión | Que cambios recientes no rompan funciones existentes | Checklist ejecutada después de cada cambio. |

## 2. Cuenta y sesión

| ID | Caso | Resultado esperado |
|---|---|---|
| AUTH-01 | Credenciales válidas | Sesión y dashboard disponibles. |
| AUTH-02 | Credenciales inválidas | Mensaje de error sin filtrar información sensible. |
| AUTH-03 | Cerrar sesión | Vistas privadas ocultas y sesión cerrada. |
| AUTH-04 | Sesión expirada durante una acción | Operación detenida y mensaje claro. |
| AUTH-05 | Usuario A intenta acceder a dato de B | Base/función rechaza la operación. |

## 3. Contactos

| ID | Caso | Resultado esperado |
|---|---|---|
| CONT-01 | Crear contacto válido | Contacto visible tras recargar. |
| CONT-02 | Editar teléfono/nombre | Cambios persistidos y reflejados en el panel. |
| CONT-03 | Eliminar y cancelar confirmación | No se elimina el registro. |
| CONT-04 | Eliminar y confirmar | Registro deja de aparecer. |
| CONT-05 | Contacto sin correo | Se puede gestionar llamada; no aparece botón Correo. |
| CONT-06 | Contacto con correo | Correo visible como dato, sin botón `mailto:`. |
| CONT-07 | Vista móvil | Llamar, Editar y Eliminar tienen altura y presentación consistentes. |

## 4. Bluetooth y lecturas

| ID | Caso | Resultado esperado |
|---|---|---|
| BLE-01 | Navegador sin Web Bluetooth | Explicación compatible; no bloqueo silencioso. |
| BLE-02 | Permiso denegado | Estado sin conexión y posibilidad de volver a intentar. |
| BLE-03 | Dispositivo correcto | Conexión al servicio/característica esperados. |
| BLE-04 | Mensaje válido | Actualiza lectura y hora. |
| BLE-05 | Mensaje malformado | Rechazado sin fabricar una lectura. |
| BLE-06 | Desconexión | Se muestra estado desconectado. |
| BLE-07 | Reconexión | Notificaciones no duplicadas. |
| BLE-08 | Red caída al persistir | La UI no asegura que se guardó el dato. |
| BLE-09 | Historial | La lectura persistida aparece una sola vez. |

## 5. Historial

- Verificar lectura en fecha local y alrededor de medianoche.
- Verificar semana que cruza un mes/año.
- Verificar mes con 28, 29, 30 y 31 días.
- Verificar día sin lecturas.
- Verificar que un hueco no se represente como cero.
- Verificar que las unidades sean LPM.
- Verificar que agregaciones coincidan con un conjunto de datos manualmente calculado.

## 6. SOS y correo

| ID | Caso | Resultado esperado |
|---|---|---|
| SOS-01 | Solicitud manual válida | Alerta registrada y respuesta visible. |
| SOS-02 | Ubicación denegada | SOS sigue su flujo sin ubicación. |
| SOS-03 | Sin contactos con correo | Se explica que no hay destinatarios. |
| MAIL-01 | Secretos ausentes | No afirmar que el correo se envió. |
| MAIL-02 | Proveedor acepta todos | Mostrar cantidad confirmada por proveedor. |
| MAIL-03 | Envío parcial | Mostrar enviados y fallidos. |
| MAIL-04 | Todos los intentos fallan | Distinguir alerta registrada de correo fallido. |
| MAIL-05 | Correo llega | Verificar bandeja y eventos del proveedor; no solo el toast. |
| MAIL-06 | Contacto de otro usuario | La función no revela ni usa ese contacto. |
| SOS-04 | Doble activación | Documentar si genera dos alertas; evitar duplicación accidental cuando corresponda. |

## 7. Pruebas de firmware

Registrar la placa y revisión, versión de firmware, biblioteca, sensor, condiciones de prueba y resultado. Probar inicialización, sensor ausente, señal estable, retirada del dedo, reconexión BLE y reinicio. Las pruebas comparativas con otro dispositivo no sustituyen un estudio de precisión clínica.

## 8. Criterios de aceptación de una versión

Una versión puede considerarse lista para una demostración de software si:
- [ ] Los módulos editados pasan verificación de sintaxis.
- [ ] No hay errores de consola que bloqueen el flujo principal.
- [ ] CRUD relevante persiste en Supabase.
- [ ] La cuenta no puede leer datos de otra.
- [ ] El estado del correo corresponde a la respuesta real.
- [ ] Los botones tienen tamaño y foco consistentes.
- [ ] Las vistas principales funcionan en móvil y escritorio.
- [ ] Se documentaron limitaciones y fallos conocidos.

La aceptación para una demostración escolar no equivale a aprobación médica, certificación de seguridad o aptitud para uso clínico.
