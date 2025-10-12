/**
 * Tests de Funcionalidad - Verificar que las features principales funcionan
 */

export async function testIndexation() {
  console.log('🔍 Test: Indexación de lugares...');
  
  try {
    // Verificar que el endpoint existe
    const response = await fetch('http://localhost:3000/api/admin/start-indexation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provinces: ['La Rioja'],
        categories: ['restaurante'],
        minRating: 4.7,
      }),
    });
    
    if (response.ok) {
      console.log('✅ Endpoint de indexación funciona');
      return true;
    }
    
    console.log('❌ Endpoint de indexación NO funciona');
    return false;
  } catch (error) {
    console.log('❌ Error en indexación:', error);
    return false;
  }
}

export async function testEnrichment() {
  console.log('🎨 Test: Enriquecimiento con IA...');
  
  try {
    const response = await fetch('http://localhost:3000/api/admin/enrich-places', {
      method: 'POST',
    });
    
    const data = await response.json();
    
    if (data.success !== undefined) {
      console.log('✅ Endpoint de enriquecimiento funciona');
      console.log(`   - ${data.enriched || 0} lugares enriquecidos`);
      return true;
    }
    
    console.log('❌ Endpoint de enriquecimiento NO funciona');
    return false;
  } catch (error) {
    console.log('❌ Error en enriquecimiento:', error);
    return false;
  }
}

export async function testPlaceRetrieval() {
  console.log('📍 Test: Obtención de lugares...');
  
  try {
    const response = await fetch('http://localhost:3000/api/places?limit=10');
    const data = await response.json();
    
    if (data.success && data.places) {
      console.log('✅ Endpoint de lugares funciona');
      console.log(`   - ${data.places.length} lugares obtenidos`);
      console.log(`   - Total en BD: ${data.total || 0}`);
      return true;
    }
    
    console.log('❌ Endpoint de lugares NO funciona');
    return false;
  } catch (error) {
    console.log('❌ Error obteniendo lugares:', error);
    return false;
  }
}

export async function testChatbot() {
  console.log('🤖 Test: Chatbot IA...');
  
  try {
    const response = await fetch('http://localhost:3000/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: '¿Cómo funciona la app?',
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.message) {
      console.log('✅ Chatbot funciona');
      console.log(`   - Respuesta: "${data.message.substring(0, 50)}..."`);
      return true;
    }
    
    console.log('❌ Chatbot NO funciona');
    return false;
  } catch (error) {
    console.log('❌ Error en chatbot:', error);
    return false;
  }
}

export async function runAllFunctionalityTests() {
  console.log('🧪 Iniciando tests de funcionalidad...\n');
  
  const indexation = await testIndexation();
  const enrichment = await testEnrichment();
  const places = await testPlaceRetrieval();
  const chatbot = await testChatbot();
  
  console.log('\n📊 RESUMEN:');
  console.log(`   Indexación: ${indexation ? '✅' : '❌'}`);
  console.log(`   Enriquecimiento: ${enrichment ? '✅' : '❌'}`);
  console.log(`   Lugares: ${places ? '✅' : '❌'}`);
  console.log(`   Chatbot: ${chatbot ? '✅' : '❌'}`);
  
  const allPassed = indexation && enrichment && places && chatbot;
  console.log(`\n${allPassed ? '✅ TODAS LAS FUNCIONALIDADES OK' : '❌ ALGUNAS FUNCIONALIDADES FALLAN'}`);
  
  return allPassed;
}

