import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logoVerde from "../assets/mcp/Logo Color Verde.png";
import logoBlanco from "../assets/mcp/Logo blanco.png";
import mapaDefault from "../assets/mcp/mapa generalll 1.webp";
import mapaGastronomico from "../assets/mcp/mapa generalll 2.webp";
import mapaPatrimonial from "../assets/mcp/mapa generalll 3.webp";
import mapaMistico from "../assets/mcp/mapa generalll 4.webp";
import ctaBgIcon from "../assets/mcp/icon_bg_cta.png";
import TopBar from "../TopBar";
import Footer from "../Footer";

import glossBgLucas from "../assets/mcp/gloss_bg_lucas.webp";
import glossBgMotetes from "../assets/mcp/gloss_bg_motetes.png";
import glossBgCantaro from "../assets/mcp/gloss_bg_cantaro.png";
import glossBgAsiento from "../assets/mcp/gloss_bg_asiento.webp";
import "../styles.css";
import { supabase } from "../supabaseClient";


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

const CATEGORY_COLORS = {
  Patrimonial: "#4B5940",
  Gastronomico: "#C76725",
  Cultural: "#bb4c18",
  Mitico: "#5B5180",
  Historico: "#564e87",
};

const getVideoThumbnail = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    let vid = null;
    if (u.hostname.includes("youtube.com")) {
      vid = u.searchParams.get("v");
    } else if (u.hostname === "youtu.be") {
      vid = u.pathname.slice(1).split("?")[0];
    }
    if (vid) return `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;
  } catch {}
  return null;
};

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
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const galleryTimerRef = useRef(null);

  // Fetch real gallery data from Supabase
  useEffect(() => {
    let cancelled = false;
    async function fetchGallery() {
      try {
        const { data, error } = await supabase
          .from("galeria_multimedia")
          .select("*")
          .eq("activo", true)
          .order("creado_en", { ascending: false });

        if (!cancelled) {
          if (error) throw error;

          const mapped = (data || []).map((item) => ({
            id: item.id,
            img: item.video_imagen || item.imagen_principal || getVideoThumbnail(item.video_url) || "",
            accentColor: CATEGORY_COLORS[item.tipo_sitio] || "#bb4c18",
            subtitle: item.titulo,
            sub2: item.descripcion_breve || "",
            titleSlide: item.tipo_sitio ? ({
              Patrimonial: "Patrimonio Vivo",
              Gastronomico: "Sabores del Valle",
              Cultural: "Cultura Vallenata",
              Mitico: "Mitos y Leyendas",
              Historico: "Memorias Históricas",
            })[item.tipo_sitio] || "Galería Multimedia" : "Galería Multimedia",
            hasPlay: item.tipo_multimedia === "Video",
            tipo_sitio: item.tipo_sitio,
          }));

          if (!cancelled) {
            setSlides(mapped);
            setLoading(false);
          }
        }
      } catch (err) {
        console.warn("Error fetching gallery for home:", err);
        if (!cancelled) {
          setSlides([]);
          setLoading(false);
        }
      }
    }
    fetchGallery();
    return () => { cancelled = true; };
  }, []);

  const startGalleryAutoplay = () => {
    clearInterval(galleryTimerRef.current);
    if (slides.length === 0) return;
    galleryTimerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5200);
  };

  useEffect(() => {
    startGalleryAutoplay();
    return () => clearInterval(galleryTimerRef.current);
  }, [slides.length]);

  const handleSlideClick = (slide) => {
    navigate("/galeria", { state: { selectedItemId: slide.id } });
  };

  const activeSlide = slides[current] || null;

  if (loading) {
    return (
      <section id="galeria" className="gallery-section reveal">
        <div className="gallery-section__heading">
          <h2>Este espacio es especial para escuchar la voz del viejo Valle</h2>
          <p>Aquí están personas que hacen parte de esa herencia que sigue viva.</p>
        </div>
        <div style={{ textAlign: "center", padding: "80px 16px", color: "#8A7968" }}>
          <div style={{
            width: 32, height: 32,
            border: "3px solid rgba(194,98,42,0.2)",
            borderTopColor: "#C2622A",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Cargando galería...</p>
        </div>
      </section>
    );
  }

  if (slides.length === 0) {
    return (
      <section id="galeria" className="gallery-section reveal">
        <div className="gallery-section__heading">
          <h2>Este espacio es especial para escuchar la voz del viejo Valle</h2>
          <p>Aquí están personas que hacen parte de esa herencia que sigue viva.</p>
        </div>
        <div style={{ textAlign: "center", padding: "60px 16px", color: "#8A7968" }}>
          <span style={{ fontSize: 48, opacity: 0.3, display: "block", marginBottom: 12 }}>📷</span>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Próximamente contenido multimedia.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="galeria" className="gallery-section reveal">
      <div className="gallery-section__heading">
        <h2>Este espacio es especial para escuchar la voz del viejo Valle</h2>
        <p>Aquí están personas que hacen parte de esa herencia que sigue viva.</p>
      </div>
      <div className="gallery-carousel" onMouseEnter={() => clearInterval(galleryTimerRef.current)} onMouseLeave={startGalleryAutoplay}>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`gallery-slide${index === current ? " active" : ""} gallery-slide--clickable`}
            onClick={() => handleSlideClick(slide)}
          >
            <img src={slide.img} alt={slide.subtitle} className="gallery-slide__img" loading="lazy" decoding="async" />
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

        <div className="gallery-title" key={activeSlide.id}>
          {activeSlide.titleSlide}
        </div>

        <div className="gallery-nav">
          <button className="gallery-nav-btn" onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}>
            &#9650;
          </button>
          <button className="gallery-nav-btn" onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}>
            &#9660;
          </button>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="cta-section reveal">
      <img src={ctaBgIcon} alt="" className="cta-section__bg-icon" loading="lazy" />
      <h2>¿Listo para explorar Valledupar?</h2>
      <p>Planifica tu ruta ahora mismo desde el mapa interactivo</p>
      <button className="cta-section__btn" onClick={() => navigate("/mapas")}>
        Ver el mapa interactivo
      </button>
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
  const [activeSection, setActiveSection] = useState("mapas");
  const [isRegistered] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const sectionIds = ["mapas", "galeria", "glosario", "footer"];
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
      <Maps />
      <Gallery />
      <Glossary />
      <CTASection />
      <Footer />
    </div>
  );
}
