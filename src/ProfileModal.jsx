import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabaseClient";
import "./ProfileModal.css";

/* =========================================================
   PROFILE MODAL – Edit profile, upload avatar
   ========================================================= */

const AVATARS_BUCKET = "avatars-perfil";

export default function ProfileModal({ onClose, onProfileUpdate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile form state
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    rol: "",
    ubicacion: "",
    biografia: "",
    foto_perfil: "",
  });

  const fileInputRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  // Load profile on mount
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError("No se pudo obtener la sesión del usuario.");
          setLoading(false);
          return;
        }

        const uid = user.id;
        if (cancelled) return;
        setUserId(uid);

        // Try perfiles_usuario first (regular users)
        const { data: perfil, error: perfilError } = await supabase
          .from("perfiles_usuario")
          .select("*")
          .eq("id", uid)
          .maybeSingle();

        if (perfil) {
          setForm({
            nombre: perfil.nombre || "",
            apellido: perfil.apellido || "",
            email: perfil.email || user.email || "",
            rol: "Usuario",
            ubicacion: perfil.ubicacion || "",
            biografia: perfil.biografia || "",
            foto_perfil: perfil.foto_perfil || "",
          });
          if (perfil.foto_perfil) {
            setAvatarUrl(perfil.foto_perfil);
          }
        } else {
          // Fallback: try usuarios table (admin users)
          const { data: adminProfile } = await supabase
            .from("usuarios")
            .select("*")
            .eq("id", uid)
            .maybeSingle();

          if (adminProfile) {
            setForm({
              nombre: adminProfile.nombre || "",
              apellido: "",
              email: adminProfile.correo || user.email || "",
              rol: adminProfile.rol === "administrador" ? "Administrador" : adminProfile.rol || "Usuario",
              ubicacion: "",
              biografia: "",
              foto_perfil: adminProfile.avatar_url || "",
            });
            if (adminProfile.avatar_url) {
              setAvatarUrl(adminProfile.avatar_url);
            }
          } else {
            // No profile found at all
            setForm((prev) => ({ ...prev, email: user.email || "" }));
          }
        }
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Error al cargar el perfil.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  }, []);

  // Upload avatar file to Supabase Storage
  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Solo se permiten JPG, PNG, WebP o GIF.");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen no puede superar los 2 MB.");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${userId}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(filePath);

      const publicUrl = urlData?.publicUrl || "";
      if (!publicUrl) throw new Error("No se pudo obtener la URL pública.");

      setAvatarUrl(publicUrl);
      setForm((prev) => ({ ...prev, foto_perfil: publicUrl }));
      setSuccess("Foto subida correctamente.");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError(err.message || "Error al subir la imagen.");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [userId]);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();
    if (!userId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Check if user exists in perfiles_usuario
      const { data: existing } = await supabase
        .from("perfiles_usuario")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      const profileData = {
        nombre: form.nombre,
        apellido: form.apellido,
        ubicacion: form.ubicacion,
        biografia: form.biografia,
        foto_perfil: form.foto_perfil,
        ultimo_acceso: new Date().toISOString(),
      };

      if (existing) {
        // Update existing profile in perfiles_usuario
        const { error: updateError } = await supabase
          .from("perfiles_usuario")
          .update(profileData)
          .eq("id", userId);

        if (updateError) throw updateError;

        // Also sync avatar to usuarios table if user is admin
        const { data: adminCheck } = await supabase
          .from("usuarios")
          .select("id")
          .eq("id", userId)
          .eq("rol", "administrador")
          .maybeSingle();

        if (adminCheck) {
          const { error: syncError } = await supabase
            .from("usuarios")
            .update({ avatar_url: form.foto_perfil })
            .eq("id", userId);

          if (syncError) {
            console.warn("No se pudo sincronizar avatar con tabla usuarios:", syncError.message);
          }
        }
      } else {
        // Check if user is in usuarios table (admin)
        const { data: adminCheck } = await supabase
          .from("usuarios")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (adminCheck) {
          // Update admin's avatar_url in usuarios table
          const { error: adminUpdateError } = await supabase
            .from("usuarios")
            .update({
              nombre: form.nombre,
              avatar_url: form.foto_perfil,
            })
            .eq("id", userId);

          if (adminUpdateError) throw adminUpdateError;
        } else {
          // Insert new profile (shouldn't happen but handle gracefully)
          const { error: insertError } = await supabase
            .from("perfiles_usuario")
            .insert({
              id: userId,
              nombre: form.nombre,
              apellido: form.apellido,
              email: form.email,
              ubicacion: form.ubicacion,
              biografia: form.biografia,
              foto_perfil: form.foto_perfil,
            });

          if (insertError) throw insertError;
        }
      }

      const fullName = `${form.nombre} ${form.apellido}`.trim() || form.email;
      setSuccess("¡Cambios guardados exitosamente!");

      // Notify parent to update session
      onProfileUpdate({
        name: fullName,
        avatar: form.foto_perfil,
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Error al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }, [userId, form, onProfileUpdate]);

  const initials = (form.nombre?.[0] || "") + (form.apellido?.[0] || "");
  const displayInitials = initials || form.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="profile-modal__overlay" onClick={onClose}>
      <div className="profile-modal__card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="profile-modal__header">
          <div className="profile-modal__header-left">
            <svg className="profile-modal__header-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h2 className="profile-modal__header-title">Información del Perfil</h2>
          </div>
          <button className="profile-modal__close" onClick={onClose} aria-label="Cerrar">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="profile-modal__body" style={{ alignItems: "center", justifyContent: "center", minHeight: 300 }}>
            <span className="profile-modal__spinner" />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#888", marginTop: 12 }}>
              Cargando perfil...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="profile-modal__body">
              {/* Notification */}
              {error && (
                <div className="profile-modal__notification profile-modal__notification--error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="profile-modal__notification">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {success}
                </div>
              )}

              {/* Avatar row */}
              <div className="profile-modal__avatar-row">
                <div
                  className="profile-modal__avatar"
                  style={avatarUrl ? { background: "transparent" } : { background: "#E27D15" }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Foto de perfil" />
                  ) : (
                    <span>{displayInitials}</span>
                  )}
                </div>
                <div className="profile-modal__avatar-actions">
                  <button
                    type="button"
                    className="profile-modal__btn-change-photo"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Subiendo..." : "Cambiar Foto"}
                  </button>
                  <span className="profile-modal__avatar-hint">JPG, PNG, WebP o GIF. Máx 2 MB.</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="profile-modal__file-input"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Grid fields */}
              <div className="profile-modal__grid">
                {/* Nombre */}
                <div className="profile-modal__field">
                  <label className="profile-modal__label">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    className="profile-modal__input"
                    placeholder="Tu nombre"
                  />
                </div>

                {/* Apellido */}
                <div className="profile-modal__field">
                  <label className="profile-modal__label">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChange}
                    className="profile-modal__input"
                    placeholder="Tu apellido"
                  />
                </div>

                {/* Email (disabled - no editable) */}
                <div className="profile-modal__field">
                  <label className="profile-modal__label">Correo Electrónico</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="profile-modal__input profile-modal__input--disabled"
                  />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#aaa" }}>
                    No se puede modificar el correo electrónico.
                  </span>
                </div>

                {/* Rol (disabled - no editable) */}
                <div className="profile-modal__field">
                  <label className="profile-modal__label">Rol</label>
                  <input
                    type="text"
                    value={form.rol}
                    disabled
                    className="profile-modal__input profile-modal__input--disabled"
                  />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: "#aaa" }}>
                    El rol es asignado por un administrador.
                  </span>
                </div>
              </div>

              {/* Ubicación (full width) */}
              <div className="profile-modal__field profile-modal__field--full">
                <label className="profile-modal__label">Ubicación</label>
                <input
                  type="text"
                  name="ubicacion"
                  value={form.ubicacion}
                  onChange={handleChange}
                  className="profile-modal__input"
                  placeholder="Ej: Valledupar, Colombia"
                />
              </div>

              {/* Biografía (full width) */}
              <div className="profile-modal__field profile-modal__field--full">
                <label className="profile-modal__label">Biografía</label>
                <textarea
                  name="biografia"
                  rows="3"
                  value={form.biografia}
                  onChange={handleChange}
                  className="profile-modal__textarea"
                  placeholder="Escribe algo sobre ti..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="profile-modal__footer">
              <button
                type="button"
                className="profile-modal__btn-cancel"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="profile-modal__btn-save"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="profile-modal__spinner" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
