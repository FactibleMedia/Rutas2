import { useEffect, useMemo, useState } from "react";
import { Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import logoProject from "./assets/mcp/logo_white_hero.png";
import constructionBg from "./assets/mcp/hero_centro.png";
import "./construction.css";

function calculateTimeLeft(targetDate) {
  const difference = +targetDate - +new Date();

  if (difference <= 0) {
    return null;
  }

  return {
    dias: Math.floor(difference / (1000 * 60 * 60 * 24)),
    horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((difference / 1000 / 60) % 60),
    segundos: Math.floor((difference / 1000) % 60),
  };
}

export default function ConstructionApp() {
  const targetDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  }, []);

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const timerKeys = ["dias", "horas", "minutos", "segundos"];

  return (
    <div className="construction-page">
      <header className="construction-header">
        <img src={logoProject} alt="Rutas de Valledupar" className="construction-logo" loading="eager" fetchPriority="high" />
      </header>

      <main className="construction-hero">
        <div className="hero-backdrop" style={{ backgroundImage: `url(${constructionBg})` }} />
        <div className="hero-overlay" />

        <section className="hero-content">
          <div className="pin-chip" aria-hidden="true">
            <MapPin size={30} />
          </div>

          <h1>
            Estamos trabajando
            <br />
            <span>por Valledupar</span>
          </h1>

          <p>
            Pronto podras recorrer las rutas del viejo Valle. Mantendremos la herencia viva de un patrimonio que todavia se conserva.
          </p>

          <div className="countdown-grid" role="timer" aria-live="polite">
            {timeLeft ? (
              timerKeys.map((key) => (
                <div key={key} className="countdown-item">
                  <div className="count-value">{String(timeLeft[key]).padStart(2, "0")}</div>
                  <span>{key}</span>
                </div>
              ))
            ) : (
              <div className="live-pill">Ya estamos en vivo</div>
            )}
          </div>
        </section>
      </main>

      <section className="construction-footer">
        <div className="footer-content">
          <h2>Mantente Informado</h2>
          <p>Dejanos tu correo y se el primero en explorar la Ruta Patrimonial, Mistica y Gastronomica.</p>

          <form className="notify-form" onSubmit={(e) => e.preventDefault()}>
            <label className="input-wrap" htmlFor="email-notify">
              <Mail size={18} />
              <input id="email-notify" type="email" placeholder="Tu correo electronico" required />
            </label>
            <button type="submit">Notificarme</button>
          </form>

          <div className="socials-row">
            <a href="#" aria-label="Instagram">
              <span>IG</span>
            </a>
            <a href="#" aria-label="Facebook">
              <span>FB</span>
            </a>
          </div>
        </div>
      </section>

      <Link to="/demo" className="demo-access">
        Acceso demo
      </Link>
    </div>
  );
}
