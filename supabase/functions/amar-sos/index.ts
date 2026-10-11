
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
    .select("id")
    .eq("user_id", userData.user.id);

  if (contactsError) {
    console.error("No se pudieron consultar los contactos");
    return respond({
      success: true,
      alert,
      contacts_checked: false,
      message: "Alerta registrada; no se pudieron consultar los contactos",
      communications_sent: false,
    });
  }

  return respond({
    success: true,
    alert,
    contacts_count: contacts.length,
    communications_sent: false,
    message: "Alerta registrada. No se realizaron llamadas ni envíos.",
  });
});
