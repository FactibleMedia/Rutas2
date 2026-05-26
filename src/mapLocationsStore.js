import { useSyncExternalStore } from "react";

export const ROUTE_META = {
  patrimonial: { id: "patrimonial", name: "Ruta Patrimonial", chipClass: "patrimonial" },
  gastronomica: { id: "gastronomica", name: "Ruta Gastronomica", chipClass: "gastronomica" },
  mitos: { id: "mitos", name: "Ruta de Mitos y Leyendas", chipClass: "mitos" },
};

export const DEFAULT_MAP_LOCATIONS = [
  {
    id: "plaza-alfonso",
    routeId: "patrimonial",
    categoryLabel: "Patrimonial",
    name: "Plaza Alfonso Lopez",
    subtitle: "Corazon del Festival Vallenato.",
    description: "Centro simbolico de Valledupar y punto de encuentro cultural para la ciudad.",
    address: "Plaza Alfonso Lopez, Valledupar",
    costStatus: "Acceso Libre",
    hours: "Abierto 24h",
    audience: "Familiar",
    image: "https://images.unsplash.com/photo-1533601017-dc61895e03c0?auto=format&fit=crop&q=80&w=900",
    coordinates: [-73.2435, 10.4631],
  },
  {
    id: "catedral-rosario",
    routeId: "patrimonial",
    categoryLabel: "Patrimonial",
    name: "Catedral Nuestra Senora del Rosario",
    subtitle: "Templo historico del centro de Valledupar.",
    description: "Uno de los referentes arquitectonicos y religiosos mas reconocidos de la ciudad.",
    address: "Calle 15 con Carrera 7, Valledupar",
    costStatus: "Acceso Libre",
    hours: "7:00 AM a 6:00 PM",
    audience: "Religioso y fotografico",
    image: "https://images.unsplash.com/photo-1548625361-ecacbd74cb86?auto=format&fit=crop&q=80&w=900",
    coordinates: [-73.245, 10.465],
  },
  {
    id: "casa-museo",
    routeId: "patrimonial",
    categoryLabel: "Patrimonial",
    name: "Casa Museo del Vallenato",
    subtitle: "Memoria musical y cultural de la region.",
    description: "Espacio dedicado a la historia del vallenato y sus protagonistas.",
    address: "Centro historico, Valledupar",
    costStatus: "Consulta previa",
    hours: "8:00 AM a 5:00 PM",
    audience: "Turistas y melomanos",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=900",
    coordinates: [-73.2493, 10.4724],
  },
  {
    id: "mercado-popular",
    routeId: "gastronomica",
    categoryLabel: "Gastronomica",
    name: "Mercado Popular",
    subtitle: "Parada clasica de cocina local.",
    description: "Punto de sabores tradicionales para descubrir recetas y productos tipicos.",
    address: "Sector centro, Valledupar",
    costStatus: "Consumo variable",
    hours: "6:00 AM a 5:00 PM",
    audience: "Familiar y gastronomico",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=900",
    coordinates: [-73.2573, 10.4645],
  },
  {
    id: "balcon-leyendas",
    routeId: "mitos",
    categoryLabel: "Mitos y Leyendas",
    name: "Balcon de Leyendas",
    subtitle: "Historias orales y relatos de la ciudad.",
    description: "Escenario narrativo para la memoria oral y las historias populares del Cesar.",
    address: "Zona centro, Valledupar",
    costStatus: "Acceso Libre",
    hours: "Nocturno",
    audience: "Joven y familiar",
    image: "https://images.unsplash.com/photo-1519764622345-23439dd774f5?auto=format&fit=crop&q=80&w=900",
    coordinates: [-73.2389, 10.4589],
  },
];

const STORAGE_KEY = "rutas_map_locations";
const CHANNEL_NAME = "rutas-map-locations";
const listeners = new Set();
let broadcastChannel = null;
let cachedLocations = readFromStorage();
let globalsBound = false;

function cloneLocations(locations) {
  return locations.map((location) => ({
    ...location,
    coordinates: [Number(location.coordinates?.[0]) || 0, Number(location.coordinates?.[1]) || 0],
  }));
}

function fallbackLocations() {
  return cloneLocations(DEFAULT_MAP_LOCATIONS);
}

function readFromStorage() {
  if (typeof window === "undefined") {
    return fallbackLocations();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallbackLocations();
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackLocations();
    }

    return cloneLocations(parsed).map(normalizeLocation);
  } catch {
    return fallbackLocations();
  }
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function bindGlobals() {
  if (globalsBound || typeof window === "undefined") {
    return;
  }

  globalsBound = true;

  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) {
      return;
    }

    cachedLocations = readFromStorage();
    emitChange();
  });

  if (typeof BroadcastChannel !== "undefined") {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = () => {
      cachedLocations = readFromStorage();
      emitChange();
    };
  }
}

function normalizeLocation(location) {
  const routeId = ROUTE_META[location.routeId] ? location.routeId : "patrimonial";
  const coordinates = Array.isArray(location.coordinates) ? location.coordinates : [0, 0];

  return {
    id: location.id || cryptoId(),
    routeId,
    categoryLabel: location.categoryLabel || ROUTE_META[routeId].name.replace(/^Ruta\s*/, ""),
    name: location.name?.trim() || "Nuevo sitio",
    subtitle: location.subtitle?.trim() || "Descripción breve.",
    description: location.description?.trim() || location.subtitle?.trim() || "Descripción breve.",
    address: location.address?.trim() || "Sin dirección",
    costStatus: location.costStatus?.trim() || "Sin definir",
    hours: location.hours?.trim() || "Sin definir",
    audience: location.audience?.trim() || "Sin definir",
    image: location.image?.trim() || DEFAULT_MAP_LOCATIONS[0].image,
    coordinates: [Number(coordinates[0]) || 0, Number(coordinates[1]) || 0],
  };
}

function cryptoId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `location-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persistLocations(locations) {
  const normalized = cloneLocations(locations).map(normalizeLocation);
  cachedLocations = normalized;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // ignore storage errors in restricted environments
    }

    if (broadcastChannel) {
      broadcastChannel.postMessage({ type: "updated" });
    }
  }

  emitChange();
  return normalized;
}

export function getMapLocationsSnapshot() {
  return cachedLocations;
}

export function subscribeMapLocations(listener) {
  listeners.add(listener);
  bindGlobals();

  return () => {
    listeners.delete(listener);
  };
}

export function useMapLocations() {
  return useSyncExternalStore(subscribeMapLocations, getMapLocationsSnapshot, fallbackLocations);
}

export function setMapLocations(locations) {
  return persistLocations(locations);
}

export function upsertMapLocation(location) {
  const normalized = normalizeLocation(location);
  const current = getMapLocationsSnapshot();
  const next = current.some((item) => item.id === normalized.id)
    ? current.map((item) => (item.id === normalized.id ? normalized : item))
    : [normalized, ...current];

  return persistLocations(next);
}

export function removeMapLocation(id) {
  return persistLocations(getMapLocationsSnapshot().filter((location) => location.id !== id));
}

export function resetMapLocations() {
  return persistLocations(DEFAULT_MAP_LOCATIONS);
}

export function getRouteCounts(locations) {
  return Object.values(ROUTE_META).map((route) => ({
    ...route,
    count: locations.filter((location) => location.routeId === route.id).length,
  }));
}