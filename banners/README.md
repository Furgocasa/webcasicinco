# 🎨 Banners Publicitarios Casi Cinco para Furgocasa.com

Este directorio contiene banners HTML optimizados para SP Page Builder en Joomla, diseñados para promocionar **Casi Cinco** en **www.furgocasa.com**.

---

## 📦 Contenido de Banners

### 1. **Banner Hero Horizontal** (`banner-hero-horizontal.html`)
- **Tamaño**: 728x90px (responsive)
- **Uso**: Header superior, encima del contenido principal
- **Características**: 
  - Diseño horizontal limpio
  - CTA destacado a la derecha
  - Responsive para móviles
  - Hover con elevación

---

### 2. **Banner Vertical Sidebar** (`banner-vertical-sidebar.html`)
- **Tamaño**: 300x600px
- **Uso**: Sidebar lateral (derecha o izquierda)
- **Características**: 
  - 4 features destacadas con iconos
  - Estadísticas de lugares
  - Diseño vertical completo
  - Perfecto para columnas laterales

---

### 3. **Banner Cuadrado Medium Rectangle** (`banner-cuadrado-medium.html`)
- **Tamaño**: 300x250px
- **Uso**: Widgets, bloques de contenido
- **Características**: 
  - Efecto de estrellas animadas de fondo
  - Icono central animado (bounce)
  - Diseño compacto y llamativo
  - Badges de categorías

---

### 4. **Banner Leaderboard Full Width** (`banner-leaderboard-full.html`)
- **Tamaño**: 970x90px (responsive)
- **Uso**: Top de página, debajo del header principal
- **Características**: 
  - Ancho completo para máxima visibilidad
  - Múltiples features en línea
  - Icono pulsante animado
  - Responsive para tabletas y móviles

---

### 5. **Banner Mobile** (`banner-mobile.html`)
- **Tamaño**: 320x100px
- **Uso**: Footer móvil, sticky mobile banner
- **Características**: 
  - Optimizado para pantallas pequeñas
  - Diseño compacto
  - CTA claro y visible
  - Icono rotatorio animado

---

### 6. **Banner Premium Animado** (`banner-animated-premium.html`)
- **Tamaño**: 600x400px (responsive)
- **Uso**: Destacados especiales, home principal
- **Características**: 
  - Efecto de brillo animado
  - Grid de 3 features con hover
  - Estadísticas destacadas
  - CTA con animación de brillo
  - Diseño premium con glassmorphism

---

## 🚀 Instalación en Joomla con SP Page Builder

### Opción 1: Módulo HTML Personalizado

1. **Ir a** `Extensiones` → `Módulos` → `Nuevo`
2. **Seleccionar**: "Custom HTML"
3. **Configurar**:
   - **Título**: "Banner Casi Cinco - [Nombre del Banner]"
   - **Posición**: Elegir posición en tu template (ej: `sidebar-right`, `top`, `footer`)
   - **Estado**: Publicado
4. **En el editor HTML**: 
   - Cambiar a modo "Código fuente" o "HTML"
   - Copiar y pegar el contenido completo del archivo `.html`
5. **Asignación de menú**: Seleccionar en qué páginas mostrar
6. **Guardar**

### Opción 2: SP Page Builder (Recomendado)

1. **Editar página** con SP Page Builder
2. **Añadir nueva fila**
3. **Añadir columna**
4. **Añadir addon**: "Raw HTML" o "HTML Code"
5. **Pegar el código** del banner completo
6. **Ajustar ancho de columna**:
   - Hero Horizontal: 12/12 (full width)
   - Sidebar: 4/12 o 3/12
   - Medium Rectangle: 4/12 o 3/12
   - Leaderboard: 12/12 (full width)
   - Mobile: 12/12 (solo visible en móvil)
7. **Guardar y previsualizar**

### Opción 3: Artículo con HTML

1. **Crear nuevo artículo**
2. **Cambiar a modo HTML** en el editor
3. **Pegar el código** del banner
4. **Publicar** el artículo
5. **Mostrar** mediante módulo de artículo en posición deseada

---

## ✨ Características Destacadas en los Banners

### 🛣️ Planificador de Rutas IA
**La herramienta más diferencial de Casi Cinco está destacada en todos los banners:**
- Permite a los usuarios crear itinerarios personalizados
- Combina múltiples lugares en rutas optimizadas
- IA que sugiere los mejores recorridos
- **Presente en TODOS los banners con iconos y enlaces directos**

### Otras Features Destacadas
- 🤖 **Chat IA personalizado** - Recomendaciones inteligentes
- 🗺️ **Mapa interactivo** - Búsqueda por ubicación
- ⭐ **+3500 lugares verificados** - Solo +4.7★ en Google Maps

