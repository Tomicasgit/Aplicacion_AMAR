# 22 — Requisitos funcionales y no funcionales

## 1. Propósito

Esta matriz traduce la idea del prototipo a requisitos que se pueden revisar y probar. “Implementado en el código” no equivale a “validado en el entorno real”; el estado debe actualizarse con evidencia de prueba.

## 2. Requisitos funcionales

| ID | Requisito | Evidencia esperada | Prueba |
|---|---|---|---|
| RF-01 | Permitir registro e inicio de sesión | Formulario y sesión Auth | AUTH-01/02 |
| RF-02 | Permitir cerrar sesión | Sesión cerrada y vista privada oculta | AUTH-03 |
| RF-03 | Mostrar dashboard del usuario | Tarjetas consultan datos de la cuenta activa | Carga del panel |
| RF-04 | Permitir solicitar conexión BLE | Selector del navegador y estado de conexión | BLE-01/03 |
| RF-05 | Recibir lectura desde la característica BLE | LPM y hora actualizadas | BLE-04 |
| RF-06 | No tratar mensajes malformados como lectura válida | Error/estado sin dato inventado | BLE-05 |
| RF-07 | Persistir lecturas recibidas según el intervalo configurado | Fila visible en la tabla y luego en historial | BLE-09 |
| RF-08 | Consultar historial por fecha | Calendario y lista coinciden con los datos | Pruebas de historial |
| RF-09 | Resumir lecturas por períodos | Agregaciones reproducibles con datos conocidos | Pruebas de agregación |
| RF-10 | Administrar contactos | Crear, leer, editar y eliminar | CONT-01 a CONT-07 |
| RF-11 | Ofrecer llamada directa al contacto | Enlace `tel:` | Prueba en dispositivo |
| RF-12 | Mostrar correo del contacto sin botón `mailto:` | Correo como dato, solo tres acciones | CONT-05/06 |
| RF-13 | Administrar dispositivos registrados | CRUD asociado al propietario | Pruebas de dispositivos |
| RF-14 | Editar perfil | Datos guardados y recargados | Prueba de perfil |
| RF-15 | Registrar SOS manual | Fila de alerta y resultado mostrado | SOS-01 |
| RF-16 | Tratar la ubicación como opcional | SOS continúa sin permiso de ubicación | SOS-02 |
| RF-17 | Intentar notificación de correo mediante servidor | Respuesta del proveedor y contadores | MAIL-01 a MAIL-06 |
| RF-18 | Mostrar resultado parcial de envío | Cantidades enviadas y fallidas por separado | MAIL-03 |
| RF-19 | Ofrecer botones SOS de llamada/WhatsApp | Enlaces/acciones manuales visibles | Prueba del modal |
| RF-20 | Informar límites de comunicación | Aclaración de que no hay llamada automática ni lectura garantizada | Revisión UX |

## 3. Requisitos no funcionales

| ID | Requisito | Cómo verificar |
|---|---|---|
| RNF-01 | Seguridad de datos por usuario | Pruebas RLS con dos cuentas. |
| RNF-02 | Secretos fuera del cliente | Búsqueda de patrones de credenciales y revisión Git. |
| RNF-03 | Mensajes de error comprensibles | Pruebas de error y revisión UX. |
| RNF-04 | Diseño responsive | Escritorio, tablet y móvil. |
| RNF-05 | Accesibilidad básica | Teclado, foco, etiquetas, contraste y movimiento reducido. |
| RNF-06 | Estado de lectura honesto | Verificar sensor ausente, desconexión y expiración. |
| RNF-07 | Consistencia de acciones de contactos | Igual altura, alineación y estilo de Llamar/Editar/Eliminar. |
| RNF-08 | Mantenibilidad | Módulos separados y documentación sincronizada. |
| RNF-09 | Observabilidad | Errores diagnosticables sin exponer datos sensibles. |
| RNF-10 | Compatibilidad explícita | Navegador y placa usados quedan registrados en pruebas. |
| RNF-11 | Privacidad | Ubicación opcional y minimización de datos. |
| RNF-12 | Transparencia sanitaria | No presentar el prototipo como diagnóstico o dispositivo certificado. |

## 4. Actores

- **Usuario final:** inicia sesión, consulta lecturas, administra contactos y puede solicitar SOS.
- **Contacto de emergencia:** recibe correo cuando el flujo y el proveedor lo permiten; puede ser llamado por el usuario.
- **Administrador/desarrollador:** configura Supabase/Resend, despliega funciones, revisa errores y mantiene el repositorio.
- **Evaluador/docente:** revisa objetivo, metodología, arquitectura, pruebas y limitaciones.

## 5. Casos de uso resumidos

### UC-01 — Consultar lectura
Precondición: sesión válida y dispositivo BLE disponible.  
Flujo: conectar → recibir notificación → validar mensaje → mostrar LPM y hora.  
Alternativas: permiso denegado, dispositivo no encontrado, sensor sin lectura o desconexión.  
Resultado: lectura visible con estado correspondiente; no garantiza persistencia.

### UC-02 — Consultar historial
Precondición: sesión válida y lecturas guardadas.  
Flujo: abrir historial → elegir fecha/período → consultar filas → mostrar lista/resumen.  
Alternativa: no existen registros.  
Resultado: vista de datos almacenados, no reconstrucción de datos faltantes.

### UC-03 — Gestionar contacto
Precondición: sesión válida.  
Flujo: listar → editar o eliminar → confirmar → actualizar dashboard.  
Seguridad: la consulta debe filtrar por propietario y RLS debe reforzar el acceso.

### UC-04 — Solicitar SOS
Precondición: sesión válida y Edge Function desplegada.  
Flujo: solicitar → ubicación opcional → función valida token → registra alerta → consulta contactos → intenta correo → responde estados.  
Alternativas: sin ubicación, sin contactos, sin secretos, error parcial o fallo del proveedor.  
Resultado: estado de alerta y comunicación diferenciados.

## 6. Criterio de cierre

Un requisito solo debe marcarse como validado cuando existe evidencia reproducible. Un archivo en GitHub demuestra que el código existe; no demuestra por sí solo que el backend esté desplegado, que el hardware funcione o que un correo haya llegado.
