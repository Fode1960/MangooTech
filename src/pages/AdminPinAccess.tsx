import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, KeyRound, RefreshCw, RotateCw, Search } from "lucide-react";
import { toast } from "sonner";
import { buildApiUrl } from "../config/api";
import { supabase } from "../config/supabase";
import { useTheme } from "../hooks/useTheme";

type PinSector = "formal" | "informal";
type PinKind = "all" | "shop" | "provider";

type AdminPinRecord = {
  id: string;
  pin: string;
  account_type: "shop" | "provider";
  access_role: "client" | "vendor";
  account_name: string;
  owner_name: string | null;
  reference: string | null;
  sector: PinSector;
  source: "supabase" | "local-sync";
  status: string | null;
  created_at: string | null;
  expires_at: string | null;
  email: string | null;
  phone: string | null;
  target_path: string | null;
};

type PinCounts = {
  total: number;
  shops: number;
  providers: number;
  formal: number;
  informal: number;
};

type AdminPinAccessProps = {
  embedded?: boolean;
};

const formatDate = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
};

const formatType = (value: "shop" | "provider") => {
  return value === "shop" ? "Boutique" : "Prestataire";
};

const formatAccessRole = (value: "client" | "vendor") => {
  return value === "client" ? "Client" : "Vendeur";
};

const formatPinFamily = (item: AdminPinRecord) => {
  return item.account_type === "shop" ? "PIN Boutique Client" : "PIN Gestion Prestataire";
};

const formatStatus = (value: string | null | undefined) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved") return "Approuve";
  if (normalized === "rejected") return "Refuse";
  if (normalized === "suspended") return "Suspendu";
  if (normalized === "open") return "Ouvert";
  if (normalized === "closed") return "Ferme";
  return "En attente";
};

const statusBadgeClass = (status: string | null | undefined, isDark: boolean) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "open") return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
  if (normalized === "rejected") return isDark ? "bg-red-900/30 text-red-200" : "bg-red-50 text-red-700";
  if (normalized === "suspended" || normalized === "closed") return isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-700";
  return isDark ? "bg-[#8f4b00]/20 text-[#ffe082]" : "bg-[#fff4d6] text-[#8f4b00]";
};

const sectorBadgeClass = (sector: PinSector, isDark: boolean) => {
  if (sector === "informal") return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
  return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
};

const sourceBadgeClass = (source: "supabase" | "local-sync", isDark: boolean) => {
  if (source === "supabase") return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
  return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
};

const accessBadgeClass = (role: "client" | "vendor", isDark: boolean) => {
  if (role === "client") return isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c]" : "bg-[#f6faf3] text-[#1b5e20]";
  return isDark ? "bg-[#1b5e20]/30 text-[#66bb6a]" : "bg-[#eef6ea] text-[#1b5e20]";
};

const pinModeBadgeClass = (expiresAt: string | null | undefined, isDark: boolean) => {
  if (String(expiresAt || "").trim()) return isDark ? "bg-[#8f4b00]/20 text-[#ffe082]" : "bg-[#fff4d6] text-[#8f4b00]";
  return isDark ? "bg-[#1b5e20]/30 text-[#66bb6a]" : "bg-[#eef6ea] text-[#1b5e20]";
};

const formatPinMode = (expiresAt: string | null | undefined) => {
  return String(expiresAt || "").trim() ? "Temporaire" : "Stable";
};

const humanizeReference = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const resolveDisplayName = (item: AdminPinRecord) => {
  const rawName = String(item.account_name || "").trim();
  if (rawName && rawName.toLowerCase() !== "boutique" && rawName.toLowerCase() !== "prestataire") return rawName;
  const fromReference = humanizeReference(item.reference);
  if (fromReference) return fromReference;
  return rawName || "Compte";
};

const resolveOwnerName = (item: AdminPinRecord) => {
  const owner = String(item.owner_name || "").trim();
  if (owner) return owner;
  if (item.email) return item.email;
  return "Proprietaire non renseigne";
};

