import React from "react";
import "./TermsModal.css";

/* =========================================================
   Decorative SVG components
   ========================================================= */
const TopLeftGlyph = () => (
  <svg viewBox="0 0 120 150" width="96" height="120">
    <path d="M20,20 Q60,10 90,40 Q110,60 80,100 Q50,130 30,110 Z" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M40,50 Q60,40 70,70" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
    <circle cx="65" cy="55" r="4" fill="#2b2b2b" />
  </svg>
);

const TopRightTicketWhisk = () => (
  <svg viewBox="0 0 180 150" width="130" height="110">
    <rect x="20" y="30" width="90" height="110" rx="4" fill="none" stroke="#2b2b2b" strokeWidth="2.5" transform="rotate(-15 65 85)" />
    <circle cx="50" cy="65" r="6" fill="#2b2b2b" transform="rotate(-15 65 85)" />
    <circle cx="75" cy="80" r="5" fill="#2b2b2b" transform="rotate(-15 65 85)" />
    <circle cx="60" cy="100" r="5" fill="#2b2b2b" transform="rotate(-15 65 85)" />
    <line x1="85" y1="50" x2="100" y2="65" stroke="#2b2b2b" strokeWidth="2" transform="rotate(-15 65 85)" />
    <line x1="85" y1="70" x2="100" y2="85" stroke="#2b2b2b" strokeWidth="2" transform="rotate(-15 65 85)" />
    <path d="M120,30 L160,80" stroke="#2b2b2b" strokeWidth="3" strokeLinecap="round" />
    <path d="M145,55 Q160,50 170,65 Q160,80 145,75" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <path d="M140,50 Q155,40 170,55" fill="none" stroke="#2b2b2b" strokeWidth="2" />
  </svg>
);

const MiddleLeftMermaid = () => (
  <svg viewBox="0 0 150 200" width="100" height="130">
    <path d="M30,80 Q50,60 80,70 Q110,90 90,130 Q70,160 40,150 Q20,130 30,80 Z" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
    <circle cx="85" cy="55" r="18" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
    <path d="M70,45 Q85,35 100,50" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <path d="M90,130 Q120,150 140,110 Q150,90 130,80" fill="none" stroke="#2b2b2b" strokeWidth="2.5" />
  </svg>
);

const MiddleRightLightbulb = () => (
  <svg viewBox="0 0 120 180" width="90" height="130">
    <path d="M40,20 L80,20 L80,40 Q95,60 95,85 Q95,120 60,130 L60,150 L60,165" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M45,75 Q60,65 75,75" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <circle cx="60" cy="85" r="12" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <line x1="50" y1="150" x2="70" y2="150" stroke="#2b2b2b" strokeWidth="2.5" />
    <line x1="53" y1="158" x2="67" y2="158" stroke="#2b2b2b" strokeWidth="2.5" />
  </svg>
);

const BottomLeftChurch = () => (
  <svg viewBox="0 0 140 180" width="100" height="120">
    <path d="M40,50 L70,20 L100,50 L100,160 L40,160 Z" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M55,80 Q70,70 85,80 L85,120 L55,120 Z" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <circle cx="70" cy="38" r="6" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    <line x1="70" y1="10" x2="70" y2="20" stroke="#2b2b2b" strokeWidth="2.5" />
    <line x1="64" y1="15" x2="76" y2="15" stroke="#2b2b2b" strokeWidth="2.5" />
  </svg>
);

