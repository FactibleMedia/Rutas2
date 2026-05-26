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
    type: "intro",
    mainSubtitle: "Rutas De",
    mainTitle: "VALLEDUPAR",
    description:
      "Bienvenido a recorrer las rutas del viejo Valle, aquí mantenemos la herencia viva de un patrimonio que todavía se conserva.",
    bottomTitle: "CENTRO HISTÓRICO",
    imageUrl: heroCentro,
  },
  {
    id: 2,
    type: "standard",
    bottomTitle: "ARQUITECTURA",
    imageUrl: heroArquitectura,
  },
  {
    id: 3,
    type: "standard",
    bottomTitle: "LUGARES MÍSTICOS",
    imageUrl: heroMistico,
  },
  {
    id: 4,
    type: "standard",
    bottomTitle: "SABORES TRADICIONALES",
    imageUrl: heroGastro,
  },
];

export default function InitialSlider() {
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

  return (
    <section id="inicio" className="initial-slider">
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

      <div className="initial-slider__content">
        <div className={`initial-slider__stage1 ${currentIndex === 0 ? "active" : "inactive"}`}>
          <div className="initial-slider__stage1-meta">
            <img src={logoWhiteHero} alt="Rutas de Valledupar" className="initial-slider__brand-logo" />
            <p className="initial-slider__description">{slides[0].description}</p>
            <button className="initial-slider__button">EXPLORA EL MAPA</button>
          </div>
        </div>

        <div className="initial-slider__cards">
          {slides.map((slide, index) => {
            const offset = index - currentIndex;
            let transform = "translateX(150%) scale(0.5)";
            let opacity = 0;
            let zIndex = 10;
            let filter = "brightness(1)";

            if (offset === 0) {
              transform = currentIndex === 0 ? "translateX(8vw) scale(1)" : "translateX(0) scale(1)";
              opacity = 1;
              zIndex = 30;
            } else if (offset === 1) {
              transform = currentIndex === 0 ? "translateX(75vw) scale(0.65)" : "translateX(40vw) scale(0.7)";
              opacity = 0.85;
              zIndex = 20;
              filter = currentIndex === 0 ? "brightness(1)" : "brightness(0.5)";
            } else if (offset === -1) {
              transform = "translateX(-40vw) scale(0.65)";
              opacity = 0.75;
              zIndex = 20;
              filter = "brightness(0.5)";
            }

            return (
              <div
                key={slide.id}
                className="initial-slider__card"
                style={{ transform, opacity, zIndex, filter }}
              >
                <img src={slide.imageUrl} alt={slide.bottomTitle} />
                <div className="initial-slider__card-caption">
                  <span>{slide.bottomTitle}</span>
                </div>
              </div>
            );
          })}
        </div>

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
          <div className={`initial-slider__bottom-button ${currentIndex > 0 ? "visible" : "hidden"}`}>
            <button className="initial-slider__button">EXPLORA EL MAPA</button>
          </div>
        </div>

        <div className="initial-slider__nav">
          <button
            className="initial-slider__arrow initial-slider__arrow--left"
            onClick={prevSlide}
            disabled={currentIndex === 0 || isTransitioning}
          >
            <span />
          </button>
          <button
            className="initial-slider__arrow initial-slider__arrow--right"
            onClick={nextSlide}
            disabled={currentIndex === slides.length - 1 || isTransitioning}
          >
            <span />
          </button>
        </div>
      </div>
    </section>
  );
}
