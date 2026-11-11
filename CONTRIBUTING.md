# Guía de Contribución — EVENTRA SaaS

¡Gracias por tu interés en contribuir a **EVENTRA**! Este documento establece las directrices de arquitectura, estándares de código, flujo de trabajo y políticas de seguridad para colaboradores y desarrolladores.

---

## 📋 Tabla de Contenidos

1. [Estándares de Código y Filosofía](#estándares-de-código-y-filosofía)
2. [Política Estricta de Seguridad y Privacidad](#política-estricta-de-seguridad-y-privacidad)
3. [Flujo de Trabajo Git y Commits](#flujo-de-trabajo-git-y-commits)
4. [Entorno de Desarrollo Local](#entorno-de-desarrollo-local)
5. [Ejecución de Pruebas Unitarias y de Integración](#ejecución-de-pruebas-unitarias-y-de-integración)
6. [Estructura del Proyecto](#estructura-del-proyecto)

---

## 🎨 Estándares de Código y Filosofía

EVENTRA se rige por la estética y ergonomía **"Sofisticación Sutil"**:
* **Arquitectura Limpia:** Separación estricta de responsabilidades entre controladores, servicios, rutas y middlewares.
* **Theming Dinámico:** Uso de tokens en variables CSS nativas (`--primary`, `--cream`, `--bg-main`, `--text-primary`) inyectadas en `:root`, asegurando soporte White-Label y alto contraste en modo claro.
* **Componentes React:** Funcionales, desacoplados, con hooks personalizados (`useAuth`, `useBranding`) y manejo resiliente de errores.

---

## 🔒 Política Estricta de Seguridad y Privacidad

Para proteger la integridad del proyecto y de los usuarios:

1. **PROHIBIDO Subir Secretos o Credenciales:**
   * Nunca agregues archivos `.env`, `.env.local` ni contraseñas reales al repositorio.
   * Utiliza exclusivamente variables de entorno leídas a través de `process.env` (Node.js) o `import.meta.env` (Vite).
2. **PROHIBIDO Incluir Datos Personales o Identificaciones Reales:**
   * No hardcodear números de cédula, RUCs reales, números de cuentas bancarias personales ni correos institucionales/personales.
   * Emplea siempre datos genéricos o de demostración (`admin@eventra.com`, `0011223344`, `1790011223001`).
3. **Autenticación y Autorización:**
   * Todas las rutas protegidas deben verificar el token JWT y validar el rol (`verifyToken`, `authorizeRoles`).
   * Las operaciones multi-tenant deben filtrar estrictamente por el `empresa_id` criptográficamente verificado en el token del usuario.

---

## 🌿 Flujo de Trabajo Git y Commits

Seguimos la convención de **Conventional Commits**:

| Prefijo | Propósito | Ejemplo |
| :--- | :--- | :--- |
| `feat:` | Nueva funcionalidad | `feat(branding): extractor de color real` |
| `fix:` | Corrección de error | `fix(auth): redirección correcta al login del tenant` |
| `docs:` | Actualizaciones de documentación | `docs: actualizar guía de despliegue` |
| `test:` | Adición o corrección de pruebas | `test(suscripciones): validación de cuotas` |
| `refactor:` | Refactorización sin cambio funcional | `refactor(services): optimizar consultas sql` |
| `chore:` | Tareas de mantenimiento o configuración | `chore: actualizar dependencias y gitignore` |

### Flujo de Ramas (Branching)
1. Crea una rama descriptiva a partir de `main`:
   ```bash
   git checkout -b feature/nombre-de-la-mejora
   ```
2. Realiza tus cambios asegurando que las pruebas pasen al 100%.
3. Abre un Pull Request hacia `main` con descripción clara del problema resuelto y pasos de verificación.

---

## 💻 Entorno de Desarrollo Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Alan-Cuenca/Eventra_Project.git
cd Eventra_Project
```

### 2. Configurar variables de entorno
* En `backend/`: copia `.env.example` a `.env` y completa las variables de base de datos y servicios.
* En `frontend/`: copia `.env.example` a `.env` (`VITE_API_URL=http://localhost:3000/api`).

### 3. Instalar dependencias e iniciar
```bash
# Backend
npm --prefix backend install
npm --prefix backend run dev

# Frontend
npm --prefix frontend install
npm --prefix frontend run dev
```

---

## 🧪 Ejecución de Pruebas Unitarias y de Integración

Antes de enviar cualquier cambio, ejecuta la suite de pruebas completa:

```bash
# Pruebas del Backend (Jest)
npm --prefix backend test

# Pruebas del Frontend (Node Test Runner)
npm --prefix frontend test

# Compilación de Producción (Vite)
npm --prefix frontend run build
```

Todas las suites deben pasar con éxito y sin advertencias críticas de compilación.
