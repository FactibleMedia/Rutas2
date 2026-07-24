import { useEffect, useRef, useState } from "react";

export default function InteractiveMap({
  title,
  description,
  pointsData = [],
  routes = [],
  mapImage,
  mapFilter = "none",
  routeLegend = [],
  isGeneral = false,
  highlightedPoint,
  onHighlightPoint,
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [animatingPoint, setAnimatingPoint] = useState(null);
  const containerRef = useRef(null);
  const animTimeoutRef = useRef(null);

  // When a point is highlighted externally (from the legend), animate it
  useEffect(() => {
    if (highlightedPoint) {
      setAnimatingPoint(highlightedPoint);
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = setTimeout(() => {
        setAnimatingPoint(null);
      }, 1500);
    }
    return () => {
      if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    };
  }, [highlightedPoint]);

  const generatePath = (route) => {
    const pts = Array.isArray(route) ? route : (route?.points || []);
    return pts
      .map((pointId, index) => {
        const point = pointsData.find((p) => p.id === pointId);
        if (!point) return "";
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
      })
      .join(" ");
  };

  const handleLegendClick = (point) => {
    setSelectedPoint(point);
    setAnimatingPoint(point.id);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    animTimeoutRef.current = setTimeout(() => {
      setAnimatingPoint(null);
    }, 1500);
    if (onHighlightPoint) onHighlightPoint(point.id);
  };

  const handlePointClick = (point) => {
    setSelectedPoint(point);
    if (onHighlightPoint) onHighlightPoint(point.id);
  };

  const handleCloseModal = () => {
    setSelectedPoint(null);
    if (onHighlightPoint) onHighlightPoint(null);
  };

  const isAnimating = (pointId) => animatingPoint === pointId;

  return (
    <>
      {/* Map Container */}
      <div ref={containerRef} className="rimap-container">
        <img
          src={mapImage}
          alt="Mapa de ruta"
          className="rimap-bg"
          draggable={false}
        />

        {/* SVG Connection Lines */}
        <svg className="rimap-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {isGeneral
            ? routes.map((conn, idx) => (
                <path
                  key={idx}
                  d={generatePath(typeof conn === "object" ? conn.points : conn)}
                  fill="none"
                  stroke={conn.color || "#5d4037"}
                  strokeWidth="0.4"
                  strokeDasharray={conn.category === "gastronomica" ? "1.5 0.8" : "0.8 0.6"}
                  className="rimap-path"
                  style={{ opacity: 0.55 }}
                />
              ))
            : routes.map((route, idx) => (
                <path
                  key={idx}
                  d={generatePath(route)}
                  fill="none"
                  stroke="#5d4037"
                  strokeWidth="0.4"
                  strokeDasharray="1.5 0.8"
                  className="rimap-path"
                />
              ))}
        </svg>

        {/* Markers */}
        {pointsData.map((point) => (
          <div
            key={point.id}
            className={`rimap-marker${
              hoveredPoint?.id === point.id ? " rimap-marker--hovered" : ""
            }${selectedPoint?.id === point.id ? " rimap-marker--selected" : ""}${
              isAnimating(point.id) ? " rimap-marker--animating" : ""
            }`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={() => handlePointClick(point)}
          >
            <span className="rimap-marker-dot">
              {pointsData.indexOf(point) + 1}
            </span>
            {/* Circular thumbnail on hover */}
            {(hoveredPoint?.id === point.id || selectedPoint?.id === point.id) && (point.imagen_url || point.img) && (
              <span className="rimap-marker-thumb">
                <img src={point.imagen_url || point.img} alt={point.titulo || point.title} />
              </span>
            )}
            {isAnimating(point.id) && <span className="rimap-marker-ring" />}
          </div>
        ))}

        {/* Tooltip */}
        {hoveredPoint && !selectedPoint && (
          <div
            className="rimap-tooltip"
            style={{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y - 7}%` }}
          >
            {hoveredPoint.titulo || hoveredPoint.title}
          </div>
        )}
      </div>

      {/* Point Legend */}
      <div className="rimap-legend">
        <div className="rimap-legend-header">
          <span className="rimap-legend-dot" />
          <span>Puntos de interés ({pointsData.length})</span>
        </div>

        {/* Route category legend (for Gran Mapa General) */}
        {routeLegend.length > 0 && (
          <div className="rimap-route-legend">
            {routeLegend.map((r) => (
              <span key={r.id} className="rimap-route-legend-item">
                <span className="rimap-route-legend-dot" style={{ background: r.color }} />
                <span className="rimap-route-legend-name">{r.nombre}</span>
                <span className="rimap-route-legend-count">{r.count} rutas</span>
              </span>
            ))}
          </div>
        )}

        <div className="rimap-legend-list">
          {pointsData.map((point) => (
            <button
              key={point.id}
              className={`rimap-legend-item${
                selectedPoint?.id === point.id ? " rimap-legend-item--active" : ""
              }${isAnimating(point.id) ? " rimap-legend-item--animating" : ""}`}
              onClick={() => handleLegendClick(point)}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <span className="rimap-legend-num">
                {pointsData.indexOf(point) + 1}
              </span>
              {isGeneral && point.categoria_slug && (
                <span
                  className="rimap-legend-cat"
                  style={{
                    background: {
                      patrimoniales: "#8B6B4A",
                      gastronomica: "#C07536",
                      mistica: "#4A6B5D",
                    }[point.categoria_slug] || "#8d6e63",
                  }}
                />
              )}
              <span>{point.titulo || point.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPoint && (
        <div className="rimap-modal-overlay" onClick={handleCloseModal}>
          <div className="rimap-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rimap-modal-close" onClick={handleCloseModal} aria-label="Cerrar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
            <div className="rimap-modal-img">
              <img src={selectedPoint.imagen_url || selectedPoint.img}
                alt={selectedPoint.titulo || selectedPoint.title} />
              <div className="rimap-modal-img-badge">
                Punto {pointsData.indexOf(selectedPoint) + 1}
              </div>
            </div>
            <div className="rimap-modal-body">
              <h3 className="rimap-modal-title">{selectedPoint.titulo || selectedPoint.title}</h3>
              <p className="rimap-modal-desc">{selectedPoint.descripcion || selectedPoint.desc}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
