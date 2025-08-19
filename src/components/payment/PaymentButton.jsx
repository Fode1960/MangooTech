import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const PaymentButton = ({ 
  pack, 
  currentPack = null, 
  changeType = 'new', 
  className = '' 
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  const getButtonText = () => {
    if (loading) return 'Traitement...'
    
    switch (changeType) {
      case 'upgrade':
        return `Passer à ${pack.name}`
      case 'downgrade':
        return `Rétrograder vers ${pack.name}`
      case 'new':
      default:
        return pack.price === 0 
          ? 'Choisir ce pack' 
          : `Payer ${pack.price.toLocaleString()} FCFA`
    }
  }

  const handlePayment = async () => {
    if (!user) {
      alert('Veuillez vous connecter pour effectuer un paiement')
      return
    }

    // Validation des prix
    if (changeType === 'upgrade' && currentPack && pack.price <= currentPack.price) {
      alert('Erreur: Le pack sélectionné n\'est pas un upgrade valide')
      return
    }

    if (changeType === 'downgrade' && currentPack && pack.price >= currentPack.price) {
      alert('Erreur: Le pack sélectionné n\'est pas un downgrade valide')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.functions.invoke('change-pack-with-payment', {
        body: {
          newPackId: pack.id,
          changeType,
          successUrl: `${window.location.origin}/dashboard?success=true&pack=${pack.id}`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`,
        },
      })
    
      if (error) {
        console.error('Erreur API:', error)
        throw new Error(error.message || 'Erreur lors du changement de pack')
      }
    
      if (data.direct_migration) {
        // Migration directe réussie (downgrade vers gratuit)
        alert('Pack changé avec succès !')
        window.location.href = `/dashboard?success=true&pack=${pack.id}`
        return
      }
    
      if (data.url) {
        // Redirection vers Stripe
        window.location.href = data.url
      } else {
        throw new Error('URL de paiement non reçue')
      }
    } catch (error) {
      console.error('Erreur lors du changement de pack:', error)
      setError(error.message)
      alert(`Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      {error && (
        <div className="text-red-600 text-sm mb-2">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded transition-colors"
      >
        {getButtonText()}
      </button>
    </div>
  )
}

export default PaymentButton