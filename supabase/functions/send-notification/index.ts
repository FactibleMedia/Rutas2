// ============================================================
// Supabase Edge Function: send-notification
//
// Envía correos electrónicos usando Resend con las plantillas
// HTML configuradas en la tabla admin_config.
//
// Variables de entorno requeridas (Supabase Secrets):
//   RESEND_API_KEY     - API Key de Resend
//   SUPABASE_URL       - URL del proyecto Supabase (inyectada por defecto)
//   SUPABASE_SERVICE_ROLE_KEY - Service Role Key (inyectada por defecto)
//
// Uso: POST /send-notification
// Body:
// {
//   tipo: "nueva_palabra" | "palabra_aceptada" | "palabra_rechazada"
//       | "nueva_ruta" | "nueva_galeria",
//   destinatario: "email@example.com",        // Email del destinatario
//   variables: {                                // Variables para los placeholders
//     admin_name: "Admin",
//     usuario_nombre: "Carlos",
//     palabra: "Mochila",
//     significado: "...",
//     categoria: "Objeto",
//     motivo: "Ya existe",
//     titulo: "Plaza Alfonso",
//     descripcion: "...",
//     tipo_multimedia: "Fotografía",
//     tipo_sitio: "Patrimonial",
//     panel_url: "https://...",
//     sitio_url: "https://..."
//   }
// }
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ============================================================
// Tipos
// ============================================================
interface NotificationRequest {
  tipo: TipoNotificacion;
  destinatario: string;
  variables: Record<string, string>;
}

type TipoNotificacion =
  | "nueva_palabra"
  | "palabra_aceptada"
  | "palabra_rechazada"
  | "nueva_ruta"
  | "nueva_galeria";

// Mapa de tipos a claves de plantilla en admin_config
const TEMPLATE_MAP: Record<TipoNotificacion, string> = {
  nueva_palabra: "template_nueva_palabra",
  palabra_aceptada: "template_palabra_aceptada",
  palabra_rechazada: "template_palabra_rechazada",
  nueva_ruta: "template_nueva_ruta",
  nueva_galeria: "template_nueva_galeria",
};

// Mapa de tipos a asuntos de correo
const SUBJECT_MAP: Record<TipoNotificacion, string> = {
  nueva_palabra: "📖 Nueva palabra sugerida en el Glosario Vallenato",
  palabra_aceptada: "✅ Tu palabra fue aceptada en el Glosario Vallenato",
  palabra_rechazada: "📝 Actualización sobre tu sugerencia en el Glosario",
  nueva_ruta: "🗺️ Nueva ruta sugerida en Rutas Vallenatas",
  nueva_galeria: "🖼️ Nuevo contenido multimedia sugerido",
};

// ============================================================
// Cliente Supabase (Deno)
// ============================================================
function createSupabaseClient(supabaseUrl: string, serviceRoleKey: string) {
  const headers = {
    "Content-Type": "application/json",
    "apikey": serviceRoleKey,
    "Authorization": `Bearer ${serviceRoleKey}`,
  };

  return {
    /** Obtiene el valor de una config por su clave */
    async getConfig(clave: string): Promise<string | null> {
      const url = `${supabaseUrl}/rest/v1/admin_config?clave=eq.${encodeURIComponent(clave)}&select=valor`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error(`Error fetching config "${clave}":`, await res.text());
        return null;
      }
      const data = await res.json();
      return data?.[0]?.valor ?? null;
    },

    /** Obtiene múltiples configs a la vez usando or filter */
    async getConfigs(claves: string[]): Promise<Record<string, string | null>> {
      const conditions = claves
        .map((c) => `clave.eq.${encodeURIComponent(c)}`)
        .join(",");
      const url = `${supabaseUrl}/rest/v1/admin_config?or=(${conditions})&select=clave,valor`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.error("Error fetching configs:", await res.text());
        return {};
      }
      const data = await res.json();
      const result: Record<string, string | null> = {};
      for (const item of data || []) {
        result[item.clave] = item.valor;
      }
      // Asegurar que todas las claves tengan al menos null
      for (const c of claves) {
        if (!(c in result)) result[c] = null;
      }
      return result;
    },

    /** Registra actividad en el log */
    async logActivity(detalle: string): Promise<void> {
      const url = `${supabaseUrl}/rest/v1/actividad_admin`;
      const body = {
        accion: "Notificación enviada",
        detalle,
        tipo: "general",
      };
      await fetch(url, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify(body),
      }).catch((e) => console.error("Error logging activity:", e));
    },
  };
}

