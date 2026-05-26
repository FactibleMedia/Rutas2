import { useSyncExternalStore } from "react";
import { DbConnection } from "./admin/module_bindings";

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

const listeners = new Set();
let cachedLocations = fallbackLocations();
let connection = null;
let connectPromise = null;

const SPACETIME_URI =
  import.meta.env.VITE_SPACETIME_URI ||
  import.meta.env.VITE_SPACETIMEDB_HOST ||
  "https://maincloud.spacetimedb.com";
const SPACETIME_DB =
  import.meta.env.VITE_SPACETIME_DB ||
  import.meta.env.VITE_SPACETIMEDB_DB_NAME ||
  "rutasvallenatas-9wo5o";
const SPACETIME_TOKEN_KEY = "rutas_spacetime_token";

function cloneLocations(locations) {
  return locations.map((location) => ({
    ...location,
    coordinates: [Number(location.coordinates?.[0]) || 0, Number(location.coordinates?.[1]) || 0],
  }));
}

function fallbackLocations() {
  return cloneLocations(DEFAULT_MAP_LOCATIONS);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

function cryptoId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `location-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeLocation(location) {
  const routeId = ROUTE_META[location.routeId] ? location.routeId : "patrimonial";
  const coordinates = Array.isArray(location.coordinates) ? location.coordinates : [0, 0];

  return {
    id: location.id || cryptoId(),
    routeId,
    categoryLabel: location.categoryLabel || ROUTE_META[routeId].name.replace(/^Ruta\s*/, ""),
    name: location.name?.trim() || "Nuevo sitio",
    subtitle: location.subtitle?.trim() || "Descripcion breve.",
    description: location.description?.trim() || location.subtitle?.trim() || "Descripcion breve.",
    address: location.address?.trim() || "Sin direccion",
    costStatus: location.costStatus?.trim() || "Sin definir",
    hours: location.hours?.trim() || "Sin definir",
    audience: location.audience?.trim() || "Sin definir",
    image: location.image?.trim() || DEFAULT_MAP_LOCATIONS[0].image,
    coordinates: [Number(coordinates[0]) || 0, Number(coordinates[1]) || 0],
  };
}

function toRow(location) {
  return {
    id: location.id,
    routeId: location.routeId,
    categoryLabel: location.categoryLabel,
    name: location.name,
    subtitle: location.subtitle,
    description: location.description,
    address: location.address,
    costStatus: location.costStatus,
    hours: location.hours,
    audience: location.audience,
    image: location.image,
    longitude: String(location.coordinates[0]),
    latitude: String(location.coordinates[1]),
  };
}

function fromRow(row) {
  return normalizeLocation({
    id: row.id,
    routeId: row.routeId,
    categoryLabel: row.categoryLabel,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    address: row.address,
    costStatus: row.costStatus,
    hours: row.hours,
    audience: row.audience,
    image: row.image,
    coordinates: [Number(row.longitude), Number(row.latitude)],
  });
}

function updateFromRemoteTable() {
  if (!connection?.db?.ubicacionesMapa) {
    return;
  }

  const remoteRows = Array.from(connection.db.ubicacionesMapa.iter());
  if (!remoteRows.length) {
    cachedLocations = fallbackLocations();
    emitChange();
    return;
  }

  cachedLocations = remoteRows.map(fromRow);
  emitChange();
}

function persistLocally(locations) {
  cachedLocations = cloneLocations(locations).map(normalizeLocation);
  emitChange();
  return cachedLocations;
}

async function ensureRealtimeConnection() {
  if (typeof window === "undefined") {
    return null;
  }

  if (connection) {
    return connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  connectPromise = new Promise((resolve, reject) => {
    let settled = false;

    const finishResolve = (value) => {
      if (settled) {
        return;
      }

      settled = true;
      resolve(value);
    };

    const finishReject = (error) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    };

    const conn = DbConnection.builder()
      .withUri(SPACETIME_URI)
      .withDatabaseName(SPACETIME_DB)
      .withToken(localStorage.getItem(SPACETIME_TOKEN_KEY) || undefined)
      .onConnect((_ctx, _identity, token) => {
        localStorage.setItem(SPACETIME_TOKEN_KEY, token);

        conn
          .subscriptionBuilder()
          .onApplied(() => {
            updateFromRemoteTable();
            finishResolve(conn);
          })
          .onError((ctx) => {
            finishReject(ctx.error || new Error("No se pudo sincronizar ubicaciones en Spacetime."));
          })
          .subscribe("SELECT * FROM ubicaciones_mapa");
      })
      .onConnectError((_ctx, error) => {
        finishReject(error || new Error("No se pudo conectar con Spacetime."));
      })
      .build();

    connection = conn;
  })
    .catch((error) => {
      connection = null;
      throw error;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

async function callReducer(name, params) {
  const conn = await ensureRealtimeConnection();
  if (!conn) {
    throw new Error("No hay conexion activa con Spacetime.");
  }

  const reducer = conn.reducers?.[name];
  if (typeof reducer !== "function") {
    throw new Error(`Reducer ${name} no disponible en los bindings actuales.`);
  }

  await reducer(params);
}

export function getMapLocationsSnapshot() {
  return cachedLocations;
}

export function subscribeMapLocations(listener) {
  listeners.add(listener);
  ensureRealtimeConnection().catch(() => {
    cachedLocations = fallbackLocations();
    emitChange();
  });

  return () => {
    listeners.delete(listener);
  };
}

export function useMapLocations() {
  return useSyncExternalStore(subscribeMapLocations, getMapLocationsSnapshot, fallbackLocations);
}

export async function setMapLocations(locations) {
  const normalized = cloneLocations(locations).map(normalizeLocation);

  try {
    const conn = await ensureRealtimeConnection();
    if (!conn) {
      return persistLocally(normalized);
    }

    const existing = new Set(Array.from(conn.db.ubicacionesMapa.iter()).map((item) => item.id));

    for (const location of normalized) {
      existing.delete(location.id);
      await callReducer("upsertUbicacionMapa", toRow(location));
    }

    for (const id of existing) {
      await callReducer("eliminarUbicacionMapa", { id });
    }

    return normalized;
  } catch {
    return persistLocally(normalized);
  }
}

export async function upsertMapLocation(location) {
  const normalized = normalizeLocation(location);

  try {
    await callReducer("upsertUbicacionMapa", toRow(normalized));
    return normalized;
  } catch {
    const current = getMapLocationsSnapshot();
    const next = current.some((item) => item.id === normalized.id)
      ? current.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...current];
    return persistLocally(next);
  }
}

export async function removeMapLocation(id) {
  try {
    await callReducer("eliminarUbicacionMapa", { id });
    return getMapLocationsSnapshot();
  } catch {
    return persistLocally(getMapLocationsSnapshot().filter((location) => location.id !== id));
  }
}

export async function resetMapLocations() {
  try {
    await callReducer("resetUbicacionesMapa", {});
    return fallbackLocations();
  } catch {
    return persistLocally(DEFAULT_MAP_LOCATIONS);
  }
}

export function getRouteCounts(locations) {
  return Object.values(ROUTE_META).map((route) => ({
    ...route,
    count: locations.filter((location) => location.routeId === route.id).length,
  }));
}
