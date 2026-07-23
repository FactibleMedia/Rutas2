-- ============================================================
-- SCRIPT SQL - CORREO DE BIENVENIDA Y NOTIFICACIÓN
-- ============================================================
-- Agrega la plantilla HTML de bienvenida y el toggle de
-- activación/desactivación para el correo que se envía
-- cuando un nuevo usuario se registra en la plataforma.
--
-- Ejecuta DESPUÉS de supabase_schema.sql
-- ============================================================

-- ============================================================
-- 1. INSERTAR CONFIGURACIONES EN admin_config
-- ============================================================

-- Toggle: habilitar/deshabilitar el correo de bienvenida
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'notif_bienvenida',
  'true',
  'Enviar correo de bienvenida al registrarse un nuevo usuario',
  'booleano'
)
ON CONFLICT (clave) DO NOTHING;

-- Plantilla HTML del correo de bienvenida
INSERT INTO admin_config (clave, valor, descripcion, tipo)
VALUES (
  'template_bienvenida',
  '<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Rutas de Valledupar</title>
</head>
<body style="margin:0;padding:0;background-color:#faf9f4;font-family:Outfit,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf9f4;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER: Dark bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0f08 0%,#2d1a10 100%);border-radius:16px 16px 0 0;padding:32px 24px 24px;text-align:center;">
              <h1 style="margin:0;font-family:''Bebas Neue'',Georgia,serif;font-size:32px;font-weight:400;letter-spacing:0.08em;color:#fffce6;text-transform:uppercase;">
                ¡Bienvenido a<br />
                <span style="color:#e8971b;">Rutas de Valledupar</span>!
              </h1>
            </td>
          </tr>

          <!-- BODY: Cream card -->
          <tr>
            <td style="background:#ffffff;border-left:1px solid #e8e2cd;border-right:1px solid #e8e2cd;padding:32px 28px;">

              <!-- Saludo -->
              <p style="margin:0 0 20px;font-size:18px;font-weight:600;color:#3c200c;">
                Hola, {{usuario_nombre}} 👋
              </p>

              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6b4a2e;">
                Gracias por registrarte en <strong style="color:#3c200c;">Rutas de Valledupar</strong>,
                un espacio dedicado a preservar y celebrar el patrimonio cultural, las tradiciones
                y el lenguaje de nuestra tierra.
              </p>

              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#6b4a2e;">
                A partir de ahora puedes participar activamente: sugerir palabras para nuestro
                glosario vallenato, explorar las rutas culturales, comentar y compartir tus
                conocimientos sobre la tradición valduparense.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef3c7;border:1px solid #d97706;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px;">
                    <h3 style="margin:0 0 12px;font-family:''Bebas Neue'',Georgia,serif;font-size:18px;font-weight:400;letter-spacing:0.06em;color:#92400e;text-transform:uppercase;">
                      🔑 Tus Credenciales
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#6b4a2e;width:80px;font-weight:600;">
                          Email:
                        </td>
                        <td style="padding:6px 0;font-size:14px;color:#3c200c;font-family:monospace;font-weight:700;">
                          {{usuario_email}}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:14px;color:#6b4a2e;width:80px;font-weight:600;">
                          Contraseña:
                        </td>
                        <td style="padding:6px 0;font-size:14px;color:#3c200c;font-family:monospace;font-weight:700;">
                          {{usuario_password}}
                        </td>
                      </tr>
                    </table>
                    <p style="margin:12px 0 0;font-size:12px;color:#92400e;line-height:1.4;">
                      ⚠️ Te recomendamos guardar estos datos en un lugar seguro.
                      No compartas tu contraseña con nadie.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="{{sitio_url}}"
                       style="display:inline-block;padding:14px 32px;background:#d97706;color:#ffffff;text-decoration:none;border-radius:10px;font-family:''Bebas Neue'',Georgia,serif;font-size:18px;letter-spacing:0.08em;text-transform:uppercase;">
                      Explorar la plataforma
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;line-height:1.5;color:#6b4a2e;">
                Si tienes alguna duda o sugerencia, no dudes en escribirnos.
                ¡Estamos felices de tenerte en la comunidad!
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0f08 0%,#2d1a10 100%);border-radius:0 0 16px 16px;padding:20px 24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,252,230,0.6);line-height:1.5;">
                Rutas de Valledupar &bull; Preservando nuestra cultura
                <br />
                Este es un mensaje automático, por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'Plantilla HTML del correo de bienvenida para nuevos usuarios',
  'texto'
)
ON CONFLICT (clave) DO NOTHING;

-- ============================================================
-- 2. VERIFICACIÓN
-- ============================================================
-- Para confirmar que se insertaron correctamente:
-- SELECT clave, valor, tipo FROM admin_config WHERE clave LIKE '%bienvenida%';
