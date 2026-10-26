/**
 * emailService.js
 * =============================================================================
 * Servicio centralizado para el envío de correos electrónicos en EVENTRA SaaS.
 * 
 * Características:
 *  - Configuración vía variables de entorno (Gmail SMTP / STARTTLS en puerto 587).
 *  - Soporte de modo de simulación (EMAIL_SIMULATION_MODE=true) para entornos
 *    locales y tests automatizados sin conexiones externas.
 *  - Sanitización y escape de variables dinámicas en plantillas HTML.
 *  - Registro de errores seguro (sin credenciales, tokens ni contraseñas en logs).
 *  - Inyección de transportes para pruebas unitarias.
 * =============================================================================
 */

import nodemailer from 'nodemailer';

/**
 * Escapa caracteres HTML especiales para prevenir inyecciones en plantillas de correo.
 * @param {string} str 
 * @returns {string}
 */
export const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Valida la configuración SMTP requerida cuando no se encuentra en modo simulación.
 * @returns {{ valid: boolean, missing: string[] }}
 */
export const validateSmtpConfig = () => {
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!process.env.SMTP_USER) missing.push('SMTP_USER');
  if (!process.env.SMTP_PASS) missing.push('SMTP_PASS');
  return {
    valid: missing.length === 0,
    missing,
  };
};

/**
 * Crea o retorna el transportador de correo según las variables de entorno.
 * @param {object} [customTransporter=null] - Permite inyectar un transportador simulado en tests.
 * @returns {import('nodemailer').Transporter}
 */
export const getMailTransporter = (customTransporter = null) => {
  if (customTransporter) {
    return customTransporter;
  }

  const isSimulation = process.env.EMAIL_SIMULATION_MODE === 'true' || process.env.NODE_ENV === 'test';

  if (isSimulation) {
    // Transporte simulado que almacena o descarta el correo sin contactar servidores externos
    return nodemailer.createTransport({
      name: 'eventra-simulated-transport',
      version: '1.0.0',
      send: (mail, callback) => {
        const envelope = mail.message.getEnvelope();
        const messageId = mail.message.getHeader('message-id') || `<sim-${Date.now()}@eventra.local>`;
        callback(null, {
          messageId,
          envelope,
          response: '250 Simulated message queued for delivery',
          accepted: [envelope.to],
          rejected: [],
          pending: [],
        });
      },
    });
  }

  // Validación estricta en producción / envío real
  const validation = validateSmtpConfig();
  if (!validation.valid) {
    throw new Error(`[emailService] Variables SMTP obligatorias no configuradas: ${validation.missing.join(', ')}`);
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const isGmail = host === 'smtp.gmail.com' || host === 'gmail';

  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000, // 10s max para establecer conexión TCP
      greetingTimeout: 7000,    // 7s max para saludo SMTP
      socketTimeout: 15000,     // 15s max de socket inactivo
    });
  }

  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const isSecure = process.env.SMTP_SECURE === 'true';

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
    connectionTimeout: 10000,
    greetingTimeout: 7000,
    socketTimeout: 15000,
  });
};

