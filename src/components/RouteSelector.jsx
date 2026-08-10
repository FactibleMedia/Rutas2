import { useState, useEffect } from 'react';
import { MapPin, Utensils, Sparkles, Map, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './RouteSelector.css';

const RUTAS_DATA = [
  {
    id: "patrimoniales",
    title: "Rutas Patrimoniales",
    description: "Recorre los sitios históricos y emblemáticos que cuentan la historia viva de Valledupar. Un viaje a través de la arquitectura y la tradición.",
    image: "/assets/rutas/patri.png",
    icon: MapPin,
    color: "from-amber-900/90 via-amber-900/40 to-transparent",
    accent: "bg-amber-600",
    accentColor: "#92400e"
  },
  {
    id: "gastronomica",
    title: "Ruta Gastronómica",
    description: "Descubre los sabores auténticos de nuestra tierra. Desde arepas de queso hasta los mejores platos tradicionales de la región.",
    image: "/assets/rutas/Gastro.png",
    icon: Utensils,
    color: "from-orange-900/90 via-orange-900/40 to-transparent",
    accent: "bg-orange-600",
    accentColor: "#9a3412"
  },
  {
    id: "mistica",
    title: "Ruta Mística",
    description: "Adéntrate en las leyendas y mitos que envuelven la ciudad. Conoce las historias de las sirenas del río Guatapurí y mucho más.",
    image: "/assets/rutas/Sirena1.png",
    icon: Sparkles,
    color: "from-emerald-900/90 via-emerald-900/40 to-transparent",
    accent: "bg-emerald-600",
    accentColor: "#065f46"
  },
  {
    id: "mapa-general",
    title: "Ver todas las rutas en el mapa",
    description: "Una vista panorámica de todas las rutas y puntos de interés. Planifica tu viaje completo desde un solo lugar interactivo.",
    image: "/assets/rutas/gran.png",
    icon: Map,
    color: "from-stone-900/90 via-stone-900/40 to-transparent",
    accent: "bg-stone-600",
    accentColor: "#44403c"
  }
];

export default function RouteSelector() {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState(null);

  // Load custom fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, []);

  const handleExploreRoute = (rutaId) => {
    navigate(`/rutas-interactivas?ruta=${rutaId}`);
  };

  return (
    <div className="route-selector">
      <div className="route-selector__header">
        <div className="route-selector__subtitle-line">
          <div className="route-selector__line"></div>
          <span className="route-selector__subtitle">
            Explora Valledupar
          </span>
          <div className="route-selector__line"></div>
        </div>
        
        <h1 className="route-selector__title">
          ELIGE TU RUTA
        </h1>
        
        <p className="route-selector__description">
          Cada camino tiene una historia por contar. Pasa el cursor sobre una ruta y descubre los tesoros ocultos de nuestra tierra.
        </p>
      </div>

      <div 
        className="route-selector__cards"
        onMouseLeave={() => setHoveredId(null)}
      >
        {RUTAS_DATA.map((ruta) => {
          const isHovered = hoveredId === ruta.id;
          const isAnyHovered = hoveredId !== null;
          
          const flexClass = isHovered 
            ? 'route-selector__card--expanded'
            : (isAnyHovered ? 'route-selector__card--collapsed' : 'route-selector__card--default');

          return (
            <div
              key={ruta.id}
              onMouseEnter={() => setHoveredId(ruta.id)}
              onClick={() => {
                setHoveredId(ruta.id);
                handleExploreRoute(ruta.id);
              }}
              className={`route-selector__card ${flexClass}`}
            >
              {/* Background image with zoom effect */}
              <img
                src={ruta.image}
                alt={ruta.title}
                className={`route-selector__card-image ${isHovered ? 'route-selector__card-image--zoomed' : ''}`}
              />

              {/* Gradient overlays for text readability */}
              <div className="route-selector__card-overlay" />
              <div className={`route-selector__card-gradient ${ruta.color}`} />
              <div className={`route-selector__card-dark-overlay ${isHovered ? 'route-selector__card-dark-overlay--light' : ''}`} />

              {/* Centered content container */}
              <div className="route-selector__card-content">
                <div className={`route-selector__card-content-inner ${isHovered ? 'route-selector__card-content-inner--expanded' : ''}`}>
                  
                  {/* Icon */}
                  <div className={`route-selector__card-icon ${isHovered ? 'route-selector__card-icon--active' : ''}`}
                    style={{ backgroundColor: isHovered ? ruta.accentColor : 'rgba(255,255,255,0.1)' }}>
                    <ruta.icon className={`route-selector__card-icon-svg ${isHovered ? 'text-white' : 'text-white/80'}`} />
                  </div>

                  {/* Title */}
                  <h2 
                    className={`route-selector__card-title ${isHovered ? 'route-selector__card-title--expanded' : ''}`}
                  >
                    {ruta.title}
                  </h2>

                  {/* Description and button - shown on hover */}
                  <div className={`route-selector__card-details ${isHovered ? 'route-selector__card-details--visible' : ''}`}>
                    <p className="route-selector__card-text">
                      {ruta.description}
                    </p>
                    
                    <button 
                      className="route-selector__card-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExploreRoute(ruta.id);
                      }}
                    >
                      <span>Explorar Ruta</span>
                      <ArrowRight className="route-selector__card-btn-icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="route-selector__footer">
        <Sparkles className="route-selector__footer-icon" />
        <span>Pasa el cursor sobre las tarjetas para descubrir más</span>
      </div>
    </div>
  );
}
