import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import mapaDefault from "../assets/mcp/mapa generalll 1.webp";
import ctaBgMap from "../assets/mcp/cta_bg_mapa_gastronomico.webp";
import heroMapPatrimonial from "../assets/mcp/hero_map_patrimonial.webp";
import heroMapMistico from "../assets/mcp/hero_map_mistico.webp";
import heroTitleDefault from "../assets/mcp/hero_title_default.svg";
import heroTitleCream from "../assets/mcp/hero_title_cream.svg";
import heroTitlePatrimonial from "../assets/mcp/hero_title_patrimonial.svg";
import chevronIcon from "../assets/mcp/icon_chevron_scroll.svg";
import chevronIconCream from "../assets/mcp/icon_chevron_scroll_cream.svg";
import TopBar from "../TopBar";
import Footer from "../Footer";
import CTASection from "../CTASection";

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

// Hero states, in the same order as Figma's animation strip (component
// "Inicio completo" on page "R - Inicio", variants Predeterminada ->
// Gastronomica -> Patrimonial -> Mistico). Each state is a full color
// change, not just a background-image swap: section background, map image
// + opacity, title graphic (vectorized per-state in Figma, not live text),
// intro text color, and chevron color all change together. Auto-advances
// on a timer -- no pills or other UI drives it. Gastronomica and Mistico
// share the same title graphic (byte-identical export from Figma).
const HERO_STATES = [
  {
    id: "default",
    map: mapaDefault,
    mapOpacity: 0.5,
    title: heroTitleDefault,
    chevron: chevronIcon,
    bg: "#fff4db",
    introColor: "#2c1a0e",
  },
  {
    id: "gastronomica",
    map: ctaBgMap,
    mapOpacity: 1,
    title: heroTitleCream,
    chevron: chevronIconCream,
    bg: "rgb(var(--ds-orange))",
    introColor: "rgb(var(--ds-cream))",
  },
  {
    id: "patrimonial",
    map: heroMapPatrimonial,
    mapOpacity: 1,
    title: heroTitlePatrimonial,
    chevron: chevronIconCream,
    bg: "rgb(var(--ds-forest))",
    introColor: "rgb(var(--ds-cream))",
  },
  {
    id: "mistico",
    map: heroMapMistico,
    mapOpacity: 1,
    title: heroTitleCream,
    chevron: chevronIconCream,
    bg: "rgb(var(--ds-purple))",
    introColor: "rgb(var(--ds-cream))",
  },
];

function Maps() {
  const navigate = useNavigate();
  const [stateIndex, setStateIndex] = useState(-1);

  useEffect(() => {
    const enter = setTimeout(() => setStateIndex(0), 50);
    const id = setInterval(() => {
      setStateIndex((prev) => (prev + 1) % HERO_STATES.length);
    }, 4000);
    return () => {
      clearTimeout(enter);
      clearInterval(id);
    };
  }, []);

  const active = HERO_STATES[Math.max(stateIndex, 0)];

  return (
    <section
      id="mapas"
      className="maps-section reveal"
      style={{ backgroundColor: active.bg }}
    >
      {/* Map + logo — centrada, ~95% ancho (Figma base x1.3). Everything
          below crossfades through HERO_STATES every 4s. */}
      <div className="maps-section__map-area">
        {HERO_STATES.map((state, i) => (
          <img
            key={state.id}
            src={state.map}
            alt=""
            className={`maps-section__map-img${i === stateIndex ? " maps-section__map-img--active" : ""}`}
            style={{ "--map-active-opacity": state.mapOpacity }}
          />
        ))}
        {HERO_STATES.map((state, i) => (
          <img
            key={`title-${state.id}`}
            src={state.title}
            alt={i === 0 ? "Rutas de Valledupar" : ""}
            aria-hidden={i === 0 ? undefined : true}
            className={`maps-section__logo${i === stateIndex ? " maps-section__logo--active" : ""}`}
          />
        ))}
      </div>

      {/* Message, CTA and scroll arrow, below the map */}
      <div className="maps-section__content">
        <p className="maps-section__intro" style={{ color: active.introColor }}>
          Bienvenido a recorrer las rutas del viejo Valle, aquí mantenemos la herencia viva de un patrimonio que todavía se conserva.
        </p>

        <div className="maps-section__cta-group">
          <button
            className="maps-section__cta"
            onClick={() => navigate("/rutas-interactivas")}
          >
            Explora el mapa
          </button>
          <span className="maps-section__chevron" aria-hidden="true">
            {HERO_STATES.map((state, i) => (
              <img
                key={`chevron-${state.id}`}
                src={state.chevron}
                alt=""
                className={`maps-section__chevron-icon${i === stateIndex ? " maps-section__chevron-icon--active" : ""}`}
              />
            ))}
          </span>
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
        {slides.map((slide, index) => {
          // Every slide is stacked in the same box, so all of them count as
          // "in viewport" and loading="lazy" alone still fetches the lot. The
          // gallery images come straight from Supabase at full upload size, so
          // only the current slide and its neighbours get a real src; the rest
          // stay empty until the carousel reaches them.
          const distance = Math.min(
            Math.abs(index - current),
            slides.length - Math.abs(index - current)
          );
          const shouldLoad = distance <= 1;
          return (
          <div
            key={slide.id}
            className={`gallery-slide${index === current ? " active" : ""} gallery-slide--clickable`}
            onClick={() => handleSlideClick(slide)}
          >
            {shouldLoad && (
              <img
                src={slide.img}
                alt={slide.subtitle}
                className="gallery-slide__img"
                loading={index === current ? "eager" : "lazy"}
                decoding="async"
              />
            )}
            <div className="gallery-slide__gradient" />
            <div className="gallery-slide__bar" style={{ backgroundColor: slide.accentColor }}>
              <div className="gallery-slide__info">
                <h3>{slide.subtitle}</h3>
                <p>{slide.sub2}</p>
              </div>
              {slide.hasPlay ? <button className="gallery-play-btn">&#9658;</button> : null}
            </div>
          </div>
          );
        })}

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
  const [isRegistered] = useState(false);

  useScrollReveal();

  return (
    <div className="page-shell">
      <TopBar isAuthenticated={isRegistered} user={{ name: "Usuario Válido", initials: "UV" }} />
      <Maps />
      <Gallery />
      <Glossary />
      <CTASection />
      <Footer />
    </div>
  );
}
