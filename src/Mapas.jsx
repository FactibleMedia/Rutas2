import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import TopBar from "./TopBar";
import { getRouteCounts, useMapLocations } from "./mapLocationsStore";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Mapas.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MAP_CENTER = [-73.2435, 10.4631];
const MAP_ZOOM = 14.2;
const MAP_PITCH = 45;
const MAP_BEARING = -17.6;
const MOBILE_USER_AGENT_REGEX = /Android|iPhone|iPad|iPod/i;

const SUBCATEGORIES = {
  patrimonial: [
    { id: "arq-colonial", name: "Arquitectura Colonial", count: 2 },
    { id: "museos", name: "Museos y Cultura", count: 1 },
    { id: "parques", name: "Parques Historicos", count: 1 },
  ],
  gastronomica: [
    { id: "comida-tipica", name: "Comida Tipica", count: 6 },
    { id: "postres", name: "Postres y Dulces", count: 3 },
  ],
  mitos: [
    { id: "relatos-urbanos", name: "Relatos Urbanos", count: 5 },
    { id: "espiritu-campesino", name: "Memoria Campesina", count: 4 },
  ],
};

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function Mapas() {
  const navigate = useNavigate();
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
  const [view, setView] = useState("list"); // "list" | "details" | "navigation"
  const [isRouteTrackingOpen, setIsRouteTrackingOpen] = useState(false);
  const [navigationElapsedSeconds, setNavigationElapsedSeconds] = useState(0);
  const [navigationPreviewProgress, setNavigationPreviewProgress] = useState(0);
  const [locationPermissionState, setLocationPermissionState] = useState("idle");
  const [locationPermissionMessage, setLocationPermissionMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const isMobileDevice = typeof navigator !== "undefined" && MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);
  const routeStats = useMemo(() => getRouteCounts(locations), [locations]);

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
    map.on("load", () => setIsMapReady(true));
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
        setView("details");
        stopNavigationPlayback();
        clearRouteLayer();
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
    setView("details");
    stopNavigationPlayback();
    clearRouteLayer();

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: place.coordinates,
        zoom: 15.2,
        pitch: 48,
        bearing: MAP_BEARING,
        duration: 1100,
      });
    }
  };

  const goBackToList = () => {
    setView("list");
    setIsNavigationOpen(false);
    setRoutePlans({});
    clearRouteLayer();
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
          pitch: 58,
          bearing: MAP_BEARING,
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
          pitch: 45,
        });
      }

      // Iniciar navegación en tiempo real automáticamente
      startNavigationPlayback(defaultPlan);
    } catch {
      setRouteStatus("error");
      setRouteMessage("No se pudieron cargar los tiempos de ruta.");
      setIsNavigationOpen(false);
    } finally {
      setIsRouteLoading(false);
    }
  };

  const startNavigation = () => {
    const currentPlan = routePlans[travelMode];
    if (!routeOrigin || !activePlace || !currentPlan) {
      setRouteMessage("Primero obten tu ubicación.");
      return;
    }

    const navigationState = {
      routeRequestId: `${Date.now()}-${activePlace.id}-${travelMode}`,
      routeOrigin,
      destination: activePlace.coordinates,
      travelMode,
      routePlan: null,
      forceRecalculate: true,
      place: {
        id: activePlace.id,
        name: activePlace.name,
        subtitle: activePlace.subtitle,
        image: activePlace.image,
        address: activePlace.address,
        categoryLabel: activePlace.categoryLabel,
      },
      autoStart: true,
    };

    sessionStorage.setItem("rutas_navmap_state", JSON.stringify(navigationState));
    navigate("/navmap", { state: navigationState });
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
                <div className="mapas-floating-popup__image" style={{ backgroundImage: `url('${activePlace.image}')` }} />
                <div className="mapas-floating-popup__content">
                  <div>
                    <p className="mapas-floating-popup__kicker">{activePlace.categoryLabel}</p>
                    <h3>{activePlace.name}</h3>
                    <p>{activePlace.subtitle}</p>
                  </div>
                  <div className="mapas-floating-popup__actions">
                    <button type="button" className="mapas-floating-popup__button" onClick={() => setView("details")}>
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

            {/* Side Panel: List / Details / Navigation */}
            <div id="galeria" className="mapas-ui-middle">
              <aside className="mapas-side-panel" aria-label="Panel de rutas">

                {/* VIEW: LIST - route selector + places */}
                {view === "list" && (
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
                        {SUBCATEGORIES[selectedRouteId] && (
                          <div className="mapas-subcategory-list">
                            {SUBCATEGORIES[selectedRouteId].map((sub) => (
                              <button type="button" key={sub.id} className="mapas-subcategory-item">
                                <span>{sub.name}</span>
                                <span className="mapas-subcategory-count">{sub.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

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
                      </div>
                    )}
                  </article>
                )}

                {/* VIEW: DETAILS - selected place info */}
                {view === "details" && activePlace && (
                  <div className="mapas-side-card mapas-ui-card">
                    <div className="mapas-side-card-header">
                      <h3 className="mapas-side-card-title">{activePlace.name}</h3>
                      <button type="button" className="mapas-side-card-close" onClick={goBackToList}>×</button>
                    </div>

                    <div className="mapas-side-card-image">
                      <img src={activePlace.image} alt={activePlace.name} />
                      <span className="mapas-side-card-badge">{activePlace.categoryLabel}</span>
                    </div>

                    <div className="mapas-side-card-body">
                      {activePlace.subtitle && <p className="mapas-side-card-subtitle">{activePlace.subtitle}</p>}
                      {activePlace.description && <p className="mapas-side-card-desc">{activePlace.description}</p>}

                      <div className="mapas-side-card-info">
                        {activePlace.address && (
                          <div className="mapas-side-card-info-row">
                            <span className="material-symbols-outlined">location_on</span>
                            <span>{activePlace.address}</span>
                          </div>
                        )}
                        {activePlace.hours && (
                          <div className="mapas-side-card-info-row">
                            <span className="material-symbols-outlined">schedule</span>
                            <span>{activePlace.hours}</span>
                          </div>
                        )}
                        {activePlace.costStatus && (
                          <div className="mapas-side-card-info-row">
                            <span className="material-symbols-outlined">payments</span>
                            <span>{activePlace.costStatus}</span>
                          </div>
                        )}
                        {activePlace.audience && (
                          <div className="mapas-side-card-info-row">
                            <span className="material-symbols-outlined">group</span>
                            <span>{activePlace.audience}</span>
                          </div>
                        )}
                      </div>

                      <div className="mapas-side-card-actions">
                        <button
                          type="button"
                          className="mapas-route-btn mapas-route-btn--full"
                          onClick={handleTraceRoute}
                          disabled={routeStatus === "locating" || routeStatus === "routing"}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>directions</span>
                          {routeStatus === "locating" || routeStatus === "routing" ? "Calculando..." : "Cómo llegar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW: NAVIGATION */}
                {view === "navigation" && activePlace && (
                  <div className="mapas-side-card mapas-ui-card">
                    <div className="mapas-side-card-header">
                      <h3 className="mapas-side-card-title">Navegación</h3>
                      <button type="button" className="mapas-side-card-close" onClick={goBackToList}>×</button>
                    </div>

                    <div className="mapas-side-card-body">
                      {/* Destination info */}
                      <div className="mapas-nav-dest">
                        <p className="mapas-nav-dest-name">{activePlace.name}</p>
                        <p className="mapas-nav-dest-label">Destino</p>
                      </div>

                      {/* Route status message */}
                      {routeMessage && (
                        <div className={`mapas-route-message ${routeStatus}`}>
                          {routeMessage}
                        </div>
                      )}

                      {/* Mode selector */}
                      <div className="mapas-mode-grid">
                        {[
                          { key: "walking", label: "Caminando", icon: "🚶" },
                          { key: "car", label: "Carro", icon: "🚗" },
                          { key: "transit", label: "Transporte público", icon: "🚌" },
                        ].map((mode) => {
                          const plan = routePlans[mode.key];
                          return (
                            <button
                              type="button"
                              key={mode.key}
                              className={`mapas-mode-card${travelMode === mode.key ? " active" : ""}`}
                              onClick={() => setTravelMode(mode.key)}
                              disabled={!plan}
                            >
                              <span className="mapas-mode-icon">{mode.icon}</span>
                              <div>
                                <strong>{mode.label}</strong>
                                <small>
                                  {plan
                                    ? `${formatDuration(plan.duration)} · ${formatDistance(plan.distance)}`
                                    : isRouteLoading
                                      ? "Cargando..."
                                      : "No disponible"}
                                </small>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* ETA Card */}
                      {currentNavigationPlan && (
                        <div className="mapas-eta-card">
                          <span className="mapas-eta-label">ETA</span>
                          <strong>{formatEta(currentNavigationRemainingSeconds)}</strong>
                          <small>
                            Llegada estimada · {formatDuration(currentNavigationRemainingSeconds)} restantes
                          </small>
                        </div>
                      )}

                      {/* Navigation buttons */}
                      <div className="mapas-side-card-actions" style={{ flexDirection: "column" }}>
                        <button
                          type="button"
                          className="mapas-route-btn mapas-route-btn--full"
                          onClick={startNavigation}
                          disabled={!routeOrigin || !routePlans[travelMode]}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>navigation</span>
                          Iniciar navegación
                        </button>
                        <button
                          type="button"
                          className="mapas-route-btn mapas-route-btn--secondary mapas-route-btn--full"
                          onClick={handleTraceRoute}
                          disabled={isRouteLoading}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                          Recalcular ruta
                        </button>
                      </div>
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
                <div className="mapas-legend-footnote">Línea punteada: ruta trazada</div>
              </section>

              <div id="footer" className="mapas-links">
                <Link to="/" className="mapas-link-btn">Inicio</Link>
                <Link to="/demo" className="mapas-link-btn mapas-link-btn--primary">Demo</Link>
              </div>
            </div>
          </div>

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
