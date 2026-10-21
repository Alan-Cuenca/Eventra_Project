/**
 * emailService.test.js
 * =============================================================
 * Pruebas unitarias para el servicio centralizado de correo (emailService.js)
 * =============================================================
 */

import { jest } from '@jest/globals';
import {
  escapeHtml,
  validateSmtpConfig,
  getMailTransporter,
  sendMail,
  buildWelcomeAdminEmail,
  sendWelcomeAdminEmail,
  sendInvitationEmail,
} from '../src/services/emailService.js';

describe('emailService — Servicio Centralizado de Correo', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('escapeHtml', () => {
    it('escapa caracteres especiales para prevenir inyecciones HTML', () => {
      const malicious = '<script>alert("xss & \'danger\'")</script>';
      const safe = escapeHtml(malicious);
      expect(safe).toBe('&lt;script&gt;alert(&quot;xss &amp; &#39;danger&#39;&quot;)&lt;/script&gt;');
    });

    it('retorna string vacío si el input es nulo o indefinido', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('validateSmtpConfig', () => {
    it('identifica variables faltantes cuando no están configuradas', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      const result = validateSmtpConfig();
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('SMTP_HOST');
      expect(result.missing).toContain('SMTP_USER');
      expect(result.missing).toContain('SMTP_PASS');
    });

    it('valida exitosamente cuando todas las variables obligatorias están presentes', () => {
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_USER = 'test@eventra.com';
      process.env.SMTP_PASS = 'app-password-123';

      const result = validateSmtpConfig();
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });
  });

  describe('getMailTransporter', () => {
    it('retorna el transportador personalizado si se provee uno', () => {
      const mockTransporter = { sendMail: jest.fn() };
      const transporter = getMailTransporter(mockTransporter);
      expect(transporter).toBe(mockTransporter);
    });

    it('crea un transportador simulado en modo test o EMAIL_SIMULATION_MODE=true', () => {
      process.env.EMAIL_SIMULATION_MODE = 'true';
      const transporter = getMailTransporter();
      expect(transporter).toBeDefined();
      expect(transporter.transporter.name).toBe('eventra-simulated-transport');
    });
  });

  describe('sendMail', () => {
    it('rechaza el envío si faltan parámetros obligatorios (to, subject o content)', async () => {
      const res1 = await sendMail({ to: '', subject: 'Test', text: 'Hola' });
      expect(res1.success).toBe(false);
      expect(res1.error).toMatch(/Parámetros obligatorios/i);

      const res2 = await sendMail({ to: 'admin@eventra.com', subject: '', text: 'Hola' });
      expect(res2.success).toBe(false);

      const res3 = await sendMail({ to: 'admin@eventra.com', subject: 'Test' });
      expect(res3.success).toBe(false);
    });

    it('envía correo exitosamente mediante transporte simulado', async () => {
      process.env.EMAIL_SIMULATION_MODE = 'true';
      const res = await sendMail({
        to: 'nuevo_admin@empresa.com',
        subject: 'Bienvenida EVENTRA',
        text: 'Cuerpo de prueba',
        html: '<p>Cuerpo de prueba</p>',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });

    it('captura fallos del transporte sin lanzar excepciones no controladas', async () => {
      const failingTransporter = {
        sendMail: jest.fn().mockRejectedValue(new Error('SMTP Connection Refused: 535 Auth Failed')),
      };

      const res = await sendMail({
        to: 'fallo@empresa.com',
        subject: 'Fallo simulado',
        text: 'Mensaje de prueba',
        transporter: failingTransporter,
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/SMTP Connection Refused/i);
    });
  });

  describe('buildWelcomeAdminEmail & sendWelcomeAdminEmail', () => {
    it('construye la plantilla con datos correctos y valores escapados', () => {
      const email = buildWelcomeAdminEmail({
        adminNombre: 'Carlos <Pérez>',
        empresaNombre: 'Salón "La Herradura" & Eventos',
        adminEmail: 'carlos@herradura.com',
        tempPassword: 'Pass#123<test>',
        loginUrl: 'https://eventra.app/login',
      });

      expect(email.subject).toContain('Salón "La Herradura" & Eventos');
      expect(email.text).toContain('Carlos <Pérez>');
      expect(email.text).toContain('carlos@herradura.com');
      expect(email.text).toContain('Pass#123<test>');
      // Verificación de sanitización en HTML
      expect(email.html).toContain('Carlos &lt;Pérez&gt;');
      expect(email.html).toContain('Salón &quot;La Herradura&quot; &amp; Eventos');
      expect(email.html).toContain('Pass#123&lt;test&gt;');
    });

    it('envía el correo de bienvenida utilizando sendWelcomeAdminEmail', async () => {
      process.env.EMAIL_SIMULATION_MODE = 'true';

      const res = await sendWelcomeAdminEmail({
        to: 'admin@nuevatenant.com',
        adminNombre: 'Laura Gómez',
        empresaNombre: 'Banquete Real',
        tempPassword: 'TempPassword2026!',
        loginUrl: 'http://localhost:5173/login',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });
  });

  describe('sendInvitationEmail', () => {
    it('envía la invitación con el enlace seguro', async () => {
      process.env.EMAIL_SIMULATION_MODE = 'true';

      const res = await sendInvitationEmail({
        to: 'colaborador@banquete.com',
        nombreEmpresa: 'Banquete Real',
        enlaceRegistro: 'http://localhost:5173/completar-registro?token=sampleToken123',
      });

      expect(res.success).toBe(true);
      expect(res.messageId).toBeDefined();
    });
  });
});
