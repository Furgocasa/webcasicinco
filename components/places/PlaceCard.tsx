'use client';

import Link from 'next/link';
import { Place } from '@/types/place';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getPlacePhotoUrl, hasPlacePhotos } from '@/lib/utils/photo-helper';

interface PlaceCardProps {
  place: Place;
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const placeUrl = `/${place.category}/${place.province}/${place.slug}`;
  const photoUrl = getPlacePhotoUrl(place, 0);

  return (
    <Link href={placeUrl}>
      <Card className="hover:shadow-xl transition-shadow cursor-pointer h-full">
        {/* Imagen */}
        <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={place.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gray-400 text-4xl">📍</span>
            </div>
          )}
          
          {/* Rating badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="success" className="bg-white">
              ⭐ {place.rating}
            </Badge>
          </div>
        </div>

        <CardContent className="pt-4">
          {/* Título */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {place.name}
          </h3>

          {/* Categoría y provincia */}
          <div className="flex gap-2 mb-3">
            <Badge variant="secondary" className="text-xs">
              {place.category}
            </Badge>
            <Badge variant="default" className="text-xs">
              {place.province}
            </Badge>
          </div>

          {/* Dirección */}
          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {place.city}
          </p>

          {/* Descripción corta */}
          {place.ai_description && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {place.ai_description}
            </p>
          )}

          {/* Highlights */}
          {place.ai_highlights && place.ai_highlights.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {place.ai_highlights.slice(0, 2).map((highlight, index) => (
                <span
                  key={index}
                  className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded"
                >
                  {highlight}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm text-gray-500">
            <span>{place.review_count || 0} reseñas</span>
            {place.price_level && (
              <span>{'€'.repeat(place.price_level)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
