import { Info, Landmark, Utensils, Ghost } from "lucide-react";

const ROUTE_COLORS = {
  patrimonial: { color: "#4B5A42", label: "Patrimonial" },
  gastronomica: { color: "#C45722", label: "Gastronómica" },
  mitos: { color: "#55517E", label: "Místico" },
};

export default function MapLegend({ isVisible = true, position = "top-left" }) {
  // Position can be "top-left" (normal) or "bottom-left" (when popup is collapsed)
  const isAtBottom = position === "bottom-left";
  
  return (
    <div
      className="mapas-legend"
      style={{
        position: "absolute",
        top: isAtBottom ? "auto" : "16px",
        bottom: isAtBottom ? "16px" : "auto",
        left: "16px",
        background: "#FDF9ED",
        borderRadius: "16px",
        padding: isVisible ? "16px" : "0",
        boxShadow: isVisible ? "0 4px 20px rgba(0, 0, 0, 0.12)" : "none",
        border: isVisible ? "1px solid rgba(185, 145, 85, 0.2)" : "1px solid transparent",
        display: "flex",
        flexDirection: "column",
        gap: isVisible ? "12px" : "0",
        zIndex: 100,
        fontFamily: "'Inter', sans-serif",
        color: "#4A3319",
        width: isVisible ? "auto" : "0",
        minWidth: isVisible ? "180px" : "0",
        height: isVisible ? "auto" : "0",
        overflow: "hidden",
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? (isAtBottom ? "translateY(0) scale(1)" : "translateX(0) scale(1)") 
          : (isAtBottom ? "translateY(20px) scale(0.95)" : "translateX(-20px) scale(0.95)"),
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: isVisible ? "auto" : "none",
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
