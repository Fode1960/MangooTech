import React from 'react'
import MangoLogo from './MangoLogo'

const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  className = '',
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  if (variant === 'mango') {
    return (
      <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
        <div className="animate-bounce">
          <MangoLogo className={sizeClasses[size]} />
        </div>
        {text && (
          <p className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
            {text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`}></div>
      {text && (
        <p className={`text-gray-600 font-medium ${textSizeClasses[size]}`}>
          {text}
        </p>
      )}
    </div>
  )
}

// Composant de spinner en pleine page
export const FullPageSpinner = ({ text = 'Chargement...' }) => {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner 
        size="xl" 
        text={text} 
        variant="mango"
        className="bg-white rounded-xl shadow-lg p-8"
      />
    </div>
  )
}

// Composant de spinner pour les boutons
export const ButtonSpinner = ({ className = '' }) => {
  return (
    <div className={`spinner w-4 h-4 border-2 border-white/30 border-t-white ${className}`}></div>
  )
}

// Composant de spinner pour les cartes
export const CardSpinner = ({ text = '' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" text={text} variant="mango" />
    </div>
  )
}

export default LoadingSpinner