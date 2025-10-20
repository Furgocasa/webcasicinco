# 🗺️ FIX: Google Maps no carga en páginas de detalle

**Fecha:** 18 de Octubre de 2025  
**Problema:** El mapa de Google Maps no se muestra en las páginas de detalle de lugares

---

## 🔍 CAUSA DEL PROBLEMA

Next.js distingue entre variables de entorno para **servidor** y **cliente**:

- **Servidor:** `GOOGLE_MAPS_API_KEY` ✅ (ya existe en AWS)
- **Cliente:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ❌ (FALTA)

El componente `PlaceContent.tsx` es **Client Component** (`'use client'`) y usa `useLoadScript` de `@react-google-maps/api`, que se ejecuta en el navegador.

**Por tanto:** Necesita `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` para funcionar.

---

## ✅ SOLUCIÓN

### Opción A: Añadir variable en AWS Amplify (Recomendado)

1. **Ir a AWS Amplify Console:**
   - https://console.aws.amazon.com/amplify/home
   - Seleccionar app "Casi Cinco"
   - Ir a "Environment variables"

2. **Añadir nueva variable:**
   ```
   Key:   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
   Value: your_google_maps_api_key_here
   ```
   *(Usar el mismo valor que `GOOGLE_MAPS_API_KEY`)*

3. **Redeploy:**
   - Hacer un nuevo commit (cualquier cambio)
   - O forzar redeploy desde AWS Amplify

---

### Opción B: Crear `.env.local` para desarrollo local

Si quieres probar en local antes de deployar:

```bash
# Crear archivo .env.local en la raíz del proyecto
echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here" > .env.local
```

**⚠️ IMPORTANTE:** Este archivo NO debe subirse a Git (ya está en `.gitignore`)

---

## 🎯 VERIFICAR QUE FUNCIONA

Después de añadir la variable:

1. **Abrir consola del navegador** (F12)
2. **Ir a una página de lugar:** https://casicinco.com/restaurante/Madrid/...
3. **Buscar errores:**
   - ❌ Si ves: "Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" → Variable no configurada
   - ✅ Si ves el mapa cargando → Funciona correctamente

---

## 📊 ESTADO ACTUAL

- ✅ **Código actualizado** con mejor manejo de errores
- ✅ **Mensaje de fallback** si no hay API key
- ✅ **Botón "Ver en Google Maps"** siempre funciona
- ⏳ **Falta:** Añadir `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en AWS Amplify

---

## 🔐 SEGURIDAD

**¿Es seguro exponer la API key en el cliente?**

Sí, con restricciones configuradas en Google Cloud Console:

1. **Restricciones por dominio:**
   - Solo `casicinco.com` y `*.casicinco.com`

2. **Restricciones por API:**
   - Solo "Maps JavaScript API"
   - Solo "Places API"

3. **Cuotas:**
   - Limitar requests diarios
   - Alertas de uso

**Ya deberías tener esto configurado en:**
https://console.cloud.google.com/apis/credentials

---

## 🚀 ARCHIVOS MODIFICADOS

- ✅ `components/places/PlaceContent.tsx` - Mejor manejo de errores
- ✅ `FIX_GOOGLE_MAPS_EN_CLIENTE.md` - Esta documentación

---

## 📝 SIGUIENTE PASO

**Tú debes hacer:**
1. Ir a AWS Amplify Console
2. Añadir `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` en Environment Variables
3. Redeploy o hacer commit para forzar rebuild

**Tiempo:** 2-3 minutos

