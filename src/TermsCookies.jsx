import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "./TopBar";
import Footer from "./Footer";
import {
  TopLeftGlyph,
  TopRightTicketWhisk,
  MiddleLeftMermaid,
  MiddleRightLightbulb,
  BottomLeftChurch,
  BottomRightSwirl,
} from "./TermsDecorations";
import "./TermsCookies.css";

/* =========================================================
   English content
   ========================================================= */
const EN = {
  title: "Terms of Use & Cookies",
  subtitle: "Terms of Use, Privacy Policy & Cookie Policy",
  lastUpdate: "Last Updated: July 2026",
  entity: "Responsible Entity: Universidad de Santander (UDES)",
  back: "Back",
  backBtn: "GO BACK",
  langLabel: "English",
  sections: [
    {
      heading: "1. Introduction and Acceptance",
      content: (
        <>
          <p>
            Welcome to <strong>Rutas de Valledupar</strong>, a digital platform
            developed as part of an institutional project by the{" "}
            <strong>Universidad de Santander (UDES)</strong>. By accessing,
            browsing, or using this website and its associated services, you
            agree to comply with and be bound by these Terms of Use and our
            Privacy Policy. If you do not agree with these terms, please refrain
            from using the platform.
          </p>
        </>
      ),
    },
    {
      heading: "2. Conditions of Use",
      content: (
        <>
          <p>
            <strong>Nature of the Service:</strong> Rutas de Valledupar serves
            an academic, informative, and social outreach purpose, designed to
            facilitate mobility and the geographical/cultural knowledge of the
            region.
          </p>
          <p>
            <strong>Acceptable Use:</strong> Users agree to use the platform in
            a lawful, respectful manner and in accordance with the project's
            goals. It is strictly prohibited to:
          </p>
          <ul>
            <li>
              Introduce viruses, malicious code, or carry out cyberattacks that
              compromise UDES infrastructure.
            </li>
            <li>
              Use platform data for unauthorized commercial purposes or
              fraudulent activities.
            </li>
          </ul>
          <p>
            <strong>Intellectual Property:</strong> All content, source code,
            designs, logos, databases, and texts featured in "Rutas de
            Valledupar" are the property of Universidad de Santander (UDES) or
            are used with proper authorization, protected by national and
            international copyright laws.
          </p>
        </>
      ),
    },
    {
      heading: "3. User Data Collection and Privacy",
      content: (
        <>
          <p>
            Universidad de Santander (UDES) is committed to protecting your
            personal data under strict security and confidentiality standards.
          </p>
          <p>
            <strong>Data Collected:</strong> We may collect basic navigation
            data, IP addresses, contact details (if voluntarily provided via
            forms), and route preferences.
          </p>
          <p>
            <strong>Purpose of Collection:</strong> Data is exclusively used
            for:
          </p>
          <ul>
            <li>Improving platform functionality and user experience.</li>
            <li>
              Statistical and research purposes related to the academic project.
            </li>
            <li>
              Sending relevant updates regarding the service (with prior
              consent).
            </li>
          </ul>
          <p>
            <strong>User Rights:</strong> As a data subject, you have the right
            to access, update, rectify, or request the deletion of your personal
            information by contacting the UDES institutional email.
          </p>
        </>
      ),
    },
    {
      heading: "4. Cookie Policy",
      content: (
        <>
          <p>
            This website uses cookies to optimize your browsing experience.
          </p>
          <p>
            <strong>What are cookies?</strong> Cookies are small text files
            stored on your device when you visit our website.
          </p>
          <p>
            <strong>Types of cookies we use:</strong>
          </p>
          <ul>
            <li>
              <strong>Technical/Essential Cookies:</strong> Necessary for the
              core functionality of the platform.
            </li>
            <li>
              <strong>Analytics/Performance Cookies:</strong> Help us understand
              how users interact with Rutas de Valledupar so we can make
              continuous improvements.
            </li>
          </ul>
          <p>
            <strong>Cookie Management:</strong> You can configure your browser
            to block or delete cookies at any time, though doing so may affect
            certain website features.
          </p>
        </>
      ),
    },
  ],
};

