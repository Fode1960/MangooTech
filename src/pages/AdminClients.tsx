import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, UserRound } from "lucide-react";
import { buildApiUrl } from "../config/api";
import { supabase } from "../config/supabase";
import { useTheme } from "../hooks/useTheme";

type ClientSector = "formal" | "informal";

type AdminClientRecord = {
  id: string;
  email: string;
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  company?: string | null;
  account_type?: string | null;
  sector: ClientSector;
  source: "supabase" | "local-sync";
  created_at?: string | null;
};

type ClientCounts = {
  total: number;
  formal: number;
  informal: number;
};

type AdminClientsProps = {
  embedded?: boolean;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed ?? fallback) as T;
  } catch {
    return fallback;
  }
};

const getDisplayName = (user: AdminClientRecord) => {
  const explicit = String(user.name || "").trim();
  if (explicit) return explicit;
  const first = String(user.first_name || "").trim();
  const last = String(user.last_name || "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  const email = String(user.email || "").trim();
  if (email) return email.split("@")[0];
  return "Client";
};

const formatAccountType = (value: string | null | undefined, sector: ClientSector) => {
  if (sector === "informal") return "Compte local";
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "professional") return "Professionnel";
  if (normalized === "individual") return "Particulier";
  return "Compte plateforme";
};

const formatDate = (value: string | null | undefined) => {
  const raw = String(value || "").trim();
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
};

const normalizeLocalClient = (value: any): AdminClientRecord | null => {
  const email = String(value?.email || "").trim().toLowerCase();
  const role = String(value?.role || "").trim().toLowerCase();
  const roles = Array.isArray(value?.roles) ? value.roles.map((item: any) => String(item || "").trim().toLowerCase()) : [];
  const isClient = role === "client" || roles.includes("client");
  if (!email || !isClient) return null;
  return {
    id: String(value?.id || email),
    email,
    name: String(value?.name || "").trim() || email.split("@")[0] || "Client",
    first_name: String(value?.first_name || value?.firstName || "").trim() || null,
    last_name: String(value?.last_name || value?.lastName || "").trim() || null,
    phone: null,
    company: null,
    account_type: "individual",
    sector: "formal",
    source: "supabase",
    created_at: String(value?.createdAt || value?.created_at || "").trim() || null,
  };
};

const readLocalFallback = (search = "", sector: "all" | ClientSector = "all") => {
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const entries = new Map<string, AdminClientRecord>();

  const push = (record: AdminClientRecord | null) => {
    if (!record) return;
    if (sector !== "all" && record.sector !== sector) return;
    const name = getDisplayName(record).toLowerCase();
    if (normalizedSearch && !record.email.includes(normalizedSearch) && !name.includes(normalizedSearch)) return;
    entries.set(`${record.sector}:${record.email}`, record);
  };

  const demoUsers = readJson<Record<string, any>>("demo_users", {});
  Object.values(demoUsers || {}).forEach((entry) => push(normalizeLocalClient(entry)));
  push(normalizeLocalClient(readJson<any>("mangoo-current-user", null)));

  const clients = Array.from(entries.values());
  return {
    clients,
    counts: {
      total: clients.length,
      formal: clients.filter((item) => item.sector === "formal").length,
      informal: clients.filter((item) => item.sector === "informal").length,
    },
  };
};

