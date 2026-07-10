import { useState } from "react";

const MOCK_USERS = [
  {
    id: "1",
    name: "María Antonia Vargas",
    email: "mvargas@rutasvallenatas.co",
    role: "administrador",
    initials: "MA",
    lastAccess: "Hoy, 09:42 AM",
    avatar: null,
  },
  {
    id: "2",
    name: "Carlos Arturo Pimienta",
    email: "cpimienta@rutasvallenatas.co",
    role: "editor",
    initials: "CP",
    lastAccess: "Ayer, 16:30 PM",
    avatar: null,
  },
  {
    id: "3",
    name: "Lucía Gómez (Invitada)",
    email: "lucia.gomez@universidad.edu.co",
    role: "viewer",
    initials: "LG",
    lastAccess: "24 Oct, 11:15 AM",
    avatar: null,
  },
  {
    id: "4",
    name: "Elena Restrepo",
    email: "erestrepo@rutasvallenatas.co",
    role: "editor",
    initials: "ER",
    lastAccess: "22 Oct, 08:00 AM",
    avatar: null,
  },
];

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

export default function UserManager() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchText, setSearchText] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      !searchText.trim() ||
      u.name.toLowerCase().includes(searchText.toLowerCase()) ||
      u.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleRoleChange = (userId, newRole) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  return (
    <>
      <div className="admin-page-header">
        <div className="admin-page-header__top">
          <div>
            <h1 className="admin-page-header__title">Directorio de Accesos</h1>
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

      {/* Main content: Bento grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-gutter)", alignItems: "start" }}>
        {/* Users Table Card */}
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div
            className="admin-card__header"
            style={{
              background: "var(--surface-bright)",
              borderBottom: "1px solid var(--outline-variant)",
            }}
          >
            <h3 className="admin-card__title">
              <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>groups</span>
              Usuarios Activos
            </h3>
            <div style={{ position: "relative" }}>
              <span
                className="material-symbols-outlined"
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--on-surface-variant)",
                  fontSize: 16,
                }}
              >
                search
              </span>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  padding: "8px 12px 8px 36px",
                  background: "var(--surface-bright)",
                  border: "1px solid var(--outline-variant)",
                  borderRadius: "var(--radius-lg)",
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  color: "var(--on-surface)",
                  width: 256,
                  outline: "none",
                }}
              />
            </div>
          </div>

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
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            border: "1px solid var(--outline-variant)",
                            background: user.avatar ? "transparent" : "var(--tertiary-container)",
                            color: "var(--on-tertiary-container)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: 16,
                            overflow: "hidden",
                            flexShrink: 0,
                          }}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            user.initials
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--on-surface)" }}>{user.name}</div>
                          <div style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        style={{
                          padding: "6px 12px",
                          background: "var(--surface)",
                          border: "1px solid var(--outline-variant)",
                          borderRadius: "var(--radius-sm)",
                          fontFamily: "var(--font-body)",
                          fontSize: 14,
                          color: "var(--on-surface)",
                          outline: "none",
                          cursor: "pointer",
                          width: "100%",
                          maxWidth: 180,
                        }}
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>{user.lastAccess}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="admin-topbar__icon-btn"
                        type="button"
                        style={{ borderRadius: "var(--radius-full)" }}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--outline-variant)",
              background: "var(--surface-bright)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 14, color: "var(--on-surface-variant)" }}>
              Mostrando 1 a {filteredUsers.length} de {users.length} usuarios
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                className="admin-topbar__icon-btn"
                type="button"
                style={{ borderRadius: "var(--radius-sm)", opacity: 0.5, cursor: "not-allowed" }}
                disabled
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button className="admin-topbar__icon-btn" type="button" style={{ borderRadius: "var(--radius-sm)" }}>
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Permissions Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className="admin-card" style={{ padding: 24, position: "relative", overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "var(--primary)",
              }}
            />
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 600,
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ color: "var(--secondary)" }}>
                admin_panel_settings
              </span>
              Jerarquía de Permisos
            </h3>

            <div className="admin-folk-divider" style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>✧</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {ROLE_OPTIONS.map((role) => (
                <div key={role.value} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      marginTop: 6,
                      flexShrink: 0,
                      background: role.color,
                    }}
                  />
                  <div>
                    <h4
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        margin: "0 0 4px",
                        color: "var(--on-surface)",
                      }}
                    >
                      {role.label}
                    </h4>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: "1.5", color: "var(--on-surface-variant)" }}>
                      {role.value === "administrador" &&
                        "Acceso total al sistema. Puede crear, modificar y eliminar rutas, invitar nuevos usuarios, cambiar roles y gestionar la configuración global."}
                      {role.value === "editor" &&
                        "Enfocado en el contenido. Puede crear y editar borradores de rutas, subir multimedia y actualizar información histórica. No puede gestionar usuarios."}
                      {role.value === "viewer" &&
                        "Acceso de solo lectura. Ideal para historiadores invitados o auditores que necesitan revisar el contenido antes de su publicación."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Card */}
          <div className="admin-card" style={{ padding: 24 }}>
            <h4
              style={{
                fontFamily: "var(--font-body)",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.05em",
                margin: "0 0 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--on-surface-variant)" }}>
                history
              </span>
              Actividad Reciente
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface-container)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>manage_accounts</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--on-surface)" }}>
                    María Antonia actualizó el rol de Carlos Arturo
                  </p>
                  <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>Hace 2 horas</span>
                </div>
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface-container)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: "var(--on-surface)" }}>
                    Invitación enviada a Lucía Gómez
                  </p>
                  <span style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>24 Octubre</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
