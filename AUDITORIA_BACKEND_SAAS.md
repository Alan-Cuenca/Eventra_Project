# Informe Técnico de Auditoría: Arquitectura Multi-tenant y Lógica de Negocio SaaS — EVENTRA

**Para:** Alejandro Falcón (Product Owner) y Equipo de Desarrollo EVENTRA  
**Rol:** Arquitecto de Software & Tech Lead  
**Fecha:** 21 de Octubre, 2026  
**Estado de Ejecución:** **AUDITORÍA FINALIZADA — CÓDIGO CONGELADO EN ESPERA DE APROBACIÓN**  

---

## 1. Validación de las 4 Reglas de Negocio SaaS

### Regla 1: Aislamiento Multi-tenant (`empresa_id`)
* **En Base de Datos (`init.sql`):**  
  ✅ **CUMPLE.** Toda tabla transaccional (`usuarios`, `clientes`, `servicios`, `paquetes`, `cotizaciones`, `reservas`, `eventos`, `actividades`, `pagos`, `proveedores`, `solicitudes_modificacion`) cuenta con `empresa_id INTEGER NOT NULL REFERENCES empresas(id) ON DELETE CASCADE`. Además, todas cuentan con índices dedicados `CREATE INDEX IF NOT EXISTS idx_<tabla>_empresa ON <tabla>(empresa_id);`.
* **En Controladores y Middlewares:**  
  ⚠️ **CUMPLE PARCIALMENTE (Vulnerabilidad IDOR en llaves foráneas secundarias).**  
  * **Lo positivo:** En las operaciones de lectura (`SELECT`), actualización (`UPDATE`) y eliminación (`DELETE`), todos los controladores filtran estrictamente por `WHERE empresa_id = req.user.empresa_id`.
  * **La brecha detectada:** En las operaciones de creación (`INSERT`), aunque se inyecta `empresa_id = req.user.empresa_id`, **no se valida la pertenencia de las entidades secundarias enviadas en el body**:
    1. `cotizacionController.js`: Inserta `cliente_id` y `paquete_id` sin validar si pertenecen a la empresa del usuario en sesión.
    2. `reservaController.js`: Inserta `cotizacion_id` sin validar pertenencia al tenant.
    3. `pagoController.js`: Inserta `evento_id` sin verificar pertenencia.
    4. `actividadController.js`: Inserta `evento_id` y `responsable_id` sin verificar si pertenecen a la empresa.
    *(Nota: El único controlador que ya tiene esta validación blindada es `eventoController.js` para `reserva_id`).*

---

### Regla 2: Nivel 1 — Rol Super Admin
* **¿Existe el rol `Super_Admin` desacoplado de tenants?**  
  ✅ **CUMPLE.** En `init.sql` existe el rol `id = 5` (`Super_Admin`). En la tabla `usuarios`, la columna `empresa_id` es anulable (`empresa_id DROP NOT NULL`), permitiendo que el Super Admin no esté atado a ningún inquilino específico.
* **¿Es el único autorizado para crear empresas y administradores iniciales?**  
  ✅ **CUMPLE.** La ruta `POST /api/empresas` en `empresaRoutes.js` está protegida con el middleware `authorizeSuperAdmin`. El controlador `empresaController.js` ejecuta una transacción atómica `BEGIN ... COMMIT` que:
  1. Crea la empresa en `empresas`.
  2. Crea el usuario `Administrador` inicial (rol 1) con contraseña autogenerada encriptada con bcrypt.
  3. Despacha el correo de bienvenida mediante `emailService.js` (`nodemailer`).

---

### Regla 3: Nivel 2 — Invitación de Empleados
* **¿Está deshabilitado el autoregistro público para roles internos?**  
  ✅ **CUMPLE EN BACKEND.** El endpoint `POST /api/auth/register` en `authController.js` responde con HTTP `403 Forbidden` indicando que el registro público está clausurado.
