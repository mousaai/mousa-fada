import React, { useState, useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "wouter";
import {
  Search, ShoppingBag, Filter, ArrowRight, Star, ExternalLink,
  ChevronLeft, ChevronRight, Home, Sofa, Bed, UtensilsCrossed,
  Lamp, Package, RefreshCw, SlidersHorizontal, X, Check,
  Palette, Layers, Ruler, Building2, TreePine, Sparkles
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

// ===== بناء رابط المورد الأصلي =====
function buildStoreUrl(product: BonyanProduct): string | null {
  const source = (product.sourceName || product.brand || "").toLowerCase();
  const nameEn = (product.nameEn || "").trim();
  const nameQuery = encodeURIComponent(nameEn);

  if (source.includes("ikea")) {
    // IKEA UAE - البحث بالاسم مباشرة
    return `https://www.ikea.com/ae/en/search/?q=${nameQuery}`;
  }
  if (source.includes("danube")) {
    return `https://www.danubehome.com/ae/en/search?q=${nameQuery}`;
  }
  if (source.includes("pan home") || source.includes("panhome")) {
    return `https://panhome.com/search?q=${nameQuery}`;
  }
  if (source.includes("indigo")) {
    return `https://www.indigoliving.com/uae/en/search?q=${nameQuery}`;
  }
  if (source.includes("bloomr")) {
    return `https://www.bloomr.ae/search?q=${nameQuery}`;
  }
  if (source.includes("loom")) {
    return `https://www.loomcollection.com/search?q=${nameQuery}`;
  }
  if (source.includes("furn")) {
    return `https://www.furn.com/ae/search?q=${nameQuery}`;
  }
  if (source.includes("home centre") || source.includes("homecentre")) {
    return `https://www.homecentre.com/ae/en/search?q=${nameQuery}`;
  }
  if (source.includes("2xl")) {
    return `https://www.2xlhome.com/search?q=${nameQuery}`;
  }
  if (source.includes("marina home")) {
    return `https://www.marinahome.com/search?q=${nameQuery}`;
  }
  if (source.includes("pottery barn")) {
    return `https://www.potterybarn.ae/search/results.html?words=${nameQuery}`;
  }
  if (source.includes("west elm")) {
    return `https://www.westelm.ae/search/results.html?words=${nameQuery}`;
  }
  if (source.includes("the one")) {
    return `https://www.theone.com/en-ae/search?q=${nameQuery}`;
  }
  if (source.includes("homes r us")) {
    return `https://www.homesrus.com/search?q=${nameQuery}`;
  }
  if (source.includes("pinky")) {
    return `https://www.pinkyfurniture.com/search?q=${nameQuery}`;
  }
  // fallback: بحث Google
  return `https://www.google.com/search?q=${encodeURIComponent(nameEn + " " + (product.sourceName || product.brand || "") + " UAE price")}`;
}

// ===== أنواع البيانات =====
interface BonyanProduct {
  id: number;
  nameEn: string;
  nameAr: string;
  slug: string;
  price: string;
  currency: string;
  imageUrl: string;
  brand: string;
  material: string | null;
  color: string | null;
  sourceName: string;
  categoryId: number;
  width: number | null;
  height: number | null;
  depth: number | null;
  dimensionUnit: string;
}

// ===== تصنيفات الأثاث =====
const CATEGORIES = [
  { id: "", label: "الكل", icon: Package, keywords: "" },
  { id: "sofa", label: "أرائك وكنب", icon: Sofa, keywords: "sofa" },
  { id: "bed", label: "أسرة", icon: Bed, keywords: "bed" },
  { id: "dining", label: "طاولات طعام", icon: UtensilsCrossed, keywords: "dining" },
  { id: "coffee", label: "طاولات قهوة", icon: Home, keywords: "coffee table" },
  { id: "wardrobe", label: "خزائن", icon: Package, keywords: "wardrobe" },
  { id: "lighting", label: "إضاءة", icon: Lamp, keywords: "lamp" },
  { id: "mirror", label: "مرايا", icon: Star, keywords: "mirror" },
  { id: "console", label: "كونسول", icon: Home, keywords: "console" },
  { id: "outdoor", label: "خارجي", icon: TreePine, keywords: "outdoor" },
  { id: "office", label: "مكتبي", icon: Building2, keywords: "desk" },
];

// ===== فلاتر نمط التصميم =====
const DESIGN_STYLES = [
  { id: "modern", label: "عصري", icon: "✦", keywords: "modern contemporary" },
  { id: "classic", label: "كلاسيكي", icon: "⚜", keywords: "classic traditional" },
  { id: "gulf", label: "خليجي", icon: "🕌", keywords: "arabic oriental" },
  { id: "minimal", label: "مينيمال", icon: "◻", keywords: "minimal simple" },
  { id: "bohemian", label: "بوهيمي", icon: "✿", keywords: "boho rattan natural" },
  { id: "industrial", label: "صناعي", icon: "⚙", keywords: "industrial metal" },
  { id: "scandinavian", label: "سكندنافي", icon: "❄", keywords: "scandinavian nordic" },
  { id: "luxury", label: "فاخر", icon: "♛", keywords: "luxury velvet gold" },
];

// ===== فلاتر الخامة =====
const MATERIALS = [
  { id: "wood", label: "خشب", color: "#8B6914", keywords: "wood wooden" },
  { id: "velvet", label: "مخمل", color: "#6B21A8", keywords: "velvet" },
  { id: "leather", label: "جلد", color: "#92400E", keywords: "leather" },
  { id: "linen", label: "كتان/قماش", color: "#A8A29E", keywords: "linen fabric" },
  { id: "metal", label: "معدن", color: "#6B7280", keywords: "metal steel iron" },
  { id: "marble", label: "رخام", color: "#E5E7EB", keywords: "marble stone" },
  { id: "glass", label: "زجاج", color: "#BAE6FD", keywords: "glass" },
  { id: "rattan", label: "راتان/خوص", color: "#D97706", keywords: "rattan wicker" },
  { id: "acrylic", label: "أكريليك", color: "#F0ABFC", keywords: "acrylic plastic" },
];

// ===== فلاتر اللون =====
const COLOR_PALETTES = [
  { id: "neutral", label: "محايدة", colors: ["#F5F0E8", "#E8D9C0", "#C4A882", "#8B7355"], keywords: "beige cream ivory white" },
  { id: "warm", label: "دافئة", colors: ["#FEF3C7", "#FDE68A", "#F59E0B", "#B45309"], keywords: "warm brown orange terracotta" },
  { id: "cool", label: "باردة", colors: ["#EFF6FF", "#BFDBFE", "#3B82F6", "#1D4ED8"], keywords: "blue grey cool" },
  { id: "dark", label: "داكنة", colors: ["#1F2937", "#374151", "#4B5563", "#6B7280"], keywords: "dark black charcoal" },
  { id: "green", label: "أخضر طبيعي", colors: ["#ECFDF5", "#A7F3D0", "#34D399", "#065F46"], keywords: "green sage olive" },
  { id: "pink", label: "وردي/بودر", colors: ["#FDF2F8", "#FBCFE8", "#F472B6", "#BE185D"], keywords: "pink rose blush" },
  { id: "gold", label: "ذهبي/نحاسي", colors: ["#FFFBEB", "#FDE68A", "#D97706", "#92400E"], keywords: "gold brass copper" },
  { id: "white", label: "أبيض نقي", colors: ["#FFFFFF", "#F9FAFB", "#F3F4F6", "#E5E7EB"], keywords: "white light" },
];

// ===== فلاتر الغرفة =====
const ROOM_TYPES: { id: string; label: string; icon: React.ElementType | string; keywords: string }[] = [
  { id: "living", label: "صالة معيشة", icon: Sofa, keywords: "sofa coffee table tv unit" },
  { id: "bedroom", label: "غرفة نوم", icon: Bed, keywords: "bed wardrobe dresser" },
  { id: "majlis", label: "مجلس", icon: "🕌", keywords: "majlis arabic seating" },
  { id: "dining", label: "غرفة طعام", icon: UtensilsCrossed, keywords: "dining table chairs" },
  { id: "office", label: "مكتب", icon: Building2, keywords: "desk office chair bookshelf" },
  { id: "outdoor", label: "خارجي", icon: TreePine, keywords: "outdoor garden patio" },
];

// ===== فلاتر الميزانية =====
const BUDGET_RANGES = [
  { id: "economy", label: "اقتصادي", range: [0, 500] as [number, number], desc: "أقل من 500 درهم" },
  { id: "mid", label: "متوسط", range: [500, 2000] as [number, number], desc: "500 — 2,000 درهم" },
  { id: "premium", label: "فاخر", range: [2000, 5000] as [number, number], desc: "2,000 — 5,000 درهم" },
  { id: "luxury", label: "راقي", range: [5000, 50000] as [number, number], desc: "أكثر من 5,000 درهم" },
];

// ===== فلاتر الحجم =====
const SIZE_FILTERS = [
  { id: "small", label: "صغير", desc: "مناسب للمساحات الصغيرة", maxDim: 100 },
  { id: "medium", label: "متوسط", desc: "مناسب للمساحات المتوسطة", maxDim: 200 },
  { id: "large", label: "كبير", desc: "مناسب للمساحات الكبيرة", maxDim: 999 },
];

// ===== دالة مساعدة لفحص صحة رابط الصورة =====
function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // استبعاد صور lazy loading الوهمية من Pan Home وغيرها
  if (url.includes('lazy.png') || url.includes('placeholder') || url.includes('no-image')) return false;
  // استبعاد الروابط القصيرة جداً
  if (url.length < 20) return false;
  return url.startsWith('http');
}

// ===== بناء رابط الـ proxy للصور =====
function getProxiedImageUrl(imageUrl: string): string {
  if (!isValidImageUrl(imageUrl)) return "";
  return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
}

// ===== مكون صورة المنتج مع fallback ذكي =====
function ProductImage({ imageUrl, name, sourceName }: { imageUrl: string; name: string; sourceName: string }) {
  const proxiedUrl = isValidImageUrl(imageUrl) ? getProxiedImageUrl(imageUrl) : null;
  const [imgSrc, setImgSrc] = React.useState<string | null>(proxiedUrl);
  const [triedDirect, setTriedDirect] = React.useState(false);

  // نص placeholder يعرض اسم المنتج
  const shortName = name.split(' ').slice(0, 3).join(' ');

  const handleError = () => {
    // إذا فشل الـ proxy، جرب الرابط المباشر
    if (!triedDirect && isValidImageUrl(imageUrl)) {
      setTriedDirect(true);
      setImgSrc(imageUrl);
    } else {
      setImgSrc(null);
    }
  };

  return imgSrc ? (
    <img
      src={imgSrc}
      alt={name}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
      onError={handleError}
    />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-stone-100 p-3">
      <div className="text-4xl mb-2 opacity-40">🛋️</div>
      <p className="text-xs text-center text-amber-800/70 font-medium leading-tight line-clamp-3">{shortName}</p>
      <p className="text-[10px] text-amber-600/50 mt-1">{sourceName}</p>
    </div>
  );
}

// ===== لوغوهات الشركات =====
const SOURCE_LOGOS: Record<string, { logo: string; bg: string; text: string }> = {
  "IKEA UAE":              { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Ikea_logo.svg/200px-Ikea_logo.svg.png", bg: "#0058A3", text: "#FFDA1A" },
  "Danube Home":           { logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Danube_Home_logo.svg/200px-Danube_Home_logo.svg.png", bg: "#E31837", text: "#fff" },
  "Pan Home":              { logo: "https://www.panhome.com/media/logo/stores/1/pan-home-logo.png", bg: "#1a1a1a", text: "#fff" },
  "2XL Home":              { logo: "https://www.2xlhome.com/skin/frontend/2xl/default/images/logo.png", bg: "#F97316", text: "#fff" },
  "Indigo Living UAE":     { logo: "https://www.indigoliving.com/skin/frontend/indigo/default/images/logo.png", bg: "#4338CA", text: "#fff" },
  "Loom Collection UAE":   { logo: "https://loomcollection.com/cdn/shop/files/Loom_logo_black.png", bg: "#7C3AED", text: "#fff" },
  "Bloomr UAE":            { logo: "https://bloomr.ae/cdn/shop/files/bloomr-logo.png", bg: "#0D9488", text: "#fff" },
  "Furn.com UAE":          { logo: "https://www.furn.com/skin/frontend/furn/default/images/logo.png", bg: "#059669", text: "#fff" },
  "The Design House Dubai":{ logo: "https://thedesignhouse.ae/wp-content/uploads/2020/01/TDH-Logo.png", bg: "#BE185D", text: "#fff" },
  "Pinky Furniture UAE":   { logo: "https://pinkyfurniture.com/wp-content/uploads/2021/01/pinky-logo.png", bg: "#EC4899", text: "#fff" },
  "Home Centre":           { logo: "https://www.homecentre.com/medias/HC-Logo.png", bg: "#DC2626", text: "#fff" },
  "Marina Home":           { logo: "https://www.marinahome.com/skin/frontend/marinahome/default/images/logo.png", bg: "#1E40AF", text: "#fff" },
  "Pottery Barn UAE":      { logo: "https://www.potterybarn.ae/img/logo.png", bg: "#92400E", text: "#fff" },
  "West Elm UAE":          { logo: "https://www.westelm.ae/img/logo.png", bg: "#1F2937", text: "#fff" },
  "Homes R Us":            { logo: "https://www.homesrus.com/media/logo/stores/1/logo.png", bg: "#065F46", text: "#fff" },
};

// مكون لوغو الشركة
function SourceLogo({ sourceName, size = "sm" }: { sourceName: string; size?: "sm" | "md" | "lg" }) {
  const info = SOURCE_LOGOS[sourceName];
  const sizeClass = size === "sm" ? "h-5 max-w-[52px]" : size === "md" ? "h-7 max-w-[80px]" : "h-9 max-w-[110px]";
  const [logoFailed, setLogoFailed] = React.useState(false);

  // اسم مختصر للعرض
  const shortName = sourceName
    .replace(" UAE", "")
    .replace(" Home", "")
    .replace(" Collection", "")
    .replace(" Living", "")
    .replace(" Furniture", "")
    .replace(" Dubai", "")
    .trim();

  if (info && !logoFailed) {
    return (
      <div
        className="flex items-center justify-center rounded px-1.5 py-0.5"
        style={{ backgroundColor: info.bg }}
      >
        <img
          src={info.logo}
          alt={sourceName}
          className={`${sizeClass} object-contain`}
          onError={() => setLogoFailed(true)}
        />
      </div>
    );
  }

  // fallback: نص ملون
  const bgColor = info?.bg || "#D97706";
  return (
    <div
      className={`flex items-center justify-center rounded px-2 py-0.5 text-white font-bold ${size === "sm" ? "text-[9px]" : size === "md" ? "text-xs" : "text-sm"}`}
      style={{ backgroundColor: bgColor }}
    >
      {shortName}
    </div>
  );
}

// ===== مكون بطاقة المنتج =====
// موردون موثوقون بصور حقيقية 100%
const TRUSTED_SOURCE_LABELS: Record<string, { emoji: string; color: string }> = {
  "Furn.com UAE": { emoji: "🏆", color: "bg-emerald-600" },
  "Loom Collection UAE": { emoji: "🏆", color: "bg-purple-600" },
  "Indigo Living UAE": { emoji: "🏆", color: "bg-indigo-600" },
  "Bloomr UAE": { emoji: "🏆", color: "bg-teal-600" },
  "Danube Home": { emoji: "⭐", color: "bg-emerald-500" },
  "IKEA UAE": { emoji: "⭐", color: "bg-blue-600" },
  "The Design House Dubai": { emoji: "⭐", color: "bg-rose-500" },
  "Pinky Furniture UAE": { emoji: "✔️", color: "bg-pink-500" },
  "2XL Home": { emoji: "✔️", color: "bg-orange-500" },
};

function ProductCard({ product, onViewDetails }: { product: BonyanProduct; onViewDetails: (p: BonyanProduct) => void }) {
  const price = parseFloat(product.price);
  const priceFormatted = price.toLocaleString("ar-AE", { minimumFractionDigits: 0 });
  const sourceName = product.sourceName || product.brand || "";
  const trustedInfo = TRUSTED_SOURCE_LABELS[sourceName];
  const hasImg = isValidImageUrl(product.imageUrl);
  // عرض الاسم العربي إذا توفر وإلا الإنجليزي
  const displayName = product.nameAr && product.nameAr.trim() ? product.nameAr : product.nameEn;

  return (
    <Card
      className="group overflow-hidden cursor-pointer hover:shadow-lg active:scale-[0.98] transition-all duration-200 border border-amber-100 hover:border-amber-300 bg-white rounded-xl"
      onClick={() => onViewDetails(product)}
    >
      {/* صورة المنتج - مربعة للموبايل */}
      <div className="relative overflow-hidden bg-stone-50 aspect-square">
        <ProductImage
          imageUrl={product.imageUrl}
          name={displayName}
          sourceName={sourceName}
        />
        {/* لوغو المورد */}
        <div className="absolute top-1.5 right-1.5 shadow-md rounded">
          <SourceLogo sourceName={sourceName} size="sm" />
        </div>
        {/* مؤشر الصورة الحقيقية */}
        {hasImg && (
          <div className="absolute top-1.5 left-1.5">
            <div className="bg-green-500/90 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
              📸
            </div>
          </div>
        )}
      </div>
      <CardContent className="p-2.5">
        <h3 className="font-medium text-gray-800 text-xs line-clamp-2 mb-1.5 text-right leading-relaxed" style={{ minHeight: '2.2rem' }}>
          {displayName}
        </h3>
        <div className="flex items-center justify-between mb-2">
          <button
            className="text-[10px] border border-amber-300 text-amber-700 bg-transparent hover:bg-amber-50 px-2 py-1 rounded-lg transition-colors"
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
          >
            تفاصيل
          </button>
          <div className="text-right">
            <span className="text-sm font-bold text-amber-700">{priceFormatted}</span>
            <span className="text-[9px] text-gray-400 mr-0.5">{product.currency}</span>
          </div>
        </div>
        {/* زر المتجر الأصلي */}
        {(() => {
          const storeUrl = buildStoreUrl(product);
          return storeUrl ? (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1 w-full bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-[10px] font-medium py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              شراء من {sourceName.split(" ")[0]}
            </a>
          ) : null;
        })()}
      </CardContent>
    </Card>
  );
}

// ===== مكون تفاصيل المنتج =====
function ProductModal({ product, onClose }: { product: BonyanProduct; onClose: () => void }) {
  const { dir } = useLanguage();
  const price = parseFloat(product.price);
  const priceFormatted = price.toLocaleString("ar-AE", { minimumFractionDigits: 0 });
  const bonyanUrl = `https://bonyan.mousa.ai/products/${product.slug || product.id}`;
  const storeUrl = buildStoreUrl(product);
  const sourceName = product.sourceName || product.brand || "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gray-50 aspect-video">
          <ProductImage
            imageUrl={product.imageUrl}
            name={product.nameAr || product.nameEn}
            sourceName={product.sourceName || product.brand}
          />
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-white/90 rounded-full p-1.5 hover:bg-white transition-colors shadow"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <div className="absolute top-3 right-3 shadow-md rounded">
            <SourceLogo sourceName={product.sourceName || product.brand || ""} size="md" />
          </div>
        </div>
        <div className="p-5" dir={dir}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-800 flex-1">{product.nameAr || product.nameEn}</h2>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <SourceLogo sourceName={product.sourceName || product.brand || ""} size="lg" />
            <p className="text-gray-500 text-sm">{product.sourceName || product.brand}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {product.material && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">الخامة</p>
                <p className="text-sm font-medium text-gray-800">{product.material}</p>
              </div>
            )}
            {product.color && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">اللون</p>
                <p className="text-sm font-medium text-gray-800">{product.color}</p>
              </div>
            )}
            {(product.width || product.height || product.depth) && (
              <div className="bg-amber-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500 mb-1">الأبعاد</p>
                <p className="text-sm font-medium text-gray-800">
                  {[
                    product.width && `العرض: ${product.width}${product.dimensionUnit}`,
                    product.height && `الارتفاع: ${product.height}${product.dimensionUnit}`,
                    product.depth && `العمق: ${product.depth}${product.dimensionUnit}`,
                  ].filter(Boolean).join(" | ")}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4">
            <div className="flex flex-col gap-2">
              {/* زر المتجر الأصلي - الأولوية الأولى */}
              {storeUrl && (
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  عرض في {sourceName || "المتجر"}
                </a>
              )}
              {/* زر بنيان - ثانوي */}
              <a
                href={bonyanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                عرض في بنيان
              </a>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">السعر</p>
              <p className="text-2xl font-bold text-amber-700">
                {priceFormatted} <span className="text-sm font-normal">{product.currency}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== مكون لوحة الفلاتر المتقدمة =====
interface AdvancedFilters {
  designStyle: string;
  material: string;
  colorPalette: string;
  roomType: string;
  budgetRange: string;
  sizeFilter: string;
  minPrice: number;
  maxPrice: number;
}

function AdvancedFilterPanel({
  filters,
  onChange,
  onClose,
  onApply,
  onReset,
}: {
  filters: AdvancedFilters;
  onChange: (key: keyof AdvancedFilters, value: string | number) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}) {
  const { dir } = useLanguage();
  return (
    <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose}>
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* رأس اللوحة */}
        <div className="sticky top-0 bg-white border-b border-amber-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
          <button
            onClick={onReset}
            className="text-sm text-amber-600 font-medium"
          >
            إعادة تعيين
          </button>
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-amber-600" />
            فلاتر متقدمة
          </h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-6">

          {/* 1. نمط التصميم */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              نمط التصميم
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {DESIGN_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => onChange("designStyle", filters.designStyle === style.id ? "" : style.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                    filters.designStyle === style.id
                      ? "border-amber-500 bg-amber-50 shadow-sm"
                      : "border-gray-100 hover:border-amber-200"
                  }`}
                >
                  <span className="text-xl">{style.icon}</span>
                  <span className="text-[10px] font-medium text-gray-700 leading-tight">{style.label}</span>
                  {filters.designStyle === style.id && (
                    <Check className="w-3 h-3 text-amber-600" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 2. الخامة */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              الخامة والمادة
            </h3>
            <div className="flex flex-wrap gap-2">
              {MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => onChange("material", filters.material === mat.id ? "" : mat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm transition-all ${
                    filters.material === mat.id
                      ? "border-amber-500 bg-amber-50 font-semibold"
                      : "border-gray-200 hover:border-amber-300"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: mat.color }}
                  />
                  {mat.label}
                </button>
              ))}
            </div>
          </section>

          {/* 3. لوحة الألوان */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-600" />
              لوحة الألوان
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {COLOR_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  onClick={() => onChange("colorPalette", filters.colorPalette === palette.id ? "" : palette.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                    filters.colorPalette === palette.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-100 hover:border-amber-200"
                  }`}
                >
                  <div className="flex gap-0.5 shrink-0">
                    {palette.colors.map((c, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-sm border border-gray-200"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-700">{palette.label}</span>
                  {filters.colorPalette === palette.id && (
                    <Check className="w-3 h-3 text-amber-600 mr-auto" />
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 4. الغرفة */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4 text-amber-600" />
              نوع الغرفة
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {ROOM_TYPES.map((room) => {
                const isStringIcon = typeof room.icon === "string";
                const IconComp = isStringIcon ? null : (room.icon as React.ElementType);
                return (
                  <button
                    key={room.id}
                    onClick={() => onChange("roomType", filters.roomType === room.id ? "" : room.id)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      filters.roomType === room.id
                        ? "border-amber-500 bg-amber-50"
                        : "border-gray-100 hover:border-amber-200"
                    }`}
                  >
                    {isStringIcon ? (
                      <span className="text-xl">{room.icon as string}</span>
                    ) : IconComp ? (
                      <IconComp className="w-5 h-5 text-amber-600" />
                    ) : null}
                    <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">{room.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 5. الميزانية */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-amber-600 font-bold text-base">د.إ</span>
              الميزانية
            </h3>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {BUDGET_RANGES.map((budget) => (
                <button
                  key={budget.id}
                  onClick={() => {
                    if (filters.budgetRange === budget.id) {
                      onChange("budgetRange", "");
                      onChange("minPrice", 0);
                      onChange("maxPrice", 50000);
                    } else {
                      onChange("budgetRange", budget.id);
                      onChange("minPrice", budget.range[0]);
                      onChange("maxPrice", budget.range[1]);
                    }
                  }}
                  className={`p-3 rounded-xl border-2 text-right transition-all ${
                    filters.budgetRange === budget.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-100 hover:border-amber-200"
                  }`}
                >
                  <p className="font-bold text-gray-800 text-sm">{budget.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{budget.desc}</p>
                </button>
              ))}
            </div>
            {/* شريط تخصيص السعر */}
            <div className="bg-amber-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-amber-700 font-medium">
                  {filters.minPrice.toLocaleString()} — {filters.maxPrice.toLocaleString()} درهم
                </span>
                <span className="text-xs text-gray-500">تخصيص</span>
              </div>
              <Slider
                min={0}
                max={50000}
                step={500}
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={(v) => {
                  onChange("minPrice", v[0]);
                  onChange("maxPrice", v[1]);
                  onChange("budgetRange", "custom");
                }}
                className="w-full"
              />
            </div>
          </section>

          {/* 6. الحجم */}
          <section>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Ruler className="w-4 h-4 text-amber-600" />
              الحجم
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {SIZE_FILTERS.map((size) => (
                <button
                  key={size.id}
                  onClick={() => onChange("sizeFilter", filters.sizeFilter === size.id ? "" : size.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    filters.sizeFilter === size.id
                      ? "border-amber-500 bg-amber-50"
                      : "border-gray-100 hover:border-amber-200"
                  }`}
                >
                  <p className="font-bold text-gray-800 text-sm">{size.label}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{size.desc}</p>
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* زر التطبيق */}
        <div className="sticky bottom-0 bg-white border-t border-amber-100 px-5 py-4">
          <Button
            onClick={onApply}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl text-base font-bold"
          >
            عرض النتائج
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== الصفحة الرئيسية =====
const DEFAULT_FILTERS: AdvancedFilters = {
  designStyle: "",
  material: "",
  colorPalette: "",
  roomType: "",
  budgetRange: "",
  sizeFilter: "",
  minPrice: 0,
  maxPrice: 50000,
};

export default function FurnitureStore() {
  const { t, dir } = useLanguage();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "relevance">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BonyanProduct | null>(null);

  // فلاتر متقدمة — pending (قبل التطبيق) وapplied (بعد الضغط على "عرض النتائج")
  const [pendingFilters, setPendingFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);

  // تحويل الفلاتر المطبّقة إلى صيغة smartFilter
  const smartFilterInput = useMemo(() => {
    // تحديد التصنيف: من البحث النصي أو التصنيف السريع
    const categoryKeyword = selectedCategory || activeSearch || undefined;

    // نمط التصميم
    const designStyles = appliedFilters.designStyle ? [appliedFilters.designStyle] : undefined;

    // الخامة
    const materials = appliedFilters.material ? [appliedFilters.material] : undefined;

    // اللون — نحوّل palette id إلى كلمات ألوان
    const COLOR_PALETTE_TO_COLORS: Record<string, string[]> = {
      neutral: ["beige", "cream", "white"],
      warm: ["warm", "brown"],
      cool: ["cool", "blue", "grey"],
      dark: ["dark", "black"],
      green: ["green"],
      pink: ["pink"],
      gold: ["gold"],
      white: ["white"],
    };
    const colors = appliedFilters.colorPalette
      ? (COLOR_PALETTE_TO_COLORS[appliedFilters.colorPalette] || [appliedFilters.colorPalette])
      : undefined;

    // نطاق السعر
    const priceRange = appliedFilters.budgetRange as "economy" | "mid" | "premium" | "luxury" | undefined || undefined;

    // الحجم
    const size = appliedFilters.sizeFilter as "small" | "medium" | "large" | undefined || undefined;

    // ترتيب — smartFilter يدعم relevance/price_asc/price_desc/newest
    const sortByMapped: "relevance" | "price_asc" | "price_desc" | "newest" =
      sortBy === "newest" ? "newest" :
      sortBy === "price_asc" ? "price_asc" :
      sortBy === "price_desc" ? "price_desc" : "relevance";

    return {
      category: categoryKeyword,
      designStyles,
      materials,
      colors,
      priceRange,
      size,
      sortBy: sortByMapped,
      page: currentPage,
      pageSize: 20,
    };
  }, [activeSearch, selectedCategory, appliedFilters, sortBy, currentPage]);

  // جلب المنتجات عبر smartFilter
  const { data, isLoading, refetch } = trpc.bonyan.smartFilter.useQuery(smartFilterInput);

  const handleSearch = useCallback(() => {
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCategorySelect = useCallback((categoryId: string, keywords: string) => {
    setSelectedCategory(keywords);
    setActiveSearch(keywords);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key: keyof AdvancedFilters, value: string | number) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(pendingFilters);
    setCurrentPage(1);
    setShowAdvancedFilters(false);
  }, [pendingFilters]);

  const handleResetFilters = useCallback(() => {
    setPendingFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  }, []);

  // حساب عدد الفلاتر النشطة
  const activeFilterCount = useMemo(() => {
    return [
      appliedFilters.designStyle,
      appliedFilters.material,
      appliedFilters.colorPalette,
      appliedFilters.roomType,
      appliedFilters.budgetRange,
      appliedFilters.sizeFilter,
    ].filter(Boolean).length;
  }, [appliedFilters]);

  // بناء tags الفلاتر النشطة
  const activeFilterTags = useMemo(() => {
    const tags: { label: string; key: keyof AdvancedFilters }[] = [];
    if (appliedFilters.designStyle) {
      const s = DESIGN_STYLES.find(x => x.id === appliedFilters.designStyle);
      if (s) tags.push({ label: `نمط: ${s.label}`, key: "designStyle" });
    }
    if (appliedFilters.material) {
      const m = MATERIALS.find(x => x.id === appliedFilters.material);
      if (m) tags.push({ label: `خامة: ${m.label}`, key: "material" });
    }
    if (appliedFilters.colorPalette) {
      const c = COLOR_PALETTES.find(x => x.id === appliedFilters.colorPalette);
      if (c) tags.push({ label: `لون: ${c.label}`, key: "colorPalette" });
    }
    if (appliedFilters.roomType) {
      const r = ROOM_TYPES.find(x => x.id === appliedFilters.roomType);
      if (r) tags.push({ label: `غرفة: ${r.label}`, key: "roomType" });
    }
    if (appliedFilters.budgetRange && appliedFilters.budgetRange !== "custom") {
      const b = BUDGET_RANGES.find(x => x.id === appliedFilters.budgetRange);
      if (b) tags.push({ label: `ميزانية: ${b.label}`, key: "budgetRange" });
    }
    if (appliedFilters.sizeFilter) {
      const sz = SIZE_FILTERS.find(x => x.id === appliedFilters.sizeFilter);
      if (sz) tags.push({ label: `حجم: ${sz.label}`, key: "sizeFilter" });
    }
    return tags;
  }, [appliedFilters]);

  const removeFilterTag = useCallback((key: keyof AdvancedFilters) => {
    const updated = { ...appliedFilters, [key]: "" };
    if (key === "budgetRange") { updated.minPrice = 0; updated.maxPrice = 50000; }
    setAppliedFilters(updated);
    setPendingFilters(updated);
    setCurrentPage(1);
  }, [appliedFilters]);

  const totalPages = data ? Math.ceil(data.total / (data.pageSize || 20)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50" dir={dir}>
      {/* رأس الصفحة - محسّن للموبايل */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-3 py-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => navigate("/")}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold flex items-center gap-1.5 truncate">
                <ShoppingBag className="w-5 h-5 shrink-0" />
                متجر الأثاث المحلي
                <span className="text-[10px] font-bold bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full shrink-0">تجريبي</span>
              </h1>
              <p className="text-amber-200 text-xs">
                مدعوم من منصة بنيان
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ابحث عن أثاث..."
              className="bg-white/20 border-white/30 text-white placeholder:text-amber-200 text-right flex-1 h-9 text-sm"
            />
            <Button
              onClick={handleSearch}
              className="bg-white text-amber-800 hover:bg-amber-50 px-3 font-medium shrink-0 h-9"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Beta Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2.5 flex items-center gap-2">
        <span className="text-base">🧪</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-yellow-800">هذه الخاصية تجريبية حالياً</p>
          <p className="text-[10px] text-yellow-700/80">ستكون متاحة بشكل كامل ومحسّن قريباً — نعتذر عن أي نقص في التجربة</p>
        </div>
      </div>

      {/* تصنيفات سريعة - محسّنة للموبايل */}
      <div className="bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-2">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.keywords;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id, cat.keywords)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "bg-amber-600 text-white shadow-md"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-3">
        {/* شريط الأدوات - محسّن للموبايل */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setPendingFilters(appliedFilters); setShowAdvancedFilters(true); }}
              className={`border-amber-300 text-amber-700 hover:bg-amber-50 relative h-8 px-2.5 text-xs ${
                activeFilterCount > 0 ? "bg-amber-50 border-amber-500" : ""
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 ml-1" />
              فلاتر
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 h-8 w-8 p-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-gray-400 hover:text-red-500 h-8 w-8 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs text-gray-400">
                {data.total.toLocaleString("ar-AE")}
              </span>
            )}
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as typeof sortBy); setCurrentPage(1); }}>
              <SelectTrigger className="w-28 border-amber-200 text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="relevance">الأصلة</SelectItem>
                <SelectItem value="price_asc">سعر ↑</SelectItem>
                <SelectItem value="price_desc">سعر ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags الفلاتر النشطة */}
        {activeFilterTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilterTags.map((tag) => (
              <button
                key={tag.key}
                onClick={() => removeFilterTag(tag.key)}
                className="flex items-center gap-1 bg-amber-100 text-amber-800 text-xs px-3 py-1 rounded-full border border-amber-300 hover:bg-amber-200 transition-colors"
              >
                {tag.label}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {/* شبكة المنتجات */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-amber-100 animate-pulse shadow-sm">
                <div className="bg-gradient-to-br from-amber-50 to-stone-100" style={{ aspectRatio: '1/1' }} />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3.5 bg-amber-50 rounded" />
                  <div className="h-3.5 bg-amber-50 rounded w-3/4" />
                  <div className="flex justify-between items-center mt-2">
                    <div className="h-6 bg-amber-50 rounded w-14" />
                    <div className="h-4 bg-amber-100 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {data.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as BonyanProduct}
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="border-amber-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 px-4">
                  صفحة {currentPage} من {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="border-amber-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-amber-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">لا توجد منتجات</h3>
            <p className="text-gray-500 mb-4">جرّب تغيير الفلاتر أو كلمة البحث</p>
            <Button
              onClick={() => { setActiveSearch(""); setSelectedCategory(""); handleResetFilters(); }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              عرض جميع المنتجات
            </Button>
          </div>
        )}
      </div>

      {/* لوحة الفلاتر المتقدمة */}
      {showAdvancedFilters && (
        <AdvancedFilterPanel
          filters={pendingFilters}
          onChange={handleFilterChange}
          onClose={() => setShowAdvancedFilters(false)}
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
        />
      )}

      {/* نافذة تفاصيل المنتج */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* شريط المعلومات */}
      <div className="bg-amber-800 text-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-amber-200 text-sm">
            🏪 جميع المنتجات من متاجر حقيقية في الإمارات العربية المتحدة — مدعوم من{" "}
            <a
              href="https://bonyan.mousa.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline"
            >
              منصة بنيان
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
