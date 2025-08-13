import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Composant qui fait défiler la page vers le haut lors des changements de route
 */
const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    // Faire défiler vers le haut de la page
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    })
  }, [pathname])

  return null
}

export default ScrollToTop