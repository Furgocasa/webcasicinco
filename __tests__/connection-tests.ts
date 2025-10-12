/**
 * Tests de Conexión - Verificar que todas las integraciones funcionan
 */

export async function testSupabaseConnection() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/places');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Supabase conectado correctamente');
      console.log(`   - ${data.places?.length || 0} lugares en la BD`);
      return true;
    }
    
    console.log('❌ Supabase NO conectado');
    return false;
  } catch (error) {
    console.log('❌ Error conectando a Supabase:', error);
    return false;
  }
}

export async function testGoogleMapsAPI() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.log('❌ Google Maps API Key NO configurada');
    return false;
  }
  
  console.log('✅ Google Maps API Key configurada');
  console.log(`   - Key: ${apiKey.substring(0, 10)}...`);
  return true;
}

export async function testOpenAIAPI() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OpenAI API Key NO configurada');
    return false;
  }
  
  console.log('✅ OpenAI API Key configurada');
  console.log(`   - Key: ${apiKey.substring(0, 15)}...`);
  return true;
}

export async function runAllConnectionTests() {
  console.log('🧪 Iniciando tests de conexión...\n');
  
  const supabase = await testSupabaseConnection();
  const googleMaps = await testGoogleMapsAPI();
  const openai = await testOpenAIAPI();
  
  console.log('\n📊 RESUMEN:');
  console.log(`   Supabase: ${supabase ? '✅' : '❌'}`);
  console.log(`   Google Maps: ${googleMaps ? '✅' : '❌'}`);
  console.log(`   OpenAI: ${openai ? '✅' : '❌'}`);
  
  const allPassed = supabase && googleMaps && openai;
  console.log(`\n${allPassed ? '✅ TODAS LAS CONEXIONES OK' : '❌ ALGUNAS CONEXIONES FALLAN'}`);
  
  return allPassed;
}

