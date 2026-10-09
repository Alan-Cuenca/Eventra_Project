# 🎪 EVENTRA - Gestión Inteligente de Eventos

EVENTRA es una plataforma web integral construida bajo el modelo Software as a Service (SaaS), diseñada específicamente para empresas de organización de eventos y recepciones. El sistema automatiza y optimiza la gestión de clientes, cotizaciones, reservas, catálogos de servicios y pagos.

Actualmente, el proyecto integra como demostrador el **portal público comercial de Helados La Catedral**, una marca emblemática de la ciudad de Ambato con más de 35 años de tradición, unida perfectamente al entorno SaaS de gestión.

---

## 🚀 Características Principales

*   **Portal Público (Landing Page):** Experiencia inmersiva que comunica la identidad y valores de marca con navegación fluida, animaciones nativas y un diseño moderno anclado en la elegancia.
*   **Gestor de Reservas y Eventos:** Control concurrente de salones y actividades en base de datos para prevenir colisiones de fechas de forma estricta.
*   **CRM y Control de Accesos:** Gestión de roles estricta (Administrador, Gerente, Trabajador, Cliente) para administrar flujos, perfiles y seguimientos privados.
*   **Catálogo Dinámico:** Módulo estructurado para agrupar servicios, proveedores y armar paquetes listos para cotizaciones inmediatas.
*   **Módulo Financiero:** Generación de cotizaciones interactivas y procesamiento de pagos (integración de comprobantes y estado de saldos).

---

## 🛠️ Arquitectura y Stack Tecnológico

El proyecto está diseñado bajo una arquitectura RESTful, separando de forma clara las responsabilidades de la interfaz de usuario (Cliente) y la lógica de negocio (Servidor).

### **Frontend**
*   **Librería Core:** React 18
*   **Build Tool:** Vite
*   **Estilos:** Híbrido entre clases CSS Nativas y **Tailwind CSS** (v3, configurado sin preflight para asegurar la convivencia de ambos ecosistemas).
*   **Enrutamiento:** React Router v6 (Protección de rutas privadas y segmentación por roles).
*   **Iconografía:** Lucide React.

### **Backend**
*   **Entorno de Ejecución:** Node.js con Express.
*   **Base de Datos:** PostgreSQL alojado en Supabase (implementación de constraints, triggers y claves `UNIQUE` para asegurar la concurrencia).
*   **Almacenamiento de Archivos:** Supabase Storage (procesamiento seguro de imágenes con `multer`).
*   **Seguridad:** Arquitectura basada en JSON Web Tokens (JWT) y Control de Acceso Basado en Roles (RBAC).

---

## 🎨 Sistema de Diseño: "Sofisticación Sutil"

Toda la interfaz gráfica del proyecto cumple estrictamente con el manual de diseño aprobado:
*   **Modo Visual:** *Light Mode* absoluto. (Sin modos oscuros o neón).
*   **Paleta Cromática:** 
    *   **Crema Cálido:** `#F3F0E4` (Fondos y superficies grandes)
    *   **Beige:** `#CEC8B8` (Tarjetas, separadores y bordes tenues)
    *   **Azul Grisáceo:** `#4D7182` (Acciones primarias e íconos)
    *   **Azul Oscuro:** `#233D49` (Tipografía principal de alto contraste)
*   **Estilo Geométrico:** Uso intensivo de bordes redondeados (`10px` a `16px`) y sombras altamente suavizadas (`shadow-sm`, `shadow-md`).

---

## ⚙️ Configuración y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Alan-Cuenca/Eventra_Project.git
cd Eventra_Project
```

### 2. Levantar el Servidor (Backend)
```bash
cd backend
npm install
```
*Asegúrate de crear un archivo `.env` en la raíz de `/backend` con las variables de entorno necesarias (conexión a Supabase, JWT_SECRET, Port, etc).*
```bash
npm run dev
```

### 3. Levantar la Interfaz (Frontend)
Abre una nueva pestaña de terminal en la raíz del proyecto:
```bash
cd frontend
npm install
npm run dev
```
La aplicación cliente estará disponible inmediatamente en: `http://localhost:5173/`

---

## 👨‍💻 Equipo de Desarrollo (Metodología Scrum)

Desarrollado en un entorno ágil con sprints de 2 semanas (total de 12 semanas):
*   **Alejandro Falcón:** Líder de Proyecto / Product Owner.
*   **Alan Puruncajas:** Backend Developer, DBA y Gerente UX/UI.
*   **Jorge Sailema:** Frontend Developer y Arquitectura de Servicios.
*   **Juan Pablo Vayas:** Frontend Developer, QA y Documentación.

---

*© 2026 EVENTRA - Todos los derechos reservados.*
