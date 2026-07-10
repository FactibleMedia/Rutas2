import { useEffect, useMemo, useState } from "react";
import { getRouteCounts, useMapLocations } from "../mapLocationsStore";

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const RECENT_ACTIVITY = [
  { type: "primary", text: 'Nueva ruta "Leyendas del Cacique" publicada.', time: "Hace 2 horas" },
  { type: "tertiary", text: 'Actualización de media en "Valledupar Histórico".', time: "Hace 5 horas" },
  { type: "secondary", text: "Comentario reportado en foro cultural.", time: "Ayer, 14:30" },
  { type: "tertiary", text: "Mantenimiento del sistema completado.", time: "Ayer, 02:00" },
];

const RECENT_CONTENT = [
  {
    title: "Taller de Acordeones",
    location: "Valledupar Centro",
    badge: "Foto",
    badgeClass: "",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop",
  },
  {
    title: "Ruta del Río Guatapurí",
    location: "Naturaleza y Leyenda",
    badge: "Video",
    badgeClass: "admin-badge--published",
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=300&h=200&fit=crop",
  },
  {
    title: "Historia de las Piloneras",
    location: "Archivo Histórico",
    badge: "Artículo",
    badgeClass: "",
    image: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=300&h=200&fit=crop",
  },
];

function getTodayDate() {
  return new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function Dashboard({ profile }) {
  const locations = useMapLocations();
  const routeCounts = useMemo(() => getRouteCounts(locations), [locations]);
  const [chartHeights] = useState([40, 65, 30, 85, 55, 70, 45]);

  const stats = useMemo(() => {
    const activeRoutes = routeCounts.filter((r) => r.count > 0).length;
    return [
      {
        label: "Rutas Activas",
        value: String(activeRoutes),
        icon: "route",
        iconClass: "admin-metric__icon--tertiary",
        trend: `+${locations.length - 5} ubicaciones`,
        trending: "up",
      },
      {
        label: "Nuevos Comentarios",
        value: "142",
        icon: "chat_bubble",
        iconClass: "admin-metric__icon--secondary",
        trend: "+12% engagement",
        trending: "up",
      },
      {
        label: "Usuarios Registrados",
        value: "3,490",
        icon: "person",
        iconClass: "admin-metric__icon--primary",
        trend: "+5 esta semana",
        trending: "up",
      },
    ];
  }, [locations.length, routeCounts]);

  const chartMax = Math.max(...chartHeights);

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
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--secondary)",
              border: "1px solid var(--outline-variant)",
              background: "var(--surface-container-low)",
              padding: "8px 16px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
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
                {stat.icon === "route" ? "map" : stat.icon === "chat_bubble" ? "forum" : "group"}
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

      {/* Middle Section: Chart & Quick Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-gutter)", marginBottom: 48 }}>
        {/* Activity Chart */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>trending_up</span>
              Actividad Semanal
            </h3>
            <button
              className="admin-topbar__icon-btn"
              type="button"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="admin-card__body">
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 8,
                height: 256,
                paddingTop: 24,
              }}
            >
              {chartHeights.map((height, index) => {
                const pct = (height / chartMax) * 100;
                const isToday = index === 3;
                return (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${pct}%`,
                        borderRadius: "4px 4px 0 0",
                        background: isToday
                          ? "var(--primary)"
                          : index < 3
                            ? "var(--secondary-container)"
                            : "var(--tertiary)",
                        borderLeft: "1px solid",
                        borderRight: "1px solid",
                        borderTop: "1px solid",
                        borderColor: isToday ? "var(--primary-container)" : "var(--outline)",
                        transition: "all 0.3s ease",
                        minHeight: 8,
                        boxShadow: isToday ? "inset 0 2px 4px rgba(0,0,0,0.1)" : "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isToday ? 700 : 400,
                        color: isToday ? "var(--on-surface)" : "var(--on-surface-variant)",
                      }}
                    >
                      {DAY_LABELS[index]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Logs */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 className="admin-card__title">Registro Rápido</h3>
          </div>
          <div className="admin-card__body" style={{ padding: "16px 24px" }}>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {RECENT_ACTIVITY.map((item, i) => (
                <li key={i} style={{ display: "flex", gap: 16 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      marginTop: 8,
                      flexShrink: 0,
                      background:
                        item.type === "primary"
                          ? "var(--primary)"
                          : item.type === "secondary"
                            ? "var(--secondary-container)"
                            : "var(--tertiary)",
                    }}
                  />
                  <div>
                    <p style={{ margin: 0, fontSize: 16, color: "var(--on-surface)", lineHeight: "24px" }}>
                      {item.text}
                    </p>
                    <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{item.time}</span>
                  </div>
                </li>
              ))}
            </ul>
            <button
              className="admin-btn admin-btn--secondary"
              style={{ width: "100%", marginTop: 24, justifyContent: "center" }}
              type="button"
            >
              Ver Todo el Historial
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Content */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 24,
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
              auto_awesome_mosaic
            </span>
            Contenido Reciente
          </h3>
          <a
            href="#"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--primary)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Explorar Galería
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </a>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--space-gutter)",
          }}
        >
          {RECENT_CONTENT.map((item, i) => (
            <div
              key={i}
              className="admin-card"
              style={{
                padding: 8,
                transition: "transform 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-4px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div
                style={{
                  width: "100%",
                  height: 160,
                  background: "var(--surface-dim)",
                  borderRadius: "var(--radius-md)",
                  marginBottom: 12,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={item.image}
                  alt={item.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  className={`admin-badge ${item.badgeClass}`}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: item.badgeClass
                      ? "rgba(157, 61, 28, 0.9)"
                      : "rgba(255,255,255,0.8)",
                    color: item.badgeClass ? "#fff" : "var(--on-surface)",
                    backdropFilter: "blur(4px)",
                    border: "1px solid var(--outline-variant)",
                  }}
                >
                  {item.badge}
                </div>
              </div>
              <h4
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 20,
                  fontWeight: 600,
                  margin: "0 8px 4px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {item.title}
              </h4>
              <p style={{ margin: "0 8px 8px", fontSize: 14, color: "var(--on-surface-variant)" }}>
                {item.location}
              </p>
            </div>
          ))}
          {/* Upload placeholder */}
          <div
            className="admin-card"
            style={{
              padding: 8,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "100%",
                height: 160,
                borderRadius: "var(--radius-md)",
                marginBottom: 12,
                border: "2px dashed var(--outline-variant)",
                background: "var(--surface-container-low)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container-high)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--surface-container-low)")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--on-surface-variant)", marginBottom: 8 }}>
                upload_file
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--on-surface-variant)" }}>
                Subir Contenido
              </span>
            </div>
            <h4
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                margin: "0 8px 4px",
                textAlign: "center",
                color: "var(--outline)",
              }}
            >
              Nuevo Elemento
            </h4>
          </div>
        </div>
      </div>
    </>
  );
}
