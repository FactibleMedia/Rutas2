import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "./TopBar";
import Footer from "./Footer";
import { supabase } from "./supabaseClient";
import "./MisAportes.css";

const STATUS_CONFIG = {
  aprobado: { icon: "check_circle", label: "Aprobado", className: "ma-status--aprobado" },
  pendiente: { icon: "schedule", label: "Pendiente", className: "ma-status--pendiente" },
  rechazado: { icon: "cancel", label: "Rechazado", className: "ma-status--rechazado" },
};

const CATEGORY_META = {
  palabra: { icon: "menu_book", label: "Palabra", color: "#d97706" },
  comentario: { icon: "chat_bubble", label: "Comentario", color: "#7e441e" },
  blog: { icon: "article", label: "Blog", color: "#a16207" },
  ruta: { icon: "map", label: "Ruta", color: "#627c50" },
};

const FALLBACK_AVATAR = "data:image/svg+xml," + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" fill="#fef3c7"/><text x="40" y="46" text-anchor="middle" dominant-baseline="middle" font-family="Bebas Neue, sans-serif" font-size="28" fill="#92400e">UV</text></svg>'
);

function getInitials(name) {
  if (!name) return "UV";
  return name.split(" ").map(w => w.charAt(0).toUpperCase()).slice(0, 2).join("");
}

