import { useEffect, useRef, useState } from "react";
import iconSearch from "../assets/mcp/icon_search.png";
import iconYoutube from "../assets/mcp/icon_youtube.png";
import iconInstagram from "../assets/mcp/icon_instagram.png";
import iconLocation from "../assets/mcp/icon_location.png";
import iconMail from "../assets/mcp/icon_mail.png";
import mapPat from "../assets/mcp/mapa_pat.png";
import mapMis from "../assets/mcp/mapa_mis.png";
import mapGas from "../assets/mcp/mapa_gas.png";
import gal1 from "../assets/mcp/gal_slide1.png";
import gal2 from "../assets/mcp/gal_slide2.png";
import gal3 from "../assets/mcp/gal_slide3.png";
import heroCentro from "../assets/mcp/hero_centro.png";
import heroArquitectura from "../assets/mcp/hero_arquitectura.png";
import heroGlorietas from "../assets/mcp/hero_glorietas.png";
import heroMistico from "../assets/mcp/hero_mistico.png";
import heroGastro from "../assets/mcp/hero_gastro.png";
import heroPhotoLeft from "../assets/mcp/hero_photo_left.png";
import heroPhotoRight from "../assets/mcp/hero_photo_right.png";
import heroNextBtn from "../assets/mcp/hero_next_btn.png";
import logoNav from "../assets/mcp/logo_white_hero.png";
import logoHero from "../assets/mcp/logo_white_hero.png";
import logoFooter from "../assets/mcp/logo_footer.png";
import ctaBgIcon from "../assets/mcp/icon_bg_cta.png";
import glossFramePurple from "../assets/mcp/gloss_frame_purple.png";
import glossFrameGreen from "../assets/mcp/gloss_frame_green.png";
import glossBgLucas from "../assets/mcp/gloss_bg_lucas.png";
import glossBgMotetes from "../assets/mcp/gloss_bg_motetes.png";
import glossBgCantaro from "../assets/mcp/gloss_bg_cantaro.png";
import glossBgAsiento from "../assets/mcp/gloss_bg_asiento.png";
import "../styles.css";

const heroSlides = [
  { img: heroCentro, label: "Centro historico" },
  { img: heroArquitectura, label: "Arquitectura" },
  { img: heroGlorietas, label: "Glorietas" },
  { img: heroMistico, label: "Lugares misticos" },
  { img: heroGastro, label: "Sabores tradicionales" },
];

const glossaryCards = [
  {
    bg: "#464c33",
    imgBack: glossBgAsiento,
    imgFrame: glossFrameGreen,
    title: "Asiento",
    type: "(Objeto)",
    meaning: "Silla de madera con cuero de vaca disecado.",
  },
  {
    bg: "#564e87",
    imgBack: glossBgCantaro,
    imgFrame: glossFramePurple,
    title: "Cantaro",
    type: "(Objeto)",
    meaning: "Vasija de metal que se utilizaba para llevar y conservar la leche.",
  },
  {
    bg: "#464c33",
    imgBack: glossBgMotetes,
    imgFrame: glossFrameGreen,
    title: "Motetes",
    type: "(Objeto)",
    meaning: "Son las maletas o cosas que lleva una persona al viajar.",
  },
  {
    bg: "#564e87",
    imgBack: glossBgLucas,
    imgFrame: glossFramePurple,
    title: "Lucas",
    type: "(Objeto)",
    meaning: "Es para hacer referencia al dinero.",
  },
];

const gallerySlides = [
  {
    img: gal1,
    titleSlide: "Guardianes del saber",
    accentColor: "#bb4c18",
    subtitle: "Entrevistas a sabedores de tradicion",
    sub2: "Voces que mantienen viva la identidad cultural y patrimonial vallenata",
    hasPlay: true,
  },
  {
    img: gal2,
    titleSlide: "Guardianes del saber",
    accentColor: "#627c50",
    subtitle: "Museo del Acordeon Beto Murgas",
    sub2: "Beto Murgas",
    hasPlay: false,
  },
  {
    img: gal3,
    titleSlide: "Postales del Valle",
    accentColor: "#564e87",
    subtitle: "Museo del Acordeon Beto Murgas",
    sub2: "Beto Murgas",
    hasPlay: false,
  },
];

