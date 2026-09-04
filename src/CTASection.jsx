import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ctaBgMap from "./assets/mcp/cta_bg_mapa_gastronomico.webp";
import ctaBgIcon from "./assets/mcp/icon_bg_cta.svg";
import "./styles.css";

// Shared "¿Listo para explorar Valledupar?" block. Figma places this same
// container at the bottom of several page frames (Inicio and Glosario both
// carry it), so it lives here rather than inside one page.
//
// It carries the `reveal` class, which starts at opacity 0 and only becomes
// visible once something adds `visible` -- InicioPage runs a page-wide
// observer for that, but other pages don't, so this component observes
// itself instead of depending on its host.
export default function CTASection() {
  const navigate = useNavigate();
  const sectionRef = useRef(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) node.classList.add("visible");
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="cta-section reveal" ref={sectionRef}>
      <div className="cta-section__bg-map" aria-hidden="true">
        <img src={ctaBgMap} alt="" loading="lazy" />
      </div>
      <img src={ctaBgIcon} alt="" className="cta-section__bg-icon" loading="lazy" />
      <h2>¿Listo para explorar Valledupar?</h2>
      <p>Planifica tu ruta ahora mismo desde el mapa interactivo</p>
      <button className="cta-section__btn" onClick={() => navigate("/mapas")}>
        Ver el mapa interactivo
      </button>
    </section>
  );
}
