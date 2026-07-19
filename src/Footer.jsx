import { Link } from "react-router-dom";
import logoFooter from "./assets/mcp/logo_footer.png";
import iconInstagram from "./assets/mcp/icon_instagram.png";
import iconYoutube from "./assets/mcp/icon_youtube.png";
import iconLocation from "./assets/mcp/icon_location.png";
import iconMail from "./assets/mcp/icon_mail.png";
import "./Footer.css";

export default function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="footer__grid">
        <div>
          <img src={logoFooter} alt="Rutas de Valledupar" className="footer__logo" />
          <p className="footer__desc">
            Un proyecto turistico-cultural para explorar y preservar la identidad de Valledupar, capital mundial del vallenato.
          </p>
          <div className="footer__socials">
            <a href="https://www.instagram.com/rutasvalledupar" target="_blank" rel="noreferrer" className="footer__social-btn">
              <img src={iconInstagram} alt="Instagram" />
            </a>
            <a href="https://www.youtube.com/@RutasValledupar" target="_blank" rel="noreferrer" className="footer__social-btn">
              <img src={iconYoutube} alt="YouTube" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="footer__col-title">Explorar</h3>
          <Link to="/mapas" className="footer__link">
            Ruta Patrimonial
          </Link>
          <Link to="/mapas" className="footer__link">
            Ruta Gastronomica
          </Link>
          <Link to="/mapas" className="footer__link">
            Ruta Mistica
          </Link>
          <Link to="/glosario" className="footer__link">
            Glosario vallenato
          </Link>
          <a href="/inicio#galeria" className="footer__link">
            Galeria
          </a>
        </div>

        <div>
          <h3 className="footer__col-title">Informacion</h3>
          <a href="#terminos" className="footer__link">
            Terminos de uso
          </a>
        </div>

        <div>
          <h3 className="footer__col-title">Contacto</h3>
          <div className="footer__contact-item">
            <img src={iconLocation} alt="Ubicacion" />
            <span>Valledupar, Cesar, Colombia</span>
          </div>
          <div className="footer__contact-item">
            <img src={iconMail} alt="Email" />
            <span>rutasvalledupar@gmail.com</span>
          </div>
        </div>
      </div>

      <div className="footer__divider">
        <p className="footer__copy">© 2026 Rutas de Valledupar. Todos los derechos reservados. Hecho con amor en Colombia.</p>
        <button className="footer__back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba">
          ↑
        </button>
      </div>
    </footer>
  );
}
