import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Mic, MicOff, ChevronRight, Trash2, RotateCcw, ZoomIn, ZoomOut,
  Box, Play, Download, Layers, Move, Hand, Square, DoorOpen, Eye
} from "lucide-react";

// ===== Types =====
type Direction = "N" | "S" | "E" | "W";
type ElementType = "room" | "wall" | "door" | "window";
type DrawTool = "select" | "hand";

interface Point { x: number; y: number; }

interface Room {
  id: string;
  x: number; y: number;
  width: number; height: number;
  label: string;
  color: string;
}

interface Door {
  id: string;
  wallId: string;
  roomId: string;
  side: Direction; // which wall of the room
  position: number; // 0-1 along the wall
  width: number; // in meters
  swingDirection: "in" | "out";
}

interface Window {
  id: string;
  roomId: string;
  side: Direction;
  position: number; // 0-1 along the wall
  width: number; // meters
  height: number; // meters
  sillHeight: number; // meters from floor
}

interface FloorPlan {
  rooms: Room[];
  doors: Door[];
  windows: Window[];
  scale: number; // pixels per meter
  northAngle: number; // degrees, 0 = up
}

interface SarahMessage {
  id: string;
  role: "sarah" | "user";
  text: string;
  timestamp: number;
  isProcessing?: boolean;
}

// ===== Constants =====
const SCALE = 60; // pixels per meter
const ROOM_COLORS = [
  "#E8D5B7", "#D4E8D5", "#D5D4E8", "#E8D5D5",
  "#E8E4D5", "#D5E8E4", "#E4D5E8", "#E8E0D5",
];
const COMPASS_LABELS: Record<Direction, string> = { N: "ش", S: "ج", E: "ش.ق", W: "غ" };

// Wall labels: A=شمال, B=جنوب, C=شرق, D=غرب
const WALL_LABELS: Record<Direction, string> = { N: "A", S: "B", E: "C", W: "D" };
const WALL_NAMES: Record<Direction, string> = { N: "A (شمال)", S: "B (جنوب)", E: "C (شرق)", W: "D (غرب)" };

// ===== Utility =====
function generateId() { return Math.random().toString(36).slice(2, 9); }

function metersToPixels(m: number, scale = SCALE) { return m * scale; }
function pixelsToMeters(px: number, scale = SCALE) { return px / scale; }

