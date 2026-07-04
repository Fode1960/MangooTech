import { useState, useRef } from 'react';
import { supabase } from '../config/supabase';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  User,
  Store,
  AlertCircle,
  CheckCircle,
  Image as ImageIcon
} from 'lucide-react';

interface ShopFormData {
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  country: string;
  city: string;
  category: string;
  logo_url?: string;
  cover_image_url?: string;
}

export default function AdminCreateShop() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ShopFormData>({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    country: 'Côte d\'Ivoire',
    city: '',
    category: 'general'
  });

  const countries = [
    'Côte d\'Ivoire',
    'Sénégal', 
    'Mali',
    'Burkina Faso',
    'Niger',
    'Togo',
    'Bénin',
    'Ghana',
    'Nigeria',
    'Cameroun'
  ];

  const categories = [
    'general',
    'electronics',
    'fashion',
    'food',
    'health',
    'beauty',
    'automotive',
    'home',
    'sports',
    'books',
    'toys',
    'other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData(prev => ({
        ...prev,
        slug: slug || ''
      }));
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogoToSupabase = async (file: File): Promise<string> => {
    try {
      const fileName = `shop-logos/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('boutique-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('boutique-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload du logo:', error);
      throw new Error('Impossible d\'uploader le logo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.name.trim()) {
        throw new Error('Le nom de la boutique est requis');
      }
      if (!formData.slug.trim()) {
        throw new Error('Le slug est requis');
      }
      if (!formData.email.trim()) {
        throw new Error('L\'email est requis');
      }
      if (!formData.phone.trim()) {
        throw new Error('Le numéro de téléphone est requis');
      }

      // Vérifier si le slug existe déjà
      const { data: existingShop } = await supabase
        .from('shops')
        .select('id')
        .eq('slug', formData.slug)
        .single();

      if (existingShop) {
        throw new Error('Ce slug est déjà utilisé. Veuillez en choisir un autre.');
      }

      // Upload du logo si sélectionné
      let logoUrl = null;
      if (logoFile) {
        try {
          logoUrl = await uploadLogoToSupabase(logoFile);
        } catch (uploadError) {
          console.error('Erreur upload logo:', uploadError);
          // Continuer sans logo si l'upload échoue
        }
      }

      // Pour l'admin, récupérer l'utilisateur connecté de Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      let userId;
      
      if (supabaseUser) {
        userId = supabaseUser.id;
      } else {
        // Fallback: utiliser l'ID admin système si pas connecté à Supabase
        userId = '00000000-0000-0000-0000-000000000001';
      }

      // Créer la boutique avec le logo
      const shopData: {
        user_id: string;
        name: string;
        slug: string;
        description: string;
        address: { street: string; city: string; country: string };
        city: string;
        phone: string;
        email: string;
        website_url: string;
        category: string;
        status: string;
        is_verified: boolean;
        created_at: string;
        updated_at: string;
        logo_url?: string;
      } = {
        user_id: userId,
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        address: {
          street: formData.address.trim(),
          city: formData.city.trim(),
          country: formData.country
        },
        city: formData.city.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        website_url: formData.website.trim(),
        category: formData.category,
        status: 'pending',
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Ajouter le logo si uploadé
      if (logoUrl) {
        shopData.logo_url = logoUrl;
      }

      // Créer la boutique
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert([shopData])
        .select()
        .single();

      if (shopError) {
        throw new Error('Erreur lors de la création de la boutique: ' + shopError.message);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.hash = '#/admin/shops';
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="px-0">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.hash = '#/admin/shops'}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Créer une nouvelle boutique
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Remplissez les informations ci-dessous pour créer une nouvelle boutique
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages de succès/erreur */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Boutique créée avec succès ! Redirection...
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo Upload */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <ImageIcon className="h-5 w-5 mr-2" />
              Logo de la boutique
            </h3>
            <div className="flex items-center space-x-4">
              {logoPreview && (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoPreview(null);
                      setLogoFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <span>{logoPreview ? 'Changer le logo' : 'Uploader un logo'}</span>
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Formats acceptés : JPG, PNG, GIF. Taille max : 2MB
                </p>
              </div>
            </div>
          </div>

          {/* Informations générales */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom de la boutique *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Nom de la boutique"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="nom-de-la-boutique"
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  L'URL sera : /shop/{formData.slug || 'nom'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pays
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {countries.map(country => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Description détaillée de la boutique"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="contact@boutique.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="+225 01 23 45 67 89"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site web
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="https://www.boutique.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ville
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Abidjan"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Adresse complète
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Rue, immeuble, quartier..."
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => window.location.hash = '#/admin/shops'}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Créer la boutique</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
