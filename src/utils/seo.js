/**
 * Configuration et utilitaires SEO pour MangooTech
 */

// Configuration des méta-balises par défaut
export const defaultSEO = {
  title: 'MangooTech - Solutions Technologiques Innovantes',
  description: 'MangooTech propose des solutions technologiques innovantes pour transformer votre entreprise. Développement web, applications mobiles, consulting IT et plus encore.',
  keywords: 'développement web, applications mobiles, consulting IT, solutions technologiques, innovation, transformation digitale',
  author: 'MangooTech',
  robots: 'index, follow',
  viewport: 'width=device-width, initial-scale=1.0',
  charset: 'UTF-8',
  language: 'fr-FR',
  type: 'website',
  siteName: 'MangooTech',
  locale: 'fr_FR',
  image: '/logo-social.png',
  url: 'https://mangootech.com'
}

// Configuration SEO par page
export const pageSEO = {
  home: {
    title: 'MangooTech - Accueil | Solutions Technologiques Innovantes',
    description: 'Découvrez MangooTech, votre partenaire pour la transformation digitale. Solutions web, mobiles et consulting IT personnalisés.',
    keywords: 'accueil, MangooTech, solutions technologiques, transformation digitale, développement web',
    path: '/'
  },
  about: {
    title: 'À Propos - MangooTech | Notre Histoire et Vision',
    description: 'Découvrez l\'histoire de MangooTech, notre équipe passionnée et notre vision pour l\'avenir de la technologie.',
    keywords: 'à propos, équipe, histoire, vision, MangooTech, expertise technologique',
    path: '/about'
  },
  services: {
    title: 'Services - MangooTech | Développement Web & Mobile',
    description: 'Nos services : développement web, applications mobiles, consulting IT, maintenance et support technique. Solutions sur mesure.',
    keywords: 'services, développement web, applications mobiles, consulting IT, maintenance, support technique',
    path: '/services'
  },
  contact: {
    title: 'Contact - MangooTech | Parlons de Votre Projet',
    description: 'Contactez MangooTech pour discuter de votre projet. Devis gratuit, consultation personnalisée et accompagnement sur mesure.',
    keywords: 'contact, devis, consultation, projet, accompagnement, MangooTech',
    path: '/contact'
  },
  login: {
    title: 'Connexion - MangooTech | Accès Client',
    description: 'Connectez-vous à votre espace client MangooTech pour accéder à vos projets et services.',
    keywords: 'connexion, login, espace client, accès sécurisé',
    path: '/login',
    robots: 'noindex, nofollow'
  },
  register: {
    title: 'Inscription - MangooTech | Créer un Compte',
    description: 'Créez votre compte MangooTech pour accéder à nos services et suivre vos projets en temps réel.',
    keywords: 'inscription, créer compte, nouveau client, registration',
    path: '/register',
    robots: 'noindex, nofollow'
  },
  dashboard: {
    title: 'Tableau de Bord - MangooTech | Espace Client',
    description: 'Votre tableau de bord personnel MangooTech. Gérez vos projets, consultez vos factures et contactez notre équipe.',
    keywords: 'tableau de bord, dashboard, espace client, projets, gestion',
    path: '/dashboard',
    robots: 'noindex, nofollow'
  }
}

/**
 * Génère les méta-balises pour une page donnée
 * @param {string} pageKey - Clé de la page dans pageSEO
 * @param {Object} customMeta - Méta-données personnalisées
 * @returns {Object} Objet contenant toutes les méta-données
 */
export const generatePageMeta = (pageKey, customMeta = {}) => {
  const pageMeta = pageSEO[pageKey] || {}
  const meta = {
    ...defaultSEO,
    ...pageMeta,
    ...customMeta
  }

  // Génération de l'URL complète
  if (meta.path && !meta.url.includes(meta.path)) {
    meta.url = `${defaultSEO.url}${meta.path}`
  }

  return meta
}

/**
 * Met à jour les méta-balises du document
 * @param {Object} meta - Objet contenant les méta-données
 */
