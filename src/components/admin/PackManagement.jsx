// Composant d'administration pour la gestion des packs et services

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Package, 
  Settings, 
  Users,
  DollarSign,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  getAllServices,
  getAllPacks,
  createPack,
  updatePack,
  deletePack,
  createService,
  updateService,
  deleteService
} from '../../lib/services.js';

const PackManagement = () => {
  const [services, setServices] = useState([]);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('packs');
  
  // États pour les modales
  const [showPackModal, setShowPackModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingPack, setEditingPack] = useState(null);
  const [editingService, setEditingService] = useState(null);
  
  // États pour les formulaires
  const [packForm, setPackForm] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'FCFA',
    billing_period: 'monthly',
    is_popular: false,
    sort_order: 0,
    service_ids: []
  });
  
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    service_type: 'website',
    base_url: '',
    icon: ''
  });

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [servicesData, packsData] = await Promise.all([
        getAllServices(),
        getAllPacks()
      ]);
      
      setServices(servicesData);
      setPacks(packsData);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Gestion des packs
  const handleCreatePack = async () => {
    try {
      await createPack(packForm);
      setShowPackModal(false);
      resetPackForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la création du pack:', err);
      setError('Impossible de créer le pack');
    }
  };

  const handleUpdatePack = async () => {
    if (!editingPack) return;
    
    try {
      await updatePack({ id: editingPack.id, ...packForm });
      setShowPackModal(false);
      setEditingPack(null);
      resetPackForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du pack:', err);
      setError('Impossible de mettre à jour le pack');
    }
  };

  const handleDeletePack = async (packId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pack ?')) return;
    
    try {
      await deletePack(packId);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression du pack:', err);
      setError('Impossible de supprimer le pack');
    }
  };

  // Gestion des services
  const handleCreateService = async () => {
    try {
      await createService(serviceForm);
      setShowServiceModal(false);
      resetServiceForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la création du service:', err);
      setError('Impossible de créer le service');
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;
    
    try {
      await updateService({ id: editingService.id, ...serviceForm });
      setShowServiceModal(false);
      setEditingService(null);
      resetServiceForm();
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du service:', err);
      setError('Impossible de mettre à jour le service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    
    try {
      await deleteService(serviceId);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la suppression du service:', err);
      setError('Impossible de supprimer le service');
    }
  };

  // Fonctions utilitaires
  const resetPackForm = () => {
    setPackForm({
      name: '',
      description: '',
      price: 0,
      currency: 'FCFA',
      billing_period: 'monthly',
      is_popular: false,
      sort_order: 0,
      service_ids: []
    });
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      service_type: 'website',
      base_url: '',
      icon: ''
    });
  };

  const openPackModal = (pack) => {
    if (pack) {
      setEditingPack(pack);
      setPackForm({
        name: pack.name,
        description: pack.description || '',
        price: pack.price,
        currency: pack.currency,
        billing_period: pack.billing_period,
        is_popular: pack.is_popular,
        sort_order: pack.sort_order,
        service_ids: pack.services?.map(s => s.id) || []
      });
    } else {
      setEditingPack(null);
      resetPackForm();
    }
    setShowPackModal(true);
  };

  const openServiceModal = (service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name: service.name,
        description: service.description || '',
        service_type: service.service_type,
        base_url: service.base_url || '',
        icon: service.icon || ''
      });
    } else {
      setEditingService(null);
      resetServiceForm();
    }
    setShowServiceModal(true);
  };

  const handleServiceToggle = (serviceId) => {
    setPackForm(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion des Packs et Services
        </h2>
        
        {/* Onglets */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('packs')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'packs'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Package className="w-4 h-4 inline mr-2" />
            Packs
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 inline mr-2" />
            Services
          </button>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Contenu des onglets */}
      {activeTab === 'packs' ? (
        <PacksTab 
          packs={packs}
          onEdit={openPackModal}
          onDelete={handleDeletePack}
          onCreate={() => openPackModal()}
        />
      ) : (
        <ServicesTab 
          services={services}
          onEdit={openServiceModal}
          onDelete={handleDeleteService}
          onCreate={() => openServiceModal()}
        />
      )}

      {/* Modal Pack */}
      {showPackModal && (
        <PackModal
          pack={editingPack}
          form={packForm}
          services={services}
          onFormChange={setPackForm}
          onServiceToggle={handleServiceToggle}
          onSave={editingPack ? handleUpdatePack : handleCreatePack}
          onCancel={() => {
            setShowPackModal(false);
            setEditingPack(null);
            resetPackForm();
          }}
        />
      )}

      {/* Modal Service */}
      {showServiceModal && (
        <ServiceModal
          service={editingService}
          form={serviceForm}
          onFormChange={setServiceForm}
          onSave={editingService ? handleUpdateService : handleCreateService}
          onCancel={() => {
            setShowServiceModal(false);
            setEditingService(null);
            resetServiceForm();
          }}
        />
      )}
    </div>
  );
};

