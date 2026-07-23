import { useState } from "react";
import TopBar from "../TopBar";
import Footer from "../Footer";
import InteractiveMap from "./InteractiveMap";
import "./RutasInteractivas.css";

const GASTRONOMICA_POINTS = [
  { id: 1, title: "Mirador Santo Eccehomo", x: 62, y: 35, img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80", desc: "Un mirador espectacular que ofrece vistas panorámicas de toda la ciudad de Valledupar." },
  { id: 2, title: "Jardines del Eccehomo", x: 57, y: 22, img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80", desc: "Espacios naturales llenos de color y tranquilidad ideales para caminatas relajantes." },
  { id: 3, title: "Escuela Ambiental", x: 53, y: 18, img: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=400&q=80", desc: "Centro de aprendizaje enfocado en la conservación y educación ecológica." },
  { id: 4, title: "Balneario Hurtado", x: 42, y: 18, img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80", desc: "El corazón recreativo de la ciudad, famoso por sus aguas frescas del río Guatapurí." },
  { id: 5, title: "Parque La Provincia", x: 38, y: 13, img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80", desc: "Un parque moderno lleno de cultura, música y monumentos que rinden homenaje al folclor." },
  { id: 6, title: "Parque La Leyenda", x: 34, y: 18, img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80", desc: "Espacio cultural emblemático donde se respira la tradición vallenata." },
  { id: 7, title: "Sitio 7", x: 34, y: 25, img: "https://images.unsplash.com/photo-1621351188439-d3e51d45c11f?w=400&q=80", desc: "Rincón histórico con gran valor cultural para la región." },
  { id: 8, title: "Sitio 8", x: 38, y: 29, img: "https://images.unsplash.com/photo-1506368083636-6defb67049a4?w=400&q=80", desc: "Zona comercial típica con artesanías y gastronomía local." },
  { id: 9, title: "Sitio 9", x: 48, y: 38, img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80", desc: "Punto de encuentro estratégico en el corazón de la ciudad." },
  { id: 10, title: "Sitio 10", x: 53, y: 38, img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&q=80", desc: "Un sector vibrante con historia reciente y desarrollo urbanístico." },
  { id: 11, title: "Sitio 11", x: 38, y: 53, img: "https://images.unsplash.com/photo-1550966871-3ed39b5ed035?w=400&q=80", desc: "Zona verde estratégica de conexión ambiental." },
  { id: 12, title: "Sitio 12", x: 50, y: 85, img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=400&q=80", desc: "Mirador sur para disfrutar del atardecer vallenato." },
];

const GASTRONOMICA_ROUTES = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1],
  [11, 12],
];

const routeOptions = [
  {
    id: "patrimoniales",
    title: "Rutas Patrimoniales",
    subtitle: "Patrimonio",
    description:
      "Recorre los sitios históricos y emblemáticos que cuentan la historia viva de Valledupar.",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=900&q=80",
    color: "#8B6B4A",
  },
  {
    id: "gastronomica",
    title: "Ruta Gastronómica",
    subtitle: "Gastronomía",
    description:
      "Descubre los sabores auténticos del Valle de Upar a través de sus platos tradicionales.",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80",
    color: "#C07536",
  },
  {
    id: "mistica",
    title: "Ruta Mística",
    subtitle: "Mística",
    description:
      "Sumérgete en los paisajes espirituales y naturales que inspiran la magia vallenata.",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=80",
    color: "#4A6B5D",
  },
];

export default function RutasInteractivas() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [hoveredRoute, setHoveredRoute] = useState(null);

  // When a route is selected, show its map (placeholder for now)
  if (selectedRoute) {
    const route = routeOptions.find((r) => r.id === selectedRoute);
    return (
      <div className="page-shell rutas-interactivas-page">
        <TopBar activeSection="rutas-interactivas" />
        <main className="rutas-interactivas__main">
          <section className="rutas-interactivas__map-section">
            <button
              className="rutas-interactivas__back-btn"
              onClick={() => setSelectedRoute(null)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Volver a rutas
            </button>
            <div className="rutas-interactivas__map-header">
              <h2 className="rutas-interactivas__map-title">{route.title}</h2>
              <p className="rutas-interactivas__map-desc">
                {route.description}
              </p>
            </div>
            <InteractiveMap
              title={route.title}
              description={route.description}
              pointsData={GASTRONOMICA_POINTS}
              routes={GASTRONOMICA_ROUTES}
              mapImage="/assets/mapa-general.png"
            />
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell rutas-interactivas-page">
      <TopBar activeSection="rutas-interactivas" />

      <main className="rutas-interactivas__main">
        {/* Hero */}
        <section className="rutas-interactivas__hero">
          <div className="rutas-interactivas__hero-bg" />
          <div className="rutas-interactivas__hero-inner">
            <span className="rutas-interactivas__hero-eyebrow">
              Explora Valledupar
            </span>
            <h1 className="rutas-interactivas__hero-title">
              Elige tu ruta
            </h1>
            <p className="rutas-interactivas__hero-subtitle">
              Cada camino tiene una historia por contar. Selecciona una ruta y
              descubre los tesoros ocultos de nuestra tierra.
            </p>
          </div>
        </section>

        {/* Route Cards */}
        <section className="rutas-interactivas__routes">
          <div className="rutas-interactivas__routes-grid">
            {routeOptions.map((route) => {
              const isHovered = hoveredRoute === route.id;
              return (
                <button
                  key={route.id}
                  className={`rutas-interactivas__route-card${
                    isHovered ? " rutas-interactivas__route-card--hovered" : ""
                  }`}
                  onClick={() => setSelectedRoute(route.id)}
                  onMouseEnter={() => setHoveredRoute(route.id)}
                  onMouseLeave={() => setHoveredRoute(null)}
                  style={{ "--card-accent": route.color }}
                >
                  {/* Background Image */}
                  <div className="rutas-interactivas__route-card-bg">
                    <img
                      src={route.image}
                      alt={route.title}
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay Gradient */}
                  <div className="rutas-interactivas__route-card-overlay" />

                  {/* Content */}
                  <div className="rutas-interactivas__route-card-content">
                    <span className="rutas-interactivas__route-card-tag">
                      {route.subtitle}
                    </span>
                    <h3 className="rutas-interactivas__route-card-title">
                      {route.title}
                    </h3>
                    <p className="rutas-interactivas__route-card-desc">
                      {route.description}
                    </p>
                    <span className="rutas-interactivas__route-card-action">
                      <span>Explorar ruta</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`rutas-interactivas__route-card-arrow${
                          isHovered
                            ? " rutas-interactivas__route-card-arrow--animated"
                            : ""
                        }`}
                      >
                        <path d="M5 12h14" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Bottom decoration */}
        <section className="rutas-interactivas__bottom">
          <div className="rutas-interactivas__bottom-divider">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
