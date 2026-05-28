import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

const ImageUpload = ({ onImagesChange, maxImages = 5, existingImages = [] }) => {
  const [images, setImages] = useState(existingImages);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  // Fonction de validation de l'image
  const validateImage = (file) => {
    const errors = [];
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      errors.push(`Format non supporté: ${file.name}. Utilisez JPG, PNG ou WebP.`);
    }

    if (file.size > maxSize) {
      errors.push(`Image trop grande: ${file.name}. Maximum 5MB.`);
    }

    return errors;
  };

  // Conversion de l'image en base64 pour l'aperçu
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Compression de l'image
  const compressImage = async (base64String, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculer les nouvelles dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en base64 avec compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = base64String;
    });
  };

  // Gestion du changement de fichiers
  const handleFileChange = useCallback(async (event) => {
    const files = Array.from(event.target.files);
    const newErrors = [];
    const newImages = [];

    setUploading(true);
    setErrors([]);

    // Vérifier le nombre total d'images
    if (images.length + files.length > maxImages) {
      setErrors([`Maximum ${maxImages} images autorisées.`]);
      setUploading(false);
      return;
    }

    for (const file of files) {
      const validationErrors = validateImage(file);
      
      if (validationErrors.length > 0) {
        newErrors.push(...validationErrors);
        continue;
      }

      try {
        // Convertir en base64
        const base64String = await convertToBase64(file);
        
        // Compresser l'image
        const compressedImage = await compressImage(base64String);
        
        newImages.push({
          id: Date.now() + Math.random(),
          file: file,
          preview: compressedImage,
          name: file.name,
          size: file.size,
          type: file.type
        });
      } catch (error) {
        newErrors.push(`Erreur lors du traitement de ${file.name}: ${error.message}`);
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    }

    setUploading(false);
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images, maxImages, onImagesChange]);

  // Supprimer une image
  const removeImage = useCallback((imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  // Déclencher le téléchargement
  const triggerUpload = useCallback(() => {
    if (images.length < maxImages) {
      fileInputRef.current?.click();
    }
  }, [images.length, maxImages]);

  // Glisser-déposer
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange({ target: { files } });
    }
  }, [handleFileChange]);

  return (
    <div className="w-full">
      {/* Zone de téléchargement */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          uploading 
            ? 'border-orange-300 bg-orange-50' 
            : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
        }`}
        onClick={triggerUpload}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />
        
        {uploading ? (
          <div className="animate-pulse">
            <Upload className="w-12 h-12 mx-auto text-orange-500 mb-2 animate-spin" />
            <p className="text-orange-600 font-medium">Téléchargement en cours...</p>
          </div>
        ) : images.length >= maxImages ? (
          <div>
            <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Maximum {maxImages} images atteintes</p>
          </div>
        ) : (
          <div>
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium mb-1">
              Glisser-déposer vos images ici
            </p>
            <p className="text-gray-500 text-sm">
              ou cliquer pour sélectionner (max {maxImages})
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Formats: JPG, PNG, WebP • Max: 5MB par image
            </p>
          </div>
        )}
      </div>

      {/* Messages d'erreur */}
      {errors.length > 0 && (
        <div className="mt-4 space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Aperçu des images */}
      {images.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Images ({images.length}/{maxImages})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-w-1 aspect-h-1 w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {image.name}
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round(image.size / 1024)}KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;