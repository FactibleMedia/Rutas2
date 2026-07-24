import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import TopBar from "./TopBar";
import NavMap from "./NavMap";
import { getRouteCounts, useMapLocations } from "./mapLocationsStore";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Mapas.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Marker icons matching Rutas Interactivas style
const MAPAS_MARKER_ICONS = {
  patrimonial: "/assets/rutas/icon-patrimonial.png",
  gastronomica: "/assets/rutas/icon-gastronomico.png",
  mitos: "/assets/rutas/icon-mitico.png",
  centro_historico: "/assets/rutas/icon-phistorico.png",
  centros_culturales: "/assets/rutas/icon-pcentro.png",
  zona_ambiental: "/assets/rutas/icon-pzona.png",
  monumentos: "/assets/rutas/icon-pmonumentos.png",
};

function getMarkerIcon(place) {
  if (place.subcategoria && MAPAS_MARKER_ICONS[place.subcategoria]) {
    return MAPAS_MARKER_ICONS[place.subcategoria];
  }
  if (place.routeId && MAPAS_MARKER_ICONS[place.routeId]) {
    return MAPAS_MARKER_ICONS[place.routeId];
  }
  return null;
}
const MAP_CENTER = [-73.2435, 10.4631];
const MAP_ZOOM = 14.2;
const MAP_PITCH = 0;
const MAP_BEARING = 0;
const MOBILE_USER_AGENT_REGEX = /Android|iPhone|iPad|iPod/i;

// Warm pastel sand background for the entire map
const MAP_BACKGROUND = "#f0e4cc";

