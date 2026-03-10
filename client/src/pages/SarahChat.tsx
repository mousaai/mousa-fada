import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send, Camera, Upload, FileText, Sparkles, User, Bot,
  Image as ImageIcon, X, Maximize2, ChevronDown, Home,
  Layers, Eye, DollarSign, Map, Lightbulb
} from "lucide-react";
import { Link } from "wouter";
import { Streamdown } from "streamdown";
import { getLoginUrl } from "@/const";

interface ChatMessage {
  role: string;
  content: string;
}

const SESSION_TYPES = [
  { key: "general", label: "استشارة عامة", icon: Sparkles, desc: "تحدث مع م. سارة حول أي موضوع تصميمي" },
  { key: "floor_plan", label: "تحليل مخطط", icon: Map, desc: "ارفع مخططك المعماري وسارة ستحلله" },
  { key: "camera_scan", label: "مسح بالكاميرا", icon: Camera, desc: "صوّر فضاءك وسارة ستوجهك" },
  { key: "element_design", label: "تصميم عنصر", icon: Layers, desc: "صمّم عنصراً محدداً بالتفصيل" },
];

const QUICK_PROMPTS = [
  { text: "أريد تصميم غرفة معيشة بنمط خليجي فاخر", icon: Home },
  { text: "ما هي أفضل ألوان الجدران لغرفة نوم هادئة؟", icon: Lightbulb },
  { text: "كيف أختار الأثاث المناسب لمساحة صغيرة؟", icon: Layers },
  { text: "ما تكلفة تصميم شقة 150م² بمستوى متوسط؟", icon: DollarSign },
  { text: "أريد تصميم مطبخ عصري مع جزيرة وسطية", icon: Eye },
  { text: "ما الفرق بين النمط الياباني والمينيمال؟", icon: Sparkles },
];

const CAMERA_INSTRUCTIONS = [
  { step: 1, title: "الجدار الأمامي", desc: "صوّر الجدار المقابل لك بشكل مستقيم" },
  { step: 2, title: "الجدار الأيمن", desc: "صوّر الجدار الأيمن بالكامل" },
  { step: 3, title: "الجدار الأيسر", desc: "صوّر الجدار الأيسر بالكامل" },
  { step: 4, title: "الجدار الخلفي", desc: "صوّر الجدار الخلفي خلفك" },
  { step: 5, title: "السقف", desc: "صوّر السقف بالكامل" },
  { step: 6, title: "الأرضية", desc: "صوّر الأرضية من أعلى" },
  { step: 7, title: "زوايا الغرفة", desc: "صوّر الزوايا الأربع للغرفة" },
];

