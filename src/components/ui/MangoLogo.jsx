import React from 'react'

const MangoLogo = ({ className = "w-12 h-12", ...props }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="mangoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFA726" />
          <stop offset="100%" stopColor="#FF6F00" />
        </linearGradient>
        <linearGradient id="leafGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#66BB6A" />
          <stop offset="100%" stopColor="#2E7D32" />
        </linearGradient>
        <linearGradient id="leafGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#81C784" />
          <stop offset="100%" stopColor="#388E3C" />
        </linearGradient>
      </defs>
      
      {/* Cercle de fond vert */}
      <circle cx="100" cy="100" r="95" fill="#1B5E20" />
      
      {/* Forme de mangue principale */}
      <ellipse cx="100" cy="120" rx="45" ry="55" fill="url(#mangoGradient)" transform="rotate(-15 100 120)" />
      
      {/* Feuille 1 */}
      <path d="M85 45 Q70 30 85 15 Q100 25 95 40 Q90 50 85 45" fill="url(#leafGradient1)" />
      
      {/* Feuille 2 */}
      <path d="M115 35 Q130 20 145 35 Q140 50 125 45 Q110 40 115 35" fill="url(#leafGradient2)" />
      
      {/* Reflet sur la mangue */}
      <ellipse cx="85" cy="100" rx="15" ry="25" fill="#FFE082" opacity="0.6" transform="rotate(-15 85 100)" />
    </svg>
  )
}

export default MangoLogo