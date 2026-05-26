import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import TopBar from "./TopBar";
import { getRouteCounts, useMapLocations } from "./mapLocationsStore";
import "mapbox-gl/dist/mapbox-gl.css";
import "./Mapas.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const VALLEDUPAR_COORDS = [-73.2532, 10.4631];
const MAP_CENTER = [-73.2435, 10.4631];
const MAP_ZOOM = 14.2;
const MAP_PITCH = 45;
const MAP_BEARING = -17.6;

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
  const [selectedPlaceId, setSelectedPlaceId] = useState("plaza-alfonso");
  const [activePlace, setActivePlace] = useState(locations[0] ?? null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [isRouteTrackingOpen, setIsRouteTrackingOpen] = useState(false);
  const [navigationElapsedSeconds, setNavigationElapsedSeconds] = useState(0);
  const [navigationPreviewProgress, setNavigationPreviewProgress] = useState(0);
  const [loadError, setLoadError] = useState("");

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

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!popupDragRef.current) {
        return;
      }

      const { startX, startY, startLeft, startTop } = popupDragRef.current;
      const popupWidth = Math.min(window.innerWidth - 24, 320);
      const popupHeight = 340;
      const nextLeft = Math.max(12, Math.min(window.innerWidth - popupWidth - 12, startLeft + (event.clientX - startX)));
      const nextTop = Math.max(84, Math.min(window.innerHeight - popupHeight - 12, startTop + (event.clientY - startY)));

      setPlacePopupPosition({ x: nextLeft, y: nextTop });
    };

    const handlePointerUp = () => {
      popupDragRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setLoadError("Falta configurar VITE_MAPBOX_TOKEN en .env.local");
      return undefined;
    }

    if (!MAPBOX_TOKEN.startsWith("pk.")) {
      setLoadError("VITE_MAPBOX_TOKEN debe ser público (pk.*). No uses tokens secretos (sk.*) en frontend.");
      return undefined;
    }

    if (!mapContainerRef.current) {
      return undefined;
    }

    if (mapRef.current) {
      return undefined;
    }

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
    } catch (error) {
      setLoadError("No se pudo inicializar el mapa. Revisa que VITE_MAPBOX_TOKEN sea válido y público.");
      return undefined;
    }

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), "top-left");

    map.on("load", () => {
      setIsMapReady(true);
    });

    map.on("error", () => {
      setLoadError("No se pudo cargar el mapa. Verifica que el token de Mapbox sea público (pk.*).");
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];

      stopNavigationPlayback();

      if (mapRef.current) {
        mapRef.current.remove();
      }

      mapRef.current = null;
      setIsMapReady(false);

      if (routeAnimationRef.current) {
        cancelAnimationFrame(routeAnimationRef.current);
        routeAnimationRef.current = null;
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      routeSourceRef.current = null;

      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !mapRef.current) {
      return undefined;
    }

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
        setIsRouteTrackingOpen(false);
        setIsPlacePopupOpen(true);
        setIsPlacePopupCollapsed(false);
        setPlacePopupPosition({ x: 24, y: 96 });
        setRoutePlans({});
        setRouteOrigin(null);
        setIsModalOpen(true);
        stopNavigationPlayback();
      };

      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(place.coordinates)
        .addTo(mapRef.current);

      markerElement.addEventListener("click", openPlace);

      return {
        place,
        marker,
        markerElement,
      };
    });

    markersRef.current = builtMarkers;

    if (!locations.some((place) => place.id === selectedPlaceId) && locations[0]) {
      setSelectedPlaceId(locations[0].id);
      setActivePlace(locations[0]);
    }

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current = [];
    };
  }, [isMapReady, locations, selectedPlaceId]);

  useEffect(() => {
    if (!locations.length) {
      return;
    }

    const current = locations.find((place) => place.id === selectedPlaceId) ?? locations[0];
    if (current && current.id !== activePlace?.id) {
      setActivePlace(current);
    }
  }, [locations, selectedPlaceId, activePlace?.id]);

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

  const handleSelectPlace = (place) => {
    setSelectedPlaceId(place.id);
    setActivePlace(place);
    setIsModalOpen(true);
    setIsPlacePopupOpen(true);
    setIsPlacePopupCollapsed(false);
    setPlacePopupPosition({ x: 24, y: 96 });
    setIsNavigationOpen(false);
    setIsRouteTrackingOpen(false);
    setRoutePlans({});
    setRouteOrigin(null);
    setRouteStatus("idle");
    setRouteMessage("");
    stopNavigationPlayback();

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: place.coordinates,
        zoom: 15.2,
        pitch: 48,
        bearing: MAP_BEARING,
        duration: 1100,
      });
    }

    const selectedMarker = markersRef.current.find((markerData) => markerData.place.id === place.id);
    if (selectedMarker) {
      selectedMarker.marker.togglePopup();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsPlacePopupOpen(false);
    setIsPlacePopupCollapsed(false);
    setIsNavigationOpen(false);
    setIsRouteTrackingOpen(false);
    stopNavigationPlayback();
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
  };

  const formatDistance = (meters) => {
    if (!Number.isFinite(meters)) {
      return "--";
    }

    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatEta = (seconds) => {
    if (!Number.isFinite(seconds)) {
      return "--:--";
    }

    const eta = new Date(Date.now() + seconds * 1000);
    return eta.toLocaleTimeString([], {
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
    if (progress < 0.18) {
      return "Sal con cuidado y mantente sobre la ruta principal.";
    }

    if (progress < 0.55) {
      return "Sigue recto. El recorrido se mantiene estable.";
    }

    if (progress < 0.85) {
      return "Prepárate para llegar. Mantente atento al destino.";
    }

    return `Llegando a ${activePlace?.name ?? "tu destino"}.`;
  };

  const stopNavigationPlayback = () => {
    if (navigationTimerRef.current) {
      clearInterval(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }

    if (navigationAnimationRef.current) {
      cancelAnimationFrame(navigationAnimationRef.current);
      navigationAnimationRef.current = null;
    }
  };

  const startNavigationPlayback = (plan) => {
    if (!mapRef.current || !plan?.coordinates?.length) {
      return;
    }

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
        const trackerElement = document.createElement("div");
        trackerElement.className = "mapas-user-marker mapas-user-marker--tracking";
        userMarkerRef.current = new mapboxgl.Marker(trackerElement).setLngLat(currentPoint).addTo(mapRef.current);
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
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setNavigationElapsedSeconds(Math.max(0, elapsed));
    }, 1000);
  };

  const fetchRoutePlan = async (mode, origin, destination) => {
    const profile = mode === "walking" ? "walking" : "driving";
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
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
      note: mode === "walking" ? "Ruta caminando" : "Ruta en carro",
    };
  };

  const drawRouteForPlan = (plan) => {
    if (plan?.coordinates) {
      drawRouteAnimation(plan.coordinates);
    }
  };

  const loadNavigationPlans = async (origin, destination) => {
    setIsRouteLoading(true);
    setRouteMessage("Consultando tiempos de ruta...");
    setIsRouteTrackingOpen(false);
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

      const nextPlans = {
        walking: walkingPlan,
        car: carPlan,
        transit: transitPlan,
      };

      setRoutePlans(nextPlans);
      setTravelMode((previousMode) => (nextPlans[previousMode] ? previousMode : "walking"));
      setRouteStatus("success");
      setRouteMessage("Selecciona un modo y luego inicia navegacion.");
      setIsNavigationOpen(true);
      drawRouteForPlan(nextPlans[travelMode] || walkingPlan);
      mapRef.current.fitBounds(new mapboxgl.LngLatBounds(origin, destination), {
        padding: 120,
        duration: 1200,
        pitch: 45,
      });
    } catch (error) {
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
      setRouteMessage("Primero obten tu ubicacion.");
      return;
    }

    const navigationState = {
      routeOrigin,
      destination: activePlace.coordinates,
      travelMode,
      routePlan: currentPlan,
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
    if (!mapRef.current) {
      return;
    }

    if (routeAnimationRef.current) {
      cancelAnimationFrame(routeAnimationRef.current);
      routeAnimationRef.current = null;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (mapRef.current.getLayer("capa-ruta")) {
      mapRef.current.removeLayer("capa-ruta");
    }

    if (mapRef.current.getLayer("capa-ruta-base")) {
      mapRef.current.removeLayer("capa-ruta-base");
    }

    if (mapRef.current.getSource("ruta-activa")) {
      mapRef.current.removeSource("ruta-activa");
    }

    routeSourceRef.current = null;
  };

  const drawRouteAnimation = (routeCoordinates) => {
    if (!mapRef.current) {
      return;
    }

    clearRouteLayer();

    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    };

    mapRef.current.addSource("ruta-activa", {
      type: "geojson",
      data: geojson,
    });

    routeSourceRef.current = geojson;

    mapRef.current.addLayer({
      id: "capa-ruta-base",
      type: "line",
      source: "ruta-activa",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": 10,
        "line-opacity": 0.18,
      },
    });

    mapRef.current.addLayer({
      id: "capa-ruta",
      type: "line",
      source: "ruta-activa",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#f19a20",
        "line-width": 6,
        "line-opacity": 0.96,
        "line-dasharray": [0.5, 2],
      },
    });

    let step = 0;
    const framesPerStep = Math.max(1, Math.floor(routeCoordinates.length / 120));

    const animate = () => {
      if (!routeSourceRef.current || !mapRef.current) {
        return;
      }

      if (step < routeCoordinates.length) {
        routeSourceRef.current.geometry.coordinates.push(routeCoordinates[step]);
        mapRef.current.getSource("ruta-activa").setData(routeSourceRef.current);
        step += framesPerStep;

        if (
          step >= routeCoordinates.length &&
          routeSourceRef.current.geometry.coordinates[routeSourceRef.current.geometry.coordinates.length - 1] !==
            routeCoordinates[routeCoordinates.length - 1]
        ) {
          routeSourceRef.current.geometry.coordinates.push(routeCoordinates[routeCoordinates.length - 1]);
          mapRef.current.getSource("ruta-activa").setData(routeSourceRef.current);
        }

        routeAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    routeAnimationRef.current = requestAnimationFrame(animate);
  };

  const handleTraceRoute = async () => {
    if (!activePlace || !mapRef.current) {
      return;
    }

    setRouteStatus("locating");
    setRouteMessage("Buscando tu ubicacion...");
    setIsNavigationOpen(true);

    if (!("geolocation" in navigator)) {
      setRouteStatus("error");
      setRouteMessage("Tu navegador no soporta geolocalizacion.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLngLat = [position.coords.longitude, position.coords.latitude];
        setRouteOrigin(userLngLat);
        setRouteStatus("routing");
        setRouteMessage("Consultando ruta caminando...");

        if (userMarkerRef.current) {
          userMarkerRef.current.remove();
        }

        const userMarkerElement = document.createElement("div");
        userMarkerElement.className = "mapas-user-marker";
        userMarkerRef.current = new mapboxgl.Marker(userMarkerElement).setLngLat(userLngLat).addTo(mapRef.current);

        await loadNavigationPlans(userLngLat, activePlace.coordinates);
      },
      () => {
        setRouteStatus("error");
        setRouteMessage("No pudimos acceder a tu ubicacion. Revisa permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  useEffect(() => {
    if (!routePlans[travelMode]) {
      return;
    }

    drawRouteForPlan(routePlans[travelMode]);
  }, [travelMode, routePlans]);

  return (
    <div className="mapas-page">
      <TopBar activeSection="mapas" isAuthenticated user={{ name: "Usuario Valido", initials: "UV" }} onSectionChange={() => {}} />

      <main className="mapas-main">
        <section id="inicio" className="mapas-stage" aria-label="Mapa interactivo">
          <div ref={mapContainerRef} id="mapas" className="mapas-container" />

          <div className="mapas-ui-layer">
            <div className="mapas-ui-top">
              <div className="mapas-ui-card mapas-search-box">
                <span className="mapas-search-icon" aria-hidden="true" />
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Buscar sitios en la ruta activa..."
                  aria-label="Buscar"
                />
              </div>
            </div>

            {isPlacePopupOpen && activePlace ? (
              <section
                className="mapas-floating-popup"
                style={{ left: `${placePopupPosition.x}px`, top: `${placePopupPosition.y}px` }}
                aria-label={`Resumen de ${activePlace.name}`}
              >
                <button type="button" className="mapas-floating-popup__drag" onPointerDown={handlePopupPointerDown} aria-label="Mover popup">
                  <span />
                  <span />
                  <span />
                </button>

                <div className="mapas-floating-popup__image" style={{ backgroundImage: `url('${activePlace.image}')` }} />

                <div className="mapas-floating-popup__content">
                  <div>
                    <p className="mapas-floating-popup__kicker">{activePlace.categoryLabel}</p>
                    <h3>{activePlace.name}</h3>
                    <p>{activePlace.subtitle}</p>
                  </div>

                  <div className="mapas-floating-popup__actions">
                    <button type="button" className="mapas-floating-popup__button" onClick={() => setIsModalOpen(true)}>
                      Abrir ficha
                    </button>
                    <button type="button" className="mapas-floating-popup__button mapas-floating-popup__button--primary" onClick={handleTraceRoute}>
                      Como llegar
                    </button>
                    <button type="button" className="mapas-floating-popup__close" onClick={collapsePlacePopup} aria-label="Minimizar popup">
                      ×
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {isPlacePopupCollapsed && activePlace ? (
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
            ) : null}

            <div id="galeria" className="mapas-ui-middle">
              <aside className="mapas-side-panel" aria-label="Panel de rutas">
                <article className="mapas-main-card mapas-ui-card">
                  <button
                    type="button"
                    className="mapas-main-card-header"
                    onClick={() => setIsRouteExpanded((previousValue) => !previousValue)}
                  >
                    <div>
                      <p className="mapas-main-card-title">
                        {routeStats.find((route) => route.id === selectedRouteId)?.name ?? "Ruta Patrimonial"}
                      </p>
                      <p className="mapas-main-card-count">
                        {routeStats.find((route) => route.id === selectedRouteId)?.count ?? 0} sitios
                      </p>
                    </div>
                    <span className={`mapas-chevron${isRouteExpanded ? " expanded" : ""}`}>v</span>
                  </button>

                  {isRouteExpanded ? (
                    <div className="mapas-main-card-body">
                      {SUBCATEGORIES[selectedRouteId] ? (
                        <div className="mapas-subcategory-list">
                          {SUBCATEGORIES[selectedRouteId].map((subcategory) => (
                            <button type="button" key={subcategory.id} className="mapas-subcategory-item">
                              <span>{subcategory.name}</span>
                              <span className="mapas-subcategory-count">{subcategory.count}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mapas-empty-state">No hay subcategorias para esta ruta.</p>
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
                          <p className="mapas-empty-state">No hay lugares que coincidan con la busqueda.</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>

                <div className="mapas-route-cards">
                  {routeStats.filter((route) => route.id !== selectedRouteId).map((route) => (
                    <button
                      type="button"
                      key={route.id}
                      className="mapas-route-card mapas-ui-card"
                      onClick={() => {
                        setSelectedRouteId(route.id);
                        setIsRouteExpanded(true);
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

            <div id="glosario" className="mapas-ui-bottom">
              <section className="mapas-legend mapas-ui-card" aria-label="Leyenda de rutas">
                <p className="mapas-legend-title">Rutas</p>
                <div className="mapas-legend-item">
                  <span className="mapas-chip mapas-chip--patrimonial" />
                  <span>Patrimonial</span>
                </div>
                <div className="mapas-legend-item">
                  <span className="mapas-chip mapas-chip--gastronomica" />
                  <span>Gastronomica</span>
                </div>
                <div className="mapas-legend-item">
                  <span className="mapas-chip mapas-chip--mitos" />
                  <span>Mitos y leyendas</span>
                </div>
                <div className="mapas-legend-footnote">Linea punteada: ruta trazada</div>
              </section>

              <div id="footer" className="mapas-links">
                <Link to="/" className="mapas-link-btn">
                  Inicio
                </Link>
                <Link to="/demo" className="mapas-link-btn mapas-link-btn--primary">
                  Demo
                </Link>
              </div>
            </div>
          </div>

          {isRouteTrackingOpen && currentNavigationPlan ? (
            <section className="mapas-navigation-dock" aria-label="Vista de navegacion">
              <div className="mapas-tracking-window">
                <div className="mapas-tracking-head">
                  <div>
                    <p className="mapas-tracking-kicker">Seguimiento en vivo</p>
                    <h3>{activePlace?.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="mapas-tracking-close"
                    onClick={() => {
                      setIsRouteTrackingOpen(false);
                      stopNavigationPlayback();
                    }}
                    aria-label="Cerrar seguimiento"
                  >
                    ×
                  </button>
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
          ) : null}
        </section>

        {loadError ? <p className="mapas-error">{loadError}</p> : null}
      </main>

      <div className={`mapas-modal${isModalOpen ? " open" : ""}`} aria-hidden={!isModalOpen}>
        <div className="mapas-modal-bg" onClick={closeModal} role="presentation" />

        <section className="mapas-modal-panel" role="dialog" aria-modal="true" aria-label="Detalle del lugar">
          <button type="button" className="mapas-modal-close" onClick={closeModal} aria-label="Cerrar">
            ×
          </button>

          <div className="mapas-modal-media">
            <img src={activePlace?.image} alt={activePlace?.name} />
            <button type="button" className="mapas-modal-play" aria-label="Ver detalle visual">
              ▶
            </button>
          </div>

          <div className="mapas-modal-body">
            <h1>{activePlace?.name}</h1>
            <p className="mapas-modal-summary">{activePlace?.subtitle}</p>

            <div className="mapas-modal-box">
              <p>
                <strong>Direccion Exacta:</strong> <span>{activePlace?.address}</span>
              </p>
              <p>
                <strong>Estado de Costo:</strong> <span>{activePlace?.costStatus}</span>
              </p>
              <p>
                <strong>Horarios:</strong> <span>{activePlace?.hours}</span>
              </p>
              <p>
                <strong>Publico Objetivo:</strong> <span>{activePlace?.audience}</span>
              </p>
            </div>

            <div className="mapas-modal-actions">
              <button type="button" className="mapas-route-btn" onClick={handleTraceRoute} disabled={routeStatus === "locating" || routeStatus === "routing"}>
                {routeStatus === "locating" || routeStatus === "routing" ? "Calculando..." : "Como llegar"}
              </button>

              <div className="mapas-modal-swatches" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>

            {isNavigationOpen ? (
              <section className="mapas-navigation-panel" aria-label="Panel de navegacion">
                <div className="mapas-navigation-head">
                  <div>
                    <p className="mapas-navigation-kicker">Navegacion</p>
                    <h2>{activePlace?.name}</h2>
                  </div>
                  <button type="button" className="mapas-navigation-close" onClick={() => setIsNavigationOpen(false)} aria-label="Cerrar navegacion">
                    ×
                  </button>
                </div>

                <div className="mapas-mode-grid">
                  {[
                    { key: "walking", label: "Caminando", icon: "🚶" },
                    { key: "car", label: "Carro", icon: "🚗" },
                    { key: "transit", label: "Transporte publico", icon: "🚌" },
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
                            {plan ? `${formatDuration(plan.duration)} · ${formatDistance(plan.distance)}` : isRouteLoading ? "Cargando..." : "No disponible"}
                          </small>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mapas-navigation-note">
                  {routePlans[travelMode]?.note || "Selecciona un modo para ver el tiempo estimado."}
                </div>

                <div className="mapas-eta-card">
                  <span className="mapas-eta-label">ETA</span>
                  <strong>{formatEta(currentNavigationRemainingSeconds)}</strong>
                  <small>
                    Llegada estimada · {currentNavigationPlan ? `${formatDuration(currentNavigationRemainingSeconds)} restantes` : "Sin ruta calculada"}
                  </small>
                </div>

                <div className="mapas-navigation-footer">
                  <button type="button" className="mapas-route-btn mapas-route-btn--secondary" onClick={handleTraceRoute} disabled={isRouteLoading}>
                    Recalcular tiempos
                  </button>
                  <button type="button" className="mapas-route-btn" onClick={startNavigation} disabled={!routeOrigin || !routePlans[travelMode]}>
                    Iniciar navegacion
                  </button>
                </div>
              </section>
            ) : null}

            {routeMessage ? <p className={`mapas-route-message ${routeStatus}`}>{routeMessage}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
