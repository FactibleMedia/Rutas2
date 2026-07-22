import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import AuthModal from "./AuthModal";
import ProfileModal from "./ProfileModal";
import logoWhiteHero from "./assets/mcp/logo_white_hero.png";
import "./TopBar.css";

const USER_SESSION_KEY = "rutas_user_session";

const navItems = [
  { id: "inicio", label: "Inicio" },
  { id: "mapas", label: "Mapa", to: "/mapas" },
  { id: "glosario", label: "Glosario", to: "/glosario" },
  { id: "galeria", label: "Galeria", to: "/galeria" },
  { id: "acerca", label: "Acerca de", to: "/acerca-de" },
];

function getInitialSession() {
  try {
    const raw = localStorage.getItem(USER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function TopBar({
  activeSection = "inicio",
  isAuthenticated: propIsAuthenticated,
  user: propUser,
  onSectionChange = () => {},
}) {
  const [authUser, setAuthUser] = useState(getInitialSession);
  const [showAuth, setShowAuth] = useState(null); // null | "login" | "register"
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Restore session from Supabase on mount (page refresh / OAuth redirect)
  // Always refreshes profile data (avatar, role) even if localStorage has a cached session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data?.session?.user) {
        const uid = data.session.user.id;
        const meta = data.session.user.user_metadata || {};
        const name = [meta.nombre, meta.apellido].filter(Boolean).join(" ") || data.session.user.email;

        // Try to get full profile from perfiles_usuario
        const { data: perfil } = await supabase
          .from("perfiles_usuario")
          .select("nombre, apellido, foto_perfil")
          .eq("id", uid)
          .maybeSingle();

        let displayName = name;
        let avatar = "";

        if (perfil) {
          displayName = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || name;
          avatar = perfil.foto_perfil || "";
        }

        // Check if user is admin (separate query to usuarios table)
        const { data: adminUser } = await supabase
          .from("usuarios")
          .select("id, avatar_url")
          .eq("id", uid)
          .eq("rol", "administrador")
          .eq("activo", true)
          .maybeSingle();

        const isAdmin = !!adminUser;

        // If admin and we still don't have an avatar, try from usuarios
        if (isAdmin && !avatar && adminUser?.avatar_url) {
          avatar = adminUser.avatar_url;
        }

        const session = { name: displayName, initials: getInitials(displayName), isAdmin, avatar };
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
        setAuthUser(session);
      }
    });
  }, []);

  // Sync from props if provided (admin mode)
  const effectiveUser = authUser || propUser;
  const isAuthenticated = propIsAuthenticated || !!authUser;

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleAuthSuccess = useCallback((userData) => {
    const session = {
      name: userData.name,
      initials: getInitials(userData.name),
      isAdmin: !!userData.isAdmin,
      avatar: userData.avatar || "",
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    setAuthUser(session);
    setShowAuth(false);
    setShowMenu(false);
  }, []);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem(USER_SESSION_KEY);
    setAuthUser(null);
    setShowMenu(false);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore signout errors
    }
  }, []);

  const handleProfileUpdate = useCallback((profileData) => {
    const current = authUser || {};
    const updated = {
      ...current,
      name: profileData.name || current.name,
      initials: getInitials(profileData.name || current.name),
      avatar: profileData.avatar || current.avatar || "",
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(updated));
    setAuthUser(updated);
  }, [authUser]);

  const initials = effectiveUser?.initials || "UV";
  const userName = effectiveUser?.name || "Usuario";
  const isAdmin = !!effectiveUser?.isAdmin;
  const avatar = effectiveUser?.avatar || "";

  const menuItems = isAdmin
    ? [
        {
          id: "panel-admin",
          label: "Panel Admin",
          icon: "shield",
          to: "/admin/panel",
          external: true,
        },
        {
          id: "perfil",
          label: "Perfil",
          icon: "user",
          action: "profile",
        },
        { id: "logout", label: "Cerrar sesión", icon: "logout", divider: true },
      ]
    : [
        {
          id: "mi-perfil",
          label: "Mi Perfil",
          icon: "user",
          action: "profile",
        },
        {
          id: "mis-aportes",
          label: "Mis Aportes",
          icon: "plus-circle",
          to: "/mis-aportes",
        },
        {
          id: "mi-blog",
          label: "Mi Blog Vallenato",
          icon: "edit",
          to: "/mi-blog",
        },
        { id: "logout", label: "Cerrar sesión", icon: "logout", divider: true },
      ];

  return (
    <>
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__brand">
            <img src={logoWhiteHero} alt="Rutas de Valledupar" className="topbar__logo" />
          </div>

          <nav className="topbar__nav" aria-label="Navegación principal">
            {navItems.map((item) =>
              item.to ? (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`topbar__link${activeSection === item.id ? " active" : ""}`}
                >
                  {item.label}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`topbar__link${activeSection === item.id ? " active" : ""}`}
                  onClick={() => onSectionChange(item.id)}
                >
                  {item.label}
                </a>
              )
            )}
          </nav>

          <div className="topbar__actions">
            {/* Search */}
            <button type="button" className="topbar__search-btn" aria-label="Buscar">
              <span className="topbar__search-icon" aria-hidden="true" />
            </button>

            {isAuthenticated ? (
              <div ref={menuRef} style={{ position: "relative", display: "flex", alignItems: "center", gap: 8 }}>
                {/* Menu button */}
                <button
                  type="button"
                  className="topbar__menu-btn"
                  aria-label="Abrir menú"
                  onClick={() => setShowMenu((v) => !v)}
                >
                  <span className="topbar__menu-line" />
                  <span className="topbar__menu-line" />
                  <span className="topbar__menu-line" />
                </button>

                {/* Avatar */}
                <div className="topbar__avatar" title={userName}>
                  {avatar ? (
                    <img src={avatar} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                  ) : (
                    initials
                  )}
                </div>

                {/* Dropdown menu */}
                {showMenu && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      zIndex: 300,
                      background: "#22170F",
                      border: "1px solid #3A281B",
                      borderRadius: 12,
                      boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                      minWidth: 200,
                      padding: "8px",
                      animation: "auth-fade-in 0.2s ease",
                    }}
                  >
                    {/* User info */}
                    <div
                      style={{
                        padding: "12px 12px 8px",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        marginBottom: 4,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          color: "#FFFDF0",
                          fontFamily: "'Inter', sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        {userName}
                      </p>
                      {isAdmin && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#E89252",
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Administrador
                        </span>
                      )}
                    </div>

                    {/* Menu items */}
                    {menuItems.map((item) => {
                      if (item.id === "logout") {
                        return (
                          <button
                            key={item.id}
                            onClick={handleLogout}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              padding: "10px 12px",
                              textAlign: "left",
                              cursor: "pointer",
                              color: "#C8B8A6",
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 13,
                              borderRadius: 8,
                              transition: "background 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              marginTop: item.divider ? 8 : 0,
                              borderTop: item.divider ? "1px solid rgba(255,255,255,0.08)" : "none",
                              paddingTop: item.divider ? 12 : 10,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <Icon name={item.icon} />
                            {item.label}
                          </button>
                        );
                      }

                      // If item has action="profile", open ProfileModal
                      if (item.action === "profile") {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              setShowMenu(false);
                              setShowProfile(true);
                            }}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              padding: "10px 12px",
                              textAlign: "left",
                              cursor: "pointer",
                              color: "#FFFDF0",
                              fontFamily: "'Inter', sans-serif",
                              fontSize: 13,
                              borderRadius: 8,
                              transition: "background 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <Icon name={item.icon} />
                            {item.label}
                          </button>
                        );
                      }

                      const ItemTag = item.external ? "a" : Link;
                      const extraProps = item.external
                        ? { href: item.to }
                        : { to: item.to, onClick: () => setShowMenu(false) };

                      return (
                        <ItemTag
                          key={item.id}
                          {...extraProps}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 12px",
                            color: "#FFFDF0",
                            fontFamily: "'Inter', sans-serif",
                            fontSize: 13,
                            borderRadius: 8,
                            textDecoration: "none",
                            transition: "background 0.2s",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                        >
                          <Icon name={item.icon} />
                          {item.label}
                        </ItemTag>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="topbar__btn"
                  style={{ background: "transparent", border: "1px solid rgba(255,252,230,0.25)", color: "#fffce6" }}
                  onClick={() => { setShowAuth("login"); }}
                >
                  Iniciar sesión
                </button>
                <button
                  type="button"
                  className="topbar__btn"
                  onClick={() => { setShowAuth("register"); }}
                >
                  Regístrate
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <AuthModal
          initialView={showAuth}
          onClose={() => setShowAuth(null)}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}

function getInitials(name) {
  if (!name) return "UV";
  return name
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}

function Icon({ name }) {
  const size = 16;
  const props = { width: size, height: size, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "shield":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "user":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "plus-circle":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "edit":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    case "logout":
      return (
        <svg {...props} viewBox="0 0 24 24">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
      );
    default:
      return (
        <svg {...props} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
  }
}
