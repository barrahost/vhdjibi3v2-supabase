import { useState, useEffect } from 'react';
import { MapPin, Navigation, AlertCircle, Trash2, Link, Check, Crosshair } from 'lucide-react';
import toast from 'react-hot-toast';

interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationFieldProps {
  location: string;
  coordinates: Coordinates | null;
  useGeolocation?: boolean;
  onLocationChange: (location: string) => void;
  onCoordinatesChange: (coordinates: Coordinates | null) => void;
}

export function LocationField({ 
  location, 
  coordinates, 
  useGeolocation = false,
  onLocationChange, 
  onCoordinatesChange 
}: LocationFieldProps) {
  const [loading, setLoading] = useState(false);
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [extractingCoordinates, setExtractingCoordinates] = useState(false);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [coordinateSource, setCoordinateSource] = useState<'geolocation' | 'mapurl' | null>(
    coordinates ? (useGeolocation ? 'geolocation' : 'mapurl') : null
  );

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setLoading(true);
    setError(null);
    setGoogleMapsUrl('');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (position.coords.accuracy > 100) {
          setError("La précision est faible. Essayez dans un endroit plus dégagé.");
        }

        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        onCoordinatesChange(coords);
        setCoordinateSource('geolocation');
        setLoading(false);
        toast.success('Position mise à jour avec succès');
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Impossible de récupérer la position';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Vous devez autoriser la géolocalisation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Position indisponible. Vérifiez votre GPS';
            break;
          case error.TIMEOUT:
            errorMessage = 'Délai d\'attente dépassé. Réessayez';
            break;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        setCoordinateSource(null);
        onCoordinatesChange(null);
      },
      options
    );
  };

  // Extract coordinates from Google Maps URL
  const extractCoordinatesFromGoogleMapsUrl = (url: string): Coordinates | null => {
    try {
      const urlString = decodeURIComponent(url.trim());
      
      // Pattern for place marker coordinates (most accurate): !3d{lat}!4d{lng}
      // Example: https://www.google.com/maps/place/...!3d5.3996415!4d-4.0015583!...
      const patternPlaceMarker = /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/;
      const matchPlaceMarker = urlString.match(patternPlaceMarker);
      
      if (matchPlaceMarker) {
        return {
          latitude: parseFloat(matchPlaceMarker[1]),
          longitude: parseFloat(matchPlaceMarker[2])
        };
      }
      
      // Pattern for coordinates after /search/ in URL
      // Example: https://www.google.com/maps/search/5.400656,+-4.005678?entry=tts&...
      const patternSearch = /\/search\/(-?\d+\.\d+),\s*([+-]?\d+\.\d+)/;
      const matchSearch = urlString.match(patternSearch);
      
      if (matchSearch) {
        return {
          latitude: parseFloat(matchSearch[1]),
          longitude: parseFloat(matchSearch[2])
        };
      }
      
      // Pattern 1: https://www.google.com/maps?q=5.348103,-4.008256
      // or https://maps.google.com/?q=5.348103,-4.008256
      const patternQ = /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/;
      const matchQ = urlString.match(patternQ);
      
      if (matchQ) {
        return {
          latitude: parseFloat(matchQ[1]),
          longitude: parseFloat(matchQ[2])
        };
      }
      
      // Pattern 2: https://www.google.com/maps/@5.348103,-4.008256,15z
      const patternAt = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const matchAt = urlString.match(patternAt);
      
      if (matchAt) {
        return {
          latitude: parseFloat(matchAt[1]),
          longitude: parseFloat(matchAt[2])
        };
      }

      // Pattern 4: Google Plus Code URLs
      // Example: https://www.google.com/maps/place/5J9H%2B6V+Abidjan/...
      // We can't extract coordinates directly from Plus Codes without making an API call
      
      // Pattern 5: Coordinates in DMS format
      // Not directly supported in URLs, would need conversion from DMS to decimal
      
      // For pattern 3 (shortened URLs like https://goo.gl/maps/abcdefg), 
      // we'd need to make an HTTP request to resolve them, which is beyond
      // the scope of client-side code
      
      return null;
    } catch (error) {
      console.error('Error parsing Google Maps URL:', error);
      return null;
    }
  };

  // Handle extraction of coordinates from Google Maps URL
  const handleExtractCoordinates = () => {
    if (!googleMapsUrl.trim()) {
      toast.error('Veuillez entrer un lien Google Maps');
      return;
    }

    setExtractingCoordinates(true);
    setExtractSuccess(false);
    setError(null);

    try {
      const coords = extractCoordinatesFromGoogleMapsUrl(googleMapsUrl);

      if (coords) {
        onCoordinatesChange(coords);
        setCoordinateSource('mapurl');
        setExtractSuccess(true);
        toast.success('Coordonnées extraites avec succès');
      } else {
        setError('Impossible d\'extraire les coordonnées de ce lien Google Maps');
        toast.error('Impossible d\'extraire les coordonnées. Vérifiez le format du lien.');
      }
    } catch (error) {
      console.error('Error extracting coordinates:', error);
      setError('Une erreur est survenue lors de l\'extraction des coordonnées');
      toast.error('Erreur lors de l\'extraction des coordonnées');
    } finally {
      setExtractingCoordinates(false);
      // Reset success after 3 seconds
      if (extractSuccess) {
        setTimeout(() => setExtractSuccess(false), 3000);
      }
    }
  };

  const openInMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  const handleRemoveCoordinates = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer les coordonnées GPS ?')) {
      setCoordinateSource(null);
      onCoordinatesChange(null);
      setGoogleMapsUrl('');
      toast.success('Coordonnées GPS supprimées');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lieu d'habitation
        </label>
        <input
          type="text"
          required
          placeholder="ex: Angré 8e Tranche"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Coordonnées GPS (facultatif)</h3>
        
        {/* Method 1: Current Position */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Méthode 1: Position actuelle</span>
            <button
              type="button"
              onClick={getCurrentPosition}
              disabled={loading}
              className="flex items-center px-3 py-1.5 text-sm text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
            >
              <Crosshair className="w-4 h-4 mr-1.5" />
              {loading ? 'Obtention...' : 'Obtenir ma position actuelle'}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Utilise le GPS de votre appareil pour déterminer votre position actuelle.
          </p>
        </div>

        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute border-t border-gray-200 w-full"></div>
          <span className="relative bg-gray-50 px-2 text-xs text-gray-500">OU</span>
        </div>

        {/* Method 2: Google Maps URL */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-600">Méthode 2: Lien Google Maps</span>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=5.348103,-4.008256"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
              />
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            <button
              type="button"
              onClick={handleExtractCoordinates}
              className="flex items-center px-3 py-2 text-sm text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
              disabled={extractingCoordinates || !googleMapsUrl.trim() || extractSuccess}
            >
              {extractingCoordinates ? (
                'Extraction...'
              ) : extractSuccess ? (
                <>
                  <Check size={16} className="mr-1" />
                  Extrait
                </>
              ) : (
                'Extraire'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Collez un lien Google Maps pour extraire automatiquement les coordonnées.
            Ex: https://maps.google.com/?q=5.348103,-4.008256 ou https://www.google.com/maps/@5.348103,-4.008256,15z
          </p>
        </div>
      </div>
      
      {/* Display coordinates when available */}
      {coordinates && (
        <div className="space-y-3 p-3 border rounded-md bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              {coordinateSource === 'geolocation' 
                ? '📍 Coordonnées depuis votre position' 
                : '🔗 Coordonnées depuis Google Maps'}
            </h3>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={openInMaps}
                className="flex items-center px-3 py-1 text-sm text-[#00665C] hover:bg-[#00665C]/10 rounded-md"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Voir sur la carte
              </button>
              <button
                type="button"
                onClick={handleRemoveCoordinates}
                className="flex items-center px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                title="Supprimer les coordonnées GPS"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        
          {error && (
            <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            {coordinates ? (
              <div className="text-sm text-gray-600 w-full">
                <div className="flex justify-between">
                  <span>Latitude: {coordinates.latitude.toFixed(6)}</span>
                  <span>Longitude: {coordinates.longitude.toFixed(6)}</span>
                </div>
                {coordinates.accuracy && (
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    Précision: ±{Math.round(coordinates.accuracy)}m
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {loading ? 'Récupération de la position...' : 'Position non disponible'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}