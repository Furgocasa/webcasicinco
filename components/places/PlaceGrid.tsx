'use client';

import { Place } from '@/types/place';
import PlaceCard from './PlaceCard';

interface PlaceGridProps {
  places: Place[];
  emptyMessage?: string;
}

export default function PlaceGrid({ 
  places, 
  emptyMessage = 'No se encontraron lugares' 
}: PlaceGridProps) {
  if (places.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <p className="text-gray-600 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map((place) => (
        <PlaceCard key={place.id} place={place} />
      ))}
    </div>
  );
}
