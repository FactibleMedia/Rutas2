const ADMIN_SESSION_KEY = "rutas_admin_session";

export function hasAdminSession() {
  try {
    return Boolean(localStorage.getItem(ADMIN_SESSION_KEY));
  } catch {
    return false;
  }
}

export function getAdminProfile() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(profile) {
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors in restricted environments
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    // ignore storage errors in restricted environments
  }
}
