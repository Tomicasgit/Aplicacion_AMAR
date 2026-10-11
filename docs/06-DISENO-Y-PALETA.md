# 06 — Diseño de interfaz y paleta

## 1. Dirección visual

La interfaz usa una estética tecnológica sobria: fondos azul profundo, tarjetas con separación clara, texto de alto contraste y turquesa para la identidad principal. El rojo se reserva para acciones SOS y estados críticos; el verde indica confirmación positiva y el ámbar una advertencia.

## 2. Paleta de referencia

| Nombre | HEX | Aplicación |
|---|---|---|
| Azul abismo | `#0B1220` | Fondo general. |
| Azul panel | `#131F32` | Tarjetas y paneles. |
| Azul elevado | `#192941` | Superficies secundarias. |
| Turquesa clínico | `#20D6C2` | Marca, acentos y acciones. |
| Cian tecnológico | `#55B8FF` | Foco, enlaces y datos informativos. |
| Blanco humo | `#F1F5F9` | Texto principal. |
| Gris pizarra | `#9AAAC0` | Texto secundario. |
| Verde seguro | `#35D07F` | Confirmación/éxito. |
| Ámbar alerta | `#FFBE55` | Advertencia. |
| Rojo crítico | `#FF5D70` | SOS y errores críticos. |
| Rojo profundo | `#E7475D` | Gradientes/variantes SOS. |
| Borde azul | `#28384D` | Divisores y bordes. |

## 3. Jerarquía

1. **Primario:** título, lectura LPM y acción de la vista.
2. **Secundario:** hora, unidad, etiqueta y estado de conexión.
3. **Acción principal:** turquesa o, para SOS, rojo claramente diferenciado.
4. **Estado:** icono + texto + color; no solo color.
5. **Ayuda:** texto de menor contraste pero legible, especialmente para límites de la alerta.

## 4. Tratamiento visual del SOS

El modal SOS debe separar:
- Encabezado y tipo de alerta.
- Confirmación de que la alerta quedó registrada.
- Estado del envío de correo con recuentos, si existen.
- Lista de contactos y botones directos de llamada/WhatsApp.
- Aviso de alcance y limitaciones.
- Acción de cierre claramente visible.

El modal usa fondo azul oscuro con un resplandor rojo tenue, bordes suaves y tarjetas de contactos independientes. El área puede desplazarse si el contenido excede la altura disponible en móvil.

## 5. Responsive

- **Escritorio:** panel lateral y cuadrícula de tarjetas.
- **Tablet:** cuadrícula reducida.
- **Móvil:** navegación horizontal, tarjetas en una columna y botones con área táctil suficiente.
- El modal debe caber dentro de la altura visible, respetar zonas seguras y permitir desplazamiento vertical.
- Las reglas finales de `style.css` gobiernan la visibilidad SPA y las adaptaciones móviles.

## 6. Accesibilidad y movimiento

- Foco visible para teclado.
- Contraste real verificado en el componente final.
- No usar el color como única señal.
- Respetar `prefers-reduced-motion`.
- Evitar animaciones que sugieran un electrocardiograma real.
- Probar zoom de navegador, ancho móvil y lectura de mensajes largos.

## 7. Uso semántico de color

| Estado | Color orientativo | Texto necesario |
|---|---|---|
| Normal/identidad | Turquesa | “Conectado”, “Lectura recibida”, etc. |
| Confirmación | Verde | “El servicio confirmó el envío” o “Guardado”. |
| Atención | Ámbar | Explicar qué falta o qué no pudo confirmarse. |
| SOS/error crítico | Rojo | Describir la acción requerida sin dramatizar. |
| Información secundaria | Gris pizarra | Fecha, unidad, explicación breve. |

Los colores no representan rangos clínicos ni son diagnóstico. Los criterios para clasificar valores cardíacos deben definirse por separado y validarse con profesionales.
