/**
 * Utilitaires pour la gestion des rooms Live Shopping
 * Génération d'IDs, validation, et helpers
 */

/**
 * Génère un ID de room unique basé sur le timestamp et un suffixe
 * Format: "live-YYYYMMDD-HHMMSS-XXXX"
 */
export const generateRoomId = (vendorName?: string): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  
  const baseId = `live-${date}-${time}-${random}`;
  
  if (vendorName) {
    // Nettoyer le nom du vendeur (enlever espaces et caractères spéciaux)
    const cleanName = vendorName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever accents
      .replace(/[^a-zA-Z0-9]/g, '') // Enlever caractères spéciaux
      .toLowerCase()
      .slice(0, 20); // Limiter la longueur
    
    return `${cleanName}-${baseId}`;
  }
  
  return baseId;
};

/**
 * Génère un ID de session court et mémorisable
 * Format: "MOT-ADJECTIF-CHIFFRE" (ex: "ELEGANT-ANKARA-2024")
 */
export const generateMemorableRoomId = (): string => {
  const mots = [
    'ANKARA', 'WAX', 'TRADITION', 'ARTISAN', 'BOUGOU',
    'SENEGAL', 'MALI', 'COTE', 'IVOIRE', 'AFRIQUE',
    'PERLES', 'TISSU', 'MODE', 'ELEGANT', 'STYLÉ'
  ];
  
  const adjectifs = [
    'MAGNIFIQUE', 'SUBLIME', 'ÉLÉGANT', 'TRADITIONNEL', 'AUTENTIQUE',
    'BEAU', 'SUPERBE', 'EXCEPTIONNEL', 'MERVEILLEUX', 'FABULEUX'
  ];
  
  const mot = mots[Math.floor(Math.random() * mots.length)];
  const adjectif = adjectifs[Math.floor(Math.random() * adjectifs.length)];
  const annee = new Date().getFullYear();
  
  return `${adjectif}-${mot}-${annee}`;
};

/**
 * Valide un ID de room
 */
export const isValidRoomId = (roomId: string): boolean => {
  // Pattern pour les IDs générés
  const patterns = [
    /^live-\d{8}-\d{6}-[A-Z0-9]{4}$/, // Format timestamp
    /^[a-z0-9]{1,20}-live-\d{8}-\d{6}-[A-Z0-9]{4}$/, // Avec nom vendeur
    /^[A-Z]+-[A-Z]+-\d{4}$/ // Format mémorisable
  ];
  
  return patterns.some(pattern => pattern.test(roomId));
};

/**
 * Crée une room à partir d'une session live
 */
export interface LiveSession {
  id: number;
  title: string;
  vendor: string;
  vendorId: string;
  product?: string;
  scheduledTime?: Date;
}

export const createRoomFromSession = (session: LiveSession): string => {
  // Priorité : utiliser un ID mémorisable pour les sessions planifiées
  if (session.scheduledTime) {
    return generateMemorableRoomId();
  }
  
  // Pour les sessions spontanées, utiliser le nom du vendeur
  return generateRoomId(session.vendor);
};

/**
 * Gestionnaire de rooms actives
 */
export class RoomManager {
  private activeRooms: Map<string, RoomInfo> = new Map();
  
  addRoom(roomId: string, info: RoomInfo): void {
    this.activeRooms.set(roomId, {
      ...info,
      createdAt: new Date(),
      isActive: true
    });
  }
  
  removeRoom(roomId: string): void {
    this.activeRooms.delete(roomId);
  }
  
  getRoom(roomId: string): RoomInfo | undefined {
    return this.activeRooms.get(roomId);
  }
  
  getActiveRooms(): RoomInfo[] {
    return Array.from(this.activeRooms.values())
      .filter(room => room.isActive)
      .sort((a, b) => b.viewers - a.viewers); // Trier par nombre de viewers
  }
  
  updateRoomViewers(roomId: string, viewers: number): void {
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.viewers = viewers;
      room.lastActivity = new Date();
    }
  }
  
  getRoomCount(): number {
    return this.activeRooms.size;
  }
}

export interface RoomInfo {
  roomId: string;
  title: string;
  vendor: string;
  vendorId: string;
  viewers: number;
  currentProduct?: string;
  isActive: boolean;
  createdAt: Date;
  lastActivity?: Date;
  tags?: string[];
  category?: string;
}

// Instance singleton pour l'application
export const roomManager = new RoomManager();