# 📊 Guía de Implementación de Tracking de Analytics

## ✅ YA IMPLEMENTADO:
- ✅ Tabla `user_analytics` en Supabase
- ✅ Helper `trackEvent()` en `lib/analytics/tracker.ts`
- ✅ Endpoint `/api/analytics/track`
- ✅ Componente `PageViewTracker` para vistas automáticas

---

## 📝 DÓNDE AÑADIR EL TRACKING

### **1. En `app/layout.tsx` (Tracking global de páginas)**

```typescript
import PageViewTracker from '@/components/PageViewTracker';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PageViewTracker /> {/* ← AÑADIR AQUÍ */}
        {children}
      </body>
    </html>
  );
}
```

---

### **2. En `app/(public)/mapa/page.tsx` (Tracking del mapa)**

#### **A. Añadir import:**
```typescript
import { trackEvent, EVENTS, CATEGORIES } from '@/lib/analytics/tracker';
```

#### **B. En la función que maneja click de marcador (buscar handleMarkerClick o similar):**
```typescript
const handleMarkerClick = (place) => {
  // 🎯 AÑADIR TRACKING
  trackEvent(EVENTS.MAP_MARKER_CLICK, CATEGORIES.MAP, {
    place_id: place.id,
    place_name: place.name,
    place_category: place.category,
    filters_active: filters,
    results_visible: filteredPlaces.length,
    zoom_level: mapRef.current?.getZoom()
  });
  
  // ... código existente ...
  setSelectedPlace(place);
};
```

#### **C. En el botón "Ver detalles" del mapa:**
```typescript
<Button onClick={() => {
  // 🎯 AÑADIR TRACKING
  trackEvent(EVENTS.PLACE_DETAIL_CLICK, CATEGORIES.ENGAGEMENT, {
    place_id: selectedPlace.id,
    source: 'map',
    filters_active: filters,
    results_visible: filteredPlaces.length,
    result_position: filteredPlaces.findIndex(p => p.id === selectedPlace.id) + 1
  });
  
  router.push(`/${selectedPlace.category}/${selectedPlace.province}/${selectedPlace.slug}`);
}}>
  Ver detalles
</Button>
```

---

### **3. En `components/mobile/BottomSheet.tsx` (Tracking filtros móvil)**

#### **A. Añadir state para tracking:**
```typescript
const [filterOpenTime, setFilterOpenTime] = useState(0);
const [filterChangesCount, setFilterChangesCount] = useState(0);
```

#### **B. Cuando abre filtros:**
```typescript
const handleOpen = () => {
  setShowFilters(true);
  setFilterOpenTime(Date.now());
  setFilterChangesCount(0);
};
```

#### **C. Cada cambio de filtro:**
```typescript
const handleFilterChange = (newFilters) => {
  setFilters(newFilters);
  setFilterChangesCount(prev => prev + 1);
};
```

#### **D. Cuando cierra filtros (botón X):**
```typescript
const handleClose = () => {
  // 🎯 TRACKEAR al cerrar
  if (Object.keys(filters).length > 0) {
    trackEvent(EVENTS.MOBILE_FILTER_CLOSE, CATEGORIES.SEARCH, {
      filters: filters,
      results_count: filteredPlaces.length,
      filter_changes_made: filterChangesCount,
      time_spent_ms: Date.now() - filterOpenTime
    });
  }
  
  setShowFilters(false);
};
```

---

### **4. En páginas de lugar (ejemplo: `app/(public)/restaurante/[province]/[slug]/page.tsx`)**

#### **A. Importar:**
```typescript
import { trackEvent, EVENTS, CATEGORIES } from '@/lib/analytics/tracker';
```

#### **B. Al cargar página (ya se hace con PageViewTracker, pero añadir datos de lugar):**
```typescript
useEffect(() => {
  trackEvent(EVENTS.PLACE_VIEW, CATEGORIES.ENGAGEMENT, {
    place_id: place.id,
    place_name: place.name,
    place_category: place.category,
    came_from: document.referrer.includes('casicinco.com') ? 'internal' : 'external'
  });
}, [place.id]);
```

