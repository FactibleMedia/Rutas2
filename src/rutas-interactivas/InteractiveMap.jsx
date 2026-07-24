import { useEffect, useRef, useState } from "react";

const ROUTE_COLORS = {
  patrimoniales: "#8B6B4A",
  gastronomica: "#C07536",
  mistica: "#4A6B5D",
};

function getCategoryColor(point) {
  if (point.categoria_slug && ROUTE_COLORS[point.categoria_slug]) {
    return ROUTE_COLORS[point.categoria_slug];
  }
  return null;
}

const MARKER_ICONS = {
  patrimoniales: "/assets/rutas/icon-patrimonial.png",
  gastronomica: "/assets/rutas/icon-gastronomico.png",
  mistica: "/assets/rutas/icon-mitico.png",
  centro_historico: "/assets/rutas/icon-phistorico.png",
  centros_culturales: "/assets/rutas/icon-pcentro.png",
  zona_ambiental: "/assets/rutas/icon-pzona.png",
  monumentos: "/assets/rutas/icon-pmonumentos.png",
  mitos: "/assets/rutas/icon-mitos.png",
  leyendas: "/assets/rutas/icon-leyendas.png",
  devocion: "/assets/rutas/icon-devocion.png",
  desayuno_almuerzo: "/assets/rutas/icon-desayuno_almuerzo.png",
  postres_cena: "/assets/rutas/icon-postres_cena.png",
};

function getMarkerIcon(point) {
  if (point.subcategoria && MARKER_ICONS[point.subcategoria]) {
    return MARKER_ICONS[point.subcategoria];
  }
  if (point.categoria_slug && MARKER_ICONS[point.categoria_slug]) {
    return MARKER_ICONS[point.categoria_slug];
  }
  return null;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.3;

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
  activeCategory,
}) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [animatingPoint, setAnimatingPoint] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const containerRef = useRef(null);
  const animTimeoutRef = useRef(null);
  const isPanningRef = useRef(false);

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoom((prev) => Math.min(ZOOM_MAX, +(prev + ZOOM_STEP).toFixed(1)));
  };
  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoom((prev) => Math.max(ZOOM_MIN, +(prev - ZOOM_STEP).toFixed(1)));
  };
  const handleZoomReset = (e) => {
    e?.stopPropagation();
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan by dragging on the map when zoomed
  const handleMapPointerDown = (e) => {
    if (zoom <= 1) return;
    if (e.target.closest(".rimap-marker")) return;
    setIsPanning(true);
    isPanningRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...panOffset };

    const doPan = (ev) => {
      setPanOffset({ x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) });
    };
    const stopPan = () => {
      setIsPanning(false);
      isPanningRef.current = false;
      window.removeEventListener("pointermove", doPan);
      window.removeEventListener("pointerup", stopPan);
    };
    window.addEventListener("pointermove", doPan);
    window.addEventListener("pointerup", stopPan);
  };

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
    // Toggle: if same point is clicked again, close it
    if (selectedPoint?.id === point.id) {
      setSelectedPoint(null);
      setAnimatingPoint(null);
      if (onHighlightPoint) onHighlightPoint(null);
      return;
    }
    setSelectedPoint(point);
    if (onHighlightPoint) onHighlightPoint(point.id);
  };

  const handleCloseModal = () => {
    setSelectedPoint(null);
    setAnimatingPoint(null);
    if (animTimeoutRef.current) clearTimeout(animTimeoutRef.current);
    if (onHighlightPoint) onHighlightPoint(null);
  };

  // Deselect when clicking on the map background (not on a marker)
  const handleMapBackgroundClick = (e) => {
    if (e.target.closest(".rimap-marker")) return;
    if (selectedPoint) {
      handleCloseModal();
    }
  };

  const isAnimating = (pointId) => animatingPoint === pointId;

  return (
    <>
      {/* Map Container */}
      <div ref={containerRef}
        className={`rimap-container${zoom > 1 ? " rimap-container--zoomed" : ""}${isPanning ? " rimap-container--panning" : ""}`}
        onPointerDown={handleMapPointerDown}
        style={{ cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "crosshair" }}>
        <div className="rimap-inner"
          onClick={handleMapBackgroundClick}
          style={{ transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`, transformOrigin: "center center" }}>
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
            <span
              className={`rimap-marker-dot${getMarkerIcon(point) ? " rimap-marker-dot--with-icon" : ""}`}
              style={getMarkerIcon(point) ? { backgroundImage: `url(${getMarkerIcon(point)})` } : {}}>
              {pointsData.indexOf(point) + 1}
            </span>
            {/* Category indicator ring */}
            {isGeneral && point.categoria_slug && (
              <span className="rimap-marker-cat-ring"
                style={{
                  borderColor: {
                    patrimoniales: "#8B6B4A",
                    gastronomica: "#C07536",
                    mistica: "#4A6B5D",
                  }[point.categoria_slug] || "#8d6e63",
                }} />
            )}
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

        {/* Zoom Controls */}
        <div className="rimap-zoom-controls">
          <button type="button" className="rimap-zoom-btn" onClick={handleZoomIn}
            disabled={zoom >= ZOOM_MAX} title="Acercar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="rimap-zoom-level">{Math.round(zoom * 100)}%</span>
          <button type="button" className="rimap-zoom-btn" onClick={handleZoomOut}
            disabled={zoom <= ZOOM_MIN} title="Alejar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          {zoom > 1 && (
            <button type="button" className="rimap-zoom-btn rimap-zoom-btn--reset" onClick={handleZoomReset} title="Restablecer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
              </svg>
            </button>
          )}
        </div>
      </div>        {/* Point Legend - collapsible on mobile */}
      <details className="rimap-legend" open={legendOpen} onToggle={(e) => setLegendOpen(e.target.open)}>
        <summary className="rimap-legend-header">
          <span className="rimap-legend-summary-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
          <span className="rimap-legend-dot" />
          <span>Puntos de interés ({pointsData.length})</span>
          <span className="rimap-legend-toggle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </summary>

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
              <span
                className={`rimap-legend-num${getMarkerIcon(point) ? " rimap-legend-num--with-icon" : ""}`}
                style={{
                  background: getMarkerIcon(point)
                    ? `url(${getMarkerIcon(point)}) center/cover no-repeat`
                    : (getCategoryColor(point) || "#8d6e63"),
                }}>
                {pointsData.indexOf(point) + 1}
              </span>
              {isGeneral && point.categoria_slug && (
                <span
                  className="rimap-legend-cat"
                  style={{
                    background: ROUTE_COLORS[point.categoria_slug] || "#8d6e63",
                  }}
                />
              )}
              <span>{point.titulo || point.title}</span>
            </button>
          ))}
        </div>
      </details>

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
              {selectedPoint.mapa_referencia_id && (
                <a
                  href={`/mapas?locationId=${selectedPoint.mapa_referencia_id}`}
                  className="rimap-modal-llegar"
                  onClick={(e) => {
                    e.preventDefault();
                    window.location.href = e.currentTarget.getAttribute("href");
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Cómo llegar en Mapas
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
