// ============================================================
// notifications.js - Invocar Edge Function send-notification
// ============================================================
// Funciones helper para enviar notificaciones desde cualquier
// parte de la app (GlossaryManager, GalleryManager, etc.)
// ============================================================

import { supabase } from "../supabaseClient";

/**
 * Envía una notificación por correo usando Resend + plantillas HTML.
 *
 * @param {Object} options
 * @param {string} options.tipo - Tipo: "nueva_palabra" | "palabra_aceptada" | "palabra_rechazada" | "nueva_ruta" | "nueva_galeria"
 * @param {string} options.destinatario - Email del destinatario
 * @param {Object} options.variables - Variables para placeholders en la plantilla
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendNotification({ tipo, destinatario, variables = {} }) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "send-notification",
      {
        method: "POST",
        body: { tipo, destinatario, variables },
      },
    );

    if (error) {
      console.error(`Error sending "${tipo}" notification:`, error);
      return { success: false, message: error.message || "Error al enviar notificación" };
    }

    return { success: true, message: data?.message || "Notificación enviada" };
  } catch (err) {
    console.error(`Error invoking send-notification:`, err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error de red",
    };
  }
}

/**
 * Helper: Notificar al admin sobre una nueva palabra sugerida.
 */
export async function notifyNewWord({
  adminEmail,
  usuarioNombre,
  palabra,
  significado,
  categoria,
}) {
  return sendNotification({
    tipo: "nueva_palabra",
    destinatario: adminEmail,
    variables: {
      usuario_nombre: usuarioNombre,
      palabra,
      significado,
      categoria,
      panel_url: `${window.location.origin}/admin/panel/glosario`,
    },
  });
}

/**
 * Helper: Notificar al usuario que su palabra fue aceptada.
 */
export async function notifyWordAccepted({
  userEmail,
  usuarioNombre,
  palabra,
  significado,
}) {
  return sendNotification({
    tipo: "palabra_aceptada",
    destinatario: userEmail,
    variables: {
      usuario_nombre: usuarioNombre,
      palabra,
      significado,
      sitio_url: window.location.origin,
    },
  });
}

/**
 * Helper: Notificar al usuario que su palabra fue rechazada.
 */
export async function notifyWordRejected({
  userEmail,
  usuarioNombre,
  palabra,
  motivo,
}) {
  return sendNotification({
    tipo: "palabra_rechazada",
    destinatario: userEmail,
    variables: {
      usuario_nombre: usuarioNombre,
      palabra,
      motivo: motivo || "No cumple con los criterios de calidad del glosario.",
    },
  });
}

/**
 * Helper: Notificar al admin sobre una nueva ruta sugerida.
 */
export async function notifyNewRoute({
  adminEmail,
  usuarioNombre,
  titulo,
  descripcion,
}) {
  return sendNotification({
    tipo: "nueva_ruta",
    destinatario: adminEmail,
    variables: {
      usuario_nombre: usuarioNombre,
      titulo,
      descripcion,
      panel_url: `${window.location.origin}/admin/panel/rutas`,
    },
  });
}

/**
 * Helper: Notificar al admin sobre nuevo contenido multimedia.
 */
export async function notifyNewGalleryItem({
  adminEmail,
  usuarioNombre,
  titulo,
  descripcion,
  tipoMultimedia,
  tipoSitio,
}) {
  return sendNotification({
    tipo: "nueva_galeria",
    destinatario: adminEmail,
    variables: {
      usuario_nombre: usuarioNombre,
      titulo,
      descripcion,
      tipo_multimedia: tipoMultimedia,
      tipo_sitio: tipoSitio,
      panel_url: `${window.location.origin}/admin/panel/galeria`,
    },
  });
}

/**
 * Helper: Enviar correo de bienvenida al nuevo usuario registrado.
 * Incluye sus credenciales (email y contraseña) para que las recuerde.
 */
export async function notifyWelcome({
  userEmail,
  usuarioNombre,
  usuarioPassword,
}) {
  return sendNotification({
    tipo: "bienvenida",
    destinatario: userEmail,
    variables: {
      usuario_nombre: usuarioNombre,
      usuario_email: userEmail,
      usuario_password: usuarioPassword || "********",
      sitio_url: window.location.origin,
    },
  });
}