* **¿Existe el flujo de invitación por correo con JWT?**  
  ✅ **CUMPLE EN BACKEND.**
  1. `POST /api/auth/invitar` (`authController.js`): Exclusivo para Administrador (rol 1). Valida que no se invite a rol `Super_Admin`, genera un JWT de 48 horas firmado con `{ email, rol_id, empresa_id }` y despacha el correo mediante plantilla HTML elegante de Nodemailer con enlace a `/completar-registro?token=...`.
  2. `POST /api/auth/completar-registro` (`authController.js`): Recibe el token, valida su firma/expiración, verifica que el usuario no exista previamente (anti-reuso), encripta la contraseña y registra al empleado heredando forzosamente el `empresa_id` y `rol_id` validados criptográficamente en el JWT.
* **Desfase en Frontend detectado:**  
  ⚠️ `frontend/src/pages/auth/Registro.jsx` aún conserva un formulario público abierto con selectores para Administrador, Gerente y Trabajador, y envía `empresa_id: 1` a `/api/auth/register`. Este formulario falla con error 403 en producción.

---

### Regla 4: Nivel 3 — Autoregistro de Clientes Finales
* **¿Existe una lógica segura para que un cliente final se registre desde el portal de una empresa?**  
  ❌ **NO EXISTE (Carencia Crítica).**  
  Actualmente, como `/api/auth/register` está bloqueado para todos, y las rutas de `clienteRoutes.js` exigen una sesión iniciada (`verifyToken`), **un cliente final no tiene ninguna vía técnica para registrarse en el sistema**.
* **¿Se fuerza el rol "Cliente" y se asigna el `empresa_id` de forma oculta?**  
  ❌ **NO.** No existe endpoint ni controlador para este fin.
* **¿Qué limitaciones adicionales existen?**
  1. La tabla `empresas` carece de un campo `slug` público (ej. `boda-magica-eventos`), por lo que no existe una URL comercial limpia para el portal de clientes (ej. `/p/boda-magica-eventos/registro`).
  2. En `init.sql`, la tabla `clientes` tiene la restricción `email VARCHAR(150) UNIQUE` a nivel global en lugar de `UNIQUE (empresa_id, email)`. Si un cliente físico contrata servicios con la "Empresa A" y luego desea registrarse en el portal de la "Empresa B", la base de datos lo bloqueará con un error de clave duplicada (`23505`).
  3. Desacoplamiento entre `usuarios` y `clientes`: En el diseño actual, el login requiere una fila en `usuarios` (`rol_id: 4`), mientras que los eventos y cotizaciones se vinculan al UUID de la tabla `clientes`. Al autoregistrarse, el cliente debe crearse atómicamente en ambas tablas.

---

## 2. Matriz de Vulnerabilidades y Brechas Identificadas

| ID | Área Afectada | Nivel de Riesgo | Descripción del Problema | Impacto en Producción |
| :---: | :--- | :---: | :--- | :--- |
| **B-01** | `authController` / `authRoutes` | **Crítico** | **Inexistencia del flujo de Clientes (Nivel 3):** No hay endpoint para autoregistro de clientes. | Los clientes no pueden darse de alta en el portal de la empresa. |
| **B-02** | `cotizacionController`, `reservaController`, `pagoController`, `actividadController` | **Alto** | **IDOR en Foreign Keys:** La inserción de entidades hijas no verifica si el recurso padre pertenece al mismo `empresa_id`. | Un inquilino podría asociar cotizaciones o pagos a clientes o eventos de otra empresa conociendo su UUID. |
| **B-03** | `init.sql` (`clientes`) | **Medio** | **Restricción `UNIQUE` global en `clientes.email`:** Impide que dos empresas tengan al mismo cliente en sus directorios. | Falsos positivos de error 409 entre empresas independientes. |
| **B-04** | `init.sql` (`empresas`) | **Bajo** | **Falta de columna `slug` en `empresas`:** No existe identificador público limpio para rutas amigables de portal. | Dificulta la generación de enlaces de portales públicos. |
| **B-05** | `frontend/Registro.jsx` | **Medio** | **Desalineación visual de roles:** Expone selección de roles administrativos en una pantalla pública que genera error 403. | Mala experiencia de usuario y filtración de arquitectura de roles. |
| **B-06** | `solicitudController.js` | **Bajo** | **Dato simulado residual:** En `obtenerSolicitudes` se retorna `'+ $420.00' AS impacto_costo` fijo en la consulta SQL. | Incumplimiento menor de la regla de no datos simulados de `AGENTS.md`. |

