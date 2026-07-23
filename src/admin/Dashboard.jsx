import { useCallback, useEffect, useMemo, useState } from "react";
import { getRouteCounts, useMapLocations } from "../mapLocationsStore";
import { supabase } from "../supabaseClient";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getTodayDate() {
  return new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function Dashboard({ profile }) {
  const locations = useMapLocations();
  const routeCounts = useMemo(() => getRouteCounts(locations), [locations]);
  const [userCount, setUserCount] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        // Fetch user count usando RPC para evitar recursión RLS
        const { data: countData, error: countError } = await supabase
          .rpc("get_usuarios_count");

        if (!cancelled && !countError) {
          setUserCount(countData || 0);
        }

        // Fetch recent activity
        const { data: activityData, error: actError } = await supabase
          .from("actividad_admin")
          .select("id, accion, detalle, tipo, creado_en")
          .order("creado_en", { ascending: false })
          .limit(5);

        if (!cancelled && !actError) {
          setRecentActivity(activityData || []);
        }
      } catch (err) {
        console.warn("Dashboard: Error fetching data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const activeRoutes = routeCounts.filter((r) => r.count > 0).length;
    const totalLocations = locations.length;
    return [
      {
        label: "Rutas Activas",
        value: String(activeRoutes),
        icon: "route",
        iconClass: "admin-metric__icon--tertiary",
        trend: `${totalLocations} ubicaciones registradas`,
        trending: "up",
      },
      {
        label: "Usuarios Registrados",
        value: userCount !== null ? String(userCount) : "—",
        icon: "person",
        iconClass: "admin-metric__icon--primary",
        trend: "Sistema de roles activo",
        trending: "up",
      },
      {
        label: "Actividad Reciente",
        value: String(recentActivity.length),
        icon: "history",
        iconClass: "admin-metric__icon--secondary",
        trend: "Eventos en el panel",
        trending: "up",
      },
    ];
  }, [routeCounts, locations.length, userCount, recentActivity.length]);

  // Simulate chart heights based on data pattern
  const chartHeights = useMemo(() => {
    return DAY_LABELS.map((_, i) => {
      const base = locations.length * 10;
      return Math.max(20, base + (i * 7) % 60 - 20);
    });
  }, [locations.length]);

  const chartMax = Math.max(...chartHeights);

  const getActivityIcon = (type) => {
    switch (type) {
      case "creacion": return "add_circle";
      case "edicion": return "edit";
      case "eliminacion": return "delete";
      case "login": return "login";
      case "configuracion": return "settings";
      default: return "circle";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "creacion": return "var(--primary)";
      case "edicion": return "var(--secondary-container)";
      case "eliminacion": return "var(--error)";
      case "login": return "var(--tertiary)";
      case "configuracion": return "var(--secondary)";
      default: return "var(--outline)";
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Panel General</h1>
            <p className="admin-page-header__subtitle">
              Bienvenido de nuevo, {profile?.name?.split(" ")[0] || "Admin"}. Aquí está el resumen de hoy.
            </p>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, letterSpacing: "0.05em", color: "var(--secondary)", border: "1px solid var(--outline-variant)", background: "var(--surface-container-low)", padding: "8px 16px", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_today</span>
            {getTodayDate()}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="admin-metrics">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-metric">
            <div className="admin-metric__bg-icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {stat.icon === "route" ? "map" : stat.icon === "person" ? "group" : "history"}
              </span>
            </div>
            <div className="admin-metric__head">
              <p className="admin-metric__label">{stat.label}</p>
              <div className={`admin-metric__icon ${stat.iconClass}`}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                  {stat.icon}
                </span>
              </div>
            </div>
            <p className="admin-metric__value">{stat.value}</p>
            <div className="admin-metric__trend">
              <span className="material-symbols-outlined">trending_up</span>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Middle Section */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-gutter)", marginBottom: 48 }}>
        {/* Activity Chart */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>trending_up</span>
              Distribución de Ubicaciones
            </h3>
          </div>
          <div className="admin-card__body">
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8, height: 256, paddingTop: 24 }}>
              {chartHeights.map((height, index) => {
                const pct = (height / chartMax) * 100;
                const isToday = index === new Date().getDay();
                return (
                  <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: "100%", height: `${pct}%`, borderRadius: "4px 4px 0 0",
                      background: isToday ? "var(--primary)" : index < 3 ? "var(--secondary-container)" : "var(--tertiary)",
                      borderLeft: "1px solid", borderRight: "1px solid", borderTop: "1px solid",
                      borderColor: isToday ? "var(--primary-container)" : "var(--outline)",
                      transition: "all 0.3s ease", minHeight: 8,
                      boxShadow: isToday ? "inset 0 2px 4px rgba(0,0,0,0.1)" : "none",
                    }} />
                    <span style={{ fontSize: 14, fontWeight: isToday ? 700 : 400, color: isToday ? "var(--on-surface)" : "var(--on-surface-variant)" }}>
                      {DAY_LABELS[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Actividad Reciente</h3>
          </div>
          <div className="admin-card__body" style={{ padding: "16px 24px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: 24, color: "var(--on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, opacity: 0.3, display: "block", marginBottom: 8, animation: "spin 1s linear infinite" }}>sync</span>
                Cargando...
              </div>
            ) : recentActivity.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: "var(--on-surface-variant)" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, opacity: 0.3, display: "block", marginBottom: 8 }}>history</span>
                <p style={{ margin: 0, fontSize: 14 }}>Sin actividad reciente</p>
              </div>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                {recentActivity.map((item) => (
                  <li key={item.id} style={{ display: "flex", gap: 16 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 8, flexShrink: 0, background: getActivityColor(item.tipo) }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 16, color: "var(--on-surface)", lineHeight: "24px" }}>{item.accion}</p>
                      {item.detalle && <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{item.detalle}</span>}
                      <div style={{ fontSize: 12, color: "var(--on-surface-variant)", marginTop: 2 }}>{formatTimeAgo(item.creado_en)}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button className="admin-btn admin-btn--secondary" style={{ width: "100%", marginTop: 24, justifyContent: "center" }} type="button">
              Ver Todo el Historial
            </button>
          </div>
        </div>
      </div>

      {/* Route Distribution */}
      <div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>map</span>
          Distribución de Rutas
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-gutter)" }}>
          {routeCounts.map((route) => (
            <div key={route.id} className="admin-card" style={{ padding: 8 }}>
              <div style={{ width: "100%", height: 100, borderRadius: "var(--radius-md)", marginBottom: 12, background: route.id === "patrimonial" ? "rgba(157, 61, 28, 0.08)" : route.id === "gastronomica" ? "rgba(128, 86, 0, 0.08)" : "rgba(58, 79, 49, 0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: route.id === "patrimonial" ? "var(--primary)" : route.id === "gastronomica" ? "var(--secondary)" : "var(--tertiary)", opacity: 0.5 }}>
                  {route.id === "patrimonial" ? "landmark" : route.id === "gastronomica" ? "restaurant" : "auto_stories"}
                </span>
              </div>
              <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, margin: "0 8px 4px" }}>{route.name}</h4>
              <p style={{ margin: "0 8px 8px", fontSize: 14, color: "var(--on-surface-variant)" }}>
                {route.count} sitio{route.count !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
