# EVENTRA - Guía de Convenciones y Directrices para Agentes (agents.md)

Este documento contiene la arquitectura, reglas de negocio, diseño y normativas de código estandarizadas para el proyecto EVENTRA. Todo asistente o agente de IA debe adherirse estrictamente a estas directrices antes de proponer, modificar o generar nuevo código.

## 1. Contexto del Proyecto
*   **Nombre:** EVENTRA[cite: 5, 6].
*   **Modelo:** Plataforma web Software as a Service (SaaS)[cite: 5, 6].
*   **Objetivo:** Gestión integral de empresas de organización de eventos y recepciones (clientes, cotizaciones, servicios, paquetes, reservas, pagos, seguimiento y chatbot)[cite: 3, 5].
*   **Metodología:** Scrum (Sprints de 2 semanas, duración total de 12 semanas)[cite: 3, 6, 9].
*   **Roles del Equipo (Scrum):**
    *   Alejandro Falcón: Líder de Proyecto / Product Owner[cite: 3, 9].
    *   Alan Puruncajas: Backend Developer, DBA y Gerente UX/UI[cite: 3, 8].
    *   Jorge Sailema: Frontend Developer y Arquitectura de Servicios[cite: 3, 8].
    *   Juan Pablo Vayas: Frontend Developer, QA y Documentación[cite: 3, 8].

## 2. Stack Tecnológico y Arquitectura
*   **Frontend:** React interactivo (Vite) con React Router DOM (`PrivateRoute`)[cite: 3, 7].
*   **Backend:** Node.js con Express alojado en Render[cite: 3, 7].
*   **Base de Datos:** PostgreSQL alojado en Supabase (conexión directa URI, gestión de concurrencia y validaciones de unicidad `UNIQUE`)[cite: 3, 6].
*   **Almacenamiento de Archivos:** Supabase Storage (implementado a través del backend usando `multer` para procesar `multipart/form-data`).
*   **Seguridad:** Arquitectura desacoplada, control de acceso basado en roles (RBAC) y comunicación por HTTPS/TLS[cite: 6, 8].

## 3. Reglas de Desarrollo Frontend (React)
1.  **Conexión API Exclusiva:** Prohibido el uso de datos simulados (mocks) o arreglos estáticos en producción. Todas las vistas, indicadores de estado, tablas y barras de progreso deben consumir los endpoints reales mediante la instancia centralizada de Axios en `src/services/api.js`.
2.  **Autenticación y Roles:** 
    *   Todo acceso requiere un token JWT guardado en `localStorage`.
    *   Axios debe inyectar el JWT en los headers (`Authorization: Bearer <token>`) mediante un interceptor de peticiones.
    *   Existen 4 roles estrictos: Administrador, Gerente, Trabajador y Cliente[cite: 4, 8].
    *   La navegación (Sidebar y Dashboards) debe renderizarse condicionalmente según el rol extraído del JWT tras el login. No implementar selectores de "Demo Roles"[cite: 4].
3.  **Lógica de Formularios:** Los formularios de creación/edición (ej. Eventos, Clientes, Proveedores) deben reutilizar el mismo componente: si la URL incluye un `id`, ejecutar GET para precargar datos y PUT para guardar; si no, ejecutar POST.
4.  **Carga de Archivos:** Para imágenes y comprobantes de pago, el frontend debe enviar los datos utilizando `FormData` hacia el backend.

## 4. Reglas de Desarrollo Backend (Express/Node.js)
1.  **Estructura RESTful:** Los endpoints deben mantener nomenclatura estándar (GET, POST, PUT, DELETE) sobre recursos pluralizados (`/api/eventos`, `/api/pagos`, `/api/actividades`, `/api/proveedores`)[cite: 7].
2.  **Validación y Concurrencia:** El backend es responsable de la lógica estricta, como prevenir la colisión de reservas de salones en idéntica fecha devolviendo códigos de error HTTP adecuados (ej. 409 Conflict)[cite: 3, 6].
3.  **Integraciones Externas:** Las conexiones con pasarelas de pago (ej. Deuna, Stripe/Kushki en el futuro) o IA (chatbot) deben ser desacopladas para evitar caídas del sistema principal si el proveedor falla[cite: 5, 8].

## 5. Sistema de Diseño UI/UX ("Sofisticación Sutil")
Cualquier interfaz generada debe adherirse estrictamente al prototipo validado en Figma bajo el concepto de "Sofisticación Sutil"[cite: 4]:
*   **Estilo General:** Diseño moderno, limpio, minimalista, con bordes redondeados (10-16px), sombras muy suaves e iconografía estrictamente lineal[cite: 4].
*   **Modo Visual:** Estrictamente Light Mode. Prohibido el uso de fondos oscuros, neón o gradientes excesivos[cite: 4].
*   **Paleta Cromática Oficial:**
    *   Fondo principal / Crema cálido: `#F3F0E4`[cite: 4]
    *   Superficies secundarias / Beige: `#CEC8B8`[cite: 4]
    *   Acciones principales e interacción / Azul grisáceo: `#4D7182`[cite: 4]
    *   Textos de alto contraste / Azul oscuro: `#233D49`[cite: 4]
    *   Superficies limpias (Cards) / Blanco: `#FFFFFF`[cite: 4]
    *   Estados: Verde éxito (`#4D9A72`), Dorado advertencia (`#C49A3A`), Rojo error (`#C95C5C`)[cite: 4].

## 6. Directrices Operativas para la IA (Guardrails)
*   **Auditoría Previa:** Antes de generar código para un módulo, el agente debe solicitar escanear o analizar los archivos existentes para no sobrescribir configuraciones, rutas o servicios previamente implementados por el equipo.
*   **Limitación de Invención:** No inventar módulos, roles, ni esquemas de color fuera de los documentados. Ceñirse a la matriz de requerimientos (Fases 1 a 5 de Trello)[cite: 3, 7].
*   **Entrega Completa:** Los componentes de React deben entregarse con manejo de errores, alertas amigables al usuario (evitando errores crudos del servidor en la pantalla) y redirecciones mediante `react-router-dom`.