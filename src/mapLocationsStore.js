import { useSyncExternalStore } from "react";
import { supabase } from "./supabaseClient";

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

const TABLE_NAME = "ubicaciones_mapa";
const listeners = new Set();
let cachedLocations = fallbackLocations();
let realtimeChannel = null;
let isConnecting = false;
let isConnected = false;
let pendingConnection = null;

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
  const images = Array.isArray(location.images) ? location.images : [];
  const videos = Array.isArray(location.videos) ? location.videos : [];

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
    image: location.image?.trim() || images[0] || DEFAULT_MAP_LOCATIONS[0].image,
    images,
    videos,
    coordinates: [Number(coordinates[0]) || 0, Number(coordinates[1]) || 0],
  };
}

/** Convert frontend camelCase to Supabase snake_case row */
function toRow(location) {
  return {
    id: location.id,
    route_id: location.routeId,
    category_label: location.categoryLabel,
    name: location.name,
    subtitle: location.subtitle,
    description: location.description,
    address: location.address,
    cost_status: location.costStatus,
    hours: location.hours,
    audience: location.audience,
    image: location.image,
    images: location.images || [],
    videos: location.videos || [],
    longitude: Number(location.coordinates[0]) || 0,
    latitude: Number(location.coordinates[1]) || 0,
  };
}

/** Convert Supabase snake_case row to frontend camelCase */
function fromRow(row) {
  return normalizeLocation({
    id: row.id,
    routeId: row.route_id,
    categoryLabel: row.category_label,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    address: row.address,
    costStatus: row.cost_status,
    hours: row.hours,
    audience: row.audience,
    image: row.image,
    images: row.images || [],
    videos: row.videos || [],
    coordinates: [Number(row.longitude), Number(row.latitude)],
  });
}

/** Check if Supabase is configured */
function isSupabaseConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

/** Fetch locations from Supabase and update cache */
async function fetchLocations() {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("id");

    if (error) {
      console.warn("Supabase: Error fetching locations:", error.message);
      return false;
    }

    if (data && data.length > 0) {
      cachedLocations = data.map(fromRow);
      emitChange();
      return true;
    }

    return false;
  } catch (err) {
    console.warn("Supabase: Error fetching locations:", err);
    return false;
  }
}

/** Subscribe to real-time changes from Supabase */
function subscribeRealtime() {
  if (realtimeChannel) {
    return;
  }

  if (!isSupabaseConfigured()) {
    return;
  }

  realtimeChannel = supabase
    .channel("public:ubicaciones_mapa")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE_NAME },
      async () => {
        await fetchLocations();
      }
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        isConnected = true;
      }
    });
}

/** Ensure Supabase is connected and data is loaded */
async function ensureConnection() {
  if (!isSupabaseConfigured()) {
    return false;
  }

  if (isConnected && cachedLocations.length > 0) {
    return true;
  }

  if (isConnecting) {
    return pendingConnection;
  }

  isConnecting = true;
  pendingConnection = (async () => {
    try {
      const fetched = await fetchLocations();

      if (!fetched) {
        // Try to seed default data if table is empty
        const { error } = await supabase.from(TABLE_NAME).upsert(
          DEFAULT_MAP_LOCATIONS.map(toRow),
          { onConflict: "id", ignoreDuplicates: true }
        );

        if (!error) {
          await fetchLocations();
        }
      }

      subscribeRealtime();
      isConnected = true;
      return true;
    } catch (err) {
      console.warn("Supabase: Connection error, using local data:", err);
      cachedLocations = fallbackLocations();
      emitChange();
      return false;
    } finally {
      isConnecting = false;
      pendingConnection = null;
    }
  })();

  return pendingConnection;
}

function persistLocally(locations) {
  cachedLocations = cloneLocations(locations).map(normalizeLocation);
  emitChange();
  return cachedLocations;
}

export function getMapLocationsSnapshot() {
  return cachedLocations;
}

export function subscribeMapLocations(listener) {
  listeners.add(listener);

  if (isSupabaseConfigured()) {
    ensureConnection().catch(() => {
      cachedLocations = fallbackLocations();
      emitChange();
    });
  }

  return () => {
    listeners.delete(listener);
  };
}

export function useMapLocations() {
  return useSyncExternalStore(subscribeMapLocations, getMapLocationsSnapshot, fallbackLocations);
}

export async function setMapLocations(locations) {
  const normalized = cloneLocations(locations).map(normalizeLocation);

  if (!isSupabaseConfigured()) {
    return persistLocally(normalized);
  }

  try {
    // Get existing IDs from DB
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select("id");

    const existingIds = new Set((existing || []).map((r) => r.id));
    const newIds = new Set(normalized.map((l) => l.id));

    // Upsert all locations
    const rows = normalized.map(toRow);
    const { error: upsertError } = await supabase
      .from(TABLE_NAME)
      .upsert(rows, { onConflict: "id" });

    if (upsertError) throw upsertError;

    // Delete removed locations
    const toDelete = [...existingIds].filter((id) => !newIds.has(id));
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .in("id", toDelete);

      if (deleteError) throw deleteError;
    }

    await fetchLocations();
    return normalized;
  } catch {
    return persistLocally(normalized);
  }
}

export async function upsertMapLocation(location) {
  const normalized = normalizeLocation(location);

  if (!isSupabaseConfigured()) {
    const current = getMapLocationsSnapshot();
    const next = current.some((item) => item.id === normalized.id)
      ? current.map((item) => (item.id === normalized.id ? normalized : item))
      : [normalized, ...current];
    return persistLocally(next);
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(toRow(normalized), { onConflict: "id" });

    if (error) throw error;
    await fetchLocations();
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
  if (!isSupabaseConfigured()) {
    return persistLocally(getMapLocationsSnapshot().filter((location) => location.id !== id));
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("id", id);

    if (error) throw error;
    await fetchLocations();
    return getMapLocationsSnapshot();
  } catch {
    return persistLocally(getMapLocationsSnapshot().filter((location) => location.id !== id));
  }
}

export async function resetMapLocations() {
  if (!isSupabaseConfigured()) {
    return persistLocally(DEFAULT_MAP_LOCATIONS);
  }

  try {
    // Delete all existing locations
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .neq("id", "__nonexistent__"); // delete all

    if (deleteError && deleteError.code !== "PGRST116") {
      // PGRST116 means no rows affected, that's fine
      throw deleteError;
    }

    // Insert defaults
    const { error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert(DEFAULT_MAP_LOCATIONS.map(toRow));

    if (insertError) throw insertError;

    await fetchLocations();
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
