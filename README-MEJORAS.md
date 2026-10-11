# A.M.A.R. — Catálogo integral de mejoras y hoja de ruta de implementación

> **Proyecto:** A.M.A.R. — Asistente de Monitoreo Autónomo de Ritmo  
> **Repositorio:** [Tomicasgit/Aplicacion_AMAR](https://github.com/Tomicasgit/Aplicacion_AMAR)  
> **Propósito de este documento:** reunir mejoras posibles —de producto, diseño, código, hardware, datos, seguridad, pruebas, despliegue, investigación y organización— y explicar cómo llevarlas a cabo de forma verificable.  
> **Alcance:** catálogo abierto, sin limitar las ideas por el estado actual del prototipo. No significa que todas deban implementarse ni que el código actual ya las soporte.

---

## 1. Cómo usar esta hoja de ruta

Este documento funciona como un **mapa de posibilidades**, no como una promesa de que todas las funciones estén implementadas. Cada propuesta debe pasar por cuatro preguntas:

1. **¿Qué problema resuelve?** Describir una necesidad real, no solo una función atractiva.
2. **¿Cómo se comprobará?** Definir un criterio de aceptación observable.
3. **¿Qué riesgo introduce?** Especialmente para datos de salud, ubicación, cuentas y falsas expectativas de emergencia.
4. **¿Qué dependencias tiene?** Código, hardware, infraestructura, permisos, presupuesto, pruebas o asesoramiento profesional.

### Estado de las propuestas

- **Existente:** la función ya forma parte del proyecto, aunque debe probarse en el entorno real.
- **Mejora incremental:** puede añadirse sobre la arquitectura actual.
- **Cambio arquitectónico:** requiere reorganizar componentes o contratos.
- **Investigación:** no debería prometerse antes de estudiar viabilidad, calidad y riesgos.
- **Fuera del alcance de un prototipo académico:** posible en un producto futuro, pero requiere validación, recursos o cumplimiento adicional.

No interpretar una descripción en este archivo como evidencia de que la función ya funciona. Para cada cambio, registrar commit, pruebas, capturas o logs y entorno utilizado.

## 2. Visión a largo plazo

A.M.A.R. puede evolucionar desde un prototipo académico de lectura de LPM y registro de datos hacia una plataforma más robusta que integre:

- Dispositivo portátil con sensores y firmware mantenible.
- Aplicación web accesible y, si se justifica, aplicación móvil.
- Gestión segura de cuentas, dispositivos, contactos y consentimientos.
- Historial trazable, visualizaciones útiles y exportación de datos.
- Alertas con estados claros y canales redundantes, sin prometer entrega garantizada.
- Observabilidad técnica, recuperación ante fallos y despliegues reproducibles.
- Pruebas automatizadas y manuales, documentación y proceso de publicación.
- En una línea de investigación separada, evaluación de calidad de señal y precisión frente a referencias apropiadas.

**Límite no negociable:** el prototipo no debe presentarse como diagnóstico, ECG, sustituto de atención profesional ni sistema de emergencia garantizado. Cualquier uso clínico o comercial requeriría evaluación especializada, validación formal y análisis de las obligaciones aplicables.

## 3. Prioridades recomendadas

| Prioridad | Enfoque | Objetivo de salida |
|---|---|---|
| P0 — Integridad | Evitar pérdida de datos, errores silenciosos, accesos cruzados y falsas confirmaciones | Flujos críticos comprobados y fallos visibles |
| P1 — Calidad base | Modularidad, validaciones, manejo de errores y pruebas repetibles | Código mantenible y regresiones detectables |
| P2 — Experiencia | Accesibilidad, responsive, estados de carga y claridad del SOS | Uso comprensible en móvil y escritorio |
| P3 — Datos y operación | Historial consistente, exportación, monitoreo, backups y despliegue | Servicio recuperable y auditable |
| P4 — Dispositivo | Calidad de señal, robustez eléctrica, energía y firmware | Prototipo físico más estable, con límites medidos |
| P5 — Investigación y escala | Validación técnica, analítica avanzada, aplicaciones adicionales | Decisiones basadas en evidencia y capacidad operativa |

No avanzar a P4/P5 a costa de dejar vulnerabilidades P0 sin resolver. Para una demo académica puede priorizarse una versión acotada; para uso real los requisitos de seguridad, privacidad y fiabilidad aumentan considerablemente.

---

# PARTE I — APLICACIÓN WEB

## 4. Arquitectura del frontend

### 4.1. Separar responsabilidades

**Problema posible:** cuando la interfaz, el acceso a datos y la lógica de negocio se mezclan, cada modificación afecta múltiples partes y cuesta probarla.

**Mejora propuesta:**
- Mantener HTML para estructura, CSS para presentación y módulos JavaScript para comportamiento.
- Crear módulos claros para autenticación, sesión, dispositivos, BLE, lecturas, historial, contactos, alertas y perfil.
- Separar acceso a Supabase de los componentes visuales mediante servicios/repositorios.
- Evitar duplicar validaciones, formateo de fechas y tratamiento de errores.
- Centralizar constantes, configuración y tipos de mensajes.
- Documentar dependencias de carga y evitar variables globales innecesarias.

**Cómo implementarlo:**
1. Inventariar las funciones de cada archivo y sus dependencias.
2. Elegir un módulo pequeño (por ejemplo, contactos) como piloto.
3. Extraer llamadas a datos a una capa de servicio sin cambiar la interfaz.
4. Añadir pruebas de las funciones extraídas.
5. Migrar una sección por commit, verificando regresiones.
6. Repetir con historial, perfil, dispositivos y alertas.

No hace falta migrar automáticamente a React, Vue u otro framework. Evaluar una migración solo si la complejidad de estado, componentes o equipo lo justifica; un framework no corrige por sí solo una arquitectura deficiente.

### 4.2. Estado de la interfaz

Añadir estados explícitos para:
- Cargando.
- Sin datos.
- Datos disponibles.
- Desconectado.
- Permiso denegado.
- Error recuperable.
- Sesión vencida.
- Operación guardada.
- Resultado parcial.
- Reintento en curso.

Cada botón debe deshabilitarse durante operaciones que no deban duplicarse. Evitar mensajes como “enviado” cuando solo se inició una petición. El mensaje debe corresponder al nivel real de confirmación recibido.

### 4.3. Manejo de errores

Implementar una convención uniforme:
- Error legible para el usuario.
- Detalle técnico seguro para consola/logs.
- Código o categoría del error.
- Acción sugerida cuando exista.
- Identificador de correlación para investigar incidentes, sin incluir datos de salud o secretos.

No mostrar tokens, claves, respuestas completas sensibles del backend ni trazas internas en pantalla.

### 4.4. Validación y formularios

- Validar campos obligatorios y formatos antes de enviar.
- Validar nuevamente en el servidor; la validación del cliente puede eludirse.
- Recortar espacios y normalizar formatos permitidos.
- Explicar el error junto al campo y mantener el contenido ingresado.
- Confirmar acciones destructivas.
- Prevenir envíos duplicados.
- Establecer límites razonables de longitud.
- Evitar depender exclusivamente de color para indicar errores.

### 4.5. Rendimiento

- Cargar módulos solo cuando aporten valor, si la arquitectura lo permite.
- Evitar consultas repetidas al cambiar de pestaña.
- Paginar historial en vez de cargar todas las lecturas.
- Reducir renders y cálculos innecesarios.
- Optimizar imágenes, fuentes y animaciones.
- Medir con herramientas de rendimiento antes de optimizar a ciegas.
- Definir un presupuesto de rendimiento para móvil de gama media y conexiones lentas.

## 5. Experiencia de usuario (UX) y accesibilidad

### 5.1. Navegación y diseño coherente

- Mantener una jerarquía visual consistente.
- Definir tokens CSS para color, espacio, tipografía, bordes, sombras y estados.
- Reutilizar componentes de botón, tarjeta, diálogo, campo y aviso.
- Evitar estilos contradictorios o selectores excesivamente generales.
- Verificar que botones equivalentes tengan tamaño, alineación y área de toque consistentes.
- Usar confirmaciones breves y específicas.
- Añadir breadcrumbs o títulos de sección cuando ayuden a orientarse.

### 5.2. Accesibilidad

- Usar HTML semántico y etiquetas asociadas a los campos.
- Navegación completa mediante teclado.
- Foco visible y orden lógico.
- Contraste suficiente en texto, botones y gráficos.
- Compatibilidad con lectores de pantalla y atributos ARIA solo cuando sean necesarios.
- No depender solo de rojo/verde para estados.
- Respetar `prefers-reduced-motion`.
- Asegurar que los diálogos atrapen y devuelvan el foco correctamente.
- Permitir zoom del navegador y evitar texto cortado.
- Revisar objetivos táctiles y formularios en móvil.
- Probar al menos una combinación real de navegador y lector de pantalla.

**Criterio de aceptación:** completar los flujos principales con teclado y comprobar que mensajes, campos, botones y estados tengan nombres accesibles. Usar herramientas automáticas como ayuda, no como sustituto de la evaluación manual.

### 5.3. Tema visual

- Tema claro/oscuro con preferencia persistente.
- Contraste revisado por tema.
- Paleta semántica: éxito, advertencia, error, información y desconexión.
- No usar una estética “médica” para sugerir una certificación inexistente.
- Diferenciar datos reales de ejemplos, demostraciones y valores simulados.
- Mantener la identidad de A.M.A.R. consistente entre web, pantalla y presentación.

### 5.4. Idiomas y formatos

- Preparar textos para internacionalización si el público crece.
- Usar formatos locales de fecha/hora y números.
- Guardar fechas en un formato consistente (preferentemente UTC en almacenamiento cuando aplique) y mostrar zona horaria explícita.
- No confundir la hora del dispositivo, la del navegador y la del servidor.
- Evitar cadenas de interfaz incrustadas en lógica.

## 6. Panel de lectura y visualizaciones

### 6.1. Mostrar contexto junto a LPM

Además del valor, considerar:
- Momento de la última lectura.
- Estado de conexión del sensor y del dispositivo.
- Antigüedad del dato.
- Calidad de señal, si se define y valida un indicador real.
- Indicación clara cuando la lectura no es válida o está obsoleta.
- Fuente del dato: dispositivo conectado, historial o demostración.

No representar una cifra antigua como si fuera una lectura actual. Si no llega información, mostrar “sin lectura reciente” en lugar de mantener indefinidamente un número que parezca actual.

### 6.2. Gráficos de historial

- Filtros por período.
- Selección de día, semana y rango personalizado.
- Ejes con unidades, fechas y leyenda.
- Manejo de huecos de datos sin inventar interpolaciones.
- Identificar muestras ausentes, descartadas o de calidad insuficiente.
- Resúmenes descriptivos como mínimo, máximo y promedio solo cuando tengan datos suficientes y se expliquen sus límites.
- Acceso a tabla/listado para personas que no puedan interpretar el gráfico.
- Exportación de la vista con zona horaria y fecha de generación.

No inferir arritmias, diagnósticos ni “riesgo cardíaco” a partir de una serie de LPM sin evidencia clínica y validación apropiadas.

### 6.3. Comparaciones y estadísticas

Posibles métricas técnicas:
- Porcentaje de tiempo conectado.
- Porcentaje de muestras válidas.
- Número de desconexiones.
- Latencia de recepción y guardado.
- Porcentaje de lecturas descartadas.
- Tasa de fallos de sincronización.

Separar claramente estas métricas de salud de una evaluación clínica. Documentar la fórmula, la ventana de tiempo, los datos excluidos y los casos donde la métrica no se puede calcular.

## 7. Historial, sincronización y exportación

- Implementar paginación por fecha e identificador estable.
- Definir una política de retención.
- Evitar duplicados mediante identificadores de muestra o claves de idempotencia cuando corresponda.
- Distinguir tiempo de captura, tiempo de recepción y tiempo de persistencia.
- Definir qué ocurre sin internet: no guardar indefinidamente en almacenamiento local sensible sin consentimiento y controles.
- Si se agrega una cola offline, cifrar los datos en reposo cuando la plataforma lo permita, limitar su duración y sincronizar con idempotencia.
- Resolver conflictos de reloj y muestras repetidas.
- Informar al usuario si una lectura está solo en memoria o ya quedó guardada en servidor.
- Exportar CSV/JSON con encabezados, unidades, zona horaria, versión de formato y advertencia de que el archivo puede contener datos sensibles.
- Ofrecer eliminación de datos y explicar qué se elimina en servidor, caché y exportaciones descargadas.

**Implementación por etapas:** primero definir el esquema y reglas de duplicación; luego paginar; después añadir exportación; finalmente evaluar modo offline con un modelo de amenazas específico.

## 8. Contactos y comunicaciones

- Validar teléfono y correo sin asumir que un formato correcto significa que el contacto existe.
- Permitir que el usuario pruebe y confirme los datos de contacto.
- Indicar qué canales están configurados.
- Diferenciar “solicitud creada”, “proveedor aceptó el envío”, “entrega reportada” y “contacto respondió”; no son estados equivalentes.
- Registrar eventos técnicos mínimos sin guardar cuerpos de mensajes o datos de salud innecesarios.
- Añadir limitación de frecuencia para evitar abuso o envíos accidentales repetidos.
- Proteger el endpoint frente a spam y automatización maliciosa.
- Permitir revocar o actualizar contactos.
- Pedir confirmación antes de eliminar un contacto.
- No exponer el correo completo o teléfono en vistas públicas ni logs.

Los botones de llamada o mensajería pueden abrir aplicaciones del usuario, pero eso no demuestra que se haya realizado una llamada o enviado un mensaje. La interfaz debe describir exactamente lo que hace.

---

# PARTE II — BLUETOOTH Y PROTOCOLO DE DATOS

## 9. BLE: conexión robusta

### 9.1. Máquina de estados

Definir estados explícitos, por ejemplo:
`idle → requesting-device → connecting → discovering-service → subscribing → connected → reconnecting → disconnected`

Cada transición debe:
- Tener un timeout.
- Liberar listeners y recursos cuando corresponda.
- Mostrar el estado actual.
- Manejar cancelación del usuario.
- Evitar conexiones duplicadas.
- Permitir reconexión manual segura.

No asumir que la conexión BLE continúa activa porque la UI conserva un indicador verde.

### 9.2. Contrato de mensajes

Documentar en un único lugar:
- UUID de servicio y característica.
- Versión del protocolo.
- Codificación y delimitadores.
- Campos obligatorios y opcionales.
- Unidades.
- Intervalo de publicación esperado.
- Marcador de dato inválido.
- Marca temporal y origen.
- Compatibilidad entre versiones de firmware y web.

Considerar mensajes estructurados, por ejemplo JSON compacto o un formato binario versionado. Elegir después de medir el costo de transmisión, complejidad y compatibilidad; no cambiar formato sin actualizar ambos extremos y pruebas.

### 9.3. Calidad e integridad

- Validar que LPM sea numérico, finito y dentro de límites técnicos configurados.
- Rechazar paquetes truncados o mal formados.
- Marcar secuencias repetidas.
- Detectar mensajes demasiado antiguos.
- No convertir errores de parsing en cero LPM.
- Registrar desconexiones y causas sin recopilar información innecesaria.
- Definir si la hora viene del dispositivo o se asigna al recibir en la web.

### 9.4. Seguridad BLE

- Revisar el modelo de emparejamiento y el acceso al dispositivo.
- Evaluar si el dispositivo debe anunciar identificadores únicos.
- Evitar datos personales dentro del nombre BLE.
- Considerar autenticación y cifrado BLE según capacidades de hardware y librerías.
- Analizar la posibilidad de que otro dispositivo se conecte o suplante el periférico.
- No considerar BLE seguro únicamente porque el UUID no es conocido.
- Probar conexión desde un dispositivo no autorizado en un entorno controlado.

### 9.5. Compatibilidad de navegadores

Documentar las limitaciones de Web Bluetooth por navegador, sistema operativo, HTTPS y permisos. Detectar la disponibilidad de la API antes de mostrar el botón de conexión y ofrecer instrucciones de compatibilidad en vez de fallar silenciosamente. Si se necesita soporte amplio, evaluar una aplicación móvil o puente nativo, con el costo de mantenimiento correspondiente.

---

# PARTE III — HARDWARE Y FIRMWARE

## 10. Sensor MAX30102 y calidad de señal

### 10.1. Mejoras posibles

- Separar adquisición de muestras, filtrado, detección de latidos y presentación.
- Establecer criterios explícitos de señal válida.
- Detectar ausencia de dedo/contacto, saturación, movimiento y lecturas inestables cuando el método lo permita.
- Filtrar valores imposibles sin ocultar fallos reales.
- Mostrar “señal insuficiente” en lugar de inventar una cifra.
- Medir tasa de muestras, pérdidas, latencia y estabilidad.
- Evaluar varios perfiles de piel, temperatura, presión de contacto y movimiento en un protocolo de investigación ético.
- Registrar versión de firmware y configuración junto con los resultados de pruebas.

### 10.2. Validación técnica

Diseñar una prueba comparativa con una referencia apropiada y condiciones documentadas. Definir previamente:
- Participantes o conjunto de prueba y criterios de inclusión.
- Consentimiento y protección de datos si hay personas.
- Dispositivo de referencia y sus limitaciones.
- Condiciones de reposo y movimiento.
- Duración de cada prueba.
- Criterios para excluir señales deficientes.
- Métricas: error absoluto, error relativo cuando sea pertinente, sesgo, dispersión y porcentaje de muestras válidas.
- Limitaciones, fallos y casos donde el sensor no produce datos fiables.

No publicar afirmaciones de precisión clínica basadas en pocas pruebas informales. No recolectar datos de salud de otras personas sin consentimiento y supervisión apropiada.

### 10.3. Algoritmo de LPM

- Documentar cómo se detecta un pico y cómo se calcula el intervalo entre latidos.
- Separar parámetros configurables de lógica.
- Revisar filtros, histéresis, ventanas y criterios de descarte.
- Evitar actualizar LPM por un único pico espurio.
- Definir expiración de lectura y recuperación.
- Crear registros de señales sintéticas y pruebas unitarias para casos normales, ruido, saltos, pérdida de contacto y valores límite.
- Comparar algoritmos alternativos en un banco de pruebas reproducible antes de incorporarlos al firmware.

No presentar el algoritmo como detector de arritmias salvo que se diseñe y valide formalmente para ese propósito.

## 11. Firmware: fiabilidad y mantenibilidad

- Centralizar pines, UUID, umbrales, tiempos e identificadores de versión.
- Documentar la razón de cada parámetro.
- Evitar bloqueos largos dentro del ciclo principal.
- Separar sensor, BLE, pantalla y lógica de estado en módulos cuando la complejidad lo justifique.
- Manejar fallos I2C y reconexión sin reiniciar en bucle.
- Añadir watchdog si está justificado y probar su comportamiento.
- Registrar errores mediante códigos compactos.
- Revisar fugas de memoria y recursos de BLE.
- Añadir versión de protocolo y firmware en el mensaje inicial.
- Definir un proceso de actualización controlado; OTA solo tras diseñar autenticidad, recuperación y protección contra firmware corrupto.
- Evitar almacenar credenciales o identificadores personales en el firmware.
- Probar ciclos largos, desconexión/reconexión, sensor ausente, batería baja y reinicios.

### 11.1. Pruebas de banco reproducibles

Mantener una ficha por prueba:
- Fecha y persona responsable.
- Revisión/commit del firmware.
- Placa, sensor y cableado.
- Parámetros usados.
- Condición de prueba.
- Resultado esperado y observado.
- Errores, capturas o logs.
- Decisión: aprobado, rechazado o pendiente.

## 12. Energía, ergonomía y diseño físico

Mejoras potenciales:
- Medición de consumo por estado.
- Modo de bajo consumo y estrategia de despertar.
- Estimación de autonomía basada en mediciones, no en cálculos ideales.
- Indicador de batería solo si existe una forma real de medirla.
- Protección mecánica del sensor y alivio de tensión del cableado.
- Reducción de bordes y mejora del ajuste.
- Evaluación de temperatura, ventilación y comodidad.
- Protección contra sudor/humedad acorde al diseño, sin anunciar una certificación inexistente.
- Diseño de carcasa con acceso a mantenimiento.
- Revisión de carga y protección de batería por una persona competente; nunca improvisar circuitos de carga.
- Documentación de materiales, conexiones, consumo y riesgos eléctricos.

Una carcasa impresa en 3D no implica resistencia al agua, biocompatibilidad ni aptitud para uso prolongado en piel.

## 13. Pantalla del dispositivo

- Mostrar estado del sensor, conexión y antigüedad de la lectura.
- Diferenciar dato válido, obsoleto y ausente.
- Evitar parpadeo innecesario.
- Definir tamaños mínimos de texto y contraste.
- Mostrar versión de firmware en una pantalla de información.
- Diseñar estados de arranque, fallo, reconexión y batería baja si el hardware puede medirla.
- Evitar que animaciones oculten una alerta o consuman energía innecesaria.
- Probar con luz ambiente distinta y distintos ángulos de visión.

---

# PARTE IV — BACKEND, BASE DE DATOS Y SEGURIDAD

## 14. Modelo de datos

### 14.1. Normalización y consistencia

Revisar el esquema real de Supabase antes de modificarlo. Posibles mejoras:
- Relaciones explícitas entre usuario, dispositivo, lectura, contacto y alerta.
- Claves primarias estables.
- Claves foráneas y reglas de eliminación.
- Restricciones `NOT NULL`, `CHECK` y unicidad donde sean correctas.
- Índices en columnas de usuario, fecha y relaciones consultadas.
- Índices compuestos basados en consultas reales.
- Marcas temporales de creación/actualización.
- Campo de versión o migraciones reproducibles.
- Política de retención y eliminación.
- Evitar almacenar datos derivados que puedan calcularse de forma fiable, salvo que exista una razón de rendimiento/auditoría.

No crear columnas o índices por intuición sin contrastar el esquema y los patrones de consulta actuales.

### 14.2. Migraciones

- Versionar cada cambio de esquema.
- Probar migraciones en un proyecto de desarrollo.
- Incluir estrategia de rollback cuando sea viable.
- Hacer respaldo antes de cambios de riesgo.
- Mantener datos de prueba ficticios.
- Nunca probar migraciones destructivas directamente en producción.
- Documentar cambios incompatibles y orden de despliegue frontend/backend.

### 14.3. Consultas y rendimiento

- Seleccionar solo columnas necesarias.
- Paginar listados.
- Evitar consultas por cada fila.
- Medir latencia y planes de consulta antes de añadir índices.
- Aplicar límites en endpoints.
- Añadir índices para filtros y ordenamientos reales.
- Definir límites de almacenamiento y costos.

## 15. Autenticación, autorización y RLS

La autenticación responde quién es el usuario; la autorización define qué puede hacer. Una sesión válida no debe dar acceso a datos ajenos.

Lista de mejoras:
- Auditar cada tabla y cada operación SELECT/INSERT/UPDATE/DELETE.
- Verificar RLS con al menos dos usuarios de prueba.
- Comprobar propiedad en el servidor, no confiar en un `user_id` enviado por el cliente.
- Restringir roles administrativos y claves de servicio.
- Revisar expiración, renovación y cierre de sesión.
- Evitar exponer mensajes que permitan enumerar cuentas.
- Proteger recuperación de contraseña y verificación de correo.
- Añadir limitación de intentos y detección de abuso donde la plataforma lo permita.
- Revisar CORS, CSP y cabeceras HTTP en el hosting.
- No guardar tokens sensibles en ubicaciones accesibles a scripts no confiables.
- Rotar secretos ante exposición y revisar el historial de Git.
- Revisar dependencias y vulnerabilidades periódicamente.

### Prueba mínima de aislamiento

1. Crear usuario A y usuario B con datos ficticios.
2. Crear una lectura, contacto y alerta con A.
3. Intentar leerlos con B.
4. Intentar modificar o borrar los registros de A con B.
5. Repetir desde consultas directas autorizadas de prueba, no solo desde la interfaz.
6. Confirmar que el servidor deniega cada operación cruzada.
7. Guardar los resultados sin incluir datos personales reales.

Si falla una sola prueba de aislamiento, no considerar seguro el flujo.

## 16. Edge Functions y correo

### 16.1. Endpoints robustos

- Validar método, autenticación, payload, tipos, longitud y campos permitidos.
- No confiar en correos o destinatarios arbitrarios suministrados por el navegador.
- Obtener los contactos autorizados desde la base de datos y comprobar propiedad.
- Aplicar rate limiting y protección frente a repetición.
- Usar identificadores de solicitud e idempotencia para evitar duplicados.
- Responder con estados explícitos y estructura de error estable.
- No devolver claves ni trazas internas.
- Registrar solo metadatos operativos mínimos.

### 16.2. Estados del correo

Distinguir:
1. Solicitud recibida por A.M.A.R.
2. Alerta guardada.
3. Proveedor de correo aceptó la petición.
4. Proveedor reportó entrega, rebote o rechazo (si la integración y webhooks lo permiten).
5. Contacto respondió por un canal independiente.

No afirmar “contacto avisado” cuando solo se obtuvo el estado 3. El correo puede caer en spam, rebotar, retrasarse o no leerse.

### 16.3. Webhooks y reintentos

Si se incorporan webhooks del proveedor:
- Verificar autenticidad de cada evento según la documentación vigente.
- Evitar procesar el mismo evento más de una vez.
- Guardar el identificador del evento y su estado.
- Reintentar solo errores recuperables y con backoff.
- Establecer máximo de intentos y una cola de fallos.
- Alertar al administrador de errores persistentes sin revelar datos sensibles.
- Probar duplicados, eventos fuera de orden y fallos de red.

## 17. Privacidad y gobernanza de datos

- Recopilar únicamente lo necesario para cada función.
- Explicar qué se recopila, por qué, durante cuánto tiempo y quién puede verlo.
- Obtener consentimiento claro para datos sensibles y ubicación cuando corresponda.
- Permitir revocar permisos.
- Definir procesos de acceso, exportación, corrección y eliminación.
- Establecer un calendario de retención.
- Proteger copias de seguridad y exportaciones.
- No enviar lecturas ni ubicación a analítica publicitaria.
- Usar datos sintéticos para capturas, demos, pruebas y documentación.
- Redactar logs para evitar correos, teléfonos, tokens y coordenadas exactas.
- Definir un procedimiento ante filtración o acceso indebido.
- Revisar la legislación aplicable antes de desplegar o comercializar; este documento no sustituye asesoramiento legal.

## 18. Protección frente a amenazas

Realizar un modelo de amenazas que incluya:
- Usuario no autenticado.
- Usuario autenticado malicioso.
- Cuenta comprometida.
- Contacto de emergencia falso.
- Peticiones automatizadas al SOS.
- Dispositivo BLE suplantado.
- Lecturas manipuladas.
- Secretos filtrados.
- Error de configuración de RLS.
- Caída de base de datos, correo, hosting o conectividad.
- Robo o pérdida del teléfono.
- Abuso de exportaciones o de registros de soporte.

Para cada amenaza, registrar probabilidad, impacto, control preventivo, detección, recuperación y riesgo residual. Repetir la revisión tras cambios grandes.

---

# PARTE V — ALERTAS Y COMPORTAMIENTO SOS

## 19. SOS fiable y honesto

### 19.1. Flujo explícito

Diseñar el flujo con estados distinguibles:
- Usuario abrió SOS.
- Usuario confirmó la acción.
- Solicitud enviada al backend.
- Backend autenticó y validó.
- Alerta registrada.
- Canal de notificación solicitado.
- Resultado del proveedor disponible.
- Fallo o resultado parcial.
- Usuario canceló antes del envío, cuando sea técnicamente posible.

No mostrar un único estado genérico que oculte resultados parciales.

### 19.2. Evitar falsas alarmas y abuso

- Confirmación accesible, sin hacer el flujo innecesariamente lento.
- Bloqueo de doble clic y solicitudes repetidas.
- Rate limiting por usuario y dispositivo.
- Identificador único por alerta.
- Registro mínimo de auditoría.
- Opción de cancelar solo si la solicitud aún puede cancelarse realmente.
- Explicar que la app no llama automáticamente a servicios de emergencia ni garantiza que alguien responda.
- No agregar llamada automática, rastreo permanente ni envío continuo de ubicación sin una revisión explícita de permisos, privacidad y riesgos.

### 19.3. Ubicación

- Solicitarla en el momento necesario.
- Explicar qué dato se enviará y a quién.
- Manejar permiso denegado, timeout, precisión baja y ubicación no disponible.
- No bloquear toda la alerta porque falle la ubicación.
- Evitar guardar coordenadas indefinidamente.
- Mostrar cuándo se obtuvo la ubicación y su posible antigüedad.
- Probar permisos en distintos navegadores y dispositivos.

### 19.4. Canales futuros

Posibles canales para investigar:
- Correo electrónico.
- Notificación push.
- SMS mediante proveedor externo.
- Mensajería por API oficial, si cumple términos y consentimiento.
- Notificación dentro de la aplicación.
- Canal local en el dispositivo.

Antes de sumar uno, analizar costos, cobertura, permisos, entrega, autenticación, privacidad, límites del proveedor y soporte. Un canal adicional no garantiza que la persona destinataria lo reciba o actúe.

---

# PARTE VI — PRUEBAS Y CALIDAD

## 20. Pirámide de pruebas

### 20.1. Pruebas unitarias

Probar funciones puras:
- Validación y normalización de formularios.
- Conversión de mensajes BLE.
- Manejo de lecturas obsoletas.
- Cálculo de resúmenes.
- Formateo de fechas y unidades.
- Transiciones de estados SOS.
- Validación de payloads.
- Idempotencia y clasificación de errores.

### 20.2. Pruebas de integración

- Frontend ↔ Supabase.
- Sesión ↔ políticas RLS.
- Edge Function ↔ base de datos.
- Edge Function ↔ proveedor de correo.
- BLE ↔ parser web.
- Firmware ↔ sensor.
- Migraciones ↔ datos de prueba.

### 20.3. Pruebas end-to-end

Automatizar los flujos críticos:
1. Crear cuenta o iniciar sesión.
2. Añadir/editar/eliminar contacto de prueba.
3. Conectar dispositivo compatible o simular mensajes en un entorno de test.
4. Recibir lectura válida, inválida y obsoleta.
5. Guardar y consultar historial.
6. Solicitar SOS con proveedor simulado.
7. Ver resultado de éxito, error y resultado parcial.
8. Cerrar sesión y comprobar protección de rutas/datos.

### 20.4. Pruebas de regresión manual

Mantener un checklist corto para cada versión. No confiar solo en que “la página abre”. Probar las acciones reales que se modificaron y las dependencias cercanas.

### 20.5. Calidad del código

- Linter y formatter.
- Comprobación de sintaxis.
- Pruebas automáticas en cada pull request.
- Revisión de dependencias.
- Detección de secretos.
- Análisis estático de seguridad.
- Cobertura de código como indicador, no como objetivo único.
- Revisión de accesibilidad y rendimiento.

## 21. Integración continua (CI)

Posible flujo con GitHub Actions:
1. Ejecutar en cada push/pull request.
2. Instalar dependencias usando el lockfile.
3. Verificar sintaxis de JavaScript/TypeScript.
4. Ejecutar pruebas unitarias.
5. Revisar formato/lint.
6. Escanear secretos y dependencias.
7. Construir o validar artefactos.
8. Publicar reportes sin datos sensibles.

**Cómo implementarlo:** crear un workflow en `.github/workflows/ci.yml`, comenzar con verificaciones que ya se puedan ejecutar de forma fiable y añadir etapas progresivamente. No agregar un workflow que siempre pase sin probar nada útil. Nunca guardar claves de producción en el archivo YAML.

## 22. Pruebas de fallos y resiliencia

Simular:
- Internet interrumpido durante una lectura.
- Supabase no disponible.
- Correo rechazado o con timeout.
- Permiso BLE denegado.
- Sensor desconectado.
- Mensaje malformado.
- Sesión vencida.
- Datos duplicados.
- Usuario que cierra la pestaña durante una operación.
- Reloj incorrecto.
- Dos solicitudes simultáneas.
- Falta de espacio o límite de cuota.

Para cada caso definir la respuesta esperada, recuperación, mensaje de usuario y evidencia.

---

# PARTE VII — DESPLIEGUE Y OPERACIÓN

## 23. Entornos separados

Mantener, cuando sea viable:
- **Local/desarrollo:** datos sintéticos, experimentación y depuración.
- **Pruebas/staging:** configuración similar a producción, sin datos reales.
- **Producción/demo pública:** acceso restringido a lo necesario, secretos separados y monitoreo.

Separar URL, claves públicas y secretos por entorno. Una clave pública de Supabase no reemplaza RLS; las claves administrativas nunca deben estar en el frontend.

## 24. Despliegue reproducible

- Documentar hosting, dominio, HTTPS, DNS y variables necesarias.
- Automatizar despliegue tras verificaciones.
- Mantener historial de versiones.
- Publicar primero en staging.
- Verificar una lista de humo posterior al despliegue.
- Tener procedimiento de rollback.
- Evitar cambios manuales no documentados en producción.
- Confirmar que las funciones y migraciones desplegadas corresponden al commit esperado.
- Añadir encabezados de seguridad y política de contenido compatibles con la app.
- Definir responsables de operación y canal para reportar problemas.

## 25. Observabilidad

Registrar métricas técnicas:
- Errores de frontend por categoría.
- Fallos de autenticación sin datos sensibles.
- Conexiones BLE exitosas/fallidas.
- Tiempo de respuesta de operaciones.
- Errores de persistencia.
- Resultado de solicitudes de correo.
- Uso de cuotas y límites.
- Estado de las funciones backend.

Definir alertas por umbral y un procedimiento de investigación. No usar analítica para perfilar salud ni recopilar datos personales que no sean necesarios.

## 26. Backups y recuperación

- Determinar qué datos son críticos.
- Conocer el mecanismo de backup del proveedor.
- Definir RPO (cuánta pérdida de datos sería tolerable) y RTO (cuánto tiempo podría tardar la recuperación).
- Probar restauración en un entorno separado.
- Restringir acceso a backups y cifrarlos cuando corresponda.
- Documentar quién puede restaurar y cómo.
- Verificar la integridad después de restaurar.
- No dar por válido un backup solo porque la consola diga que existe.

## 27. Costos y sostenibilidad

Crear una tabla de costos con:
- Hosting.
- Base de datos y almacenamiento.
- Funciones backend.
- Envío de correos.
- Dominio y certificados.
- Servicios de mensajería.
- Dispositivos y repuestos.
- Instrumentos de prueba.
- Mantenimiento y soporte.

Revisar cuotas, límites, facturación por uso y condiciones gratuitas vigentes en la documentación oficial de cada proveedor antes de comprometerse. Definir límites y alertas de consumo. No incluir precios fijos en este README porque cambian con el tiempo.

---

# PARTE VIII — NUEVAS FUNCIONES POSIBLES

## 28. Perfil y configuración avanzada

- Preferencias de idioma y zona horaria.
- Gestión de sesiones activas.
- Historial de dispositivos autorizados.
- Configuración de notificaciones.
- Consentimientos revocables.
- Exportación y eliminación de cuenta.
- Preferencias de accesibilidad.
- Datos de contacto verificados.
- Registro de cambios importantes en configuración.

Toda configuración debe tener una consecuencia clara y ser respetada por frontend y backend.

## 29. Gestión de dispositivos

- Registro de modelo, versión de firmware y protocolo.
- Alias del dispositivo.
- Estado de vinculación.
- Última conexión.
- Historial de fallos técnicos.
- Revocar dispositivo perdido.
- Evitar que un dispositivo desconocido pueda asociarse a la cuenta sin autorización.
- Procedimiento para actualizar firmware.
- Compatibilidad entre versiones y aviso de actualización.
- Modo de diagnóstico que no exponga información personal.

## 30. Modo demostración y simulador

Un simulador permitiría probar la interfaz sin el hardware:
- Mensajes válidos, inválidos, retrasados y repetidos.
- Desconexión y reconexión.
- LPM sintético claramente etiquetado.
- Estados de sensor sin contacto.
- Respuestas simuladas del backend.
- Correo aceptado/rechazado de prueba.
- Datos ficticios reproducibles.

El modo de demostración debe tener una marca visible y no mezclar muestras simuladas con el historial real. Nunca presentar datos sintéticos como mediciones de una persona.

## 31. Notificaciones y seguimiento

- Resumen de estado de conexión.
- Recordatorios configurables de uso o carga, si la batería puede medirse.
- Aviso de sincronización pendiente.
- Notificación de fallo persistente.
- Preferencias por canal.
- Límites de frecuencia y silenciamiento.
- Historial de notificaciones enviadas y su estado técnico.

Evitar notificaciones médicas alarmistas o predicciones no validadas.

## 32. Exportación e interoperabilidad

- CSV para análisis tabular.
- JSON versionado para integración técnica.
- PDF de resumen de historial con período, zona horaria, versión y límites.
- Exportación de configuración no secreta.
- Importación validada de datos de prueba.
- API documentada con ejemplos y límites de tasa.

Los informes deben distinguir claramente lecturas, datos faltantes y estimaciones. No etiquetar una exportación como informe clínico validado.

## 33. Analítica avanzada e inteligencia artificial

Ideas de investigación, no funciones que deban añadirse sin evidencia:
- Detección de anomalías de calidad de señal.
- Clasificación de artefactos por movimiento.
- Predicción de pérdida de conexión.
- Resúmenes descriptivos del historial.
- Detección de patrones para investigación supervisada.
- Personalización de la interfaz y accesibilidad.

**Condiciones previas:**
1. Definir un objetivo medible y limitado.
2. Obtener datos suficientes, representativos y obtenidos con consentimiento.
3. Separar conjuntos de entrenamiento, validación y prueba para evitar filtraciones.
4. Comparar contra una línea base simple.
5. Medir falsos positivos, falsos negativos, calibración y desempeño por subgrupo cuando sea pertinente.
6. Documentar límites, sesgos, deriva y datos fuera de distribución.
7. Mantener supervisión humana.
8. No convertir una salida experimental en diagnóstico o consejo de tratamiento.

No enviar datos de salud a servicios de IA externos sin una evaluación explícita de privacidad, consentimiento, retención y condiciones del proveedor.

## 34. Aplicación móvil o integración nativa

Posible evolución si el navegador no ofrece el soporte BLE o las notificaciones requeridas:
- Aplicación móvil nativa o multiplataforma.
- Servicio de Bluetooth y ciclo de vida en segundo plano, según restricciones del sistema operativo.
- Notificaciones push con consentimiento.
- Almacenamiento local protegido.
- Gestión de permisos de forma transparente.
- Sincronización idempotente.
- Pruebas en varios modelos y versiones de sistema operativo.

Primero definir los requisitos que la web no cubre. Comparar costos de desarrollo, publicación, actualizaciones, soporte y pruebas antes de migrar toda la aplicación.

## 35. Panel de administración y soporte

Solo si aparece una necesidad operativa real:
- Roles administrativos separados.
- Acceso mínimo necesario.
- Búsqueda por identificadores técnicos, no por datos sensibles innecesarios.
- Auditoría de acciones administrativas.
- Gestión de incidentes.
- Herramientas de diagnóstico que no permitan leer datos de salud por defecto.
- Acceso temporal justificado y revocable.

No crear una consola administrativa con acceso amplio por comodidad. Cada permiso debe estar definido y probado.

---

# PARTE IX — INVESTIGACIÓN, ÉTICA Y POSIBLE PRODUCTIZACIÓN

## 36. Validación del prototipo

Para elevar el rigor técnico:
- Escribir un protocolo antes de recolectar datos.
- Definir qué significa una muestra válida.
- Usar una referencia adecuada y documentar su incertidumbre.
- Evaluar reposo, movimiento y diferentes condiciones.
- Informar el tamaño y características de la muestra sin identificar participantes.
- Publicar resultados negativos y limitaciones.
- Repetir pruebas con nuevas unidades del dispositivo.
- Registrar cambios de hardware y firmware entre ensayos.
- Diferenciar la validación de la medición de la validación de toda la aplicación.

La validación de sensor no valida automáticamente alertas, usabilidad, seguridad ni resultados clínicos.

## 37. Aspectos regulatorios y profesionales

Antes de afirmar que el sistema es apto para uso clínico, comercial o para tomar decisiones médicas:
- Consultar especialistas en dispositivos médicos, ingeniería biomédica y regulación aplicable.
- Evaluar clasificación del producto según uso previsto y jurisdicción.
- Definir gestión de riesgos y trazabilidad de requisitos.
- Establecer procesos de calidad, verificación y validación.
- Revisar privacidad y tratamiento de datos sensibles.
- Revisar seguridad eléctrica, materiales y compatibilidad electromagnética cuando corresponda.
- Mantener control de versiones, incidentes y cambios.
- Definir soporte, mantenimiento y gestión de vulnerabilidades.

Este README no determina una clasificación legal ni sustituye asesoramiento profesional.

## 38. Documentación académica y comunicación

- Mantener memoria descriptiva, problema, objetivos, metodología, resultados y conclusiones.
- Diferenciar objetivo inicial, funciones implementadas y trabajo futuro.
- Incluir arquitectura y diagramas actualizados.
- Registrar decisiones y alternativas descartadas.
- Adjuntar resultados de pruebas reproducibles.
- Presentar costos y limitaciones.
- Evitar inventar horas, precisión, usuarios, resultados o funcionalidades.
- Mantener una presentación no técnica separada de la documentación de ingeniería.
- Incluir aviso claro de que se trata de un prototipo.

---

# PARTE X — CÓMO IMPLEMENTAR LAS MEJORAS EN EL REPOSITORIO

## 39. Flujo de trabajo recomendado

### Paso 1: elegir un problema pequeño

Crear una tarea con:
- Problema.
- Resultado deseado.
- Archivos probables.
- Dependencias.
- Riesgo.
- Criterios de aceptación.
- Pruebas necesarias.

### Paso 2: inspeccionar antes de editar

En el entorno de desarrollo:

```bash
git status
git branch --show-current
git log -5 --oneline
```

Inspeccionar los archivos y configuración afectados. No asumir que este README refleja el estado actual de cada servicio.

### Paso 3: implementar en una rama

```bash
git switch -c mejora/nombre-corto
```

Mantener cada cambio acotado. No mezclar un rediseño, migración de base de datos y cambio de alertas en un único commit enorme.

### Paso 4: probar

Ejecutar pruebas automáticas disponibles, comprobaciones de sintaxis y pruebas manuales del flujo afectado. Para cambios de seguridad, probar también accesos no autorizados. Para hardware, registrar configuración y evidencia física.

### Paso 5: revisar el diff

```bash
git diff --check
git diff
```

Comprobar que no se hayan incluido secretos, datos personales reales, archivos temporales o cambios ajenos a la tarea.

### Paso 6: commit y revisión

```bash
git add archivos-modificados
git commit -m "feat: describir la mejora"
git push -u origin mejora/nombre-corto
```

Abrir un pull request, resumir los cambios, enlazar la tarea, enumerar pruebas realizadas y dejar explícito lo que no se pudo verificar. Si el proyecto se trabaja directamente sobre `main`, aplicar igualmente los pasos de revisión y mantener commits pequeños; las ramas son preferibles para cambios de riesgo.

### Paso 7: desplegar y comprobar

- Desplegar primero a staging si existe.
- Confirmar el commit desplegado.
- Ejecutar pruebas de humo.
- Observar logs y métricas.
- Revertir si falla un flujo crítico.
- Actualizar documentación, capturas y checklist.

### Paso 8: cerrar la tarea

Marcar la mejora como terminada solo si:
- Cumple criterios de aceptación.
- Tiene pruebas apropiadas.
- No introduce una vulnerabilidad conocida.
- La documentación se actualizó.
- El resultado se verificó en el entorno indicado.
- Los pendientes están registrados.

## 40. Plantilla para una mejora nueva

Copiar en una issue o tarea:

```markdown
## Problema
¿Qué falla o qué necesidad existe?

## Resultado esperado
¿Qué debe poder hacer el usuario o el sistema?

## Alcance
Qué incluye y qué queda fuera.

## Dependencias y riesgos
Datos, permisos, hardware, proveedor, costo y seguridad.

## Criterios de aceptación
- [ ] ...
- [ ] ...

## Pruebas
- [ ] Unitarias
- [ ] Integración
- [ ] Manuales
- [ ] Seguridad/privacidad, si corresponde
- [ ] Hardware, si corresponde

## Evidencia
Commit, captura sin datos personales, log redactado o resultado de prueba.

## Documentación afectada
Archivos y secciones que deben actualizarse.

## Estado
Propuesta / En progreso / Bloqueada / Verificada / Descartada.
```

## 41. Matriz inicial de backlog

Esta lista es un punto de partida; validar el estado actual antes de abrir tareas duplicadas.

| ID | Mejora | Prioridad inicial | Dependencia principal | Criterio de salida |
|---|---|---:|---|---|
| AMAR-001 | Auditoría de RLS con dos usuarios | P0 | Proyecto Supabase de prueba | No hay acceso cruzado |
| AMAR-002 | Estados de lectura obsoleta y ausente | P0 | Contrato BLE | La UI no presenta dato antiguo como actual |
| AMAR-003 | Estados SOS y resultados parciales | P0 | Edge Functions y correo | Cada resultado se comunica correctamente |
| AMAR-004 | Validación de payloads en backend | P0 | Contratos de API | Payload inválido es rechazado |
| AMAR-005 | Pruebas unitarias de parser BLE | P1 | Módulo de parsing | Casos válidos e inválidos automatizados |
| AMAR-006 | Pruebas de CRUD de contactos | P1 | Capa de datos | Crear, editar y borrar se verifican |
| AMAR-007 | Accesibilidad por teclado | P1 | HTML/CSS | Flujos clave utilizables sin mouse |
| AMAR-008 | Paginación de historial | P1 | Esquema y consultas | Volumen grande no carga todo de una vez |
| AMAR-009 | CI con sintaxis y tests | P1 | GitHub Actions | PR falla ante errores comprobables |
| AMAR-010 | Exportación CSV | P2 | Modelo de lecturas | CSV documentado y sin campos inesperados |
| AMAR-011 | Simulador BLE | P2 | Contrato de mensajes | Demo sin hardware, claramente simulada |
| AMAR-012 | Registro técnico de errores | P2 | Política de logs | Diagnóstico útil sin secretos ni PII |
| AMAR-013 | Backup y restauración ensayada | P2 | Proveedor de datos | Restauración demostrada |
| AMAR-014 | Medición de calidad de señal | P3 | Firmware y protocolo de prueba | Métricas reproducibles |
| AMAR-015 | Pruebas comparativas de LPM | P4 | Referencia apropiada y protocolo | Informe con límites y metodología |
| AMAR-016 | OTA segura | P4 | Bootloader/firmware y threat model | Actualización autenticada y recuperación probada |
| AMAR-017 | Aplicación móvil | P4 | Requisitos BLE/OS | Decisión respaldada por matriz comparativa |
| AMAR-018 | Investigación de analítica avanzada | P5 | Datos consentidos y validación | Informe experimental, no diagnóstico |

## 42. Métricas para saber si mejoró

Elegir métricas que respondan a problemas concretos:
- Tasa de éxito de los flujos principales.
- Errores por tipo y versión.
- Tiempo de conexión BLE.
- Porcentaje de muestras válidas y obsoletas.
- Tiempo de persistencia.
- Tasa de duplicados.
- Tasa de solicitudes SOS con estado final conocido.
- Resultados de pruebas de aislamiento.
- Errores de accesibilidad detectados.
- Tiempo de recuperación tras un fallo.
- Incidentes de privacidad o seguridad.

Registrar una línea base antes de optimizar. No establecer metas arbitrarias sin medir el estado inicial ni interpretar una métrica técnica como beneficio médico.

## 43. Definición de terminado (Definition of Done)

Una mejora está terminada cuando:
- [ ] El alcance coincide con la tarea.
- [ ] Los casos normales y los errores relevantes se probaron.
- [ ] No hay secretos ni datos reales en el diff.
- [ ] Se revisó seguridad y privacidad según el riesgo.
- [ ] La interfaz es comprensible y accesible para el flujo afectado.
- [ ] La documentación está actualizada.
- [ ] El commit y el entorno probado están identificados.
- [ ] Los límites conocidos están escritos.
- [ ] La función no se describe como validada si no se ha validado.
- [ ] Se definió cómo revertir o recuperar si el cambio falla.

---

# PARTE XI — ORDEN DE EJECUCIÓN SUGERIDO

## 44. Plan por etapas

### Etapa A — Asegurar lo que ya existe
1. Verificar el esquema real de Supabase y sus políticas RLS.
2. Probar aislamiento entre cuentas.
3. Probar todos los estados de SOS y correo, incluidos rechazos y timeouts.
4. Revisar lecturas obsoletas, inválidas y desconexión BLE.
5. Confirmar que no hay secretos en frontend o historial Git.
6. Registrar evidencia y pendientes reales.

**Salida:** funciones existentes con límites claros y riesgos críticos identificados.

### Etapa B — Hacerlo mantenible
1. Añadir validaciones y manejo de errores consistentes.
2. Automatizar pruebas de parser, formularios y estados SOS.
3. Establecer lint/sintaxis/CI.
4. Ordenar capa de acceso a datos.
5. Documentar contrato BLE y versionado.
6. Actualizar catálogo de código y arquitectura.

**Salida:** cambios pequeños con regresiones detectables.

### Etapa C — Mejorar experiencia
1. Corregir estados de carga, vacío y error.
2. Revisar móvil y escritorio.
3. Completar navegación por teclado y contraste.
4. Mejorar gráficos, filtros y paginación.
5. Añadir exportación controlada.
6. Probar con usuarios de forma ética y con datos ficticios o consentidos.

**Salida:** uso más claro y accesible.

### Etapa D — Mejorar operación
1. Separar entornos.
2. Automatizar despliegue.
3. Definir logs y métricas.
4. Ensayar backup/restauración.
5. Documentar rollback y soporte.
6. Revisar costos y límites de proveedores.

**Salida:** capacidad de mantener y recuperar el servicio.

### Etapa E — Mejorar el dispositivo
1. Instrumentar calidad de señal y errores.
2. Crear pruebas de banco reproducibles.
3. Medir consumo y estabilidad.
4. Revisar ergonomía y protección física.
5. Evaluar actualización de firmware segura.
6. Ejecutar pruebas comparativas documentadas.

**Salida:** resultados técnicos medidos, no solo demostración visual.

### Etapa F — Investigar expansión
1. Decidir si la web cubre los requisitos BLE.
2. Evaluar app móvil o puente nativo.
3. Analizar canales de notificación adicionales.
4. Investigar analítica avanzada con datos adecuados.
5. Obtener asesoramiento profesional si se pretende uso clínico/comercial.
6. Documentar riesgos, costos y evidencia antes de prometer nuevas capacidades.

**Salida:** decisiones de expansión justificadas.

---

## 45. Fuentes técnicas que conviene consultar

Usar siempre documentación oficial vigente y registrar la fecha de consulta para decisiones sensibles a versiones:

- [MDN Web Docs](https://developer.mozilla.org/) — HTML, CSS, JavaScript, permisos y Web Bluetooth.
- [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) — compatibilidad y limitaciones del navegador.
- [Supabase Docs](https://supabase.com/docs) — Auth, PostgreSQL, RLS, Edge Functions y secretos.
- [Resend Docs](https://resend.com/docs) — remitentes, API, eventos y entregabilidad.
- [GitHub Actions Docs](https://docs.github.com/actions) — automatización CI/CD.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — prácticas de seguridad web.
- [W3C Web Content Accessibility Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/) — accesibilidad.
- [Arduino Documentation](https://docs.arduino.cc/) — herramientas y firmware.
- [Espressif Documentation](https://docs.espressif.com/) — ESP32 y herramientas de desarrollo.
- Datasheet y documentación oficial del MAX30102 y de la placa exacta utilizada — características eléctricas y límites del sensor.

Los enlaces no sustituyen revisar la versión concreta de cada librería, placa y servicio utilizado.

## 46. Cómo mantener actualizado este README

Actualizar este documento cuando:
- Una mejora importante se implemente o descarte.
- Cambie la arquitectura, el protocolo BLE o el esquema de datos.
- Se detecte un riesgo nuevo.
- Una prueba cambie la prioridad de una propuesta.
- Una función pase de experimental a verificada.
- Cambien las restricciones del navegador o de un proveedor.

En cada actualización indicar fecha, commit y estado. Mantener el [README principal](README.md) como introducción y este archivo como catálogo de mejoras; los manuales especializados deben contener el procedimiento detallado del estado actual.

---

## Conclusión

El potencial de A.M.A.R. no depende de acumular la mayor cantidad de funciones, sino de construirlas en un orden que proteja la integridad de los datos, la privacidad y la claridad del sistema. Primero se verifica lo que existe; después se automatizan pruebas, se mejora la experiencia y la operación; por último se evalúan expansiones de hardware, canales e investigación con evidencia.

**La regla central:** una mejora solo se considera real cuando está implementada, probada, documentada y descrita con límites honestos.