export default function MisAportes() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("todas");
  const [activeCategory, setActiveCategory] = useState("todas");

  // Load session and fetch contributions
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!currentSession?.user) {
          setLoading(false);
          return;
        }

        if (!mounted) return;
        setSession(currentSession);

        const userId = currentSession.user.id;
        const userMeta = currentSession.user.user_metadata || {};
        const userName = [userMeta.nombre, userMeta.apellido].filter(Boolean).join(" ") || currentSession.user.email;

        // Get profile
        const { data: perfil } = await supabase
          .from("perfiles_usuario")
          .select("nombre, apellido, foto_perfil")
          .eq("id", userId)
          .maybeSingle();

        const displayName = perfil
          ? [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || userName
          : userName;
        const avatar = perfil?.foto_perfil || "";

        if (!mounted) return;
        setUserProfile({ name: displayName, initials: getInitials(displayName), avatar });

        // Fetch glossary suggestions by this user
        const { data: sugerencias } = await supabase
          .from("glosario_sugerencias")
          .select("id, palabra, significado, categoria, estado, creado_en")
          .eq("usuario_id", userId)
          .order("creado_en", { ascending: false });

        const mapped = (sugerencias || []).map((s) => ({
          id: `sug-${s.id}`,
          type: "palabra",
          title: s.palabra,
          description: s.significado,
          category: s.categoria || "Para referirse",
          status: s.estado || "pendiente",
          date: s.creado_en,
          icon: "menu_book",
        }));

        if (!mounted) return;
        setContributions(mapped);
      } catch (err) {
        console.warn("Error loading contributions:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, []);

  // Filtered contributions
  const filteredContributions = useMemo(() => {
    let result = [...contributions];

    if (activeCategory !== "todas") {
      result = result.filter((c) => c.type === activeCategory);
    }

    if (activeFilter === "aprobado") {
      result = result.filter((c) => c.status === "aprobado");
    } else if (activeFilter === "pendiente") {
      result = result.filter((c) => c.status === "pendiente");
    } else if (activeFilter === "rechazado") {
      result = result.filter((c) => c.status === "rechazado");
    }

    return result;
  }, [contributions, activeCategory, activeFilter]);

  const totalContributions = contributions.length;
  const approvedCount = contributions.filter((c) => c.status === "aprobado").length;
  const pendingCount = contributions.filter((c) => c.status === "pendiente").length;
  const rejectedCount = contributions.filter((c) => c.status === "rechazado").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem`;
    return date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
  };

  const getCategoryIcon = (type) => {
    const meta = CATEGORY_META[type];
    return meta?.icon || "article";
  };

  const getCategoryLabel = (type) => {
    const meta = CATEGORY_META[type];
    return meta?.label || type;
  };

  const stats = [
    { label: "Aportes", value: totalContributions, icon: "history_edu", color: "#d97706" },
    { label: "Aprobados", value: approvedCount, icon: "check_circle", color: "#15803d" },
    { label: "Pendientes", value: pendingCount, icon: "schedule", color: "#a16207" },
    { label: "Rechazados", value: rejectedCount, icon: "cancel", color: "#b91c1c" },
  ];

  const categoryButtons = [
    { id: "todas", icon: "apps", label: "Todas" },
    { id: "palabra", icon: "menu_book", label: "Palabras" },
    { id: "comentario", icon: "chat_bubble", label: "Comentarios" },
    { id: "blog", icon: "article", label: "Blog" },
    { id: "ruta", icon: "map", label: "Rutas" },
  ];

  const user = userProfile || { name: "Cargando...", initials: "UV", avatar: "" };

  return (
    <div className="ma-page">
      <TopBar activeSection="inicio" />

      <main className="ma-main">
        <div className="ma-container">
          {/* ===== HERO / PROFILE HEADER ===== */}
          <section className="ma-hero">
            <div className="ma-hero__bg" />
            <div className="ma-hero__content">
              <div className="ma-hero__top">
                <div className="ma-hero__info">
                  <span className="ma-hero__eyebrow">Panel del Colaborador</span>
                  <h1 className="ma-hero__title">
                    {session ? (
                      <>Hola,<br />{user.name?.split(" ")[0] || "Usuario"}</>
                    ) : (
                      "Mis Aportes"
                    )}
                  </h1>
                </div>
                <div className="ma-hero__avatar">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span className="ma-hero__avatar-initials">{user.initials}</span>
                  )}
                  <div className="ma-hero__avatar-ring" />
                </div>
              </div>

              {session && (
                <div className="ma-hero__stats-row">
                  {stats.map((stat) => (
                    <div key={stat.label} className="ma-hero__stat">
                      <span className="material-symbols-outlined" style={{ color: stat.color, fontVariationSettings: "'FILL' 1" }}>
                        {stat.icon}
                      </span>
                      <div>
                        <strong>{stat.value}</strong>
                        <small>{stat.label}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!session && (
                <div className="ma-hero__no-session">
                  <span className="material-symbols-outlined">person_outline</span>
                  <p>Inicia sesión para ver tus contribuciones</p>
                  <Link to="/inicio" className="ma-hero__cta-btn">
                    Ir al inicio
                  </Link>
                </div>
              )}
            </div>

            {/* Decorative sticker */}
            <div className="ma-hero__sticker">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                piano
              </span>
            </div>
          </section>

          {/* ===== CATEGORY GRID ===== */}
          {session && (
            <section className="ma-categories">
              <h2 className="ma-section-title">Categorías</h2>
              <div className="ma-categories__grid">
                {categoryButtons.filter((c) => c.id !== "todas").map((cat) => (
                  <button
                    key={cat.id}
                    className={`ma-category-btn${activeCategory === cat.id ? " ma-category-btn--active" : ""}`}
                    onClick={() => setActiveCategory(activeCategory === cat.id ? "todas" : cat.id)}
                  >
                    <span className="material-symbols-outlined">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ===== CONTRIBUTIONS LIST ===== */}
          {session && (
            <section className="ma-contributions">
              <div className="ma-contributions__header">
                <h2 className="ma-section-title">Aportes Recientes</h2>
                <div className="ma-contributions__filters">
                  {["todas", "aprobado", "pendiente", "rechazado"].map((f) => (
                    <button
                      key={f}
                      className={`ma-filter-chip${activeFilter === f ? " ma-filter-chip--active" : ""}`}
                      onClick={() => setActiveFilter(f)}
                    >
                      {f === "todas" ? "Todas" : STATUS_CONFIG[f]?.label || f}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="ma-loading">
                  <div className="ma-loading__spinner" />
                  <p>Cargando tus aportes...</p>
                </div>
              ) : filteredContributions.length === 0 ? (
                <div className="ma-empty">
                  <span className="material-symbols-outlined ma-empty__icon">inbox</span>
                  <p className="ma-empty__title">No hay aportes {activeFilter !== "todas" ? STATUS_CONFIG[activeFilter]?.label.toLowerCase() : ""} aún</p>
                  <p className="ma-empty__desc">Tus palabras, comentarios y rutas aparecerán aquí</p>
                  <Link to="/glosario" className="ma-empty__btn">
                    <span className="material-symbols-outlined">add</span>
                    Aportar palabra
                  </Link>
                </div>
              ) : (
                <div className="ma-contributions__list">
                  {filteredContributions.map((item) => (
                    <article key={item.id} className="ma-card">
                      <div className="ma-card__badge-row">
                        <span className="ma-card__type-badge">
                          <span className="material-symbols-outlined">{getCategoryIcon(item.type)}</span>
                          {getCategoryLabel(item.type)}
                        </span>
                        <span className={`ma-card__status ${STATUS_CONFIG[item.status]?.className || ""}`}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            {STATUS_CONFIG[item.status]?.icon || "help"}
                          </span>
                          {STATUS_CONFIG[item.status]?.label || item.status}
                        </span>
                      </div>

                      <h3 className="ma-card__title">{item.title}</h3>
                      <p className="ma-card__desc">{item.description}</p>

                      {item.category && (
                        <span className="ma-card__category">{item.category}</span>
                      )}

                      <div className="ma-card__footer">
                        <span className="ma-card__date">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                          {formatDate(item.date)}
                        </span>
                        <span className="ma-card__more material-symbols-outlined">more_horiz</span>
                      </div>

                      {/* Decorative background icon */}
                      <span className="ma-card__decor-icon material-symbols-outlined">
                        {getCategoryIcon(item.type)}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ===== FLOATING ACTION BUTTON ===== */}
          {session && (
            <Link to="/glosario" className="ma-fab" aria-label="Nuevo aporte">
              <span className="material-symbols-outlined">add</span>
            </Link>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
