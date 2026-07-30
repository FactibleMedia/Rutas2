import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoVerde from "../assets/mcp/Logo Color Verde.png";
import logoBlanco from "../assets/mcp/Logo blanco.png";
import mapaDefault from "../assets/mcp/mapa generalll 1.png";
import mapaGastronomico from "../assets/mcp/mapa generalll 2.png";
import mapaPatrimonial from "../assets/mcp/mapa generalll 3.png";
import mapaMistico from "../assets/mcp/mapa generalll 4.png";
import gal1 from "../assets/mcp/gal_slide1.png";
import gal2 from "../assets/mcp/gal_slide2.png";
import gal3 from "../assets/mcp/gal_slide3.png";
import ctaBgIcon from "../assets/mcp/icon_bg_cta.png";
import TopBar from "../TopBar";
import Footer from "../Footer";
import glossFrameGreen from "../assets/mcp/gloss_frame_green.png";
import InitialSlider from "../InitialSlider";
import glossBgLucas from "../assets/mcp/gloss_bg_lucas.png";
import glossBgMotetes from "../assets/mcp/gloss_bg_motetes.png";
import glossBgCantaro from "../assets/mcp/gloss_bg_cantaro.png";
import glossBgAsiento from "../assets/mcp/gloss_bg_asiento.png";
import "../styles.css";


const glossaryCards = [
  {
    id: "asiento",
    title: "Asiento",
    type: "Objeto",
    meaning: "Silla de madera con cuero de vaca disecado.",
    color: "#4B5A3E",
    borderColor: "#DCA150",
    imageUrl: glossBgAsiento,
  },
  {
    id: "cantaro",
    title: "Cántaro",
    type: "Objeto",
    meaning: "Vasija de metal que se utilizaba para llevar y conservar la leche.",
    color: "#575288",
    borderColor: "#DCA150",
    imageUrl: glossBgCantaro,
  },
  {
    id: "motetes",
    title: "Motetes",
    type: "Objeto",
    meaning: "Son las maletas o cosas que lleva una persona al viajar.",
    color: "#4B5A3E",
    borderColor: "#DCA150",
    imageUrl: glossBgMotetes,
  },
  {
    id: "lucas",
    title: "Lucas",
    type: "Objeto",
    meaning: "Es para hacer referencia al dinero.",
    color: "#575288",
    borderColor: "#DCA150",
    imageUrl: glossBgLucas,
  },
];

function StampCard({ color, borderColor, children }) {
  const uniqueId = useId().replace(/:/g, "-");
  const w = 256;
  const h = 320;

  return (
    <div className="glossary__stamp-card">
      <svg className="glossary__stamp-svg" viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id={`stamp-mask-${uniqueId}`}>
            <rect width={w} height={h} fill="white" />
            <rect
              x="0"
              y="0"
              width={w}
              height={h}
              fill="none"
              stroke="black"
              strokeWidth="14"
              strokeDasharray="0 20"
              strokeLinecap="round"
            />
          </mask>
        </defs>

        <rect width={w} height={h} fill={color} mask={`url(#stamp-mask-${uniqueId})`} rx="4" />
        <rect x="12" y="12" width={w - 24} height={h - 24} fill="none" stroke={borderColor} strokeWidth="1.5" rx="4" />
      </svg>
      <div className="glossary__stamp-content">{children}</div>
    </div>
  );
}

function GlossaryItem({ title, type, meaning, color, borderColor, imageUrl }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`glossary__item ${isOpen ? "glossary__item--active" : ""}`}
      onClick={() => setIsOpen((prev) => !prev)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          setIsOpen((prev) => !prev);
        }
      }}
      aria-pressed={isOpen}
    >
      <div className="glossary__card glossary__card--back">
        <StampCard color={color} borderColor={borderColor}>
          <div className={`glossary__card-back-image ${isOpen ? "glossary__card-back-image--open" : ""}`}>
            <img src={imageUrl} alt={`Ilustración de ${title}`} />
          </div>
        </StampCard>
      </div>
      <div className={`glossary__card glossary__card--front ${isOpen ? "glossary__card--front-open" : ""}`}>
        <StampCard color={color} borderColor={borderColor}>
          <div className="glossary__card-front-content">
            <h2>{title}</h2>
            <span>({type})</span>
            <div className="glossary__card-meaning">
              <span>Significado:</span>
              <p>{meaning}</p>
            </div>
          </div>
        </StampCard>
      </div>
    </div>
  );
}

