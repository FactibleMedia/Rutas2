import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { removeMapLocation, useMapLocations } from "../mapLocationsStore";
import RouteForm from "./RouteForm";

const CATEGORIES = ["Todas", "Patrimonio", "Gastronomía", "Mitos y Leyendas"];
const ROUTE_ID_MAP = { "Patrimonio": "patrimonial", "Gastronomía": "gastronomica", "Mitos y Leyendas": "mitos" };
const ROUTE_LABEL_MAP = { patrimonial: "Patrimonio", gastronomica: "Gastronomía", mitos: "Mitos y Leyendas" };

export default function RouteManager() {
  const [searchParams] = useSearchParams();
  const locations = useMapLocations();
  const [activeCategory, setActiveCategory] = useState("Todas");
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [formMode, setFormMode] = useState(null); // null | "create" | { location }
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleting, setDeleting] = useState(null);

  // Auto-open form when ?crear=true is in URL
  useEffect(() => {
    if (searchParams.get("crear") === "true") {
      setFormMode({ location: null });
    }
  }, [searchParams]);

  const filteredRoutes = useMemo(() => {
    return locations.filter((loc) => {
      const catMatch = activeCategory === "Todas" || ROUTE_LABEL_MAP[loc.routeId] === activeCategory;
      const searchMatch = !searchText.trim() ||
        loc.name.toLowerCase().includes(searchText.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [locations, activeCategory, searchText]);

  const handleEdit = (location) => {
    setFormMode({ location });
  };

  const handleDelete = async (location) => {
    if (!window.confirm(`¿Eliminar "${location.name}"?`)) return;
    setDeleting(location.id);
    try {
      await removeMapLocation(location.id);
      setMessage({ type: "success", text: `"${location.name}" eliminada.` });
    } catch {
      setMessage({ type: "error", text: "No se pudo eliminar." });
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = (saved) => {
    setFormMode(null);
    setMessage({ type: "success", text: `"${saved.name}" guardada correctamente.` });
  };

  // Show the form if in form mode
  if (formMode) {
    return (
      <RouteForm
        location={formMode.location || null}
        onSave={handleSave}
        onCancel={() => setFormMode(null)}
      />
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Gestión de Rutas</h1>
            <p className="admin-page-header__subtitle">
              {locations.length} sitio(s) cultural(es) registrado(s)
            </p>
          </div>
          <button
            className="admin-btn admin-btn--primary"
            type="button"
            onClick={() => setFormMode({ location: null })}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Nueva Ruta
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            background: "var(--surface-container-low)",
            padding: 16,
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--outline-variant)",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                display: "flex",
                background: "var(--surface-container-highest)",
                padding: 4,
                borderRadius: "var(--radius-full)",
                border: "1px solid rgba(221, 192, 184, 0.5)",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: "var(--radius-full)",
                  background: viewMode === "grid" ? "var(--primary)" : "transparent",
                  color: viewMode === "grid" ? "var(--on-primary)" : "var(--on-surface-variant)",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>grid_view</span>
                Cuadrícula
              </button>
              <button
                type="button"
                onClick={() => setViewMode("map")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: "var(--radius-full)",
                  background: viewMode === "map" ? "var(--primary)" : "transparent",
                  color: viewMode === "map" ? "var(--on-primary)" : "var(--on-surface-variant)",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>map</span>
                Mapa
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", color: "var(--on-surface-variant)" }}>
              Filtrar por:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-full)",
                  border: activeCategory === cat
                    ? "1px solid var(--primary)"
                    : "1px solid var(--outline-variant)",
                  background: activeCategory === cat ? "var(--primary)" : "transparent",
                  color: activeCategory === cat ? "var(--on-primary)" : "var(--on-surface-variant)",
                  fontFamily: "var(--font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: "relative", width: "100%", maxWidth: 288 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--on-surface-variant)",
                fontSize: 20,
              }}
            >
              filter_list
            </span>
            <input
              type="text"
              placeholder="Filtrar por nombre..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 40px",
                background: "#fff",
                border: "1px solid var(--outline-variant)",
                borderRadius: "var(--radius-sm)",
                fontFamily: "var(--font-body)",
                fontSize: 16,
                color: "var(--on-surface)",
                outline: "none",
                boxShadow: "var(--shadow-sm)",
              }}
            />
          </div>
        </div>
      </div>

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

      {/* Folk divider */}
      <div className="admin-folk-divider" style={{ marginBottom: 32 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--outline)" }}>
          emergency
        </span>
      </div>

      {/* Routes Grid */}
      {viewMode === "grid" ? (
        filteredRoutes.length === 0 ? (
          <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16, display: "block" }}>explore</span>
            <p>No hay rutas que coincidan con los filtros.</p>
            <button
              className="admin-btn admin-btn--secondary"
              type="button"
              onClick={() => setFormMode({ location: null })}
              style={{ marginTop: 16 }}
            >
              Crear primera ruta
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: "var(--space-gutter)" }}>
            {filteredRoutes.map((route) => (
              <article
                key={route.id}
                className="admin-card--inset"
                style={{
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  overflow: "hidden",
                  border: "1px solid rgba(221, 192, 184, 0.5)",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    width: 192,
                    minHeight: 192,
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                    background: "var(--surface-dim)",
                  }}
                >
                  <img
                    src={route.image || route.images?.[0] || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"}
                    alt={route.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-full)",
                      background: "rgba(80, 96, 70, 0.9)",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {ROUTE_LABEL_MAP[route.routeId] || route.categoryLabel || "Patrimonio"}
                  </div>
                </div>
                <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 24,
                        fontWeight: 600,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {route.name}
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: 16,
                      lineHeight: "24px",
                      color: "var(--on-surface-variant)",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {route.description || route.subtitle || "Sin descripción"}
                  </p>
                  <div style={{ display: "flex", gap: 8, marginTop: "auto", marginBottom: 16, flexWrap: "wrap" }}>
                    {route.address && (
                      <span
                        style={{
                          padding: "4px 8px",
                          background: "var(--surface-variant)",
                          color: "var(--on-surface-variant)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          border: "1px solid rgba(221, 192, 184, 0.5)",
                        }}
                      >
                        {route.address}
                      </span>
                    )}
                    {route.hours && (
                      <span
                        style={{
                          padding: "4px 8px",
                          background: "var(--surface-variant)",
                          color: "var(--on-surface-variant)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 12,
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          border: "1px solid rgba(221, 192, 184, 0.5)",
                        }}
                      >
                        {route.hours}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid rgba(221, 192, 184, 0.3)", paddingTop: 16 }}>
                    <button
                      className="admin-topbar__icon-btn"
                      type="button"
                      title="Editar Ruta"
                      style={{ borderRadius: "var(--radius-sm)" }}
                      onClick={() => handleEdit(route)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                    </button>
                    <button
                      className="admin-topbar__icon-btn"
                      type="button"
                      title="Eliminar"
                      style={{ borderRadius: "var(--radius-sm)", color: "var(--error)" }}
                      onClick={() => handleDelete(route)}
                      disabled={deleting === route.id}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {deleting === route.id ? "hourglass_top" : "delete"}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        /* Map View - implementación básica */
        <div
          className="admin-card--inset"
          style={{
            height: 600,
            borderRadius: "var(--radius-lg)",
            borderTop: "4px solid var(--primary)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(157, 61, 28, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: "var(--primary)" }}>map</span>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: 0 }}>
            Vista de Mapa Interactivo
          </h3>
          <p style={{ color: "var(--on-surface-variant)", maxWidth: 480, textAlign: "center", margin: 0 }}>
            {filteredRoutes.length} ubicaciones en el mapa cultural
          </p>
        </div>
      )}
    </>
  );
}
