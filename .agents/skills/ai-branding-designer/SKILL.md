---
name: ai-branding-designer
description: Skill Maestra de Diseño de Marca Blanca (White-Label) para EVENTRA SaaS. Fusiona la calidez y tradición de Helados La Catedral con la distinción y Liquid Glass de Eventos Imperial bajo las reglas de Sofisticación Sutil.
---

# Skill Maestra de Diseño de Marca Blanca: `ai-branding-designer`
> **EVENTRA SaaS White-Label AI Design System**  
> Fusión armónica de los perfiles de identidad corporativa: **Helados La Catedral** (Tradición, Calidez, Tonos Crema/Marfil) y **Eventos Imperial** (Lujo, Distinción, Perla/Malva, Liquid Glass).

---

## 1. Manifiesto de Diseño ("Sofisticación Sutil")

El sistema de diseño de EVENTRA transforma la identidad visual de cualquier empresa inquilina en una experiencia de usuario de nivel de clase mundial (Apple Human Interface Guidelines & Minimalismo Anthropic). 

La IA generadora de temas analiza el logotipo corporativo y sintetiza una paleta cromática equilibrada y una arquitectura de componentes basada en tokens, garantizando legibilidad, serenidad visual y elegancia.

---

## 2. Reglas Cromáticas Estrictas (Tokens Fundamentales)

Toda paleta generada a partir del logotipo debe responder estrictamente a 5 claves esenciales en formato JSON:

```json
{
  "bg": "#F5F2EB",
  "surface": "#FFFFFF",
  "border": "#DDD7C8",
  "primary": "#4D7182",
  "text": "#1E2A32"
}
```

### 2.1. Fondo (`bg`) — Marfil / Crema / Perla Ultra Claro
- **Directriz:** Tonos perla, marfil o crema ultra claros y desaturados.
- **Regla inviolable:** **NUNCA blanco puro (`#FFFFFF`)**. El fondo debe poseer una calidez orgánica sutil (luminosidad 95% - 98%, saturación < 15%) inspirada en el tinte del logo para evitar fatiga ocular en jornadas de gestión prolongadas.
- **Inspiración:**
  - *La Catedral:* `#F6EAE4` (Crema cálido con tinte terracota/vainilla).
  - *Imperial:* `#EEE9F6` (Perla translúcido con sutil reflejo malva/lavanda).

### 2.2. Superficie (`surface`) — Pureza y "Liquid Glass"
- **Directriz:** Siempre `#FFFFFF` para tarjetas, contenedores y paneles de contenido.
- **Efecto Liquid Glass:** En cabeceras (`Header`), barras de navegación y modales flotantes, se aplica un efecto de vidrio translúcido con dispersión difusa:
  ```css
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border-bottom: 1px solid var(--brand-border);
  ```

### 2.3. Bordes (`border`) — Delicadeza Estructural
- **Directriz:** Tonos neutros o apastelados muy suaves derivados del logotipo.
- **Regla:** Delimita la jerarquía sin generar ruido visual ni rigidez. Relación de contraste armónica contra `bg` (1.3:1 a 1.8:1).
- **Inspiración:** `#DDD7C8` (Beige catedralino neutro) o `#C6B7DE` (Malva suave satinado).

### 2.4. Primario (`primary`) — Acento Icónico Noble
- **Directriz:** El color más emblemático del logotipo, calibrado para interfaces digitales.
- **Regla:** **Prohibidos colores neón o sobresaturados**. Si el logo tiene un tono estridente, debe moderarse hacia una tonalidad noble y profesional que cumpla contraste mínimo WCAG AA (>= 4.5:1) sobre fondos claros y blancos.
- **Uso:** Botones de llamada a la acción (CTA), estados activos, indicadores de progreso y badges destacados.

### 2.5. Texto (`text`) — Alto Contraste y Máxima Legibilidad
- **Directriz:** Índigo oscuro o gris carbón profundo, tintado delicadamente con el color de la marca.
- **Regla inviolable:** **ESTRICTAMENTE PROHIBIDO el negro absoluto (`#000000` / `#000`)**. El texto debe tener matiz orgánico para una lectura suave y tipografía nítida con contraste >= 7:1 (nivel AAA).

---

## 3. Arquitectura de Interfaz y Tokens UI

1. **Radios Amplios (`rounded-2xl`):**
   - Tarjetas, formularios y contenedores principales utilizan un radio de `16px` (`rounded-2xl`), transmitiendo modernidad, ergonomía y cercanía.
   - Botones e inputs utilizan `rounded-xl` (`12px`).
2. **Sombras de Dispersión Suaves:**
   - Cero sombras oscuras o pesadas.
   - `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.02);`
3. **Mapeo de Variables CSS Inyectadas en `:root`:**
   ```css
   --brand-bg: [bg];
   --brand-surface: [surface];
   --brand-border: [border];
   --brand-primary: [primary];
   --brand-text: [text];
   --brand-primary-hover: [primary oscurecido 12%];
   --brand-primary-light: [primary aclarado 80%];
   ```

---

## 4. Paleta Completa del Logo (arquitectura híbrida)

El tema ya no se construye con un solo color. El motor `paletteEngine.js` (copias idénticas en `backend/src/utils/` y `frontend/src/utils/`, deben mantenerse sincronizadas):

1. **Extrae todos los colores reales** del logo (k-means en OKLab, máx. 8), descarta el fondo neutro detectado en los bordes y guarda su presencia en `logoColors`.
2. **Asigna roles** `primary`, `secondary`, `accent` y `text`. La IA (Gemini → GPT-4o) solo elige entre los HEX detectados; cualquier color inventado se descarta. Sin IA, la asignación es algorítmica.
3. **Calibra** cada rol: primario ≥ 4.5:1 contra blanco, secundario/acento ≥ 3:1, texto ≥ 7:1 contra `bg`, croma limitada (sin neón).

Además de los 5 tokens base, el tema incluye `secondary`, `secondaryHover`, `secondaryLight`, `accent`, `accentLight` y `logoColors`, inyectados como `--secondary`, `--secondary-light`, `--accent`, `--accent-light`, `--brand-secondary` y `--brand-accent`.

El prompt vigente está en `SYSTEM_PROMPT` de `backend/src/services/aiBrandingService.js`.

