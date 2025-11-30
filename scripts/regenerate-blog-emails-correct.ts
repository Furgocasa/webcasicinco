import https from 'https';
import fs from 'fs';
import path from 'path';

interface Place {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  address?: string;
  photo_urls?: string[];
  photos?: string[];
  ai_description?: string;
  slug: string;
  province: string;
  category: string;
}

interface BlogPost {
  slug: string;
  title: string;
  category: 'restaurante' | 'bar' | 'hotel';
  location: string;
  location_type: 'city' | 'province' | 'community';
  intro_text: string;
  first_place_photo?: string;
  places: Place[];
}

function getPlacePhotoUrl(place: Place): string {
  if (place.photo_urls && place.photo_urls.length > 0) {
    return place.photo_urls[0];
  }
  return 'https://www.casicinco.com/images/placeholder.jpg';
}

function generateEnhancedEmailHTML(post: BlogPost): string {
  const categoryEmoji = post.category === 'restaurante' ? '🍽️' : 
                        post.category === 'bar' ? '🍺' : 
                        post.category === 'hotel' ? '🏨' : '📍';

  const topPlaces = post.places.slice(0, 3); // Top 3 en el email
  const featuredImage = post.first_place_photo || getPlacePhotoUrl(topPlaces[0]);

  const placesHTML = topPlaces.map((place, index) => `
    <!-- Lugar #${index + 1} -->
    <tr>
      <td style="padding: 0 0 30px;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 0;">
              <img src="${getPlacePhotoUrl(place)}" alt="${place.name}" style="width: 100%; height: auto; display: block; max-height: 250px; object-fit: cover;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 20px;">
              <div style="margin-bottom: 10px;">
                <span style="display: inline-block; font-size: 20px; font-weight: 700; color: #063971; margin-right: 8px;">#${index + 1}</span>
                <span style="display: inline-block; font-size: 18px; font-weight: 600; color: #1a1a1a;">${place.name}</span>
              </div>
              <div style="margin-bottom: 12px;">
                <span style="color: #ffd935; font-size: 16px;">★</span>
                <span style="font-size: 15px; font-weight: 600; color: #333;">${place.rating}</span>
                <span style="font-size: 14px; color: #666; margin-left: 5px;">(${place.review_count} reseñas)</span>
              </div>
              ${place.ai_description ? `
              <p style="margin: 0 0 15px; font-size: 14px; color: #555; line-height: 1.5;">
                ${place.ai_description.substring(0, 150)}...
              </p>
              ` : ''}
              <a href="https://www.casicinco.com/${place.category}/${place.province}/${place.slug}" style="display: inline-block; padding: 10px 20px; background-color: #063971; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; border-radius: 6px; margin-top: 5px;">
                Ver detalles →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa;">
  
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 30px 40px 20px;">
              <img src="https://www.casicinco.com/images/casi_cinco_blue.png" alt="Casi Cinco" style="height: 50px; width: auto;" />
            </td>
          </tr>

          <!-- Título del artículo -->
          <tr>
            <td style="padding: 10px 40px 20px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 10px;">${categoryEmoji}</div>
              <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #063971; line-height: 1.3;">
                ${post.title}
              </h1>
            </td>
          </tr>

          <!-- Redes sociales -->
          <tr>
            <td align="center" style="padding: 0 40px 20px;">
              <table role="presentation" style="border-collapse: collapse; margin: 0 auto;">
                <tr>
                  <td style="padding: 0 10px;">
                    <a href="https://www.instagram.com/casi_cinco" style="display: inline-block;">
                      <img src="https://www.casicinco.com/images/instagram-icon.png" alt="Instagram" style="width: 32px; height: 32px;" />
                    </a>
                  </td>
                  <td style="padding: 0 10px;">
                    <a href="https://www.facebook.com/casicincoapp" style="display: inline-block;">
                      <img src="https://www.casicinco.com/images/facebook-icon.png" alt="Facebook" style="width: 32px; height: 32px;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Imagen destacada -->
          <tr>
            <td style="padding: 0 0 30px;">
              <img src="${featuredImage}" alt="${post.title}" style="width: 100%; height: auto; display: block; max-height: 400px; object-fit: cover;" />
            </td>
          </tr>

          <!-- Introducción -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.6;">
                ${post.intro_text.substring(0, 300)}...
              </p>
            </td>
          </tr>

          <!-- CTA para leer completo -->
          <tr>
            <td align="center" style="padding: 0 40px 40px;">
              <a href="https://www.casicinco.com/blog/${post.slug}" style="display: inline-block; padding: 16px 40px; background-color: #063971; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                Leer artículo completo →
              </a>
            </td>
          </tr>

          <!-- Divisor -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #e9ecef;"></div>
            </td>
          </tr>

          <!-- Top 3 lugares -->
          <tr>
            <td style="padding: 30px 40px 10px;">
              <h2 style="margin: 0 0 25px; font-size: 22px; font-weight: 600; color: #063971; text-align: center;">
                🏆 Top ${topPlaces.length} Lugares Destacados
              </h2>
            </td>
          </tr>

          <!-- Lugares destacados -->
          <tr>
            <td style="padding: 0 40px 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${placesHTML}
              </table>
            </td>
          </tr>

          <!-- Ver los 10 -->
          <tr>
            <td align="center" style="padding: 0 40px 40px;">
              <p style="margin: 0 0 15px; font-size: 15px; color: #666;">
                + ${post.places.length - 3} lugares más en el artículo completo
              </p>
              <a href="https://www.casicinco.com/blog/${post.slug}" style="display: inline-block; padding: 14px 32px; background-color: #063971; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
                Ver Top ${post.places.length} completo
              </a>
            </td>
          </tr>

          <!-- Divisor -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: #e9ecef;"></div>
            </td>
          </tr>

          <!-- Beneficios de la app -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="margin: 0 0 20px; font-size: 20px; font-weight: 600; color: #063971; text-align: center;">
                ¿Aún no conoces Casi Cinco?
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; color: #555; line-height: 1.6; text-align: center;">
                La app que te muestra <strong>solo los mejores lugares</strong> de España con mínimo 4.7★
              </p>
              
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px 0; font-size: 15px; color: #333;">
                    ✨ <strong>Lugares verificados</strong> - Solo excelencia
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 15px; color: #333;">
                    🗺️ <strong>Mapa interactivo</strong> - Encuentra cerca de ti
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 15px; color: #333;">
                    🤖 <strong>Chatbot IA</strong> - Te ayuda a decidir
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; font-size: 15px; color: #333;">
                    📱 <strong>30 días gratis</strong> - Luego solo 2.99€/mes
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td align="center">
                    <a href="https://www.casicinco.com" style="display: inline-block; padding: 14px 32px; background-color: #063971; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 6px;">
                      Probar 30 días gratis
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0; font-size: 13px; color: #777; text-align: center;">
                Los lugares <strong>no pagan</strong> por aparecer en Casi Cinco
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; text-align: center;">
              
              <table role="presentation" style="border-collapse: collapse; margin: 0 auto 20px;">
                <tr>
                  <td style="padding: 0 10px;">
                    <a href="https://www.instagram.com/casi_cinco" style="color: #666; text-decoration: none; font-size: 13px;">
                      <img src="https://www.casicinco.com/images/instagram-icon.png" alt="Instagram" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 5px;" />
                      Instagram
                    </a>
                  </td>
                  <td style="padding: 0 10px;">
                    <a href="https://www.facebook.com/casicincoapp" style="color: #666; text-decoration: none; font-size: 13px;">
                      <img src="https://www.casicinco.com/images/facebook-icon.png" alt="Facebook" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 5px;" />
                      Facebook
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px; font-size: 12px; color: #777; line-height: 1.5;">
                <strong>Casi Cinco</strong><br>
                Los mejores lugares de España con mínimo 4.7★<br>
                <a href="https://www.casicinco.com" style="color: #063971; text-decoration: none;">www.casicinco.com</a>
              </p>

              <p style="margin: 15px 0 0; font-size: 11px; color: #999;">
                <a href="mailto:info@casicinco.com?subject=Por favor - Quiero dejar de recibir este tipo de correos" style="color: #999; text-decoration: underline;">
                  Darse de baja
                </a>
              </p>
            </td>
          </tr>

        </table>
        
      </td>
    </tr>
  </table>

</body>
</html>`;
}

async function fetchBlogPost(slug: string): Promise<BlogPost> {
  return new Promise((resolve, reject) => {
    https.get(`https://www.casicinco.com/api/blog/${slug}`, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success && response.post) {
            resolve(response.post);
          } else {
            reject(new Error(`No post data for ${slug}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function regenerateAllBlogEmails() {
  console.log('📧 Regenerando emails HTML para artículos del blog con datos reales...\n');

  return new Promise((resolve, reject) => {
    https.get('https://www.casicinco.com/api/blog?limit=100', async (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        try {
          const response = JSON.parse(data);
          const posts = response.posts || [];

          console.log(`✅ Encontrados ${posts.length} artículos\n`);

          const outputDir = path.join(process.cwd(), 'mailing_blog');
          let processed = 0;
          let errors = 0;

          for (const postSummary of posts) {
            try {
              console.log(`🔄 Procesando: ${postSummary.title}...`);
              
              // Obtener datos completos del post con sus lugares
              const fullPost = await fetchBlogPost(postSummary.slug);
              
              if (!fullPost.places || fullPost.places.length === 0) {
                console.log(`   ⚠️  Sin lugares disponibles, usando versión básica`);
              }

              const filename = `email-${postSummary.slug}.html`;
              const filepath = path.join(outputDir, filename);

              const html = generateEnhancedEmailHTML(fullPost);
              fs.writeFileSync(filepath, html, 'utf-8');
              
              console.log(`   ✅ Creado: ${filename}`);
              processed++;

              // Pequeño delay para no saturar la API
              await new Promise(r => setTimeout(r, 200));
              
            } catch (error: any) {
              console.log(`   ❌ Error: ${error.message}`);
              errors++;
            }
          }

          console.log(`\n🎉 Proceso completado:`);
          console.log(`   - Procesados: ${processed}`);
          console.log(`   - Errores: ${errors}`);
          console.log(`   - Total: ${posts.length}`);
          
          resolve(posts);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

regenerateAllBlogEmails()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

