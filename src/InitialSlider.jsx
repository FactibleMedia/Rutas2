import { useEffect, useState } from "react";
import heroCentro from "./assets/mcp/hero_centro.png";
import heroArquitectura from "./assets/mcp/hero_arquitectura.png";
import heroMistico from "./assets/mcp/hero_mistico.png";
import heroGastro from "./assets/mcp/hero_gastro.png";
import logoWhiteHero from "./assets/mcp/logo_white_hero.png";
import "./InitialSlider.css";

const slides = [
  {
    id: 1,
    description:
      "Bienvenido a recorrer las rutas del viejo Valle, aquí mantenemos la herencia viva de un patrimonio que todavía se conserva.",
    bottomTitle: "CENTRO HISTÓRICO",
    imageUrl: heroCentro,
  },
  {
    id: 2,
    bottomTitle: "ARQUITECTURA",
    imageUrl: heroArquitectura,
  },
  {
    id: 3,
    bottomTitle: "LUGARES MÍSTICOS",
    imageUrl: heroMistico,
  },
  {
    id: 4,
    bottomTitle: "SABORES TRADICIONALES",
    imageUrl: heroGastro,
  },
];

export default function InitialSlider({ onNavigate }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = () => {
    if (currentIndex < slides.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 700);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const handleExploreMap = () => {
    if (onNavigate) {
      onNavigate("mapas");
    } else {
      const target = document.getElementById("mapas");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <section id="inicio" className="initial-slider">
      {/* ── Background ── */}
      <div className="initial-slider__background">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className="initial-slider__background-slide"
            style={{ opacity: currentIndex === index ? 1 : 0 }}
          >
            <img src={slide.imageUrl} alt={slide.bottomTitle} />
          </div>
        ))}
        <div className="initial-slider__background-overlay" />
      </div>

      {/* ── Content ── */}
      <div className="initial-slider__content">
        {/* Stage 1 — intro hero (visible solo en el primer slide) */}
        <div
          className={`initial-slider__stage1 ${currentIndex === 0 ? "active" : "inactive"}`}
        >
          <div className="initial-slider__stage1-meta">
            <img
              src={logoWhiteHero}
              alt="Rutas de Valledupar"
              className="initial-slider__brand-logo"
            />
            <p className="initial-slider__description">{slides[0].description}</p>
            <button className="initial-slider__button" onClick={handleExploreMap}>
              EXPLORA EL MAPA
            </button>
          </div>
        </div>

        {/* Cards deck — imágenes con background-position */}
        <div className="initial-slider__cards">
          {slides.map((slide, index) => {
            const offset = index - currentIndex;
            let transform = "translateX(150%) scale(0.5)";
            let opacity = 0;
            let zIndex = 10;

            if (offset === 0) {
              transform = currentIndex === 0
                ? "translateX(8vw) scale(1)"
                : "translateX(0) scale(1)";
              opacity = 1;
              zIndex = 30;
            } else if (offset === 1) {
              transform = currentIndex === 0
                ? "translateX(75vw) scale(0.65)"
                : "translateX(40vw) scale(0.7)";
              opacity = 0.85;
              zIndex = 20;
            } else if (offset === -1) {
              transform = "translateX(-40vw) scale(0.65)";
              opacity = 0.75;
              zIndex = 20;
            }

            return (
              <div
                key={slide.id}
                className="initial-slider__card"
                style={{
                  transform,
                  opacity,
                  zIndex,
                  backgroundImage: `url(${slide.imageUrl})`,
                  backgroundPosition: "-69.161px 0px",
                  backgroundSize: "216.253% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "lightgray",
                }}
              >
                <div className="initial-slider__card-caption">
                  <span>{slide.bottomTitle}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer — título abajo + botón */}
        <div className="initial-slider__footer">
          <div className="initial-slider__bottom-title">
            {slides.map((slide, index) => (
              <span
                key={slide.id}
                className={`initial-slider__bottom-text ${currentIndex === index ? "active" : "inactive"}`}
              >
                {slide.bottomTitle}
              </span>
            ))}
          </div>
          <div
            className={`initial-slider__bottom-button ${currentIndex > 0 ? "visible" : "hidden"}`}
          >
            <button className="initial-slider__button" onClick={handleExploreMap}>
              EXPLORA EL MAPA
            </button>
          </div>
        </div>

        {/* ── Navigation arrows ── */}
        <div className="initial-slider__nav">
          <button
            className="initial-slider__arrow initial-slider__arrow--left"
            onClick={prevSlide}
            disabled={currentIndex === 0 || isTransitioning}
            aria-label="Anterior"
          >
            <span />
          </button>
          <button
            className="initial-slider__arrow initial-slider__arrow--right"
            onClick={nextSlide}
            disabled={currentIndex === slides.length - 1 || isTransitioning}
            aria-label="Siguiente"
          >
            <span />
          </button>
        </div>

        {/* ── Slide indicators ── */}
        <div className="initial-slider__indicators">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`initial-slider__dot ${currentIndex === index ? "initial-slider__dot--active" : ""}`}
              onClick={() => {
                if (!isTransitioning && index !== currentIndex) {
                  setIsTransitioning(true);
                  setCurrentIndex(index);
                }
              }}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
