import sys

content = '''import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "./TopBar";
import "./Glossary.css";

import heroImage from "../glosario1/src/assets/hero.png";
import imgFrameGreen from "../glosario1/public/assets/864b827d37a64e1ef35951b48f48a7d196f73bfc.png";
import imgFramePurple from "../glosario1/public/assets/d94620b583929c8d0a6fb5418d8c875b924f8c60.png";

const heroCards = [
  { id: 1, word: "Bacano", label: "Buena vibra", description: "Algo o alguien que es muy chevere, divertido y con buena energia. Se usa para resaltar lo positivo.", bgFrom: "#bb4c18", bgTo: "#ffdd89" },
  { id: 2, word: "Rebusque", label: "Ingenio caribeno", description: "La capacidad de encontrar soluciones creativas con los recursos disponibles. Eso que uno arma con lo que tiene.", bgFrom: "#8e57a5", bgTo: "#d18de6" },
  { id: 3, word: "Vaina", label: "Todo y nada", description: "Palabra comodin para referirse a cualquier cosa, situacion o asunto sin nombrarlo directamente.", bgFrom: "#2f7d58", bgTo: "#7cc38d" },
];

const CATEGORIES = [
  { name: "Objeto", count: 54, color: "green" }, { name: "Transporte", count: 5, color: "purple" }, { name: "Material", count: 2, color: "green" }, { name: "Bebida", count: 6, color: "purple" }, { name: "Alimento", count: 7, color: "green" }, { name: "Animal", count: 11, color: "purple" }, { name: "Planta", count: 3, color: "green" }, { name: "Gesto", count: 4, color: "purple" }, { name: "Expresion", count: 5, color: "green" }, { name: "Cuerpo", count: 6, color: "purple" }, { name: "Para referirse", count: 120, color: "green" }, { name: "Vestimenta", count: 5, color: "purple" }, { name: "Accesorio", count: 9, color: "green" }, { name: "Fantasia", count: 1, color: "purple" }, { name: "Juego", count: 1, color: "green" },
];

export default function Glossary() {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => { setActiveIndex((prev) => (prev + 1) % heroCards.length); }, 6500);
    return () => clearInterval(interval);
  }, []);
  const handleNext = () => { setActiveIndex((prev) => (prev + 1) % heroCards.length); };
  const handlePrev = () => { setActiveIndex((prev) => (prev - 1 + heroCards.length) % heroCards.length); };

  return (
    <div className="gloss-page">
      <TopBar activeSection="glosario" isAuthenticated={false} user={{ name: "Usuario", initials: "UV" }} />
      
      <section className="gloss-hero-new">
        <div className="gloss-hero-new__bg-glow" />
        <div className="gloss-hero-new__bg-blob-1" />
        <div className="gloss-hero-new__bg-blob-2" />
        <div className="gloss-hero-new__bg-blob-3" />

        <div className="gloss-hero-new__inner">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="gloss-hero-new__content">
            <div className="gloss-hero-new__badge">Diseno inspirado en Figma</div>
            <div className="gloss-hero-new__text-group">
              <h1 className="gloss-hero-new__title">Glosario interactivo de Valledupar</h1>
              <p className="gloss-hero-new__subtitle">Aprende las expresiones, palabras y sabores de la region con una experiencia animada. Cada tarjeta pulsa con movimiento, color y ritmo caribeno.</p>
            </div>
            <div className="gloss-hero-new__actions">
              <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} href="#" className="gloss-hero-new__btn-primary">Conoce mas palabras</motion.a>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="gloss-hero-new__btn-secondary">Ver categorias</motion.button>
            </div>
          </motion.div>

          <div className="gloss-hero-new__card-section">
            <div className="gloss-hero-new__card-glow" />
            <div className="gloss-hero-new__card-container">
              <div className="gloss-hero-new__card-header">
                <div>
                  <p className="gloss-hero-new__card-header-title">Hero</p>
                  <p className="gloss-hero-new__card-header-desc">Palabras de la region con ritmo visual.</p>
                </div>
                <div className="gloss-hero-new__card-header-badge">animate</div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -24, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="gloss-hero-new__card"
                  style={{ background: `linear-gradient(135deg, ${heroCards[activeIndex].bgFrom}, ${heroCards[activeIndex].bgTo})` }}
                >
                  <div className="gloss-hero-new__card-image-wrap">
                    <img src={heroImage} alt="" className="gloss-hero-new__card-image" />
                    <div className="gloss-hero-new__card-image-overlay" />
                  </div>
                  <div className="gloss-hero-new__card-body">
                    <span className="gloss-hero-new__card-label">{heroCards[activeIndex].label}</span>
                    <h2 className="gloss-hero-new__card-word">{heroCards[activeIndex].word}</h2>
                    <p className="gloss-hero-new__card-desc">{heroCards[activeIndex].description}</p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="gloss-hero-new__card-nav">
                <motion.button whileHover={{ y: -2 }} onClick={handlePrev} className="gloss-hero-new__card-nav-btn gloss-hero-new__card-nav-btn--prev">Anterior</motion.button>
                <motion.button whileHover={{ y: -2 }} onClick={handleNext} className="gloss-hero-new__card-nav-btn gloss-hero-new__card-nav-btn--next">Siguiente</motion.button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gloss-categories">
        <motion.div initial={{ opacity: 0, y: -30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="gloss-categories__header">
          <h2 className="gloss-categories__title">Categorias</h2>
          <p className="gloss-categories__desc">Aprende las palabras y expresiones tipicas del Caribe colombiano clasificadas por tematicas. Explora nuestra riqueza verbal!</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="gloss-categories__grid">
          {CATEGORIES.map((cat, index) => (
            <motion.div key={cat.name} variants={{ hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", bounce: 0.4 } } }} whileHover={{ scale: 1.05, rotate: index % 2 === 0 ? 2 : -2 }} className="gloss-categories__item">
              <div className="gloss-categories__item-frame">
                <div className="gloss-categories__item-frame-inner">
                  <img alt="" className="gloss-categories__item-frame-img" src={cat.color === "green" ? imgFrameGreen : imgFramePurple} draggable={false} />
                </div>
              </div>
              <div className="gloss-categories__item-content">
                <p className="gloss-categories__item-name">{cat.name}</p>
                <p className="gloss-categories__item-count">({cat.count})</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
'''

with open('src/Glossary.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('JSX written: ' + str(len(content)) + ' bytes')
