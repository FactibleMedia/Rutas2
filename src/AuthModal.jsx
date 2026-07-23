import { useState } from "react";
import { supabase } from "./supabaseClient";
import TermsModal from "./TermsModal";
import { notifyWelcome } from "./lib/notifications";
import "./AuthModal.css";

/* =========================================================
   AUTH MODAL – Register / Login / Recovery
   ========================================================= */

export default function AuthModal({ onClose, onAuthSuccess, initialView }) {
  const [currentView, setCurrentView] = useState(initialView || "register"); // register | login | recovery
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      if (currentView === "register") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              nombre: form.nombre,
              apellido: form.apellido,
            },
          },
        });

        if (signUpError) throw signUpError;

        setMessage(`¡Registro exitoso! Bienvenido, ${form.nombre}.`);

        // Enviar correo de bienvenida con credenciales vía Resend
        notifyWelcome({
          userEmail: form.email,
          usuarioNombre: `${form.nombre} ${form.apellido}`,
          usuarioPassword: form.password,
        });

        // Profile is created automatically by the SQL trigger handle_nuevo_usuario
        setTimeout(() => {
          onAuthSuccess({
            name: `${form.nombre} ${form.apellido}`,
            email: form.email,
          });
        }, 1200);
      } else if (currentView === "login") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (signInError) throw signInError;

        // Fetch profile
        let displayName = form.email;
        let isAdmin = false;
        let avatar = "";

        if (data?.user) {
          const uid = data.user.id;

          // Fetch profile from perfiles_usuario (may not exist for admins created via admin panel)
          const { data: perfil } = await supabase
            .from("perfiles_usuario")
            .select("nombre, apellido, foto_perfil")
            .eq("id", uid)
            .maybeSingle();

          if (perfil) {
            displayName = `${perfil.nombre} ${perfil.apellido}`;
            avatar = perfil.foto_perfil || "";
          } else {
            // Fallback: try to get name and avatar from usuarios table (admin users)
            const { data: adminProfile } = await supabase
              .from("usuarios")
              .select("nombre, correo, avatar_url")
              .eq("id", uid)
              .maybeSingle();

            if (adminProfile) {
              displayName = adminProfile.nombre || adminProfile.correo;
              avatar = adminProfile.avatar_url || "";
            }
          }

          // Check if user is also an admin
          const { data: adminUser } = await supabase
            .from("usuarios")
            .select("id")
            .eq("id", uid)
            .eq("rol", "administrador")
            .eq("activo", true)
            .maybeSingle();

          isAdmin = !!adminUser;
        }

        setMessage(`¡Bienvenido de nuevo!`);
        setTimeout(() => {
          onAuthSuccess({ name: displayName, email: form.email, isAdmin, avatar });
        }, 800);
      } else if (currentView === "recovery") {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(form.email, {
          redirectTo: `${window.location.origin}/inicio`,
        });

        if (recoveryError) throw recoveryError;

        setMessage(`Instrucciones enviadas a ${form.email}`);
      }
    } catch (err) {
      setError(err.message || "Ocurrió un error. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/inicio`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(err.message || "Error al conectar con Google.");
      setLoading(false);
    }
  };

  const notifText = message || error;
  const isError = !!error;

  return (
    <div className="auth-modal__overlay" onClick={onClose}>
      <div className="auth-modal__card" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="auth-modal__close" onClick={onClose} aria-label="Cerrar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Notification / Error */}
        {notifText && (
          <div
            className="auth-modal__notification"
            style={{ background: isError ? "#992222" : "#BF5B27" }}
          >
            {notifText}
          </div>
        )}

        {/* Title */}
        <div className="auth-modal__title">
          <h2>
            {currentView === "register" && "REGISTRO"}
            {currentView === "login" && "INICIAR SESIÓN"}
            {currentView === "recovery" && "RECUPERAR"}
          </h2>
          {currentView === "recovery" && <p>Contraseña</p>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-modal__form">
          {currentView === "register" && (
            <>
              <input
                type="text"
                name="nombre"
                placeholder="Nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="auth-modal__input"
              />
              <input
                type="text"
                name="apellido"
                placeholder="Apellido"
                value={form.apellido}
                onChange={handleChange}
                required
                className="auth-modal__input"
              />
            </>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="auth-modal__input"
          />

          {currentView !== "recovery" && (
            <input
              type="password"
              name="password"
              placeholder="Contraseña"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
              className="auth-modal__input"
            />
          )}

          {/* Links */}
          {currentView === "register" && (
            <div style={{ textAlign: "center" }}>
              <button type="button" className="auth-modal__link" onClick={() => setShowTerms(true)}>
                Términos y condiciones
              </button>
            </div>
          )}

          {currentView === "login" && (
            <div style={{ textAlign: "right" }}>
              <button
                type="button"
                className="auth-modal__link"
                onClick={() => { setCurrentView("recovery"); setMessage(""); setError(""); }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Submit */}
          <button type="submit" className="auth-modal__btn-primary" disabled={loading}>
            {loading ? (
              <span className="auth-modal__spinner" />
            ) : (
              <>
                {currentView === "register" && "REGISTRARME"}
                {currentView === "login" && "INICIAR SESIÓN"}
                {currentView === "recovery" && "ENVIAR INSTRUCCIONES"}
              </>
            )}
          </button>

          {/* Google */}
          {currentView !== "recovery" && (
            <button type="button" className="auth-modal__btn-google" onClick={handleGoogleLogin} disabled={loading}>
              <svg viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.15C3.17 21.36 7.23 24 12 24z" />
                <path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.18C.43 8.12 0 9.8 0 12s.43 3.88 1.18 5.39l4.09-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.17 2.64 1.18 6.61l4.09 3.15c.95-2.85 3.6-4.96 6.73-4.96z" />
              </svg>
              <span>Continuar con Google</span>
            </button>
          )}
        </form>

        {/* Footer toggle */}
        <div className="auth-modal__footer">
          {currentView === "register" && (
            <>
              ¿Tienes una cuenta?{" "}
              <button
                className="auth-modal__link"
                onClick={() => { setCurrentView("login"); setMessage(""); setError(""); }}
              >
                Inicia sesión
              </button>
            </>
          )}
          {currentView === "login" && (
            <>
              ¿No tienes una cuenta?{" "}
              <button
                className="auth-modal__link"
                onClick={() => { setCurrentView("register"); setMessage(""); setError(""); }}
              >
                Regístrate
              </button>
            </>
          )}
          {currentView === "recovery" && (
            <>
              ¿Recordaste tu contraseña?{" "}
              <button
                className="auth-modal__link"
                onClick={() => { setCurrentView("login"); setMessage(""); setError(""); }}
              >
                Inicia sesión
              </button>
            </>
          )}
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
