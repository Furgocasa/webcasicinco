/**
 * BASE DE DATOS DE CIUDADES PRINCIPALES DE ESPAÑA
 * Con población y coordenadas para búsquedas optimizadas
 */

export interface CityData {
  name: string;
  coords: { lat: number; lng: number };
  population: number;
  priority: 1 | 2 | 3; // 1=Capital/Grande, 2=Mediana, 3=Pequeña
}

export interface ProvinceData {
  name: string;
  cities: CityData[];
}

/**
 * Base de datos de ciudades principales por provincia
 * Incluye las 8-12 ciudades más importantes de cada provincia
 */
export const CITIES_BY_PROVINCE: Record<string, ProvinceData> = {
  // ANDALUCÍA
  'Almería': {
    name: 'Almería',
    cities: [
      { name: 'Almería', coords: { lat: 36.8381, lng: -2.4597 }, population: 200000, priority: 1 },
      { name: 'Roquetas de Mar', coords: { lat: 36.7642, lng: -2.6142 }, population: 95000, priority: 2 },
      { name: 'El Ejido', coords: { lat: 36.7756, lng: -2.8139 }, population: 85000, priority: 2 },
      { name: 'Níjar', coords: { lat: 36.9675, lng: -2.2056 }, population: 30000, priority: 3 },
    ],
  },
  'Cádiz': {
    name: 'Cádiz',
    cities: [
      { name: 'Jerez de la Frontera', coords: { lat: 36.6868, lng: -6.1371 }, population: 213000, priority: 1 },
      { name: 'Algeciras', coords: { lat: 36.1328, lng: -5.4553 }, population: 122000, priority: 1 },
      { name: 'Cádiz', coords: { lat: 36.5271, lng: -6.2886 }, population: 116000, priority: 1 },
      { name: 'San Fernando', coords: { lat: 36.4612, lng: -6.1978 }, population: 95000, priority: 2 },
      { name: 'El Puerto de Santa María', coords: { lat: 36.5992, lng: -6.2289 }, population: 88000, priority: 2 },
      { name: 'Chiclana de la Frontera', coords: { lat: 36.4169, lng: -6.1481 }, population: 85000, priority: 2 },
      { name: 'Sanlúcar de Barrameda', coords: { lat: 36.7783, lng: -6.3547 }, population: 68000, priority: 2 },
      { name: 'La Línea de la Concepción', coords: { lat: 36.1656, lng: -5.3479 }, population: 63000, priority: 2 },
    ],
  },
  'Córdoba': {
    name: 'Córdoba',
    cities: [
      { name: 'Córdoba', coords: { lat: 37.8882, lng: -4.7794 }, population: 326000, priority: 1 },
      { name: 'Lucena', coords: { lat: 37.4083, lng: -4.4853 }, population: 42000, priority: 3 },
      { name: 'Puente Genil', coords: { lat: 37.3889, lng: -4.7686 }, population: 30000, priority: 3 },
    ],
  },
  'Granada': {
    name: 'Granada',
    cities: [
      { name: 'Granada', coords: { lat: 37.1773, lng: -3.5986 }, population: 232000, priority: 1 },
      { name: 'Motril', coords: { lat: 36.7495, lng: -3.5211 }, population: 60000, priority: 2 },
      { name: 'Almuñécar', coords: { lat: 36.7347, lng: -3.6875 }, population: 27000, priority: 3 },
    ],
  },
  'Huelva': {
    name: 'Huelva',
    cities: [
      { name: 'Huelva', coords: { lat: 37.2614, lng: -6.9447 }, population: 143000, priority: 1 },
      { name: 'Lepe', coords: { lat: 37.2544, lng: -7.2042 }, population: 28000, priority: 3 },
    ],
  },
  'Jaén': {
    name: 'Jaén',
    cities: [
      { name: 'Jaén', coords: { lat: 37.7796, lng: -3.7849 }, population: 112000, priority: 1 },
      { name: 'Linares', coords: { lat: 38.0903, lng: -3.6347 }, population: 57000, priority: 2 },
      { name: 'Andújar', coords: { lat: 38.0386, lng: -4.0539 }, population: 37000, priority: 3 },
      { name: 'Úbeda', coords: { lat: 38.0128, lng: -3.3706 }, population: 34000, priority: 3 },
    ],
  },
  'Málaga': {
    name: 'Málaga',
    cities: [
      { name: 'Málaga', coords: { lat: 36.7213, lng: -4.4214 }, population: 578000, priority: 1 },
      { name: 'Marbella', coords: { lat: 36.5100, lng: -4.8860 }, population: 147000, priority: 1 },
      { name: 'Vélez-Málaga', coords: { lat: 36.7858, lng: -4.1006 }, population: 82000, priority: 2 },
      { name: 'Fuengirola', coords: { lat: 36.5397, lng: -4.6259 }, population: 82000, priority: 2 },
      { name: 'Mijas', coords: { lat: 36.5950, lng: -4.6381 }, population: 82000, priority: 2 },
      { name: 'Torremolinos', coords: { lat: 36.6200, lng: -4.5000 }, population: 69000, priority: 2 },
      { name: 'Estepona', coords: { lat: 36.4267, lng: -5.1467 }, population: 69000, priority: 2 },
      { name: 'Benalmádena', coords: { lat: 36.5989, lng: -4.5167 }, population: 69000, priority: 2 },
      { name: 'Ronda', coords: { lat: 36.7428, lng: -5.1614 }, population: 34000, priority: 3 },
    ],
  },
  'Sevilla': {
    name: 'Sevilla',
    cities: [
      { name: 'Sevilla', coords: { lat: 37.3886, lng: -5.9823 }, population: 688000, priority: 1 },
      { name: 'Dos Hermanas', coords: { lat: 37.2823, lng: -5.9206 }, population: 134000, priority: 1 },
      { name: 'Alcalá de Guadaíra', coords: { lat: 37.3394, lng: -5.8464 }, population: 75000, priority: 2 },
      { name: 'Utrera', coords: { lat: 37.1831, lng: -5.7806 }, population: 51000, priority: 2 },
      { name: 'Écija', coords: { lat: 37.5428, lng: -5.0825 }, population: 40000, priority: 3 },
    ],
  },

  // ARAGÓN
  'Huesca': {
    name: 'Huesca',
    cities: [
      { name: 'Huesca', coords: { lat: 42.1361, lng: -0.4086 }, population: 53000, priority: 2 },
      { name: 'Jaca', coords: { lat: 42.5697, lng: -0.5514 }, population: 13000, priority: 3 },
    ],
  },
  'Teruel': {
    name: 'Teruel',
    cities: [
      { name: 'Teruel', coords: { lat: 40.3456, lng: -1.1065 }, population: 36000, priority: 3 },
      { name: 'Alcañiz', coords: { lat: 41.0481, lng: -0.1347 }, population: 16000, priority: 3 },
    ],
  },
  'Zaragoza': {
    name: 'Zaragoza',
    cities: [
      { name: 'Zaragoza', coords: { lat: 41.6488, lng: -0.8891 }, population: 674000, priority: 1 },
      { name: 'Calatayud', coords: { lat: 41.3528, lng: -1.6444 }, population: 20000, priority: 3 },
    ],
  },

  // ASTURIAS
  'Asturias': {
    name: 'Asturias',
    cities: [
      { name: 'Gijón', coords: { lat: 43.5322, lng: -5.6611 }, population: 271000, priority: 1 },
      { name: 'Oviedo', coords: { lat: 43.3614, lng: -5.8490 }, population: 220000, priority: 1 },
      { name: 'Avilés', coords: { lat: 43.5564, lng: -5.9250 }, population: 78000, priority: 2 },
      { name: 'Siero', coords: { lat: 43.3911, lng: -5.6622 }, population: 52000, priority: 2 },
      { name: 'Langreo', coords: { lat: 43.3247, lng: -5.6914 }, population: 39000, priority: 3 },
      { name: 'Navia', coords: { lat: 43.5389, lng: -6.7236 }, population: 8400, priority: 3 },
      { name: 'Tapia de Casariego', coords: { lat: 43.5703, lng: -6.9442 }, population: 3900, priority: 3 },
      { name: 'Luarca', coords: { lat: 43.5422, lng: -6.5339 }, population: 5200, priority: 3 },
      { name: 'Cudillero', coords: { lat: 43.5619, lng: -6.1456 }, population: 5100, priority: 3 },
    ],
  },

  // BALEARES
  'Baleares': {
    name: 'Baleares',
    cities: [
      { name: 'Palma de Mallorca', coords: { lat: 39.5696, lng: 2.6502 }, population: 416000, priority: 1 },
      { name: 'Calvià', coords: { lat: 39.5556, lng: 2.5042 }, population: 51000, priority: 2 },
      { name: 'Ibiza', coords: { lat: 38.9067, lng: 1.4206 }, population: 49000, priority: 2 },
      { name: 'Manacor', coords: { lat: 39.5697, lng: 3.2094 }, population: 43000, priority: 3 },
      { name: 'Mahón', coords: { lat: 39.8886, lng: 4.2658 }, population: 29000, priority: 3 },
    ],
  },

  // CANARIAS
  'Las Palmas': {
    name: 'Las Palmas',
    cities: [
      { name: 'Las Palmas de Gran Canaria', coords: { lat: 28.1236, lng: -15.4366 }, population: 379000, priority: 1 },
      { name: 'Telde', coords: { lat: 27.9922, lng: -15.4189 }, population: 102000, priority: 1 },
      { name: 'Arucas', coords: { lat: 28.1197, lng: -15.5219 }, population: 38000, priority: 3 },
    ],
  },
  'Santa Cruz de Tenerife': {
    name: 'Santa Cruz de Tenerife',
    cities: [
      { name: 'Santa Cruz de Tenerife', coords: { lat: 28.4636, lng: -16.2518 }, population: 207000, priority: 1 },
      { name: 'San Cristóbal de La Laguna', coords: { lat: 28.4853, lng: -16.3153 }, population: 158000, priority: 1 },
      { name: 'Arona', coords: { lat: 28.0997, lng: -16.6808 }, population: 93000, priority: 2 },
      { name: 'Adeje', coords: { lat: 28.1228, lng: -16.7264 }, population: 49000, priority: 2 },
    ],
  },

  // CANTABRIA
  'Cantabria': {
    name: 'Cantabria',
    cities: [
      { name: 'Santander', coords: { lat: 43.4623, lng: -3.8100 }, population: 172000, priority: 1 },
      { name: 'Torrelavega', coords: { lat: 43.3492, lng: -4.0456 }, population: 52000, priority: 2 },
      { name: 'Castro Urdiales', coords: { lat: 43.3836, lng: -3.2172 }, population: 32000, priority: 3 },
    ],
  },

  // CASTILLA Y LEÓN
  'Ávila': {
    name: 'Ávila',
    cities: [
      { name: 'Ávila', coords: { lat: 40.6561, lng: -4.6981 }, population: 58000, priority: 2 },
    ],
  },
  'Burgos': {
    name: 'Burgos',
    cities: [
      { name: 'Burgos', coords: { lat: 42.3439, lng: -3.6969 }, population: 176000, priority: 1 },
      { name: 'Aranda de Duero', coords: { lat: 41.6711, lng: -3.6892 }, population: 33000, priority: 3 },
    ],
  },
  'León': {
    name: 'León',
    cities: [
      { name: 'León', coords: { lat: 42.5987, lng: -5.5671 }, population: 124000, priority: 1 },
      { name: 'Ponferrada', coords: { lat: 42.5450, lng: -6.5936 }, population: 65000, priority: 2 },
    ],
  },
  'Palencia': {
    name: 'Palencia',
    cities: [
      { name: 'Palencia', coords: { lat: 42.0096, lng: -4.5287 }, population: 78000, priority: 2 },
    ],
  },
  'Salamanca': {
    name: 'Salamanca',
    cities: [
      { name: 'Salamanca', coords: { lat: 40.9651, lng: -5.6640 }, population: 144000, priority: 1 },
    ],
  },
  'Segovia': {
    name: 'Segovia',
    cities: [
      { name: 'Segovia', coords: { lat: 40.9429, lng: -4.1088 }, population: 51000, priority: 2 },
    ],
  },
  'Soria': {
    name: 'Soria',
    cities: [
      { name: 'Soria', coords: { lat: 41.7665, lng: -2.4790 }, population: 39000, priority: 3 },
    ],
  },
  'Valladolid': {
    name: 'Valladolid',
    cities: [
      { name: 'Valladolid', coords: { lat: 41.6528, lng: -4.7245 }, population: 298000, priority: 1 },
      { name: 'Medina del Campo', coords: { lat: 41.3086, lng: -4.9169 }, population: 21000, priority: 3 },
    ],
  },
  'Zamora': {
    name: 'Zamora',
    cities: [
      { name: 'Zamora', coords: { lat: 41.5034, lng: -5.7467 }, population: 61000, priority: 2 },
    ],
  },

  // CASTILLA-LA MANCHA
  'Albacete': {
    name: 'Albacete',
    cities: [
      { name: 'Albacete', coords: { lat: 38.9943, lng: -1.8585 }, population: 173000, priority: 1 },
      { name: 'Hellín', coords: { lat: 38.5122, lng: -1.7014 }, population: 29000, priority: 3 },
      { name: 'Villarrobledo', coords: { lat: 39.2714, lng: -2.6031 }, population: 25000, priority: 3 },
      { name: 'Almansa', coords: { lat: 38.8697, lng: -1.0972 }, population: 24000, priority: 3 },
      { name: 'La Roda', coords: { lat: 39.2056, lng: -2.1625 }, population: 15000, priority: 3 },
    ],
  },
  'Ciudad Real': {
    name: 'Ciudad Real',
    cities: [
      { name: 'Ciudad Real', coords: { lat: 38.9848, lng: -3.9274 }, population: 75000, priority: 2 },
      { name: 'Puertollano', coords: { lat: 38.6856, lng: -4.1050 }, population: 49000, priority: 2 },
      { name: 'Tomelloso', coords: { lat: 39.1522, lng: -3.0244 }, population: 36000, priority: 3 },
      { name: 'Alcázar de San Juan', coords: { lat: 39.3908, lng: -3.2089 }, population: 31000, priority: 3 },
      { name: 'Valdepeñas', coords: { lat: 38.7622, lng: -3.3844 }, population: 31000, priority: 3 },
    ],
  },
  'Cuenca': {
    name: 'Cuenca',
    cities: [
      { name: 'Cuenca', coords: { lat: 40.0703, lng: -2.1374 }, population: 54000, priority: 2 },
    ],
  },
  'Guadalajara': {
    name: 'Guadalajara',
    cities: [
      { name: 'Guadalajara', coords: { lat: 40.6328, lng: -3.1672 }, population: 86000, priority: 2 },
    ],
  },
  'Toledo': {
    name: 'Toledo',
    cities: [
      { name: 'Toledo', coords: { lat: 39.8628, lng: -4.0273 }, population: 85000, priority: 2 },
      { name: 'Talavera de la Reina', coords: { lat: 39.9636, lng: -4.8303 }, population: 83000, priority: 2 },
      { name: 'Illescas', coords: { lat: 40.1222, lng: -3.8478 }, population: 29000, priority: 3 },
      { name: 'Seseña', coords: { lat: 40.1047, lng: -3.6978 }, population: 27000, priority: 3 },
      { name: 'Consuegra', coords: { lat: 39.4597, lng: -3.6083 }, population: 10000, priority: 3 },
      { name: 'Oropesa', coords: { lat: 39.9183, lng: -5.1733 }, population: 2800, priority: 3 },
      { name: 'Mora', coords: { lat: 39.6844, lng: -3.3400 }, population: 9800, priority: 3 },
      { name: 'Madridejos', coords: { lat: 39.4683, lng: -3.5317 }, population: 11000, priority: 3 },
      { name: 'Villacañas', coords: { lat: 39.6236, lng: -3.3428 }, population: 10000, priority: 3 },
      { name: 'Tembleque', coords: { lat: 39.9761, lng: -3.6336 }, population: 3200, priority: 3 },
    ],
  },

  // CATALUÑA
  'Barcelona': {
    name: 'Barcelona',
    cities: [
      { name: 'Barcelona', coords: { lat: 41.3851, lng: 2.1734 }, population: 1620000, priority: 1 },
      { name: 'Hospitalet de Llobregat', coords: { lat: 41.3597, lng: 2.1006 }, population: 265000, priority: 1 },
      { name: 'Badalona', coords: { lat: 41.4502, lng: 2.2452 }, population: 220000, priority: 1 },
      { name: 'Terrassa', coords: { lat: 41.5633, lng: 2.0086 }, population: 220000, priority: 1 },
      { name: 'Sabadell', coords: { lat: 41.5431, lng: 2.1089 }, population: 211000, priority: 1 },
      { name: 'Mataró', coords: { lat: 41.5402, lng: 2.4442 }, population: 129000, priority: 1 },
      { name: 'Santa Coloma de Gramenet', coords: { lat: 41.4519, lng: 2.2086 }, population: 118000, priority: 1 },
      { name: 'Cornellà de Llobregat', coords: { lat: 41.3564, lng: 2.0744 }, population: 87000, priority: 2 },
      { name: 'Granollers', coords: { lat: 41.6072, lng: 2.2878 }, population: 61000, priority: 2 },
      { name: 'Sitges', coords: { lat: 41.2372, lng: 1.8053 }, population: 29000, priority: 3 },
    ],
  },
  'Girona': {
    name: 'Girona',
    cities: [
      { name: 'Girona', coords: { lat: 41.9794, lng: 2.8214 }, population: 103000, priority: 1 },
      { name: 'Lloret de Mar', coords: { lat: 41.7019, lng: 2.8464 }, population: 38000, priority: 3 },
      { name: 'Figueres', coords: { lat: 42.2672, lng: 2.9611 }, population: 46000, priority: 3 },
    ],
  },
  'Lleida': {
    name: 'Lleida',
    cities: [
      { name: 'Lleida', coords: { lat: 41.6175, lng: 0.6200 }, population: 139000, priority: 1 },
    ],
  },
  'Tarragona': {
    name: 'Tarragona',
    cities: [
      { name: 'Tarragona', coords: { lat: 41.1189, lng: 1.2445 }, population: 134000, priority: 1 },
      { name: 'Reus', coords: { lat: 41.1556, lng: 1.1064 }, population: 103000, priority: 1 },
      { name: 'Salou', coords: { lat: 41.0764, lng: 1.1394 }, population: 26000, priority: 3 },
    ],
  },

  // COMUNIDAD VALENCIANA
  'Alicante': {
    name: 'Alicante',
    cities: [
      { name: 'Alicante', coords: { lat: 38.3452, lng: -0.4810 }, population: 337000, priority: 1 },
      { name: 'Elche', coords: { lat: 38.2699, lng: -0.6983 }, population: 234000, priority: 1 },
      { name: 'Torrevieja', coords: { lat: 37.9788, lng: -0.6814 }, population: 83000, priority: 2 },
      { name: 'Orihuela', coords: { lat: 38.0858, lng: -0.9439 }, population: 76000, priority: 2 },
      { name: 'Benidorm', coords: { lat: 38.5386, lng: -0.1312 }, population: 67000, priority: 2 },
      { name: 'Alcoy', coords: { lat: 38.7047, lng: -0.4753 }, population: 59000, priority: 2 },
      { name: 'Denia', coords: { lat: 38.8408, lng: 0.1058 }, population: 42000, priority: 3 },
    ],
  },
  'Castellón': {
    name: 'Castellón',
    cities: [
      { name: 'Castellón de la Plana', coords: { lat: 39.9864, lng: -0.0513 }, population: 171000, priority: 1 },
      { name: 'Vila-real', coords: { lat: 39.9381, lng: -0.1014 }, population: 51000, priority: 2 },
      { name: 'Benicarló', coords: { lat: 40.4214, lng: 0.4258 }, population: 26000, priority: 3 },
    ],
  },
  'Valencia': {
    name: 'Valencia',
    cities: [
      { name: 'Valencia', coords: { lat: 39.4699, lng: -0.3763 }, population: 791000, priority: 1 },
      { name: 'Torrent', coords: { lat: 39.4369, lng: -0.4664 }, population: 83000, priority: 2 },
      { name: 'Gandía', coords: { lat: 38.9664, lng: -0.1803 }, population: 75000, priority: 2 },
      { name: 'Paterna', coords: { lat: 39.5025, lng: -0.4408 }, population: 70000, priority: 2 },
      { name: 'Sagunto', coords: { lat: 39.6794, lng: -0.2739 }, population: 66000, priority: 2 },
      { name: 'Alzira', coords: { lat: 39.1514, lng: -0.4372 }, population: 44000, priority: 3 },
    ],
  },

  // EXTREMADURA
  'Badajoz': {
    name: 'Badajoz',
    cities: [
      { name: 'Badajoz', coords: { lat: 38.8794, lng: -6.9706 }, population: 151000, priority: 1 },
      { name: 'Mérida', coords: { lat: 38.9167, lng: -6.3433 }, population: 59000, priority: 2 },
      { name: 'Don Benito', coords: { lat: 38.9575, lng: -5.8631 }, population: 37000, priority: 3 },
    ],
  },
  'Cáceres': {
    name: 'Cáceres',
    cities: [
      { name: 'Cáceres', coords: { lat: 39.4753, lng: -6.3724 }, population: 96000, priority: 2 },
      { name: 'Plasencia', coords: { lat: 40.0306, lng: -6.0886 }, population: 40000, priority: 3 },
    ],
  },

  // GALICIA
  'A Coruña': {
    name: 'A Coruña',
    cities: [
      { name: 'A Coruña', coords: { lat: 43.3713, lng: -8.3960 }, population: 246000, priority: 1 },
      { name: 'Santiago de Compostela', coords: { lat: 42.8782, lng: -8.5448 }, population: 97000, priority: 2 },
      { name: 'Ferrol', coords: { lat: 43.4831, lng: -8.2336 }, population: 66000, priority: 2 },
    ],
  },
  'Lugo': {
    name: 'Lugo',
    cities: [
      { name: 'Lugo', coords: { lat: 43.0097, lng: -7.5567 }, population: 98000, priority: 2 },
      { name: 'Monforte de Lemos', coords: { lat: 42.5206, lng: -7.5147 }, population: 19000, priority: 3 },
      { name: 'Vilalba', coords: { lat: 43.2978, lng: -7.6811 }, population: 14000, priority: 3 },
      { name: 'Mondoñedo', coords: { lat: 43.4278, lng: -7.3636 }, population: 3400, priority: 3 },
      { name: 'Foz', coords: { lat: 43.5686, lng: -7.2569 }, population: 9800, priority: 3 },
      { name: 'Ribadeo', coords: { lat: 43.5372, lng: -7.0419 }, population: 9500, priority: 3 },
      { name: 'Burela', coords: { lat: 43.6583, lng: -7.3583 }, population: 9400, priority: 3 },
      { name: 'Viveiro', coords: { lat: 43.6628, lng: -7.5936 }, population: 15000, priority: 3 },
    ],
  },
  'Ourense': {
    name: 'Ourense',
    cities: [
      { name: 'Ourense', coords: { lat: 42.3367, lng: -7.8639 }, population: 105000, priority: 1 },
    ],
  },
  'Pontevedra': {
    name: 'Pontevedra',
    cities: [
      { name: 'Vigo', coords: { lat: 42.2406, lng: -8.7207 }, population: 296000, priority: 1 },
      { name: 'Pontevedra', coords: { lat: 42.4328, lng: -8.6442 }, population: 83000, priority: 2 },
    ],
  },

  // MADRID
  'Madrid': {
    name: 'Madrid',
    cities: [
      { name: 'Madrid', coords: { lat: 40.4168, lng: -3.7038 }, population: 3200000, priority: 1 },
      { name: 'Móstoles', coords: { lat: 40.3228, lng: -3.8647 }, population: 209000, priority: 1 },
      { name: 'Alcalá de Henares', coords: { lat: 40.4818, lng: -3.3633 }, population: 195000, priority: 1 },
      { name: 'Fuenlabrada', coords: { lat: 40.2842, lng: -3.7947 }, population: 194000, priority: 1 },
      { name: 'Leganés', coords: { lat: 40.3272, lng: -3.7636 }, population: 188000, priority: 1 },
      { name: 'Getafe', coords: { lat: 40.3058, lng: -3.7325 }, population: 183000, priority: 1 },
      { name: 'Alcorcón', coords: { lat: 40.3456, lng: -3.8244 }, population: 170000, priority: 1 },
      { name: 'Torrejón de Ardoz', coords: { lat: 40.4569, lng: -3.4775 }, population: 131000, priority: 1 },
      { name: 'Parla', coords: { lat: 40.2372, lng: -3.7681 }, population: 130000, priority: 1 },
      { name: 'Alcobendas', coords: { lat: 40.5478, lng: -3.6419 }, population: 117000, priority: 1 },
    ],
  },

  // MURCIA
  'Murcia': {
    name: 'Murcia',
    cities: [
      { name: 'Murcia', coords: { lat: 37.9922, lng: -1.1307 }, population: 459000, priority: 1 },
      { name: 'Cartagena', coords: { lat: 37.6256, lng: -0.9931 }, population: 218000, priority: 1 },
      { name: 'Lorca', coords: { lat: 37.6806, lng: -1.6983 }, population: 95000, priority: 2 },
      { name: 'Molina de Segura', coords: { lat: 38.0539, lng: -1.2136 }, population: 72000, priority: 2 },
      { name: 'Alcantarilla', coords: { lat: 37.9708, lng: -1.2183 }, population: 42000, priority: 3 },
      { name: 'Mazarrón', coords: { lat: 37.5994, lng: -1.3142 }, population: 34000, priority: 3 },
      { name: 'Águilas', coords: { lat: 37.4051, lng: -1.5833 }, population: 35000, priority: 3 },
      { name: 'Yecla', coords: { lat: 38.6119, lng: -1.1142 }, population: 34000, priority: 3 },
    ],
  },

  // NAVARRA
  'Navarra': {
    name: 'Navarra',
    cities: [
      { name: 'Pamplona', coords: { lat: 42.8125, lng: -1.6458 }, population: 201000, priority: 1 },
      { name: 'Tudela', coords: { lat: 42.0661, lng: -1.6050 }, population: 36000, priority: 3 },
    ],
  },

  // PAÍS VASCO
  'Álava': {
    name: 'Álava',
    cities: [
      { name: 'Vitoria-Gasteiz', coords: { lat: 42.8467, lng: -2.6716 }, population: 251000, priority: 1 },
    ],
  },
  'Guipúzcoa': {
    name: 'Guipúzcoa',
    cities: [
      { name: 'San Sebastián', coords: { lat: 43.3183, lng: -1.9812 }, population: 187000, priority: 1 },
      { name: 'Irún', coords: { lat: 43.3391, lng: -1.7893 }, population: 62000, priority: 2 },
      { name: 'Éibar', coords: { lat: 43.1844, lng: -2.4731 }, population: 27000, priority: 3 },
      { name: 'Rentería', coords: { lat: 43.3122, lng: -1.9014 }, population: 39000, priority: 3 },
      { name: 'Zarautz', coords: { lat: 43.2844, lng: -2.1719 }, population: 23000, priority: 3 },
    ],
  },
  'Vizcaya': {
    name: 'Vizcaya',
    cities: [
      { name: 'Bilbao', coords: { lat: 43.2630, lng: -2.9350 }, population: 345000, priority: 1 },
      { name: 'Barakaldo', coords: { lat: 43.2961, lng: -2.9886 }, population: 100000, priority: 1 },
      { name: 'Getxo', coords: { lat: 43.3561, lng: -3.0125 }, population: 78000, priority: 2 },
      { name: 'Portugalete', coords: { lat: 43.3203, lng: -3.0206 }, population: 45000, priority: 3 },
    ],
  },

  // LA RIOJA
  'La Rioja': {
    name: 'La Rioja',
    cities: [
      { name: 'Logroño', coords: { lat: 42.4627, lng: -2.4450 }, population: 151000, priority: 1 },
    ],
  },

  // CEUTA Y MELILLA
  'Ceuta': {
    name: 'Ceuta',
    cities: [
      { name: 'Ceuta', coords: { lat: 35.8894, lng: -5.3213 }, population: 84000, priority: 2 },
    ],
  },
  'Melilla': {
    name: 'Melilla',
    cities: [
      { name: 'Melilla', coords: { lat: 35.2923, lng: -2.9381 }, population: 86000, priority: 2 },
    ],
  },
};