export const updateDocumentMeta = (meta) => {
  // Titre de la page
  document.title = meta.title

  // Méta-balises de base
  updateMetaTag('description', meta.description)
  updateMetaTag('keywords', meta.keywords)
  updateMetaTag('author', meta.author)
  updateMetaTag('robots', meta.robots)
  updateMetaTag('viewport', meta.viewport)

  // Open Graph
  updateMetaProperty('og:title', meta.title)
  updateMetaProperty('og:description', meta.description)
  updateMetaProperty('og:type', meta.type)
  updateMetaProperty('og:url', meta.url)
  updateMetaProperty('og:site_name', meta.siteName)
  updateMetaProperty('og:locale', meta.locale)
  updateMetaProperty('og:image', `${defaultSEO.url}${meta.image}`)

  // Twitter Card
  updateMetaName('twitter:card', 'summary_large_image')
  updateMetaName('twitter:title', meta.title)
  updateMetaName('twitter:description', meta.description)
  updateMetaName('twitter:image', `${defaultSEO.url}${meta.image}`)

  // Canonical URL
  updateCanonicalLink(meta.url)
}

/**
 * Met à jour une méta-balise par son attribut name
 * @param {string} name - Nom de l'attribut
 * @param {string} content - Contenu de la méta-balise
 */
const updateMetaTag = (name, content) => {
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/**
 * Met à jour une méta-balise par son attribut property
 * @param {string} property - Nom de la propriété
 * @param {string} content - Contenu de la méta-balise
 */
const updateMetaProperty = (property, content) => {
  let meta = document.querySelector(`meta[property="${property}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('property', property)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/**
 * Met à jour une méta-balise Twitter par son attribut name
 * @param {string} name - Nom de l'attribut
 * @param {string} content - Contenu de la méta-balise
 */
const updateMetaName = (name, content) => {
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/**
 * Met à jour le lien canonical
 * @param {string} url - URL canonique
 */
const updateCanonicalLink = (url) => {
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

/**
 * Hook personnalisé pour gérer le SEO dans les composants React
 * @param {string} pageKey - Clé de la page
 * @param {Object} customMeta - Méta-données personnalisées
 */
export const useSEO = (pageKey, customMeta = {}) => {
  const meta = generatePageMeta(pageKey, customMeta)
  
  // Mise à jour des méta-balises au montage du composant
  React.useEffect(() => {
    updateDocumentMeta(meta)
  }, [meta])

  return meta
}

/**
 * Génère un sitemap.xml basique (à utiliser côté serveur)
 * @returns {string} Contenu XML du sitemap
 */
export const generateSitemap = () => {
  const pages = Object.values(pageSEO).filter(page => !page.robots?.includes('noindex'))
  const lastmod = new Date().toISOString().split('T')[0]
  
  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  
  pages.forEach(page => {
    sitemap += '  <url>\n'
    sitemap += `    <loc>${defaultSEO.url}${page.path}</loc>\n`
    sitemap += `    <lastmod>${lastmod}</lastmod>\n`
    sitemap += '    <changefreq>weekly</changefreq>\n'
    sitemap += '    <priority>0.8</priority>\n'
    sitemap += '  </url>\n'
  })
  
  sitemap += '</urlset>'
  return sitemap
}

/**
 * Génère les données structurées JSON-LD pour l'organisation
 * @returns {Object} Données structurées de l'organisation
 */
export const generateOrganizationSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MangooTech',
    description: defaultSEO.description,
    url: defaultSEO.url,
    logo: `${defaultSEO.url}/logo.png`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-1-23-45-67-89',
      contactType: 'customer service',
      availableLanguage: ['French', 'English']
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'FR',
      addressLocality: 'Paris'
    },
    sameAs: [
      'https://www.linkedin.com/company/mangootech',
      'https://twitter.com/mangootech',
      'https://github.com/mangootech'
    ]
  }
}

export default {
  defaultSEO,
  pageSEO,
  generatePageMeta,
  updateDocumentMeta,
  useSEO,
  generateSitemap,
  generateOrganizationSchema
}