// Composant pour l'onglet Packs
const PacksTab = ({ packs, onEdit, onDelete, onCreate }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Packs disponibles ({packs.length})
      </h3>
      <button
        onClick={onCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Nouveau pack</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packs.map((pack) => (
        <motion.div
          key={pack.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{pack.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {pack.description}
              </p>
            </div>
            {pack.is_popular && (
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium">
                Populaire
              </span>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">
                {pack.price.toLocaleString()} {pack.currency}/{pack.billing_period === 'monthly' ? 'mois' : 'an'}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Settings className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600 dark:text-gray-300">
                {pack.services?.length || 0} services
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(pack)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm flex items-center justify-center space-x-1 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => onDelete(pack.id)}
              className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Composant pour l'onglet Services
const ServicesTab = ({ services, onEdit, onDelete, onCreate }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
        Services disponibles ({services.length})
      </h3>
      <button
        onClick={onCreate}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Nouveau service</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {services.map((service) => (
        <motion.div
          key={service.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">{service.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {service.description}
              </p>
            </div>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              service.is_active
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {service.is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded text-xs">
                {service.service_type}
              </span>
            </div>
            {service.base_url && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {service.base_url}
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => onEdit(service)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm flex items-center justify-center space-x-1 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier</span>
            </button>
            <button
              onClick={() => onDelete(service.id)}
              className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-3 py-2 rounded text-sm flex items-center justify-center transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Modal pour créer/modifier un pack
const PackModal = ({ pack, form, services, onFormChange, onServiceToggle, onSave, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {pack ? 'Modifier le pack' : 'Créer un nouveau pack'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du pack
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => onFormChange({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Pack Visibilité"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => onFormChange({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="5000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Description du pack..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Devise
              </label>
              <select
                value={form.currency}
                onChange={(e) => onFormChange({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="FCFA">FCFA</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Période
              </label>
              <select
                value={form.billing_period}
                onChange={(e) => onFormChange({ ...form, billing_period: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="monthly">Mensuel</option>
                <option value="yearly">Annuel</option>
                <option value="one-time">Unique</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordre
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => onFormChange({ ...form, sort_order: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_popular"
              checked={form.is_popular}
              onChange={(e) => onFormChange({ ...form, is_popular: e.target.checked })}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
            />
            <label htmlFor="is_popular" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Pack populaire
            </label>
          </div>

          {/* Sélection des services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Services inclus
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-3">
              {services.map((service) => (
                <label key={service.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.service_ids.includes(service.id)}
                    onChange={() => onServiceToggle(service.id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {service.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{pack ? 'Mettre à jour' : 'Créer'}</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

// Modal pour créer/modifier un service
const ServiceModal = ({ service, form, onFormChange, onSave, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {service ? 'Modifier le service' : 'Créer un nouveau service'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du service
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onFormChange({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Mini-site"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange({ ...form, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Description du service..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type de service
            </label>
            <select
              value={form.service_type}
              onChange={(e) => onFormChange({ ...form, service_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="website">Site web</option>
              <option value="ecommerce">E-commerce</option>
              <option value="marketplace">Marketplace</option>
              <option value="showroom">Showroom</option>
              <option value="crm">CRM</option>
              <option value="profile">Profil</option>
              <option value="networking">Networking</option>
              <option value="delivery">Livraison</option>
              <option value="seo">SEO</option>
              <option value="support">Support</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL de base (optionnel)
            </label>
            <input
              type="url"
              value={form.base_url}
              onChange={(e) => onFormChange({ ...form, base_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Icône (optionnel)
            </label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => onFormChange({ ...form, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Globe, ShoppingBag, etc."
            />
          </div>
        </div>

        <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onSave}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{service ? 'Mettre à jour' : 'Créer'}</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

export default PackManagement;