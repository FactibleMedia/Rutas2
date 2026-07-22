import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
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
  const [form, setForm] = useState({ word: "", category: "", meaning: "" });

  // Check auth session on mount and subscribe to auth changes
  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) {
        setSession(data.session);
      }
      setLoading(false);
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
            <form onSubmit={handleSubmit} className="submit-word__form">
              {error && <p className="submit-word__error">{error}</p>}

              {/* Word */}
              <div className="submit-word__field">
                <input
                  type="text"
                  name="word"
                  placeholder="Palabra"
                  value={form.word}
                  onChange={handleChange}
                  required
                  className="submit-word__input"
                />
                <span className="submit-word__hint">No te quedes con la palabra en la boca</span>
              </div>

              {/* Category */}
              <div className="submit-word__field">
                <div className="submit-word__select-wrap">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="submit-word__select"
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
                <textarea
                  name="meaning"
                  rows="4"
                  placeholder="Significado"
                  value={form.meaning}
                  onChange={handleChange}
                  required
                  className="submit-word__textarea"
                />
                <span className="submit-word__hint">Cuéntanos qué significa</span>
              </div>

              {/* Terms */}
              <div className="submit-word__terms">
                <button type="button" className="submit-word__terms-link" onClick={() => alert("Términos y condiciones: Las palabras enviadas serán revisadas por un administrador antes de ser publicadas.")}>
                  Términos y condiciones
                </button>
                <p className="submit-word__terms-text">Esta palabra estará en revisión, gracias por tu aporte.</p>
              </div>

              {/* Submit */}
              <div style={{ textAlign: "center" }}>
                <button
                  type="submit"
                  className="submit-word__btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <><span className="submit-word__spinner" /> Enviando...</>
                  ) : (
                    "MÁNDALO PUE"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Sticker (Sirena) */}
        <div className="submit-word__sticker-right submit-word__sticker-right--animated">
          <img src="/assets/glosario/icono_sirena.png" alt="Sirena" style={{ width: "100%", height: "auto", filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.15))" }} />
        </div>
      </div>
    </div>
  );
}
