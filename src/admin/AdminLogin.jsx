import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminProfile, hasAdminSession, setAdminSession } from "./adminAuth";
import { supabase, isSupabaseReady, getSupabaseStatus } from "../supabaseClient";
import logoAdmin from "../assets/mcp/logo_admin.png";
import "./AdminPanel.css";

function getInitials(name) {
  const parts = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.length ? parts.map((p) => p[0].toUpperCase()).join("") : "AD";
}

async function authenticateAdmin(correo, password) {
  const email = correo.trim().toLowerCase();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    throw new Error("Correo o contraseña inválidos.");
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", authData.user.id)
    .eq("rol", "administrador")
    .eq("activo", true)
    .single();

  if (usuarioError || !usuario) {
    await supabase.auth.signOut();
    throw new Error("No tienes permisos de administrador en este sistema.");
  }

  return {
    name: usuario.nombre,
    email: usuario.correo,
    initials: getInitials(usuario.nombre),
  };
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");

    if (!isSupabaseReady()) {
      setAuthError(getSupabaseStatus().message);
      return;
    }

    setIsLoading(true);

    try {
      const adminProfile = await authenticateAdmin(email, password);
      setIsLoading(false);
      setAdminSession(adminProfile);
      navigate("/admin/panel", { replace: true });
    } catch (error) {
      setIsLoading(false);
      setAuthError(error?.message || "No se pudo iniciar sesión. Intenta de nuevo.");
    }
  };

  return (
    <div className="admin-login-wrapper">
      <div className="admin-login-form">
        <div className="admin-login-form__inner">
          {/* Brand - Logo central */}
          <div className="admin-login-form__brand">
            <img src={logoAdmin} alt="Rutas de Valledupar" className="admin-login-form__logo" />
            <p className="admin-login-form__brand-subtitle">
              Panel Administrativo
            </p>
          </div>

          {/* Card */}
          <div
            className="admin-card"
            style={{
              padding: 32,
              position: "relative",
              paddingTop: 40,
            }}
          >
            {/* Top decorative border */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                opacity: 0.3,
                borderTopLeftRadius: "var(--radius-xl)",
                borderTopRightRadius: "var(--radius-xl)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: "radial-gradient(circle at center, var(--primary) 2px, transparent 2px)",
                  backgroundSize: "12px 4px",
                }}
              />
            </div>

            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                textAlign: "center",
                margin: "0 0 24px",
                color: "var(--on-surface)",
              }}
            >
              Iniciar Sesión
            </h2>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Email */}
              <div style={{ margin: 0 }}>
                <label
                  className="admin-form-label"
                  htmlFor="login-email"
                  style={{ marginBottom: 8 }}
                >
                  Correo Electrónico
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--outline)",
                      fontSize: 20,
                    }}
                  >
                    mail
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@rutasvallenatas.co"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 0 12px 32px",
                      border: "none",
                      borderBottom: "2px solid var(--outline-variant)",
                      background: "var(--surface-container-low)",
                      fontFamily: "var(--font-body)",
                      fontSize: 16,
                      color: "var(--on-surface)",
                      outline: "none",
                      transition: "border-color 0.2s ease, background 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.background = "var(--surface-container-lowest)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--outline-variant)";
                      e.target.style.background = "var(--surface-container-low)";
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ margin: 0 }}>
                <label
                  className="admin-form-label"
                  htmlFor="login-password"
                  style={{ marginBottom: 8 }}
                >
                  Contraseña
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    className="material-symbols-outlined"
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--outline)",
                      fontSize: 20,
                    }}
                  >
                    lock
                  </span>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width: "100%",
                      padding: "12px 0 12px 32px",
                      border: "none",
                      borderBottom: "2px solid var(--outline-variant)",
                      background: "var(--surface-container-low)",
                      fontFamily: "var(--font-body)",
                      fontSize: 16,
                      color: "var(--on-surface)",
                      outline: "none",
                      transition: "border-color 0.2s ease, background 0.2s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "var(--primary)";
                      e.target.style.background = "var(--surface-container-lowest)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--outline-variant)";
                      e.target.style.background = "var(--surface-container-low)";
                    }}
                  />
                </div>
              </div>

              {/* Remember me & Forgot */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: 16,
                      height: 16,
                      accentColor: "var(--primary)",
                      cursor: "pointer",
                    }}
                  />
                  <span style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>Recordarme</span>
                </label>
                <a
                  href="#"
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    color: "var(--primary)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="admin-btn admin-btn--primary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px 24px",
                  fontSize: 16,
                  marginTop: 8,
                  letterSpacing: "0.05em",
                  position: "relative",
                }}
              >
                {isLoading ? (
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }}
                  />
                ) : (
                  <>
                    Entrar
                    <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>
                      login
                    </span>
                  </>
                )}
              </button>
            </form>

            {authError && (
              <p
                style={{
                  margin: "16px 0 0",
                  textAlign: "center",
                  color: "var(--error)",
                  fontSize: 14,
                  fontWeight: 600,
                  whiteSpace: "pre-line",
                  fontFamily: "monospace",
                  background: "var(--error-container)",
                  padding: 12,
                  borderRadius: "var(--radius-lg)",
                  lineHeight: 1.5,
                }}
              >
                {authError}
              </p>
            )}

            {/* Folk Divider */}
            <div className="admin-folk-divider" style={{ marginTop: 24, marginBottom: 24 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--outline-variant)" }}>
                local_fire_department
              </span>
            </div>

            {/* Social Login */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  border: "1px solid var(--outline-variant)",
                  background: "var(--surface-container-low)",
                  padding: "12px 16px",
                }}
              >
                <svg style={{ width: 20, height: 20, marginRight: 8 }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Continuar con Google
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  border: "1px solid var(--outline-variant)",
                  background: "var(--surface-container-low)",
                  padding: "12px 16px",
                }}
              >
                <svg style={{ width: 20, height: 20, marginRight: 8, color: "#1877F2" }} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Continuar con Facebook
              </button>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <p style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>
              ¿No tienes una cuenta?{" "}
              <a
                href="#"
                style={{
                  color: "var(--primary)",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
              >
                Solicitar acceso
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
