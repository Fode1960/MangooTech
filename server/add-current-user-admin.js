import { addCurrentUserAsAdminSimple } from '../services/admin/addCurrentUserAsAdmin';

export async function POST({ request }) {
  try {
    console.log('🎯 API: Ajout utilisateur actuel comme admin...');
    
    const result = await addCurrentUserAsAdminSimple();
    
    console.log('🎯 API: Résultat:', result);
    
    return new Response(
      JSON.stringify(result),
      {
        status: result.success ? 200 : 400,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    console.error('🎯 API: Erreur:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}