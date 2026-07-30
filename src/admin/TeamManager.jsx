import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { isNetworkError, getUserFriendlyError } from "./adminHelpers";

const STORAGE_BUCKET = "equipo-acerca";

const EMPTY_FORM = {
  nombre: "",
  apodo: "",
  cargo: "",
  foto_url: "",
  orden: 0,
};

/* =========================================================
   Upload helper – sube foto al bucket equipo-acerca
   ========================================================= */

async function uploadPhoto(file) {
  const ext = file.name.split(".").pop();
  const fileName = `team/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

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

function ImageUpload({ label, value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadPhoto(file);
      onChange(url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir la foto. Intenta de nuevo.");
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
          accept="image/*"
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
            width: 120,
            height: 120,
            objectFit: "cover",
            borderRadius: "50%",
            border: "3px solid var(--outline-variant)",
          }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
    </div>
  );
}

/* =========================================================
   TeamManager Component
   ========================================================= */

export default function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [deleting, setDeleting] = useState(null);
  const [networkError, setNetworkError] = useState("");

  // Fetch members
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setNetworkError("");
    try {
      const { data, error } = await supabase
        .from("equipo_acerca")
        .select("*")
        .order("orden", { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.warn("Error fetching team:", err);
      if (isNetworkError(err)) {
        setNetworkError("No hay conexión a internet.");
      } else {
        setMessage({ type: "error", text: getUserFriendlyError(err) });
      }
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleEdit = (member) => {
    setForm({
      nombre: member.nombre || "",
      apodo: member.apodo || "",
      cargo: member.cargo || "",
      foto_url: member.foto_url || "",
      orden: member.orden || 0,
    });
    setEditingId(member.id);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  const handleNew = () => {
    setForm({
      ...EMPTY_FORM,
      orden: members.length,
    });
    setEditingId(null);
    setShowForm(true);
    setMessage({ type: "", text: "" });
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`¿Eliminar a "${member.nombre}" del equipo?`)) return;
    setDeleting(member.id);
    try {
      const { error } = await supabase
        .from("equipo_acerca")
        .delete()
        .eq("id", member.id);
      if (error) throw error;
      setMessage({ type: "success", text: `"${member.nombre}" eliminado del equipo.` });
      fetchMembers();
    } catch (err) {
      setMessage({
        type: "error",
        text: isNetworkError(err)
          ? "Operación cancelada: no hay conexión."
          : getUserFriendlyError(err),
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setMessage({ type: "error", text: "El nombre es obligatorio." });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    const row = {
      nombre: form.nombre.trim(),
      apodo: form.apodo.trim(),
      cargo: form.cargo.trim(),
      foto_url: form.foto_url.trim(),
      orden: typeof form.orden === "number" ? form.orden : parseInt(form.orden, 10) || 0,
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from("equipo_acerca")
          .update({ ...row, actualizado_en: new Date().toISOString() })
          .eq("id", editingId);
        if (error) throw error;
        setMessage({ type: "success", text: `"${form.nombre}" actualizado.` });
      } else {
        const { error } = await supabase.from("equipo_acerca").insert(row);
        if (error) throw error;
        setMessage({ type: "success", text: `"${form.nombre}" agregado al equipo.` });
      }

      setShowForm(false);
      fetchMembers();
    } catch (err) {
      setMessage({
        type: "error",
        text: isNetworkError(err)
          ? "No se pudo guardar: sin conexión."
          : getUserFriendlyError(err),
      });
    } finally {
      setSaving(false);
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.activo !== false).length,
  }), [members]);

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Equipo «Acerca de»</h1>
            <p className="admin-page-header__subtitle">
              {stats.active} miembro(s) activo(s) · {stats.total} total
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
              Nuevo Miembro
            </button>
          )}
        </div>
      </div>

      {/* Network error banner */}
      {networkError && (
        <div style={{
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
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, flexShrink: 0 }}>wifi_off</span>
          <span style={{ flex: 1 }}>{networkError}</span>
          <button
            type="button"
            onClick={() => { setNetworkError(""); fetchMembers(); }}
            className="admin-btn admin-btn--secondary"
            style={{ padding: "6px 14px", fontSize: 12, minHeight: 0, whiteSpace: "nowrap", flexShrink: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
            Reintentar
          </button>
        </div>
      )}

      {message.text && (
        <div style={{
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
        }}>
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

      {showForm ? (
        /* ===== FORM ===== */
        <div className="admin-card" style={{ padding: 32 }}>
          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700,
            margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8,
          }}>
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>
              {editingId ? "edit" : "person_add"}
            </span>
            {editingId ? "Editar Miembro del Equipo" : "Nuevo Miembro del Equipo"}
          </h3>

          <form onSubmit={handleSave}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
              {/* Foto */}
              <ImageUpload
                label="Foto del Miembro"
                value={form.foto_url}
                onChange={(val) => setForm((p) => ({ ...p, foto_url: val }))}
              />

              {/* Nombre */}
              <div className="admin-form-group">
                <label className="admin-form-label">Nombre *</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Stephanie De Castro"
                  required
                />
              </div>

              {/* Apodo */}
              <div className="admin-form-group">
                <label className="admin-form-label">Apodo</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.apodo}
                  onChange={(e) => setForm((p) => ({ ...p, apodo: e.target.value }))}
                  placeholder="Ej: (CEPPEP)"
                />
              </div>

              {/* Cargo */}
              <div className="admin-form-group">
                <label className="admin-form-label">Cargo en el Proyecto</label>
                <input
                  className="admin-form-input"
                  type="text"
                  value={form.cargo}
                  onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))}
                  placeholder="Ej: Docente Líder De Investigación"
                />
              </div>

              {/* Orden */}
              <div className="admin-form-group">
                <label className="admin-form-label">Orden</label>
                <input
                  className="admin-form-input"
                  type="number"
                  min="0"
                  value={form.orden}
                  onChange={(e) => setForm((p) => ({ ...p, orden: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="0"
                />
              </div>

              {/* Botones */}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  type="submit"
                  className="admin-btn admin-btn--primary"
                  disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  {saving ? (
                    <span style={{
                      width: 16, height: 16,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "white",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }} />
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
          </form>
        </div>
      ) : (
        /* ===== TABLE ===== */
        loading ? (
          <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 12, display: "block", animation: "spin 1s linear infinite" }}>sync</span>
            <p>Cargando equipo...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="admin-card" style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 64, opacity: 0.3, marginBottom: 16, display: "block" }}>groups</span>
            <p>Aún no hay miembros en el equipo.</p>
            <button className="admin-btn admin-btn--secondary" type="button" onClick={handleNew} style={{ marginTop: 16 }}>
              Agregar primer miembro
            </button>
          </div>
        ) : (
          <div className="admin-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 60 }}>#</th>
                    <th style={{ width: 80 }}>Foto</th>
                    <th>Nombre</th>
                    <th>Apodo</th>
                    <th>Cargo</th>
                    <th>Orden</th>
                    <th style={{ width: 100 }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, idx) => (
                    <tr key={member.id}>
                      <td data-label="#" style={{ color: "var(--outline)", fontSize: 12 }}>{idx + 1}</td>
                      <td data-label="Foto">
                        {member.foto_url ? (
                          <img
                            src={member.foto_url}
                            alt=""
                            style={{ width: 44, height: 44, objectFit: "cover", borderRadius: "50%" }}
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div style={{
                            width: 44, height: 44, borderRadius: "50%",
                            background: "var(--surface-dim)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            fontSize: 16, color: "var(--on-surface-variant)",
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>person</span>
                          </div>
                        )}
                      </td>
                      <td data-label="Nombre" style={{ fontWeight: 700 }}>{member.nombre}</td>
                      <td data-label="Apodo" style={{ color: "var(--on-surface-variant)" }}>
                        {member.apodo || "—"}
                      </td>
                      <td data-label="Cargo" style={{ fontSize: 13 }}>{member.cargo || "—"}</td>
                      <td data-label="Orden">
                        <span className="admin-badge admin-badge--draft">{member.orden}</span>
                      </td>
                      <td data-label="Acciones">
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="admin-topbar__icon-btn"
                            type="button"
                            title="Editar"
                            onClick={() => handleEdit(member)}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>edit</span>
                          </button>
                          <button
                            className="admin-topbar__icon-btn"
                            type="button"
                            title="Eliminar"
                            style={{ color: "var(--error)" }}
                            onClick={() => handleDelete(member)}
                            disabled={deleting === member.id}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                              {deleting === member.id ? "hourglass_top" : "delete"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </>
  );
}
