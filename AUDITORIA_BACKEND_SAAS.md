# Informe Técnico de Auditoría: Arquitectura Multi-tenant y Lógica de Negocio SaaS — EVENTRA

**Para:** Alejandro Falcón (Product Owner) y Equipo de Desarrollo EVENTRA  
**Rol:** Arquitecto de Software & Tech Lead  
**Fecha de Actualización:** 04 de Noviembre, 2026  
**Estado del Sistema:** **100% IMPLEMENTADO, VALIDADO Y OPERATIVO EN PRODUCCIÓN (Render + Supabase)**  
**Versión de Auditoría:** v3.0 (Post-Optimización Contextual de EVARA AI, Respaldo de Gobernanza Super-Admin y Telemetría SaaS)

---

## 1. Resumen Ejecutivo de la Auditoría

Tras la auditoría inicial del 21 de Octubre de 2026 y la posterior ejecución del plan de desarrollo y remediación durante finales de Octubre y Noviembre de 2026, el backend de **EVENTRA SaaS** ha alcanzado madurez empresarial completa. 

Todas las vulnerabilidades preliminares identificadas (B-01 a B-06) fueron **subsanadas al 100%**, el aislamiento multi-tenant fue blindado contra ataques IDOR en todas las entidades foráneas, se desplegó la consola de gobernanza global del Super Administrador, se implementó el motor de cuotas por plan SaaS, se integró el chatbot inteligente EVARA AI con Google Gemini 1.5 Flash, y se configuró un motor de correos híbrido de alta disponibilidad (Brevo HTTP API + SMTP).

---

## 2. Validación de las 4 Reglas de Negocio SaaS

### Regla 1: Aislamiento Multi-tenant (`empresa_id`) y Protección Anti-IDOR
* **En Base de Datos (`init.sql`):**  
  ✅ **CUMPLE AL 100%.** Toda tabla transaccional (`usuarios`, `clientes`, `servicios`, `paquetes`, `cotizaciones`, `reservas`, `eventos`, `actividades`, `pagos`, `proveedores`, `solicitudes_modificacion`) cuenta con `empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE`. Todas cuentan con índices dedicados `CREATE INDEX IF NOT EXISTS idx_<tabla>_empresa ON <tabla>(empresa_id);`.
* **En Controladores y Middlewares (Mitigación IDOR en Foreign Keys):**  
  ✅ **CUMPLE AL 100% (Blindado).**  
  Se refactorizaron todos los controladores para validar la pertenencia al tenant de cualquier entidad hija enviada en el cuerpo de la petición (`body`):
  1. `cotizacionController.js`: Valida con consulta previa que `cliente_id` y `paquete_id` existan y pertenezcan a `req.user.empresa_id`.
  2. `reservaController.js`: Valida que `cotizacion_id` pertenezca al `empresa_id` en sesión antes de reservar.
  3. `pagoController.js`: Valida que `evento_id` pertenezca a la empresa del usuario.
  4. `actividadController.js`: Valida que `evento_id` y `responsable_id` pertenezcan a la empresa.
  5. `solicitudController.js`: Valida que el `evento_id` pertenezca a la empresa del solicitante.
  6. `eventoController.js`: Valida que `reserva_id` o `cotizacion_id` pertenezcan estrictamente al inquilino.
  * Todas las consultas de lectura (`SELECT`), actualización (`UPDATE`) y eliminación (`DELETE`) aplican rigurosamente la cláusula `WHERE empresa_id = req.user.empresa_id`.

---

### Regla 2: Nivel 1 — Rol Super Administrador (`ADMIN_GLOBAL`, rol_id = 5)
* **¿Existe el rol `Super_Admin` desacoplado de tenants?**  
  ✅ **CUMPLE.** En `init.sql` existe el rol `id = 5` (`Super_Admin`). En la tabla `usuarios`, la columna `empresa_id` es anulable (`empresa_id DROP NOT NULL`), permitiendo que el Super Admin opere de forma global sin estar atado a ningún inquilino específico.
