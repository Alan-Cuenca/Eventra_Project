# Informe de Auditoría Frontend: Flujos de Autenticación, Registro de Clientes e Invitación de Colaboradores — EVENTRA

**Para:** Alejandro Falcón (Product Owner) y Equipo de Desarrollo EVENTRA  
**Rol:** Arquitecto Frontend Senior & Tech Lead  
**Fecha:** 21 de Octubre, 2026  
**Estado:** **AUDITORÍA FRONTEND FINALIZADA — EN ESPERA DE APROBACIÓN**  

---

## 1. Estado Actual de la Arquitectura de Autenticación en Frontend

Tras una inspección minuciosa del árbol de archivos en `frontend/src/pages/auth/`, los enrutadores en `frontend/src/routes/AppRoutes.jsx` y los servicios de autenticación en `frontend/src/services/authService.js`, se presenta el inventario actual de componentes:

### Rutas Configuradas en `AppRoutes.jsx`:
* `/login` → `Login.jsx`
* `/registro` → `Registro.jsx`
* `/portal/:slug/registro` → `Registro.jsx`
* `/completar-registro` → `CompletarRegistro.jsx`
* `/primer-acceso/cambiar-password` → `PrimerLoginCambioPassword.jsx`

### Inventario de Archivos en `src/pages/auth/`:
1. **`Registro.jsx`:** Maneja el registro de clientes del portal cuando se provee el `slug` y ofrece un buscador/asistente si se ingresa a `/registro` sin slug.
2. **`CompletarRegistro.jsx`:** Consume el token de invitación JWT desde la URL (`?token=...`) para la activación de empleados.
3. **`RegisterPage.jsx`:** ⚠️ **Archivo huérfano/zombie crítico.** Contiene selectores de roles y empresas con datos simulados y modo oscuro.
4. **`LoginPage.jsx`:** ⚠️ **Archivo huérfano/zombie.** Contiene botones de inicio rápido con usuarios demo y modo oscuro.
5. **`Login.jsx`:** Pantalla oficial de login conectada al backend real.

---

## 2. Evaluación de las 3 Reglas SaaS en el Frontend

### Regla 1: Eliminación del Registro Público Inseguro
* **¿Existe un `Registro.jsx` público que muestre un selector de roles o envíe `empresa_id: 1`?**  
  * **En el componente activo (`Registro.jsx`):**  
    ✅ **ERRADICADO.** El componente activo ya no posee ningún selector de roles ni campos hardcodeados de `empresa_id`.
  * **En la base de código (`RegisterPage.jsx`):**  
    ❌ **PRESENCIA DE ARCHIVO ZOMBIE CRÍTICO.**  
    Existe el archivo `RegisterPage.jsx` que expone abiertamente:
    ```jsx
    <select name="rol_id">
      <option value={ROLES.CLIENTE}>Cliente</option>
      <option value={ROLES.TRABAJADOR}>Trabajador</option>
      <option value={ROLES.GERENTE}>Gerente</option>
      <option value={ROLES.ADMIN}>Administrador</option>
    </select>
    <select name="empresa_id">
      {MOCK_EMPRESAS.map(...)}
    </select>
    ```
    Además, este archivo utiliza fondos oscuros (`#1c2b35`), violando la directriz de Light Mode estricto ("Sofisticación Sutil") de `AGENTS.md`. Debe ser eliminado formalmente.

---

### Regla 2: Flujo de Empleados (Nivel 2 - Invitación)
* **¿Existe una vista/ruta dedicada (`/completar-registro`) para recibir el token JWT?**  
  ✅ **CUMPLE.** La ruta `/completar-registro` está enlazada al componente `CompletarRegistro.jsx`.
* **¿Restringe los campos únicamente a información personal y contraseña sin selectores de rol/empresa?**  
  ✅ **CUMPLE.** Solo solicita: Nombre completo, Cédula de identidad, Fecha de nacimiento, Contraseña y Confirmar contraseña. Si no se detecta el `token` en la URL, despliega un estado de bloqueo informativo seguro.
* **⚠️ BRECHA DETECTADA (Falta el disparador en el Dashboard):**  
  En el backend existe `POST /api/auth/invitar` (exclusivo para Administrador de la empresa), pero en el panel del Administrador (`frontend/src/pages/`) **no existe ninguna vista ni modal para que el Administrador ingrese el email del nuevo empleado y seleccione si lo invita como Gerente o Trabajador**. El flujo de invitación está completo en la recepción, pero huérfano en la emisión desde la UI.

---

### Regla 3: Flujo de Clientes Finales (Nivel 3 - Portal Tenant)
* **¿Existe una ruta dinámica para el portal de la empresa (`/portal/:slug/registro`)?**  
  ✅ **CUMPLE.** Configurada en `AppRoutes.jsx` con el parámetro `:slug`.
