import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { isNetworkError, getUserFriendlyError } from "./adminHelpers";

const CATEGORIES = [
  "Objeto", "Transporte", "Material", "Bebida", "Alimento",
  "Animal", "Planta", "Gesto", "Expresión", "Cuerpo",
  "Para referirse", "Vestimenta", "Accesorio", "Fantasía", "Juego",
];

const COLORS = [
  { id: "verde", label: "Verde", bg: "#464c33", postal: "url(/assets/glosario/Estampa Verde.png)" },
  { id: "morado", label: "Morado", bg: "#564e87", postal: "url(/assets/glosario/Estampa Morada.png)" },
];

const EMPTY_FORM = {
  palabra: "",
  significado: "",
  categoria: "Para referirse",
  color_postal: "verde",
};

function CardPreview({ palabra, significado, categoria, color }) {
  const colorData = COLORS.find((c) => c.id === color) || COLORS[0];
  return (
    <div
      style={{
        width: 280,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        backgroundImage: colorData.postal,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          padding: "24px 20px",
          minHeight: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        <p style={{ color: "#fff", fontFamily: "Trattatello, fantasy", fontSize: 28, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
          {palabra || "Palabra"}
        </p>
        <div>
          <span style={{ color: "rgba(255,255,255,0.9)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", display: "block", marginBottom: 4 }}>
            Significado:
          </span>
          <p style={{ color: "#fff", fontFamily: "Outfit, sans-serif", fontSize: 13, lineHeight: 1.35, margin: 0, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
            {significado || "Descripción de la palabra..."}
          </p>
        </div>
        <span style={{ color: "rgba(255,255,255,0.85)", fontFamily: "Trattatello, fantasy", fontSize: 14, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          ({categoria})
        </span>
      </div>
    </div>
  );
}

export default function GlossaryManager() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleting, setDeleting] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("Todas");

  // Suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("glosario"); // "glosario" | "sugerencias"

  // Estados de error de red
  const [networkError, setNetworkError] = useState("");

  // Fetch words
  const fetchWords = useCallback(async () => {
    setLoading(true);
    setNetworkError("");
    try {
      let query = supabase
        .from("glosario_palabras")
        .select("*")
        .order("palabra");

      if (filterCategory !== "Todas") {
        query = query.eq("categoria", filterCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      setWords(data || []);
    } catch (err) {
      console.warn("Error fetching glossary:", err);
      if (isNetworkError(err)) {
        setNetworkError("No hay conexión a internet. Los datos se cargarán cuando se restablezca la conexión.");
      } else {
        setMessage({ type: "error", text: getUserFriendlyError(err) });
      }
      setWords([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategory]);

  // Fetch pending suggestions
  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    setNetworkError("");
    try {
      const { data, error } = await supabase
        .from("glosario_sugerencias")
        .select("*")
        .order("creado_en", { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.warn("Error fetching suggestions:", err);
      if (isNetworkError(err)) {
        setNetworkError("No hay conexión a internet. Los datos se cargarán cuando se restablezca la conexión.");
      } else {
        setMessage({ type: "error", text: getUserFriendlyError(err) });
      }
      setSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  useEffect(() => {
    if (activeTab === "sugerencias") {
      fetchSuggestions();
    }
  }, [activeTab, fetchSuggestions]);

  // Filter by search
  const filteredWords = useMemo(() => {
    if (!searchText.trim()) return words;
    const q = searchText.toLowerCase();
    return words.filter(
      (w) =>
        w.palabra.toLowerCase().includes(q) ||
        w.significado.toLowerCase().includes(q)
    );
  }, [words, searchText]);

  // Stats
  const stats = useMemo(() => {
    const total = words.length;
    const counts = {};
    CATEGORIES.forEach((cat) => {
      counts[cat] = words.filter((w) => w.categoria === cat).length;
    });
    return { total, counts };
  }, [words]);

  const handleEdit = (word) => {
    setForm({
      palabra: word.palabra,
      significado: word.significado,
      categoria: word.categoria,
      color_postal: word.color_postal,
    });
    setEditingId(word.id);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  const handleNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  // Get current admin user ID
  const getAdminId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  };

  // Approve a suggestion: copy to glosario_palabras and mark as approved
  const handleApproveSuggestion = async (suggestion) => {
    if (!window.confirm(`¿Aprobar "${suggestion.palabra}" y agregarla al glosario?`)) return;

    try {
      const adminId = await getAdminId();

      // Insert into glosario_palabras
      const { error: insertError } = await supabase
        .from("glosario_palabras")
        .insert({
          palabra: suggestion.palabra,
          significado: suggestion.significado,
          categoria: suggestion.categoria,
          color_postal: suggestion.id % 2 === 0 ? "verde" : "morado",
        });

      if (insertError) throw insertError;

      // Mark suggestion as approved
      const { error: updateError } = await supabase
        .from("glosario_sugerencias")
        .update({
          estado: "aprobado",
          revisado_en: new Date().toISOString(),
          revisado_por: adminId,
        })
        .eq("id", suggestion.id);

      if (updateError) throw updateError;

      setMessage({ type: "success", text: `"${suggestion.palabra}" aprobada y agregada al glosario.` });
      fetchWords();
      fetchSuggestions();
    } catch (err) {
      setMessage({ type: "error", text: getUserFriendlyError(err) });
    }
  };

  // Reject a suggestion
  const handleRejectSuggestion = async (suggestion) => {
    if (!window.confirm(`¿Rechazar "${suggestion.palabra}"?`)) return;

    try {
      const adminId = await getAdminId();

      const { error } = await supabase
        .from("glosario_sugerencias")
        .update({
          estado: "rechazado",
          revisado_en: new Date().toISOString(),
          revisado_por: adminId,
        })
        .eq("id", suggestion.id);

      if (error) throw error;

      setMessage({ type: "success", text: `"${suggestion.palabra}" rechazada.` });
      fetchSuggestions();
    } catch (err) {
      setMessage({ type: "error", text: getUserFriendlyError(err) });
    }
  };

  const handleDelete = async (word) => {
    if (!window.confirm(`¿Eliminar "${word.palabra}"?`)) return;
    setDeleting(word.id);
    try {
      const { error } = await supabase
        .from("glosario_palabras")
        .delete()
        .eq("id", word.id);
      if (error) throw error;
      setMessage({ type: "success", text: `"${word.palabra}" eliminada.` });
      fetchWords();
    } catch (err) {
      setMessage({ type: "error", text: isNetworkError(err)
        ? "Operación cancelada: no hay conexión a internet. Intenta de nuevo cuando tengas conexión."
        : getUserFriendlyError(err)
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.palabra.trim()) {
      setMessage({ type: "error", text: "La palabra es obligatoria." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      if (editingId) {
        const { error } = await supabase
          .from("glosario_palabras")
          .update({
            palabra: form.palabra.trim(),
            significado: form.significado.trim(),
            categoria: form.categoria,
            color_postal: form.color_postal,
            actualizado_en: new Date().toISOString(),
          })
          .eq("id", editingId);
        if (error) throw error;
        setMessage({ type: "success", text: `"${form.palabra}" actualizada.` });
      } else {
        const { error } = await supabase
          .from("glosario_palabras")
          .insert({
            palabra: form.palabra.trim(),
            significado: form.significado.trim(),
            categoria: form.categoria,
            color_postal: form.color_postal,
          });
        if (error) throw error;
        setMessage({ type: "success", text: `"${form.palabra}" creada.` });
      }

      setShowForm(false);
      fetchWords();
    } catch (err) {
      setMessage({ type: "error", text: isNetworkError(err)
        ? "No se pudo guardar: no hay conexión a internet. Intenta de nuevo cuando tengas conexión."
        : getUserFriendlyError(err)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Glosario Vallenato</h1>
            <p className="admin-page-header__subtitle">
              {stats.total} palabra(s) registrada(s) · {CATEGORIES.length} categorías
            </p>
          </div>
          {!showForm && (
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={handleNew}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Nueva Palabra
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 20, borderBottom: "1px solid var(--outline-variant)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("glosario")}
            style={{
              padding: "10px 20px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === "glosario" ? "var(--primary)" : "var(--on-surface-variant)",
              background: "none",
              border: "none",
              borderBottom: activeTab === "glosario" ? "2px solid var(--primary)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
            Glosario
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("sugerencias")}
            style={{
              padding: "10px 20px",
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === "sugerencias" ? "var(--primary)" : "var(--on-surface-variant)",
              background: "none",
              border: "none",
              borderBottom: activeTab === "sugerencias" ? "2px solid var(--primary)" : "2px solid transparent",
              cursor: "pointer",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>rate_review</span>
            Sugerencias Pendientes
            {suggestions.filter((s) => s.estado === "pendiente").length > 0 && (
              <span style={{
                background: "var(--primary)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "999px",
                minWidth: 20,
                textAlign: "center",
              }}>
                {suggestions.filter((s) => s.estado === "pendiente").length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Banner de error de red */}
      {networkError && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 500,
            background: "rgba(232, 152, 27, 0.1)",
            color: "#8a6a00",
            border: "1px solid rgba(232, 152, 27, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>wifi_off</span>
          <span style={{ flex: 1 }}>{networkError}</span>
          <button
            type="button"
            onClick={() => { setNetworkError(""); fetchWords(); }}
            className="admin-btn admin-btn--secondary"
            style={{ padding: "6px 14px", fontSize: 12, minHeight: 0, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
            Reintentar
          </button>
        </div>
      )}

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 600,
            background: message.type === "error" ? "var(--error-container)" : "rgba(80, 96, 70, 0.1)",
            color: message.type === "error" ? "var(--on-error-container)" : "var(--tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {message.type === "error" ? "error" : "check_circle"}
          </span>
          {message.text}
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* STATS ROW */}
      <div className="admin-metrics" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", marginBottom: 24 }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(filterCategory === cat ? "Todas" : cat)}
            className="admin-metric"
            style={{
              cursor: "pointer",
              padding: 16,
              textAlign: "center",
              border: filterCategory === cat ? "2px solid var(--primary)" : "1px solid var(--outline-variant)",
              background: filterCategory === cat ? "rgba(157,61,28,0.04)" : "var(--surface-container-lowest)",
              transition: "all 0.2s",
            }}
          >
            <p className="admin-metric__value" style={{ fontSize: 24, margin: "0 0 4px" }}>
              {stats.counts[cat] || 0}
            </p>
            <p className="admin-metric__label" style={{ fontSize: 10, margin: 0, whiteSpace: "nowrap" }}>
              {cat}
            </p>
          </button>
        ))}
      </div>

      {activeTab === "sugerencias" ? (
        /* ===== SUGGESTIONS TAB ===== */
        <>
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: 20 }}>rate_review</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--on-surface-variant)" }}>
              Palabras sugeridas por usuarios pendientes de revisión
            </span>
          </div>

          {suggestionsLoading ? (
            <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 12, display: "block", animation: "spin 1s linear infinite" }}>sync</span>
              <p>Cargando sugerencias...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16, display: "block" }}>check_circle</span>
              <p>No hay sugerencias pendientes.</p>
            </div>
          ) : (
            <div className="admin-card" style={{ overflow: "hidden" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Palabra</th>
                    <th>Significado</th>
                    <th>Categoría</th>
                    <th>Sugerido por</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th style={{ width: 140 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 700 }}>{s.palabra}</td>
                      <td style={{ fontSize: 14, color: "var(--on-surface-variant)", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {s.significado}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge--published">{s.categoria}</span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
                        {s.usuario_nombre || "Anónimo"}
                      </td>
                      <td style={{ fontSize: 13, color: "var(--on-surface-variant)", whiteSpace: "nowrap" }}>
                        {new Date(s.creado_en).toLocaleDateString()}
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          ...(s.estado === "pendiente"
                            ? { background: "rgba(232, 152, 27, 0.12)", color: "#8a6a00" }
                            : s.estado === "aprobado"
                            ? { background: "rgba(70, 76, 51, 0.12)", color: "#464c33" }
                            : { background: "rgba(192, 57, 43, 0.1)", color: "#c0392b" }),
                        }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            display: "inline-block",
                            background: s.estado === "pendiente" ? "#e8981b" : s.estado === "aprobado" ? "#464c33" : "#c0392b",
                          }} />
                          {s.estado}
                        </span>
                      </td>
                      <td>
                        {s.estado === "pendiente" ? (
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              className="admin-btn admin-btn--primary"
                              type="button"
                              title="Aprobar"
                              onClick={() => handleApproveSuggestion(s)}
                              style={{ padding: "6px 12px", fontSize: 12, minHeight: 0 }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                              Aprobar
                            </button>
                            <button
                              className="admin-btn admin-btn--ghost"
                              type="button"
                              title="Rechazar"
                              onClick={() => handleRejectSuggestion(s)}
                              style={{ padding: "6px 12px", fontSize: 12, minHeight: 0, border: "1px solid var(--outline)", color: "var(--error)" }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                              Rechazar
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
                            {s.estado === "aprobado" ? "✓ Aprobada" : "✗ Rechazada"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : showForm ? (
        /* ===== FORM ===== */
        <div className="admin-card" style={{ padding: 32 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
              {editingId ? "edit" : "add_circle"}
            </span>
            {editingId ? "Editar Palabra" : "Nueva Palabra"}
          </h3>

          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              {/* LEFT: Form fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Palabra *</label>
                  <input
                    className="admin-form-input"
                    type="text"
                    value={form.palabra}
                    onChange={(e) => setForm((p) => ({ ...p, palabra: e.target.value }))}
                    placeholder="Ej: Bacano"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Significado</label>
                  <textarea
                    className="admin-form-input"
                    value={form.significado}
                    onChange={(e) => setForm((p) => ({ ...p, significado: e.target.value }))}
                    placeholder="Describe el significado..."
                    rows={3}
                    style={{ resize: "vertical", minHeight: 80 }}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Categoría</label>
                  <select
                    className="admin-form-select"
                    value={form.categoria}
                    onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Color de Postal</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    {COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, color_postal: c.id }))}
                        style={{
                          flex: 1,
                          padding: "12px 16px",
                          borderRadius: "var(--radius-lg)",
                          border: form.color_postal === c.id ? "2px solid var(--primary)" : "1px solid var(--outline-variant)",
                          background: form.color_postal === c.id ? c.bg : "var(--surface-container-low)",
                          color: "#fff",
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                        }}
                      >
                        <span style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          display: "inline-block",
                          background: c.bg,
                        }} />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary"
                    disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {saving ? (
                      <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Guardar</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setShowForm(false)}
                    style={{ border: "1px solid var(--outline)" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* RIGHT: Preview */}
              <div>
                <label className="admin-form-label" style={{ marginBottom: 12 }}>Vista Previa</label>
                <div style={{
                  background: "#FBDC89",
                  borderRadius: "var(--radius-xl)",
                  padding: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 380,
                  border: "1px solid var(--outline-variant)",
                }}>
                  <CardPreview
                    palabra={form.palabra}
                    significado={form.significado}
                    categoria={form.categoria}
                    color={form.color_postal}
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ===== TABLE ===== */
        <>
          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input
              className="admin-form-input"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por palabra o significado..."
              style={{ maxWidth: 400 }}
            />
          </div>

          {loading ? (
            <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 12, display: "block", animation: "spin 1s linear infinite" }}>sync</span>
              <p>Cargando glosario...</p>
            </div>
          ) : filteredWords.length === 0 ? (
            <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16, display: "block" }}>menu_book</span>
              <p>{searchText || filterCategory !== "Todas" ? "No hay palabras que coincidan." : "Aún no hay palabras en el glosario."}</p>
              <button className="admin-btn admin-btn--secondary" type="button" onClick={handleNew} style={{ marginTop: 16 }}>
                Crear primera palabra
              </button>
            </div>
          ) : (
            <div className="admin-card" style={{ overflow: "hidden" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Palabra</th>
                    <th>Significado</th>
                    <th>Categoría</th>
                    <th>Postal</th>
                    <th style={{ width: 120 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWords.map((w) => (
                    <tr key={w.id}>
                      <td style={{ fontWeight: 700 }}>{w.palabra}</td>
                      <td style={{ fontSize: 14, color: "var(--on-surface-variant)", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {w.significado}
                      </td>
                      <td>
                        <span className="admin-badge admin-badge--published">{w.categoria}</span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "4px 12px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          background: w.color_postal === "verde" ? "rgba(70,76,51,0.12)" : "rgba(86,78,135,0.12)",
                          color: w.color_postal === "verde" ? "#464c33" : "#564e87",
                        }}>
                          <span style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: w.color_postal === "verde" ? "#464c33" : "#564e87",
                            display: "inline-block",
                          }} />
                          {w.color_postal}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="admin-topbar__icon-btn"
                            type="button"
                            title="Editar"
                            onClick={() => handleEdit(w)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                          </button>
                          <button
                            className="admin-topbar__icon-btn"
                            type="button"
                            title="Eliminar"
                            style={{ color: "var(--error)" }}
                            onClick={() => handleDelete(w)}
                            disabled={deleting === w.id}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                              {deleting === w.id ? "hourglass_top" : "delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