* **Gobernanza y Creación de Inquilinos:**  
  ✅ **CUMPLE.** La ruta `POST /api/empresas` en `empresaRoutes.js` está protegida con el middleware `authorizeSuperAdmin`. El controlador `empresaController.js` ejecuta una transacción atómica `BEGIN ... COMMIT` que:
  1. Registra la empresa en la tabla `empresas` (generando su `slug` único e inicializando configuración de branding).
  2. Crea el usuario `Administrador` inicial (rol 1) con contraseña temporal autogenerada encriptada con bcrypt (`debe_cambiar_password = true`).
  3. Despacha el correo de bienvenida e inicio de sesión mediante `emailService.js` (usando Brevo HTTP API o Nodemailer).
* **Control Operativo de Inquilinos:**  
  ✅ **CUMPLE.** Endpoints dedicados para suspender/reactivar inquilinos (`PATCH /api/empresas/:id/suspender`), cambiar planes de suscripción (`PATCH /api/empresas/:id/plan`) y auditar facturación global.

---

### Regla 3: Nivel 2 — Invitación de Colaboradores (Gerentes y Trabajadores)
* **¿Está deshabilitado el autoregistro público para roles internos?**  
  ✅ **CUMPLE.** El endpoint `POST /api/auth/register` responde con HTTP `403 Forbidden` informando que el registro público está cerrado y que el alta debe realizarse por invitación o por el portal de clientes.
* **Flujo Criptográfico de Invitación con JWT:**  
  ✅ **CUMPLE.**
  1. `POST /api/auth/invitar` (`authController.js`): Exclusivo para el Administrador (rol 1). Valida que no se invite al rol `Super_Admin`, genera un JWT de 48 horas firmado con `{ email, rol_id, empresa_id }` y despacha un correo con plantilla HTML moderna ("Sofisticación Sutil") con enlace seguro a `/completar-registro?token=...`.
  2. `POST /api/auth/completar-registro` (`authController.js`): Recibe el token, valida su firma y caducidad, verifica que el usuario no exista previamente, encripta la contraseña elegida y registra al empleado heredando forzosamente el `empresa_id` y `rol_id` validados criptográficamente en el token JWT.

---

### Regla 4: Nivel 3 — Autoregistro y Portal de Clientes Finales
* **¿Existe una lógica segura para que un cliente final se registre desde el portal de una empresa?**  
  ✅ **CUMPLE.** Implementado en `authController.js` y expuesto públicamente en `authRoutes.js`:
  1. `GET /api/auth/portal/:slug`: Retorna la información comercial pública de la empresa (nombre, eslogan, logo, estado activo) validando la existencia del tenant.
  2. `POST /api/auth/registro-cliente`: Recibe `{ empresa_slug, nombre_completo, email, password, telefono, cedula }`.
* **Manejo en Base de Datos y Blindaje de Roles:**  
  ✅ **CUMPLE.**
  * Resuelve la empresa por su `slug`. Si la empresa está inactiva o no existe, retorna `404 Not Found`.
  * Asigna de forma estricta y forzada `rol_id = 4` (Cliente). Si se envía otro rol en el body, se descarta.
  * Ejecuta una transacción atómica `BEGIN ... COMMIT` que:
    - Inserta en `usuarios` (`empresa_id`, `rol_id: 4`, `nombre_completo`, `email`, `password_hash`).
    - Inserta en `clientes` (`empresa_id`, `nombres`, `apellidos`, `email`, `telefono`, `cedula`).
  * Restricción compuesta en `init.sql`: `CONSTRAINT uq_clientes_empresa_email UNIQUE (empresa_id, email)`. Permite que un mismo cliente físico interactúe con diferentes empresas sin conflicto de clave duplicada (`23505`).
  * Genera y retorna de inmediato el token JWT con `{ id, rol_id: 4, empresa_id, email }` para que el cliente ingrese logueado a su portal (`/portal-cliente`) sin fricción.

---

## 3. Nuevos Módulos y Capacidades Arquitectónicas del Backend

### 3.1. Motor de Límites SaaS y Cuotas por Plan (`planLimitsMiddleware.js`)
Se implementó un middleware centralizado que restringe los recursos consumidos por cada inquilino de acuerdo a su suscripción contratada (**Plan Básico** vs **Plan Premium**):

