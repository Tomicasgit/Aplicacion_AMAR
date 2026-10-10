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
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }

  async function captureAndSaveLocation({
    deviceId = null
  } = {}) {
    const user = await getCurrentUser();
    const position = await getCurrentPosition();

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

    // Solo iniciar al entrar en estado crítico.
    // No reiniciar el temporizador por cada paquete BLE.
    if (
      result.level === "critical" &&
      previous !== "critical"
    ) {
      startAutomaticConfirmation(result);
    }

    // Una lectura válida normal o de precaución cancela
    // una confirmación automática todavía pendiente.
    if (
      result.level === "normal" ||
      result.level === "warning"
    ) {
      cancelAutomaticConfirmation(true);
    }

    return {
      ...result,
      changed: result.level !== previous,
      previousLevel: previous
    };
  }

  // =========================================================
  // CANCELACIÓN DEL TEMPORIZADOR
  // =========================================================

  function cancelAutomaticConfirmation(closeWindow = true) {
    const wasActive = automaticConfirmationActive;

    if (automaticTimer !== null) {
      clearInterval(automaticTimer);
      automaticTimer = null;
    }

    automaticConfirmationActive = false;
    automaticSeconds = 10;

    // Cerrar únicamente el modal que pertenece
    // a la confirmación automática.
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

      <p>
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

      <p class="empty">
        Esta función registra la alerta e intenta guardar
        la ubicación. No envía mensajes ni realiza llamadas.
      </p>
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
          Guardando la solicitud e intentando obtener la ubicación.
        </p>
      `;
    }

    try {
      await registerAlert({
        type: "device",
        message: reason === "timeout"
          ? "Alerta automática: terminó la cuenta regresiva sin respuesta."
          : "Alerta automática: solicitud confirmada por el usuario."
      });

      let locationSaved = false;

      try {
        await captureAndSaveLocation();
        locationSaved = true;
      } catch (error) {
        console.warn(
          "Alerta registrada; no se pudo guardar la ubicación:",
          error
        );
      }

      if (typeof openModal === "function") {
        openModal(`
          <h2>Alerta registrada</h2>

          <p>
            La solicitud quedó guardada en A.M.A.R.
          </p>

          <p>
            ${
              locationSaved
                ? "La ubicación también se guardó."
                : "No se pudo guardar la ubicación."
            }
          </p>

          <p>
            <strong>
              Esta acción no envía mensajes ni realiza llamadas.
            </strong>
          </p>

          <button
            type="button"
            class="primary"
            onclick="closeModal()"
          >
            Entendido
          </button>
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
  // SOS MANUAL: SIN ESPERAR LOS 10 SEGUNDOS
  // =========================================================

  async function requestManualSOS() {
    if (automaticRequestInProgress) {
      return;
    }

    // Detener una cuenta regresiva pendiente.
    cancelAutomaticConfirmation(true);

    automaticRequestInProgress = true;

    const button = document.querySelector("#manualSOS");

    if (button) {
      button.disabled = true;
    }

    try {
      const alert = await registerAlert({
        type: "sos",
        message: "Solicitud manual de ayuda desde A.M.A.R."
      });

      let locationSaved = false;
      let locationMessage =
        "No se pudo guardar la ubicación.";

      try {
        await captureAndSaveLocation();
        locationSaved = true;
        locationMessage = "Ubicación guardada.";
      } catch (error) {
        console.warn(
          "SOS registrado; ubicación no disponible:",
          error
        );

        locationMessage =
          error.message || locationMessage;
      }

      if (typeof openModal === "function") {
        openModal(`
          <h2>Solicitud SOS registrada</h2>

          <p>
            La solicitud manual quedó registrada en A.M.A.R.
          </p>

          <p>
            ${
              locationSaved
                ? "Ubicación guardada correctamente."
                : "No se guardó la ubicación: " +
                  (typeof escapeHTML === "function"
                    ? escapeHTML(locationMessage)
                    : "ubicación no disponible")
            }
          </p>

          <p>
            <strong>
              Esta acción no realiza llamadas ni envía
              mensajes a tus contactos.
            </strong>
          </p>

          <button
            type="button"
            class="primary"
            onclick="closeModal()"
          >
            Entendido
          </button>
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
  // INICIALIZACIÓN DEL BOTÓN SOS
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

    button.addEventListener(
      "click",
      requestManualSOS
    );
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
  // API PÚBLICA DEL MÓDULO
  // =========================================================

  window.AMARAlerts = {
    registerAlert,
    captureAndSaveLocation,
    evaluateReading,
    processReading,
    requestManualSOS
  };
})();
