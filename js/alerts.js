(function () {
  "use strict";

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

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Este navegador no admite geolocalización."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        (error) => {
          const messages = {
            1: "No se concedió permiso para acceder a la ubicación.",
            2: "El navegador no pudo determinar la ubicación.",
            3: "Se agotó el tiempo de espera para obtener la ubicación."
          };

          reject(new Error(messages[error.code] || "No se pudo obtener la ubicación."));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  }

  async function captureAndSaveLocation({ deviceId = null } = {}) {
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

  window.AMARAlerts = {
    registerAlert,
    captureAndSaveLocation
  };
})();
