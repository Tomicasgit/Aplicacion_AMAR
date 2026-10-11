# 11 — Experiencia de usuario, interfaz y accesibilidad

## 1. Principios de diseño

A.M.A.R. presenta información de salud potencialmente sensible. Por eso la interfaz debe priorizar claridad, legibilidad, previsibilidad y estados honestos por encima de adornos.

1. La lectura actual debe ser la información más fácil de localizar.
2. La antigüedad de una lectura debe poder identificarse.
3. La ausencia de señal debe tener un estado explícito.
4. SOS debe distinguirse de las acciones ordinarias.
5. Los mensajes de error deben explicar qué ocurrió y qué se puede hacer.
6. Los colores refuerzan el mensaje; no lo reemplazan.
7. La interfaz debe poder usarse con teclado y pantalla pequeña.

## 2. Mapa de navegación

| Vista/sección | Propósito | Acción principal |
|---|---|---|
| Acceso | Identificar al usuario | Iniciar sesión. |
| Registro | Crear una cuenta | Completar y enviar el formulario. |
| Inicio/dashboard | Resumen actual del dispositivo y datos guardados | Consultar estado y activar SOS si hace falta. |
| Historial | Revisar lecturas guardadas | Seleccionar fecha y período. |
| Dispositivos | Administrar dispositivos registrados | Agregar, editar o eliminar según interfaz disponible. |
| Contactos de emergencia | Gestionar personas de confianza | Llamar, editar o eliminar un contacto. |
| Perfil | Ver/actualizar datos del usuario | Guardar cambios. |
| Modal SOS | Confirmar el resultado de una alerta | Leer estado, usar llamada/WhatsApp y cerrar. |

## 3. Estados de interfaz

Cada componente asíncrono debe tener estados comprensibles:
- **Inicial:** todavía no hay datos cargados.
- **Cargando:** la consulta o acción está en curso.
- **Disponible:** hay datos válidos.
- **Vacío:** no hay registros.
- **Desconectado:** no se reciben datos actuales del dispositivo.
- **Error:** una operación falló.
- **Parcial:** una parte de la operación tuvo éxito y otra falló.
- **Obsoleto:** existe un último valor, pero no es reciente.

Un valor anterior debe etiquetarse como anterior/desactualizado si el tiempo de recepción supera el umbral establecido. No usar un cero artificial para indicar “sin señal”.

## 4. Acciones de contactos

En “Mis contactos de emergencia” quedan tres acciones: **Llamar**, **Editar** y **Eliminar**. Deben compartir altura, alineación, tipografía, radio y ancho flexible. En móvil, deben ocupar una fila coherente o envolver sin solaparse.

- Llamar abre el manejador de teléfono mediante `tel:`; el usuario confirma la llamada en su dispositivo.
- Editar abre el formulario con los valores actuales.
- Eliminar pide confirmación antes de borrar.
- El correo se conserva como dato, pero no como botón `mailto:` de acción rápida. La notificación SOS usa el backend y su estado real.

## 5. Confirmación SOS

El modal debería presentar en este orden:
1. Título de alerta registrada.
2. Resultado de guardado.
3. Resultado de ubicación opcional.
4. Resultado del correo con contadores.
5. Acciones de llamada/WhatsApp a contactos.
6. Aviso de limitaciones.
7. Cierre del modal.

No utilizar lenguaje que sugiera que el sistema llamó a emergencias, activó el teléfono de un contacto o garantizó una respuesta cuando eso no ocurrió.

## 6. Accesibilidad

- Botones con nombre accesible y propósito específico.
- Contraste suficiente para texto normal y pequeño.
- Indicadores de foco visibles.
- Controles con área táctil suficiente en móvil.
- Orden de tabulación lógico.
- Evitar que una actualización automática robe el foco.
- Respetar `prefers-reduced-motion`.
- Formularios con etiquetas vinculadas a cada entrada.
- Errores asociados al campo o formulario cuando corresponda.
- No usar solo rojo/verde para diferenciar estados.
- Mantener mensajes legibles con zoom y textos largos.

## 7. Diseño responsive

| Rango de referencia | Comportamiento esperado |
|---|---|
| Escritorio | Sidebar y tarjetas en varias columnas cuando hay espacio. |
| Tablet | Menos columnas, tarjetas con ancho suficiente. |
| Móvil | Navegación compacta, una columna, acciones táctiles y modales desplazables. |

Los rangos CSS reales están definidos en `style.css`; esta tabla describe el comportamiento deseado, no una certificación de todos los tamaños de pantalla.

## 8. Animaciones

Las transiciones deben ayudar a comprender el cambio de vista. La onda de pulso es un recurso visual de interfaz, no una señal electrocardiográfica. No debe ser utilizada para evaluar ritmo ni para mostrar datos no recibidos del sensor.

## 9. Prueba UX breve

Pedir a una persona que, sin ayuda, encuentre la lectura actual, determine si está conectada, consulte una fecha anterior, edite un contacto y explique qué significa el estado del correo tras SOS. Anotar dónde duda, qué texto interpreta mal y cuánto tarda. No usar datos reales de salud en sesiones de prueba compartidas.