/**
 * Obtener ciudades de una provincia con filtro opcional por prioridad
 */
export function getCitiesForProvince(
  province: string,
  priorityFilter?: 1 | 2 | 3 | 'all'
): CityData[] {
  const provinceData = CITIES_BY_PROVINCE[province];
  if (!provinceData) {
    console.warn(`⚠️ Provincia no encontrada: ${province}`);
    return [];
  }

  if (!priorityFilter || priorityFilter === 'all') {
    return provinceData.cities;
  }

  return provinceData.cities.filter(city => city.priority <= priorityFilter);
}

/**
 * Obtener datos de una ciudad específica
 */
export function getCityData(province: string, cityName: string): CityData | null {
  const cities = getCitiesForProvince(province);
  return cities.find(c => c.name === cityName) || null;
}

/**
 * Obtener TODAS las ciudades de TODAS las provincias
 * Útil para selector independiente de ciudades
 */
export function getAllCities(): (CityData & { province: string })[] {
  const allCities: (CityData & { province: string })[] = [];
  
  Object.entries(CITIES_BY_PROVINCE).forEach(([province, provinceData]) => {
    provinceData.cities.forEach(city => {
      allCities.push({
        ...city,
        province: province,
      });
    });
  });
  
  // Ordenar por población descendente
  return allCities.sort((a, b) => b.population - a.population);
}

