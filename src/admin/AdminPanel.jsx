import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminProfile } from "./adminAuth";
import { supabase } from "../supabaseClient";
import Dashboard from "./Dashboard";
import RouteManager from "./RouteManager";
import UserManager from "./UserManager";
import ContentEditor from "./ContentEditor";
import GlossaryManager from "./GlossaryManager";
import logoWhiteNav from "../assets/mcp/logo_white_nav.png";
import logoAlt from "../assets/mcp/logo_alt.png";
import "./AdminPanel.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/admin/panel" },
  { id: "glosario", label: "Glosario Vallenato", icon: "menu_book", path: "/admin/panel/glosario" },
  { id: "rutas", label: "Gestión de Rutas", icon: "map", path: "/admin/panel/rutas" },
  { id: "contenido", label: "Editor Multimedia", icon: "edit_note", path: "/admin/panel/contenido" },
  { id: "usuarios", label: "Usuarios y Roles", icon: "group", path: "/admin/panel/usuarios" },
  { id: "config", label: "Configuración", icon: "settings", path: "/admin/panel/configuracion" },
];

function Sidebar({ activeId, onNavigate, onLogout, isMobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`admin-sidebar-overlay${isMobileOpen ? " admin-sidebar-overlay--open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar${isMobileOpen ? " admin-sidebar--mobile-open" : ""}`}>
        <div className="admin-sidebar__header">
          <img src={logoWhiteNav} alt="Rutas de Valledupar" className="admin-sidebar__logo" />
          <div className="admin-sidebar__header-text">
            <h2 className="admin-sidebar__title">Administración</h2>
            <p className="admin-sidebar__subtitle">Portal Cultural</p>
          </div>
        </div>

        <div className="admin-sidebar__cta">
          <button className="admin-sidebar__cta-btn" type="button" onClick={() => { onNavigate("/admin/panel/rutas?crear=true"); onCloseMobile(); }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Crear Nueva Ruta
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-sidebar__link${activeId === item.id ? " admin-sidebar__link--active" : ""}`}
              onClick={() => {
                onNavigate(item.path);
                onCloseMobile();
              }}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeId === item.id ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__bottom">
          <button type="button" className="admin-sidebar__logout" onClick={onLogout}>
            <span className="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

function TopBar({ profile, onToggleMobile, isMobileOpen }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__left">
        {/* Hamburger button – visible only on mobile */}
        <button
          type="button"
          className={`admin-hamburger${isMobileOpen ? " admin-hamburger--open" : ""}`}
          onClick={onToggleMobile}
          aria-label={isMobileOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileOpen}
        >
          <span className="admin-hamburger__line" />
          <span className="admin-hamburger__line" />
          <span className="admin-hamburger__line" />
        </button>

        <div className="admin-topbar__brand">
          <img src={logoAlt} alt="Rutas de Valledupar" className="admin-topbar__logo" />
          <div className="admin-topbar__brand-divider" />
          <span className="admin-topbar__brand-label">Panel de Administración</span>
        </div>
      </div>

      <div className="admin-topbar__right">
        <div className="admin-topbar__search">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="Buscar en el portal..." />
        </div>
        <div className="admin-topbar__actions">
          <button className="admin-topbar__icon-btn" type="button" aria-label="Notificaciones">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="admin-topbar__icon-btn" type="button" aria-label="Configuración">
            <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="admin-topbar__avatar admin-topbar__avatar--fallback" title={profile?.name || "Admin"}>
            {profile?.initials || "AD"}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useMemo(() => getAdminProfile() || { name: "Admin Principal", email: "admin@valledupar.gov.co", initials: "AD" }, []);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const activeId = useMemo(() => {
    const path = location.pathname;
    const found = NAV_ITEMS.find((item) => item.path === path);
    return found?.id || "dashboard";
  }, [location.pathname]);

  const handleNavigate = useCallback((path) => {
    navigate(path);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAdminSession();
    navigate("/admin", { replace: true });
  }, [navigate]);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="admin-panel">
      <Sidebar
        activeId={activeId}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      <main className="admin-main">
        <TopBar
          profile={profile}
          onToggleMobile={toggleMobileSidebar}
          isMobileOpen={isMobileSidebarOpen}
        />

        <div className="admin-content">
          <Routes>
            <Route index element={<Dashboard profile={profile} />} />
            <Route path="rutas" element={<RouteManager />} />
            <Route path="usuarios" element={<UserManager />} />
            <Route path="glosario" element={<GlossaryManager />} />
            <Route path="contenido" element={<ContentEditor />} />
            <Route path="configuracion" element={<ConfigPage />} />
            <Route path="*" element={<Navigate to="/admin/panel" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function ConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dirty, setDirty] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function fetchConfig() {
      try {
        const { data, error: fetchError } = await supabase
          .from("admin_config")
          .select("*")
          .order("clave");

        if (!cancelled && !fetchError) {
          setConfigs(data || []);
        }
      } catch (err) {
        console.warn("Error fetching config:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchConfig();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (clave, value) => {
    setDirty((prev) => ({ ...prev, [clave]: value }));
    setSuccessMsg("");
    setError("");
  };

  const handleSave = async () => {
    const keysToUpdate = Object.keys(dirty);
    if (keysToUpdate.length === 0) return;

    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      for (const clave of keysToUpdate) {
        const { error: updateError } = await supabase
          .from("admin_config")
          .update({
            valor: String(dirty[clave]),
            actualizado_en: new Date().toISOString(),
          })
          .eq("clave", clave);

        if (updateError) throw updateError;
      }

      setConfigs((prev) =>
        prev.map((c) =>
          dirty[c.clave] !== undefined ? { ...c, valor: String(dirty[c.clave]) } : c
        )
      );

      // Log activity
      await supabase.from("actividad_admin").insert({
        accion: "Configuración actualizada",
        detalle: `${keysToUpdate.length} campo(s) modificado(s)`,
        tipo: "configuracion",
      }).catch(() => {});

      setDirty({});
      setSuccessMsg("Configuración guardada correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error saving config:", err);
      setError("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const getConfigValue = (clave) => {
    if (dirty[clave] !== undefined) return dirty[clave];
    const cfg = configs.find((c) => c.clave === clave);
    return cfg?.valor || "";
  };

  const renderField = (config) => {
    const value = getConfigValue(config.clave);
    const isDirty = dirty[config.clave] !== undefined;
    const inputStyle = {
      padding: "11px 16px",
      background: isDirty ? "rgba(157, 61, 28, 0.04)" : "var(--surface-container-low)",
      border: isDirty ? "1px solid var(--primary)" : "1px solid var(--outline-variant)",
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-body)",
      fontSize: 15,
      color: "var(--on-surface)",
      outline: "none",
      width: "100%",
      transition: "all 0.2s ease",
    };

    switch (config.tipo) {
      case "booleano":
        return (
          <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={value === "true"}
              onChange={(e) => handleChange(config.clave, e.target.checked ? "true" : "false")}
              style={{ width: 20, height: 20, accentColor: "var(--primary)", cursor: "pointer" }}
            />
            <span style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>{config.descripcion}</span>
          </label>
        );
      case "numero":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(config.clave, e.target.value)}
            style={inputStyle}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(config.clave, e.target.value)}
            placeholder={config.descripcion}
            style={inputStyle}
          />
        );
    }
  };

  const hasChanges = Object.keys(dirty).length > 0;

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Configuración</h1>
            <p className="admin-page-header__subtitle">Ajustes generales de la plataforma cultural.</p>
          </div>
          {hasChanges && (
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {saving ? (
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Guardar Cambios</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-lg)", marginBottom: 24, fontSize: 14, fontWeight: 600, background: "rgba(58, 79, 49, 0.1)", color: "var(--tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          {successMsg}
        </div>
      )}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-lg)", marginBottom: 24, fontSize: 14, fontWeight: 600, background: "var(--error-container)", color: "var(--on-error-container)", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 12, display: "block", animation: "spin 1s linear infinite" }}>sync</span>
          <p>Cargando configuración...</p>
        </div>
      ) : configs.length === 0 ? (
        <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16, display: "block" }}>settings</span>
          <p>No hay configuración disponible. Asegúrate de ejecutar el schema SQL en Supabase.</p>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--outline-variant)", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontVariationSettings: "'FILL' 1" }}>tune</span>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, margin: 0 }}>Ajustes del Sitio</h3>
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {configs.map((config) => (
                <div key={config.clave}>
                  <label style={{ display: "block", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", color: "var(--on-surface-variant)", marginBottom: 6, textTransform: "uppercase" }}>
                    {config.clave.replace(/_/g, " ")}
                  </label>
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--outline)" }}>{config.descripcion}</p>
                  {renderField(config)}
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--outline)", display: "flex", justifyContent: "space-between" }}>
                    <span>Tipo: {config.tipo}</span>
                    {dirty[config.clave] !== undefined && <span style={{ color: "var(--primary)", fontWeight: 600 }}>• Sin guardar</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--outline-variant)", background: "var(--surface-bright)", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            {hasChanges && (
              <button className="admin-btn admin-btn--secondary" type="button" onClick={() => setDirty({})}>
                Descartar cambios
              </button>
            )}
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
