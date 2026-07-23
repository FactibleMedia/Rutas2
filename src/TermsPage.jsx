import React from "react";
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
import "./TermsPage.css";

/* =========================================================
   TermsPage component
   ========================================================= */
export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar
        activeSection="terminos"
        onSectionChange={() => {}}
      />

      <div className="terms-page">
        <div className="terms-page__paper-bg" />

        {/* Decorative illustrations */}
        <div className="terms-page__decor terms-page__decor--tl">
          <TopLeftGlyph />
        </div>
        <div className="terms-page__decor terms-page__decor--tr">
          <TopRightTicketWhisk />
        </div>
        <div className="terms-page__decor terms-page__decor--ml">
          <MiddleLeftMermaid />
        </div>
        <div className="terms-page__decor terms-page__decor--mr">
          <MiddleRightLightbulb />
        </div>
        <div className="terms-page__decor terms-page__decor--bl">
          <BottomLeftChurch />
        </div>
        <div className="terms-page__decor terms-page__decor--br">
          <BottomRightSwirl />
        </div>

        {/* Scrollable content */}
        <div className="terms-page__scroll">
          {/* Back button */}
          <button className="terms-page__back" onClick={() => navigate(-1)}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>

          {/* Header */}
          <div className="terms-page__header">
            <div className="terms-page__header-row">
              <span className="terms-page__tilde">~</span>
              <h1 className="terms-page__title">Términos y condiciones.</h1>
              <span className="terms-page__tilde">~</span>
            </div>
            <p className="terms-page__subtitle">
              Términos, condiciones de uso y política de tratamiento de datos
            </p>
          </div>

          {/* Body */}
          <div className="terms-page__body">
            <p>
              Bienvenido a la página web de Rutas de Valledupar. Al acceder, navegar, colaborar o interactuar en este sitio web, usted acepta de manera consciente, expresa e irrevocable los presentes Términos y Condiciones de Uso. Si no está de acuerdo con estas cláusulas, le solicitamos abstenerse de utilizar la plataforma y sus servicios.
            </p>

            <div>
              <h3 className="terms-page__section-title">1. Objeto de la Plataforma</h3>
              <p>
                La presente plataforma web es un proyecto de carácter cultural, educativo y transmedia cuyo objetivo es la recopilación, salvaguarda, difusión y visibilización del patrimonio inmaterial, léxico y tradicional de Valledupar y la región del Cesar. La plataforma permite la consulta de un glosario multimedia y la participación activa de los usuarios mediante el envío de palabras, definiciones, categorías y ejemplos de uso local.
              </p>
            </div>

            <div>
              <h3 className="terms-page__section-title">2. Condiciones de Participación y Contenido Generado por el Usuario (CGU)</h3>
              <p>
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
              <h3 className="terms-page__section-title">3. Propiedad Intelectual de la Plataforma</h3>
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
              <h3 className="terms-page__section-title">4. Política de Tratamiento de Datos Personales (Ley 1581 de 2012)</h3>
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
            <div className="terms-page__footer">
              <button className="terms-page__btn-back" onClick={() => navigate(-1)}>
                VOLVER
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
