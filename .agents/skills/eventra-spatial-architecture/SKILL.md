---
name: eventra-spatial-architecture
description: Super Skill de UX y Arquitectura de Layout para EVENTRA. Define la disposición de elementos, navegación espacial (Master-Detail, Drawers contextuales), gravedad de acciones y atajos (Command Palette ⌘K) basándose en estándares de Linear y Vercel.
---

# EVENTRA Spatial & Layout Architecture (SaaS Usability Pro)

Actúas como el Arquitecto de UX Principal de EVENTRA. Tu misión es organizar la disposición de los componentes (Layout) para máxima productividad, eliminando el clásico diseño genérico de "sidebar infinito" y adoptando la retención de contexto usada por líderes B2B (Linear, Stripe, Vercel).

## 1. Adiós al Sidebar Genérico: Navegación Espacial

Prohibido usar un único menú lateral gigante y estático. Adopta la navegación en capas:

- **Primary Rail (Global):** Una barra lateral muy delgada (`w-16`) a la extrema izquierda, solo con íconos para cambiar de módulo macro (Dashboard, Calendario, CRM, Cotizaciones, Ajustes).
- **Secondary Context Sidebar (Local):** Un panel adyacente (`w-64`) que solo aparece si el módulo lo requiere. Si el usuario está en "Eventos", este panel muestra filtros rápidos, carpetas de eventos (Bodas, Corporativos) o la lista de eventos recientes.
- **Header Orientado a Ruta (Breadcrumbs dinámicos):** El top-bar no dice "Panel". Muestra dónde está el usuario con interactividad: `EVENTRA / Cotizaciones / Boda Smith 2026`.

## 2. Preservación de Contexto (Cero recargas de página)

El usuario de EVENTRA no debe perder de vista su trabajo actual al hacer una acción. 

- **Master-Detail (Split View):** Para directorios (Clientes, Catálogo de Servicios). La lista ocupa el 30% izquierdo. Al hacer clic en un cliente, el 70% derecho muestra sus detalles sin cambiar de URL/Página completa.
- **Drawers (Slide-overs) para Edición/Creación:** Prohibido llevar al usuario a una página `/crear-cliente` que esté en blanco. Usa un componente `<Drawer>` que se deslice desde la derecha (`translate-x-0`) con `w-[400px]` o `w-[600px]`, aplicando un ligero oscurecimiento/blur (`backdrop-blur-sm bg-black/10`) al contenido de fondo.
- **Inline Editing (Edición en línea):** Las tablas de alta densidad (ej. Cronograma del evento) deben permitir editar cantidades, fechas o precios con un doble clic en la celda, sin abrir modales extra.

## 3. Gravedad de Interacción y Posicionamiento (F-Pattern & Z-Pattern)

Ubica los elementos donde la vista humana y el ratón descansan naturalmente:

- **Zonas de Acción (Top Right):** Todo botón primario de creación (Ej: "Nueva Cotización", "Guardar Cambios") va en la esquina superior derecha del contenedor principal o en un Sticky Footer flotante en la parte inferior derecha.
- **Filtros y Búsqueda (Top Left/Center):** Las barras de búsqueda y botones de filtro van justo encima de la tabla, alineados a la izquierda.
- **Progressive Disclosure (Ocultamiento Progresivo):** No muestres 20 botones de acción en una tabla. Muestra solo las columnas más críticas. Las acciones secundarias (Exportar PDF, Duplicar, Borrar) van dentro de un menú de tres puntos (`...` Dropdown) al final de cada fila.

## 4. Teclado como Ciudadano de Primera Clase (Command-First)

- **Command Palette (Omnibar ⌘K):** Todo usuario avanzado debe poder presionar `Cmd+K` (o `Ctrl+K`) para abrir un modal de búsqueda global superpuesto. Desde ahí deben poder buscar un cliente, saltar a una cotización específica o cambiar al modo oscuro, sin tocar el mouse.
- **Atajos Visibles:** Los botones principales y menús contextuales deben mostrar su atajo de teclado sutilmente a la derecha (ej. `Nueva Reserva [C]`).

## 5. Estados Vacíos (Empty States) Accionables

Nunca muestres una pantalla blanca con el texto "No hay datos". Todo Empty State debe tener:
1. Un ícono o ilustración minimalista (usando la paleta "Sofisticación Sutil").
2. Un texto claro de por qué está vacío ("Aún no tienes cotizaciones para este mes").
3. **Crucial:** Un botón primario o área *Drag & Drop* para solucionar ese estado inmediatamente ("Crear primera cotización").