#### **C. En botón de teléfono:**
```typescript
<a 
  href={`tel:${place.phone}`}
  onClick={() => {
    // 🎯 TRACKEAR antes de que llame
    trackEvent(EVENTS.PLACE_PHONE_CLICK, CATEGORIES.CONVERSION, {
      place_id: place.id,
      place_name: place.name
    });
  }}
>
  📞 {place.phone}
</a>
```

#### **D. En botón "Cómo llegar":**
```typescript
<a 
  href={place.google_maps_url}
  target="_blank"
  onClick={() => {
    // 🎯 TRACKEAR antes de abrir Google Maps
    trackEvent(EVENTS.PLACE_DIRECTIONS_CLICK, CATEGORIES.CONVERSION, {
      place_id: place.id,
      place_name: place.name,
      destination: 'google_maps'
    });
  }}
>
  📍 Cómo llegar
</a>
```

#### **E. En enlace a web externa:**
```typescript
<a 
  href={place.website}
  target="_blank"
  onClick={() => {
    // 🎯 TRACKEAR antes de ir a web
    trackEvent(EVENTS.PLACE_WEBSITE_CLICK, CATEGORIES.CONVERSION, {
      place_id: place.id,
      place_name: place.name,
      website: place.website
    });
  }}
>
  🌐 Visitar web
</a>
```

---

### **5. En `components/ChatbotFloating.tsx` (Tracking del chatbot)**

#### **A. En función handleSend (cuando envía mensaje):**
```typescript
const handleSend = async () => {
  if (!input.trim() || loading) return;

  const userMessage = input.trim();
  
  // 🎯 TRACKEAR mensaje enviado
  trackEvent(EVENTS.CHATBOT_MESSAGE_SEND, CATEGORIES.CHATBOT, {
    message_length: userMessage.length,
    messages_in_conversation: messages.length
  });
  
  // ... código existente ...
};
```

#### **B. En función renderMessageWithLinks (cuando hace click en enlace del bot):**
```typescript
onClick={(e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'A') {
    const href = target.getAttribute('data-href');
    if (href && !href.startsWith('http')) {
      e.preventDefault();
      
      // 🎯 TRACKEAR click en enlace del chatbot
      trackEvent(EVENTS.CHATBOT_LINK_CLICK, CATEGORIES.CHATBOT, {
        link_url: href,
        link_type: href.includes('/mapa') ? 'map' : 'detail'
      });
      
      router.push(href);
    }
  }
}}
```

---

## 📊 **RESUMEN: Eventos por Componente**

| Componente | Eventos a trackear | Prioridad |
|------------|-------------------|-----------|
| **Mapa** | `map_marker_click`, `place_detail_click` | 🔴 Alta |
| **Filtros móvil** | `mobile_filter_close` | 🔴 Alta |
| **Páginas de lugar** | `place_phone_click`, `place_directions_click`, `place_website_click` | 🔴 Alta |
| **Chatbot** | `chatbot_message_send`, `chatbot_link_click` | 🟡 Media |
| **Rutas** | `route_calculate` | 🟢 Baja |
| **Page views** | Automático con `PageViewTracker` | ✅ Ya hecho |

---

## 🎯 **IMPLEMENTACIÓN POR FASES**

### **Fase 1 (30 min - Hoy):**
- ✅ PageViewTracker en layout
- ✅ Tracking en mapa (marker click + ver detalles)
- ✅ Tracking conversiones (teléfono, directions, website)

### **Fase 2 (20 min - Mañana):**
- ✅ Tracking filtros móvil
- ✅ Tracking chatbot

### **Fase 3 (1 hora - Próxima semana):**
- ✅ Dashboard `/admin/estadisticas`
- ✅ Queries y gráficos

---

## 🧪 **CÓMO PROBAR**

1. Abrir consola del navegador (F12)
2. Hacer acciones en la app
3. Ver llamadas a `/api/analytics/track` en Network tab
4. Ir a Supabase → Table `user_analytics` → Ver registros
5. Debería haber eventos guardándose ✅

---

## 📋 **CHECKLIST**

- [ ] PageViewTracker añadido a layout
- [ ] Tracking en clicks de mapa
- [ ] Tracking en conversiones (teléfono, maps, web)
- [ ] Tracking en filtros móvil
- [ ] Tracking en chatbot
- [ ] Verificar que se guarda en Supabase
- [ ] Crear dashboard `/admin/estadisticas`

---

**Siguiente paso:** Añadir el tracking a los componentes según esta guía.

