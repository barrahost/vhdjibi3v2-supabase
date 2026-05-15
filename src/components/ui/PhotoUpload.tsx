import { useState, useRef, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

interface PhotoUploadProps {
  onChange: (file: File | null) => void;
  currentPhotoURL?: string | null;
  setUserExplicitlyRemovedPhoto?: (value: boolean) => void;
}

export function PhotoUpload({ onChange, currentPhotoURL, setUserExplicitlyRemovedPhoto }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize preview with current photo URL when component mounts or URL changes
  useEffect(() => {
    if (currentPhotoURL) {
      setPreview(currentPhotoURL);
      console.log('Setting preview from currentPhotoURL:', currentPhotoURL);
    }
  }, [currentPhotoURL]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      // Créer l'aperçu
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      console.log('Reading file for preview');
      reader.readAsDataURL(file);
      
      if (setUserExplicitlyRemovedPhoto) {
        setUserExplicitlyRemovedPhoto(false);
      }
      onChange(file);
    }
  };

  // Handle photo removal
  const handleRemove = () => {
    setPreview(null);
    if (setUserExplicitlyRemovedPhoto) {
      setUserExplicitlyRemovedPhoto(true);
    }
    console.log('User explicitly removed photo');
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Photo de profil
      </label>

      {preview ? (
        <div className="relative w-32 h-32">
          <img
            src={preview}
            alt="Aperçu"
            className="w-full h-full object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#00665C] transition-colors"
        >
          <Upload className="w-6 h-6 text-gray-400" />
          <span className="mt-2 text-sm text-gray-500">Ajouter une photo</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500">
        Format: JPG, PNG. Taille max: 5MB
      </p>
    </div>
  );
}