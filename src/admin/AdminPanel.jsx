import { useMemo, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminProfile } from "./adminAuth";
import { supabase } from "../supabaseClient";
import Dashboard from "./Dashboard";
import RouteManager from "./RouteManager";
import UserManager from "./UserManager";
import ContentEditor from "./ContentEditor";
import "./AdminPanel.css";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", path: "/admin/panel" },
  { id: "rutas", label: "Gestión de Rutas", icon: "map", path: "/admin/panel/rutas" },
  { id: "contenido", label: "Editor Multimedia", icon: "edit_note", path: "/admin/panel/contenido" },
  { id: "usuarios", label: "Usuarios y Roles", icon: "group", path: "/admin/panel/usuarios" },
  { id: "config", label: "Configuración", icon: "settings", path: "/admin/panel/configuracion" },
];

function getInitials(name) {
  const parts = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.length ? parts.map((p) => p[0].toUpperCase()).join("") : "AD";
}

function Sidebar({ activeId, onNavigate, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__avatar">
          <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>star</span>
        </div>
        <div>
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
            onClick={() => onNavigate(item.path)}
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
  );
}

function TopBar({ profile }) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar__brand">Rutas Vallenatas</div>
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

  const activeId = useMemo(() => {
    const path = location.pathname;
    const found = NAV_ITEMS.find((item) => item.path === path);
    return found?.id || "dashboard";
  }, [location.pathname]);

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAdminSession();
    navigate("/admin", { replace: true });
  };

  return (
    <div className="admin-panel">
      <Sidebar activeId={activeId} onNavigate={handleNavigate} onLogout={handleLogout} />

      <main className="admin-main">
        <TopBar profile={profile} />

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