/* =========================================================
   Spanish content
   ========================================================= */
const ES = {
  title: "Términos de Uso y Cookies",
  subtitle: "Términos de Uso, Política de Privacidad y Política de Cookies",
  lastUpdate: "Última actualización: Julio de 2026",
  entity: "Entidad Responsable: Universidad de Santander (UDES)",
  back: "Volver",
  backBtn: "VOLVER",
  langLabel: "Español",
  sections: [
    {
      heading: "1. Introducción y Aceptación",
      content: (
        <>
          <p>
            Bienvenido a <strong>Rutas de Valledupar</strong>, una plataforma
            digital desarrollada en el marco de un proyecto institucional de la{" "}
            <strong>Universidad de Santander (UDES)</strong>. Al acceder,
            navegar o utilizar este sitio web y sus servicios asociados, usted
            acepta cumplir y estar sujeto a los presentes Términos de Uso y
            nuestra Política de Privacidad. Si no está de acuerdo con estos
            términos, le recomendamos no utilizar la plataforma.
          </p>
        </>
      ),
    },
    {
      heading: "2. Condiciones de Uso",
      content: (
        <>
          <p>
            <strong>Naturaleza del Servicio:</strong> Rutas de Valledupar tiene
            un propósito académico, informativo y de proyección social, orientado
            a facilitar la movilidad, el conocimiento geográfico y cultural de la
            región.
          </p>
          <p>
            <strong>Uso Adecuado:</strong> El usuario se compromete a utilizar
            la plataforma de manera lícita, respetuosa y conforme a los fines del
            proyecto. Queda estrictamente prohibido:
          </p>
          <ul>
            <li>
              Introducir virus, código malicioso o realizar ataques informáticos
              que afecten la infraestructura de la UDES.
            </li>
            <li>
              Utilizar la información del sitio para fines comerciales no
              autorizados o actividades fraudulentas.
            </li>
          </ul>
          <p>
            <strong>Propiedad Intelectual:</strong> Todo el contenido, código
            fuente, diseños, logotipos, bases de datos y textos presentes en
            "Rutas de Valledupar" son propiedad de la Universidad de Santander
            (UDES) o cuentan con las autorizaciones respectivas, estando
            protegidos por las leyes nacionales e internacionales de derechos de
            autor.
          </p>
        </>
      ),
    },
    {
      heading: "3. Recolección de Datos de Usuarios (Habeas Data)",
      content: (
        <>
          <p>
            En cumplimiento de la normatividad vigente sobre protección de datos
            personales (en Colombia, Ley 1581 de 2012), la Universidad de
            Santander (UDES) le informa que los datos recolectados a través de
            la plataforma serán tratados bajo estrictos estándares de seguridad y
            confidencialidad.
          </p>
          <p>
            <strong>Datos recolectados:</strong> Podemos recopilar información
            básica de navegación, dirección IP, datos de contacto (si el usuario
            los proporciona voluntariamente mediante formularios) y preferencias
            de ruta.
          </p>
          <p>
            <strong>Finalidad:</strong> Los datos se utilizan exclusivamente
            para:
          </p>
          <ul>
            <li>
              Mejorar la funcionalidad y experiencia de usuario en la
              plataforma.
            </li>
            <li>
              Fines estadísticos e investigativos propios del proyecto
              académico.
            </li>
            <li>
              Envío de información relevante sobre actualizaciones del servicio
              (previo consentimiento).
            </li>
          </ul>
          <p>
            <strong>Derechos del Usuario:</strong> Como titular de los datos,
            usted puede ejercer sus derechos de conocer, actualizar, rectificar
            o suprimir su información escribiendo al correo institucional de la
            UDES.
          </p>
        </>
      ),
    },
    {
      heading: "4. Política de Cookies",
      content: (
        <>
          <p>
            Este sitio web utiliza cookies para optimizar la experiencia de
            navegación.
          </p>
          <p>
            <strong>¿Qué son las cookies?</strong> Son pequeños archivos de
            texto que se almacenan en su dispositivo cuando visita nuestro sitio
            web.
          </p>
          <p>
            <strong>Tipos de cookies que utilizamos:</strong>
          </p>
          <ul>
            <li>
              <strong>Cookies técnicas o esenciales:</strong> Necesarias para el
              correcto funcionamiento de la plataforma.
            </li>
            <li>
              <strong>Cookies de análisis/rendimiento:</strong> Nos permiten
              entender cómo interactúan los usuarios con Rutas de Valledupar
              para realizar mejoras continuas.
            </li>
          </ul>
          <p>
            <strong>Gestión de cookies:</strong> Usted puede configurar su
            navegador para rechazar o eliminar las cookies en cualquier momento,
            aunque esto podría afectar algunas funcionalidades del sitio.
          </p>
        </>
      ),
    },
  ],
};

