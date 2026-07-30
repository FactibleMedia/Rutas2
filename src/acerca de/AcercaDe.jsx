import { useState } from "react";
import TopBar from "../TopBar";
import Footer from "../Footer";
import iconInstagram from "../assets/mcp/icon_instagram.png";
import iconMail from "../assets/mcp/icon_mail.png";
import "./AcercaDe.css";

/* =========================================================
   DATA – Team members
   ========================================================= */

const teamMembers = [
  {
    name: "Stephanie De Castro",
    role: "Docente Líder De Investigación",
    org: "(CEPPEP)",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Ana Karina González",
    role: "Directora De Unidad Editorial",
    org: "(Amo Paz)",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Carlos Andrés Pérez",
    role: "Gestor de contenido multimedia",
    org: "",
    image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=600&q=80",
  },
];

/* =========================================================
   COMPONENTS – Reusable decorative elements
   ========================================================= */

/** Pattern border with orange flower/star motif (CSS data-URI based) */
function PatternBorder({ top, bottom, left, right }) {
  return (
    <>
      {top && <div className="acerca-pattern-border acerca-pattern-border--top" />}
      {bottom && <div className="acerca-pattern-border acerca-pattern-border--bottom" />}
      {left && <div className="acerca-pattern-border acerca-pattern-border--left" />}
      {right && <div className="acerca-pattern-border acerca-pattern-border--right" />}
    </>
  );
}

/* =========================================================
   SECTION 1 – Hero Header (con logo, baldosas y patrones de fondo)
   ========================================================= */

function HeroHeader() {
  return (
    <header className="acerca-hero">
      {/* Patrones de fondo: izquierdo y derecho */}
      <div className="acerca-hero__bg-left" />
      <div className="acerca-hero__bg-right" />

      <div className="acerca-hero__inner">
        <div className="acerca-hero__brand">
          {/* Baldosa naranja izquierda */}
          <div className="acerca-hero__tile">
            <img src="/assets/acerca/Baldosa Naranja.png" alt="" />
          </div>

          {/* Logo central */}
          <div className="acerca-hero__logo">
            <img src="/assets/acerca/Logo2.png" alt="Rutas de Valledupar" />
          </div>

          {/* Baldosa naranja derecha */}
          <div className="acerca-hero__tile">
            <img src="/assets/acerca/Baldosa Naranja.png" alt="" />
          </div>
        </div>
      </div>
    </header>
  );
}

/* =========================================================
   SECTION 2 – Hero Image (postal con borde de baldosa naranja)
   ========================================================= */

function HeroImageSection() {
  return (
    <section className="acerca-hero-image">
      <div className="acerca-hero-image__frame">
        {/* Imagen central */}
        <img
          src="/assets/acerca/Imagen central.png"
          alt="Equipo de Rutas de Valledupar"
          className="acerca-hero-image__img"
        />
        {/* Borde estilo postal con baldosa naranja */}
        <div className="acerca-hero-image__border-top" />
        <div className="acerca-hero-image__border-bottom" />
        <div className="acerca-hero-image__border-left" />
        <div className="acerca-hero-image__border-right" />
      </div>
    </section>
  );
}

/* =========================================================
   SECTION 3 – Intro Quote (Trattatello + val1-3 decorativos)
   ========================================================= */

function IntroQuoteSection() {
  return (
    <section className="acerca-intro">
      {/* Decoración lateral izquierda: val1, val2, val3 */}
      <div className="acerca-intro__deco">
        <img src="/assets/acerca/val1.png" alt="" className="acerca-intro__deco-img" />
        <img src="/assets/acerca/val2.png" alt="" className="acerca-intro__deco-img" />
        <img src="/assets/acerca/val3.png" alt="" className="acerca-intro__deco-img" />
      </div>

      <div className="acerca-intro__text">
        <p className="acerca-intro__quote">
          Rutas de Valledupar nace del amor por nuestra tierra, sus costumbres y
          esa forma tan única que tenemos los vallenatos de contar el mundo. Somos
          una bitácora viva y un viaje multimedia diseñado para salvaguardar,
          celebrar y redescubrir el patrimonio inmaterial de nuestra región.
        </p>
      </div>

      {/* Decoración lateral derecha: val1, val2, val3 */}
      <div className="acerca-intro__deco">
        <img src="/assets/acerca/val1.png" alt="" className="acerca-intro__deco-img" />
        <img src="/assets/acerca/val2.png" alt="" className="acerca-intro__deco-img" />
        <img src="/assets/acerca/val3.png" alt="" className="acerca-intro__deco-img" />
      </div>
    </section>
  );
}

