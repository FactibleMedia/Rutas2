import { X, Info, MapPin } from "lucide-react";

const ROUTE_ICONS = {
  patrimonial: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
    </svg>
  ),
  gastronomica: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3" />
    </svg>
  ),
  mitos: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM12 8v4M12 16h.01" />
    </svg>
  ),
};

const ROUTE_COLORS = {
  patrimonial: "#4B5A42",
  gastronomica: "#C45722",
  mitos: "#55517E",
};

const CATEGORY_BADGES = {
  patrimonial: {
    iglesias: "#D36F2C",
    plazas: "#4B5A42",
    monumentos: "#55517E",
    centro_historico: "#D36F2C",
    centros_culturales: "#4B5A42",
    zona_ambiental: "#55517E",
  },
  gastronomica: {
    tradicional: "#C45722",
    dulces: "#EAB308",
    desayuno_almuerzo: "#C45722",
    postres_cena: "#EAB308",
  },
  mitos: {
    leyendas_urbanas: "#55517E",
    mitos: "#55517E",
    leyendas: "#55517E",
    devocion: "#55517E",
  },
};

const SUBCATEGORY_LABELS = {
  iglesias: "Iglesias y Templos",
  plazas: "Plazas Históricas",
  monumentos: "Monumentos",
  centro_historico: "Centro Histórico",
  centros_culturales: "Centros Culturales",
  zona_ambiental: "Zona Ambiental",
  tradicional: "Comida Típica",
  dulces: "Dulcería",
  desayuno_almuerzo: "Desayuno y Almuerzo",
  postres_cena: "Postres y Cena",
  leyendas_urbanas: "Leyendas Urbanas",
  mitos: "Mitos",
  leyendas: "Leyendas",
  devocion: "Devoción",
  general: "General",
};

export default function RouteDetailsPanel({ route, locations, onClose, onSelectPlace, selectedPlaceId }) {
  if (!route) return null;

  // Group locations by subcategoria — store full location objects
  const categories = {};
  const routeLocations = locations.filter((loc) => loc.routeId === route.id);

  routeLocations.forEach((loc) => {
    const subcat = loc.subcategoria || "general";
    if (!categories[subcat]) {
      categories[subcat] = {
        id: subcat,
        title: SUBCATEGORY_LABELS[subcat] || subcat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        colorBadge: CATEGORY_BADGES[route.id]?.[subcat] || ROUTE_COLORS[route.id],
        places: [],
      };
    }
    categories[subcat].places.push(loc);
  });

  const categoryList = Object.values(categories);
  const totalSites = categoryList.reduce((acc, cat) => acc + cat.places.length, 0);
  const IconComponent = ROUTE_ICONS[route.id] || ROUTE_ICONS.patrimonial;

  return (
    <div
      className="mapas-route-panel"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#F2EDE1",
        borderRadius: "24px 24px 0 0",
        boxShadow: "0 -4px 30px rgba(0, 0, 0, 0.2)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "85vh",
        zIndex: 200,
        animation: "mapas-slide-up-mobile 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Mobile Drag Handle */}
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          paddingTop: "12px",
          paddingBottom: "4px",
          background: "#E4DBC5",
          borderRadius: "24px 24px 0 0",
          borderBottom: "1px solid #D5C9B3",
        }}
        className="mapas-panel-drag-handle"
      >
        <div
          style={{
            width: "48px",
            height: "6px",
            background: "#CBAF82",
            borderRadius: "3px",
            opacity: 0.7,
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          background: "#E4DBC5",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #D5C9B3",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: ROUTE_COLORS[route.id],
              boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
              color: "white",
            }}
          >
            <IconComponent />
          </div>
          <div>
            <h2
              style={{
                fontWeight: 700,
                color: "#4A3319",
                fontSize: "16px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {route.name}
            </h2>
            <span
              style={{
                color: "#847863",
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              {totalSites} SITIOS
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: "8px",
            background: "#D5C9B3",
            border: "none",
            borderRadius: "50%",
            cursor: "pointer",
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#CBAF82")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#D5C9B3")}
        >
          <X size={18} style={{ color: "#4A3319" }} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          padding: "16px 20px 24px",
          overflowY: "auto",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
        className="mapas-panel-scroll"
      >
        {categoryList.length === 0 ? (
          <p style={{ color: "#847863", textAlign: "center", padding: "20px", fontSize: "14px" }}>
            No hay sitios en esta ruta.
          </p>
        ) : (
          categoryList.map((category, catIndex) => (
            <div
              key={category.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                animation: `mapas-fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + catIndex * 0.15}s forwards`,
                opacity: 0,
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderBottom: "1px solid rgba(213, 201, 179, 0.5)",
                  paddingBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "12px",
                    height: "12px",
                    borderRadius: "50%",
                    backgroundColor: category.colorBadge,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.15)",
                  }}
                />
                <h3
                  style={{
                    fontWeight: 700,
                    color: "#4A3319",
                    fontSize: "14px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    margin: 0,
                  }}
                >
                  {category.title}
                </h3>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    color: "#847863",
                    fontWeight: 600,
                  }}
                >
                  {category.places.length}
                </span>
              </div>

              {/* Sites List — clickable to preview on map */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {category.places.map((place) => {
                  const isSelected = selectedPlaceId === place.id;
                  return (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => onSelectPlace && onSelectPlace(place)}
                      style={{
                        background: isSelected ? "rgba(232, 122, 42, 0.12)" : "rgba(255, 255, 255, 0.6)",
                        borderRadius: "12px",
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        border: isSelected ? "1px solid rgba(232, 122, 42, 0.4)" : "1px solid #E4DBC5",
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.9)";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                          e.currentTarget.style.transform = "scale(1.01)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.6)";
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {/* Dot or MapPin indicator */}
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: isSelected ? "#E87A2A" : category.colorBadge,
                          flexShrink: 0,
                          transition: "all 0.2s ease",
                          transform: isSelected ? "scale(1.3)" : "scale(1)",
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            color: "#4A3319",
                            fontSize: "14px",
                            fontWeight: isSelected ? 600 : 500,
                            lineHeight: 1.4,
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {place.name}
                        </span>
                        {place.subtitle && (
                          <span
                            style={{
                              color: "#847863",
                              fontSize: "11px",
                              lineHeight: 1.3,
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              marginTop: "2px",
                            }}
                          >
                            {place.subtitle}
                          </span>
                        )}
                      </div>
                      <MapPin
                        size={14}
                        style={{
                          color: isSelected ? "#E87A2A" : "#CBAF82",
                          flexShrink: 0,
                          transition: "color 0.2s ease",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
