import React, { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import TopBar from './TopBar';
import Footer from './Footer';
import CTASection from './CTASection';
import SubmitWordModal from './SubmitWordModal';
import { supabase } from './supabaseClient';
import './Glossary.css';

// Image assets from public/assets/glosario/
const imgMarcoVerde = "/assets/glosario/864b827d37a64e1ef35951b48f48a7d196f73bfc.webp";
const imgMarcoMorado = "/assets/glosario/d94620b583929c8d0a6fb5418d8c875b924f8c60.webp";
const imgRecurso1Postal3 = "/assets/glosario/20fd5b503f6b79dff07b513f3bc7604deafa7331.png";
const imgRecurso3PostalMorado1 = "/assets/glosario/c56c8963ea54ddce3fb1dd22c4276099b158fec3.png";

// Imágenes del diseño rotatorio desde "diseños glosario". Order matches the
// angular arrangement in Figma's own animation states for this component
// (node 392:10596, "Animación glosario diseño" -- variants "Diseño"/
// "Diseño 2"/3/4/5): each illustration's angle from the hero's center was
// measured across two of those states, and the ranking is identical in
// both (trinitarias -> mango2 -> mango1 -> arepa1 -> poporos -> arepa2 ->
// boli), confirming a stable clockwise spatial order -- this array follows
// that same order so the orbit sweeps through them the way Figma arranged
// them, not an arbitrary sequence.
const orbitImages = [
  "/assets/glosario/trinitarias 1.png",
  "/assets/glosario/mango y cañahuate 2.png",
  "/assets/glosario/mango y cañahuate 1.png",
  "/assets/glosario/arepa y caldero 1.png",
  "/assets/glosario/poporos y armadillo 1.png",
  "/assets/glosario/arepa y caldero 2.png",
  "/assets/glosario/boli y pescado 1.png",
];

const CATEGORIES_LIST = ["Objeto","Transporte","Material","Bebida","Alimento","Animal","Planta","Gesto","Expresión","Cuerpo","Para referirse","Vestimenta","Accesorio","Fantasía","Juego"];

// Local fallback data when Supabase is not available
const fallbackData = [
  { word: "Achantao", definition: "Avergonzado, tímido o desanimado.", categoria: "Para referirse", color_postal: "verde" },
  { word: "Bacán", definition: "Persona agradable, de buen carácter.", categoria: "Para referirse", color_postal: "morado" },
  { word: "Cachaco", definition: "Persona del interior del país, especialmente de Bogotá.", categoria: "Para referirse", color_postal: "verde" },
  { word: "Corroncho", definition: "Persona de mal gusto o modales rústicos. (A veces usado con cariño).", categoria: "Para referirse", color_postal: "morado" },
  { word: "Embejucarse", definition: "Enojarse mucho, ponerse furioso.", categoria: "Acción", color_postal: "verde" },
  { word: "Fregado", definition: "Difícil, complicado o una persona molesta.", categoria: "Para referirse", color_postal: "morado" },
  { word: "Guachafita", definition: "Desorden, fiesta bulliciosa, relajo.", categoria: "Situación", color_postal: "verde" },
  { word: "Jopo", definition: "Trasero. A veces usado para describir algo de mala calidad ('de jopo').", categoria: "Cuerpo", color_postal: "morado" },
  { word: "Leva", definition: "Castigo físico, golpiza.", categoria: "Acción", color_postal: "verde" },
  { word: "Mondá", definition: "Palabra versátil, a menudo vulgar, usada para denotar sorpresa o enojo.", categoria: "Expresión", color_postal: "morado" },
  { word: "Nojoda", definition: "Expresión de asombro, molestia o incredulidad.", categoria: "Expresión", color_postal: "verde" },
  { word: "Pava", definition: "Mala suerte, sal.", categoria: "Para referirse", color_postal: "morado" },
  { word: "Quillero", definition: "Persona nacida en Barranquilla.", categoria: "Para referirse", color_postal: "verde" },
  { word: "Rumbear", definition: "Ir de fiesta.", categoria: "Acción", color_postal: "morado" },
  { word: "Sapo", definition: "Persona entrometida o delatora.", categoria: "Para referirse", color_postal: "verde" },
  { word: "Tiesto", definition: "Objeto viejo o inservible.", categoria: "Objeto", color_postal: "morado" },
  { word: "Vaina", definition: "Cosa, asunto, problema. Palabra comodín.", categoria: "Para referirse", color_postal: "verde" },
  { word: "Yeyo", definition: "Mareo, desmayo, ataque de nervios.", categoria: "Cuerpo", color_postal: "morado" },
  { word: "Zarandear", definition: "Mover violentamente a alguien o algo.", categoria: "Acción", color_postal: "verde" },
  { word: "Ajá", definition: "Expresión multifuncional: saludo, afirmación, interrogación.", categoria: "Expresión", color_postal: "morado" },
];

// Cards for the Hero1 carousel (from glosario1) – using postal images + colored overlays
const heroWords = [
  { id: 1, word: "Icotea", meaning: "Conocida como tortuga de monte ya que esta se encuentra en principalmente en jagüeyes y ciénegas", type: "(Animal)", img: imgRecurso1Postal3, rotate: -16.71, bg: "green" },
  { id: 2, word: "Vironda", meaning: "Bastimento de la costa, que es parecido a una papa", type: "(Para referirse)", img: imgRecurso3PostalMorado1, rotate: -7.24, bg: "purple" },
  { id: 3, word: "Perrenque", meaning: "Alguien que tiene muchas ganas de hacer algo", type: "(Para referirse)", img: imgRecurso1Postal3, rotate: 2.03, bg: "green" },
  { id: 4, word: "Fundingue", meaning: "Personas que están en el desorden cuando hay una festividad", type: "(Para referirse)", img: imgRecurso3PostalMorado1, rotate: 11.74, bg: "purple" },
  { id: 5, word: "Rula o sable", meaning: "Machete con cuchillo grande que tiene mucho filo y es utilizada por jornaleros", type: "(Objeto)", img: imgRecurso1Postal3, rotate: 21.55, bg: "green" },
  { id: 6, word: "Foquiao", meaning: "Persona que está dormida profundamente", type: "(Para referirse)", img: imgRecurso3PostalMorado1, rotate: 32.29, bg: "purple" },
  { id: 7, word: "Apalastrao", meaning: "Persona que tiene mucha flojera o no tiene ánimos para hacer algo", type: "(Para referirse)", img: imgRecurso1Postal3, rotate: 42.82, bg: "green" },
  { id: 8, word: "Derroche", meaning: "Acción de malgastar o desperdiciar algo", type: "(Para referirse)", img: imgRecurso3PostalMorado1, rotate: 32.56, bg: "purple" },
];

// Categories data — alterna colores verde/morado
const categoryColors = CATEGORIES_LIST.reduce((acc, cat, i) => {
  acc[cat] = i % 2 === 0 ? "verde" : "morado";
  return acc;
}, {});

// Configuration for orbiting images from "diseños glosario"
const orbitShapesConfig = [
  { img: orbitImages[0], sizeLarge: "140px", sizeSmall: "110px", delay: 1 },
  { img: orbitImages[1], sizeLarge: "120px", sizeSmall: "90px", delay: 3 },
  { img: orbitImages[2], sizeLarge: "150px", sizeSmall: "110px", delay: 5 },
  { img: orbitImages[3], sizeLarge: "130px", sizeSmall: "100px", delay: 2 },
  { img: orbitImages[4], sizeLarge: "140px", sizeSmall: "110px", delay: 4 },
  { img: orbitImages[5], sizeLarge: "120px", sizeSmall: "90px", delay: 1 },
  { img: orbitImages[6], sizeLarge: "130px", sizeSmall: "100px", delay: 3 },
];

// ========= SVG Components for Stamp Design =========

// Generates the scalloped border of the outer stamp
const StampBorderSVG = () => {
  return (
    <svg
      className="gloss-hero1__stamp-border-svg"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="gloss-scallop-mask">
          <rect width="100" height="100" fill="white" />
          {/* Top edge scallops */}
          <circle cx="5" cy="0" r="2" fill="black" />
          <circle cx="15" cy="0" r="2" fill="black" />
          <circle cx="25" cy="0" r="2" fill="black" />
          <circle cx="35" cy="0" r="2" fill="black" />
          <circle cx="45" cy="0" r="2" fill="black" />
          <circle cx="55" cy="0" r="2" fill="black" />
          <circle cx="65" cy="0" r="2" fill="black" />
          <circle cx="75" cy="0" r="2" fill="black" />
          <circle cx="85" cy="0" r="2" fill="black" />
          <circle cx="95" cy="0" r="2" fill="black" />
          {/* Bottom edge scallops */}
          <circle cx="5" cy="100" r="2" fill="black" />
          <circle cx="15" cy="100" r="2" fill="black" />
          <circle cx="25" cy="100" r="2" fill="black" />
          <circle cx="35" cy="100" r="2" fill="black" />
          <circle cx="45" cy="100" r="2" fill="black" />
          <circle cx="55" cy="100" r="2" fill="black" />
          <circle cx="65" cy="100" r="2" fill="black" />
          <circle cx="75" cy="100" r="2" fill="black" />
          <circle cx="85" cy="100" r="2" fill="black" />
          <circle cx="95" cy="100" r="2" fill="black" />
          {/* Left edge scallops */}
          <circle cx="0" cy="10" r="2" fill="black" />
          <circle cx="0" cy="20" r="2" fill="black" />
          <circle cx="0" cy="30" r="2" fill="black" />
          <circle cx="0" cy="40" r="2" fill="black" />
          <circle cx="0" cy="50" r="2" fill="black" />
          <circle cx="0" cy="60" r="2" fill="black" />
          <circle cx="0" cy="70" r="2" fill="black" />
          <circle cx="0" cy="80" r="2" fill="black" />
          <circle cx="0" cy="90" r="2" fill="black" />
          {/* Right edge scallops */}
          <circle cx="100" cy="10" r="2" fill="black" />
          <circle cx="100" cy="20" r="2" fill="black" />
          <circle cx="100" cy="30" r="2" fill="black" />
          <circle cx="100" cy="40" r="2" fill="black" />
          <circle cx="100" cy="50" r="2" fill="black" />
          <circle cx="100" cy="60" r="2" fill="black" />
          <circle cx="100" cy="70" r="2" fill="black" />
          <circle cx="100" cy="80" r="2" fill="black" />
          <circle cx="100" cy="90" r="2" fill="black" />
        </mask>
      </defs>
      <rect x="0" y="0" width="100" height="100" fill="#E89D26" mask="url(#gloss-scallop-mask)" />
    </svg>
  );
};

// Generates the chaotic, layered jagged frames behind the main card
const JaggedLayer = ({ color, className }) => (
  <svg
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    className={`gloss-hero1__jagged ${className}`}
  >
    <polygon
      fill={color}
      points="3,5 12,2 25,7 40,1 60,6 78,2 88,8 96,18 92,35 98,50 94,68 99,82 85,95 65,92 45,98 25,91 10,96 2,82 6,60 1,45 5,25"
    />
  </svg>
);

// ========= Hero1 Component – Palabras populares (redesign) =========

function Hero1Section() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalCards = heroWords.length;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalCards);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalCards) % totalCards);
  };

  // Helper to determine card position/visibility - deck style
  const getCardStyles = (index) => {
    let diff = index - currentIndex;
    if (diff < 0) diff += totalCards;

    // Card that just left (animating out)
    if (diff === totalCards - 1) {
      return {
        wrapper: 'gloss-hero1__card--exit-left',
        content: 'gloss-hero1__card-fade-out',
      };
    }
    // Active card (front) - comes from right with flip
    if (diff === 0) {
      return {
        wrapper: 'gloss-hero1__card--active',
        content: 'gloss-hero1__card-fade-in',
      };
    }
    // Card right behind - fanned to the right
    if (diff === 1) {
      return {
        wrapper: 'gloss-hero1__card--behind-1',
        content: 'gloss-hero1__card-fade-out',
      };
    }
    // Card two steps behind - fanned further right
    if (diff === 2) {
      return {
        wrapper: 'gloss-hero1__card--behind-2',
        content: 'gloss-hero1__card-fade-out',
      };
    }
    // Hidden - stacked behind
    return {
      wrapper: 'gloss-hero1__card--hidden',
      content: 'gloss-hero1__card-fade-out',
    };
  };

  return (
    <section className="gloss-hero1">
      <div className="gloss-hero1__container">

        {/* LEFT COLUMN: Info Card */}
        <div className="gloss-hero1__info-card">
          <p className="gloss-hero1__info-subtitle">
            ¿No entendiste? ¡No pasa nada, ombe!
          </p>
          <div className="gloss-hero1__info-title-wrap">
            <h2 className="gloss-hero1__info-title">
              Palabras populares
            </h2>
          </div>
          <p className="gloss-hero1__info-desc">
            Si te dijeron que eras un 'Bacano' o te mandaron a 'recoger una vaina', aquí te explicamos el asunto. Este glosario es la guía para entender el hablao' del pueblo. Referencias locales y toda esa jerga que nos hace únicos en el mapa.
          </p>
          <div className="gloss-hero1__info-cta" onClick={() => document.getElementById('gloss-categories')?.scrollIntoView({ behavior: 'smooth' })}>
            CONOCE MÁS PALABRAS
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Stamp Carousel */}
        <div className="gloss-hero1__stamp-wrapper">
          {/* Inner area con Group 143726149.png de fondo */}
          <div className="gloss-hero1__stamp-inner">
            <div className="gloss-hero1__card-stage">
              {heroWords.map((item, index) => {
                const styles = getCardStyles(index);
                const isInteractive = index === currentIndex;
                const isGreen = item.bg === 'green';
                const cardTheme = isGreen ? 'gloss-hero1__card-body--green' : 'gloss-hero1__card-body--purple';

                return (
                  <div
                    key={item.id}
                    className={`gloss-hero1__card ${styles.wrapper}`}
                    style={{ pointerEvents: isInteractive ? 'auto' : 'none' }}
                  >
                    {/* Main card body - clean postal stamp design */}
                    <div className={`gloss-hero1__card-body ${cardTheme}`}>
                      <div className={`gloss-hero1__card-content-inner ${styles.content}`}>
                        <h3 className="gloss-hero1__card-word">{item.word}</h3>
                        <div className="gloss-hero1__card-meaning">
                          <span className="gloss-hero1__card-meaning-label">Significado:</span>
                          <p className="gloss-hero1__card-meaning-text">{item.meaning}</p>
                        </div>
                        <span className="gloss-hero1__card-type">{item.type}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation controls */}
            <div className="gloss-hero1__stamp-nav">
              <button onClick={handlePrev} className="gloss-hero1__stamp-btn">
                ANT.
              </button>
              <button onClick={handleNext} className="gloss-hero1__stamp-btn">
                SIG.
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

// ========= Categories Component =========

function CategoryPopup({ category, words, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!category) return null;

  return (
    <div className="gloss-cat-popup">
      <div className="gloss-cat-popup__header">
        <button className="gloss-cat-popup__back" onClick={onClose}>
          ←
        </button>
        <h2 className="gloss-cat-popup__title">
          CATEGORÍA <span className="gloss-cat-popup__title-name">{category.toUpperCase()}</span>
        </h2>
      </div>

      <div className="gloss-cat-popup__grid">
        {words.length === 0 ? (
          <div className="gloss-cat-popup__empty">
            <p>No hay palabras en esta categoría todavía.</p>
          </div>
        ) : (
          words.map((item, index) => {
            const isGreen = item.color_postal === 'verde' || !item.color_postal;
            const cardClass = isGreen
              ? 'gloss-cat-popup__card gloss-cat-popup__card--verde'
              : 'gloss-cat-popup__card gloss-cat-popup__card--morado';
            return (
              <div
                key={index}
                className={cardClass}
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <p className="gloss-cat-popup__card-word">{item.palabra || item.word}</p>
                <div className="gloss-cat-popup__card-meaning-wrap">
                  <span className="gloss-cat-popup__card-label">Significado:</span>
                  <p className="gloss-cat-popup__card-meaning">
                    {item.significado || item.definition}
                  </p>
                </div>
                <span className="gloss-cat-popup__card-cat">({category})</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CategoriesSection({ categoryCounts, glossaryData }) {
  const [selectedCat, setSelectedCat] = useState(null);

  const cats = CATEGORIES_LIST.map((name) => ({
    name,
    count: categoryCounts[name] || 0,
    color: categoryColors[name] || "verde",
  }));

  const filteredWords = selectedCat
    ? glossaryData.filter((w) => w.categoria === selectedCat)
    : [];

  return (
    <>
      <section id="gloss-categories" className="gloss-categories">
        <div className="gloss-categories__header">
          <h2 className="gloss-categories__title">Categorías</h2>
          <p className="gloss-categories__desc">
            Aprende las palabras y expresiones típicas del Caribe colombiano clasificadas por temáticas. ¡Explora nuestra riqueza verbal!
          </p>
        </div>

        <div className="gloss-categories__grid">
          {cats.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', bounce: 0.4, delay: index * 0.05 }}
              whileHover={{ rotate: index % 2 === 0 ? 2 : -2 }}
              className="gloss-categories__item"
              onClick={() => setSelectedCat(cat.name)}
              style={{ cursor: 'pointer' }}
            >
              <div className="gloss-categories__item-frame">
                <div className="gloss-categories__item-frame-inner">
                  <img
                    alt=""
                    className="gloss-categories__item-frame-img"
                    src={cat.color === "verde" ? imgMarcoVerde : imgMarcoMorado}
                  />
                </div>
              </div>

              <div className="gloss-categories__item-content">
                <p className="gloss-categories__item-name">{cat.name}</p>
                <p className="gloss-categories__item-count">({cat.count})</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Popup overlay */}
      {selectedCat && (
        <CategoryPopup
          category={selectedCat}
          words={filteredWords}
          onClose={() => setSelectedCat(null)}
        />
      )}
    </>
  );
}

// ========= Sugerir Seccion – Falling stamp cards =========

const palabrasSugerir = [
  { word: "Asiento", definition: "Silla de madera con cuero de vaca disecado", context: "(Objeto)", type: "green" },
  { word: "Azulejo", definition: "Baldosa con motivos únicos que se utiliza en casas antiguas", context: "(Objeto)", type: "green" },
  { word: "Batea", definition: "Recipiente cóncavo", context: "(Objeto)", type: "purple" },
  { word: "Avispao", definition: "Persona que aprovecha las circunstancias para sacar ventajas", context: "(Para referirse)", type: "green" },
  { word: "Bacano", definition: "Algo que se siente, se ve o se percibe bueno y bonito", context: "(Para referirse)", type: "purple" },
  { word: "Corroncho", definition: "Persona de mal gusto o modales rústicos", context: "(Para referirse)", type: "green" },
  { word: "Embejucarse", definition: "Enojarse mucho, ponerse furioso", context: "(Acción)", type: "purple" },
  { word: "Guachafita", definition: "Desorden, fiesta bulliciosa, relajo", context: "(Situación)", type: "green" },
];

const StampCard = ({ data }) => {
  const isGreen = data.type === "green";
  const stampClass = isGreen ? 'gloss-sugerir__stamp gloss-sugerir__stamp--verde' : 'gloss-sugerir__stamp gloss-sugerir__stamp--morado';
  const innerClass = isGreen ? 'gloss-sugerir__stamp-inner--green' : 'gloss-sugerir__stamp-inner--purple';
  return (
    <div className={stampClass}>
      <div className={`gloss-sugerir__stamp-inner ${innerClass}`}>
        <div className="gloss-sugerir__stamp-word-wrap">
          <h3 className="gloss-sugerir__stamp-word">{data.word}</h3>
        </div>
        <div className="gloss-sugerir__stamp-meaning">
          <span className="gloss-sugerir__stamp-label">Significado:</span>
          <p className="gloss-sugerir__stamp-desc">{data.definition}</p>
        </div>
        <div className="gloss-sugerir__stamp-context-wrap">
          <span className="gloss-sugerir__stamp-context">{data.context}</span>
        </div>
      </div>
    </div>
  );
};

function SugerirSeccion({ onOpenSubmitModal }) {
  const col1Data = palabrasSugerir.slice(0, Math.ceil(palabrasSugerir.length / 2));
  const col2Data = palabrasSugerir.slice(Math.ceil(palabrasSugerir.length / 2));
  const infiniteCol1 = [...col1Data, ...col1Data];
  const infiniteCol2 = [...col2Data, ...col2Data];

  return (
    <section className="gloss-sugerir">

      {/* LEFT COLUMN: Text content */}
      <div className="gloss-sugerir__content">
        <div className="gloss-sugerir__content-inner">
          <h2 className="gloss-sugerir__title">
            ¿Falta alguna vaina?
          </h2>
          <h4 className="gloss-sugerir__subtitle">
            ¡NO TE QUEDES CON LA PALABRA EN LA BOCA!
          </h4>
          <p className="gloss-sugerir__desc">
            Si te sabes un término bien valduparense que no aparece aquí, escríbelo ya mismo con su significado. ¡Haz que tu palabra sea parte del patrimonio del Valle!
          </p>
          <button className="gloss-sugerir__btn" onClick={onOpenSubmitModal}>
            Escribe tu palabra
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Falling stamp cards (animation) */}
      <div className="gloss-sugerir__cards">
        {/* Track 1 */}
        <div className="gloss-sugerir__track">
          <div className="gloss-sugerir__track-inner gloss-sugerir__track-inner--1">
            {infiniteCol1.map((item, index) => (
              <StampCard key={`col1-${index}`} data={item} />
            ))}
          </div>
        </div>
        {/* Track 2 */}
        <div className="gloss-sugerir__track gloss-sugerir__track--offset">
          <div className="gloss-sugerir__track-inner gloss-sugerir__track-inner--2">
            {infiniteCol2.map((item, index) => (
              <StampCard key={`col2-${index}`} data={item} />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

// ========= Main Glossary Page =========

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rotation, setRotation] = useState(0);
  const [orbitStep, setOrbitStep] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [glossaryData, setGlossaryData] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedSearchWord, setSelectedSearchWord] = useState(null);

  // Fetch glossary words from Supabase
  const fetchWords = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("glosario_palabras")
        .select("*")
        .eq("activo", true)
        .order("palabra");

      if (error) throw error;

      const words = data && data.length > 0
        ? data.map((w) => ({ word: w.palabra, definition: w.significado, categoria: w.categoria, color_postal: w.color_postal }))
        : fallbackData;

      setGlossaryData(words);

      // Count per category
      const counts = {};
      CATEGORIES_LIST.forEach((cat) => { counts[cat] = 0; });
      words.forEach((w) => {
        const cat = w.categoria;
        if (counts[cat] !== undefined) counts[cat]++;
        else counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
    } catch (err) {
      console.warn("Error fetching glossary, using fallback:", err);
      setGlossaryData(fallbackData);
      const counts = {};
      CATEGORIES_LIST.forEach((cat) => { counts[cat] = 0; });
      fallbackData.forEach((w) => {
        const cat = w.categoria;
        if (counts[cat] !== undefined) counts[cat]++;
        else counts[cat] = (counts[cat] || 0) + 1;
      });
      setCategoryCounts(counts);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Continuous rotation animation for orbiting shapes. Figma's own
  // keyframes for this component (node 392:10596) change each sticker's
  // size at the same moment its position steps -- not on an independent
  // timer -- so size and position are driven from this single tick
  // (orbitStep advances alongside rotation) rather than a separate CSS
  // animation loop.
  useEffect(() => {
    let lastStepTime = Date.now();
    let currentRotation = 0;
    let currentStep = 0;

    const animate = () => {
      const now = Date.now();
      if (now - lastStepTime > 2000) {
        // Subtract (not add) so the orbit turns counterclockwise: left/top
        // are driven by cos/sin in screen coordinates (Y grows downward),
        // where an increasing angle reads as clockwise motion.
        currentRotation = (currentRotation - 20 + 360) % 360;
        currentStep += 1;
        setRotation(currentRotation);
        setOrbitStep(currentStep);
        lastStepTime = now;
      }
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Search filtering
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
    } else {
      const results = glossaryData.filter(item =>
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(true);
    }
  }, [searchTerm, glossaryData]);

  const getShapeStyle = (index, totalShapes, rotationAngle) => {
    const baseAngle = (index * (360 / totalShapes));
    const currentAngle = (baseAngle + rotationAngle) * (Math.PI / 180);
    const x = Math.cos(currentAngle);
    const y = Math.sin(currentAngle);

    return {
      left: `calc(50% + (max(38vw, 300px) * ${x}))`,
      top: `calc(50% + (max(30vh, 230px) * ${y}))`,
      transform: 'translate(-50%, -50%)',
      transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1), top 1s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <div className="gloss-page">
      {/* ===== NAVBAR ===== */}
      <TopBar />

      {/* ===== HERO ===== */}
      <section className="gloss-hero">
        <div className="gloss-hero__top-border" />

        {/* Orbiting Shapes */}
        <div className="gloss-hero__orbit-area">
          {orbitShapesConfig.map((shape, index) => {
            // Each shape's own delay offsets which orbit steps it grows on,
            // so they don't all pulse in lockstep -- but the toggle itself
            // only advances on the same 2s tick that moves the orbit
            // (matches Figma: size changes at each rotation step).
            const isBig = (orbitStep + shape.delay) % 2 === 0;
            return (
            <div
              key={index}
              className="gloss-hero__orbit-shape"
              style={getShapeStyle(index, orbitShapesConfig.length, rotation)}
            >
              <div
                className="gloss-hero__orbit-shape-inner"
                style={{
                  '--shape-lg': shape.sizeLarge,
                  '--shape-sm': shape.sizeSmall,
                  transform: isBig ? 'scale(1.35) translateY(-22px)' : 'scale(1) translateY(0)',
                }}
              >
                <img src={shape.img} alt="" className="gloss-hero__orbit-img" />
              </div>
            </div>
            );
          })}
        </div>

        {/* Hero Content */}
        <div className="gloss-hero__content">
          <div className={`gloss-hero__title-group ${isSearching ? 'gloss-hero__title-group--shrunk' : ''}`}>
            <h1 className="gloss-hero__title">
              <span className="gloss-hero__title--global">Glosario</span>{' '}
              <span className="gloss-hero__title--local">vallenato</span>
            </h1>
            <p className="gloss-hero__desc">
              En este Glosario encontrarás más de 200 palabras
              <br className="gloss-hero__desc-br" />
              que te ayudarán a entender el habla'o de los Valduparenses.
            </p>
          </div>

          <div className={`gloss-hero__search-wrap ${isSearching ? 'gloss-hero__search-wrap--active' : ''}`}>
            <div className="gloss-hero__search-bar">
              <div className="gloss-hero__search-icon-box">
                <Search className="gloss-hero__search-icon" />
              </div>
              <input
                type="text"
                className="gloss-hero__search-input"
                placeholder="Buscar palabra..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className={`gloss-hero__results ${isSearching ? 'gloss-hero__results--open' : ''}`}>
            <div className="gloss-hero__results-panel">
              {isSearching && searchResults.length > 0 ? (
                <ul className="gloss-hero__results-list">
                  {searchResults.map((item, index) => (
                    <li key={index} className="gloss-hero__results-item" onClick={() => setSelectedSearchWord(item)}>
                      <h3 className="gloss-hero__results-word">{item.word}</h3>
                      <p className="gloss-hero__results-def">{item.definition}</p>
                    </li>
                  ))}
                </ul>
              ) : isSearching && searchResults.length === 0 ? (
                <div className="gloss-hero__results-empty">
                  <Search className="gloss-hero__results-empty-icon" />
                  <p>No se encontraron palabras que coincidan con "{searchTerm}"</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ===== HERO1 – Palabras populares ===== */}
      <Hero1Section />

      {/* ===== CATEGORIES ===== */}
      <CategoriesSection categoryCounts={categoryCounts} glossaryData={glossaryData} />

      {/* ===== SUGERIR PALABRA ===== */}
      <SugerirSeccion onOpenSubmitModal={() => setShowSubmitModal(true)} />

      {/* ===== CTA ===== */}
      <CTASection />

      {/* ===== FOOTER ===== */}
      <Footer />

      {/* Submit Word Modal */}
      {showSubmitModal && (
        <SubmitWordModal
          onClose={() => setShowSubmitModal(false)}
          onWordSubmitted={() => {
            // Refresh glossary data after submission
            fetchWords();
          }}
        />
      )}

      {/* Full-screen Stamp Overlay */}
      {selectedSearchWord && (
        <WordStampOverlay
          word={selectedSearchWord}
          onClose={() => setSelectedSearchWord(null)}
        />
      )}
    </div>
  );
}

// ========= WordStampOverlay – Estampa en pantalla completa =========

function WordStampOverlay({ word, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isGreen = word.color_postal === 'verde' || !word.color_postal;
  const stampBg = isGreen
    ? 'gloss-stamp-overlay__card--green'
    : 'gloss-stamp-overlay__card--purple';

  return (
    <div className="gloss-stamp-overlay" onClick={onClose}>
      <button className="gloss-stamp-overlay__close" onClick={onClose}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="gloss-stamp-overlay__card-wrapper" onClick={(e) => e.stopPropagation()}>
        <div className={`gloss-stamp-overlay__card ${stampBg}`}>
          <div className="gloss-stamp-overlay__card-inner">
            <span className="gloss-stamp-overlay__label">Palabra</span>
            <h2 className="gloss-stamp-overlay__word">{word.word}</h2>

            <div className="gloss-stamp-overlay__divider" />

            <span className="gloss-stamp-overlay__label">Significado:</span>
            <p className="gloss-stamp-overlay__meaning">{word.definition}</p>

            <div className="gloss-stamp-overlay__divider" />

            <span className="gloss-stamp-overlay__category">
              {word.categoria ? `(${word.categoria})` : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
