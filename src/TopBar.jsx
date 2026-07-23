import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import AuthModal from "./AuthModal";
import ProfileModal from "./ProfileModal";
import logoWhiteHero from "./assets/mcp/logo_white_hero.png";
import "./TopBar.css";

const USER_SESSION_KEY = "rutas_user_session";

const navItems = [
  { id: "inicio", label: "Inicio", to: "/inicio" },
  { id: "mapas", label: "Mapa", to: "/mapas" },
  { id: "rutas-interactivas", label: "Rutas", to: "/rutas-interactivas" },
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
  const [showMobileNav, setShowMobileNav] = useState(false);
  const menuRef = useRef(null);
  const mobileNavRef = useRef(null);

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

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      // Close user dropdown when clicking outside
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
      // Close mobile nav when clicking outside (but not the hamburger itself)
      if (mobileNavRef.current && showMobileNav) {
        const hamburger = document.querySelector('.topbar__hamburger');
        const isHamburgerClick = hamburger && hamburger.contains(e.target);
        const isOutsideDrawer = !mobileNavRef.current.contains(e.target);
        if (isOutsideDrawer && !isHamburgerClick) {
          setShowMobileNav(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [showMobileNav]);

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
            {/* Mobile hamburger - left side next to logo */}
            <button
              type="button"
              className="topbar__hamburger"
              aria-label="Abrir menú de navegación"
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileNav((v) => !v);
              }}
            >
              <span className={`topbar__hamburger-line${showMobileNav ? " open" : ""}`} />
              <span className={`topbar__hamburger-line${showMobileNav ? " open" : ""}`} />
              <span className={`topbar__hamburger-line${showMobileNav ? " open" : ""}`} />
            </button>
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
              <div ref={menuRef} className="topbar__user-area">
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
                  className="topbar__btn topbar__btn--login"
                  onClick={() => { setShowAuth("login"); }}
                >
                  <span className="topbar__btn-label">Iniciar sesión</span>
                  <span className="topbar__btn-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                  </span>
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

        {/* Mobile Navigation Drawer */}
        {showMobileNav && (
          <>
            <div className="topbar__mobile-overlay" onClick={() => setShowMobileNav(false)} />
            <nav ref={mobileNavRef} className="topbar__mobile-drawer" aria-label="Navegación móvil">
              <div className="topbar__mobile-drawer-header">
                <img src={logoWhiteHero} alt="Rutas de Valledupar" className="topbar__mobile-logo" />
                <button
                  type="button"
                  className="topbar__mobile-close"
                  aria-label="Cerrar menú"
                  onClick={() => setShowMobileNav(false)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="topbar__mobile-nav-items">
                {navItems.map((item) => {
                  const content = (
                    <>
                      <NavIcon id={item.id} />
                      <span>{item.label}</span>
                    </>
                  );

                  if (item.to) {
                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        className={`topbar__mobile-link${activeSection === item.id ? " active" : ""}`}
                        onClick={() => setShowMobileNav(false)}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`topbar__mobile-link${activeSection === item.id ? " active" : ""}`}
                      onClick={() => {
                        onSectionChange(item.id);
                        setShowMobileNav(false);
                      }}
                    >
                      {content}
                    </a>
                  );
                })}
              </div>

              {isAuthenticated ? (
                <div className="topbar__mobile-footer">
                  <div className="topbar__mobile-user">
                    <div className="topbar__avatar">
                      {avatar ? (
                        <img src={avatar} alt={userName} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="topbar__mobile-user-info">
                      <p className="topbar__mobile-user-name">{userName}</p>
                      {isAdmin && <span className="topbar__mobile-user-badge">Administrador</span>}
                    </div>
                  </div>

                  {/* User menu items */}
                  <div className="topbar__mobile-menu-items">
                    {menuItems.map((item) => {
                      if (item.id === "logout") return null;

                      if (item.action === "profile") {
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="topbar__mobile-menu-item"
                            onClick={() => {
                              setShowMobileNav(false);
                              setShowProfile(true);
                            }}
                          >
                            <Icon name={item.icon} />
                            <span>{item.label}</span>
                          </button>
                        );
                      }

                      const ItemTag = item.external ? "a" : Link;
                      const extraProps = item.external
                        ? { href: item.to }
                        : { to: item.to, onClick: () => setShowMobileNav(false) };

                      return (
                        <ItemTag
                          key={item.id}
                          {...extraProps}
                          className="topbar__mobile-menu-item"
                        >
                          <Icon name={item.icon} />
                          <span>{item.label}</span>
                        </ItemTag>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    className="topbar__mobile-logout"
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Cerrar sesión
                  </button>
                </div>
              ) : (
                <div className="topbar__mobile-footer">
                  <button
                    type="button"
                    className="topbar__mobile-auth-btn"
                    onClick={() => { setShowAuth("register"); setShowMobileNav(false); }}
                  >
                    Crear cuenta
                  </button>
                  <button
                    type="button"
                    className="topbar__mobile-auth-btn topbar__mobile-auth-btn--secondary"
                    onClick={() => { setShowAuth("login"); setShowMobileNav(false); }}
                  >
                    Iniciar sesión
                  </button>
                </div>
              )}
            </nav>
          </>
        )}
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

function NavIcon({ id }) {
  const s = 18;
  const p = { width: s, height: s, fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (id) {
    case "inicio":
      return <svg {...p} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
    case "mapas":
      return <svg {...p} viewBox="0 0 24 24"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><path d="M8 2v16" /><path d="M16 6v16" /></svg>;
    case "glosario":
      return <svg {...p} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /></svg>;
    case "galeria":
      return <svg {...p} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>;
    case "acerca":
      return <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
    default:
      return <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>;
  }
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
