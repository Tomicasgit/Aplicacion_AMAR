import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Método no permitido." }, 405);

  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return respond({ error: "Debés iniciar sesión para enviar el aviso." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !supabaseKey) {
    return respond({ error: "La configuración de Supabase está incompleta." }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authorization.slice("Bearer ".length);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) {
    return respond({ error: "La sesión venció. Volvé a iniciar sesión." }, 401);
  }

  let body: { contact_id?: string; location?: { latitude?: number; longitude?: number } | null };
  try {
    body = await req.json();
  } catch {
    return respond({ error: "La solicitud no tiene un formato válido." }, 400);
  }

  if (!body.contact_id || typeof body.contact_id !== "string") {
    return respond({ error: "No se indicó el contacto destinatario." }, 400);
  }

  const { data: contact, error: contactError } = await supabase
    .from("emergency_contacts")
    .select("id, name, email")
    .eq("id", body.contact_id)
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (contactError || !contact) {
    return respond({ error: "No se encontró ese contacto en tu lista de emergencia." }, 404);
  }
  if (!contact.email?.trim()) {
    return respond({ error: "Ese contacto no tiene un correo electrónico registrado." }, 400);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    return respond({
      error: "El envío de correo no está habilitado en el servidor. Falta configurar el servicio de correo.",
      configuration_required: true,
    }, 503);
  }

  const location = body.location &&
      Number.isFinite(body.location.latitude) &&
      Number.isFinite(body.location.longitude) &&
      body.location.latitude! >= -90 && body.location.latitude! <= 90 &&
      body.location.longitude! >= -180 && body.location.longitude! <= 180
    ? { latitude: body.location.latitude!, longitude: body.location.longitude! }
    : null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", authData.user.id)
    .maybeSingle();

  const userName = profile?.name || authData.user.email || "Una persona usuaria de A.M.A.R.";
  const subject = "A.M.A.R. — Solicitud de ayuda";
  const text = [
    "AVISO DE EMERGENCIA — A.M.A.R.",
    "",
    `Hola ${contact.name || "contacto de emergencia"}:`,
    "",
    `${userName} ha solicitado ayuda desde A.M.A.R. (Asistente de Monitoreo Autónomo de Ritmo).`,
    "",
    location
      ? `Ubicación disponible: https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : "No se pudo compartir una ubicación actual.",
    "",
    "Por favor, intentá comunicarte con la persona para verificar que se encuentre bien.",
    "",
    "Este mensaje es una notificación automática del prototipo A.M.A.R.; no confirma una emergencia médica ni sustituye los servicios de emergencia.",
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [contact.email.trim()],
        subject,
        text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("El proveedor de correo rechazó el aviso:", response.status, detail.slice(0, 400));
      return respond({
        error: "El proveedor rechazó el correo. Revisá el remitente verificado y la configuración del servicio.",
      }, 502);
    }

    return respond({
      success: true,
      recipient: contact.email.trim(),
      message: "El correo de aviso se envió correctamente.",
    });
  } catch (error) {
    console.error("No se pudo enviar el correo de emergencia:", error);
    return respond({ error: "No se pudo conectar con el servicio de correo." }, 502);
  }
});
