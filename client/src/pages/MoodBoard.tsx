import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Palette, Download, Share2, RefreshCw, ArrowRight, Loader2, Image as ImageIcon } from "lucide-react";
import { Link } from "wouter";


const DESIGN_STYLES = [
  { value: "gulf", label: "خليجي عربي أصيل", emoji: "🕌" },
  { value: "modern", label: "عصري حديث", emoji: "🏙️" },
  { value: "classic", label: "كلاسيكي فاخر", emoji: "🏛️" },
  { value: "minimal", label: "مينيمال بسيط", emoji: "◻️" },
  { value: "japanese", label: "ياباني زن", emoji: "🎋" },
  { value: "scandinavian", label: "سكندنافي", emoji: "🌿" },
  { value: "moroccan", label: "مغربي", emoji: "🌙" },
  { value: "art_deco", label: "آرت ديكو", emoji: "✨" },
  { value: "mediterranean", label: "متوسطي", emoji: "🌊" },
  { value: "luxury", label: "فاخر بريميوم", emoji: "💎" },
];

const SPACE_TYPES = [
  { value: "living_room", label: "غرفة المعيشة" },
  { value: "bedroom", label: "غرفة النوم" },
  { value: "kitchen", label: "المطبخ" },
  { value: "dining_room", label: "غرفة الطعام" },
  { value: "office", label: "مكتب منزلي" },
  { value: "bathroom", label: "الحمام" },
  { value: "entrance", label: "المدخل" },
  { value: "majlis", label: "المجلس" },
];

const COLOR_PALETTES: Record<string, { name: string; colors: string[]; description: string }[]> = {
  gulf: [
    { name: "ذهبي ملكي", colors: ["#B8860B", "#D4AF37", "#8B6914", "#F5DEB3", "#2C1810"], description: "ألوان الذهب والعود" },
    { name: "أزرق فيروزي", colors: ["#1B4F72", "#2E86AB", "#A8DADC", "#F1FAEE", "#E63946"], description: "ألوان البحر والسماء" },
    { name: "أخضر زمردي", colors: ["#1B4332", "#2D6A4F", "#74C69D", "#D8F3DC", "#B7E4C7"], description: "ألوان الطبيعة العربية" },
  ],
  modern: [
    { name: "رمادي أنيق", colors: ["#2D3436", "#636E72", "#B2BEC3", "#DFE6E9", "#FFFFFF"], description: "بساطة وأناقة" },
    { name: "أبيض دافئ", colors: ["#FAFAFA", "#F0EBE3", "#E8DDD0", "#D4C4B0", "#8B7355"], description: "نقاء وهدوء" },
    { name: "أزرق ليلي", colors: ["#0A0E27", "#1A237E", "#3F51B5", "#90CAF9", "#E3F2FD"], description: "عمق وتطور" },
  ],
  japanese: [
    { name: "وابي-سابي", colors: ["#F5F0E8", "#E8DDD0", "#C4A882", "#8B7355", "#4A3728"], description: "جمال النقص" },
    { name: "ساكورا", colors: ["#FFB7C5", "#FF8FAB", "#C9184A", "#590D22", "#FFFFFF"], description: "أزهار الكرز" },
    { name: "بامبو", colors: ["#606C38", "#283618", "#FEFAE0", "#DDA15E", "#BC6C25"], description: "طبيعة يابانية" },
  ],
};

interface MoodBoardItem {
  type: "color" | "material" | "furniture" | "pattern" | "lighting";
  title: string;
  description: string;
  color?: string;
  imageUrl?: string;
  tags: string[];
}