const BottomRightSwirl = () => (
  <svg viewBox="0 0 140 140" width="90" height="90">
    <path d="M30,90 Q30,40 80,40 Q110,40 115,70 Q120,100 85,110 Q50,120 40,90 Q30,60 60,50" fill="none" stroke="#2b2b2b" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M70,75 Q85,75 90,90" fill="none" stroke="#2b2b2b" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

/* =========================================================
   TermsModal component
   ========================================================= */
export default function TermsModal({ onClose }) {
  return (
    <div className="terms-modal__overlay" onClick={onClose}>
      <div className="terms-modal__bg" />
      <div className="terms-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="terms-modal__paper-bg" />

        {/* Close */}
        <button className="terms-modal__close" onClick={onClose} aria-label="Cerrar">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Decorative illustrations */}
        <div className="terms-modal__decor terms-modal__decor--tl">
          <TopLeftGlyph />
        </div>
        <div className="terms-modal__decor terms-modal__decor--tr">
          <TopRightTicketWhisk />
        </div>
        <div className="terms-modal__decor terms-modal__decor--ml">
          <MiddleLeftMermaid />
        </div>
        <div className="terms-modal__decor terms-modal__decor--mr">
          <MiddleRightLightbulb />
        </div>
        <div className="terms-modal__decor terms-modal__decor--bl">
          <BottomLeftChurch />
        </div>
        <div className="terms-modal__decor terms-modal__decor--br">
          <BottomRightSwirl />
        </div>

        {/* Scrollable content */}
        <div className="terms-modal__scroll">
          {/* Back button */}
          <button className="terms-modal__back" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>

          {/* Header */}
          <div className="terms-modal__header">
            <div className="terms-modal__header-row">
              <span className="terms-modal__tilde">~</span>
              <h1 className="terms-modal__title">Términos y condiciones.</h1>
              <span className="terms-modal__tilde">~</span>
            </div>
            <p className="terms-modal__subtitle">
              Términos, condiciones de uso y política de tratamiento de datos
            </p>
          </div>

          {/* Body */}
          <div className="terms-modal__body">
            <p>
              Bienvenido a la página web de Rutas de Valledupar. Al acceder, navegar, colaborar o interactuar en este sitio web, usted acepta de manera consciente, expresa e irrevocable los presentes Términos y Condiciones de Uso. Si no está de acuerdo con estas cláusulas, le solicitamos abstenerse de utilizar la plataforma y sus servicios.
            </p>

            <div>
              <h3 className="terms-modal__section-title">1. Objeto de la Plataforma</h3>
              <p>
                La presente plataforma web es un proyecto de carácter cultural, educativo y transmedia cuyo objetivo es la recopilación, salvaguarda, difusión y visibilización del patrimonio inmaterial, léxico y tradicional de Valledupar y la región del Cesar. La plataforma permite la consulta de un glosario multimedia y la participación activa de los usuarios mediante el envío de palabras, definiciones, categorías y ejemplos de uso local.
              </p>
            </div>

            <div>
              <h3 className="terms-modal__section-title">2. Condiciones de Participación y Contenido Generado por el Usuario (CGU)</h3>
              <p className="mb-3">
                Al enviar cualquier tipo de información, texto, palabra, significado o ejemplo a través de nuestros formularios de colaboración, el Usuario garantiza y acepta que:
              </p>
              <ul>
                <li>
                  <strong>Carácter Público y Gratuito:</strong> El contenido se comparte con el único fin de nutrir un archivo cultural colectivo. El Usuario renuncia expresamente a exigir cualquier tipo de compensación económica, regalía o contraprestación presente o futura por los aportes realizados.
                </li>
                <li>
                  <strong>Licencia de Uso:</strong> El Usuario otorga a la plataforma una licencia perpetua, global, no exclusiva, gratuita y transferible para reproducir, editar, adaptar, publicar, traducir y distribuir dicho contenido en cualquier formato multimedia (web, redes sociales, bitácoras impresas o documentales).
                </li>
                <li>
                  <strong>Autoría y Originalidad:</strong> El Usuario declara que el contenido enviado no infringe derechos de propiedad intelectual, derechos de autor ni derechos de terceros. La plataforma no se hace responsable por reclamos legales derivados de plagio o suplantación de identidad en los aportes.
                </li>
                <li>
                  <strong>Moderación de Contenido:</strong> La administración de la plataforma se reserva el derecho autónomo de revisar, editar, corregir la ortografía, categorizar o eliminar de forma definitiva cualquier aporte que considere ofensivo, difamatorio, discriminatorio, obsceno o ajeno al propósito cultural del sitio.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="terms-modal__section-title">3. Propiedad Intelectual de la Plataforma</h3>
              <p>
                Todo el material dispuesto en este sitio web, incluyendo de forma enunciativa pero no limitativa: diseños de interfaz, maquetación, ilustraciones, bitácoras digitales, código fuente, registros audiovisuales, piezas de audio, textos de la galería y logotipos, son propiedad exclusiva de los creadores del proyecto Rutas de Valledupar o cuentan con las autorizaciones debidas.
              </p>
              <ul>
                <li>
                  Queda estrictamente prohibida la reproducción total o parcial, explotación comercial, alteración o distribución de dicho material sin la autorización previa, expresa y por escrito de los titulares del proyecto.
                </li>
                <li>
                  Se permite la visualización, descarga para uso estrictamente personal/educativo y la difusión de enlaces en redes sociales, siempre y cuando se otorgue el crédito correspondiente a la plataforma.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="terms-modal__section-title">4. Política de Tratamiento de Datos Personales (Ley 1581 de 2012)</h3>
              <p>
                En cumplimiento de la legislación colombiana vigente en materia de protección de datos personales, le informamos que:
              </p>
              <ul>
                <li>
                  <strong>Recolección:</strong> La plataforma recopila datos como el nombre, seudónimo/apodo y/o correo electrónico del Usuario únicamente cuando este decide libre y voluntariamente proporcionarlos en los formularios.
                </li>
                <li>
                  <strong>Finalidad:</strong> Los datos serán utilizados exclusivamente para: (a) Otorgar el crédito respectivo al Usuario al lado de la palabra publicada si este así lo autorizó; (b) Gestionar la comunidad de colaboradores.
                </li>
                <li>
                  <strong>Derechos ARCO:</strong> El Usuario, como titular de los datos, tiene derecho a conocer, actualizar, rectificar o solicitar la supresión de su información personal de nuestras bases de datos en cualquier momento, enviando una solicitud formal a nuestros canales de contacto oficiales.
                </li>
              </ul>
            </div>

            {/* Footer button */}
            <div className="terms-modal__footer">
              <button className="terms-modal__btn-back" onClick={onClose}>
                VOLVER AL FORMULARIO
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
