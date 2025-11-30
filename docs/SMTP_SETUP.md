# 📧 Configuración de Email para Formulario de Contacto

## Credenciales Actuales

```
Email: info@casicinco.com
Host: smtp.gmail.com
Puerto: 587
```

## ⚠️ IMPORTANTE: Contraseña de Aplicación de Gmail

Gmail requiere una **contraseña de aplicación** en lugar de tu contraseña normal para enviar emails desde aplicaciones externas.

### Pasos para crear una contraseña de aplicación:

1. **Ve a tu cuenta de Google**: https://myaccount.google.com/
2. **Seguridad** → En el menú lateral izquierdo
3. **Verificación en dos pasos** → Debe estar ACTIVADA (requisito obligatorio)
4. **Contraseñas de aplicaciones** → Busca esta opción (aparece solo si tienes 2FA activado)
5. **Crear nueva contraseña de aplicación**:
   - Selecciona "Correo"
   - Selecciona "Otro (nombre personalizado)"
   - Escribe: "Casi Cinco Formulario Contacto"
   - Haz clic en "Generar"
6. **Copia la contraseña de 16 caracteres** que te dan
7. **Actualiza el archivo `.env.local`** con esa contraseña:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # Pega aquí la contraseña de 16 caracteres
```

## Variables de Entorno

### Local (`.env.local`)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=tu_contraseña_de_aplicación_aquí
```

### Producción (AWS Amplify)

Ve a AWS Amplify Console → Tu App → Environment Variables y agrega:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=tu_contraseña_de_aplicación_aquí
```

## 🔧 Alternativa: Si no puedes usar Gmail

Si tienes problemas con Gmail, puedes usar otros servicios SMTP:

### SendGrid (Recomendado)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=tu_api_key_de_sendgrid
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASS=tu_contraseña_de_mailgun
```

### SMTP Propio (si tienes hosting con email)
```bash
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=tu_contraseña
```

## 🧪 Probar el Formulario

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Ve a: http://localhost:3000/contacto
3. Rellena el formulario
4. Verifica que llegue el email a info@casicinco.com

## 🐛 Solución de Problemas

### Error: "Invalid login"
- Verifica que has creado una contraseña de aplicación
- Verifica que la verificación en dos pasos está activada en Gmail
- Copia la contraseña sin espacios

### Error: "Less secure app access"
- Gmail ya no permite esta opción
- DEBES usar contraseña de aplicación

### El email no llega
- Revisa la carpeta de SPAM
- Verifica que el servidor esté reiniciado después de cambiar `.env.local`
- Revisa los logs del servidor de desarrollo

## 📝 Notas

- Los emails se envían desde `info@casicinco.com`
- Los mensajes llegan a `info@casicinco.com`
- El campo "Reply-To" se configura con el email del usuario que envía el mensaje
- El formulario incluye protección contra spam con checkbox de privacidad