* **¿El formulario extrae el `slug` con `useParams()` y lo envía al backend sin manipulación de roles/empresas?**  
  ✅ **CUMPLE.** `Registro.jsx` usa `useParams()`, consulta los datos comerciales de la empresa (`GET /api/auth/portal/:slug`) para verificar su existencia y estado activo, y despacha a `POST /api/auth/registro-cliente` pasando el `empresa_slug`.
* **Oportunidad de Refactorización Arquitectónica:**  
  Actualmente, `Registro.jsx` contiene tanto la lógica de búsqueda de portal (cuando no hay slug) como el formulario de registro del portal (cuando hay slug). Para cumplir con el Principio de Responsabilidad Única (SRP) y una arquitectura limpia, se debe separar en dos componentes especializados:
  1. `RegistroClientePortal.jsx` (exclusivo para `/portal/:slug/registro`).
  2. `PortalRedirect.jsx` (para `/registro` general, guiando al usuario).

---

## 3. Matriz de Brechas de UX/UI y Seguridad Detectadas

| ID | Archivo / Componente | Severidad | Descripción del Problema | Impacto |
| :---: | :--- | :---: | :--- | :--- |
| **FE-01** | `RegisterPage.jsx` & `LoginPage.jsx` | **Alta** | **Archivos zombies con datos mock y selectores de roles:** Conservan selectores de roles administrativos y fondos oscuros en el código fuente. | Riesgo de importación accidental y confusión en el mantenimiento del proyecto. |
| **FE-02** | Dashboard / Administración | **Alta** | **Falta de UI para Invitar Colaboradores:** El Administrador no tiene una pantalla ni modal en su panel para invitar trabajadores o gerentes vía correo (`nodemailer`). | El Administrador no puede usar el flujo de invitación desde la interfaz web. |
| **FE-03** | `Login.jsx` (Footer) | **Media** | **Enlace genérico a `/registro`:** El footer de login tiene un enlace `Regístrate aquí` que apunta a `/registro`, el cual no es una página de autoregistro directo en un SaaS multi-inquilino. | Fricción para el usuario si no conoce el slug de su empresa. |
| **FE-04** | `Registro.jsx` | **Baja** | **Sobrecarga de responsabilidades:** Un único archivo gestiona dos casos de uso distintos (búsqueda de portal y formulario de registro de cliente). | Mantenibilidad y acoplamiento de lógica. |

---

## 4. Plan de Acción Frontend Paso a Paso (Roadmap de Refactorización)

### Fase 1: Limpieza de Código Zombie y Deprecación Definitiva
1. **Eliminar permanentemente** los archivos prototípicos obsoletos:
   * `frontend/src/pages/auth/RegisterPage.jsx` (eliminación de selectores de rol y dark mode residual).
   * `frontend/src/pages/auth/LoginPage.jsx` (eliminación de logins demo y dark mode residual).

### Fase 2: Desacoplamiento y Especialización de Vistas de Registro
1. **Crear `RegistroClientePortal.jsx` en `src/pages/auth/`:**
   * Componente enfocado al 100% en la ruta `/portal/:slug/registro`.
   * Carga el branding y nombre de la empresa mediante `api.get('/auth/portal/' + slug)`.
   * Formulario limpio y moderno en Light Mode estricto ("Sofisticación Sutil"):
     * Nombre y Apellidos
     * Correo electrónico
     * Teléfono / WhatsApp
     * Cédula de identidad (opcional)
     * Contraseña y Confirmar Contraseña
   * Sin selección de rol ni empresa. Despacha a `POST /api/auth/registro-cliente`.
2. **Crear `PortalRedirect.jsx` o adaptar `Registro.jsx` para `/registro`:**
   * Vista informativa de ayuda que orienta a los clientes a ingresar al portal de su empresa organizadora o buscarla por su slug.
   * Banner aclaratorio: "Los colaboradores de una empresa deben ingresar mediante la invitación que recibieron en su correo electrónico".

### Fase 3: Implementación del Módulo de Invitación de Empleados en el Dashboard
1. **Crear el componente `ModalInvitarColaborador.jsx` (o vista `ColaboradoresPage.jsx`):**
   * Accesible exclusivamente para el rol `Administrador` (1) desde el Dashboard o menú lateral.
   * Formulario con:
     * Correo electrónico del colaborador.
     * Selector restringido de rol permitido: Únicamente `Gerente (2)` o `Trabajador (3)` (prohibiendo Administrador y Super_Admin).
   * Conexión con el endpoint `POST /api/auth/invitar`.
   * Feedback visual mediante Toasts y alertas amigables confirmando el envío del correo vía `nodemailer`.

### Fase 4: Ajuste de Enlaces y Enrutamiento en `AppRoutes.jsx`
1. Actualizar las rutas en `frontend/src/routes/AppRoutes.jsx`:
   * `/portal/:slug/registro` → `RegistroClientePortal`
   * `/completar-registro` → `CompletarRegistro`
   * `/registro` → `PortalRedirect`
2. En `Login.jsx`, actualizar el texto del pie de página para reflejar con claridad el modelo SaaS (ej. "¿Eres cliente de un evento? Regístrate en el portal de tu empresa").
