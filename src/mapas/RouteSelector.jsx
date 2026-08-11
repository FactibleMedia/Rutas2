const ROUTE_DATA = {
  all: {
    id: "all",
    name: "Ver todas",
    color: "#B95D28",
    icon: null,
    iconText: "🌐",
  },
  patrimonial: {
    id: "patrimonial",
    name: "Ruta Patrimonial",
    color: "#4B5A42",
    icon: "/assets/rutas/icon-patrimonial.png",
    iconText: "🏛️",
  },
  gastronomica: {
    id: "gastronomica",
    name: "Ruta Gastronómica",
    color: "#C45722",
    icon: "/assets/rutas/icon-gastronomico.png",
    iconText: "🍴",
  },
  mitos: {
    id: "mitos",
    name: "Místico",
    color: "#55517E",
    icon: "/assets/rutas/icon-mitico.png",
    iconText: "👻",
  },
};

export default function RouteSelector({ activeRouteId, onRouteSelect, locations }) {
  const getCount = (routeId) => {
    if (routeId === "all") return locations.length;
    return locations.filter((loc) => loc.routeId === routeId).length;
  };

  return (
    <div
      className="mapas-route-selector"
      style={{
        position: "absolute",
        bottom: "16px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        padding: "6px",
        borderRadius: "20px",
        boxShadow: "0 4px 24px rgba(0, 0, 0, 0.15)",
        zIndex: 150,
        animation: "mapas-fade-in-up-centered 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards",
        opacity: 0,
        width: "auto",
        maxWidth: "92vw",
        overflow: "hidden",
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {/* Scrollable Container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: "4px 8px",
        }}
        className="mapas-hide-scrollbar"
      >
        {Object.values(ROUTE_DATA).map((route) => {
          const isActive = activeRouteId === route.id;
          const count = getCount(route.id);

          return (
            <button
              key={route.id}
              onClick={() => onRouteSelect(route.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "14px",
                border: isActive ? "none" : "1px solid #E4DBC5",
                background: isActive ? route.color : "#F2EDE1",
                color: isActive ? "white" : "#4A3319",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            >
              {route.icon ? (
                <img
                  src={route.icon}
                  alt={route.name}
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <span style={{ fontSize: "18px", flexShrink: 0 }}>
                  {route.iconText}
                </span>
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                <span style={{ fontWeight: 700, fontSize: "13px", lineHeight: 1 }}>
                  {route.name}
                </span>
                {!isActive && (
                  <span
                    style={{
                      fontSize: "10px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      color: "#847863",
                      marginTop: "2px",
                    }}
                  >
                    {count} sitios
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
