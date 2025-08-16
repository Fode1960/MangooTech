import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ptrqhtwstldphjaraufi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cnFodHdzdGxkcGhqYXJhdWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MzI0OTIsImV4cCI6MjA3MDUwODQ5Mn0.Wc-dKWVMpAyFoAPFGejzhD0o1rodyEGrBlZK5X3muyA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixServicesStructure() {
  console.log('🔧 Correction de la structure de la table services...')
  
  try {
    // Vérifier la structure actuelle de la table services
    console.log('🔍 Vérification de la structure actuelle...')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(1)
    
    if (servicesError) {
      console.log('❌ Erreur lors de la vérification:', servicesError.message)
      return
    }
    
    console.log('📋 Structure actuelle de la table services:')
    if (services && services.length > 0) {
      console.log('Colonnes détectées:', Object.keys(services[0]))
    } else {
      console.log('Table services vide')
    }
    
    // Essayer d'insérer des services avec la structure actuelle (sans contrainte unique sur name)
    console.log('\n📝 Insertion des services de base...')
    
    const basicServices = [
      {
        name: 'Mini-site',
        description: 'Site web personnel vitrine',
        category: 'website',
        price: 0,
        duration: 30
      },
      {
        name: 'Mini-boutique', 
        description: 'Boutique en ligne simplifiée',
        category: 'ecommerce',
        price: 0,
        duration: 30
      },
      {
        name: 'Espace personnel',
        description: 'Interface de gestion du profil',
        category: 'profile',
        price: 0,
        duration: 30
      },
      {
        name: 'Fiche visible',
        description: 'Profil public visible',
        category: 'profile',
        price: 0,
        duration: 30
      },
      {
        name: 'Mangoo Connect+',
        description: 'Accès à la plateforme de networking',
        category: 'networking',
        price: 0,
        duration: 30
      },
      {
        name: 'Référencement Mangoo Market',
        description: 'Présence sur la marketplace',
        category: 'marketplace',
        price: 0,
        duration: 30
      },
      {
        name: 'Showroom360 simplifié',
        description: 'Présentation virtuelle basique',
        category: 'showroom',
        price: 0,
        duration: 30
      },
      {
        name: 'Mangoo Express',
        description: 'Service de livraison rapide',
        category: 'delivery',
        price: 0,
        duration: 30
      },
      {
        name: 'Référencement pro',
        description: 'SEO et visibilité avancée',
        category: 'seo',
        price: 0,
        duration: 30
      },
      {
        name: 'CRM/ERP simplifié',
        description: 'Gestion client et ressources',
        category: 'crm',
        price: 0,
        duration: 30
      },
      {
        name: 'Showroom360 complet',
        description: 'Présentation virtuelle avancée',
        category: 'showroom',
        price: 0,
        duration: 30
      },
      {
        name: 'Support personnalisé',
        description: 'Assistance dédiée',
        category: 'support',
        price: 0,
        duration: 30
      }
    ]
    
    // Vérifier d'abord quels services existent déjà
    const { data: existingServices, error: existingError } = await supabase
      .from('services')
      .select('name')
    
    if (existingError) {
      console.log('⚠️ Erreur lors de la vérification des services existants:', existingError.message)
    } else {
      const existingNames = existingServices.map(s => s.name)
      console.log('Services existants:', existingNames)
      
      // Filtrer les services qui n'existent pas encore
      const newServices = basicServices.filter(service => !existingNames.includes(service.name))
      
      if (newServices.length > 0) {
        console.log(`\n📝 Insertion de ${newServices.length} nouveaux services...`)
        
        const { data: insertData, error: insertError } = await supabase
          .from('services')
          .insert(newServices)
        
        if (insertError) {
          console.log('⚠️ Erreur lors de l\'insertion:', insertError.message)
        } else {
          console.log('✅ Nouveaux services insérés avec succès!')
        }
      } else {
        console.log('✅ Tous les services existent déjà!')
      }
    }
    
    // Vérifier le résultat final
    const { data: finalServices, error: finalError } = await supabase
      .from('services')
      .select('*')
    
    if (!finalError && finalServices) {
      console.log(`\n📊 Total des services dans la base: ${finalServices.length}`)
      finalServices.forEach(service => {
        console.log(`- ${service.name}: ${service.description} (${service.category || 'N/A'})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error)
  }
}

fixServicesStructure()