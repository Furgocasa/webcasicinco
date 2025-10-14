# 🌟 Casi Cinco - Los Mejores Lugares de España

**Versión:** BETA 6.0  
**Fecha:** 14 de octubre de 2025  
**Dominio:** [www.casicinco.com](https://www.casicinco.com)

---

## 📋 **Descripción**

Casi Cinco es una plataforma que recopila y presenta los **mejores lugares de España** con valoraciones de 4.7 estrellas o superiores. 

Utilizando inteligencia artificial y datos de Google Places, ofrecemos una experiencia curada de:
- 🍽️ **Restaurantes** excepcionales
- 🍺 **Bares** y tabernas de calidad
- ☕ **Cafeterías** únicas
- 🏨 **Hoteles** y alojamientos premium

---

## 🚀 **Características Principales**

### **Para Usuarios:**
- 🗺️ **Mapa Interactivo** con 2,700+ lugares verificados
- 🔍 **Filtros Avanzados** por categoría, provincia, rating, reseñas
- 📍 **Planificador de Rutas** con sugerencias inteligentes
- 🤖 **Chatbot IA** con recomendaciones personalizadas
- 💎 **Sistema de Tiers** (Diamond, Platinum, Gold, Silver, Bronze)
- 📱 **Responsive** - Optimizado para móvil y desktop

### **Para Administradores:**
- 🔍 **Sistema de Indexación de 2 Fases** (revolucionario)
- 🎨 **Enriquecimiento IA** separado y controlable
- 📊 **Dashboard Analytics** completo
- 👥 **Gestión de Usuarios** y suscripciones
- 📋 **Historial de Trabajos** con tracking detallado

---

## 🎯 **BETA 6.0 - Sistema de 2 Fases**

### **FASE 1: Indexación Rápida (30-60 min)**
- Búsqueda exhaustiva en Google Places
- Filtrado automático (rating ≥4.7, reseñas ≥20)
- Detección de duplicados
- Guardado sin IA (rápido)
- **Resultado:** Lugares "aprobados" listos para enriquecer

### **FASE 2: Enriquecimiento IA (pausable)**
- Categorización inteligente con IA
- Descarga de fotos → Supabase Storage
- Generación de descripción con IA
- Resumen de reseñas con IA
- Highlights con IA
- **Resultado:** Lugares publicados en el mapa

---

## 🛠️ **Stack Tecnológico**

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Base de Datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth
- **Pagos:** Stripe (suscripciones)
- **IA:** OpenAI GPT-4o-mini
- **Mapas:** Google Maps API
- **Storage:** Supabase Storage (fotos)
- **Deployment:** AWS Amplify
- **Dominio:** OVH + AWS Route53

---

## 📊 **Categorías (Solo 4)**

- 🍽️ **Restaurantes** - Lugares para comer
- 🍺 **Bares** - Bebidas y tapas
- ☕ **Cafeterías** - Cafés y dulces
- 🏨 **Hoteles** - Alojamientos premium

*Spas, experiencias, monumentos descartados temporalmente*

---

## 💰 **Monetización**

- **Trial:** 30 días gratis (requiere tarjeta)
- **Premium Mensual:** 2.99€/mes
- **Premium Anual:** 29.99€/año (casi 4 meses gratis)
- **Admin:** 99€/mes (indexación ilimitada)

---

## 🗂️ **Estructura del Proyecto**

```
casi5-app/
├── app/
│   ├── (public)/          # Páginas públicas
│   │   ├── page.tsx       # Homepage
│   │   ├── mapa/          # Mapa interactivo
│   │   ├── ruta/          # Planificador de rutas
│   │   ├── perfil/        # Perfil de usuario
│   │   └── pricing/       # Planes y precios
│   ├── admin/             # Panel de administración
│   │   ├── dashboard/     # Analytics
│   │   ├── indexar/       # FASE 1: Indexación rápida
│   │   ├── enriquecer/    # FASE 2: Enriquecimiento IA
│   │   ├── lugares/       # Gestión de lugares
│   │   └── usuarios/      # Gestión de usuarios
│   └── api/               # API Routes
├── lib/
│   ├── indexation/
│   │   ├── indexer-fast.ts    # FASE 1: Búsqueda rápida
│   │   ├── enricher-batch.ts  # FASE 2: Enriquecimiento IA
│   │   └── category-filters.ts # Filtros estrictos
│   ├── ai/
│   │   ├── openai.ts          # Generación de contenido
│   │   └── categorize.ts      # Categorización inteligente
│   └── google/
│       └── places.ts          # Google Places API
└── supabase/
    ├── migrations/
    └── scripts SQL
```

---

## 🎯 **Inicio Rápido**

### **Instalación:**
```bash
npm install --legacy-peer-deps
```

### **Variables de Entorno (.env.local):**
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_key
GOOGLE_MAPS_API_KEY=your_google_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

### **Desarrollo:**
```bash
npm run dev
```

### **Producción:**
```bash
npm run build
```

---

## 📚 **Documentación**

- **Sistema de 2 Fases:** [NUEVO_SISTEMA_2_FASES.md](NUEVO_SISTEMA_2_FASES.md)
- **Monetización:** [SISTEMA_MONETIZACION.md](SISTEMA_MONETIZACION.md)
- **Configuración Dominio:** [CONFIGURAR_DOMINIO.md](CONFIGURAR_DOMINIO.md)
- **Verificación Producción:** [VERIFICAR_PRODUCCION.md](VERIFICAR_PRODUCCION.md)

---

## 🔑 **Usuarios de Prueba**

```
Admin:
- Email: info@furgocasa.com
- Password: (en variables de entorno)

Usuario Premium:
- Email: spaindud@gmail.com
- Password: (en variables de entorno)
```

---

## 📈 **Estadísticas**

- **Lugares:** 2,700+ verificados
- **Provincias:** 61 con cobertura
- **Categorías:** 4 principales
- **Rating promedio:** 4.78⭐
- **Usuarios:** Sistema de trials de 30 días

---

## 🚢 **Deployment**

- **Plataforma:** AWS Amplify
- **Dominio:** www.casicinco.com
- **SSL:** Automático (AWS)
- **Email:** OVH (MX records preservados)

---

## 📝 **Changelog BETA 6.0**

### **🎉 Nuevo Sistema de 2 Fases:**
- ✅ Indexación rápida (30-60 min) sin IA
- ✅ Enriquecimiento IA separado y pausable
- ✅ Categorización inteligente con IA
- ✅ Solo 4 categorías (Restaurantes, Bares, Cafeterías, Hoteles)
- ✅ Filtros estrictos (sin autocaravanas en hoteles)
- ✅ Tracking independiente de ambas fases
- ✅ Menú lateral con "Enriquecer con IA"

### **🔧 Optimizaciones:**
- ✅ 10x más rápido en búsqueda
- ✅ Sin límites de paginación (búsqueda exhaustiva)
- ✅ Números coherentes (procesados = guardados + descartados)
- ✅ Marcadores del mapa optimizados
- ✅ Revalidación automática cada 5 min

### **🐛 Bugs Corregidos:**
- ✅ Errores de hidratación React
- ✅ Trabajos zombies en "running"
- ✅ Contadores incoherentes
- ✅ API de Google (restricciones)
- ✅ Títulos SEO únicos por lugar

---

## 🤝 **Contribuir**

Este es un proyecto privado. Para acceso, contacta al administrador.

---

## 📞 **Soporte**

- **Email:** info@casicinco.com
- **Web:** www.casicinco.com

---

## 📄 **Licencia**

Todos los derechos reservados © 2025 Casi Cinco

---

**Hecho con ❤️ en España** 🇪🇸
