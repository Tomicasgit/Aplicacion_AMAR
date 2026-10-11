
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Método no permitido" }, 405);
  }

  const authorization = req.headers.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return respond({ error: "Falta la autenticación" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseKey) {
    console.error("Falta configurar Supabase en el entorno");
    return respond({ error: "Configuración del servidor incompleta" }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: { Authorization: authorization },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !userData.user) {
    return respond({ error: "Sesión inválida o vencida" }, 401);
  }

  let body: {
    type?: string;
    message?: string;
    device_id?: string;
    location?: {
      latitude?: number;
      longitude?: number;
    } | null;
  };

  try {
    body = await req.json();
  } catch {
    return respond({ error: "El cuerpo debe ser JSON válido" }, 400);
  }

  const allowedTypes = ["manual_sos", "automatic_sos"];

  if (!body.type || !allowedTypes.includes(body.type)) {
    return respond({ error: "Tipo de alerta no válido" }, 400);
  }

  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim().slice(0, 500)
      : body.type === "manual_sos"
        ? "Solicitud manual de SOS"
        : "Solicitud automática de SOS";

  // La ubicación es opcional: un permiso denegado nunca debe bloquear el SOS.
  const location =
    body.location &&
    Number.isFinite(body.location.latitude) &&
    Number.isFinite(body.location.longitude) &&
    body.location.latitude! >= -90 &&
    body.location.latitude! <= 90 &&
    body.location.longitude! >= -180 &&
    body.location.longitude! <= 180
      ? {
          latitude: body.location.latitude!,
          longitude: body.location.longitude!,
        }
      : null;

  const { data: alert, error: insertError } = await supabase
    .from("alerts")
    .insert({
      user_id: userData.user.id,
      type: body.type,
      message,
      status: "new",
    })
    .select("id, created_at, status")
    .single();

  if (insertError || !alert) {
    console.error("No se pudo registrar la alerta:", insertError?.message);
    return respond({ error: "No se pudo registrar la alerta" }, 500);
  }

  const { data: contacts, error: contactsError } = await supabase
    .from("emergency_contacts")
    .select("id, name, email")
    .eq("user_id", userData.user.id);

  if (contactsError) {
    console.error("No se pudieron consultar los contactos:", contactsError.message);
    return respond({
      success: true,
      alert,
      contacts_checked: false,
      communications_sent: false,
      message: "La alerta quedó registrada, pero no se pudieron consultar los contactos.",
    });
  }

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("RESEND_FROM_EMAIL");
  const emailContacts = (contacts ?? []).filter(
    (contact) => typeof contact.email === "string" && contact.email.trim()
  );

  let emailSentCount = 0;
  let emailFailedCount = 0;
  let emailConfigured = Boolean(resendApiKey && fromEmail);

  if (emailConfigured && emailContacts.length > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userData.user.id)
      .maybeSingle();

    const subject = body.type === "manual_sos"
      ? "A.M.A.R. — Solicitud de ayuda"
      : "A.M.A.R. — Alerta automática";
    const safeText = [
      "Se registró una alerta en A.M.A.R.",
      "",
      `Usuario: ${profile?.name || userData.user.email || "Usuario A.M.A.R."}`,
      `Tipo: ${body.type === "manual_sos" ? "Solicitud manual de ayuda" : "Alerta automática"}`,
      `Detalle: ${message}`,
      location
        ? `Ubicación: https://www.google.com/maps?q=${location.latitude},${location.longitude}`
        : "Ubicación: no disponible o sin permiso.",
      `Fecha: ${new Date(alert.created_at).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}`,
      "",
      "Esta notificación no confirma que el usuario esté recibiendo atención médica. Si corresponde, comunicate directamente con él.",
    ].join("\n");

    for (const contact of emailContacts) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [contact.email.trim()],
            subject,
            text: safeText,
          }),
        });

        if (!response.ok) {
          const detail = await response.text();
          console.error("Resend rechazó un correo SOS:", response.status, detail.slice(0, 300));
          emailFailedCount++;
        } else {
          emailSentCount++;
        }
      } catch (sendError) {
        console.error("Falló el envío de correo SOS:", sendError);
        emailFailedCount++;
      }
    }
  }

  const communicationsSent = emailSentCount > 0;
  let resultMessage = "Alerta registrada.";

  if (!emailConfigured) {
    resultMessage += " Falta configurar RESEND_API_KEY y RESEND_FROM_EMAIL para enviar correos.";
  } else if (emailContacts.length === 0) {
    resultMessage += " No hay contactos con correo electrónico.";
  } else if (emailFailedCount > 0) {
    resultMessage += ` Correos enviados: ${emailSentCount}; fallidos: ${emailFailedCount}.`;
  } else {
    resultMessage += ` Se enviaron ${emailSentCount} correo(s) de aviso.`;
  }

  return respond({
    success: true,
    alert,
    contacts_count: contacts?.length ?? 0,
    email_contacts_count: emailContacts.length,
    email_configured: emailConfigured,
    email_sent_count: emailSentCount,
    email_failed_count: emailFailedCount,
    communications_sent: communicationsSent,
    message: resultMessage,
  });
});
