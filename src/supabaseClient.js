import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

if (!isConfigured) {
  console.warn(
    "[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local. El modo offline usará datos locales."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Verifica si Supabase está configurado con credenciales válidas */
export function isSupabaseReady() {
  return isConfigured;
}

/** Obtiene un mensaje descriptivo sobre el estado de Supabase */
export function getSupabaseStatus() {
  if (!isConfigured) {
    return {
      ready: false,
      message:
        "Supabase no está configurado. Crea un archivo .env.local en la raíz del proyecto con:\n" +
        "VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n" +
        "VITE_SUPABASE_ANON_KEY=eyJhbGciOi...tu-llave-anon",
    };
  }
  return { ready: true, message: "Supabase configurado correctamente." };
}

/**
 * Escucha cambios de conectividad y refresca la sesión automáticamente
 * cuando se restablece la conexión.
 * Útil para recuperarse de errores ERR_INTERNET_DISCONNECTED
 */
export function setupReconnectionHandler() {
  if (typeof window === "undefined") return;

  let wasOffline = false;

  const handleOnline = async () => {
    if (wasOffline) {
      console.log("[Supabase] Conexión restablecida. Refrescando sesión...");
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn("[Supabase] Error al refrescar sesión tras reconexión:", error.message);
        }
      } catch {
        // Silencioso - el próximo intento de fetch refrescará automáticamente
      }
      wasOffline = false;
    }
  };

  const handleOffline = () => {
    wasOffline = true;
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

// Auto-ejecutar al importar
if (typeof window !== "undefined") {
  setupReconnectionHandler();
}
