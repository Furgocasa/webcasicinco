# Verificar variables de entorno (Amplify hoy / Vercel Furgocasa)

Checklist. Los valores reales viven en `.env.local` (fuera de Git) y en la consola de hosting. **Nunca** copies claves a este archivo ni a GitHub.

## Dónde mirar

1. Local: `Casi_cinco_app/.env.local`
2. Hoy: AWS Amplify → Casi Cinco → Environment variables
3. Destino: Vercel Furgocasa → proyecto que conectes a `Furgocasa/webcasicinco`

## Variables que tienen que existir

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts y admin. Secreta. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Mapa |
| `GOOGLE_PLACES_API_KEY` | Indexación / Places |
| `OPENAI_API_KEY` | Chatbot y descripciones |
| `OPENAI_ENRICHMENT_MODEL` | Opcional. Modelo de fichas (si falta: gpt-4o-mini) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe (público) |
| `STRIPE_SECRET_KEY` | Stripe. Secreta. |
| `STRIPE_WEBHOOK_SECRET` | Webhook Stripe |

Plantilla sin valores: `.env.example`.

## Si algo falla

| Síntoma | Variable |
|---|---|
| Chatbot no responde | `OPENAI_API_KEY` |
| Mapa en blanco | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| No autentica | `NEXT_PUBLIC_SUPABASE_URL` o `ANON_KEY` |
| Stripe no cobra | `STRIPE_SECRET_KEY` |

En el navegador: DevTools → Console. `undefined` = falta la variable; `401` = clave mal copiada.
