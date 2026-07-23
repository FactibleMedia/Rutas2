-- ============================================================
-- SCRIPT SQL - CONFIGURACIÓN DE NOTIFICACIONES Y EMAIL
-- ============================================================
-- Agrega configuraciones para Resend (email), notificaciones
-- del glosario, y plantillas de correo HTML editables.
-- Ejecuta en el SQL Editor de Supabase.
-- ============================================================

-- ============================================================
-- 1. CONFIGURACIÓN DE RESEND (EMAIL)
-- ============================================================
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES
  ('resend_api_key', '', 'API Key de Resend para envío de correos', 'texto'),
  ('resend_from_email', 'notificaciones@rutasvallenatas.co', 'Correo remitente para notificaciones', 'texto'),
  ('resend_from_name', 'Rutas Vallenatas', 'Nombre del remitente', 'texto')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- 2. NOTIFICACIONES DEL GLOSARIO (TOGGLES)
-- ============================================================
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES
  ('notif_nueva_palabra', 'true', 'Notificar cuando un usuario sugiera una nueva palabra en el glosario', 'booleano'),
  ('notif_palabra_aceptada', 'true', 'Notificar al usuario cuando su palabra sugerida sea aceptada', 'booleano'),
  ('notif_palabra_rechazada', 'true', 'Notificar al usuario cuando su palabra sugerida sea rechazada', 'booleano')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- 3. NOTIFICACIONES DE RUTAS Y GALERÍA
-- ============================================================
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES
  ('notif_nueva_ruta', 'true', 'Notificar cuando un usuario sugiera una nueva ruta o ubicación', 'booleano'),
  ('notif_ruta_aceptada', 'true', 'Notificar al usuario cuando su ruta sugerida sea aceptada', 'booleano'),
  ('notif_ruta_rechazada', 'true', 'Notificar al usuario cuando su ruta sugerida sea rechazada', 'booleano'),
  ('notif_nueva_galeria', 'true', 'Notificar cuando un usuario sugiera contenido multimedia', 'booleano'),
  ('notif_galeria_aceptada', 'true', 'Notificar al usuario cuando su contenido multimedia sea aceptado', 'booleano'),
  ('notif_galeria_rechazada', 'true', 'Notificar al usuario cuando su contenido multimedia sea rechazado', 'booleano')
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- 4. PLANTILLAS DE CORREO HTML (EDITABLES)
-- ============================================================

-- 4a. Plantilla: Notificación de nueva palabra sugerida (para admin)
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'template_nueva_palabra',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fef9ea;font-family:Inter, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#2d4225,#45603a);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#fffce6;font-family:Epilogue,Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;">📖 Nueva Palabra Sugerida</h1>
              <p style="margin:8px 0 0;color:rgba(255,252,230,0.7);font-size:14px;">Glosario Vallenato · Rutas Vallenatas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#1e1b14;font-size:15px;line-height:1.6;">Hola <strong style="color:#9d3d1c;">{{admin_name}}</strong>,</p>
              <p style="margin:0 0 24px;color:#1e1b14;font-size:15px;line-height:1.6;">El usuario <strong style="color:#9d3d1c;">{{usuario_nombre}}</strong> ha sugerido una nueva palabra para el glosario:</p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efdf;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="font-size:13px;color:#6b554d;padding-bottom:8px;">Palabra</td>
                </tr>
                <tr>
                  <td style="font-size:22px;font-weight:700;color:#2d4225;padding-bottom:16px;font-family:Epilogue,Georgia,serif;">{{palabra}}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6b554d;padding-bottom:8px;">Significado</td>
                </tr>
                <tr>
                  <td style="font-size:15px;color:#1e1b14;line-height:1.6;">{{significado}}</td>
                </tr>
                <tr>
                  <td style="font-size:13px;color:#6b554d;padding-top:16px;padding-bottom:8px;">Categoría</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#9d3d1c;font-weight:600;">{{categoria}}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{panel_url}}" style="display:inline-block;background:linear-gradient(135deg,#9d3d1c,#bd5532);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.02em;">Revisar en el Panel</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;border-top:1px solid #d6c0b6;text-align:center;">
              <p style="margin:0;color:#8a726b;font-size:12px;">Rutas Vallenatas · Portal Cultural de Valledupar</p>
              <p style="margin:4px 0 0;color:#8a726b;font-size:11px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Plantilla de correo: nueva palabra sugerida en el glosario',
  'texto'
)
ON CONFLICT (clave) DO NOTHING;