| Recurso Monitoreado | Plan Básico (Boutique) | Plan Premium | Middleware / Endpoint |
| :--- | :---: | :---: | :--- |
| **Eventos Activos** | Máximo 5 simultáneos | Ilimitados (9999) | `verificarLimiteEventos` en `POST /api/eventos` |
| **Clientes Registrados** | Máximo 20 | Ilimitados (9999) | `verificarLimiteClientes` en `POST /api/clientes` |
| **Servicios en Catálogo** | Máximo 15 | Ilimitados (9999) | `verificarLimiteServicios` en `POST /api/servicios` |
| **Usuarios Colaboradores** | Máximo 3 colaboradores | Ilimitados (9999) | `verificarLimiteColaboradores` en `POST /api/auth/invitar` |
| **Mensajes EVARA AI** | 50 consultas / mes | 1,500 consultas / mes | `verificarLimiteChatbot` en `POST /api/chatbot/mensaje` |

* **Respuesta Estándar ante Exceso de Cuota:** Retorna HTTP `403 Forbidden` con estructura uniforme:
  ```json
  {
    "error": "Límite del plan alcanzado",
    "limite_alcanzado": "eventos",
    "plan_actual": "Basico",
    "limite": 5,
    "actual": 5,
    "mensaje": "Has alcanzado el límite de 5 eventos activos para el Plan Básico. Actualiza a Plan Premium para crear eventos ilimitados.",
    "upgrade_url": "/mi-suscripcion"
  }
  ```
* **Endpoint de Consulta de Cuotas:** `GET /api/suscripciones/consumo` (`suscripcionController.js`), que consolida el uso real de cada métrica contra los topes del plan para alimentar las barras de progreso del panel del Administrador.

---

### 3.2. Asistente Conversacional Inteligente: EVARA AI (`chatbotController.js`)
* **Motor de IA:** Desarrollado con el SDK oficial `@google/genai` utilizando el modelo **Google Gemini 1.5 Flash**.
* **Arquitectura Contextual Multi-tenant:**
  * Al recibir una consulta en `POST /api/chatbot`, el controlador recupera en tiempo real el contexto de la empresa del inquilino (nombre comercial, eslogan, catálogo de servicios, paquetes vigentes con precios e información de contacto).
  * Inyecta este contexto en el `systemInstruction` de Gemini para responder de manera hiper-personalizada a clientes y prospectos sobre la oferta de la empresa.
  * Mantiene y valida el conteo de mensajes mensuales en la tabla `empresas` (`mensajes_chatbot_mes`), reseteándose al inicio de cada ciclo de facturación.

---

### 3.3. Motor de Correos Híbrido de Alta Disponibilidad (`emailService.js`)
Dado que las plataformas Cloud Serverless/PaaS (como Render) bloquean los puertos SMTP tradicionales (587 y 465), se desarrolló un servicio de correos con estrategia multicapa:
1. **Brevo HTTP API v3 (Prioridad 1):** Envío mediante petición HTTPS directa a la API de Brevo, superando bloqueos de puertos y garantizando entrega a cualquier dominio. Incluye auto-normalización de claves `xkeysib-`.
2. **Resend HTTP API (Prioridad 2):** Fallback mediante API REST en caso de indisponibilidad.
3. **Nodemailer SMTP (Prioridad 3):** Conexión SMTP tradicional para entornos de desarrollo local.
* **Plantillas Transaccionales HTML:** Diseñadas bajo la identidad "Sofisticación Sutil" para:
  - Invitación a nuevos colaboradores con botón de activación por token.
  - Bienvenida a nuevas empresas con credenciales temporales generadas por el Super Admin.
  - Notificaciones de aprobación/rechazo de solicitudes de modificación de eventos.
  - Confirmación de recepción de comprobantes de pago.

---

