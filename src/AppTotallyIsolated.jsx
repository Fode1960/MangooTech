import React from 'react';
import VendorDashboardFinal from './pages/VendorDashboardFinal';

// Cette application ne contient RIEN d'autre que le dashboard vendeur
// Pas de Router, pas de Context, pas de Supabase, pas de logique globale.
function AppTotallyIsolated() {
  return (
    <div className="app-isolated">
      <div className="bg-red-500 text-white p-2 text-center font-bold">
        MODE TOTALEMENT ISOLÉ (AppTotallyIsolated)
      </div>
      <VendorDashboardFinal />
    </div>
  );
}

export default AppTotallyIsolated;