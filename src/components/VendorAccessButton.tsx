import React from 'react';
import { Link } from 'react-router-dom';
import { Store, LogIn } from 'lucide-react';

const VendorAccessButton = () => {
  return (
    <Link
      to="/vendor-login"
      className="fixed bottom-6 right-6 bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center gap-2 z-50"
    >
      <Store className="w-5 h-5" />
      <span className="font-medium">Espace Vendeur</span>
      <LogIn className="w-4 h-4" />
    </Link>
  );
};

export default VendorAccessButton;