import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TopBar from "./TopBar";
import "./Glossary.css";
import textureImg from "../recursos/Textura (1) 1.png";
import searchIcon from "../glosario/search.svg";

const WORDS = [
  { word: "Derroche", meaning: "Acción de malgastar o desperdiciar algo", category: "Para referirse" },
  { word: "Apalastrao", meaning: "Persona que tiene mucha flojera o no tiene ánimos para hacer algo", category: "Para referirse" },
  { word: "Icotea", meaning: "Conocida como tortuga de monte, se encuentra en jagüeyes y ciénagas", category: "Animal" },
  { word: "Vironda", meaning: "Persona que está dormida profundamente", category: "Para referirse" },
  { word: "Perrenque", meaning: "Persona que tiene muchas ganas de hacer algo", category: "Para referirse" },
  { word: "Fundingue", meaning: "Personas que están en el desorden cuando hay una festividad", category: "Para referirse" },
];

const CATEGORY_ITEMS = [
  { label: "Para referirse", count: 120, description: "Expresiones típicas del habla vallenata." },
  { label: "Alimentos y objetos", count: 39, description: "Palabras de cocina, mercado y cultura local." },
  { label: "Naturaleza y animales", count: 14, description: "Términos del río, la tierra y la vida rural." },
];

export default function Glossary() {
  const [searchValue, setSearchValue] = useState("");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeaturedIndex((current) => (current + 1) % WORDS.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const featured = WORDS[featuredIndex];

  return (
    <div className="gloss-page">
      <TopBar activeSection="glosario" isAuthenticated={false} user={{ name: "Usuario", initials: "UV" }} />

      <main className="gloss-main">
        <section className="gloss-hero">
          <div className="gloss-hero__bg" style={{ backgroundImage: `url(${textureImg})` }} />
          <motion.div
            className="gloss-hero__content"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1>Glosario Vallenato</h1>
            <p>
              En este Glosario encontrarás más de <strong>200 palabras</strong> que te ayudarán a entender el hablao' de los Valduparences.
            </p>

            <div className="gloss-search">
              <img src={searchIcon} alt="Buscar" className="gloss-search__icon" />
              <input
                type="search"
                placeholder="Buscar palabra..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                aria-label="Buscar palabra"
              />
            </div>
          </motion.div>
        </section>

        <section className="gloss-feature-row">
          <motion.article
            className="gloss-card gloss-card--white"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="gloss-card__eyebrow">¿No entendiste? ¡No pasa nada, ombe!</span>
            <h2>Palabras Populares</h2>
            <p>
              Si te dijeron que eras un <strong>"Bacano"</strong> o te mandaron a <strong>"recoger una vaina"</strong>, aquí te explicamos el asunto.
              Este glosario es la guía para entender el hablao' del pueblo. Referencias locales y toda esa jerga que nos hace únicos en el mapa.
            </p>
            <button type="button">Conoce más palabras</button>
          </motion.article>

          <motion.article
            className="gloss-card gloss-card--beige"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="gloss-card__top">
              <span className="gloss-card__tag">{featured.category.toUpperCase()}</span>
              <div className="gloss-card__actions">
                <button type="button" onClick={() => setFeaturedIndex((index) => (index - 1 + WORDS.length) % WORDS.length)}>ANT.</button>
                <button type="button" onClick={() => setFeaturedIndex((index) => (index + 1) % WORDS.length)}>SIG.</button>
              </div>
            </div>
            <h2>{featured.word}</h2>
            <p className="gloss-card__meaning">{featured.meaning}</p>
            <p className="gloss-card__footer">DESCUBRE ESTA PALABRA VALLENATA.</p>
          </motion.article>
        </section>

        <section className="gloss-categories">
          <span className="gloss-categories__label">Categorías</span>
          <h2>Aprende las palabras y expresiones típicas de Valledupar antes de tu visita.</h2>
          <div className="gloss-categories__list">
            {CATEGORY_ITEMS.map((item) => (
              <article key={item.label} className="gloss-category-box">
                <span className="gloss-category-box__count">{item.count} palabras</span>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