function Navbar({ activeSection }) {
  const links = [
    { id: "inicio", label: "Inicio" },
    { id: "mapas", label: "Mapa" },
    { id: "glosario", label: "Glosario" },
    { id: "galeria", label: "Galeria" },
    { id: "footer", label: "Acerca de" },
  ];

  return (
    <nav className="navbar">
      <img src={logoNav} alt="Rutas de Valledupar" className="navbar__logo" loading="eager" fetchPriority="high" />
      <div className="navbar__nav">
        {links.map((link) => (
          <a key={link.id} href={`#${link.id}`} className={`navbar__link${activeSection === link.id ? " active" : ""}`}>
            {link.label}
          </a>
        ))}
        <img src={iconSearch} alt="buscar" className="navbar__search" />
      </div>
      <div className="navbar__actions">
        <button className="navbar__btn">Iniciar sesion</button>
        <button className="navbar__btn">Registrate</button>
      </div>
    </nav>
  );
}

function Hero() {
  const [current, setCurrent] = useState(0);
  const heroTimerRef = useRef(null);

  const startAutoplay = () => {
    clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 4600);
  };

  useEffect(() => {
    startAutoplay();
    return () => clearInterval(heroTimerRef.current);
  }, []);

  return (
    <section id="inicio" className="hero" onMouseEnter={() => clearInterval(heroTimerRef.current)} onMouseLeave={startAutoplay}>
      {heroSlides.map((slide, index) => (
        <img
          key={slide.label}
          src={slide.img}
          alt={slide.label}
          className={`hero__slide${index === current ? " active" : ""}`}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
        />
      ))}
      <div className="hero__overlay" />

      <div className="hero__photo-left">
        <img src={heroPhotoLeft} alt="Centro historico" />
      </div>
      <div className="hero__photo-right">
        <img src={heroPhotoRight} alt="Arquitectura" />
      </div>

      <div className="hero__content reveal visible">
        <img src={logoHero} alt="Rutas de Valledupar" className="hero__logo-img" />
        <p className="hero__desc">
          Bienvenido a recorrer las rutas del viejo Valle, aqui mantenemos la herencia viva de un patrimonio que todavia se conserva.
        </p>
        <a href="#mapas" className="hero__cta">
          Explora el mapa
        </a>
      </div>

      <div className="hero__label-view" aria-live="polite">
        <div className="hero__label-track" style={{ transform: `translateY(-${current * 144}px)` }}>
          {heroSlides.map((slide) => (
            <span key={slide.label} className="hero__label-item">
              {slide.label}
            </span>
          ))}
        </div>
      </div>

      <button className="hero__nav-btn next" onClick={() => setCurrent((prev) => (prev + 1) % heroSlides.length)} aria-label="siguiente">
        <img src={heroNextBtn} alt="Siguiente" />
      </button>

      <div className="hero__dots">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.label}
            className={`hero__dot${index === current ? " active" : ""}`}
            onClick={() => setCurrent(index)}
            aria-label={`Mostrar ${slide.label}`}
          />
        ))}
      </div>
    </section>
  );
}

function Maps() {
  const [active, setActive] = useState(0);
  const mapImages = [mapPat, mapMis, mapGas];
  const routes = [
    { label: "Ruta patrimonial", cls: "patrimonial" },
    { label: "Ruta mistica", cls: "mistica" },
    { label: "Ruta gastronomica", cls: "gastronomica" },
  ];

  return (
    <section id="mapas" className="maps reveal">
      <h2 className="maps__title">Mapas</h2>
      <div className="maps__routes">
        {routes.map((route, index) => (
          <button
            key={route.label}
            className={`maps__route ${route.cls}${active === index ? " active" : ""}`}
            onClick={() => setActive(index)}
          >
            {route.label}
          </button>
        ))}
      </div>
      <div className="maps__map-display">
        <img src={mapImages[active]} alt={routes[active].label} loading="lazy" decoding="async" />
      </div>
    </section>
  );
}

function GlossaryCard({ card }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.disconnect();
          }
        });
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="glossary__card" ref={cardRef}>
      <img src={card.imgFrame} alt="Marco postal" className="glossary__card-frame" />
      <div className="glossary__card-inner" style={{ backgroundColor: card.bg }}>
        <img src={card.imgBack} alt={card.title} className="glossary__card-img" />
        <div className="glossary__card-title">{card.title}</div>
        <div className="glossary__card-type">{card.type}</div>
        <div className="glossary__card-meaning">
          <strong>Significado:</strong>
          <br />
          {card.meaning}
        </div>
      </div>
    </div>
  );
}

