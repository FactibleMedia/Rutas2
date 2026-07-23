import { useState } from "react";

export default function InteractiveMap({ title, description, pointsData, routes, mapImage }) {
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const generatePath = (route) => {
    return route
      .map((pointId, index) => {
        const point = pointsData.find((p) => p.id === pointId);
        if (!point) return "";
        return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
      })
      .join(" ");
  };

  return (
    <>
      {/* Map Container */}
      <div className="rimap-container">
        {/* Background Map Image */}
        <img
          src={mapImage}
          alt="Mapa de ruta"
          className="rimap-bg"
          draggable={false}
        />

        {/* SVG Connection Lines */}
        <svg
          className="rimap-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {routes.map((route, idx) => (
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
            }${selectedPoint?.id === point.id ? " rimap-marker--selected" : ""}`}
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
            onMouseEnter={() => setHoveredPoint(point)}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={() => setSelectedPoint(point)}
          >
            <span className="rimap-marker-dot">{point.id}</span>
          </div>
        ))}

        {/* Tooltip */}
        {hoveredPoint && !selectedPoint && (
          <div
            className="rimap-tooltip"
            style={{
              left: `${hoveredPoint.x}%`,
              top: `${hoveredPoint.y - 7}%`,
            }}
          >
            {hoveredPoint.title}
          </div>
        )}
      </div>

      {/* Point Legend */}
      <div className="rimap-legend">
        <div className="rimap-legend-header">
          <span className="rimap-legend-dot" />
          <span>Puntos de interés ({pointsData.length})</span>
        </div>
        <div className="rimap-legend-list">
          {pointsData.map((point) => (
            <button
              key={point.id}
              className={`rimap-legend-item${
                selectedPoint?.id === point.id
                  ? " rimap-legend-item--active"
                  : ""
              }`}
              onClick={() => setSelectedPoint(point)}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <span className="rimap-legend-num">{point.id}</span>
              <span>{point.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedPoint && (
        <div
          className="rimap-modal-overlay"
          onClick={() => setSelectedPoint(null)}
        >
          <div
            className="rimap-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="rimap-modal-close"
              onClick={() => setSelectedPoint(null)}
              aria-label="Cerrar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>

            <div className="rimap-modal-img">
              <img
                src={selectedPoint.img}
                alt={selectedPoint.title}
              />
              <div className="rimap-modal-img-badge">
                Punto {selectedPoint.id}
              </div>
            </div>

            <div className="rimap-modal-body">
              <h3 className="rimap-modal-title">{selectedPoint.title}</h3>
              <p className="rimap-modal-desc">{selectedPoint.desc}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
