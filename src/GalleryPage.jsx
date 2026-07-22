import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Footer from "./Footer";
import { supabase } from "./supabaseClient";
import "./GalleryPage.css";

/* =========================================================
   Image Assets from /assets/gallery/
   ========================================================= */

const imgFestivalUstaris = "/assets/gallery/FESTIVAL_Ustaris 1.png";
const imgFestivalIglesia = "/assets/gallery/FESTIVAL_Iglesia 1.png";
const imgPostal3 = "/assets/gallery/postal3.png";
const imgPostalPlazaMarco = "/assets/gallery/Postal_Plaza_CON MARCO 1.png";

/* =========================================================
   Photo Data – Block 1
   ========================================================= */

const photoData = [
  {
    id: 0,
    imgSrc: imgPostal3,
    borderClass: "gallery-hero__photo-inner--green",
    filterClass: "gallery-hero__photo-img--contrast-sepia",
  },
  {
    id: 1,
    imgSrc: imgPostalPlazaMarco,
    borderClass: "gallery-hero__photo-inner--yellow",
    filterClass: "gallery-hero__photo-img--contrast-saturate",
  },
  {
    id: 2,
    imgSrc: imgPostalPlazaMarco,
    borderClass: "gallery-hero__photo-inner--yellow",
    filterClass: "gallery-hero__photo-img--contrast-bright",
  },
];

/* =========================================================
   Helper: Extract YouTube embed URL
   ========================================================= */

function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1&rel=0`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`;
    }
  } catch {}
  return url;
}

/* =========================================================
   House SVG Component (for Block 2)
   ========================================================= */

function HouseLeftSVG() {
  return (
    <svg viewBox="0 0 140 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 100H130L140 115H0L10 100Z" fill="#eeb37c" />
      <path d="M20 90H120L130 100H10L20 90Z" fill="#e28743" />
      <rect x="25" y="45" width="90" height="45" fill="#fbe6d4" />
      <rect x="25" y="45" width="45" height="45" fill="#fdf2e8" />
      <rect x="20" y="45" width="12" height="45" fill="#f4c69f" />
      <rect x="108" y="45" width="12" height="45" fill="#f4c69f" />
      <rect x="45" y="55" width="50" height="35" fill="#32495e" />
      <rect x="47" y="57" width="21" height="31" fill="#253545" />
      <rect x="72" y="57" width="21" height="31" fill="#253545" />
      <path d="M47 65H93M47 75H93M47 85H93" stroke="#32495e" strokeWidth="2" />
      <path d="M57 57V88M67 57V88M77 57V88M87 57V88" stroke="#32495e" strokeWidth="2" />
      <rect x="15" y="35" width="110" height="10" fill="#fbe6d4" />
      <path d="M5 40C15 20 30 10 70 10C110 10 125 20 135 40L140 45H0L5 40Z" fill="#754b38" />
      <path d="M5 40C15 20 30 10 70 10C90 10 100 15 110 25L135 40" stroke="#5a3828" strokeWidth="4" strokeLinecap="round" />
      <circle cx="40" cy="25" r="4" fill="#5a3828" />
      <circle cx="80" cy="20" r="6" fill="#5a3828" />
      <circle cx="110" cy="30" r="3" fill="#5a3828" />
      <circle cx="60" cy="32" r="5" fill="#5a3828" />
    </svg>
  );
}

