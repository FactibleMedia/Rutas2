import { useState } from "react";

export default function ContentEditor() {
  const [title, setTitle] = useState("El Acordeón: Alma del Valle");
  const [author, setAuthor] = useState("Dr. Consuelo Araujonoguera");
  const [category, setCategory] = useState("Instrumentos y Fabricación");

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Editor de Artículo</h1>
            <p className="admin-page-header__subtitle">
              Documenta la historia, agrega multimedia y gestiona la narrativa de la ruta.
            </p>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button className="admin-btn admin-btn--ghost" type="button" style={{ border: "1px solid var(--outline)" }}>
              Guardar Borrador
            </button>
            <button className="admin-btn admin-btn--primary" type="button">
              Publicar Ahora
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "8fr 4fr", gap: "var(--space-gutter)" }}>
        {/* Left Column: Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Basic Info */}
          <div className="admin-card" style={{ padding: 32, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: -12,
                right: 32,
                background: "var(--surface-container-low)",
                padding: "0 8px",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "var(--primary)",
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>info</span>
              Metadatos
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Título de la Publicación</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    fontFamily: "var(--font-display)",
                    border: "none",
                    borderBottom: "2px solid var(--outline)",
                    padding: "12px 0",
                    background: "var(--surface-bright)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Categoría Cultural</label>
                  <select
                    className="admin-form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option>Instrumentos y Fabricación</option>
                    <option>Leyendas y Mitos</option>
                    <option>Juglares Históricos</option>
                    <option>Geografía Musical</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Autor / Investigador</label>
                  <input
                    className="admin-form-input"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="admin-card" style={{ padding: 32, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, padding: 16, opacity: 0.1 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64 }}>photo_library</span>
            </div>

            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                color: "var(--primary)",
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                perm_media
              </span>
              Archivos Multimedia
            </h3>

            <div
              style={{
                border: "2px dashed var(--outline-variant)",
                borderRadius: "var(--radius-xl)",
                padding: 32,
                textAlign: "center",
                cursor: "pointer",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container-high)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--outline-variant)", marginBottom: 8, display: "block" }}>
                cloud_upload
              </span>
              <p style={{ margin: 0, fontSize: 16, color: "var(--on-surface-variant)" }}>
                Arrastra imágenes, audios o videos aquí, o{" "}
                <span style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "underline" }}>
                  explora tus archivos
                </span>
              </p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--outline)" }}>
                JPG, PNG, MP3, MP4 (Max. 50MB)
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 16 }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  border: "1px solid var(--outline-variant)",
                  aspectRatio: "16/9",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=300&h=200&fit=crop"
                  alt="Preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
              <div
                style={{
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--outline-variant)",
                  background: "var(--surface-variant)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: "16/9",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--outline)" }}>
                  audio_file
                </span>
                <span style={{ position: "absolute", bottom: 4, left: 8, fontSize: 11, background: "var(--surface)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                  Entrevista.mp3
                </span>
              </div>
            </div>
          </div>

          {/* Rich Text Editor */}
          <div className="admin-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                background: "var(--surface-container-high)",
                borderBottom: "1px solid var(--outline-variant)",
                padding: 8,
                display: "flex",
                gap: 4,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              {[
                { icon: "format_bold", label: "Bold" },
                { icon: "format_italic", label: "Italic" },
                { icon: "format_underlined", label: "Underline" },
              ].map((btn) => (
                <button
                  key={btn.icon}
                  className="admin-topbar__icon-btn"
                  type="button"
                  title={btn.label}
                  style={{ borderRadius: "var(--radius-sm)", width: 36, height: 36 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{btn.icon}</span>
                </button>
              ))}
              <div style={{ width: 1, height: 24, background: "var(--outline-variant)", margin: "0 4px" }} />
              {[
                { icon: "format_h1", label: "H1" },
                { icon: "format_h2", label: "H2" },
                { icon: "format_quote", label: "Quote" },
              ].map((btn) => (
                <button
                  key={btn.icon}
                  className="admin-topbar__icon-btn"
                  type="button"
                  title={btn.label}
                  style={{ borderRadius: "var(--radius-sm)", width: 36, height: 36 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{btn.icon}</span>
                </button>
              ))}
              <div style={{ width: 1, height: 24, background: "var(--outline-variant)", margin: "0 4px" }} />
              {[
                { icon: "format_list_bulleted", label: "List" },
                { icon: "format_list_numbered", label: "Numbered List" },
              ].map((btn) => (
                <button
                  key={btn.icon}
                  className="admin-topbar__icon-btn"
                  type="button"
                  title={btn.label}
                  style={{ borderRadius: "var(--radius-sm)", width: 36, height: 36 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{btn.icon}</span>
                </button>
              ))}
            </div>

            <div
              style={{
                padding: 24,
                minHeight: 400,
                background: "var(--surface-bright)",
                outline: "none",
                fontFamily: "var(--font-body)",
                fontSize: 16,
                lineHeight: 1.8,
                color: "var(--on-surface)",
              }}
              contentEditable
              suppressContentEditableWarning
            >
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, color: "var(--secondary)", marginBottom: 16 }}>
                El Viento de la Sierra
              </h2>
              <p style={{ marginBottom: 16 }}>
                El acordeón llegó a la costa caribe colombiana a finales del siglo XIX, trayendo consigo melodías europeas
                que pronto se mezclarían con los tambores africanos y las guacharacas indígenas.
              </p>
              <blockquote
                style={{
                  borderLeft: "4px solid var(--primary)",
                  paddingLeft: 16,
                  margin: "24px 0",
                  fontStyle: "italic",
                  color: "var(--on-surface-variant)",
                  fontSize: 18,
                }}
              >
                "El acordeón no se toca con las manos, se toca con el alma que recuerda el valle."
              </blockquote>
              <p>Los primeros juglares caminaban de pueblo en pueblo, llevando noticias y cantando historias.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Status Card */}
          <div className="admin-card" style={{ padding: 24 }}>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                margin: "0 0 16px",
                borderBottom: "1px solid var(--outline-variant)",
                paddingBottom: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              Estado
              <span
                className="admin-badge admin-badge--draft"
                style={{ fontSize: 12, background: "var(--secondary-container)", color: "var(--on-secondary-container)", border: "1px solid var(--secondary)" }}
              >
                Borrador
              </span>
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 16, color: "var(--on-surface-variant)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>visibility</span>
                  Visibilidad:
                </span>
                <select style={{ border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", background: "transparent", fontSize: 14 }}>
                  <option>Público</option>
                  <option>Privado</option>
                </select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>calendar_month</span>
                  Publicación:
                </span>
                <span style={{ color: "var(--on-surface)", fontWeight: 700 }}>Inmediata</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>history</span>
                  Revisiones:
                </span>
                <span style={{ color: "var(--on-surface)", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}>
                  4 versiones
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Preview */}
          <div className="admin-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                padding: "12px 16px",
                background: "var(--surface-container-high)",
                borderBottom: "1px solid var(--outline-variant)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: 0 }}>
                Previsualización Móvil
              </h3>
              <button className="admin-topbar__icon-btn" type="button" style={{ borderRadius: "var(--radius-sm)" }}>
                <span className="material-symbols-outlined">open_in_new</span>
              </button>
            </div>
            <div style={{ padding: 24, background: "var(--surface-variant)", display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: 280,
                  height: 500,
                  background: "var(--surface)",
                  borderRadius: 32,
                  border: "6px solid var(--inverse-surface)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: "var(--shadow-lg)",
                }}
              >
                <div style={{ height: 24, background: "var(--inverse-surface)" }} />
                <div style={{ height: 160, background: "var(--surface-container)" }}>
                  <img
                    src="https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=300&h=200&fit=crop"
                    alt="Preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                <div style={{ padding: 16, flex: 1, overflow: "hidden" }}>
                  <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Instrumentos
                  </span>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "4px 0", lineHeight: 1.2 }}>
                    {title}
                  </h4>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: "var(--on-surface-variant)", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical" }}>
                    El acordeón llegó a la costa caribe colombiana a finales del siglo XIX...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Moderation Settings */}
          <div className="admin-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: -16, right: -16, opacity: 0.1, color: "var(--tertiary-container)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 100, fontVariationSettings: "'FILL' 1" }}>forum</span>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--tertiary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined">forum</span>
              Ajustes de Interacción
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Permitir Comentarios", desc: "Los usuarios registrados podrán debatir.", defaultChecked: true },
                { label: "Aprobación Manual", desc: "Moderar antes de publicar.", defaultChecked: false },
              ].map((item) => (
                <label
                  key={item.label}
                  style={{ display: "flex", gap: 12, cursor: "pointer", alignItems: "flex-start" }}
                >
                  <input
                    type="checkbox"
                    defaultChecked={item.defaultChecked}
                    style={{
                      width: 20,
                      height: 20,
                      accentColor: "var(--primary)",
                      marginTop: 2,
                      cursor: "pointer",
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--on-surface)" }}>
                      {item.label}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--on-surface-variant)" }}>
                      {item.desc}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="admin-folk-divider" style={{ marginTop: 48, marginBottom: 32 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--outline-variant)" }}>stars</span>
      </div>
    </>
  );
}
