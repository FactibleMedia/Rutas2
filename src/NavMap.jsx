import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { useMapLocations } from "./mapLocationsStore";
import "mapbox-gl/dist/mapbox-gl.css";
import "./NavMap.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const STORAGE_KEY = "rutas_navmap_state";
const FALLBACK_CENTER = [-73.2500, 10.4630];
const MAP_STYLE = "mapbox://styles/mapbox/navigation-day-v1";
const PLAYBACK_DURATION_MS = 36000;

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function calculateBearing(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const l1 = toRad(lat1);
  const l2 = toRad(lat2);
  const dl = toRad(lng2 - lng1);

  const y = Math.sin(dl) * Math.cos(l2);
  const x = Math.cos(l1) * Math.sin(l2) - Math.sin(l1) * Math.cos(l2) * Math.cos(dl);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) {
    return "--";
  }

  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}

function formatDistance(meters) {
  if (!Number.isFinite(meters)) {
    return "--";
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1000).toFixed(1)} km`;
}

function formatArrivalTime(secondsFromNow) {
  if (!Number.isFinite(secondsFromNow)) {
    return "--:--";
  }

  return new Date(Date.now() + secondsFromNow * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNavigationInstruction(progress, destinationName) {
  if (progress < 0.18) {
    return "Inicia la ruta y mantente atento al trayecto.";
  }

  if (progress < 0.45) {
    return "Sigue recto por la vía principal.";
  }

  if (progress < 0.75) {
    return "Mantente en el carril y conserva la dirección.";
  }

  if (progress < 0.92) {
    return `Reducción de distancia. Te acercas a ${destinationName}.`;
  }

  return `Llegando a ${destinationName}.`;
}

function getManeuverIcon(step) {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier ?? "";

  if (type === "arrive") return "🏁";
  if (type === "depart") return "➜";
  if (type === "merge") return "⇢";
  if (type === "fork") return "⑂";
  if (type === "roundabout") return "↻";
  if (type === "turn" || type === "new name") {
    if (modifier.includes("left")) return "↰";
    if (modifier.includes("right")) return "↱";
    return "↑";
  }

  if (modifier.includes("left")) return "↰";
  if (modifier.includes("right")) return "↱";
  return "↑";
}

function getManeuverLabel(step, destinationName) {
  const type = step?.maneuver?.type;
  const modifier = step?.maneuver?.modifier ?? "";
  const street = step?.name ? ` en ${step.name}` : "";

  if (type === "arrive") return `Llegaste a ${destinationName}`;
  if (type === "depart") return `Sal hacia la ruta${street}`;
  if (type === "merge") return `Incorpórate a la vía principal${street}`;
  if (type === "fork") return `Toma la bifurcación${street}`;
  if (type === "roundabout") return `Entra a la glorieta${street}`;
  if (modifier.includes("left")) return `Gira a la izquierda${street}`;
  if (modifier.includes("right")) return `Gira a la derecha${street}`;
  return `Continúa por la ruta${street}`;
}

function getStepDistanceToGo(steps, traveledDistance) {
  let accumulated = 0;

  for (const step of steps) {
    const stepEnd = accumulated + (step?.distance ?? 0);
    if (traveledDistance <= stepEnd) {
      return {
        step,
        distanceToStepEnd: Math.max(0, Math.round(stepEnd - traveledDistance)),
      };
    }

    accumulated = stepEnd;
  }

  return {
    step: steps[steps.length - 1] ?? null,
    distanceToStepEnd: 0,
  };
}

async function fetchRoutePlan(mapboxToken, origin, destination, mode) {
  const profile = mode === "walking" ? "walking" : "driving";
  const response = await fetch(
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${mapboxToken}`
  );

  const data = await response.json();
  if (!data.routes || data.routes.length === 0) {
    throw new Error(`No route for ${mode}`);
  }

  const route = data.routes[0];
  return {
    mode,
    coordinates: route.geometry.coordinates,
    duration: route.duration,
    distance: route.distance,
    steps: route.legs?.[0]?.steps ?? [],
    note: mode === "walking" ? "Ruta caminando" : mode === "transit" ? "Ruta en transporte publico" : "Ruta en carro",
  };
}

function readPersistedNavigationState() {
  try {
    const rawState = sessionStorage.getItem(STORAGE_KEY);
    return rawState ? JSON.parse(rawState) : null;
  } catch {
    return null;
  }
}

