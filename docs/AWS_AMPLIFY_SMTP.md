# Configuración SMTP para AWS Amplify

## ⚠️ IMPORTANTE: Configurar en AWS Amplify

Para que el formulario de contacto funcione en producción, debes agregar estas variables de entorno en AWS Amplify:

### Pasos:

1. Ve a: https://console.aws.amazon.com/amplify/
2. Selecciona tu aplicación "Casi Cinco App"
3. Ve a: **Environment variables** (en el menú lateral)
4. Haz clic en: **Manage variables**
5. Agrega estas 4 variables:

```
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_USER=info@casicinco.com
SMTP_PASS=your_smtp_password_here
```

6. Guarda los cambios
7. **Redeploy** la aplicación para que tome los cambios

### ✅ Verificación

Después del deploy, prueba el formulario en:
- https://www.casicinco.com/contacto

El email debe llegar a: info@casicinco.com

---

## 📝 Notas

- OVH usa `ssl0.ovh.net` como servidor SMTP
- El puerto 587 usa STARTTLS (recomendado)
- Si 587 no funciona, prueba el puerto 465 (SSL directo)
- El usuario debe ser el email completo: `info@casicinco.com`