---

## 🎨 Personalización

### Cambiar Colores de Marca

Buscar en el código y reemplazar:
- **Azul oscuro**: `#063971` → Tu color
- **Amarillo**: `#ffd935` → Tu color
- **Azul muy oscuro**: `#042143` → Tu color

### Cambiar Textos

- **Tagline**: "Los mejores restaurantes, bares y hoteles + Planificador de Rutas IA"
- **CTA**: "Descubrir Ahora →", "Explorar Lugares →", etc.
- **Stats**: "+3500 lugares verificados"
- **Features**: Destacar siempre el Planificador de Rutas primero

### Cambiar URL de Destino

Reemplazar en todos los banners:
```html
href="https://www.casicinco.com?utm_source=furgocasa&utm_medium=banner&utm_campaign=NOMBRE_CAMPAÑA"
```

Parámetros UTM incluidos para tracking:
- `utm_source=furgocasa` → Fuente del tráfico
- `utm_medium=banner` → Medio publicitario
- `utm_campaign=NOMBRE_CAMPAÑA` → Identificador del banner específico

---

## 📊 Tracking y Analytics

Cada banner incluye parámetros UTM únicos:

| Banner | Campaign UTM |
|--------|-------------|
| Hero Horizontal | `horizontal_hero` |
| Vertical Sidebar | `vertical_sidebar` |
| Medium Rectangle | `medium_rectangle` |
| Leaderboard Full | `leaderboard_full` |
| Mobile | `mobile` |
| Premium Animated | `premium_animated` |

Estos parámetros se pueden rastrear en **Google Analytics** para medir el rendimiento de cada banner.

---

## 🎯 Mejores Prácticas

### Colocación Recomendada

1. **Hero Horizontal**: Header superior de todas las páginas
2. **Leaderboard**: Debajo del menú principal en home
3. **Sidebar Vertical**: Columna derecha en artículos de blog
4. **Medium Rectangle**: Dentro de artículos, entre párrafos
5. **Mobile**: Footer sticky en móviles
6. **Premium Animated**: Página de inicio destacado

### Frecuencia y Rotación

- **No saturar**: Máximo 2-3 banners por página
- **Rotar diseños**: Cambiar banners cada 2-3 semanas
- **A/B Testing**: Probar diferentes versiones y medir CTR

### Responsive

Todos los banners incluyen:
- Media queries para móviles
- Flexbox/Grid adaptativo
- Fuentes escalables
- Padding/margin responsive

---

## 🔧 Solución de Problemas

### El banner no se muestra

- ✅ Verificar que SP Page Builder esté actualizado
- ✅ Comprobar que JavaScript esté habilitado
- ✅ Revisar consola del navegador (F12) por errores

### Estilos CSS conflictivos

Si hay conflictos con el CSS del template:
1. Envolver todo el banner en un `<div class="casi-cinco-banner-wrapper">`
2. Añadir al inicio del `<style>`:
```css
.casi-cinco-banner-wrapper * {
    all: initial;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;
}
```

### Banners no responsive

- Verificar que el viewport meta tag esté presente en el `<head>` del sitio:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## 📞 Soporte

Para dudas o personalizaciones adicionales:
- **Web**: https://www.casicinco.com/contacto
- **Email**: contacto@casicinco.com

---

## 📝 Licencia

Estos banners son propiedad de **Casi Cinco** y están diseñados exclusivamente para uso promocional en **Furgocasa.com**.

**© 2025 Casi Cinco - Todos los derechos reservados**

---

## 🎉 Ejemplos de Uso

### Ejemplo 1: Banner en Sidebar de Blog

```html
<!-- En la columna sidebar de tu template -->
<div class="sidebar-widget">
    <!-- Pegar aquí el código de banner-vertical-sidebar.html -->
</div>
```

### Ejemplo 2: Banner Sticky Mobile

```html
<!-- Añadir al footer para móviles -->
<div id="mobile-sticky-banner" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; display: none;">
    <!-- Pegar aquí el código de banner-mobile.html -->
</div>

<script>
// Mostrar solo en móviles
if (window.innerWidth <= 768) {
    document.getElementById('mobile-sticky-banner').style.display = 'block';
}
</script>
```

### Ejemplo 3: Banner Rotativo con SP Page Builder

1. Crear 3 páginas/secciones diferentes
2. Añadir un banner distinto en cada una
3. Usar módulo de rotación de SP Page Builder
4. Configurar tiempo de rotación: 10-15 segundos

---

¡Listo para promocionar Casi Cinco en Furgocasa! 🚀⭐