/**
 * Envía un correo electrónico genérico.
 * @param {object} options
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.text - Cuerpo en texto plano
 * @param {string} options.html - Cuerpo en HTML
 * @param {object} [options.transporter] - Transportador opcional para pruebas
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export const sendMail = async ({ to, subject, text, html, transporter = null }) => {
  if (!to || !subject || (!text && !html)) {
    return {
      success: false,
      error: 'Parámetros obligatorios faltantes para el envío de correo (to, subject, text/html).',
    };
  }

  const normalizedTo = to.trim().toLowerCase();

  // 1. Si se pasa un transportador simulado (ej. tests unitarios), usarlo directamente
  if (transporter) {
    try {
      const fromAddress = process.env.SMTP_FROM || `"EVENTRA" <${process.env.SMTP_USER || 'no-reply@eventra.com'}>`;
      const info = await transporter.sendMail({
        from: fromAddress,
        to: normalizedTo,
        subject,
        text,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('[emailService] Error al enviar correo:', {
        destinatario: normalizedTo,
        asunto: subject,
        codigoError: error.code || 'UNKNOWN',
        mensaje: error.message,
      });
      return { success: false, error: error.message || 'Error al enviar correo' };
    }
  }

  // 2. Modo Simulación
  const isSimulation = process.env.EMAIL_SIMULATION_MODE === 'true';
  if (isSimulation) {
    const activeTransporter = getMailTransporter();
    const fromAddress = process.env.SMTP_FROM || `"EVENTRA" <${process.env.SMTP_USER || 'no-reply@eventra.com'}>`;
    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to: normalizedTo,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  }

  // 3. Envío HTTP API vía Brevo (HTTPS puerto 443 — Envía a CUALQUIER dominio: Gmail, Hotmail, Outlook)
  if (process.env.BREVO_API_KEY && process.env.BREVO_API_KEY.trim()) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'mateotkd123@gmail.com';
      const senderName = process.env.BREVO_SENDER_NAME || 'EVENTRA SaaS';
      const rawApiKey = process.env.BREVO_API_KEY.trim();
      const apiKey = rawApiKey.startsWith('xkeysib-') ? rawApiKey : `xkeysib-${rawApiKey}`;
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: normalizedTo }],
          subject,
          textContent: text,
          htmlContent: html,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || `Error HTTP ${resp.status} de Brevo: ${JSON.stringify(data)}`);
      }

      return {
        success: true,
        messageId: data.messageId,
      };
    } catch (brevoError) {
      console.error('[emailService] Error con Brevo HTTP API:', brevoError.message);
      return {
        success: false,
        error: brevoError.message,
      };
    }
  }

  // 4. Envío HTTP API vía Resend (HTTPS puerto 443)
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'EVENTRA <onboarding@resend.dev>';
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [normalizedTo],
          subject,
          text,
          html,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || `Error HTTP ${resp.status} de Resend: ${JSON.stringify(data)}`);
      }

      return {
        success: true,
        messageId: data.id,
      };
    } catch (resendError) {
      console.error('[emailService] Error con Resend HTTP API:', resendError.message);
      return {
        success: false,
        error: resendError.message,
      };
    }
  }

  // 5. Fallback a Nodemailer SMTP (entorno local o Render de pago)
  try {
    const activeTransporter = getMailTransporter();
    const fromAddress = process.env.SMTP_FROM || `"EVENTRA" <${process.env.SMTP_USER || 'no-reply@eventra.com'}>`;

    const info = await activeTransporter.sendMail({
      from: fromAddress,
      to: normalizedTo,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[emailService] Error al enviar correo:', {
      destinatario: normalizedTo,
      asunto: subject,
      codigoError: error.code || 'UNKNOWN',
      mensaje: error.message,
    });

    return {
      success: false,
      error: error.message || 'Error desconocido al enviar correo.',
    };
  }
};

/**
 * Construye la plantilla HTML y de texto para la bienvenida del Administrador Inicial.
 * @param {object} params
 * @param {string} params.adminNombre
 * @param {string} params.empresaNombre
 * @param {string} params.adminEmail
 * @param {string} [params.tempPassword]
 * @param {string} [params.loginUrl]
 * @param {string} [params.activationUrl]
 * @returns {{ subject: string, text: string, html: string }}
 */
