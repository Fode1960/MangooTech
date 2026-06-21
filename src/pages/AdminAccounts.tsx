import { useMemo, useState } from "react";
import { Briefcase, KeyRound, Shield, ShoppingBag, Users } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import AdminClients from "./AdminClients";
import AdminUsers from "./AdminUsers";
import AdminProviders from "./AdminProviders";
import AdminVendors from "./AdminVendors";
import AdminPinAccess from "./AdminPinAccess";

type AccountTab = "admins" | "clients" | "vendors" | "providers" | "pin";

const tabs: Array<{
  id: AccountTab;
  label: string;
  description: string;
  icon: typeof Shield;
  available: boolean;
}> = [
  {
    id: "admins",
    label: "Administrateurs",
    description: "Gerer les comptes d'administration et de support.",
    icon: Shield,
    available: true,
  },
  {
    id: "clients",
    label: "Clients",
    description: "Voir les comptes plateforme cote client.",
    icon: Users,
    available: true,
  },
  {
    id: "vendors",
    label: "Vendeurs",
    description: "Suivre les personnes reliees aux boutiques.",
    icon: ShoppingBag,
    available: true,
  },
  {
    id: "providers",
    label: "Prestataires",
    description: "Suivre les prestataires visibles dans Mangoo Tech.",
    icon: Briefcase,
    available: true,
  },
  {
    id: "pin",
    label: "Acces PIN",
    description: "Voir les codes PIN deja actifs pour les boutiques et les prestataires.",
    icon: KeyRound,
    available: true,
  },
];

export default function AdminAccounts() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<AccountTab>("admins");

  const activeTabConfig = useMemo(
    () => tabs.find((tab) => tab.id === activeTab) ?? tabs[0],
    [activeTab]
  );

  return (
    <div className="space-y-6">
      <section className={`rounded-2xl border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isDark ? "bg-orange-900/30 text-orange-200" : "bg-orange-50 text-orange-700"}`}>
              Mangoo Tech
            </span>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Comptes</h1>
              <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
                Voir et gerer les personnes et acces de la plateforme sans melanger les familles metier.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-orange-50"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-orange-200" : "text-orange-700"}`}>Vue active</div>
              <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{activeTabConfig.label}</div>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>Disponibles</div>
              <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>5 onglets deja utilisables</div>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${isDark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
              <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-gray-400" : "text-gray-500"}`}>A venir</div>
              <div className={`mt-1 text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Extensions metier</div>
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-2xl border p-3 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-colors ${
                  isActive
                    ? isDark
                      ? "border-orange-500 bg-orange-900/30 text-orange-100"
                      : "border-orange-300 bg-orange-50 text-orange-700"
                    : isDark
                      ? "border-gray-700 bg-gray-900 text-gray-200 hover:border-gray-600"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-semibold">{tab.label}</span>
                {!tab.available && (
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"}`}>
                    Bientot
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className={`mt-3 px-1 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>{activeTabConfig.description}</p>
      </section>

      {activeTab === "admins" && <AdminUsers embedded scope="admin" />}
      {activeTab === "clients" && <AdminClients embedded />}
      {activeTab === "vendors" && <AdminVendors embedded />}
      {activeTab === "providers" && <AdminProviders embedded />}
      {activeTab === "pin" && <AdminPinAccess embedded />}

      {activeTab !== "admins" && activeTab !== "clients" && activeTab !== "vendors" && activeTab !== "providers" && activeTab !== "pin" && (
        <section className={`rounded-2xl border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}>
          <div className="max-w-2xl space-y-3">
            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{activeTabConfig.label}</h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Cette vue sera branchee sur sa source reelle dans un prochain lot, apres validation du modele de donnees correspondant.
            </p>
            <div className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-amber-800 bg-amber-900/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              Priorite actuelle: stabiliser les comptes d'administration et les prestataires sans casser les parcours deja valides.
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
