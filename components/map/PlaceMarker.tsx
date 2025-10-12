'use client';

interface PlaceMarkerProps {
  name: string;
  rating: number;
  category: string;
  onClick?: () => void;
}

export function PlaceMarker({ name, rating, category, onClick }: PlaceMarkerProps) {
  const color = getCategoryColor(category);
  
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer transform transition-transform hover:scale-110"
    >
      {/* Marcador circular */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white"
        style={{ backgroundColor: color }}
      >
        {rating.toFixed(1)}
      </div>
      
      {/* Tooltip al hacer hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
        <div className="bg-white rounded-lg shadow-xl p-3 whitespace-nowrap">
          <p className="font-semibold text-sm">{name}</p>
          <p className="text-xs text-gray-600">
            <span className="text-yellow-500">★</span> {rating}
          </p>
        </div>
        {/* Flecha del tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
      </div>
      
      {/* Punta del marcador */}
      <div
        className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent"
        style={{ borderTopColor: color }}
      ></div>
    </div>
  );
}

// Función auxiliar para obtener el color según la categoría
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    restaurant: '#ef4444', // rojo
    restaurante: '#ef4444',
    hotel: '#3b82f6', // azul
    spa: '#10b981', // verde
    experience: '#f59e0b', // amarillo
    experiencia: '#f59e0b',
  };
  return colors[category.toLowerCase()] || '#6b7280'; // gris por defecto
}