function Glossary() {
  return (
    <section id="glosario" className="glossary reveal">
      <div className="glossary__heading">
        <h2>Aqui la cultura se siente desde la palabras</h2>
        <p>
          Por eso en este Glosario encontraras mas de 200 palabras que te ayudaran a entender el hablao de los Valduparenses.
        </p>
      </div>
      <div className="glossary__cards">
        {glossaryCards.map((card) => (
          <GlossaryCard key={card.title} card={card} />
        ))}
      </div>
      <div className="glossary__cta-wrap">
        <button className="glossary__cta">Conoce mas palabras</button>
      </div>
    </section>
  );
}

function Gallery() {
  const [current, setCurrent] = useState(0);
  const galleryTimerRef = useRef(null);

  const startGalleryAutoplay = () => {
    clearInterval(galleryTimerRef.current);
    galleryTimerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % gallerySlides.length);
    }, 5200);
  };

  useEffect(() => {
    startGalleryAutoplay();
    return () => clearInterval(galleryTimerRef.current);
  }, []);

  const activeSlide = gallerySlides[current];

  return (
    <section id="galeria" className="gallery-section reveal">
      <div className="gallery-section__heading">
        <h2>Este espacio es especial para escuchar la voz del viejo Valle</h2>
        <p>Aqui estan personas que hacen parte de esa herencia que sigue viva.</p>
      </div>
      <div className="gallery-carousel" onMouseEnter={() => clearInterval(galleryTimerRef.current)} onMouseLeave={startGalleryAutoplay}>
        {gallerySlides.map((slide, index) => (
          <div key={slide.img} className={`gallery-slide${index === current ? " active" : ""}`}>
            <img src={slide.img} alt={slide.titleSlide} className="gallery-slide__img" loading="lazy" decoding="async" />
            <div className="gallery-slide__gradient" />
            <div className="gallery-slide__bar" style={{ backgroundColor: slide.accentColor }}>
              <div className="gallery-slide__info">
                <h3>{slide.subtitle}</h3>
                <p>{slide.sub2}</p>
              </div>
              {slide.hasPlay ? <button className="gallery-play-btn">&#9658;</button> : null}
            </div>
          </div>
        ))}

        <div className="gallery-title" key={activeSlide.titleSlide + current}>
          {activeSlide.titleSlide}
        </div>

        <div className="gallery-nav">
          <button className="gallery-nav-btn" onClick={() => setCurrent((prev) => (prev - 1 + gallerySlides.length) % gallerySlides.length)}>
            &#9650;
          </button>
          <button className="gallery-nav-btn" onClick={() => setCurrent((prev) => (prev + 1) % gallerySlides.length)}>
            &#9660;
          </button>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="cta-section reveal">
      <img src={ctaBgIcon} alt="" className="cta-section__bg-icon" loading="lazy" />
      <h2>Listo para explorar Valledupar?</h2>
      <p>Planifica tu ruta ahora mismo desde el mapa interactivo</p>
      <button className="cta-section__btn">Ver el mapa interactivo</button>
    </section>
  );
}

function Footer() {
  return (
    <footer id="footer" className="footer reveal">
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
            <a href="#" className="footer__social-btn">
              <img src={iconYoutube} alt="YouTube" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="footer__col-title">Explorar</h3>
          <a href="#mapas" className="footer__link">
            Ruta Patrimonial
          </a>
          <a href="#mapas" className="footer__link">
            Ruta Gastronomica
          </a>
          <a href="#mapas" className="footer__link">
            Ruta Mistica
          </a>
          <a href="#glosario" className="footer__link">
            Glosario vallenato
          </a>
          <a href="#galeria" className="footer__link">
            Galeria
          </a>
        </div>

        <div>
          <h3 className="footer__col-title">Informacion</h3>
          <a href="#" className="footer__link">
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
        <button className="footer__back-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          ↑
        </button>
      </div>
    </footer>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    document.querySelectorAll(".reveal").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function DemoApp() {
  const [activeSection, setActiveSection] = useState("inicio");

  useScrollReveal();

  useEffect(() => {
    const sectionIds = ["inicio", "mapas", "glosario", "galeria", "footer"];
    const sectionNodes = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target?.id) {
          setActiveSection(visible.target.id);
        }
      },
      { threshold: [0.2, 0.4, 0.6], rootMargin: "-82px 0px -45% 0px" }
    );

    sectionNodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page-shell">
      <Navbar activeSection={activeSection} />
      <Hero />
      <Maps />
      <Glossary />
      <Gallery />
      <CTASection />
      <Footer />
    </div>
  );
}
