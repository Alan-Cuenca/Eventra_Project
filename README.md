# 🎪 EVENTRA — Plataforma SaaS para Gestión Inteligente de Eventos y Recepciones

[![Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind%20%2B%20CSS%20Variables-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%20(Supabase)-336791?style=flat-square&logo=postgresql)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%201.5%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![Brevo](https://img.shields.io/badge/Email-Brevo%20HTTP%20API-0B996F?style=flat-square)](https://www.brevo.com/)

**EVENTRA** es una solución integral **Software as a Service (SaaS)** multi-inquilino de última generación diseñada para digitalizar, centralizar y optimizar la operación integral de empresas de organización de eventos, recepciones, bodas y banquetes.

La plataforma cubre el ciclo de vida completo: desde el descubrimiento público en la Landing Page comercial y contratación de planes B2B mediante transferencia bancaria y subida de comprobantes PDF, pasando por la gestión concurrente de salones, cotizaciones y actividades, hasta la atención automatizada de clientes mediante el asistente conversacional **EVARA AI (Google Gemini 1.5 Flash)** y un portal privado de autoservicio para el cliente final.

---

## 🌟 Capacidades y Módulos Principales

### 1. Sitio Web Público y Flujo de Contratación SaaS (`/`, `/funcionalidades`, `/evara-ai`, `/precios`)
* **Landing Page Multi-página:** Arquitectura comercial moderna en Light Mode que presenta la propuesta de valor, módulos operativos, integración de IA y planes de suscripción.
* **Flujo Interactivo de Planes y Pagos por Transferencia (`ModalPagoPlanTransferencia`):**
  * Selección de **Plan Básico (Boutique)** o **Plan Premium** (ciclo mensual o anual).
  * Despliegue de datos oficiales para transferencia bancaria directa (Alejandro Falcon, Cuenta: 2210101010, Cédula: 1850116508, Correo: mfalcon6508@uta.edu.ec) con botón para copiar en un clic.
  * **Zona de carga para comprobante PDF (`.pdf`):** Validación estricta de documentos y previsualización de archivo.
  * **Modal de Despacho de Credenciales:** Entrada del correo de la empresa interesada y confirmación inmediata en pantalla para la posterior entrega de credenciales.

### 2. Consola Global del Super Administrador (`/super-admin/*` — Rol 5: `Super_Admin`)
* **Gobernanza de Inquilinos:** Directorio integral de empresas clientes con búsqueda por nombre o RUC, suspensión temporal preventiva, reactivación y cambio de planes de suscripción.
* **Alta Transaccional de Empresas:** Creación atómica de inquilinos con autogeneración de `slug`, contraseña temporal encriptada para el Administrador inicial y despacho de correo de bienvenida.
* **Auditoría Financiera y Facturación Global:** Monitoreo de pagos y suscripciones de la plataforma con visor interactivo de comprobantes en **PDF** (`<iframe />`) e imágenes.
* **Métricas SaaS Globales:** Ingresos mensuales recurrentes (MRR), total de empresas activas, usuarios registrados y distribución de cuotas.

### 3. Marca Blanca (White-Label) y Theming Dinámico de Alto Impacto (`/configuracion-marca`)
* **5 Paletas Cromáticas Armónicas:**
  1. *Sofisticación Sutil (Oficial):* Crema Cálido (`#F3F0E4`) + Azul Pizarra (`#4D7182`) + Azul Marino (`#233D49`).
  2. *Bosque Olivo:* Verde Salvia Suave (`#E6EFE8`) + Verde Bosque Profundo (`#2E5A44`).
  3. *Terracota Real:* Arena Cálida (`#F5E6DF`) + Terracota Imperial (`#A84A32`).
  4. *Champagne Gala:* Champagne Dorado (`#F5EFE0`) + Bronce Dorado Real (`#8C6D32`).
  5. *Lavanda Imperial:* Bruma Lavanda (`#EDE8F5`) + Púrpura Imperial (`#5E4382`).
* **Transformación Visual Inmediata:** Inyección dinámica de variables CSS raíz (`--bg-main`, `--bg-surface`, `--primary`, `--text-primary`, `--border-subtle`) con sincronización en `localStorage`. Al cambiar de paleta, **el 100% de la interfaz** (Sidebar, Navbar, tarjetas, tablas, botones y badges) adapta su tonalidad en tiempo real.
* **Personalización Corporativa:** Subida de logo oficial de la empresa hacia Supabase Storage, configuración de eslogan y marca de agua en reportes.

### 4. Control de Cuotas y Límites SaaS por Plan (`PlanLimitAlert` y `planLimitsMiddleware`)
* Restricción inteligente de consumo según el plan contratado:
  * **Plan Básico:** Hasta 5 eventos activos, 20 clientes, 15 servicios en catálogo, 3 colaboradores y 50 mensajes mensuales del chatbot.
  * **Plan Premium:** Capacidad ilimitada en eventos, clientes, catálogo y equipo, con 1,500 mensajes de chatbot al mes.
* Monitoreo en tiempo real en `/mi-suscripcion` y advertencias visuales amigables con CTA directo a actualización de plan ante excesos de cuota.

### 5. Asistente Conversacional Inteligente: EVARA AI (`EvaraChatWidget`)
* Desarrollado con el SDK oficial `@google/genai` sobre **Google Gemini 1.5 Flash**.
* **Contexto Dinámico Multi-tenant:** El chatbot conoce en tiempo real los servicios, paquetes, precios y datos de contacto de la empresa organizadora, respondiendo dudas de clientes las 24 horas del día.
* Interfaz flotante con indicador de escritura, formato en markdown y control de cuota mensual por tenant.

### 6. Gestión Integral de Eventos y Recepciones (Roles 1, 2 y 3)
* **Control Concurrente de Salones y Reservas:** Prevención estricta en PostgreSQL de reservas dobles o colisiones de salón y fecha (`UNIQUE` + transacción).
* **Catálogo Dinámico:** Servicios individuales agrupados por categoría y paquetes preconfigurados con cálculo automático de costos.
* **Cotizador Interactivo:** Generación rápida de cotizaciones detalladas y conversión directa en reservas confirmadas.
* **Módulo Financiero y Pagos:** Registro de anticipos y liquidaciones finales con soporte de transferencias, comprobantes PDF/imagen y pasarela Deuna.
* **Gestor de Solicitudes de Cambio:** Sistema para que los clientes soliciten modificaciones (ej. incremento de invitados, adición de servicios) y la gerencia apruebe o rechace con notificación automática por correo.
* **Reportes Analíticos y Exportación a PDF:** Indicadores de rentabilidad, márgenes de ganancia y exportación de resúmenes con membrete corporativo personalizado.
* **Checklist Operativo para Trabajadores:** Visualización y actualización del estado de tareas y actividades asignadas en tiempo real.

### 7. Portal de Autoservicio para Clientes Finales (`/portal/:slug/registro` y `/portal-cliente` — Rol 4)
* Autoregistro público y seguro aislado por tenant mediante el `slug` de la empresa organizadora.
* Vista de seguimiento dedicada con desglose real de costos (`monto_total`, `anticipo_pagado`, `saldo_pendiente`), detalles del salón y canal directo para solicitar modificaciones.

---

## 🏗️ Arquitectura y Stack Tecnológico

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React 18 + Vite)                      │
│   Tailwind CSS  │  CSS Variables Theming  │  Lucide React  │  Axios    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST API / JWT
┌───────────────────────────────────▼────────────────────────────────────┐
│                       BACKEND (Node.js + Express)                      │
│   Controladores REST  │  RBAC (5 Roles)  │  Límites SaaS  │  Multer    │
└───────────────┬───────────────────┬───────────────────┬────────────────┘
                │                   │                   │
┌───────────────▼────────┐ ┌────────▼────────┐ ┌────────▼───────────────┐
│       POSTGRESQL       │ │    GOOGLE AI    │ │     EMAIL SERVICE      │
│  (Supabase Multi-tenant│ │ Gemini 1.5 Flash│ │  Brevo HTTP API v3     │
│   Isolation & Indexes) │ │ (EVARA Chatbot) │ │  SMTP (Nodemailer)     │
└────────────────────────┘ └─────────────────┘ └────────────────────────┘
```

### **Frontend**
* **Framework:** React 18 con Vite.
* **Estilos:** Híbrido entre clases utilitarias de Tailwind CSS v3 (sin preflight) y **Theming Reactivo por Variables CSS** en `:root`.
* **Enrutamiento:** React Router DOM v6 con arquitectura de guardias: `ProtectedRoute` (RBAC) y `SuperAdminRoute`.
* **Documentos e Imágenes:** `jspdf` y `html2canvas` para generación de reportes analíticos con membrete corporativo.

### **Backend**
* **Servidor:** Node.js con Express modularizado (Controladores, Rutas, Middlewares y Servicios).
* **Base de Datos:** PostgreSQL alojado en Supabase con restricciones de unicidad compuestas multi-tenant (`uq_clientes_empresa_email`), claves foráneas en cascada e índices dedicados por `empresa_id`.
* **Inteligencia Artificial:** SDK oficial `@google/genai` (Google Gemini 1.5 Flash).
* **Servicio de Correo Híbrido:** Prioridad 1 con **Brevo HTTP API v3** (elude bloqueos de puertos 587/465 en nubes serverless/PaaS como Render), con fallback a Resend API y Nodemailer SMTP.
* **Almacenamiento de Archivos:** Supabase Storage (gestión de logos y comprobantes mediante `multer`).

---

## 🎨 Sistema de Diseño: "Sofisticación Sutil"

Toda la plataforma sigue estrictamente las directrices del manual de diseño oficial:
* **Modo Visual:** *Light Mode* absoluto y consistente en todos los módulos.
* **Tipografía y Contraste:** Textos en Azul Marino Profundo (`#233D49`) sobre superficies crema y marfil de descanso visual.
* **Geometría y Sombras:** Bordes redondeados estandarizados (`10px` a `16px`) y sombras tenues de alta dispersión (`shadow-sm`, `shadow-md`).
* **Iconografía:** Estrictamente lineal y minimalista con Lucide Icons.

---

## 👥 Matriz de Roles y Accesos

| Rol | `rol_id` | Ámbito de Acceso | Vistas Principales |
| :--- | :---: | :--- | :--- |
| **Super Admin** | `5` | Plataforma Global SaaS | `/super-admin/dashboard`, `/super-admin/empresas`, `/super-admin/facturacion` |
| **Administrador** | `1` | Inquilino Completo | `/dashboard`, `/eventos`, `/colaboradores`, `/configuracion-marca`, `/mi-suscripcion`, `/reportes` |
| **Gerente** | `2` | Operativo y Supervisión | `/dashboard`, `/eventos`, `/cotizaciones`, `/reservas`, `/solicitudes`, `/reportes` |
| **Trabajador** | `3` | Ejecución de Campo | `/dashboard`, `/actividades` (Checklist), `/eventos` (Detalle) |
| **Cliente** | `4` | Portal de Autoservicio | `/portal-cliente`, `/portal-cliente/solicitudes`, `/pagos/procesar` |

---

## 🚀 Instalación y Puesta en Marcha Local

### Prerrequisitos
* Node.js v18 o superior.
* npm v9 o superior.
* Base de datos PostgreSQL (local o instancia de Supabase).

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Alan-Cuenca/Eventra_Project.git
cd Eventra_Project
```

### 2. Configurar y Levantar el Backend
```bash
cd backend
npm install
```

Crea el archivo `.env` en `backend/.env` tomando como referencia las variables esenciales:
```env
PORT=3000
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET=tu_jwt_secret_seguro_para_firmado
GEMINI_API_KEY=tu_google_gemini_api_key

# Notificaciones por Correo (Brevo HTTP API recomendado para evitar bloqueos)
BREVO_API_KEY=xkeysib-tu-api-key-de-brevo
EMAIL_FROM=notificaciones@tuempresa.com

# Almacenamiento Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_key
SUPABASE_BUCKET_NAME=eventra-storage
```

Ejecuta el servidor en modo desarrollo:
```bash
npm run dev
```

### 3. Configurar y Levantar el Frontend
En otra pestaña de la terminal:
```bash
cd frontend
npm install
```

Crea el archivo `.env` en `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

Ejecuta la interfaz con Vite:
```bash
npm run dev
```
La aplicación estará disponible en: `http://localhost:5173/`

---

## 🧪 Pruebas Automatizadas y Calidad de Código

### Pruebas Unitarias del Frontend
```bash
cd frontend
npm test
```
*Ejecuta 26 pruebas sobre la consola del Super Administrador, validaciones de seguridad de tenants y flujo de activación.*

### Compilación y Empaquetado para Producción
```bash
cd frontend
npm run build
```
*Valida que no existan errores de sintaxis, imports rotos o discrepancias de empaquetado en Vite.*

---

## 👨‍💻 Equipo de Desarrollo (Metodología Scrum)

Proyecto desarrollado bajo el marco ágil Scrum con sprints de 2 semanas:
* **Alejandro Falcón:** Product Owner / Líder de Proyecto.
* **Alan Puruncajas:** Backend Developer, DBA y UX/UI Lead.
* **Jorge Sailema:** Frontend Developer y Arquitectura de Servicios.
* **Juan Pablo Vayas:** Frontend Developer, QA y Documentación Técnica.

---

*© 2026 EVENTRA SaaS — Todos los derechos reservados.*
