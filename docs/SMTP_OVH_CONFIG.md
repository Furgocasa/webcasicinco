# 📧 Configuración SMTP para OVH

## Información del Email
- **Dominio**: casicinco.com
- **Email**: info@casicinco.com
- **Proveedor**: OVH (MXPLAN 005)

## Configuración SMTP de OVH

### Servidores SMTP de OVH:
- **Host**: ssl0.ovh.net
- **Puerto**: 587 (STARTTLS) o 465 (SSL)
- **Usuario**: info@casicinco.com (email completo)
- **Contraseña**: la de `.env.local` (`SMTP_PASS`). No la escribas aquí.

### Alternativa (si no funciona ssl0.ovh.net):
- **Host**: pro1.mail.ovh.net
- **Puerto**: 587

## Variables de Entorno

### Local (`.env.local`)
```bash
# SMTP Configuration for Contact Form (OVH)
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=your_smtp_password_here
```

### Producción (Vercel FURGOCASA)
Vercel → `webcasicinco` → Settings → Environment Variables:
```
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=your_smtp_password_here
```

## Servidores MX (ya configurados)
Según OVH, tus registros MX deben ser:
- mx1.mail.ovh.net (prioridad 1)
- mx2.mail.ovh.net (prioridad 5)
- mx3.mail.ovh.net (prioridad 100)

## 🧪 Probar el Formulario
1. Reinicia el servidor: `npm run dev`
2. Ve a: http://localhost:3000/contacto
3. Rellena el formulario
4. Verifica que llegue el email a info@casicinco.com

## Documentación OVH
- Configuración: https://docs.ovh.com/es/emails/
- Gestión: https://www.ovh.com/manager/

