import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ImageUpload from './ImageUpload';
import { supabase } from '../config/supabase';

const STORAGE_KEY = 'demo_products';

const normalize = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const slugify = (value) => normalize(value)
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const readProductsMap = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
};

const writeProductsMap = (next) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('demo_products_updated'));
};

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());

const readBool = (value) => {
  const v = String(value ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
};

const getHostMeta = () => {
  try {
    const host = String(window.location.hostname || '');
    const isDevHost = host === 'localhost'
      || host === '127.0.0.1'
      || host.startsWith('192.168.')
      || host.startsWith('10.')
      || host.startsWith('172.');

    return { isDevHost };
  } catch {
    return { isDevHost: false };
  }
};

const fetchJson = async (url, { timeoutMs = 7000, ...init } = {}) => {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const json = await res.json().catch(() => null);
    return { res, json };
  } finally {
    window.clearTimeout(t);
  }
};

const categoryOptions = [
  { key: 'general', label: 'Général', slug: 'general' },
  { key: 'food', label: 'Alimentation', slug: 'alimentation' },
  { key: 'tech', label: 'Technologie', slug: 'technologie' },
  { key: 'telephony', label: 'Téléphonie', slug: 'telephonie' },
  { key: 'fashion', label: 'Mode', slug: 'mode' },
  { key: 'beauty', label: 'Beauté', slug: 'beaute' },
  { key: 'home', label: 'Maison', slug: 'maison' },
  { key: 'services', label: 'Services', slug: 'services' }
];

