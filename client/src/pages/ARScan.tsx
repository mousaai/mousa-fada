import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Smartphone, Upload, Scan, CheckCircle, ArrowRight,
  Building2, Ruler, Layers, Loader2, Copy, ExternalLink,
  Wifi, QrCode, Info
} from "lucide-react";
import { Link } from "wouter";

import { useLanguage } from "@/contexts/LanguageContext";

const SCAN_STEPS = [
  { icon: "📱", title: "حمّل أداة م. سارة Measure", desc: "تطبيق iOS مستقل يستخدم LiDAR لمسح الفضاء بدقة ±1 سم" },
  { icon: "🏠", title: "امسح الغرفة", desc: "حرّك الهاتف ببطء حول الغرفة — التطبيق يبني نموذج ثلاثي الأبعاد تلقائياً" },
  { icon: "📤", title: "أرسل البيانات", desc: "اضغط 'إرسال لم. سارة' في التطبيق — ستصل البيانات هنا فوراً" },
  { icon: "✨", title: "ابدأ التصميم", desc: "م. سارة تحلل الأبعاد وتبدأ التصميم عنصراً بعنصر بدقة هندسية كاملة" },
];

export default function ARScan() {
  const { user } = useAuth();
  const isAuthenticated = true;
  const { dir } = useLanguage();
  const [activeTab, setActiveTab] = useState<"receive" | "manual" | "history">("receive");
  const [scanId, setScanId] = useState("");
  const [manualData, setManualData] = useState({
    projectName: "",
    rooms: [{ name: "غرفة المعيشة", width: 5, length: 6, height: 3 }],
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: scans, refetch } = trpc.arScan.getUserScans.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const processScanMutation = trpc.arScan.receive.useMutation({
    onSuccess: () => {
      setIsProcessing(false);
      toast.success("تم معالجة بيانات المسح بنجاح!");
      refetch();
    },
    onError: (err: { message: string }) => {
      setIsProcessing(false);
      toast.error("خطأ: " + err.message);
    },
  });

  const handleLookupScan = () => {
    if (!scanId.trim()) { toast.error("أدخل معرّف المسح"); return; }
    setIsProcessing(true);
    processScanMutation.mutate({ scanId: scanId.trim(), rooms: [], totalArea: 0 });
  };

  const handleManualEntry = () => {
    setIsProcessing(true);
    processScanMutation.mutate({
      scanId: `manual_${Date.now()}`,
      rooms: manualData.rooms.map(r => ({ ...r, area: r.width * r.length })),
      totalArea: manualData.rooms.reduce((s, r) => s + r.width * r.length, 0),
    });
  };

  const apiEndpoint = `${window.location.origin}/api/trpc/arScan.receive`;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir={dir}>
        <Card className="p-8 text-center max-w-sm">
          <Smartphone className="w-12 h-12 mx-auto text-gold mb-4" />
          <h2 className="text-xl font-bold mb-2">مسح AR</h2>
          <p className="text-muted-foreground mb-4">يرجى تسجيل الدخول للوصول لهذه الميزة</p>
          <a href="https://www.mousa.ai">
            <Button className="btn-gold w-full">تسجيل الدخول</Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1208] to-[#2d1f0a] border-b border-gold/20 py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-gold/60 text-sm mb-3">
            <Link href="/"><span className="hover:text-gold cursor-pointer">الرئيسية</span></Link>
            <ArrowRight className="w-3 h-3" />
            <span className="text-gold">مسح AR</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
              <Scan className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gold">مسح الفضاء بالكاميرا الذكية</h1>
              <p className="text-beige/60 text-sm">استقبال بيانات أداة م. سارة Measure أو إدخال الأبعاد يدوياً</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* خطوات الاستخدام */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {SCAN_STEPS.map((step, i) => (
            <Card key={i} className="bg-gradient-to-b from-gold/5 to-transparent border-gold/20 text-center">
              <CardContent className="pt-4 pb-3">
                <div className="text-2xl mb-2">{step.icon}</div>
                <h3 className="text-xs font-bold text-gold mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* التبويبات */}
        <div className="flex gap-2 mb-4 border-b border-border pb-2">
          {[
            { id: "receive" as const, label: "استقبال من التطبيق", icon: Smartphone },
            { id: "manual" as const, label: "إدخال يدوي", icon: Ruler },
            { id: "history" as const, label: "سجل المسوحات", icon: Layers },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-gold text-black font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* محتوى التبويب: استقبال من التطبيق */}
        {activeTab === "receive" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* بيانات API */}
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-gold" />
                  نقطة API للتطبيق
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Endpoint URL</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded-lg break-all font-mono">
                      POST {apiEndpoint}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => { navigator.clipboard.writeText(apiEndpoint); toast.success("تم النسخ!"); }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">User Token</Label>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded-lg font-mono truncate">
                      {user?.openId || "—"}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => { navigator.clipboard.writeText(user?.openId || ""); toast.success("تم النسخ!"); }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
                  <div className="flex gap-1.5 mb-1">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <strong>للمطورين: بنية JSON المطلوبة</strong>
                  </div>
                  <pre className="font-mono text-xs overflow-x-auto">{`{
  "userToken": "USER_OPEN_ID",
  "scanId": "unique-scan-id",
  "rooms": [{
    "name": "غرفة المعيشة",
    "width": 5.2,
    "length": 6.8,
    "height": 2.9,
    "area": 35.36,
    "doors": [{"width":0.9,"height":2.1}],
    "windows": [{"width":1.5,"height":1.2}]
  }],
  "totalArea": 35.36,
  "scanAccuracy": 0.98
}`}</pre>
                </div>
              </CardContent>
            </Card>

            {/* البحث بمعرّف المسح */}
            <Card className="border-gold/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-gold" />
                  استرجاع مسح بالمعرّف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  بعد إرسال البيانات من تطبيق م. سارة Measure، أدخل معرّف المسح لمعالجته وبدء التصميم.
                </p>
                <div>
                  <Label htmlFor="scanId" className="text-sm mb-1 block">معرّف المسح (Scan ID)</Label>
                  <Input
                    id="scanId"
                    value={scanId}
                    onChange={(e) => setScanId(e.target.value)}
                    placeholder="مثال: scan_abc123xyz"
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleLookupScan}
                  disabled={isProcessing || !scanId.trim()}
                  className="btn-gold w-full"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Scan className="w-4 h-4 ml-2" />}
                  معالجة بيانات المسح
                </Button>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">توصيف أداة م. سارة Measure (iOS)</p>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /><span>ARKit + RoomPlan API — دقة ±1 سم</span></div>
                    <div className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /><span>يتطلب iPhone 12 Pro أو أحدث (LiDAR)</span></div>
                    <div className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /><span>يستخرج: الأبعاد، الأبواب، النوافذ، الأعمدة</span></div>
                    <div className="flex gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" /><span>يرسل البيانات مباشرة لمنصة م. سارة</span></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* محتوى التبويب: إدخال يدوي */}
        {activeTab === "manual" && (
          <Card className="border-gold/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ruler className="w-4 h-4 text-gold" />
                إدخال أبعاد الغرف يدوياً
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm mb-1 block">اسم المشروع</Label>
                <Input
                  value={manualData.projectName}
                  onChange={(e) => setManualData(prev => ({ ...prev, projectName: e.target.value }))}
                  placeholder="مثال: فيلا الرياض — الطابق الأول"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">الغرف والأبعاد</Label>
                {manualData.rooms.map((room, i) => (
                  <div key={i} className="p-3 rounded-xl border border-border bg-muted/20">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label className="text-xs text-muted-foreground mb-1 block">اسم الغرفة</Label>
                        <Input
                          value={room.name}
                          onChange={(e) => {
                            const rooms = [...manualData.rooms];
                            rooms[i] = { ...rooms[i], name: e.target.value };
                            setManualData(prev => ({ ...prev, rooms }));
                          }}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(["width", "length", "height"] as const).map((dim) => (
                          <div key={dim}>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              {dim === "width" ? "العرض" : dim === "length" ? "الطول" : "الارتفاع"} م
                            </Label>
                            <Input
                              type="number"
                              step="0.1"
                              value={room[dim]}
                              onChange={(e) => {
                                const rooms = [...manualData.rooms];
                                rooms[i] = { ...rooms[i], [dim]: parseFloat(e.target.value) || 0 };
                                setManualData(prev => ({ ...prev, rooms }));
                              }}
                              className="h-8 text-sm font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        المساحة: <strong className="text-gold">{(room.width * room.length).toFixed(1)} م²</strong>
                      </span>
                      {manualData.rooms.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs text-red-500 hover:text-red-600"
                          onClick={() => setManualData(prev => ({ ...prev, rooms: prev.rooms.filter((_, ri) => ri !== i) }))}
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => setManualData(prev => ({
                    ...prev,
                    rooms: [...prev.rooms, { name: `غرفة ${prev.rooms.length + 1}`, width: 4, length: 5, height: 3 }]
                  }))}
                >
                  + إضافة غرفة
                </Button>
              </div>

              <div className="p-3 rounded-lg bg-gold/5 border border-gold/20">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">إجمالي المساحة:</span>
                  <span className="font-bold text-gold">
                    {manualData.rooms.reduce((s, r) => s + r.width * r.length, 0).toFixed(1)} م²
                  </span>
                </div>
              </div>

              <Button
                onClick={handleManualEntry}
                disabled={isProcessing || !manualData.projectName.trim()}
                className="btn-gold w-full"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Building2 className="w-4 h-4 ml-2" />}
                إنشاء مشروع وبدء التصميم
              </Button>
            </CardContent>
          </Card>
        )}

        {/* محتوى التبويب: سجل المسوحات */}
        {activeTab === "history" && (
          <div className="space-y-3">
            {scans && scans.length > 0 ? (
              scans.map((scan, i) => {
                const scanData = scan.rooms as { rooms?: Array<{ name: string; area: number }> } | null;
                return (
                  <Card key={i} className="border-gold/20 hover:border-gold/40 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Scan className="w-4 h-4 text-gold" />
                            <span className="font-medium text-sm">{scan.scanId || "مسح بدون اسم"}</span>
                            <Badge
                              className={`text-xs ${
                                scan.status === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                                scan.status === "received" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                                scan.status === "processing" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {scan.status === "completed" ? "معالج" : scan.status === "received" ? "مستلم" : scan.status === "processing" ? "جاري" : "خطأ"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {scan.totalArea ? `${scan.totalArea} م² إجمالي` : ""}
                            {scanData?.rooms ? ` — ${scanData.rooms.length} غرفة` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(scan.createdAt).toLocaleDateString("ar-SA")}
                          </p>
                        </div>
                        {scan.projectId && (
                          <Link href={`/projects/${scan.projectId}`}>
                            <Button size="sm" variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 text-xs">
                              <ExternalLink className="w-3 h-3 ml-1" />
                              عرض المشروع
                            </Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-16">
                <Scan className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground mb-2">لا توجد مسوحات بعد</p>
                <p className="text-sm text-muted-foreground">استخدم أداة م. سارة Measure أو أدخل الأبعاد يدوياً</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
