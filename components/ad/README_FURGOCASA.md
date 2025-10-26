# 🚐 Banner Furgocasa - Sistema de Publicidad Dinámica

Sistema de banners rotativos para publicidad de Furgocasa Campervans integrado en Casi5 App.

## 📦 Componente Principal

`components/ad/FurgocasaBanner.tsx`

## 🎨 Orientaciones Disponibles

### 1. **Horizontal** (Por defecto)
Banner ancho integrado en el contenido. Ideal para blog posts y secciones de contenido.

```tsx
<FurgocasaBanner 
  variant="blog"
  orientation="horizontal"
  location="Madrid"
  placeName="Mejores Restaurantes de Madrid"
  autoRotate={true}
  rotateInterval={8000}
/>
```

**Características:**
- Imagen a la izquierda (40% ancho)
- Contenido a la derecha (60% ancho)
- 2 CTAs horizontales
- Dots de navegación en la parte inferior
- Responsive: se apila verticalmente en móvil

---

### 2. **Vertical** (Tarjeta completa)
Banner tipo tarjeta vertical. Ideal para sidebars o secciones destacadas.

```tsx
<FurgocasaBanner 
  variant="place"
  orientation="vertical"
  location="Andalucía"
  placeName="Alhambra de Granada"
  autoRotate={true}
  rotateInterval={8000}
/>
```

**Características:**
- Imagen superior (100% ancho)
- Logo superpuesto en la imagen
- Contenido debajo con CTAs apilados verticalmente
- Dots verticales en el lateral derecho
- Máximo 400px de ancho, centrado

---

### 3. **Sidebar** (Fijo lateral)
Banner compacto fijo en el lateral derecho. Solo visible en desktop (>1024px).

```tsx
<FurgocasaBanner 
  variant="place"
  orientation="sidebar"
  location="Costa del Sol"
  placeName="Hotel Marbella Club"
  autoRotate={true}
  rotateInterval={10000}
/>
```

**Características:**
- Fixed position (top: 96px, right: 16px)
- Ancho fijo: 288px (lg) / 320px (xl)
- Imagen superior compacta
- 1 CTA principal
- Dots horizontales mini
- No visible en tablet/móvil

---

## 🔄 Variantes de Contenido Dinámico

El banner rota automáticamente entre 4 variantes de mensajes:

1. **Freedom** - Enfoque en libertad y exploración
2. **Lifestyle** - Enfoque en hogar sobre ruedas
3. **Murcia** - Enfoque en recogida desde Murcia
4. **Experience** - Enfoque en experiencia personalizada

Las variantes se configuran en el array `BANNER_VARIANTS` dentro del componente.

---

## 📍 Integración por Secciones

### **Blog Posts** ✅ IMPLEMENTADO
```tsx
// components/blog/BlogPostContent.tsx (línea ~112)
<FurgocasaBanner 
  variant="blog"
  orientation="horizontal"
  location={post.location || 'España'}
  placeName={post.title}
/>
```

### **Páginas de Lugares** ✅ IMPLEMENTADO (Responsive)
```tsx
// components/places/PlaceContent.tsx (línea ~308, después de Highlights)

// Detecta automáticamente el tamaño de pantalla:
// - Móvil (<768px): Banner VERTICAL optimizado
// - Desktop (≥768px): Banner HORIZONTAL con más espacio

<FurgocasaBanner 
  variant="place"
  orientation={isMobile ? "vertical" : "horizontal"}  // 🔄 Dinámico
  location={place.province || place.city}
  placeName={place.name}
  autoRotate={true}
  rotateInterval={10000}
/>
```

**Beneficios:**
- 📱 Mejor experiencia en móvil con banner vertical dedicado
- 💻 Aprovecha el espacio horizontal en desktop
- 🔄 Cambia automáticamente al redimensionar ventana

### **Home** (Pendiente)
```tsx
// app/(public)/page.tsx (sección intermedia)
<FurgocasaBanner 
  variant="home"
  orientation="horizontal"
  location="España"
  autoRotate={true}
  rotateInterval={10000}
/>
```

### **Sidebar en Artículos** (Opcional)
```tsx
// Para artículos largos con espacio lateral
<FurgocasaBanner 
  variant="blog"
  orientation="sidebar"
  location="Región"
  placeName="Artículo"
/>
```

---