export default function MoodBoard() {
  const { } = useAuth();
  const isAuthenticated = true;
  const [selectedStyle, setSelectedStyle] = useState("gulf");
  const [selectedSpace, setSelectedSpace] = useState("living_room");
  const [customNotes, setCustomNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [moodBoardData, setMoodBoardData] = useState<{
    palette: { name: string; colors: string[]; description: string } | null;
    items: MoodBoardItem[];
    styleDescription: string;
    generatedImages: string[];
  } | null>(null);

  const generateMoodBoardMutation = trpc.moodboard.generate.useMutation({
    onSuccess: (data) => {
      setMoodBoardData(data as typeof moodBoardData);
      setIsGenerating(false);
      toast.success("تم توليد لوحة الإلهام بنجاح!");
    },
    onError: (err) => {
      setIsGenerating(false);
      toast.error("خطأ في توليد لوحة الإلهام: " + err.message);
    },
  });

  const handleGenerate = () => {
    if (!isAuthenticated) {
      window.location.href = "https://www.mousa.ai";
      return;
    }
    setIsGenerating(true);
    generateMoodBoardMutation.mutate({
      designStyle: selectedStyle,
      spaceType: selectedSpace,
      customNotes,
    });
  };

  const selectedStyleInfo = DESIGN_STYLES.find(s => s.value === selectedStyle);
  const localPalettes = COLOR_PALETTES[selectedStyle] || COLOR_PALETTES.modern;

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #1a1208 0%, #2d1f0a 50%, #1a1208 100%)" }}>
      {/* شريط التنقل */}
      <nav className="border-b border-gold/20 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gold hover:text-gold/80 transition-colors">
            <ArrowRight className="w-4 h-4" />
            <span className="text-sm font-medium">العودة للرئيسية</span>
          </Link>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-gold" />
            <span className="text-gold font-bold text-sm">لوحة الإلهام</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* العنوان */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-2 mb-4">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-gold text-sm">مولّدة بالذكاء الاصطناعي</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-3">لوحة الإلهام التصميمية</h1>
          <p className="text-beige/70 max-w-xl mx-auto">
            اختر نمط التصميم والفضاء، وستقوم م. سارة بتوليد لوحة إلهام احترافية تضم الألوان والمواد والأثاث المناسب
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* لوحة الإعدادات */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-black/40 border-gold/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-gold text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  إعدادات اللوحة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* نمط التصميم */}
                <div>
                  <label className="text-beige/80 text-sm mb-2 block">نمط التصميم</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DESIGN_STYLES.slice(0, 6).map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setSelectedStyle(style.value)}
                        className={`p-2 rounded-lg border text-xs text-right transition-all ${
                          selectedStyle === style.value
                            ? "border-gold bg-gold/20 text-gold"
                            : "border-gold/20 bg-black/30 text-beige/70 hover:border-gold/40"
                        }`}
                      >
                        <span className="block text-base mb-0.5">{style.emoji}</span>
                        {style.label}
                      </button>
                    ))}
                  </div>
                  <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                    <SelectTrigger className="mt-2 bg-black/30 border-gold/20 text-beige text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1208] border-gold/20">
                      {DESIGN_STYLES.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-beige">
                          {s.emoji} {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* نوع الفضاء */}
                <div>
                  <label className="text-beige/80 text-sm mb-2 block">نوع الفضاء</label>
                  <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                    <SelectTrigger className="bg-black/30 border-gold/20 text-beige text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1208] border-gold/20">
                      {SPACE_TYPES.map(s => (
                        <SelectItem key={s.value} value={s.value} className="text-beige">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* ملاحظات إضافية */}
                <div>
                  <label className="text-beige/80 text-sm mb-2 block">ملاحظات خاصة (اختياري)</label>
                  <Textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="مثال: أفضل الألوان الدافئة، لدي أطفال صغار، المساحة ضيقة..."
                    className="bg-black/30 border-gold/20 text-beige placeholder:text-beige/30 text-sm resize-none"
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gold hover:bg-gold/90 text-black font-bold"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      م. سارة تصمم لوحتك...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      توليد لوحة الإلهام
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* لوحات الألوان المحلية */}
            <Card className="bg-black/40 border-gold/20 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-gold text-sm">لوحات ألوان {selectedStyleInfo?.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {localPalettes.map((palette, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-black/30 border border-gold/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-beige text-xs font-medium">{palette.name}</span>
                      <span className="text-beige/50 text-xs">{palette.description}</span>
                    </div>
                    <div className="flex gap-1">
                      {palette.colors.map((color, ci) => (
                        <div
                          key={ci}
                          className="flex-1 h-8 rounded cursor-pointer hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* لوحة الإلهام الرئيسية */}
          <div className="lg:col-span-2">
            {!moodBoardData && !isGenerating ? (
              <div className="h-full min-h-96 flex flex-col items-center justify-center border border-dashed border-gold/20 rounded-2xl bg-black/20">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-10 h-10 text-gold/50" />
                  </div>
                  <h3 className="text-gold/70 text-lg font-medium mb-2">لوحة الإلهام في انتظارك</h3>
                  <p className="text-beige/40 text-sm max-w-xs">
                    اختر نمط التصميم والفضاء من اليسار، ثم اضغط "توليد لوحة الإلهام" لترى إبداع م. سارة
                  </p>
                </div>
              </div>
            ) : isGenerating ? (
              <div className="h-full min-h-96 flex flex-col items-center justify-center border border-gold/20 rounded-2xl bg-black/20">
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Sparkles className="w-10 h-10 text-gold" />
                  </div>
                  <h3 className="text-gold text-lg font-medium mb-2">م. سارة تصمم لوحتك...</h3>
                  <p className="text-beige/60 text-sm">تحليل النمط، اختيار الألوان، تنسيق العناصر</p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            ) : moodBoardData && (
              <div className="space-y-4">
                {/* رأس اللوحة */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-gold font-bold text-lg">
                      {selectedStyleInfo?.emoji} لوحة إلهام {selectedStyleInfo?.label}
                    </h2>
                    <p className="text-beige/60 text-sm">{moodBoardData.styleDescription}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 text-xs" onClick={handleGenerate}>
                      <RefreshCw className="w-3 h-3 ml-1" />
                      إعادة توليد
                    </Button>
                    <Button size="sm" className="bg-gold hover:bg-gold/90 text-black text-xs">
                      <Download className="w-3 h-3 ml-1" />
                      تنزيل
                    </Button>
                  </div>
                </div>

                {/* لوحة الألوان */}
                {moodBoardData.palette && (
                  <Card className="bg-black/40 border-gold/20">
                    <CardContent className="p-4">
                      <h3 className="text-gold text-sm font-medium mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        لوحة الألوان — {moodBoardData.palette.name}
                      </h3>
                      <div className="flex gap-2 mb-2">
                        {moodBoardData.palette.colors.map((color, i) => (
                          <div key={i} className="flex-1 group relative">
                            <div
                              className="h-16 rounded-lg cursor-pointer transition-transform hover:scale-105 shadow-lg"
                              style={{ backgroundColor: color }}
                            />
                            <span className="block text-center text-xs text-beige/60 mt-1 font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-beige/50 text-xs">{moodBoardData.palette.description}</p>
                    </CardContent>
                  </Card>
                )}

                {/* عناصر اللوحة */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {moodBoardData.items.map((item, idx) => (
                    <Card key={idx} className="bg-black/40 border-gold/20 overflow-hidden group hover:border-gold/40 transition-colors">
                      <CardContent className="p-0">
                        {/* معاينة العنصر */}
                        <div
                          className="h-28 flex items-center justify-center relative overflow-hidden"
                          style={{
                            background: item.color
                              ? `linear-gradient(135deg, ${item.color}40, ${item.color}80)`
                              : "linear-gradient(135deg, #2d1f0a, #1a1208)",
                          }}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          ) : item.color ? (
                            <div className="w-16 h-16 rounded-full shadow-lg" style={{ backgroundColor: item.color }} />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-gold/30" />
                          )}
                          <Badge className="absolute top-2 right-2 bg-black/60 text-gold border-gold/30 text-xs">
                            {item.type === "color" ? "لون" :
                              item.type === "material" ? "مادة" :
                              item.type === "furniture" ? "أثاث" :
                              item.type === "pattern" ? "نمط" : "إضاءة"}
                          </Badge>
                        </div>
                        <div className="p-3">
                          <h4 className="text-beige text-xs font-medium mb-1">{item.title}</h4>
                          <p className="text-beige/50 text-xs leading-relaxed">{item.description}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 2).map((tag, ti) => (
                              <Badge key={ti} className="bg-gold/10 text-gold/70 border-gold/20 text-xs px-1.5 py-0">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* الصور المولّدة */}
                {moodBoardData.generatedImages && moodBoardData.generatedImages.length > 0 && (
                  <Card className="bg-black/40 border-gold/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gold text-sm">صور تصورية مولّدة بالذكاء الاصطناعي</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {moodBoardData.generatedImages.map((url, i) => (
                          <div key={i} className="rounded-lg overflow-hidden aspect-video bg-black/30">
                            <img src={url} alt={`تصور ${i + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* أزرار المشاركة */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/10 text-xs">
                    <Share2 className="w-3 h-3 ml-1" />
                    مشاركة اللوحة
                  </Button>
                  <Button size="sm" className="bg-gold hover:bg-gold/90 text-black text-xs">
                    <Download className="w-3 h-3 ml-1" />
                    تنزيل PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
