import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import TopBar from "./TopBar";
import Footer from "./Footer";
import { supabase } from "./supabaseClient";
import "./GalleryPage.css";

/* =========================================================
   Image Assets from /assets/gallery/
   ========================================================= */

const imgPostal3 = "/assets/gallery/postal3.png";
const imgPostalPlazaMarco = "/assets/gallery/Postal_Plaza_CON MARCO 1.png";

/* =========================================================
   Helper: Extract embed URL (YouTube & Google Drive)
   ========================================================= */

function getEmbedUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);

    // YouTube
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}?autoplay=1&rel=0`;
    }
    if (u.hostname === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`;
    }

    // Google Drive
    if (u.hostname.includes("drive.google.com")) {
      const fileId = u.pathname.match(/\/file\/d\/([-\w]+)/)?.[1] || u.searchParams.get("id");
      if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`;
    }
  } catch {}
  return null;
}

/* Fallback: extraer miniatura de YouTube cuando no hay imagen */
function getVideoThumbnail(url) {
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
}

/* =========================================================
   SVG Components – Iglesia y Casa Colonial (del código de referencia)
   ========================================================= */

/** Iglesia de la Inmaculada Concepción */
function ChurchSVG() {
  return (
    <svg width="140" height="160" viewBox="0 0 140 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.3))' }}>
        <path d="M20 150 L120 150 L120 160 L20 160 Z" fill="#D3A780" />
        <path d="M10 150 L40 60 L100 60 L130 150 Z" fill="#FCE9D5" />
        <path d="M40 60 L70 20 L100 60 Z" fill="#F9D7B3" />
        <rect x="55" y="60" width="30" height="90" fill="#F6C594" />
        <path d="M35 60 L70 15 L105 60 L100 65 L70 25 L40 65 Z" fill="#E88B4A" />
        <path d="M10 150 L40 60 L45 65 L15 150 Z" fill="#E88B4A" />
        <path d="M130 150 L100 60 L95 65 L125 150 Z" fill="#E88B4A" />
        <path d="M60 110 C60 90 80 90 80 110 L80 150 L60 150 Z" fill="#2E2218" />
        <circle cx="70" cy="80" r="8" fill="#2E2218" />
        <circle cx="35" cy="115" r="4" fill="#2E2218" />
        <circle cx="105" cy="115" r="4" fill="#2E2218" />
        <rect x="68" y="0" width="4" height="20" fill="#E88B4A" />
        <rect x="63" y="5" width="14" height="4" fill="#E88B4A" />
      </g>
    </svg>
  );
}

/** Casa Colonial */
function HouseSVG() {
  return (
    <svg width="130" height="130" viewBox="0 0 130 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g style={{ filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.3))' }}>
        <rect x="15" y="45" width="100" height="75" fill="#F4E9DC" />
        <path d="M5 45 L65 15 L125 45 Z" fill="#5A3A2B" />
        <rect x="10" y="45" width="110" height="15" fill="#754C38" />
        <rect x="15" y="60" width="100" height="25" fill="#5A3A2B" />
        <rect x="20" y="65" width="10" height="15" fill="#F4E9DC" />
        <rect x="40" y="65" width="10" height="15" fill="#F4E9DC" />
        <rect x="60" y="65" width="10" height="15" fill="#F4E9DC" />
        <rect x="80" y="65" width="10" height="15" fill="#F4E9DC" />
        <rect x="100" y="65" width="10" height="15" fill="#F4E9DC" />
        <rect x="25" y="95" width="20" height="25" fill="#5A3A2B" />
        <rect x="55" y="100" width="20" height="15" fill="#5A3A2B" />
        <rect x="85" y="95" width="20" height="25" fill="#5A3A2B" />
      </g>
    </svg>
  );
}

/** Tarjeta postal – estilo original (marco blanco + borde dashed) */
function PhotoCard({ imageSrc, borderClass, rotation, zIndex, offsetX, offsetY, filterClass, onClick }) {
  return (
    <div
      className="gallery-hero__photo-frame"
      onClick={onClick}
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
        zIndex: zIndex,
      }}
    >
      <div className={`gallery-hero__photo-inner ${borderClass}`}>
        <img
          src={imageSrc}
          alt="Galería"
          className={`gallery-hero__photo-img ${filterClass || ''}`}
        />
      </div>
    </div>
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

  // Posiciones fijas del diseño anterior para el stack
  const stackPositions = [
    { offsetX: 0, offsetY: 40, rotation: -16 },
    { offsetX: 60, offsetY: 10, rotation: -6 },
    { offsetX: 130, offsetY: 20, rotation: 4 },
  ];

  const photoCards = [
    {
      id: 0,
      imgSrc: imgPostal3,
      borderClass: 'gallery-hero__photo-inner--green',
      filterClass: 'gallery-hero__photo-img--contrast-sepia',
    },
    {
      id: 1,
      imgSrc: imgPostalPlazaMarco,
      borderClass: 'gallery-hero__photo-inner--yellow',
      filterClass: 'gallery-hero__photo-img--contrast-saturate',
    },
    {
      id: 2,
      imgSrc: imgPostalPlazaMarco,
      borderClass: 'gallery-hero__photo-inner--yellow',
      filterClass: 'gallery-hero__photo-img--contrast-bright',
    },
  ];

  const getStackIndex = (id) => stack.indexOf(id);

  return (
    <div className="gallery-hero__inner">
      {/* LEFT – Visual */}
      <div className="gallery-hero__visual">
        {/* Shadow overlays de fondo */}
        <div className="gallery-hero__shadow-overlay gallery-hero__shadow-overlay--tl" />
        <div className="gallery-hero__shadow-overlay gallery-hero__shadow-overlay--br" />
        <div className="gallery-hero__shadow-overlay gallery-hero__shadow-overlay--center" />

        {/* Church SVG flotante */}
        <div className="gallery-hero__church">
          <ChurchSVG />
        </div>

        {/* Photo Stack con postales al estilo anterior */}
        <div className="gallery-hero__photo-stack">
          {photoCards.map((card) => {
            const stackIdx = getStackIndex(card.id);
            const pos = stackPositions[stackIdx];
            const dynamicZ = 10 + stackIdx * 10;
            return (
              <PhotoCard
                key={card.id}
                imageSrc={card.imgSrc}
                borderClass={card.borderClass}
                rotation={pos.rotation}
                zIndex={dynamicZ}
                offsetX={pos.offsetX}
                offsetY={pos.offsetY}
                filterClass={card.filterClass}
                onClick={() => bringToFront(card.id)}
              />
            );
          })}
        </div>

        {/* House SVG flotante */}
        <div className="gallery-hero__house">
          <HouseSVG />
        </div>
      </div>

      {/* RIGHT – Content */}
      <div className="gallery-hero__content">
        <h1 className="gallery-hero__title">
          <span className="gallery-hero__title-line gallery-hero__title-line--mira">
            MIRA,
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
/* =========================================================
   Label mappings for proper Spanish orthography
   ========================================================= */

const TIPO_SITIO_LABELS = {
  "Patrimonial": "Patrimonial",
  "Gastronomico": "Gastronómico",
  "Mitico": "Mítico",
  "Historico": "Histórico",
  "Cultural": "Cultural",
};

const getCategoryLabel = (cat) => TIPO_SITIO_LABELS[cat] || cat;

/* =========================================================
   House SVG Components (for Block 2 – multimedia)
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
   Block 2 – Multimedia Gallery
   ========================================================= */

function MultimediaGallery() {
  const navigate = useNavigate();
  const location = useLocation();
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Todo");
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);
  const hasAutoSelected = useRef(false);

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
            img: item.video_imagen || item.imagen_principal || getVideoThumbnail(item.video_url) || "",
            videoUrl: item.video_url || "",
            tipo_multimedia: item.tipo_multimedia,
            longitud: item.longitud,
            latitud: item.latitud,
            ubicacion_id: item.ubicacion_id,
          }));
          setGalleryItems(mapped);
          setLoading(false);

          // Auto-select item from navigation state
          if (!cancelled && !hasAutoSelected.current) {
            const selectedId = location.state?.selectedItemId;
            if (selectedId) {
              const found = mapped.find((item) => item.id === selectedId);
              if (found) {
                setSelectedItem(found);
                hasAutoSelected.current = true;
              }
            }
          }
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
  }, [location.state?.selectedItemId]);

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
              {btn === "Todo" ? btn : getCategoryLabel(btn)}
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
                {getCategoryLabel(item.category)}
              </span>
              {/* Media type indicator badge */}
              <div className={`gallery-multimedia__media-badge${item.tipo_multimedia === "Video" ? " gallery-multimedia__media-badge--video" : " gallery-multimedia__media-badge--photo"}`}>
                {item.tipo_multimedia === "Video" ? (
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
                <span>{item.tipo_multimedia === "Video" ? "Video" : "Foto"}</span>
              </div>
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
              {selectedItem.videoUrl && getEmbedUrl(selectedItem.videoUrl) ? (
                // YouTube / Google Drive embed
                <iframe
                  src={getEmbedUrl(selectedItem.videoUrl)}
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
                  {getCategoryLabel(selectedItem.category)}
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
                  onClick={() => navigate("/mapas")}
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
        onSectionChange={() => {}}
      />

      {/* Block 1 – Hero */}
      <section className="gallery-hero">
        <GalleryHero />
      </section>

      {/* Block 2 – Multimedia Gallery */}
      <MultimediaGallery />

      <Footer />
    </>
  );
}