function HouseRightSVG() {
  return (
    <svg viewBox="0 0 160 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 95H145L155 105H5L15 95Z" fill="#fce5cd" />
      <rect x="25" y="40" width="110" height="55" fill="#f9d9bc" />
      <path d="M25 40H80V95H25V40Z" fill="#fae3ce" />
      <rect x="85" y="60" width="18" height="35" fill="#2c4c68" />
      <rect x="40" y="65" width="20" height="15" fill="#694a38" />
      <rect x="42" y="67" width="7" height="11" fill="#4a3225" />
      <rect x="51" y="67" width="7" height="11" fill="#4a3225" />
      <rect x="115" y="65" width="12" height="15" fill="#e8c7a8" />
      <path d="M117 68H125M117 72H123" stroke="#b08b68" strokeWidth="1" />
      <path d="M70 95V75" stroke="#5a4231" strokeWidth="3" strokeLinecap="round" />
      <path d="M70 85L65 75" stroke="#5a4231" strokeWidth="2" strokeLinecap="round" />
      <circle cx="70" cy="70" r="12" fill="#719448" />
      <circle cx="62" cy="74" r="8" fill="#5a7a37" />
      <circle cx="78" cy="76" r="9" fill="#88af58" />
      <path d="M10 40C20 25 40 15 80 15C120 15 140 25 150 40L155 45H5L10 40Z" fill="#8b5e45" />
      <path d="M15 45C30 45 40 50 45 55C50 50 60 45 75 45C90 45 100 50 105 55C110 50 120 45 135 45C140 45 145 48 150 50" stroke="#694430" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 25Q40 30 50 25" stroke="#694430" strokeWidth="2" fill="none" />
      <path d="M90 20Q100 25 110 20" stroke="#694430" strokeWidth="2" fill="none" />
      <path d="M120 30Q130 35 140 30" stroke="#694430" strokeWidth="2" fill="none" />
      <path d="M95 10C95 7 97 5 100 5C103 5 105 7 105 10V15H95V10Z" fill="#fbd35c" />
      <circle cx="102" cy="7" r="1.5" fill="#d35400" />
      <circle cx="98" cy="8" r="1" fill="#333" />
    </svg>
  );
}

/* =========================================================
   Block 1 – Hero (Photo Stack + Typography)
   ========================================================= */

function GalleryHero() {
  const [stack, setStack] = useState([0, 1, 2]);

  const bringToFront = (id) => {
    setStack((prev) => {
      const newStack = prev.filter((item) => item !== id);
      newStack.push(id);
      return newStack;
    });
  };

  const getStackStyles = (stackIndex) => {
    switch (stackIndex) {
      case 0:
        return { transform: "translate(0px, 40px) rotate(-16deg)", zIndex: 10 };
      case 1:
        return { transform: "translate(60px, 10px) rotate(-6deg)", zIndex: 20 };
      case 2:
        return { transform: "translate(130px, 20px) rotate(4deg)", zIndex: 30 };
      default:
        return {};
    }
  };

  return (
    <div className="gallery-hero__inner">
      {/* LEFT – Visual */}
      <div className="gallery-hero__visual">
        <div className="gallery-hero__guide-line gallery-hero__guide-line--vertical" />
        <div className="gallery-hero__guide-line gallery-hero__guide-line--horizontal" />

        {/* Church – sin fondo, solo imagen */}
        <div className="gallery-hero__church">
          <img src={imgFestivalIglesia} alt="Festival Iglesia" />
        </div>

        {/* Photo Stack */}
        <div className="gallery-hero__photo-stack">
          {photoData.map((photo) => {
            const stackIndex = stack.indexOf(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => bringToFront(photo.id)}
                className="gallery-hero__photo-frame"
                style={getStackStyles(stackIndex)}
              >
                <div className={`gallery-hero__photo-inner ${photo.borderClass}`}>
                  <img
                    src={photo.imgSrc}
                    alt="Galería"
                    className={`gallery-hero__photo-img ${photo.filterClass}`}
                  />
                </div>
              </div>
            );
          })}

          {/* House – sin fondo, solo imagen */}
          <div className="gallery-hero__house">
            <img src={imgFestivalUstaris} alt="Festival Ustaris" />
          </div>
        </div>
      </div>

      {/* RIGHT – Content */}
      <div className="gallery-hero__content">
        <h1 className="gallery-hero__title">
          <span className="gallery-hero__title-line gallery-hero__title-line--mira">
            MIRA,
            <span className="gallery-hero__tag-badge">1247</span>
          </span>
          <span className="gallery-hero__title-line gallery-hero__title-line--escucha">
            ESCUCHA
          </span>
          <span className="gallery-hero__title-line gallery-hero__title-line--siente">
            Y SIENTE
          </span>
          <span className="gallery-hero__title-line gallery-hero__title-line--valle">
            EL VALLE
          </span>
        </h1>

        <p className="gallery-hero__description">
          Un recorrido audiovisual por la esencia de Valledupar. Explora una
          colección de momentos, sonidos y paisajes que definen quiénes somos.
        </p>

        <button className="gallery-hero__cta">VER AHORA</button>
      </div>
    </div>
  );
}

