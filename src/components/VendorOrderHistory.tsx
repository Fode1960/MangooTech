import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  MapPin,
  Package,
  Search,
  Star,
  Truck,
  User,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import VendorClientInvoiceModal, { type VendorOrder } from './invoice/VendorClientInvoiceModal';

interface OrderItem {
  name: string;
  qty?: number;
  quantity?: number;
  unitPriceCents?: number;
  total?: number;
  price?: number;
}

interface Order {
  id: string;
  sourceOrderId?: string;
  customerId?: string | null;
  customerName: string;
  customerEmail?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  items: OrderItem[];
  totalCents?: number;
  currency?: string;
  status: string;
  createdAt: string;
  payment?: { provider?: string } | null;
  vendorId?: string | null;
  vendorKind?: string | null;
  vendorName?: string | null;
  vendorOwnerEmail?: string | null;
  shopSlug?: string | null;
}

interface VendorOrderHistoryProps {
  vendorId: string;
}

const VENDOR_ORDERS_KEY = 'mangoo_vendor_orders_v1';

function readJson(key: string): any {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function normalizeSlug(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function normalizeVendorId(value: unknown): string {
  return normalizeText(value).replace(/^shop:/i, '').replace(/^provider:/i, '').replace(/^shop-/i, '');
}

function readVendorOrdersMap(): Record<string, Order[]> {
  const data = readJson(VENDOR_ORDERS_KEY);
  return data && typeof data === 'object' ? data : {};
}

function readShopDirectory(): any[] {
  const demo = readJson('demo_shops');
  const cache = readJson('mangoo_shops_directory_cache_v1');
  return [
    ...(Array.isArray(demo) ? demo : []),
    ...(Array.isArray(cache?.shops) ? cache.shops : []),
  ].filter((entry) => entry && typeof entry === 'object');
}

function readVendorDirectory(): any[] {
  const legacy = readJson('mangoo_vendors');
  const custom = readJson('mangoo_custom_vendors');
  return [
    ...(Array.isArray(legacy) ? legacy : []),
    ...(Array.isArray(custom) ? custom : []),
  ].filter((entry) => entry && typeof entry === 'object');
}

function resolveOwnedVendorKeys(vendorIdProp: string): string[] {
  const keys = new Set<string>();
  const normalizedVendorId = normalizeVendorId(vendorIdProp);
  const currentUser = readJson('mangoo-current-user') || readJson('user') || null;
  const email = normalizeText(currentUser?.email).toLowerCase();
  const editShopSlug = normalizeSlug(localStorage.getItem('mangoo-vendor-edit-shop-slug') || '');

  if (normalizedVendorId && normalizedVendorId !== 'vendor-demo') keys.add(`vendor:${normalizedVendorId}`);
  if (editShopSlug) keys.add(`shop:${editShopSlug}`);
  if (email) keys.add(`email:${email}`);

  const shops = readShopDirectory();
  shops.forEach((shop) => {
    const ownerEmail = normalizeText(shop?.ownerEmail || shop?.owner_email || shop?.email).toLowerCase();
    if (!email || ownerEmail !== email) return;
    const slug = normalizeSlug(shop?.slug);
    const sourceVendorId = normalizeVendorId(shop?.sourceVendorId || shop?.source_vendor_id || shop?.vendorId || shop?.vendor_id || shop?.id);
    if (slug) keys.add(`shop:${slug}`);
    if (sourceVendorId) keys.add(`vendor:${sourceVendorId}`);
  });

  const vendors = readVendorDirectory();
  vendors.forEach((vendor) => {
    const ownerEmail = normalizeText(vendor?.ownerEmail || vendor?.owner_email || vendor?.email).toLowerCase();
    if (!email || ownerEmail !== email) return;
    const id = normalizeVendorId(vendor?.id || vendor?.vendorId || vendor?.vendor_id);
    if (id) keys.add(`vendor:${id}`);
  });

  return Array.from(keys);
}

function orderAmount(order: Order): number {
  const cents = Number(order?.totalCents || 0) || 0;
  if (cents > 0) return Math.round(cents / 100);
  return (Array.isArray(order?.items) ? order.items : []).reduce((sum, item) => {
    const qty = Number(item?.qty || item?.quantity || 0) || 0;
    const centsValue = Number(item?.unitPriceCents || 0) || 0;
    const total = Number(item?.total || 0) || 0;
    const price = Number(item?.price || 0) || 0;
    if (centsValue > 0 && qty > 0) return sum + Math.round((centsValue * qty) / 100);
    if (total > 0) return sum + total;
    if (price > 0 && qty > 0) return sum + price * qty;
    return sum;
  }, 0);
}

function buildInvoiceOrder(order: Order): VendorOrder {
  return {
    id: order.id,
    customerName: order.customerName,
    customerPhone: String(order.customerPhone || ''),
    customerAddress: String(order.customerAddress || ''),
    items: (Array.isArray(order.items) ? order.items : []).map((item) => {
      const quantity = Number(item?.qty || item?.quantity || 0) || 0;
      const total = Number(item?.total || 0) || 0;
      const unit = Number(item?.unitPriceCents || 0) > 0
        ? Math.round((Number(item?.unitPriceCents || 0) || 0) / 100)
        : (Number(item?.price || 0) || 0);
      return {
        name: String(item?.name || 'Article'),
        quantity,
        price: unit,
        total: total > 0 ? total : unit * quantity,
      };
    }),
    totalAmount: orderAmount(order),
    status: order.status,
    orderDate: order.createdAt,
    paymentMethod: String(order?.payment?.provider || 'Paiement confirmé'),
    notes: order.vendorName ? `Boutique: ${order.vendorName}` : undefined,
  };
}

export default function VendorOrderHistory({ vendorId }: VendorOrderHistoryProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<VendorOrder | null>(null);

  useEffect(() => {
    const load = () => {
      setLoading(true);
      try {
        const keys = resolveOwnedVendorKeys(vendorId);
        const map = readVendorOrdersMap();
        const merged = new Map<string, Order>();
        keys.forEach((key) => {
          const list = Array.isArray(map[key]) ? map[key] : [];
          list.forEach((order) => {
            const id = String(order?.id || '').trim();
            if (!id) return;
            merged.set(id, order);
          });
        });
        const list = Array.from(merged.values()).sort((a, b) => Date.parse(String(b?.createdAt || '')) - Date.parse(String(a?.createdAt || '')));
        setOrders(list);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    const onStorage = () => load();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onStorage);
    };
  }, [vendorId]);

  const deliveryMap = useMemo(() => {
    const data = readJson('mangoo-delivery-by-order');
    return data && typeof data === 'object' ? data : {};
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const hay = [
        order.id,
        order.customerName,
        order.customerAddress,
        order.vendorName,
        ...(Array.isArray(order.items) ? order.items.map((item) => String(item?.name || '')) : []),
      ].join(' ').toLowerCase();
      return hay.includes(term);
    });
  }, [orders, searchTerm]);

  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, order) => sum + orderAmount(order), 0), [filteredOrders]);

  const handleLaunchDelivery = (order: Order) => {
    const sourceOrderId = String(order?.sourceOrderId || order?.id || '').trim();
    if (!sourceOrderId) return;
    const payload = {
      createdAt: new Date().toISOString(),
      triggeredBy: 'vendor-formel',
      order: {
        ...order,
        id: sourceOrderId,
      },
      user: {
        id: String(order?.customerId || order?.customerEmail || `client_${sourceOrderId}`),
        email: String(order?.customerEmail || ''),
        name: String(order?.customerName || 'Client'),
        phone: String(order?.customerPhone || ''),
        address: String(order?.customerAddress || ''),
        role: 'client',
      },
    };
    try {
      localStorage.setItem('mangoo-delivery-source-order', JSON.stringify(payload));
    } catch {
    }
    navigate(`/checkout/livraison?src=vendor_formel&orderId=${encodeURIComponent(sourceOrderId)}`);
  };

  const getStatusColor = (status: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'paid':
        return <DollarSign className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-20 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Commandes clients</h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            {filteredOrders.length} commande(s) • {totalRevenue.toLocaleString('fr-FR')} FCFA
          </p>
        </div>
        <div className={`px-3 py-2 rounded-lg text-sm font-black ${isDark ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-100 text-emerald-800'}`}>
          Secteur formel : le vendeur lance la livraison
        </div>
      </div>

      <div className="relative">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        <input
          type="text"
          placeholder="Rechercher une commande client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-10 pr-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
        />
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const sourceOrderId = String(order?.sourceOrderId || order?.id || '');
          const deliveryEntry = deliveryMap?.[sourceOrderId] || null;
          const deliveryLaunched = Boolean(deliveryEntry?.courierOrderId);
          return (
            <div key={order.id} className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2 gap-4">
                    <div className="flex items-center space-x-3 flex-wrap">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.id}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{String(order.status || '').replace('_', ' ')}</span>
                      </span>
                      {deliveryLaunched && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800 border border-orange-200">
                          ?? Livraison lancée
                        </span>
                      )}
                    </div>
                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {orderAmount(order).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <User className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{order.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{order.customerAddress || 'Adresse client à compléter'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{String(order?.payment?.provider || 'Paiement confirmé')}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Commande : {new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{order.items.length} article(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Articles :</p>
                    <div className="space-y-1">
                      {order.items.map((item, index) => {
                        const quantity = Number(item?.qty || item?.quantity || 0) || 0;
                        const unit = Number(item?.unitPriceCents || 0) > 0 ? Math.round((Number(item?.unitPriceCents || 0) || 0) / 100) : (Number(item?.price || 0) || 0);
                        return (
                          <div key={`${order.id}-${index}`} className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {quantity}x {String(item?.name || 'Article')} - {unit.toLocaleString('fr-FR')} FCFA
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end gap-2">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/30' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span>Détails</span>
                  </button>
                  <button
                    onClick={() => setInvoiceOrder(buildInvoiceOrder(order))}
                    className={`${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-900'} px-4 py-2 rounded-xl font-black transition-colors`}
                  >
                    ?? Facture
                  </button>
                  <button
                    onClick={() => handleLaunchDelivery(order)}
                    disabled={deliveryLaunched}
                    className={deliveryLaunched
                      ? `${isDark ? 'bg-white/5 border border-white/10 text-gray-400' : 'bg-white border border-gray-200 text-gray-400'} px-4 py-2 rounded-xl font-black opacity-70 cursor-not-allowed`
                      : 'px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white font-black hover:from-orange-600 hover:to-green-700 transition-all'
                    }
                    title={deliveryLaunched ? 'La livraison a déjà été lancée pour cette commande' : 'Déclencher la livraison une fois le colis prêt'}
                  >
                    {deliveryLaunched ? '? Livraison lancée' : '?? Colis prêt -> Lancer la livraison'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredOrders.length === 0 && (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune commande vendeur trouvée</p>
            <p className="text-sm mt-2">Les commandes payées apparaissent ici pour lancer la livraison côté vendeur.</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Détails de la commande {selectedOrder.id}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`text-2xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  ?
                </button>
              </div>

              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Informations client</h4>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Nom :</strong> {selectedOrder.customerName}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Téléphone :</strong> {selectedOrder.customerPhone || '—'}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Adresse :</strong> {selectedOrder.customerAddress || '—'}</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Détails</h4>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Date :</strong> {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Statut :</strong> {selectedOrder.status}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Paiement :</strong> {String(selectedOrder?.payment?.provider || 'Paiement confirmé')}</p>
                  <p className={isDark ? 'text-gray-300' : 'text-gray-700'}><strong>Total :</strong> {orderAmount(selectedOrder).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Articles</h4>
                  {selectedOrder.items.map((item, index) => {
                    const quantity = Number(item?.qty || item?.quantity || 0) || 0;
                    const unit = Number(item?.unitPriceCents || 0) > 0 ? Math.round((Number(item?.unitPriceCents || 0) || 0) / 100) : (Number(item?.price || 0) || 0);
                    return (
                      <div key={index} className={`flex justify-between items-center py-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <span>{quantity}x {String(item?.name || 'Article')}</span>
                        <span>{(unit * quantity).toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setInvoiceOrder(buildInvoiceOrder(selectedOrder))}
                  className="px-4 py-2 rounded-lg font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  ?? Émettre facture
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-600 text-white hover:bg-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <VendorClientInvoiceModal
        open={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        isDark={isDark}
        vendorLabel={String(vendorId || 'Vendeur')}
        order={invoiceOrder}
      />
    </div>
  );
}
