# 👋 ¡Bienvenido a Casi Cinco!

**Última actualización:** 12 de Octubre de 2025  
**Versión:** 2.0.0 - BETA 2.0  
**Repositorio:** [GitHub - Casi Cinco](https://github.com/ActtaxIA/Casi_cinco_app)

---

## 🚀 Inicio Rápido (5 minutos)

### **Opción A: Setup Automático (Recomendado) 🎯**
```powershell
.\setup.ps1
npm run dev
```

### **Opción B: Setup Manual**

### **1. Verifica que Node.js esté instalado**
```powershell
node --version  # Debería mostrar v18 o superior
```

### **2. Instala dependencias**
```powershell
npm install
```
**Nota:** Si hay errores de dependencias, el archivo `.npmrc` automáticamente resolverá los conflictos.

### **3. Configura variables de entorno**
El archivo `.env.local` YA está creado con todas las API keys. Verifica que estén completas.

### **4. Inicia el servidor**
```powershell
npm run dev
```

### **5. Abre la aplicación**
```
http://localhost:3000
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

## 🎉 ¡Acabas de Llegar a BETA 2.0!

**Novedades principales:**
- 🏠 Home con stats reales desde la BD
- 📖 Página `/metodologia` que explica tu algoritmo objetivo
- 🧭 Planificador de rutas `/ruta` completamente funcional
- 🛡️ Sección listas eliminada (protección de BD)
- 🔒 Rutas protegidas con middleware (requieren login)

---

## ⚡ Acciones Pendientes

### **IMPORTANTE: Actualizar Prompt del Chatbot**
El chatbot tiene mejoras implementadas en el código pero **necesitas actualizar la base de datos**:

```bash
# 1. Abre Supabase SQL Editor
https://supabase.com/dashboard/project/[tu-proyecto]/sql

# 2. Copia y pega el contenido de:
supabase/23-prompt-completo-final.sql

# 3. Ejecuta (Run)

# 4. Verifica que aparezca:
✓ PROMPT ACTUALIZADO CORRECTAMENTE
✓ check_enlaces_mapa: OK
✓ check_sinonimos: OK
✓ check_plural: OK
```

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

