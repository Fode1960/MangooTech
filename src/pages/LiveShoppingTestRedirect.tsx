import React from 'react';

const LiveShoppingTestRedirect: React.FC = () => {
  React.useEffect(() => {
    // Redirect to the correct route after a short delay
    setTimeout(() => {
      window.location.href = '/live-voip-test';
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Redirection vers Live Shopping</h1>
        <p className="text-gray-600 mb-6">Vous allez être redirigé vers l'interface de test Live Shopping VoIP...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        <p className="text-sm text-gray-500 mt-4">
          Si la redirection ne fonctionne pas, cliquez sur ce lien:
          <br />
          <a href="/live-voip-test" className="text-orange-600 hover:text-orange-800 underline">
            Accès direct à l'interface de test
          </a>
        </p>
      </div>
    </div>
  );
};

export default LiveShoppingTestRedirect;