/* =========================================================
   TermsCookies component
   ========================================================= */
export default function TermsCookies() {
  const navigate = useNavigate();
  const [lang, setLang] = useState("es");

  const content = lang === "es" ? ES : EN;

  return (
    <>
      <TopBar
        activeSection="terminos"
        isAuthenticated={false}
        user={{ name: "Usuario Valido", initials: "UV" }}
        onSectionChange={() => {}}
      />

      <div className="terms-cookies">
        <div className="terms-cookies__paper-bg" />

        {/* Decorative illustrations */}
        <div className="terms-cookies__decor terms-cookies__decor--tl">
          <TopLeftGlyph />
        </div>
        <div className="terms-cookies__decor terms-cookies__decor--tr">
          <TopRightTicketWhisk />
        </div>
        <div className="terms-cookies__decor terms-cookies__decor--ml">
          <MiddleLeftMermaid />
        </div>
        <div className="terms-cookies__decor terms-cookies__decor--mr">
          <MiddleRightLightbulb />
        </div>
        <div className="terms-cookies__decor terms-cookies__decor--bl">
          <BottomLeftChurch />
        </div>
        <div className="terms-cookies__decor terms-cookies__decor--br">
          <BottomRightSwirl />
        </div>

        {/* Scrollable content */}
        <div className="terms-cookies__scroll">
          {/* Language toggle */}
          <div className="terms-cookies__lang-row">
            <button className="terms-cookies__back" onClick={() => navigate(-1)}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {lang === "es" ? "Volver" : "Back"}
            </button>

            <div className="terms-cookies__lang-toggle">
              <button
                className={`terms-cookies__lang-btn${
                  lang === "es" ? " terms-cookies__lang-btn--active" : ""
                }`}
                onClick={() => setLang("es")}
                aria-pressed={lang === "es"}
              >
                ES
              </button>
              <span className="terms-cookies__lang-divider">|</span>
              <button
                className={`terms-cookies__lang-btn${
                  lang === "en" ? " terms-cookies__lang-btn--active" : ""
                }`}
                onClick={() => setLang("en")}
                aria-pressed={lang === "en"}
              >
                EN
              </button>
            </div>

            <div className="terms-cookies__lang-spacer" />
          </div>

          {/* Header */}
          <div className="terms-cookies__header">
            <div className="terms-cookies__header-row">
              <span className="terms-cookies__tilde">~</span>
              <h1 className="terms-cookies__title">{content.title}.</h1>
              <span className="terms-cookies__tilde">~</span>
            </div>
            <p className="terms-cookies__subtitle">{content.subtitle}</p>
            <div className="terms-cookies__meta">
              <span>{content.lastUpdate}</span>
              <span className="terms-cookies__meta-sep">•</span>
              <span>{content.entity}</span>
            </div>
          </div>

          {/* Body */}
          <div className="terms-cookies__body">
            {content.sections.map((section, i) => (
              <div key={i}>
                <h3 className="terms-cookies__section-title">
                  {section.heading}
                </h3>
                {section.content}
              </div>
            ))}

            {/* Footer button */}
            <div className="terms-cookies__footer">
              <button
                className="terms-cookies__btn-back"
                onClick={() => navigate(-1)}
              >
                {content.backBtn}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
