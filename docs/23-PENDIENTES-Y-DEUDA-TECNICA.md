# 23 — Pendientes, deuda técnica y prioridades

## 1. Propósito

Este documento evita presentar tareas futuras como si ya estuvieran terminadas. Los pendientes deben cerrarse con un cambio de código y evidencia, o mantenerse identificados.

## 2. Pendientes que requieren acceso al entorno real

| Prioridad | Pendiente | Por qué requiere validación externa |
|---|---|---|
| Alta | Confirmar políticas RLS de cada tabla | Las políticas activas viven en el proyecto Supabase, no quedan demostradas por el JavaScript. |
| Alta | Confirmar despliegue de `amar-sos` y `amar-email` | GitHub contiene código, pero no demuestra qué versión está desplegada. |
| Alta | Confirmar secretos de Resend sin revelar valores | Se revisa desde la configuración del proyecto. |
| Alta | Probar envío y entrega de correo de extremo a extremo | Se necesita respuesta del proveedor y revisión de eventos/bandeja. |
| Alta | Validar físicamente sensor, pantalla y BLE | Requiere la placa y el sensor reales. |
| Alta | Verificar esquema exacto de PostgreSQL | Deben inspeccionarse tipos, restricciones, índices y políticas desplegadas. |
| Media | Probar acceso cruzado entre dos cuentas | Necesita dos usuarios y entorno real. |
| Media | Comprobar historial alrededor de medianoche/zona horaria | Requiere datos temporales controlados. |
| Media | Probar botones en móviles reales | Los manejadores `tel:`, Web Bluetooth y layouts dependen del dispositivo. |
| Media | Mantener registro de horas efectivas | Requiere bitácora real del trabajo. |

## 3. Deuda técnica visible o probable

1. **Cascada CSS histórica:** hay reglas de tema claro y redefiniciones posteriores de tema oscuro. Consolidar duplicados después de una regresión visual, no eliminando reglas a ciegas.
2. **Contrato de base de datos:** el repositorio consulta tablas, pero la documentación debe completarse con DDL/migraciones reales exportadas de Supabase.
3. **Contrato BLE:** mantener formato, UUID, unidades y estados sincronizados; añadir una especificación de ejemplo sanitizado.
4. **Idempotencia SOS:** decidir cómo manejar dobles clics/reintentos para evitar alertas y correos duplicados.
5. **Entrega de correo:** diferenciar aceptación del proveedor, entrega final y lectura; integrar webhooks/eventos si el proyecto lo necesita.
6. **Lecturas obsoletas:** definir un umbral de frescura único y reflejarlo en firmware, cliente y panel.
7. **Manejo de errores:** unificar mensajes de red, permisos, datos inválidos y operaciones parciales.
8. **Pruebas automatizadas:** incorporar lint/compilación y tests de funciones puras cuando el entorno lo permita.
9. **Seguridad de HTML dinámico:** revisar cada interpolación de datos, no solo el módulo de contactos.
10. **Retención de datos:** definir cuánto tiempo conservar lecturas y ubicaciones y cómo eliminarlas.
11. **Privacidad del contacto:** informar de manera clara qué contenido se envía en un SOS y a qué direcciones.
12. **Validación del algoritmo:** el filtro actual no debe considerarse validación médica.

## 4. Prioridad sugerida

### P0 — Antes de una demostración
- Confirmar el flujo principal y la versión desplegada.
- Comprobar botones de contactos y actualización de caché.
- Probar SOS con un contacto de prueba.
- Revisar errores de consola y registrar resultados.
- Usar datos ficticios o autorizados.

### P1 — Antes de una entrega académica final
- Completar DDL real y políticas RLS.
- Completar bitácora y cronología con evidencia.
- Añadir capturas sin información sensible.
- Ejecutar la matriz de pruebas y anotar los casos que fallan.
- Revisar todas las afirmaciones del informe para que no excedan la evidencia.

### P2 — Evolución posterior
- Automatizar pruebas de regresión.
- Consolidar CSS.
- Mejorar observabilidad de correo y estados de lectura.
- Diseñar retención/exportación de datos.
- Planificar validación técnica y clínica formal si se pretende evolucionar a producto sanitario.

## 5. Definición de “terminado”

Una tarea se considera cerrada cuando:
1. El código/documento está actualizado.
2. El cambio se publicó en la rama prevista.
3. Se ejecutó una prueba relacionada.
4. El resultado real se anotó.
5. Se actualizaron los documentos dependientes.
6. Las limitaciones pendientes siguen explícitas.

## 6. Cómo registrar un pendiente

Usar este formato en un issue o bitácora:
- **ID:** PEND-XX
- **Descripción:** qué falta.
- **Impacto:** usuario, seguridad, datos o presentación.
- **Pasos para reproducir:** lista precisa.
- **Resultado esperado/real:** sin ambigüedad.
- **Archivo/función:** ruta y función.
- **Entorno:** commit, navegador, firmware y backend.
- **Criterio de cierre:** evidencia observable.