export default function AdminClients({ embedded = false }: AdminClientsProps) {
  const { isDark } = useTheme();
  const isDev = Boolean(import.meta.env.DEV);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<"all" | ClientSector>("all");
  const [clients, setClients] = useState<AdminClientRecord[]>([]);
  const [counts, setCounts] = useState<ClientCounts>({ total: 0, formal: 0, informal: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    "Clients regroupes par secteur, avec distinction entre formel et informel."
  );

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

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAdminToken();
      if (!token) {
        throw new Error("Connectez-vous avec un compte admin pour afficher les clients.");
      }

      const qs = new URLSearchParams();
      if (query.trim()) qs.set("search", query.trim());
      if (sector !== "all") qs.set("sector", sector);

      const response = await fetch(buildApiUrl(`/api/admin/accounts/clients?${qs.toString()}`), {
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

      const nextClients = Array.isArray(payload?.clients) ? payload.clients : [];
      const nextCounts = payload?.counts || { total: nextClients.length, formal: 0, informal: 0 };
      const formalAvailable = payload?.sources?.formal !== false;
      const formalError = String(payload?.sources?.formal_error || "").trim();

      setClients(nextClients);
      setCounts({
        total: Number(nextCounts.total || 0),
        formal: Number(nextCounts.formal || 0),
        informal: Number(nextCounts.informal || 0),
      });
      setNotice(
        formalAvailable
          ? "Vue active: clients du secteur formel et informel, separes dans une meme liste admin."
          : `Formel indisponible pour le moment. Affichage informel actif.${formalError ? ` ${formalError}` : ""}`
      );
    } catch (err: any) {
      const fallback = readLocalFallback(query, sector);
      setClients(fallback.clients);
      setCounts(fallback.counts);
      if (fallback.clients.length) {
        setError(null);
        setNotice("Mode local de secours: seuls les comptes clients presents dans ce navigateur sont affiches.");
      } else {
        setError(err?.message || "Erreur lors du chargement des clients.");
      }
    } finally {
      setLoading(false);
    }
  }, [getAdminToken, query, sector]);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filteredClients = useMemo(() => clients, [clients]);

  return (
    <div className={`${embedded ? "space-y-6" : `p-8 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}`}>
      <div className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-2xl border p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Clients</h2>
              <p className={isDark ? "text-gray-300" : "text-gray-600"}>
                Tous les clients utiles a l'administration, avec distinction entre secteur formel et secteur informel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSector("all")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${sector === "all" ? "bg-orange-500 text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-700"}`}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => setSector("formal")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${sector === "formal" ? "bg-sky-600 text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-sky-50 text-sky-700"}`}
              >
                Formel
              </button>
              <button
                type="button"
                onClick={() => setSector("informal")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${sector === "informal" ? "bg-fuchsia-600 text-white" : isDark ? "bg-gray-900 text-gray-200" : "bg-fuchsia-50 text-fuchsia-700"}`}
              >
                Informel
              </button>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <Search className={`h-4 w-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setQuery(search.trim());
                }}
                placeholder="Rechercher par nom ou email"
                className={`w-full bg-transparent text-sm outline-none ${isDark ? "text-white placeholder:text-gray-500" : "text-gray-900 placeholder:text-gray-400"}`}
              />
            </div>
            <button
              type="button"
              onClick={() => setQuery(search.trim())}
              className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Chercher
            </button>
            <button
              type="button"
              onClick={() => void loadClients()}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                isDark ? "bg-gray-900 text-gray-100 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Rafraichir
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Total</div>
          <div className={`mt-1 text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{counts.total}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Formel</div>
          <div className="mt-1 text-lg font-bold text-sky-600">{counts.formal}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Informel</div>
          <div className="mt-1 text-lg font-bold text-fuchsia-600">{counts.informal}</div>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Filtre</div>
          <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{query || "Aucun filtre"}</div>
        </div>
      </div>

      {error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-red-800 bg-red-900/20 text-red-200" : "border-red-200 bg-red-50 text-red-700"}`}>
          {error}
        </div>
      )}

      {notice && !error && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-amber-800 bg-amber-900/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
          {notice}
        </div>
      )}

      <div className={`overflow-hidden rounded-2xl border ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className={`grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_140px_160px_110px] gap-4 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide ${isDark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
          <div>Client</div>
          <div>Email</div>
          <div>Secteur</div>
          <div>Profil</div>
          <div>Depuis</div>
        </div>

        {loading ? (
          <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Chargement des clients...</div>
        ) : filteredClients.length === 0 ? (
          <div className={`px-4 py-10 text-center text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>Aucun client a afficher.</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredClients.map((client) => (
              <div key={`${client.sector}:${client.email}:${client.id}`} className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_140px_160px_110px] gap-4 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDark ? "bg-gray-700 text-orange-200" : "bg-orange-50 text-orange-600"}`}>
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className={`truncate text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{getDisplayName(client)}</div>
                    <div className={`truncate text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{client.phone || client.company || client.id}</div>
                  </div>
                </div>
                <div className={`truncate text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>{client.email || "—"}</div>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    client.sector === "formal"
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200"
                      : "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-200"
                  }`}>
                    {client.sector === "formal" ? "Formel" : "Informel"}
                  </span>
                </div>
                <div className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>{formatAccountType(client.account_type, client.sector)}</div>
                <div className={`text-sm ${isDark ? "text-gray-200" : "text-gray-700"}`}>{formatDate(client.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
