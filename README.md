# 🏆 Casi Cinco - Los Mejores Lugares de España

![Estado](https://img.shields.io/badge/Estado-BETA%205.0%20Cache%20%26%20Monetization-success)
![Version](https://img.shields.io/badge/Versión-5.0.0-blue)
![Tech](https://img.shields.io/badge/Tech-Next.js%2014%20%7C%20TypeScript%20%7C%20Supabase-blue)
![Lugares](https://img.shields.io/badge/Lugares-3628-orange)
![Deploy](https://img.shields.io/badge/Deploy-AWS%20Amplify-orange)

**La plataforma definitiva que filtra el 95% de lugares para mostrarte solo el top 5% de España.**

---

## ✨ ¿Qué es Casi Cinco?

Casi Cinco es la plataforma definitiva para encontrar lugares excepcionales en España. No mostramos miles de opciones mediocres. **Solo el top 5%**.

### 🎯 Propuesta de Valor

- ⭐ **Solo 4.7★ o más** - Cero lugares mediocres
- 💎 **Sistema de Tiers** - De Diamante (1,000+ reseñas) a Bronce (<50)
- 📊 **Filtro por Reseñas** - Un 4.8★ con 10 reseñas NO es igual que con 1,000
- 🤖 **IA Integrada** - Descripciones y resúmenes automáticos
- 🗺️ **Mapa Avanzado** - Filtros múltiples y marcadores personalizados
- 📍 **Rutas Optimizadas** - Planifica tu día perfecto en segundos

---

## 🚀 Estado del Proyecto

### ✅ Completado (100%)

#### **Core Features**
✅ Backend completo con APIs  
✅ Sistema de autenticación (Supabase)  
✅ Panel de administración con Dashboard Analytics  
✅ Indexación automática desde Google Places  
✅ Sistema de tiers de calidad (6 niveles)  
✅ Filtros avanzados dinámicos (CCAA, Provincia, Ciudad, Tier, Reseñas)  
✅ Sistema de pagos (Stripe)  
✅ +3,500 lugares indexados

#### **Mapa Interactivo Avanzado**
✅ Geolocalización con marcador personalizado  
✅ Clustering inteligente de marcadores (por tier)  
✅ Auto-zoom a lugares filtrados  
✅ Filtro de ciudad con búsqueda parcial  
✅ Marcadores con iconos de tier (💎, 🏆, etc.)  
✅ Lugares no filtrados visibles en gris  
✅ Navegación desde chatbot con `?place=ID`  
✅ Card flotante centrada (nunca se corta)  
✅ Leyenda de tiers de calidad

#### **Chatbot "Tío Viajero" IA**
✅ Basado en OpenAI GPT-4  
✅ Detección inteligente de categorías (restaurante, hotel, spa, bar)  
✅ Sinónimos ampliados (apartamentos, alojamientos, etc.)  
✅ Detección de plural → 5 resultados mínimo  
✅ Manejo de "afueras", "alrededores", "cerca de pero no en"  
✅ Enlaces clicables: "Ver detalles" y "Ver en mapa"  
✅ Responde con dirección y teléfono  
✅ NO da webs externas (retención de tráfico)  
✅ Historial limitado a 10 mensajes  
✅ Botón limpiar conversación con modal bonito  
✅ Markdown renderizado (negrita, enlaces)

#### **UI/UX**
✅ Home optimizada para conversión  
✅ Paginación en gestión de lugares  
✅ Menú compartir en redes sociales  
✅ Dashboard estilo Power BI con estadísticas completas  
✅ Carga progresiva (filtros → mapa → lista)  
✅ Lazy loading de imágenes  
✅ Categoría visible en páginas de detalle  

### 🎯 BETA 3.0 - Mobile-First Experience 📱

El proyecto está **completamente optimizado para móvil** con:
- ✅ Bottom Navigation (Mapa/Filtros/Lista)
- ✅ Bottom Sheets deslizables
- ✅ Cards con imágenes y botones touch-friendly
- ✅ Dashboard con scroll horizontal
- ✅ Inputs 48px+ altura (iOS optimized)
- ✅ Desplegado en AWS Amplify
- ✅ Todas las variables de entorno configuradas
- ✅ Chatbot, Rutas, Indexación funcionando al 100%

### 📱 BETA 4.0 - Mobile UX Perfection ✨

Perfeccionamiento de la experiencia móvil con:
- ✅ **Altura perfecta del mapa** sin scroll (100vh exacto)
- ✅ **Leyenda expandible** con información detallada de tiers
- ✅ **Controles flotantes** siempre visibles sobre el mapa
- ✅ **pb-16** correcto para navegación inferior
- ✅ Estructura idéntica a `/ruta` (que funcionaba perfectamente)

### 🚀 BETA 5.0 - Performance & Monetization 💰

Optimización extrema de performance y monetización completa:
- ⚡ **Cache IndexedDB de 24h** - Carga de datos instantánea (<100ms, +98%)
- 🎨 **Iconos pre-renderizados** - Solo 12 SVGs vs 3,628 (+90% velocidad marcadores)
- ⏱️ **Tiempo total optimizado** - 8-10s → **0.6s** en cargas repetidas (+94%)
- 💰 **Sistema de monetización** - Trial 30 días + suscripciones
- 👥 **3 tipos de usuario** - Admin / Gratis / Premium
- 💳 **Precios accesibles:** 2.99€/mes o 24.99€/año (ahorra 30%)
- 🔗 **Redes sociales** - Instagram, Facebook, Twitter, TikTok en detalles
- 📝 **Markdown renderizado** - Negritas correctas en descripciones
- 📱 **Controles superiores móvil** - Leyenda + GPS con texto descriptivo
- 🎯 **Filtros móvil mejorados** - Info detallada de cada tier
- 🚀 **Precarga automática** - Lugares listos al iniciar app
- 🛠️ **Migración SQL robusta** - Auto-contained, crea tablas necesarias

**Resultado:** Performance nivel profesional (+94% mejora total) + modelo de negocio activo + enlaces sociales.

Ver: [`BETA_5.0_PLAN.md`](./BETA_5.0_PLAN.md) | [`VERSION_BETA_5.0.md`](./VERSION_BETA_5.0.md) | [`CHANGELOG_BETA_5.0.md`](./CHANGELOG_BETA_5.0.md) | [`SISTEMA_MONETIZACION.md`](./SISTEMA_MONETIZACION.md)

---

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth
- **Pagos**: Stripe
- **Mapas**: Google Maps API
- **IA**: OpenAI GPT-4
- **Deployment**: AWS Amplify (WEB_COMPUTE)

---

## 📚 Documentación

### 🎯 Empieza Aquí

1. **[LEEME_PRIMERO.md](./LEEME_PRIMERO.md)** - Guía de inicio rápido
2. **[ESTADO_ACTUAL_PROYECTO.md](./ESTADO_ACTUAL_PROYECTO.md)** - Estado completo del proyecto
3. **[INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md)** - Índice completo de documentación

### 📖 Documentación Estratégica

#### 🌟 BETA 5.0 (ACTUAL):
- **[BETA_5.0_PLAN.md](./BETA_5.0_PLAN.md)** - ✨ Plan y objetivos BETA 5.0
- **[VERSION_BETA_5.0.md](./VERSION_BETA_5.0.md)** - ✨ Resumen completo BETA 5.0
- **[CHANGELOG_BETA_5.0.md](./CHANGELOG_BETA_5.0.md)** - ✨ Changelog detallado
- **[SISTEMA_MONETIZACION.md](./SISTEMA_MONETIZACION.md)** - 💰 Guía de monetización

#### 📚 Versiones Anteriores:
- **[BETA_4.0_PLAN.md](./BETA_4.0_PLAN.md)** - Plan BETA 4.0
- **[VERSION_BETA_3.0.md](./VERSION_BETA_3.0.md)** - Novedades BETA 3.0
- **[VERSION_BETA_2.0.md](./VERSION_BETA_2.0.md)** - Novedades BETA 2.0

#### 🔧 Documentación Técnica:
- **[SISTEMA_FILTRADO.md](./SISTEMA_FILTRADO.md)** - Sistema de tiers y filtrado
- **[CHATBOT_TIO_VIAJERO.md](./CHATBOT_TIO_VIAJERO.md)** - Chatbot IA
- **[RESUMEN_STRIPE.md](./RESUMEN_STRIPE.md)** - Integración de pagos
- **[CHANGELOG.md](./CHANGELOG.md)** - Historial de cambios completo
- **[supabase/README.md](./supabase/README.md)** - Configuración de base de datos

---

## 🌐 Acceso a la Aplicación

### **Producción (Para Usuarios)**

**URL:** https://main.d2nzzzmoajf631.amplifyapp.com

La app está **desplegada y funcionando** en AWS Amplify con:
- ✅ 3,600+ lugares verificados
- ✅ Experiencia Mobile-First
- ✅ Login con Google OAuth
- ✅ Chatbot IA "Tío Viajero"
- ✅ Planificador de rutas
- ✅ Dashboard analytics completo

### **Desarrollo Local (Solo para Desarrollo)**

**Requisitos:**
- Node.js 18+
- Variables de entorno configuradas
- Acceso a Supabase, Google APIs, OpenAI, Stripe

```bash
git clone https://github.com/ActtaxIA/Casi_cinco_app.git
cd Casi_cinco_app
npm install
# Configurar .env.local (contactar admin)
npm run dev
```

### 2. Configurar Variables de Entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa con tus API keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_api_key_google
GOOGLE_PLACES_API_KEY=tu_api_key_places

# OpenAI
OPENAI_API_KEY=tu_api_key_openai

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=tu_publishable_key
STRIPE_SECRET_KEY=tu_secret_key
STRIPE_WEBHOOK_SECRET=tu_webhook_secret
```

### 3. Configurar Base de Datos

En Supabase SQL Editor, ejecuta en orden:

```sql
-- 1. Schema base
-- Pega y ejecuta: supabase_setup.sql

-- 2. Sistema de filtrado avanzado
-- Pega y ejecuta: filtrado_avanzado.sql

-- 3. Sistema de pagos
-- Pega y ejecuta: stripe_setup.sql
```

### 4. Deploy

**La app se despliega automáticamente en AWS Amplify** cuando se hace push a la rama `main` de GitHub.

**URL de Producción:** https://main.d2nzzzmoajf631.amplifyapp.com

**Monitoreo:**
- AWS Amplify Console: https://console.aws.amazon.com/amplify
- GitHub Actions: Automático en cada commit

### 5. Para Desarrollo Local

```bash
npm run dev
# http://localhost:3000
```

Ver [DEPLOY_AWS.md](./DEPLOY_AWS.md) para más detalles.

---

## 🎮 Uso

### Usuario Admin

1. Regístrate en `/registro`
2. En Supabase, actualiza tu rol a `admin`:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'tu@email.com';
   ```
3. Accede a `/admin/indexar`
4. Busca lugares en Google Places: "restaurantes málaga"
5. Indexa los mejores (4.7★+)
6. Espera enriquecimiento con IA
7. Publica lugares

### Usuario Normal

1. Visita la home: `/`
2. Explora el mapa: `/mapa`
3. Aplica filtros:
   - 💎 Tier: Diamante (top 0.1%)
   - 📊 Reseñas: Más de 1,000
   - 📍 Ubicación: Málaga
4. Click en marcador
5. Ver detalles del lugar
6. Guardar favoritos
7. Planificar rutas

---

## 💎 Características Únicas

### Sistema de Tiers

| Tier | Requisitos | Cantidad en España |
|------|------------|-------------------|
| 💎 Diamante | 4.8★+ con 1,000+ reseñas | ~150 lugares |
| 🏆 Platino | 4.8★+ con 500-999 reseñas | ~500 lugares |
| 🥇 Oro | 4.7★+ con 200+ reseñas | ~2,500 lugares |
| 🥈 Plata | 4.7★+ con 50+ reseñas | ~5,000 lugares |
| 🥉 Bronce | 4.7★+ con <50 reseñas | ~3,000 lugares |

### Filtro por Número de Reseñas (Killer Feature)

**La verdad que nadie dice:**
> Un 4.8★ con 1,500 reseñas es OBJETIVAMENTE mejor que un 4.9★ con 15 reseñas

**Rangos disponibles:**
- Menos de 50
- 50 - 100
- 100 - 200
- 200 - 500
- 500 - 1,000
- **Más de 1,000** 🏆 (Los más validados)

---

## 📊 Modelo de Negocio

### Planes

- **Gratis**: Explorar lugares, ver mapa básico
- **Premium Mensual**: 4.99€/mes - Favoritos ilimitados, rutas, descripciones IA
- **Premium Anual**: 49.99€/año (ahorra 17%)
- **Admin**: 99€/mes - Indexar lugares, panel completo

### Proyecciones

**Año 1**: ~18,000€  
**Año 2**: ~60,000€  
**Año 3**: ~180,000€  

**Margen**: 90% (SaaS)

---

## 🗺️ Arquitectura

```
┌─────────────┐
│   Next.js   │ Frontend + API Routes
└──────┬──────┘
       │
       ├─────► Supabase (PostgreSQL + Auth)
       │
       ├─────► Google Maps API (Lugares + Mapas)
       │
       ├─────► OpenAI API (Descripciones IA)
       │
       └─────► Stripe (Pagos)
```

---

## 🔒 Seguridad

- ✅ Row Level Security (RLS) en todas las tablas
- ✅ Autenticación JWT con Supabase
- ✅ API keys en variables de entorno
- ✅ Validación de inputs
- ✅ Rate limiting en APIs críticas
- ✅ Webhooks firmados (Stripe)

---

## 📈 Roadmap

### v1.0 (MVP) - Actual
- [x] Sistema de indexación
- [x] Mapa con filtros
- [x] Sistema de tiers
- [x] Integración IA
- [x] Sistema de pagos

### v1.1 - Próximos 3 meses
- [ ] App móvil (React Native)
- [ ] Notificaciones push
- [ ] Sistema de reviews propio
- [ ] Compartir listas públicas

### v2.0 - Próximos 6 meses
- [ ] IA avanzada (recomendaciones personalizadas)
- [ ] Reservas integradas
- [ ] Programa de afiliados
- [ ] API pública

---

## 🤝 Contribuir

Este es un proyecto privado por ahora, pero siempre estamos abiertos a feedback.

---

## 📄 Licencia

Proprietary - Todos los derechos reservados

---

## 👨‍💻 Autor

**Narciso Pardo Buendía**  
Email: narciso.pardo@outlook.com  
Proyecto: InfluencersTrust

---

## 🙏 Agradecimientos

- **Anthropic Claude** - Por la ayuda en desarrollo
- **Supabase** - Base de datos y auth
- **Vercel** - Hosting
- **Google** - Maps y Places API
- **OpenAI** - IA para contenido

---

## 📞 Soporte

¿Necesitas ayuda?
- 📧 Email: soporte@casicin.co
- 💬 Discord: [próximamente]
- 📖 Docs: Ver carpeta `/docs`

---

**Made with ❤️ in Spain 🇪🇸**

*Última actualización: 12 de Octubre de 2025*  
*Versión: 3.0.0 - BETA 3.0 Mobile-First*  
*Deploy: [AWS Amplify](https://main.d2nzzzmoajf631.amplifyapp.com)*
