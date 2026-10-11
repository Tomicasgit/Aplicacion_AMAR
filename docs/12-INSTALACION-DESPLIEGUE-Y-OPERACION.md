# 12 — Instalación, despliegue y operación

## 1. Requisitos

- Navegador moderno compatible con las funciones web utilizadas.
- Conexión a Internet para Supabase y Resend.
- Proyecto Supabase configurado con Auth, tablas y políticas correctas.
- Edge Functions desplegadas para los flujos SOS/correo.
- Remitente permitido por Resend y secretos configurados.
- Placa ESP32 y sensor MAX30102 para las pruebas físicas.
- Arduino IDE o entorno compatible con las bibliotecas del sketch.
- HTTPS para despliegue web y permisos Web Bluetooth; localhost puede tener trato especial según navegador.

## 2. Ejecutar la web

La web es una aplicación estática; no requiere compilar un bundle de React/Vite. Para desarrollo puede servirse con un servidor estático local, pero las funciones de Bluetooth y geolocalización dependen del navegador y del contexto de seguridad. Abrir un archivo con `file://` puede no habilitar todas las APIs.

Ejemplo de servidor estático local si Python está instalado:

```bash
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. Este comando sirve archivos; no instala ni configura Supabase y no habilita automáticamente BLE en cualquier navegador.

## 3. Configuración de Supabase

1. Crear o seleccionar el proyecto correcto.
2. Configurar URL y clave pública en `supabase-config.js`.
3. Crear/confirmar las tablas usadas por el cliente.
4. Configurar autenticación y URLs de redirección si aplica.
5. Activar RLS y políticas de propietario para datos privados.
6. Confirmar que las Edge Functions están en el mismo proyecto.
7. Probar primero con cuentas y datos ficticios.

La clave pública está destinada al cliente y no sustituye las políticas de autorización. No añadir claves de servicio al archivo de configuración frontend.

## 4. Configuración del correo

En el entorno con Supabase CLI autenticado y vinculado al proyecto correcto:

```bash
supabase secrets set RESEND_API_KEY=tu_clave_resend RESEND_FROM_EMAIL="A.M.A.R. <alertas@tu-dominio.com>"
supabase functions deploy amar-sos
supabase functions deploy amar-email
```

El dominio remitente debe estar verificado/permitido en Resend. No copiar la clave a GitHub, HTML, JavaScript, capturas o README. En modo de prueba, el proveedor puede restringir destinatarios.

## 5. Despliegue frontend

Publicar el contenido estático por HTTPS. Revisar:
- Que `index.html` cargue la versión correcta de `style.css` y de los scripts.
- Que el archivo de configuración apunte al proyecto Supabase esperado.
- Que no haya errores en la consola.
- Que los recursos no estén bloqueados por CSP/CORS del alojamiento.
- Que Web Bluetooth esté disponible en el navegador elegido.
- Que la sesión se mantenga según el comportamiento de Auth esperado.

Al cambiar CSS/JS, actualizar el parámetro de versión de caché en el HTML puede evitar que el navegador reutilice una copia antigua.

## 6. Firmware

El firmware vigente se encuentra en el repositorio separado [Tomicasgit/ESP32_Proyecto2030](https://github.com/Tomicasgit/ESP32_Proyecto2030), archivo [`Completop.ino`](https://github.com/Tomicasgit/ESP32_Proyecto2030/blob/main/Completop.ino), versión declarada v5.3. La copia `Completop.ino` de este repositorio web declara v4.1 y es histórica.

1. Descargar/abrir el sketch desde el repositorio canónico de firmware.
2. Instalar las bibliotecas indicadas por los `#include`.
3. Seleccionar el modelo exacto de placa IdeaSpark ESP32.
4. Verificar pines con el hardware real.
5. Compilar antes de cargar.
6. Cargar con el puerto correcto.
7. Abrir el monitor serie a 115200 baudios.
8. Verificar pantalla, sensor y BLE por separado.
9. Registrar commit, versiones de bibliotecas y resultado real.

La explicación completa está en [24 — Referencia del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md) y en el plan de pruebas incluido en [24 — Referencia completa del firmware v5.3](24-REFERENCIA-FIRMWARE-V5.3.md). No asumir que una opción de otra placa ESP32 es intercambiable.

## 7. Operación y monitoreo

- Revisar logs de Edge Functions y eventos de Resend cuando un correo no llega.
- Separar errores del cliente, de Supabase y del proveedor de correo.
- Evitar logs que incluyan coordenadas, tokens, datos de salud o correos reales.
- Registrar versión desplegada al reproducir un error.
- Probar el flujo completo tras modificar firmware, formato BLE, tablas o funciones.

## 8. Recuperación ante fallos

| Síntoma | Primer diagnóstico |
|---|---|
| No inicia sesión | Verificar credenciales, Auth y consola. |
| Panel vacío | Verificar usuario, consultas, tablas, RLS y errores de red. |
| BLE no aparece | Revisar navegador, permiso, placa, UUID y publicidad BLE. |
| Lectura visible pero no historial | Revisar inserción en `heart_readings`, red y permisos. |
| Contacto no se edita | Revisar sesión, filtro `user_id`, RLS y campos obligatorios. |
| SOS registrado sin correo | Revisar secretos, despliegue, destinatarios y respuesta de Resend. |
| Cambios visuales no aparecen | Revisar caché, versión de recursos y CSS cargado. |

## 9. Actualizaciones seguras

Antes de desplegar:
1. Revisar el diff.
2. Probar sintaxis.
3. Ejecutar pruebas de regresión.
4. Confirmar proyecto/entorno destino.
5. Desplegar función y cliente compatibles.
6. Probar un caso exitoso y uno fallido.
7. Registrar fecha, commit y resultado.
