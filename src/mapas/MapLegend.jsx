import { Info, Landmark, Utensils, Ghost } from "lucide-react";

const ROUTE_COLORS = {
  patrimonial: { color: "#4B5A42", label: "Patrimonial" },
  gastronomica: { color: "#C45722", label: "Gastronómica" },
  mitos: { color: "#55517E", label: "Mitos y Leyendas" },
};

export default function MapLegend({ isVisible = true }) {
  if (!isVisible) return null;

  return (
    <div
      className="mapas-legend"
      style={{
        position: "absolute",
        top: "16px",
        left: "16px",
        background: "#FDF9ED",
        borderRadius: "16px",
        padding: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.12)",
        border: "1px solid rgba(185, 145, 85, 0.2)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        zIndex: 100,
        fontFamily: "'Inter', sans-serif",
        color: "#4A3319",
        width: "auto",
        minWidth: "180px",
        animation: "mapas-fade-in-left 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Info size={18} style={{ color: "#B95D28" }} />
        <h3 style={{ fontWeight: 700, fontSize: "16px", margin: 0 }}>Rutas</h3>
      </div>

      {/* Route Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginLeft: "4px" }}>
        {Object.entries(ROUTE_COLORS).map(([id, route]) => (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "default",
              transition: "transform 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: route.color,
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.15)",
              }}
            />
            <span style={{ fontWeight: 500, fontSize: "14px" }}>{route.label}</span>
          </div>
        ))}

        {/* Route Line Indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "8px",
            cursor: "default",
            transition: "transform 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <div
            style={{
              width: "24px",
              height: "0",
              borderTop: "2px dashed #CBAF82",
            }}
          />
          <span style={{ fontWeight: 500, fontSize: "14px" }}>Ruta trazada</span>
        </div>
      </div>
    </div>
  );
}
