import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import TermsModal from "./TermsModal";
import "./SubmitWordModal.css";

/* =========================================================
   SUBMIT WORD MODAL – Suggest new glossary words
   ========================================================= */

const CATEGORIES = [
  { value: "dicho", label: "Es un dicho" },
  { value: "comida", label: "Una comida" },
  { value: "objeto", label: "Un objeto" },
  { value: "expresion", label: "Otra expresión" },
];

// Map user-friendly categories to the glosario_palabras categories
const CATEGORY_MAP = {
  dicho: "Expresión",
  comida: "Alimento",
  objeto: "Objeto",
  expresion: "Para referirse",
};

export default function SubmitWordModal({ onClose, onWordSubmitted }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [form, setForm] = useState({ word: "", category: "", meaning: "" });

  // Check auth on mount: first from localStorage (same source as TopBar), then verify with Supabase
  useEffect(() => {
    // Check TopBar's custom session key first (instant, no async)
    const cachedSession = (() => {
      try {
        const raw = localStorage.getItem("rutas_user_session");
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    })();

    if (cachedSession) {
      // User is logged in according to TopBar — set placeholder session so form shows immediately
      setSession({ user: { email: cachedSession.name || "" } });
      setLoading(false);
    }

    // Verify session with Supabase (async) — overwrites placeholder when real session arrives
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data.session);
      } else if (!cachedSession) {
        // No Supabase session AND no TopBar session → user not logged in
        setLoading(false);
      }
    });

    // Listen for auth state changes (login/logout while modal is open)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Re-check session directly from Supabase (not from stale state)
    const { data: { session: currentSession } } = await supabase.auth.getSession();

    if (!currentSession?.user) {
      setError("Debes iniciar sesión para enviar una palabra.");
      return;
    }

    if (!form.word.trim() || !form.category || !form.meaning.trim()) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const categoria = CATEGORY_MAP[form.category] || "Para referirse";

    setSubmitting(true);

    try {
      const userMeta = currentSession.user.user_metadata || {};
      const nombre = [userMeta.nombre, userMeta.apellido].filter(Boolean).join(" ") || currentSession.user.email;

      const { error: insertError } = await supabase
        .from("glosario_sugerencias")
        .insert({
          palabra: form.word.trim(),
          significado: form.meaning.trim(),
          categoria,
          usuario_id: currentSession.user.id,
          usuario_nombre: nombre,
          estado: "pendiente",
        });

      if (insertError) throw insertError;

      setSubmitted(true);
      if (onWordSubmitted) onWordSubmitted();
    } catch (err) {
      console.error("Error submitting word:", err);
      setError(err.message || "Error al enviar la palabra. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = () => {
    // Close modal and let user click login in TopBar naturally
    onClose();
  };

  const userMeta = session?.user?.user_metadata || {};
  const userName = [userMeta.nombre, userMeta.apellido].filter(Boolean).join(" ") || session?.user?.email?.split("@")[0] || "";
  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="submit-word__overlay" onClick={onClose}>
      <div className="submit-word__paper-bg" />
      <div className="submit-word__card" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="submit-word__close" onClick={onClose} aria-label="Cerrar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Left Sticker (Cacique Upar Verde) */}
        <div className="submit-word__sticker-left submit-word__sticker-left--animated">
          <img src="/assets/glosario/icono_cacique_verde.png" alt="Cacique Upar" style={{ width: "100%", height: "auto", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.15))" }} />
        </div>

        {/* Center Content */}
        <div className="submit-word__content">
          <h2 className="submit-word__title">ESCRIBE TU PALABRA</h2>

          {loading ? (
            <div style={{ padding: 40 }}>
              <span className="submit-word__spinner" />
            </div>
          ) : submitted ? (
            <div className="submit-word__success">
              <h3>¡Gracias por tu aporte!</h3>
              <p>Tu palabra ha sido enviada para revisión. Un administrador la aprobará próximamente.</p>
              <button
                type="button"
                className="submit-word__btn-another"
                onClick={() => { setSubmitted(false); setForm({ word: "", category: "", meaning: "" }); }}
              >
                Enviar otra palabra
              </button>
            </div>
          ) : !session ? (
            <div className="submit-word__login-prompt">
              <p>Inicia sesión para poder enviar tu palabra al glosario vallenato. Tus aportes serán revisados por nuestros administradores.</p>
              <button type="button" className="submit-word__btn-login" onClick={handleLogin}>
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <>
              {/* === AUTHENTICATED GREETING BANNER === */}
              <div className="submit-word__auth-banner">
                <div className="submit-word__auth-avatar">
                  {userInitials}
                </div>
                <div className="submit-word__auth-text">
                  <span className="submit-word__auth-greeting">¡Bienvenido, {userName}!</span>
                  <span className="submit-word__auth-sub">Comparte tu palabra con el Valle</span>
                </div>
                <div className="submit-word__auth-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Colaborador</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="submit-word__form submit-word__form--auth">
                {error && <p className="submit-word__error">{error}</p>}

                {/* Word */}
                <div className="submit-word__field">
                  <label className="submit-word__label">Palabra</label>
                  <input
                    type="text"
                    name="word"
                    placeholder="Ej: Guayacán"
                    value={form.word}
                    onChange={handleChange}
                    required
                    className="submit-word__input submit-word__input--auth"
                  />
                  <span className="submit-word__hint">No te quedes con la palabra en la boca</span>
                </div>

                {/* Category */}
                <div className="submit-word__field">
                  <label className="submit-word__label">Categoría</label>
                  <div className="submit-word__select-wrap">
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      required
                      className="submit-word__select submit-word__select--auth"
                    >
                      <option value="" disabled>Categoría</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                    <div className="submit-word__select-arrow">
                      <svg viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  <span className="submit-word__hint">¿Es un dicho, una comida, un objeto...?</span>
                </div>

                {/* Meaning */}
                <div className="submit-word__field">
                  <label className="submit-word__label">Significado</label>
                  <textarea
                    name="meaning"
                    rows="3"
                    placeholder="Cuéntanos qué significa esta palabra..."
                    value={form.meaning}
                    onChange={handleChange}
                    required
                    className="submit-word__textarea submit-word__textarea--auth"
                  />
                </div>

                {/* Compact terms + submit row */}
                <div className="submit-word__actions">
                  <div className="submit-word__terms">
                    <button type="button" className="submit-word__terms-link" onClick={() => setShowTerms(true)}>
                      Términos y condiciones
                    </button>
                  </div>
                  <button
                    type="submit"
                    className="submit-word__btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <><span className="submit-word__spinner" /> Enviando...</>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        MÁNDALO PUE
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Right Sticker (Sirena) */}
        <div className="submit-word__sticker-right submit-word__sticker-right--animated">
          <img src="/assets/glosario/icono_sirena.png" alt="Sirena" style={{ width: "100%", height: "auto", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.15))" }} />
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  );
}
