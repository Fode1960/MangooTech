import React, { useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { generatePageMeta, generateOrganizationSchema } from '../../utils/seo'

/**
 * Composant SEOHead pour gérer les méta-balises et le SEO
 * @param {Object} props - Propriétés du composant
 * @param {string} props.pageKey - Clé de la page dans la configuration SEO
 * @param {Object} props.customMeta - Méta-données personnalisées
 * @param {boolean} props.includeSchema - Inclure les données structurées JSON-LD
 * @param {Object} props.customSchema - Données structurées personnalisées
 */
const SEOHead = ({ 
  pageKey = 'home', 
  customMeta = {}, 
  includeSchema = false, 
  customSchema = null 
}) => {
  const meta = generatePageMeta(pageKey, customMeta)
  const organizationSchema = generateOrganizationSchema()

  // Génération du schéma JSON-LD
  const jsonLdSchema = customSchema || (includeSchema ? organizationSchema : null)

  return (
    <Helmet>
      {/* Titre de la page */}
      <title>{meta.title}</title>

      {/* Méta-balises de base */}
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="author" content={meta.author} />
      <meta name="robots" content={meta.robots} />
      <meta name="viewport" content={meta.viewport} />
      <meta charSet={meta.charset} />
      <html lang={meta.language} />

      {/* Open Graph */}
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:type" content={meta.type} />
      <meta property="og:url" content={meta.url} />
      <meta property="og:site_name" content={meta.siteName} />
      <meta property="og:locale" content={meta.locale} />
      <meta property="og:image" content={`${meta.url.split('/').slice(0, 3).join('/')}${meta.image}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={meta.title} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={`${meta.url.split('/').slice(0, 3).join('/')}${meta.image}`} />
      <meta name="twitter:image:alt" content={meta.title} />

      {/* Liens canoniques et alternatifs */}
      <link rel="canonical" href={meta.url} />
      
      {/* Favicon et icônes */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Thème et couleurs */}
      <meta name="theme-color" content="#6366f1" />
      <meta name="msapplication-TileColor" content="#6366f1" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Données structurées JSON-LD */}
      {jsonLdSchema && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLdSchema, null, 2)}
        </script>
      )}

      {/* Préchargement des ressources critiques */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS Prefetch pour les domaines externes */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
    </Helmet>
  )
}

export default SEOHead

/**
 * Hook personnalisé pour utiliser SEOHead facilement
 * @param {string} pageKey - Clé de la page
 * @param {Object} options - Options pour le SEO
 * @returns {JSX.Element} Composant SEOHead configuré
 */
export const useSEOHead = (pageKey, options = {}) => {
  const {
    customMeta = {},
    includeSchema = false,
    customSchema = null
  } = options

  return (
    <SEOHead
      pageKey={pageKey}
      customMeta={customMeta}
      includeSchema={includeSchema}
      customSchema={customSchema}
    />
  )
}

/**
 * Composant SEOHead spécialisé pour les pages de blog/articles
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.article - Données de l'article
 */
export const ArticleSEOHead = ({ article }) => {
  const customMeta = {
    title: `${article.title} - MangooTech Blog`,
    description: article.excerpt || article.description,
    keywords: article.tags?.join(', ') || '',
    type: 'article',
    url: `https://mangootech.com/blog/${article.slug}`,
    image: article.image || '/blog-default.png'
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.description,
    image: `https://mangootech.com${article.image}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'MangooTech Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'MangooTech',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mangootech.com/logo.png'
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://mangootech.com/blog/${article.slug}`
    }
  }

  return (
    <SEOHead
      pageKey="blog"
      customMeta={customMeta}
      includeSchema={true}
      customSchema={articleSchema}
    />
  )
}

/**
 * Composant SEOHead spécialisé pour les pages de service
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.service - Données du service
 */
export const ServiceSEOHead = ({ service }) => {
  const customMeta = {
    title: `${service.title} - Services MangooTech`,
    description: service.description,
    keywords: service.keywords || '',
    url: `https://mangootech.com/services/${service.slug}`,
    image: service.image || '/services-default.png'
  }

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'MangooTech',
      url: 'https://mangootech.com'
    },
    areaServed: {
      '@type': 'Country',
      name: 'France'
    },
    serviceType: service.category || 'Technology Services'
  }

  return (
    <SEOHead
      pageKey="services"
      customMeta={customMeta}
      includeSchema={true}
      customSchema={serviceSchema}
    />
  )
}