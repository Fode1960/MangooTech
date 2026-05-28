import React from 'react';

const SEOHead = ({ title, description, keywords = '', image = '', url = '' }) => {
  const siteName = 'MangooTech';
  const defaultTitle = 'MangooTech - Solutions Numériques Innovantes';
  const defaultDescription = 'Solutions technologiques modulaires pour l\'Afrique et au-delà';
  const defaultImage = 'https://mangootech.com/og-image.jpg';
  const defaultUrl = 'https://mangootech.com';

  const pageTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageImage = image || defaultImage;
  const pageUrl = url || defaultUrl;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="MangooTech" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={pageDescription} />
      <meta property="og:image" content={pageImage} />
      <meta property="og:site_name" content={siteName} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={pageUrl} />
      <meta property="twitter:title" content={pageTitle} />
      <meta property="twitter:description" content={pageDescription} />
      <meta property="twitter:image" content={pageImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
      
      {/* Robots */}
      <meta name="robots" content="index, follow" />
      
      {/* Language */}
      <meta property="og:locale" content="fr_FR" />
      <html lang="fr" />
    </>
  );
};

export default SEOHead;