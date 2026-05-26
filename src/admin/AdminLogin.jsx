import { useEffect, useMemo, useState } from "react";
import {
  User,
  Lock,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Music,
  TreePine,
  Map,
  Coffee,
  LayoutDashboard,
  Image as ImageIcon,
  Map as MapIcon,
  Settings,
  LogOut,
  Search,
  Plus,
  MoreVertical,
  Bell,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearAdminSession, getAdminProfile, hasAdminSession, setAdminSession } from "./adminAuth";
import { DbConnection } from "./module_bindings";
import { ROUTE_META, getRouteCounts, removeMapLocation, resetMapLocations, setMapLocations, useMapLocations } from "../mapLocationsStore";
import "./AdminLogin.css";

const SPACETIME_URI =
  import.meta.env.VITE_SPACETIME_URI ||
  import.meta.env.VITE_SPACETIMEDB_HOST ||
  "https://maincloud.spacetimedb.com";
const SPACETIME_DB =
  import.meta.env.VITE_SPACETIME_DB ||
  import.meta.env.VITE_SPACETIMEDB_DB_NAME ||
  "rutasvallenatas-9wo5o";
const SPACETIME_TOKEN_KEY = "rutas_spacetime_token";

function getInitials(name) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return "AD";
  }

  return parts.map((part) => part[0].toUpperCase()).join("");
}

function authenticateAdmin(correo, password) {
  const email = correo.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    let resolved = false;
    let connection;

    const finish = (handler, payload) => {
      if (resolved) {
        return;
      }

      resolved = true;
      clearTimeout(timeoutId);

      if (connection) {
        connection.disconnect();
      }

      handler(payload);
    };

    const timeoutId = setTimeout(() => {
      finish(reject, new Error("Tiempo de espera agotado al validar credenciales."));
    }, 12000);

    connection = DbConnection.builder()
      .withUri(SPACETIME_URI)
      .withDatabaseName(SPACETIME_DB)
      .withToken(localStorage.getItem(SPACETIME_TOKEN_KEY) || undefined)
      .onConnect((_ctx, _identity, token) => {
        localStorage.setItem(SPACETIME_TOKEN_KEY, token);

        connection
          .subscriptionBuilder()
          .onApplied(() => {
            const usuarios = Array.from(connection.db.usuarios.iter());
            const usuarioValido = usuarios.find((usuario) => {
              return (
                usuario.correo.trim().toLowerCase() === email &&
                usuario.passwordHash === password &&
                usuario.rol === "administrador" &&
                usuario.activo
              );
            });

            if (!usuarioValido) {
              finish(reject, new Error("Correo o contraseña inválidos."));
              return;
            }

            finish(resolve, {
              name: usuarioValido.nombre,
              email: usuarioValido.correo,
              initials: getInitials(usuarioValido.nombre),
            });
          })
          .onError(() => {
            finish(reject, new Error("No se pudo leer la tabla de usuarios en Spacetime."));
          })
          .subscribe("SELECT * FROM usuarios");
      })
      .onConnectError((_ctx, error) => {
        finish(reject, error || new Error("No se pudo conectar con Spacetime."));
      })
      .build();
  });
}

const activity = [
  { item: 'Palabra "Zangandongo"', section: "Glosario", date: "Hoy, 10:42 AM", state: "Publicado" },
  { item: "Foto: Plaza Alfonso López", section: "Galería", date: "Ayer, 16:30 PM", state: "Publicado" },
  { item: 'Actualización "Ruta Mística"', section: "Mapas", date: "12 May 2024", state: "Borrador" },
];

function createLocationDraft(location = null) {
  const routeId = location?.routeId || "patrimonial";
  const categoryLabel = location?.categoryLabel || ROUTE_META[routeId].name.replace(/^Ruta\s*/, "");

  return {
    id: location?.id || "new-location",
    routeId,
    categoryLabel,
    name: location?.name || "",
    subtitle: location?.subtitle || "",
    description: location?.description || "",
    address: location?.address || "",
    costStatus: location?.costStatus || "",
    hours: location?.hours || "",
    audience: location?.audience || "",
    image: location?.image || "",
    longitude: String(location?.coordinates?.[0] ?? ""),
    latitude: String(location?.coordinates?.[1] ?? ""),
  };
}