// ============================================================
// Reemplazo de placeholders en la plantilla HTML
// ============================================================
function renderTemplate(template: string, variables: Record<string, string>): string {
  let html = template;
  for (const [key, value] of Object.entries(variables)) {
    // Busca {{key}} en la plantilla y lo reemplaza
    html = html.replace(
      new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, "g"),
      escapeHtml(value),
    );
  }
  return html;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// Envío de correo con Resend
// ============================================================
async function sendEmail(
  resendApiKey: string,
  from_email: string,
  from_name: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${from_name} <${from_email}>`,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      return {
        success: false,
        message: data?.message || data?.error || "Error desconocido de Resend",
      };
    }

    return {
      success: true,
      message: `Email enviado correctamente. ID: ${data?.id || "N/A"}`,
    };
  } catch (err) {
    console.error("Error sending email:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al enviar el correo",
    };
  }
}

// ============================================================
// Handler principal
// ============================================================
serve(async (req: Request) => {
  // --- CORS ---
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Solo aceptar POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // --- Leer body ---
    const body: NotificationRequest = await req.json();

    if (!body.tipo || !body.destinatario) {
      return new Response(
        JSON.stringify({ error: "Faltan campos requeridos: tipo, destinatario" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Validar tipo de notificación ---
    const templateKey = TEMPLATE_MAP[body.tipo];
    if (!templateKey) {
      return new Response(
        JSON.stringify({
          error: `Tipo de notificación inválido: "${body.tipo}". Validos: ${Object.keys(TEMPLATE_MAP).join(", ")}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Obtener variables de entorno ---
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY no configurada en secrets" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Variables de entorno de Supabase no disponibles" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Obtener configuraciones de Supabase ---
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // Obtener todas las configs necesarias en una sola consulta
    const neededKeys = [templateKey, "resend_from_email", "resend_from_name", `notif_${body.tipo}`];
    const configs = await supabase.getConfigs(neededKeys);
    const templateHtml = configs[templateKey];
    const resendFromEmail = configs["resend_from_email"];
    const resendFromName = configs["resend_from_name"];
    const notifEnabled = configs[`notif_${body.tipo}`];

    // --- Verificar si la notificación está habilitada ---
    if (notifEnabled === "false") {
      console.log(`Notificación "${body.tipo}" deshabilitada, omitiendo.`);
      return new Response(
        JSON.stringify({ success: true, message: "Notificación deshabilitada, omitida." }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // --- Verificar que la plantilla exista ---
    if (!templateHtml) {
      return new Response(
        JSON.stringify({
          error: `Plantilla "${templateKey}" no encontrada en admin_config. Ejecuta el script SQL de configuración.`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const fromEmail = resendFromEmail || "notificaciones@rutasvallenatas.co";
    const fromName = resendFromName || "Rutas Vallenatas";

    // --- Renderizar la plantilla con las variables ---
    const renderedHtml = renderTemplate(templateHtml, {
      admin_name: "Admin",
      ...body.variables,
    });

    // --- Obtener el asunto ---
    const subject = SUBJECT_MAP[body.tipo];

    // --- Enviar el correo ---
    const result = await sendEmail(
      resendApiKey,
      fromEmail,
      fromName,
      body.destinatario,
      subject,
      renderedHtml,
    );

    // --- Registrar actividad ---
    await supabase.logActivity(
      `Notificación "${body.tipo}" enviada a ${body.destinatario}: ${result.success ? "✅ Éxito" : "❌ " + result.message}`,
    );

    // --- Respuesta ---
    const statusCode = result.success ? 200 : 500;
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Error general:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Error interno del servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
