import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import "./RoutesInteractivasManager.css";

const STORAGE_BUCKET = "media-rutas";

const CATEGORIES = [
  { slug: "patrimoniales", nombre: "Rutas Patrimoniales", color: "#8B6B4A" },
  { slug: "gastronomica", nombre: "Ruta Gastronómica", color: "#C07536" },
  { slug: "mistica", nombre: "Ruta Mística", color: "#4A6B5D" },
];

const MAP_IMAGE = "/assets/mapa-general.png";
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.3;

export default function RoutesInteractivasManager() {
  const containerRef = useRef(null);
  const mapInnerRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState("gastronomica");
  const [points, setPoints] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [editingPoint, setEditingPoint] = useState(null);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [connectingMode, setConnectingMode] = useState(false);
  const [connectingPath, setConnectingPath] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("puntos");
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);

  // ---- Data loading ----
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [puntosRes, conexRes] = await Promise.all([
        supabase.from("rutas_interactivas_puntos").select("*").eq("categoria_slug", activeCategory).eq("activo", true).order("orden"),
        supabase.from("rutas_interactivas_conexiones").select("*").eq("categoria_slug", activeCategory),
      ]);
      if (puntosRes.error) throw puntosRes.error;
      if (conexRes.error) throw conexRes.error;
      setPoints(puntosRes.data || []);
      setConnections(conexRes.data || []);
    } catch (err) {
      setMessage({ type: "error", text: `Error al cargar: ${err.message}` });
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  // ---- Image upload ----
  const handleFileUpload = useCallback(async (pointId, file) => {
    if (!file) return;
    setUploadingImg(pointId);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `rutas/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
      updatePointField(pointId, "imagen_url", urlData.publicUrl);
      showMessage("success", "Imagen subida correctamente.");
    } catch (err) {
      showMessage("error", `Error al subir imagen: ${err.message}`);
    } finally {
      setUploadingImg(null);
    }
  }, []);

  // ---- Coordinate helpers (zoom-aware) ----
  const getContainerRect = useCallback(() => {
    return containerRef.current?.getBoundingClientRect() || null;
  }, []);

  const clientToPercent = useCallback((clientX, clientY) => {
    const rect = getContainerRect();
    if (!rect) return { x: 50, y: 50 };
    // Adjust for zoom: the visible area is zoom*width, centered
    const visW = rect.width;
    const visH = rect.height;
    const scaledW = visW / zoom;
    const scaledH = visH / zoom;
    const offsetX = (visW - scaledW) / 2 + panOffset.x;
    const offsetY = (visH - scaledH) / 2 + panOffset.y;
    const px = (clientX - rect.left - offsetX) / scaledW * 100;
    const py = (clientY - rect.top - offsetY) / scaledH * 100;
    return { x: Math.max(0, Math.min(100, Math.round(px * 10) / 10)), y: Math.max(0, Math.min(100, Math.round(py * 10) / 10)) };
  }, [zoom, panOffset, getContainerRect]);

  // ---- Zoom controls ----
  const handleZoomIn = () => {
    setZoom((prev) => Math.min(ZOOM_MAX, +(prev + ZOOM_STEP).toFixed(1)));
  };
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(ZOOM_MIN, +(prev - ZOOM_STEP).toFixed(1)));
  };
  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan via drag on empty map areas (middle-mouse or when zoomed)
  const handleMapPointerDown = useCallback((e) => {
    if (zoom <= 1) return;
    // Don't start pan if clicking on a marker
    if (e.target.closest(".ri-marker")) return;
    setIsPanning(true);
    isPanningRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPan = { ...panOffset };

    const doPan = (ev) => {
      setPanOffset({ x: startPan.x + (ev.clientX - startX), y: startPan.y + (ev.clientY - startY) });
    };
    const stopPan = () => {
      setIsPanning(false);
      isPanningRef.current = false;
      window.removeEventListener("pointermove", doPan);
      window.removeEventListener("pointerup", stopPan);
    };
    window.addEventListener("pointermove", doPan);
    window.addEventListener("pointerup", stopPan);
  }, [zoom, panOffset]);

  // ---- Map click: add new point ----
  const handleMapClick = useCallback((e) => {
    if (connectingMode || editingPoint || draggingPoint || isPanningRef.current) return;
    const { x, y } = clientToPercent(e.clientX, e.clientY);
    const newPoint = {
      id: `temp-${Date.now()}`,
      categoria_slug: activeCategory,
      titulo: `Punto ${points.length + 1}`,
      descripcion: "",
      imagen_url: "",
      x, y,
      orden: points.length,
      activo: true,
      _isNew: true,
    };
    setPoints((prev) => [...prev, newPoint]);
    setEditingPoint(newPoint.id);
    setSelectedPoint(newPoint.id);
    showMessage("success", "Punto agregado. Edita los detalles en el panel.");
  }, [activeCategory, points.length, connectingMode, editingPoint, draggingPoint, clientToPercent]);

  // ---- Drag points with proper click/drag differentiation ----
  const handleMarkerPointerDown = useCallback((pointId, e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    // Close editor to allow free drag
    setEditingPoint(null);
    setDraggingPoint(pointId);

    const handleMove = (ev) => {
      const dx = Math.abs(ev.clientX - startX);
      const dy = Math.abs(ev.clientY - startY);
      if (dx > 3 || dy > 3) moved = true;

      setDraggingPoint(pointId);
      const { x, y } = clientToPercent(ev.clientX, ev.clientY);
      setPoints((prev) =>
        prev.map((p) => p.id === pointId ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p)
      );
    };

    const handleUp = () => {
      setDraggingPoint(null);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      // If didn't move, treat as click → select the point
      if (!moved) {
        setSelectedPoint(pointId);
        setEditingPoint(pointId);
      }
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  }, [clientToPercent]);

  // ---- Connections ----
  const toggleConnectingMode = () => {
    setConnectingMode((prev) => !prev);
    setConnectingPath([]);
    if (!connectingMode && points.length === 0) {
      showMessage("error", "Agrega al menos 2 puntos para crear conexiones.");
    }
  };

  const handlePointInConnection = (pointId) => {
    if (!connectingMode) return;
    setConnectingPath((prev) =>
      prev.includes(pointId) ? prev.filter((id) => id !== pointId) : [...prev, pointId]
    );
  };

  const handleSaveConnection = async () => {
    if (connectingPath.length < 2) {
      showMessage("error", "Selecciona al menos 2 puntos para conectar.");
      return;
    }
    try {
      const { error } = await supabase.from("rutas_interactivas_conexiones").insert({
        categoria_slug: activeCategory,
        nombre: `Ruta ${connections.length + 1}`,
        puntos_orden: connectingPath,
      });
      if (error) throw error;
      showMessage("success", "Conexión guardada.");
      setConnectingPath([]);
      setConnectingMode(false);
      loadData();
    } catch (err) {
      showMessage("error", `Error: ${err.message}`);
    }
  };

  const handleDeleteConnection = async (connId) => {
    if (!window.confirm("¿Eliminar esta conexión?")) return;
    try {
      await supabase.from("rutas_interactivas_conexiones").delete().eq("id", connId);
      showMessage("success", "Conexión eliminada.");
      loadData();
    } catch (err) {
      showMessage("error", `Error: ${err.message}`);
    }
  };

  // ---- Save ----
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      for (const point of points) {
        const payload = {
          categoria_slug: activeCategory,
          titulo: point.titulo,
          descripcion: point.descripcion || "",
          imagen_url: point.imagen_url || "",
          x: point.x, y: point.y,
          orden: point.orden,
          activo: true,
        };
        if (point._isNew) {
          const { error } = await supabase.from("rutas_interactivas_puntos").insert(payload);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("rutas_interactivas_puntos").update(payload).eq("id", point.id);
          if (error) throw error;
        }
      }
      try {
        await supabase.from("actividad_admin").insert({
          accion: "Rutas Interactivas actualizadas",
          detalle: `${points.length} punto(s) guardado(s) en ${activeCategory}`,
          tipo: "edicion",
        });
      } catch (e) { /* silencioso */ }
      showMessage("success", `${points.length} punto(s) guardados correctamente.`);
      loadData();
    } catch (err) {
      showMessage("error", `Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ---- CRUD points ----
  const handleDeletePoint = async (pointId) => {
    if (!window.confirm("¿Eliminar este punto?")) return;
    try {
      const point = points.find((p) => p.id === pointId);
      if (point && !point._isNew) {
        await supabase.from("rutas_interactivas_puntos").delete().eq("id", pointId);
      }
      setPoints((prev) => prev.filter((p) => p.id !== pointId));
      if (selectedPoint === pointId) setSelectedPoint(null);
      if (editingPoint === pointId) setEditingPoint(null);
      showMessage("success", "Punto eliminado.");
    } catch (err) {
      showMessage("error", `Error: ${err.message}`);
    }
  };

  const updatePointField = (pointId, field, value) => {
    setPoints((prev) => prev.map((p) => (p.id === pointId ? { ...p, [field]: value } : p)));
  };

  const savePointDetails = () => {
    setEditingPoint(null);
    showMessage("success", "Detalles del punto actualizados.");
  };

  // ---- SVG path ----
  const generatePath = (pointIds) => {
    return pointIds.map((pid, idx) => {
      const pt = points.find((p) => p.id === pid);
      if (!pt) return "";
      return `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`;
    }).join(" ");
  };

  const activeColors = CATEGORIES.find((c) => c.slug === activeCategory);

  return (
    <div className="ri-admin">
      {/* Header */}
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">
              <span className="material-symbols-outlined" style={{ fontSize: 28, verticalAlign: "middle", marginRight: 10, color: "var(--primary)" }}>map</span>
              Rutas Interactivas
            </h1>
            <p className="admin-page-header__subtitle">
              Editor visual — haz clic en el mapa para agregar puntos, arrastra para moverlos, usa zoom para precisión
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="admin-btn admin-btn--primary" type="button" onClick={handleSaveAll} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {saving ? <span className="ri-spinner" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>save</span>}
              {saving ? "Guardando..." : "Guardar Todo"}
            </button>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`ri-message ri-message--${message.type}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            {message.type === "error" ? "error" : "check_circle"}
          </span>
          {message.text}
        </div>
      )}

      {/* Category Tabs */}
      <div className="ri-category-tabs">
        {CATEGORIES.map((cat) => (
          <button key={cat.slug}
            className={`ri-category-tab${activeCategory === cat.slug ? " ri-category-tab--active" : ""}`}
            onClick={() => { setActiveCategory(cat.slug); setSelectedPoint(null); setEditingPoint(null); setConnectingMode(false); setConnectingPath([]); handleZoomReset(); }}
            style={activeCategory === cat.slug ? { borderColor: cat.color, color: cat.color } : {}}>
            <span className="ri-category-dot" style={{ background: cat.color }} />{cat.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="admin-card" style={{ padding: 48, textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, display: "block", margin: "0 auto 12px", animation: "spin 1s linear infinite" }}>sync</span>
          <p style={{ color: "var(--on-surface-variant)" }}>Cargando datos...</p>
        </div>
      ) : (
        <div className="ri-layout">
          {/* Map Area */}
          <div ref={containerRef}
            className={`ri-map-area${connectingMode ? " ri-map-area--connecting" : ""}${isPanning ? " ri-map-area--panning" : ""}${zoom > 1 ? " ri-map-area--zoomed" : ""}`}
            onClick={handleMapClick}
            onPointerDown={handleMapPointerDown}
            style={{ cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "crosshair" }}>

            {/* Map inner (zoomable) */}
            <div ref={mapInnerRef} className="ri-map-inner"
              style={{ transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`, transformOrigin: "center center" }}>
              <img src={MAP_IMAGE} alt="Mapa" className="ri-map-bg" draggable={false} />

              <svg className="ri-map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                {connections.map((conn) => (
                  <path key={conn.id} d={generatePath(conn.puntos_orden)} fill="none"
                    stroke={activeColors?.color || "#5d4037"} strokeWidth="0.35" strokeDasharray="1.2 0.6" className="ri-map-path" />
                ))}
                {connectingPath.length > 1 && (
                  <path d={generatePath(connectingPath)} fill="none" stroke="#2c2116" strokeWidth="0.5"
                    strokeDasharray="1 0.5" className="ri-map-path-preview" />
                )}
              </svg>

              {points.map((point, idx) => (
                <div key={point.id}
                  className={`ri-marker${selectedPoint === point.id ? " ri-marker--selected" : ""}${draggingPoint === point.id ? " ri-marker--dragging" : ""}${connectingPath.includes(point.id) ? " ri-marker--in-path" : ""}`}
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  onPointerDown={(e) => handleMarkerPointerDown(point.id, e)}
                  onClick={(e) => { e.stopPropagation(); if (connectingMode) handlePointInConnection(point.id); }}
                  title={`${point.titulo} (${point.x}%, ${point.y}%)`}>
                  <span className="ri-marker-dot" style={{ background: connectingPath.includes(point.id) ? activeColors?.color : undefined }}>
                    {idx + 1}
                  </span>
                </div>
              ))}
            </div>

            {/* Zoom Controls */}
            <div className="ri-zoom-controls">
              <button type="button" className="ri-zoom-btn" onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                disabled={zoom >= ZOOM_MAX} title="Acercar">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
              </button>
              <span className="ri-zoom-level">{Math.round(zoom * 100)}%</span>
              <button type="button" className="ri-zoom-btn" onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                disabled={zoom <= ZOOM_MIN} title="Alejar">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>remove</span>
              </button>
              {zoom > 1 && (
                <button type="button" className="ri-zoom-btn ri-zoom-btn--reset" onClick={(e) => { e.stopPropagation(); handleZoomReset(); }} title="Restablecer zoom">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fit_screen</span>
                </button>
              )}
            </div>

            {/* Connecting / empty overlays */}
            {connectingMode && (
              <div className="ri-overlay-info" onClick={(e) => e.stopPropagation()}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>timeline</span>
                <span>Modo conexión: haz clic en los puntos en orden. {connectingPath.length} punto(s).</span>
              </div>
            )}
            {points.length === 0 && !connectingMode && (
              <div className="ri-overlay-info ri-overlay-info--empty" onClick={(e) => e.stopPropagation()}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>touch_app</span>
                <span>Haz clic en el mapa para agregar el primer punto</span>
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div className="ri-side-panel">
            <div className="ri-side-tabs">
              <button className={`ri-side-tab${activeTab === "puntos" ? " ri-side-tab--active" : ""}`}
                onClick={() => setActiveTab("puntos")}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pin_drop</span>
                Puntos ({points.length})
              </button>
              <button className={`ri-side-tab${activeTab === "conexiones" ? " ri-side-tab--active" : ""}`}
                onClick={() => setActiveTab("conexiones")}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>timeline</span>
                Rutas ({connections.length})
              </button>
            </div>

            {activeTab === "puntos" && (
              <div className="ri-side-content">
                {editingPoint && (() => {
                  const pt = points.find((p) => p.id === editingPoint);
                  if (!pt) return null;
                  return (
                    <div className="ri-point-editor">
                      <h4 className="ri-point-editor-title">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                        Editar Punto
                      </h4>
                      <div className="ri-point-editor-field">
                        <label>Título</label>
                        <input className="admin-form-input" type="text" value={pt.titulo}
                          onChange={(e) => updatePointField(pt.id, "titulo", e.target.value)} placeholder="Nombre del punto" />
                      </div>
                      <div className="ri-point-editor-field">
                        <label>Descripción</label>
                        <textarea className="admin-form-input" value={pt.descripcion}
                          onChange={(e) => updatePointField(pt.id, "descripcion", e.target.value)}
                          placeholder="Descripción del lugar" rows={3} />
                      </div>
                      <div className="ri-point-editor-field">
                        <label>Imagen</label>
                        <div className="ri-img-input-row">
                          <input className="admin-form-input" type="text" value={pt.imagen_url}
                            onChange={(e) => updatePointField(pt.id, "imagen_url", e.target.value)}
                            placeholder="URL o sube una imagen..." style={{ flex: 1 }} />
                          <button type="button" className="admin-btn admin-btn--secondary ri-upload-btn"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingImg === pt.id}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                              {uploadingImg === pt.id ? "sync" : "cloud_upload"}
                            </span>
                          </button>
                        </div>
                        {pt.imagen_url && (
                          <div className="ri-img-preview">
                            <img src={pt.imagen_url} alt="Preview"
                              onError={(e) => { e.target.style.display = "none"; }} />
                          </div>
                        )}
                      </div>
                      <div className="ri-point-editor-field">
                        <label>Coordenadas</label>
                        <div className="ri-coords-row">
                          <span>X: {pt.x}%</span>
                          <span>Y: {pt.y}%</span>
                        </div>
                      </div>
                      <div className="ri-point-editor-actions">
                        <button className="admin-btn admin-btn--primary" type="button" onClick={savePointDetails} style={{ flex: 1 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> Listo
                        </button>
                        <button className="admin-btn admin-btn--ghost" type="button" onClick={() => handleDeletePoint(pt.id)}
                          style={{ color: "var(--error)", border: "1px solid rgba(180,40,40,0.2)" }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                      <p style={{ fontSize: 11, color: "#8b7b6a", margin: "8px 0 0", fontStyle: "italic" }}>
                        💡 También puedes arrastrar el punto directamente en el mapa
                      </p>
                    </div>
                  );
                })()}

                <div className="ri-point-list">
                  {points.length === 0 ? (
                    <div className="ri-empty-state">
                      <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3 }}>touch_app</span>
                      <p>Haz clic en el mapa para agregar puntos</p>
                    </div>
                  ) : (
                    points.map((point, idx) => (
                      <div key={point.id}
                        className={`ri-point-item${selectedPoint === point.id ? " ri-point-item--active" : ""}`}
                        onClick={() => { setSelectedPoint(point.id); setEditingPoint(point.id); }}>
                        <span className="ri-point-num" style={{ background: selectedPoint === point.id ? activeColors?.color : undefined }}>
                          {idx + 1}
                        </span>
                        <div className="ri-point-info">
                          <span className="ri-point-name">{point.titulo}</span>
                          <span className="ri-point-coords">{point.x}%, {point.y}%</span>
                        </div>
                        <span className="ri-point-drag" title="Arrastrar en el mapa">
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_with</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "conexiones" && (
              <div className="ri-side-content">
                <div className="ri-connections-header">
                  <button className={`admin-btn ${connectingMode ? "admin-btn--primary" : "admin-btn--secondary"}`}
                    type="button" onClick={toggleConnectingMode}
                    style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{connectingMode ? "close" : "timeline"}</span>
                    {connectingMode ? "Cancelar" : "Nueva Conexión"}
                  </button>
                  {connectingMode && connectingPath.length >= 2 && (
                    <button className="admin-btn admin-btn--primary" type="button" onClick={handleSaveConnection}
                      style={{ display: "flex", alignItems: "center", gap: 6, width: "100%", justifyContent: "center", marginTop: 8 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
                      Guardar Ruta ({connectingPath.length} puntos)
                    </button>
                  )}
                </div>

                {connectingMode && (
                  <div className="ri-connecting-info">
                    <p>Haz clic en los puntos del mapa en el orden de la ruta.</p>
                    <div className="ri-connecting-path">
                      {connectingPath.map((pid, idx) => {
                        const pt = points.find((p) => p.id === pid);
                        return <span key={pid} className="ri-connecting-step">{idx + 1}. {pt?.titulo || "?"}</span>;
                      })}
                    </div>
                  </div>
                )}

                <div className="ri-connections-list">
                  {connections.length === 0 ? (
                    <div className="ri-empty-state">
                      <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3 }}>timeline</span>
                      <p>No hay rutas. Crea una nueva conexión.</p>
                    </div>
                  ) : (
                    connections.map((conn, idx) => (
                      <div key={conn.id} className="ri-connection-item">
                        <div className="ri-connection-header">
                          <span className="ri-connection-name">{conn.nombre || `Ruta ${idx + 1}`}</span>
                          <button className="admin-topbar__icon-btn" type="button" onClick={() => handleDeleteConnection(conn.id)} style={{ color: "var(--error)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                          </button>
                        </div>
                        <div className="ri-connection-points">
                          {conn.puntos_orden?.map((pid, pidx) => {
                            const pt = points.find((p) => p.id === pid);
                            return (
                              <span key={pid} className="ri-connection-point-tag">
                                {pt?.titulo || pid}
                                {pidx < conn.puntos_orden.length - 1 && (
                                  <span className="material-symbols-outlined" style={{ fontSize: 12, marginLeft: 4 }}>arrow_forward</span>
                                )}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
