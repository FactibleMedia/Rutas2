import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminProfile } from "./adminAuth";
import { supabase } from "../supabaseClient";
import Dashboard from "./Dashboard";
import RouteManager from "./RouteManager";
import UserManager from "./UserManager";
import ContentEditor from "./ContentEditor";
import GlossaryManager from "./GlossaryManager";
import GalleryManager from "./GalleryManager";
import logoAdmin from "../assets/mcp/logo_admin.png";
import "./AdminPanel.css";

const SIDEBAR_STORAGE_KEY = "rutas_admin_sidebar_collapsed";
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/admin/panel" },
  { id: "glosario", label: "Glosario Vallenato", icon: "menu_book", path: "/admin/panel/glosario" },
  { id: "rutas", label: "Gestión de Rutas", icon: "map", path: "/admin/panel/rutas" },
  { id: "galeria", label: "Gestión de Galería Multimedia", icon: "photo_library", path: "/admin/panel/galeria" },
  { id: "usuarios", label: "Usuarios y Roles", icon: "group", path: "/admin/panel/usuarios" },
  { id: "config", label: "Configuración", icon: "settings", path: "/admin/panel/configuracion" },
];

function Sidebar({ activeId, onNavigate, onLogout, isMobileOpen, onCloseMobile, isCollapsed, onToggleCollapse }) {
  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className={`admin-sidebar-overlay${isMobileOpen ? " admin-sidebar-overlay--open" : ""}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`admin-sidebar${isMobileOpen ? " admin-sidebar--mobile-open" : ""}${isCollapsed ? " admin-sidebar--collapsed" : ""}`}>
        <div className="admin-sidebar__header">
          <img src={logoAdmin} alt="Rutas de Valledupar" className="admin-sidebar__logo" />
          <div className="admin-sidebar__header-text">
            <h2 className="admin-sidebar__title">Administración</h2>
            <p className="admin-sidebar__subtitle">Portal Cultural</p>
          </div>
        </div>

        {/* Toggle collapse button */}
        <button
          type="button"
          className={`admin-sidebar__toggle${isCollapsed ? " admin-sidebar__toggle--tooltip" : ""}`}
          onClick={onToggleCollapse}
          data-tooltip={isCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
        >
          <span className="material-symbols-outlined">
            {isCollapsed ? "chevron_right" : "chevron_left"}
          </span>
        </button>

        <div className="admin-sidebar__cta">
          <button
            type="button"
            className={`admin-sidebar__cta-btn${isCollapsed ? " admin-sidebar__cta-btn--tooltip" : ""}`}
            onClick={() => { onNavigate("/admin/panel/rutas?crear=true"); onCloseMobile(); }}
            data-tooltip={isCollapsed ? "Crear Nueva Ruta" : undefined}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            <span className="admin-sidebar__cta-label">Crear Nueva Ruta</span>
          </button>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-sidebar__link${activeId === item.id ? " admin-sidebar__link--active" : ""}${isCollapsed ? " admin-sidebar__link--tooltip" : ""}`}
              onClick={() => {
                onNavigate(item.path);
                onCloseMobile();
              }}
              data-tooltip={isCollapsed ? item.label : undefined}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeId === item.id ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="admin-sidebar__link-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__bottom">
          <button type="button" className={`admin-sidebar__logout${isCollapsed ? " admin-sidebar__link--tooltip" : ""}`} onClick={onLogout} data-tooltip={isCollapsed ? "Cerrar Sesión" : undefined}>
            <span className="material-symbols-outlined">logout</span>
            <span className="admin-sidebar__logout-label">Cerrar Sesión</span>
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

  // Sidebar collapsed state - persistido en localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

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
    <div className={`admin-panel${isSidebarCollapsed ? " admin-panel--sidebar-collapsed" : ""}`}>
      <Sidebar
        activeId={activeId}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />

      <main className="admin-main">
        <TopBar
          profile={profile}
          onToggleMobile={toggleMobileSidebar}
          isMobileOpen={isMobileSidebarOpen}
        />

        <div className="admin-content">
          <Routes>
            <Route index element={
              <div className="admin-route-wrapper" key={location.key}>
                <Dashboard profile={profile} />
              </div>
            } />
            <Route path="rutas" element={
              <div className="admin-route-wrapper" key={location.key}>
                <RouteManager />
              </div>
            } />
            <Route path="usuarios" element={
              <div className="admin-route-wrapper" key={location.key}>
                <UserManager />
              </div>
            } />
            <Route path="glosario" element={
              <div className="admin-route-wrapper" key={location.key}>
                <GlossaryManager />
              </div>
            } />
            <Route path="contenido" element={
              <div className="admin-route-wrapper" key={location.key}>
                <ContentEditor />
              </div>
            } />
            <Route path="galeria" element={
              <div className="admin-route-wrapper" key={location.key}>
                <GalleryManager />
              </div>
            } />
            <Route path="configuracion" element={
              <div className="admin-route-wrapper" key={location.key}>
                <ConfigPage />
              </div>
            } />
            <Route path="*" element={<Navigate to="/admin/panel" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ============================================================
// Helper para agrupar configs por categoría
// ============================================================
function getConfigGroup(clave) {
  if (clave.startsWith("resend_")) return "email";
  if (clave.startsWith("notif_")) return "notificaciones";
  if (clave.startsWith("template_")) return "plantillas";
  return "general";
}

const GROUP_CONFIG = {
  general: { icon: "tune", label: "Ajustes Generales", desc: "Configuración básica del sitio." },
  email: { icon: "mail", label: "Email (Resend)", desc: "Configuración del servicio de correo para notificaciones." },
  notificaciones: { icon: "notifications_active", label: "Notificaciones", desc: "Activa o desactiva las notificaciones automáticas." },
  plantillas: { icon: "code", label: "Plantillas de Correo", desc: "Personaliza las plantillas HTML de los correos automáticos." },
};

// ============================================================
// Componente: PreviewModal para plantillas HTML
// ============================================================
function TemplatePreviewModal({ html, templateName, onClose }) {
  // Reemplazar placeholders con datos de ejemplo para vista previa
  const previewHtml = useMemo(() => {
    return (html || "")
      .replace(/\{\{admin_name\}\}/g, "Admin")
      .replace(/\{\{usuario_nombre\}\}/g, "Carlos Mendoza")
      .replace(/\{\{palabra\}\}/g, "Mochila")
      .replace(/\{\{significado\}\}/g, "Bolso tejido tradicional de la región Caribe, usado por los campesinos para cargar alimentos y objetos personales.")
      .replace(/\{\{categoria\}\}/g, "Objeto")
      .replace(/\{\{motivo\}\}/g, "La palabra ya existe en el glosario con una definición similar.")
      .replace(/\{\{titulo\}\}/g, "Plaza Alfonso López")
      .replace(/\{\{descripcion\}\}/g, "Corazón del Festival Vallenato y punto de encuentro cultural.")
      .replace(/\{\{tipo_multimedia\}\}/g, "Fotografía")
      .replace(/\{\{tipo_sitio\}\}/g, "Patrimonial")
      .replace(/\{\{panel_url\}\}/g, "#")
      .replace(/\{\{sitio_url\}\}/g, "#");
  }, [html]);

  const iframeRef = useCallback((node) => {
    if (node) {
      node.contentDocument.open();
      node.contentDocument.write(previewHtml);
      node.contentDocument.close();
    }
  }, [previewHtml]);

  return (
    <div className="admin-template-overlay" onClick={onClose}>
      <div className="admin-template-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-template-modal__header">
          <div>
            <h3 className="admin-template-modal__title">
              <span className="material-symbols-outlined" style={{ fontSize: 20, verticalAlign: "middle", marginRight: 8 }}>visibility</span>
              Vista Previa: {templateName}
            </h3>
            <p className="admin-template-modal__subtitle">
              Los placeholders se muestran con datos de ejemplo. En producción se reemplazarán con información real.
            </p>
          </div>
          <button className="admin-template-modal__close" type="button" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="admin-template-modal__body">
          <iframe ref={iframeRef} title="Vista previa de plantilla" className="admin-template-modal__iframe" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ConfigPage - Principal
// ============================================================
function ConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [dirty, setDirty] = useState({});
  const [previewTemplate, setPreviewTemplate] = useState(null); // { clave, valor }
  const [expandedTemplates, setExpandedTemplates] = useState({});

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

      await supabase.from("actividad_admin").insert({
        accion: "Configuración actualizada",
        detalle: `${keysToUpdate.length} campo(s) modificado(s)`,
        tipo: "configuracion",
      }).catch(() => {});

      setDirty({});
      setSuccessMsg("Configuración guardada correctamente.");
      setTimeout(() => setSuccessMsg(""), 4000);
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

  const toggleTemplate = (clave) => {
    setExpandedTemplates((prev) => ({ ...prev, [clave]: !prev[clave] }));
  };

  // Agrupar configs
  const groups = useMemo(() => {
    const map = {};
    for (const cfg of configs) {
      const g = getConfigGroup(cfg.clave);
      if (!map[g]) map[g] = [];
      map[g].push(cfg);
    }
    return map;
  }, [configs]);

  const hasChanges = Object.keys(dirty).length > 0;

  // ===== Render de cada campo según tipo =====
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
          <label className="admin-toggle">
            <input
              type="checkbox"
              className="admin-toggle__input"
              checked={value === "true"}
              onChange={(e) => handleChange(config.clave, e.target.checked ? "true" : "false")}
            />
            <span className="admin-toggle__slider" />
            <span className="admin-toggle__label">{config.descripcion}</span>
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
        // Si es una plantilla HTML, mostrar editor grande con preview
        if (config.clave.startsWith("template_")) {
          const isExpanded = expandedTemplates[config.clave];
          const templateName = config.clave
            .replace("template_", "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          return (
            <div className="admin-template-editor">
              <div className="admin-template-editor__toolbar">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  onClick={() => toggleTemplate(config.clave)}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>
                    {isExpanded ? "unfold_less" : "unfold_more"}
                  </span>
                  {isExpanded ? "Colapsar" : "Expandir HTML"}
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  onClick={() => setPreviewTemplate({ clave: config.clave, valor: value })}
                  style={{ fontSize: 12, padding: "6px 12px" }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>visibility</span>
                  Vista Previa
                </button>
              </div>
              {isExpanded && (
                <textarea
                  className="admin-template-editor__textarea"
                  value={value}
                  onChange={(e) => handleChange(config.clave, e.target.value)}
                  rows={16}
                  spellCheck={false}
                />
              )}
              {!isExpanded && (
                <div
                  className="admin-template-editor__preview"
                  onClick={() => toggleTemplate(config.clave)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 6, color: "var(--outline)" }}>code</span>
                  <span style={{ color: "var(--on-surface-variant)", fontSize: 13 }}>
                    {value ? `HTML (${value.length} caracteres)` : "Plantilla vacía — haz clic para editar"}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: "auto", color: "var(--outline)" }}>chevron_right</span>
                </div>
              )}
              {isDirty && (
                <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600, marginTop: 4, display: "inline-block" }}>
                  • Sin guardar
                </span>
              )}
            </div>
          );
        }

        // Para resend_api_key, mostrar campo tipo password
        if (config.clave === "resend_api_key") {
          return (
            <div style={{ position: "relative" }}>
              <input
                type="password"
                value={value}
                onChange={(e) => handleChange(config.clave, e.target.value)}
                placeholder={config.descripcion}
                style={{
                  ...inputStyle,
                  paddingRight: 40,
                  fontFamily: value && !isDirty ? "monospace" : "var(--font-body)",
                  fontSize: 14,
                  letterSpacing: value && !isDirty ? "0.1em" : "normal",
                }}
              />
              <span
                className="material-symbols-outlined"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--outline)",
                  fontSize: 18,
                  pointerEvents: "none",
                }}
              >key</span>
            </div>
          );
        }

        // Texto normal
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

  // ===== Render de una sección completa =====
  const renderSection = (groupKey, groupConfigs) => {
    const meta = GROUP_CONFIG[groupKey];
    return (
      <div key={groupKey} className="admin-card admin-config-section" style={{ overflow: "hidden" }}>
        <div className="admin-card__header">
          <h3 className="admin-card__title">
            <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontVariationSettings: "'FILL' 1", fontSize: 22 }}>{meta.icon}</span>
            {meta.label}
          </h3>
        </div>
        <div className="admin-card__body">
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--outline)", lineHeight: 1.5 }}>{meta.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: groupKey === "notificaciones" ? 8 : 24 }}>
            {groupConfigs.map((config) => (
              <div key={config.clave}>
                {!config.clave.startsWith("template_") && (
                  <label
                    style={{
                      display: "block",
                      fontFamily: "var(--font-body)",
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: "var(--on-surface-variant)",
                      marginBottom: config.tipo === "booleano" ? 0 : 6,
                      textTransform: "uppercase",
                    }}
                  >
                    {config.clave
                      .replace(/^(resend_|notif_)/, "")
                      .replace(/_/g, " ")}
                  </label>
                )}
                {config.tipo !== "booleano" && (
                  <p style={{ margin: "0 0 8px", fontSize: 13, color: "var(--outline)" }}>{config.descripcion}</p>
                )}
                {renderField(config)}
                {config.tipo !== "booleano" && !config.clave.startsWith("template_") && (
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--outline)", display: "flex", justifyContent: "space-between" }}>
                    <span>{config.tipo === "texto" ? "Texto" : config.tipo}</span>
                    {dirty[config.clave] !== undefined && !config.clave.startsWith("template_") && (
                      <span style={{ color: "var(--primary)", fontWeight: 600 }}>• Sin guardar</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Configuración</h1>
            <p className="admin-page-header__subtitle">
              Ajustes generales, notificaciones y plantillas de correo.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {hasChanges && (
              <button
                className="admin-btn admin-btn--ghost"
                type="button"
                onClick={() => setDirty({})}
                style={{ border: "1px solid var(--outline-variant)" }}
              >
                Descartar
              </button>
            )}
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {saving ? (
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              ) : (
                <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Guardar Cambios</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="admin-config-msg admin-config-msg--success">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="admin-config-msg admin-config-msg--error">
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
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Sección General */}
          {groups.general && renderSection("general", groups.general)}

          {/* Sección Email */}
          {groups.email && renderSection("email", groups.email)}

          {/* Sección Notificaciones */}
          {groups.notificaciones && renderSection("notificaciones", groups.notificaciones)}

          {/* Sección Plantillas */}
          {groups.plantillas && renderSection("plantillas", groups.plantillas)}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          html={previewTemplate.valor}
          templateName={previewTemplate.clave
            .replace("template_", "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase())}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  );
}
