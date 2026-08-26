import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, Utensils, Sparkles, Map, ArrowRight } from "lucide-react";
import TopBar from "../TopBar";
import Footer from "../Footer";
import InteractiveMap from "./InteractiveMap";
import { supabase } from "../supabaseClient";
import "./RutasInteractivas.css";

const ROUTE_COLORS = {
  patrimoniales: { color: "#8B6B4A", overlay: "sepia(0.3) saturate(0.8)" },
  gastronomica: { color: "#C07536", overlay: "sepia(0.5) saturate(1.2) hue-rotate(-10deg)" },
  mistica: { color: "#4A6B5D", overlay: "sepia(0.2) saturate(0.7) hue-rotate(80deg)" },
  general: { color: "#5d4037", overlay: "none" },
};

const routeOptions = [
  {
    id: "patrimoniales",
    title: "Rutas Patrimoniales",
    description:
      "Recorre los sitios históricos y emblemáticos que cuentan la historia viva de Valledupar. Un viaje a través de la arquitectura y la tradición.",
    image: "/assets/rutas/gran.png",
    icon: MapPin,
    gradient: "from-amber-900/90 via-amber-900/40 to-transparent",
    accentColor: "bg-amber-600",
    color: "#8B6B4A",
  },
  {
    id: "gastronomica",
    title: "Ruta Gastronómica",
    description:
      "Descubre los sabores auténticos de nuestra tierra. Desde arepas de queso hasta los mejores platos tradicionales de la región.",
    image: "/assets/rutas/Gastro.png",
    icon: Utensils,
    gradient: "from-orange-900/90 via-orange-900/40 to-transparent",
    accentColor: "bg-orange-600",
    color: "#C07536",
  },
  {
    id: "mistica",
    title: "Ruta Mística",
    description:
      "Adéntrate en las leyendas y mitos que envuelven la ciudad. Conoce las historias de las sirenas del río Guatapurí y mucho más.",
    image: "/assets/rutas/Sirena1.png",
    icon: Sparkles,
    gradient: "from-emerald-900/90 via-emerald-900/40 to-transparent",
    accentColor: "bg-emerald-600",
    color: "#4A6B5D",
  },
  {
    id: "general",
    title: "Ver todas las rutas en el mapa",
    description:
      "Una vista panorámica de todas las rutas y puntos de interés. Planifica tu viaje completo desde un solo lugar interactivo.",
    image: "/assets/rutas/patri.png",
    icon: Map,
    gradient: "from-stone-900/90 via-stone-900/40 to-transparent",
    accentColor: "bg-stone-600",
    color: "#5d4037",
  },
];