### 3.4. Módulo de Solicitudes de Modificación de Clientes (`solicitudController.js`)
* Permite a los clientes finales solicitar cambios específicos sobre sus eventos reservados (ej. ampliación de invitados, cambio de menú, adición de hora loca).
* Los Gerentes y Administradores pueden revisar, auditar, **aprobar o rechazar** las solicitudes con justificación formal.
* Al actualizar el estado a `'Aprobado'` o `'Rechazado'`, se dispara automáticamente un correo electrónico al cliente notificando la resolución.
* Subsanación de datos simulados: Se eliminó el campo residual estático `'+ $420.00'` y se calcula dinámicamente con base en los ítems de catálogo.

---

### 3.5. Módulo de Analítica y Reportes Financieros (`reporteController.js`)
* Endpoints analíticos dedicados:
  - `GET /api/reportes/resumen`: Consolida métricas financieras reales (`ingresos_totales_recaudados`, `eventos_totales`, `tasa_conversion_cotizaciones`), series mensuales de ingresos, distribución por estado y metadatos fiscales de la empresa (`nombre_comercial`, `ruc`, `plan_suscripcion`) para exportación PDF con membrete corporativo.

---

### 3.6. Marca Blanca / White-Label y Theming Dinámico (`empresaController.js`)
* `GET /api/empresas/mi-branding`: **Accesible para todos los roles autenticados de la empresa (roles 1, 2, 3 y 4)**. Devuelve nombre comercial, RUC, logo, eslogan, marca de agua y clave de paleta de colores activa (`paleta_colores`).
* `PUT /api/empresas/mi-branding`: **Exclusivo para el Administrador (rol 1)**. Permite actualizar eslogan, marca de agua, seleccionar entre las 5 paletas de color y subir el logotipo oficial mediante `multer` hacia Supabase Storage (`logo_url TEXT`).

---

## 4. Matriz de Vulnerabilidades: Estado de Resolución

| ID | Área Afectada | Nivel Original | Problema Identificado | Estado Actual | Resolución Técnica |
| :---: | :--- | :---: | :--- | :---: | :--- |
| **B-01** | `authController` | **Crítico** | Inexistencia del flujo de autoregistro para Clientes Finales (Nivel 3). | ✅ **SUBSANADO** | Implementado `POST /api/auth/registro-cliente` y `GET /api/auth/portal/:slug` con transacción atómica en `usuarios` y `clientes`. |
| **B-02** | Controladores Varios | **Alto** | Vulnerabilidad IDOR en llaves foráneas secundarias (`cliente_id`, `evento_id`, etc.). | ✅ **SUBSANADO** | Blindaje en `cotizacionController`, `reservaController`, `pagoController`, `actividadController`, `solicitudController` y `eventoController`. |
| **B-03** | `init.sql` (`clientes`) | **Medio** | Restricción `UNIQUE` global en `email` impedía clientes multi-empresa. | ✅ **SUBSANADO** | Sustituido por `CONSTRAINT uq_clientes_empresa_email UNIQUE (empresa_id, email)`. |
| **B-04** | `init.sql` (`empresas`) | **Bajo** | Falta de columna `slug` para enlaces amigables del portal. | ✅ **SUBSANADO** | Agregada columna `slug VARCHAR(100) UNIQUE` con generación automática a partir del nombre comercial. |
| **B-05** | `frontend/Registro.jsx` | **Medio** | Formulario público con selectores de roles internos que generaba error 403. | ✅ **SUBSANADO** | Erradicado. Reemplazado por `RegistroClientePortal.jsx` y `PortalRedirect.jsx`. |
| **B-06** | `solicitudController.js` | **Bajo** | Dato simulado residual `'+ $420.00' AS impacto_costo`. | ✅ **SUBSANADO** | Eliminado valor hardcodeado; reemplazado por cómputo dinámico y montos reales de base de datos. |

---

## 5. Resumen de Endpoints y Cobertura de Rutas Backend

