# A.M.A.R. Pulse — Paleta de colores

Esta guía define los colores oficiales de la interfaz web de A.M.A.R. (Alerta de Latidos y Monitoreo Autónomo). Los colores se implementan como variables CSS en `style.css`.

> A.M.A.R. es un prototipo de monitoreo. Los colores de estado de la interfaz no constituyen una evaluación ni un diagnóstico médico.

## Colores principales

| Nombre | Hexadecimal | Función |
|---|---|---|
| Azul abismo | `#0B1220` | Fondo general de la aplicación. Reduce el brillo visual y crea la base de contraste. |
| Azul panel | `#131F32` | Fondo principal de tarjetas y superficies de contenido. |
| Azul elevado | `#192941` | Superficies elevadas, estados interactivos y elementos secundarios. |
| Turquesa clínico | `#20D6C2` | Color de marca, acciones principales, acentos y estados activos. |
| Cian tecnológico | `#55B8FF` | Enlaces, indicadores informativos y foco de teclado. |
| Blanco humo | `#F1F5F9` | Texto principal y datos de mayor jerarquía. |
| Gris pizarra | `#9AAAC0` | Texto secundario, ayudas y metadatos. |
| Verde seguro | `#35D07F` | Confirmaciones positivas y estados completados. |
| Ámbar alerta | `#FFBE55` | Avisos y estados que requieren atención. |
| Rojo crítico | `#FF5D70` | Acciones de emergencia, errores y señales críticas. |
| Rojo profundo | `#E7475D` | Variante oscura para botones SOS y estados críticos. |
| Borde azul | `#28384D` | Separadores y bordes sobre fondos oscuros. |

## Uso por componente

- **Marca A.M.A.R.:** turquesa clínico sobre un fondo azul oscuro; el isotipo combina un corazón y una línea de pulso.
- **Acción primaria:** turquesa clínico con texto azul muy oscuro para conservar una jerarquía clara.
- **Datos principales:** blanco humo; etiquetas, unidades y fechas usan gris pizarra.
- **Estado activo o positivo:** verde seguro o turquesa, acompañado de texto descriptivo.
- **Avisos:** ámbar alerta. No usar el color como única forma de comunicar el estado.
- **SOS y errores críticos:** rojo crítico y rojo profundo. El rojo se reserva para acciones y situaciones que requieren atención.
- **Foco de teclado:** cian tecnológico con un contorno visible.
- **Fondos y tarjetas:** azul abismo para el lienzo y azul panel para agrupar información relacionada.

## Reglas de consistencia

1. No introducir colores aislados en nuevos componentes si existe una variable CSS equivalente.
2. Mantener el mismo significado semántico de cada color en todas las pantallas.
3. No comunicar estados únicamente por color: incluir texto, iconos o etiquetas.
4. Mantener visibles los contornos de foco y permitir la navegación con teclado.
5. Respetar la preferencia del sistema `prefers-reduced-motion`; las animaciones son decorativas y no deben dificultar la lectura.
6. Revisar el contraste del texto en el contexto real de cada componente, especialmente en botones, etiquetas pequeñas y estados.
7. No interpretar una lectura cardíaca ni colorearla como diagnóstico médico sin criterios clínicos validados.

## Variables CSS de referencia

```css
:root {
  --bg: #0B1220;
  --card: #131F32;
  --panel-raised: #192941;
  --teal: #20D6C2;
  --cyan: #55B8FF;
  --ink: #F1F5F9;
  --muted: #9AAAC0;
  --good: #35D07F;
  --amber: #FFBE55;
  --red: #FF5D70;
  --red2: #E7475D;
  --line: #28384D;
}
```

## Accesibilidad y alcance

La paleta es una guía de identidad visual, no una certificación de accesibilidad. Antes de publicar cambios, verificar contraste WCAG en los componentes finales, zoom al 200 %, foco visible, navegación por teclado y lectura en móvil. A.M.A.R. es un prototipo y no sustituye la evaluación ni la atención de profesionales de la salud.
