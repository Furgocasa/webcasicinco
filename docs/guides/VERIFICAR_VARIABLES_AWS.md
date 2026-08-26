# Verificar variables de entorno (Vercel FURGOCASA)

Checklist. Los valores reales viven en `.env.local` (fuera de Git) y en Vercel. **Nunca** copies claves a este archivo ni a GitHub.

Hosting vivo (desde 26 ago 2026): **Vercel FURGOCASA** · proyecto `webcasicinco` · www.casicinco.com.  
La app Amplify `Casi_cinco_app` está **borrada**. El repo es `Furgocasa/webcasicinco`.

## Dónde mirar

1. Local: `W - FURGOCASA/webcasicinco/.env.local`
2. Producción: Vercel → equipo FURGOCASA → `webcasicinco` → Settings → Environment Variables
3. Scripts de un uso (migrar fotos, etc.): `../local/` (fuera de Git; leen este `.env.local`)

## Variables que tienen que existir

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts y admin. Secreta. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa |
| `GOOGLE_PLACES_API_KEY` / `GOOGLE_MAPS_API_KEY` | Indexación / Places |
| `OPENAI_API_KEY` | Chatbot y descripciones |
| `OPENAI_ENRICHMENT_MODEL` | Opcional. Modelo de fichas (si falta: gpt-4o-mini) |
| `NEXT_PUBLIC_APP_URL` | En producción: `https://www.casicinco.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe (público) |
| `STRIPE_SECRET_KEY` | Stripe. Secreta. |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Formulario de contacto |

Plantilla sin valores: `.env.example`.

## Si algo falla

| Síntoma | Variable |
|---|---|
| Chatbot no responde | `OPENAI_API_KEY` |
| Mapa en blanco | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| No autentica | `NEXT_PUBLIC_SUPABASE_URL` o `ANON_KEY` |
| Stripe no cobra | `STRIPE_SECRET_KEY` |

En el navegador: DevTools → Console. `undefined` = falta la variable; `401` = clave mal copiada.
