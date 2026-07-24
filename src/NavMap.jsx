import "./NavMap.css";

// Map maneuver modifier to icon direction
function maneuverIcon(modifier) {
  if (!modifier) return "straight";
  const m = modifier.toLowerCase();
  if (m.includes("right") || m.includes("derecha")) return "right";
  if (m.includes("left") || m.includes("izquierda")) return "left";
  if (m.includes("straight") || m.includes("recto") || m.includes("continue")) return "straight";
  if (m.includes("uturn") || m.includes("retorno") || m.includes("u")) return "uturn";
  if (m.includes("ramp") || m.includes("salida")) return "ramp";
  if (m.includes("roundabout") || m.includes("rotonda")) return "roundabout";
  if (m.includes("arrive") || m.includes("llegada")) return "arrive";
  if (m.includes("depart") || m.includes("salida")) return "depart";
  return "straight";
}

function DirectionIcon({ modifier }) {
  const icon = maneuverIcon(modifier);
  switch (icon) {
    case "right":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>;
    case "left":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>;
    case "uturn":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7" /></svg>;
    case "ramp":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v16M8 14l4 4 4-4" /><path d="M4 20h16" /></svg>;
    case "roundabout":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19 12l-4-4M19 12l-4 4" /></svg>;
    case "arrive":
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="2" /><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /></svg>;
    default:
      return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
  }
}

export default function NavMap({
  destinationName = "",
  duration = 0,
  distance = 0,
  progress = 0,
  speed = 0,
  instruction = "Sigue recto",
  instructionIcon = "straight",
  instructionDistance = 0,
  travelMode = "car",
  isVoiceEnabled = true,
  heading = 0,
  hasArrived = false,
  proximityAlert = null,
  onVoiceToggle,
  onTravelModeChange,
  onClose,
  onRecenter,
}) {
  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "--";
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} h ${rem} min` : `${hours} h`;
  };

  const formatDistance = (meters) => {
    if (!Number.isFinite(meters) || meters <= 0) return "--";
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatEta = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "--:--";
    return new Date(Date.now() + seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const speedKmh = Math.round(speed);
  const headingDeg = Number.isFinite(heading) ? heading : 0;

  return (
    <>
      {/* Top Instruction Card */}
      <div className="navmap-instruction">
        <div className="navmap-instruction-icon">
          <DirectionIcon modifier={instructionIcon} />
        </div>
        <div className="navmap-instruction-text">
          <span className="navmap-instruction-action">
            {instruction}
          </span>
          <span className="navmap-instruction-detail">
            <strong>en {formatDistance(instructionDistance || distance)}</strong> hacia {destinationName}
          </span>
        </div>
      </div>

      {/* Floating Speedometer */}
      <div className="navmap-speedo">
        <span className="navmap-speedo-value">{speedKmh}</span>
        <span className="navmap-speedo-unit">km/h</span>
      </div>

      {/* Floating Actions */}
      <div className="navmap-actions">
        <button
          className={`navmap-action-btn${isVoiceEnabled ? '' : ' navmap-action-btn--muted'}`}
          onClick={onVoiceToggle}
          aria-label={isVoiceEnabled ? 'Silenciar instrucciones de voz' : 'Activar instrucciones de voz'}
          title={isVoiceEnabled ? 'Instrucciones de voz activadas' : 'Instrucciones de voz silenciadas'}
        >
          {isVoiceEnabled ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M19.07 4.93a10 10 0 010 14.14" />
              <path d="M15.54 8.46a5 5 0 010 7.07" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
        <button className="navmap-action-btn" onClick={onRecenter} aria-label="Centrar mapa">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="2" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>

      {/* Proximity alert banner (between instruction and compass) */}
      {proximityAlert && !hasArrived && (
        <div className="navmap-proximity-alert">
          <div className="navmap-proximity-alert-icon">
            <DirectionIcon modifier={proximityAlert.icon} />
          </div>
          <div className="navmap-proximity-alert-text">
            <strong>Giro próximo</strong>
            <span>{proximityAlert.text} a {proximityAlert.distance}m</span>
          </div>
        </div>
      )}

      {/* Compass indicator (top-right, below instruction card) */}
      {!hasArrived && (
        <div className="navmap-compass" style={{ transform: `rotate(${360 - headingDeg}deg)` }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L8 10l4-2 4 2-4-8z" fill="#d36400" stroke="#d36400" />
            <path d="M12 22l4-8-4 2-4-2 4 8z" fill="#888" stroke="#888" />
          </svg>
        </div>
      )}

      {/* Arrival overlay */}
      {hasArrived && (
        <div className="navmap-arrival">
          <div className="navmap-arrival-icon">🎉</div>
          <strong className="navmap-arrival-title">¡Has llegado!</strong>
          <span className="navmap-arrival-sub">{destinationName}</span>
        </div>
      )}

      {/* Bottom Sheet */}
      <div className="navmap-bottom">
        <div className="navmap-bottom-handle">
          <div className="navmap-bottom-handle-bar" />
        </div>
        <div className="navmap-bottom-sheet">
          <div className="navmap-bottom-row">
            <div className="navmap-bottom-info">
              <span className="navmap-bottom-time">{formatDuration(duration)}</span>
              <span className="navmap-bottom-detail">
                {formatDistance(distance)} &bull; Llegada a las {formatEta(duration)}
              </span>
            </div>
            <button className="navmap-bottom-close" onClick={onClose} aria-label="Cerrar navegación">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="navmap-progress">
            <div className="navmap-progress-fill" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}
