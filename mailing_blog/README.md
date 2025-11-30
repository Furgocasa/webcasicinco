# 📧 Emails HTML - Blog de Casi Cinco

Esta carpeta contiene plantillas de emails HTML para cada artículo del blog de Casi Cinco, con **datos reales** de los lugares, imágenes y descripciones.

## 🎨 Características de los Emails

Cada email replica fielmente el contenido del artículo del blog, incluyendo:

✅ **Imagen destacada real** - Del lugar #1 del Top 10 (mejor tier)  
✅ **Top 3 lugares con fotos reales** - Imágenes directas desde Supabase Storage  
✅ **Ratings y reseñas reales** - Datos actualizados de Google  
✅ **Descripciones IA** - Texto generado por IA para cada lugar  
✅ **Links directos** - A cada lugar específico en la web  
✅ **Diseño elegante** - Colores corporativos (#063971, #ffd935)  
✅ **Responsive** - Compatible con móvil y escritorio  
✅ **Compatible con Outlook** - Usando tablas e inline CSS  
✅ **Redes sociales** - Links a Instagram y Facebook  
✅ **Opción de darse de baja** - Mailto a info@casicinco.com  

## 📋 Artículos del Blog (18 emails)

Cada artículo tiene su propio email HTML con contenido real:

### 🔥 Más populares:
1. **email-mejores-hoteles-madrid.html** - Los 10 Mejores Hoteles de Madrid (19 vistas)
2. **email-mejores-restaurantes-madrid.html** - Los 10 Mejores Restaurantes de Madrid (6 vistas)
3. **email-mejores-restaurantes-barcelona.html** - Los 10 Mejores Restaurantes de Barcelona (6 vistas)

### 📍 Por ciudades:
- **Madrid**: Restaurantes, Hoteles, Bares
- **Barcelona**: Restaurantes, Hoteles, Bares
- **Valencia**: Restaurantes, Bares
- **Sevilla**: Restaurantes, Bares
- **Granada**: Restaurantes, Hoteles, Bares
- **Málaga**: Restaurantes, Hoteles
- **Murcia**: Restaurantes, Bares
- **Bilbao**: Restaurantes

## 🏗️ Estructura de cada Email

```html
1. Logo de Casi Cinco
2. Título del artículo con emoji (🍽️/🍺/🏨)
3. Links a redes sociales (Instagram, Facebook)
4. Imagen destacada (del lugar #1)
5. Introducción del artículo
6. CTA: "Leer artículo completo"
7. Top 3 Lugares Destacados:
   - Foto real del lugar
   - Posición en el ranking
   - Nombre del lugar
   - Rating y número de reseñas
   - Descripción IA (150 chars)
   - Botón "Ver detalles"
8. Aviso: "+ 7 lugares más en el artículo completo"
9. CTA: "Ver Top 10 completo"
10. Información de la app (30 días gratis, 2.99€/mes)
11. Footer con redes sociales y darse de baja
```

## 🔄 Datos en Tiempo Real

Los emails se generan con datos reales obtenidos de:
- **Blog API**: `https://www.casicinco.com/api/blog`
- **Artículo API**: `https://www.casicinco.com/api/blog/[slug]`

Incluyen:
- Fotos almacenadas en **Supabase Storage** (gratis, sin coste de Google API)
- Ratings y reseñas de **Google My Business**
- Descripciones generadas por **IA** (OpenAI)
- Información actualizada de cada lugar (dirección, teléfono, web)

## 📧 Uso de los Emails

1. Cada email tiene el nombre: `email-[slug-del-articulo].html`
2. Están listos para enviar con cualquier servicio de email marketing
3. Todos los links apuntan a la web de producción
4. Las imágenes se cargan desde URLs públicas (Supabase Storage)

## 🆕 Actualización Futura

Cada vez que se publique un nuevo artículo en el blog:

1. Ejecutar el script de generación (ya eliminado, pero puede recrearse)
2. O crear manualmente siguiendo la estructura establecida
3. El email debe incluir los datos reales del artículo y sus lugares

## 🎯 Objetivo de los Emails

- **Informar** a los suscriptores sobre nuevos artículos del blog
- **Mostrar preview** del Top 3 lugares para generar interés
- **Atraer tráfico** a la web y al blog
- **Convertir** lectores en usuarios de la app premium
- **Mantener engagement** con contenido de calidad real

## 🔗 Links en los Emails

Cada email contiene múltiples CTAs:
- Link al artículo completo del blog
- Link a cada uno de los 3 lugares destacados
- Link a la home de Casi Cinco
- Links a Instagram y Facebook
- Link de darse de baja

---

**Última actualización:** 30 de noviembre de 2025  
**Total de emails:** 18 artículos publicados  
**Datos:** 100% reales desde la base de datos y Supabase Storage  
**Imágenes:** URLs públicas de Supabase (sin coste Google API)
