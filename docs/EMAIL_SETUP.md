# 📧 Configuración de Email para Formulario de Contacto

## Variables de Entorno Necesarias

Añade estas variables a tu archivo `.env.local`:

```env
# Email SMTP (para formulario de contacto)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
```

## Opción 1: Gmail

1. **Crear una cuenta de Gmail** (si no tienes una)
2. **Activar 2FA** (autenticación de dos factores)
3. **Generar contraseña de aplicación:**
   - Ve a https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Copia la contraseña generada

4. **Configurar variables:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tucuenta@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # La contraseña de aplicación generada
```

## Opción 2: Otros Proveedores SMTP

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_sendgrid_api_key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu_mailgun_password
```

### Amazon SES
```env
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=tu_ses_smtp_username
SMTP_PASS=tu_ses_smtp_password
```

## Cómo Funciona

1. Usuario rellena el formulario en `/contacto`
2. Debe aceptar el checkbox de política de privacidad
3. El formulario envía los datos a `/api/contact`
4. La API valida los datos y envía el email a `info@casicinco.com`
5. El usuario recibe confirmación de envío

## Protección Anti-Spam

- ✅ Checkbox obligatorio de aceptación de privacidad
- ✅ Validación de email en backend
- ✅ Todos los campos son obligatorios
- ✅ Rate limiting automático de Next.js

## Testear en Local

1. Configura las variables SMTP en `.env.local`
2. Reinicia el servidor: `npm run dev`
3. Ve a `/contacto` y envía un mensaje de prueba
4. Verifica que llegue a `info@casicinco.com`

## Troubleshooting

**Error: "Error al enviar el mensaje"**
- Verifica que las variables SMTP estén correctas
- Comprueba que la contraseña de aplicación sea válida
- Revisa los logs del servidor para más detalles

**El mensaje no llega**
- Revisa la carpeta de spam en info@casicinco.com
- Verifica que el SMTP_USER tenga permisos de envío
- Comprueba los logs del servidor

## Testing en Producción (AWS Amplify)

Añade las variables de entorno en AWS Amplify:

1. Ve a tu app en AWS Amplify Console
2. App settings → Environment variables
3. Añade las 4 variables SMTP
4. Redeploy la app

