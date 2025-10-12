# ⚠️ Verificación CRÍTICA de Variables de Entorno en AWS

**Fecha:** 12 de Octubre de 2025  
**Problema Detectado:** Chatbot y Admin no funcionan en AWS  
**Causa Probable:** Variables de entorno mal configuradas

---

## 🔍 VERIFICA ESTAS 9 VARIABLES EN AWS AMPLIFY

### **Paso 1: Ir a Variables de Entorno**

1. **AWS Amplify Console** → Tu app **CasiCinco**
2. **App settings** (menú lateral) → **Environment variables**
3. **Verifica CADA UNA:**

---

### **Variable 1: NEXT_PUBLIC_SUPABASE_URL**

**Valor correcto:**
```
https://zzycxijexoxrjpijslsb.supabase.co
```

❌ **Error común:** Espacios antes/después, protocolo http en vez de https

---

### **Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**

**Valor correcto:**
```
your_supabase_anon_key_here
```

❌ **Error común:** Token cortado, espacios, caracteres faltantes

---

### **Variable 3: SUPABASE_SERVICE_ROLE_KEY**

**Valor correcto:**
```
your_supabase_anon_key_here
```

---

### **Variable 4: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY**

**Valor correcto:**
```
your_google_maps_api_key_here
```

---

### **Variable 5: GOOGLE_PLACES_API_KEY**

**Valor correcto:**
```
your_google_maps_api_key_here
```

*(Sí, es la misma que GOOGLE_MAPS_API_KEY)*

---

### **Variable 6: OPENAI_API_KEY** ⚠️ CRÍTICA PARA CHATBOT

**Valor correcto:**
```
your_openai_api_key_here
```

❌ **Si esto NO está o está MAL → Chatbot NO funciona**

---

### **Variable 7: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**

**Valor correcto:**
```
pk_test_xxxxx
```

---

### **Variable 8: STRIPE_SECRET_KEY**

**Valor correcto:**
```
sk_test_xxxxx
```

---

### **Variable 9: STRIPE_WEBHOOK_SECRET**

**Valor actual (temporal):**
```
whsec_temporal123
```

*(Esto lo actualizarás después cuando configures el webhook real)*

---

## 🚨 ACCIÓN INMEDIATA:

### **1. Verifica OPENAI_API_KEY en AWS**

Esta es la **MÁS IMPORTANTE** para el chatbot.

**En AWS Amplify:**
1. **Environment variables**
2. Busca **OPENAI_API_KEY**
3. Verifica que sea EXACTAMENTE:
```
your_openai_api_key_here
```

### **2. Si Está Mal o Falta:**

1. **Administrar variables**
2. **Editar** o **Añadir** OPENAI_API_KEY
3. **Copia EXACTAMENTE** el valor de arriba
4. **Guardar**
5. **Redesplegar**

---

## 🧪 Prueba Después de Redesplegar:

1. **Refresca** la app de AWS
2. **Prueba el chatbot** (botón Tío Viajero abajo a la derecha)
3. **Prueba el admin** → Gestión de Lugares

---

## 📋 Checklist de Síntomas vs Variables:

| Síntoma | Variable que falta/está mal |
|---------|---------------------------|
| Chatbot no responde | `OPENAI_API_KEY` |
| Admin no carga lugares | Ya arreglado (paginación) |
| Mapa no carga | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| No autentica | `NEXT_PUBLIC_SUPABASE_URL` o `ANON_KEY` |
| Stripe no funciona | `STRIPE_SECRET_KEY` |

---

## 📞 Debugging en Producción:

**Para ver errores específicos:**

1. En la app de AWS, abre **DevTools** (F12)
2. **Console** → Busca errores en rojo
3. Si dice algo como:
   - `"OPENAI_API_KEY is undefined"` → Variable falta
   - `"Invalid API key"` → Variable mal copiada
   - `"401 Unauthorized"` → Supabase keys mal

---

**Ve AHORA a AWS Amplify → Environment variables y verifica especialmente OPENAI_API_KEY.** 🔍

