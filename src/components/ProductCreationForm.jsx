import { useState } from 'react';
import ImageUpload from './ImageUpload';

const ProductCreationForm = ({ onProductCreated }) => {
  const [isDark, setIsDark] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Électronique',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({
      ...prev,
      images: images
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simuler l'envoi des données
      const newProduct = {
        id: Date.now().toString(),
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        createdAt: new Date().toISOString()
      };

      // Appeler la fonction parent
      if (onProductCreated) {
        onProductCreated(newProduct);
      }

      // Réinitialiser le formulaire
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: 'Électronique',
        images: []
      });

      alert('Produit créé avec succès!');
    } catch (error) {
      console.error('Erreur lors de la création du produit:', error);
      alert('Erreur lors de la création du produit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    'Électronique',
    'Mode',
    'Alimentation',
    'Artisanat',
    'Beauté & Santé',
    'Maison & Décor',
    'Sports & Loisirs',
    'Livres & Papeterie',
    'Jouets & Enfants',
    'Auto & Moto'
  ];

  return (
    <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <h3 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Ajouter un Produit
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section des images */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Photos du produit
          </label>
          <ImageUpload 
            onImagesChange={handleImagesChange}
            maxImages={5}
            existingImages={formData.images}
          />
        </div>

        {/* Nom du produit */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Nom du produit *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 focus:ring-2 focus:ring-[#1b5e20] ${
              isDark 
                ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-[#1b5e20]' 
                : 'bg-white border border-gray-300 text-gray-900 focus:border-[#1b5e20]'
            }`}
            placeholder="Ex: Smartphone Android"
          />
        </div>

        {/* Description */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Description *
          </label>
          <textarea
            name="description"
            required
            value={formData.description}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 focus:ring-2 focus:ring-[#1b5e20] ${
              isDark 
                ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-[#1b5e20]' 
                : 'bg-white border border-gray-300 text-gray-900 focus:border-[#1b5e20]'
            }`}
            rows="4"
            placeholder="Décrivez votre produit en détail..."
          />
        </div>

        {/* Prix et Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Prix (FCFA) *
            </label>
            <input
              type="number"
              name="price"
              required
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 focus:ring-2 focus:ring-[#1b5e20] ${
                isDark 
                  ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-[#1b5e20]' 
                  : 'bg-white border border-gray-300 text-gray-900 focus:border-[#1b5e20]'
              }`}
              placeholder="10000"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Stock initial *
            </label>
            <input
              type="number"
              name="stock"
              required
              min="0"
              value={formData.stock}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 focus:ring-2 focus:ring-[#1b5e20] ${
                isDark 
                  ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-[#1b5e20]' 
                  : 'bg-white border border-gray-300 text-gray-900 focus:border-[#1b5e20]'
              }`}
              placeholder="10"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Catégorie *
          </label>
          <select 
            name="category"
            required
            value={formData.category}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 rounded-lg border transition-colors duration-300 focus:ring-2 focus:ring-[#1b5e20] ${
              isDark 
                ? 'bg-gray-700 border border-gray-600 text-white focus:border-[#1b5e20]' 
                : 'bg-white border border-gray-300 text-gray-900 focus:border-[#1b5e20]'
            }`}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton de soumission */}
        <button 
          type="submit"
          disabled={isSubmitting}
          className={`w-full bg-[#1b5e20] text-white py-3 px-4 rounded-lg font-medium transition-all ${
            isSubmitting 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-[#16381a]'
          }`}
        >
          {isSubmitting ? 'Création en cours...' : 'Créer le Produit'}
        </button>
      </form>
    </div>
  );
};

export default ProductCreationForm;