import React, { useState } from 'react';
import { CreditCard, Smartphone, Settings, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface PaymentSettings {
  stripeEnabled: boolean;
  stripePublicKey: string;
  stripeSecretKey: string;
  mobileMoneyEnabled: boolean;
  orangeMoneyEnabled: boolean;
  mtnMoneyEnabled: boolean;
  moovMoneyEnabled: boolean;
  commissionRate: number;
  payoutSchedule: 'daily' | 'weekly' | 'monthly';
  minimumPayout: number;
}

interface VendorPaymentSettingsProps {
  vendorId: string;
  onSettingsUpdate?: (settings: PaymentSettings) => void;
}

const VendorPaymentSettings: React.FC<VendorPaymentSettingsProps> = ({ vendorId, onSettingsUpdate }) => {
  const [settings, setSettings] = useState<PaymentSettings>({
    stripeEnabled: true,
    stripePublicKey: '',
    stripeSecretKey: '',
    mobileMoneyEnabled: true,
    orangeMoneyEnabled: true,
    mtnMoneyEnabled: true,
    moovMoneyEnabled: false,
    commissionRate: 2.5,
    payoutSchedule: 'weekly',
    minimumPayout: 10000
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'mobile' | 'settings'>('cards');

  const handleSettingChange = (key: keyof PaymentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Simulation de sauvegarde
    console.log('Sauvegarde des paramètres de paiement:', settings);
    onSettingsUpdate?.(settings);
    setIsEditing(false);
    alert('Paramètres de paiement sauvegardés avec succès!');
  };

  const testStripeConnection = () => {
    alert('Test de connexion Stripe réussi! (Mode Demo)');
  };

  const testMobileMoneyConnection = () => {
    alert('Test de connexion Mobile Money réussi! (Mode Demo)');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Bannière d'information Demo */}
      {showDemoInfo && (
        <div className="mb-6 bg-[#eef6ea] border border-[#cfe0c8] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#1b5e20] mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-[#ecf7e7]">Mode Démonstration</h3>
              <p className="text-sm text-[#1b5e20] mt-1">
                Ces paramètres sont simulés. En production, vous devrez configurer vos vraies clés API Stripe et Mobile Money.
              </p>
            </div>
            <button
              onClick={() => setShowDemoInfo(false)}
              className="text-[#1b5e20] hover:text-[#1b5e20]"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* En-tête */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuration des Paiements</h2>
            <p className="text-gray-600 mt-1">Gérez vos méthodes de paiement et vos paramètres de commission</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-[#1b5e20] text-white px-4 py-2 rounded-lg hover:bg-[#1b5e20] transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {isEditing ? 'Annuler' : 'Modifier'}
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('cards')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'cards'
                  ? 'border-[#1b5e20] text-[#1b5e20]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Cartes Bancaires
              </div>
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'mobile'
                  ? 'border-[#1b5e20] text-[#1b5e20]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4" />
                Mobile Money
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-[#1b5e20] text-[#1b5e20]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Paramètres Généraux
              </div>
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        <div className="p-6">
          {activeTab === 'cards' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Stripe Payment</h3>
                  <p className="text-sm text-gray-600">Acceptez les paiements par carte bancaire</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.stripeEnabled}
                    onChange={(e) => handleSettingChange('stripeEnabled', e.target.checked)}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1b5e20]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b5e20]"></div>
                </label>
              </div>

              {settings.stripeEnabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clé Publique Stripe
                    </label>
                    <input
                      type="password"
                      value={settings.stripePublicKey}
                      onChange={(e) => handleSettingChange('stripePublicKey', e.target.value)}
                      disabled={!isEditing}
                      placeholder="pk_test_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Votre clé publique Stripe (pk_test_...)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Clé Secrète Stripe
                    </label>
                    <input
                      type="password"
                      value={settings.stripeSecretKey}
                      onChange={(e) => handleSettingChange('stripeSecretKey', e.target.value)}
                      disabled={!isEditing}
                      placeholder="sk_test_..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Votre clé secrète Stripe (sk_test_...)</p>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-[#eef6ea] rounded-lg">
                    <CheckCircle className="w-5 h-5 text-[#1b5e20]" />
                    <div>
                      <p className="font-medium text-[#ecf7e7]">Sécurité SSL</p>
                      <p className="text-sm text-[#1b5e20]">Toutes les transactions sont cryptées avec SSL 256-bit</p>
                    </div>
                  </div>

                  <button
                    onClick={testStripeConnection}
                    className="bg-[#1b5e20] text-white px-4 py-2 rounded-lg hover:bg-[#1b5e20] transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tester la connexion Stripe
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mobile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Mobile Money</h3>
                  <p className="text-sm text-gray-600">Acceptez les paiements par téléphone portable</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.mobileMoneyEnabled}
                    onChange={(e) => handleSettingChange('mobileMoneyEnabled', e.target.checked)}
                    disabled={!isEditing}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1b5e20]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b5e20]"></div>
                </label>
              </div>

              {settings.mobileMoneyEnabled && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 bg-[#eef6ea] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center text-white font-bold text-sm">O</div>
                        <div>
                          <p className="font-medium text-gray-900">Orange Money</p>
                          <p className="text-xs text-gray-600">Opérateur Orange</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.orangeMoneyEnabled}
                          onChange={(e) => handleSettingChange('orangeMoneyEnabled', e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1b5e20]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b5e20]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#fff4d6] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#fff4d6] rounded-full flex items-center justify-center text-white font-bold text-sm">M</div>
                        <div>
                          <p className="font-medium text-gray-900">MTN Money</p>
                          <p className="text-xs text-gray-600">Opérateur MTN</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.mtnMoneyEnabled}
                          onChange={(e) => handleSettingChange('mtnMoneyEnabled', e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1b5e20]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b5e20]"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#eef6ea] rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1b5e20] rounded-full flex items-center justify-center text-white font-bold text-sm">M</div>
                        <div>
                          <p className="font-medium text-gray-900">Moov Money</p>
                          <p className="text-xs text-gray-600">Opérateur Moov</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.moovMoneyEnabled}
                          onChange={(e) => handleSettingChange('moovMoneyEnabled', e.target.checked)}
                          disabled={!isEditing}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#1b5e20]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1b5e20]"></div>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-[#eef6ea] rounded-lg">
                    <Shield className="w-5 h-5 text-[#1b5e20]" />
                    <div>
                      <p className="font-medium text-[#ecf7e7]">Sécurité renforcée</p>
                      <p className="text-sm text-[#1b5e20]">Les paiements Mobile Money sont protégés par double authentification</p>
                    </div>
                  </div>

                  <button
                    onClick={testMobileMoneyConnection}
                    className="bg-[#1b5e20] text-white px-4 py-2 rounded-lg hover:bg-[#1b5e20] transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Tester la connexion Mobile Money
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux de Commission (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={settings.commissionRate}
                    onChange={(e) => handleSettingChange('commissionRate', parseFloat(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Commission prélevée sur chaque vente</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paiement Programmé
                  </label>
                  <select
                    value={settings.payoutSchedule}
                    onChange={(e) => handleSettingChange('payoutSchedule', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="daily">Quotidien</option>
                    <option value="weekly">Hebdomadaire</option>
                    <option value="monthly">Mensuel</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Fréquence des versements sur votre compte</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Montant Minimum de Paiement (XOF)
                  </label>
                  <input
                    type="number"
                    min="5000"
                    step="1000"
                    value={settings.minimumPayout}
                    onChange={(e) => handleSettingChange('minimumPayout', parseInt(e.target.value))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1b5e20]/30 focus:border-transparent disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Montant minimum avant versement</p>
                </div>
              </div>

              <div className="p-4 bg-[#fff4d6] rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#8f4b00]" />
                  <div>
                    <p className="font-medium text-[#8f4b00]">Informations importantes</p>
                    <ul className="text-sm text-[#8f4b00] mt-2 space-y-1">
                      <li>• Les commissions sont prélevées automatiquement sur chaque vente</li>
                      <li>• Les paiements sont sécurisés et conformes PCI DSS</li>
                      <li>• Les fonds sont transférés selon la fréquence choisie</li>
                      <li>• Des frais de transaction peuvent s'appliquer selon l'opérateur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEditing && (
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-[#1b5e20] text-white rounded-lg hover:bg-[#1b5e20] transition-colors flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Résumé des paramètres */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Résumé de votre configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#1b5e20]">{settings.commissionRate}%</div>
            <div className="text-sm text-gray-600">Commission</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#1b5e20]">
              {(settings.stripeEnabled ? 1 : 0) + (settings.mobileMoneyEnabled ? 1 : 0)}
            </div>
            <div className="text-sm text-gray-600">Méthodes actives</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-[#1b5e20]">
              {settings.minimumPayout.toLocaleString('fr-FR')} XOF
            </div>
            <div className="text-sm text-gray-600">Minimum de paiement</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPaymentSettings;