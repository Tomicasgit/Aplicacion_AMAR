# 20 — Anatomía de la interfaz: HTML, CSS y componentes

## 1. Objetivo

Este documento conecta la estructura del HTML con el CSS y los módulos JS que la actualizan. Los identificadores son contratos internos: si se renombra un `id`, actualizar todos los selectores JavaScript que lo usan.

## 2. Elementos principales de `index.html`

| ID / selector | Función | Módulo relacionado |
|---|---|---|
| `loginView` | Vista de inicio de sesión. | `js/auth.js`, `app.js` |
| `loginForm`, `loginEmail`, `loginPassword` | Entradas y envío de credenciales. | `js/auth.js` |
| `registerView`, `registerForm` | Vista/formulario de registro. | `js/auth.js` |
| `appView` | Contenedor de la aplicación tras autenticación. | `js/core.js`, `app.js` |
| `patientName` | Nombre visible del usuario. | `js/dashboard.js` / perfil |
| `logout` | Acción de cerrar sesión. | `app.js` |
| `deviceBadge` | Indicador de dispositivo/estado. | Dashboard/Bluetooth |
| `homeSection` | Sección de inicio. | `js/dashboard.js` |
| `bpm` | Contenedor de la lectura actual en LPM. | `js/bluetooth.js` |
| `heartbeatWave` | Recurso gráfico de pulso. | CSS y lógica visual |
| `heartState` | Texto de estado de lectura. | Bluetooth/alertas |
| `manualSOS` | Control para solicitar SOS manual. | `js/alerts.js` |
| `readingTime` | Hora de la lectura mostrada. | Bluetooth/dashboard |
| `dailySummary` | Resumen del día. | Dashboard/historial |
| `contactsCount` | Cantidad de contactos. | `js/contacts.js` |
| `devicesList` | Contenedor de dispositivos. | `js/devices.js` |
| `contactsList` | Contenedor de contactos. | `js/contacts.js` |
| `location` | Resumen de ubicación disponible. | `js/alerts.js` / dashboard |
| `alert` | Resumen de última alerta. | Dashboard/alertas |
| `historySection` | Vista de historial. | `js/history.js` |
| `prevMonth`, `nextMonth`, `calendarMonth`, `calendarGrid` | Navegación y cuadrícula del calendario. | `js/history.js` |
| `weeklySummary`, `calendarSummary` | Resúmenes temporales. | `js/history.js` |
| `selectedDateTitle`, `historyList` | Día seleccionado y lista de registros. | `js/history.js` |
| `modal`, `modalContent` | Diálogo reutilizable y su contenido. | `js/core.js` |

Esta tabla refleja identificadores encontrados en el HTML y sus responsabilidades principales; puede haber más campos o controles auxiliares en el documento.

## 3. Modelo de vistas

La clase `.view` oculta las vistas inactivas; `.view.active` muestra la elegida. El panel contiene subsecciones con su propio estado. La función `show(id)` de `js/core.js` cambia la vista activa. En móvil, las reglas finales del CSS refuerzan que una vista inactiva no se vuelva visible por una regla previa.

Al añadir una vista:
1. Crear un contenedor con ID único.
2. Asegurar que su estado inicial sea inactivo.
3. Añadir navegación accesible.
4. Enlazar su formulario/eventos una sola vez.
5. Comprobar escritorio y móvil.
6. Añadir el nuevo selector al catálogo documental.

## 4. Capas CSS

El archivo `style.css` contiene estilos históricos y reglas de evolución. El tema oscuro y el dashboard refinado se implementan mediante reglas posteriores que redefinen variables y componentes. Cuando hay varias declaraciones para el mismo selector, la cascada CSS decide según origen, importancia, especificidad y orden.

Por eso, antes de borrar una regla antigua, comprobar si la interfaz todavía depende de ella. Es recomendable consolidar duplicados en una futura tarea de limpieza, después de pruebas visuales.

## 5. Variables de diseño declaradas

| Variable | Valor del tema oscuro | Uso |
|---|---|---|
| `--red` | `#FF5D70` | SOS/errores críticos. |
| `--red2` | `#E7475D` | Variante roja. |
| `--ink` | `#F1F5F9` | Texto principal en el tema oscuro. |
| `--muted` | `#9AAAC0` | Texto secundario. |
| `--line` | `#28384D` | Bordes y separadores. |
| `--bg` | `#0B1220` | Fondo principal. |
| `--card` | `#131F32` | Superficie de tarjetas. |
| `--good` | `#35D07F` | Confirmación positiva. |
| `--panel-raised` | `#192941` | Panel elevado. |
| `--teal` | `#20D6C2` | Acento/identidad. |
| `--cyan` | `#55B8FF` | Información/foco. |
| `--amber` | `#FFBE55` | Advertencia. |
| `--radius-card` | `20px` | Radio de tarjeta. |
| `--shadow-card` | `0 18px 44px rgba(0, 0, 0, .18)` | Profundidad de tarjetas. |

La hoja contiene definiciones iniciales de tema claro y redefiniciones posteriores de tema oscuro. Al actualizar la paleta, cambiar también `README-PALETA.md` y el documento 06.

## 6. Tarjetas y acciones

Las clases `.record-item`, `.record-info` y `.record-actions` estructuran filas de registros. En contactos, los controles Llamar, Editar y Eliminar comparten geometría CSS: alineación centrada, altura mínima, tipografía y distribución flexible. El color identifica el tipo de acción, no el tamaño.

## 7. Modal

El contenedor `modal` aloja `modalContent`. `openModal` inserta el contenido dinámico y abre el diálogo; `closeModal` lo cierra. Cualquier dato externo interpolado en contenido debe escaparse. Un modal largo necesita scroll y no debe ocultar el botón de cierre en pantallas pequeñas.

## 8. Reglas de accesibilidad visual

- Mantener el foco visible para teclado.
- No eliminar outlines sin reemplazo.
- Asegurar etiquetas explícitas de formularios.
- Usar texto para estados además del color.
- Respetar `prefers-reduced-motion`.
- Comprobar el layout a 320 px de ancho y con zoom.
- Verificar que el contraste de texto secundario siga siendo legible.

## 9. Cómo comprobar un cambio visual

1. Forzar recarga sin caché.
2. Verificar escritorio y móvil.
3. Revisar el elemento con inspector CSS.
4. Identificar reglas duplicadas/sobrescritas.
5. Probar foco de teclado, hover, disabled y error.
6. Confirmar que los estados funcionales no se rompieron.
7. Actualizar documentación y cache busting.
