/**
 * guestDesignsMigration.ts — دوال مساعدة لنقل تصاميم الزائر
 * مستخدمة من useMousaAuth.ts عند تسجيل الدخول
 */

const STORAGE_KEY = "fada_guest_designs";

export interface GuestDesignForMigration {
  id: string;
  savedAt: number;
  primaryImageUrl?: string;
  spaceType?: string;
  styleLabel?: string;
  ideas: Array<{
    id: string;
    title: string;
    description: string;
    style: string;
    imageUrl?: string;
    palette?: Array<{ name: string; hex: string }>;
    materials?: string[];
    totalCost?: number;
  }>;
  budgetLevel?: string;
  roomDimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
}

/**
 * تحميل التصاميم المحفوظة للنقل
 */
export function loadGuestDesignsForMigration(): GuestDesignForMigration[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * مسح التصاميم المحلية بعد النقل الناجح
 */
export function clearGuestDesignsAfterMigration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