// ===== Draw floor plan on canvas =====
function drawFloorPlan(
  ctx: CanvasRenderingContext2D,
  plan: FloorPlan,
  selectedId: string | null,
  viewOffset: Point,
  zoom: number
) {
  const sc = plan.scale * zoom;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Grid
  ctx.save();
  ctx.strokeStyle = "#e0d4c0";
  ctx.lineWidth = 0.5;
  const gridSize = sc; // 1m grid
  const startX = viewOffset.x % gridSize;
  const startY = viewOffset.y % gridSize;
  for (let x = startX; x < ctx.canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, ctx.canvas.height); ctx.stroke();
  }
  for (let y = startY; y < ctx.canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(ctx.canvas.width, y); ctx.stroke();
  }
  ctx.restore();

  // Compass rose (top-right)
  drawCompass(ctx, ctx.canvas.width - 60, 60, plan.northAngle);

  // Rooms
  for (const room of plan.rooms) {
    const rx = room.x * sc + viewOffset.x;
    const ry = room.y * sc + viewOffset.y;
    const rw = room.width * sc;
    const rh = room.height * sc;

    // Fill
    ctx.fillStyle = room.color + "cc";
    ctx.fillRect(rx, ry, rw, rh);

    // Border
    ctx.strokeStyle = selectedId === room.id ? "#C9A84C" : "#5C3D11";
    ctx.lineWidth = selectedId === room.id ? 3 : 2;
    ctx.strokeRect(rx, ry, rw, rh);

    // Label
    ctx.fillStyle = "#3d2a0a";
    ctx.font = `bold ${Math.max(11, sc * 0.22)}px Cairo, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(room.label, rx + rw / 2, ry + rh / 2 - sc * 0.1);
    ctx.font = `${Math.max(9, sc * 0.16)}px Cairo, sans-serif`;
    ctx.fillStyle = "#7a5c2a";
    ctx.fillText(`${room.width}×${room.height}م`, rx + rw / 2, ry + rh / 2 + sc * 0.15);

    // Wall labels A/B/C/D on each side of the room
    const wallLabelSize = Math.max(9, sc * 0.14);
    ctx.font = `bold ${wallLabelSize}px Cairo, sans-serif`;
    ctx.fillStyle = "#C9A84C";
    const wallPad = Math.max(8, sc * 0.12);
    // North wall = A
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText("A", rx + rw / 2, ry + wallPad);
    // South wall = B
    ctx.textBaseline = "top";
    ctx.fillText("B", rx + rw / 2, ry + rh - wallPad);
    // East wall = C (right in LTR canvas)
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText("C", rx + rw - wallPad * 0.5, ry + rh / 2);
    // West wall = D (left)
    ctx.textAlign = "left";
    ctx.fillText("D", rx + wallPad * 0.5, ry + rh / 2);
  }

  // Doors
  for (const door of plan.doors) {
    const room = plan.rooms.find(r => r.id === door.roomId);
    if (!room) continue;
    drawDoor(ctx, room, door, sc, viewOffset, selectedId === door.id);
  }

  // Windows
  for (const win of plan.windows) {
    const room = plan.rooms.find(r => r.id === win.roomId);
    if (!room) continue;
    drawWindow(ctx, room, win, sc, viewOffset, selectedId === win.id);
  }
}

function drawCompass(ctx: CanvasRenderingContext2D, cx: number, cy: number, northAngle: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((northAngle * Math.PI) / 180);
  // Arrow
  ctx.beginPath();
  ctx.moveTo(0, -22); ctx.lineTo(6, 8); ctx.lineTo(0, 4); ctx.lineTo(-6, 8); ctx.closePath();
  ctx.fillStyle = "#C9A84C";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 22); ctx.lineTo(6, -8); ctx.lineTo(0, -4); ctx.lineTo(-6, -8); ctx.closePath();
  ctx.fillStyle = "#ccc";
  ctx.fill();
  ctx.restore();
  // N label
  ctx.save();
  ctx.font = "bold 12px Cairo, sans-serif";
  ctx.fillStyle = "#5C3D11";
  ctx.textAlign = "center";
  ctx.fillText("ش", cx, cy - 30);
  ctx.restore();
}

function drawDoor(
  ctx: CanvasRenderingContext2D,
  room: Room,
  door: Door,
  sc: number,
  offset: Point,
  selected: boolean
) {
  const rx = room.x * sc + offset.x;
  const ry = room.y * sc + offset.y;
  const rw = room.width * sc;
  const rh = room.height * sc;
  const dw = door.width * sc;

  ctx.save();
  ctx.strokeStyle = selected ? "#C9A84C" : "#5C3D11";
  ctx.lineWidth = selected ? 3 : 2.5;
  ctx.fillStyle = "#faf6f0";

  let dx = 0, dy = 0, angle = 0;
  if (door.side === "S") { // bottom wall
    dx = rx + door.position * rw - dw / 2;
    dy = ry + rh;
    // Clear wall segment
    ctx.clearRect(dx, dy - 3, dw, 6);
    ctx.fillRect(dx, dy - 2, dw, 4);
    // Door swing arc
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.arc(dx, dy, dw, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + dw, dy);
    ctx.stroke();
  } else if (door.side === "N") { // top wall
    dx = rx + door.position * rw - dw / 2;
    dy = ry;
    ctx.clearRect(dx, dy - 3, dw, 6);
    ctx.fillRect(dx, dy - 2, dw, 4);
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.arc(dx, dy, dw, 0, -Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + dw, dy);
    ctx.stroke();
  } else if (door.side === "E") { // right wall
    dx = rx + rw;
    dy = ry + door.position * rh - dw / 2;
    ctx.clearRect(dx - 3, dy, 6, dw);
    ctx.fillRect(dx - 2, dy, 4, dw);
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.arc(dx, dy, dw, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx, dy + dw);
    ctx.stroke();
  } else { // W - left wall
    dx = rx;
    dy = ry + door.position * rh - dw / 2;
    ctx.clearRect(dx - 3, dy, 6, dw);
    ctx.fillRect(dx - 2, dy, 4, dw);
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.arc(dx, dy, dw, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx, dy + dw);
    ctx.stroke();
  }

  // Door label
  ctx.font = `${Math.max(8, sc * 0.12)}px Cairo, sans-serif`;
  ctx.fillStyle = "#8B6914";
  ctx.textAlign = "center";
  ctx.fillText("باب", dx + dw / 2, dy + (door.side === "N" || door.side === "S" ? -8 : dw / 2));
  ctx.restore();

  void angle;
}

function drawWindow(
  ctx: CanvasRenderingContext2D,
  room: Room,
  win: Window,
  sc: number,
  offset: Point,
  selected: boolean
) {
  const rx = room.x * sc + offset.x;
  const ry = room.y * sc + offset.y;
  const rw = room.width * sc;
  const rh = room.height * sc;
  const ww = win.width * sc;

  ctx.save();
  ctx.strokeStyle = selected ? "#C9A84C" : "#4a90d9";
  ctx.lineWidth = selected ? 3 : 2;

  if (win.side === "N") {
    const wx = rx + win.position * rw - ww / 2;
    ctx.clearRect(wx, ry - 3, ww, 6);
    ctx.strokeRect(wx, ry - 4, ww, 8);
    // Glass lines
    ctx.beginPath();
    ctx.moveTo(wx + ww / 3, ry - 4);
    ctx.lineTo(wx + ww / 3, ry + 4);
    ctx.moveTo(wx + (2 * ww) / 3, ry - 4);
    ctx.lineTo(wx + (2 * ww) / 3, ry + 4);
    ctx.stroke();
  } else if (win.side === "S") {
    const wx = rx + win.position * rw - ww / 2;
    ctx.clearRect(wx, ry + rh - 3, ww, 6);
    ctx.strokeRect(wx, ry + rh - 4, ww, 8);
    ctx.beginPath();
    ctx.moveTo(wx + ww / 3, ry + rh - 4);
    ctx.lineTo(wx + ww / 3, ry + rh + 4);
    ctx.moveTo(wx + (2 * ww) / 3, ry + rh - 4);
    ctx.lineTo(wx + (2 * ww) / 3, ry + rh + 4);
    ctx.stroke();
  } else if (win.side === "E") {
    const wy = ry + win.position * rh - ww / 2;
    ctx.clearRect(rx + rw - 3, wy, 6, ww);
    ctx.strokeRect(rx + rw - 4, wy, 8, ww);
    ctx.beginPath();
    ctx.moveTo(rx + rw - 4, wy + ww / 3);
    ctx.lineTo(rx + rw + 4, wy + ww / 3);
    ctx.moveTo(rx + rw - 4, wy + (2 * ww) / 3);
    ctx.lineTo(rx + rw + 4, wy + (2 * ww) / 3);
    ctx.stroke();
  } else {
    const wy = ry + win.position * rh - ww / 2;
    ctx.clearRect(rx - 3, wy, 6, ww);
    ctx.strokeRect(rx - 4, wy, 8, ww);
    ctx.beginPath();
    ctx.moveTo(rx - 4, wy + ww / 3);
    ctx.lineTo(rx + 4, wy + ww / 3);
    ctx.moveTo(rx - 4, wy + (2 * ww) / 3);
    ctx.lineTo(rx + 4, wy + (2 * ww) / 3);
    ctx.stroke();
  }

  ctx.font = `${Math.max(7, sc * 0.1)}px Cairo, sans-serif`;
  ctx.fillStyle = "#4a90d9";
  ctx.textAlign = "center";
  ctx.restore();
}

// ===== Main Component =====
export default function VoiceDesigner() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [plan, setPlan] = useState<FloorPlan>({
    rooms: [],
    doors: [],
    windows: [],
    scale: SCALE,
    northAngle: 0,
  });

  const [messages, setMessages] = useState<SarahMessage[]>([
    {
      id: "welcome",
      role: "sarah",
      text: "مرحباً! أنا م. سارة، مهندستك المعمارية. أخبرني بما تريد تصميمه — قل مثلاً: \"ارسمي غرفة معيشة 5 في 4 متر\" أو \"أضيفي باب على الجدار الغربي\"",
      timestamp: Date.now(),
    }
  ]);

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewOffset, setViewOffset] = useState<Point>({ x: 40, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [panOffsetStart, setPanOffsetStart] = useState<Point>({ x: 0, y: 0 });
  const [is3DView, setIs3DView] = useState(false);
  const [view3DUrl, setView3DUrl] = useState<string | null>(null);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [showMessages, setShowMessages] = useState(true);
  const [textInput, setTextInput] = useState("");

  const voiceCommandMutation = trpc.voiceDesignCommand.useMutation({
    onSuccess: (data) => {
      setIsProcessing(false);
      if (data.updatedPlan) {
        setPlan(data.updatedPlan as FloorPlan);
      }
      if (data.sarahResponse) {
        addSarahMessage(data.sarahResponse);
      }
    },
    onError: (err) => {
      setIsProcessing(false);
      addSarahMessage("عذراً، لم أفهم الأمر. هل يمكنك إعادة الصياغة؟");
      console.error(err);
    },
  });

  const generate3DMutation = trpc.generateFloorPlan3D.useMutation({
    onSuccess: (data) => {
      setIsGenerating3D(false);
      if (data.imageUrl) {
        setView3DUrl(data.imageUrl);
        setIs3DView(true);
        addSarahMessage("هذا هو المنظور ثلاثي الأبعاد لتصميمك! يمكنك تحميله أو مشاركته.");
      }
    },
    onError: () => {
      setIsGenerating3D(false);
      toast.error("فشل توليد المنظور 3D");
    },
  });

  // Draw whenever plan/zoom/offset changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFloorPlan(ctx, plan, selectedId, viewOffset, zoom);
  }, [plan, selectedId, zoom, viewOffset]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) drawFloorPlan(ctx, plan, selectedId, viewOffset, zoom);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [plan, selectedId, viewOffset, zoom]);

  const addSarahMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      role: "sarah",
      text,
      timestamp: Date.now(),
    }]);
  }, []);

  // ===== Voice Recording =====
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processVoiceCommand(blob);
      };
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsListening(true);

      // Auto-stop after 15 seconds
      recordingTimerRef.current = setTimeout(() => stopListening(), 15000) as unknown as ReturnType<typeof setInterval>;
    } catch {
      toast.error("لا يمكن الوصول للميكروفون");
    }
  };

  const stopListening = () => {
    if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current as unknown as ReturnType<typeof setTimeout>);
    mediaRecorderRef.current?.stop();
    setIsListening(false);
    setIsProcessing(true);
  };

  const processVoiceCommand = async (audioBlob: Blob) => {
    // Convert blob to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      // Add user message placeholder
      const userMsgId = generateId();
      setMessages(prev => [...prev, {
        id: userMsgId,
        role: "user",
        text: "🎤 جاري المعالجة...",
        timestamp: Date.now(),
        isProcessing: true,
      }]);

      voiceCommandMutation.mutate({
        audioBase64: base64,
        currentPlan: plan,
      }, {
        onSuccess: (data) => {
          // Update user message with transcription
          if (data.transcription) {
            setMessages(prev => prev.map(m =>
              m.id === userMsgId
                ? { ...m, text: data.transcription!, isProcessing: false }
                : m
            ));
          } else {
            setMessages(prev => prev.filter(m => m.id !== userMsgId));
          }
        }
      });
    };
    reader.readAsDataURL(audioBlob);
  };

  // ===== Canvas interaction =====
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setPanOffsetStart({ ...viewOffset });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setViewOffset({
      x: panOffsetStart.x + (e.clientX - panStart.x),
      y: panOffsetStart.y + (e.clientY - panStart.y),
    });
  };

  const handleCanvasMouseUp = () => setIsPanning(false);

  // Touch pan
  const touchStartRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
      setPanOffsetStart({ ...viewOffset });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && touchStartRef.current) {
      setViewOffset({
        x: panOffsetStart.x + (e.touches[0].clientX - touchStartRef.current.clientX),
        y: panOffsetStart.y + (e.touches[0].clientY - touchStartRef.current.clientY),
      });
    }
  };

  const resetView = () => {
    setZoom(1);
    setViewOffset({ x: 40, y: 60 });
  };

  const clearAll = () => {
    setPlan({ rooms: [], doors: [], windows: [], scale: SCALE, northAngle: 0 });
    setView3DUrl(null);
    setIs3DView(false);
    addSarahMessage("تم مسح اللوحة. ابدأ من جديد — أخبرني بما تريد تصميمه!");
  };

  const generate3D = () => {
    if (plan.rooms.length === 0) {
      toast.error("ارسم مخططاً أولاً قبل توليد المنظور 3D");
      return;
    }
    setIsGenerating3D(true);
    addSarahMessage("ممتاز! جاري تحويل مخططك إلى منظور ثلاثي الأبعاد...");
    generate3DMutation.mutate({ plan });
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "مخطط-م-سارة.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Quick command buttons
  const quickCommands = [
    { label: "غرفة معيشة 5×4", cmd: "ارسمي غرفة معيشة 5 في 4 متر" },
    { label: "غرفة نوم 4×4", cmd: "أضيفي غرفة نوم 4 في 4 متر" },
    { label: "مطبخ 3×3", cmd: "أضيفي مطبخ 3 في 3 متر" },
    { label: "حمام 2×2", cmd: "أضيفي حمام 2 في 2 متر" },
    { label: "باب D (غرب)", cmd: "أضيفي باب على الجدار D الغربي في المنتصف" },
    { label: "نافذة A (شمال)", cmd: "أضيفي نافذة على الجدار A الشمالي في المنتصف عرض 1.5 متر" },
    { label: "نافذة C (شرق)", cmd: "أضيفي نافذة على الجدار C الشرقي في المنتصف عرض 1.2 متر" },
  ];

  const sendTextCommand = async (cmd: string) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      role: "user",
      text: cmd,
      timestamp: Date.now(),
    }]);
    setIsProcessing(true);
    voiceCommandMutation.mutate({
      audioBase64: "",
      textCommand: cmd,
      currentPlan: plan,
    });
  };

  return (
    <div className="fixed inset-0 bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 pt-safe pt-3 pb-2 bg-white/95 backdrop-blur border-b border-[#e8d9c0] z-20 shadow-sm">
        <button onClick={() => navigate("/")}
          className="p-2 rounded-full hover:bg-[#f0e8d8] transition-colors">
          <ChevronRight className="w-5 h-5 text-[#8B6914]" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-black text-[#5C3D11] text-sm">م. سارة ترسم بصوتك</p>
          <p className="text-[10px] text-[#8B6914]/70">
            {plan.rooms.length > 0
              ? `${plan.rooms.length} غرفة • ${plan.doors.length} باب • ${plan.windows.length} نافذة`
              : "ابدأ بالحديث أو اختر أمراً سريعاً"}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setShowMessages(!showMessages)}
            className={`p-2 rounded-xl border transition-all text-xs ${showMessages ? "border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914]" : "border-[#e8d9c0] text-[#5C3D11]"}`}>
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={generate3D} disabled={isGenerating3D || plan.rooms.length === 0}
            className="p-2 rounded-xl border border-[#C9A84C] bg-[#C9A84C]/10 text-[#8B6914] disabled:opacity-40 transition-all">
            {isGenerating3D ? (
              <div className="w-4 h-4 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Box className="w-4 h-4" />
            )}
          </button>
          <button onClick={downloadCanvas}
            className="p-2 rounded-xl border border-[#e8d9c0] text-[#5C3D11]">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* 3D View */}
        {is3DView && view3DUrl && (
          <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-lg">
              <img src={view3DUrl} className="w-full rounded-2xl shadow-2xl" alt="منظور 3D" />
              <button onClick={() => setIs3DView(false)}
                className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white">
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                <button onClick={() => setIs3DView(false)}
                  className="flex-1 py-2 bg-white/20 backdrop-blur rounded-xl text-white text-sm font-bold">
                  عودة للمخطط
                </button>
                <a href={view3DUrl} download="منظور-3D.jpg"
                  className="flex-1 py-2 bg-[#C9A84C] rounded-xl text-white text-sm font-bold text-center">
                  تحميل
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden bg-[#f5f0e8]"
          style={{ cursor: isPanning ? "grabbing" : "grab" }}>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => { touchStartRef.current = null; }}
          />

          {/* Empty state */}
          {plan.rooms.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-3xl bg-[#C9A84C]/10 flex items-center justify-center mb-4">
                <Square className="w-10 h-10 text-[#C9A84C]/40" />
              </div>
              <p className="text-[#8B6914]/50 font-bold text-base">اللوحة فارغة</p>
              <p className="text-[#8B6914]/30 text-sm mt-1">تحدث مع م. سارة أو اختر أمراً سريعاً</p>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.2))}
              className="w-9 h-9 rounded-xl bg-white/90 shadow-md flex items-center justify-center text-[#5C3D11] active:scale-90 transition-transform">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))}
              className="w-9 h-9 rounded-xl bg-white/90 shadow-md flex items-center justify-center text-[#5C3D11] active:scale-90 transition-transform">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={resetView}
              className="w-9 h-9 rounded-xl bg-white/90 shadow-md flex items-center justify-center text-[#5C3D11] active:scale-90 transition-transform">
              <Move className="w-4 h-4" />
            </button>
            <button onClick={clearAll}
              className="w-9 h-9 rounded-xl bg-red-50 shadow-md flex items-center justify-center text-red-400 active:scale-90 transition-transform">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom level */}
          <div className="absolute bottom-4 right-4 bg-white/80 rounded-lg px-2 py-1">
            <span className="text-[10px] text-[#8B6914] font-bold">{Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Chat messages */}
        {showMessages && (
          <div className="h-36 bg-white border-t border-[#e8d9c0] flex flex-col">
            <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-1.5">
              {messages.slice(-6).map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "sarah" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-[8px] font-black">س</span>
                    </div>
                  )}
                  <div className={`max-w-[75%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "sarah"
                      ? "bg-[#f5f0e8] text-[#5C3D11] rounded-tr-sm"
                      : "bg-[#C9A84C] text-white rounded-tl-sm"
                  } ${msg.isProcessing ? "opacity-60" : ""}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-[8px] font-black">س</span>
                  </div>
                  <div className="bg-[#f5f0e8] px-3 py-2 rounded-2xl rounded-tr-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick commands */}
        <div className="bg-white border-t border-[#e8d9c0] px-3 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {quickCommands.map(qc => (
              <button
                key={qc.cmd}
                onClick={() => sendTextCommand(qc.cmd)}
                disabled={isProcessing}
                className="flex-shrink-0 px-3 py-1.5 bg-[#f5f0e8] border border-[#e8d9c0] rounded-full text-[11px] text-[#5C3D11] font-medium active:bg-[#C9A84C]/20 transition-colors disabled:opacity-50"
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input bar: text + voice */}
        <div className="bg-white border-t border-[#e8d9c0] px-3 pb-safe pb-3 pt-2.5">
          {/* Wall legend */}
          <div className="flex gap-2 mb-2 justify-center">
            {(["A=شمال", "B=جنوب", "C=شرق", "D=غرب"] as const).map(label => (
              <span key={label} className="text-[10px] bg-[#C9A84C]/10 text-[#8B6914] px-2 py-0.5 rounded-full font-bold border border-[#C9A84C]/30">{label}</span>
            ))}
          </div>
          <div className="flex items-end gap-2">
            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (textInput.trim() && !isProcessing) {
                      sendTextCommand(textInput.trim());
                      setTextInput("");
                    }
                  }
                }}
                placeholder={isListening ? "🎤 م. سارة تسمعك..." : isProcessing ? "⏳ م. سارة تفكر..." : "اكتب أمرك هنا... مثلاً: أضيفي باب على الجدار A"}
                disabled={isProcessing || isListening}
                rows={1}
                className="w-full bg-[#f5f0e8] border border-[#e8d9c0] rounded-2xl px-4 py-2.5 text-sm text-[#5C3D11] placeholder:text-[#8B6914]/40 resize-none focus:outline-none focus:border-[#C9A84C] transition-colors disabled:opacity-60"
                style={{ minHeight: 42, maxHeight: 80 }}
              />
            </div>
            {/* Send text button */}
            <button
              onClick={() => {
                if (textInput.trim() && !isProcessing) {
                  sendTextCommand(textInput.trim());
                  setTextInput("");
                }
              }}
              disabled={!textInput.trim() || isProcessing || isListening}
              className="w-11 h-11 rounded-xl bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center text-[#8B6914] disabled:opacity-30 active:scale-90 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
            {/* Voice button */}
            <button
              onPointerDown={startListening}
              onPointerUp={stopListening}
              onPointerLeave={isListening ? stopListening : undefined}
              disabled={isProcessing}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 shadow-md disabled:opacity-50 ${
                isListening
                  ? "bg-red-500 scale-110 shadow-red-200"
                  : "bg-gradient-to-br from-[#C9A84C] to-[#8B6914]"
              }`}
            >
              {isListening ? (
                <MicOff className="w-5 h-5 text-white" />
              ) : (
                <Mic className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
