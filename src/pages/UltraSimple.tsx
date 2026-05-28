// TEST DIRECT : Remplacer complètement le contenu de la page
export default function UltraSimple() {
  console.log('🚨 ULTRA SIMPLE: Component appelé - PREUVE ABSOLUE!');
  
  // Force une erreur IMMÉDIATE qui ne peut pas être manquée
  throw new Error('🚨 ERREUR CRITIQUE: UltraSimple a été appelé! Cette erreur prouve que React Router fonctionne!');
  
  return null;
}