---

## 3. Plan de Implementación Paso a Paso (Roadmap de Solución)

Para subsanar al 100% las deficiencias encontradas sin romper los contratos de API existentes, se propone el siguiente plan ordenado en 4 fases:

### Fase 1: Base de Datos y Esquema Multi-tenant (`backend/database/init.sql`)
1. **Incorporar columna `slug` a `empresas`:**
   ```sql
   ALTER TABLE empresas ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
   ```
   *(Incluir script de auto-generación de slug a partir de `nombre_comercial` para empresas existentes).*
2. **Corregir restricción de unicidad en `clientes`:**
   * Eliminar la restricción global previa sobre `email`.
   * Agregar la restricción compuesta multi-tenant:
     ```sql
     ALTER TABLE clientes DROP CONSTRAINT IF EXISTS clientes_email_key;
     ALTER TABLE clientes ADD CONSTRAINT uq_clientes_empresa_email UNIQUE (empresa_id, email);
     ```

### Fase 2: Desarrollo del Flujo de Autoregistro de Clientes (Nivel 3)
1. **En `backend/src/controllers/authController.js`:**
   * Crear la función controladora `registrarClientePortal`:
     * **Entrada esperada:** `{ empresa_slug, nombre_completo, email, password, telefono, cedula }`.
     * **Resolución de Tenant:** Busca en la BD la empresa activa correspondiente al `empresa_slug`. Si la empresa está inactiva o no existe, retorna `404 Not Found`.
     * **Blindaje de Rol:** Asigna de forma estricta y forzada `rol_id = 4` (Cliente). Si el cliente envía un rol en el payload, es descartado.
     * **Transacción Atómica (`BEGIN ... COMMIT`):**
       * Inserta en `usuarios` (`empresa_id`, `rol_id: 4`, `nombre_completo`, `email`, `password_hash`).
       * Inserta en `clientes` (`empresa_id`, `nombres`, `apellidos`, `email`, `telefono`).
     * **Generación de Sesión:** Firma de inmediato el JWT con `{ id, rol_id: 4, empresa_id, email }` para que el cliente ingrese logueado a su portal sin fricción.
2. **En `backend/src/routes/authRoutes.js`:**
   * Exponer la ruta pública `POST /api/auth/registro-cliente` apuntando a `registrarClientePortal`.

### Fase 3: Mitigación IDOR en Controladores Operativos
Refactorizar las inserciones para asegurar que todo ID foráneo pertenezca al `empresa_id` de la sesión:
1. **`cotizacionController.js`:** Validar con consulta previa que `cliente_id` exista y tenga `empresa_id = req.user.empresa_id`. Si se envía `paquete_id`, verificar igualmente pertenencia.
2. **`reservaController.js`:** Validar que `cotizacion_id` pertenezca a `req.user.empresa_id`.
3. **`pagoController.js`:** Validar que `evento_id` pertenezca a `req.user.empresa_id`.
4. **`actividadController.js`:** Validar que `evento_id` y `responsable_id` (si se especifica) pertenezcan a `req.user.empresa_id`.
5. **`solicitudController.js`:** Validar pertenencia de `evento_id` y eliminar el valor estático `'+ $420.00' AS impacto_costo`.

### Fase 4: Ajustes de Enrutamiento y Vistas en Frontend
1. **Deprecar el selector de roles en `frontend/src/pages/auth/Registro.jsx`:**
   * Transformar esta vista en la pantalla de registro para el Portal de Clientes bajo la ruta `/portal/:slug/registro`.
   * El `slug` se extrae automáticamente con `useParams()`, protegiendo al usuario de tener que seleccionar empresas o roles.
2. **Garantizar la vista de Colaboradores:**
   * Crear o verificar la vista `/completar-registro` que consume el token de invitación de Nodemailer para empleados (Gerentes y Trabajadores).
