import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import TopBar from "./TopBar";
import { getRouteCounts, useMapLocations } from "./mapLocationsStore";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Mapas.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_CENTER = [-73.2435, 10.4631];
const MAP_ZOOM = 14.2;
const MAP_PITCH = 0;
const MAP_BEARING = 0;
const MOBILE_USER_AGENT_REGEX = /Android|iPhone|iPad|iPod/i;

// Warm pastel sand background for the entire map
const MAP_BACKGROUND = "#f5ead0";

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
  const locations = useMapLocations();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const routeSourceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeAnimationRef = useRef(null);
  const navigationAnimationRef = useRef(null);
  const navigationTimerRef = useRef(null);
  const popupDragRef = useRef(null);

  const [searchText, setSearchText] = useState("");
  const [selectedRouteId, setSelectedRouteId] = useState("patrimonial");
  const [isRouteExpanded, setIsRouteExpanded] = useState(true);
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
  const [locationPermissionState, setLocationPermissionState] = useState("idle");
  const [locationPermissionMessage, setLocationPermissionMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [videoPlayingId, setVideoPlayingId] = useState(null); // index of video being played in hero
  const [imgErrors, setImgErrors] = useState({}); // track image load errors
  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
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

  const filteredPlaces = useMemo(() => {
    const routeFilter = selectedRouteId;
    const normalizedQuery = normalizeText(searchText.trim());

    return locations.filter((place) => {
      const routeMatches = place.routeId === routeFilter;
      const searchMatches =
        normalizedQuery.length === 0 ||
        normalizeText(place.name).includes(normalizedQuery) ||
        normalizeText(place.subtitle).includes(normalizedQuery);

      return routeMatches && searchMatches;
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
      markerDot.className = "mapas-custom-marker__dot";
      markerElement.appendChild(markerDot);

      const openPlace = () => {
        setSelectedRouteId(place.routeId);
        setSelectedPlaceId(place.id);
        setActivePlace(place);
        setIsRouteExpanded(true);
        setIsNavigationOpen(false);
        setIsPlacePopupOpen(true);
        setIsPlacePopupCollapsed(false);
        setPlacePopupPosition({ x: 24, y: 96 });
        setRoutePlans({});
        setRouteOrigin(null);
        setView("compact");
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

  // Filter markers by search and route
  useEffect(() => {
    const normalizedQuery = normalizeText(searchText.trim());
    markersRef.current.forEach(({ place, markerElement }) => {
      const routeMatches = place.routeId === selectedRouteId;
      const searchMatches =
        normalizedQuery.length === 0 ||
        normalizeText(place.name).includes(normalizedQuery) ||
        normalizeText(place.subtitle).includes(normalizedQuery);
      markerElement.style.display = routeMatches && searchMatches ? "block" : "none";
    });
  }, [searchText, selectedRouteId]);

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

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
    setActivePlace(place);
    setIsPlacePopupOpen(true);
    setIsPlacePopupCollapsed(false);
    setPlacePopupPosition({ x: 24, y: 96 });
    setIsNavigationOpen(false);
    setRoutePlans({});
    setRouteOrigin(null);
    setRouteStatus("idle");
    setRouteMessage("");
    setView("compact");
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

  const currentNavigationPlan = routePlans[travelMode];
  const currentNavigationRemainingSeconds = Number.isFinite(currentNavigationPlan?.duration)
    ? Math.max(0, Math.round(currentNavigationPlan.duration - navigationElapsedSeconds))
    : Number.NaN;

  const currentNavigationProgress = Math.max(0, Math.min(100, navigationPreviewProgress));
  const currentNavigationPhase = currentNavigationProgress < 18 ? "Salida" : currentNavigationProgress < 55 ? "Ruta" : currentNavigationProgress < 85 ? "Enfoque" : "Arribo";
  const currentNavigationSpeed =
    travelMode === "walking" ? 5 + Math.round((currentNavigationProgress % 4) / 2) : travelMode === "car" ? 34 + Math.round((currentNavigationProgress % 7) / 2) : 21 + Math.round((currentNavigationProgress % 5) / 2);
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

  const fetchRoutePlan = async (mode, origin, destination) => {
    const profile = mode === "walking" ? "walking" : "driving";
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
    );
    const data = await response.json();
    if (!data.routes || data.routes.length === 0) throw new Error(`No route for ${mode}`);
    const route = data.routes[0];
    return {
      mode,
      coordinates: route.geometry.coordinates,
      duration: route.duration,
      distance: route.distance,
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

  const handleTraceRoute = async () => {
    if (!activePlace || !mapRef.current) return;
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

  // Apply route colors when selected route changes
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;
    applyRouteColors(mapRef.current, selectedRouteId);
  }, [selectedRouteId, isMapReady, applyRouteColors]);

  return (
    <div className="mapas-page">
      <TopBar activeSection="mapas" isAuthenticated user={{ name: "Usuario Valido", initials: "UV" }} onSectionChange={() => {}} />

      <main className="mapas-main">
        <section id="inicio" className="mapas-stage" aria-label="Mapa interactivo">
          <div ref={mapContainerRef} id="mapas" className="mapas-container" />

          <div className="mapas-ui-layer">
            {/* Top: Search */}
            <div className="mapas-ui-top">
              <div className="mapas-ui-top-stack">
                <div className="mapas-ui-card mapas-search-box">
                  <span className="mapas-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Buscar sitios en la ruta activa..."
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

            {/* Side Panel: List / Navigation */}
            <div id="galeria" className="mapas-ui-middle">
              <aside className="mapas-side-panel" aria-label="Panel de rutas">

                {/* Route selector + places list (always visible, with compact detail) */}
                <article className="mapas-main-card mapas-ui-card">
                  <button
                    type="button"
                    className="mapas-main-card-header"
                    onClick={() => setIsRouteExpanded((v) => !v)}
                  >
                    <div>
                      <p className="mapas-main-card-title">
                        {routeStats.find((r) => r.id === selectedRouteId)?.name ?? "Ruta Patrimonial"}
                      </p>
                      <p className="mapas-main-card-count">
                        {routeStats.find((r) => r.id === selectedRouteId)?.count ?? 0} sitios
                      </p>
                    </div>
                    <span className={`mapas-chevron${isRouteExpanded ? " expanded" : ""}`}>v</span>
                  </button>

                  {isRouteExpanded && (
                    <div className="mapas-main-card-body">
                      <div className="mapas-places-list">
                        {filteredPlaces.length > 0 ? (
                          filteredPlaces.map((place) => (
                            <button
                              type="button"
                              key={place.id}
                              className={`mapas-place-item${selectedPlaceId === place.id ? " active" : ""}`}
                              onClick={() => handleSelectPlace(place)}
                            >
                              <span className="mapas-place-dot" />
                              <span>{place.name}</span>
                            </button>
                          ))
                        ) : (
                          <p className="mapas-empty-state">No hay lugares que coincidan con la búsqueda.</p>
                        )}
                      </div>

                      {/* Compact place details */}
                      {view === "compact" && activePlace && (
                        <div className="mapas-compact-detail">
                          <div className="mapas-compact-detail-top">
                            <div className="mapas-compact-detail-thumb">
                              {imgErrors[activePlace.id] ? (
                                <div className="mapas-img-placeholder">SIN ILUSTRACIÓN</div>
                              ) : (
                                <img
                                  src={activePlace.image}
                                  alt={activePlace.name}
                                  onError={() => handleImgError(activePlace.id)}
                                  style={{ objectPosition: activePlace.imagePosition || "center" }}
                                />
                              )}
                            </div>
                            <div className="mapas-compact-detail-info">
                              <span className="mapas-compact-detail-badge">{activePlace.categoryLabel}</span>
                              <strong>{activePlace.name}</strong>
                              {activePlace.subtitle && <small>{activePlace.subtitle}</small>}
                            </div>
                            <button type="button" className="mapas-compact-detail-close" onClick={goBackToList}>×</button>
                          </div>
                          {activePlace.address && (
                            <div className="mapas-compact-detail-row">
                              <span className="material-symbols-outlined">location_on</span>
                              <span>{activePlace.address}</span>
                            </div>
                          )}
                          <div className="mapas-compact-detail-actions">
                            <button
                              type="button"
                              className="mapas-route-btn mapas-route-btn--compact"
                              onClick={() => { setView("expanded"); }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_full</span>
                              Ver detalles
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>

                {/* VIEW: NAVIGATION - compact like route cards */}
                {view === "navigation" && activePlace && (
                  <div className="mapas-ui-card" style={{
                    marginTop: 2,
                    padding: 0,
                    overflow: "hidden",
                  }}>
                    {/* Compact header row */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "#eaddcb",
                      padding: "6px 10px",
                    }}>
                      <span style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: 13,
                        letterSpacing: "0.04em",
                        color: "var(--mapas-green)",
                      }}>Cómo llegar</span>
                      <button
                        type="button"
                        onClick={goBackToList}
                        style={{
                          border: "none",
                          background: "var(--mapas-green)",
                          color: "#fff",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          fontSize: 11,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          lineHeight: 1,
                        }}
                      >×</button>
                    </div>

                    <div style={{ padding: "8px 10px" }}>
                      {/* One-liner: destination + route info */}
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                        marginBottom: 6,
                      }}>
                        <strong style={{ fontSize: 12, color: "#243126", lineHeight: 1.2, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {activePlace.name}
                        </strong>
                        {currentNavigationPlan && (
                          <span style={{ fontSize: 11, color: "#66715e", whiteSpace: "nowrap" }}>
                            {formatDuration(currentNavigationRemainingSeconds)}
                          </span>
                        )}
                      </div>

                      {/* Mode pills row */}
                      {isRouteLoading ? (
                        <div style={{ fontSize: 11, color: "#91570a", background: "rgba(241,154,32,0.1)", padding: "4px 8px", borderRadius: 6, marginBottom: 6 }}>
                          Calculando ruta...
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" }}>
                          {[
                            { key: "walking", label: "🚶", dur: formatDuration(routePlans["walking"]?.duration) },
                            { key: "car", label: "🚗", dur: formatDuration(routePlans["car"]?.duration) },
                            { key: "transit", label: "🚌", dur: formatDuration(routePlans["transit"]?.duration) },
                          ].map((mode) => {
                            const hasPlan = !!routePlans[mode.key];
                            return (
                              <button
                                key={mode.key}
                                type="button"
                                onClick={() => setTravelMode(mode.key)}
                                disabled={!hasPlan}
                                style={{
                                  border: travelMode === mode.key ? "1px solid var(--mapas-orange)" : "1px solid #d8cbb8",
                                  background: travelMode === mode.key ? "rgba(241,154,32,0.08)" : "#faf8f2",
                                  borderRadius: 999,
                                  padding: "2px 8px",
                                  fontSize: 11,
                                  cursor: hasPlan ? "pointer" : "not-allowed",
                                  opacity: hasPlan ? 1 : 0.5,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  color: "#2f3729",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <span>{mode.label}</span>
                                {hasPlan && <span style={{ color: "#66715e", fontSize: 10 }}>{mode.dur}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Cómo llegar button - compact */}
                      <button
                        type="button"
                        onClick={handleTraceRoute}
                        disabled={isRouteLoading}
                        style={{
                          width: "100%",
                          border: "none",
                          borderRadius: 8,
                          background: "var(--mapas-orange)",
                          color: "#fff",
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          padding: "8px 12px",
                          cursor: isRouteLoading ? "wait" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          boxShadow: "0 4px 10px rgba(194,89,39,0.25)",
                          opacity: isRouteLoading ? 0.8 : 1,
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>directions</span>
                        {isRouteLoading ? "Calculando..." : "Cómo llegar"}
                      </button>

                      {/* Route status/error message */}
                      {routeMessage && !isRouteLoading && (
                        <div style={{
                          fontSize: 10,
                          lineHeight: 1.3,
                          paddingTop: 4,
                          color: routeStatus === "error" ? "#b91c1c" : routeStatus === "success" ? "#1d4ed8" : "#66715e",
                        }}>
                          {routeMessage}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Route cards for switching routes (always visible) */}
                <div className="mapas-route-cards">
                  {routeStats.filter((r) => r.id !== selectedRouteId).map((route) => (
                    <button
                      type="button"
                      key={route.id}
                      className="mapas-route-card mapas-ui-card"
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        setIsRouteExpanded(true);
                        setView("list");
                        setIsNavigationOpen(false);
                        clearRouteLayer();
                      }}
                    >
                      <div>
                        <p className="mapas-route-card-title">{route.name}</p>
                        <p className="mapas-route-card-count">{route.count} sitios</p>
                      </div>
                      <span className={`mapas-chip mapas-chip--${route.chipClass}`} />
                    </button>
                  ))}
                </div>
              </aside>
            </div>

            {/* Bottom: Legend + Links */}
            <div id="glosario" className="mapas-ui-bottom">
              <section className="mapas-legend mapas-ui-card" aria-label="Leyenda de rutas">
                <p className="mapas-legend-title">Rutas</p>
                <div className="mapas-legend-item">
                  <span className="mapas-chip mapas-chip--patrimonial" />
                  <span>Patrimonial</span>
                </div>
                <div className="mapas-legend-item">
                  <span className="mapas-chip mapas-chip--gastronomica" />
                  <span>Gastronómica</span>
                </div>
                <div className="mapas-legend-item">
                  <span className="mapas-chip mapas-chip--mitos" />
                  <span>Mitos y leyendas</span>
                </div>
              </section>

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
                    videoPlayingId !== null && getYouTubeEmbedUrl(activePlace.videos[videoPlayingId]) ? (
                      <div className="mapas-expanded-hero-video">
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
                          src={getYouTubeEmbedUrl(activePlace.videos[videoPlayingId]) + "?autoplay=1&rel=0"}
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
                            const embedUrl = getYouTubeEmbedUrl(url);
                            return embedUrl ? (
                              <div key={url} className="mapas-expanded-videocard">
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
