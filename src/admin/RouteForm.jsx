import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "../supabaseClient";
import { upsertMapLocation } from "../mapLocationsStore";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const STORAGE_BUCKET = "media-rutas";
const VALLEDUPAR = [-73.2532, 10.4631];

const ROUTE_TYPES = [
  { id: "patrimonial", label: "Patrimonial", icon: "landmark" },
  { id: "gastronomica", label: "Gastronómica", icon: "restaurant" },
  { id: "mitos", label: "Mitos y Leyendas", icon: "auto_stories" },
];

const EMPTY_FORM = {
  id: "",
  routeId: "patrimonial",
  name: "",
  subtitle: "",
  description: "",
  address: "",
  hours: "",
  audience: "",
  costStatus: "Acceso Libre",
  latitude: "",
  longitude: "",
};

export default function RouteForm({ location = null, onSave, onCancel }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(
    location
      ? {
          id: location.id || "",
          routeId: location.routeId || "patrimonial",
          name: location.name || "",
          subtitle: location.subtitle || "",
          description: location.description || "",
          address: location.address || "",
          hours: location.hours || "",
          audience: location.audience || "",
          costStatus: location.costStatus || "Acceso Libre",
          latitude: String(location.coordinates?.[1] ?? location.latitude ?? ""),
          longitude: String(location.coordinates?.[0] ?? location.longitude ?? ""),
        }
      : { ...EMPTY_FORM }
  );
  const [images, setImages] = useState(location?.images || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mapError, setMapError] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const lat = parseFloat(form.latitude);
  const lng = parseFloat(form.longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  // Initialize Mapbox map
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setMapError("Configura VITE_MAPBOX_TOKEN en .env.local");
      return;
    }
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: VALLEDUPAR,
      zoom: 13,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-left");
    mapRef.current = map;

    map.on("click", (e) => {
      setForm((prev) => ({
        ...prev,
        latitude: e.lngLat.lat.toFixed(6),
        longitude: e.lngLat.lng.toFixed(6),
      }));
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker when coordinates change
  useEffect(() => {
    if (!mapRef.current || !hasValidCoords) return;

    if (markerRef.current) {
      markerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement("div");
      el.className = "route-form-marker";
      el.innerHTML = `<span class="material-symbols-outlined" style="color:var(--primary);font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))">location_on</span>`;
      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }

    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 800,
    });
  }, [lat, lng, hasValidCoords]);

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setMessage({ type: "", text: "" });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const uploadedUrls = [];

      for (const file of files) {
        const ext = file.name.split(".").pop();
        const fileName = `rutas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      setImages((prev) => [...prev, ...uploadedUrls]);
      setMessage({ type: "success", text: `${uploadedUrls.length} imagen(es) subida(s)` });
    } catch (err) {
      setMessage({ type: "error", text: `Error al subir: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    if (!form.name.trim()) {
      setMessage({ type: "error", text: "El nombre del sitio es obligatorio." });
      setSaving(false);
      return;
    }

    if (!hasValidCoords) {
      setMessage({ type: "error", text: "Ingresa coordenadas válidas (latitud: -90 a 90, longitud: -180 a 180)." });
      setSaving(false);
      return;
    }

    try {
      const payload = {
        id: form.id || `ruta-${Date.now()}`,
        routeId: form.routeId,
        categoryLabel: ROUTE_TYPES.find((r) => r.id === form.routeId)?.label.replace(/^Ruta\s*/, "") || "",
        name: form.name.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        costStatus: form.costStatus.trim(),
        hours: form.hours.trim(),
        audience: form.audience.trim(),
        image: images[0] || "",
        images,
        coordinates: [lng, lat],
      };

      await upsertMapLocation(payload);
      setMessage({ type: "success", text: "Ruta guardada correctamente." });
      if (onSave) onSave(payload);
    } catch (err) {
      setMessage({ type: "error", text: `Error al guardar: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="route-form">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title" style={{ fontSize: 32, lineHeight: "40px" }}>
              {location ? "Editar Ruta" : "Nueva Ruta"}
            </h1>
            <p className="admin-page-header__subtitle">
              {location
                ? `Editando: ${location.name}`
                : "Completa los campos para agregar un nuevo sitio al mapa cultural."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={onCancel}
              style={{ border: "1px solid var(--outline)" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={handleSubmit}
              disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {saving ? (
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              ) : (
                <>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>
                  {location ? "Guardar Cambios" : "Crear Ruta"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {message.text && (
        <div
          style={{
            padding: 12,
            borderRadius: "var(--radius-lg)",
            marginBottom: 24,
            fontSize: 14,
            fontWeight: 600,
            background: message.type === "error" ? "var(--error-container)" : "rgba(80, 96, 70, 0.1)",
            color: message.type === "error" ? "var(--on-error-container)" : "var(--tertiary)",
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-gutter)" }}>
        {/* LEFT COLUMN: Form Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Tipo de Ruta */}
          <div className="admin-card" style={{ padding: 24 }}>
            <label className="admin-form-label" style={{ marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: "middle", marginRight: 6 }}>category</span>
              Tipo de Ruta
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {ROUTE_TYPES.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => handleFieldChange("routeId", rt.id)}
                  style={{
                    flex: 1,
                    padding: "14px 12px",
                    borderRadius: "var(--radius-lg)",
                    border: form.routeId === rt.id ? "2px solid var(--primary)" : "1px solid var(--outline-variant)",
                    background: form.routeId === rt.id ? "rgba(157, 61, 28, 0.06)" : "var(--surface-container-low)",
                    color: form.routeId === rt.id ? "var(--primary)" : "var(--on-surface-variant)",
                    fontFamily: "var(--font-body)",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    textAlign: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: form.routeId === rt.id ? "'FILL' 1" : "'FILL' 0" }}>
                    {rt.icon}
                  </span>
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Información Básica */}
          <div className="admin-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>info</span>
              Información del Sitio
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Nombre del Sitio *</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder="Ej: Plaza Alfonso López"
                  required
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Subtítulo / Breve descripción</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.subtitle}
                  onChange={(e) => handleFieldChange("subtitle", e.target.value)}
                  placeholder="Ej: Corazón del Festival Vallenato"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Descripción</label>
                <textarea
                  className="admin-form-input"
                  value={form.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Describe el sitio, su historia y su importancia cultural..."
                  rows={4}
                  style={{ resize: "vertical", minHeight: 100, borderBottom: "2px solid var(--outline-variant)" }}
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Dirección Exacta</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.address}
                  onChange={(e) => handleFieldChange("address", e.target.value)}
                  placeholder="Ej: Calle 15 con Carrera 7, Valledupar"
                />
              </div>
            </div>
          </div>

          {/* Horarios y Público */}
          <div className="admin-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--secondary)" }}>schedule</span>
              Horarios y Acceso
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div className="admin-form-group">
                <label className="admin-form-label">Horario de Atención</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.hours}
                  onChange={(e) => handleFieldChange("hours", e.target.value)}
                  placeholder="Ej: 8:00 AM - 5:00 PM"
                />
              </div>

              <div className="admin-form-group">
                <label className="admin-form-label">Estado de Costo</label>
                <select
                  className="admin-form-select"
                  value={form.costStatus}
                  onChange={(e) => handleFieldChange("costStatus", e.target.value)}
                >
                  <option value="Acceso Libre">Acceso Libre</option>
                  <option value="Consulta previa">Consulta previa</option>
                  <option value="Consumo variable">Consumo variable</option>
                  <option value="Costo de entrada">Costo de entrada</option>
                </select>
              </div>

              <div className="admin-form-group" style={{ gridColumn: "1 / -1" }}>
                <label className="admin-form-label">Público Objetivo</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.audience}
                  onChange={(e) => handleFieldChange("audience", e.target.value)}
                  placeholder="Ej: Familiar, Turistas, Melómanos, Religioso"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Map + Photos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Ubicación en Mapa */}
          <div className="admin-card" style={{ overflow: "hidden", position: "relative" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--outline-variant)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>map</span>
                Ubicación en el Mapa
              </h3>
              <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
                Haz clic en el mapa para colocar el marcador
              </span>
            </div>

            {/* Coordinate Inputs */}
            <div style={{ padding: "12px 24px", background: "var(--surface-container-low)", display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <label className="admin-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Latitud</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.latitude}
                  onChange={(e) => handleFieldChange("latitude", e.target.value)}
                  placeholder="10.4631"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "monospace",
                    fontSize: 14,
                    background: "var(--surface-bright)",
                    outline: "none",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="admin-form-label" style={{ fontSize: 12, marginBottom: 4 }}>Longitud</label>
                <input
                  type="number"
                  step="0.000001"
                  value={form.longitude}
                  onChange={(e) => handleFieldChange("longitude", e.target.value)}
                  placeholder="-73.2435"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--outline-variant)",
                    borderRadius: "var(--radius-sm)",
                    fontFamily: "monospace",
                    fontSize: 14,
                    background: "var(--surface-bright)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Map */}
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: 400,
                background: "var(--surface-dim)",
              }}
            />
            {mapError && (
              <p style={{ padding: "8px 24px", fontSize: 12, color: "var(--error)", margin: 0 }}>
                {mapError}
              </p>
            )}
            {!hasValidCoords && !mapError && (
              <div
                style={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(0,0,0,0.7)",
                  color: "white",
                  padding: "6px 16px",
                  borderRadius: "var(--radius-full)",
                  fontSize: 12,
                }}
              >
                Ingresa coordenadas o haz clic en el mapa
              </div>
            )}
          </div>

          {/* Fotografías */}
          <div className="admin-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, padding: 16, opacity: 0.05 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 80 }}>photo_library</span>
            </div>

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              Fotografías
            </h3>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--outline-variant)",
                borderRadius: "var(--radius-xl)",
                padding: 24,
                textAlign: "center",
                cursor: "pointer",
                transition: "background 0.2s",
                marginBottom: 16,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-container-high)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
              />
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: "var(--outline)", display: "block", marginBottom: 8 }}>
                {uploading ? "hourglass_top" : "add_photo_alternate"}
              </span>
              <p style={{ margin: 0, fontSize: 14, color: "var(--on-surface-variant)" }}>
                {uploading ? "Subiendo..." : "Arrastra fotos aquí o haz clic para seleccionar"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--outline)" }}>
                JPG, PNG, WebP • Máx 50MB por archivo
              </p>
            </div>

            {/* Image Gallery */}
            {images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {images.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: "relative",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      aspectRatio: "16/10",
                      border: "1px solid var(--outline-variant)",
                      background: "var(--surface-dim)",
                    }}
                  >
                    <img
                      src={url}
                      alt={`Foto ${index + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.5)",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span
                        style={{
                          position: "absolute",
                          bottom: 4,
                          left: 4,
                          background: "rgba(157, 61, 28, 0.85)",
                          color: "white",
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "var(--radius-full)",
                          letterSpacing: "0.05em",
                        }}
                      >
                        PORTADA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .route-form-marker { background: none; border: none; cursor: pointer; }
      `}</style>
    </div>
  );
}
