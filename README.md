# ⭐ Casi Cinco - Los Mejores Lugares de España

> **Descubre establecimientos excepcionales con +4.7★ en Google Maps**

[![Estado](https://img.shields.io/badge/Estado-BETA%20101-success)](https://www.casicinco.com)
[![Deploy](https://img.shields.io/badge/Deploy-AWS%20Amplify-orange)](https://aws.amazon.com/amplify/)
[![Framework](https://img.shields.io/badge/Framework-Next.js%2014-black)](https://nextjs.org/)

---

## 🌟 ¿Qué es Casi Cinco?

**Casi Cinco** es una plataforma que te ayuda a descubrir los mejores restaurantes, bares y hoteles de España. Solo incluimos lugares con valoración mínima de **4.7 estrellas** en Google Maps.

### 💎 Sistema de Tiers - Nuestro Diferenciador Clave

**Lo que nos hace únicos:** No ordenamos solo por rating. Usamos un **sistema de tiers** que combina rating + número de reseñas para identificar los lugares verdaderamente excepcionales:

- **💎 DIAMANTE** (4.8+ con 1000+ reseñas) - Top 0.1% de España
- **🏆 PLATINO** (4.8+ con 500+ reseñas) - Top 1%
- **🥇 ORO** (4.8+ con 200+ reseñas) - Top 5%
- **🥈 PLATA** (4.7+ con 100+ reseñas) - Top 15%
- **🥉 BRONCE** (4.7+ estrellas) - Calidad garantizada

Este sistema es el **pilar de toda la aplicación**: mapa, chatbot IA, blog y recomendaciones siempre priorizan los tiers superiores.

### 🎯 Características Principales:

- 🗺️ **Mapa Interactivo** - Visualiza lugares por categoría y ubicación
- 🤖 **Chat IA** - Pregúntale al "Tío Viajero" por recomendaciones
- 📝 **Blog SEO** - Guías "Top 10" por ciudad/provincia (SSR/SSG)
- 📍 **Planificador de Rutas** - Crea itinerarios personalizados
- 📊 **Analytics** - Descubre tendencias y lugares populares
- 📷 **Redes Sociales** - Instagram, Facebook, Twitter y TikTok integrados
- ❓ **FAQs Completas** - 56 preguntas agrupadas por categorías con búsqueda inteligente

---

## 🚀 Inicio Rápido

### Requisitos Previos:
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase
- API Keys: Google Maps, OpenAI, Stripe

### Instalación:

```bash
# Clonar repositorio
git clone [repo-url]
cd Casi5-App

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus API keys

# Ejecutar migraciones de Supabase
# (Ir a Supabase → SQL Editor → Ejecutar archivos en /supabase/migrations/)

# Iniciar desarrollo
npm run dev
```

### Despliegue:

```bash
# Build de producción
npm run build

# O desplegar a AWS Amplify
git push origin main
```

---

## 📚 Documentación

> **Nueva estructura organizada** (v3.0 - 26 Oct 2025): Documentación reorganizada en `docs/strategy/`, `docs/systems/` y `docs/guides/`

### 📖 Guías Esenciales:
- **[LEEME_PRIMERO.md](LEEME_PRIMERO.md)** - Introducción al proyecto
- **[INDICE_MAESTRO_DOCUMENTACION.md](INDICE_MAESTRO_DOCUMENTACION.md)** - 📚 Índice completo de toda la documentación
- **[COMANDOS_UTILES.md](COMANDOS_UTILES.md)** - Comandos SQL, JS, debugging

### 🎯 Estrategia y Acción:
- [docs/strategy/ACCIONES_INMEDIATAS_CRITICAS.md](docs/strategy/ACCIONES_INMEDIATAS_CRITICAS.md) - ⚠️ **BLOQUEADORES CRÍTICOS**
- [docs/strategy/PLAN_ESTRATEGICO_2025_SEO_VIABILIDAD.md](docs/strategy/PLAN_ESTRATEGICO_2025_SEO_VIABILIDAD.md) - Plan completo SEO
- [docs/strategy/PROXIMAS_MEJORAS_PRIORIZADAS.md](docs/strategy/PROXIMAS_MEJORAS_PRIORIZADAS.md) - Roadmap P0-P3

### 🔧 Guías de Configuración:
- [docs/guides/CONFIGURACION_COMPLETA.md](docs/guides/CONFIGURACION_COMPLETA.md) - Setup completo
- [docs/guides/DEPLOY_AWS.md](docs/guides/DEPLOY_AWS.md) - Despliegue en AWS
- [docs/guides/GOOGLE_OAUTH_SETUP.md](docs/guides/GOOGLE_OAUTH_SETUP.md) - OAuth con Google
- [docs/guides/CONFIGURAR_STRIPE.md](docs/guides/CONFIGURAR_STRIPE.md) - Pagos Stripe

### 💡 Sistemas Principales:
- [docs/systems/FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md](docs/systems/FLUJO_COMPLETO_INDEXACION_ENRIQUECIMIENTO.md) - **Sistema 2 fases**
- [docs/systems/CHATBOT_TIO_VIAJERO.md](docs/systems/CHATBOT_TIO_VIAJERO.md) - Chatbot IA
- [docs/systems/SISTEMA_FILTRADO.md](docs/systems/SISTEMA_FILTRADO.md) - Filtros avanzados
- [docs/systems/SISTEMA_MONETIZACION.md](docs/systems/SISTEMA_MONETIZACION.md) - ✨ Trial 30 días + Stripe
- [docs/systems/SISTEMA_REDES_SOCIALES.md](docs/systems/SISTEMA_REDES_SOCIALES.md) - 📱 Redes sociales
- [docs/systems/SISTEMA_FOTOS_SUPABASE.md](docs/systems/SISTEMA_FOTOS_SUPABASE.md) - 📸 Fotos optimizadas
- [docs/systems/SISTEMA_LLAMADAS_GOOGLE_API.md](docs/systems/SISTEMA_LLAMADAS_GOOGLE_API.md) - 🔍 Google API
- [docs/systems/OPTIMIZACION_GOOGLE_API_COMPLETA.md](docs/systems/OPTIMIZACION_GOOGLE_API_COMPLETA.md) - Optimizaciones (~€108k/año ahorrados)

### 📊 Analytics:
- Dashboard de estadísticas: `/admin/estadisticas`
- Dashboard de conversaciones IA: `/admin/conversaciones`
- Gestor de blog: `/admin/blog`
- Gestión de redes sociales: `/admin/redes-sociales`

---

## 🗂️ Estructura del Proyecto

```
app/
├── (public)/          # Páginas públicas
│   ├── mapa/         # Mapa interactivo
│   ├── blog/         # Blog SEO
│   └── [category]/   # Detalles de lugares
├── admin/            # Panel de administración
├── api/              # API routes
│   ├── chatbot/     # IA conversacional
│   ├── blog/        # Gestión blog
│   └── analytics/   # Tracking
├── components/       # Componentes React
├── lib/             # Utilidades
│   ├── ai/          # OpenAI + evaluación
│   ├── analytics/   # Tracking
│   └── indexation/  # Google Places
└── types/           # TypeScript types
```

---

## 🔑 Variables de Entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
GOOGLE_PLACES_API_KEY=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_SEARCH_ENGINE_ID=    # Opcional: Para búsqueda automática de redes sociales

# OpenAI
OPENAI_API_KEY=

# Stripe (opcional)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://www.casicinco.com
```

---

## 📊 Base de Datos

### Tablas Principales:
- `places` - Lugares indexados (con redes sociales)
- `blog_posts` - Posts de blog SEO
- `user_analytics` - Tracking de usuarios
- `chatbot_analytics` - Conversaciones IA
- `chat_history` - Historial chatbot
- `favorites`, `visits`, `lists` - Datos usuario

### Columnas de Redes Sociales en `places`:
- `instagram_url` - Perfil de Instagram
- `facebook_url` - Página de Facebook
- `twitter_url` - Perfil de Twitter/X
- `tiktok_url` - Perfil de TikTok

### Migraciones:
Ejecutar en orden en Supabase → SQL Editor:
1. `20251016_create_cities_table.sql`
2. `20251017_user_analytics.sql`
3. `20251017_chatbot_analytics.sql`
4. `20251017_blog_posts.sql`
5. `20251017_add_subcategory_index.sql`

Luego ejecutar (opcional):
- `supabase/maintenance/update_blog_dates_organic.sql` - Programar posts

---

## 🎨 Características del Blog

### Sistema de Tiers en el Blog:
- ✅ **Artículos ordenados por tier** - Diamante primero, luego platino, luego oro
- ✅ **Top 10 basado en calidad real** - No solo rating, sino el binomio rating + reseñas
- ✅ **Misma filosofía que la app** - Coherencia total en toda la plataforma

### Sistema de Auto-Publicación (tipo Joomla):
- ✅ Posts con fecha futura NO se muestran
- ✅ Se publican automáticamente al llegar la fecha
- ✅ Sin intervención manual necesaria

### Editor Completo:
- ✅ Generación de intro con IA (botón ✨)
- ✅ Auto-slug desde título
- ✅ Programación de fecha/hora
- ✅ SEO integrado (meta, keywords)
- ✅ Top 10 dinámico por filtros

### URLs Generadas:
```
/blog/mejores-restaurantes-madrid
/blog/mejores-bares-barcelona
/blog/mejores-hoteles-provincia-cuenca
```

---

## 🤖 Chatbot IA

### Capacidades:
- Búsqueda por lenguaje natural
- Filtrado por subcategorías (cocinas específicas)
- Recomendaciones personalizadas
- Enlaces directos a lugares y mapa
- Rate limiting (20 msg/min)

### Analytics:
- Logging completo de conversaciones
- Auto-evaluación de calidad (IA)
- Métricas de rendimiento
- Dashboard de análisis

---

## 📈 Sistema de Analytics

### Eventos Trackeados:
- `page_view` - Vistas de página
- `place_view` - Clicks en lugares
- `place_phone_click` - Clicks en teléfono
- `place_website_click` - Clicks en website
- `place_directions_click` - Cómo llegar
- `search_finalized` - Búsquedas completadas
- `chatbot_message_send` - Mensajes al chat
- `chatbot_link_click` - Enlaces del chat

### Dashboard `/admin/estadisticas`:
- Usuarios activos (7d / 30d)
- Conversiones
- Top 10 lugares
- Eventos por tipo
- Dispositivos

---

## 🛠️ Scripts Disponibles

### Desarrollo:
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linter
```

### Utilities:
```bash
# Generar posts de blog con IA
npx tsx scripts/generate-blog-posts.ts

# Buscar redes sociales automáticamente
npm run social-media process 100      # Procesar 100 lugares
npm run social-media export 100       # Exportar a CSV
npm run social-media import data.csv  # Importar desde CSV

# Tests
npm test
```

---

## 🔒 Seguridad

### ✅ Implementado
- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Autenticación con Google OAuth + PKCE
- ✅ API keys restringidas por dominio
- ✅ Validaciones server-side
- ✅ HTTPS obligatorio
- ✅ Política de cookies y privacidad

### ⚠️ Mejoras Planificadas (Futuro)
- ⏳ Security Headers (CSP, X-Frame-Options, HSTS)
- ⏳ Rate Limiting en APIs críticas
- ⏳ Optimización de secrets en next.config.js

**Nota:** Las mejoras de seguridad se implementarán de forma incremental, 
con testing exhaustivo entre cada cambio.

---

## 📱 Compatibilidad

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Móvil (iOS Safari, Chrome Android)
- ✅ Tablet (iPad, Android tablets)
- ✅ Responsive design completo

---

## 🌐 SEO

- ✅ **SSR/SSG en fichas de lugares y blog** - generateMetadata + generateStaticParams
- ✅ **Schema.org** - LocalBusiness, ItemList, BreadcrumbList
- ✅ **Sitemap segmentado** - sitemap-index.xml (estático, lugares, blog)
- ✅ Robots.txt configurado
- ✅ Meta tags dinámicos
- ✅ Open Graph images
- ✅ Google Search Console verificado
- ✅ 29 posts de blog optimizados
- ✅ URLs amigables

---

## 💰 Sistema de Costos Optimizado

### Ahorro Total: ~€108,300/año (Actualizado 26 Oct 2025)

#### Optimizaciones Implementadas:
- ✅ **Supabase Storage vs Google Photos API** → Ahorro: €45,000/año
- ✅ **Eliminación fallback blog (26 Oct)** → Ahorro: €44,400/año ← **NUEVO**
- ✅ **Limpieza fotos expiradas (24 Oct)** → Ahorro: €900/año
- ✅ **MapContext Provider (66% reducción)** → Ahorro: €15,000/año (estimado)
- ✅ **Caché de búsquedas** → Ahorro: €3,000/año (estimado)

#### Estado Actual del Sistema:
- 📊 **2,612+ lugares indexados**
- 📸 **96.8% con fotos en Supabase**
- 💰 **Costo Google Photos API: €0/mes** (antes €3,700/mes)
- ✅ **0 lugares usando Google Photos API fallback**

Ver detalles en: [docs/systems/OPTIMIZACION_GOOGLE_API_COMPLETA.md](docs/systems/OPTIMIZACION_GOOGLE_API_COMPLETA.md)

---

## 📄 Licencia

**Propietario:** Narciso Pardo Buendía  
**Uso:** Privado - Todos los derechos reservados

---

## 🤝 Contribuciones

Este es un proyecto privado. No se aceptan contribuciones externas.

---

## 📞 Contacto

**Web:** https://www.casicinco.com  
**Email:** info@casicinco.com  
**Admin:** https://www.casicinco.com/admin

---

---

## 📊 Estado Actual

**Última actualización:** 30 de Noviembre 2025  
**Estado:** 🟢 LISTO PARA PRODUCCIÓN  
**Versión:** BETA 101 ✨  
**Documentación:** v3.1.0 (Página de contacto mejorada + FAQs expandidas)

### Ver Estado del Sistema:
- [docs/archive/snapshots/](docs/archive/snapshots/) - Estados históricos por fecha
- [CHANGELOG.md](CHANGELOG.md) - Historial completo de cambios

---

**Release:** BETA 101 🎉  
**Documentación:** v3.1.0 ✨ (Contacto mejorado + 56 FAQs)
