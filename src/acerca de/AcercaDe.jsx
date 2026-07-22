import { useState } from "react";
import TopBar from "../TopBar";
import Footer from "../Footer";
import iconInstagram from "../assets/mcp/icon_instagram.png";
import iconMail from "../assets/mcp/icon_mail.png";
import heroTeam from "../assets/mcp/hero_centro.png";
import "./AcercaDe.css";

const teamMembers = [
  {
    name: "Stephanie De Castro",
    role: "Docente líder de investigación",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Ana Karina González",
    role: "Líder de diseño editorial",
    image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Carlos Andrés Pérez",
    role: "Gestor de contenido multimedia",
    image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?auto=format&fit=crop&w=600&q=80",
  },
];

export default function AcercaDe() {
  const [formState, setFormState] = useState({ name: "", email: "", razon: "", mensaje: "" });
  const [formStatus, setFormStatus] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormStatus("Gracias por escribirnos. Pronto te contactaremos.");
    setFormState({ name: "", email: "", razon: "", mensaje: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page-shell acerca-page">
      <TopBar activeSection="acerca" />

      <main className="acerca-page__main">
        <section className="acerca-hero">
          <div className="acerca-hero__pattern" />
          <div className="acerca-hero__inner">
            <div className="acerca-hero__text">
              <p className="acerca-hero__eyebrow">Rutas de Valledupar</p>
              <h1 className="acerca-hero__title">Una experiencia patrimonial</h1>
              <p className="acerca-hero__subtitle">
                Una propuesta multimedia para celebrar la cultura vallenata, sus historias, su gente y su territorio.
              </p>
            </div>

            <div className="acerca-hero__visual">
              <div className="acerca-hero__photo-frame">
                <img src={heroTeam} alt="Equipo de Rutas de Valledupar" />
              </div>
            </div>
          </div>
        </section>

        <section className="acerca-about">
          <div className="acerca-about__wrapper">
            <div className="acerca-about__card">
              <div className="acerca-about__icon foco" />
              <p className="acerca-about__text">
                Rutas de Valledupar nace del amor por nuestra tierra, sus costumbres y esa forma tan única que tienen los vallenatos de contar el mundo. Somos una bitácora viva y un viaje multimedia diseñado para salvaguardar, celebrar y redescubrir el patrimonio inmaterial de nuestra región.
              </p>
            </div>

            <div className="acerca-about__decor">
              <div className="acerca-about__box">Patrimonio</div>
              <div className="acerca-about__box">Tradición</div>
              <div className="acerca-about__box">Música</div>
              <div className="acerca-about__box">Comunidad</div>
            </div>
          </div>
        </section>

        <section className="acerca-manifesto">
          <div className="acerca-manifesto__content">
            <div className="acerca-manifesto__heading">
              <span className="acerca-manifesto__tag">Manifiesto</span>
              <h2 className="acerca-manifesto__title">La tradición es una llama que se enciende cada vez que contamos nuestras historias.</h2>
            </div>
            <p className="acerca-manifesto__copy">
              En Rutas de Valledupar queremos mirar atrás sin dejar de avanzar. Cada ruta es un relato, cada sonido una memoria y cada encuentro una razón para seguir construyendo identidad. Creemos en la fuerza de la palabra hablada, la fotografía que conmueve y los videos que transmiten la emoción viva de un pueblo que nunca se olvida de sus raíces.
            </p>
          </div>

          <div className="acerca-manifesto__media">
            <div className="acerca-manifesto__media-card">
              <div className="acerca-manifesto__media-label">Un gesto, una voz, un legado</div>
              <div className="acerca-manifesto__media-preview">
                <img src="https://images.unsplash.com/photo-1597495511110-9155d2fa3030?auto=format&fit=crop&w=900&q=80" alt="Video testimonial" />
                <div className="acerca-manifesto__play-button">▶</div>
              </div>
            </div>
          </div>
        </section>

        <section className="acerca-team">
          <div className="acerca-team__top">
            <p className="acerca-team__eyebrow">Conozca al equipo</p>
            <h2 className="acerca-team__title">Las tradiciones se heredan, se viven y se comparten</h2>
          </div>

          <div className="acerca-team__grid">
            {teamMembers.map((member) => (
              <article key={member.name} className="acerca-team__card">
                <div className="acerca-team__photo">
                  <img src={member.image} alt={member.name} />
                </div>
                <div>
                  <h3>{member.name}</h3>
                  <p>{member.role}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="acerca-contact">
          <div className="acerca-contact__info">
            <p className="acerca-contact__eyebrow">Contacto</p>
            <h2 className="acerca-contact__title">¡Hablamos?</h2>
            <p className="acerca-contact__description">
              Dudas, sugerencias, ideas parranderas o propuestas de trabajo es bienvenido. Déjanos tus datos y nos ponemos en contacto contigo más rápido de lo que canta un gallo.
            </p>

            <div className="acerca-contact__socials">
              <a href="https://www.instagram.com/rutasvalledupar" target="_blank" rel="noreferrer">
                <img src={iconInstagram} alt="Instagram" /> Instagram
              </a>
              <a href="mailto:rutasvalledupar@gmail.com">
                <img src={iconMail} alt="Correo" /> rutasvalledupar@gmail.com
              </a>
            </div>
          </div>

          <form className="acerca-contact__form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input name="name" value={formState.name} onChange={handleChange} placeholder="Tu nombre" />
            </label>
            <label>
              Email
              <input name="email" value={formState.email} onChange={handleChange} type="email" placeholder="correo@ejemplo.com" />
            </label>
            <label>
              Razón
              <input name="razon" value={formState.razon} onChange={handleChange} placeholder="¿Qué nos cuentas?" />
            </label>
            <label>
              Mensaje
              <textarea name="mensaje" value={formState.mensaje} onChange={handleChange} placeholder="Escribe tu mensaje aquí" />
            </label>
            <button type="submit">ENVIAR</button>
            {formStatus && <p className="acerca-contact__success">{formStatus}</p>}
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
}
