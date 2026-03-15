import { useState, useCallback } from "react";
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
  Lamp, Package, RefreshCw, SlidersHorizontal, X
} from "lucide-react";

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
  { id: "", label: "جميع المنتجات", icon: Package, keywords: "" },
  { id: "sofa", label: "أرائك وكنب", icon: Sofa, keywords: "sofa" },
  { id: "bed", label: "أسرة وغرف نوم", icon: Bed, keywords: "bed" },
  { id: "dining", label: "طاولات وكراسي طعام", icon: UtensilsCrossed, keywords: "dining" },
  { id: "coffee", label: "طاولات قهوة", icon: Home, keywords: "coffee table" },
  { id: "wardrobe", label: "خزائن ملابس", icon: Package, keywords: "wardrobe" },
  { id: "lighting", label: "إضاءة وثريات", icon: Lamp, keywords: "lamp" },
  { id: "mirror", label: "مرايا وديكور", icon: Star, keywords: "mirror" },
  { id: "console", label: "طاولات كونسول", icon: Home, keywords: "console" },
];

// ===== مكون بطاقة المنتج =====
function ProductCard({ product, onViewDetails }: { product: BonyanProduct; onViewDetails: (p: BonyanProduct) => void }) {
  const price = parseFloat(product.price);
  const priceFormatted = price.toLocaleString("ar-AE", { minimumFractionDigits: 0 });

  return (
    <Card
      className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border border-amber-100 hover:border-amber-300 bg-white"
      onClick={() => onViewDetails(product)}
    >
      <div className="relative overflow-hidden bg-gray-50 aspect-square">
        <img
          src={product.imageUrl}
          alt={product.nameAr || product.nameEn}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://placehold.co/400x400/f5f0e8/c9a96e?text=صورة+غير+متاحة";
          }}
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-amber-500 text-white text-xs px-2 py-0.5">
            {product.sourceName || product.brand}
          </Badge>
        </div>
      </div>
      <CardContent className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-1 text-right leading-relaxed">
          {product.nameAr || product.nameEn}
        </h3>
        <p className="text-xs text-gray-500 text-right mb-2">{product.brand}</p>
        {product.material && (
          <p className="text-xs text-gray-400 text-right mb-2 line-clamp-1">{product.material}</p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50 px-2 py-1 h-7"
            onClick={(e) => { e.stopPropagation(); onViewDetails(product); }}
          >
            التفاصيل
          </Button>
          <div className="text-right">
            <span className="text-lg font-bold text-amber-700">{priceFormatted}</span>
            <span className="text-xs text-gray-500 mr-1">{product.currency}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== مكون تفاصيل المنتج =====
function ProductModal({ product, onClose }: { product: BonyanProduct; onClose: () => void }) {
  const price = parseFloat(product.price);
  const priceFormatted = price.toLocaleString("ar-AE", { minimumFractionDigits: 0 });
  const bonyanUrl = `https://bonyanpltf-gegfwhcg.manus.space/products/${product.slug || product.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* صورة المنتج */}
        <div className="relative bg-gray-50 aspect-video">
          <img
            src={product.imageUrl}
            alt={product.nameAr || product.nameEn}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://placehold.co/600x400/f5f0e8/c9a96e?text=صورة+غير+متاحة";
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-white/90 rounded-full p-1.5 hover:bg-white transition-colors shadow"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <Badge className="absolute top-3 right-3 bg-amber-500 text-white">
            {product.sourceName || product.brand}
          </Badge>
        </div>

        {/* تفاصيل المنتج */}
        <div className="p-5" dir="rtl">
          <h2 className="text-xl font-bold text-gray-800 mb-1">{product.nameAr || product.nameEn}</h2>
          <p className="text-gray-500 text-sm mb-4">{product.brand}</p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {product.material && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">المادة</p>
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

          {/* السعر والزر */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4">
            <a
              href={bonyanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              عرض في بنيان
            </a>
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

// ===== الصفحة الرئيسية =====
export default function FurnitureStore() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BonyanProduct | null>(null);

  // جلب المنتجات
  const { data, isLoading, refetch } = trpc.bonyan.searchProducts.useQuery({
    search: activeSearch || selectedCategory || undefined,
    page: currentPage,
    limit: 12,
    sortBy,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
  });

  const handleSearch = useCallback(() => {
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  }, [searchQuery]);

  const handleCategorySelect = useCallback((categoryId: string, keywords: string) => {
    setSelectedCategory(keywords);
    setActiveSearch(keywords);
    setCurrentPage(1);
  }, []);

  const totalPages = data ? Math.ceil(data.total / 12) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-stone-50" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-6 h-6" />
                متجر الأثاث المحلي
              </h1>
              <p className="text-amber-200 text-sm mt-0.5">
                أثاث حقيقي من متاجر الإمارات — مدعوم من منصة بنيان
              </p>
            </div>
          </div>

          {/* شريط البحث */}
          <div className="flex gap-2">
            <Button
              onClick={handleSearch}
              className="bg-white text-amber-800 hover:bg-amber-50 px-5 font-medium shrink-0"
            >
              <Search className="w-4 h-4 ml-1" />
              بحث
            </Button>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ابحث عن أثاث، طاولات، كنب..."
              className="bg-white/20 border-white/30 text-white placeholder:text-amber-200 text-right flex-1"
            />
          </div>
        </div>
      </div>

      {/* تصنيفات سريعة */}
      <div className="bg-white border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.keywords;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat.id, cat.keywords)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-amber-600 text-white shadow-md"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* شريط الأدوات */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <SlidersHorizontal className="w-4 h-4 ml-1" />
              فلاتر
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { refetch(); }}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <span className="text-sm text-gray-500">
                {data.total.toLocaleString("ar-AE")} منتج
              </span>
            )}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-36 border-amber-200 text-sm h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="price_asc">السعر: الأقل أولاً</SelectItem>
                <SelectItem value="price_desc">السعر: الأعلى أولاً</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* لوحة الفلاتر */}
        {showFilters && (
          <div className="bg-white border border-amber-100 rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-600" />
                تصفية النتائج
              </h3>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">
                  {priceRange[0].toLocaleString()} — {priceRange[1].toLocaleString()} درهم
                </span>
                <label className="text-sm font-medium text-gray-700">نطاق السعر</label>
              </div>
              <Slider
                min={0}
                max={10000}
                step={100}
                value={priceRange}
                onValueChange={(v) => setPriceRange(v as [number, number])}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* شبكة المنتجات */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-amber-100 animate-pulse">
                <div className="aspect-square bg-amber-50" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-amber-50 rounded" />
                  <div className="h-3 bg-amber-50 rounded w-2/3" />
                  <div className="h-6 bg-amber-50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items && data.items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product as BonyanProduct}
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>

            {/* ترقيم الصفحات */}
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
            <p className="text-gray-500 mb-4">جرّب كلمة بحث مختلفة أو تصنيفاً آخر</p>
            <Button
              onClick={() => { setActiveSearch(""); setSelectedCategory(""); setCurrentPage(1); }}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              عرض جميع المنتجات
            </Button>
          </div>
        )}
      </div>

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
              href="https://bonyanpltf-gegfwhcg.manus.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline hover:text-amber-100"
            >
              منصة بنيان
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
