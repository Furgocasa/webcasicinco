# 📧 Email Scraper - Casi Cinco

Script para extraer emails de las páginas web de los lugares indexados.

## 🎯 Objetivo

Obtener direcciones de email de contacto de los lugares **sin coste de APIs**, mediante scraping ético de sus websites públicos.

---

## 📊 Estado Actual

Para ver estadísticas actuales:

```bash
npm run scrape-emails stats
```

Esto mostrará:
- Total de lugares publicados
- Cuántos tienen website
- Cuántos ya tienen email
- Potencial de scraping (lugares con web pero sin email)

---

## 🚀 Uso

### 1. Ver estadísticas

```bash
npm run scrape-emails stats
```

**Ejemplo de salida:**
```
📊 Estadísticas:
   Total lugares publicados: 3336
   Con website: 2450 (73.4%)
   Con email: 120 (3.6%)
   Sin email: 2330

💡 Potencial de scraping: 2330 lugares
```

### 2. Procesar lugares

```bash
# Procesar 50 lugares (default)
npm run scrape-emails process

# Procesar 100 lugares
npm run scrape-emails process 100

# Procesar 10 lugares (prueba)
npm run scrape-emails process 10
```

---

## 🔍 Cómo Funciona

### Estrategia de búsqueda:

1. **Homepage** - Busca enlaces `mailto:` y emails en el texto
2. **Página de contacto** - Sigue enlaces a `/contacto`, `/contact`, etc.
3. **Validación** - Filtra emails genéricos (noreply@, example@, etc.)

### Fuentes identificadas:

- `homepage_mailto` - Link mailto: en homepage
- `homepage_text` - Email visible en texto de homepage
- `contact_page` - Email encontrado en página de contacto
- `not_found` - No se encontró email
- `error_network` - Error de red (timeout, DNS, etc.)

### Rate limiting:

- ⏱️ **2 segundos** entre cada request
- 🤝 **Respetuoso** con los servidores
- 🔒 **User-Agent** identificable como CasiCinco

---

## 📝 Campos en Base de Datos

Después de ejecutar el script, cada lugar tendrá:

```sql
email          VARCHAR(255)     -- Email encontrado
email_verified BOOLEAN          -- false por defecto (requiere validación manual)
email_source   VARCHAR(50)      -- Fuente: 'homepage_mailto', 'contact_page', etc.
```

---

## 📄 Reporte CSV

Cada ejecución genera un archivo CSV con:

```csv
ID,Nombre,Website,Email,Fuente,Error
uuid-123,"Restaurante El Sol","https://elsol.com","info@elsol.com","homepage_mailto",""
uuid-456,"Bar La Luna","https://laluna.es","","not_found",""
```

**Ubicación:** Raíz del proyecto  
**Nombre:** `email-scraping-report-[timestamp].csv`

---

## 📊 Tasa de Éxito Esperada

Según experiencia en proyectos similares:

| Métrica | Valor |
|---------|-------|
| Lugares con website | ~70-80% |
| De esos, con email visible | ~40-60% |
| **Resultado final** | **30-50%** de todos los lugares |

---

## ⚠️ Consideraciones Legales

### ✅ Legal y ético:

- Scraping de contenido **público** en webs
- Emails visibles son de carácter **comercial B2B**
- Uso para **contacto directo de negocio a negocio**

### ⚠️ RGPD (Cumplimiento):

- Solo para comunicación B2B (empresas)
- NO para marketing masivo sin consentimiento
- Incluir **opción de darse de baja** en emails
- Respetar solicitudes de eliminación

### 🚫 NO hacer:

- Spam o emails masivos no solicitados
- Vender o compartir la base de datos de emails
- Contacto sin propósito comercial legítimo

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'cheerio'"

```bash
npm install cheerio --save
```

### Error: "Cannot find module '@supabase/supabase-js'"

Ya debería estar instalado. Si no:

```bash
npm install @supabase/supabase-js --save
```

### El script es muy lento

Esto es normal. El delay de 2 segundos es **intencional** para:
- Ser respetuoso con los servidores
- Evitar ser bloqueados por rate limiting
- Cumplir buenas prácticas de scraping

**Velocidad:** ~30 lugares por minuto

---

## 📈 Uso Recomendado

### Primera vez:

```bash
# 1. Ver el potencial
npm run scrape-emails stats

# 2. Hacer prueba con 10 lugares
npm run scrape-emails process 10

# 3. Revisar el CSV generado

# 4. Si funciona bien, procesar más
npm run scrape-emails process 100
```

### Procesamiento masivo:

```bash
# Procesar por lotes de 100
npm run scrape-emails process 100
# Esperar a que termine (3-4 minutos)

# Repetir hasta completar todos
npm run scrape-emails process 100
```

---

## 💡 Próximas Mejoras

- [ ] Validación de email via SMTP (sin enviar)
- [ ] Detección de contactos alternativos (formularios)
- [ ] Scraping de redes sociales para emails
- [ ] Dashboard admin para revisar emails encontrados
- [ ] Verificación automática con servicio de email validation

---

## 🆘 Soporte

Si tienes problemas, revisa:

1. Que las variables de entorno estén configuradas
2. Que Supabase esté accesible
3. Que el campo `email` exista en la tabla `places`

Para dudas: Revisar los logs del script, son muy detallados.

---

**Creado:** 29 Noviembre 2025  
**Última actualización:** 29 Noviembre 2025  
**Coste:** €0 (sin uso de APIs de pago)