-- 4b. Plantilla: Palabra aceptada (para el usuario)
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'template_palabra_aceptada',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fef9ea;font-family:Inter, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#3a4f31,#6b8f5e);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#fffce6;font-family:Epilogue,Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;">✅ Palabra Aceptada</h1>
              <p style="margin:8px 0 0;color:rgba(255,252,230,0.7);font-size:14px;">Glosario Vallenato · Rutas Vallenatas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#1e1b14;font-size:15px;line-height:1.6;">Hola <strong style="color:#9d3d1c;">{{usuario_nombre}}</strong>,</p>
              <p style="margin:0 0 24px;color:#1e1b14;font-size:15px;line-height:1.6;">¡Tu sugerencia ha sido <strong style="color:#3a4f31;">aceptada</strong> y ahora forma parte del Glosario Vallenato!</p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#d5e8c7;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="font-size:24px;font-weight:700;color:#2d4225;font-family:Epilogue,Georgia,serif;padding-bottom:8px;">{{palabra}}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#1e1b14;line-height:1.6;">{{significado}}</td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#6b554d;font-size:14px;line-height:1.6;">Gracias por contribuir a preservar y difundir la cultura vallenata. ¡Tu aporte es valioso para nuestra comunidad!</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{sitio_url}}/glosario" style="display:inline-block;background:linear-gradient(135deg,#3a4f31,#6b8f5e);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.02em;">Ver en el Glosario</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;border-top:1px solid #d6c0b6;text-align:center;">
              <p style="margin:0;color:#8a726b;font-size:12px;">Rutas Vallenatas · Portal Cultural de Valledupar</p>
              <p style="margin:4px 0 0;color:#8a726b;font-size:11px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Plantilla de correo: palabra sugerida aceptada (para el usuario)',
  'texto'
)
ON CONFLICT (clave) DO NOTHING;

