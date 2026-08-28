/**
 * Test de estrés del Tío Viajero.
 *
 * Lanza escenarios realistas (uno o varios turnos, con o sin GPS) contra
 * /api/chatbot y escribe un informe con cada pregunta y respuesta.
 * Después se evalúan con: npx tsx scripts/review-chatbot-messages.ts --limit=150
 *
 * Uso:
 *   npx tsx scripts/stress-test-chatbot.ts                 → todos los escenarios
 *   npx tsx scripts/stress-test-chatbot.ts --base=https://www.casicinco.com
 *   npx tsx scripts/stress-test-chatbot.ts --only=gps      → solo escenarios cuyo nombre contenga «gps»
 *   npx tsx scripts/stress-test-chatbot.ts --limit=20      → solo los primeros N escenarios
 *   npx tsx scripts/stress-test-chatbot.ts --only=v2       → solo la batería ampliada (110)
 *   npx tsx scripts/stress-test-chatbot.ts --only=base     → solo la batería original (~55)
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL =
  process.argv.find((a) => a.startsWith('--base='))?.slice(7) || 'http://localhost:3000';
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7)?.toLowerCase();
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.slice(8)) || Infinity;

// Coordenadas de prueba (solo las que usan escenarios con GPS)
const GPS = {
  murciaCentro: { lat: 37.9922, lng: -1.1307 },
  madridSol: { lat: 40.4168, lng: -3.7038 },
  valenciaCentro: { lat: 39.4699, lng: -0.3763 },
  laAlbercaMurcia: { lat: 37.9345, lng: -1.1417 },
  campoNijar: { lat: 36.9663, lng: -2.2065 },
  sevillaTriana: { lat: 37.3826, lng: -6.0069 },
  barcelonaRamblas: { lat: 41.3809, lng: 2.1734 },
  bilbaoGuggenheim: { lat: 43.2687, lng: -2.9340 },
  granadaAlbaicin: { lat: 37.1773, lng: -3.5986 },
  santanderSardinero: { lat: 43.4623, lng: -3.8099 },
  zaragozaPilar: { lat: 41.6561, lng: -0.8773 },
  toledoCentro: { lat: 39.8628, lng: -4.0273 },
  salamancaPlaza: { lat: 40.9701, lng: -5.6635 },
  santiagoCentro: { lat: 42.8805, lng: -8.5456 },
  pamplonaCentro: { lat: 42.8125, lng: -1.6458 },
  palmaCentro: { lat: 39.5696, lng: 2.6502 },
  cadizCentro: { lat: 36.5271, lng: -6.2886 },
  cordobaMezquita: { lat: 37.8790, lng: -4.7794 },
  vigoCentro: { lat: 42.2406, lng: -8.7207 },
  oviedoCentro: { lat: 43.3619, lng: -5.8494 },
  logronoCentro: { lat: 42.4627, lng: -2.4449 },
  albaceteCentro: { lat: 38.9943, lng: -1.8585 },
  lasPalmasCentro: { lat: 28.1235, lng: -15.4363 },
  alicanteCentro: { lat: 38.3452, lng: -0.4810 },
  marbellaCentro: { lat: 36.5101, lng: -4.8824 },
  caravaca: { lat: 38.1056, lng: -1.8634 },
  yeclaCentro: { lat: 38.6135, lng: -1.1147 },
  cartagenaCentro: { lat: 37.6256, lng: -0.9966 },
  ibizaCentro: { lat: 38.9067, lng: 1.4206 },
  gironaCentro: { lat: 41.9794, lng: 2.8214 },
  malagaCentro: { lat: 36.7213, lng: -4.4214 },
  jerezCentro: { lat: 36.6868, lng: -6.1371 },
  rondaCentro: { lat: 36.7420, lng: -5.1671 },
  nerjaCentro: { lat: 36.7508, lng: -3.8745 },
  roquetasCentro: { lat: 36.7642, lng: -2.6142 },
  caboGata: { lat: 36.7236, lng: -2.1925 },
  mojacarCentro: { lat: 37.1402, lng: -1.8519 },
  barrandaMurcia: { lat: 38.0465, lng: -1.9163 },
  elPalmarMurcia: { lat: 37.941, lng: -1.163 },
  torrevieja: { lat: 37.9787, lng: -0.6814 },
  aranjuezCentro: { lat: 40.0310, lng: -3.6025 },
  getafeCentro: { lat: 40.3083, lng: -3.7325 },
  cuencaCentro: { lat: 40.0704, lng: -2.1374 },
  avilaCentro: { lat: 40.6566, lng: -4.6812 },
  segoviaCentro: { lat: 40.9429, lng: -4.1088 },
  leonCentro: { lat: 42.5987, lng: -5.5671 },
  burgosCentro: { lat: 42.3439, lng: -3.6969 },
  sanSebastianCentro: { lat: 43.3183, lng: -1.9812 },
  tarragonaCentro: { lat: 41.1189, lng: 1.2445 },
  badajozCentro: { lat: 38.8794, lng: -6.9707 },
  caceresCentro: { lat: 39.4753, lng: -6.3724 },
  huelvaCentro: { lat: 37.2614, lng: -6.9447 },
  jaenCentro: { lat: 37.7796, lng: -3.7849 },
  almeriaCentro: { lat: 36.8381, lng: -2.4597 },
  soriaCentro: { lat: 41.7633, lng: -2.4649 },
  teruelCentro: { lat: 40.3456, lng: -1.1065 },
  lugoCentro: { lat: 43.0120, lng: -7.5558 },
  pontevedraCentro: { lat: 42.4310, lng: -8.6444 },
  corunaCentro: { lat: 43.3623, lng: -8.4115 },
  gijonCentro: { lat: 43.5322, lng: -5.6611 },
  valladolidCentro: { lat: 41.6523, lng: -4.7245 },
  ciudadRealCentro: { lat: 38.9848, lng: -3.9273 },
  mulaCentro: { lat: 38.0419, lng: -1.4906 },
  bullasCentro: { lat: 38.0467, lng: -1.6722 },
  jumillaCentro: { lat: 38.4790, lng: -1.3250 },
  lorcaCentro: { lat: 37.6710, lng: -1.7017 },
  elcheCentro: { lat: 38.2622, lng: -0.7011 },
  benidorm: { lat: 38.5342, lng: -0.1314 },
  gandiaCentro: { lat: 38.9667, lng: -0.1833 },
  puertoSagunto: { lat: 39.6625, lng: -0.2107 },
  algecirasCentro: { lat: 36.1328, lng: -5.4553 },
  tarifaCentro: { lat: 36.0140, lng: -5.6045 },
  antequeraCentro: { lat: 37.0194, lng: -4.5612 },
  fuengirola: { lat: 36.5397, lng: -4.6247 },
  mijasCentro: { lat: 36.5957, lng: -4.6371 },
  almunecarCentro: { lat: 36.7339, lng: -3.6907 },
  elEjidoCentro: { lat: 36.7756, lng: -2.8139 },
  aguilasCentro: { lat: 37.4060, lng: -1.5825 },
  ciezaCentro: { lat: 38.2399, lng: -1.4199 },
  sanJavierCentro: { lat: 37.8060, lng: -0.8370 },
  deniaCentro: { lat: 38.8408, lng: 0.1057 },
  castellonCentro: { lat: 39.9864, lng: -0.0513 },
  lleidaCentro: { lat: 41.6176, lng: 0.6200 },
  vitoriaCentro: { lat: 42.8467, lng: -2.6716 },
  huescaCentro: { lat: 42.1401, lng: -0.4089 },
  meridaCentro: { lat: 38.9160, lng: -6.3437 },
  plasenciaCentro: { lat: 40.0305, lng: -6.0897 },
  trujilloCentro: { lat: 39.4583, lng: -5.8810 },
  ponferradaCentro: { lat: 42.5493, lng: -6.5962 },
  astorgaCentro: { lat: 42.4590, lng: -6.0530 },
  sigueenzaCentro: { lat: 41.0689, lng: -2.6434 },
  calatayudCentro: { lat: 41.3525, lng: -1.6432 },
  elEscorialCentro: { lat: 40.5825, lng: -4.1282 },
  alcalaHenares: { lat: 40.4818, lng: -3.3635 },
  colmenarViejo: { lat: 40.6591, lng: -3.7678 },
  chinchonCentro: { lat: 40.1406, lng: -3.4228 },
  consuegraCentro: { lat: 39.4625, lng: -3.6062 },
  valdepenasCentro: { lat: 38.7621, lng: -3.3844 },
  tomellosoCentro: { lat: 39.1576, lng: -3.0213 },
  orihuelaCentro: { lat: 38.0840, lng: -0.9444 },
  peniscolaCentro: { lat: 40.3579, lng: 0.4066 },
  morellaCentro: { lat: 40.6197, lng: -0.0847 },
  santaCruzTenerife: { lat: 28.4636, lng: -16.2518 },
  arrecifeCentro: { lat: 28.9630, lng: -13.5477 },
  maspalomas: { lat: 27.7606, lng: -15.5860 },
};

type Scenario = {
  name: string;
  gps?: { lat: number; lng: number };
  turns: string[];
};

// Batería original (~55 escenarios)
const SCENARIOS_BASE: Scenario[] = [
  // --- Saludos y meta ---
  { name: 'saludo solo', turns: ['Hola'] },
  { name: 'saludo y pregunta', turns: ['Buenas!', '¿Dónde puedo comer bien en Madrid?'] },
  { name: 'tiers', turns: ['¿Qué son los tiers?'] },
  { name: 'que eres', turns: ['¿Tú qué eres exactamente? ¿Un buscador?'] },

  // --- Ciudad directa ---
  { name: 'comer en madrid', turns: ['¿Dónde comer en Madrid?'] },
  { name: 'hoteles malaga', turns: ['Mejores hoteles de Málaga'] },
  { name: 'bares bilbao', turns: ['Recomiéndame bares en Bilbao'] },
  { name: 'restaurantes valencia viaje', turns: ['Me gustaría ir a Valencia y quiero un restaurante bueno'] },
  { name: 'top3 alicante', turns: ['Top 3 hoteles en Alicante'] },
  { name: 'top10 espana', turns: ['Top 10 restaurantes de España'] },
  { name: 'desayunar murcia', turns: ['Un sitio para desayunar en Murcia'] },
  { name: 'romantico toledo', turns: ['Un restaurante romántico en Toledo para un aniversario'] },

  // --- Typos y coincidencia parcial ---
  { name: 'typo lameria', turns: ['restaurnates en lameria'] },
  { name: 'typo gerona', turns: ['hoteles en Gerona'] },
  { name: 'typo cartajena', turns: ['donde comer en cartajena'] },
  { name: 'typo murca', turns: ['restaurantes en murca'] },
  { name: 'typo barclona', turns: ['hoteles en barclona'] },
  { name: 'parcial palmar', turns: ['algún restaurante en el palmar?'] },
  { name: 'port valis', turns: ['me recomiendas un sitio en port valis?'] },

  // --- Ambigüedad La Alberca ---
  { name: 'alberca ambigua murcia', turns: ['Recomiéndame un restaurante en la alberca', 'La de Murcia'] },
  { name: 'alberca ambigua salamanca', turns: ['Un hotel en La Alberca', 'La de Salamanca'] },
  { name: 'alberca directa', turns: ['Restaurantes en La Alberca de Murcia'] },

  // --- GPS: cerca de mí ---
  { name: 'gps murcia cerca', gps: GPS.murciaCentro, turns: ['Estoy aquí, recomiéndame algo cerca para comer'] },
  { name: 'gps murcia pescado', gps: GPS.murciaCentro, turns: ['Restaurante de pescado cerca de mí'] },
  { name: 'gps madrid generico', gps: GPS.madridSol, turns: ['¿Qué hay bueno por aquí?'] },
  { name: 'gps valencia hotel', gps: GPS.valenciaCentro, turns: ['Necesito un hotel cerca de donde estoy'] },
  { name: 'gps ignora otra ciudad', gps: GPS.murciaCentro, turns: ['Restaurantes en Valencia'] },
  { name: 'gps donde estoy', gps: GPS.murciaCentro, turns: ['¿Sabes dónde estoy?'] },
  { name: 'gps alberca seguimiento', gps: GPS.laAlbercaMurcia, turns: ['Recomiéndame un restaurante cerca', '¿Y algo un poco más elegante?'] },
  { name: 'gps campo almeria', gps: GPS.campoNijar, turns: ['Algo para cenar cerca de mí'] },

  // --- Cerca sin GPS ---
  { name: 'cerca sin gps', turns: ['Recomiéndame algo cerca'] },
  { name: 'cerca sin gps con ciudad previa', turns: ['Restaurantes en Granada', '¿Y algo cerca del centro?'] },
  { name: 'cerca de pueblo', turns: ['Restaurantes cerca de Níjar'] },

  // --- Hilo con herencia de contexto ---
  { name: 'hilo granada cordoba', turns: ['Restaurantes en Granada', '¿Y hoteles?', '¿Y en Córdoba?'] },
  { name: 'hilo mas resultados', turns: ['Mejores restaurantes de Zaragoza', 'Dame más opciones'] },
  { name: 'hilo cambio categoria', turns: ['Hoteles en Santander', 'Mejor dime bares'] },

  // --- Provincia y región ---
  { name: 'provincia girona', turns: ['Restaurantes en la provincia de Girona'] },
  { name: 'fuera capital murcia', turns: ['Restaurantes en la provincia de Murcia pero fuera de la capital'] },
  { name: 'region andalucia', turns: ['Los mejores hoteles de Andalucía'] },

  // --- Cocinas y precio ---
  { name: 'italiano sevilla', turns: ['Un buen italiano en Sevilla'] },
  { name: 'sushi madrid', turns: ['¿Dónde comer sushi en Madrid?'] },
  { name: 'mexicano murcia', turns: ['Restaurante mexicano en Murcia'] },
  { name: 'barato barcelona', turns: ['Hoteles baratos en Barcelona'] },
  { name: 'caro marbella', turns: ['Un restaurante de lujo en Marbella'] },

  // --- Incompletas / raras ---
  { name: 'incompleta hoteles de', turns: ['mejores hoteles de'] },
  { name: 'pregunta vacia categoria', turns: ['quiero reservar mesa para esta noche'] },
  { name: 'fuera catalogo gasolinera', turns: ['¿Hay alguna gasolinera cerca de Murcia?'] },
  { name: 'fuera catalogo museos', turns: ['¿Qué museos puedo ver en Toledo?'] },
  { name: 'insulto suave', turns: ['No tienes ni idea, eres un chatbot inútil'] },
  { name: 'pueblo sin ficha', turns: ['Restaurantes en Moratalla'] },
  { name: 'ciudad inexistente', turns: ['Restaurantes en Villaconejos de Arriba del Monte'] },

  // --- Rutas entre ciudades (deben derivar al planificador /ruta) ---
  { name: 'ruta madrid barcelona diamante', turns: ['Voy a ir de Madrid a Barcelona. Dime un buen restaurante diamante en la ruta'] },
  { name: 'ruta parada comer', turns: ['Vamos de Sevilla a Valencia en coche, ¿dónde paramos a comer?'] },
  { name: 'ruta de camino', turns: ['Un hotel de camino a Galicia'] },

  // --- Tiers pedidos por su nombre ---
  { name: 'tier diamante madrid', turns: ['Restaurantes diamante en Madrid'] },
  { name: 'tier platino valencia', turns: ['¿Hay algún hotel platino en Valencia?'] },
  { name: 'tier diamante pueblo', turns: ['Un restaurante diamante en Yecla'] },

  // --- Pueblos perdidos / entre pueblos ---
  { name: 'pueblo perdido murcia', turns: ['Estoy en Barranda, un pueblo de Murcia, ¿dónde puedo comer?'] },
  { name: 'entre pueblos', turns: ['Estoy entre Mula y Bullas, ¿algo para cenar por la zona?'] },
];

// Batería ampliada: 100 escenarios nuevos (prefijo v2_ → --only=v2)
const SCENARIOS_V2: Scenario[] = [
  // --- Capitales: ciudad ≠ provincia ---
  { name: 'v2 comer sevilla capital', turns: ['¿Dónde cenar en Sevilla?'] },
  { name: 'v2 hoteles barcelona capital', turns: ['Busco hotel en Barcelona para el finde'] },
  { name: 'v2 bares valencia capital', turns: ['Bares chulos en Valencia'] },
  { name: 'v2 restaurantes bilbao capital', turns: ['Restaurantes en Bilbao'] },
  { name: 'v2 comer zaragoza capital', turns: ['Quiero comer bien en Zaragoza'] },
  { name: 'v2 hoteles salamanca capital', turns: ['Hoteles en Salamanca'] },
  { name: 'v2 tapas granada capital', turns: ['Tapas en Granada'] },
  { name: 'v2 cena cordoba capital', turns: ['Un sitio para cenar en Córdoba'] },
  { name: 'v2 alojamiento santiago capital', turns: ['Dónde dormir en Santiago de Compostela'] },
  { name: 'v2 comer pamplona capital', turns: ['Restaurantes en Pamplona'] },
  { name: 'v2 bares logrono capital', turns: ['Bares de vinos en Logroño'] },
  { name: 'v2 comer vigo capital', turns: ['Comer en Vigo'] },
  { name: 'v2 hoteles palma capital', turns: ['Hoteles en Palma de Mallorca'] },
  { name: 'v2 cena cadiz capital', turns: ['Cena en Cádiz'] },
  { name: 'v2 brunch alicante capital', turns: ['Brunch en Alicante'] },

  // --- Provincia explícita vs capital ---
  { name: 'v2 provincia madrid entera', turns: ['Restaurantes en la provincia de Madrid'] },
  { name: 'v2 provincia valencia entera', turns: ['Hoteles en la provincia de Valencia'] },
  { name: 'v2 provincia barcelona entera', turns: ['Mejores restaurantes de la provincia de Barcelona'] },
  { name: 'v2 fuera capital sevilla', turns: ['Restaurantes en la provincia de Sevilla fuera de la capital'] },
  { name: 'v2 fuera capital malaga', turns: ['Algo para comer en la provincia de Málaga pero no en Málaga ciudad'] },
  { name: 'v2 comunidad valenciana', turns: ['Los mejores restaurantes de la Comunidad Valenciana'] },
  { name: 'v2 catalunya region', turns: ['Hoteles en Cataluña'] },
  { name: 'v2 galicia region', turns: ['Restaurantes en Galicia'] },

  // --- Typos y nombres raros ---
  { name: 'v2 typo seviya', turns: ['restaurantes en seviya'] },
  { name: 'v2 typo malga', turns: ['hoteles en malga'] },
  { name: 'v2 typo salamnca', turns: ['donde comer en salamnca'] },
  { name: 'v2 typo alicnte', turns: ['bares en alicnte'] },
  { name: 'v2 typo cordova', turns: ['restaurantes en cordova'] },
  { name: 'v2 typo santander sin h', turns: ['hoteles en santader'] },
  { name: 'v2 typo valladolid', turns: ['comer en baladolid'] },
  { name: 'v2 parcial gran via', turns: ['algún bar cerca de la gran vía de madrid?'] },
  { name: 'v2 parcial gothic barcelona', turns: ['restaurante en el gótico de barcelona'] },
  { name: 'v2 parcial triana', turns: ['tapas en triana'] },

  // --- GPS en distintas ciudades ---
  { name: 'v2 gps sevilla cerca', gps: GPS.sevillaTriana, turns: ['Estoy aquí, ¿dónde como cerca?'] },
  { name: 'v2 gps barcelona cerca', gps: GPS.barcelonaRamblas, turns: ['Recomiéndame algo cerca para cenar'] },
  { name: 'v2 gps bilbao hotel', gps: GPS.bilbaoGuggenheim, turns: ['Necesito un hotel cerca de donde estoy'] },
  { name: 'v2 gps granada tapas', gps: GPS.granadaAlbaicin, turns: ['Tapas cerca de mí'] },
  { name: 'v2 gps santander mar', gps: GPS.santanderSardinero, turns: ['Restaurante cerca de la playa, estoy aquí'] },
  { name: 'v2 gps zaragoza generico', gps: GPS.zaragozaPilar, turns: ['¿Qué hay bueno por aquí?'] },
  { name: 'v2 gps toledo donde estoy', gps: GPS.toledoCentro, turns: ['¿Sabes dónde estoy?'] },
  { name: 'v2 gps salamanca cena', gps: GPS.salamancaPlaza, turns: ['Cena cerca de mi ubicación'] },
  { name: 'v2 gps santiago peregrino', gps: GPS.santiagoCentro, turns: ['Estoy aquí después del camino, ¿dónde como?'] },
  { name: 'v2 gps pamplona pinchos', gps: GPS.pamplonaCentro, turns: ['Pinchos cerca de mí'] },
  { name: 'v2 gps palma playa', gps: GPS.palmaCentro, turns: ['Restaurante cerca de donde estoy en Palma'] },
  { name: 'v2 gps las palmas islas', gps: GPS.lasPalmasCentro, turns: ['Algo para comer cerca de mí'] },
  { name: 'v2 gps malaga ignorando granada', gps: GPS.malagaCentro, turns: ['Restaurantes en Granada'] },
  { name: 'v2 gps marbella lujo', gps: GPS.marbellaCentro, turns: ['Un sitio elegante cerca de mí'] },
  { name: 'v2 gps cabo gata desierto', gps: GPS.caboGata, turns: ['Cena cerca de mí, estoy en mitad del parque'] },

  // --- Rutas → planificador /ruta ---
  { name: 'v2 ruta madrid lisboa', turns: ['Voy de Madrid a Lisboa en furgo, ¿dónde paramos a comer?'] },
  { name: 'v2 ruta malaga granada', turns: ['De Málaga a Granada en coche, un restaurante de camino'] },
  { name: 'v2 ruta bilbao santander', turns: ['Trayecto Bilbao-Santander, recomiéndame un bar en la ruta'] },
  { name: 'v2 ruta murcia alicante platino', turns: ['De Murcia a Alicante, ¿hay algún hotel platino en la ruta?'] },
  { name: 'v2 ruta madrid valencia diamante', turns: ['Iremos de Madrid a Valencia, dime un restaurante diamante en el camino'] },
  { name: 'v2 ruta sevilla cadiz', turns: ['Vamos de Sevilla a Cádiz, ¿dónde comemos de paso?'] },
  { name: 'v2 ruta barcelona girona', turns: ['De Barcelona a Girona en coche, algo en la ruta'] },
  { name: 'v2 ruta zaragoza madrid', turns: ['Conduciendo de Zaragoza a Madrid, ¿parada para comer?'] },
  { name: 'v2 ruta camino santiago', turns: ['Haciendo el Camino, un hotel de camino a Santiago'] },
  { name: 'v2 ruta sur canarias', turns: ['De Las Palmas a Maspalomas en coche, ¿dónde cenamos?'] },

  // --- Tiers por nombre ---
  { name: 'v2 tier oro bilbao', turns: ['Restaurantes oro en Bilbao'] },
  { name: 'v2 tier plata sevilla', turns: ['¿Hay bares plata en Sevilla?'] },
  { name: 'v2 tier bronce granada', turns: ['Un restaurante bronce en Granada'] },
  { name: 'v2 tier diamante barcelona', turns: ['Restaurante diamante en Barcelona'] },
  { name: 'v2 tier platino malaga', turns: ['Hotel platino en Málaga'] },
  { name: 'v2 tier diamante cartagena', turns: ['¿Hay algún diamante en Cartagena?'] },
  { name: 'v2 tier oro zaragoza', turns: ['Top restaurantes oro en Zaragoza'] },
  { name: 'v2 tier bronce pueblo yecla', turns: ['Restaurante bronce en Yecla'] },

  // --- Pueblos, campo y «entre X e Y» ---
  { name: 'v2 pueblo caravaca', turns: ['Estoy en Caravaca de la Cruz, ¿dónde como?'] },
  { name: 'v2 pueblo yecla vino', turns: ['Estoy en Yecla, un sitio para comer'] },
  { name: 'v2 pueblo el palmar', turns: ['Estoy en El Palmar, ¿algún restaurante?'] },
  { name: 'v2 pueblo mojacar', turns: ['Estoy en Mojácar pueblo, ¿cena cerca?'] },
  { name: 'v2 pueblo consuegra', turns: ['Estoy en Consuegra, ¿dónde puedo comer?'] },
  { name: 'v2 pueblo chinchon', turns: ['Estoy en Chinchón, recomiéndame un sitio'] },
  { name: 'v2 entre lorca aguilas', turns: ['Estoy entre Lorca y Águilas, ¿algo para comer?'] },
  { name: 'v2 entre jumilla yecla', turns: ['Estoy entre Jumilla y Yecla, ¿dónde cenamos?'] },
  { name: 'v2 entre avila segovia', turns: ['Estoy entre Ávila y Segovia, ¿restaurante cerca?'] },
  { name: 'v2 entre cieza jumilla', turns: ['Estoy entre Cieza y Jumilla, algo por la zona'] },
  { name: 'v2 entre algeciras tarifa', turns: ['Estoy entre Algeciras y Tarifa, ¿dónde paramos a comer?'] },
  { name: 'v2 entre gandia sagunto', turns: ['Estoy entre Gandía y Sagunto, ¿restaurante cerca?'] },

  // --- Cocinas, precio y ocasión ---
  { name: 'v2 paella valencia', turns: ['¿Dónde comer paella en Valencia?'] },
  { name: 'v2 mariscos cadiz', turns: ['Mariscos en Cádiz'] },
  { name: 'v2 asador burgos', turns: ['Un asador en Burgos'] },
  { name: 'v2 ramen barcelona', turns: ['Ramen en Barcelona'] },
  { name: 'v2 curry madrid', turns: ['Comida india en Madrid'] },
  { name: 'v2 hamburguesa bilbao', turns: ['Hamburguesas en Bilbao'] },
  { name: 'v2 hotel economico sevilla', turns: ['Hotel barato en Sevilla'] },
  { name: 'v2 cena lujo san sebastian', turns: ['Restaurante de lujo en San Sebastián'] },
  { name: 'v2 desayuno palma', turns: ['Sitio para desayunar en Palma'] },
  { name: 'v2 copas ibiza', turns: ['Bares en Ibiza para copas'] },

  // --- Hilos multi-turno ---
  { name: 'v2 hilo malaga nerja', turns: ['Restaurantes en Málaga', '¿Y en Nerja?', '¿Y hoteles?'] },
  { name: 'v2 hilo bilbao san sebastian', turns: ['Bares en Bilbao', '¿Y en San Sebastián?'] },
  { name: 'v2 hilo murcia cartagena', turns: ['Restaurantes en Murcia', 'Mejor en Cartagena', '¿Algo cerca del puerto?'] },
  { name: 'v2 hilo tier downgrade', turns: ['Restaurantes diamante en Madrid', 'Vale, dime los mejores aunque no sean diamante'] },
  { name: 'v2 hilo cambio ciudad', turns: ['Hoteles en Toledo', 'Mejor en Ávila'] },
  { name: 'v2 hilo mas opciones', turns: ['Mejores bares de Logroño', 'Dame más', '¿Alguno cerca del centro?'] },
  { name: 'v2 hilo gps seguimiento', gps: GPS.murciaCentro, turns: ['Restaurantes cerca de mí', '¿Y un bar?', '¿Algo más barato?'] },
  { name: 'v2 hilo ruta luego ciudad', turns: ['Voy de Madrid a Barcelona en coche', 'Bueno, mejor dime un sitio en Lleida'] },

  // --- Edge cases y fuera de catálogo ---
  { name: 'v2 incompleta donde como', turns: ['¿Dónde puedo comer en'] },
  { name: 'v2 sin categoria ciudad', turns: ['Voy a Zaragoza el sábado, ¿qué me recomiendas?'] },
  { name: 'v2 fuera catalogo farmacia', turns: ['¿Hay farmacia de guardia cerca de Murcia?'] },
  { name: 'v2 fuera catalogo cine', turns: ['¿Qué películas hay en el cine de Valladolid?'] },
  { name: 'v2 insulto fuerte', turns: ['Eres una mierda de bot, no sirves para nada'] },
  { name: 'v2 pregunta hora', turns: ['¿A qué hora abre el restaurante que me has dicho?'] },
  { name: 'v2 reserva mesa sin sitio', turns: ['Reserva mesa para 4 en Madrid esta noche'] },
  { name: 'v2 comparar dos ciudades', turns: ['¿Es mejor comer en Granada o en Málaga?'] },
  { name: 'v2 top5 hoteles espana', turns: ['Top 5 hoteles de España'] },
  { name: 'v2 singular un sitio', turns: ['Un sitio'] },
  { name: 'v2 cerca sin contexto', turns: ['Algo cerca del centro'] },
  { name: 'v2 provincia sin resultados', turns: ['Restaurantes en Soria capital'] },
  { name: 'v2 pueblo inventado extremadura', turns: ['Restaurantes en Villanueva del Silencio Eterno'] },
  { name: 'v2 mezcla ruta y ciudad', turns: ['Voy a ir a Granada y quiero un restaurante bueno'] },
];

const SCENARIOS: Scenario[] = [...SCENARIOS_BASE, ...SCENARIOS_V2];

type TurnResult = {
  scenario: string;
  turn: number;
  question: string;
  answer: string;
  ok: boolean;
  ms: number;
};

async function askChatbot(
  message: string,
  sessionId: string,
  gps?: { lat: number; lng: number }
): Promise<{ answer: string; ok: boolean; ms: number }> {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/chatbot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, location: gps || null }),
    });
    const data: any = await res.json().catch(() => ({}));
    const answer = data?.message || data?.error || `HTTP ${res.status}`;
    return { answer, ok: res.ok && Boolean(data?.success), ms: Date.now() - started };
  } catch (e: any) {
    return { answer: `ERROR de red: ${e?.message || e}`, ok: false, ms: Date.now() - started };
  }
}

async function runScenario(scenario: Scenario, runId: string, index: number): Promise<TurnResult[]> {
  const sessionId = `stress_${runId}_${index}`;
  const results: TurnResult[] = [];
  for (let t = 0; t < scenario.turns.length; t++) {
    const question = scenario.turns[t];
    const { answer, ok, ms } = await askChatbot(question, sessionId, scenario.gps);
    results.push({ scenario: scenario.name, turn: t + 1, question, answer, ok, ms });
    const icon = ok ? '✓' : '✗';
    console.log(`${icon} [${scenario.name}] T${t + 1} (${(ms / 1000).toFixed(1)}s): ${question}`);
    if (!ok) console.log(`   ⚠ ${answer.slice(0, 160)}`);
  }
  return results;
}

async function main() {
  const runId = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  let scenarios = SCENARIOS;
  if (ONLY === 'v2') scenarios = scenarios.filter((s) => s.name.startsWith('v2 '));
  else if (ONLY === 'base') scenarios = scenarios.filter((s) => !s.name.startsWith('v2 '));
  else if (ONLY) scenarios = scenarios.filter((s) => s.name.toLowerCase().includes(ONLY));
  if (Number.isFinite(LIMIT)) scenarios = scenarios.slice(0, LIMIT);

  const totalTurns = scenarios.reduce((acc, s) => acc + s.turns.length, 0);
  console.log(`Tío Viajero — test de estrés: ${scenarios.length} escenarios, ${totalTurns} preguntas → ${BASE_URL}`);

  // 3 escenarios en paralelo: dentro de cada uno los turnos van en orden
  const results: TurnResult[] = [];
  const queue = scenarios.map((s, i) => ({ s, i }));
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) break;
      const r = await runScenario(item.s, runId, item.i);
      results.push(...r);
    }
  });
  await Promise.all(workers);

  // Informe
  const failed = results.filter((r) => !r.ok);
  const lines: string[] = [
    `# Test de estrés Tío Viajero — ${new Date().toLocaleString('es-ES')}`,
    '',
    `- Base: ${BASE_URL}`,
    `- Escenarios: ${scenarios.length} · Preguntas: ${results.length} · Errores HTTP: ${failed.length}`,
    `- Sesiones: prefijo \`stress_${runId}_\` (evaluar con \`npx tsx scripts/review-chatbot-messages.ts --limit=150\`)`,
    '',
  ];
  let currentScenario = '';
  for (const r of results.sort((a, b) => a.scenario.localeCompare(b.scenario) || a.turn - b.turn)) {
    if (r.scenario !== currentScenario) {
      currentScenario = r.scenario;
      lines.push(`## ${r.scenario}`, '');
    }
    lines.push(`**T${r.turn} — ${r.question}** _(${(r.ms / 1000).toFixed(1)}s${r.ok ? '' : ' · ERROR'})_`, '');
    lines.push(r.answer.trim(), '');
  }

  const outPath = path.join(__dirname, 'INFORME-STRESS-TEST.md');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`\nInforme: ${outPath}`);
  console.log(`Errores HTTP: ${failed.length}/${results.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
