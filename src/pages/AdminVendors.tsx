import { useCallback, useEffect, useMemo, useState } from "react";
import { ExternalLink, RefreshCw, Search, ShoppingBag } from "lucide-react";
import { buildApiUrl } from "../config/api";
import { supabase } from "../config/supabase";
import { useTheme } from "../hooks/useTheme";

type VendorSector = "formal" | "informal";
type VendorStatus = "all" | "approved" | "pending" | "rejected";

type AdminVendorRecord = {
  id: string;
  email: string | null;
  name: string;
  shop_name: string;
  shop_slug: string | null;
  sector: VendorSector;
  source: "supabase" | "local-sync";
  status: string | null;
  created_at: string | null;
  phone: string | null;
  user_id: string | null;
};

type VendorCounts = {
  total: number;
  formal: number;
  informal: number;
  approved: number;
  pending: number;
};

type AdminVendorsProps = {
  embedded?: boolean;
};

const formatDate = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
};

const formatStatus = (value: string | null | undefined) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved") return "Approuve";
  if (normalized === "rejected") return "Refuse";
  if (normalized === "suspended") return "Suspendu";
  return "En attente";
};

const statusBadgeClass = (status: string | null | undefined, isDark: boolean) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved") return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
  if (normalized === "rejected") return isDark ? "bg-red-900/30 text-red-200" : "bg-red-50 text-red-700";
  if (normalized === "suspended") return isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700";
  return isDark ? "bg-[#8f4b00]/30 text-[#ffe082]" : "bg-[#ffe082]/50 text-[#8f4b00]";
};

const sectorBadgeClass = (sector: VendorSector, isDark: boolean) => {
  if (sector === "informal") return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
  return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
};

