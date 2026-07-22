import logoWhiteHero from "./assets/mcp/logo_white_hero.png";
import { Link } from "react-router-dom";
import "./TopBar.css";

const navItems = [
  { id: "inicio", label: "Inicio" },
  { id: "mapas", label: "Mapa", to: "/mapas" },
  { id: "glosario", label: "Glosario", to: "/glosario" },
  { id: "galeria", label: "Galeria", to: "/galeria" },
  { id: "footer", label: "Acerca de" },
];

export default function TopBar({ activeSection = "inicio", isAuthenticated = false, user = { name: "Usuario", initials: "UV" }, onSectionChange = () => {} }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="topbar__brand">
          <img src={logoWhiteHero} alt="Rutas de Valledupar" className="topbar__logo" />
        </div>

        <nav className="topbar__nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            item.to ? (
              <Link key={item.id} to={item.to} className={`topbar__link${activeSection === item.id ? " active" : ""}`}>
                {item.label}
              </Link>
            ) : (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={`topbar__link${activeSection === item.id ? " active" : ""}`}
                onClick={() => onSectionChange(item.id)}
              >
                {item.label}
              </a>
            )
          ))}
        </nav>

        <div className="topbar__actions">
          <button type="button" className="topbar__search-btn" aria-label="Buscar">
            <span className="topbar__search-icon" aria-hidden="true" />
          </button>

          {isAuthenticated ? (
            <>
              <button type="button" className="topbar__menu-btn" aria-label="Abrir menú">
                <span className="topbar__menu-line" />
                <span className="topbar__menu-line" />
                <span className="topbar__menu-line" />
              </button>
              <div className="topbar__avatar" title={user.name}>
                {user.initials}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="topbar__btn topbar__btn--secondary">
                Iniciar sesión
              </button>
              <button type="button" className="topbar__btn topbar__btn--primary">
                Regístrate
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
