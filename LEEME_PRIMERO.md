# 👋 ¡Bienvenido a Casi Cinco!

**Última actualización:** 12 de Octubre de 2025  
**Versión:** 3.0.0 - BETA 3.0 📱 Mobile-First  
**Repositorio:** [GitHub - Casi Cinco](https://github.com/ActtaxIA/Casi_cinco_app)  
**Producción:** [AWS Amplify](https://main.d2nzzzmoajf631.amplifyapp.com)

---

## 🚀 Acceso a la Aplicación

### **🌐 Producción (Recomendado)**
La app está **desplegada y funcionando** en AWS Amplify:

**URL:** https://main.d2nzzzmoajf631.amplifyapp.com

**Características:**
- ✅ Siempre actualizada (auto-deploy desde GitHub)
- ✅ Mobile-First optimizada
- ✅ Google OAuth habilitado
- ✅ 3,600+ lugares disponibles
- ✅ Todas las funcionalidades activas

### **💻 Desarrollo Local (Solo Desarrolladores)**

Si necesitas ejecutar en local:

```powershell
# 1. Clonar repositorio
git clone https://github.com/ActtaxIA/Casi_cinco_app.git
cd Casi_cinco_app

# 2. Instalar dependencias
npm install

# 3. Configurar .env.local (contactar al admin)

# 4. Ejecutar
npm run dev
# Abre: http://localhost:3000
```

### **⚠️ Solución de Problemas Comunes**

**Error: "next no se reconoce como comando"**
- Ejecuta: `npm install` desde el directorio del proyecto
- Asegúrate de estar en: `c:\Users\NARCISOPARDOBUENDA\Desktop\Casi5 App - 2`

**Error: "Couldn't find any pages or app directory"**
- Ejecuta: `cd "c:\Users\NARCISOPARDOBUENDA\Desktop\Casi5 App - 2"`
- Luego: `npm run dev`

**Puerto 3000 en uso**
- Next.js automáticamente usará el puerto 3001
- O detén el proceso anterior: busca en Task Manager procesos Node.js

---

## 📚 Documentación Disponible

### **🎯 Si quieres entender el proyecto:**
👉 **[ESTADO_ACTUAL_PROYECTO.md](./ESTADO_ACTUAL_PROYECTO.md)** - Visión completa

### **🤖 Si quieres saber del chatbot:**
👉 **[CHATBOT_TIO_VIAJERO.md](./CHATBOT_TIO_VIAJERO.md)** - Guía del chatbot IA

### **📝 Si quieres ver qué cambió:**
👉 **[CHANGELOG.md](./CHANGELOG.md)** - Historial de versiones

### **🗺️ Si quieres configurar Supabase:**
👉 **[supabase/README.md](./supabase/README.md)** - Guía de BD

### **📖 Si quieres ver toda la documentación:**
👉 **[INDICE_DOCUMENTACION.md](./INDICE_DOCUMENTACION.md)** - Índice completo

---

## 🎉 ¡BETA 3.0 - Mobile-First! 📱

**Novedades principales:**
- 📱 **Diseño Mobile-First** - Bottom navigation, bottom sheets
- 🗺️ **Mapa optimizado móvil** - Pantalla completa con botones inferiores
- 💳 **Cards con imágenes** - Lista móvil igual que desktop
- 📊 **Dashboard responsive** - Scroll horizontal en stats
- ✅ **Todas las funcionalidades** - Chatbot, rutas, indexación funcionando
- 🚀 **Desplegado en AWS** - Producción en la nube
- 🔧 **Variables de entorno** - Todas configuradas correctamente

---

## 🎯 Próximos Pasos

### **Para Usuarios:**
1. **Accede a la app:** https://main.d2nzzzmoajf631.amplifyapp.com
2. **Regístrate** con email o Google
3. **Explora** el mapa con 3,600+ lugares
4. **Usa el chatbot** "Tío Viajero"
5. **Planifica rutas** con lugares en el camino

### **Para Administradores:**
1. **Panel Admin:** /admin/dashboard
2. **Indexar lugares:** /admin/indexar
3. **Gestionar lugares:** /admin/lugares
4. **Configuración:** /admin/configuracion

---

## 🎨 Características Destacadas BETA 2.0

### **Home y Metodología** 🏠
- Stats reales desde la BD (3,547 lugares)
- Página `/metodologia` explicando el algoritmo
- Identidad clara: "Rating + Reseñas = Objetividad"
- Propuesta de valor que convierte

### **Planificador de Rutas** 🧭 NUEVO
- Calcula rutas entre dos puntos
- Autocompletado de Google Places
- Radio configurable (5-50km)
- Encuentra lugares en tu camino
- Protegido con login

### **Chatbot "Tío Viajero"** 🎩
- Conversa naturalmente
- Enlaces clicables: "Ver detalles" y "Ver en mapa"
- Maneja plural/singular inteligentemente
- Responde con dirección y teléfono
- Detecta "afueras", "alrededores"
- NO da webs externas (retención)

### **Mapa Interactivo** 🗺️
- Clustering por tiers de calidad
- Auto-zoom a filtros
- Navegación desde chatbot (`?place=ID`)
- Geolocalización
- 3,547 lugares visibles
- Protegido con login

### **Filtros Avanzados** 🔍
- Comunidad, Provincia, Ciudad (búsqueda parcial)
- Categoría (restaurante, hotel, spa, bar)
- Tier de Calidad (6 niveles)
- Rango de Reseñas (7 rangos)
- Búsqueda por texto

---

## 🐛 Problemas Conocidos

### **Error de Hidratación** (Navegador No Incógnito)
**Síntoma:** "Text content does not match"  
**Solución:** 
```
1. Abre Dev Tools (F12)
2. Application → Clear Site Data
3. Hard Refresh (Ctrl+Shift+R)
```

### **Geolocalización Incorrecta**
**Síntoma:** Te posiciona en otra ciudad  
**Solución:** Desactiva el botón 🎯 de geolocalización

---

## 📞 Contacto

**Desarrollador:** Narciso Pardo Buendía  
**Email:** narciso.pardo@outlook.com  
**Proyecto:** Casi Cinco

---

**¡Disfruta explorando Casi Cinco! 🚀**

