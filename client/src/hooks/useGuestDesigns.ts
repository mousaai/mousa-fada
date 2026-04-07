/**
 * useGuestDesigns.ts — حفظ تصاميم الزائر ونقلها عند التسجيل
 *
 * المشكلة: الزائر يصمم ثم يسجل → يفقد تصاميمه
 * الحل: حفظ التصاميم مؤقتاً في localStorage
 *       ونقلها للحساب تلقائياً عند تسجيل الدخول
 *
 * الاستخدام:
 * 1. بعد كل تصميم ناجح: saveGuestDesign(design)
 * 2. عند تسجيل الدخول: migrateGuestDesigns() — تنقل التصاميم للحساب
 */

import { useCallback } from "react";

const STORAGE_KEY = "fada_guest_designs";
const MAX_GUEST_DESIGNS = 5; // الحد الأقصى للتصاميم المحفوظة كزائر

// ===== أنواع البيانات =====

export interface GuestDesignIdea {
  id: string;
  title: string;
  description: string;
  style: string;
  imageUrl?: string;
  palette?: Array<{ name: string; hex: string }>;
  materials?: string[];
  totalCost?: number;
}

export interface GuestDesign {
  id: string;                    // معرف فريد
  savedAt: number;               // Unix timestamp (ms)
  primaryImageUrl?: string;      // صورة الغرفة الأصلية
  spaceType?: string;            // نوع الفضاء (غرفة معيشة، مطبخ...)
  styleLabel?: string;           // النمط المختار
  ideas: GuestDesignIdea[];      // الأفكار التصميمية
  budgetLevel?: string;          // مستوى الميزانية
  roomDimensions?: {
    length?: string;
    width?: string;
    height?: string;
  };
}

// ===== دوال localStorage =====

function loadGuestDesigns(): GuestDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveGuestDesignsToStorage(designs: GuestDesign[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  } catch (err) {
    // localStorage ممتلئ — نحذف الأقدم
    console.warn("[GuestDesigns] localStorage full, clearing old designs");
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function clearGuestDesigns(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ===== Hook الرئيسي =====

export function useGuestDesigns() {
  /**
   * حفظ تصميم جديد كزائر
   * يُستدعى بعد نجاح كل عملية تصميم
   */
  const saveGuestDesign = useCallback((design: Omit<GuestDesign, "id" | "savedAt">) => {
    const existing = loadGuestDesigns();

    const newDesign: GuestDesign = {
      ...design,
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      savedAt: Date.now(),
    };

    // إضافة التصميم الجديد في البداية
    const updated = [newDesign, ...existing].slice(0, MAX_GUEST_DESIGNS);
    saveGuestDesignsToStorage(updated);

    console.log(`[GuestDesigns] Saved design ${newDesign.id} (total: ${updated.length})`);
    return newDesign.id;
  }, []);

  /**
   * جلب جميع التصاميم المحفوظة كزائر
   */
  const getGuestDesigns = useCallback((): GuestDesign[] => {
    return loadGuestDesigns();
  }, []);

  /**
   * عدد التصاميم المحفوظة كزائر
   */
  const guestDesignsCount = loadGuestDesigns().length;

  /**
   * نقل تصاميم الزائر للحساب عبر tRPC
   * يُستدعى مباشرة بعد تسجيل الدخول
   *
   * @param saveToAccount - دالة حفظ المشروع في الحساب (من tRPC)
   */
  const migrateGuestDesigns = useCallback(async (
    saveToAccount: (design: GuestDesign) => Promise<void>
  ): Promise<{ migrated: number; failed: number }> => {
    const designs = loadGuestDesigns();

    if (designs.length === 0) {
      return { migrated: 0, failed: 0 };
    }

    console.log(`[GuestDesigns] Migrating ${designs.length} guest designs to account...`);

    let migrated = 0;
    let failed = 0;

    for (const design of designs) {
      try {
        await saveToAccount(design);
        migrated++;
      } catch (err) {
        console.error(`[GuestDesigns] Failed to migrate design ${design.id}:`, err);
        failed++;
      }
    }

    // مسح التصاميم المحلية بعد النقل الناجح
    if (migrated > 0) {
      clearGuestDesigns();
      console.log(`[GuestDesigns] ✅ Migrated ${migrated} designs, cleared local storage`);
    }

    return { migrated, failed };
  }, []);

  /**
   * مسح جميع التصاميم المحفوظة كزائر
   */
  const clearAllGuestDesigns = useCallback(() => {
    clearGuestDesigns();
  }, []);

  /**
   * التحقق من وجود تصاميم محفوظة كزائر
   */
  const hasGuestDesigns = guestDesignsCount > 0;

  return {
    saveGuestDesign,
    getGuestDesigns,
    migrateGuestDesigns,
    clearAllGuestDesigns,
    guestDesignsCount,
    hasGuestDesigns,
  };
}