export default function SarahChat() {
  const { isAuthenticated } = useAuth();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showCameraGuide, setShowCameraGuide] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [showSessionTypes, setShowSessionTypes] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: projects } = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const sendMutation = trpc.chat.send.useMutation();
  const uploadMutation = trpc.upload.image.useMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // رسالة ترحيب تلقائية عند اختيار نوع الجلسة
  useEffect(() => {
    if (!showSessionTypes && messages.length === 0) {
      const welcomeMessages: Record<string, string> = {
        general: `مرحباً! أنا م. سارة، مهندسة التصميم الداخلي والمعماري. 🌟

أنا هنا لمساعدتك في كل ما يتعلق بالتصميم الداخلي — من اختيار الألوان والمواد، إلى تصميم الفضاءات الكاملة بأنماط عالمية متنوعة.

كيف يمكنني مساعدتك اليوم؟`,
        floor_plan: `مرحباً! أنا م. سارة. 📐

سأساعدك في تحليل مخططك المعماري بشكل احترافي.

**ما أحتاجه منك:**
1. ارفع صورة المخطط (PDF أو صورة)
2. أخبرني عن نوع المشروع (فيلا، شقة، مكتب...)
3. ما هو النمط الذي تريده؟

ابدأ برفع المخطط وسأحلله فوراً! 🏗️`,
        camera_scan: `مرحباً! أنا م. سارة. 📸

سأوجهك لتصوير فضاءك بالطريقة الصحيحة حتى أتمكن من تقديم توصيات دقيقة.

**خطوات التصوير:**
1. قف في منتصف الغرفة
2. صوّر كل جدار على حدة
3. صوّر السقف والأرضية
4. صوّر الزوايا

هل أنت جاهز للبدء؟ صوّر الجدار الأمامي أولاً! 📷`,
        element_design: `مرحباً! أنا م. سارة. ✨

سأساعدك في تصميم عنصر معماري محدد بمواصفات احترافية كاملة.

**أخبرني:**
- ما العنصر الذي تريد تصميمه؟ (أرضية، جدران، سقف، نوافذ...)
- في أي غرفة؟
- ما المساحة؟
- ما النمط المطلوب؟
- ما ميزانيتك؟

لنبدأ! 🎨`,
      };
      const welcome = welcomeMessages[sessionType] || welcomeMessages.general;
      setMessages([{ role: "assistant", content: welcome }]);
    }
  }, [showSessionTypes, sessionType, messages.length]);

  const handleFileUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({ base64, mimeType: file.type });
        setAttachedImage(result.url);
        setAttachedImagePreview(ev.target?.result as string);
        toast.success("تم رفع الصورة");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("فشل رفع الصورة");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() && !attachedImage) return;
    if (isSending) return;

    const userMessage = input.trim();
    const imageUrl = attachedImage;

    setMessages(prev => [...prev, {
      role: "user",
      content: imageUrl ? `📸 [صورة مرفقة]\n${userMessage}` : userMessage
    }]);
    setInput("");
    setAttachedImage(null);
    setAttachedImagePreview(null);
    setIsSending(true);

    try {
      const result = await sendMutation.mutateAsync({
        sessionId: sessionId ?? undefined,
        projectId: selectedProjectId ?? undefined,
        message: userMessage,
        sessionType: sessionType as "general" | "floor_plan" | "camera_scan" | "element_design",
        imageUrl: imageUrl ?? undefined,
        projectContext: selectedProjectId
          ? `المشروع: ${projects?.find(p => p.id === selectedProjectId)?.name}`
          : undefined,
      });

      if (!sessionId && result.sessionId) {
        setSessionId(result.sessionId);
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.reply as string
      }]);
    } catch (err) {
      toast.error("حدث خطأ في الإرسال");
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-gold" />
          </div>
          <h2 className="text-2xl font-bold mb-2">م. سارة</h2>
          <p className="text-muted-foreground mb-6">يرجى تسجيل الدخول للتحدث مع م. سارة</p>
          <a href={getLoginUrl()}>
            <Button className="btn-gold w-full">تسجيل الدخول</Button>
          </a>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#8B6914] to-[#C9A84C] text-white py-4 px-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold">م. سارة</h1>
              <p className="text-xs text-white/70">خبيرة التصميم الداخلي والمعماري</p>
            </div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-2 items-center">
            {projects && projects.length > 0 && (
              <Select
                value={selectedProjectId?.toString() || "none"}
                onValueChange={(v) => setSelectedProjectId(v === "none" ? null : Number(v))}
              >
                <SelectTrigger className="bg-white/10 border-white/30 text-white w-36 h-8 text-xs">
                  <SelectValue placeholder="ربط بمشروع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون مشروع</SelectItem>
                  {(projects as Array<{ id: number; name: string }>).map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Home className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* اختيار نوع الجلسة */}
      {showSessionTypes && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-gold to-[#C9A84C] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">مرحباً! أنا م. سارة</h2>
              <p className="text-muted-foreground">خبيرة التصميم الداخلي والمعماري بالذكاء الاصطناعي</p>
              <p className="text-sm text-muted-foreground mt-1">كيف يمكنني مساعدتك اليوم؟</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {SESSION_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.key}
                    onClick={() => {
                      setSessionType(type.key);
                      setShowSessionTypes(false);
                      if (type.key === "camera_scan") setShowCameraGuide(true);
                    }}
                    className={`p-4 rounded-2xl border-2 text-right transition-all hover:scale-105 hover:shadow-md ${
                      sessionType === type.key
                        ? "border-gold bg-gold/10"
                        : "border-border hover:border-gold/40 bg-card"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gold/10 rounded-xl">
                        <Icon className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{type.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">أو ابدأ بسؤال سريع:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.slice(0, 3).map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(p.text);
                      setShowSessionTypes(false);
                    }}
                    className="text-xs bg-muted/60 hover:bg-gold/10 hover:text-gold border border-border hover:border-gold/40 rounded-full px-3 py-1.5 transition-all"
                  >
                    {p.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* منطقة المحادثة */}
      {!showSessionTypes && (
        <>
          {/* دليل الكاميرا */}
          {showCameraGuide && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-blue-700 text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    دليل التصوير الصحيح
                  </h4>
                  <Button size="sm" variant="ghost" onClick={() => setShowCameraGuide(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                  {CAMERA_INSTRUCTIONS.map(inst => (
                    <div key={inst.step} className="text-center">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1">
                        {inst.step}
                      </div>
                      <div className="text-xs font-medium text-blue-700">{inst.title}</div>
                      <div className="text-xs text-blue-500 hidden sm:block">{inst.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* الرسائل */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {/* الأفاتار */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === "user"
                      ? "bg-gold/20"
                      : "bg-gradient-to-br from-gold to-[#C9A84C]"
                  }`}>
                    {msg.role === "user"
                      ? <User className="w-4 h-4 text-gold" />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>

                  {/* الفقاعة */}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-gold text-white rounded-tr-sm"
                      : "bg-card border border-border rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.content.startsWith("📸") ? (
                      <div>
                        <div className="text-sm opacity-80 mb-1">📸 صورة مرفقة</div>
                        <div className="text-sm">{msg.content.replace(/^📸 \[صورة مرفقة\]\n/, "")}</div>
                      </div>
                    ) : msg.role === "assistant" ? (
                      <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{msg.content}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-[#C9A84C] flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-xs text-muted-foreground mr-2">م. سارة تفكر...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* اقتراحات سريعة */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((p, i) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => setInput(p.text)}
                        className="flex items-center gap-1.5 text-xs bg-muted/60 hover:bg-gold/10 hover:text-gold border border-border hover:border-gold/40 rounded-full px-3 py-1.5 transition-all"
                      >
                        <Icon className="w-3 h-3" />
                        {p.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* صورة مرفقة */}
          {attachedImagePreview && (
            <div className="px-4 pb-2">
              <div className="max-w-4xl mx-auto">
                <div className="relative inline-block">
                  <img
                    src={attachedImagePreview}
                    alt="مرفق"
                    className="h-16 w-16 object-cover rounded-lg border border-border cursor-pointer"
                    onClick={() => setExpandedImage(attachedImagePreview)}
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute -top-1 -left-1 w-5 h-5 p-0 rounded-full"
                    onClick={() => { setAttachedImage(null); setAttachedImagePreview(null); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* منطقة الإدخال */}
          <div className="border-t border-border bg-background px-4 py-3 flex-shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 items-end">
                {/* أزرار الإرفاق */}
                <div className="flex gap-1">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={cameraInputRef}
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 w-10 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    title="رفع صورة أو ملف"
                  >
                    {isUploadingImage
                      ? <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                      : <Upload className="w-4 h-4" />
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 w-10 p-0"
                    onClick={() => cameraInputRef.current?.click()}
                    title="التقاط صورة بالكاميرا"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>

                {/* حقل النص */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك لم. سارة... (Enter للإرسال، Shift+Enter لسطر جديد)"
                    className="min-h-[40px] max-h-32 resize-none py-2.5 pl-10 text-sm"
                    rows={1}
                  />
                  <Badge
                    variant="outline"
                    className="absolute bottom-2 left-2 text-xs py-0 px-1.5 border-gold/30 text-gold/70"
                  >
                    {SESSION_TYPES.find(s => s.key === sessionType)?.label}
                  </Badge>
                </div>

                {/* زر الإرسال */}
                <Button
                  className="btn-gold h-10 w-10 p-0 flex-shrink-0"
                  onClick={handleSend}
                  disabled={isSending || (!input.trim() && !attachedImage)}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* تغيير نوع الجلسة */}
              <div className="flex gap-1 mt-2 flex-wrap">
                {SESSION_TYPES.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.key}
                      onClick={() => {
                        setSessionType(type.key);
                        if (type.key === "camera_scan") setShowCameraGuide(true);
                      }}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-all ${
                        sessionType === type.key
                          ? "bg-gold text-white"
                          : "bg-muted/60 text-muted-foreground hover:bg-gold/10 hover:text-gold"
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {type.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setShowSessionTypes(true); setMessages([]); setSessionId(null); }}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted/60 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="w-3 h-3" />
                  محادثة جديدة
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* مودال تكبير الصورة */}
      {expandedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div className="relative max-w-3xl w-full">
            <img src={expandedImage} alt="صورة" className="w-full rounded-xl" />
            <Button
              className="absolute top-2 left-2 bg-black/60 text-white hover:bg-black/80"
              size="sm"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
