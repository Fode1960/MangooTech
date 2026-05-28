import { useState, useEffect } from 'react';

interface Payment {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  date: string;
  customer: string;
}

export default function AdminPayments() {
  const [mounted, setMounted] = useState(false);

  console.log('💰 ADMIN PAYMENTS: Component function called');
  console.log('📍 Current URL:', window.location.href);
  console.log('🔄 Component rendering...');
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: '1',
      amount: 125.50,
      status: 'completed',
      method: 'Carte Bancaire',
      date: '2024-01-15',
      customer: 'Jean Dupont'
    },
    {
      id: '2', 
      amount: 89.99,
      status: 'pending',
      method: 'PayPal',
      date: '2024-01-14',
      customer: 'Marie Martin'
    },
    {
      id: '3',
      amount: 234.75,
      status: 'completed',
      method: 'Carte Bancaire',
      date: '2024-01-13',
      customer: 'Pierre Bernard'
    }
  ]);

  useEffect(() => {
    console.log('💰 ADMIN PAYMENTS: useEffect triggered - Component mounted!');
    setMounted(true);
    
    // ALERT pour confirmation visuelle
    console.log('💰 ADMIN PAYMENTS: Component est monté et visible!');
  }, []);

  // Calculer le revenu total
  const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-8">
      {(() => {
        console.log('💰 ADMIN PAYMENTS: RETURN executed - JSX rendering!');
        console.log('💰 ADMIN PAYMENTS: mounted state:', mounted);
        return null;
      })()}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Paiements</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Gestion des paiements et transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Revenu Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">€{totalRevenue.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <span className="text-green-600 dark:text-green-300 text-xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Transactions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 dark:text-blue-300 text-xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">En Attente</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {payments.filter(p => p.status === 'pending').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 dark:text-yellow-300 text-xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historique des Paiements</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Méthode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    #{payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {payment.customer}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    €{payment.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      payment.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : payment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {payment.status === 'completed' ? 'Terminé' : 
                       payment.status === 'pending' ? 'En attente' : 'Échoué'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                    {payment.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}