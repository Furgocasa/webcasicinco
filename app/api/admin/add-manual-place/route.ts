import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getPlaceDetails, getPlacePhotos, downloadAndUploadPhotosToSupabase } from '@/lib/google/places';
import { generatePlaceSlug } from '@/lib/utils/slug-generator';

export const dynamic = 'force-dynamic';

/**
 * POST - Añadir lugar manualmente desde búsqueda
 * Inserta el lugar como borrador pendiente de enriquecimiento IA
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { place_id } = await request.json();

    if (!place_id) {
      return NextResponse.json({ error: 'place_id requerido' }, { status: 400 });
    }

    // Verificar que no exista ya
    const adminSupabase = createAdminClient();
    const { data: existing } = await adminSupabase
      .from('places')
      .select('id, name')
      .eq('google_place_id', place_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        error: `Este lugar ya existe en la base de datos: "${existing.name}"` 
      }, { status: 400 });
    }

    // Obtener detalles completos del lugar
    const placeDetails = await getPlaceDetails(place_id);
    
    // Obtener referencias de fotos por separado
    const photoReferences = await getPlacePhotos(place_id);

    // 📸 Descargar y subir fotos a Supabase Storage (ahorra costes futuros)
    console.log('📸 Descargando fotos a Supabase Storage...');
    const { photoUrls } = await downloadAndUploadPhotosToSupabase(
      place_id,
      placeDetails.name,
      photoReferences
    );
    console.log(`✅ ${photoUrls.length} fotos subidas a Supabase`);

    // Verificar requisitos
    if (placeDetails.rating < 4.7) {
      return NextResponse.json({ 
        error: `El lugar no cumple el requisito mínimo de 4.7★ (tiene ${placeDetails.rating}★)` 
      }, { status: 400 });
    }

    // Determinar categoría
    let category = 'restaurante';
    const types = placeDetails.types || [];
    if (types.includes('bar') || types.includes('night_club')) {
      category = 'bar';
    } else if (types.includes('cafe') || types.includes('coffee_shop')) {
      category = 'cafe';
    } else if (types.includes('lodging') || types.includes('hotel')) {
      category = 'hotel';
    }

    // Extraer ubicación
    const addressComponents = placeDetails.address_components || [];
    let province = '';
    let city = '';
    let region = '';
    let country = '';
    
    for (const component of addressComponents) {
      if (component.types.includes('administrative_area_level_1')) {
        region = component.long_name; // Comunidad Autónoma
      }
      if (component.types.includes('administrative_area_level_2')) {
        province = component.long_name;
      }
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('country')) {
        country = component.long_name;
      }
    }

    // Verificar que sea de España
    if (country && country !== 'España' && country !== 'Spain') {
      return NextResponse.json({
        error: `Este lugar no está en España (está en ${country})`
      }, { status: 400 });
    }

    const slug = generatePlaceSlug(placeDetails.name, city || province);

    // Buscar redes sociales si tiene website
    let instagramUrl = null;
    let facebookUrl = null;
    let twitterUrl = null;
    let tiktokUrl = null;

    if (placeDetails.website) {
      try {
        const response = await fetch(placeDetails.website, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) {
          const html = await response.text();
          const instagramMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
          const facebookMatch = html.match(/facebook\.com\/([a-zA-Z0-9._]+)/i);
          const twitterMatch = html.match(/twitter\.com\/([a-zA-Z0-9._]+)/i);
          const tiktokMatch = html.match(/tiktok\.com\/@([a-zA-Z0-9._]+)/i);
          
          if (instagramMatch) instagramUrl = `https://instagram.com/${instagramMatch[1]}`;
          if (facebookMatch) facebookUrl = `https://facebook.com/${facebookMatch[1]}`;
          if (twitterMatch) twitterUrl = `https://twitter.com/${twitterMatch[1]}`;
          if (tiktokMatch) tiktokUrl = `https://tiktok.com/@${tiktokMatch[1]}`;
        }
      } catch (error) {
        console.log('No se pudo scrapear website para redes sociales');
      }
    }

    // Preparar datos del lugar
    const placeData = {
      google_place_id: place_id,
      name: placeDetails.name,
      slug,
      category,
      rating: placeDetails.rating,
      review_count: placeDetails.user_ratings_total || 0,
      address: placeDetails.formatted_address,
      latitude: placeDetails.geometry.location.lat,
      longitude: placeDetails.geometry.location.lng,
      region: region || 'España', // Fallback a 'España' si no se encuentra
      province: province || null,
      city: city || null,
      country: 'España',
      phone: placeDetails.formatted_phone_number || null,
      website: placeDetails.website || null,
      google_maps_url: placeDetails.url || null,
      price_level: placeDetails.price_level || null,
      photos: photoReferences.slice(0, 3),
      photo_urls: photoUrls || [], // 📸 URLs de Supabase (GRATIS)
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      twitter_url: twitterUrl,
      tiktok_url: tiktokUrl,
      published: false, // Borrador
      needs_enrichment: true, // Pendiente de IA
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Insertar en BD
    const { data: newPlace, error: insertError } = await adminSupabase
      .from('places')
      .insert(placeData)
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando lugar:', insertError);
      throw new Error(`Error insertando: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      place: newPlace,
      message: 'Lugar añadido correctamente. Pendiente de enriquecimiento IA.',
      cost: 0.017, // $0.012 Place Details + $0.005 Photos
    });

  } catch (error: any) {
    console.error('Error añadiendo lugar manual:', error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

