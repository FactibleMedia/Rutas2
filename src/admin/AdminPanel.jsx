import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminProfile } from "./adminAuth";
import { supabase } from "../supabaseClient";
import Dashboard from "./Dashboard";
import RouteManager from "./RouteManager";
import UserManager from "./UserManager";
import ContentEditor from "./ContentEditor";
import logoWhiteNav from "../assets/mcp/logo_white_nav.png";
import logoAlt from "../assets/mcp/logo_alt.png";
import "./AdminPanel.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/admin/panel" },
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
          <button className="admin-sidebar__cta-btn" type="button">
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
            <Route path="contenido" element={<ContentEditor />} />
            <Route path="configuracion" element={<ConfigPlaceholder />} />
            <Route path="*" element={<Navigate to="/admin/panel" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function ConfigPlaceholder() {
  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Configuración</h1>
            <p className="admin-page-header__subtitle">Ajustes generales de la plataforma.</p>
          </div>
        </div>
      </div>
      <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
        <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16 }}>settings</span>
        <p>Panel de configuración próximamente.</p>
      </div>
    </>
  );
}
