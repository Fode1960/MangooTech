import React from 'react';

import mangooLogoUrl from '../../assets/mangoo-logo.svg'

const Footer = () => {
  const supportEmail = String(import.meta.env.VITE_SUPPORT_EMAIL || 'contact@mangootech.com').trim()
  const supportPhone = String(import.meta.env.VITE_SUPPORT_PHONE || '').trim()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white/90 text-slate-900 backdrop-blur dark:border-slate-800 dark:bg-slate-950/92 dark:text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src={mangooLogoUrl} alt="Mangoo Tech" className="h-9 w-9 rounded-xl border border-[#d7e4d1] bg-white p-1" />
              <div className="text-xl font-black tracking-tight">MangooTech</div>
            </div>
            <div className="mt-3 max-w-xs text-sm text-slate-600 dark:text-slate-400">
              La plateforme de référence pour le commerce digital en Afrique.
            </div>
          </div>

          <div>
            <div className="text-sm font-black tracking-wide text-slate-900 dark:text-slate-100">Produit</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div>Fonctionnalités</div>
              <div>Tarifs</div>
              <div>Créer une boutique</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-black tracking-wide text-slate-900 dark:text-slate-100">Légal</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div>Conditions d'utilisation</div>
              <div>Politique de confidentialité</div>
              <div>Mentions légales</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-black tracking-wide text-slate-900 dark:text-slate-100">Contact</div>
            <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div>
                <a href={`mailto:${supportEmail}`} className="transition-colors hover:text-slate-900 dark:hover:text-white">
                  {supportEmail}
                </a>
              </div>
              <div>
                {supportPhone ? (
                  <a href={`tel:${supportPhone}`} className="transition-colors hover:text-slate-900 dark:hover:text-white">
                    {supportPhone}
                  </a>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">Téléphone: —</span>
                )}
              </div>
              <div className="pt-1 flex items-center gap-3">
                <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800" aria-label="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M14 8.5V7.2c0-.8.5-1.2 1.2-1.2H17V3h-2.2C12.4 3 11 4.5 11 7.1v1.4H9v3h2V21h3v-9.5h2.4l.6-3H14Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800" aria-label="X">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M18.9 3H21l-6.6 7.5L22 21h-6.2l-4.8-6.2L5.4 21H3.3l7.1-8.1L2 3h6.3l4.3 5.7L18.9 3Zm-1.1 16.2h1.2L7.1 4.7H5.8l12 14.5Z" fill="currentColor" />
                  </svg>
                </a>
                <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800" aria-label="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 2A2.5 2.5 0 0 0 5 7.5v9A2.5 2.5 0 0 0 7.5 19h9a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 16.5 5h-9Z" fill="currentColor" />
                    <path d="M12 7.6a4.4 4.4 0 1 1 0 8.8 4.4 4.4 0 0 1 0-8.8Zm0 2a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z" fill="currentColor" />
                    <path d="M17.3 6.8a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
          © 2026 MangooTech. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
