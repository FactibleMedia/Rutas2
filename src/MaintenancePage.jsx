import logoWhite from "./assets/mcp/logo_white_hero.png";
import ctaBgMap from "./assets/mcp/cta_bg_mapa_gastronomico.webp";
import iconInstagram from "./assets/mcp/icon_instagram.svg";
import iconYoutube from "./assets/mcp/icon_youtube.svg";
import "./MaintenancePage.css";

export default function MaintenancePage() {
  return (
    <div className="maintenance">
      <div className="maintenance__map" aria-hidden="true">
        <img src={ctaBgMap} alt="" />
      </div>
      <div className="maintenance__content">
        <img className="maintenance__logo" src={logoWhite} alt="Rutas de Valledupar" />
        <h1 className="maintenance__message">
          Muy pronto podrás recorrer nuestro patrimonio vivo
        </h1>
        <div className="maintenance__pulse" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="maintenance__socials">
          <a href="https://www.instagram.com/rutasvalledupar" target="_blank" rel="noreferrer" aria-label="Instagram">
            <img src={iconInstagram} alt="" />
          </a>
          <a href="https://www.youtube.com/@RutasValledupar" target="_blank" rel="noreferrer" aria-label="YouTube">
            <img src={iconYoutube} alt="" />
          </a>
        </div>
      </div>
    </div>
  );
}