export default function NavMap() {
  const location = useLocation();
  const mapLocations = useMapLocations();
  const navigationState = location.state ?? readPersistedNavigationState();
  const fallbackDestination = mapLocations[0] ?? null;
  const effectiveNavigationState =
    navigationState ??
    (fallbackDestination
      ? {
          routeOrigin: FALLBACK_CENTER,
          destination: fallbackDestination.coordinates,
          travelMode: "car",
          routePlan: null,
          place: {
            id: fallbackDestination.id,
            name: fallbackDestination.name,
            subtitle: fallbackDestination.subtitle,
            image: fallbackDestination.image,
            address: fallbackDestination.address,
            categoryLabel: fallbackDestination.categoryLabel,
          },
          autoStart: false,
          isDemo: true,
        }
      : null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const routeSourceRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const navigationStartRef = useRef(null);
  const gpsWatchRef = useRef(null);
  const bearingRef = useRef(0);
  const userMarkerRef = useRef(null);
  const userMarkerElementRef = useRef(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [routePlan, setRoutePlan] = useState(navigationState?.routePlan ?? null);
  const [routeStatus, setRouteStatus] = useState(routePlan ? "ready" : "loading");
  const [routeMessage, setRouteMessage] = useState("Preparando navegación...");
  const [pendingRouteRecalculation, setPendingRouteRecalculation] = useState(Boolean(effectiveNavigationState?.forceRecalculate));
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [useRealGps, setUseRealGps] = useState(Boolean(navigationState?.useRealGps));
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsSpeedReading, setGpsSpeedReading] = useState(null);
  const [gpsSignalStatus, setGpsSignalStatus] = useState("GPS en espera");
  const [isMuted, setIsMuted] = useState(false);
  const [loadError, setLoadError] = useState("");

  const placeName = effectiveNavigationState?.place?.name ?? "Destino";
  const travelMode = effectiveNavigationState?.travelMode ?? "walking";
  const origin = effectiveNavigationState?.routeOrigin ?? null;
  const destination = effectiveNavigationState?.destination ?? null;
  const routeRequestId = effectiveNavigationState?.routeRequestId ?? "default-request";

  const totalDuration = Number.isFinite(routePlan?.duration) ? routePlan.duration : Number.NaN;
  const totalDistance = Number.isFinite(routePlan?.distance) ? routePlan.distance : Number.NaN;
  const remainingSeconds = Number.isFinite(totalDuration) ? Math.max(0, Math.round(totalDuration - elapsedSeconds)) : Number.NaN;
  const routeCoordinates = routePlan?.coordinates ?? [];
  const routeSteps = routePlan?.steps ?? [];
  const currentPointProgress = Math.max(0, Math.min(100, progress));
  const currentSpeed = travelMode === "walking" ? 5 + Math.round(currentPointProgress / 20) : travelMode === "car" ? 34 + Math.round(currentPointProgress / 10) : 20 + Math.round(currentPointProgress / 15);
  const currentInstruction = getNavigationInstruction(currentPointProgress / 100, placeName);
  const traveledDistance = Number.isFinite(totalDistance) ? totalDistance * (currentPointProgress / 100) : 0;
  const maneuverInfo = getStepDistanceToGo(routeSteps, traveledDistance);
  const maneuverIcon = getManeuverIcon(maneuverInfo.step);
  const maneuverLabel = getManeuverLabel(maneuverInfo.step, placeName);

  useEffect(() => {
    if (!effectiveNavigationState) {
      return;
    }

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(effectiveNavigationState));
  }, [effectiveNavigationState]);

  useEffect(() => {
    setRoutePlan(effectiveNavigationState?.routePlan ?? null);
    setPendingRouteRecalculation(Boolean(effectiveNavigationState?.forceRecalculate));
    setProgress(0);
    setElapsedSeconds(0);
    navigationStartRef.current = null;
  }, [routeRequestId, effectiveNavigationState?.routePlan]);

  useEffect(() => {
    if (!effectiveNavigationState) {
      return undefined;
    }

    if (effectiveNavigationState.autoStart) {
      navigationStartRef.current = performance.now();
      setRouteStatus("navigating");
      setRouteMessage(`Navegación activa hacia ${placeName}.`);
    }

    return undefined;
  }, [effectiveNavigationState, placeName]);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setLoadError("Falta configurar VITE_MAPBOX_TOKEN en .env.local");
      return undefined;
    }

    if (!MAPBOX_TOKEN.startsWith("pk.")) {
      setLoadError("VITE_MAPBOX_TOKEN debe ser público (pk.*). No uses tokens secretos (sk.*) en frontend.");
      return undefined;
    }

    if (!mapContainerRef.current || mapRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: origin ?? destination ?? FALLBACK_CENTER,
      zoom: 15.2,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      setIsMapReady(true);
    });

    map.on("error", () => {
      setLoadError("No se pudo cargar la navegación. Verifica que el token de Mapbox sea público (pk.*).");
    });

    return () => {
      if (routeAnimationRef.current) {
        cancelAnimationFrame(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      if (mapRef.current) {
        mapRef.current.remove();
      }

      mapRef.current = null;
      setIsMapReady(false);
    };
  }, [destination, origin]);

  useEffect(() => {
    const needsRoute =
      origin &&
      destination &&
      MAPBOX_TOKEN?.startsWith("pk.") &&
      (!routePlan?.coordinates?.length || !routePlan?.steps?.length || pendingRouteRecalculation);

    if (!needsRoute) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        setRouteStatus("loading");
        setRouteMessage("Calculando ruta en Mapbox...");
        const plan = await fetchRoutePlan(MAPBOX_TOKEN, origin, destination, travelMode);
        if (!cancelled) {
          setRoutePlan(plan);
          setPendingRouteRecalculation(false);
          setRouteStatus("ready");
          setRouteMessage("Ruta lista. Iniciando navegación...");
        }
      } catch {
        if (!cancelled) {
          setPendingRouteRecalculation(false);
          setRouteStatus("error");
          setRouteMessage("No se pudo calcular la ruta.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [destination, origin, routePlan, travelMode, routeRequestId, pendingRouteRecalculation]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || !routePlan?.coordinates?.length) {
      return undefined;
    }

    if (mapRef.current.getLayer("navmap-route-line")) {
      mapRef.current.removeLayer("navmap-route-line");
    }

    if (mapRef.current.getLayer("navmap-route-outline")) {
      mapRef.current.removeLayer("navmap-route-outline");
    }

    if (mapRef.current.getSource("navmap-route")) {
      mapRef.current.removeSource("navmap-route");
    }

    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: routePlan.coordinates,
      },
    };

    mapRef.current.addSource("navmap-route", {
      type: "geojson",
      data: geojson,
    });

    mapRef.current.addLayer({
      id: "navmap-route-outline",
      type: "line",
      source: "navmap-route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#12336f",
        "line-width": 10,
      },
    });

    mapRef.current.addLayer({
      id: "navmap-route-line",
      type: "line",
      source: "navmap-route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#3b82f6",
        "line-width": 6,
      },
    });

    mapRef.current.fitBounds(new mapboxgl.LngLatBounds(origin ?? routePlan.coordinates[0], destination ?? routePlan.coordinates[routePlan.coordinates.length - 1]), {
      padding: 120,
      duration: 1200,
      pitch: 0,
    });

    if (!userMarkerElementRef.current) {
      const markerElement = document.createElement("div");
      markerElement.className = "navmap-user-marker";
      userMarkerElementRef.current = markerElement;
      userMarkerRef.current = new mapboxgl.Marker({ element: markerElement, rotationAlignment: "map" })
        .setLngLat(routePlan.coordinates[0])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current?.setLngLat(routePlan.coordinates[0]);
    }

    navigationStartRef.current = navigationStartRef.current ?? performance.now();
    setRouteStatus(useRealGps ? "gps" : "navigating");
    setRouteMessage(useRealGps ? `GPS real activo hacia ${placeName}.` : `Navegación activa hacia ${placeName}.`);

    if (routeAnimationRef.current) {
      cancelAnimationFrame(routeAnimationRef.current);
      routeAnimationRef.current = null;
    }

    if (!useRealGps) {
      const animate = (now) => {
        if (!routePlan.coordinates.length || !mapRef.current) {
          return;
        }

        const rawProgress = Math.min(1, (now - navigationStartRef.current) / PLAYBACK_DURATION_MS);
        const easedProgress = rawProgress < 0.5 ? 2 * rawProgress * rawProgress : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;
        const pathPosition = easedProgress * (routePlan.coordinates.length - 1);
        const segmentIndex = Math.min(routePlan.coordinates.length - 2, Math.floor(pathPosition));
        const segmentFraction = pathPosition - segmentIndex;

        const startPoint = routePlan.coordinates[segmentIndex];
        const endPoint = routePlan.coordinates[Math.min(routePlan.coordinates.length - 1, segmentIndex + 1)];
        const currentLng = startPoint[0] + (endPoint[0] - startPoint[0]) * segmentFraction;
        const currentLat = startPoint[1] + (endPoint[1] - startPoint[1]) * segmentFraction;
        const currentPoint = [currentLng, currentLat];
        const nextBearing = calculateBearing(startPoint[1], startPoint[0], endPoint[1], endPoint[0]);

        userMarkerRef.current?.setLngLat(currentPoint);
        if (userMarkerElementRef.current) {
          userMarkerElementRef.current.style.transform = `rotate(${nextBearing}deg)`;
        }

        mapRef.current.easeTo({
          center: currentPoint,
          zoom: 18,
          pitch: 60,
          bearing: nextBearing,
          duration: 450,
          essential: true,
        });

        bearingRef.current = nextBearing;
        setBearing(nextBearing);
        setProgress(Math.round(easedProgress * 100));
        setElapsedSeconds(Math.round((routePlan.duration ?? 0) * easedProgress));
        setRouteMessage(getNavigationInstruction(easedProgress, placeName));

        if (rawProgress < 1) {
          routeAnimationRef.current = requestAnimationFrame(animate);
        } else {
          setRouteStatus("finished");
          setRouteMessage(`Llegaste a ${placeName}.`);
        }
      };

      routeAnimationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (routeAnimationRef.current) {
        cancelAnimationFrame(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }
    };
  }, [destination, isMapReady, origin, placeName, routePlan, useRealGps]);

  useEffect(() => {
    if (!useRealGps || !routePlan?.duration || !navigator.geolocation) {
      return undefined;
    }

    const updateRouteClock = () => {
      if (!navigationStartRef.current) {
        navigationStartRef.current = performance.now();
      }

      const elapsedMs = performance.now() - navigationStartRef.current;
      const rawProgress = Math.min(1, elapsedMs / PLAYBACK_DURATION_MS);
      setElapsedSeconds(Math.round((routePlan.duration ?? 0) * rawProgress));
      setProgress(Math.round(rawProgress * 100));
    };

    updateRouteClock();
    const intervalId = window.setInterval(updateRouteClock, 1000);

    gpsWatchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (!mapRef.current) {
          return;
        }

        const currentPoint = [position.coords.longitude, position.coords.latitude];
        const heading = Number.isFinite(position.coords.heading) ? position.coords.heading : bearingRef.current;
        const accuracy = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;
        const speedValue = Number.isFinite(position.coords.speed) ? position.coords.speed * 3.6 : null;

        userMarkerRef.current?.setLngLat(currentPoint);
        if (userMarkerElementRef.current) {
          userMarkerElementRef.current.style.transform = `rotate(${heading}deg)`;
        }

        mapRef.current.easeTo({
          center: currentPoint,
          zoom: 18,
          pitch: 60,
          bearing: heading,
          duration: 500,
          essential: true,
        });

        bearingRef.current = heading;
        setBearing(heading);
        setGpsAccuracy(accuracy);
        setGpsSpeedReading(speedValue);
        setGpsSignalStatus(
          accuracy == null
            ? "GPS sin precisión"
            : accuracy <= 20
              ? "GPS fuerte"
              : accuracy <= 50
                ? "GPS aceptable"
                : "GPS débil"
        );
      },
      () => {
        setRouteStatus("error");
        setRouteMessage("No se pudo acceder al GPS real. Continúa con la simulación o revisa permisos.");
        setGpsSignalStatus("Señal de GPS perdida");
        setUseRealGps(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );

    return () => {
      window.clearInterval(intervalId);
      if (gpsWatchRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(gpsWatchRef.current);
        gpsWatchRef.current = null;
      }
    };
  }, [routePlan?.duration, useRealGps]);

  const recenterMap = () => {
    if (!mapRef.current || !userMarkerRef.current) {
      return;
    }

    mapRef.current.easeTo({
      center: userMarkerRef.current.getLngLat(),
      zoom: 18,
      pitch: 60,
      bearing: bearingRef.current,
      duration: 900,
      essential: true,
    });
  };

  const stopNavigation = () => {
    if (routeAnimationRef.current) {
      cancelAnimationFrame(routeAnimationRef.current);
      routeAnimationRef.current = null;
    }

    setRouteStatus("finished");
    setRouteMessage("Navegación finalizada.");
  };

  const toggleAudio = () => {
    setIsMuted((previousValue) => !previousValue);
  };

  const toggleGpsMode = () => {
    setUseRealGps((previousValue) => !previousValue);
    setRouteMessage((previousValue) => (previousValue ? previousValue : "GPS real activado."));
    setGpsSignalStatus((previousValue) => (previousValue === "GPS en espera" ? "GPS listo" : previousValue));
  };

  const routeRemainingDistance = Number.isFinite(routePlan?.distance) ? routePlan.distance * (1 - progress / 100) : Number.NaN;

  return (
    <div className="navmap-page">
      <div ref={mapContainerRef} className="navmap-map" />

      <div className="navmap-top-panel" id="top-nav-panel">
        <div className="navmap-top-card navmap-top-card--route">
          <div className="navmap-top-icon">{maneuverIcon}</div>
          <div className="navmap-top-copy">
            <p className="navmap-top-distance">{maneuverInfo.distanceToStepEnd > 0 ? `${maneuverInfo.distanceToStepEnd} m` : `${Math.max(1, Math.round(routeRemainingDistance / 1000 * 10) / 10) || 0} km`}</p>
            <p className="navmap-top-title">{maneuverLabel}</p>
          </div>
        </div>
      </div>

      <div className="navmap-floating-actions">
        <button type="button" onClick={recenterMap} className="navmap-action-btn" aria-label="Recentrar mapa">
          ⦿
        </button>
        <button type="button" onClick={toggleAudio} className="navmap-action-btn" aria-label="Audio">
          {isMuted ? "🔇" : "🔊"}
        </button>
        <button type="button" onClick={toggleGpsMode} className={`navmap-action-btn ${useRealGps ? "navmap-action-btn--active" : ""}`} aria-label="Alternar GPS real">
          {useRealGps ? "📡" : "🛰️"}
        </button>
        <button type="button" onClick={stopNavigation} className="navmap-action-btn navmap-action-btn--danger" aria-label="Finalizar navegación">
          ⏹
        </button>
      </div>

      <div className="navmap-bottom-panel">
        <div className="navmap-bottom-card">
          <div className="navmap-bottom-head">
            <div>
              <h2>{formatDuration(remainingSeconds)}</h2>
              <p>{formatDistance(totalDistance)} • {formatArrivalTime(remainingSeconds)} llegada</p>
            </div>
            <Link to="/mapas" className="navmap-back-link">
              Volver
            </Link>
          </div>

          <div className="navmap-hero-metrics">
            <div className="navmap-hero-metric navmap-hero-metric--eta">
              <span>ETA</span>
              <strong>{formatArrivalTime(remainingSeconds)}</strong>
            </div>
            <div className="navmap-hero-metric navmap-hero-metric--speed">
              <span>Velocidad</span>
              <strong>{gpsSpeedReading != null ? `${Math.round(gpsSpeedReading)} km/h` : `${currentSpeed} km/h`}</strong>
            </div>
          </div>

          <div className="navmap-gps-strip">
            <div>
              <span>Rumbo</span>
              <strong>{Math.round(bearingRef.current)}°</strong>
            </div>
            <div>
              <span>Precisión</span>
              <strong>{gpsAccuracy != null ? `${Math.round(gpsAccuracy)} m` : "--"}</strong>
            </div>
            <div>
              <span>Señal</span>
              <strong>{gpsSignalStatus}</strong>
            </div>
          </div>

          <div className="navmap-progress-bar" aria-hidden="true">
            <span style={{ width: `${currentPointProgress}%` }} />
          </div>

          <div className="navmap-meta-row">
            <span>{placeName}</span>
            <span>{routePlan?.note ?? "Ruta activa"}</span>
            <span>{useRealGps ? "GPS real" : "Simulación"}</span>
          </div>
        </div>
      </div>

      <div className="navmap-speed-badge">{gpsSpeedReading != null ? `${Math.round(gpsSpeedReading)} km/h` : `${currentSpeed} km/h`}</div>
      {effectiveNavigationState?.isDemo ? <div className="navmap-demo-banner">Modo demo activo. Abre desde Mapas para usar tu ruta real.</div> : null}
      {loadError ? <div className="navmap-error">{loadError}</div> : null}
      {routeMessage ? <div className="navmap-status-chip">{routeMessage}</div> : null}
    </div>
  );
}
