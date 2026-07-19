import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import Footer from './Footer';
import { supabase } from './supabaseClient';
import './Glossary.css';

// Image assets from public/assets/glosario/
const imgMarcoVerde = "/assets/glosario/864b827d37a64e1ef35951b48f48a7d196f73bfc.png";
const imgMarcoMorado = "/assets/glosario/d94620b583929c8d0a6fb5418d8c875b924f8c60.png";
const imgRecurso1Postal3 = "/assets/glosario/20fd5b503f6b79dff07b513f3bc7604deafa7331.png";
const imgRecurso3PostalMorado1 = "/assets/glosario/c56c8963ea54ddce3fb1dd22c4276099b158fec3.png";

// Imágenes del diseño rotatorio desde "diseños glosario"
const orbitImages = [
  "/assets/glosario/arepa y caldero 1.png",
  "/assets/glosario/arepa y caldero 2.png",
  "/assets/glosario/boli y pescado 1.png",
  "/assets/glosario/mango y cañahuate 2.png",
  "/assets/glosario/poporos y armadillo 1.png",
  "/assets/glosario/trinitarias 1.png",
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
  { id: 6, word: "Foquiao", meaning: "Persona que esta dormida profundamente", type: "(Para referirse)", img: imgRecurso3PostalMorado1, rotate: 32.29, bg: "purple" },
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
];

// ========= Hero1 Component (stamp layout + glosario1 typography & animations) =========

const imgVector = "/assets/glosario/b73c7b38153a37b28c7dd09804c37c6904b4c5e3.svg";

function Hero1Section() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % heroWords.length);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + heroWords.length) % heroWords.length);
  };

  // Stack of 4 visible cards
  const visibleCards = [];
  for (let i = 0; i < 4; i++) {
    const index = (currentIndex + i) % heroWords.length;
    visibleCards.push(heroWords[index]);
  }
  const stack = [...visibleCards].reverse();

  return (
    <section className="gloss-hero1">
      <div className="gloss-hero1__container">

        {/* LEFT COLUMN: Info Card (glosario1 typography) */}
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
          <div className="gloss-hero1__info-cta">
            CONOCE MÁS PALABRAS
          </div>
        </div>

        {/* RIGHT COLUMN: Stamp card stack (como glosario1) */}
        <div className="gloss-hero1__stamp-wrapper">
          {/* Orange stamp SVG background (como glosario1) */}
          <div className="gloss-hero1__stamp-bg">
            <img alt="" src={imgVector} />
          </div>

          {/* Card stack animation (from glosario1) */}
          <div className="gloss-hero1__card-stack">
            <AnimatePresence mode="popLayout">
              {stack.map((item, i) => {
                const isTop = i === stack.length - 1;
                const cardInnerClass = item.bg === "green"
                  ? "gloss-hero1__card-inner gloss-hero1__card-inner--verde"
                  : "gloss-hero1__card-inner gloss-hero1__card-inner--morado";
                return (
                  <motion.div
                    key={item.id}
                    layoutId={`card-${item.id}`}
                    initial={{ opacity: 0, scale: 0.8, y: 50, rotate: item.rotate - 10 }}
                    animate={{
                      opacity: 1,
                      scale: isTop ? 1 : 1 - (stack.length - 1 - i) * 0.05,
                      y: isTop ? 0 : (stack.length - 1 - i) * 20,
                      rotate: item.rotate,
                    }}
                    exit={{ opacity: 0, scale: 1.2, x: 200, rotate: item.rotate + 10 }}
                    transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }}
                    className="gloss-hero1__card"
                    style={{ zIndex: i }}
                  >
                    <div className={cardInnerClass}>
                      <div className="gloss-hero1__card-overlay" />
                      <div className="gloss-hero1__card-content">
                        <div className="gloss-hero1__card-word-wrap">
                          <p className="gloss-hero1__card-word">{item.word}</p>
                        </div>
                        <p className="gloss-hero1__card-meaning-label">Significado:</p>
                        <div className="gloss-hero1__card-meaning-text">
                          <p>{item.meaning}</p>
                        </div>
                        <p className="gloss-hero1__card-type">{item.type}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="gloss-hero1__stamp-nav">
            <button onClick={prevCard} className="gloss-hero1__stamp-btn">
              Ant.
            </button>
            <button onClick={nextCard} className="gloss-hero1__stamp-btn">
              Sig.
            </button>
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
      <section className="gloss-categories">
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

function SugerirSeccion() {
  const col1Data = palabrasSugerir.slice(0, Math.ceil(palabrasSugerir.length / 2));
  const col2Data = palabrasSugerir.slice(Math.ceil(palabrasSugerir.length / 2));
  const infiniteCol1 = [...col1Data, ...col1Data];
  const infiniteCol2 = [...col2Data, ...col2Data];

  return (
    <section className="gloss-sugerir">

      {/* LEFT COLUMN: Falling stamp cards */}
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

      {/* RIGHT COLUMN: Text content */}
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
          <button className="gloss-sugerir__btn">
            Escribe tu palabra
          </button>
        </div>
      </div>

    </section>
  );
}

// ========= Main Glossary Page =========

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [rotation, setRotation] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [glossaryData, setGlossaryData] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});

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

  // Continuous rotation animation for orbiting shapes
  useEffect(() => {
    let lastStepTime = Date.now();
    let currentRotation = 0;

    const animate = () => {
      const now = Date.now();
      if (now - lastStepTime > 2000) {
        currentRotation = (currentRotation + 20) % 360;
        setRotation(currentRotation);
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
      <TopBar activeSection="glosario" isAuthenticated={false} user={{ name: "Usuario Valido", initials: "UV" }} onSectionChange={() => {}} />

      {/* ===== HERO ===== */}
      <section className="gloss-hero">
        <div className="gloss-hero__top-border" />

        {/* Orbiting Shapes */}
        <div className="gloss-hero__orbit-area">
          {orbitShapesConfig.map((shape, index) => (
            <div
              key={index}
              className="gloss-hero__orbit-shape"
              style={getShapeStyle(index, orbitShapesConfig.length, rotation)}
            >
              <div
                className="gloss-hero__orbit-shape-inner"
                style={{
                  '--shape-delay': `${shape.delay * 0.5}s`,
                  '--shape-lg': shape.sizeLarge,
                  '--shape-sm': shape.sizeSmall,
                }}
              >
                <img src={shape.img} alt="" className="gloss-hero__orbit-img" />
              </div>
            </div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="gloss-hero__content">
          <div className={`gloss-hero__title-group ${isSearching ? 'gloss-hero__title-group--shrunk' : ''}`}>
            <h1 className="gloss-hero__title">
              <span className="gloss-hero__title--global">Glosario</span>{' '}
              <span className="gloss-hero__title--local">vallenato</span>
            </h1>
            <p className="gloss-hero__desc">
              En este Glosario encontrarás más de 200 palabras que te ayudarán a entender
              <br className="gloss-hero__desc-br" />
              el habla'o de los Valduparenses.
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
                    <li key={index} className="gloss-hero__results-item">
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
      <SugerirSeccion />

      {/* ===== FOOTER ===== */}
      <Footer />
    </div>
  );
}
