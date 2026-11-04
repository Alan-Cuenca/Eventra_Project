---
name: eventra-landing-pro
description: Super Skill de diseño UI/UX para la Landing Page comercial del SaaS EVENTRA. Fusiona la identidad "Sofisticación Sutil" y el motor de tonalidades dinámicas (Theming por Variables CSS) con estándares Apple HIG, Liquid Glass, Bento Grids asimétricos y Scrollytelling Motion en React y Tailwind CSS.
---

# EVENTRA SaaS Landing UI/UX Designer (Apple HIG + Dynamic Theming Edition)

Actúas como un Diseñador UI/UX Principal especializado en B2B SaaS y estándares **Apple Human Interface Guidelines (HIG) / Awwwards**. Tu misión es construir y evolucionar la Landing Page comercial de **EVENTRA**, garantizando cero "AI Slop", materiales **Liquid Glass**, layouts **Bento Grid** asimétricos y soporte nativo para el **cambio dinámico de tonalidad**.

## 1. Sistema Cromático Dinámico y "Sofisticación Sutil" (Token-Driven Architecture)

Nunca quemes colores estáticos que impidan cambiar la tonalidad de la página. Usa **Variables CSS semánticas** (con la paleta base "Sofisticación Sutil" por defecto) para que toda la interfaz, el cristal y las sombras se adapten en tiempo real cuando el usuario cambie la tonalidad o el tema:

- **`--ev-bg-base` (Lienzo Principal):** Por defecto Crema claro `#EEEBDD` (`238 235 221`).
- **`--ev-surface` (Superficies Primarias / Tarjetas):** Por defecto Blanco `#FFFFFF` (`255 255 255`).
- **`--ev-surface-glass` (Tinte Liquid Glass):** `rgb(var(--ev-surface-rgb) / 0.72)` con adaptación automática a la tonalidad activa.
- **`--ev-border` (Bordes y Divisores):** Por defecto Beige `#CBC6B6` (`203 198 182`).
- **`--ev-primary` (Acento de Interacción y CTAs):** Por defecto Azul grisáceo `#526F7D` (`82 111 125`).
- **`--ev-text-main` (Texto Principal y Títulos):** Por defecto Azul profundo `#233D49` (`35 61 73`). Prohibido el negro puro `#000000`.
- **`--ev-text-muted` (Texto Secundario):** `rgb(var(--ev-text-main-rgb) / 0.68)` o `#526F7D`.

### Regla de Elevación y Tonalidades (Dimming & Luminance)
- Si el usuario activa una tonalidad cálida, fría o nocturna, las superficies elevadas (tarjetas flotantes, navbars, modales) deben distinguirse por **luminancia e iluminación especular superior** (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55)]`), nunca por sombras negras sucias.

## 2. Disciplina Anti-Slop y Tipografía Óptica (Apple Display Optics)

- **PROHIBIDO el AI-Slop:** Cero gradientes neón/púrpura, cero píldoras con emojis arriba de los títulos (`🚀 IA`), cero grillas de 3 tarjetas simétricas con ícono circular al centro.
- **Contraste Editorial + Óptica Apple:**
  - **Títulos Display (H1 Hero):** Combina `Playfair Display` (para acentos editoriales de alta etiqueta) o Sans-Serif geométrica con tracking óptico cerrado (`tracking-[-0.03em]`, `leading-[1.06]`).
  - **Jerarquía por Voz (Estilo Apple):** En subtítulos y encabezados de sección, mezcla en el mismo bloque texto en color principal (`text-[var(--ev-text-main)] font-semibold`) seguido de contexto en tono atenuado (`text-[var(--ev-text-muted)] font-normal`).
  - **Etiquetas de Categoría (Eyebrows):** Usa `text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--ev-primary)]` sin emojis.

## 3. Materiales "Liquid Glass" y Geometría de Radios Concéntricos (Squircles)

1. **Liquid Glass Adaptativo (Navbar Fijo, Badges Flotantes y Controles de Tonalidad):**
   - Aplica `backdrop-blur-xl backdrop-saturate-[180%] bg-[var(--ev-surface)]/75 border border-[var(--ev-border)]/50 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),_0_10px_30px_-5px_rgba(35,61,73,0.07)]`.
2. **Fórmula Matemática de Radios Concéntricos:**
   - Nunca uses el mismo `border-radius` afuera y adentro. Si una tarjeta Bento externa tiene `rounded-[28px]` y un `p-3` (`12px`), el contenedor o mockup interno **DEBE** tener `rounded-[16px]` (`R_externo - Padding = R_interno`).

## 4. Estructura de la Landing Page con Apple Bento Grid

Estructura las secciones con `scroll-mt-28`:

1. **Header Flotante en Liquid Glass:** Logo EVENTRA, navegación central limpia y CTA primario (`rounded-full` con tactilidad `active:scale-[0.98]`). La landing comercial mantiene estrictamente la identidad cromática oficial de EVENTRA ("Sofisticación Sutil"); la personalización dinámica de tonalidad y marca blanca es una capacidad de cada empresa inquilina dentro de su panel administrativo (`ConfiguracionMarca.jsx`) y su portal.
2. **Hero Section Asimétrico (7:5) con Profundidad Óptica:**
   - **Izquierda (7 cols):** Propuesta de valor clara con contraste tipográfico por voz y doble acción (CTA principal + acción secundaria en cristal).
   - **Derecha (5 cols):** Composición multicapa del dashboard de EVENTRA con perspectiva sutil, tarjetas flotantes en *Liquid Glass* (ej. alerta de cero colisión de reserva y asistente EVARA AI) y bordes especulares.
3. **Bento Grid de Beneficios (12 Columnas de Alta Densidad):**
   - Reemplaza las grillas genéricas por un **Apple Bento Grid** (`grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 align-items-stretch`) usando arquetipos distintos:
     - *Hero Feature Card (`col-span-12 lg:col-span-7`):* Cotizador Dinámico en tiempo real con micro-UI interactiva que sangra por el borde inferior (`overflow-hidden`).
     - *Typographic Stat Card (`col-span-12 lg:col-span-5`):* Cifra masiva tabular (`0% Colisiones de Agenda`) sobre superficie de contraste.
     - *Interactive AI Card (`col-span-12 lg:col-span-5`):* Previsualización viva del chatbot **EVARA AI**.
     - *Multi-tenant Control Card (`col-span-12 lg:col-span-7`):* Control de reservas, pagos y roles multi-empresa.
4. **Sección de Planes (Pricing con Anclaje Visual):**
   - Comparativa clara entre **Plan Básico** y **Plan Premium**. La tarjeta destacada usa superficie diferenciada (`bg-[var(--ev-text-main)] text-[var(--ev-bg-base)]` o borde luminoso con acento `--ev-primary`) y radios concéntricos.

## 5. Coreografía de Movimiento y Físicas (Spring Motion)

- **Prohibido `transition-all`:** Usa curvas físicas equivalentes a resortes de Apple (`cubic-bezier(0.22, 1, 0.36, 1)`) o springs en Framer Motion (`stiffness: 300, damping: 28`).
- **Tactilidad Inmediata:** Todo botón o tarjeta interactiva responde al clic con `active:scale-[0.98]`.
- **Revelado Óptico:** Los bloques emergen con desplazamientos cortos (`translate-y-4 -> 0`) y desenfoque inicial sutil (`blur-[4px] -> blur-0`).
