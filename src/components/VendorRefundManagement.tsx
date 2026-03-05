import React, { useState } from 'react';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertCircle, Search, Filter, Download } from 'lucide-react';

interface Refund {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: Date;
  processedAt?: Date;
  refundMethod: 'card' | 'orange_money' | 'mtn_money' | 'moov_money';
  transactionId?: string;
  notes?: string;
}

interface VendorRefundManagementProps {
  vendorId: string;
}

const VendorRefundManagement: React.FC<VendorRefundManagementProps> = ({ vendorId }) => {
  const [refunds, setRefunds] = useState<Refund[]>([
    {
      id: 'refund-1',
      orderId: 'CMD-2024-001',
      customerName: 'Marie Konan',
      customerPhone: '01020304',
      amount: 45000,
      reason: 'Produit défectueux reçu',
      status: 'pending',
      requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      refundMethod: 'orange_money'
    },
    {
      id: 'refund-2',
      orderId: 'CMD-2024-002',
      customerName: 'Jean Yao',
      customerPhone: '05060708',
      amount: 125000,
      reason: 'Commande non conforme à la description',
      status: 'approved',
      requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      processedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      refundMethod: 'card',
      transactionId: 'txn_123456789',
      notes: 'Remboursement approuvé après vérification'
    },
    {
      id: 'refund-3',
      orderId: 'CMD-2024-003',
      customerName: 'Sophie Diallo',
      customerPhone: '09101112',
      amount: 25000,
      reason: 'Retard de livraison excessif',
      status: 'completed',
      requestedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      processedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      refundMethod: 'mtn_money',
      transactionId: 'txn_ref_987654321'
    }
  ]);

  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
  const [processNotes, setProcessNotes] = useState('');

  const getStatusColor = (status: Refund['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Refund['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getMethodIcon = (method: Refund['refundMethod']) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'orange_money':
        return '🟠';
      case 'mtn_money':
        return '🔶';
      case 'moov_money':
        return '🟣';
      default:
        return '💳';
    }
  };

  const filteredRefunds = refunds.filter(refund => {
    const matchesSearch = refund.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         refund.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         refund.customerPhone.includes(searchTerm);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && refund.status === filterStatus;
  });

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleProcessRefund = (refund: Refund, action: 'approve' | 'reject') => {
    setSelectedRefund(refund);
    setProcessAction(action);
    setShowProcessModal(true);
  };

  const confirmProcessRefund = () => {
    if (!selectedRefund) return;

    const updatedRefunds = refunds.map(refund => {
      if (refund.id === selectedRefund.id) {
        return {
          ...refund,
          status: processAction === 'approve' ? 'approved' : 'rejected',
          processedAt: new Date(),
          notes: processNotes
        };
      }
      return refund;
    });

    setRefunds(updatedRefunds);
    setShowProcessModal(false);
    setSelectedRefund(null);
    setProcessNotes('');
  };

  const exportRefunds = () => {
    const csvContent = [
      ['ID', 'Commande', 'Client', 'Montant', 'Statut', 'Date', 'Méthode'].join(','),
      ...filteredRefunds.map(refund => [
        refund.id,
        refund.orderId,
        refund.customerName,
        refund.amount,
        refund.status,
        formatDate(refund.requestedAt),
        refund.refundMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remboursements_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
    completed: refunds.filter(r => r.status === 'completed').length,
    totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Demandes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <RotateCcw className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Attente</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approuvées</p>
              <p className="text-2xl font-bold text-blue-600">{stats.approved}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Montant Total</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalAmount)}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <RotateCcw className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par client, commande ou téléphone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvées</option>
              <option value="rejected">Rejetées</option>
              <option value="completed">Terminées</option>
            </select>
            <button
              onClick={exportRefunds}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Liste des remboursements */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commande
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Méthode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{refund.orderId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{refund.customerName}</div>
                    <div className="text-sm text-gray-500">{refund.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatAmount(refund.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getMethodIcon(refund.refundMethod)}</span>
                      <span className="text-sm text-gray-600 capitalize">
                        {refund.refundMethod.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(refund.status)}`}>
                      {getStatusIcon(refund.status)}
                      {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(refund.requestedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {refund.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcessRefund(refund, 'approve')}
                          className="text-green-600 hover:text-green-900 bg-green-100 px-2 py-1 rounded text-xs"
                        >
                          Approuver
                        </button>
                        <button
                          onClick={() => handleProcessRefund(refund, 'reject')}
                          className="text-red-600 hover:text-red-900 bg-red-100 px-2 py-1 rounded text-xs"
                        >
                          Rejeter
                        </button>
                      </div>
                    )}
                    {refund.status !== 'pending' && (
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Voir détails
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRefunds.length === 0 && (
          <div className="text-center py-8">
            <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun remboursement trouvé</h4>
            <p className="text-gray-600">Aucune demande de remboursement ne correspond à vos critères.</p>
          </div>
        )}
      </div>

      {/* Modal de traitement */}
      {showProcessModal && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {processAction === 'approve' ? 'Approuver le remboursement' : 'Rejeter la demande'}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Commande: <span className="font-medium">{selectedRefund.orderId}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Client: <span className="font-medium">{selectedRefund.customerName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Montant: <span className="font-medium">{formatAmount(selectedRefund.amount)}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Motif: <span className="font-medium">{selectedRefund.reason}</span>
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optionnel)
              </label>
              <textarea
                value={processNotes}
                onChange={(e) => setProcessNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ajoutez des notes sur votre décision..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowProcessModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmProcessRefund}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  processAction === 'approve'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {processAction === 'approve' ? 'Approuver' : 'Rejeter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de détails */}
      {selectedRefund && !showProcessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Détails du remboursement
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">ID Remboursement</p>
                <p className="font-medium">{selectedRefund.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commande</p>
                <p className="font-medium">{selectedRefund.orderId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client</p>
                <p className="font-medium">{selectedRefund.customerName} ({selectedRefund.customerPhone})</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant</p>
                <p className="font-medium">{formatAmount(selectedRefund.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Méthode de remboursement</p>
                <p className="font-medium flex items-center gap-2">
                  <span>{getMethodIcon(selectedRefund.refundMethod)}</span>
                  {selectedRefund.refundMethod.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRefund.status)}`}>
                  {getStatusIcon(selectedRefund.status)}
                  {selectedRefund.status.charAt(0).toUpperCase() + selectedRefund.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de demande</p>
                <p className="font-medium">{formatDate(selectedRefund.requestedAt)}</p>
              </div>
              {selectedRefund.processedAt && (
                <div>
                  <p className="text-sm text-gray-600">Date de traitement</p>
                  <p className="font-medium">{formatDate(selectedRefund.processedAt)}</p>
                </div>
              )}
              {selectedRefund.transactionId && (
                <div>
                  <p className="text-sm text-gray-600">ID Transaction</p>
                  <p className="font-medium">{selectedRefund.transactionId}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Motif</p>
                <p className="font-medium">{selectedRefund.reason}</p>
              </div>
              {selectedRefund.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{selectedRefund.notes}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedRefund(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRefundManagement;