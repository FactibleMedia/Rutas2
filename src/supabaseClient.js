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