-- 4c. Plantilla: Palabra rechazada (para el usuario)
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'template_palabra_rechazada',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fef9ea;font-family:Inter, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#8a3a3a,#ba4a4a);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#fffce6;font-family:Epilogue,Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;">📝 Sugerencia Recibida</h1>
              <p style="margin:8px 0 0;color:rgba(255,252,230,0.7);font-size:14px;">Glosario Vallenato · Rutas Vallenatas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#1e1b14;font-size:15px;line-height:1.6;">Hola <strong style="color:#9d3d1c;">{{usuario_nombre}}</strong>,</p>
              <p style="margin:0 0 12px;color:#1e1b14;font-size:15px;line-height:1.6;">Gracias por tu sugerencia. Hemos revisado la palabra <strong>{{palabra}}</strong> y, aunque no podrá ser incluida en el glosario en esta ocasión, valoramos mucho tu interés en contribuir.</p>
              {{#if motivo}}
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffdad6;border-radius:12px;padding:16px;margin-bottom:24px;">
                <tr>
                  <td style="font-size:13px;color:#93000a;line-height:1.6;"><strong>Motivo:</strong> {{motivo}}</td>
                </tr>
              </table>
              {{/if}}
              <p style="margin:0 0 24px;color:#6b554d;font-size:14px;line-height:1.6;">Te invitamos a seguir participando y enviando nuevas sugerencias. ¡Cada aporte nos ayuda a enriquecer nuestro patrimonio cultural!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;border-top:1px solid #d6c0b6;text-align:center;">
              <p style="margin:0;color:#8a726b;font-size:12px;">Rutas Vallenatas · Portal Cultural de Valledupar</p>
              <p style="margin:4px 0 0;color:#8a726b;font-size:11px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Plantilla de correo: palabra sugerida rechazada (para el usuario)',
  'texto'
)
ON CONFLICT (clave) DO NOTHING;

-- 4d. Plantilla: Nueva ruta/ubicación sugerida (para admin)
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'template_nueva_ruta',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fef9ea;font-family:Inter, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#805600,#febe54);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#fffce6;font-family:Epilogue,Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;">🗺️ Nueva Ruta Sugerida</h1>
              <p style="margin:8px 0 0;color:rgba(255,252,230,0.7);font-size:14px;">Rutas Vallenatas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#1e1b14;font-size:15px;line-height:1.6;">Hola <strong style="color:#9d3d1c;">{{admin_name}}</strong>,</p>
              <p style="margin:0 0 24px;color:#1e1b14;font-size:15px;line-height:1.6;">El usuario <strong style="color:#9d3d1c;">{{usuario_nombre}}</strong> ha sugerido una nueva ubicación:</p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efdf;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="font-size:20px;font-weight:700;color:#805600;padding-bottom:8px;font-family:Epilogue,Georgia,serif;">{{titulo}}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#1e1b14;line-height:1.6;">{{descripcion}}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{panel_url}}" style="display:inline-block;background:linear-gradient(135deg,#9d3d1c,#bd5532);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.02em;">Revisar en el Panel</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;border-top:1px solid #d6c0b6;text-align:center;">
              <p style="margin:0;color:#8a726b;font-size:12px;">Rutas Vallenatas · Portal Cultural de Valledupar</p>
              <p style="margin:4px 0 0;color:#8a726b;font-size:11px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Plantilla de correo: nueva ruta/ubicación sugerida',
  'texto'
)
ON CONFLICT (clave) DO NOTHING;

-- 4e. Plantilla: Nueva galería sugerida (para admin)
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'template_nueva_galeria',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#fef9ea;font-family:Inter, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef9ea;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg,#9d3d1c,#bd5532);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;color:#fffce6;font-family:Epilogue,Georgia,serif;font-size:22px;font-weight:700;letter-spacing:-0.02em;">🖼️ Nuevo Contenido Multimedia</h1>
              <p style="margin:8px 0 0;color:rgba(255,252,230,0.7);font-size:14px;">Galería · Rutas Vallenatas</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 24px;">
              <p style="margin:0 0 16px;color:#1e1b14;font-size:15px;line-height:1.6;">Hola <strong style="color:#9d3d1c;">{{admin_name}}</strong>,</p>
              <p style="margin:0 0 24px;color:#1e1b14;font-size:15px;line-height:1.6;">El usuario <strong style="color:#9d3d1c;">{{usuario_nombre}}</strong> ha sugerido nuevo contenido multimedia:</p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5efdf;border-radius:12px;padding:20px;margin-bottom:24px;">
                <tr>
                  <td style="font-size:20px;font-weight:700;color:#9d3d1c;padding-bottom:8px;font-family:Epilogue,Georgia,serif;">{{titulo}}</td>
                </tr>
                <tr>
                  <td style="font-size:14px;color:#1e1b14;line-height:1.6;">{{descripcion}}</td>
                </tr>
                <tr>
                  <td style="font-size:12px;color:#6b554d;padding-top:12px;">Tipo: {{tipo_multimedia}} · Sitio: {{tipo_sitio}}</td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="{{panel_url}}" style="display:inline-block;background:linear-gradient(135deg,#9d3d1c,#bd5532);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:600;letter-spacing:0.02em;">Revisar en el Panel</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;border-top:1px solid #d6c0b6;text-align:center;">
              <p style="margin:0;color:#8a726b;font-size:12px;">Rutas Vallenatas · Portal Cultural de Valledupar</p>
              <p style="margin:4px 0 0;color:#8a726b;font-size:11px;">Este es un mensaje automático, por favor no respondas a este correo.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Plantilla de correo: nuevo contenido multimedia sugerido',
  'texto'
)
ON CONFLICT (clave) DO NOTHING;