export default function AdminPinAccess({ embedded = false }: AdminPinAccessProps) {
  const { isDark } = useTheme();
  const isDev = Boolean(import.meta.env.DEV);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<PinKind>("all");
  const [sector, setSector] = useState<"all" | PinSector>("all");
  const [pins, setPins] = useState<AdminPinRecord[]>([]);
  const [counts, setCounts] = useState<PinCounts>({ total: 0, shops: 0, providers: 0, formal: 0, informal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    "Vue active: acces PIN deja disponibles pour les boutiques et les prestataires."
  );

  const applySearch = useCallback(() => {
    setQuery(search.trim());
  }, [search]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setQuery("");
    setKind("all");
    setSector("all");
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

  const loadPins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAdminToken();
      if (!token) throw new Error("Connectez-vous avec un compte admin pour afficher les acces PIN.");

      const qs = new URLSearchParams();
      if (query.trim()) qs.set("search", query.trim());
      if (kind !== "all") qs.set("kind", kind);
      if (sector !== "all") qs.set("sector", sector);

      const response = await fetch(buildApiUrl(`/api/admin/accounts/pins?${qs.toString()}`), {
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

      const nextPins = Array.isArray(payload?.pins) ? payload.pins : [];
      const nextCounts = payload?.counts || {};
      const formalAvailable = payload?.sources?.formal !== false;
      const formalError = String(payload?.sources?.formal_error || "").trim();
      const pinError = String(payload?.sources?.pin_error || "").trim();

      setPins(nextPins);
      setCounts({
        total: Number(nextCounts.total || 0),
        shops: Number(nextCounts.shops || 0),
        providers: Number(nextCounts.providers || 0),
        formal: Number(nextCounts.formal || 0),
        informal: Number(nextCounts.informal || 0),
      });
      setNotice(
        formalAvailable
          ? `Vue active: acces PIN relies aux boutiques et prestataires.${pinError ? ` Source PIN partielle: ${pinError}` : ""}`
          : `Vue partielle: secteur formel indisponible pour le moment.${formalError ? ` ${formalError}` : ""}${pinError ? ` ${pinError}` : ""}`
      );
    } catch (err: any) {
      setPins([]);
      setCounts({ total: 0, shops: 0, providers: 0, formal: 0, informal: 0 });
      setError(err?.message || "Erreur lors du chargement des acces PIN.");
    } finally {
      setLoading(false);
    }
  }, [getAdminToken, kind, query, sector]);

  useEffect(() => {
    void loadPins();
  }, [loadPins]);

  const visiblePins = useMemo(() => pins, [pins]);

  const copyPin = useCallback(async (pin: string) => {
    try {
      await navigator.clipboard.writeText(String(pin || ""));
      toast.success("PIN copie dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier le PIN");
    }
  }, []);

  const regenerateStablePin = useCallback(
    async (item: AdminPinRecord) => {
      const slug = String(item.reference || "").trim();
      if (!slug) {
        toast.error("Boutique introuvable pour la regeneration");
        return;
      }

      const confirmed = window.confirm(`Regenerer le PIN stable de ${item.account_name || slug} ?`);
      if (!confirmed) return;

      setBusyId(item.id);
      try {
        const token = await getAdminToken();
        if (!token) throw new Error("Connectez-vous avec un compte admin pour regenerer un PIN.");

        const response = await fetch(buildApiUrl("/api/admin/accounts/pins/shop/regenerate"), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ shopSlug: slug, pinLen: 6 }),
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || `HTTP ${response.status}`);
        }

        toast.success(`Nouveau PIN stable genere pour ${item.account_name || slug}`);
        await loadPins();
      } catch (err: any) {
        toast.error(err?.message || "Impossible de regenerer le PIN");
      } finally {
        setBusyId(null);
      }
    },
    [getAdminToken, loadPins]
  );

  return (
    <div className={`${embedded ? "space-y-6" : `p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}`}>
      <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl border p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Acces PIN</h2>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                Codes deja actifs pour l'acces client aux boutiques et l'acces vendeur des prestataires.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setKind("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === "all" ? "bg-[#1b5e20] text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"}`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setKind("shop")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === "shop" ? "bg-[#1b5e20] text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-[#f6faf3] text-[#1b5e20]"}`}
              >
                Boutiques
              </button>
              <button
                type="button"
                onClick={() => setKind("provider")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${kind === "provider" ? "bg-[#1b5e20] text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-[#f6faf3] text-[#1b5e20]"}`}
              >
                Prestataires
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
                placeholder="PIN, nom, slug, email, telephone"
                className={`w-full bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"}`}
              />
            </div>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value as "all" | PinSector)}
              className={`rounded-xl border px-3 py-2 text-sm ${isDark ? "border-gray-700 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-900"}`}
            >
              <option value="all">Tous secteurs</option>
              <option value="formal">Formel</option>
              <option value="informal">Informel</option>
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
              onClick={() => void loadPins()}
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
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Boutiques</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.shops}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Prestataires</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.providers}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Formel</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.formal}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Informel</div>
          <div className="mt-1 text-lg font-bold text-[#1b5e20]">{counts.informal}</div>
        </div>
      </div>

      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-red-800 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {notice && !error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-[#8f4b00]/40 bg-[#8f4b00]/20 text-[#ffe082]" : "border-[#ffa726] bg-[#fff4d6] text-[#8f4b00]"}`}>
          {notice}
          {(query || kind !== "all" || sector !== "all") && (
            <span className="ml-2">
              Filtres actifs:
              {query ? ` recherche "${query}"` : ""}
              {kind !== "all" ? `${query ? "," : ""} type ${kind === "shop" ? "boutique" : "prestataire"}` : ""}
              {sector !== "all" ? `${query || kind !== "all" ? "," : ""} secteur ${sector === "formal" ? "formel" : "informel"}` : ""}
              .
            </span>
          )}
        </div>
      )}

      <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className={`grid grid-cols-[160px_minmax(0,1.7fr)_120px_130px_120px_190px] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide ${isDark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
          <div>PIN</div>
          <div>Titulaire</div>
          <div>Secteur</div>
          <div>Statut</div>
          <div>Depuis</div>
          <div>Acces</div>
        </div>

        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Chargement des acces PIN...</div>
        ) : visiblePins.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Aucun acces PIN a afficher.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visiblePins.map((item) => (
              <div key={item.id} className="grid grid-cols-[160px_minmax(0,1.7fr)_120px_130px_120px_190px] gap-4 px-4 py-4">
                <div className="flex flex-col gap-2">
                  <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black tracking-[0.25em] ${isDark ? "bg-gray-900 text-[#66bb6a]" : "bg-[#eef6ea] text-[#1b5e20]"}`}>
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <span>{item.pin || "----"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void copyPin(item.pin)}
                    className={`inline-flex w-fit items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-gray-900 text-gray-200 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copier
                  </button>
                </div>
                <div className="min-w-0">
                  <div className={`text-[11px] font-semibold uppercase tracking-wide ${isDark ? "text-[#66bb6a]" : "text-[#1b5e20]"}`}>
                    {formatPinFamily(item)}
                  </div>
                  <div className={`truncate text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{resolveDisplayName(item)}</div>
                  <div className={`truncate text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {formatType(item.account_type)} · {formatAccessRole(item.access_role)}
                  </div>
                  <div className={`truncate text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Proprietaire / contact: {resolveOwnerName(item)}
                  </div>
                  <div className={`truncate text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {item.reference ? `Slug: ${item.reference}` : item.email ? `Email: ${item.email}` : item.phone ? `Tel: ${item.phone}` : "Sans reference"}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${sourceBadgeClass(item.source, isDark)}`}>
                      {item.source === "supabase" ? "Supabase" : "Local"}
                    </span>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${pinModeBadgeClass(item.expires_at, isDark)}`}>
                      {formatPinMode(item.expires_at)}
                    </span>
                  </div>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${sectorBadgeClass(item.sector, isDark)}`}>
                    {item.sector === "formal" ? "Formel" : "Informel"}
                  </span>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(item.status, isDark)}`}>
                    {formatStatus(item.status)}
                  </span>
                </div>
                <div className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  <div>{formatDate(item.created_at)}</div>
                  <div className={`mt-1 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {item.expires_at ? `Expire le ${formatDate(item.expires_at)}` : "Sans expiration"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {item.target_path ? (
                    <button
                      type="button"
                      onClick={() => window.open(item.target_path || "", "_blank", "noopener,noreferrer")}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${isDark ? "bg-gray-900 text-[#66bb6a] hover:bg-gray-700" : "bg-[#eef6ea] text-[#1b5e20] hover:bg-[#f6faf3]"}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ouvrir
                    </button>
                  ) : (
                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>—</span>
                  )}
                  {item.account_type === "shop" && item.source === "supabase" ? (
                    <button
                      type="button"
                      onClick={() => void regenerateStablePin(item)}
                      disabled={busyId === item.id}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${isDark ? "bg-[#1b5e20]/30 text-[#8ccf8c] hover:bg-[#1b5e20]/50" : "bg-[#f6faf3] text-[#1b5e20] hover:bg-[#e0f0d8]"} ${busyId === item.id ? "cursor-wait opacity-70" : ""}`}
                    >
                      <RotateCw className={`h-4 w-4 ${busyId === item.id ? "animate-spin" : ""}`} />
                      Regenerer
                    </button>
                  ) : (
                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
                      {item.account_type === "provider" ? "Gestion PIN locale" : "Source locale"}
                    </span>
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
