/**
 * Admin Helpers - Utilidades para manejo de errores de red y UI
 */

/**
 * Detecta si un error es por problema de conexión (offline, timeout, DNS, etc.)
 */
export function isNetworkError(err) {
  if (!err) return false;

  const msg =
    err.message?.toLowerCase() || err.error_description?.toLowerCase() || "";

  // Errores comunes del navegador cuando no hay internet
  // NOTA: NO incluir "typeerror" porque enmascararía bugs reales de JS
  const networkPatterns = [
    "failed to fetch",
    "networkerror",
    "network error",
    "network changed",
    "load failed",
    "internet disconnected",
    "err_internet_disconnected",
    "err_network_changed",
    "err_connection_refused",
    "err_connection_timed_out",
    "err_name_not_resolved",
    "abort",
    "failed to load resource",
  ];

  return networkPatterns.some((pattern) => msg.includes(pattern));
}

/**
 * Detecta si el navegador está offline
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Obtiene un mensaje amigable según el tipo de error
 */
export function getUserFriendlyError(err) {
  if (!err) return "Ocurrió un error inesperado.";

  if (isNetworkError(err) || !navigator.onLine) {
    return "No hay conexión a internet. Verifica tu red y vuelve a intentar.";
  }

  // Errores de Supabase (RLS, permisos, etc.)
  if (err.code === "PGRST301" || err.code === "42501") {
    return "Error de permisos. No tienes acceso a esta información.";
  }

  if (err.code === "23505") {
    return "Este elemento ya existe en la base de datos.";
  }

  // Error 40x
  if (err.code?.startsWith("40")) {
    return "Error de autenticación. Intenta iniciar sesión nuevamente.";
  }

  // Error 50x (servidor)
  if (err.code?.startsWith("50")) {
    return "Error del servidor. Intenta de nuevo más tarde.";
  }

  // Mensaje genérico
  return err.message || "Ocurrió un error inesperado. Intenta de nuevo.";
}

/**
 * Función fetch con reintentos automáticos para errores de red
 * @param {Function} fn - Función async que hace la petición
 * @param {Object} options
 * @param {number} options.maxRetries - Máximo de reintentos (default: 3)
 * @param {number} options.retryDelay - Espera inicial en ms (default: 1000)
 * @param {Function} options.onRetry - Callback en cada reintento
 */
export async function withRetry(fn, options = {}) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt || !isNetworkError(err)) {
        throw err;
      }

      // Esperar con backoff exponencial
      const delay = retryDelay * Math.pow(2, attempt);
      if (onRetry) onRetry(attempt + 1, maxRetries, delay);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Hook para monitorear el estado de la red
 * Retorna { isOnline, wasOffline } y reinicia cuando vuelve la conexión
 */
export function createNetworkMonitor() {
  const listeners = new Set();

  function handleOnline() {
    listeners.forEach((cb) => cb(true));
  }

  function handleOffline() {
    listeners.forEach((cb) => cb(false));
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
  }

  return {
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
        if (listeners.size === 0) {
          window.removeEventListener("online", handleOnline);
          window.removeEventListener("offline", handleOffline);
        }
      };
    },
    isOnline: () => navigator.onLine,
    destroy() {
      listeners.clear();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    },
  };
}
