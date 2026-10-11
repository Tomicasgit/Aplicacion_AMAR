# A.M.A.R. Pulse — guía de identidad visual

Versión: 1.0  
Alcance: aplicación web A.M.A.R. (escritorio, tablet y móvil).

## Concepto

A.M.A.R. Pulse utiliza una base azul noche para reducir el brillo general y dar jerarquía a los datos; turquesa y cian identifican interacción y tecnología. Los colores de estado se reservan para señales semánticas. El color por sí solo nunca debe ser la única forma de comunicar un estado.

## Paleta principal

| Nombre | HEX | Uso |
|---|---|---|
| Azul abismo | `#0B1220` | Fondo global de la aplicación |
| Azul panel | `#131F32` | Tarjetas, superficies principales |
| Azul elevado | `#18273D` | Superficies destacadas y hover |
| Azul profundo | `#101A2A` | Inputs, áreas secundarias y fondos interiores |
| Turquesa clínico | `#20D6C2` | Acciones primarias, pulso, navegación activa |
| Cian tecnológico | `#55B8FF` | Enlaces, iconos informativos y detalles de gráficos |
| Blanco humo | `#F1F5F9` | Texto principal sobre superficies oscuras |
| Gris pizarra | `#94A3B8` | Texto secundario y etiquetas |
| Borde base | `#27364B` | Divisores y límites de tarjetas |
| Borde destacado | `#35465D` | Contornos de inputs y controles |

## Colores semánticos

| Nombre | HEX | Uso |
|---|---|---|
| Verde seguro | `#35D07F` | Confirmaciones o conexión verificada |
| Ámbar alerta | `#FFBE55` | Advertencias que requieren atención |
| Rojo crítico | `#FF5D70` | SOS y estados críticos definidos por reglas explícitas |
| Fondo de estado correcto | `#102D2C` | Superficie de apoyo para mensajes positivos |
| Rojo oscuro de acción | `#C92F4C` | Gradiente del botón SOS |

**Importante:** el color de la interfaz no interpreta una lectura cardíaca ni diagnostica una condición. Un estado clínico no debe deducirse de colores decorativos; debe depender de reglas documentadas y validadas.

## Reglas de uso

- Usar `#0B1220` como fondo general y `#131F32` para las tarjetas.
- Reservar el turquesa para la acción principal, el pulso visual y la navegación activa.
- Usar cian en información secundaria interactiva, no para competir con la medición principal.
- Aplicar verde, ámbar y rojo solo cuando exista un estado real que justifique ese significado.
- Mantener textos esenciales con contraste legible; comprobar el contraste de cada combinación al añadir componentes.
- No comunicar errores, alertas ni conexión únicamente por color: acompañar con texto o iconografía.
- Respetar `prefers-reduced-motion` para reducir las animaciones.
- Mantener áreas táctiles amplias y una navegación móvil fija sin tapar contenido ni el botón SOS.

## Tipografía e iconografía

- **Manrope:** títulos, cifras destacadas y jerarquía de marca.
- **DM Sans:** texto de interfaz, formularios, botones y datos auxiliares.
- Logotipo: símbolo vectorial propio que integra corazón y señal de pulso.
- Iconografía: mantener símbolos simples y consistentes; sustituir gradualmente los glifos por SVG accesibles si se incorpora un set de iconos.

## Tokens CSS

Los tokens de color viven al inicio de `style.css` dentro de `:root`. Al cambiar un color, actualizar también esta guía para que la documentación siga reflejando el producto.