export default function RutasInteractivas() {
  const [searchParams] = useSearchParams();
  const [selectedRoute, setSelectedRoute] = useState(searchParams.get("ruta") || null);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [pointsData, setPointsData] = useState([]);
  const [connectionsData, setConnectionsData] = useState([]);
  const [routeLegend, setRouteLegend] = useState([]);
  const [mapFilter, setMapFilter] = useState("none");
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Load points and connections from Supabase when a route is selected
  useEffect(() => {
    if (!selectedRoute) return;

    async function loadMapData() {
      if (selectedRoute === "general") {
        // Load ALL categories for the Gran Mapa General
        const slugs = ["patrimoniales", "gastronomica", "mistica"];
        const [puntosRes, conexRes] = await Promise.all([
          supabase
            .from("rutas_interactivas_puntos")
            .select("*")
            .in("categoria_slug", slugs)
            .eq("activo", true)
            .order("orden"),
          supabase
            .from("rutas_interactivas_conexiones")
            .select("*")
            .in("categoria_slug", slugs),
        ]);

        if (puntosRes.error) {
          console.warn("Error cargando puntos:", puntosRes.error);
        } else {
          setPointsData(puntosRes.data || []);
        }
        if (conexRes.error) {
          console.warn("Error cargando conexiones:", conexRes.error);
        } else {
          const data = conexRes.data || [];
          // Build connections with their category colors
          const conns = data.map((conn) => ({
            points: conn.puntos_orden,
            category: conn.categoria_slug,
            color: ROUTE_COLORS[conn.categoria_slug]?.color || "#5d4037",
          }));
          setConnectionsData(conns);
          // Build route legend
          const legend = slugs.map((s) => ({
            id: s,
            nombre: routeOptions.find((r) => r.id === s)?.title || s,
            color: ROUTE_COLORS[s]?.color || "#5d4037",
            count: data.filter((c) => c.categoria_slug === s).length,
          }));
          setRouteLegend(legend);
        }
        setMapFilter("none");
      } else {
        // Load single category
        const [puntosRes, conexRes] = await Promise.all([
          supabase
            .from("rutas_interactivas_puntos")
            .select("*")
            .eq("categoria_slug", selectedRoute)
            .eq("activo", true)
            .order("orden"),
          supabase
            .from("rutas_interactivas_conexiones")
            .select("*")
            .eq("categoria_slug", selectedRoute),
        ]);

        if (puntosRes.error) {
          console.warn("Error cargando puntos:", puntosRes.error);
        } else {
          setPointsData(puntosRes.data || []);
        }
        if (conexRes.error) {
          console.warn("Error cargando conexiones:", conexRes.error);
        } else {
          const routes = (conexRes.data || []).map((conn) => conn.puntos_orden);
          setConnectionsData(routes);
        }
        setRouteLegend([]);
        // Apply color filter based on route
        const filter = ROUTE_COLORS[selectedRoute]?.overlay || "none";
        setMapFilter(filter);
      }
    }

    loadMapData();
  }, [selectedRoute]);

  // When a route is selected, show its map
  if (selectedRoute) {
    const route = routeOptions.find((r) => r.id === selectedRoute);
    return (
      <div className="page-shell rutas-interactivas-page">
        <TopBar activeSection="rutas-interactivas" />
        <main className="rutas-interactivas__main">
          <section className="rutas-interactivas__map-section">
            <div className="rutas-interactivas__map-top">
              <button
                className="rutas-interactivas__back-btn-lg"
                onClick={() => setSelectedRoute(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                </svg>
                Volver a rutas
              </button>
              <h2 className="rutas-interactivas__map-title">{route.title}</h2>
            </div>
            <p className="rutas-interactivas__map-desc">
              {route.description}
            </p>
            <InteractiveMap
              title={route.title}
              description={route.description}
              pointsData={pointsData}
              routes={connectionsData}
              mapImage="/assets/mapa-general.png"
              mapFilter={mapFilter}
              routeLegend={routeLegend}
              isGeneral={selectedRoute === "general"}
              highlightedPoint={highlightedPoint}
              onHighlightPoint={setHighlightedPoint}
              activeCategory={selectedRoute}
            />

            {/* Download section */}
            <section className="rutas-interactivas__download">
              <h3 className="rutas-interactivas__download-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Descarga nuestros mapas y rutas
              </h3>
              <p className="rutas-interactivas__download-desc">
                Lleva contigo los mapas de las rutas turísticas de Valledupar.
              </p>
              <div className="rutas-interactivas__download-grid">
                {routeOptions.map((r) => (
                  <a key={r.id} href={r.image} download={`${r.title}.png`}
                    className="rutas-interactivas__download-btn"
                    style={{ "--btn-accent": r.color }}>
                    <span className="rutas-interactivas__download-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </span>
                    <span className="rutas-interactivas__download-label">{r.title}</span>
                  </a>
                ))}
              </div>
            </section>
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
        {/* Card Selector Section */}
        <section className="ri-selector">
          {/* Header */}
          <div className="ri-selector__header">
            <div className="ri-selector__subtitle-line">
              <div className="ri-selector__line"></div>
              <span className="ri-selector__subtitle">Explora Valledupar</span>
              <div className="ri-selector__line"></div>
            </div>
            <h1 className="ri-selector__title">ELIGE TU RUTA</h1>
            <p className="ri-selector__description">
              Cada camino tiene una historia por contar. Pasa el cursor sobre una ruta y descubre los tesoros ocultos de nuestra tierra.
            </p>
          </div>

          {/* Cards Container */}
          <div
            className="ri-selector__cards"
            onMouseLeave={() => setHoveredCardId(null)}
          >
            {routeOptions.map((ruta) => {
              const isHovered = hoveredCardId === ruta.id;
              const isAnyHovered = hoveredCardId !== null;
              const IconComponent = ruta.icon;

              const flexClass = isHovered
                ? "ri-selector__card--expanded"
                : isAnyHovered
                  ? "ri-selector__card--collapsed"
                  : "ri-selector__card--default";

              return (
                <div
                  key={ruta.id}
                  onMouseEnter={() => setHoveredCardId(ruta.id)}
                  onClick={() => setSelectedRoute(ruta.id)}
                  className={`ri-selector__card ${flexClass}`}
                >
                  {/* Background image */}
                  <img
                    src={ruta.image}
                    alt={ruta.title}
                    className={`ri-selector__card-image ${isHovered ? "ri-selector__card-image--zoomed" : ""}`}
                  />

                  {/* Gradient overlays */}
                  <div className="ri-selector__card-overlay" />
                  <div className="ri-selector__card-gradient" />
                  <div className={`ri-selector__card-dark-overlay ${isHovered ? "ri-selector__card-dark-overlay--light" : ""}`} />

                  {/* Content */}
                  <div className="ri-selector__card-content">
                    <div className={`ri-selector__card-content-inner ${isHovered ? "ri-selector__card-content-inner--expanded" : ""}`}>
                      {/* Icon */}
                      <div
                        className={`ri-selector__card-icon ${isHovered ? "ri-selector__card-icon--active" : ""}`}
                        style={{ backgroundColor: isHovered ? "#c07536" : "rgba(255,255,255,0.1)" }}
                      >
                        <IconComponent className={`ri-selector__card-icon-svg ${isHovered ? "ri-selector__card-icon-svg--white" : ""}`} />
                      </div>

                      {/* Title */}
                      <h2 className={`ri-selector__card-title ${isHovered ? "ri-selector__card-title--expanded" : ""}`}>
                        {ruta.title}
                      </h2>

                      {/* Description and button */}
                      <div className={`ri-selector__card-details ${isHovered ? "ri-selector__card-details--visible" : ""}`}>
                        <p className="ri-selector__card-text">{ruta.description}</p>
                        <button
                          className="ri-selector__card-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRoute(ruta.id);
                          }}
                        >
                          <span>Explorar Ruta</span>
                          <ArrowRight className="ri-selector__card-btn-icon" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer hint */}
          <div className="ri-selector__footer">
            <Sparkles className="ri-selector__footer-icon" />
            <span>Pasa el cursor sobre las tarjetas para descubrir más</span>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