export default function AdminVendors({ embedded = false }: AdminVendorsProps) {
  const { isDark } = useTheme();
  const isDev = Boolean(import.meta.env.DEV);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<"all" | VendorSector>("all");
  const [status, setStatus] = useState<VendorStatus>("all");
  const [vendors, setVendors] = useState<AdminVendorRecord[]>([]);
  const [counts, setCounts] = useState<VendorCounts>({ total: 0, formal: 0, informal: 0, approved: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    "Vue active: vendeurs relies aux boutiques, separes entre secteur formel et secteur informel."
  );

  const applySearch = useCallback(() => {
    setQuery(search.trim());
  }, [search]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setQuery("");
    setSector("all");
    setStatus("all");
  }, []);

  const applySectorFilter = useCallback((nextSector: "all" | VendorSector) => {
    setSector(nextSector);
    setStatus("all");
  }, []);

  const getAdminToken = useCallback(async () => {
    if (isDev) return "demo-admin";
    try {
      const demo = localStorage.getItem("admin-demo-user");
      if (demo) return "demo-admin";
    } catch {
    }
    try {
      const raw = localStorage.getItem("mangoo-current-user");
      const user = raw ? JSON.parse(raw) : null;
      if (String(user?.role || "").trim().toLowerCase() === "admin") return "demo-admin";
    } catch {
    }
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }, [isDev]);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Connectez-vous avec un compte admin pour afficher les vendeurs.");

      const qs = new URLSearchParams();
      if (query.trim()) qs.set("search", query.trim());
      if (sector !== "all") qs.set("sector", sector);
      if (status !== "all") qs.set("status", status);

      const response = await fetch(buildApiUrl(`/api/admin/accounts/vendors?${qs.toString()}`), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `HTTP ${response.status}`);
      }

      const nextVendors = Array.isArray(payload?.vendors) ? payload.vendors : [];
      const nextCounts = payload?.counts || {};
      const formalAvailable = payload?.sources?.formal !== false;
      const formalError = String(payload?.sources?.formal_error || "").trim();

      setVendors(nextVendors);
      setCounts({
        total: Number(nextCounts.total || 0),
        formal: Number(nextCounts.formal || 0),
        informal: Number(nextCounts.informal || 0),
        approved: Number(nextCounts.approved || 0),
        pending: Number(nextCounts.pending || 0),
      });
      setNotice(
        formalAvailable
          ? "Vue active: vendeurs relies aux boutiques, avec distinction claire entre formel et informel."
          : `Vue partielle: secteur informel charge, secteur formel indisponible pour le moment.${formalError ? ` ${formalError}` : ""}`
      );
    } catch (err: any) {
      setVendors([]);
      setCounts({ total: 0, formal: 0, informal: 0, approved: 0, pending: 0 });
      setError(err?.message || "Erreur lors du chargement des vendeurs.");
    } finally {
      setLoading(false);
    }
  }, [getAdminToken, query, sector, status]);

  useEffect(() => {
    void loadVendors();
  }, [loadVendors]);

  const visibleVendors = useMemo(() => vendors, [vendors]);

  return (
    <div className={`${embedded ? "space-y-6" : `p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}`}>
      <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl border p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Vendeurs</h2>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                Personnes reliees aux boutiques, utiles pour l'ouverture, l'acces vendeur et le suivi admin.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applySectorFilter("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${sector === "all" ? "bg-[#1b5e20] text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"}`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => applySectorFilter("formal")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${sector === "formal" ? "bg-[#1b5e20] text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-[#f6faf3] text-[#1b5e20]"}`}
              >
                Formel
              </button>
              <button
                type="button"
                onClick={() => applySectorFilter("informal")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${sector === "informal" ? "bg-[#1b5e20] text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-[#f6faf3] text-[#1b5e20]"}`}
              >
                Informel
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <Search className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <input
                value={search}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setSearch(nextValue);
                  if (!nextValue.trim()) setQuery("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applySearch();
                }}
                placeholder="Nom, boutique ou email"
                className={`w-full bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"}`}
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as VendorStatus)}
              className={`rounded-xl border px-3 py-2 text-sm ${isDark ? "border-gray-700 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900"}`}
            >
              <option value="all">Tous statuts</option>
              <option value="approved">Approuves</option>
              <option value="pending">En attente</option>
              <option value="rejected">Refuses</option>
            </select>
            <button
              type="button"
              onClick={applySearch}
              className="rounded-xl bg-[#1b5e20] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16381a]"
            >
              Chercher
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-gray-700 text-gray-100 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Reinitialiser
            </button>
            <button
              type="button"
              onClick={() => void loadVendors()}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${isDark ? "bg-gray-900 text-gray-100 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Rafraichir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total</div>
          <div className={`mt-1 text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{counts.total}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Formel</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.formal}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Informel</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.informal}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Approuves</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.approved}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>En attente</div>
          <div className="mt-1 text-lg font-bold text-[#8f4b00]">{counts.pending}</div>
        </div>
      </div>

      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-red-800 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {notice && !error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-[#8f4b00] bg-[#8f4b00]/20 text-[#ffe082]" : "border-[#ffe082] bg-[#ffe082]/50 text-[#8f4b00]"}`}>
          {notice}
          {(query || sector !== "all" || status !== "all") && (
            <span className="ml-2">
              Filtres actifs:
              {query ? ` recherche "${query}"` : ""}
              {sector !== "all" ? `${query ? "," : ""} secteur ${sector === "formal" ? "formel" : "informel"}` : ""}
              {status !== "all" ? `${query || sector !== "all" ? "," : ""} statut ${status}` : ""}
              .
            </span>
          )}
        </div>
      )}

      <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className={`grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_130px_130px_120px_90px] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide ${isDark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
          <div>Vendeur</div>
          <div>Boutique</div>
          <div>Secteur</div>
          <div>Statut</div>
          <div>Depuis</div>
          <div>Acces</div>
        </div>

        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Chargement des vendeurs...</div>
        ) : visibleVendors.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Aucun vendeur a afficher.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibleVendors.map((vendor) => (
              <div key={`${vendor.source}:${vendor.id}`} className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_130px_130px_120px_90px] gap-4 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-gray-700 text-[#ecf7e7]" : "bg-[#eef6ea] text-[#1b5e20]"}`}>
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{vendor.name || "Vendeur"}</div>
                    <div className={`truncate text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{vendor.email || vendor.phone || "Sans email"}</div>
                  </div>
                </div>
                <div className="min-w-0">
                  <div className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{vendor.shop_name || "Boutique"}</div>
                  <div className={`truncate text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{vendor.shop_slug ? `/${vendor.shop_slug}` : "Slug non defini"}</div>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sectorBadgeClass(vendor.sector, isDark)}`}>
                    {vendor.sector === "formal" ? "Formel" : "Informel"}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(vendor.status, isDark)}`}>
                    {formatStatus(vendor.status)}
                  </span>
                </div>
                <div className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>{formatDate(vendor.created_at)}</div>
                <div>
                  {vendor.shop_slug ? (
                    <button
                      type="button"
                      onClick={() => window.open(`/shop/${vendor.shop_slug}`, "_blank", "noopener,noreferrer")}
                      className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${isDark ? "bg-gray-900 text-[#ecf7e7] hover:bg-gray-700" : "bg-[#eef6ea] text-[#1b5e20] hover:bg-[#d7e4d1]"}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </button>
                  ) : (
                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
