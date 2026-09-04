import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import TopBar from "./TopBar";
import NavMap from "./NavMap";
import { useMapLocations } from "./mapLocationsStore";
import MapLegend from "./mapas/MapLegend";
import RouteDetailsPanel from "./mapas/RouteDetailsPanel";
import RouteSelector from "./mapas/RouteSelector";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Mapas.css";
import "./mapas/mapas-ui.css";

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
// Time (ms) without interaction after which the site popup auto-hides
const POPUP_AUTO_HIDE_MS = 10000;



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
  const popupHideTimerRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("patrimonial");
  const [isRoutePanelOpen, setIsRoutePanelOpen] = useState(false);
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
  const voiceInitializedRef = useRef(false);
  const hasArrivedRef = useRef(false);
  const arrivalTimerRef = useRef(null);
  const deviceHeadingRef = useRef(0);
  const alertedStepsRef = useRef(new Set());
  const [proximityAlert, setProximityAlert] = useState(null);
  const rerouteThrottleRef = useRef(0); // timestamp of last re-route
  const routePlanRef = useRef(null); // ref to latest plan for GPS callback closure
  const [upcomingSteps, setUpcomingSteps] = useState([]);
  const [routeAlternatives, setRouteAlternatives] = useState([]); // alternative routes for current travel mode
  const [selectedAltIndex, setSelectedAltIndex] = useState(0); // which alternative is active
  const altRouteSourceRef = useRef(null); // source for alternative route lines
  const fetchRoutePlanRef = useRef(null); // ref to fetchRoutePlan to avoid TDZ issues
  
  // Robust speech synthesis helper that handles mobile quirks (iOS Safari, etc.)
  const speakInstruction = useCallback((text, { priority = false, rate = 0.9 } = {}) => {
    if (!isVoiceEnabled) return;
    // On iOS Safari, speech synthesis only works after a user gesture
    // and needs to be primed with a silent utterance first
    try {
      if (!window.speechSynthesis) {
        console.warn('SpeechSynthesis no disponible en este dispositivo');
        return;
      }
      // Cancel any ongoing speech for non-priority messages, or always cancel for priority
      if (priority) {
        window.speechSynthesis.cancel();
      }
      // iOS quirk: speech synthesis pauses after ~15s if not called again;
      // create a fresh utterance each time
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      // Select Spanish voice if available
      utterance.onstart = () => {
        voiceInitializedRef.current = true;
      };
      utterance.onerror = (e) => {
        console.warn('Speech error:', e.error);
      };
      window.speechSynthesis.speak(utterance);
      lastInstructionRef.current = text;
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  }, [isVoiceEnabled]);
  
  // Initialize speech synthesis — required on iOS to unlock speech API
  const initializeVoice = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis || voiceInitializedRef.current) return;
    try {
      // iOS requires a silent utterance to 'prime' the speech engine
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
      window.speechSynthesis.cancel();
      voiceInitializedRef.current = true;
    } catch { /* ignore */ }
  }, []);
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
  
  // Congestion colors for route traffic visualization
  const CONGESTION_COLORS = {
    unknown: '#888888',
    low: '#32CD32',
    moderate: '#FFD700',
    heavy: '#FF8C00',
    severe: '#D32F2F',
  };
  
  // Build a line-gradient paint expression from congestion segments
  const buildCongestionGradient = (coords, congestion) => {
    if (!congestion?.length || !coords?.length || coords.length < 2) return null;
    const totalSegments = congestion.length; // = coords.length - 1
    if (totalSegments < 1) return null;
    
    const stops = [];
    stops.push(0, CONGESTION_COLORS[congestion[0]] || CONGESTION_COLORS.unknown);
    
    for (let i = 1; i < totalSegments; i++) {
      const progress = i / totalSegments;
      const prevColor = CONGESTION_COLORS[congestion[i - 1]] || CONGESTION_COLORS.unknown;
      const currColor = CONGESTION_COLORS[congestion[i]] || CONGESTION_COLORS.unknown;
      // Sharp transition: end previous color at this progress, start next color at same progress
      stops.push(progress, prevColor);
      stops.push(progress, currColor);
    }
    
    // Final segment to end
    stops.push(1, CONGESTION_COLORS[congestion[totalSegments - 1]] || CONGESTION_COLORS.unknown);
    
    return ['interpolate', ['linear'], ['line-progress'], ...stops];
  };
  
  // Compute bearing between two [lng, lat] points (degrees from north)
  const computeBearing = (from, to) => {
    if (!from || !to) return undefined;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const toDeg = (rad) => (rad * 180) / Math.PI;
    const [lng1, lat1] = from;
    const [lng2, lat2] = to;
    const dLng = toRad(lng2 - lng1);
    const y = Math.sin(dLng) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
    const brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
  };



  const isMobileDevice = typeof navigator !== "undefined" && MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);

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

  // Clear popup auto-hide timer on unmount
  useEffect(() => () => {
    if (popupHideTimerRef.current) clearTimeout(popupHideTimerRef.current);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!MAPBOX_TOKEN) { setLoadError("Falta configurar VITE_MAPBOX_TOKEN en .env.local"); return undefined; }
    if (!MAPBOX_TOKEN.startsWith("pk.")) { setLoadError("VITE_MAPBOX_TOKEN debe ser público (pk.*)."); return undefined; }
    if (!mapContainerRef.current || mapRef.current) return undefined;

    mapContainerRef.current.innerHTML = "";
    mapboxgl.accessToken = MAPBOX_TOKEN;

    let map;
    let mapStyle = "mapbox://styles/mapbox/standard";
    let mapConfig = {
      basemap: {
        theme: "monochrome",
        lightPreset: "day",
        show3dObjects: false,
        showPedestrianRoads: true,
        showTransitLabels: false,
      },
    };

    try {
      map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        config: mapConfig,
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        pitch: MAP_PITCH,
        bearing: MAP_BEARING,
        attributionControl: true,
      });
    } catch {
      // Fallback to light style if standard fails
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
    }

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    map.on("load", () => {
      setIsMapReady(true);
    });
    map.on("error", (e) => {
      console.warn("Mapbox error:", e.error?.message || e);
      // Don't show error for style loading issues - map may still work
    });
    // Clicking on the map itself (not on a marker) hides the floating popup
    map.on("click", (e) => {
      // Only hide if click was on the map itself, not on a marker
      if (e.originalEvent?.target?.closest('.mapas-custom-marker')) return;
      hidePlacePopup();
    });

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

      const openPlace = (event) => {
        // Stop propagation to prevent map click from hiding popup immediately
        if (event) event.stopPropagation();
        setSelectedRouteId(place.routeId);
        setSelectedPlaceId(place.id);
        setActivePlace(place);
        setIsNavigationOpen(false);
        setIsPlacePopupOpen(true);
        setIsPlacePopupCollapsed(false);
        setPlacePopupPosition({ x: 24, y: 96 });
        schedulePopupAutoHide();
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
      // Also prevent pointerdown from reaching map to avoid map click interference
      markerElement.addEventListener("pointerdown", (e) => e.stopPropagation());

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

  // Filter markers by search, route, popup selection, or navigation mode
  useEffect(() => {
    const normalizedQuery = normalizeText(searchText.trim());
    const isNavMode = isNavigating;
    const isPopupActive = isPlacePopupOpen || isPlacePopupCollapsed;
    const showAll = selectedRouteId === "all";
    markersRef.current.forEach(({ place, markerElement }) => {
      let shouldShow = false;
      
      if (isNavMode) {
        // Navigation mode: hide ALL normal markers
        shouldShow = false;
      } else if (showAll) {
        // Show all routes mode: always show all markers
        shouldShow = true;
      } else if (isPopupActive && selectedPlaceId) {
        // Popup active (not showAll): show only the selected marker
        shouldShow = place.id === selectedPlaceId;
      } else if (normalizedQuery.length > 0) {
        // Search mode: show ALL matching markers across all routes
        shouldShow =
          normalizeText(place.name).includes(normalizedQuery) ||
          normalizeText(place.subtitle).includes(normalizedQuery);
      } else {
        // Normal mode: only show markers from the selected route
        shouldShow = place.routeId === selectedRouteId;
      }
      
      // Apply visibility with smooth transition
      if (shouldShow) {
        markerElement.style.opacity = "1";
        markerElement.style.transform = markerElement.style.transform || "";
        markerElement.style.display = "block";
      } else {
        markerElement.style.opacity = "0";
        // Delay display:none to allow fade-out animation
        setTimeout(() => {
          if (markerElement.style.opacity === "0") {
            markerElement.style.display = "none";
          }
        }, 300);
      }
    });
  }, [searchText, selectedRouteId, view, isMobileDevice, isPlacePopupOpen, isPlacePopupCollapsed, selectedPlaceId]);

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
    schedulePopupAutoHide();
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

  const hidePlacePopup = useCallback(() => {
    if (popupHideTimerRef.current) {
      clearTimeout(popupHideTimerRef.current);
      popupHideTimerRef.current = null;
    }
    setIsPlacePopupOpen(false);
    setIsPlacePopupCollapsed(false);
  }, []);

  // Auto-hide the popup after a period without interaction (not being used)
  const schedulePopupAutoHide = useCallback((delay = POPUP_AUTO_HIDE_MS) => {
    if (popupHideTimerRef.current) clearTimeout(popupHideTimerRef.current);
    popupHideTimerRef.current = setTimeout(() => {
      popupHideTimerRef.current = null;
      hidePlacePopup();
    }, delay);
  }, [hidePlacePopup]);

  const collapsePlacePopup = () => {
    // User intentionally minimized: cancel auto-hide so the chip stays
    if (popupHideTimerRef.current) {
      clearTimeout(popupHideTimerRef.current);
      popupHideTimerRef.current = null;
    }
    setIsPlacePopupOpen(false);
    setIsPlacePopupCollapsed(true);
  };

  const expandPlacePopup = () => {
    setIsPlacePopupCollapsed(false);
    setIsPlacePopupOpen(true);
    schedulePopupAutoHide();
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
    // Reset map pitch back to 2D view
    if (mapRef.current) {
      try { mapRef.current.easeTo({ pitch: 0, bearing: 0, duration: 600, essential: true }); } catch {}
    }
    // Clear voice reference so next navigation speaks first instruction again
    lastInstructionRef.current = '';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    // Stop device orientation listener
    window.removeEventListener('deviceorientation', handleDeviceOrientation);
    // Clear persisted navigation (sessionStorage)
    try { sessionStorage.removeItem('navmap_active'); } catch { /* ignore */ }
  }, []);

  // Check if user is off route and trigger re-route if needed
  const checkOffRouteAndReroute = useCallback(async (userLngLat, plan, destination) => {
    if (!plan?.coordinates?.length || !destination) return;
    
    const coords = plan.coordinates;
    // Find minimum distance from user to any point on route
    let minDist = Infinity;
    for (const coord of coords) {
      const d = haversineDistance(userLngLat, coord);
      if (d < minDist) minDist = d;
    }
    
    // If user is > 50m from route, and we haven't re-routed in last 15s, re-route
    const now = Date.now();
    if (minDist > 50 && now - rerouteThrottleRef.current > 15000) {
      rerouteThrottleRef.current = now;
      setRouteMessage('Recalculando ruta...');
      
      try {
        const fetchFn = fetchRoutePlanRef.current;
        if (!fetchFn) return;
        const plans = await fetchFn(travelMode, userLngLat, destination);
        const newPlan = plans?.[0]; // fetchRoutePlan now returns an array of alternatives
        if (newPlan?.coordinates?.length) {
          // Update the route plan for this mode
          setRoutePlans((prev) => ({ ...prev, [travelMode]: newPlan }));
          // Update alternatives (skip the selected one)
          setRouteAlternatives(plans.slice(1));
          setSelectedAltIndex(0);
          // Keep user marker on map during re-route (avoid flicker)
          drawRouteAnimation(newPlan.coordinates, true, newPlan.congestion);
          drawAlternativeRoutes(plans.slice(1), newPlan.coordinates);
          // Reset the current plan ref for the GPS handler closure
          routePlanRef.current = newPlan;
          // Reset alerted steps for the new route
          alertedStepsRef.current = new Set();
          setRouteMessage('Ruta recalculada. Continuando navegación.');
          setTimeout(() => {
            setRouteMessage('');
          }, 3000);
        }
      } catch (e) {
        console.warn('Re-route failed:', e);
        setRouteMessage('No se pudo recalcular. Continuando con ruta actual.');
        setTimeout(() => {
          setRouteMessage('');
        }, 3000);
      }
    }
  }, [travelMode]);

  // Select a specific route alternative (0 = primary, 1+ = alternatives)
  const selectRouteAlternative = useCallback((index) => {
    setSelectedAltIndex(index);
    
    let selectedPlan;
    if (index === 0) {
      selectedPlan = routePlans[travelMode];
    } else {
      const altIdx = index - 1;
      selectedPlan = routeAlternatives[altIdx];
    }
    
    if (selectedPlan?.coordinates) {
      // Update the route plan for this mode to the selected one
      setRoutePlans((prev) => ({ ...prev, [travelMode]: selectedPlan }));
      routePlanRef.current = selectedPlan;
      drawRouteAnimation(selectedPlan.coordinates, true, selectedPlan.congestion); // keep user marker
      // Redraw alternatives excluding the newly selected one
      const otherAlts = routeAlternatives.filter((_, i) => i !== index - 1);
      drawAlternativeRoutes(otherAlts, selectedPlan.coordinates);
    }
  }, [travelMode, routePlans, routeAlternatives]);

  const startRealNavigation = useCallback(() => {
    if (!routePlan || !mapRef.current) return;
    
    // Initialize voice synthesis for mobile (iOS requirement)
    initializeVoice();
    
    const plan = routePlan;
    const coords = plan.coordinates;
    if (!coords?.length) return;

    // Store current plan in ref so GPS callback always has latest plan
    routePlanRef.current = plan;

    // Add destination marker
    addDestinationMarker(activePlace);

    // Start watching position with high accuracy
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed: gpsSpeed, accuracy, heading: gpsHeading } = position.coords;
        const userLngLat = [longitude, latitude];
        const currentPlan = routePlanRef.current;
        const currentCoords = currentPlan?.coordinates || coords;

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
        const totalPoints = currentCoords.length;
        let minDistSq = Infinity;
        let closestIdx = 0;
        currentCoords.forEach((coord, idx) => {
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

        // Off-route detection: if closest point is > 50m away, check for re-route
        const closestDistM = Math.sqrt(minDistSq) * 111320; // rough meters
        if (closestDistM > 50 && activePlace?.coordinates && !hasArrivedRef.current) {
          checkOffRouteAndReroute(userLngLat, currentPlan, activePlace.coordinates);
        }

        // Find current instruction step based on closest point
        if (currentPlan?.steps?.length && activePlace) {
          const routeLen = currentPlan.steps.length;
          const stepIdx = Math.min(routeLen - 1, Math.floor((newProgress / 100) * routeLen));
          const step = currentPlan.steps[stepIdx];
          const newText = step.instruction || "Sigue recto";
          setRealInstruction({
            text: newText,
            icon: step.maneuver || "straight",
            distance: step.distance || 0,
          });
          
          // Update upcoming steps (next 3) for the turn-by-turn list
          const upcoming = [];
          for (let i = 1; i <= 3; i++) {
            const sIdx = Math.min(routeLen - 1, stepIdx + i);
            const s = currentPlan.steps[sIdx];
            if (s && sIdx !== stepIdx) {
              upcoming.push({
                instruction: s.instruction || '',
                maneuver: s.maneuver || 'straight',
                distance: s.distance || 0,
              });
            }
          }
          setUpcomingSteps(upcoming);
          
          // Speak instruction via SpeechSynthesis when it changes
          if (isVoiceEnabled && newText !== lastInstructionRef.current) {
            speakInstruction(newText, { priority: true, rate: 0.9 });
            lastInstructionRef.current = newText;
          }
        }

        // Proximity alert: detect distance to next step (< 100m)
        if (currentPlan?.steps?.length && activePlace?.coordinates && !hasArrivedRef.current) {
          const nextStepIdx = Math.min(currentPlan.steps.length - 1, Math.floor((newProgress / 100) * currentPlan.steps.length) + 1);
          const nextStep = currentPlan.steps[nextStepIdx];
          if (nextStep && nextStep.location && !alertedStepsRef.current.has(nextStepIdx)) {
            const distToNext = haversineDistance(userLngLat, [nextStep.location[0], nextStep.location[1]]);
            if (distToNext < 100) {
              alertedStepsRef.current.add(nextStepIdx);
              const alertText = nextStep.instruction || 'Giro próximo';
              setProximityAlert({ text: alertText, distance: Math.round(distToNext), icon: nextStep.maneuver || 'straight', stepIdx: nextStepIdx });
              // Speak the alert with emphasis
              speakInstruction(`Precaución, ${alertText}`, { priority: true, rate: 0.85 });
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
            speakInstruction(`Has llegado a ${activePlace.name}`, { priority: true, rate: 0.85 });
            // Auto-stop navigation after 4 seconds
            arrivalTimerRef.current = setTimeout(() => {
              stopRealNavigation();
              goBackToList();
            }, 4000);
          }
        }

        // 3D Waze-style follow: pitch 45°, bearing aligned to travel direction
        if (accuracy < 100 && mapRef.current && !hasArrivedRef.current) {
          const currentZoom = mapRef.current.getZoom();
          const travelDirection = (gpsHeading !== null && gpsHeading >= 0) ? gpsHeading : computeBearing(lastPositionRef.current, [longitude, latitude]);
          mapRef.current.easeTo({
            center: userLngLat,
            zoom: Math.max(currentZoom, 15.2),
            pitch: Math.min(55, 25 + currentSpeed * 0.3), // pitch increases with speed
            bearing: travelDirection ?? undefined,
            duration: 600,
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
  }, [routePlan, activePlace, checkOffRouteAndReroute, initializeVoice, speakInstruction]);

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
        // Calculate bearing for this leg of the route for 3D preview
        const currentIdx = routeIndex;
        const nextIdx = Math.min(coordinates.length - 1, currentIdx + 3);
        const previewBearing = computeBearing(coordinates[currentIdx], coordinates[nextIdx]) || undefined;
        mapRef.current.easeTo({
          center: currentPoint,
          zoom: 15.8,
          pitch: 45,
          bearing: previewBearing,
          duration: 400,
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

  // Stable reference for fetchRoutePlan — returns array of route alternatives
  const fetchRoutePlan = useCallback(async (mode, origin, destination) => {
    const profile = mode === "walking" ? "walking" : "driving";
    // Request up to 3 alternatives with speed + congestion annotations from Mapbox Directions API
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&steps=true&language=es&alternatives=true&annotations=maxspeed,congestion&access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) throw new Error(`No route for ${mode}`);
    
    // Map each route to our plan format
    const plans = data.routes.map((route, idx) => {
      const steps = route.legs?.[0]?.steps?.map((s) => ({
        instruction: s.maneuver?.instruction || s.maneuver?.type || "Sigue recto",
        maneuver: s.maneuver?.modifier || s.maneuver?.type || "straight",
        distance: s.distance || 0,
        duration: s.duration || 0,
        location: s.maneuver?.location || null,
      })) || [];
      
      // Extract speed limit from route annotations (if available)
      let speedLimit = 0;
      try {
        const speeds = route.legs?.[0]?.annotation?.maxspeed;
        if (speeds?.length > 0) {
          // Find the most common speed limit along the route
          const validSpeeds = speeds
            .map(s => s.speed)
            .filter(s => s && s > 0 && s < 200);
          if (validSpeeds.length > 0) {
            // Use the most common (mode) speed limit for the overall route
            const freq = {};
            let maxFreq = 0;
            let modeSpeed = 30;
            validSpeeds.forEach(v => {
              freq[v] = (freq[v] || 0) + 1;
              if (freq[v] > maxFreq) { maxFreq = freq[v]; modeSpeed = v; }
            });
            speedLimit = Math.round(modeSpeed);
          }
        }
      } catch { /* speed limit data not available */ }
      
      // Extract congestion per segment from route annotations
      let congestionSegments = [];
      try {
        const rawCongestion = route.legs?.[0]?.annotation?.congestion;
        if (rawCongestion?.length > 0) {
          congestionSegments = rawCongestion;
        }
      } catch { /* congestion data not available */ }
      
      // Determine worst congestion level for display badge
      const congestionLevels = ['unknown', 'low', 'moderate', 'heavy', 'severe'];
      let worstCongestion = 'unknown';
      if (congestionSegments.length > 0) {
        for (const c of congestionSegments) {
          const idx = congestionLevels.indexOf(c);
          if (idx > congestionLevels.indexOf(worstCongestion)) worstCongestion = c;
        }
      }
      
      return {
        mode,
        coordinates: route.geometry.coordinates,
        duration: route.duration,
        distance: route.distance,
        steps,
        speedLimit,
        congestion: congestionSegments,
        worstCongestion,
        note: mode === "walking" ? "Ruta caminando" : "Ruta en carro",
        alternativeIndex: idx,
        description: idx === 0 ? 'Recomendada' : idx === 1 ? 'Alternativa (menos tránsito)' : 'Alternativa (más corta)',
      };
    });
    return plans;
  }, []);
  // Sync ref with latest fetchRoutePlan (avoids TDZ since checkOffRouteAndReroute is defined earlier)
  fetchRoutePlanRef.current = fetchRoutePlan;

  const drawRouteForPlan = (plan) => {
    if (plan?.coordinates) drawRouteAnimation(plan.coordinates, false, plan.congestion);
  };

  const loadNavigationPlans = async (origin, destination) => {
    setIsRouteLoading(true);
    setRouteMessage("Consultando tiempos de ruta...");
    stopNavigationPlayback();

    try {
      const [walkingPlans, carPlans] = await Promise.all([
        fetchRoutePlan("walking", origin, destination),
        fetchRoutePlan("car", origin, destination),
      ]);

      // Take first route as primary for each mode, store alternatives separately
      const transitPrimary = {
        mode: "transit",
        coordinates: carPlans[0].coordinates,
        duration: Math.round(carPlans[0].duration * 1.25),
        distance: carPlans[0].distance,
        steps: carPlans[0].steps,
        speedLimit: carPlans[0].speedLimit,
        note: "Estimado para transporte publico",
      };

      const nextPlans = {
        walking: walkingPlans[0],
        car: carPlans[0],
        transit: transitPrimary,
      };
      
      // Store alternatives for current travel mode
      const modeKey = travelMode === 'transit' ? 'car' : travelMode;
      const altPlans = modeKey === 'walking' ? walkingPlans.slice(1) : carPlans.slice(1);
      
      setRoutePlans(nextPlans);
      setRouteAlternatives(altPlans);
      setSelectedAltIndex(0);
      setTravelMode((prev) => (nextPlans[prev] ? prev : "walking"));
      setRouteStatus("success");
      setRouteMessage("Selecciona un modo y luego inicia navegación.");
      setIsNavigationOpen(true);
      setView("navigation");
      
      const defaultPlan = nextPlans[travelMode] || walkingPlans[0];
      drawRouteForPlan(defaultPlan);
      // Draw alternative routes in muted colors
      drawAlternativeRoutes(altPlans, defaultPlan.coordinates);

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

  const clearRouteLayer = (keepUserMarker = false) => {
    if (!mapRef.current) return;
    if (routeAnimationRef.current) { cancelAnimationFrame(routeAnimationRef.current); routeAnimationRef.current = null; }
    if (!keepUserMarker && userMarkerRef.current) { userMarkerRef.current.remove(); userMarkerRef.current = null; }
    if (mapRef.current.getLayer("capa-ruta")) mapRef.current.removeLayer("capa-ruta");
    if (mapRef.current.getLayer("capa-ruta-base")) mapRef.current.removeLayer("capa-ruta-base");
    // Clean up congestion layers
    ['low', 'moderate', 'heavy', 'severe', 'unknown'].forEach((level) => {
      if (mapRef.current.getLayer(`capa-ruta-${level}`)) mapRef.current.removeLayer(`capa-ruta-${level}`);
    });
    if (mapRef.current.getSource("ruta-activa")) mapRef.current.removeSource("ruta-activa");
    routeSourceRef.current = null;
    clearAlternativeRoutes();
  };
  
  // Draw alternative route lines in muted colors (non-selected options)
  const clearAlternativeRoutes = () => {
    if (!mapRef.current) return;
    ['alt-0', 'alt-1'].forEach((id) => {
      if (mapRef.current.getLayer(`capa-alt-${id}`)) mapRef.current.removeLayer(`capa-alt-${id}`);
      if (mapRef.current.getSource(`ruta-alt-${id}`)) mapRef.current.removeSource(`ruta-alt-${id}`);
    });
    altRouteSourceRef.current = null;
  };
  
  const drawAlternativeRoutes = (altPlans, activeCoords) => {
    if (!mapRef.current || !altPlans?.length) return;
    clearAlternativeRoutes();
    // Draw each alternative in a muted gray-blue color with dashes
    altPlans.forEach((plan, idx) => {
      if (!plan?.coordinates?.length) return;
      // Skip if coordinates match the active route exactly
      if (JSON.stringify(plan.coordinates) === JSON.stringify(activeCoords)) return;
      
      const sourceId = `ruta-alt-${idx}`;
      const layerId = `capa-alt-${idx}`;
      
      mapRef.current.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: plan.coordinates },
        },
      });
      
      // Use congestion gradient for alternatives too if available
      const hasAltCongestion = plan.congestion?.length > 0 && plan.congestion.length === plan.coordinates.length - 1;
      const altGradient = hasAltCongestion ? buildCongestionGradient(plan.coordinates, plan.congestion) : null;
      
      const paintProps = altGradient
        ? {
            'line-gradient': altGradient,
            'line-width': 3,
            'line-opacity': 0.65,
            'line-dasharray': [3, 3],
          }
        : {
            'line-color': idx === 0 ? '#7890B0' : '#8BA87A',
            'line-width': 3,
            'line-opacity': 0.6,
            'line-dasharray': [3, 3],
          };
      
      const sourceConfig = hasAltCongestion
        ? { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: plan.coordinates } }, lineMetrics: true }
        : { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: plan.coordinates } } };
      
      mapRef.current.addSource(sourceId, sourceConfig);
      
      mapRef.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: paintProps,
      });
    });
  };

  const drawRouteAnimation = (routeCoordinates, keepUserMarker = false, congestion = null) => {
    if (!mapRef.current) return;
    clearRouteLayer(keepUserMarker);

    const hasCongestion = congestion?.length > 0 && congestion.length === routeCoordinates.length - 1;

    const geojson = { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } };

    mapRef.current.addSource("ruta-activa", {
      type: "geojson",
      data: geojson,
      lineMetrics: hasCongestion, // required for line-gradient
    });
    routeSourceRef.current = geojson;

    if (hasCongestion) {
      // Use congestion-colored gradient on the main route line
      const gradientPaint = buildCongestionGradient(routeCoordinates, congestion);
      mapRef.current.addLayer({
        id: "capa-ruta-base",
        type: "line",
        source: "ruta-activa",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          'line-gradient': gradientPaint,
          'line-width': 14,
          'line-opacity': 0.35,
          'line-blur': 4,
        },
      });
      mapRef.current.addLayer({
        id: "capa-ruta",
        type: "line",
        source: "ruta-activa",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          'line-gradient': gradientPaint,
          'line-width': 5,
          'line-opacity': 0.98,
        },
      });
    } else {
      // Fallback: orange dotted line
      mapRef.current.addLayer({
        id: "capa-ruta-base",
        type: "line",
        source: "ruta-activa",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#E87A2A", "line-width": 14, "line-opacity": 0.2, "line-blur": 4 },
      });
      mapRef.current.addLayer({
        id: "capa-ruta",
        type: "line",
        source: "ruta-activa",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#E87A2A", "line-width": 5, "line-opacity": 0.95, "line-dasharray": [2, 2] },
      });
    }

    // Immediately set all coordinates so the route is visible right away
    routeSourceRef.current.geometry.coordinates = routeCoordinates;
    if (mapRef.current.getSource("ruta-activa")) {
      mapRef.current.getSource("ruta-activa").setData(routeSourceRef.current);
    }

    // Animate the line opacity for a smooth visual entrance
    let opacity = 0;
    const animateOpacity = () => {
      if (!mapRef.current) return;
      opacity = Math.min(opacity + 0.05, 1);
      try {
        if (mapRef.current.getLayer("capa-ruta")) {
          mapRef.current.setPaintProperty("capa-ruta", "line-opacity", hasCongestion ? 0.98 : 0.95);
        }
        if (mapRef.current.getLayer("capa-ruta-base")) {
          mapRef.current.setPaintProperty("capa-ruta-base", "line-opacity", hasCongestion ? 0.35 : 0.2);
        }
      } catch { /* ignore paint errors */ }
      if (opacity < 1) {
        routeAnimationRef.current = requestAnimationFrame(animateOpacity);
      }
    };
    routeAnimationRef.current = requestAnimationFrame(animateOpacity);
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
      border: 3px solid #E87A2A;
      background: url('${place.image}') center/cover no-repeat;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 4px rgba(232,122,42,0.25);
      cursor: pointer;
      display: block;
    `;
    // Fallback icon if no image
    if (!place.image) {
      el.style.background = "#E87A2A";
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



  return (
    <div className="mapas-page">
      <TopBar />

      <main className="mapas-main">
        <section id="inicio" className="mapas-stage" aria-label="Mapa interactivo">
          <div ref={mapContainerRef} id="mapas" className="mapas-container" />

          {/* New UI Components — hidden when detail panels are open */}
          {!isRoutePanelOpen && !isNavigationOpen && !isPlacePopupOpen && view !== "expanded" && (
            <MapLegend 
              isVisible={true} 
              position={isPlacePopupCollapsed ? "bottom-left" : "top-left"} 
            />
          )}
          {!isRoutePanelOpen && !isNavigationOpen && !isPlacePopupOpen && view !== "expanded" && (
            <RouteSelector
              activeRouteId={selectedRouteId}
              onRouteSelect={(routeId) => {
                setSelectedRouteId(routeId);
                // Only open the route panel if a specific route is selected (not "all")
                if (routeId !== "all") {
                  setIsRoutePanelOpen(true);
                } else {
                  // Close any open panels when "Ver todas" is selected
                  setIsRoutePanelOpen(false);
                  setIsPlacePopupOpen(false);
                  setIsPlacePopupCollapsed(false);
                }
                hidePlacePopup();
              }}
              locations={locations}
            />
          )}
          {isRoutePanelOpen && (
            <RouteDetailsPanel
              route={{ id: selectedRouteId, name: locations.find(l => l.routeId === selectedRouteId)?.categoryLabel || selectedRouteId }}
              locations={locations}
              selectedPlaceId={selectedPlaceId}
              onClose={() => setIsRoutePanelOpen(false)}
              onSelectPlace={(place) => {
                setIsRoutePanelOpen(false);
                handleSelectPlace(place);
              }}
            />
          )}

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
                onPointerDown={() => schedulePopupAutoHide()}
                onClick={() => schedulePopupAutoHide()}
                onKeyDown={() => schedulePopupAutoHide()}
              >
                <button type="button" className="mapas-floating-popup__drag" onPointerDown={handlePopupPointerDown} aria-label="Mover popup">
                  <span /><span /><span />
                </button>
                <div className="mapas-floating-popup__image" style={{
                  backgroundImage: imgErrors[activePlace.id]
                    ? `url('data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="124" viewBox="0 0 200 124"><rect width="200" height="124" fill="#eaddcb"/><text x="100" y="62" text-anchor="middle" dominant-baseline="middle" font-family="Heritage Sans, sans-serif" font-size="16" fill="#8a7a6a">SIN ILUSTRACIÓN</text></svg>')}'`
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
                <div className="mapas-floating-popup-minimized__info">
                  <span className="mapas-floating-popup-minimized__badge">{activePlace.categoryLabel}</span>
                  <strong>{activePlace.name}</strong>
                  <small>Toca para ver detalles</small>
                </div>
                <div className="mapas-floating-popup-minimized__expand-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                </div>
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
                speedLimit={currentNavigationPlan?.speedLimit || 0}
                worstCongestion={currentNavigationPlan?.worstCongestion || null}
                instruction={hasArrivedRef.current ? `¡Llegaste a ${activePlace.name}!` : realInstruction.text}
                instructionIcon={hasArrivedRef.current ? 'arrive' : realInstruction.icon}
                instructionDistance={realInstruction.distance}
                travelMode={travelMode}
                isVoiceEnabled={isVoiceEnabled}
                heading={deviceHeadingRef.current}
                hasArrived={hasArrivedRef.current}
                proximityAlert={proximityAlert}
                upcomingSteps={upcomingSteps}
                isOffRoute={routeStatus === 'rerouting'}
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
                        {/* Alternative route selector */}
                        {routeAlternatives.length > 0 && (
                          <div className="mapas-nav-alt-routes">
                            <span className="mapas-nav-alt-label">Rutas disponibles</span>
                            <div className="mapas-nav-alt-list">
                              <button
                                type="button"
                                className={`mapas-nav-alt-item${selectedAltIndex === 0 ? ' active' : ''}`}
                                onClick={() => selectRouteAlternative(0)}
                              >
                                <span className="mapas-nav-alt-badge mapas-nav-alt-badge--green" />
                                <span className="mapas-nav-alt-info">
                                  <strong>Recomendada</strong>
                                  <small>{formatDuration(routePlan.duration)} &middot; {formatDistance(routePlan.distance)}</small>
                                </span>
                              </button>
                              {routeAlternatives.map((alt, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`mapas-nav-alt-item${selectedAltIndex === idx + 1 ? ' active' : ''}`}
                                  onClick={() => selectRouteAlternative(idx + 1)}
                                >
                                  <span className={`mapas-nav-alt-badge mapas-nav-alt-badge--${idx === 0 ? 'blue' : 'sage'}`} />
                                  <span className="mapas-nav-alt-info">
                                    <strong>{alt.description || `Alternativa ${idx + 1}`}</strong>
                                    <small>{formatDuration(alt.duration)} &middot; {formatDistance(alt.distance)}</small>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        <button
                          type="button"
                          className="mapas-nav-panel__gps"
                          onClick={() => {
                            // Apply 3D mode when starting navigation
                            if (mapRef.current) {
                              mapRef.current.easeTo({ pitch: 50, duration: 800, essential: true });
                            }
                            startRealNavigation();
                          }}
                          disabled={!routePlan}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="12,2 8,10 12,8 16,10" />
                          </svg>
                          Iniciar navegaci&oacute;n 3D
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
