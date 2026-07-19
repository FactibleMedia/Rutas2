import { useEffect, useId, useRef, useState } from "react";
import mapPat from "../assets/mcp/mapa_pat.png";
import mapMis from "../assets/mcp/mapa_mis.png";
import mapGas from "../assets/mcp/mapa_gas.png";
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
    title: "Cantaro",
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

function Maps() {
  const [selectedRoute, setSelectedRoute] = useState(null);

  const routes = [
    {
      id: 0,
      title: "RUTA PATRIMONIAL",
      subtitle: "LUGARES HISTÓRICOS, ARQUITECTURA, PLAZAS, ESCULTURAS, IGLESIAS, ETC.",
      activeColor: "#6a8759",
      mutedColor: "#d0ddc7",
      image: mapPat,
    },
    {
      id: 1,
      title: "RUTA MÍSTICA",
      subtitle: "HISTORIAS ORALES, PERSONAJES MÍTICOS Y TRADICIONES POPULARES.",
      activeColor: "#4a3e75",
      mutedColor: "#c6c2d6",
      image: mapMis,
    },
    {
      id: 2,
      title: "RUTA GASTRONÓMICA",
      subtitle: "SABORES Y PLATOS TÍPICOS DE LA REGIÓN.",
      activeColor: "#c46c33",
      mutedColor: "#eed0be",
      image: mapGas,
    },
  ];

  return (
    <section id="mapas" className="maps reveal">
      <h2 className="maps__title">Mapas</h2>
      <div className="maps__inner">
        <div className={`maps__text-block ${selectedRoute === null ? "maps__text-block--initial" : "maps__text-block--active"}`}>
          <div className="maps__intro">
            <p>
              Explora las rutas del viejo Valle y descubre cómo cada camino cambia el mapa,
              las historias y los colores del territorio.
            </p>
          </div>

          <div className="maps__route-list">
            {routes.map((route) => {
              const isActive = selectedRoute === route.id;
              const isInitial = selectedRoute === null;

              return (
                <div
                  key={route.id}
                  className="maps__route-item"
                  onClick={() => setSelectedRoute(route.id)}
                  style={{ cursor: "pointer" }}
                >
                  <h3
                    className={`maps__route-title ${isInitial ? "maps__route-title--initial" : isActive ? "maps__route-title--active" : "maps__route-title--inactive"}`}
                    style={{
                      color: isInitial ? route.mutedColor : isActive ? route.activeColor : route.mutedColor,
                    }}
                  >
                    {route.title}
                  </h3>
                  <p className={`maps__route-subtitle ${isActive ? "active" : ""}`}>
                    {route.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`maps__visual ${selectedRoute === null ? "maps__visual--hidden" : "maps__visual--visible"}`}>
          <div className="maps__map-display">
            {routes.map((route) => (
              <div key={route.id} className={`maps__map-slide ${selectedRoute === route.id ? "active" : ""}`}>
                <img src={route.image} alt={route.title} loading="lazy" decoding="async" />
              </div>
            ))}
          </div>
          <button className="maps__cta">EXPLORA EL MAPA</button>
        </div>
      </div>
    </section>
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
      <TopBar activeSection={activeSection} isAuthenticated={isRegistered} user={{ name: "Usuario Valido", initials: "UV" }} onSectionChange={handleSectionChange} />
      <InitialSlider />
      <Maps />
      <Glossary />
      <Gallery />
      <CTASection />
      <Footer />
    </div>
  );
}