// Color palettes that change based on the selected route
const ROUTE_PALETTES = {
  patrimonial: {
    label: "Patrimonial",
    roads: "#2463eb",
    water: "#c5d9f2",
    park: "#dce6f5",
    building: "#f0f4fa",
    background: MAP_BACKGROUND,
    accent: "#2463eb",
  },
  gastronomica: {
    label: "Gastronómica",
    roads: "#e8871a",
    water: "#f5e6cc",
    park: "#f5eddc",
    building: "#faf4ea",
    background: MAP_BACKGROUND,
    accent: "#e8871a",
  },
  mitos: {
    label: "Mitos y Leyendas",
    roads: "#5b2fb3",
    water: "#e0d6f2",
    park: "#ede6f5",
    building: "#f5f0fa",
    background: MAP_BACKGROUND,
    accent: "#5b2fb3",
  },
};

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function Mapas() {
  const [searchParams] = useSearchParams();
  const locations = useMapLocations();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routeSourceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const navigationAnimationRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const navigationWatchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const lastPositionTimeRef = useRef(null);
  const lastSpeedRef = useRef(0);
  const popupDragRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("patrimonial");
  const [isRouteExpanded, setIsRouteExpanded] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(locations[0]?.id || "");
  const [activePlace, setActivePlace] = useState(locations[0] ?? null);
  const [isPlacePopupOpen, setIsPlacePopupOpen] = useState(false);
  const [isPlacePopupCollapsed, setIsPlacePopupCollapsed] = useState(false);
  const [placePopupPosition, setPlacePopupPosition] = useState({ x: 24, y: 96 });
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [travelMode, setTravelMode] = useState("walking");
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routePlans, setRoutePlans] = useState({});
  const [routeStatus, setRouteStatus] = useState("idle");
  const [routeMessage, setRouteMessage] = useState("");
  const [view, setView] = useState("list"); // "list" | "compact" | "expanded" | "navigation"
  const [isRouteTrackingOpen, setIsRouteTrackingOpen] = useState(false);
  const [navigationElapsedSeconds, setNavigationElapsedSeconds] = useState(0);
  const [navigationPreviewProgress, setNavigationPreviewProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [realSpeed, setRealSpeed] = useState(0);
  const [realProgress, setRealProgress] = useState(0);
  const [realInstruction, setRealInstruction] = useState({ text: "Sigue recto", icon: "straight", distance: 0 });
  const [locationPermissionState, setLocationPermissionState] = useState("idle");
  const [locationPermissionMessage, setLocationPermissionMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [videoPlayingId, setVideoPlayingId] = useState(null); // index of video being played in hero
  const [imgErrors, setImgErrors] = useState({}); // track image load errors
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(() => {
    try { const saved = localStorage.getItem('navmap_voice'); return saved === null ? true : saved === 'true'; }
    catch { return true; }
  });
  const [dontAskRestore, setDontAskRestore] = useState(() => {
    try { return localStorage.getItem('navmap_dont_ask') === 'true'; }
    catch { return false; }
  });
  const [savedNav, setSavedNav] = useState(() => {
    try {
      if (dontAskRestore) return null;
      const raw = sessionStorage.getItem('navmap_active');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const lastInstructionRef = useRef('');
  const speechSynthRef = useRef(null);
  const hasArrivedRef = useRef(false);
  const arrivalTimerRef = useRef(null);
  const deviceHeadingRef = useRef(0);
  const alertedStepsRef = useRef(new Set());
  const [proximityAlert, setProximityAlert] = useState(null);
  const routeSwitchTimerRef = useRef(null);
  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Device orientation / compass handler — updates heading ref for NavMap compass indicator
  const handleDeviceOrientation = useCallback((event) => {
    const heading = event.webkitCompassHeading || event.alpha || 0;
    deviceHeadingRef.current = heading;
  }, []);

  // Haversine distance in meters
  const haversineDistance = (coords1, coords2) => {
    const R = 6371000;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(coords2[1] - coords1[1]);
    const dLon = toRad(coords2[0] - coords1[0]);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(coords1[1])) * Math.cos(toRad(coords2[1])) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Apply or re-apply route-based colors to the map
  const applyRouteColors = useCallback((map, routeId) => {
    const palette = ROUTE_PALETTES[routeId] || ROUTE_PALETTES.patrimonial;
    if (!map || !map.getStyle()) return;

    const layers = map.getStyle().layers;
    layers.forEach((layer) => {
      try {
        const id = layer.id;
        if (layer.type === "line" && (id.includes("road") || id.includes("bridge") || id.includes("tunnel"))) {
          map.setPaintProperty(id, "line-color", palette.roads);
        } else if (layer.type === "fill") {
          if (id === "water" || id === "waterway") {
            map.setPaintProperty(id, "fill-color", palette.water);
          } else if (id.includes("park") || id.includes("grass") || id.includes("forest")) {
            map.setPaintProperty(id, "fill-color", palette.park);
          } else if (id === "building" || id.includes("building")) {
            map.setPaintProperty(id, "fill-color", palette.building);
          } else if (id === "background" || id === "land") {
            map.setPaintProperty(id, "background-color", palette.background);
          }
        }
      } catch {
        // Silently skip layers that can't be modified
      }
    });
  }, []);

  const isMobileDevice = typeof navigator !== "undefined" && MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);
  const routeStats = useMemo(() => getRouteCounts(locations), [locations]);

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const getDriveFileId = (url) => {
    if (!url) return null;
    const match = url.match(/drive\.google\.com\/(?:file\/d\/([\w-]+)\/|open\?id=([\w-]+))/);
    return match ? (match[1] || match[2]) : null;
  };

  const getDriveEmbedUrl = (url) => {
    const fileId = getDriveFileId(url);
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null;
  };

  const getVideoEmbedUrl = (url) => {
    return getYouTubeEmbedUrl(url) || getDriveEmbedUrl(url);
  };

  const isDriveVideo = (url) => {
    return getDriveFileId(url) !== null;
  };

  // Search across ALL routes, not just the active one
  const filteredPlaces = useMemo(() => {
    const normalizedQuery = normalizeText(searchText.trim());

    if (normalizedQuery.length === 0) {
      // No search: show only places from the selected route
      return locations.filter((place) => place.routeId === selectedRouteId);
    }

    // Searching: show ALL matching places across all routes
    return locations.filter((place) => {
      return (
        normalizeText(place.name).includes(normalizedQuery) ||
        normalizeText(place.subtitle).includes(normalizedQuery)
      );
    });
  }, [locations, searchText, selectedRouteId]);

  // Pointer move for draggable popup
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!popupDragRef.current) return;
      const { startX, startY, startLeft, startTop } = popupDragRef.current;
      const popupWidth = Math.min(window.innerWidth - 24, 320);
      const popupHeight = 340;
      const nextLeft = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, startLeft + (event.clientX - startX)));
      const nextTop = Math.max(84, Math.min(window.innerHeight - popupHeight - 12, startTop + (event.clientY - startY)));
      setPlacePopupPosition({ x: nextLeft, y: nextTop });
    };

    const handlePointerUp = () => { popupDragRef.current = null; };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN) { setLoadError("Falta configurar VITE_MAPBOX_TOKEN en .env.local"); return undefined; }
    if (!MAPBOX_TOKEN.startsWith("pk.")) { setLoadError("VITE_MAPBOX_TOKEN debe ser público (pk.*)."); return undefined; }
    if (!mapContainerRef.current || mapRef.current) return undefined;

    mapContainerRef.current.innerHTML = "";
    mapboxgl.accessToken = MAPBOX_TOKEN;

    let map;
    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        pitch: MAP_PITCH,
        bearing: MAP_BEARING,
        attributionControl: true,
      });
    } catch {
      setLoadError("No se pudo inicializar el mapa. Revisa VITE_MAPBOX_TOKEN.");
      return undefined;
    }

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.on("load", () => {
      setIsMapReady(true);
      // Route colors are applied via the useEffect below when isMapReady becomes true
    });
    map.on("error", () => setLoadError("Error al cargar mapa. Verifica el token."));

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
      stopNavigationPlayback();
      stopRealNavigation();
      if (mapRef.current) mapRef.current.remove();
      mapRef.current = null;
      setIsMapReady(false);
      if (routeAnimationRef.current) cancelAnimationFrame(routeAnimationRef.current);
      routeAnimationRef.current = null;
      if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
      routeSourceRef.current = null;
      if (mapContainerRef.current) mapContainerRef.current.innerHTML = "";
    };
  }, []);

  // Sync markers with locations
  useEffect(() => {
    if (!isMapReady || !mapRef.current) return undefined;
    markersRef.current.forEach(({ marker }) => marker.remove());

    const builtMarkers = locations.map((place) => {
      const markerElement = document.createElement("button");
      markerElement.type = "button";
      markerElement.className = `mapas-custom-marker mapas-custom-marker--${place.routeId}`;
      markerElement.setAttribute("aria-label", place.name);

      // Inner dot with hover transitions (isolated from Mapbox positioning)
      const markerDot = document.createElement("span");
      const markerIcon = getMarkerIcon(place);
      markerDot.className = markerIcon ? "mapas-custom-marker__dot mapas-custom-marker__dot--icon" : "mapas-custom-marker__dot";
      if (markerIcon) {
        markerDot.style.backgroundImage = `url(${markerIcon})`;
        markerDot.style.backgroundSize = "cover";
        markerDot.style.backgroundPosition = "center";
      }
      markerElement.appendChild(markerDot);

      const openPlace = () => {
        setSelectedRouteId(place.routeId);
        setSelectedPlaceId(place.id);
        setActivePlace(place);
        setIsNavigationOpen(false);
        setIsPlacePopupOpen(true);
        setIsPlacePopupCollapsed(false);
        setPlacePopupPosition({ x: 24, y: 96 });
        setRoutePlans({});
        setRouteOrigin(null);
        setView("list");
        stopNavigationPlayback();
        clearRouteLayer();
        setImgErrors({});
      };

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(place.coordinates)
        .addTo(mapRef.current);

      markerElement.addEventListener("click", openPlace);

      return { place, marker, markerElement };
    });

    markersRef.current = builtMarkers;
    if (!locations.some((pl) => pl.id === selectedPlaceId) && locations[0]) {
      setSelectedPlaceId(locations[0].id);
      setActivePlace(locations[0]);
    }

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
    };
  }, [isMapReady, locations, selectedPlaceId]);

  // Sync active place
  useEffect(() => {
    if (!locations.length) return;
    const current = locations.find((pl) => pl.id === selectedPlaceId) ?? locations[0];
    if (current && current.id !== activePlace?.id) setActivePlace(current);
  }, [locations, selectedPlaceId, activePlace?.id]);

  // Filter markers by search (all routes when searching) or navigation mode
  useEffect(() => {
    const normalizedQuery = normalizeText(searchText.trim());
    const isNavMode = isNavigating;
    markersRef.current.forEach(({ place, markerElement }) => {
      if (isNavMode) {
        // Navigation mode on mobile: hide ALL normal markers, only destination + user visible
        markerElement.style.display = "none";
      } else if (normalizedQuery.length > 0) {
        // Search mode: show ALL matching markers across all routes
        const searchMatches =
          normalizeText(place.name).includes(normalizedQuery) ||
          normalizeText(place.subtitle).includes(normalizedQuery);
        markerElement.style.display = searchMatches ? "block" : "none";
      } else {
        // Normal mode: only show markers from the selected route
        markerElement.style.display = place.routeId === selectedRouteId ? "block" : "none";
      }
    });
  }, [searchText, selectedRouteId, view, isMobileDevice]);

  // Mobile location prompt
  useEffect(() => {
    if (!isMobileDevice || locationPermissionState !== "idle") return;
    setLocationPermissionState("prompt");
    setLocationPermissionMessage("Activa la ubicación para trazar rutas en tiempo real.");
  }, [isMobileDevice, locationPermissionState]);

  const requestCurrentPosition = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
    });

  const requestLocationPermission = async ({ silentSuccess = false } = {}) => {
    if (!("geolocation" in navigator)) {
      const msg = "Este dispositivo no soporta geolocalización.";
      setLocationPermissionState("unsupported");
      setLocationPermissionMessage(msg);
      return { position: null, errorMessage: msg };
    }
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      const msg = "Para solicitar ubicación debes abrir el sitio en HTTPS.";
      setLocationPermissionState("error");
      setLocationPermissionMessage(msg);
      return { position: null, errorMessage: msg };
    }
    try {
      if (navigator.permissions?.query) {
        const perm = await navigator.permissions.query({ name: "geolocation" });
        if (perm.state === "denied") {
          const msg = "Permiso de ubicación bloqueado. Habilítalo en configuración.";
          setLocationPermissionState("denied");
          setLocationPermissionMessage(msg);
          return { position: null, errorMessage: msg };
        }
      }
    } catch { /* Safari no soporta Permissions API */ }

    try {
      const position = await requestCurrentPosition();
      setLocationPermissionState("granted");
      if (!silentSuccess) setLocationPermissionMessage("Ubicación activada correctamente.");
      return { position, errorMessage: "" };
    } catch (error) {
      let msg = "No pudimos acceder a tu ubicación. Revisa permisos.";
      if (error?.code === 1) {
        msg = "Permiso denegado.";
        setLocationPermissionState("denied");
      } else if (error?.code === 3) {
        msg = "No se pudo obtener ubicación a tiempo. Intenta en zona con mejor señal.";
        setLocationPermissionState("error");
      } else {
        setLocationPermissionState("error");
      }
      setLocationPermissionMessage(msg);
      return { position: null, errorMessage: msg };
    }
  };

  const goBackToRoutes = () => {
    setRoutePlans({});
    setIsNavigationOpen(false);
    clearRouteLayer();
    stopRealNavigation();
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  };

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
    setActivePlace(place);
    setSelectedRouteId(place.routeId); // Switch to the place's route
    setSavedNav(null);
    setIsPlacePopupOpen(true);
    setIsPlacePopupCollapsed(false);
    setPlacePopupPosition({ x: 24, y: 96 });
    setIsNavigationOpen(false);
    setRoutePlans({});
    setRouteOrigin(null);
    setRouteStatus("idle");
    setRouteMessage("");
    setView("list");
    stopNavigationPlayback();
    clearRouteLayer();
    setVideoPlayingId(null);
    setImgErrors({});

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: place.coordinates,
        zoom: 15.2,
        pitch: 0,
        bearing: 0,
        duration: 1100,
      });
    }
  };

  const goBackToList = () => {
    setView("list");
    setIsNavigationOpen(false);
    setRoutePlans({});
    clearRouteLayer();
    setVideoPlayingId(null);
    stopRealNavigation();
    // Remove destination marker
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  };

  const collapsePlacePopup = () => {
    setIsPlacePopupOpen(false);
    setIsPlacePopupCollapsed(true);
  };

  const expandPlacePopup = () => {
    setIsPlacePopupCollapsed(false);
    setIsPlacePopupOpen(true);
  };

  const handlePopupPointerDown = (event) => {
    event.preventDefault();
    popupDragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: placePopupPosition.x,
      startTop: placePopupPosition.y,
    };
  };


  const formatDuration = (seconds) => {
    if (!Number.isFinite(seconds)) return "--";
    const minutes = Math.max(1, Math.round(seconds / 60));
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hours} h ${rem} min` : `${hours} h`;
  };

  const formatDistance = (meters) => {
    if (!Number.isFinite(meters)) return "--";
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatEta = (seconds) => {
    if (!Number.isFinite(seconds)) return "--:--";
    return new Date(Date.now() + seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Derive the current route plan for the selected travel mode — must be before any reference
  const routePlan = routePlans[travelMode];

  const currentNavigationPlan = routePlan;
  const currentNavigationRemainingSeconds = (() => {
    if (!Number.isFinite(currentNavigationPlan?.duration)) return Number.NaN;
    if (isNavigating) {
      // Use real GPS progress for remaining time
      return Math.max(0, Math.round(currentNavigationPlan.duration * (1 - realProgress / 100)));
    }
    return Math.max(0, Math.round(currentNavigationPlan.duration - navigationElapsedSeconds));
  })();

  const currentNavigationProgress = Math.max(0, Math.min(100, navigationPreviewProgress));
  const currentNavigationPhase = currentNavigationProgress < 18 ? "Salida" : currentNavigationProgress < 55 ? "Ruta" : currentNavigationProgress < 85 ? "Enfoque" : "Arribo";
  const currentNavigationSpeed =
    isNavigating ? realSpeed : (travelMode === "walking" ? 5 + Math.round((currentNavigationProgress % 4) / 2) : travelMode === "car" ? 34 + Math.round((currentNavigationProgress % 7) / 2) : 21 + Math.round((currentNavigationProgress % 5) / 2));
  const currentNavigationManeuver =
    currentNavigationProgress < 18
      ? "Salimos del punto actual"
      : currentNavigationProgress < 40
        ? "Sigue por la vía principal"
        : currentNavigationProgress < 68
          ? "Mantente en el carril y avanza"
          : currentNavigationProgress < 92
            ? "Reduce velocidad, destino cercano"
            : `Llegando a ${activePlace?.name ?? "tu destino"}`;

  const getNavigationInstruction = (progress) => {
    if (progress < 0.18) return "Sal con cuidado y mantente sobre la ruta principal.";
    if (progress < 0.55) return "Sigue recto. El recorrido se mantiene estable.";
    if (progress < 0.85) return "Prepárate para llegar. Mantente atento al destino.";
    return `Llegando a ${activePlace?.name ?? "tu destino"}.`;
  };

  const stopNavigationPlayback = () => {
    if (navigationTimerRef.current) { clearInterval(navigationTimerRef.current); navigationTimerRef.current = null; }
    if (navigationAnimationRef.current) { cancelAnimationFrame(navigationAnimationRef.current); navigationAnimationRef.current = null; }
  };

  // Real GPS navigation tracking
  const stopRealNavigation = useCallback(() => {
    if (navigationWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(navigationWatchIdRef.current);
      navigationWatchIdRef.current = null;
    }
    lastPositionRef.current = null;
    lastPositionTimeRef.current = null;
    setIsNavigating(false);
    setSavedNav(null);
    hasArrivedRef.current = false;
    if (arrivalTimerRef.current) { clearTimeout(arrivalTimerRef.current); arrivalTimerRef.current = null; }
    alertedStepsRef.current = new Set();
    setProximityAlert(null);
    // Clear voice reference so next navigation speaks first instruction again
    lastInstructionRef.current = '';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    // Stop device orientation listener
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
    // Clear persisted navigation (sessionStorage)
    try { sessionStorage.removeItem('navmap_active'); } catch { /* ignore */ }
  }, []);

  const startRealNavigation = useCallback(() => {
    if (!routePlan || !mapRef.current) return;
    
    const plan = routePlan;
    const coords = plan.coordinates;
    if (!coords?.length) return;

    // Add destination marker
    addDestinationMarker(activePlace);

    // Start watching position with high accuracy
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed: gpsSpeed, accuracy } = position.coords;
        const userLngLat = [longitude, latitude];

        // Update user marker on map
        if (userMarkerRef.current) {
          userMarkerRef.current.setLngLat(userLngLat);
        } else if (mapRef.current) {
          const el = document.createElement("div");
          el.className = "mapas-user-marker mapas-user-marker--tracking";
          userMarkerRef.current = new mapboxgl.Marker(el).setLngLat(userLngLat).addTo(mapRef.current);
        }

        // Calculate real speed: prefer GPS speed (m/s → km/h), fallback to distance/time
        let currentSpeed = 0;
        if (gpsSpeed !== null && gpsSpeed !== undefined && gpsSpeed >= 0) {
          currentSpeed = Math.round(gpsSpeed * 3.6); // m/s → km/h
        } else if (lastPositionRef.current && lastPositionTimeRef.current) {
          const dx = longitude - lastPositionRef.current[0];
          const dy = latitude - lastPositionRef.current[1];
          const distKm = Math.sqrt(dx * dx + dy * dy) * 111320; // rough km
          const timeSec = (Date.now() - lastPositionTimeRef.current) / 1000;
          if (timeSec > 0) {
            currentSpeed = Math.round((distKm / timeSec) * 3.6);
          }
        }
        // Outlier filter: use ref-based last stable speed (avoids stale closure)
        if (currentSpeed > 250) currentSpeed = lastSpeedRef.current || 0;
        currentSpeed = Math.max(0, Math.min(250, currentSpeed));
        lastSpeedRef.current = currentSpeed;
        setRealSpeed(currentSpeed);

        // Find closest point on route to calculate real progress
        const totalPoints = coords.length;
        let minDistSq = Infinity;
        let closestIdx = 0;
        coords.forEach((coord, idx) => {
          const dx = coord[0] - longitude;
          const dy = coord[1] - latitude;
          const distSq = dx * dx + dy * dy;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            closestIdx = idx;
          }
        });
        const newProgress = Math.min(100, Math.round((closestIdx / Math.max(1, totalPoints - 1)) * 100));
        setRealProgress(newProgress);

        // Find current instruction step based on closest point
        if (plan.steps?.length && activePlace) {
          const routeLen = plan.steps.length;
          const stepIdx = Math.min(routeLen - 1, Math.floor((newProgress / 100) * routeLen));
          const step = plan.steps[stepIdx];
          const newText = step.instruction || "Sigue recto";
          setRealInstruction({
            text: newText,
            icon: step.maneuver || "straight",
            distance: step.distance || 0,
          });
          // Speak instruction via SpeechSynthesis when it changes
          if (isVoiceEnabled && newText !== lastInstructionRef.current && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(newText);
            utterance.lang = 'es-ES';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
            lastInstructionRef.current = newText;
          }
        }

        // Proximity alert: detect distance to next step (< 100m)
        if (plan.steps?.length && activePlace?.coordinates && !hasArrivedRef.current) {
          const nextStepIdx = Math.min(plan.steps.length - 1, Math.floor((newProgress / 100) * plan.steps.length) + 1);
          const nextStep = plan.steps[nextStepIdx];
          if (nextStep && nextStep.location && !alertedStepsRef.current.has(nextStepIdx)) {
            const distToNext = haversineDistance(userLngLat, [nextStep.location[0], nextStep.location[1]]);
            if (distToNext < 100) {
              alertedStepsRef.current.add(nextStepIdx);
              const alertText = nextStep.instruction || 'Giro próximo';
              setProximityAlert({ text: alertText, distance: Math.round(distToNext), icon: nextStep.maneuver || 'straight', stepIdx: nextStepIdx });
              // Speak the alert with emphasis
              if (isVoiceEnabled && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(`Precaución, ${alertText}`);
                utter.lang = 'es-ES';
                utter.rate = 0.85;
                window.speechSynthesis.speak(utter);
              }
              // Clear alert after 6 seconds
              setTimeout(() => setProximityAlert(null), 6000);
            }
          }
        }

        // Save last position for speed fallback calculation
        lastPositionRef.current = [longitude, latitude];
        lastPositionTimeRef.current = Date.now();

        // Arrival detection: check distance to destination
        if (activePlace?.coordinates && !hasArrivedRef.current) {
          const distToDest = haversineDistance(userLngLat, activePlace.coordinates);
          if (distToDest < 50) {
            hasArrivedRef.current = true;
            setRealProgress(100);
            setRouteStatus('success');
            setRouteMessage(`¡Llegaste a ${activePlace.name}!`);
            // Speak arrival
            if (isVoiceEnabled && window.speechSynthesis) {
              window.speechSynthesis.cancel();
              const utter = new SpeechSynthesisUtterance(`Has llegado a ${activePlace.name}`);
              utter.lang = 'es-ES';
              utter.rate = 0.85;
              window.speechSynthesis.speak(utter);
            }
            // Auto-stop navigation after 4 seconds
            arrivalTimerRef.current = setTimeout(() => {
              stopRealNavigation();
              goBackToList();
            }, 4000);
          }
        }

        // Recenter map every 3 seconds if we have a recent fix
        if (accuracy < 100 && mapRef.current && !hasArrivedRef.current) {
          mapRef.current.easeTo({
            center: userLngLat,
            zoom: 15.6,
            duration: 500,
            essential: true,
          });
        }
      },
      (error) => {
        console.warn("GPS error:", error.message);
        setRouteStatus("error");
        setRouteMessage("Error de GPS: " + error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 2000,
      }
    );

    // Start device orientation listener for compass
    hasArrivedRef.current = false;
    try {
      // iOS 13+ requires permission request
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then((state) => {
          if (state === 'granted') window.addEventListener('deviceorientation', handleDeviceOrientation);
        }).catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    } catch { /* deviceorientation not supported */ }

    navigationWatchIdRef.current = watchId;
    setIsNavigating(true);
    setRouteStatus("success");
    setRouteMessage("Navegación GPS activa");

    // Persist navigation state to sessionStorage (clears on tab close)
    try {
      sessionStorage.setItem('navmap_active', JSON.stringify({
        destinationName: activePlace?.name,
        destinationCoords: activePlace?.coordinates,
        travelMode,
        destinationImage: activePlace?.image,
        savedAt: Date.now(),
      }));
    } catch { /* quota exceeded or private mode */ }
  }, [routePlan, activePlace]);

  const startNavigationPlayback = (plan) => {
    if (!mapRef.current || !plan?.coordinates?.length) return;
    stopNavigationPlayback();

    const coordinates = plan.coordinates;
    const demoDurationMs = 36000;
    const routeLength = Math.max(1, coordinates.length - 1);
    const startTime = performance.now();
    const startedAt = Date.now();

    setNavigationPreviewProgress(0);
    setNavigationElapsedSeconds(0);

    const advance = (now) => {
      const rawProgress = Math.min(1, (now - startTime) / demoDurationMs);
      const easedProgress = rawProgress < 0.5 ? 2 * rawProgress * rawProgress : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;
      const routeIndex = Math.min(routeLength, Math.floor(easedProgress * routeLength));
      const currentPoint = coordinates[routeIndex] ?? coordinates[coordinates.length - 1];

      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(currentPoint);
      } else {
        const el = document.createElement("div");
        el.className = "mapas-user-marker mapas-user-marker--tracking";
        userMarkerRef.current = new mapboxgl.Marker(el).setLngLat(currentPoint).addTo(mapRef.current);
      }

      if (mapRef.current) {
        mapRef.current.easeTo({
          center: currentPoint,
          zoom: 15.6,
          pitch: 0,
          bearing: 0,
          duration: 350,
          essential: true,
        });
      }

      setNavigationPreviewProgress(Math.round(easedProgress * 100));
      setRouteMessage(getNavigationInstruction(easedProgress));

      if (rawProgress < 1) {
        navigationAnimationRef.current = requestAnimationFrame(advance);
      } else {
        setRouteStatus("success");
        setRouteMessage(`Llegaste a ${activePlace?.name ?? "tu destino"}.`);
        stopNavigationPlayback();
      }
    };

    navigationAnimationRef.current = requestAnimationFrame(advance);
    navigationTimerRef.current = window.setInterval(() => {
      setNavigationElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
  };

  // Get the first real instruction from the route or fallback
  const getCurrentInstruction = (plan, progress) => {
    if (!plan?.steps?.length) {
      return { text: "Sigue recto", icon: "straight", distance: plan?.distance || 0 };
    }
    const routeLen = plan.steps.length;
    const stepIdx = Math.min(routeLen - 1, Math.floor((progress / 100) * routeLen));
    const step = plan.steps[stepIdx];
    return {
      text: step.instruction || "Sigue recto",
      icon: step.maneuver || "straight",
      distance: step.distance || 0,
    };
  };

  const fetchRoutePlan = async (mode, origin, destination) => {
    const profile = mode === "walking" ? "walking" : "driving";
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&steps=true&language=es&access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) throw new Error(`No route for ${mode}`);
    const route = data.routes[0];
    // Extract turn-by-turn steps from the first leg
    const steps = route.legs?.[0]?.steps?.map((s) => ({
      instruction: s.maneuver?.instruction || s.maneuver?.type || "Sigue recto",
      maneuver: s.maneuver?.modifier || s.maneuver?.type || "straight",
      distance: s.distance || 0,
      duration: s.duration || 0,
      location: s.maneuver?.location || null,
    })) || [];
    return {
      mode,
      coordinates: route.geometry.coordinates,
      duration: route.duration,
      distance: route.distance,
      steps,
      note: mode === "walking" ? "Ruta caminando" : "Ruta en carro",
    };
  };

  const drawRouteForPlan = (plan) => {
    if (plan?.coordinates) drawRouteAnimation(plan.coordinates);
  };

  const loadNavigationPlans = async (origin, destination) => {
    setIsRouteLoading(true);
    setRouteMessage("Consultando tiempos de ruta...");
    stopNavigationPlayback();

    try {
      const [walkingPlan, carPlan] = await Promise.all([
        fetchRoutePlan("walking", origin, destination),
        fetchRoutePlan("car", origin, destination),
      ]);

      const transitPlan = {
        mode: "transit",
        coordinates: carPlan.coordinates,
        duration: Math.round(carPlan.duration * 1.25),
        distance: carPlan.distance,
        note: "Estimado para transporte publico",
      };

      const nextPlans = { walking: walkingPlan, car: carPlan, transit: transitPlan };
      setRoutePlans(nextPlans);
      setTravelMode((prev) => (nextPlans[prev] ? prev : "walking"));
      setRouteStatus("success");
      setRouteMessage("Selecciona un modo y luego inicia navegación.");
      setIsNavigationOpen(true);
      setView("navigation");
      const defaultPlan = nextPlans[travelMode] || walkingPlan;
      drawRouteForPlan(defaultPlan);

      if (mapRef.current) {
        mapRef.current.fitBounds(new mapboxgl.LngLatBounds(origin, destination), {
          padding: 120,
          duration: 1200,
          pitch: 0,
        });
      }

    } catch {
      setRouteStatus("error");
      setRouteMessage("No se pudieron cargar los tiempos de ruta.");
      setIsNavigationOpen(false);
    } finally {
      setIsRouteLoading(false);
    }
  };

  const clearRouteLayer = () => {
    if (!mapRef.current) return;
    if (routeAnimationRef.current) { cancelAnimationFrame(routeAnimationRef.current); routeAnimationRef.current = null; }
    if (userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (mapRef.current.getLayer("capa-ruta")) mapRef.current.removeLayer("capa-ruta");
    if (mapRef.current.getLayer("capa-ruta-base")) mapRef.current.removeLayer("capa-ruta-base");
    if (mapRef.current.getSource("ruta-activa")) mapRef.current.removeSource("ruta-activa");
    routeSourceRef.current = null;
  };

  const drawRouteAnimation = (routeCoordinates) => {
    if (!mapRef.current) return;
    clearRouteLayer();

    const geojson = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } };

    mapRef.current.addSource("ruta-activa", { type: "geojson", data: geojson });
    routeSourceRef.current = geojson;

    mapRef.current.addLayer({
      id: "capa-ruta-base",
      type: "line",
      source: "ruta-activa",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#ffffff", "line-width": 10, "line-opacity": 0.18 },
    });

    mapRef.current.addLayer({
      id: "capa-ruta",
      type: "line",
      source: "ruta-activa",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#f19a20", "line-width": 6, "line-opacity": 0.96, "line-dasharray": [0.5, 2] },
    });

    let step = 0;
    const framesPerStep = Math.max(1, Math.floor(routeCoordinates.length / 120));

    const animate = () => {
      if (!routeSourceRef.current || !mapRef.current) return;
      if (step < routeCoordinates.length) {
        routeSourceRef.current.geometry.coordinates.push(routeCoordinates[step]);
        mapRef.current.getSource("ruta-activa").setData(routeSourceRef.current);
        step += framesPerStep;
        if (step >= routeCoordinates.length &&
            routeSourceRef.current.geometry.coordinates[routeSourceRef.current.geometry.coordinates.length - 1] !==
              routeCoordinates[routeCoordinates.length - 1]) {
          routeSourceRef.current.geometry.coordinates.push(routeCoordinates[routeCoordinates.length - 1]);
          mapRef.current.getSource("ruta-activa").setData(routeSourceRef.current);
        }
        routeAnimationRef.current = requestAnimationFrame(animate);
      }
    };
    routeAnimationRef.current = requestAnimationFrame(animate);
  };

  // Ref to store the destination marker (thumbnail) on the map
  const destMarkerRef = useRef(null);

  const addDestinationMarker = (place) => {
    if (!mapRef.current) return;
    // Remove existing destination marker
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
    // Create a marker with the site's image as a circular thumbnail
    const el = document.createElement("button");
    el.type = "button";
    el.className = "mapas-dest-marker";
    el.style.cssText = `
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 3px solid #f19a20;
      background: url('${place.image}') center/cover no-repeat;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
      cursor: pointer;
      display: block;
    `;
    // Fallback icon if no image
    if (!place.image) {
      el.style.background = "#f19a20";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "#fff";
      el.style.fontWeight = "700";
      el.style.fontSize = "18px";
      el.textContent = "📍";
    }
    destMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat(place.coordinates)
      .addTo(mapRef.current);
  };

  const handleTraceRoute = async () => {
    if (!activePlace || !mapRef.current) return;
    
    // Stop any existing GPS navigation first
    stopRealNavigation();
    
    // Close the floating popup (site info) on mobile
    setIsPlacePopupOpen(false);
    setIsPlacePopupCollapsed(false);
    
    // Add destination thumbnail marker
    addDestinationMarker(activePlace);
    
    setRouteStatus("locating");
    setRouteMessage("Buscando tu ubicación...");
    setIsNavigationOpen(true);
    setView("navigation");

    const { position, errorMessage } = await requestLocationPermission({ silentSuccess: true });
    if (!position) {
      setRouteStatus("error");
      setRouteMessage(errorMessage || "No pudimos acceder a tu ubicación.");
      return;
    }

    const userLngLat = [position.coords.longitude, position.coords.latitude];
    setRouteOrigin(userLngLat);
    setRouteStatus("routing");
    setRouteMessage("Consultando ruta...");

    if (userMarkerRef.current) userMarkerRef.current.remove();
    const userMarkerElement = document.createElement("div");
    userMarkerElement.className = "mapas-user-marker";
    userMarkerRef.current = new mapboxgl.Marker(userMarkerElement).setLngLat(userLngLat).addTo(mapRef.current);

    await loadNavigationPlans(userLngLat, activePlace.coordinates);
  };

  useEffect(() => {
    if (!routePlans[travelMode]) return;
    drawRouteForPlan(routePlans[travelMode]);
  }, [travelMode, routePlans]);

  // Handle locationId from URL (coming from Rutas Interactivas)
  useEffect(() => {
    const locId = searchParams.get("locationId");
    if (!locId || !locations.length || !isMapReady) return;
    const target = locations.find((l) => l.id === locId);
    if (target) {
      // Small delay to let the map finish rendering
      const timer = setTimeout(() => {
        handleSelectPlace(target);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchParams, locations, isMapReady]);

  // Apply route colors when selected route changes
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    applyRouteColors(mapRef.current, selectedRouteId);
  }, [selectedRouteId, isMapReady, applyRouteColors]);

  return (
    <div className="mapas-page">
      <TopBar activeSection="mapas" onSectionChange={() => {}} />

      <main className="mapas-main">
        <section id="inicio" className="mapas-stage" aria-label="Mapa interactivo">
          <div ref={mapContainerRef} id="mapas" className="mapas-container" />

          <div className="mapas-ui-layer">
            {/* Restore navigation banner */}
            {savedNav && !isNavigating && (
              <div className="mapas-restore-banner">
                <div className="mapas-restore-banner-content">
                  <span className="mapas-restore-banner-icon">🧭</span>
                  <div>
                    <strong>Navegación guardada</strong>
                    <small>{savedNav.destinationName}</small>
                  </div>
                </div>
                <div className="mapas-restore-banner-actions">
                  <button
                    type="button"
                    className="mapas-restore-banner-btn"
                    onClick={() => {
                      const target = locations.find(
                        (l) => l.name === savedNav.destinationName
                      ) || locations.find(
                        (l) => l.coordinates?.[0] === savedNav.destinationCoords?.[0] && l.coordinates?.[1] === savedNav.destinationCoords?.[1]
                      );
                      if (target) {
                        handleSelectPlace(target);
                        setTimeout(() => handleTraceRoute(), 600);
                      } else if (savedNav.destinationCoords && mapRef.current) {
                        mapRef.current.flyTo({ center: savedNav.destinationCoords, zoom: 15, duration: 1000 });
                      }
                      setSavedNav(null);
                      try { sessionStorage.removeItem('navmap_active'); } catch {}
                    }}
                  >
                    Continuar
                  </button>
                  <button
                    type="button"
                    className="mapas-restore-banner-dismiss"
                    onClick={() => {
                      setSavedNav(null);
                      try { sessionStorage.removeItem('navmap_active'); } catch {}
                    }}
                    aria-label="Descartar"
                  >×</button>
                </div>
                <label className="mapas-restore-banner-remember">
                  <input
                    type="checkbox"
                    checked={dontAskRestore}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setDontAskRestore(next);
                      try {
                        if (next) {
                          localStorage.setItem('navmap_dont_ask', 'true');
                          sessionStorage.removeItem('navmap_active');
                          setSavedNav(null);
                        } else {
                          localStorage.removeItem('navmap_dont_ask');
                        }
                      } catch {}
                    }}
                  />
                  No preguntar de nuevo
                </label>
              </div>
            )}

            {/* Top: Search */}
            <div className="mapas-ui-top">
              <div className="mapas-ui-top-stack">
                <div className="mapas-ui-card mapas-search-box">
                  <span className="mapas-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar en todas las rutas..."
                    aria-label="Buscar"
                  />
                </div>
                {isMobileDevice && (
                  <div className="mapas-location-cta" role="status" aria-live="polite">
                    <button
                      type="button"
                      className="mapas-location-cta__button"
                      onClick={() => requestLocationPermission()}
                      disabled={locationPermissionState === "granted"}
                    >
                      {locationPermissionState === "granted" ? "Ubicación activa" : "Activar ubicación"}
                    </button>
                    {locationPermissionMessage && <p>{locationPermissionMessage}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Floating popup on marker click */}
            {isPlacePopupOpen && activePlace && (
              <section
                className="mapas-floating-popup"
                style={{ left: `${placePopupPosition.x}px`, top: `${placePopupPosition.y}px` }}
                aria-label={`Resumen de ${activePlace.name}`}
              >
                <button type="button" className="mapas-floating-popup__drag" onPointerDown={handlePopupPointerDown} aria-label="Mover popup">
                  <span /><span /><span />
                </button>
                <div className="mapas-floating-popup__image" style={{
                  backgroundImage: imgErrors[activePlace.id]
                    ? `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="124" viewBox="0 0 200 124"><rect width="200" height="124" fill="#eaddcb"/><text x="100" y="62" text-anchor="middle" dominant-baseline="middle" font-family="Bebas Neue, sans-serif" font-size="16" fill="#8a7a6a">SIN ILUSTRACIÓN</text></svg>')}'`
                    : `url('${activePlace.image}')`,
                  backgroundPosition: activePlace.imagePosition || "center",
                }}>
                  <img
                    src={activePlace.image}
                    alt=""
                    onError={() => handleImgError(activePlace.id)}
                    style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
                  />
                </div>
                <div className="mapas-floating-popup__content">
                  <div>
                    <p className="mapas-floating-popup__kicker">{activePlace.categoryLabel}</p>
                    <h3>{activePlace.name}</h3>
                    <p>{activePlace.subtitle}</p>
                  </div>
                  <div className="mapas-floating-popup__actions">
                    <button type="button" className="mapas-floating-popup__button" onClick={() => { setView("expanded"); setIsPlacePopupOpen(false); }}>
                      Ver detalles
                    </button>
                    <button type="button" className="mapas-floating-popup__button mapas-floating-popup__button--primary" onClick={handleTraceRoute}>
                      Como llegar
                    </button>
                    <button type="button" className="mapas-floating-popup__close" onClick={collapsePlacePopup} aria-label="Minimizar popup">×</button>
                  </div>
                </div>
              </section>
            )}

            {isPlacePopupCollapsed && activePlace && (
              <button
                type="button"
                className="mapas-floating-popup-minimized"
                style={{ left: `${placePopupPosition.x}px`, top: `${placePopupPosition.y}px` }}
                onClick={expandPlacePopup}
              >
                <span className="mapas-floating-popup-minimized__badge">{activePlace.categoryLabel}</span>
                <strong>{activePlace.name}</strong>
                <small>Abrir opciones</small>
              </button>
            )}

            {/* Waze-style navigation overlay — shows on all devices when GPS navigation is active */}
            {isNavigating && activePlace && routePlan && (
              <NavMap
                destinationName={activePlace.name}
                duration={currentNavigationPlan?.duration || 0}
                distance={currentNavigationPlan?.distance || 0}
                progress={hasArrivedRef.current ? 100 : realProgress}
                speed={currentNavigationSpeed}
                instruction={hasArrivedRef.current ? `¡Llegaste a ${activePlace.name}!` : realInstruction.text}
                instructionIcon={hasArrivedRef.current ? 'arrive' : realInstruction.icon}
                instructionDistance={realInstruction.distance}
                travelMode={travelMode}
                isVoiceEnabled={isVoiceEnabled}
                heading={deviceHeadingRef.current}
                hasArrived={hasArrivedRef.current}
                proximityAlert={proximityAlert}
                onVoiceToggle={() => {
                  const next = !isVoiceEnabled;
                  setIsVoiceEnabled(next);
                  try { localStorage.setItem('navmap_voice', next ? 'true' : 'false'); } catch {}
                  if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
                }}
                onClose={() => { stopRealNavigation(); goBackToList(); }}
                onRecenter={() => {
                  if (mapRef.current) {
                    if (userMarkerRef.current) {
                      const lngLat = userMarkerRef.current.getLngLat();
                      if (lngLat) {
                        mapRef.current.flyTo({ center: [lngLat.lng, lngLat.lat], zoom: 15.6, duration: 800 });
                        return;
                      }
                    }
                    if (routeOrigin) {
                      mapRef.current.flyTo({ center: routeOrigin, zoom: 15.6, duration: 800 });
                    }
                  }
                }}
              />
            )}

            {/* Navigation panel above bottom bar — appears when tracing a route */}
            {isNavigationOpen && !isNavigating && activePlace && (
              <div className="mapas-nav-panel visible">
                <div className="mapas-nav-panel__inner">
                  <div className="mapas-nav-panel__header">
                    <div className="mapas-nav-panel__dest">
                      <span className="mapas-nav-panel__label">Cómo llegar a</span>
                      <strong className="mapas-nav-panel__name">{activePlace.name}</strong>
                    </div>
                    <button
                      type="button"
                      className="mapas-nav-panel__close"
                      onClick={goBackToRoutes}
                      aria-label="Cerrar navegaci&oacute;n"
                    >&times;</button>
                  </div>
                  <div className="mapas-nav-panel__body">
                    {isRouteLoading ? (
                      <div className="mapas-nav-panel__loading">Calculando ruta...</div>
                    ) : (
                      <>
                        <div className="mapas-nav-panel__modes">
                          {[
                            { key: "walking", label: "🚶", dur: formatDuration(routePlans["walking"]?.duration), dist: formatDistance(routePlans["walking"]?.distance) },
                            { key: "car", label: "🚗", dur: formatDuration(routePlans["car"]?.duration), dist: formatDistance(routePlans["car"]?.distance) },
                            { key: "transit", label: "🚌", dur: formatDuration(routePlans["transit"]?.duration), dist: formatDistance(routePlans["transit"]?.distance) },
                          ].map((modeOpt) => (
                            <button
                              key={modeOpt.key}
                              type="button"
                              className={`mapas-nav-panel__mode${travelMode === modeOpt.key ? " active" : ""}`}
                              onClick={() => setTravelMode(modeOpt.key)}
                              disabled={!routePlans[modeOpt.key]}
                            >
                              <span className="mapas-nav-panel__mode-icon">{modeOpt.label}</span>
                              <div className="mapas-nav-panel__mode-info">
                                <strong>{modeOpt.dur}</strong>
                                <small>{modeOpt.dist}</small>
                              </div>
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="mapas-nav-panel__gps"
                          onClick={startRealNavigation}
                          disabled={!routePlan}
                        >
                          🛰 Iniciar navegaci&oacute;n GPS
                        </button>
                        <div className="mapas-nav-panel__summary">
                          {routePlan && (
                            <>
                              <div className="mapas-nav-panel__stat">
                                <small>Distancia</small>
                                <strong>{formatDistance(routePlan.distance)}</strong>
                              </div>
                              <div className="mapas-nav-panel__stat">
                                <small>Duraci&oacute;n</small>
                                <strong>{formatDuration(routePlan.duration)}</strong>
                              </div>
                              <div className="mapas-nav-panel__stat">
                                <small>Llegada</small>
                                <strong>{formatEta(routePlan.duration)}</strong>
                              </div>
                            </>
                          )}
                        </div>
                        {routeMessage && (
                          <div className={`mapas-nav-panel__msg ${routeStatus}`}>
                            {routeMessage}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Animated sites panel above bottom bar — appears when a route is active */}
            {!isNavigating && (
              <div className={`mapas-route-places${isRouteExpanded ? " visible" : ""}`}>
                <div className="mapas-route-places__inner">
                  <div className="mapas-route-places__header">
                    <span className="mapas-route-places__name">
                      {routeStats.find((r) => r.id === selectedRouteId)?.name ?? "Ruta"}
                    </span>
                    <span className="mapas-route-places__count">
                      {filteredPlaces.length} sitios
                    </span>
                    <button
                      type="button"
                      className="mapas-route-places__close"
                      onClick={() => setIsRouteExpanded(false)}
                      aria-label="Cerrar lista"
                    >&times;</button>
                  </div>
                  <div className="mapas-route-places__list">
                    {filteredPlaces.length > 0 ? (
                      filteredPlaces.map((place) => (
                        <button
                          type="button"
                          key={place.id}
                          className={`mapas-route-places__item${selectedPlaceId === place.id ? " active" : ""}`}
                          onClick={() => handleSelectPlace(place)}
                        >
                          <span className="mapas-route-places__dot" />
                          <span className="mapas-route-places__label">{place.name}</span>
                        </button>
                      ))
                    ) : (
                      <p className="mapas-route-places__empty">No hay lugares en esta ruta.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Route cards as floating bottom bar — ALL devices */}
            {!isNavigating && (
              <div className="mapas-bottom-routes">
                {routeStats.map((route) => (
                  <button
                    type="button"
                    key={route.id}
                    className={`mapas-route-card${route.id === selectedRouteId ? " mapas-route-card--active" : ""}`}
                    onClick={() => {
                      if (route.id !== selectedRouteId) {
                        // Clear any pending switch timer to avoid race conditions
                        if (routeSwitchTimerRef.current) {
                          clearTimeout(routeSwitchTimerRef.current);
                        }
                        // First collapse, then switch route with animation
                        setIsRouteExpanded(false);
                        setIsNavigationOpen(false);
                        clearRouteLayer();
                        const timerId = setTimeout(() => {
                          setSelectedRouteId(route.id);
                          setIsRouteExpanded(true);
                          routeSwitchTimerRef.current = null;
                        }, 180);
                        routeSwitchTimerRef.current = timerId;
                      } else {
                        // Toggle the sites panel when clicking the same route
                        setIsRouteExpanded((prev) => !prev);
                      }
                    }}
                  >
                    <p className="mapas-route-card-title">{route.name}</p>
                    <p className="mapas-route-card-count">{route.count} sitios</p>
                  </button>
                ))}
              </div>
            )}

            <div id="glosario" className="mapas-ui-bottom">
            </div>
          </div>

          {/* EXPANDED VIEW: Full-window hero + two-column detail */}
          {view === "expanded" && activePlace && (
            <div className="mapas-expanded-overlay" onClick={(e) => { if (e.target === e.currentTarget) goBackToList(); }}>
              <div className="mapas-expanded-wrap">
                {/* Back Button */}
                <button
                  type="button"
                  className="mapas-expanded-back"
                  onClick={goBackToList}
                  aria-label="Volver"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5" />
                    <path d="M12 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Hero Section */}                <section className={`mapas-expanded-hero${videoPlayingId !== null ? ' mapas-expanded-hero--playing' : ''}`}>
                  {/* Background image (only when video is not playing) */}
                  {videoPlayingId === null && (
                    <>
                      {imgErrors[activePlace.id] ? (
                        <div className="mapas-expanded-hero-placeholder">
                          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                          <span>Sin ilustración</span>
                        </div>
                      ) : (
                        <img
                          className="mapas-expanded-hero-img"
                          src={activePlace.image || activePlace.images?.[0]}
                          alt={activePlace.name}
                          onError={() => handleImgError(activePlace.id)}
                          style={{ objectPosition: activePlace.imagePosition || "center" }}
                        />
                      )}
                      <div className="mapas-expanded-hero-overlay" />
                    </>
                  )}

                  {/* Play button / Video embed in hero */}
                  {activePlace.videos?.length > 0 && (
                    videoPlayingId !== null && getVideoEmbedUrl(activePlace.videos[videoPlayingId]) ? (
                      <div className={`mapas-expanded-hero-video${isDriveVideo(activePlace.videos[videoPlayingId]) ? ' mapas-expanded-hero-video--drive' : ''}`}>
                        <button
                          type="button"
                          className="mapas-expanded-hero-video-close"
                          onClick={() => setVideoPlayingId(null)}
                          aria-label="Cerrar video"
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                          </svg>
                        </button>
                        <iframe
                          src={(() => {
                            const baseUrl = getVideoEmbedUrl(activePlace.videos[videoPlayingId]);
                            const isYoutube = getYouTubeEmbedUrl(activePlace.videos[videoPlayingId]);
                            return isYoutube ? baseUrl + "?autoplay=1&rel=0" : baseUrl;
                          })()}
                          title={`Video de ${activePlace.name}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : (
                      <div className="mapas-expanded-play">
                        <button
                          type="button"
                          className="mapas-expanded-play-btn"
                          onClick={() => setVideoPlayingId(0)}
                          aria-label="Reproducir video"
                        >
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                      </div>
                    )
                  )}
                </section>

                {/* Content: Two columns */}
                <main className="mapas-expanded-content">
                  <div className="mapas-expanded-layout">
                    {/* LEFT: Title + Description */}
                    <article className="mapas-expanded-description">
                      <h1 className="mapas-expanded-title">{activePlace.name}</h1>

                      {activePlace.address && (
                        <div className="mapas-expanded-address">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <span>{activePlace.address}</span>
                        </div>
                      )}

                      {activePlace.subtitle && (
                        <p className="mapas-expanded-subtitle">{activePlace.subtitle}</p>
                      )}

                      {activePlace.description && (
                        <p className="mapas-expanded-desc">{activePlace.description}</p>
                      )}
                    </article>

                    {/* RIGHT: Info Card + Actions */}
                    <aside className="mapas-expanded-aside">
                      {/* Info Card */}
                      <div className="mapas-expanded-infocard">
                        {activePlace.costStatus && (
                          <div className="mapas-expanded-infocard-row">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                            <p><strong>Estado de Costo:</strong> {activePlace.costStatus}</p>
                          </div>
                        )}
                        {activePlace.hours && (
                          <div className="mapas-expanded-infocard-row">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                            <p><strong>Horario Recomendado:</strong> {activePlace.hours}</p>
                          </div>
                        )}
                        {activePlace.audience && (
                          <div className="mapas-expanded-infocard-row">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                              <circle cx="9" cy="7" r="4" />
                              <path d="M23 21v-2a4 4 0 00-3-3.87" />
                              <path d="M16 3.13a4 4 0 010 7.75" />
                            </svg>
                            <p><strong>Apto para:</strong> {activePlace.audience}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mapas-expanded-actions">
                        <button
                          type="button"
                          className="mapas-expanded-btn mapas-expanded-btn--primary"
                          onClick={() => { handleTraceRoute(); }}
                          disabled={routeStatus === "locating" || routeStatus === "routing"}
                        >
                          Cómo llego
                        </button>
                        {activePlace.videos?.length > 0 && (
                          <button
                            type="button"
                            className="mapas-expanded-btn mapas-expanded-btn--secondary"
                            onClick={() => {
                              setVideoPlayingId(0);
                              // Scroll to the hero
                              document.querySelector('.mapas-expanded-hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Ver video
                          </button>
                        )}
                      </div>

                      {/* YouTube videos grid (if more than one) */}
                      {activePlace.videos?.length > 1 && (
                        <div className="mapas-expanded-videogrid">
                          {activePlace.videos.map((url) => {
                            const embedUrl = getVideoEmbedUrl(url);
                            return embedUrl ? (
                              <div key={url} className={`mapas-expanded-videocard${isDriveVideo(url) ? ' mapas-expanded-videocard--portrait' : ''}`}>
                                <iframe
                                  src={embedUrl}
                                  title={`Video de ${activePlace.name}`}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </aside>
                  </div>
                </main>
              </div>
            </div>
          )}

          {/* Route Tracking Dock (floating overlay on the map) */}
          {isRouteTrackingOpen && currentNavigationPlan && (
            <section className="mapas-navigation-dock" aria-label="Vista de navegación">
              <div className="mapas-tracking-window">
                <div className="mapas-tracking-head">
                  <div>
                    <p className="mapas-tracking-kicker">Seguimiento en vivo</p>
                    <h3>{activePlace?.name}</h3>
                  </div>
                  <button type="button" className="mapas-tracking-close" onClick={() => { setIsRouteTrackingOpen(false); stopNavigationPlayback(); }} aria-label="Cerrar">×</button>
                </div>

                <div className="mapas-tracking-topbar">
                  <div className="mapas-tracking-status">
                    <span className="mapas-tracking-status-dot" />
                    <div>
                      <strong>{currentNavigationPhase}</strong>
                      <small>{routeMessage || "Seguimiento activo dentro del mapa"}</small>
                    </div>
                  </div>
                  <div className="mapas-tracking-speed">
                    <span>Velocidad</span>
                    <strong>{currentNavigationSpeed} km/h</strong>
                  </div>
                </div>

                <div className="mapas-tracking-maneuver">
                  <span>Siguiente maniobra</span>
                  <strong>{currentNavigationManeuver}</strong>
                </div>

                <div className="mapas-tracking-live">
                  <div>
                    <span>ETA</span>
                    <strong>{formatEta(currentNavigationRemainingSeconds)}</strong>
                  </div>
                  <div>
                    <span>Restante</span>
                    <strong>{formatDuration(currentNavigationRemainingSeconds)}</strong>
                  </div>
                  <div>
                    <span>Modo</span>
                    <strong>{currentNavigationPlan.note}</strong>
                  </div>
                </div>

                <div className="mapas-tracking-progress" aria-hidden="true">
                  <span style={{ width: `${navigationPreviewProgress}%` }} />
                </div>

                <p className="mapas-tracking-instruction">{routeMessage || getNavigationInstruction(navigationPreviewProgress / 100)}</p>

                <div className="mapas-tracking-foot">
                  <span>Ruta en vivo</span>
                  <button type="button" className="mapas-route-btn mapas-route-btn--secondary" onClick={() => startNavigationPlayback(currentNavigationPlan)}>
                    Reiniciar seguimiento
                  </button>
                </div>
              </div>
            </section>
          )}
        </section>

        {loadError && <p className="mapas-error">{loadError}</p>}
      </main>
    </div>
  );
}
