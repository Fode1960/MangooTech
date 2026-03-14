import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ImageUpload from './ImageUpload';

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

  const loadProducts = useCallback((slug) => {
    const map = readProductsMap();
    const list = Array.isArray(map?.[slug]) ? map[slug] : [];
    setProducts(list);
  }, []);

  useEffect(() => {
    if (!selectedShopSlug) return;
    loadProducts(selectedShopSlug);
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) loadProducts(selectedShopSlug);
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
    const nextList = products.filter((p) => p.id !== productId);
    persist(nextList);
  }, [persist, products]);

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

    const nextList = editingId
      ? products.map((p) => (p.id === editingId ? nextProduct : p))
      : [nextProduct, ...products];

    persist(nextList);
    setShowForm(false);
    resetForm();
  }, [categoryMeta, editingId, form, persist, products, resetForm, selectedShopSlug]);

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
          <button
            type="button"
            onClick={openCreate}
            disabled={!selectedShopSlug}
            className="bg-gradient-to-r from-orange-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          >
            Ajouter un produit
          </button>
        </div>
      </div>

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
          <div className="text-4xl mb-2">📦</div>
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
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-green-600 text-white"
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