/* =========================================================
   SECTION 4 – Manifesto
   ========================================================= */

function ManifestoSection() {
  return (
    <section className="acerca-manifesto">
      {/* Left: Parchment Text */}
      <div className="acerca-manifesto__parchment">
        <div className="acerca-manifesto__parchment-inner" />
        <div className="acerca-manifesto__heading">
          <span className="acerca-manifesto__dot" />
          <h2 className="acerca-manifesto__title">Manifiesto</h2>
          <span className="acerca-manifesto__dot" />
        </div>
        <p className="acerca-manifesto__copy">
          En Rutas de Valledupar, viajar no significa desplazarse; significa reencontrarse.
          Cada ruta es un ritual que reconecta a las personas con el territorio, la memoria
          y los saberes que los sostienen. Hemos emprendido esta aventura no en un sentido
          convencional, sino un trabajo sensible que despliega las voces que habitan en los
          colores, los ríos, los valles y las canciones.
        </p>
        <p className="acerca-manifesto__copy">
          Al reinterpretar el territorio nos narramos: Las cortezas nos guardaron, la leyenda
          viva y los acordes en huellas de una historia que sigue latiendo.
        </p>
        <p className="acerca-manifesto__footnote">
          Más que un recorrido, es una invitación a recordar, sentir y conservar.
        </p>
      </div>

      {/* Right: Framed Portrait */}
      <div className="acerca-manifesto__portrait">
        <div className="acerca-manifesto__portrait-frame">
          <img
            src="https://images.unsplash.com/photo-1597495511110-9155d2fa3030?auto=format&fit=crop&w=600&q=80"
            alt="Retrato Manifiesto"
          />
          <PatternBorder top bottom left right />
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SECTION 5 – Transition Text
   ========================================================= */

function TransitionSection() {
  return (
    <section className="acerca-transition">
      <h3 className="acerca-transition__text">
        LAS TRADICIONES SE HEREDAN, SE VIVEN Y SE COMPARTEN
      </h3>
    </section>
  );
}

/* =========================================================
   SECTION 6 – Team (Carrusel Slider)
   ========================================================= */

function TeamSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % teamMembers.length);
  };

  /* Calcula posición y estilo de cada slide según su diferencia con el activo */
  const getSlideStyles = (index) => {
    let diff = index - activeIndex;
    const len = teamMembers.length;

    if (diff < -1) diff += len;
    if (diff > 1) diff -= len;

    if (diff === 0) {
      // Centro – Activo
      return {
        wrapper: "acerca-team__slide acerca-team__slide--center",
        img: "",
        text: "",
      };
    } else if (diff === 1) {
      // Derecha – Siguiente
      return {
        wrapper: "acerca-team__slide acerca-team__slide--right",
        img: "acerca-team__slide-img--blur",
        text: "acerca-team__slide-text--blur",
      };
    } else if (diff === -1) {
      // Izquierda – Anterior
      return {
        wrapper: "acerca-team__slide acerca-team__slide--left",
        img: "acerca-team__slide-img--blur",
        text: "acerca-team__slide-text--blur",
      };
    }

    return {
      wrapper: "acerca-team__slide acerca-team__slide--hidden",
      img: "",
      text: "",
    };
  };

  return (
    <section className="acerca-team">
      <h2 className="acerca-team__title">conozca al equipo</h2>

      <div className="acerca-team__carousel">
        {teamMembers.map((member, idx) => {
          const styles = getSlideStyles(idx);
          return (
            <div key={member.name} className={`${styles.wrapper}`}>
              {/* Foto con máscara de degradado */}
              <div className="acerca-team__slide-img-wrap">
                <img
                  src={member.image}
                  alt={member.name}
                  className={`acerca-team__slide-img ${styles.img}`}
                />
              </div>

              {/* Texto informativo */}
              <div className={`acerca-team__slide-info ${styles.text}`}>
                <h4 className="acerca-team__slide-name">{member.name}</h4>
                {member.org && (
                  <p className="acerca-team__slide-org">{member.org}</p>
                )}
                <p className="acerca-team__slide-role">{member.role}</p>
              </div>
            </div>
          );
        })}

        {/* Controles de navegación */}
        <div className="acerca-team__nav">
          <button className="acerca-team__arrow" onClick={handlePrev} aria-label="Anterior">
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
              <path d="M23.5 6H1M1 6L6 1M1 6L6 11" stroke="#F0EAD6" strokeWidth="1.2" />
            </svg>
          </button>
          <button className="acerca-team__arrow" onClick={handleNext} aria-label="Siguiente">
            <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
              <path d="M0.5 6H23M23 6L18 1M23 6L18 11" stroke="#F0EAD6" strokeWidth="1.2" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   SECTION 7 – Contact
   ========================================================= */

function ContactSection() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    sector: "",
    mensaje: "",
  });
  const [formStatus, setFormStatus] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormStatus("Gracias por escribirnos. Pronto te contactaremos.");
    setFormState({ name: "", email: "", sector: "", mensaje: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="acerca-contact">
      {/* Left: Info */}
      <div className="acerca-contact__info">
        <h2 className="acerca-contact__title">Contacto</h2>
        <h3 className="acerca-contact__subtitle">¿HABLAMOS?</h3>
        <p className="acerca-contact__description">
          Dudas, sugerencias, ideas parranderas o propuestas de trabajo son bienvenidas.
          Déjanos tus datos y nos pondremos en contacto contigo más rápido de lo que canta un gallo.
        </p>
      </div>

      {/* Right: Form */}
      <div className="acerca-contact__form-wrap">
        <div className="acerca-contact__form-card">
          <div className="acerca-contact__form-header">
            <p className="acerca-contact__form-note">
              Escríbenos a este correo electrónico para detalles de comercialización o escríbenos a:
            </p>
            <div className="acerca-contact__social-mini">
              <a href="mailto:rutasvalledupar@gmail.com" className="acerca-contact__social-icon" aria-label="Email">
                <img src={iconMail} alt="Correo" />
              </a>
              <a href="https://www.instagram.com/rutasvalledupar" target="_blank" rel="noreferrer" className="acerca-contact__social-icon" aria-label="Instagram">
                <img src={iconInstagram} alt="Instagram" />
              </a>
            </div>
            <p className="acerca-contact__form-note">O contáctanos por medio del siguiente formulario:</p>
          </div>

          <form className="acerca-contact__form" onSubmit={handleSubmit}>
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="Nombre"
              required
            />
            <input
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
            <div className="acerca-contact__select-wrap">
              <select
                name="sector"
                value={formState.sector}
                onChange={handleChange}
              >
                <option value="">Sector</option>
                <option value="Cultura">Cultura</option>
                <option value="Turismo">Turismo</option>
                <option value="Educación">Educación</option>
              </select>
              <span className="acerca-contact__select-arrow">▼</span>
            </div>
            <textarea
              name="mensaje"
              value={formState.mensaje}
              onChange={handleChange}
              placeholder="Mensaje"
              rows={4}
            />

            <button type="submit">Enviar Mensaje</button>
            {formStatus && <p className="acerca-contact__success">{formStatus}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN: AcercaDe Page
   ========================================================= */

export default function AcercaDe() {
  return (
    <div className="page-shell acerca-page">
      <TopBar activeSection="acerca" />

      <main className="acerca-page__main">
        {/* SECTION 1: Hero Header */}
        <HeroHeader />

        {/* SECTION 2: Hero Image */}
        <HeroImageSection />

        {/* SECTION 3: Intro Quote */}
        <IntroQuoteSection />

        {/* SECTION 4: Manifesto */}
        <ManifestoSection />

        {/* SECTION 5: Transition Text */}
        <TransitionSection />

        {/* SECTION 6: Team */}
        <TeamSection />

        {/* SECTION 7: Contact */}
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}
