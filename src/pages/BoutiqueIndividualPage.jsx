import React, { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { Store, Phone, Mail, MapPin, Star, Share2, Heart, ShoppingBag } from 'lucide-react';

const BoutiqueIndividualPage = () => {
  const { boutiqueSlug } = useParams();
  const [boutique, setBoutique] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);

  const loadBoutique = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`🏪 [BOUTIQUE] Chargement boutique: ${boutiqueSlug}`);

      // Rechercher la boutique par slug
      const { data: shopData, error: shopError } = await supabase
        .from('shops')
        .select('*')
        .eq('slug', boutiqueSlug)
        .eq('status', 'approved')
        .single();

      if (shopError) throw shopError;
      if (!shopData) throw new Error('Boutique non trouvée');

      setBoutique(shopData);
      console.log('✅ [BOUTIQUE] Boutique chargée:', shopData.name);

      // Charger les produits de la boutique
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopData.id)
        .eq('is_active', true);

      if (productsError) throw productsError;
      setProducts(productsData || []);

    } catch (error) {
      console.error('❌ [BOUTIQUE] Erreur:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [boutiqueSlug]);

  useEffect(() => {
    void loadBoutique();
  }, [loadBoutique]);

  const shareBoutique = () => {
    if (navigator.share) {
      navigator.share({
        title: boutique?.name,
        text: boutique?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papiers!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-[#1b5e20] mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Chargement de la boutique...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Boutique non disponible</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link 
            to="/"
            className="bg-[#1b5e20] text-white px-6 py-2 rounded-lg hover:bg-[#16381a] transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  if (!boutique) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Boutique introuvable</h2>
          <p className="text-gray-600 mb-4">Cette boutique n'existe pas ou n'est plus disponible.</p>
          <Link 
            to="/"
            className="bg-[#1b5e20] text-white px-6 py-2 rounded-lg hover:bg-[#16381a] transition-colors"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bannière */}
      <div className="relative">
        {/* Bannière */}
        <div 
          className="h-64 bg-[#f6faf3] flex items-center justify-center text-[#1b5e20]"
          style={{
            backgroundImage: boutique.banner_url ? `url(${boutique.banner_url})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="text-center bg-black bg-opacity-50 p-8 rounded-xl">
            <h1 className="text-4xl font-bold mb-2">{boutique.name}</h1>
            <p className="text-xl opacity-90">{boutique.description}</p>
          </div>
        </div>

        {/* Logo et infos */}
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Logo */}
            <div className="w-32 h-32 rounded-2xl bg-[#f6faf3] flex items-center justify-center text-[#1b5e20] text-4xl font-bold shadow-lg">
              {boutique.logo_url ? (
                <img src={boutique.logo_url} alt={boutique.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                boutique.name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{boutique.name}</h2>
              <p className="text-gray-600 mb-4">{boutique.description}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                {boutique.contact_phone && (
                  <a href={`tel:${typeof boutique.contact_phone === 'object' ? boutique.contact_phone.phone || '' : boutique.contact_phone}`} 
                     className="flex items-center gap-2 text-gray-600 hover:text-[#1b5e20]">
                    <Phone className="w-4 h-4" />
                    {typeof boutique.contact_phone === 'object' ? boutique.contact_phone.phone || boutique.contact_phone : boutique.contact_phone}
                  </a>
                )}
                {boutique.contact_email && (
                  <a href={`mailto:${typeof boutique.contact_email === 'object' ? boutique.contact_email.email || '' : boutique.contact_email}`} 
                     className="flex items-center gap-2 text-gray-600 hover:text-[#1b5e20]">
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
                )}
                {boutique.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {typeof boutique.address === 'object' ? boutique.address.address || boutique.address : boutique.address}
                  </div>
                )}
              </div>

              <div className="flex justify-center md:justify-start gap-3">
                <button
                  onClick={shareBoutique}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
                <button className="bg-[#1b5e20] hover:bg-[#16381a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <Heart className="w-4 h-4" />
                  Suivre
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Nos Produits</h3>
          <span className="bg-[#eef6ea] text-[#1b5e20] px-3 py-1 rounded-full text-sm font-medium">
            {products.length} produits
          </span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit pour le moment</h4>
            <p className="text-gray-600">Cette boutique n'a pas encore ajouté de produits.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow group">
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <ShoppingBag className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{product.name}</h4>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[#1b5e20]">
                      {product.price?.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' }) || 'Prix non défini'}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-[#ffa726] fill-current" />
                      <span className="text-sm text-gray-600">{product.rating || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 {boutique.name} - Propulsé par MangooTech
          </p>
        </div>
      </footer>
    </div>
  );
};

export default BoutiqueIndividualPage;
