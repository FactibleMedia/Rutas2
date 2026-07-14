import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const ROLE_OPTIONS = [
  { value: "administrador", label: "Administrador", color: "var(--primary)" },
  { value: "editor", label: "Editor Cultural", color: "var(--secondary)" },
  { value: "viewer", label: "Lector / Revisor", color: "var(--tertiary)" },
];

function getRoleBadgeClass(role) {
  switch (role) {
    case "administrador": return "admin-badge--admin";
    case "editor": return "admin-badge--editor";
    case "viewer": return "admin-badge--viewer";
    default: return "";
  }
}

function getRoleLabel(role) {
  const option = ROLE_OPTIONS.find((o) => o.value === role);
  return option?.label || role;
}

function getInitials(name) {
  const parts = (name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  return parts.length ? parts.map((p) => p[0].toUpperCase()).join("") : "??";
}

function formatLastAccess(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchText, setSearchText] = useState("");
  const [updating, setUpdating] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("usuarios")
        .select("id, nombre, correo, avatar_url, rol, activo, ultimo_acceso, creado_en")
        .order("creado_en", { ascending: false });

      if (fetchError) throw fetchError;
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("No se pudieron cargar los usuarios. Verifica la conexión con Supabase.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    setSuccessMsg("");

    try {
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({ rol: newRole })
        .eq("id", userId);

      if (updateError) throw updateError;

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: newRole } : u))
      );

      // Log activity
      await supabase.from("actividad_admin").insert({
        usuario_id: userId,
        accion: `Rol actualizado a ${getRoleLabel(newRole)}`,
        detalle: `Cambio de rol vía panel de administración`,
        tipo: "configuracion",
      }).catch(() => {});

      setSuccessMsg("Rol actualizado correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Error updating role:", err);
      setError("No se pudo actualizar el rol.");
      setTimeout(() => setError(""), 3000);
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchText.trim()) return users;
    const q = searchText.toLowerCase();
    return users.filter(
      (u) =>
        (u.nombre || "").toLowerCase().includes(q) ||
        (u.correo || "").toLowerCase().includes(q)
    );
  }, [users, searchText]);

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Usuarios y Roles</h1>
            <p className="admin-page-header__subtitle">
              Gestión del concejo editorial y colaboradores culturales.
            </p>
          </div>
          <button
            className="admin-btn admin-btn--primary"
            type="button"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>person_add</span>
            Invitar Colaborador
          </button>
        </div>
      </div>

      {/* Feedback messages */}
      {successMsg && (
        <div style={{ padding: "12px 16px", borderRadius: "var(--radius-lg)", marginBottom: 24, fontSize: 14, fontWeight: 600, background: "rgba(58, 79, 49, 0.1)", color: "var(--tertiary)", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          {successMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-gutter)", alignItems: "start" }}>
        {/* Users Table Card */}
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div className="admin-card__header" style={{ background: "var(--surface-bright)", borderBottom: "1px solid var(--outline-variant)" }}>
            <h3 className="admin-card__title">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>groups</span>
              Usuarios ({users.length})
            </h3>
            <div style={{ position: "relative" }}>
              <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--on-surface-variant)", fontSize: 16 }}>search</span>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ padding: "8px 12px 8px 36px", background: "var(--surface-bright)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-lg)", fontFamily: "var(--font-body)", fontSize: 16, color: "var(--on-surface)", width: 256, outline: "none" }}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, display: "block", marginBottom: 12, animation: "spin 1s linear infinite" }}>sync</span>
              Cargando usuarios...
            </div>
          ) : error ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--error)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, display: "block", marginBottom: 12 }}>error_outline</span>
              <p>{error}</p>
              <button className="admin-btn admin-btn--secondary" type="button" onClick={fetchUsers} style={{ marginTop: 16 }}>
                Reintentar
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "var(--on-surface-variant)" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, display: "block", marginBottom: 12 }}>person_off</span>
              <p>{searchText ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios registrados en el sistema."}</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr style={{ background: "var(--surface-container)" }}>
                    <th>Usuario</th>
                    <th>Rol Asignado</th>
                    <th>Último Acceso</th>
                    <th style={{ textAlign: "right" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ transition: "background 0.2s" }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", border: "1px solid var(--outline-variant)", background: "var(--tertiary-container)", color: "var(--on-tertiary-container)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, overflow: "hidden", flexShrink: 0 }}>
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.nombre} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              getInitials(user.nombre)
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--on-surface)" }}>{user.nombre || "Sin nombre"}</div>
                            <div style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>{user.correo}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={user.rol}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={updating === user.id}
                          style={{ padding: "6px 12px", background: "var(--surface)", border: "1px solid var(--outline-variant)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-body)", fontSize: 14, color: "var(--on-surface)", outline: "none", cursor: "pointer", width: "100%", maxWidth: 180 }}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>
                        {formatLastAccess(user.ultimo_acceso)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button className="admin-topbar__icon-btn" type="button" style={{ borderRadius: "var(--radius-full)" }} disabled={updating === user.id}>
                          <span className="material-symbols-outlined">{updating === user.id ? "sync" : "more_vert"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: "16px 24px", borderTop: "1px solid var(--outline-variant)", background: "var(--surface-bright)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>
              {users.length > 0 ? `Mostrando 1 a ${filteredUsers.length} de ${users.length} usuarios` : "Sin datos"}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="admin-topbar__icon-btn" type="button" style={{ borderRadius: "var(--radius-sm)", opacity: 0.5 }} disabled>
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="admin-topbar__icon-btn" type="button" style={{ borderRadius: "var(--radius-sm)" }}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Roles Info Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="admin-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "var(--primary)" }} />
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <span className="material-symbols-outlined" style={{ color: "var(--secondary)" }}>admin_panel_settings</span>
              Jerarquía de Permisos
            </h3>
            <div className="admin-folk-divider" style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>✧</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, background: role.color }} />
                  <div>
                    <h4 style={{ fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", margin: "0 0 4px", color: "var(--on-surface)" }}>
                      {role.label}
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: "1.5", color: "var(--on-surface-variant)" }}>
                      {role.value === "administrador" && "Acceso total al sistema. Puede crear, modificar y eliminar rutas, invitar nuevos usuarios, cambiar roles y gestionar la configuración global."}
                      {role.value === "editor" && "Enfocado en el contenido. Puede crear y editar borradores de rutas, subir multimedia y actualizar información histórica. No puede gestionar usuarios."}
                      {role.value === "viewer" && "Acceso de solo lectura. Ideal para historiadores invitados o auditores que necesitan revisar el contenido antes de su publicación."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