export default function AdminLogin({ initialView = "login" }) {
  const navigate = useNavigate();
  const locations = useMapLocations();
  const initialState = initialView === "dashboard" || hasAdminSession() ? "dashboard" : "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [viewState, setViewState] = useState(initialState);
  const [selectedLocationId, setSelectedLocationId] = useState(locations[0]?.id || "");
  const [locationForm, setLocationForm] = useState(() => createLocationDraft(locations[0] || null));
  const [mapEditorMessage, setMapEditorMessage] = useState("");

  const routeCounts = useMemo(() => getRouteCounts(locations), [locations]);

  const dashboardStats = useMemo(() => {
    const activeRoutes = routeCounts.filter((route) => route.count > 0).length;

    return [
      { label: "Ubicaciones del Mapa", value: String(locations.length), tone: "green", icon: MapIcon },
      { label: "Rutas con contenido", value: String(activeRoutes), tone: "purple", icon: LayoutDashboard },
      { label: "Imágenes en Galería", value: "1,204", tone: "orange", icon: ImageIcon },
    ];
  }, [locations.length, routeCounts]);

  useEffect(() => {
    if (!locations.length) {
      setSelectedLocationId("");
      setLocationForm(createLocationDraft(null));
      return;
    }

    const selectedLocation = locations.find((location) => location.id === selectedLocationId) || locations[0];

    if (selectedLocation && selectedLocation.id !== selectedLocationId) {
      setSelectedLocationId(selectedLocation.id);
    }

    setLocationForm(createLocationDraft(selectedLocation));
  }, [locations, selectedLocationId]);

  const profile = useMemo(() => {
    return (
      getAdminProfile() || {
        name: "Admin Principal",
        email: "admin@valledupar.gov.co",
        initials: "AD",
      }
    );
  }, [viewState]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoading(true);

    try {
      const adminProfile = await authenticateAdmin(email, password);

      setIsLoading(false);
      setAdminSession(adminProfile);
      setViewState("transitioning");
      setTimeout(() => {
        setViewState("dashboard");
        navigate("/admin/panel", { replace: true });
      }, 1300);
    } catch (error) {
      setIsLoading(false);
      setAuthError(error?.message || "No se pudo iniciar sesión. Intenta de nuevo.");
    }
  };

  const handleLogout = () => {
    setViewState("transitioning");
    setTimeout(() => {
      clearAdminSession();
      localStorage.removeItem(SPACETIME_TOKEN_KEY);
      setEmail("");
      setPassword("");
      setAuthError("");
      setViewState("login");
      navigate("/admin", { replace: true });
    }, 900);
  };

  const handleSelectLocation = (location) => {
    setSelectedLocationId(location.id);
    setLocationForm(createLocationDraft(location));
    setMapEditorMessage(`Editando ${location.name}`);
  };

  const handleLocationFieldChange = (field, value) => {
    setLocationForm((previousForm) => ({
      ...previousForm,
      [field]: value,
      ...(field === "routeId" ? { categoryLabel: ROUTE_META[value]?.name.replace(/^Ruta\s*/, "") || previousForm.categoryLabel } : {}),
    }));
  };

  const handleSaveLocation = async (event) => {
    event.preventDefault();

    const parsedLongitude = Number.parseFloat(locationForm.longitude);
    const parsedLatitude = Number.parseFloat(locationForm.latitude);

    if (!locationForm.name.trim()) {
      setMapEditorMessage("El nombre es obligatorio.");
      return;
    }

    if (Number.isNaN(parsedLongitude) || Number.isNaN(parsedLatitude)) {
      setMapEditorMessage("Revisa las coordenadas longitude/latitude.");
      return;
    }

    const payload = {
      id:
        selectedLocationId ||
        (locationForm.id && locationForm.id !== "new-location" ? locationForm.id : `location-${Date.now()}`),
      routeId: ROUTE_META[locationForm.routeId] ? locationForm.routeId : "patrimonial",
      categoryLabel: locationForm.categoryLabel.trim() || ROUTE_META[locationForm.routeId]?.name.replace(/^Ruta\s*/, "") || "Patrimonial",
      name: locationForm.name.trim(),
      subtitle: locationForm.subtitle.trim(),
      description: locationForm.description.trim(),
      address: locationForm.address.trim(),
      costStatus: locationForm.costStatus.trim(),
      hours: locationForm.hours.trim(),
      audience: locationForm.audience.trim(),
      image: locationForm.image.trim(),
      coordinates: [parsedLongitude, parsedLatitude],
    };

    const currentLocations = locations.some((location) => location.id === payload.id)
      ? locations.map((location) => (location.id === payload.id ? payload : location))
      : [payload, ...locations];

    try {
      await setMapLocations(currentLocations);
      setSelectedLocationId(payload.id);
      setLocationForm(createLocationDraft(payload));
      setMapEditorMessage("Ubicacion guardada y sincronizada en Spacetime.");
    } catch {
      setMapEditorMessage("No se pudo guardar en Spacetime. Revisa la conexion.");
    }
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocationId) {
      return;
    }

    const locationToDelete = locations.find((location) => location.id === selectedLocationId);
    if (!locationToDelete) {
      return;
    }

    if (!window.confirm(`Eliminar ${locationToDelete.name}?`)) {
      return;
    }

    try {
      await removeMapLocation(selectedLocationId);
      setSelectedLocationId("");
      setLocationForm(createLocationDraft(null));
      setMapEditorMessage("Ubicacion eliminada.");
    } catch {
      setMapEditorMessage("No se pudo eliminar en Spacetime.");
    }
  };

  const handleNewLocation = () => {
    setSelectedLocationId("");
    setLocationForm(createLocationDraft(null));
    setMapEditorMessage("Creando una nueva ubicacion.");
  };

  const handleResetLocations = async () => {
    try {
      await resetMapLocations();
      setMapEditorMessage("Se restauraron las ubicaciones por defecto.");
    } catch {
      setMapEditorMessage("No se pudo restaurar en Spacetime.");
    }
  };

  return (
    <div className={`admin-login admin-login--${viewState}`}>
      <div className="admin-login__dome" />

      <div className={`admin-login__login-layer ${viewState === "login" ? "is-visible" : "is-hidden"}`}>
        <div className="admin-login__scene">
          <div className="admin-login__badge admin-login__badge--green">
            <Map size={32} className="admin-login__badge-icon" />
          </div>
          <div className="admin-login__badge admin-login__badge--orange">
            <Music size={30} className="admin-login__badge-icon" />
          </div>
          <div className="admin-login__badge admin-login__badge--yellow">
            <BookOpen size={34} className="admin-login__badge-icon" />
          </div>
          <div className="admin-login__badge admin-login__badge--red">
            <TreePine size={34} className="admin-login__badge-icon" />
          </div>
          <div className="admin-login__badge admin-login__badge--woven">
            <Coffee size={34} className="admin-login__badge-icon" />
          </div>
          <div className="admin-login__badge admin-login__badge--shield">
            <ShieldCheck size={34} className="admin-login__badge-icon" />
          </div>
        </div>

        <div className="admin-login__panel">
          <div className="admin-login__brand">
            <span className="font-serif-custom admin-login__brand-title">Portal</span>
            <span className="font-script-custom admin-login__brand-accent">Administrador</span>
          </div>
          <p className="admin-login__subtitle">
            Ingresa tus credenciales para gestionar el contenido y el acervo cultural de Valledupar.
          </p>

          <form onSubmit={handleLogin} className="admin-login__form">
            <label className="admin-login__field">
              <span className="admin-login__label">Correo electrónico</span>
              <div className="admin-login__input-group">
                <User size={18} className="admin-login__input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rutasvalledupar.com"
                  className="admin-login__input"
                  required
                />
              </div>
            </label>

            <label className="admin-login__field">
              <span className="admin-login__label">Contraseña</span>
              <div className="admin-login__input-group">
                <Lock size={18} className="admin-login__input-icon" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="admin-login__input"
                  required
                />
              </div>
            </label>

            <button type="submit" className="admin-login__submit" disabled={isLoading}>
              {isLoading ? <span className="admin-login__spinner" /> : "Iniciar sesión"}
              {!isLoading && <ArrowRight size={18} className="admin-login__submit-icon" />}
            </button>

            {authError ? <p className="admin-login__error">{authError}</p> : null}
          </form>

          <p className="admin-login__hint">Conectado a Spacetime: {SPACETIME_DB}</p>

          <div className="admin-login__footer">
            <a href="#" className="admin-login__link">¿Olvidaste tu contraseña?</a>
            <a href="/" className="admin-login__link">Volver al sitio</a>
          </div>
        </div>
      </div>

      <div className={`admin-dashboard ${viewState === "dashboard" ? "is-visible" : "is-hidden"}`}>
        <aside className="admin-dashboard__sidebar">
          <div>
            <div className="admin-dashboard__logo-wrap">
              <h1 className="admin-dashboard__logo">
                <span className="font-serif-custom">Portal</span>
                <span className="font-script-custom">Admin</span>
              </h1>
            </div>

            <nav className="admin-dashboard__nav">
              <a href="#" className="is-active"><LayoutDashboard size={18} /> Resumen</a>
              <a href="#"><BookOpen size={18} /> Glosario Vallenato</a>
              <a href="#"><MapIcon size={18} /> Rutas Turísticas</a>
              <a href="#mapas-admin"><MapIcon size={18} /> Ubicaciones del Mapa</a>
              <a href="#"><ImageIcon size={18} /> Galería</a>
            </nav>
          </div>

          <div className="admin-dashboard__sidebar-bottom">
            <a href="#"><Settings size={18} /> Configuración</a>
            <button type="button" onClick={handleLogout}><LogOut size={18} /> Cerrar Sesión</button>
          </div>
        </aside>

        <main className="admin-dashboard__content">
          <header className="admin-dashboard__header">
            <div className="admin-dashboard__search-wrap">
              <Search size={16} />
              <input type="text" placeholder="Buscar en el portal..." />
            </div>

            <div className="admin-dashboard__header-right">
              <button type="button" className="admin-dashboard__bell">
                <Bell size={17} />
                <span />
              </button>
              <div className="admin-dashboard__user">
                <div className="admin-dashboard__user-avatar">{profile.initials || "AD"}</div>
                <div>
                  <p>{profile.name || "Admin Principal"}</p>
                  <small>{profile.email || "admin@valledupar.gov.co"}</small>
                </div>
              </div>
            </div>
          </header>

          <div className="admin-dashboard__scroll">
            <section className="admin-dashboard__hero">
              <div>
                <h2>Bienvenido al Panel</h2>
                <p>Gestiona la información cultural y turística de Valledupar.</p>
              </div>
              <button type="button"><Plus size={16} /> Nueva Entrada</button>
            </section>

            <section id="mapas-admin" className="admin-dashboard__map-manager">
              <div className="admin-dashboard__map-manager-head">
                <div>
                  <h3>Ubicaciones del Mapa</h3>
                  <p>Edita puntos, rutas y popups. Los cambios se reflejan en vivo en la vista del mapa.</p>
                </div>
                <div className="admin-dashboard__map-manager-actions">
                  <button type="button" className="admin-dashboard__secondary-action" onClick={handleNewLocation}>
                    <Plus size={16} /> Nueva Ubicación
                  </button>
                  <button type="button" className="admin-dashboard__secondary-action" onClick={handleResetLocations}>
                    Restaurar Defaults
                  </button>
                </div>
              </div>

              <div className="admin-dashboard__map-manager-grid">
                <div className="admin-dashboard__location-list">
                  {locations.map((location) => (
                    <button
                      type="button"
                      key={location.id}
                      className={`admin-dashboard__location-card${selectedLocationId === location.id ? " is-active" : ""}`}
                      onClick={() => handleSelectLocation(location)}
                    >
                      <span className={`admin-dashboard__location-chip admin-dashboard__location-chip--${location.routeId}`} />
                      <div>
                        <strong>{location.name}</strong>
                        <p>{location.address}</p>
                      </div>
                      <small>{location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}</small>
                    </button>
                  ))}
                </div>

                <form className="admin-dashboard__location-form" onSubmit={handleSaveLocation}>
                  <div className="admin-dashboard__form-grid">
                    <label>
                      <span>Nombre</span>
                      <input type="text" value={locationForm.name} onChange={(event) => handleLocationFieldChange("name", event.target.value)} placeholder="Plaza Alfonso Lopez" />
                    </label>
                    <label>
                      <span>Ruta</span>
                      <select value={locationForm.routeId} onChange={(event) => handleLocationFieldChange("routeId", event.target.value)}>
                        {Object.values(ROUTE_META).map((route) => (
                          <option key={route.id} value={route.id}>{route.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Categoria</span>
                      <input type="text" value={locationForm.categoryLabel} onChange={(event) => handleLocationFieldChange("categoryLabel", event.target.value)} placeholder="Patrimonial" />
                    </label>
                    <label>
                      <span>Coordenada Longitud</span>
                      <input type="number" step="any" value={locationForm.longitude} onChange={(event) => handleLocationFieldChange("longitude", event.target.value)} placeholder="-73.2435" />
                    </label>
                    <label>
                      <span>Coordenada Latitud</span>
                      <input type="number" step="any" value={locationForm.latitude} onChange={(event) => handleLocationFieldChange("latitude", event.target.value)} placeholder="10.4631" />
                    </label>
                    <label>
                      <span>Imagen</span>
                      <input type="url" value={locationForm.image} onChange={(event) => handleLocationFieldChange("image", event.target.value)} placeholder="https://..." />
                    </label>
                    <label className="admin-dashboard__form-full">
                      <span>Subtitulo</span>
                      <input type="text" value={locationForm.subtitle} onChange={(event) => handleLocationFieldChange("subtitle", event.target.value)} placeholder="Descripcion corta para el popup" />
                    </label>
                    <label className="admin-dashboard__form-full">
                      <span>Descripcion</span>
                      <textarea value={locationForm.description} onChange={(event) => handleLocationFieldChange("description", event.target.value)} rows="3" placeholder="Descripcion larga del lugar" />
                    </label>
                    <label>
                      <span>Direccion</span>
                      <input type="text" value={locationForm.address} onChange={(event) => handleLocationFieldChange("address", event.target.value)} placeholder="Direccion exacta" />
                    </label>
                    <label>
                      <span>Costo</span>
                      <input type="text" value={locationForm.costStatus} onChange={(event) => handleLocationFieldChange("costStatus", event.target.value)} placeholder="Acceso Libre" />
                    </label>
                    <label>
                      <span>Horario</span>
                      <input type="text" value={locationForm.hours} onChange={(event) => handleLocationFieldChange("hours", event.target.value)} placeholder="7:00 AM a 6:00 PM" />
                    </label>
                    <label>
                      <span>Publico</span>
                      <input type="text" value={locationForm.audience} onChange={(event) => handleLocationFieldChange("audience", event.target.value)} placeholder="Familiar" />
                    </label>
                  </div>

                  <div className="admin-dashboard__form-actions">
                    <button type="submit" className="admin-dashboard__primary-action">Guardar Cambios</button>
                    <button type="button" className="admin-dashboard__secondary-action" onClick={handleDeleteLocation} disabled={!selectedLocationId}>Eliminar</button>
                  </div>

                  {mapEditorMessage ? <p className="admin-dashboard__form-message">{mapEditorMessage}</p> : null}
                </form>
              </div>
            </section>

            <section className="admin-dashboard__stats">
              {dashboardStats.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.label} className={`admin-dashboard__stat admin-dashboard__stat--${item.tone}`}>
                    <div className="admin-dashboard__stat-icon"><Icon size={20} /></div>
                    <p>{item.label}</p>
                    <h3>{item.value}</h3>
                  </article>
                );
              })}
            </section>

            <section className="admin-dashboard__table-card">
              <div className="admin-dashboard__table-head">
                <h3>Actividad Reciente</h3>
                <button type="button">Ver todo</button>
              </div>
              <div className="admin-dashboard__table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Elemento</th>
                      <th>Sección</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th aria-label="Acción" />
                    </tr>
                  </thead>
                  <tbody>
                    {activity.map((row) => (
                      <tr key={row.item}>
                        <td>{row.item}</td>
                        <td>{row.section}</td>
                        <td>{row.date}</td>
                        <td>
                          <span className={row.state === "Publicado" ? "state-published" : "state-draft"}>{row.state}</span>
                        </td>
                        <td>
                          <button type="button" className="admin-dashboard__row-action">
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
