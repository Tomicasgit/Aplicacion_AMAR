(function () {
  "use strict";

  // =========================================================
  // ESTADO DEL MÓDULO
  // =========================================================

  let previousLevel = "invalid";
  let automaticTimer = null;
  let automaticSeconds = 10;
  let automaticConfirmationActive = false;
  let automaticRequestInProgress = false;

  // =========================================================
  // USUARIO Y SUPABASE
  // =========================================================

  async function getCurrentUser() {
    if (typeof supabaseClient === "undefined") {
      throw new Error("El cliente de Supabase no está disponible.");
    }

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      throw new Error("Debés iniciar sesión para registrar una alerta.");
    }

    return data.user;
  }

  async function registerAlert({
    type = "device",
    message = "",
    deviceId = null
  } = {}) {
    const user = await getCurrentUser();

    const { data, error } = await supabaseClient
      .from("alerts")
      .insert({
        user_id: user.id,
        device_id: deviceId,
        type,
        message,
        status: "new"
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  async function requestSOSFunction({ type, message, location = null }) {
    await getCurrentUser();

    const { data, error } = await supabaseClient.functions.invoke(
      "amar-sos",
      {
        body: {
          type,
          message,
          location
        }
      }
    );

    if (error) {
      console.error("Error al invocar amar-sos:", error);
      throw new Error(
        "No se pudo comunicar con el servicio SOS de Supabase."
      );
    }

    if (!data?.success) {
      throw new Error(
        data?.error || "Supabase no pudo registrar la alerta."
      );
    }

    return data;
  }

  function communicationStatusText(result) {
    const sent = Number(result?.email_sent_count) || 0;
    const failed = Number(result?.email_failed_count) || 0;

    // El éxito parcial también es éxito: no informar un fallo total si
    // Resend confirmó uno o más envíos y solo otros destinatarios fallaron.
    if (sent > 0 && failed > 0) {
      return `Alerta registrada. El servicio confirmó ${sent} correo(s) enviado(s); ${failed} no pudieron enviarse.`;
    }

    if (sent > 0) {
      return `Alerta registrada. El servicio confirmó el envío de ${sent} correo(s) de aviso.`;
    }

    if (result?.email_configured === false) {
      return "La alerta quedó registrada, pero falta configurar el servicio de correo en Supabase.";
    }

    if (Number(result?.email_contacts_count) === 0) {
      return "La alerta quedó registrada, pero no hay contactos con correo electrónico.";
    }

    if (failed > 0) {
      return `La alerta quedó registrada, pero el servicio no pudo enviar ${failed} correo(s).`;
    }

    return "La alerta quedó registrada. El servicio no devolvió una confirmación de envío.";
  }

  async function refreshDashboardSafely() {
    try {
      if (typeof loadDashboard === "function") {
        await loadDashboard();
      }
    } catch (error) {
      console.warn("La alerta se registró, pero el panel no se actualizó:", error);
    }
  }

  // =========================================================
  // UBICACIÓN
  // =========================================================

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(
          new Error("Este navegador no admite geolocalización.")
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          const messages = {
            1: "No se concedió permiso para acceder a la ubicación.",
            2: "El navegador no pudo determinar la ubicación.",
            3: "Se agotó el tiempo para obtener la ubicación."
          };

          reject(
            new Error(
              messages[error.code] ||
              "No se pudo obtener la ubicación."
            )
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  async function savePosition(position, { deviceId = null } = {}) {
    const user = await getCurrentUser();

    const { data, error } = await supabaseClient
      .from("locations")
      .insert({
        user_id: user.id,
        device_id: deviceId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      })
      .select()
      .single();

    if (error) throw error;

    return {
      location: data,
      accuracy: position.coords.accuracy
    };
  }

  async function captureAndSaveLocation(options = {}) {
    const position = await getCurrentPosition();
    return savePosition(position, options);
  }


  // =========================================================
  // ACCESOS RÁPIDOS A CONTACTOS DE EMERGENCIA
  // =========================================================

  function escapeContactHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  async function buildEmergencyContactsHTML() {
    try {
      const user = await getCurrentUser();

      const { data: contacts, error } = await supabaseClient
        .from("emergency_contacts")
        .select("id, name, phone")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!contacts?.length) {
        return `
          <section class="sos-emergency-contacts">
            <h3>Contactos de emergencia</h3>
            <p>No tenés contactos registrados.</p>
          </section>
        `;
      }

      const items = contacts.map(contact => {
        const name = escapeContactHTML(contact.name || "Contacto");
        const phone = String(contact.phone || "").trim();
        const callLink = phone
          ? `<a class="call-button" href="tel:${escapeContactHTML(phone)}">Llamar</a>`
          : "";

        // WhatsApp necesita el número en formato internacional, solo con dígitos.
        let whatsappPhone = phone.replace(/\D/g, "");
        if (whatsappPhone.startsWith("00")) {
          whatsappPhone = whatsappPhone.slice(2);
        }
        // Los números argentinos locales suelen tener 10 dígitos.
        // Para WhatsApp móvil se usa el prefijo internacional 549.
        if (whatsappPhone && !whatsappPhone.startsWith("54")) {
          if (whatsappPhone.startsWith("0")) {
            whatsappPhone = whatsappPhone.slice(1);
          }
          if (whatsappPhone.length === 10) {
            whatsappPhone = `549${whatsappPhone}`;
          } else if (whatsappPhone.length === 11 && whatsappPhone.startsWith("15")) {
            whatsappPhone = `549${whatsappPhone.slice(2)}`;
          } else {
            whatsappPhone = `54${whatsappPhone}`;
          }
        }
        const whatsappMessage = encodeURIComponent(
          "EMERGENCIA A.M.A.R.: necesito ayuda. Por favor, comunicate conmigo."
        );
        // Mostrar la acción siempre que exista un teléfono con dígitos.
        // La validación estricta ocultaba el botón para números locales cortos.
        const whatsappLink = whatsappPhone
          ? `<a class="whatsapp-button" href="https://wa.me/${whatsappPhone}?text=${whatsappMessage}" target="_blank" rel="noopener noreferrer" aria-label="Contactar por WhatsApp a ${name}">WhatsApp</a>`
          : "";

        return `
          <li class="sos-contact-item">
            <strong>${name}</strong>
            <div class="record-actions">
              ${callLink}
              ${whatsappLink}
            </div>
            ${!phone
              ? "<small>Este contacto no tiene un teléfono disponible para llamada o WhatsApp.</small>"
              : ""}
          </li>
        `;
      }).join("");

      return `
        <section class="sos-emergency-contacts">
          <h3>Contactos de emergencia</h3>
          <p>Elegí una forma de contacto disponible. El aviso por correo se gestiona desde la solicitud SOS.</p>
          <ul class="sos-contact-list">${items}</ul>
          <p class="sos-disclaimer">
            Estas acciones abren la aplicación correspondiente.
            No envían mensajes automáticamente.
          </p>
        </section>
      `;
    } catch (error) {
      console.warn("No se pudieron cargar los contactos:", error);

      return `
        <section class="sos-emergency-contacts">
          <h3>Contactos de emergencia</h3>
          <p>No se pudieron cargar los contactos. Podés consultarlos desde la sección Contactos.</p>
        </section>
      `;
    }
  }

  // =========================================================
  // VALIDACIÓN DE TELEMETRÍA DEL ESP32
  // =========================================================

  function evaluateReading(data) {
    if (!data || typeof data !== "object") {
      return {
        level: "invalid",
        reason: "Lectura inexistente."
      };
    }

    const quality = Number(data.quality);
    const lpm = Number(data.lpm);

    if (
      !Number.isFinite(lpm) ||
      !Number.isInteger(lpm) ||
      lpm <= 0 ||
      lpm > 300 ||
      !Number.isFinite(quality) ||
      quality < 3
    ) {
      return {
        level: "invalid",
        reason: "Lectura inválida o calidad insuficiente."
      };
    }

    if (data.sensor_state !== "midiendo") {
      return {
        level: "invalid",
        reason: "El sensor no está en estado de medición."
      };
    }

    if (
      data.user_state === "critico" &&
      data.alert === true
    ) {
      return {
        level: "critical",
        reason: "El dispositivo indica un estado crítico.",
        lpm,
        quality
      };
    }

    if (data.user_state === "precaucion") {
      return {
        level: "warning",
        reason: "El dispositivo indica un estado de precaución.",
        lpm,
        quality
      };
    }

    if (data.user_state === "normal") {
      return {
        level: "normal",
        reason: "El dispositivo indica un estado normal.",
        lpm,
        quality
      };
    }

    return {
      level: "invalid",
      reason: "Estado del usuario desconocido."
    };
  }

  // =========================================================
  // PROCESAMIENTO DE LECTURAS BLE
  // =========================================================

  function processReading(data) {
    const result = evaluateReading(data);
    const previous = previousLevel;

    previousLevel = result.level;

    // Iniciar una sola vez al entrar en estado crítico.
    if (
      result.level === "critical" &&
      previous !== "critical"
    ) {
      startAutomaticConfirmation(result);
    }

    // Cancelar si la lectura deja de ser crítica,
    // incluida una lectura inválida.
    if (result.level !== "critical") {
      cancelAutomaticConfirmation(true);
    }

    return {
      ...result,
      changed: result.level !== previous,
      previousLevel: previous
    };
  }

  // =========================================================
  // CANCELACIÓN DEL TEMPORIZADOR AUTOMÁTICO
  // =========================================================

  function cancelAutomaticConfirmation(closeWindow = true) {
    const wasActive = automaticConfirmationActive;

    if (automaticTimer !== null) {
      clearInterval(automaticTimer);
      automaticTimer = null;
    }

    automaticConfirmationActive = false;
    automaticSeconds = 10;

    if (
      closeWindow &&
      wasActive &&
      typeof closeModal === "function"
    ) {
      closeModal();
    }
  }

  // =========================================================
  // CONFIRMACIÓN AUTOMÁTICA DE 10 SEGUNDOS
  // =========================================================

  function startAutomaticConfirmation(result) {
    if (
      automaticConfirmationActive ||
      automaticRequestInProgress
    ) {
      return;
    }

    if (typeof openModal !== "function") {
      console.error(
        "No está disponible la ventana de confirmación."
      );
      return;
    }

    automaticConfirmationActive = true;
    automaticSeconds = 10;

    openModal(`
      <div class="sos-confirmation">
        <h2>Posible anomalía detectada</h2>

        <p>
          El dispositivo informó una lectura crítica válida.
        </p>

        <p>
          Si necesitás ayuda, confirmá ahora.
          Si no respondés, se registrará una alerta automáticamente.
        </p>

        <p>
          Lectura informada:
          <strong>${result.lpm} LPM</strong>
        </p>

        <p class="sos-countdown">
          Tiempo restante:
          <strong id="automaticCountdown">10 segundos</strong>
        </p>

        <button
          type="button"
          class="primary"
          id="confirmAutoAlert"
        >
          Solicitar ayuda ahora
        </button>

        <button
          type="button"
          class="secondary"
          id="cancelAutoAlert"
        >
          Cancelar alerta
        </button>

        <p class="sos-disclaimer">
          Esta función registra la alerta e intenta guardar
          la ubicación. No envía mensajes ni realiza llamadas.
        </p>
      </div>
    `);

    document
      .querySelector("#confirmAutoAlert")
      ?.addEventListener("click", () => {
        finishAutomaticAlert("confirmed");
      });

    document
      .querySelector("#cancelAutoAlert")
      ?.addEventListener("click", () => {
        cancelAutomaticConfirmation(true);
      });

    automaticTimer = setInterval(() => {
      automaticSeconds -= 1;

      const countdown = document.querySelector(
        "#automaticCountdown"
      );

      if (countdown) {
        countdown.textContent =
          `${automaticSeconds} segundo` +
          `${automaticSeconds === 1 ? "" : "s"}`;
      }

      if (automaticSeconds <= 0) {
        finishAutomaticAlert("timeout");
      }
    }, 1000);
  }

  // =========================================================
  // REGISTRO DE ALERTA AUTOMÁTICA
  // =========================================================

  async function finishAutomaticAlert(reason) {
    if (
      !automaticConfirmationActive ||
      automaticRequestInProgress
    ) {
      return;
    }

    automaticRequestInProgress = true;
    automaticConfirmationActive = false;

    if (automaticTimer !== null) {
      clearInterval(automaticTimer);
      automaticTimer = null;
    }

    const modalContent = document.querySelector("#modalContent");

    if (modalContent) {
      modalContent.innerHTML = `
        <h2>Registrando alerta</h2>
        <p>
          Obteniendo la ubicación y registrando la solicitud.
        </p>
      `;
    }

    try {
      let position = null;
      try {
        position = await getCurrentPosition();
      } catch (locationError) {
        console.warn("No se pudo obtener la ubicación para el SOS:", locationError);
      }

      const sosResult = await requestSOSFunction({
        type: "automatic_sos",
        message: reason === "timeout"
          ? "Alerta automática: terminó la cuenta regresiva sin respuesta."
          : "Alerta automática: solicitud confirmada por el usuario.",
        location: position ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        } : null
      });

      let locationSaved = false;

      if (position) {
        try {
          await savePosition(position);
          locationSaved = true;
        } catch (error) {
          console.warn("Alerta registrada; no se pudo guardar la ubicación:", error);
        }
      }

      await refreshDashboardSafely();
      const contactsHTML = await buildEmergencyContactsHTML();

      if (typeof openModal === "function") {
        openModal(`
          <div class="sos-confirmation">
            <header class="sos-header">
              <span class="sos-confirmation-icon" aria-hidden="true">!</span>
              <div>
                <small class="sos-kicker">A.M.A.R. · aviso automático</small>
                <h2>Alerta registrada</h2>
              </div>
            </header>
            <p>La solicitud quedó guardada en A.M.A.R.</p>
            <p>${
              locationSaved
                ? "La ubicación también se guardó."
                : "No se pudo guardar la ubicación."
            }</p>
            ${contactsHTML}
            <p class="sos-result-status${Number(sosResult?.email_failed_count) > 0 && Number(sosResult?.email_sent_count) > 0 ? " is-partial" : ""}">
              <strong>${escapeContactHTML(communicationStatusText(sosResult))}</strong>
            </p>
            <p class="sos-disclaimer">
              A.M.A.R. no realiza llamadas automáticas ni activa una alarma en el teléfono de los contactos.
              El envío de un correo no confirma que el destinatario lo haya leído.
            </p>
            <button type="button" class="primary" onclick="closeModal()">Entendido</button>
          </div>
        `);
      }
    } catch (error) {
      console.error(
        "No se pudo registrar la alerta automática:",
        error
      );

      if (typeof openModal === "function") {
        openModal(`
          <h2>Error al registrar la alerta</h2>

          <p>
            Verificá la conexión y tu sesión.
            No se pudo confirmar el registro.
          </p>

          <button
            type="button"
            class="primary"
            onclick="closeModal()"
          >
            Cerrar
          </button>
        `);
      }
    } finally {
      automaticRequestInProgress = false;
      automaticSeconds = 10;
    }
  }

  // =========================================================
  // SOS MANUAL: REGISTRO DESPUÉS DE CONFIRMAR
  // =========================================================

  async function requestManualSOS() {
    if (automaticRequestInProgress) {
      return;
    }

    cancelAutomaticConfirmation(true);
    automaticRequestInProgress = true;

    const button = document.querySelector("#manualSOS");

    if (button) {
      button.disabled = true;
    }

    if (typeof openModal === "function") {
      openModal(`
        <div class="sos-confirmation">
          <h2>Registrando solicitud SOS</h2>
          <p>
            Guardando la solicitud e intentando obtener tu ubicación.
          </p>
        </div>
      `);
    }

    try {

let position = null;
      let locationMessage = "No se pudo obtener la ubicación.";

      try {
        position = await getCurrentPosition();
      } catch (error) {
        console.warn("No se pudo obtener la ubicación para el SOS:", error);
        locationMessage = error.message || locationMessage;
      }

      const result = await requestSOSFunction({
        type: "manual_sos",
        message: "Solicitud manual de ayuda desde A.M.A.R.",
        location: position ? {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        } : null
      });

      const alert = result.alert;
      let locationSaved = false;

      if (position) {
        try {
          await savePosition(position);
          locationSaved = true;
          locationMessage = "Ubicación guardada.";
        } catch (error) {
          console.warn("SOS registrado; ubicación no disponible:", error);
          locationMessage = error.message || "No se pudo guardar la ubicación.";
        }
      }

      await refreshDashboardSafely();
      const contactsHTML = await buildEmergencyContactsHTML();

      if (typeof openModal === "function") {
        openModal(`
          <div class="sos-confirmation">
            <header class="sos-header">
              <span class="sos-confirmation-icon" aria-hidden="true">!</span>
              <div>
                <small class="sos-kicker">A.M.A.R. · solicitud manual</small>
                <h2>Solicitud SOS registrada</h2>
              </div>
            </header>
            <p>La solicitud manual quedó registrada en A.M.A.R.</p>
            <p>${
              locationSaved
                ? "Ubicación guardada correctamente."
                : "No se guardó la ubicación: " +
                  (typeof escapeHTML === "function"
                    ? escapeHTML(locationMessage)
                    : "ubicación no disponible")
            }</p>
            ${contactsHTML}
            <p class="sos-result-status${Number(result?.email_failed_count) > 0 && Number(result?.email_sent_count) > 0 ? " is-partial" : ""}">
              <strong>${escapeContactHTML(communicationStatusText(result))}</strong>
            </p>
            <p class="sos-disclaimer">
              Los botones de teléfono y WhatsApp abren la aplicación para que completes el contacto.
              A.M.A.R. no realiza llamadas automáticas ni activa una alarma remota.
              El envío de un correo no confirma que el destinatario lo haya leído. Si necesitás asistencia inmediata, contactá directamente a los servicios de emergencia.
            </p>
            <button type="button" class="primary" onclick="closeModal()">Entendido</button>
          </div>
        `);
      }

      return alert;
    } catch (error) {
      console.error(
        "No se pudo registrar el SOS:",
        error
      );

      if (typeof openModal === "function") {
        openModal(`
          <h2>No se pudo registrar la solicitud</h2>

          <p>
            Verificá tu sesión y la conexión antes
            de volver a intentarlo.
          </p>

          <button
            type="button"
            class="primary"
            onclick="closeModal()"
          >
            Cerrar
          </button>
        `);
      }

      return null;
    } finally {
      automaticRequestInProgress = false;

      if (button) {
        button.disabled = false;
      }
    }
  }

  // =========================================================
  // SOS MANUAL: VENTANA DE CONFIRMACIÓN DE 10 SEGUNDOS
  // =========================================================

  function initializeManualSOS() {
    const button = document.querySelector("#manualSOS");

    if (
      !button ||
      button.dataset.initialized === "true"
    ) {
      return;
    }

    button.dataset.initialized = "true";

    button.addEventListener("click", () => {
      if (automaticRequestInProgress) {
        return;
      }

      // Evitar que la confirmación manual se superponga
      // con una confirmación automática activa.
      if (automaticConfirmationActive) {
        return;
      }

      if (typeof openModal !== "function") {
        console.error(
          "No está disponible la ventana de confirmación."
        );
        return;
      }

      let seconds = 10;
      let timer = null;
      let finished = false;

      openModal(`
        <div class="sos-confirmation">
          <div class="sos-confirmation-icon" aria-hidden="true">!</div>

          <h2>¿Necesitás ayuda?</h2>

          <p>
            Estás por realizar una solicitud de emergencia.
            Confirmá únicamente si realmente necesitás ayuda.
          </p>

          <p class="sos-countdown">
            Tiempo para confirmar:
            <strong id="manualSOSCountdown">10</strong> s
          </p>

          <button
            type="button"
            class="sos-confirm-button"
            id="confirmManualSOS"
          >
            Confirmar SOS
          </button>

          <button
            type="button"
            class="secondary"
            id="cancelManualSOS"
          >
            Cancelar
          </button>

          <p class="sos-disclaimer">
            Si confirmás, se registrará la alerta y se intentará
            guardar tu ubicación. Si cancelás o termina el contador,
            no se registrará esta solicitud manual.
            A.M.A.R. actualmente no envía mensajes ni realiza
            llamadas automáticamente.
          </p>
        </div>
      `);

      const countdown = document.querySelector(
        "#manualSOSCountdown"
      );

      const confirmButton = document.querySelector(
        "#confirmManualSOS"
      );

      const cancelButton = document.querySelector(
        "#cancelManualSOS"
      );

      function stopCountdown() {
        if (timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      }

      function finishConfirmation() {
        if (finished) {
          return false;
        }

        finished = true;
        stopCountdown();

        return true;
      }

      cancelButton?.addEventListener("click", () => {
        if (!finishConfirmation()) {
          return;
        }

        closeModal();
      });

      confirmButton?.addEventListener("click", () => {
        if (!finishConfirmation()) {
          return;
        }

        closeModal();
        requestManualSOS();
      });

      timer = setInterval(() => {
        if (finished) {
          stopCountdown();
          return;
        }

        seconds -= 1;

        if (countdown) {
          countdown.textContent = String(seconds);
        }

        if (seconds <= 0) {
          finishConfirmation();
          closeModal();
        }
      }, 1000);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeManualSOS,
      { once: true }
    );
  } else {
    initializeManualSOS();
  }

  // =========================================================
  // ENVÍO DE CORREO SOS CON PLANTILLA PREDEFINIDA
  // =========================================================

  async function sendEmergencyEmail(contactId, button) {
    if (!contactId || button?.disabled) return;
    const previousText = button?.textContent || "Enviar aviso por correo";
    if (button) {
      button.disabled = true;
      button.textContent = "Enviando...";
    }

    if (typeof openModal === "function") {
      openModal(`
        <h2>Enviando aviso</h2>
        <p>Enviando el correo de emergencia predefinido al contacto seleccionado.</p>
      `);
    }

    try {
      await getCurrentUser();
      let position = null;
      try {
        position = await getCurrentPosition();
      } catch (locationError) {
        console.info("El aviso se enviará sin ubicación:", locationError.message);
      }

      const { data, error } = await supabaseClient.functions.invoke("amar-email", {
        body: {
          contact_id: contactId,
          location: position ? {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          } : null
        }
      });

      if (error) {
        let detail = "";
        try {
          const payload = await error.context?.json?.();
          detail = payload?.error || payload?.message || "";
        } catch (_) {
          // Usar el mensaje general del SDK si la respuesta no contiene JSON.
        }
        throw new Error(detail || error.message || "No se pudo enviar el correo.");
      }
      if (!data?.success) {
        throw new Error(data?.error || "El servidor no confirmó el envío del correo.");
      }

      if (typeof openModal === "function") {
        openModal(`
          <h2>Correo enviado</h2>
          <p>${escapeContactHTML(data.message || "El aviso se envió correctamente.")}</p>
          <p>Destinatario: <strong>${escapeContactHTML(data.recipient || "")}</strong></p>
          <p class="sos-disclaimer">El mensaje utiliza una plantilla de emergencia predefinida de A.M.A.R.</p>
          <button type="button" class="primary" onclick="closeModal()">Entendido</button>
        `);
      }
    } catch (error) {
      console.error("No se pudo enviar el correo SOS:", error);
      if (typeof openModal === "function") {
        openModal(`
          <h2>No se pudo enviar el correo</h2>
          <p>${escapeContactHTML(error.message || "Ocurrió un error al enviar el aviso.")}</p>
          <p class="sos-disclaimer">El correo no se considera enviado si el servidor no lo confirma.</p>
          <button type="button" class="primary" onclick="closeModal()">Cerrar</button>
        `);
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = previousText;
      }
    }
  }

  function initializeEmergencyEmailButtons() {
    if (document.documentElement.dataset.amarEmailHandler === "true") return;
    document.documentElement.dataset.amarEmailHandler = "true";

    document.addEventListener("click", event => {
      const button = event.target.closest("[data-amar-send-email]");
      if (!button) return;
      event.preventDefault();
      sendEmergencyEmail(button.dataset.amarSendEmail, button);
    });
  }

  // =========================================================
  // API PÚBLICA DEL MÓDULO
  // =========================================================

  initializeEmergencyEmailButtons();

  window.AMARAlerts = {
    registerAlert,
    sendEmergencyEmail,
    captureAndSaveLocation,
    evaluateReading,
    processReading,
    requestManualSOS
  };
})();
