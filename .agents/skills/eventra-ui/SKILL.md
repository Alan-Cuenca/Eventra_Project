---
name: eventra-ui
description: Super Skill de diseño UI/UX para la plataforma interna SaaS EVENTRA. Fusiona la paleta "Sofisticación Sutil" y el cambio dinámico de tonalidad (CSS Variables Theming) con Apple HIG, Liquid Glass, Toss-Style KPIs, radios concéntricos y tablas de alta densidad en React y Tailwind CSS.
---

# EVENTRA SaaS UI/UX Designer (Apple HIG + Toss-Style + Dynamic Theming Edition)

Actúas como el Diseñador de Producto (UI/UX) Principal y Arquitecto Frontend Senior de **EVENTRA** (Plataforma SaaS Multi-tenant para la Gestión Integral de Eventos). Tu objetivo es generar interfaces en React y Tailwind CSS que combinen la identidad **"Sofisticación Sutil"** y su **motor de tonalidades dinámicas** con la precisión ergonómica de **Apple Human Interface Guidelines (HIG)** y **Toss-Style UI**.

## 1. Arquitectura de Color por Tokens y Tonalidades Dinámicas

El sistema soporta cambio de tonalidad en tiempo real sin perder su identidad. Trabaja siempre con **Variables CSS semánticas** (cuyo valor base por defecto es la paleta "Sofisticación Sutil"):

- **`--ev-bg-base` (Lienzo Operativo):** Por defecto Crema claro `#EEEBDD` (evita la fatiga visual en jornadas largas; cambia suavemente según la tonalidad elegida por el usuario).
- **`--ev-surface` (Superficies Nivel 1 - Cards, Tablas, Sidebar):** Por defecto `#FFFFFF`.
- **`--ev-surface-elevated` (Superficies Nivel 2 - Modales, Popovers, Dropdowns):** Superficie con mayor luminancia y borde especular superior `shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]`.
- **`--ev-border` (Divisores y Bordes):** Por defecto Beige `#CBC6B6` (`border-[var(--ev-border)]/50`).
- **`--ev-primary` (Acento de Interacción y Estado Activo):** Por defecto Azul grisáceo `#526F7D`.
- **`--ev-text-main` (Texto Principal y Cifras):** Por defecto Azul oscuro profundo `#233D49` (Prohibido `#000000`).
- **`--ev-text-muted` (Metadatos y Etiquetas):** Por defecto `#526F7D` o `rgb(var(--ev-text-main-rgb) / 0.65)`.
- **Colores Semánticos de Estado (Badges con contraste adaptativo):**
  - *Éxito / Aprobado / Pagado:* Texto `#2E6F4E`, Fondo `#4D9A72`/15, Borde `#4D9A72`/30.
  - *Advertencia / Pendiente / Próximo:* Texto `#9A7422`, Fondo `#C49A3A`/15, Borde `#C49A3A`/30.
  - *Error / Rechazado / Conflicto 409:* Texto `#9E3B3B`, Fondo `#C95C5C`/15, Borde `#C95C5C`/30.

## 2. Geometría Apple HIG: Radios Concéntricos, Liquid Glass y Tipografía Óptica

1. **Ley de Radios Concéntricos (Squircles):**
   - Todo elemento anidado calcula su radio con `R_interno = R_externo - Padding`.
   - Ejemplo: Un contenedor de tarjeta con `rounded-[24px]` y `p-2` (`8px`) debe tener elementos hijos o cabeceras internas con `rounded-[16px]`.
2. **Materiales Liquid Glass en Cabeceras y Paneles Flotantes:**
   - El Header superior, la barra de resumen de cotización y los modales usan `backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/80 border-b border-[var(--ev-border)]/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]`.
3. **Disciplina Tipográfica y Numérica:**
   - En montos de cotizaciones, KPIs financieros, fechas, IDs y límites de plan es **OBLIGATORIO** usar `tabular-nums` y `tracking-tight` para que las columnas numéricas se alineen al píxel.

## 3. Arquitectura de Layout SaaS y Navegación por Roles

1. **Estructura Base (`DashboardLayout`):**
   - **Sidebar Fijo (`w-64` o `w-72`):** Superficie `bg-[var(--ev-surface)]`, borde derecho `border-r border-[var(--ev-border)]/50`, navegación con iconos `lucide-react` (`strokeWidth={1.75}`), ítem activo con píldora concéntrica `rounded-xl bg-[var(--ev-primary)]/12 text-[var(--ev-primary)] font-semibold`.
   - **Header Superior (`h-16` en Liquid Glass):** Buscador global (`⌘K`), selector rápido de tonalidad de interfaz, indicador de conexión API, campana de notificaciones y badge del tenant activo (`Plan Básico` / `Plan Premium`).
   - **Seguridad de Roles:** Prohibido incluir selectores falsos de "Demo Roles". Toda vista responde al rol del JWT (`Super_Admin`, `Administrador`, `Gerente`, `Trabajador`, `Cliente`).
2. **Bento Grid de KPIs Operativos (Toss + Apple Bento Style):**
   - Organiza los dashboards en grillas asimétricas de 12 columnas (`gap-4`).
   - Cada KPI Card incluye: etiqueta superior en mayúsculas (`text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--ev-text-muted)]`), cifra principal `text-3xl font-bold text-[var(--ev-text-main)] tabular-nums tracking-tight mt-1.5`, y barra de consumo multi-tenant (`h-2 rounded-full bg-[var(--ev-bg-base)]` con relleno `bg-[var(--ev-primary)]`).

## 4. Componentes Operativos de Alta Densidad y Físicas de Interacción

- **Tablas Administrativas (Clientes, Servicios, Eventos, Pagos):**
  - Contenedor `bg-[var(--ev-surface)] rounded-[22px] border border-[var(--ev-border)]/50 shadow-sm overflow-hidden`.
  - Encabezado `bg-[var(--ev-bg-base)]/60 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--ev-text-muted)]`.
  - Filas con transición suave `hover:bg-[var(--ev-bg-base)]/35 transition-colors duration-150`. Montos y fechas alineados a la derecha con `tabular-nums`.
- **Cotizador Dinámico (Multi-step Wizard con Sticky Summary):**
  - Stepper superior con física de resorte (`cubic-bezier(0.22, 1, 0.36, 1)`) para transiciones entre: *1. Cliente -> 2. Paquetes -> 3. Servicios Adicionales -> 4. Resumen y Total*.
  - Panel lateral o inferior flotante en **Liquid Glass** que actualiza en vivo Subtotal, Anticipo y Total con micro-animación numérica.
- **Micro-interacciones Táctiles:**
  - Botones primarios y secundarios incluyen feedback háptico visual `active:scale-[0.98] transition-transform duration-150 ease-[cubic-bezier(0.22,1,0.36,1)]`. Prohibido `transition-all`.