export const buildWelcomeAdminEmail = ({
  adminNombre,
  empresaNombre,
  adminEmail,
  tempPassword,
  loginUrl,
  activationUrl,
}) => {
  const safeAdmin = escapeHtml(adminNombre);
  const safeEmpresa = escapeHtml(empresaNombre);
  const safeEmail = escapeHtml(adminEmail);
  const safeLoginUrl = escapeHtml(loginUrl || 'http://localhost:5173/login');
  const safeActivationUrl = activationUrl ? escapeHtml(activationUrl) : null;
  const safeTempPass = tempPassword ? escapeHtml(tempPassword) : null;

  const subject = `Bienvenido a EVENTRA — Activación de cuenta para ${empresaNombre}`;

  const textLines = [
    `Hola ${adminNombre},`,
    '',
    `Tu empresa "${empresaNombre}" ha sido registrada exitosamente en EVENTRA SaaS.`,
    `Has sido designado como el Administrador Inicial de la plataforma.`,
    '',
    `Datos de acceso:`,
    `- Correo electrónico: ${adminEmail}`,
  ];

  if (safeTempPass) {
    textLines.push(`- Contraseña temporal: ${tempPassword}`);
    textLines.push(`(Por tu seguridad, deberás cambiarla obligatoriamente en tu primer inicio de sesión).`);
  }

  if (safeActivationUrl) {
    textLines.push(`- Enlace de activación: ${activationUrl}`);
  } else {
    textLines.push(`- Enlace de acceso: ${loginUrl || 'http://localhost:5173/login'}`);
  }

  textLines.push('');
  textLines.push('Atentamente,');
  textLines.push('El equipo de EVENTRA');

  const text = textLines.join('\n');

  // Plantilla HTML alineada a la identidad "Sofisticación Sutil"
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F0E4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #233D49;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F0E4; padding: 40px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 14px; box-shadow: 0 4px 20px rgba(35, 61, 73, 0.08); overflow: hidden; border: 1px solid #ECE7D5;">
              <!-- Encabezado -->
              <tr>
                <td style="padding: 32px 32px 24px; text-align: center; background-color: #FFFFFF; border-bottom: 1px solid #F3F0E4;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #233D49; letter-spacing: 1.5px;">EVENTRA</h1>
                  <p style="margin: 6px 0 0; font-size: 13px; color: #4D7182; text-transform: uppercase; letter-spacing: 1px;">Gestión Integral de Eventos & Recepciones</p>
                </td>
              </tr>

              <!-- Cuerpo Principal -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #233D49;">¡Bienvenido/a, ${safeAdmin}!</h2>
                  <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4D7182;">
                    Nos complace informarte que la empresa <strong>${safeEmpresa}</strong> ha sido dada de alta exitosamente en la plataforma EVENTRA SaaS. Se te ha asignado el rol de <strong>Administrador Inicial</strong>.
                  </p>

                  <!-- Caja de Credenciales -->
                  <div style="background-color: #F9F8F5; border: 1px solid #ECE7D5; border-radius: 10px; padding: 20px; margin: 24px 0;">
                    <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #233D49;">Tus Credenciales de Acceso</h3>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #4D7182;">
                      <strong>Usuario / Correo:</strong> <span style="color: #233D49; font-family: monospace;">${safeEmail}</span>
                    </p>
                    ${safeTempPass ? `
                    <p style="margin: 0 0 8px; font-size: 14px; color: #4D7182;">
                      <strong>Contraseña temporal:</strong> <code style="background-color: #FFFFFF; padding: 4px 8px; border-radius: 6px; border: 1px solid #CEC8B8; color: #233D49; font-weight: 600; font-size: 15px;">${safeTempPass}</code>
                    </p>
                    <p style="margin: 10px 0 0; font-size: 12px; color: #C49A3A; font-weight: 500;">
                      ⚠ Por seguridad, se te solicitará cambiar tu contraseña obligatoriamente en tu primer inicio de sesión.
                    </p>` : ''}
                  </div>

                  <!-- Botón CTA -->
                  <div style="text-align: center; margin: 32px 0 24px;">
                    <a href="${safeActivationUrl || safeLoginUrl}" 
                       target="_blank" 
                       style="background-color: #4D7182; color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 2px 8px rgba(77, 113, 130, 0.25);">
                      ${safeActivationUrl ? 'Activar Cuenta y Establecer Contraseña' : 'Iniciar Sesión en EVENTRA'}
                    </a>
                  </div>

                  <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.5; color: #8A98A0;">
                    Si tienes inconvenientes con el botón, copia y pega el siguiente enlace en tu navegador:<br>
                    <a href="${safeActivationUrl || safeLoginUrl}" style="color: #4D7182; word-break: break-all;">${safeActivationUrl || safeLoginUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Pie de página -->
              <tr>
                <td style="padding: 20px 32px; background-color: #F9F8F5; border-top: 1px solid #ECE7D5; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #8A98A0;">
                    Este es un correo automático generado por EVENTRA SaaS. Si no reconoces esta cuenta, puedes desestimar este mensaje de forma segura.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return { subject, text, html };
};

/**
 * Envía el correo de bienvenida al Administrador Inicial de un nuevo inquilino (Tenant).
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.adminNombre
 * @param {string} params.empresaNombre
 * @param {string} [params.tempPassword]
 * @param {string} [params.loginUrl]
 * @param {string} [params.activationUrl]
 * @param {object} [params.transporter]
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export const sendWelcomeAdminEmail = async ({
  to,
  adminNombre,
  empresaNombre,
  tempPassword,
  loginUrl,
  activationUrl,
  transporter = null,
}) => {
  const { subject, text, html } = buildWelcomeAdminEmail({
    adminNombre,
    empresaNombre,
    adminEmail: to,
    tempPassword,
    loginUrl,
    activationUrl,
  });

  return sendMail({
    to,
    subject,
    text,
    html,
    transporter,
  });
};

/**
 * Envía una invitación para completar registro a un colaborador.
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.nombreEmpresa
 * @param {string} params.enlaceRegistro
 * @param {object} [params.transporter]
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
export const sendInvitationEmail = async ({
  to,
  nombreEmpresa,
  enlaceRegistro,
  transporter = null,
}) => {
  const safeEmpresa = escapeHtml(nombreEmpresa);
  const safeEnlace = escapeHtml(enlaceRegistro);

  const subject = `Invitación para unirte al equipo de ${nombreEmpresa} en EVENTRA`;
  const text = `Hola,\n\nHas sido invitado a formar parte del equipo de ${nombreEmpresa} en EVENTRA.\n\nPara activar tu cuenta y configurar tu contraseña, ingresa al siguiente enlace (válido por 48 horas):\n${enlaceRegistro}\n\nSi no esperabas este correo, puedes ignorarlo con total seguridad.`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F3F0E4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #233D49;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F3F0E4; padding: 40px 15px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 580px; background-color: #FFFFFF; border-radius: 14px; box-shadow: 0 4px 20px rgba(35, 61, 73, 0.08); overflow: hidden; border: 1px solid #ECE7D5;">
              <tr>
                <td style="padding: 32px 32px 24px; text-align: center; background-color: #FFFFFF; border-bottom: 1px solid #F3F0E4;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #233D49; letter-spacing: 1.5px;">EVENTRA</h1>
                  <p style="margin: 6px 0 0; font-size: 13px; color: #4D7182; text-transform: uppercase; letter-spacing: 1px;">Gestión Integral de Eventos & Recepciones</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 32px;">
                  <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #233D49;">¡Hola! Has sido invitado a unirte</h2>
                  <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #4D7182;">
                    El administrador de <strong>${safeEmpresa}</strong> te ha invitado a formar parte de su equipo operativo en EVENTRA.
                  </p>
                  <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #233D49;">
                    Para completar tu registro, configurar tu contraseña y acceder al sistema, haz clic en el siguiente botón:
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${safeEnlace}"
                       style="background-color: #4D7182; color: #FFFFFF; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                      Completar mi Registro
                    </a>
                  </div>
                  <p style="font-size: 12px; color: #8A98A0; line-height: 1.5; margin-top: 25px;">
                    * Este enlace es seguro y expirará en <strong>48 horas</strong>.<br/>
                    Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
                    <a href="${safeEnlace}" style="color: #4D7182; word-break: break-all;">${safeEnlace}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 32px; background-color: #F9F8F5; border-top: 1px solid #ECE7D5; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #8A98A0;">
                    Este es un correo automático generado por EVENTRA SaaS.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  return sendMail({
    to,
    subject,
    text,
    html,
    transporter,
  });
};