const VendorProductManager = ({ shops = [], defaultShopSlug = '' }) => {
  const [selectedShopSlug, setSelectedShopSlug] = useState(defaultShopSlug || (shops[0]?.slug || ''));
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [authError, setAuthError] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [form, setForm] = useState({
    name: '',
    short_description: '',
    description: '',
    price: '',
    featured: false,
    categoryKey: 'general',
    stock: 10,
    images: []
  });

  useEffect(() => {
    if (!selectedShopSlug && shops[0]?.slug) {
      setSelectedShopSlug(shops[0].slug);
    }
  }, [selectedShopSlug, shops]);

  useEffect(() => {
    if (!shops.length) return
    const current = String(selectedShopSlug || '').trim()
    const exists = current ? shops.some((s) => String(s?.slug || '').trim() === current) : false
    if (exists) return
    const next = String(defaultShopSlug || '').trim() || String(shops[0]?.slug || '').trim()
    if (next) setSelectedShopSlug(next)
  }, [defaultShopSlug, selectedShopSlug, shops]);

  const loadProducts = useCallback(async (slug) => {
    try {
      const { res, json } = await fetchJson(`/api/shops/slug/${encodeURIComponent(String(slug || '').trim())}/products`, {
        method: 'GET',
        timeoutMs: 7000,
      });
      if (res.ok && json?.success && Array.isArray(json?.products)) {
        const list = json.products;
        setProducts(list);
        try {
          const map = readProductsMap();
          const next = { ...map, [slug]: list };
          writeProductsMap(next);
        } catch {
        }
        return;
      }
    } catch {
    }

    const map = readProductsMap();
    const list = Array.isArray(map?.[slug]) ? map[slug] : [];
    setProducts(list);
  }, []);

  useEffect(() => {
    if (!selectedShopSlug) return;
    void loadProducts(selectedShopSlug);
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) void loadProducts(selectedShopSlug);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [loadProducts, selectedShopSlug]);

  const selectedShop = useMemo(
    () => shops.find((s) => s?.slug === selectedShopSlug) || null,
    [shops, selectedShopSlug]
  );

  const categoryMeta = useCallback((categoryKey) => {
    return categoryOptions.find((c) => c.key === categoryKey) || categoryOptions[0];
  }, []);

  const visibleProducts = useMemo(() => {
    const term = normalize(searchTerm).trim();
    if (!term) return products;
    return products.filter((p) => normalize(p?.name).includes(term) || normalize(p?.slug).includes(term));
  }, [products, searchTerm]);

  const persist = useCallback((nextList) => {
    try {
      const map = readProductsMap();
      const next = { ...map, [selectedShopSlug]: nextList };
      writeProductsMap(next);
      setProducts(nextList);
    } catch {
      setProducts(nextList);
    }
  }, [selectedShopSlug]);

  const getAuthHeaders = useCallback(async () => {
    const { isDevHost } = getHostMeta();
    if (isDevHost) return {};
    const { data } = await supabase.auth.getSession();
    const token = String(data?.session?.access_token || '');
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const requireAuthWrites = useMemo(() => {
    const { isDevHost } = getHostMeta();
    if (isDevHost) return false;
    return readBool(import.meta.env.VITE_PRODUCTS_STRICT_AUTH);
  }, []);

  const localOnlyCount = useMemo(() => {
    try {
      const slug = String(selectedShopSlug || '').trim();
      if (!slug) return 0;
      const map = readProductsMap();
      const list = Array.isArray(map?.[slug]) ? map[slug] : [];
      return list.filter((p) => !isUuid(p?.id)).length;
    } catch {
      return 0;
    }
  }, [selectedShopSlug]);

  const refreshSession = useCallback(async () => {
    const { isDevHost } = getHostMeta();
    if (isDevHost) {
      setSessionReady(true);
      setHasSession(true);
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const token = String(data?.session?.access_token || '');
      setHasSession(Boolean(token));
    } catch {
      setHasSession(false);
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    const { data } = supabase.auth.onAuthStateChange(() => {
      void refreshSession();
    });
    return () => {
      try { data?.subscription?.unsubscribe?.(); } catch { }
    };
  }, [refreshSession]);

  const importLocalProducts = useCallback(() => {
    const run = async () => {
      setImportResult('');
      setAuthError('');
      setImportBusy(true);
      try {
        const slug = String(selectedShopSlug || '').trim();
        if (!slug) {
          setImportResult('Boutique manquante.');
          return;
        }

        const authHeaders = await getAuthHeaders();
        if (!authHeaders) {
          setAuthError('Connexion requise pour importer les produits dans Supabase.');
          return;
        }

        const map = readProductsMap();
        const list = Array.isArray(map?.[slug]) ? map[slug] : [];
        const toImport = list.filter((p) => !isUuid(p?.id));
        if (!toImport.length) {
          setImportResult('Aucun produit local à importer.');
          return;
        }

        let ok = 0;
        let fail = 0;
        for (const p of toImport) {
          try {
            const stock = Number(p?.variants?.[0]?.inventory_quantity ?? 0);
            const payload = {
              ...p,
              stock: Number.isFinite(stock) ? stock : 0,
            };
            const { res, json } = await fetchJson(`/api/shops/slug/${encodeURIComponent(slug)}/products/upsert`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
              },
              body: JSON.stringify({ product: payload }),
              timeoutMs: 20000,
            });
            if (res.ok && json?.success && json?.product?.id) ok += 1;
            else fail += 1;
          } catch {
            fail += 1;
          }
        }

        await loadProducts(slug);
        setImportResult(`Import terminé: ${ok} OK, ${fail} échec(s).`);
      } finally {
        setImportBusy(false);
      }
    };
    void run();
  }, [getAuthHeaders, loadProducts, selectedShopSlug]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setForm({
      name: '',
      short_description: '',
      description: '',
      price: '',
      featured: false,
      categoryKey: selectedShop?.category || 'general',
      stock: 10,
      images: []
    });
  }, [selectedShop?.category]);

  const openCreate = useCallback(() => {
    resetForm();
    setShowForm(true);
  }, [resetForm]);

  const openEdit = useCallback((product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || '',
      short_description: product.short_description || '',
      description: product.description || '',
      price: String(product.price ?? ''),
      featured: Boolean(product.featured),
      categoryKey: categoryOptions.find((c) => c.label === product?.category?.name)?.key || 'general',
      stock: Number(product?.variants?.[0]?.inventory_quantity ?? 0),
      images: (product.images || []).map((img) => ({
        id: Date.now() + Math.random(),
        preview: img.url,
        name: img.alt_text || 'Image'
      }))
    });
    setShowForm(true);
  }, []);

  const removeProduct = useCallback((productId) => {
    const run = async () => {
      const shouldAttemptApi = isUuid(productId);

      if (shouldAttemptApi && selectedShopSlug) {
        try {
          const authHeaders = await getAuthHeaders();
          if (authHeaders) {
            const { res, json } = await fetchJson(`/api/shops/slug/${encodeURIComponent(String(selectedShopSlug || '').trim())}/products/${encodeURIComponent(String(productId || '').trim())}`, {
              method: 'DELETE',
              headers: {
                ...authHeaders,
              },
              timeoutMs: 9000,
            });
            if (res.ok && json?.success) {
              const nextList = products.filter((p) => p.id !== productId);
              persist(nextList);
              return;
            }
          }
        } catch {
        }
      }

      if (requireAuthWrites) {
        setAuthError('Connexion requise pour modifier les produits.');
        return;
      }

      const nextList = products.filter((p) => p.id !== productId);
      persist(nextList);
    };
    void run();
  }, [getAuthHeaders, persist, products, requireAuthWrites, selectedShopSlug]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!selectedShopSlug) return;

    const meta = categoryMeta(form.categoryKey);
    const id = editingId || `p-${Date.now()}`;
    const slug = slugify(form.name) || `produit-${Date.now()}`;
    const priceValue = Number(String(form.price).replace(',', '.'));
    const safePrice = Number.isFinite(priceValue) ? priceValue : 0;
    const images = (form.images || []).slice(0, 5).map((img) => ({
      url: img.preview,
      alt_text: img.name || form.name
    }));

    const nextProduct = {
      id,
      name: form.name,
      slug,
      description: form.description || form.short_description,
      short_description: form.short_description || form.description,
      price: safePrice,
      status: 'active',
      featured: Boolean(form.featured),
      images: images.length ? images : [{ url: '', alt_text: form.name }],
      category: { name: meta.label, slug: meta.slug },
      average_rating: 4.5,
      review_count: 0,
      sales_count: 0,
      variants: [{ inventory_quantity: Number(form.stock) || 0 }]
    };

    const run = async () => {
      try {
        const authHeaders = await getAuthHeaders();
        if (authHeaders) {
          const { res, json } = await fetchJson(`/api/shops/slug/${encodeURIComponent(String(selectedShopSlug || '').trim())}/products/upsert`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify({
              product: {
                ...nextProduct,
                stock: Number(form.stock) || 0,
              }
            }),
            timeoutMs: 12000,
          });
          if (res.ok && json?.success && json?.product?.id) {
            const saved = json.product;
            const nextList = [
              saved,
              ...products.filter((p) => p.id !== editingId && p.id !== saved.id),
            ];
            persist(nextList);
            setShowForm(false);
            resetForm();
            return;
          }
        }
      } catch {
      }

      if (requireAuthWrites) {
        setAuthError('Connexion requise pour enregistrer les produits dans Supabase.');
        return;
      }

      const nextList = editingId
        ? products.map((p) => (p.id === editingId ? nextProduct : p))
        : [nextProduct, ...products];

      persist(nextList);
      setShowForm(false);
      resetForm();
    };
    void run();
  }, [categoryMeta, editingId, form, getAuthHeaders, persist, products, requireAuthWrites, resetForm, selectedShopSlug]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
        <div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">Produits</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedShop ? `Boutique: ${selectedShop.name}` : 'Sélectionnez une boutique'} • {products.length} produit(s)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={selectedShopSlug}
            onChange={(e) => setSelectedShopSlug(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
          >
            {shops.map((s) => (
              <option key={s.slug} value={s.slug}>{s.name}</option>
            ))}
          </select>
          {sessionReady && hasSession && localOnlyCount > 0 && (
            <button
              type="button"
              onClick={importLocalProducts}
              disabled={!selectedShopSlug || importBusy}
              className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white"
            >
              {importBusy ? 'Import…' : `Importer (${localOnlyCount})`}
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            disabled={!selectedShopSlug}
            className="bg-[#1b5e20] text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            Ajouter un produit
          </button>
        </div>
      </div>

      {(authError || importResult) && (
        <div className="max-w-2xl space-y-2">
          {authError && (
            <div className="px-4 py-3 rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 text-sm">
              {authError}
            </div>
          )}
          {importResult && (
            <div className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              {importResult}
            </div>
          )}
        </div>
      )}

      <div className="max-w-2xl">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
          <span className="text-gray-500">🔎</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un produit"
            className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-gray-500"
          />
          {searchTerm.trim() && (
            <button type="button" onClick={() => setSearchTerm('')} className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white">
              Effacer
            </button>
          )}
        </div>
      </div>

      {visibleProducts.length === 0 ? (
        <div className="border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center bg-white dark:bg-gray-800">
          <div className="text-4xl mb-2">&#128230;</div>
          <div className="font-semibold text-gray-900 dark:text-white">Aucun produit</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ajoutez votre premier produit pour l’afficher sur la page boutique.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleProducts.map((p) => (
            <div key={p.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800">
              <div className="h-14" style={{ background: `linear-gradient(90deg, ${selectedShop?.primaryColor || '#F97316'}, ${selectedShop?.secondaryColor || '#10B981'})` }} />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{p.slug}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{Number(p.price || 0).toFixed(2)} €</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Stock: {p?.variants?.[0]?.inventory_quantity ?? 0}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{p?.category?.name || 'Général'}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEdit(p)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 text-gray-800 dark:text-white">
                      Modifier
                    </button>
                    <button type="button" onClick={() => removeProduct(p.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700">
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <div className="font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Modifier le produit' : 'Ajouter un produit'}
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Résumé *</label>
                  <input
                    value={form.short_description}
                    onChange={(e) => setForm((prev) => ({ ...prev, short_description: e.target.value }))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Prix (€) *</label>
                    <input
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      required
                      inputMode="decimal"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Stock</label>
                    <input
                      type="number"
                      value={form.stock}
                      min={0}
                      onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
                  <select
                    value={form.categoryKey}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoryKey: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    {categoryOptions.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) => setForm((prev) => ({ ...prev, featured: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">Produit vedette</label>
                </div>

                <div>
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Images</div>
                  <ImageUpload maxImages={5} existingImages={form.images} onImagesChange={(images) => setForm((prev) => ({ ...prev, images }))} />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1b5e20] text-white"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProductManager;

