import { useEffect, useState } from "react";
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
    subtitle: "Patrimonio",
    description:
      "Recorre los sitios históricos y emblemáticos que cuentan la historia viva de Valledupar.",
    image: "/assets/rutas/rutapatri.png",
    color: "#8B6B4A",
  },
  {
    id: "gastronomica",
    title: "Ruta Gastronómica",
    subtitle: "Gastronomía",
    description:
      "Descubre los sabores auténticos del Valle de Upar a través de sus platos tradicionales.",
    image: "/assets/rutas/rutagastro.png",
    color: "#C07536",
  },
  {
    id: "mistica",
    title: "Ruta Mística",
    subtitle: "Mística",
    description:
      "Sumérgete en los paisajes espirituales y naturales que inspiran la magia vallenata.",
    image: "/assets/rutas/rutamis.png",
    color: "#4A6B5D",
  },
  {
    id: "general",
    title: "Gran Mapa General",
    subtitle: "Completo",
    description:
      "Explora todos los puntos de todas las rutas en un solo mapa. Cada ruta se muestra con su color distintivo.",
    image: "/assets/rutas/granmapa.png",
    color: "#5d4037",
  },
];

export default function RutasInteractivas() {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [hoveredRoute, setHoveredRoute] = useState(null);
  const [highlightedPoint, setHighlightedPoint] = useState(null);
  const [pointsData, setPointsData] = useState([]);
  const [connectionsData, setConnectionsData] = useState([]);
  const [routeLegend, setRouteLegend] = useState([]);
  const [mapFilter, setMapFilter] = useState("none");

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
                className="rutas-interactivas__back-btn"
                onClick={() => setSelectedRoute(null)}
                aria-label="Volver"
              >
                <svg
                  width="18"
                  height="18"
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
                  <div className="rutas-interactivas__route-card-bg">
                    <img
                      src={route.image}
                      alt={route.title}
                      loading="lazy"
                    />
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
