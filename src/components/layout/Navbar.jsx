import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Globe, User, LogOut, Settings, Crown, Shield } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import MangoLogo from '../ui/MangoLogo'
import ThemeToggle from '../ui/ThemeToggle'

const Navbar = () => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, userProfile, signOut, isSuperAdmin, isAdmin } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Gérer le scroll pour changer l'apparence de la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fermer les menus lors du changement de route
  useEffect(() => {
    setIsOpen(false)
    setIsUserMenuOpen(false)
    setIsLangMenuOpen(false)
  }, [location])

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang)
    setIsLangMenuOpen(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setIsUserMenuOpen(false)
  }

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/services', label: t('nav.services') },
    { path: '/about', label: t('nav.about') },
    { path: '/contact', label: t('nav.contact') }
  ]

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm'
      }`}
      role="navigation"
      aria-label="Navigation principale"
    >
      <div className="container">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            aria-label="Retour à l'accueil Mangoo Tech"
          >
            <MangoLogo className="w-10 h-10 lg:w-12 lg:h-12" aria-hidden="true" />
            <div className="hidden sm:block">
              <span className="text-xl lg:text-2xl font-bold text-gradient">
                Mangoo Tech
              </span>
              <p className="text-xs text-gray-600 dark:text-gray-400 -mt-1">
                Solutions Numériques
              </p>
            </div>
          </Link>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center space-x-8" role="menubar">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                role="menuitem"
                className={`nav-link ${
                  location.pathname === link.path ? 'active' : ''
                }`}
                aria-current={location.pathname === link.path ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Sélecteur de langue */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-expanded={isLangMenuOpen}
                aria-haspopup="menu"
                aria-label="Changer de langue"
                id="language-menu-button"
              >
                <Globe className="w-4 h-4" aria-hidden="true" />
                <span className="text-sm">{currentLanguage.flag}</span>
              </button>
              
              {isLangMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                  role="menu"
                  aria-labelledby="language-menu-button"
                >
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                        i18n.language === lang.code ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                      }`}
                      role="menuitem"
                      aria-current={i18n.language === lang.code ? 'true' : 'false'}
                    >
                      <span aria-hidden="true">{lang.flag}</span>
                      <span>{lang.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton de thème */}
            <ThemeToggle />

            {/* Menu utilisateur */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menu utilisateur"
                  id="user-menu-button"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center relative ${
                    isSuperAdmin() ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                    isAdmin() ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    'bg-gradient-primary'
                  }`} aria-hidden="true">
                    {isSuperAdmin() ? (
                      <Crown className="w-4 h-4 text-white" />
                    ) : isAdmin() ? (
                      <Shield className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {userProfile?.first_name || user.email}
                    </span>
                    {isSuperAdmin() && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                        Super Admin
                      </span>
                    )}
                    {isAdmin() && !isSuperAdmin() && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Administrateur
                      </span>
                    )}
                  </div>
                </button>
                
                {isUserMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                    role="menu"
                    aria-labelledby="user-menu-button"
                  >
                    {(isAdmin() || isSuperAdmin()) ? (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        {isSuperAdmin() ? (
                          <Crown className="w-4 h-4 text-yellow-600" aria-hidden="true" />
                        ) : (
                          <Shield className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        )}
                        <span>Administration</span>
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" aria-hidden="true" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>
                    )}
                    <Link
                      to="/logout-debug"
                      className="flex items-center space-x-3 px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                      role="menuitem"
                    >
                      <Settings className="w-4 h-4" aria-hidden="true" />
                      <span>Diagnostic Déconnexion</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn-ghost text-sm"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-gray-100"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {isOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>

        {/* Navigation Mobile */}
        {isOpen && (
          <div 
            className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 bg-white dark:bg-gray-900"
            id="mobile-menu"
            role="navigation"
            aria-label="Menu mobile"
          >
            <div className="space-y-2" role="menu">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === link.path 
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  role="menuitem"
                  aria-current={location.pathname === link.path ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                {/* Langues Mobile */}
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-500 mb-2" id="mobile-language-label">Langue</p>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="mobile-language-label">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                          i18n.language === lang.code 
                            ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        role="radio"
                        aria-checked={i18n.language === lang.code}
                        aria-label={`Changer la langue vers ${lang.name}`}
                      >
                        <span aria-hidden="true">{lang.flag}</span>
                        <span>{lang.code.toUpperCase()}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Bouton de thème Mobile */}
                <div className="px-4 py-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Thème</p>
                  <ThemeToggle className="w-full justify-center" />
                </div>
                
                {/* Actions Mobile */}
                {user ? (
                  <div className="px-4 py-2 space-y-2">
                    {(isAdmin() || isSuperAdmin()) ? (
                      <Link
                        to="/admin"
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        aria-label="Accéder à l'administration"
                      >
                        {isSuperAdmin() ? (
                          <Crown className="w-4 h-4 text-yellow-600" aria-hidden="true" />
                        ) : (
                          <Shield className="w-4 h-4 text-blue-600" aria-hidden="true" />
                        )}
                        <span>Administration</span>
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        className="flex items-center space-x-3 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        aria-label="Accéder au tableau de bord"
                      >
                        <Settings className="w-4 h-4" aria-hidden="true" />
                        <span>{t('nav.dashboard')}</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                      aria-label="Se déconnecter"
                    >
                      <LogOut className="w-4 h-4" aria-hidden="true" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-4 py-2 space-y-2">
                    <Link
                      to="/login"
                      className="block w-full text-center py-2 px-4 rounded-lg border border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                      aria-label="Se connecter"
                    >
                      {t('nav.login')}
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full text-center py-2 px-4 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
                      aria-label="S'inscrire"
                    >
                      {t('nav.register')}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar