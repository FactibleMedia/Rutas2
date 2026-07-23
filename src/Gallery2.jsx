import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import "./Gallery2.css";

/* =========================================================
   ICONS (inline SVGs)
   ========================================================= */

const icons = {
  gastronomia: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  cultura: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  mitico: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  historico: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  fotografia: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  video: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  ilustracion: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 73l2-2m-2 2l2 2m-2-2H9" />
    </svg>
  ),
  galeria: (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

/* =========================================================
   Labels mapping
   ========================================================= */

const TIPO_SITIO_LABELS = {
  Patrimonial: { name: "PATRIMONIAL", subtitle: "Memorias de nuestros antepasados", icon: icons.historico },
  Gastronomico: { name: "GASTRONOMÍA", subtitle: "Sabores y secretos del fogón tradicional", icon: icons.gastronomia },
  Cultural: { name: "CULTURA", subtitle: "Tradiciones, cantos y expresiones vivas", icon: icons.cultura },
  Mitico: { name: "MÍTICO", subtitle: "Leyendas y relatos ancestrales del Cesar", icon: icons.mitico },
  Historico: { name: "HISTÓRICO", subtitle: "Memorias de nuestros antepasados", icon: icons.historico },
};

const TIPO_MULTIMEDIA_LABELS = {
  Fotografia: { name: "Fotografías", icon: icons.fotografia },
  Ilustracion: { name: "Ilustraciones", icon: icons.ilustracion },
  Video: { name: "Videos", icon: icons.video },
  "Galeria de Fotos": { name: "Galería de Fotos", icon: icons.galeria },
};

/* =========================================================
   GALLERY2 PAGE
   ========================================================= */

export default function Gallery2() {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMainCat, setSelectedMainCat] = useState(null);
  const [selectedMediaCat, setSelectedMediaCat] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch all gallery items from Supabase
  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from("galeria_multimedia")
          .select("*")
          .eq("activo", true)
          .order("creado_en", { ascending: false });

        if (!cancelled) {
          if (error) throw error;
          setGalleryItems(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Error fetching gallery:", err);
        if (!cancelled) {
          setGalleryItems([]);
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, []);

  // Dynamic main categories from data
  const mainCategories = useMemo(() => {
    const tipos = [...new Set(galleryItems.map((i) => i.tipo_sitio).filter(Boolean))];
    // Sort: Gastronomico, Cultural, Mitico, Historico, Patrimonial
    const order = ["Gastronomico", "Cultural", "Mitico", "Historico", "Patrimonial"];
    return tipos.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [galleryItems]);

  // Filter items by main category
  const filteredByMain = useMemo(() => {
    if (!selectedMainCat) return [];
    return galleryItems.filter((item) => item.tipo_sitio === selectedMainCat);
  }, [galleryItems, selectedMainCat]);

  // Dynamic media subcategories from filtered data
  const mediaCategories = useMemo(() => {
    const tipos = [...new Set(filteredByMain.map((i) => i.tipo_multimedia).filter(Boolean))];
    const order = ["Fotografia", "Video", "Ilustracion", "Galeria de Fotos"];
    return tipos.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }, [filteredByMain]);

  // Final filtered items
  const currentItems = useMemo(() => {
    if (!selectedMainCat || !selectedMediaCat) return [];
    return filteredByMain.filter((item) => item.tipo_multimedia === selectedMediaCat);
  }, [filteredByMain, selectedMediaCat]);

  const handleBack = useCallback(() => {
    if (selectedItem) {
      setSelectedItem(null);
    } else if (selectedMediaCat) {
      setSelectedMediaCat(null);
    } else if (selectedMainCat) {
      setSelectedMainCat(null);
    } else {
      navigate("/galeria");
    }
  }, [selectedItem, selectedMediaCat, selectedMainCat, navigate]);

  const handleClose = useCallback(() => {
    navigate("/galeria");
  }, [navigate]);

  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const catLabel = (cat) => TIPO_SITIO_LABELS[cat] || { name: cat, subtitle: "", icon: null };
  const mediaLabel = (cat) => TIPO_MULTIMEDIA_LABELS[cat] || { name: cat, icon: null };

  // Get embed URL for YouTube or Google Drive videos
  const getEmbedUrl = (url) => {
    if (!url) return null;
    try {
      const u = new URL(url);

      // YouTube
      if (u.hostname.includes("youtube.com")) {
        const vid = u.searchParams.get("v");
        if (vid) return `https://www.youtube.com/embed/${vid}?rel=0`;
      }
      if (u.hostname === "youtu.be") {
        return `https://www.youtube.com/embed/${u.pathname.slice(1)}?rel=0`;
      }

      // Google Drive
      if (u.hostname.includes("drive.google.com")) {
        const fileId = u.pathname.match(/\/file\/d\/([-\w]+)/)?.[1] || u.searchParams.get("id");
        if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    } catch {}
    return null;
  };

  return (
    <div className="gallery2-enter" style={pageStyle}>
      <div className="gallery2__dot-texture" />

      {/* ===== HEADER ===== */}
      <div style={headerContainer}>
        <div style={headerRow}>
          {/* Back button */}
          <button onClick={handleBack} className="gallery2__back-btn" title="Volver">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Title */}
          <div style={{ textAlign: "center", flex: 1 }}>
            <h1 className="gallery2__title">Galería Multimedia</h1>
            <p className="gallery2__subtitle">
              {selectedMainCat
                ? `Explorando: ${catLabel(selectedMainCat).name}`
                : "Un recorrido por los sabores auténticos, las tradiciones y los relatos que mantienen viva la esencia de nuestra tierra"}
            </p>
          </div>

          {/* X close */}
          <button onClick={handleClose} className="gallery2__back-btn" title="Cerrar" style={{ color: "#8A7968" }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 28, height: 28 }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Breadcrumb pills */}
        {selectedMainCat && !selectedItem && (
          <div style={pillBar}>
            <span className="gallery2__pill gallery2__pill--active" style={{ cursor: "default" }}>
              {catLabel(selectedMainCat).name}
            </span>
            {mediaCategories.map((cat) => {
              const isActive = selectedMediaCat === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedMediaCat(cat)}
                  className={`gallery2__pill${isActive ? " gallery2__pill--active" : ""}`}
                >
                  <span style={{ color: isActive ? "#fff" : "#C2622A", display: "flex" }}>
                    {mediaLabel(cat).icon}
                  </span>
                  <span>{mediaLabel(cat).name}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="gallery2__divider" />
      </div>

      {/* ===== MAIN BODY ===== */}
      <main style={mainStyle}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 16px", color: "#8A7968" }}>
            <div style={{
              width: 32, height: 32,
              border: "3px solid rgba(194,98,42,0.2)",
              borderTopColor: "#C2622A",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Cargando galería...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && galleryItems.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 16px", color: "#8A7968" }}>
            <span style={{ fontSize: 48, opacity: 0.3, display: "block", marginBottom: 12 }}>📷</span>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>No hay contenido disponible.</p>
          </div>
        )}

        {/* STEP 1: Select main category */}
        {!loading && galleryItems.length > 0 && !selectedMainCat && (
          <div className="gallery2__step" style={stepCenter}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={stepTitleStyle}>¿Qué categoría deseas explorar?</h2>
              <p style={stepSubStyle}>Selecciona la temática principal para comenzar:</p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
              width: "100%",
              maxWidth: 600,
            }}>
              {mainCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedMainCat(cat)}
                  className="gallery2__cat-card"
                  type="button"
                >
                  <div className="gallery2__cat-icon">{catLabel(cat).icon}</div>
                  <span className="gallery2__cat-name">{catLabel(cat).name}</span>
                  <span className="gallery2__cat-subtitle">{catLabel(cat).subtitle}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select media type */}
        {selectedMainCat && !selectedMediaCat && !loading && (
          <div className="gallery2__step" style={stepCenter}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={stepTitleStyle}>
                Categoría: <span style={{ color: "#C2622A" }}>{catLabel(selectedMainCat).name}</span>
              </h2>
              <p style={stepSubStyle}>Elige el tipo de contenido:</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
              {mediaCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedMediaCat(cat)}
                  className="gallery2__media-btn"
                  type="button"
                >
                  {mediaLabel(cat).icon}
                  <span>{mediaLabel(cat).name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Gallery grid */}
        {selectedMainCat && selectedMediaCat && !selectedItem && (
          <div className="gallery2__step">
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 24,
            }}>
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="gallery2__grid-item"
                  style={{ height: 260, cursor: "pointer" }}
                >
                  <img
                    src={item.video_imagen || item.imagen_principal || ""}
                    alt={item.titulo}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div className="gallery2__grid-item-overlay" />
                  <span className="gallery2__grid-item-badge">{item.tipo_multimedia}</span>
                  <div className="gallery2__grid-item-caption">
                    <strong>{item.titulo}</strong>
                    <small>{item.descripcion_breve || ""}</small>
                  </div>
                  {item.tipo_multimedia === "Video" && (
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 3,
                      pointerEvents: "none",
                    }}>
                      <div style={{
                        width: 48, height: 48,
                        borderRadius: "50%",
                        background: "rgba(194,98,42,0.85)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {currentItems.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px 16px", color: "#8A7968" }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>
                  No hay contenido de tipo {mediaLabel(selectedMediaCat).name} en esta categoría.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ===== CLICK MODAL (Bigger) ===== */}
      {selectedItem && (
        <div className="gallery2__click-modal" onClick={() => setSelectedItem(null)}>
          <div
            className="gallery2__click-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              className="gallery2__click-close"
              onClick={() => setSelectedItem(null)}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: 24, height: 24 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Media */}
            <div className="gallery2__click-media">
              {selectedItem.tipo_multimedia === "Video" && getEmbedUrl(selectedItem.video_url) ? (
                <iframe
                  src={getEmbedUrl(selectedItem.video_url) + (selectedItem.video_url.includes("youtube") || selectedItem.video_url.includes("youtu.be") ? "&autoplay=1" : "")}
                  title={selectedItem.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: "100%", height: "100%", border: "none" }}
                />
              ) : (
                <img
                  src={selectedItem.video_imagen || selectedItem.imagen_principal || ""}
                  alt={selectedItem.titulo}
                  onError={(e) => { e.target.style.display = "none"; e.target.parentElement.style.background = "#C2622A"; }}
                />
              )}
              <span className="gallery2__click-badge">{selectedItem.tipo_sitio}</span>
            </div>

            {/* Info */}
            <div className="gallery2__click-body">
              <h3>{selectedItem.titulo}</h3>

              {/* Tipo multimedia pill */}
              <span style={{
                display: "inline-block",
                padding: "2px 10px",
                borderRadius: 999,
                background: "rgba(194,98,42,0.1)",
                color: "#C2622A",
                fontFamily: "'Inter', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 12,
              }}>
                {selectedItem.tipo_multimedia}
              </span>

              {selectedItem.descripcion_breve && (
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: "#5C5046",
                  margin: "0 0 8px",
                  fontWeight: 500,
                }}>
                  {selectedItem.descripcion_breve}
                </p>
              )}

              {selectedItem.descripcion_narrativa && (
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: "#7A6B5D",
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {selectedItem.descripcion_narrativa}
                </p>
              )}

              <div className="gallery2__click-footer">
                <span style={{ color: "#8A7968", fontFamily: "'Inter', sans-serif", fontSize: 11 }}>
                  Haz clic fuera para cerrar
                </span>
                <strong style={{ color: "#C2622A", fontFamily: "'Inter', sans-serif", fontSize: 11, textTransform: "uppercase" }}>
                  {selectedItem.tipo_sitio} • Galería 2026
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={{
        width: "100%",
        textAlign: "center",
        padding: "24px 16px",
        borderTop: "1px solid rgba(220,213,201,0.5)",
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        color: "#7A6B5D",
        position: "relative",
        zIndex: 10,
      }}>
        <p>Tradición, Cultura y Sabores Auténticos • Todos los derechos reservados</p>
      </footer>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ---- Inline style objects ---- */

const pageStyle = {
  minHeight: "100vh",
  background: "#FDFBF7",
  color: "#2C221E",
  fontFamily: "'Inter', sans-serif",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  position: "relative",
  overflowX: "hidden",
};

const headerContainer = {
  width: "100%",
  maxWidth: 1200,
  margin: "0 auto",
  padding: "32px 24px 16px",
  position: "relative",
  zIndex: 10,
};

const headerRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 16,
};

const pillBar = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: 10,
  marginTop: 16,
  paddingBottom: 16,
  borderBottom: "1px solid rgba(220,213,201,0.6)",
  flexWrap: "wrap",
};

const mainStyle = {
  flex: 1,
  maxWidth: 1200,
  margin: "0 auto",
  padding: "24px 24px 48px",
  width: "100%",
  position: "relative",
  zIndex: 10,
};

const stepCenter = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: "24px 0",
};

const stepTitleStyle = {
  fontFamily: "var(--font-trattatello)",
  fontSize: "clamp(22px, 3vw, 30px)",
  color: "#3A2E2B",
  marginBottom: 8,
};

const stepSubStyle = {
  fontFamily: "var(--font-trattatello)",
  fontSize: "clamp(18px, 2.5vw, 24px)",
  color: "#C2622A",
};