## 🎯 Props del Componente

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `variant` | `'blog' \| 'place' \| 'home'` | `'blog'` | Contexto donde aparece el banner (para analytics) |
| `orientation` | `'horizontal' \| 'vertical' \| 'sidebar'` | `'horizontal'` | Orientación visual del banner |
| `location` | `string` | `'España'` | Ubicación geográfica (se inserta en headlines dinámicos) |
| `placeName` | `string` | `undefined` | Nombre del lugar específico (opcional) |
| `autoRotate` | `boolean` | `true` | Activar rotación automática de variantes |
| `rotateInterval` | `number` | `8000` | Intervalo de rotación en milisegundos |

---

## 📊 Analytics y Tracking

El banner envía eventos a Google Analytics mediante el sistema interno:

### Eventos trackeados:
- **`furgocasa_ad_click`** - Click en CTA principal o secundario
- **`furgocasa_ad_close`** - Usuario cierra el banner
- **`furgocasa_ad_navigation`** - Usuario cambia manualmente de variante

### Parámetros UTM automáticos:
```
utm_source=casicinco
utm_medium={variant}_banner_{orientation}
utm_campaign={banner_variant_id}
```

Ejemplo:
```
https://www.furgocasa.com?utm_source=casicinco&utm_medium=blog_banner_horizontal&utm_campaign=freedom
```

---

## 🖼️ Imágenes Utilizadas

Ubicación: `/public/images/furgocasa/`

- `2019.02.23_1912.JPG` - Camper frente a castillo
- `AdobeStock_136414223.jpeg` - Lifestyle verano con vistas
- `LOGO BLANCO_500.png` - Logo blanco para fondos oscuros

---

## 🎨 Diseño y Colores

### Gradientes:
```css
from-orange-500 via-red-500 to-orange-600  /* Horizontal/Vertical */
from-orange-600 via-red-600 to-orange-700  /* Alternativa más intensa */
```

### CTAs:
- **Primario**: Blanco con texto naranja (`bg-white text-orange-600`)
- **Secundario**: Borde blanco con texto blanco (`border-white text-white`)

### Transiciones:
- Fade entre variantes: 300ms
- Cambio de imagen: 500ms
- Hover effects: instant con scale

---

## 🔧 Personalización Rápida

### Cambiar intervalo de rotación:
```tsx
<FurgocasaBanner rotateInterval={12000} /> // 12 segundos
```

### Deshabilitar rotación:
```tsx
<FurgocasaBanner autoRotate={false} />
```

### Añadir nueva variante de mensaje:
```typescript
// En components/ad/FurgocasaBanner.tsx, línea ~26
const BANNER_VARIANTS: BannerVariant[] = [
  // ... existentes
  {
    id: 'nueva_variante',
    image: '/images/furgocasa/nueva_imagen.jpg',
    headline: 'Tu nuevo headline [LOCATION]',
    subheadline: 'Descripción atractiva...',
    cta: 'Botón de Acción',
    badge: '🎉 Oferta Especial',
    icon: 'compass'
  }
];
```

---

## 📱 Responsive Breakpoints

- **Mobile** (< 768px): Banner apilado verticalmente
- **Tablet** (768px - 1023px): Banner horizontal compacto
- **Desktop** (>= 1024px): Banner horizontal completo
- **Desktop XL** (>= 1280px): Sidebar disponible

---

## ✅ Checklist de Implementación

- [x] Componente base creado
- [x] 3 orientaciones (horizontal, vertical, sidebar)
- [x] 4 variantes de contenido dinámico
- [x] Sistema de rotación automática
- [x] Tracking de analytics completo
- [x] Integrado en blog posts
- [ ] Integrado en páginas de lugares
- [ ] Integrado en home
- [ ] A/B testing de variantes
- [ ] Métricas de conversión

---

## 🚀 Próximas Mejoras

1. **Geolocalización inteligente**: Mostrar variantes según provincia del usuario
2. **Horarios específicos**: Banners diferentes según hora del día
3. **Estacionalidad**: Mensajes adaptados a temporada (verano/invierno)
4. **Retargeting**: Ocultar banner si ya hizo click (localStorage)
5. **A/B testing visual**: Variantes de diseño y colores

---

## 📞 Soporte

Para cambios en el banner o nuevas variantes, contactar con el equipo de desarrollo de Casi5.

**Furgocasa Campervans**: https://www.furgocasa.com
**Casi5 App**: https://casicinco.com

---

*Última actualización: 25 Octubre 2025*

