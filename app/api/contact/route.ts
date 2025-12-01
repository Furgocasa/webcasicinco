import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message, acceptPrivacy } = await request.json();

    // Validación básica
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    // Verificar checkbox de privacidad
    if (!acceptPrivacy) {
      return NextResponse.json(
        { success: false, error: 'Debes aceptar la política de privacidad' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Configurar el transportador de email
    // NOTA: Necesitarás configurar las variables de entorno SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true para 465, false para otros puertos
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Contenido del email
    const mailOptions = {
      from: `"Formulario Casi Cinco" <${process.env.SMTP_USER}>`,
      to: 'info@casicinco.com',
      replyTo: email,
      subject: `[Contacto Web] ${subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #002297; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">📧 Nuevo Mensaje de Contacto</h2>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px;">
              <h3 style="color: #002297; margin-top: 0;">Información del Contacto</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Nombre:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${name}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Email:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Asunto:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${subject}</td>
                </tr>
              </table>
              
              <h3 style="color: #002297; margin-top: 30px;">Mensaje</h3>
              <div style="background-color: #f9fafb; padding: 20px; border-left: 4px solid #002297; border-radius: 4px;">
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #666; margin: 0;">
                Este mensaje fue enviado desde el formulario de contacto de <strong>www.casicinco.com</strong>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Nuevo mensaje de contacto

Nombre: ${name}
Email: ${email}
Asunto: ${subject}

Mensaje:
${message}

---
Enviado desde www.casicinco.com
      `,
    };

    // Enviar el email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Mensaje enviado correctamente',
    });
  } catch (error: any) {
    console.error('Error enviando email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al enviar el mensaje. Por favor, intenta de nuevo o escribe directamente a info@casicinco.com' 
      },
      { status: 500 }
    );
  }
}

