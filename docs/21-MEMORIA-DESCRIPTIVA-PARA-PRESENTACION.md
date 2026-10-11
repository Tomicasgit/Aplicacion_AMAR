# 21 — Memoria descriptiva para presentación académica

## 1. Resumen ejecutivo

A.M.A.R. (Asistente de Monitoreo Autónomo de Ritmo) es un prototipo académico que integra un dispositivo electrónico y una aplicación web para explorar una forma accesible de visualizar lecturas relacionadas con el pulso y conservar un historial. También incorpora un flujo de solicitud SOS que registra una alerta y puede notificar contactos por correo cuando el backend está configurado.

## 2. Problema y oportunidad

Una lectura aislada ofrece poca información sobre su evolución. Un sistema conectado puede organizar registros en el tiempo y hacer más simple revisar datos durante una conversación con un profesional. A.M.A.R. aborda esta oportunidad como un prototipo de integración tecnológica; no presume que la lectura sea diagnóstica ni que un aviso sustituya la atención profesional.

## 3. Propuesta de solución

El dispositivo usa un sensor óptico MAX30102 y una placa ESP32. El firmware procesa la señal y publica lecturas a través de Bluetooth Low Energy. La aplicación web presenta la información y la guarda en una base de datos gestionada por Supabase. El flujo SOS permite registrar una solicitud y, si están disponibles la configuración y los destinatarios, intentar notificar por correo.

## 4. Objetivo general

Desarrollar un prototipo funcional que integre sensor, microcontrolador, comunicación BLE, interfaz web, almacenamiento de lecturas y un flujo de alerta documentado.

## 5. Objetivos específicos

- Integrar sensor óptico, microcontrolador y pantalla.
- Estimar LPM mediante el firmware.
- Transmitir estados/lecturas a la web.
- Presentar historial consultable.
- Gestionar usuario, dispositivos y contactos.
- Implementar un flujo de solicitud SOS con estado de comunicación transparente.
- Documentar arquitectura, seguridad, limitaciones y pruebas.

## 6. Metodología de trabajo

El desarrollo se realizó de forma incremental: primero se verificaron componentes y comunicación, después se construyeron vistas y operaciones de datos, y posteriormente se integraron historial, contactos y SOS. Los cambios se revisan en GitHub y se prueban por partes. Cada integración debe validarse en su entorno real antes de afirmarla como completa.

## 7. Tecnologías principales

| Tecnología | Justificación en el prototipo |
|---|---|
| ESP32 | Control del sensor, pantalla y BLE. |
| MAX30102 | Adquisición óptica relacionada con el pulso. |
| ST7789 | Interfaz local compacta. |
| HTML/CSS/JavaScript | Interfaz web sin necesidad de un framework de UI. |
| Web Bluetooth | Recepción de datos desde el dispositivo en navegadores compatibles. |
| Supabase Auth/PostgreSQL | Identidad y almacenamiento. |
| Edge Functions | Lógica de servidor para SOS/correo. |
| Resend | Proveedor de correo de notificación. |

## 8. Alcance y límites

El prototipo demuestra integración de componentes y desarrollo de software. No se debe afirmar que:
- Está certificado como dispositivo médico.
- Tiene precisión clínica probada.
- Detecta todas las arritmias o eventos cardíacos.
- Garantiza el envío, lectura o respuesta de un correo.
- Realiza llamadas automáticas a emergencias.
- Sustituye una consulta, ECG o tratamiento.

## 9. Evaluación del prototipo

La evaluación técnica debe considerar conexión del sensor, validez/antigüedad de lectura, conexión BLE, persistencia, historial, aislamiento de datos por usuario y resultados del SOS. La evaluación de usabilidad debe observar si una persona entiende los estados y encuentra acciones importantes sin asistencia. Los resultados deben describirse con fecha, método y evidencia, no solo con una impresión general.

## 10. Trabajo futuro

- Exportar el esquema real de base de datos y mantener migraciones versionadas.
- Consolidar reglas CSS antiguas después de pruebas de regresión.
- Automatizar pruebas de lógica y validación del formato BLE.
- Mejorar manejo de lecturas obsoletas y errores de persistencia.
- Añadir idempotencia para solicitudes SOS repetidas.
- Integrar monitoreo de entrega de correo y eventos del proveedor.
- Definir política de retención y eliminación de datos.
- Ejecutar validación formal del sensor/algoritmo antes de cualquier afirmación clínica.
- Evaluar accesibilidad con usuarios.
- Documentar cada sesión de desarrollo y prueba con una bitácora real.

## 11. Cronología y tiempo

El historial del proyecto y las conversaciones documentan avances en firmware, interfaz, Bluetooth, historial y alertas durante septiembre/octubre de 2026. No se dispone de una bitácora completa que permita afirmar un número exacto de horas. Para el informe final, completar una tabla con fechas reales, horas de inicio/fin, tareas y evidencias.

## 12. Conclusión

A.M.A.R. constituye un ejercicio de integración entre hardware, software web, comunicación inalámbrica, almacenamiento y notificaciones. Su valor académico está en la arquitectura, el proceso de desarrollo, la validación incremental y el análisis honesto de límites y riesgos. Cualquier evolución a un uso sanitario real requeriría diseño, ensayos, evaluación de riesgos y certificaciones apropiadas.