```
/api
├── /auth
│   ├── POST /login                       # Autenticación universal y emisión de JWT
│   ├── POST /register                    # Bloqueado (403 Forbidden - Clausura pública)
│   ├── POST /invitar                     # Invitación a colaboradores con JWT 48h (Admin)
│   ├── POST /completar-registro          # Alta de empleado con token de invitación
│   ├── GET  /portal/:slug                # Datos comerciales públicos de la empresa
│   ├── POST /registro-cliente            # Autoregistro de clientes finales en el tenant
│   └── POST /primer-acceso-cambiar-password # Cambio forzoso de clave temporal
├── /empresas                             # Gestión de inquilinos (Super Admin & Admin)
│   ├── GET    /                          # Directorio global de empresas (Super Admin)
│   ├── POST   /                          # Creación transaccional de tenant y admin (Super Admin)
│   ├── PATCH  /:id/suspender             # Suspender / Reactivar empresa (Super Admin)
│   ├── PATCH  /:id/plan                  # Upgrade / Downgrade de plan (Super Admin)
│   ├── GET    /mi-branding               # Lectura de paleta, RUC, logo y marca (Roles 1..4)
│   └── PUT    /mi-branding               # Actualización de marca blanca (Admin)
├── /suscripciones
│   ├── GET    /                          # Listado global (Super Admin) o por tenant (Admin)
│   ├── POST   /pagar                     # Subida de comprobante PDF/imagen en Supabase Storage
│   ├── PUT    /:id/estado                # Aprobación / Rechazo y activación automática de plan
│   └── GET    /consumo                   # Consumo de cuotas vs límites del plan
├── /chatbot
│   └── POST   /                          # Asistente EVARA AI con Gemini 1.5 Flash + Fallback SQL
├── /solicitudes                          # Solicitudes de cambio de eventos
│   ├── GET    /                          # Listado filtrado por tenant / cliente
│   ├── POST   /                          # Creación de solicitud por el cliente
│   └── PUT    /:id/estado                # Aprobación / Rechazo con envío de correo
├── /reportes
│   └── GET    /resumen                   # KPIs financieros, series mensuales y metadatos RUC
└── /eventos, /cotizaciones, /reservas, /pagos, /servicios, /paquetes, /proveedores, /actividades
    └── Endpoints CRUD estándar filtrados por empresa_id con validación anti-IDOR
```

---

## 6. Cobertura de Pruebas Automatizadas Backend (`backend/tests/`)

El backend cuenta con 12 suites de pruebas unitarias y de integración que validan la solidez del sistema:

1. `auth.test.js`: Pruebas de login, bloqueo de autoregistro público, flujo de invitación y registro de clientes.
2. `saas_isolation.test.js`: Pruebas de aislamiento multi-tenant y prevención de cruce de datos entre inquilinos.
3. `branding.test.js`: Pruebas de lectura y actualización de marca blanca y control de roles.
4. `planLimits.test.js`: Pruebas de intercepción de cuotas en planes Básico y Premium.
5. `chatbot.test.js`: Pruebas del controlador de EVARA AI y límites de mensajes mensuales.
6. `emailService.test.js`: Pruebas de despacho y fallback entre Brevo API, Resend y Nodemailer.
7. `solicitudes.test.js`: Pruebas de creación, aprobación y flujo de estados de solicitudes.
8. `reportes.test.js`: Pruebas de cálculo de KPIs financieros y rentabilidad.
9. `pagos.test.js`: Pruebas de registro de pagos, anticipos y validaciones contables.
10. `cotizacion.test.js`: Pruebas de validación de cálculo de cotizaciones y llaves foráneas.
11. `reserva.test.js`: Pruebas de prevención de colisión de salones y concurrencia.
12. `suscripciones.test.js`: Pruebas de consulta de consumo y planes SaaS.

---

## 7. Nueva Sección de Cambios Realizados en el Backend (Auditoría v3.0 — Noviembre 2026)

Durante las últimas iteraciones de Noviembre de 2026 se incorporaron y auditaron las siguientes mejoras en la capa de servicios y controladores del backend:

