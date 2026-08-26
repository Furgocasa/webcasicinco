# 🔧 Configuración Completa de Casi Cinco

**Fecha:** 12 de Octubre de 2025  
**Versión:** 2.0.0 - BETA 2.0  
**Repositorio:** https://github.com/Furgocasa/webcasicinco

---

## ✅ Configuración Completada

### 1. Repositorio Git 
✅ Repositorio inicializado  
✅ Conectado a GitHub: `https://github.com/Furgocasa/webcasicinco.git`  
✅ Rama principal: `main`  
✅ Primer commit realizado (130 archivos)  
✅ `.gitignore` configurado correctamente  
✅ `.gitattributes` para consistencia de líneas

### 2. Scripts de Automatización Creados

#### `setup.ps1` - Configuración Inicial
Script completo de instalación que:
- Verifica Node.js
- Instala dependencias automáticamente
- Configura archivo `.env.local`
- Valida todo el entorno

**Uso:**
```powershell
.\setup.ps1
```

#### `start.ps1` - Inicio Rápido
Script para arrancar el servidor rápidamente:
- Verifica si existen dependencias
- Instala si es necesario
- Inicia el servidor

**Uso:**
```powershell
.\start.ps1
```

### 3. Configuración NPM

#### `.npmrc`
Archivo creado para resolver conflictos de dependencias automáticamente:
```
legacy-peer-deps=true
```

Esto asegura que `npm install` funcione siempre sin errores de peer dependencies.

---

## 🚀 Guía de Inicio Rápido

### Primera Vez (Setup Completo)

```powershell
# 1. Clonar el repositorio
git clone https://github.com/Furgocasa/webcasicinco.git
cd webcasicinco

# 2. Ejecutar setup automático
.\setup.ps1

# 3. Configurar .env.local con tus API keys
# (El archivo ya existe, solo edítalo)

# 4. Iniciar servidor
npm run dev
```

### Arranques Siguientes

```powershell
# Opción 1: Script rápido
.\start.ps1

# Opción 2: Manual
npm run dev
```

---

## 📋 Checklist de Variables de Entorno

Asegúrate de tener configuradas estas variables en `.env.local`:

### Supabase (Base de Datos)
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Google (Mapas y Lugares)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `GOOGLE_PLACES_API_KEY`

### OpenAI (IA)
- [ ] `OPENAI_API_KEY`

### Stripe (Pagos)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

---

## 🛠️ Solución de Problemas Garantizada

### Error: "next no se reconoce como comando"

**Causa:** Dependencias no instaladas

**Solución:**
```powershell
npm install
```

### Error: "Couldn't find any pages or app directory"

**Causa:** Ejecutando desde directorio incorrecto

**Solución:**
```powershell
cd "c:\Users\NARCISOPARDOBUENDA\Desktop\Casi5 App - 2"
npm run dev
```

### Error: "Port 3000 is in use"

**Causa:** Servidor ya corriendo

**Solución 1 (Automática):**
Next.js usará puerto 3001 automáticamente

**Solución 2 (Manual):**
1. Abre Task Manager (Ctrl+Shift+Esc)
2. Busca procesos "Node.js"
3. Termina el proceso
4. Ejecuta `npm run dev` de nuevo

### Error: Conflictos de dependencias

**Causa:** Versiones incompatibles de React

**Solución:**
El archivo `.npmrc` ya resuelve esto automáticamente.  
Si el problema persiste:
```powershell
npm install --legacy-peer-deps
```

---

## 📁 Estructura de Archivos Importantes

```
Casi5 App - 2/
├── .npmrc                      # Config de npm (legacy-peer-deps)
├── .gitignore                  # Archivos ignorados por Git
├── .gitattributes              # Normalización de líneas
├── setup.ps1                   # Script de configuración inicial
├── start.ps1                   # Script de inicio rápido
├── package.json                # Dependencias del proyecto
├── next.config.js              # Configuración de Next.js
├── .env.local                  # Variables de entorno (NO subir a Git)
├── .env.example                # Plantilla de variables (SÍ en Git)
│
├── LEEME_PRIMERO.md           # Guía de inicio
├── README.md                   # Documentación principal
├── CONFIGURACION_COMPLETA.md  # Este archivo
│
├── app/                        # Páginas de Next.js 14
├── components/                 # Componentes reutilizables
├── lib/                        # Lógica de negocio
├── types/                      # Definiciones TypeScript
└── public/                     # Archivos estáticos
```

---

## 🔒 Seguridad

### Archivos NUNCA Subir a Git

El `.gitignore` ya protege estos archivos:

- ✅ `.env.local` - Variables de entorno
- ✅ `.env` - Variables de entorno alternativas
- ✅ `node_modules/` - Dependencias
- ✅ `.next/` - Build de Next.js
- ✅ `*.log` - Logs

### Verificar Antes de Commit

Antes de hacer `git commit`, asegúrate de NO incluir:

```powershell
# Ver qué archivos se van a subir
git status

# Si ves .env.local o node_modules, ERROR!
# Verifica tu .gitignore
```

---

## 🎯 Comandos Git Útiles

### Trabajo Diario

```powershell
# Ver cambios
git status

# Añadir cambios
git add .

# Commit
git commit -m "Descripción de cambios"

# Subir a GitHub
git push

# Descargar cambios
git pull
```

### Crear Nueva Rama

```powershell
# Crear y cambiar a nueva rama
git checkout -b nombre-rama

# Subir nueva rama
git push -u origin nombre-rama
```

### Deshacer Cambios

```powershell
# Deshacer cambios no commiteados
git restore archivo.ts

# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (eliminar cambios)
git reset --hard HEAD~1
```

---

## 📊 Estado del Proyecto

### Completado ✅
- Sistema de autenticación
- Panel de administración
- Mapa interactivo con filtros
- Chatbot IA "Tío Viajero"
- Sistema de pagos (Stripe)
- +3,500 lugares indexados
- Planificador de rutas
- Sistema de tiers de calidad

### Próximos Pasos 🎯
- Testing extensivo
- Optimización de rendimiento
- SEO
- Deploy a producción (Vercel)

---

## 📞 Soporte

**Desarrollador:** Narciso Pardo Buendía  
**Email:** narciso.pardo@outlook.com  
**Repositorio:** https://github.com/Furgocasa/webcasicinco

---

## 📚 Documentación Adicional

- [LEEME_PRIMERO.md](./LEEME_PRIMERO.md) - Inicio rápido
- [README.md](./README.md) - Documentación completa
- [ESTADO_ACTUAL_PROYECTO.md](./ESTADO_ACTUAL_PROYECTO.md) - Estado del proyecto
- [CHATBOT_TIO_VIAJERO.md](./CHATBOT_TIO_VIAJERO.md) - Chatbot IA
- [SISTEMA_FILTRADO.md](./SISTEMA_FILTRADO.md) - Sistema de filtros

---

**¡Todo está configurado y listo para trabajar! 🚀**

*Última actualización: 12 de Octubre de 2025*

