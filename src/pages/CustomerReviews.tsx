import React from 'react';
import { Star, MessageCircle, User, Calendar, ThumbsUp } from 'lucide-react';

const CustomerReviews: React.FC = () => {
  const reviews = [
    {
      id: 1,
      productName: 'Robe Wax Ankara Premium',
      customerName: 'Aminata D.',
      rating: 5,
      comment: 'Magnifique robe! La qualité du tissu est exceptionnelle et les motifs sont superbes.',
      date: '2024-01-15',
      helpful: 12,
      verified: true
    },
    {
      id: 2,
      productName: 'Collier Perles Traditionnelles',
      customerName: 'Ousmane B.',
      rating: 4,
      comment: 'Très beau collier, artisanat de qualité. Livraison rapide.',
      date: '2024-01-12',
      helpful: 8,
      verified: true
    },
    {
      id: 3,
      productName: 'Tissu Wax Mangoo Collection',
      customerName: 'Fatou K.',
      rating: 5,
      comment: 'J\'adore ce tissu! Les couleurs sont vibrantes et le tissu est doux.',
      date: '2024-01-10',
      helpful: 15,
      verified: false
    }
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-[#f6faf3]">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-[#c8e6c9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Star className="w-8 h-8 text-yellow-500 mr-3" />
                Avis Clients
              </h1>
              <p className="text-gray-600 mt-2">Gérez et répondez aux avis de vos clients</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1b5e20]">4.8</div>
                <div className="text-sm text-gray-500">Note moyenne</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1b5e20]">156</div>
                <div className="text-sm text-gray-500">Total avis</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-[#1b5e20] rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{review.customerName}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex">{renderStars(review.rating)}</div>
                      {review.verified && (
                        <span className="bg-[#e8f5e9] text-[#16381a] text-xs px-2 py-1 rounded-full">
                          Vérifié
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(review.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">{review.productName}</h4>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <button className="flex items-center space-x-2 text-gray-500 hover:text-[#1b5e20] transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Répondre</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-500 hover:text-[#1b5e20] transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Utile ({review.helpful})</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {reviews.length === 0 && (
          <div className="text-center py-12">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun avis pour le moment</h3>
            <p className="text-gray-600">Les avis de vos clients apparaîtront ici.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerReviews;