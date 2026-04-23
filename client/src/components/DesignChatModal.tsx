import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X, Send, Image as ImageIcon, Loader2, Wand2, Sparkles,
  RefreshCw, Palette, Sofa, Layers, DoorOpen, ChevronDown, ChevronUp,
} from "lucide-react";
import { useMousaCredit } from "@/components/CreditBadge";

// ===== Types =====
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  generatedImageUrl?: string;
  changes?: Record<string, unknown>;
  timestamp: number;
};

type DesignContext = {
  title?: string;
  style?: string;
  styleLabel?: string;
  description?: string;
  imageUrl?: string;
  originalImageUrl?: string;
  materials?: string[];
  palette?: Array<{ name: string; hex: string }>;
  estimatedCost?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  design: DesignContext;
  onApplyChanges?: (changes: Record<string, unknown>, newImageUrl?: string) => void;
};

// ===== Quick Suggestions =====
const QUICK_SUGGESTIONS = [
  { icon: <Palette className="w-3 h-3" />, text: "غيّري الألوان إلى درجات الأزرق والذهبي" },
  { icon: <Sofa className="w-3 h-3" />, text: "استبدلي الأثاث بأثاث مودرن" },
  { icon: <Layers className="w-3 h-3" />, text: "غيّري الأرضية إلى رخام أبيض" },
  { icon: <DoorOpen className="w-3 h-3" />, text: "أضيفي نافذة في الجدار الشمالي" },
  { icon: <Wand2 className="w-3 h-3" />, text: "حوّلي النمط إلى خليجي فاخر" },
  { icon: <Sparkles className="w-3 h-3" />, text: "ولّدي صورة بالتعديلات المقترحة" },
];

// ===== Changes Display =====
function ChangesCard({ changes }: { changes: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const palette = changes.palette as Array<{ name: string; hex: string }> | undefined;
  const materials = changes.materials as string[] | undefined;
  const furniture = changes.furniture as Array<{ name: string; description: string; priceRange: string }> | undefined;
  const openings = changes.openings as Array<{ action: string; type: string; location: string; size: string }> | undefined;

  const hasChanges = (palette?.length || 0) + (materials?.length || 0) + (furniture?.length || 0) + (openings?.length || 0) > 0;
  if (!hasChanges) return null;

  return (
    <div className="mt-2 bg-[#f0e8d8] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2"
      >
        <span className="text-xs font-bold text-[#5C3D11]">التعديلات المقترحة</span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-[#8B6914]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#8B6914]" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {palette && palette.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8B6914] mb-1">الألوان</p>
              <div className="flex gap-1.5 flex-wrap">
                {palette.map((c, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c.hex }} />
                    <span className="text-[10px] text-[#5C3D11]">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {materials && materials.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8B6914] mb-1">الخامات</p>
              <div className="flex flex-wrap gap-1">
                {materials.map((m, i) => (
                  <span key={i} className="text-[10px] bg-white text-[#8B6914] px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
          )}
          {furniture && furniture.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8B6914] mb-1">الأثاث</p>
              <div className="space-y-1">
                {furniture.map((f, i) => (
                  <div key={i} className="flex justify-between items-start bg-white rounded-lg px-2 py-1">
                    <div>
                      <p className="text-[10px] font-bold text-[#5C3D11]">{f.name}</p>
                      <p className="text-[9px] text-[#8B6914]/70">{f.description}</p>
                    </div>
                    <span className="text-[9px] text-[#C9A84C] font-bold">{f.priceRange}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {openings && openings.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#8B6914] mb-1">الفتحات</p>
              <div className="space-y-1">
                {openings.map((o, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white rounded-lg px-2 py-1">
                    <DoorOpen className="w-3 h-3 text-[#C9A84C]" />
                    <span className="text-[10px] text-[#5C3D11]">
                      {o.action === "add" ? "إضافة" : o.action === "remove" ? "إزالة" : "تعديل"}{" "}
                      {o.type === "door" ? "باب" : "نافذة"} — {o.location} ({o.size})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Main Modal =====
export default function DesignChatModal({ isOpen, onClose, design, onApplyChanges }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string; url?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [generateImageOnSend, setGenerateImageOnSend] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  void attachedImage?.file; // suppress unused warning

  const { deduct, canAfford, requiresMousa, upgradeUrl } = useMousaCredit();

  const uploadMutation = trpc.upload.image.useMutation();
  const designChatMutation = trpc.designChat.useMutation();

  // تمرير تلقائي لأسفل
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // رسالة ترحيبية
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: `مرحباً! أنا م. اليازية 👋\n\nأنا هنا لمساعدتك في تعديل تصميم **${design.title || "التصميم الحالي"}**.\n\nيمكنك طلب:\n- تغيير الألوان والخامات\n- استبدال الأثاث بمواصفات محددة\n- فتح أو إغلاق فتحات في الجدار\n- تحليل صور مرجعية ترفعها\n- توليد صورة بالتعديلات\n\nما الذي تريد تعديله؟`,
        timestamp: Date.now(),
      }]);
    }
  }, [isOpen, design.title]);

  // رفع صورة
  const handleImageAttach = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 10MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setAttachedImage({ file, preview });
    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        const result = await uploadMutation.mutateAsync({
          base64,
          mimeType: file.type as "image/jpeg" | "image/png" | "image/webp",
          fileName: file.name,
        });
        setAttachedImage(prev => prev ? { ...prev, url: result.url } : null);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("فشل رفع الصورة");
      setIsUploading(false);
      setAttachedImage(null);
    }
  };

  // إرسال رسالة
  const handleSend = async () => {
    if (!inputText.trim() && !attachedImage) return;
    if (isUploading) {
      toast.error("انتظر حتى يكتمل رفع الصورة");
      return;
    }

    if (requiresMousa && !canAfford("designChat")) {
      toast.error("رصيدك غير كافِ", {
        description: "تحتاج 20 كريدت لهذه العملية",
        action: upgradeUrl ? { label: "شحن الرصيد", onClick: () => window.open(upgradeUrl, "_blank") } : undefined,
      });
      return;
    }

    const userMsg: ChatMessage = {
      role: "user",
      content: inputText.trim(),
      imageUrl: attachedImage?.url,
      timestamp: Date.now(),
    };

    const prevMessages = [...messages];
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setAttachedImage(null);
    setGenerateImageOnSend(false);

    // رسالة "جاري التفكير"
    const thinkingMsg: ChatMessage = {
      role: "assistant",
      content: "__thinking__",
      timestamp: Date.now() + 1000,
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const result = await designChatMutation.mutateAsync({
        messages: prevMessages
          .filter(m => m.role !== "assistant" || m.content !== "__thinking__")
          .map(m => ({ role: m.role, content: m.content, imageUrl: m.imageUrl })),
        userMessage: userMsg.content,
        userImageUrl: userMsg.imageUrl,
        currentDesign: {
          title: design.title,
          style: design.style,
          styleLabel: design.styleLabel,
          description: design.description,
          imageUrl: design.imageUrl,
          originalImageUrl: design.originalImageUrl,
          materials: design.materials,
          palette: design.palette,
          estimatedCost: design.estimatedCost,
        },
        generateImage: generateImageOnSend,
      });

      deduct("designChat");

      // استبدال رسالة "جاري التفكير" بالرد الفعلي
      setMessages(prev => prev.map(m =>
        m.content === "__thinking__" ? {
          role: "assistant" as const,
          content: result.assistantMessage,
          generatedImageUrl: result.generatedImageUrl || undefined,
          changes: Object.keys(result.changes).length > 0 ? result.changes : undefined,
          timestamp: Date.now(),
        } : m
      ));

      // إشعار بالتعديلات
      if (result.generatedImageUrl || Object.keys(result.changes).length > 0) {
        toast.success("تم توليد التعديلات", {
          description: "يمكنك تطبيق التعديلات على التصميم",
          action: {
            label: "تطبيق",
            onClick: () => onApplyChanges?.(result.changes, result.generatedImageUrl || undefined),
          },
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "حدث خطأ";
      setMessages(prev => prev.map(m =>
        m.content === "__thinking__" ? {
          role: "assistant" as const,
          content: `عذراً، حدث خطأ: ${errorMsg}`,
          timestamp: Date.now(),
        } : m
      ));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#faf6f0] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: "90vh", height: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8d9c0] bg-white rounded-t-3xl sm:rounded-t-3xl flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center">
              <Wand2 className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-[#5C3D11]">م. اليازية — شات التعديل</p>
              <p className="text-[10px] text-[#8B6914]/70 truncate max-w-[200px]">{design.title || "التصميم الحالي"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#f0e8d8] flex items-center justify-center">
            <X className="w-4 h-4 text-[#8B6914]" />
          </button>
        </div>

        {/* Design Preview (small) */}
        {design.imageUrl && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#f0e8d8] border-b border-[#e8d9c0] flex-shrink-0">
            <img src={design.imageUrl} className="w-10 h-10 rounded-xl object-cover" alt="التصميم" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#5C3D11] truncate">{design.title}</p>
              <p className="text-[10px] text-[#8B6914]/70">{design.styleLabel || design.style} • {design.estimatedCost}</p>
            </div>
            {onApplyChanges && (
              <button
                onClick={() => onApplyChanges({}, undefined)}
                className="text-[10px] text-[#C9A84C] font-bold px-2 py-1 bg-[#C9A84C]/10 rounded-lg"
              >
                تطبيق
              </button>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center flex-shrink-0 mt-1 mr-2">
                  <Wand2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {/* صورة المستخدم المرفقة */}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} className="w-32 h-24 object-cover rounded-xl" alt="مرفق" />
                )}
                {/* نص الرسالة */}
                {msg.content === "__thinking__" ? (
                  <div className="bg-white rounded-2xl px-3 py-2 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-[#C9A84C] animate-spin" />
                    <span className="text-xs text-[#8B6914]">م. اليازية تفكر...</span>
                  </div>
                ) : (
                  <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#C9A84C] text-white rounded-tr-sm"
                      : "bg-white text-[#5C3D11] rounded-tl-sm shadow-sm"
                  }`}>
                    {msg.content}
                  </div>
                )}
                {/* صورة مولّدة */}
                {msg.generatedImageUrl && (
                  <div className="relative">
                    <img src={msg.generatedImageUrl} className="w-full max-w-[260px] rounded-xl shadow-md" alt="تصميم معدّل" />
                    <div className="absolute top-2 right-2 bg-[#C9A84C] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                      تصميم معدّل
                    </div>
                    {onApplyChanges && (
                      <button
                        onClick={() => onApplyChanges(msg.changes || {}, msg.generatedImageUrl)}
                        className="mt-1 w-full text-xs font-bold text-[#C9A84C] bg-[#C9A84C]/10 rounded-xl py-1.5 flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> تطبيق هذا التصميم
                      </button>
                    )}
                  </div>
                )}
                {/* بطاقة التعديلات */}
                {msg.changes && <ChangesCard changes={msg.changes} />}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {QUICK_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInputText(s.text)}
                  className="flex items-center gap-1 text-[10px] text-[#8B6914] bg-white border border-[#e8d9c0] px-2.5 py-1.5 rounded-full whitespace-nowrap flex-shrink-0 active:scale-95 transition-transform"
                >
                  {s.icon}
                  {s.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attached Image Preview */}
        {attachedImage && (
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="relative inline-block">
              <img src={attachedImage.preview} className="w-16 h-16 object-cover rounded-xl" alt="مرفق" />
              {isUploading && (
                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
              <button
                onClick={() => setAttachedImage(null)}
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 pb-4 pt-2 border-t border-[#e8d9c0] bg-white rounded-b-3xl flex-shrink-0">
          {/* توليد صورة toggle */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setGenerateImageOnSend(!generateImageOnSend)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                generateImageOnSend
                  ? "bg-[#C9A84C] text-white"
                  : "bg-[#f0e8d8] text-[#8B6914]"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              توليد صورة
            </button>
            <span className="text-[9px] text-[#8B6914]/60">
              {generateImageOnSend ? "سيتم توليد صورة بالتعديلات" : "اضغط لتوليد صورة مع الرد"}
            </span>
          </div>

          <div className="flex items-end gap-2">
            {/* زر إرفاق صورة */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full bg-[#f0e8d8] flex items-center justify-center flex-shrink-0"
            >
              <ImageIcon className="w-4 h-4 text-[#8B6914]" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImageAttach(e.target.files[0])}
            />

            {/* حقل النص */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="اكتبي طلب التعديل... (مثال: غيّري الأرضية إلى رخام)"
              className="flex-1 bg-[#f0e8d8] rounded-2xl px-3 py-2 text-xs text-[#5C3D11] placeholder:text-[#8B6914]/50 resize-none outline-none min-h-[36px] max-h-[100px]"
              rows={1}
              dir="rtl"
            />

            {/* زر الإرسال */}
            <button
              onClick={handleSend}
              disabled={designChatMutation.isPending || isUploading || (!inputText.trim() && !attachedImage)}
              className="w-9 h-9 rounded-full bg-[#C9A84C] flex items-center justify-center flex-shrink-0 disabled:opacity-50 active:scale-95 transition-transform"
            >
              {designChatMutation.isPending ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-[#8B6914]/50 text-center mt-1.5">20 كريدت لكل رسالة</p>
        </div>
      </div>
    </div>
  );
}
