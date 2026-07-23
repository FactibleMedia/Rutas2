import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { isNetworkError, getUserFriendlyError } from "./adminHelpers";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const VALLEDUPAR = [-73.2532, 10.4631];

const TIPO_SITIO = ["Patrimonial", "Gastronomico", "Mitico", "Historico", "Cultural"];
const TIPO_MULTIMEDIA = ["Fotografia", "Ilustracion", "Galeria de Fotos", "Video"];
const FILTERS = ["Todas", ...TIPO_SITIO];

const STORAGE_BUCKET = "media-rutas";

const EMPTY_FORM = {
  titulo: "",
  tipo_sitio: "Patrimonial",
  tipo_multimedia: "Fotografia",
  imagen_principal: "",
  imagenes_galeria: "",
  video_imagen: "",
  video_url: "",
  descripcion_breve: "",
  descripcion_narrativa: "",
  ubicacion_id: "",
  longitud: "",
  latitud: "",
};

/* =========================================================
   Upload helper – uploads a file to Supabase Storage
   ========================================================= */

async function uploadFile(file, folder = "gallery") {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/* =========================================================
   ImageUpload Component
   ========================================================= */

function ImageUpload({ label, value, onChange, accept = "image/*" }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir el archivo. Intenta de nuevo.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="admin-form-group">
      <label className="admin-form-label">{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          style={{ display: "none" }}
        />
        <input
          className="admin-form-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL o sube un archivo..."
          style={{ flex: 1 }}
        />
        <button
          type="button"
          className="admin-btn admin-btn--secondary"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            whiteSpace: "nowrap",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {uploading ? "sync" : "upload"}
          </span>
          {uploading ? "Subiendo..." : "Subir"}
        </button>
      </div>
      {value && (
        <img
          src={value}
          alt="Preview"
          style={{
            marginTop: 8,
            width: "100%",
            maxWidth: 200,
            height: 120,
            objectFit: "cover",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--outline-variant)",
          }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
    </div>
  );
}

/* =========================================================
   GalleryManager Component
   ========================================================= */

export default function GalleryManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleting, setDeleting] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todas");
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  const galeriaInputRef = useRef(null);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapError, setMapError] = useState("");

  // Estados de error de red
  const [networkError, setNetworkError] = useState("");

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setNetworkError("");
    try {
      let query = supabase
        .from("galeria_multimedia")
        .select("*")
        .order("creado_en", { ascending: false });

      if (filterTipo !== "Todas") {
        query = query.eq("tipo_sitio", filterTipo);
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.warn("Error fetching gallery:", err);
      if (isNetworkError(err)) {
        setNetworkError("No hay conexión a internet. Los datos se cargarán automáticamente cuando se restablezca la conexión.");
      } else {
        setMessage({ type: "error", text: getUserFriendlyError(err) });
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filterTipo]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Fetch ubicaciones for dropdown
  const fetchUbicaciones = useCallback(async () => {
    setLoadingUbicaciones(true);
    try {
      const { data, error } = await supabase
        .from("ubicaciones_mapa")
        .select("id, name, longitude, latitude")
        .order("name");
      if (error) throw error;
      setUbicaciones(data || []);
    } catch (err) {
      console.warn("Error fetching ubicaciones:", err);
      if (!isNetworkError(err)) {
        setMessage({ type: "error", text: getUserFriendlyError(err) });
      }
      setUbicaciones([]);
    } finally {
      setLoadingUbicaciones(false);
    }
  }, []);

  // Init map when form is shown
  useEffect(() => {
    if (!showForm) {
      // Cleanup map when form closes
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
      return;
    }

    fetchUbicaciones();

    if (!MAPBOX_TOKEN) {
      setMapError("Configura VITE_MAPBOX_TOKEN en .env.local");
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      mapboxgl.accessToken = MAPBOX_TOKEN;
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: VALLEDUPAR,
        zoom: 12,
      });

      map.addControl(new mapboxgl.NavigationControl(), "top-left");
      mapRef.current = map;

      map.on("click", (e) => {
        setForm((prev) => ({
          ...prev,
          latitud: e.lngLat.lat.toFixed(6),
          longitud: e.lngLat.lng.toFixed(6),
        }));
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showForm, fetchUbicaciones]);

  // Update marker when coordinates change
  const lat = parseFloat(form.latitud);
  const lng = parseFloat(form.longitud);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  useEffect(() => {
    if (!mapRef.current || !hasValidCoords) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement("div");
      el.innerHTML = `<span class="material-symbols-outlined" style="color:#9d3d1c;font-size:36px;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))">location_on</span>`;

      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      // Drag handler: update form coordinates when marker is dragged
      marker.on("dragend", () => {
        const pos = marker.getLngLat();
        setForm((prev) => ({
          ...prev,
          latitud: pos.lat.toFixed(6),
          longitud: pos.lng.toFixed(6),
        }));
      });

      markerRef.current = marker;
    }

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 14,
      duration: 600,
    });
  }, [lat, lng, hasValidCoords]);

  // Cleanup marker on map removal
  useEffect(() => {
    return () => {
      markerRef.current = null;
    };
  }, []);

  // Search filter
  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return items;
    const q = searchText.toLowerCase();
    return items.filter(
      (w) =>
        w.titulo.toLowerCase().includes(q) ||
        w.descripcion_breve.toLowerCase().includes(q)
    );
  }, [items, searchText]);

  // Stats
  const stats = useMemo(() => {
    const counts = {};
    TIPO_SITIO.forEach((t) => {
      counts[t] = items.filter((w) => w.tipo_sitio === t).length;
    });
    return { total: items.length, counts };
  }, [items]);

  const handleEdit = (item) => {
    setForm({
      titulo: item.titulo || "",
      tipo_sitio: item.tipo_sitio || "Patrimonial",
      tipo_multimedia: item.tipo_multimedia || "Fotografia",
      imagen_principal: item.imagen_principal || "",
      imagenes_galeria: (item.imagenes_galeria || []).join("\n"),
      video_imagen: item.video_imagen || "",
      video_url: item.video_url || "",
      descripcion_breve: item.descripcion_breve || "",
      descripcion_narrativa: item.descripcion_narrativa || "",
      ubicacion_id: item.ubicacion_id || "",
      longitud: item.longitud !== 0 && item.longitud ? item.longitud.toString() : "",
      latitud: item.latitud !== 0 && item.latitud ? item.latitud.toString() : "",
    });
    setEditingId(item.id);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  const handleNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`¿Eliminar "${item.titulo}"?`)) return;
    setDeleting(item.id);
    try {
      const { error } = await supabase
        .from("galeria_multimedia")
        .delete()
        .eq("id", item.id);
      if (error) throw error;
      setMessage({ type: "success", text: `"${item.titulo}" eliminado.` });
      fetchItems();
    } catch (err) {
      setMessage({ type: "error", text: isNetworkError(err)
        ? "Operación cancelada: no hay conexión a internet. Intenta de nuevo cuando tengas conexión."
        : getUserFriendlyError(err)
      });
    } finally {
      setDeleting(null);
    }
  };

  // Upload multiple images for galeria
  const handleUploadGaleria = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploadingGaleria(true);
    try {
      const urls = [];
      for (const file of files) {
        const url = await uploadFile(file, "gallery/galeria");
        urls.push(url);
      }
      const existing = form.imagenes_galeria
        ? form.imagenes_galeria.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];
      setForm((p) => ({ ...p, imagenes_galeria: [...existing, ...urls].join("\n") }));
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir archivos.");
    } finally {
      setUploadingGaleria(false);
      if (galeriaInputRef.current) galeriaInputRef.current.value = "";
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setMessage({ type: "error", text: "El título es obligatorio." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const row = {
      titulo: form.titulo.trim(),
      tipo_sitio: form.tipo_sitio,
      tipo_multimedia: form.tipo_multimedia,
      imagen_principal: form.imagen_principal.trim(),
      imagenes_galeria: form.imagenes_galeria
        ? form.imagenes_galeria.split("\n").map((s) => s.trim()).filter(Boolean)
        : [],
      video_imagen: form.video_imagen.trim(),
      video_url: form.video_url.trim(),
      descripcion_breve: form.descripcion_breve.trim(),
      descripcion_narrativa: form.descripcion_narrativa.trim(),
      ubicacion_id: form.ubicacion_id.trim(),
      longitud: form.longitud ? parseFloat(form.longitud) : 0,
      latitud: form.latitud ? parseFloat(form.latitud) : 0,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("galeria_multimedia")
          .update({ ...row, actualizado_en: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        setMessage({ type: "success", text: `"${form.titulo}" actualizado.` });
      } else {
        const { error } = await supabase.from("galeria_multimedia").insert(row);
        if (error) throw error;
        setMessage({ type: "success", text: `"${form.titulo}" creado.` });
      }

      setShowForm(false);
      fetchItems();
    } catch (err) {
      setMessage({ type: "error", text: isNetworkError(err)
        ? "No se pudo guardar: no hay conexión a internet. Intenta de nuevo cuando tengas conexión."
        : getUserFriendlyError(err)
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Gestión de Galería Multimedia</h1>
            <p className="admin-page-header__subtitle">
              {stats.total} elemento(s) registrado(s) · {TIPO_SITIO.length} tipos de sitio
            </p>
          </div>
          {!showForm && (
            <button
              className="admin-btn admin-btn--primary"
              type="button"
              onClick={handleNew}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
              Nuevo Elemento
            </button>
          )}
        </div>
      </div>

      {/* Banner de error de red */}
      {networkError && (
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 500,
            background: "rgba(232, 152, 27, 0.1)",
            color: "#8a6a00",
            border: "1px solid rgba(232, 152, 27, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>wifi_off</span>
          <span style={{ flex: 1 }}>{networkError}</span>
          <button
            type="button"
            onClick={() => { setNetworkError(""); fetchItems(); }}
            className="admin-btn admin-btn--secondary"
            style={{ padding: "6px 14px", fontSize: 12, minHeight: 0, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
            Reintentar
          </button>
        </div>
      )}

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 600,
            background: message.type === "error" ? "var(--error-container)" : "rgba(80, 96, 70, 0.1)",
            color: message.type === "error" ? "var(--on-error-container)" : "var(--tertiary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {message.type === "error" ? "error" : "check_circle"}
          </span>
          {message.text}
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 16 }}
          >
            ×
          </button>
        </div>
      )}

      {/* STATS ROW */}
      <div className="admin-metrics" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", marginBottom: 24 }}>
        {TIPO_SITIO.map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => setFilterTipo(filterTipo === tipo ? "Todas" : tipo)}
            className="admin-metric"
            style={{
              cursor: "pointer",
              padding: 16,
              textAlign: "center",
              border: filterTipo === tipo ? "2px solid var(--primary)" : "1px solid var(--outline-variant)",
              background: filterTipo === tipo ? "rgba(157,61,28,0.04)" : "var(--surface-container-lowest)",
              transition: "all 0.2s",
            }}
          >
            <p className="admin-metric__value" style={{ fontSize: 24, margin: "0 0 4px" }}>
              {stats.counts[tipo] || 0}
            </p>
            <p className="admin-metric__label" style={{ fontSize: 10, margin: 0, whiteSpace: "nowrap" }}>
              {tipo}
            </p>
          </button>
        ))}
      </div>

      {showForm ? (
        /* ===== FORM ===== */
        <div className="admin-card" style={{ padding: 32 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
              {editingId ? "edit" : "add_circle"}
            </span>
            {editingId ? "Editar Elemento Multimedia" : "Nuevo Elemento Multimedia"}
          </h3>

          <form onSubmit={handleSave}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
              {/* LEFT: Form fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="admin-form-group">
                  <label className="admin-form-label">Título *</label>
                  <input
                    className="admin-form-input"
                    type="text"
                    value={form.titulo}
                    onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder="Ej: Casa Colonial El Tique"
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Tipo de Sitio</label>
                    <select
                      className="admin-form-select"
                      value={form.tipo_sitio}
                      onChange={(e) => setForm((p) => ({ ...p, tipo_sitio: e.target.value }))}
                    >
                      {TIPO_SITIO.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Tipo de Multimedia</label>
                    <select
                      className="admin-form-select"
                      value={form.tipo_multimedia}
                      onChange={(e) => setForm((p) => ({ ...p, tipo_multimedia: e.target.value }))}
                    >
                      {TIPO_MULTIMEDIA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Image upload with file picker */}
                <ImageUpload
                  label="Imagen Principal"
                  value={form.imagen_principal}
                  onChange={(val) => setForm((p) => ({ ...p, imagen_principal: val }))}
                />

                {form.tipo_multimedia === "Galeria de Fotos" && (
                  <div className="admin-form-group">
                    <label className="admin-form-label">Galería de Imágenes (una URL por línea)</label>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input
                        ref={galeriaInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleUploadGaleria}
                        style={{ display: "none" }}
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        onClick={() => galeriaInputRef.current?.click()}
                        disabled={uploadingGaleria}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                          {uploadingGaleria ? "sync" : "add_photo_alternate"}
                        </span>
                        {uploadingGaleria ? "Subiendo..." : "Subir imágenes"}
                      </button>
                    </div>
                    <textarea
                      className="admin-form-input"
                      value={form.imagenes_galeria}
                      onChange={(e) => setForm((p) => ({ ...p, imagenes_galeria: e.target.value }))}
                      placeholder="URLs de imágenes (una por línea)"
                      rows={3}
                      style={{ resize: "vertical", minHeight: 70, fontFamily: "monospace", fontSize: 12 }}
                    />
                  </div>
                )}

                {form.tipo_multimedia === "Video" && (
                  <>
                    <ImageUpload
                      label="Imagen / Ilustración del Video"
                      value={form.video_imagen}
                      onChange={(val) => setForm((p) => ({ ...p, video_imagen: val }))}
                    />
                    <div className="admin-form-group">
                      <label className="admin-form-label">Enlace de YouTube</label>
                      <input
                        className="admin-form-input"
                        type="text"
                        value={form.video_url}
                        onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                      {form.video_url && (form.video_url.includes("youtube") || form.video_url.includes("youtu.be")) && (() => {
                        try {
                          const u = new URL(form.video_url.startsWith("http") ? form.video_url : `https://${form.video_url}`);
                          const vid = u.searchParams.get("v") || u.pathname.slice(1);
                          if (!vid) return null;
                          return (
                            <div style={{ marginTop: 8, aspectRatio: "16/9", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                              <iframe
                                src={`https://www.youtube.com/embed/${vid}`}
                                title="Vista previa"
                                style={{ width: "100%", height: "100%", border: "none" }}
                                allow="accelerometer; autoplay; encrypted-media"
                                allowFullScreen
                              />
                            </div>
                          );
                        } catch { return null; }
                      })()}
                    </div>
                  </>
                )}

                <div className="admin-form-group">
                  <label className="admin-form-label">Descripción Breve</label>
                  <input
                    className="admin-form-input"
                    type="text"
                    value={form.descripcion_breve}
                    onChange={(e) => setForm((p) => ({ ...p, descripcion_breve: e.target.value }))}
                    placeholder="Breve descripción del sitio..."
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Descripción Narrativa</label>
                  <textarea
                    className="admin-form-input"
                    value={form.descripcion_narrativa}
                    onChange={(e) => setForm((p) => ({ ...p, descripcion_narrativa: e.target.value }))}
                    placeholder="Descripción detallada y narrativa del lugar..."
                    rows={4}
                    style={{ resize: "vertical", minHeight: 100 }}
                  />
                </div>

                {/* Geolocalización */}
                <div style={{ borderTop: "1px solid var(--outline-variant)", paddingTop: 16 }}>
                  <label className="admin-form-label" style={{ marginBottom: 12, display: "block", fontSize: 16 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}>map</span>
                    Geolocalización
                  </label>

                  {/* Selector de ubicaciones existentes */}
                  <div className="admin-form-group">
                    <label className="admin-form-label" style={{ fontSize: 12 }}>
                      Seleccionar ubicación existente
                    </label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <select
                        className="admin-form-select"
                        value={form.ubicacion_id}
                        onChange={(e) => {
                          const id = e.target.value;
                          const selected = ubicaciones.find((u) => u.id === id);
                          setForm((p) => ({
                            ...p,
                            ubicacion_id: id,
                            longitud: selected ? String(selected.longitude || "") : p.longitud,
                            latitud: selected ? String(selected.latitude || "") : p.latitud,
                          }));
                        }}
                        style={{ flex: 1 }}
                      >
                        <option value="">— Sin ubicación —</option>
                        {ubicaciones.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.id})
                          </option>
                        ))}
                      </select>
                      {loadingUbicaciones && (
                        <span className="material-symbols-outlined" style={{ animation: "spin 1s linear infinite", fontSize: 20, alignSelf: "center" }}>
                          sync
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--outline)", margin: "4px 0 0" }}>
                      También puedes hacer clic en el mapa para establecer un punto nuevo
                    </p>
                  </div>

                  {/* Mapa interactivo */}
                  <div style={{ marginTop: 12, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--outline-variant)" }}>
                    <div
                      ref={mapContainerRef}
                      style={{
                        width: "100%",
                        height: 300,
                        background: "var(--surface-dim)",
                      }}
                    />
                    {mapError && (
                      <p style={{ padding: "8px 12px", fontSize: 12, color: "var(--error)", margin: 0, background: "var(--error-container)" }}>
                        {mapError}
                      </p>
                    )}
                  </div>

                  {/* Coordenadas */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                    <div className="admin-form-group">
                      <label className="admin-form-label" style={{ fontSize: 12 }}>Longitud</label>
                      <input
                        className="admin-form-input"
                        type="number"
                        step="any"
                        value={form.longitud}
                        onChange={(e) => setForm((p) => ({ ...p, longitud: e.target.value }))}
                        placeholder="-73.2435"
                      />
                    </div>
                    <div className="admin-form-group">
                      <label className="admin-form-label" style={{ fontSize: 12 }}>Latitud</label>
                      <input
                        className="admin-form-input"
                        type="number"
                        step="any"
                        value={form.latitud}
                        onChange={(e) => setForm((p) => ({ ...p, latitud: e.target.value }))}
                        placeholder="10.4631"
                      />
                    </div>
                  </div>
                  {!hasValidCoords && !mapError && (
                    <p style={{ fontSize: 11, color: "var(--outline)", margin: "4px 0 0" }}>
                      Selecciona una ubicación existente o haz clic en el mapa para definir coordenadas
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn--primary"
                    disabled={saving}
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {saving ? (
                      <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    ) : (
                      <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span> Guardar</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => setShowForm(false)}
                    style={{ border: "1px solid var(--outline)" }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* RIGHT: Preview */}
              <div>
                <label className="admin-form-label" style={{ marginBottom: 12 }}>Vista Previa</label>
                <div style={{
                  background: "#fcf9ed",
                  borderRadius: "var(--radius-xl)",
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 380,
                  border: "1px solid var(--outline-variant)",
                  gap: 16,
                }}>
                  <div style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 280,
                    height: 180,
                    borderRadius: 12,
                    overflow: "hidden",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}>
                    {form.imagen_principal ? (
                      <img
                        src={form.imagen_principal}
                        alt="Preview"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: "var(--surface-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--on-surface-variant)",
                        fontSize: 13,
                      }}>
                        Sin imagen
                      </div>
                    )}
                    <span style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      padding: "2px 10px",
                      borderRadius: 999,
                      background: "rgba(140,103,70,0.9)",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}>
                      {form.tipo_sitio}
                    </span>
                  </div>
                  <div style={{ textAlign: "center", width: "100%", maxWidth: 280 }}>
                    <h4 style={{
                      fontFamily: "var(--font-trattatello), fantasy",
                      fontSize: 18,
                      margin: "0 0 4px",
                      color: "#4a3728",
                    }}>
                      {form.titulo || "Título"}
                    </h4>
                    <p style={{ fontSize: 13, color: "var(--on-surface-variant)", margin: 0 }}>
                      {form.descripcion_breve || "Descripción breve..."}
                    </p>
                    <span style={{
                      display: "inline-block",
                      marginTop: 8,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      background: "rgba(197,98,56,0.1)",
                      color: "#c56238",
                    }}>
                      {form.tipo_multimedia}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* ===== TABLE ===== */
        <>
          {/* Search */}
          <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center" }}>
            <input
              className="admin-form-input"
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por título o descripción..."
              style={{ maxWidth: 400 }}
            />
            <span style={{ fontSize: 13, color: "var(--on-surface-variant)" }}>
              {filterTipo !== "Todas" && `Filtrando: ${filterTipo}`}
            </span>
          </div>

          {loading ? (
            <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 12, display: "block", animation: "spin 1s linear infinite" }}>sync</span>
              <p>Cargando galería...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16, display: "block" }}>photo_library</span>
              <p>{searchText || filterTipo !== "Todas" ? "No hay elementos que coincidan." : "Aún no hay elementos en la galería."}</p>
              <button className="admin-btn admin-btn--secondary" type="button" onClick={handleNew} style={{ marginTop: 16 }}>
                Crear primer elemento
              </button>
            </div>
          ) : (
            <div className="admin-card" style={{ overflow: "hidden" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo Sitio</th>
                    <th>Multimedia</th>
                    <th>Descripción</th>
                    <th>Imagen/Video</th>
                    <th style={{ width: 100 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.titulo}</td>
                      <td>
                        <span className="admin-badge admin-badge--published">{item.tipo_sitio}</span>
                      </td>
                      <td>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-sm)",
                          fontSize: 11,
                          fontWeight: 600,
                          background: "rgba(197,98,56,0.1)",
                          color: "#c56238",
                        }}>
                          {item.tipo_multimedia}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--on-surface-variant)", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.descripcion_breve || item.descripcion_narrativa?.slice(0, 80) || "—"}
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {item.imagen_principal && (
                          <img
                            src={item.imagen_principal}
                            alt=""
                            style={{ width: 40, height: 28, objectFit: "cover", borderRadius: 4, verticalAlign: "middle" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        )}
                        {item.video_url && <span style={{ marginLeft: 4 }}>🎬</span>}
                        {!item.imagen_principal && !item.video_url && <span style={{ color: "var(--outline)" }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="admin-topbar__icon-btn"
                            type="button"
                            title="Editar"
                            onClick={() => handleEdit(item)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                          </button>
                          <button
                            className="admin-topbar__icon-btn"
                            type="button"
                            title="Eliminar"
                            style={{ color: "var(--error)" }}
                            onClick={() => handleDelete(item)}
                            disabled={deleting === item.id}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                              {deleting === item.id ? "hourglass_top" : "delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