### 7.1. Optimización de Respuestas Contextuales en EVARA AI (`chatbotController.js` — Commit `930fbaf`)
* **Archivo intervenido:** `backend/src/controllers/chatbotController.js`.
* **Mejoras implementadas:**
  1. **Refinamiento del `systemPrompt` de Gemini 1.5 Flash:** Se instruyó explícitamente al modelo para que, cuando un cliente indique una fecha o solicite reservar un salón, confirme con entusiasmo la fecha y explique que el bloqueo anti-colisión y el contrato legal se formalizan en los módulos `/cotizador` y `/reservas`.
  2. **Motor Contextual SQL Determinista (`generarRespuestaContextual`):** Se amplió el clasificador de intenciones basado en el catálogo real de PostgreSQL (`paquetes` y `servicios` del `empresa_id`) para responder con precisión a:
     * Consultas de alcance y capacidades (`"para qué sirve"`, `"qué haces"`, `"puedes agendar"`, `"quién eres"`).
     * Afirmaciones de compra o cotización (`"sí"`, `"claro"`, `"quiero cotizar"`, `"de acuerdo"`), recomendando automáticamente el paquete base de la empresa con su precio real.
     * Expresiones temporales y fechas (`enero`..`diciembre`, `2025`..`2027`, formatos `dd/mm` o `"agendar"`/`"disponibilidad"`), guiando al usuario hacia la reserva libre de colisiones.

### 7.2. Soporte Backend para los Nuevos Módulos de Gobernanza del Super Administrador (`rol_id = 5`)
Se verificó e integró la cobertura de endpoints del backend que alimentan los 4 módulos recién habilitados en la consola global:
1. **Bandeja de Solicitudes de Ingreso y Facturación (`suscripcionController.js`):**
   * `GET /api/suscripciones`: Cuando `rol_id === 5`, ejecuta un `INNER JOIN` entre `suscripciones_pagos` y `empresas` devolviendo el historial completo de transferencias, RUC, plan solicitado y URL del comprobante PDF alojado en Supabase Storage (`bucket: comprobantes`) o en URI Base64 resiliente.
   * `PUT /api/suscripciones/:id/estado`: Al aprobarse una solicitud (`estado = 'Aprobado'`), ejecuta la actualización automática `UPDATE empresas SET plan_suscripcion = $1, estado_activo = true, mensajes_chatbot_mes = 0 WHERE id = $2`.
2. **Gestión de Administradores Tenant y Aprovisionamiento (`empresaController.js`):**
   * `GET /api/empresas` y `POST /api/empresas`: Aprovisiona en transacción SQL atómica (`BEGIN ... COMMIT`) tanto el registro en `empresas` como su usuario Administrador principal (`rol_id = 1`) con contraseña temporal segura (`generarPasswordTemporal(12)`) y disparo de bienvenida por `sendWelcomeAdminEmail`.
   * `PATCH /api/empresas/:id/suspender`: Permite habilitar o suspender de forma inmediata el acceso operativo de cualquier inquilino y su administrador.
3. **Metadatos Tributarios (RUC) para Reportes y Marca Blanca (`reporteController.js` y `empresaController.js`):**
   * `GET /api/reportes/resumen` y `GET /api/empresas/mi-branding` exponen el campo `ruc` junto con `nombre_comercial` y `paleta_colores`, garantizando que tanto la vista `/reportes` como el generador PDF muestren siempre la identificación tributaria real del tenant.
4. **Diagnóstico y Telemetría de Infraestructura (`/api/health`):**
   * Permite que el módulo de Configuración Global SaaS (`/super-admin/configuracion`) mida en vivo la latencia y disponibilidad de Express, PostgreSQL en Supabase y el servicio de almacenamiento.

---

## 8. Dictamen Final de la Auditoría Backend

> **DICTAMEN: APROBADO CON EXCELENCIA TÉCNICA (v3.0).**  
> El backend de EVENTRA SaaS cumple rigurosamente con los estándares de arquitectura de software para soluciones multi-tenant empresariales. Garantiza el aislamiento estricto de datos entre inquilinos, mitiga vulnerabilidades IDOR, soporta un esquema RBAC de 5 roles bien diferenciados, ofrece control de consumo por tiers de suscripción, respalda la totalidad de los módulos de gobernanza del Super Administrador y provee una integración desacoplada y robusta con servicios de IA (Google Gemini 1.5 Flash), correo transaccional (Brevo API) y almacenamiento en la nube (Supabase Storage).
