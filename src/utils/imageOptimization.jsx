/**
 * Utilitaires pour l'optimisation des images
 */

/**
 * Configuration des tailles d'images responsives
 */
export const imageSizes = {
  thumbnail: { width: 150, height: 150 },
  small: { width: 300, height: 200 },
  medium: { width: 600, height: 400 },
  large: { width: 1200, height: 800 },
  hero: { width: 1920, height: 1080 },
  avatar: { width: 100, height: 100 },
  logo: { width: 200, height: 60 }
}

/**
 * Formats d'images supportés par ordre de préférence
 */
export const imageFormats = ['webp', 'avif', 'jpg', 'png']

/**
 * Génère les URLs d'images optimisées pour différentes tailles
 * @param {string} baseUrl - URL de base de l'image
 * @param {string} alt - Texte alternatif
 * @param {Array} sizes - Tailles à générer
 * @returns {Object} Objet contenant les URLs et attributs
 */
export const generateResponsiveImageUrls = (baseUrl, alt, sizes = ['small', 'medium', 'large']) => {
  const srcSet = sizes.map(size => {
    const { width } = imageSizes[size]
    return `${baseUrl}?w=${width}&q=80 ${width}w`
  }).join(', ')

  const defaultSize = sizes[Math.floor(sizes.length / 2)] || 'medium'
  const { width, height } = imageSizes[defaultSize]

  return {
    src: `${baseUrl}?w=${width}&q=80`,
    srcSet,
    sizes: generateSizesAttribute(sizes),
    alt,
    width,
    height,
    loading: 'lazy',
    decoding: 'async'
  }
}

/**
 * Génère l'attribut sizes pour les images responsives
 * @param {Array} sizeKeys - Clés des tailles
 * @returns {string} Attribut sizes
 */
const generateSizesAttribute = (sizeKeys) => {
  const breakpoints = {
    small: '(max-width: 640px)',
    medium: '(max-width: 1024px)',
    large: '(min-width: 1025px)'
  }

  return sizeKeys.map(size => {
    const condition = breakpoints[size]
    const { width } = imageSizes[size]
    return condition ? `${condition} ${width}px` : `${width}px`
  }).join(', ')
}

/**
 * Composant Image optimisé avec lazy loading et formats modernes
 * @param {Object} props - Propriétés du composant
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  sizes = ['small', 'medium', 'large'],
  className = '',
  priority = false,
  ...props 
}) => {
  const imageProps = generateResponsiveImageUrls(src, alt, sizes)
  
  return (
    <picture className={className}>
      {/* Format WebP */}
      <source 
        srcSet={imageProps.srcSet.replace(/\.(jpg|jpeg|png)/g, '.webp')}
        sizes={imageProps.sizes}
        type="image/webp"
      />
      
      {/* Format AVIF (plus moderne) */}
      <source 
        srcSet={imageProps.srcSet.replace(/\.(jpg|jpeg|png)/g, '.avif')}
        sizes={imageProps.sizes}
        type="image/avif"
      />
      
      {/* Fallback */}
      <img
        {...imageProps}
        {...props}
        loading={priority ? 'eager' : 'lazy'}
        className="w-full h-auto"
      />
    </picture>
  )
}

/**
 * Hook pour le lazy loading des images
 * @param {Object} options - Options de configuration
 * @returns {Object} Ref et état de chargement
 */
export const useLazyImage = (options = {}) => {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [isInView, setIsInView] = React.useState(false)
  const imgRef = React.useRef(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => setIsLoaded(true)

  return {
    imgRef,
    isLoaded,
    isInView,
    handleLoad
  }
}

/**
 * Précharge les images critiques
 * @param {Array} imageUrls - URLs des images à précharger
 */
export const preloadImages = (imageUrls) => {
  imageUrls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })
}

/**
 * Génère un placeholder SVG pour les images en cours de chargement
 * @param {number} width - Largeur du placeholder
 * @param {number} height - Hauteur du placeholder
 * @param {string} color - Couleur de fond
 * @returns {string} URL du SVG en base64
 */
export const generateImagePlaceholder = (width = 400, height = 300, color = '#f3f4f6') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">
        Chargement...
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

/**
 * Compresse une image côté client
 * @param {File} file - Fichier image
 * @param {Object} options - Options de compression
 * @returns {Promise<Blob>} Image compressée
 */
export const compressImage = (file, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 800,
    quality = 0.8,
    format = 'image/jpeg'
  } = options

  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculer les nouvelles dimensions
      let { width, height } = img
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height
        height = maxHeight
      }

      // Redimensionner l'image
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      // Convertir en blob
      canvas.toBlob(resolve, format, quality)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Valide le format et la taille d'une image
 * @param {File} file - Fichier à valider
 * @param {Object} constraints - Contraintes de validation
 * @returns {Object} Résultat de la validation
 */
export const validateImage = (file, constraints = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedFormats = ['image/jpeg', 'image/png', 'image/webp'],
    minWidth = 100,
    minHeight = 100,
    maxWidth = 4000,
    maxHeight = 4000
  } = constraints

  const errors = []

  // Vérifier le type de fichier
  if (!allowedFormats.includes(file.type)) {
    errors.push(`Format non supporté. Formats acceptés: ${allowedFormats.join(', ')}`)
  }

  // Vérifier la taille du fichier
  if (file.size > maxSize) {
    errors.push(`Fichier trop volumineux. Taille maximale: ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
  }

  return new Promise((resolve) => {
    if (errors.length > 0) {
      resolve({ isValid: false, errors })
      return
    }

    const img = new Image()
    img.onload = () => {
      const { width, height } = img

      if (width < minWidth || height < minHeight) {
        errors.push(`Image trop petite. Dimensions minimales: ${minWidth}x${minHeight}px`)
      }

      if (width > maxWidth || height > maxHeight) {
        errors.push(`Image trop grande. Dimensions maximales: ${maxWidth}x${maxHeight}px`)
      }

      resolve({
        isValid: errors.length === 0,
        errors,
        dimensions: { width, height }
      })
    }

    img.onerror = () => {
      resolve({
        isValid: false,
        errors: ['Impossible de lire l\'image']
      })
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Génère des métadonnées d'image pour le SEO
 * @param {string} src - URL de l'image
 * @param {string} alt - Texte alternatif
 * @param {Object} options - Options supplémentaires
 * @returns {Object} Métadonnées structurées
 */
export const generateImageMetadata = (src, alt, options = {}) => {
  const {
    width = 1200,
    height = 630,
    type = 'image/jpeg'
  } = options

  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: src,
    width,
    height,
    encodingFormat: type,
    description: alt,
    name: alt
  }
}

export default {
  imageSizes,
  imageFormats,
  generateResponsiveImageUrls,
  OptimizedImage,
  useLazyImage,
  preloadImages,
  generateImagePlaceholder,
  compressImage,
  validateImage,
  generateImageMetadata
}