const gallerySlides = [
  {
    img: gal1,
    titleSlide: "Guardianes del saber",
    accentColor: "#bb4c18",
    subtitle: "Entrevistas a sabedores de tradición",
    sub2: "Voces que mantienen viva la identidad cultural y patrimonial vallenata",
    hasPlay: true,
  },
  {
    img: gal2,
    titleSlide: "Guardianes del saber",
    accentColor: "#627c50",
    subtitle: "Museo del Acordeón Beto Murgas",
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

// ── Configuración de rutas ──
const routesConfig = [
  {
    id: "patrimonial",
    label: "Patrimonial",
    subtitle: "Lugares históricos, arquitectura, plazas, esculturas, iglesias, etc.",
    btnColor: "#4B5940",
    btnHover: "#3A4630",
  },
  {
    id: "gastronomico",
    label: "Gastronómico",
    subtitle: "Sabores y platos típicos de la región.",
    btnColor: "#C76725",
    btnHover: "#A8551E",
  },
  {
    id: "mistico",
    label: "Místico",
    subtitle: "Historias orales, personajes míticos y tradiciones populares.",
    btnColor: "#5B5180",
    btnHover: "#484066",
  },
];

const getTheme = (routeId) => {
  switch (routeId) {
    case "patrimonial": return { bg: "#566549", text: "#F9F8F3" };
    case "gastronomico": return { bg: "#D1702C", text: "#F9F8F3" };
    case "mistico": return { bg: "#665B8F", text: "#F9F8F3" };
    default: return { bg: "#FAF8F0", text: "#2D2A26" };
  }
};

const getBgImage = (routeId) => {
  switch (routeId) {
    case "patrimonial": return mapaPatrimonial;
    case "gastronomico": return mapaGastronomico;
    case "mistico": return mapaMistico;
    default: return mapaDefault;
  }
};

const routeMapToInteractivas = {
  patrimonial: "patrimoniales",
  gastronomico: "gastronomica",
  mistico: "mistica",
};

function Maps() {
  const navigate = useNavigate();
  const [activeRoute, setActiveRoute] = useState(null);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [prevImage, setPrevImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(getBgImage(null));
  const currentRoute = activeRoute || selectedRouteId;
  const theme = getTheme(currentRoute);

  // Crossfade: when bgImage changes, move current to prev and set new
  useEffect(() => {
    const newImg = getBgImage(currentRoute);
    if (newImg !== currentImage) {
      setPrevImage(currentImage);
      // Small delay to let prev image start fading before showing new
      const id = setTimeout(() => setCurrentImage(newImg), 50);
      return () => clearTimeout(id);
    }
  }, [currentRoute]);

  const handleRouteClick = (routeId) => {
    setSelectedRouteId((prev) => (prev === routeId ? null : routeId));
  };

  const showOverlay = selectedRouteId !== null;

  return (
    <section
      id="mapas"
      className="maps-section reveal"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Background image — fondo completo, sin frame ni bordes */}
      <div className="maps-section__bg">
        {prevImage && (
          <img
            src={prevImage}
            alt=""
            className="maps-section__bg-img maps-section__bg-img--prev"
          />
        )}
        <img
          src={currentImage}
          alt=""
          className="maps-section__bg-img maps-section__bg-img--current"
        />
        <div className={`maps-section__bg-overlay ${showOverlay ? "maps-section__bg-overlay--visible" : ""}`} />
      </div>

      {/* Content */}
      <div className="maps-section__content">
        {/* Logo: verde en default, blanco con ruta seleccionada */}
        <div className="maps-section__header">
          <img
            src={selectedRouteId ? logoBlanco : logoVerde}
            alt="Rutas de Valledupar"
            className="maps-section__logo"
          />
        </div>

        {/* Route Pills */}
        <div className="maps-section__pills">
          {routesConfig.map((route) => (
            <button
              key={route.id}
              onMouseEnter={() => setActiveRoute(route.id)}
              onMouseLeave={() => setActiveRoute(null)}
              onClick={() => handleRouteClick(route.id)}
              className={`maps-section__pill ${selectedRouteId === route.id ? "maps-section__pill--active" : ""}`}
              style={{
                backgroundColor: selectedRouteId === route.id ? route.btnColor : "rgba(255,255,255,0.85)",
                color: selectedRouteId === route.id ? "#fff" : "#2D2A26",
              }}
            >
              {route.label}
            </button>
          ))}
        </div>

        {/* Route subtitle */}
        {selectedRouteId && (
          <p className="maps-section__subtitle">
            {routesConfig.find((r) => r.id === selectedRouteId)?.subtitle}
          </p>
        )}

        {/* CTA Button */}
        <button
          className="maps-section__cta"
          onClick={() => {
            const targetRoute = selectedRouteId
              ? routeMapToInteractivas[selectedRouteId]
              : null;
            const search = targetRoute ? `?ruta=${targetRoute}` : "";
            navigate(`/rutas-interactivas${search}`);
          }}
        >
          Explora el mapa
        </button>

        {/* Footer description */}
        <div className="maps-section__footer">
          <p>
            Bienvenido a recorrer las rutas del viejo Valle, aquí mantenemos la herencia viva de un patrimonio que todavía se conserva.
          </p>
        </div>
      </div>
    </section>
  );
}

function Glossary() {
  return (
    <section id="glosario" className="glossary reveal">
      <div className="glossary__heading">
        <h2>Aquí la cultura se siente desde las palabras</h2>
        <p>
          Por eso en este Glosario encontrarás más de 200 palabras que te ayudarán a entender el hablao de los vallenatos.
        </p>
      </div>
      <div className="glossary__grid">
        {glossaryCards.map((card) => (
          <GlossaryItem
            key={card.id}
            title={card.title}
            type={card.type}
            meaning={card.meaning}
            color={card.color}
            borderColor={card.borderColor}
            imageUrl={card.imageUrl}
          />
        ))}
      </div>
      <div className="glossary__cta-wrap">
        <button className="glossary__cta">Conoce más palabras</button>
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
        <h2>Este espacio es especial para escuchar la voz del viejo Valle</h2>          <p>Aquí están personas que hacen parte de esa herencia que sigue viva.</p>
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
      <img src={ctaBgIcon} alt="" className="cta-section__bg-icon" loading="lazy" />        <h2>¿Listo para explorar Valledupar?</h2>
      <p>Planifica tu ruta ahora mismo desde el mapa interactivo</p>
      <button className="cta-section__btn">Ver el mapa interactivo</button>
    </section>
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

export default function InicioPage() {
  const [activeSection, setActiveSection] = useState("inicio");
  const [isRegistered, setIsRegistered] = useState(false);

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

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="page-shell">
      <TopBar activeSection={activeSection} isAuthenticated={isRegistered} user={{ name: "Usuario Válido", initials: "UV" }} onSectionChange={handleSectionChange} />
      <InitialSlider onNavigate={handleSectionChange} />
      <Maps />
      <Glossary />
      <Gallery />
      <CTASection />
      <Footer />
    </div>
  );
}