/* =========================================================
   Block 2 – Multimedia Gallery
   ========================================================= */

function MultimediaGallery() {
  const navigate = useNavigate();
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todo");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  // Fetch from Supabase (no fallback)
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
            category: item.tipo_sitio || "Patrimonio",
            title: item.titulo,
            location: item.ubicacion_id || "Valledupar",
            description: item.descripcion_narrativa || item.descripcion_breve,
            img: item.video_imagen || item.imagen_principal || "",
            videoUrl: item.video_url || "",
            tipo_multimedia: item.tipo_multimedia,
            longitud: item.longitud,
            latitud: item.latitud,
            ubicacion_id: item.ubicacion_id,
          }));
          setGalleryItems(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Supabase: Error fetching gallery:", err);
        if (!cancelled) {
          setGalleryItems([]);
          setLoading(false);
        }
      }
    }
    fetchGallery();
    return () => { cancelled = true; };
  }, []);

  // Build dynamic filters from data
  const FILTERS = useMemo(() => {
    const tipos = [...new Set(galleryItems.map((item) => item.category))];
    return ["Todo", ...tipos];
  }, [galleryItems]);

  const handleFilterChange = useCallback((newFilter) => {
    setFilter(newFilter);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedItem(null);
    setIsPlaying(false);
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  const filteredData =
    filter === "Todo"
      ? galleryItems
      : galleryItems.filter(
          (item) =>
            item.category.toLowerCase() === filter.toLowerCase()
        );

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedItem]);

  return (
    <section className="gallery-multimedia">
      {/* Header */}
      <header className="gallery-multimedia__header">
        {/* Casa Izquierda Animada */}
        <div className="gallery-multimedia__house gallery-multimedia__house--left">
          <HouseLeftSVG />
        </div>

        {/* Casa Derecha Animada */}
        <div className="gallery-multimedia__house gallery-multimedia__house--right">
          <HouseRightSVG />
        </div>

        {/* Title */}
        <div className="gallery-multimedia__title-wrap">
          <div className="gallery-multimedia__title">
            <span className="gallery-multimedia__title-word--gallery">Galería</span>
            <span className="gallery-multimedia__title-word--multimedia">Multimedia</span>
          </div>
          <p className="gallery-multimedia__desc">
            Fotografías, videos e ilustraciones que capturan la esencia de
            Valledupar.
          </p>
        </div>

        {/* Filters */}
        <div className="gallery-multimedia__filters">
          {FILTERS.map((btn) => (
            <button
              key={btn}
              onClick={() => handleFilterChange(btn)}
              className={`gallery-multimedia__filter-btn${
                filter === btn ? " gallery-multimedia__filter-btn--active" : ""
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </header>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "64px 16px", color: "var(--on-surface-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, opacity: 0.3, marginBottom: 12, display: "block", animation: "spin 1s linear infinite" }}>sync</span>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 14 }}>Cargando galería...</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 16px", color: "var(--on-surface-variant)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, opacity: 0.2, marginBottom: 12, display: "block" }}>photo_library</span>
          <p style={{ fontFamily: "var(--font-inter)", fontSize: 14 }}>No hay elementos en esta categoría.</p>
        </div>
      ) : (
        <>
          <div className="gallery-multimedia__grid">
          {filteredData.slice(0, 12).map((item) => (
            <div
              key={item.id}
              className="gallery-multimedia__card"
              onClick={() => setSelectedItem(item)}
            >
              <span className="gallery-multimedia__card-category">
                {item.category}
              </span>
              {item.img ? (
                <img
                  src={item.img}
                  alt={item.title}
                  className="gallery-multimedia__card-img"
                  loading="lazy"
                />
              ) : (
                <div className="gallery-multimedia__card-img-placeholder">
                  <span className="material-symbols-outlined">image</span>
                </div>
              )}
              <div className="gallery-multimedia__card-overlay">
                <h3 className="gallery-multimedia__card-title">{item.title}</h3>
                <div className="gallery-multimedia__card-location">
                  <svg viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{item.location}</span>
                </div>
              </div>
            </div>
          ))}
          </div>
          {/* Ver más button - always visible */}
          <div className="gallery-multimedia__more-wrap">
            <button className="gallery-multimedia__more-btn" onClick={() => navigate("/galeria2")}>
              Ver más
              <svg viewBox="0 0 24 24">
                <path d="M19 15l-7 7-7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {selectedItem && (
        <div className="gallery-multimedia__modal">
          <div
            className="gallery-multimedia__modal-backdrop"
            onClick={closeModal}
          />

          <div className="gallery-multimedia__modal-inner">
            {/* Close */}
            <button
              className="gallery-multimedia__modal-close"
              onClick={closeModal}
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Media Zone - YouTube embed or image */}
            <div
              className={`gallery-multimedia__modal-video${
                isPlaying ? " gallery-multimedia__modal-video--playing" : ""
              }`}
            >
              {selectedItem.videoUrl &&
              (selectedItem.videoUrl.includes("youtube") || selectedItem.videoUrl.includes("youtu.be")) ? (
                // YouTube embed
                <iframe
                  src={getYouTubeEmbedUrl(selectedItem.videoUrl)}
                  title={selectedItem.title}
                  className="gallery-multimedia__modal-video-el"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : selectedItem.videoUrl ? (
                // HTML5 video fallback
                <>
                  <video
                    ref={videoRef}
                    controls={isPlaying}
                    poster={selectedItem.img}
                    className="gallery-multimedia__modal-video-el"
                    onEnded={() => setIsPlaying(false)}
                  >
                    <source src={selectedItem.videoUrl} type="video/mp4" />
                    Tu navegador no soporta el formato de video.
                  </video>

                  {!isPlaying && (
                    <div
                      className="gallery-multimedia__modal-play-overlay"
                      onClick={handlePlay}
                    >
                      <div className="gallery-multimedia__modal-play-btn">
                        <svg fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Static image
                <img
                  src={selectedItem.img}
                  alt={selectedItem.title}
                  className="gallery-multimedia__modal-video-el"
                  style={{ objectFit: "contain" }}
                />
              )}

              <div className="gallery-multimedia__modal-video-bar" />

              {!isPlaying && (
                <span className="gallery-multimedia__modal-video-tag">
                  {selectedItem.category}
                </span>
              )}
            </div>

            {/* Info Zone - hide only for HTML5 video playing, show for YouTube always */}
            <div
              className={`gallery-multimedia__modal-info${
                isPlaying && selectedItem.videoUrl &&
                !selectedItem.videoUrl.includes("youtube") &&
                !selectedItem.videoUrl.includes("youtu.be")
                  ? " gallery-multimedia__modal-info--hidden"
                  : ""
              }`}
            >
              <div className="gallery-multimedia__modal-info-inner">
                <h2 className="gallery-multimedia__modal-item-title">
                  {selectedItem.title}
                </h2>

                <div className="gallery-multimedia__modal-location">
                  <svg viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{selectedItem.location}</span>
                </div>

                <div className="gallery-multimedia__modal-divider" />

                <p className="gallery-multimedia__modal-description">
                  {selectedItem.description}
                </p>

                <button
                  className="gallery-multimedia__modal-explore"
                  onClick={() => {
                    const lng = parseFloat(selectedItem.longitud);
                    const lat = parseFloat(selectedItem.latitud);
                    const hasValidCoords = !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

                    navigate("/mapas");
                  }}
                >
                  <span>Explorar más en el mapa</span>
                  <svg viewBox="0 0 24 24">
                    <path d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   MAIN GALLERY PAGE
   ========================================================= */

export default function GalleryPage() {
  return (
    <>
      <TopBar
        activeSection="galeria"
        isAuthenticated={false}
        user={{ name: "Usuario Valido", initials: "UV" }}
        onSectionChange={() => {}}
      />

      {/* Block 1 – Hero */}
      <section className="gallery-hero">
        <div className="gallery-hero__bg-blur gallery-hero__bg-blur--top-right" />
        <div className="gallery-hero__bg-blur gallery-hero__bg-blur--bottom-left" />
        <div className="gallery-hero__bg-blur gallery-hero__bg-blur--center-left" />
        <GalleryHero />
      </section>

      {/* Block 2 – Multimedia Gallery */}
      <MultimediaGallery />

      <Footer />
    </>
  );
}
