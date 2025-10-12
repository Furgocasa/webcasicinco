'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  review_count: number;
  city: string;
  province: string;
  ai_description?: string;
  ai_highlights?: string[];
  published: boolean;
  featured: boolean;
}

interface PlaceEditorProps {
  place: Place;
  onSave: (place: Place) => Promise<void>;
  onClose: () => void;
}

export function PlaceEditor({ place, onSave, onClose }: PlaceEditorProps) {
  const [editedPlace, setEditedPlace] = useState<Place>(place);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newHighlight, setNewHighlight] = useState('');

  const handleRegenerateDescription = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: place.id,
        }),
      });
      const data = await res.json();
      setEditedPlace({
        ...editedPlace,
        ai_description: data.description,
        ai_highlights: data.highlights,
      });
    } catch (error) {
      console.error('Error regenerating:', error);
      alert('Error al regenerar la descripción');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddHighlight = () => {
    if (newHighlight.trim()) {
      setEditedPlace({
        ...editedPlace,
        ai_highlights: [...(editedPlace.ai_highlights || []), newHighlight.trim()],
      });
      setNewHighlight('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setEditedPlace({
      ...editedPlace,
      ai_highlights: editedPlace.ai_highlights?.filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    try {
      await onSave(editedPlace);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar los cambios');
    }
  };

  const handleUpdateFromGoogle = async () => {
    if (confirm('¿Actualizar datos desde Google Maps? Esto sobrescribirá la información básica.')) {
      try {
        const res = await fetch(`/api/places/${place.id}/refresh`, {
          method: 'POST',
        });
        const data = await res.json();
        setEditedPlace({
          ...editedPlace,
          ...data,
        });
      } catch (error) {
        console.error('Error updating:', error);
        alert('Error al actualizar desde Google');
      }
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Editar: ${place.name}`}>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium mb-2">Nombre</label>
          <Input
            value={editedPlace.name}
            onChange={(e) =>
              setEditedPlace({ ...editedPlace, name: e.target.value })
            }
          />
        </div>

        {/* Descripción IA */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Descripción IA</label>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerateDescription}
              disabled={isRegenerating}
            >
              {isRegenerating ? 'Regenerando...' : '🔄 Regenerar con IA'}
            </Button>
          </div>
          <textarea
            value={editedPlace.ai_description || ''}
            onChange={(e) =>
              setEditedPlace({ ...editedPlace, ai_description: e.target.value })
            }
            className="w-full min-h-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Highlights */}
        <div>
          <label className="block text-sm font-medium mb-2">Highlights</label>
          <div className="space-y-2 mb-3">
            {editedPlace.ai_highlights?.map((highlight, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-50 p-2 rounded border"
              >
                <span className="text-sm">✓ {highlight}</span>
                <button
                  onClick={() => handleRemoveHighlight(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <Input
              value={newHighlight}
              onChange={(e) => setNewHighlight(e.target.value)}
              placeholder="Nuevo highlight..."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddHighlight();
                }
              }}
            />
            <Button onClick={handleAddHighlight}>+ Añadir</Button>
          </div>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium mb-2">Estado</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!editedPlace.published && !editedPlace.featured}
                onChange={() =>
                  setEditedPlace({
                    ...editedPlace,
                    published: false,
                    featured: false,
                  })
                }
                className="rounded-full"
              />
              <span>Pendiente</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={editedPlace.published && !editedPlace.featured}
                onChange={() =>
                  setEditedPlace({
                    ...editedPlace,
                    published: true,
                    featured: false,
                  })
                }
                className="rounded-full"
              />
              <span>Publicado</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={editedPlace.featured}
                onChange={() =>
                  setEditedPlace({
                    ...editedPlace,
                    published: true,
                    featured: true,
                  })
                }
                className="rounded-full"
              />
              <span>Destacado</span>
            </label>
          </div>
        </div>

        {/* Información de referencia (solo lectura) */}
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3 text-sm">Información</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Categoría</p>
              <Badge>{editedPlace.category}</Badge>
            </div>
            <div>
              <p className="text-gray-600">Rating</p>
              <p className="font-medium">
                {editedPlace.rating}★ ({editedPlace.review_count.toLocaleString()})
              </p>
            </div>
            <div>
              <p className="text-gray-600">Ubicación</p>
              <p className="font-medium">
                {editedPlace.city}, {editedPlace.province}
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="border-t pt-4 flex space-x-3">
          <Button variant="outline" onClick={handleUpdateFromGoogle} className="flex-1">
            🔄 Actualizar de Google
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-green-600 hover:bg-green-700">
            💾 Guardar
          </Button>
          <Button variant="outline" onClick={onClose}>
            ❌
          </Button>
        </div>
      </div>
    </Modal>
  );
}
