import React, { useState, useEffect, useCallback } from 'react';
import { Star, MessageCircle, Reply, ThumbsUp, User, Calendar, Filter, Search, TrendingUp, Award } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

interface Review {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  comment: string;
  vendorReply?: string;
  replyDate?: string;
  helpful: number;
  verified: boolean;
  createdAt: string;
  images?: string[];
}

interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
  repliedCount: number;
  pendingReply: number;
}

const VendorReviewsManagement = ({ vendorId }: { vendorId: string }) => {
  const { addNotification } = useNotification();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    totalReviews: 0,
    averageRating: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
    repliedCount: 0,
    pendingReply: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [replyFilter, setReplyFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);

  const loadReviews = useCallback(() => {
    setLoading(true);
    
    setTimeout(() => {
      const demoReviews: Review[] = [
        {
          id: 'review-1',
          productId: 'product-1',
          productName: 'Robe wax traditionnelle',
          customerName: 'Marie Dupont',
          customerEmail: 'marie@example.com',
          rating: 5,
          comment: 'Magnifique robe ! La qualité du wax est exceptionnelle et les finitions sont parfaites. La livraison a été rapide et le vendeur très professionnel.',
          vendorReply: 'Merci beaucoup Marie ! Nous sommes ravis que vous soyez satisfaite de votre achat. À bientôt !',
          replyDate: '2024-02-08T10:30:00Z',
          helpful: 12,
          verified: true,
          createdAt: '2024-02-07T14:20:00Z',
          images: ['https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=200']
        },
        {
          id: 'review-2',
          productId: 'product-2',
          productName: 'Sac artisanal en raphia',
          customerName: 'Jean Martin',
          customerEmail: 'jean@example.com',
          rating: 4,
          comment: 'Très joli sac, bien confectionné. La taille est parfaite pour tous les jours. Petit bémol sur le délai de livraison mais le produit vaut le coup.',
          helpful: 8,
          verified: true,
          createdAt: '2024-02-06T09:15:00Z'
        },
        {
          id: 'review-3',
          productId: 'product-3',
          productName: 'Bijou fantaisie en perles',
          customerName: 'Sophie Bernard',
          customerEmail: 'sophie@example.com',
          rating: 5,
          comment: 'Excellente qualité ! Les perles sont magnifiques et le design est unique. J\'ai reçu beaucoup de compliments.',
          helpful: 15,
          verified: true,
          createdAt: '2024-02-05T16:45:00Z'
        },
        {
          id: 'review-4',
          productId: 'product-4',
          productName: 'Chemise traditionnelle',
          customerName: 'Pierre Leroy',
          customerEmail: 'pierre@example.com',
          rating: 3,
          comment: 'La chemise est jolie mais la taille est un peu petite. Je recommande de prendre une taille au-dessus.',
          helpful: 5,
          verified: false,
          createdAt: '2024-02-04T11:20:00Z'
        },
        {
          id: 'review-5',
          productId: 'product-1',
          productName: 'Robe wax traditionnelle',
          customerName: 'Claire Dubois',
          customerEmail: 'claire@example.com',
          rating: 2,
          comment: 'Déçue par la qualité du tissu. Il ne correspond pas à la description et la couleur est différente de celle montrée.',
          helpful: 3,
          verified: true,
          createdAt: '2024-02-03T13:30:00Z'
        }
      ];
      
      setReviews(demoReviews);
      calculateStats(demoReviews);
      setLoading(false);
    }, 1000);
  }, []);

  const calculateStats = (reviewsList: Review[]) => {
    const totalReviews = reviewsList.length;
    const averageRating = totalReviews > 0 
      ? reviewsList.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    const fiveStar = reviewsList.filter(r => r.rating === 5).length;
    const fourStar = reviewsList.filter(r => r.rating === 4).length;
    const threeStar = reviewsList.filter(r => r.rating === 3).length;
    const twoStar = reviewsList.filter(r => r.rating === 2).length;
    const oneStar = reviewsList.filter(r => r.rating === 1).length;
    const repliedCount = reviewsList.filter(r => r.vendorReply).length;
    const pendingReply = reviewsList.filter(r => !r.vendorReply && r.rating <= 3).length;

    setStats({
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      fiveStar,
      fourStar,
      threeStar,
      twoStar,
      oneStar,
      repliedCount,
      pendingReply
    });
  };

  const filterReviews = useCallback(() => {
    let filtered = [...reviews];

    if (searchTerm) {
      filtered = filtered.filter(review =>
        review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (ratingFilter !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(ratingFilter));
    }

    if (replyFilter === 'replied') {
      filtered = filtered.filter(review => review.vendorReply);
    } else if (replyFilter === 'pending') {
      filtered = filtered.filter(review => !review.vendorReply);
    }

    setFilteredReviews(filtered);
  }, [ratingFilter, replyFilter, reviews, searchTerm]);

  useEffect(() => {
    loadReviews();
    
    // Simulation de nouveaux avis en mode dÃ©mo
    const interval = setInterval(() => {
      if (Math.random() > 0.8) { // 20% de chance
        const demoCustomers = ['Aminata Diallo', 'Ibrahim TourÃ©', 'Fatou Sow', 'Mamadou KonÃ©'];
        const demoProducts = ['Robe wax', 'Chemise traditionnelle', 'Sac artisanal', 'Bijou fantaisie'];
        const ratings = [4, 5];
        
        const newReview = {
          id: `review-${Date.now()}`,
          productId: 'product-demo',
          productName: demoProducts[Math.floor(Math.random() * demoProducts.length)],
          customerName: demoCustomers[Math.floor(Math.random() * demoCustomers.length)],
          customerEmail: '',
          rating: ratings[Math.floor(Math.random() * ratings.length)],
          comment: ['Excellent produit !', 'TrÃ¨s satisfait', 'Conforme Ã  la description'][Math.floor(Math.random() * 3)],
          helpful: Math.floor(Math.random() * 5),
          verified: true,
          createdAt: new Date().toISOString()
        };
        
        setReviews(prev => [newReview, ...prev]);
        
        // Notification du nouvel avis
        addNotification({
          type: 'review',
          title: 'Nouvel avis',
          message: `${newReview.customerName} a laissÃ© ${newReview.rating}â­ sur ${newReview.productName}`,
          priority: 'medium',
          sound: true
        });
      }
    }, 20000); // Toutes les 20 secondes
    
    return () => clearInterval(interval);
  }, [addNotification, loadReviews]);

  useEffect(() => {
    filterReviews();
  }, [filterReviews]);

  const handleReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText('');
    setShowReplyModal(true);
  };

  const submitReply = () => {
    if (!selectedReview || !replyText.trim()) return;

    setReviews(prev => prev.map(review =>
      review.id === selectedReview.id
        ? {
            ...review,
            vendorReply: replyText.trim(),
            replyDate: new Date().toISOString()
          }
        : review
    ));

    setShowReplyModal(false);
    setReplyText('');
    setSelectedReview(null);

    // Notification via le système de notifications
    addNotification({
      type: 'success',
      title: 'Réponse envoyée',
      message: `Votre réponse à ${selectedReview.customerName} a été publiée`,
      priority: 'medium',
      sound: true
    });
  };

  const renderStars = (rating: number, interactive: boolean = false, size: string = 'w-4 h-4') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
          />
        ))}
      </div>
    );
  };

  const getRatingDistribution = () => {
    const total = stats.totalReviews;
    if (total === 0) return [];
    
    return [
      { rating: 5, count: stats.fiveStar, percentage: (stats.fiveStar / total) * 100 },
      { rating: 4, count: stats.fourStar, percentage: (stats.fourStar / total) * 100 },
      { rating: 3, count: stats.threeStar, percentage: (stats.threeStar / total) * 100 },
      { rating: 2, count: stats.twoStar, percentage: (stats.twoStar / total) * 100 },
      { rating: 1, count: stats.oneStar, percentage: (stats.oneStar / total) * 100 }
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-2 text-gray-600">Chargement des avis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-[#f6faf3] rounded-xl p-6 border border-[#cfe0c8]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Gestion des Avis Clients
          </h2>
          {stats.pendingReply > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              🔔 {stats.pendingReply} avis attendent une réponse
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Note Moyenne</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900">{stats.averageRating}</span>
                  <span className="text-yellow-500">⭐</span>
                </div>
              </div>
              <Award className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Avis</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avis Répondus</p>
                <p className="text-3xl font-bold text-green-600">{stats.repliedCount}</p>
              </div>
              <Reply className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Réponse Attendue</p>
                <p className="text-3xl font-bold text-red-600">{stats.pendingReply}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Distribution des notes */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution des Notes</h3>
        <div className="space-y-3">
          {getRatingDistribution().map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#1b5e20] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-right">
                <span className="text-sm text-gray-600">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par produit, client ou commentaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]"
            >
              <option value="all">Toutes les notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
            
            <select
              value={replyFilter}
              onChange={(e) => setReplyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]"
            >
              <option value="all">Tous les avis</option>
              <option value="replied">Avec réponse</option>
              <option value="pending">Sans réponse</option>
            </select>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun avis ne correspond à vos critères de recherche.</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{review.customerName}</h4>
                      {review.verified && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          ✅ Vérifié
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                  <span className="text-sm font-medium text-gray-900">{review.rating}/5</span>
                </div>
              </div>

              <div className="mb-3">
                <h5 className="font-medium text-gray-900 mb-1">{review.productName}</h5>
                <p className="text-gray-700">{review.comment}</p>
              </div>

              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt="Image du client"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-600">
                    <ThumbsUp className="w-4 h-4" />
                    Utile ({review.helpful})
                  </button>
                  
                  {!review.vendorReply && (
                    <button
                      onClick={() => handleReply(review)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Reply className="w-4 h-4" />
                      Répondre
                    </button>
                  )}
                </div>

                {review.vendorReply && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    Répondu
                  </div>
                )}
              </div>

              {review.vendorReply && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Reply className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Réponse du vendeur</span>
                    <span className="text-xs text-blue-600">
                      {review.replyDate && new Date(review.replyDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-blue-800">{review.vendorReply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de réponse */}
      {showReplyModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Répondre à l'avis de {selectedReview.customerName}
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Avis :</p>
              <p className="text-gray-800">{selectedReview.comment}</p>
            </div>

            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={submitReply}
                disabled={!replyText.trim()}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Envoyer la réponse
              </button>
              <button
                onClick={() => setShowReplyModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorReviewsManagement;
