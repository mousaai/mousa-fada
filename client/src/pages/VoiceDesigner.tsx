import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  ChevronRight, Trash2, ZoomIn, ZoomOut, Move, Download,
  Box, Layers, RotateCcw, RotateCw, Copy, Minus, Plus,
  MousePointer, Square, DoorOpen, Grid3X3, Zap, Wind,
  ChevronDown, ChevronUp, X, Check, Maximize2
} from "lucide-react";

// ===== Types =====
type DrawTool = "select" | "wall" | "door" | "window" | "electrical" | "ac" | "room" | "pan";
type DoorType = "single" | "double" | "sliding" | "folding" | "pocket" | "glass" | "arch" | "double_sliding" | "exterior";
type WindowType = "standard" | "panoramic" | "french" | "opening" | "fixed" | "arch" | "full_panoramic" | "clerestory" | "skylight";
type ElectricalType = "outlet" | "switch" | "light" | "panel" | "tv" | "data" | "outlet_3phase" | "outdoor_outlet" | "doorbell" | "camera" | "intercom";
type ACType = "split" | "central" | "window_unit" | "cassette" | "floor_standing" | "vrf" | "heat_pump";
type WallType = "normal" | "load_bearing" | "glass" | "partition";

interface Point { x: number; y: number; }
interface Rect { x: number; y: number; w: number; h: number; }

interface Wall {
  id: string;
  type: "wall";
  x1: number; y1: number; x2: number; y2: number;
  thickness: number; // cm: 10-40
  wallType: WallType;
  rotation: number;
}

interface Opening {
  id: string;
  type: "door" | "window";
  x: number; y: number;
  width: number; // meters
  height: number; // meters
  rotation: number; // degrees
  doorType?: DoorType;
  windowType?: WindowType;
  swingIn?: boolean; // door swing direction
  label?: string;
}

interface ElectricalSymbol {
  id: string;
  type: "electrical";
  x: number; y: number;
  elType: ElectricalType;
  rotation: number;
  label?: string;
}

interface ACSymbol {
  id: string;
  type: "ac";
  x: number; y: number;
  acType: ACType;
  rotation: number;
  capacity?: string; // e.g. "18000 BTU"
}

interface RoomShape {
  id: string;
  type: "room";
  x: number; y: number;
  width: number; height: number;
  label: string;
  color: string;
  wallThickness: number; // cm
}

type DrawElement = Wall | Opening | ElectricalSymbol | ACSymbol | RoomShape;

interface HistoryEntry { elements: DrawElement[]; }

// ===== Library Presets =====
// Door/window preset type
type RoomPresetOpening = { side: "top" | "bottom" | "left" | "right"; pos: number; width: number; type: "door" | "window"; doorType?: DoorType; windowType?: WindowType; };
const ROOM_LIBRARY: { label: string; cat: string; w: number; h: number; color: string; icon?: string; openings?: RoomPresetOpening[] }[] = [
  // ===== مجالس =====
  { label: "مجلس 6×8", cat: "مجالس", w: 6, h: 8, color: "#D4A96A", icon: "🛋️",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.2, type: "door", doorType: "double" },
      { side: "left", pos: 0.3, width: 1.5, type: "window", windowType: "panoramic" },
      { side: "right", pos: 0.3, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
  { label: "مجلس 5×6", cat: "مجالس", w: 5, h: 6, color: "#D4A96A", icon: "🛋️",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.2, type: "door", doorType: "double" },
      { side: "left", pos: 0.4, width: 1.2, type: "window", windowType: "standard" },
    ]
  },
  { label: "مجلس 4×5", cat: "مجالس", w: 4, h: 5, color: "#D4A96A", icon: "🛋️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "standard" },
    ]
  },
  { label: "مجلس خليجي 7×9", cat: "مجالس", w: 7, h: 9, color: "#D4A96A", icon: "🏛️",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.5, type: "door", doorType: "double" },
      { side: "left", pos: 0.3, width: 2.0, type: "window", windowType: "panoramic" },
      { side: "right", pos: 0.3, width: 2.0, type: "window", windowType: "panoramic" },
      { side: "top", pos: 0.5, width: 1.2, type: "door", doorType: "single" },
    ]
  },
  { label: "غرفة ضيوف 4×4", cat: "مجالس", w: 4, h: 4, color: "#C9A84C", icon: "🪑",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  { label: "ديوانية 5×7", cat: "مجالس", w: 5, h: 7, color: "#D4A96A", icon: "🏠",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.2, type: "door", doorType: "double" },
      { side: "left", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
  // ===== معيشة =====
  { label: "معيشة 5×6", cat: "معيشة", w: 5, h: 6, color: "#5BA85E", icon: "📺",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
  { label: "معيشة 4×5", cat: "معيشة", w: 4, h: 5, color: "#5BA85E", icon: "📺",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "standard" },
    ]
  },
  { label: "معيشة 4×4", cat: "معيشة", w: 4, h: 4, color: "#5BA85E", icon: "📺",
    openings: [
      { side: "right", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "left", pos: 0.5, width: 1.2, type: "window", windowType: "standard" },
    ]
  },
  { label: "معيشة مفتوحة 6×7", cat: "معيشة", w: 6, h: 7, color: "#3D8B40", icon: "🏡",
    openings: [
      { side: "bottom", pos: 0.3, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 2.0, type: "window", windowType: "panoramic" },
      { side: "left", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
  { label: "معيشة 3×5", cat: "معيشة", w: 3, h: 5, color: "#5BA85E", icon: "📺",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  // ===== غرف نوم =====
  { label: "ماستر 4×5", cat: "نوم", w: 4, h: 5, color: "#7B68C8", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.3, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "standard" },
      { side: "right", pos: 0.3, width: 0.8, type: "door", doorType: "single" },
    ]
  },
  { label: "ماستر 5×6", cat: "نوم", w: 5, h: 6, color: "#7B68C8", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.3, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
      { side: "right", pos: 0.3, width: 0.8, type: "door", doorType: "single" },
    ]
  },
  { label: "ماستر 6×7", cat: "نوم", w: 6, h: 7, color: "#5B4BAA", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.3, width: 1.0, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 2.0, type: "window", windowType: "panoramic" },
      { side: "right", pos: 0.3, width: 0.9, type: "door", doorType: "single" },
      { side: "left", pos: 0.3, width: 0.9, type: "door", doorType: "single" },
    ]
  },
  { label: "غرفة نوم 4×4", cat: "نوم", w: 4, h: 4, color: "#C06080", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  { label: "غرفة نوم 3×4", cat: "نوم", w: 3, h: 4, color: "#C06080", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.9, type: "window", windowType: "standard" },
    ]
  },
  { label: "غرفة نوم 3×3", cat: "نوم", w: 3, h: 3, color: "#C06080", icon: "🛏️",
    openings: [
      { side: "right", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "left", pos: 0.5, width: 0.9, type: "window", windowType: "standard" },
    ]
  },
  { label: "غرفة أطفال 3×3.5", cat: "نوم", w: 3, h: 3.5, color: "#E07090", icon: "🧸",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.9, type: "window", windowType: "standard" },
    ]
  },
  { label: "غرفة مراهق 4×4.5", cat: "نوم", w: 4, h: 4.5, color: "#4A7AC8", icon: "🎮",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  // ===== حمامات =====
  { label: "حمام ماستر 2×3", cat: "حمام", w: 2, h: 3, color: "#2A9D8F", icon: "🚿",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "حمام ماستر 2.5×3", cat: "حمام", w: 2.5, h: 3, color: "#2A9D8F", icon: "🛁",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "حمام 2×2.5", cat: "حمام", w: 2, h: 2.5, color: "#2A9D8F", icon: "🚿",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "حمام 1.5×2", cat: "حمام", w: 1.5, h: 2, color: "#2A9D8F", icon: "🚿",
    openings: [{ side: "right", pos: 0.5, width: 0.7, type: "door", doorType: "single" }]
  },
  { label: "حمام ضيوف 1.5×1.5", cat: "حمام", w: 1.5, h: 1.5, color: "#2A9D8F", icon: "🚽",
    openings: [{ side: "right", pos: 0.5, width: 0.7, type: "door", doorType: "single" }]
  },
  { label: "حمام صغير 1×1.5", cat: "حمام", w: 1, h: 1.5, color: "#2A9D8F", icon: "🚽",
    openings: [{ side: "right", pos: 0.5, width: 0.6, type: "door", doorType: "single" }]
  },
  { label: "حمام مشترك 2×3", cat: "حمام", w: 2, h: 3, color: "#1A8070", icon: "🛁",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  // ===== دريسينج =====
  { label: "دريسينج 3×3", cat: "دريسينج", w: 3, h: 3, color: "#9B59B6", icon: "👗",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "sliding" }]
  },
  { label: "دريسينج 2×3", cat: "دريسينج", w: 2, h: 3, color: "#9B59B6", icon: "👗",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "sliding" }]
  },
  { label: "دريسينج 2×2", cat: "دريسينج", w: 2, h: 2, color: "#9B59B6", icon: "👗",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "sliding" }]
  },
  { label: "دريسينج 4×4", cat: "دريسينج", w: 4, h: 4, color: "#7D3C98", icon: "👔",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.0, type: "door", doorType: "double" },
    ]
  },
  { label: "غرفة ملابس 3×4", cat: "دريسينج", w: 3, h: 4, color: "#9B59B6", icon: "👘",
    openings: [{ side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "sliding" }]
  },
  // ===== مطابخ =====
  { label: "مطبخ 3×4", cat: "مطبخ", w: 3, h: 4, color: "#E07B39", icon: "🍳",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.9, type: "window", windowType: "standard" },
    ]
  },
  { label: "مطبخ 2×4", cat: "مطبخ", w: 2, h: 4, color: "#E07B39", icon: "🍳",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  { label: "مطبخ 3×3", cat: "مطبخ", w: 3, h: 3, color: "#E07B39", icon: "🍳",
    openings: [
      { side: "right", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "left", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  { label: "مطبخ مفتوح 4×5", cat: "مطبخ", w: 4, h: 5, color: "#A0845C", icon: "🍽️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "panoramic" },
    ]
  },
  { label: "مطبخ 2×3", cat: "مطبخ", w: 2, h: 3, color: "#E07B39", icon: "🍳",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" },
    ]
  },
  { label: "مطبخ 4×4", cat: "مطبخ", w: 4, h: 4, color: "#C96A28", icon: "🍽️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
      { side: "right", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  // ===== ردهات وممرات =====
  { label: "ردهة 3×4", cat: "ردهة", w: 3, h: 4, color: "#A0845C", icon: "🚶",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.2, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 1.2, type: "door", doorType: "single" },
    ]
  },
  { label: "ردهة 4×5", cat: "ردهة", w: 4, h: 5, color: "#A0845C", icon: "🚶",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.5, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 1.2, type: "door", doorType: "single" },
      { side: "left", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
    ]
  },
  { label: "ممر 1.2×4", cat: "ردهة", w: 1.2, h: 4, color: "#A0845C", icon: "↕️" },
  { label: "ممر 1.5×5", cat: "ردهة", w: 1.5, h: 5, color: "#A0845C", icon: "↕️" },
  { label: "ممر 1.2×6", cat: "ردهة", w: 1.2, h: 6, color: "#A0845C", icon: "↕️" },
  { label: "مدخل 3×3", cat: "ردهة", w: 3, h: 3, color: "#8B6914", icon: "🚪",
    openings: [{ side: "bottom", pos: 0.5, width: 1.2, type: "door", doorType: "double" }]
  },
  { label: "صالة 4×4", cat: "ردهة", w: 4, h: 4, color: "#8B6914", icon: "🏠",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "standard" },
    ]
  },
  // ===== مكاتب =====
  { label: "مكتب 3×4", cat: "مكتب", w: 3, h: 4, color: "#2980B9", icon: "💼",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  { label: "مكتب 4×5", cat: "مكتب", w: 4, h: 5, color: "#2980B9", icon: "💼",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "panoramic" },
    ]
  },
  { label: "مكتبة 3×3", cat: "مكتب", w: 3, h: 3, color: "#1A6A9A", icon: "📚",
    openings: [{ side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" }]
  },
  { label: "غرفة اجتماعات 5×6", cat: "مكتب", w: 5, h: 6, color: "#3498DB", icon: "🤝",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.0, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
  // ===== خدمات =====
  { label: "غرفة غسيل 2×2", cat: "خدمات", w: 2, h: 2, color: "#6B8E5A", icon: "🧺",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "غرفة غسيل 2×3", cat: "خدمات", w: 2, h: 3, color: "#6B8E5A", icon: "🧺",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "غرفة خادمة 2×3", cat: "خدمات", w: 2, h: 3, color: "#6B8E5A", icon: "🧹",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "مخزن 2×2", cat: "خدمات", w: 2, h: 2, color: "#6B8E5A", icon: "📦",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "مخزن 2×3", cat: "خدمات", w: 2, h: 3, color: "#6B8E5A", icon: "📦",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "غرفة مولد 2×2", cat: "خدمات", w: 2, h: 2, color: "#5A7A48", icon: "⚡",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  // ===== خارجي =====
  { label: "مسبح 5×10", cat: "خارجي", w: 5, h: 10, color: "#2196F3", icon: "🏊",
    openings: []
  },
  { label: "مسبح 4×8", cat: "خارجي", w: 4, h: 8, color: "#2196F3", icon: "🏊",
    openings: []
  },
  { label: "جلسة خارجية 4×5", cat: "خارجي", w: 4, h: 5, color: "#4CAF50", icon: "🌿",
    openings: []
  },
  { label: "حديقة 6×8", cat: "خارجي", w: 6, h: 8, color: "#388E3C", icon: "🌳",
    openings: []
  },
  { label: "موقف سيارة 3×6", cat: "خارجي", w: 3, h: 6, color: "#757575", icon: "🚗",
    openings: []
  },
  { label: "موقف سيارتين 6×6", cat: "خارجي", w: 6, h: 6, color: "#757575", icon: "🚗",
    openings: []
  },
  { label: "مدخل سيارة 4×8", cat: "خارجي", w: 4, h: 8, color: "#8D8D7A", icon: "🏠",
    openings: []
  },
  { label: "ملعب أطفال 5×5", cat: "خارجي", w: 5, h: 5, color: "#8BC34A", icon: "🎠",
    openings: []
  },
  { label: "شرفة 2×4", cat: "خارجي", w: 2, h: 4, color: "#4CAF50", icon: "🌺",
    openings: []
  },
  { label: "شرفة 3×5", cat: "خارجي", w: 3, h: 5, color: "#4CAF50", icon: "🌺",
    openings: []
  },
  { label: "ملحق خارجي 3×4", cat: "خارجي", w: 3, h: 4, color: "#7CB342", icon: "🏚️",
    openings: [{ side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" }]
  },
  // ===== مجالس إضافية =====
  { label: "مجلس 4×5", cat: "مجالس", w: 4, h: 5, color: "#D4A96A", icon: "🛋️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  { label: "مجلس 5×5", cat: "مجالس", w: 5, h: 5, color: "#D4A96A", icon: "🛋️",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.0, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "standard" },
    ]
  },
  { label: "مجلس كبير 8×10", cat: "مجالس", w: 8, h: 10, color: "#B8892A", icon: "🏛️",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.8, type: "door", doorType: "double" },
      { side: "left", pos: 0.3, width: 2.5, type: "window", windowType: "panoramic" },
      { side: "right", pos: 0.3, width: 2.5, type: "window", windowType: "panoramic" },
    ]
  },
  // ===== معيشة إضافية =====
  { label: "معيشة 3×4", cat: "معيشة", w: 3, h: 4, color: "#5BA85E", icon: "📺",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.0, type: "window", windowType: "standard" },
    ]
  },
  { label: "معيشة 7×8", cat: "معيشة", w: 7, h: 8, color: "#3D8B40", icon: "🏡",
    openings: [
      { side: "bottom", pos: 0.3, width: 1.0, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 2.5, type: "window", windowType: "panoramic" },
    ]
  },
  // ===== نوم إضافية =====
  { label: "غرفة نوم 2.5×3.5", cat: "نوم", w: 2.5, h: 3.5, color: "#C06080", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  { label: "غرفة نوم 5×5", cat: "نوم", w: 5, h: 5, color: "#7B68C8", icon: "🛏️",
    openings: [
      { side: "bottom", pos: 0.3, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
  // ===== حمام إضافي =====
  { label: "حمام 1.5×2", cat: "حمام", w: 1.5, h: 2, color: "#2A9D8F", icon: "🚿",
    openings: [{ side: "bottom", pos: 0.5, width: 0.7, type: "door", doorType: "single" }]
  },
  { label: "حمام 2×2.5", cat: "حمام", w: 2, h: 2.5, color: "#2A9D8F", icon: "🚿",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "حمام 3×4", cat: "حمام", w: 3, h: 4, color: "#1A8070", icon: "🛁",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.6, type: "window", windowType: "standard" },
    ]
  },
  { label: "حمام ماستر 3×5", cat: "حمام", w: 3, h: 5, color: "#0D6E62", icon: "🛁",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  // ===== دريسينج إضافي =====
  { label: "دريسينج 2×2", cat: "دريسينج", w: 2, h: 2, color: "#9B59B6", icon: "👗",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "دريسينج 2.5×3", cat: "دريسينج", w: 2.5, h: 3, color: "#9B59B6", icon: "👗",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "دريسينج 4×5", cat: "دريسينج", w: 4, h: 5, color: "#7D3C98", icon: "👔",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  // ===== مطبخ إضافي =====
  { label: "مطبخ 2×2", cat: "مطبخ", w: 2, h: 2, color: "#E07B39", icon: "🍳",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "مطبخ 3×4", cat: "مطبخ", w: 3, h: 4, color: "#E07B39", icon: "🍳",
    openings: [
      { side: "bottom", pos: 0.5, width: 0.9, type: "door", doorType: "single" },
      { side: "top", pos: 0.5, width: 0.8, type: "window", windowType: "standard" },
    ]
  },
  { label: "مطبخ مفتوح 5×5", cat: "مطبخ", w: 5, h: 5, color: "#B85A18", icon: "🍽️",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.2, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 1.2, type: "window", windowType: "panoramic" },
    ]
  },
  // ===== ردهة إضافية =====
  { label: "ممر 0.9×3", cat: "ردهة", w: 0.9, h: 3, color: "#A0845C", icon: "↕️" },
  { label: "ممر 1×4", cat: "ردهة", w: 1, h: 4, color: "#A0845C", icon: "↕️" },
  { label: "سلالم 2×4", cat: "ردهة", w: 2, h: 4, color: "#8B6914", icon: "🪜",
    openings: []
  },
  { label: "سلالم 3×5", cat: "ردهة", w: 3, h: 5, color: "#8B6914", icon: "🪜",
    openings: []
  },
  // ===== خدمات إضافية =====
  { label: "مطبخ خدمات 2×3", cat: "خدمات", w: 2, h: 3, color: "#6B8E5A", icon: "🍽️",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "غرفة تقنية 2×2", cat: "خدمات", w: 2, h: 2, color: "#4A6A38", icon: "💻",
    openings: [{ side: "right", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  // ===== مكتب إضافي =====
  { label: "مكتب 2×3", cat: "مكتب", w: 2, h: 3, color: "#2980B9", icon: "💼",
    openings: [{ side: "bottom", pos: 0.5, width: 0.8, type: "door", doorType: "single" }]
  },
  { label: "مكتب 5×6", cat: "مكتب", w: 5, h: 6, color: "#1A6A9A", icon: "🏢",
    openings: [
      { side: "bottom", pos: 0.5, width: 1.0, type: "door", doorType: "double" },
      { side: "top", pos: 0.5, width: 1.5, type: "window", windowType: "panoramic" },
    ]
  },
];

const DOOR_TYPES: { type: DoorType; label: string; icon: string }[] = [
  { type: "single", label: "باب واحد", icon: "🚪" },
  { type: "double", label: "مزدوج", icon: "🚪🚪" },
  { type: "sliding", label: "منزلق", icon: "↔️" },
  { type: "folding", label: "طي", icon: "📂" },
  { type: "pocket", label: "جيب", icon: "📥" },
  { type: "glass", label: "زجاجي", icon: "🪟" },
  { type: "arch", label: "قوس", icon: "⌒" },
  { type: "double_sliding", label: "منزلق مزدوج", icon: "⇔" },
  { type: "exterior", label: "خارجي", icon: "🏠" },
];

const WINDOW_TYPES: { type: WindowType; label: string; icon: string }[] = [
  { type: "standard", label: "عادية", icon: "🪟" },
  { type: "panoramic", label: "بانورامية", icon: "🖼️" },
  { type: "french", label: "فرنسية", icon: "🚪" },
  { type: "opening", label: "فتحة", icon: "⬜" },
  { type: "fixed", label: "ثابتة", icon: "🔲" },
  { type: "arch", label: "قوس", icon: "⌒" },
  { type: "full_panoramic", label: "بانوراما كاملة", icon: "🌅" },
  { type: "clerestory", label: "شباك علوي", icon: "⬛" },
  { type: "skylight", label: "كوّة سقف", icon: "☀️" },
];

const ELECTRICAL_TYPES: { type: ElectricalType; label: string; symbol: string; color: string }[] = [
  { type: "outlet", label: "مخرج كهرباء", symbol: "⊕", color: "#e74c3c" },
  { type: "switch", label: "مفتاح إضاءة", symbol: "S", color: "#e67e22" },
  { type: "light", label: "نقطة إضاءة", symbol: "✦", color: "#f1c40f" },
  { type: "panel", label: "لوحة كهربائية", symbol: "⊞", color: "#8e44ad" },
  { type: "tv", label: "مخرج TV", symbol: "TV", color: "#2980b9" },
  { type: "data", label: "مخرج بيانات", symbol: "D", color: "#27ae60" },
  { type: "outlet_3phase", label: "مخرج 3 فاز", symbol: "3Φ", color: "#c0392b" },
  { type: "outdoor_outlet", label: "مخرج خارجي", symbol: "⊕○", color: "#d35400" },
  { type: "doorbell", label: "جرس باب", symbol: "🔔", color: "#f39c12" },
  { type: "camera", label: "كاميرا مراقبة", symbol: "📷", color: "#2c3e50" },
  { type: "intercom", label: "إنترفون", symbol: "📞", color: "#16a085" },
];

const AC_TYPES: { type: ACType; label: string; symbol: string; color: string }[] = [
  { type: "split", label: "سبليت", symbol: "AC", color: "#3498db" },
  { type: "central", label: "مركزي", symbol: "⊙", color: "#2ecc71" },
  { type: "window_unit", label: "شباك", symbol: "W", color: "#1abc9c" },
  { type: "floor_standing", label: "فلور ستاندينج", symbol: "FS", color: "#9b59b6" },
  { type: "vrf", label: "VRF", symbol: "VRF", color: "#e74c3c" },
  { type: "heat_pump", label: "مضخة حرارة", symbol: "HP", color: "#e67e22" },
  { type: "cassette", label: "كاسيت", symbol: "⊞", color: "#9b59b6" },
];

const ROOM_COLORS = ["#D4A96A","#5BA85E","#7B68C8","#C06080","#E07B39","#2A9D8F","#9B59B6","#8B6914","#6B8E5A","#A0845C"];
const SCALE = 60; // px per meter
const GRID_SIZE = 0.5; // snap to 0.5m grid

function generateId() { return Math.random().toString(36).slice(2, 9); }
function snap(v: number, grid = GRID_SIZE) { return Math.round(v / grid) * grid; }
function dist(a: Point, b: Point) { return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2); }

// ===== Canvas Drawing Engine =====
function drawAll(
  ctx: CanvasRenderingContext2D,
  elements: DrawElement[],
  selectedIds: Set<string>,
  viewOffset: Point,
  zoom: number,
  drawingState: DrawingState | null,
  hoveredId: string | null
) {
  const sc = SCALE * zoom;
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = "#f8f4ee";
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.save();
  const gridPx = sc * GRID_SIZE;
  const startX = ((viewOffset.x % gridPx) + gridPx) % gridPx;
  const startY = ((viewOffset.y % gridPx) + gridPx) % gridPx;
  ctx.strokeStyle = "#e8ddd0";
  ctx.lineWidth = 0.4;
  for (let x = startX; x < W; x += gridPx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = startY; y < H; y += gridPx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // 1m grid accent
  const meterPx = sc;
  const mStartX = ((viewOffset.x % meterPx) + meterPx) % meterPx;
  const mStartY = ((viewOffset.y % meterPx) + meterPx) % meterPx;
  ctx.strokeStyle = "#d4c8b8";
  ctx.lineWidth = 0.8;
  for (let x = mStartX; x < W; x += meterPx) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = mStartY; y < H; y += meterPx) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // Draw elements
  for (const el of elements) {
    const isSelected = selectedIds.has(el.id);
    const isHovered = hoveredId === el.id;
    drawElement(ctx, el, isSelected, isHovered, viewOffset, sc);
  }

  // Drawing preview
  if (drawingState) {
    drawPreview(ctx, drawingState, viewOffset, sc);
  }

  // Compass
  drawCompass(ctx, W - 50, 50);
}

function worldToScreen(x: number, y: number, offset: Point, sc: number): Point {
  return { x: x * sc + offset.x, y: y * sc + offset.y };
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: DrawElement,
  selected: boolean,
  hovered: boolean,
  offset: Point,
  sc: number
) {
  ctx.save();
  if (el.type === "room") {
    drawRoom(ctx, el as RoomShape, selected, hovered, offset, sc);
  } else if (el.type === "wall") {
    drawWall(ctx, el as Wall, selected, hovered, offset, sc);
  } else if (el.type === "door") {
    drawDoor(ctx, el as Opening, selected, hovered, offset, sc);
  } else if (el.type === "window") {
    drawWindow(ctx, el as Opening, selected, hovered, offset, sc);
  } else if (el.type === "electrical") {
    drawElectrical(ctx, el as ElectricalSymbol, selected, hovered, offset, sc);
  } else if (el.type === "ac") {
    drawAC(ctx, el as ACSymbol, selected, hovered, offset, sc);
  }
  ctx.restore();
}

function drawRoom(ctx: CanvasRenderingContext2D, room: RoomShape, selected: boolean, hovered: boolean, offset: Point, sc: number) {
  const p = worldToScreen(room.x, room.y, offset, sc);
  const rw = room.width * sc;
  const rh = room.height * sc;
  const tw = (room.wallThickness / 100) * sc;

  // Fill
  ctx.fillStyle = room.color + "cc";
  ctx.fillRect(p.x, p.y, rw, rh);

  // Wall thickness visual
  ctx.strokeStyle = selected ? "#C9A84C" : hovered ? "#b8960f" : "#5C3D11";
  ctx.lineWidth = Math.max(tw, 2);
  ctx.strokeRect(p.x, p.y, rw, rh);

  // Selection highlight
  if (selected) {
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(p.x - 4, p.y - 4, rw + 8, rh + 8);
    ctx.setLineDash([]);
    drawResizeHandles(ctx, p.x, p.y, rw, rh);
  }

  // Label
  const fontSize = Math.max(10, Math.min(sc * 0.22, 18));
  ctx.font = `bold ${fontSize}px Cairo, sans-serif`;
  ctx.fillStyle = "#3d2a0a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(room.label, p.x + rw / 2, p.y + rh / 2 - fontSize * 0.6);

  // Dimensions
  const dimFont = Math.max(8, Math.min(sc * 0.15, 13));
  ctx.font = `${dimFont}px Cairo, sans-serif`;
  ctx.fillStyle = "#7a5c2a";
  ctx.fillText(`${room.width}×${room.height}م`, p.x + rw / 2, p.y + rh / 2 + dimFont * 0.8);

  // Dimension lines
  if (selected || hovered) {
    drawDimensionLine(ctx, p.x, p.y + rh + 12, p.x + rw, p.y + rh + 12, `${room.width}م`);
    drawDimensionLine(ctx, p.x - 12, p.y, p.x - 12, p.y + rh, `${room.height}م`, true);
  }
}

function drawWall(ctx: CanvasRenderingContext2D, wall: Wall, selected: boolean, hovered: boolean, offset: Point, sc: number) {
  const x1 = wall.x1 * sc + offset.x;
  const y1 = wall.y1 * sc + offset.y;
  const x2 = wall.x2 * sc + offset.x;
  const y2 = wall.y2 * sc + offset.y;
  const tw = Math.max((wall.thickness / 100) * sc, 3);

  const colors: Record<WallType, string> = {
    normal: "#5C3D11",
    load_bearing: "#2c1a05",
    glass: "#4a90d9",
    partition: "#8B6914",
  };

  ctx.strokeStyle = selected ? "#C9A84C" : hovered ? "#b8960f" : colors[wall.wallType];
  ctx.lineWidth = tw;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  if (wall.wallType === "glass") {
    ctx.strokeStyle = "#a8d4f5";
    ctx.lineWidth = tw * 0.4;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  if (wall.wallType === "load_bearing") {
    // Hatch pattern for load bearing
    const len = dist({ x: x1, y: y1 }, { x: x2, y: y2 });
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.strokeStyle = "#2c1a05";
    ctx.lineWidth = 1;
    for (let i = 0; i < len; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, -tw / 2);
      ctx.lineTo(i + 4, tw / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Dimension on hover/select
  if (selected || hovered) {
    const length = dist({ x: wall.x1, y: wall.y1 }, { x: wall.x2, y: wall.y2 });
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    ctx.fillStyle = "#5C3D11";
    ctx.font = "bold 11px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${length.toFixed(2)}م`, mx, my - 4);
    ctx.fillText(`${wall.thickness}سم`, mx, my + 14);
  }

  // Endpoints
  if (selected) {
    [{ x: x1, y: y1 }, { x: x2, y: y2 }].forEach(pt => {
      ctx.fillStyle = "#C9A84C";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

function drawDoor(ctx: CanvasRenderingContext2D, door: Opening, selected: boolean, hovered: boolean, offset: Point, sc: number) {
  const cx = door.x * sc + offset.x;
  const cy = door.y * sc + offset.y;
  const dw = door.width * sc;
  const rad = (door.rotation * Math.PI) / 180;
  const wallT = 12; // wall gap thickness in px

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);

  const color = selected ? "#C9A84C" : hovered ? "#e6a817" : "#5C3D11";

  // ===== WALL GAP (white break in wall) =====
  ctx.fillStyle = "#faf6f0";
  ctx.fillRect(-dw / 2, -wallT / 2, dw, wallT);

  // ===== DOOR FRAME (jambs) =====
  ctx.strokeStyle = color;
  ctx.lineWidth = selected ? 3 : 2.5;
  // Left jamb
  ctx.beginPath();
  ctx.moveTo(-dw / 2, -wallT / 2);
  ctx.lineTo(-dw / 2, wallT / 2);
  ctx.stroke();
  // Right jamb
  ctx.beginPath();
  ctx.moveTo(dw / 2, -wallT / 2);
  ctx.lineTo(dw / 2, wallT / 2);
  ctx.stroke();

  // ===== DOOR LEAF + SWING =====
  ctx.lineWidth = selected ? 2.5 : 2;
  ctx.strokeStyle = color;

  if (door.doorType === "sliding") {
    // Sliding: door panel with arrows
    ctx.fillStyle = color + "22";
    ctx.fillRect(-dw / 2, -wallT / 2, dw * 0.7, wallT);
    ctx.strokeRect(-dw / 2, -wallT / 2, dw * 0.7, wallT);
    // Arrow indicating slide direction
    ctx.beginPath();
    ctx.moveTo(dw / 2 - 6, -wallT / 2 - 6);
    ctx.lineTo(dw / 2 + 4, 0);
    ctx.lineTo(dw / 2 - 6, wallT / 2 + 6);
    ctx.stroke();
  } else if (door.doorType === "double") {
    // Double door: two arcs from each jamb
    const hw = dw / 2;
    const swingDir = door.swingIn ? 1 : -1;
    // Left leaf
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.arc(-hw, 0, hw, 0, swingDir * Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(-hw + hw * Math.cos(swingDir * Math.PI / 2), hw * Math.sin(swingDir * Math.PI / 2));
    ctx.stroke();
    // Right leaf
    ctx.beginPath();
    ctx.moveTo(hw, 0);
    ctx.arc(hw, 0, hw, Math.PI, Math.PI - swingDir * Math.PI / 2, swingDir < 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(hw, 0);
    ctx.lineTo(hw + hw * Math.cos(Math.PI - swingDir * Math.PI / 2), hw * Math.sin(Math.PI - swingDir * Math.PI / 2));
    ctx.stroke();
  } else if (door.doorType === "folding") {
    // Folding: zigzag leaf
    const seg = dw / 4;
    const swingDir = door.swingIn ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(-dw / 2, 0);
    ctx.lineTo(-dw / 2 + seg, swingDir * dw / 4);
    ctx.lineTo(-dw / 2 + seg * 2, 0);
    ctx.lineTo(-dw / 2 + seg * 3, swingDir * dw / 4);
    ctx.lineTo(dw / 2, 0);
    ctx.stroke();
  } else if (door.doorType === "pocket") {
    // Pocket: door slides into wall
    ctx.fillStyle = color + "33";
    ctx.fillRect(-dw / 2, -wallT / 2, dw * 0.6, wallT);
    ctx.strokeRect(-dw / 2, -wallT / 2, dw * 0.6, wallT);
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(-dw / 2 + dw * 0.6, -wallT / 2 - 4);
    ctx.lineTo(dw / 2, -wallT / 2 - 4);
    ctx.moveTo(-dw / 2 + dw * 0.6, wallT / 2 + 4);
    ctx.lineTo(dw / 2, wallT / 2 + 4);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    // Single door (default): arc swing — architectural standard
    const swingDir = door.swingIn ? 1 : -1;
    // Door leaf line
    ctx.beginPath();
    ctx.moveTo(-dw / 2, 0);
    ctx.lineTo(-dw / 2 + dw * Math.cos(swingDir * Math.PI / 2), dw * Math.sin(swingDir * Math.PI / 2));
    ctx.stroke();
    // Swing arc
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = color + "99";
    ctx.beginPath();
    ctx.moveTo(-dw / 2 + dw, 0);
    ctx.arc(-dw / 2, 0, dw, 0, swingDir * Math.PI / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ===== LABEL =====
  ctx.font = "bold 9px Cairo, sans-serif";
  ctx.fillStyle = selected ? "#C9A84C" : "#8B6914";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`${door.width.toFixed(1)}م`, 0, wallT / 2 + 5);

  if (selected) {
    drawRotateHandle(ctx, 0, -dw / 2 - 14);
  }
  ctx.restore();
}

function drawWindow(ctx: CanvasRenderingContext2D, win: Opening, selected: boolean, hovered: boolean, offset: Point, sc: number) {
  const cx = win.x * sc + offset.x;
  const cy = win.y * sc + offset.y;
  const ww = win.width * sc;
  const rad = (win.rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rad);

  const color = selected ? "#C9A84C" : hovered ? "#b8960f" : "#4a90d9";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  if (win.windowType === "panoramic") {
    // Wide panoramic
    ctx.clearRect(-ww / 2, -5, ww, 10);
    ctx.strokeRect(-ww / 2, -5, ww, 10);
    ctx.fillStyle = "#d0e8f8aa";
    ctx.fillRect(-ww / 2, -5, ww, 10);
    // Multiple panes
    const panes = Math.max(3, Math.floor(win.width / 0.6));
    for (let i = 1; i < panes; i++) {
      const px = -ww / 2 + (ww / panes) * i;
      ctx.beginPath();
      ctx.moveTo(px, -5); ctx.lineTo(px, 5);
      ctx.stroke();
    }
  } else if (win.windowType === "french") {
    // French door/window
    ctx.clearRect(-ww / 2, -5, ww, 10);
    ctx.strokeRect(-ww / 2, -5, ww, 10);
    ctx.fillStyle = "#d0e8f8aa";
    ctx.fillRect(-ww / 2, -5, ww, 10);
    ctx.beginPath();
    ctx.moveTo(0, -5); ctx.lineTo(0, 5);
    ctx.stroke();
    // Arcs
    ctx.beginPath();
    ctx.arc(-ww / 4, 5, ww / 4, 0, -Math.PI, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ww / 4, 5, ww / 4, Math.PI, 0, true);
    ctx.stroke();
  } else {
    // Standard window
    ctx.clearRect(-ww / 2, -4, ww, 8);
    ctx.strokeRect(-ww / 2, -4, ww, 8);
    ctx.fillStyle = "#d0e8f8aa";
    ctx.fillRect(-ww / 2, -4, ww, 8);
    // Glass lines
    const panes = Math.max(2, Math.floor(win.width / 0.5));
    for (let i = 1; i < panes; i++) {
      const px = -ww / 2 + (ww / panes) * i;
      ctx.beginPath();
      ctx.moveTo(px, -4); ctx.lineTo(px, 4);
      ctx.stroke();
    }
  }

  // Label
  ctx.font = "bold 8px Cairo, sans-serif";
  ctx.fillStyle = "#4a90d9";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(`نافذة ${win.width}م`, 0, 8);

  if (selected) {
    drawRotateHandle(ctx, 0, -16);
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(-ww / 2 - 4, -12, ww + 8, 24);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawElectrical(ctx: CanvasRenderingContext2D, el: ElectricalSymbol, selected: boolean, hovered: boolean, offset: Point, sc: number) {
  const cx = el.x * sc + offset.x;
  const cy = el.y * sc + offset.y;
  const info = ELECTRICAL_TYPES.find(e => e.type === el.elType)!;
  const r = 10;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);

  // Circle background
  ctx.fillStyle = selected ? "#C9A84C22" : hovered ? "#e8d9c022" : "#fff";
  ctx.strokeStyle = selected ? "#C9A84C" : info.color;
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Symbol
  ctx.fillStyle = info.color;
  ctx.font = `bold ${el.elType === "tv" || el.elType === "data" ? 7 : 11}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(info.symbol, 0, 0);

  // Label
  ctx.font = "7px Cairo, sans-serif";
  ctx.fillStyle = "#5C3D11";
  ctx.textBaseline = "top";
  ctx.fillText(info.label, 0, r + 2);

  if (selected) drawRotateHandle(ctx, 0, -r - 12);
  ctx.restore();
}

function drawAC(ctx: CanvasRenderingContext2D, ac: ACSymbol, selected: boolean, hovered: boolean, offset: Point, sc: number) {
  const cx = ac.x * sc + offset.x;
  const cy = ac.y * sc + offset.y;
  const info = AC_TYPES.find(a => a.type === ac.acType)!;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((ac.rotation * Math.PI) / 180);

  // Rectangle body
  const bw = 28, bh = 14;
  ctx.fillStyle = selected ? "#e8f4fd" : hovered ? "#d0eaf8" : "#f0f8ff";
  ctx.strokeStyle = selected ? "#C9A84C" : info.color;
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
  ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);

  // Symbol
  ctx.fillStyle = info.color;
  ctx.font = `bold 8px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(info.symbol, 0, 0);

  // Airflow lines
  ctx.strokeStyle = info.color + "88";
  ctx.lineWidth = 1;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 6, bh / 2);
    ctx.lineTo(i * 6, bh / 2 + 6);
    ctx.stroke();
  }

  // Label
  ctx.font = "7px Cairo, sans-serif";
  ctx.fillStyle = "#5C3D11";
  ctx.textBaseline = "top";
  ctx.fillText(info.label, 0, bh / 2 + 8);
  if (ac.capacity) ctx.fillText(ac.capacity, 0, bh / 2 + 16);

  if (selected) drawRotateHandle(ctx, 0, -bh / 2 - 12);
  ctx.restore();
}

function drawResizeHandles(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const handles = [
    { x: x, y: y }, { x: x + w / 2, y: y }, { x: x + w, y: y },
    { x: x + w, y: y + h / 2 }, { x: x + w, y: y + h },
    { x: x + w / 2, y: y + h }, { x: x, y: y + h }, { x: x, y: y + h / 2 },
  ];
  handles.forEach(h => {
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(h.x - 4, h.y - 4, 8, 8);
    ctx.fill();
    ctx.stroke();
  });
}

function drawRotateHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#C9A84C";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 1.5);
  ctx.stroke();
}

function drawDimensionLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, label: string, vertical = false) {
  ctx.save();
  ctx.strokeStyle = "#C9A84C";
  ctx.fillStyle = "#C9A84C";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Ticks
  if (!vertical) {
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 4); ctx.lineTo(x1, y1 + 4);
    ctx.moveTo(x2, y2 - 4); ctx.lineTo(x2, y2 + 4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(x1 - 4, y1); ctx.lineTo(x1 + 4, y1);
    ctx.moveTo(x2 - 4, y2); ctx.lineTo(x2 + 4, y2);
    ctx.stroke();
  }
  // Label
  ctx.font = "bold 10px Cairo, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(mx - 16, my - 7, 32, 14);
  ctx.fillStyle = "#C9A84C";
  ctx.fillText(label, mx, my);
  ctx.restore();
}

function drawPreview(ctx: CanvasRenderingContext2D, state: DrawingState, offset: Point, sc: number) {
  if (state.tool === "wall" && state.startPoint && state.currentPoint) {
    const x1 = state.startPoint.x * sc + offset.x;
    const y1 = state.startPoint.y * sc + offset.y;
    const x2 = state.currentPoint.x * sc + offset.x;
    const y2 = state.currentPoint.y * sc + offset.y;
    const tw = Math.max((state.wallThickness / 100) * sc, 3);
    ctx.strokeStyle = "#C9A84C88";
    ctx.lineWidth = tw;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    const len = dist(state.startPoint, state.currentPoint);
    ctx.fillStyle = "#C9A84C";
    ctx.font = "bold 11px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${len.toFixed(2)}م`, (x1 + x2) / 2, (y1 + y2) / 2 - 10);
  } else if (state.tool === "room" && state.startPoint && state.currentPoint) {
    const x = Math.min(state.startPoint.x, state.currentPoint.x) * sc + offset.x;
    const y = Math.min(state.startPoint.y, state.currentPoint.y) * sc + offset.y;
    const w = Math.abs(state.currentPoint.x - state.startPoint.x) * sc;
    const h = Math.abs(state.currentPoint.y - state.startPoint.y) * sc;
    ctx.fillStyle = "#C9A84C22";
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    const rw = Math.abs(state.currentPoint.x - state.startPoint.x);
    const rh = Math.abs(state.currentPoint.y - state.startPoint.y);
    ctx.fillStyle = "#C9A84C";
    ctx.font = "bold 11px Cairo, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${snap(rw).toFixed(1)}×${snap(rh).toFixed(1)}م`, x + w / 2, y + h / 2);
    drawDimensionLine(ctx, x, y + h + 12, x + w, y + h + 12, `${snap(rw).toFixed(1)}م`);
    drawDimensionLine(ctx, x - 12, y, x - 12, y + h, `${snap(rh).toFixed(1)}م`, true);
  }
}

function drawCompass(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  ctx.moveTo(0, -18); ctx.lineTo(5, 6); ctx.lineTo(0, 3); ctx.lineTo(-5, 6); ctx.closePath();
  ctx.fillStyle = "#C9A84C";
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 18); ctx.lineTo(5, -6); ctx.lineTo(0, -3); ctx.lineTo(-5, -6); ctx.closePath();
  ctx.fillStyle = "#ccc";
  ctx.fill();
  ctx.font = "bold 11px Cairo, sans-serif";
  ctx.fillStyle = "#5C3D11";
  ctx.textAlign = "center";
  ctx.fillText("ش", 0, -26);
  ctx.restore();
}

// ===== Drawing State =====
interface DrawingState {
  tool: DrawTool;
  startPoint: Point | null;
  currentPoint: Point | null;
  wallThickness: number;
  wallType: WallType;
  doorType: DoorType;
  windowType: WindowType;
  elType: ElectricalType;
  acType: ACType;
  doorWidth: number;
  windowWidth: number;
}

// ===== Hit Testing =====
function hitTest(el: DrawElement, px: number, py: number, sc: number, offset: Point): boolean {
  if (el.type === "room") {
    const r = el as RoomShape;
    const x = r.x * sc + offset.x;
    const y = r.y * sc + offset.y;
    return px >= x && px <= x + r.width * sc && py >= y && py <= y + r.height * sc;
  }
  if (el.type === "wall") {
    const w = el as Wall;
    const x1 = w.x1 * sc + offset.x;
    const y1 = w.y1 * sc + offset.y;
    const x2 = w.x2 * sc + offset.x;
    const y2 = w.y2 * sc + offset.y;
    const tw = Math.max((w.thickness / 100) * sc, 8);
    // Distance from point to line segment
    const len2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (len2 === 0) return dist({ x: px, y: py }, { x: x1, y: y1 }) < tw;
    const t = Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / len2));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return dist({ x: px, y: py }, { x: projX, y: projY }) < tw / 2 + 4;
  }
  if (el.type === "door" || el.type === "window") {
    const o = el as Opening;
    const cx = o.x * sc + offset.x;
    const cy = o.y * sc + offset.y;
    return dist({ x: px, y: py }, { x: cx, y: cy }) < o.width * sc / 2 + 12;
  }
  if (el.type === "electrical" || el.type === "ac") {
    const s = el as ElectricalSymbol | ACSymbol;
    const cx = s.x * sc + offset.x;
    const cy = s.y * sc + offset.y;
    return dist({ x: px, y: py }, { x: cx, y: cy }) < 18;
  }
  return false;
}

// ===== Main Component =====
export default function VoiceDesigner() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [elements, setElements] = useState<DrawElement[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewOffset, setViewOffset] = useState<Point>({ x: 60, y: 80 });
  const [activeTool, setActiveTool] = useState<DrawTool>("select");

  // History for undo/redo
  const historyRef = useRef<HistoryEntry[]>([{ elements: [] }]);
  const historyIndexRef = useRef(0);

  // Drawing state
  const [drawingState, setDrawingState] = useState<DrawingState>({
    tool: "select",
    startPoint: null,
    currentPoint: null,
    wallThickness: 20,
    wallType: "normal",
    doorType: "single",
    windowType: "standard",
    elType: "outlet",
    acType: "split",
    doorWidth: 0.9,
    windowWidth: 1.2,
  });

  // Pan state
  const panRef = useRef<{ active: boolean; startX: number; startY: number; offsetStart: Point }>({
    active: false, startX: 0, startY: 0, offsetStart: { x: 0, y: 0 }
  });

  // Drag state
  const dragRef = useRef<{ active: boolean; id: string; startWorld: Point; elemStart: Point }>({
    active: false, id: "", startWorld: { x: 0, y: 0 }, elemStart: { x: 0, y: 0 }
  });

  // UI state
  const [showLibrary, setShowLibrary] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [libCategory, setLibCategory] = useState<string>("معيشة");
  const [showElPanel, setShowElPanel] = useState(false);
  const [showACPanel, setShowACPanel] = useState(false);
  const [showDoorPanel, setShowDoorPanel] = useState(false);
  const [showWinPanel, setShowWinPanel] = useState(false);
  // Quick actions floating toolbar
  const [quickActionsPos, setQuickActionsPos] = useState<{ x: number; y: number } | null>(null);
  const [show3DModal, setShow3DModal] = useState(false);
  const [renderStyle, setRenderStyle] = useState<"modern" | "classic" | "gulf" | "minimal">("modern");
  const [renderView, setRenderView] = useState<"perspective" | "top" | "front" | "aerial">("perspective");
  const [is3DLoading, setIs3DLoading] = useState(false);
  const [render3DUrl, setRender3DUrl] = useState<string | null>(null);
  const [showBOQ, setShowBOQ] = useState(false);

  // ===== History =====
  const pushHistory = useCallback((newElements: DrawElement[]) => {
    const idx = historyIndexRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push({ elements: JSON.parse(JSON.stringify(newElements)) });
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const entry = historyRef.current[historyIndexRef.current];
      setElements(JSON.parse(JSON.stringify(entry.elements)));
      setSelectedIds(new Set());
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const entry = historyRef.current[historyIndexRef.current];
      setElements(JSON.parse(JSON.stringify(entry.elements)));
      setSelectedIds(new Set());
    }
  }, []);

  // ===== Canvas Redraw =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawAll(ctx, elements, selectedIds, viewOffset, zoom, drawingState, hoveredId);
  }, [elements, selectedIds, viewOffset, zoom, drawingState, hoveredId]);

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) drawAll(ctx, elements, selectedIds, viewOffset, zoom, drawingState, hoveredId);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [elements, selectedIds, viewOffset, zoom, drawingState, hoveredId]);

  // ===== Keyboard Shortcuts =====
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") { e.preventDefault(); undo(); }
        if (e.key === "y") { e.preventDefault(); redo(); }
        if (e.key === "c") { e.preventDefault(); copySelected(); }
        if (e.key === "v") { e.preventDefault(); pasteSelected(); }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        // Don't delete element when user is typing in an input/textarea
        const target = e.target as HTMLElement;
        const isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
        if (!isTyping && selectedIds.size > 0) deleteSelected();
      }
      if (e.key === "Escape") {
        setActiveTool("select");
        setDrawingState(s => ({ ...s, startPoint: null, currentPoint: null }));
        setSelectedIds(new Set());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedIds, elements]);

  // ===== Screen to World =====
  const screenToWorld = useCallback((sx: number, sy: number): Point => {
    return {
      x: snap((sx - viewOffset.x) / (SCALE * zoom)),
      y: snap((sy - viewOffset.y) / (SCALE * zoom)),
    };
  }, [viewOffset, zoom]);

  // ===== Mouse Handlers =====
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const sc = SCALE * zoom;

    if (activeTool === "pan" || e.button === 1 || (e.button === 0 && e.altKey)) {
      panRef.current = { active: true, startX: sx, startY: sy, offsetStart: { ...viewOffset } };
      return;
    }

    if (activeTool === "select") {
      // Hit test
      let hit: DrawElement | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (hitTest(elements[i], sx, sy, sc, viewOffset)) {
          hit = elements[i];
          break;
        }
      }
      if (hit) {
        if (e.shiftKey) {
          setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(hit!.id) ? next.delete(hit!.id) : next.add(hit!.id);
            return next;
          });
        } else {
          setSelectedIds(new Set([hit.id]));
          // Start drag
          const el = hit;
          let elemStart: Point = { x: 0, y: 0 };
          if (el.type === "room") elemStart = { x: (el as RoomShape).x, y: (el as RoomShape).y };
          else if (el.type === "wall") elemStart = { x: (el as Wall).x1, y: (el as Wall).y1 };
          else if (el.type === "door" || el.type === "window") elemStart = { x: (el as Opening).x, y: (el as Opening).y };
          else if (el.type === "electrical") elemStart = { x: (el as ElectricalSymbol).x, y: (el as ElectricalSymbol).y };
          else if (el.type === "ac") elemStart = { x: (el as ACSymbol).x, y: (el as ACSymbol).y };
          dragRef.current = { active: true, id: hit.id, startWorld: world, elemStart };
        }
        setShowProperties(true);
        // Show quick actions toolbar above the element
        setQuickActionsPos({ x: sx, y: sy - 50 });
      } else {
        setSelectedIds(new Set());
        setShowProperties(false);
        setQuickActionsPos(null);
        panRef.current = { active: true, startX: sx, startY: sy, offsetStart: { ...viewOffset } };
      }
      return;
    }

    // Drawing tools
    if (activeTool === "wall" || activeTool === "room") {
      setDrawingState(s => ({ ...s, startPoint: world, currentPoint: world }));
    } else if (activeTool === "door") {
      const newDoor: Opening = {
        id: generateId(), type: "door",
        x: world.x, y: world.y,
        width: drawingState.doorWidth, height: 2.1,
        rotation: 0, doorType: drawingState.doorType, swingIn: true,
      };
      const newEls = [...elements, newDoor];
      setElements(newEls);
      pushHistory(newEls);
      setSelectedIds(new Set([newDoor.id]));
      setShowProperties(true);
    } else if (activeTool === "window") {
      const newWin: Opening = {
        id: generateId(), type: "window",
        x: world.x, y: world.y,
        width: drawingState.windowWidth, height: 1.2,
        rotation: 0, windowType: drawingState.windowType,
      };
      const newEls = [...elements, newWin];
      setElements(newEls);
      pushHistory(newEls);
      setSelectedIds(new Set([newWin.id]));
      setShowProperties(true);
    } else if (activeTool === "electrical") {
      const newEl: ElectricalSymbol = {
        id: generateId(), type: "electrical",
        x: world.x, y: world.y,
        elType: drawingState.elType, rotation: 0,
      };
      const newEls = [...elements, newEl];
      setElements(newEls);
      pushHistory(newEls);
    } else if (activeTool === "ac") {
      const newAC: ACSymbol = {
        id: generateId(), type: "ac",
        x: world.x, y: world.y,
        acType: drawingState.acType, rotation: 0,
      };
      const newEls = [...elements, newAC];
      setElements(newEls);
      pushHistory(newEls);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);
    const sc = SCALE * zoom;

    // Pan
    if (panRef.current.active) {
      setViewOffset({
        x: panRef.current.offsetStart.x + (sx - panRef.current.startX),
        y: panRef.current.offsetStart.y + (sy - panRef.current.startY),
      });
      return;
    }

    // Drag element
    if (dragRef.current.active) {
      const dx = world.x - dragRef.current.startWorld.x;
      const dy = world.y - dragRef.current.startWorld.y;
      const id = dragRef.current.id;
      setElements(prev => prev.map(el => {
        if (el.id !== id) return el;
        if (el.type === "room") {
          return { ...el, x: snap(dragRef.current.elemStart.x + dx), y: snap(dragRef.current.elemStart.y + dy) };
        }
        if (el.type === "wall") {
          const w = el as Wall;
          const newX1 = snap(dragRef.current.elemStart.x + dx);
          const newY1 = snap(dragRef.current.elemStart.y + dy);
          const dxw = w.x2 - w.x1;
          const dyw = w.y2 - w.y1;
          return { ...w, x1: newX1, y1: newY1, x2: newX1 + dxw, y2: newY1 + dyw };
        }
        if (el.type === "door" || el.type === "window" || el.type === "electrical" || el.type === "ac") {
          return { ...el, x: snap(dragRef.current.elemStart.x + dx), y: snap(dragRef.current.elemStart.y + dy) };
        }
        return el;
      }));
      return;
    }

    // Drawing preview
    if ((activeTool === "wall" || activeTool === "room") && drawingState.startPoint) {
      setDrawingState(s => ({ ...s, currentPoint: world }));
    }

    // Hover
    if (activeTool === "select") {
      let hit: string | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (hitTest(elements[i], sx, sy, sc, viewOffset)) {
          hit = elements[i].id;
          break;
        }
      }
      setHoveredId(hit);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (panRef.current.active) {
      panRef.current.active = false;
      return;
    }

    if (dragRef.current.active) {
      dragRef.current.active = false;
      pushHistory(elements);
      return;
    }

    if (activeTool === "wall" && drawingState.startPoint) {
      const len = dist(drawingState.startPoint, world);
      if (len > 0.1) {
        const newWall: Wall = {
          id: generateId(), type: "wall",
          x1: drawingState.startPoint.x, y1: drawingState.startPoint.y,
          x2: world.x, y2: world.y,
          thickness: drawingState.wallThickness,
          wallType: drawingState.wallType,
          rotation: 0,
        };
        const newEls = [...elements, newWall];
        setElements(newEls);
        pushHistory(newEls);
        // Continue from end point
        setDrawingState(s => ({ ...s, startPoint: world, currentPoint: world }));
      }
    } else if (activeTool === "room" && drawingState.startPoint) {
      const rawW = snap(Math.abs(world.x - drawingState.startPoint.x));
      const rawH = snap(Math.abs(world.y - drawingState.startPoint.y));
      // If tap (very small drag), create default 4x5 room
      const w = rawW < 1 ? 4 : rawW;
      const h = rawH < 1 ? 5 : rawH;
      const newRoom: RoomShape = {
        id: generateId(), type: "room",
        x: Math.min(drawingState.startPoint.x, world.x),
        y: Math.min(drawingState.startPoint.y, world.y),
        width: w, height: h,
        label: "غرفة",
        color: ROOM_COLORS[elements.filter(e => e.type === "room").length % ROOM_COLORS.length],
        wallThickness: drawingState.wallThickness,
      };
      const newEls = [...elements, newRoom];
      setElements(newEls);
      pushHistory(newEls);
      setSelectedIds(new Set([newRoom.id]));
      setShowProperties(true);
      setDrawingState(s => ({ ...s, startPoint: null, currentPoint: null }));
      setActiveTool("select");
    }
  };

  // Touch support
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const lastPinchRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
      panRef.current = {
        active: activeTool === "pan" || activeTool === "select",
        startX: t.clientX, startY: t.clientY,
        offsetStart: { ...viewOffset }
      };
      // Simulate mouse down for drawing tools
      if (activeTool !== "pan" && activeTool !== "select") {
        const rect = canvasRef.current!.getBoundingClientRect();
        const sx = t.clientX - rect.left;
        const sy = t.clientY - rect.top;
        const world = screenToWorld(sx, sy);
        if (activeTool === "wall" || activeTool === "room") {
          setDrawingState(s => ({ ...s, startPoint: world, currentPoint: world }));
        }
      }
    } else if (e.touches.length === 2) {
      panRef.current.active = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (panRef.current.active) {
        setViewOffset({
          x: panRef.current.offsetStart.x + (t.clientX - panRef.current.startX),
          y: panRef.current.offsetStart.y + (t.clientY - panRef.current.startY),
        });
      }
      if ((activeTool === "wall" || activeTool === "room") && drawingState.startPoint) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const world = screenToWorld(t.clientX - rect.left, t.clientY - rect.top);
        setDrawingState(s => ({ ...s, currentPoint: world }));
      }
      lastTouchRef.current = { x: t.clientX, y: t.clientY };
    } else if (e.touches.length === 2 && lastPinchRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = newDist / lastPinchRef.current;
      setZoom(z => Math.max(0.2, Math.min(4, z * scale)));
      lastPinchRef.current = newDist;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      panRef.current.active = false;
      lastPinchRef.current = null;
      if (lastTouchRef.current && (activeTool === "wall" || activeTool === "room") && drawingState.startPoint) {
        const rect = canvasRef.current!.getBoundingClientRect();
        const world = screenToWorld(lastTouchRef.current.x - rect.left, lastTouchRef.current.y - rect.top);
        // Finalize
        if (activeTool === "wall") {
          const len = dist(drawingState.startPoint, world);
          if (len > 0.1) {
            const newWall: Wall = {
              id: generateId(), type: "wall",
              x1: drawingState.startPoint.x, y1: drawingState.startPoint.y,
              x2: world.x, y2: world.y,
              thickness: drawingState.wallThickness, wallType: drawingState.wallType, rotation: 0,
            };
            const newEls = [...elements, newWall];
            setElements(newEls);
            pushHistory(newEls);
            setDrawingState(s => ({ ...s, startPoint: world, currentPoint: world }));
          }
        } else if (activeTool === "room") {
          const rawW = snap(Math.abs(world.x - drawingState.startPoint.x));
          const rawH = snap(Math.abs(world.y - drawingState.startPoint.y));
          // If tap (very small drag), create default 4x5 room
          const w = rawW < 1 ? 4 : rawW;
          const h = rawH < 1 ? 5 : rawH;
          const newRoom: RoomShape = {
            id: generateId(), type: "room",
            x: Math.min(drawingState.startPoint.x, world.x),
            y: Math.min(drawingState.startPoint.y, world.y),
            width: w, height: h,
            label: "غرفة",
            color: ROOM_COLORS[elements.filter(e => e.type === "room").length % ROOM_COLORS.length],
            wallThickness: drawingState.wallThickness,
          };
          const newEls = [...elements, newRoom];
          setElements(newEls);
          pushHistory(newEls);
          setSelectedIds(new Set([newRoom.id]));
          setShowProperties(true);
          const canvas = canvasRef.current;
          if (canvas && lastTouchRef.current) {
            setQuickActionsPos({ x: lastTouchRef.current.x - canvas.getBoundingClientRect().left, y: lastTouchRef.current.y - canvas.getBoundingClientRect().top - 60 });
          }
          setDrawingState(s => ({ ...s, startPoint: null, currentPoint: null }));
          setActiveTool("select");
        }
      }
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.2, Math.min(4, z * delta)));
  };

  // ===== Element Operations =====
  const deleteSelected = () => {
    const newEls = elements.filter(el => !selectedIds.has(el.id));
    setElements(newEls);
    pushHistory(newEls);
    setSelectedIds(new Set());
    setShowProperties(false);
    setQuickActionsPos(null);
  };

  const copyRef = useRef<DrawElement[]>([]);
  const copySelected = () => {
    copyRef.current = elements.filter(el => selectedIds.has(el.id));
    toast.success("تم النسخ");
  };

  const pasteSelected = () => {
    if (copyRef.current.length === 0) return;
    const newEls = copyRef.current.map(el => {
      const newId = generateId();
      if (el.type === "room") return { ...el, id: newId, x: (el as RoomShape).x + 0.5, y: (el as RoomShape).y + 0.5 };
      if (el.type === "wall") return { ...el, id: newId, x1: (el as Wall).x1 + 0.5, y1: (el as Wall).y1 + 0.5, x2: (el as Wall).x2 + 0.5, y2: (el as Wall).y2 + 0.5 };
      if (el.type === "door" || el.type === "window") return { ...el, id: newId, x: (el as Opening).x + 0.5, y: (el as Opening).y + 0.5 };
      if (el.type === "electrical") return { ...el, id: newId, x: (el as ElectricalSymbol).x + 0.5, y: (el as ElectricalSymbol).y + 0.5 };
      if (el.type === "ac") return { ...el, id: newId, x: (el as ACSymbol).x + 0.5, y: (el as ACSymbol).y + 0.5 };
      return { ...el, id: newId };
    });
    const allEls = [...elements, ...newEls];
    setElements(allEls);
    pushHistory(allEls);
    setSelectedIds(new Set<string>(newEls.map(e => e.id)));
  };

  const rotateSelected = (deg: number) => {
    setElements(prev => prev.map(el => {
      if (!selectedIds.has(el.id)) return el;
      if (el.type === "door" || el.type === "window") {
        return { ...el, rotation: ((el as Opening).rotation + deg + 360) % 360 };
      }
      if (el.type === "electrical") {
        return { ...el, rotation: ((el as ElectricalSymbol).rotation + deg + 360) % 360 };
      }
      if (el.type === "ac") {
        return { ...el, rotation: ((el as ACSymbol).rotation + deg + 360) % 360 };
      }
      return el;
    }));
  };

  const clearAll = () => {
    setElements([]);
    pushHistory([]);
    setSelectedIds(new Set());
    setShowProperties(false);
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `مخطط-م-سارة-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
    toast.success("تم تحميل المخطط");
  };

  // Add room from library
  const addFromLibrary = (preset: typeof ROOM_LIBRARY[0]) => {
    const rx = snap((-viewOffset.x + 80) / (SCALE * zoom));
    const ry = snap((-viewOffset.y + 80) / (SCALE * zoom));
    const newRoom: RoomShape = {
      id: generateId(), type: "room",
      x: rx, y: ry,
      width: preset.w, height: preset.h,
      label: preset.label.split(" ")[0],
      color: preset.color,
      wallThickness: drawingState.wallThickness,
    };
    // Build preset openings
    const presetOpenings: DrawElement[] = (preset.openings || []).map(op => {
      let ox = rx, oy = ry;
      let rot = 0;
      if (op.side === "top") { ox = rx + preset.w * op.pos; oy = ry; rot = 0; }
      else if (op.side === "bottom") { ox = rx + preset.w * op.pos; oy = ry + preset.h; rot = 0; }
      else if (op.side === "left") { ox = rx; oy = ry + preset.h * op.pos; rot = 90; }
      else if (op.side === "right") { ox = rx + preset.w; oy = ry + preset.h * op.pos; rot = 90; }
      if (op.type === "door") {
        return { id: generateId(), type: "door", x: ox, y: oy, width: op.width, rotation: rot, doorType: op.doorType || "single", swingIn: false } as Opening;
      } else {
        return { id: generateId(), type: "window", x: ox, y: oy, width: op.width, rotation: rot, windowType: op.windowType || "standard" } as Opening;
      }
    });
    const newEls = [...elements, newRoom, ...presetOpenings];
    setElements(newEls);
    pushHistory(newEls);
    setSelectedIds(new Set([newRoom.id]));
    setShowLibrary(false);
    setShowProperties(true);
    // Position quick actions in center of canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setQuickActionsPos({ x: rect.width / 2, y: rect.height / 2 - 60 });
    }
    const opCount = presetOpenings.length;
    toast.success(`تمت إضافة ${preset.label}${opCount > 0 ? ` مع ${opCount} فتحة` : ""}`);
  };

  // ===== Selected Element =====
  const selectedEl = selectedIds.size === 1
    ? elements.find(e => e.id === Array.from(selectedIds)[0]) ?? null
    : null;

  const updateSelectedEl = (updates: Partial<DrawElement>) => {
    setElements(prev => prev.map(el => {
      if (!selectedIds.has(el.id)) return el;
      return { ...el, ...updates } as DrawElement;
    }));
  };

  // ===== Tool definitions =====
  const tools: { id: DrawTool; icon: React.ReactNode; label: string; color?: string }[] = [
    { id: "select", icon: <MousePointer className="w-4 h-4" />, label: "تحديد" },
    { id: "pan", icon: <Move className="w-4 h-4" />, label: "تحريك" },
    { id: "room", icon: <Square className="w-4 h-4" />, label: "غرفة" },
    { id: "wall", icon: <Minus className="w-4 h-4" />, label: "جدار" },
    { id: "door", icon: <DoorOpen className="w-4 h-4" />, label: "باب" },
    { id: "window", icon: <Maximize2 className="w-4 h-4" />, label: "نافذة" },
    { id: "electrical", icon: <Zap className="w-4 h-4" />, label: "كهرباء", color: "#e74c3c" },
    { id: "ac", icon: <Wind className="w-4 h-4" />, label: "تكييف", color: "#3498db" },
  ];

  const libCategories = Array.from(new Set(ROOM_LIBRARY.map(r => r.cat)));

  return (
    <div className="fixed inset-0 bg-[#faf6f0] flex flex-col" dir="rtl">
      {/* ===== Header ===== */}
      <header className="flex items-center gap-2 px-3 pt-safe pt-2 pb-2 bg-white/95 backdrop-blur border-b border-[#e8d9c0] z-20 shadow-sm">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-[#f0e8d8]">
          <ChevronRight className="w-5 h-5 text-[#8B6914]" />
        </button>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C9A84C] to-[#8B6914] flex items-center justify-center">
          <Layers className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-[#5C3D11] text-sm truncate">لوحة الرسم المعماري</p>
          <p className="text-[9px] text-[#8B6914]/60">
            {elements.length > 0
              ? `${elements.filter(e => e.type === "room").length} غرفة • ${elements.filter(e => e.type === "wall").length} جدار • ${elements.filter(e => e.type === "door").length} باب • ${elements.filter(e => e.type === "window").length} نافذة`
              : "ابدأ الرسم أو اختر من المكتبة"}
          </p>
        </div>
        <div className="flex gap-1">
          <button onClick={undo} title="تراجع (Ctrl+Z)"
            className="p-1.5 rounded-lg border border-[#e8d9c0] text-[#5C3D11] hover:bg-[#f0e8d8] active:scale-90 transition-all">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} title="إعادة (Ctrl+Y)"
            className="p-1.5 rounded-lg border border-[#e8d9c0] text-[#5C3D11] hover:bg-[#f0e8d8] active:scale-90 transition-all">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={downloadCanvas}
            className="p-1.5 rounded-lg border border-[#e8d9c0] text-[#5C3D11] hover:bg-[#f0e8d8] active:scale-90 transition-all">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearAll}
            className="p-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 active:scale-90 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-[#e8d9c0]" />
          <button
            onClick={() => setShow3DModal(true)}
            disabled={elements.length === 0}
            className="px-2 py-1.5 rounded-lg bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white text-[9px] font-black flex items-center gap-1 active:scale-90 transition-all disabled:opacity-40"
          >
            <Box className="w-3 h-3" />
            3D
          </button>
          <button
            onClick={() => setShowBOQ(true)}
            disabled={elements.length === 0}
            className="px-2 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-[9px] font-black flex items-center gap-1 active:scale-90 transition-all disabled:opacity-40 border border-[#e8d9c0]"
          >
            <Check className="w-3 h-3" />
            BOQ
          </button>
        </div>
      </header>

      {/* ===== Main Area ===== */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ===== Vertical Toolbar (right side) ===== */}
        <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setActiveTool(t.id);
                setDrawingState(s => ({ ...s, startPoint: null, currentPoint: null }));
                if (t.id === "door") setShowDoorPanel(true);
                else if (t.id === "window") setShowWinPanel(true);
                else if (t.id === "electrical") setShowElPanel(true);
                else if (t.id === "ac") setShowACPanel(true);
                else { setShowDoorPanel(false); setShowWinPanel(false); setShowElPanel(false); setShowACPanel(false); }
              }}
              title={t.label}
              className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-sm transition-all active:scale-90 border ${
                activeTool === t.id
                  ? "bg-[#C9A84C] text-white border-[#C9A84C] shadow-[#C9A84C]/30 shadow-md"
                  : "bg-white/90 text-[#5C3D11] border-[#e8d9c0] hover:border-[#C9A84C]/50"
              }`}
              style={activeTool !== t.id && t.color ? { color: t.color } : {}}
            >
              {t.icon}
              <span className="text-[7px] font-bold leading-none">{t.label}</span>
            </button>
          ))}

          <div className="h-px bg-[#e8d9c0] my-0.5" />

          {/* Library button */}
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            title="مكتبة العناصر"
            className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-0.5 shadow-sm transition-all active:scale-90 border ${
              showLibrary ? "bg-[#5C3D11] text-white border-[#5C3D11]" : "bg-white/90 text-[#5C3D11] border-[#e8d9c0]"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span className="text-[7px] font-bold leading-none">مكتبة</span>
          </button>
        </div>

        {/* ===== Sub-tool panels ===== */}
        {/* Door types panel */}
        {showDoorPanel && (
          <div className="absolute right-14 top-2 z-20 bg-white rounded-2xl shadow-xl border border-[#e8d9c0] p-3 w-52">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#5C3D11]">🚪 نوع الباب</p>
              <button onClick={() => setShowDoorPanel(false)} className="w-6 h-6 rounded-full bg-[#f5f0e8] flex items-center justify-center"><X className="w-3 h-3 text-[#8B6914]" /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
            {DOOR_TYPES.map(dt => (
              <button key={dt.type} onClick={() => setDrawingState(s => ({ ...s, doorType: dt.type }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[9px] font-bold transition-all ${
                  drawingState.doorType === dt.type ? "bg-[#C9A84C] text-white" : "bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0]"
                }`}>
                <span className="text-lg">{dt.icon}</span><span>{dt.label}</span>
              </button>
            ))}
            </div>
            <div className="mt-2 border-t border-[#e8d9c0] pt-2">
              <p className="text-[9px] text-[#8B6914] mb-1">عرض الباب</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setDrawingState(s => ({ ...s, doorWidth: Math.max(0.6, s.doorWidth - 0.1) }))}
                  className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{drawingState.doorWidth.toFixed(1)}م</span>
                <button onClick={() => setDrawingState(s => ({ ...s, doorWidth: Math.min(2.4, s.doorWidth + 0.1) }))}
                  className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Window types panel */}
        {showWinPanel && (
          <div className="absolute right-14 top-2 z-20 bg-white rounded-2xl shadow-xl border border-[#e8d9c0] p-3 w-52">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#5C3D11]">🪟 نوع النافذة</p>
              <button onClick={() => setShowWinPanel(false)} className="w-6 h-6 rounded-full bg-[#f5f0e8] flex items-center justify-center"><X className="w-3 h-3 text-[#8B6914]" /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
            {WINDOW_TYPES.map(wt => (
              <button key={wt.type} onClick={() => setDrawingState(s => ({ ...s, windowType: wt.type }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[9px] font-bold transition-all ${
                  drawingState.windowType === wt.type ? "bg-[#4a90d9] text-white" : "bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0]"
                }`}>
                <span className="text-lg">{wt.icon}</span><span>{wt.label}</span>
              </button>
            ))}
            </div>
            <div className="mt-2 border-t border-[#e8d9c0] pt-2">
              <p className="text-[9px] text-[#8B6914] mb-1">عرض النافذة</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setDrawingState(s => ({ ...s, windowWidth: Math.max(0.4, s.windowWidth - 0.1) }))}
                  className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                  <Minus className="w-3 h-3" />
                </button>
                <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{drawingState.windowWidth.toFixed(1)}م</span>
                <button onClick={() => setDrawingState(s => ({ ...s, windowWidth: Math.min(4, s.windowWidth + 0.1) }))}
                  className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Electrical panel */}
        {showElPanel && (
          <div className="absolute right-14 top-2 z-20 bg-white rounded-2xl shadow-xl border border-[#e8d9c0] p-3 w-56">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#5C3D11]">⚡ رموز الكهرباء</p>
              <button onClick={() => setShowElPanel(false)} className="w-6 h-6 rounded-full bg-[#f5f0e8] flex items-center justify-center"><X className="w-3 h-3 text-[#8B6914]" /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
            {ELECTRICAL_TYPES.map(et => (
              <button key={et.type} onClick={() => setDrawingState(s => ({ ...s, elType: et.type }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[9px] font-bold transition-all ${
                  drawingState.elType === et.type ? "text-white" : "bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0]"
                }`}
                style={drawingState.elType === et.type ? { backgroundColor: et.color } : {}}>
                <span className="text-base font-mono font-black" style={{ color: drawingState.elType === et.type ? '#fff' : et.color }}>{et.symbol}</span>
                <span className="text-center leading-tight">{et.label}</span>
              </button>
            ))}
            </div>
          </div>
        )}
        {/* AC panel */}
        {showACPanel && (
          <div className="absolute right-14 top-2 z-20 bg-white rounded-2xl shadow-xl border border-[#e8d9c0] p-3 w-52">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#5C3D11]">💨 نوع التكييف</p>
              <button onClick={() => setShowACPanel(false)} className="w-6 h-6 rounded-full bg-[#f5f0e8] flex items-center justify-center"><X className="w-3 h-3 text-[#8B6914]" /></button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
            {AC_TYPES.map(at => (
              <button key={at.type} onClick={() => setDrawingState(s => ({ ...s, acType: at.type }))}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[9px] font-bold transition-all ${
                  drawingState.acType === at.type ? "text-white" : "bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0]"
                }`}
                style={drawingState.acType === at.type ? { backgroundColor: at.color } : {}}>
                <span className="text-sm font-mono font-black" style={{ color: drawingState.acType === at.type ? '#fff' : at.color }}>{at.symbol}</span>
                <span className="text-center leading-tight">{at.label}</span>
              </button>
            ))}
            </div>
          </div>
        )}
                {/* ===== Library Panel (Bottom Sheet) ===== */}
        {showLibrary && (
          <div className="fixed inset-0 z-40" onClick={() => setShowLibrary(false)}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl border-t border-[#e8d9c0] flex flex-col"
              style={{ maxHeight: '75vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#e8d9c0]" />
              </div>
              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-2">
                <div>
                  <p className="font-black text-[#5C3D11] text-base">مكتبة العناصر الجاهزة</p>
                  <p className="text-[10px] text-[#8B6914]/60">{ROOM_LIBRARY.filter(r => r.cat === libCategory).length} عنصر في هذه الفئة</p>
                </div>
                <button onClick={() => setShowLibrary(false)}
                  className="w-8 h-8 rounded-full bg-[#f5f0e8] flex items-center justify-center">
                  <X className="w-4 h-4 text-[#8B6914]" />
                </button>
              </div>
              {/* Category tabs - scrollable */}
              <div className="flex gap-2 px-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {libCategories.map(cat => {
                  const catIcons: Record<string, string> = {
                    'مجالس': '🛋️', 'معيشة': '📺', 'نوم': '🛏️', 'حمام': '🚿',
                    'دريسينج': '👗', 'مطبخ': '🍳', 'ردهة': '🚶', 'مكتب': '💼',
                    'خدمات': '🧺', 'خارجي': '🌿'
                  };
                  return (
                    <button key={cat} onClick={() => setLibCategory(cat)}
                      className={`flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl text-[10px] font-bold transition-all min-w-[52px] ${
                        libCategory === cat
                          ? 'bg-[#C9A84C] text-white shadow-md'
                          : 'bg-[#f5f0e8] text-[#5C3D11]'
                      }`}>
                      <span className="text-base">{catIcons[cat] || '🏠'}</span>
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
              {/* Items grid */}
              <div className="flex-1 overflow-y-auto px-3 pb-4">
                <div className="grid grid-cols-3 gap-2">
                  {ROOM_LIBRARY.filter(r => r.cat === libCategory).map(preset => (
                    <button key={preset.label} onClick={() => { addFromLibrary(preset); setShowLibrary(false); }}
                      className="flex flex-col rounded-2xl border-2 border-[#e8d9c0] hover:border-[#C9A84C] transition-all active:scale-95 overflow-hidden">
                      {/* Color block with icon */}
                      <div className="w-full flex flex-col items-center justify-center gap-1 py-4"
                        style={{ backgroundColor: preset.color }}>
                        <span className="text-3xl leading-none drop-shadow-sm">{preset.icon || '🏠'}</span>
                        <span className="text-[10px] font-black text-white drop-shadow">{preset.w}×{preset.h}م</span>
                      </div>
                      {/* Label */}
                      <div className="bg-white px-1 py-1.5">
                        <p className="text-[10px] font-black text-[#5C3D11] text-center leading-tight">{preset.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Properties Panel ===== */}
        {showProperties && selectedEl && (
          <div className="absolute left-2 bottom-16 z-20 bg-white rounded-2xl shadow-xl border border-[#e8d9c0] w-52 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between p-2.5 border-b border-[#e8d9c0]">
              <p className="font-black text-[#5C3D11] text-xs">الخصائص</p>
              <button onClick={() => setShowProperties(false)}><X className="w-3.5 h-3.5 text-[#8B6914]" /></button>
            </div>
            <div className="p-2.5 flex flex-col gap-2">

              {/* Room properties */}
              {selectedEl.type === "room" && (
                <>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">الاسم</label>
                    <input
                      value={(selectedEl as RoomShape).label}
                      onChange={e => updateSelectedEl({ label: e.target.value })}
                      className="w-full text-xs border border-[#e8d9c0] rounded-lg px-2 py-1 text-[#5C3D11] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div>
                      <label className="text-[9px] text-[#8B6914] font-bold block mb-1">العرض (م)</label>
                      <div className="flex items-center gap-0.5">
                        <button onPointerDown={e => { e.stopPropagation(); updateSelectedEl({ width: Math.max(0.5, parseFloat(((selectedEl as RoomShape).width - 0.5).toFixed(1))) }); }}
                          className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center flex-shrink-0 text-sm font-bold">−</button>
                        <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{(selectedEl as RoomShape).width}م</span>
                        <button onPointerDown={e => { e.stopPropagation(); updateSelectedEl({ width: parseFloat(((selectedEl as RoomShape).width + 0.5).toFixed(1)) }); }}
                          className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center flex-shrink-0 text-sm font-bold">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-[#8B6914] font-bold block mb-1">الطول (م)</label>
                      <div className="flex items-center gap-0.5">
                        <button onPointerDown={e => { e.stopPropagation(); updateSelectedEl({ height: Math.max(0.5, parseFloat(((selectedEl as RoomShape).height - 0.5).toFixed(1))) }); }}
                          className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center flex-shrink-0 text-sm font-bold">−</button>
                        <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{(selectedEl as RoomShape).height}م</span>
                        <button onPointerDown={e => { e.stopPropagation(); updateSelectedEl({ height: parseFloat(((selectedEl as RoomShape).height + 0.5).toFixed(1)) }); }}
                          className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center flex-shrink-0 text-sm font-bold">+</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">سماكة الجدار (سم)</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSelectedEl({ wallThickness: Math.max(10, (selectedEl as RoomShape).wallThickness - 5) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{(selectedEl as RoomShape).wallThickness} سم</span>
                      <button onClick={() => updateSelectedEl({ wallThickness: Math.min(40, (selectedEl as RoomShape).wallThickness + 5) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">اللون</label>
                    <div className="flex gap-1 flex-wrap">
                      {ROOM_COLORS.map(c => (
                        <button key={c} onClick={() => updateSelectedEl({ color: c })}
                          className={`w-5 h-5 rounded-full border-2 transition-all ${(selectedEl as RoomShape).color === c ? "border-[#C9A84C] scale-110" : "border-transparent"}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] text-[#8B6914] bg-[#f5f0e8] rounded-lg px-2 py-1.5">
                    المساحة: <strong className="text-[#5C3D11]">{((selectedEl as RoomShape).width * (selectedEl as RoomShape).height).toFixed(2)} م²</strong>
                  </div>
                </>
              )}

              {/* Wall properties */}
              {selectedEl.type === "wall" && (
                <>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">نوع الجدار</label>
                    {(["normal", "load_bearing", "glass", "partition"] as WallType[]).map(wt => (
                      <button key={wt} onClick={() => updateSelectedEl({ wallType: wt })}
                        className={`w-full text-right px-2 py-1 rounded-lg text-xs mb-1 transition-all ${
                          (selectedEl as Wall).wallType === wt ? "bg-[#C9A84C] text-white" : "hover:bg-[#f5f0e8] text-[#5C3D11]"
                        }`}>
                        {{ normal: "عادي", load_bearing: "حامل", glass: "زجاجي", partition: "فاصل" }[wt]}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">السماكة (سم)</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSelectedEl({ thickness: Math.max(10, (selectedEl as Wall).thickness - 5) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{(selectedEl as Wall).thickness} سم</span>
                      <button onClick={() => updateSelectedEl({ thickness: Math.min(40, (selectedEl as Wall).thickness + 5) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[9px] text-[#8B6914] bg-[#f5f0e8] rounded-lg px-2 py-1.5">
                    الطول: <strong className="text-[#5C3D11]">{dist({ x: (selectedEl as Wall).x1, y: (selectedEl as Wall).y1 }, { x: (selectedEl as Wall).x2, y: (selectedEl as Wall).y2 }).toFixed(2)} م</strong>
                  </div>
                </>
              )}

              {/* Door properties */}
              {selectedEl.type === "door" && (
                <>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">نوع الباب</label>
                    {DOOR_TYPES.map(dt => (
                      <button key={dt.type} onClick={() => updateSelectedEl({ doorType: dt.type })}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs mb-1 transition-all ${
                          (selectedEl as Opening).doorType === dt.type ? "bg-[#C9A84C] text-white" : "hover:bg-[#f5f0e8] text-[#5C3D11]"
                        }`}>
                        <span>{dt.icon}</span><span>{dt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">العرض (م)</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSelectedEl({ width: Math.max(0.6, (selectedEl as Opening).width - 0.1) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{(selectedEl as Opening).width.toFixed(1)} م</span>
                      <button onClick={() => updateSelectedEl({ width: Math.min(2.4, (selectedEl as Opening).width + 0.1) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">التدوير</label>
                    <div className="flex gap-1">
                      {[0, 90, 180, 270].map(deg => (
                        <button key={deg} onClick={() => updateSelectedEl({ rotation: deg })}
                          className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                            (selectedEl as Opening).rotation === deg ? "bg-[#C9A84C] text-white" : "bg-[#f5f0e8] text-[#5C3D11]"
                          }`}>
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => rotateSelected(-15)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↺ 15°</button>
                    <button onClick={() => rotateSelected(15)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↻ 15°</button>
                  </div>
                  <button onClick={() => updateSelectedEl({ swingIn: !(selectedEl as Opening).swingIn })}
                    className="w-full py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">
                    اتجاه الفتح: {(selectedEl as Opening).swingIn ? "داخل" : "خارج"}
                  </button>
                </>
              )}

              {/* Window properties */}
              {selectedEl.type === "window" && (
                <>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">نوع النافذة</label>
                    {WINDOW_TYPES.map(wt => (
                      <button key={wt.type} onClick={() => updateSelectedEl({ windowType: wt.type })}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs mb-1 transition-all ${
                          (selectedEl as Opening).windowType === wt.type ? "bg-[#4a90d9] text-white" : "hover:bg-[#f5f0e8] text-[#5C3D11]"
                        }`}>
                        <span>{wt.icon}</span><span>{wt.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">العرض (م)</label>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateSelectedEl({ width: Math.max(0.4, (selectedEl as Opening).width - 0.1) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="flex-1 text-center text-xs font-bold text-[#5C3D11]">{(selectedEl as Opening).width.toFixed(1)} م</span>
                      <button onClick={() => updateSelectedEl({ width: Math.min(4, (selectedEl as Opening).width + 0.1) })}
                        className="w-6 h-6 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">التدوير</label>
                    <div className="flex gap-1">
                      {[0, 90, 180, 270].map(deg => (
                        <button key={deg} onClick={() => updateSelectedEl({ rotation: deg })}
                          className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                            (selectedEl as Opening).rotation === deg ? "bg-[#4a90d9] text-white" : "bg-[#f5f0e8] text-[#5C3D11]"
                          }`}>
                          {deg}°
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => rotateSelected(-15)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↺ 15°</button>
                    <button onClick={() => rotateSelected(15)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↻ 15°</button>
                  </div>
                </>
              )}

              {/* Electrical properties */}
              {selectedEl.type === "electrical" && (
                <>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">النوع</label>
                    {ELECTRICAL_TYPES.map(et => (
                      <button key={et.type} onClick={() => updateSelectedEl({ elType: et.type })}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs mb-1 transition-all ${
                          (selectedEl as ElectricalSymbol).elType === et.type ? "text-white" : "hover:bg-[#f5f0e8] text-[#5C3D11]"
                        }`}
                        style={(selectedEl as ElectricalSymbol).elType === et.type ? { backgroundColor: et.color } : {}}>
                        <span className="font-mono font-bold">{et.symbol}</span><span>{et.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => rotateSelected(-90)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↺ 90°</button>
                    <button onClick={() => rotateSelected(90)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↻ 90°</button>
                  </div>
                </>
              )}

              {/* AC properties */}
              {selectedEl.type === "ac" && (
                <>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">نوع التكييف</label>
                    {AC_TYPES.map(at => (
                      <button key={at.type} onClick={() => updateSelectedEl({ acType: at.type })}
                        className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs mb-1 transition-all ${
                          (selectedEl as ACSymbol).acType === at.type ? "text-white" : "hover:bg-[#f5f0e8] text-[#5C3D11]"
                        }`}
                        style={(selectedEl as ACSymbol).acType === at.type ? { backgroundColor: at.color } : {}}>
                        <span className="font-mono font-bold">{at.symbol}</span><span>{at.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-[#8B6914] font-bold block mb-1">السعة</label>
                    <input
                      value={(selectedEl as ACSymbol).capacity || ""}
                      onChange={e => updateSelectedEl({ capacity: e.target.value })}
                      placeholder="مثال: 18000 BTU"
                      className="w-full text-xs border border-[#e8d9c0] rounded-lg px-2 py-1 text-[#5C3D11] focus:outline-none focus:border-[#C9A84C]"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => rotateSelected(-90)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↺ 90°</button>
                    <button onClick={() => rotateSelected(90)} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-xs font-bold">↻ 90°</button>
                  </div>
                </>
              )}

              {/* Common actions */}
              <div className="flex gap-1 pt-1 border-t border-[#e8d9c0]">
                <button onClick={copySelected} className="flex-1 py-1.5 rounded-lg bg-[#f5f0e8] text-[#5C3D11] text-[9px] font-bold flex items-center justify-center gap-1">
                  <Copy className="w-3 h-3" /> نسخ
                </button>
                <button onClick={deleteSelected} className="flex-1 py-1.5 rounded-lg bg-red-50 text-red-400 text-[9px] font-bold flex items-center justify-center gap-1">
                  <Trash2 className="w-3 h-3" /> حذف
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Canvas ===== */}
        <canvas
          ref={canvasRef}
          className="flex-1 w-full h-full touch-none"
          style={{ cursor: activeTool === "pan" ? "grab" : activeTool === "select" ? (hoveredId ? "pointer" : "default") : "crosshair" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { panRef.current.active = false; dragRef.current.active = false; }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={() => {
            if (activeTool === "wall") {
              setDrawingState(s => ({ ...s, startPoint: null, currentPoint: null }));
              setActiveTool("select");
            }
          }}
        />

         {/* ===== Zoom Controls ===== */}
        <div className="absolute bottom-4 left-2 flex flex-col gap-1.5 z-10">
          <button onClick={() => setZoom(z => Math.min(4, z * 1.25))}
            className="w-11 h-11 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-[#5C3D11] active:scale-90 border border-[#e8d9c0]">
            <ZoomIn className="w-5 h-5" />
          </button>
          <button onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}
            className="w-11 h-11 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-[#5C3D11] active:scale-90 border border-[#e8d9c0]">
            <ZoomOut className="w-5 h-5" />
          </button>
          <button onClick={() => { setZoom(1); setViewOffset({ x: 60, y: 80 }); }}
            className="w-11 h-11 rounded-xl bg-white/95 shadow-md flex items-center justify-center text-[#5C3D11] active:scale-90 border border-[#e8d9c0]" title="إعادة ضبط">
            <Move className="w-5 h-5" />
          </button>
        </div>
        {/* Zoom level */}
        <div className="absolute bottom-4 left-16 bg-white/90 rounded-xl px-2.5 py-1.5 z-10 border border-[#e8d9c0] shadow-sm">
          <span className="text-[11px] text-[#8B6914] font-black">{Math.round(zoom * 100)}%</span>
        </div>

        {/* Wall thickness control (when wall tool active) */}
        {activeTool === "wall" && (
          <div className="absolute bottom-4 right-14 z-10 bg-white/95 rounded-xl shadow-md border border-[#e8d9c0] px-3 py-2 flex items-center gap-2">
            <span className="text-[9px] text-[#8B6914] font-bold">السماكة:</span>
            <button onClick={() => setDrawingState(s => ({ ...s, wallThickness: Math.max(10, s.wallThickness - 5) }))}
              className="w-5 h-5 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-black text-[#5C3D11] w-10 text-center">{drawingState.wallThickness} سم</span>
            <button onClick={() => setDrawingState(s => ({ ...s, wallThickness: Math.min(40, s.wallThickness + 5) }))}
              className="w-5 h-5 rounded bg-[#f5f0e8] text-[#5C3D11] flex items-center justify-center">
              <Plus className="w-3 h-3" />
            </button>
            <div className="h-4 w-px bg-[#e8d9c0]" />
            {(["normal", "load_bearing", "glass", "partition"] as WallType[]).map(wt => (
              <button key={wt} onClick={() => setDrawingState(s => ({ ...s, wallType: wt }))}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all ${
                  drawingState.wallType === wt ? "bg-[#C9A84C] text-white" : "bg-[#f5f0e8] text-[#5C3D11]"
                }`}>
                {{ normal: "عادي", load_bearing: "حامل", glass: "زجاجي", partition: "فاصل" }[wt]}
              </button>
            ))}
            <span className="text-[8px] text-[#8B6914]/60">دبل-كليك للإنهاء</span>
          </div>
        )}

        {/* Empty state */}
        {elements.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-6">
            <div className="w-20 h-20 rounded-3xl bg-[#C9A84C]/10 flex items-center justify-center mb-4">
              <span className="text-4xl">🏗️</span>
            </div>
            <p className="text-[#5C3D11]/60 font-black text-lg mb-1">ابدأ تصميمك</p>
            <p className="text-[#8B6914]/40 text-sm text-center mb-6">اللوحة جاهزة — اختر طريقة البدء</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <div className="flex items-center gap-3 bg-[#C9A84C]/10 rounded-2xl p-3">
                <span className="text-2xl">📖</span>
                <div>
                  <p className="text-xs font-black text-[#5C3D11]">افتح المكتبة</p>
                  <p className="text-[9px] text-[#8B6914]/70">65+ عنصر جاهز بنقرة واحدة</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#f5f0e8] rounded-2xl p-3">
                <span className="text-2xl">✏️</span>
                <div>
                  <p className="text-xs font-black text-[#5C3D11]">ارسم غرفة</p>
                  <p className="text-[9px] text-[#8B6914]/70">اختر أداة الغرفة من الشريط</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-[#f5f0e8] rounded-2xl p-3">
                <span className="text-2xl">📱</span>
                <div>
                  <p className="text-xs font-black text-[#5C3D11]">من الجوال</p>
                  <p className="text-[9px] text-[#8B6914]/70">المس واسحب للتحرك • أصبعان للتكبير</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active tool indicator */}
        {activeTool !== "select" && activeTool !== "pan" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-[#C9A84C] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
            {tools.find(t => t.id === activeTool)?.label} — انقر على اللوحة
            {activeTool === "wall" && " • دبل-كليك للإنهاء"}
          </div>
        )}

        {/* ===== Quick Actions Floating Toolbar ===== */}
        {quickActionsPos && selectedEl && (
          <div
            className="absolute z-30 flex gap-1 bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-[#e8d9c0] px-2 py-1.5"
            style={{
              left: Math.min(Math.max(quickActionsPos.x - 80, 8), window.innerWidth - 180),
              top: Math.max(quickActionsPos.y - 8, 8),
              direction: "rtl"
            }}
          >
            {/* Delete */}
            <button
              onClick={deleteSelected}
              className="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-[7px] font-bold">حذف</span>
            </button>

            {/* Rotate CCW */}
            <button
              onClick={() => rotateSelected(-90)}
              className="w-9 h-9 rounded-xl bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0] flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
              title="دوران يسار"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-[7px] font-bold">يسار</span>
            </button>

            {/* Rotate CW */}
            <button
              onClick={() => rotateSelected(90)}
              className="w-9 h-9 rounded-xl bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0] flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
              title="دوران يمين"
            >
              <RotateCw className="w-4 h-4" />
              <span className="text-[7px] font-bold">يمين</span>
            </button>

            {/* Flip swing (doors only) */}
            {selectedEl.type === "door" && (
              <button
                onClick={() => updateSelectedEl({ swingIn: !(selectedEl as Opening).swingIn })}
                className="w-9 h-9 rounded-xl bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0] flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
                title="عكس الفتح"
              >
                <span className="text-base">⇆</span>
                <span className="text-[7px] font-bold">عكس</span>
              </button>
            )}

            {/* Copy */}
            <button
              onClick={() => { copySelected(); pasteSelected(); }}
              className="w-9 h-9 rounded-xl bg-[#f5f0e8] text-[#5C3D11] hover:bg-[#ede4d0] flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-all"
              title="نسخ"
            >
              <Copy className="w-4 h-4" />
              <span className="text-[7px] font-bold">نسخ</span>
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setQuickActionsPos(null)}
              className="w-7 h-9 rounded-xl bg-transparent text-[#8B6914]/40 hover:text-[#8B6914] flex items-center justify-center active:scale-90 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ===== 3D Render Modal ===== */}
      {show3DModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShow3DModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-[#5C3D11] text-base">تصدير 3D Perspective</h3>
              <button onClick={() => setShow3DModal(false)} className="p-1.5 rounded-xl hover:bg-[#f5f0e8]"><X className="w-4 h-4 text-[#8B6914]" /></button>
            </div>

            {/* Style */}
            <div className="mb-4">
              <p className="text-[10px] text-[#8B6914] font-bold mb-2">الستايل</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["modern", "classic", "gulf", "minimal"] as const).map(s => (
                  <button key={s} onClick={() => setRenderStyle(s)}
                    className={`py-2 rounded-xl text-[9px] font-bold transition-all ${
                      renderStyle === s ? "bg-[#C9A84C] text-white" : "bg-[#f5f0e8] text-[#5C3D11]"
                    }`}>
                    {{
                      modern: "معاصر",
                      classic: "كلاسيك",
                      gulf: "خليجي",
                      minimal: "مينيمال"
                    }[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* View */}
            <div className="mb-5">
              <p className="text-[10px] text-[#8B6914] font-bold mb-2">زاوية الرؤية</p>
              <div className="grid grid-cols-4 gap-1.5">
                {(["perspective", "top", "front", "aerial"] as const).map(v => (
                  <button key={v} onClick={() => setRenderView(v)}
                    className={`py-2 rounded-xl text-[9px] font-bold transition-all ${
                      renderView === v ? "bg-[#5C3D11] text-white" : "bg-[#f5f0e8] text-[#5C3D11]"
                    }`}>
                    {{
                      perspective: "منظور",
                      top: "مسقط",
                      front: "واجهة",
                      aerial: "جوي"
                    }[v]}
                  </button>
                ))}
              </div>
            </div>

            {/* Render result */}
            {render3DUrl && (
              <div className="mb-4 rounded-2xl overflow-hidden border border-[#e8d9c0]">
                <img src={render3DUrl} alt="3D Render" className="w-full object-cover" />
                <div className="flex gap-2 p-2">
                  <a href={render3DUrl} download="render-3d.png"
                    className="flex-1 py-2 rounded-xl bg-[#C9A84C] text-white text-[10px] font-bold text-center">
                    تحميل
                  </a>
                </div>
              </div>
            )}

            <button
              onClick={async () => {
                setIs3DLoading(true);
                setRender3DUrl(null);
                try {
                  // Build description from elements
                  const rooms = elements.filter(e => e.type === "room") as RoomShape[];
                  const doors = elements.filter(e => e.type === "door") as Opening[];
                  const windows = elements.filter(e => e.type === "window") as Opening[];
                  const desc = rooms.map(r => `${r.label} ${r.width}x${r.height}m`).join(", ");
                  const styleKeywords: Record<string, string> = {
                    modern: "contemporary modern interior, clean lines, neutral palette, minimalist furniture, warm LED lighting, polished surfaces",
                    classic: "classic luxury interior, ornate moldings, rich wood paneling, chandeliers, marble floors, warm gold accents",
                    gulf: "Saudi Gulf luxury interior, mashrabiya screens, arabesque patterns, warm beige tones, majlis seating, ornate ceiling details",
                    minimal: "minimalist interior, white walls, natural light, simple furniture, monochrome palette, zen atmosphere"
                  };
                  const viewKeywords: Record<string, string> = {
                    perspective: "interior perspective view from eye level, 3-point perspective, standing inside the main room looking toward entrance",
                    top: "bird's eye floor plan view from directly above, architectural top-down view",
                    front: "front elevation exterior view, straight-on facade perspective",
                    aerial: "aerial perspective view from 45 degrees above, isometric-style architectural visualization"
                  };
                  // Build detailed spatial description from plan
                  const SCALE = 100; // px per meter
                  const roomsDetail = rooms.map(r => {
                    // Find doors/windows near this room
                    const roomLeft = r.x; const roomRight = r.x + r.width * SCALE;
                    const roomTop = r.y; const roomBottom = r.y + r.height * SCALE;
                    const roomDoors = doors.filter(d => {
                      return d.x >= roomLeft - 20 && d.x <= roomRight + 20 && d.y >= roomTop - 20 && d.y <= roomBottom + 20;
                    });
                    const roomWindows = windows.filter(w => {
                      return w.x >= roomLeft - 20 && w.x <= roomRight + 20 && w.y >= roomTop - 20 && w.y <= roomBottom + 20;
                    });
                    // Determine door/window positions relative to room
                    const doorDescs = roomDoors.map(d => {
                      const relX = (d.x - r.x) / SCALE; const relY = (d.y - r.y) / SCALE;
                      let wallSide = "";
                      if (relY < 0.3) wallSide = "north wall";
                      else if (relY > r.height - 0.3) wallSide = "south wall";
                      else if (relX < 0.3) wallSide = "west wall";
                      else wallSide = "east wall";
                      const dtype = d.doorType === "double" ? "double door" : d.doorType === "sliding" ? "sliding door" : "single door";
                      return `${dtype} (${d.width.toFixed(1)}m wide) on ${wallSide}`;
                    }).join(", ");
                    const winDescs = roomWindows.map(w => {
                      const relX = (w.x - r.x) / SCALE; const relY = (w.y - r.y) / SCALE;
                      let wallSide = "";
                      if (relY < 0.3) wallSide = "north wall";
                      else if (relY > r.height - 0.3) wallSide = "south wall";
                      else if (relX < 0.3) wallSide = "west wall";
                      else wallSide = "east wall";
                      const wtype = w.windowType === "panoramic" || w.windowType === "full_panoramic" ? "panoramic window" : w.windowType === "french" ? "french window" : w.windowType === "arch" ? "arched window" : "standard window";
                      return `${wtype} (${w.width.toFixed(1)}m wide) on ${wallSide}`;
                    }).join(", ");
                    return `${r.label}: ${r.width.toFixed(1)}m × ${r.height.toFixed(1)}m room. ${doorDescs ? `Openings: ${doorDescs}` : ""} ${winDescs ? `Windows: ${winDescs}` : ""}`;
                  }).join(" | ");

                  const totalRooms = rooms.length;
                  const mainRoom = rooms.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b), rooms[0] || { label: "room", width: 4, height: 4, x: 0, y: 0 } as RoomShape);
                  const mainDoors = doors.filter(d => {
                    const SCALE2 = 100;
                    return d.x >= mainRoom.x - 20 && d.x <= mainRoom.x + mainRoom.width * SCALE2 + 20 && d.y >= mainRoom.y - 20 && d.y <= mainRoom.y + mainRoom.height * SCALE2 + 20;
                  });
                  const mainWindows = windows.filter(w => {
                    const SCALE2 = 100;
                    return w.x >= mainRoom.x - 20 && w.x <= mainRoom.x + mainRoom.width * SCALE2 + 20 && w.y >= mainRoom.y - 20 && w.y <= mainRoom.y + mainRoom.height * SCALE2 + 20;
                  });

                  // Build strict structural constraints
                  const structuralConstraints = [
                    `EXACT room dimensions: ${mainRoom.width.toFixed(1)}m wide × ${mainRoom.height.toFixed(1)}m deep × 3m ceiling height`,
                    mainDoors.length > 0 ? `EXACT door placement: ${mainDoors.map(d => { const relX = (d.x - mainRoom.x) / SCALE; const relY = (d.y - mainRoom.y) / SCALE; let side = relY < 0.3 ? "north" : relY > mainRoom.height - 0.3 ? "south" : relX < 0.3 ? "west" : "east"; return `${d.doorType || "single"} door (${d.width.toFixed(1)}m) on ${side} wall at ${(relX/mainRoom.width*100).toFixed(0)}% from left`; }).join(", ")}` : "",
                    mainWindows.length > 0 ? `EXACT window placement: ${mainWindows.map(w => { const relX = (w.x - mainRoom.x) / SCALE; const relY = (w.y - mainRoom.y) / SCALE; let side = relY < 0.3 ? "north" : relY > mainRoom.height - 0.3 ? "south" : relX < 0.3 ? "west" : "east"; return `${w.windowType || "standard"} window (${w.width.toFixed(1)}m) on ${side} wall`; }).join(", ")}` : "",
                  ].filter(Boolean).join(". ");

                  const prompt = `Photorealistic architectural interior visualization. CRITICAL STRUCTURAL REQUIREMENTS - MUST FOLLOW EXACTLY: ${structuralConstraints}. DO NOT add, move, or remove any doors or windows. DO NOT change room proportions. Full floor plan: ${roomsDetail}. Style: ${styleKeywords[renderStyle]}. Camera: ${viewKeywords[renderView]}. The visualization MUST accurately reflect the floor plan geometry. Ultra-realistic rendering, 8K quality, professional architectural photography, cinematic lighting, natural shadows, no people, no text, no watermarks, architectural digest quality.`;
                  // Capture floor plan canvas as reference image
                  let planImageBase64: string | undefined;
                  try {
                    const canvas = canvasRef.current;
                    if (canvas) {
                      planImageBase64 = canvas.toDataURL("image/png", 0.8);
                    }
                  } catch {
                    // Continue without canvas image
                  }
                  const res = await fetch("/api/trpc/generate3DFromPlan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ json: { prompt, planImageBase64 } }),
                    credentials: "include"
                  });
                  const data = await res.json();
                  const url = data?.result?.data?.json?.url || data?.result?.data?.url;
                  if (url) setRender3DUrl(url);
                  else toast.error("حدث خطأ في الرندر");
                } catch {
                  toast.error("حدث خطأ في الرندر");
                } finally {
                  setIs3DLoading(false);
                }
              }}
              disabled={is3DLoading}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-60"
            >
              {is3DLoading ? (
                <><span className="animate-spin text-base">⌛</span> جاري الرندر...</>
              ) : (
                <><Box className="w-4 h-4" /> إنشاء رندر 3D</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== Mobile Library FAB ===== */}
      {!showLibrary && (
        <button
          onClick={() => setShowLibrary(true)}
          className="fixed bottom-6 right-1/2 translate-x-1/2 z-30 flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#8B6914] text-white shadow-xl active:scale-95 transition-all md:hidden"
          style={{ boxShadow: '0 4px 20px rgba(201,168,76,0.5)' }}
        >
          <Grid3X3 className="w-4 h-4" />
          <span className="font-black text-sm">مكتبة العناصر</span>
          <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">91</span>
        </button>
      )}
      {/* ===== BOQ Modal ===== */}
      {showBOQ && (() => {
        const rooms = elements.filter(e => e.type === "room") as RoomShape[];
        const walls = elements.filter(e => e.type === "wall") as Wall[];
        const doors = elements.filter(e => e.type === "door") as Opening[];
        const windows = elements.filter(e => e.type === "window") as Opening[];
        const electricals = elements.filter(e => e.type === "electrical") as ElectricalSymbol[];
        const acs = elements.filter(e => e.type === "ac") as ACSymbol[];
        const totalArea = rooms.reduce((s, r) => s + r.width * r.height, 0);
        const totalWallLen = walls.reduce((s, w) => s + dist({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }), 0);
        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={() => setShowBOQ(false)}>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
              <div className="sticky top-0 bg-white/95 backdrop-blur rounded-t-3xl px-5 pt-5 pb-3 border-b border-[#e8d9c0] flex items-center justify-between">
                <h3 className="font-black text-[#5C3D11] text-base">جدول الكميات BOQ</h3>
                <button onClick={() => setShowBOQ(false)} className="p-1.5 rounded-xl hover:bg-[#f5f0e8]"><X className="w-4 h-4 text-[#8B6914]" /></button>
              </div>
              <div className="p-5 space-y-3">
                {/* Summary */}
                <div className="bg-gradient-to-r from-[#C9A84C]/10 to-[#8B6914]/5 rounded-2xl p-3">
                  <p className="text-[10px] text-[#8B6914] font-bold mb-1">ملخص المشروع</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <p className="text-xl font-black text-[#5C3D11]">{totalArea.toFixed(1)}</p>
                      <p className="text-[9px] text-[#8B6914]">مساحة إجمالية م²</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-black text-[#5C3D11]">{totalWallLen.toFixed(1)}</p>
                      <p className="text-[9px] text-[#8B6914]">طول جدران م</p>
                    </div>
                  </div>
                </div>

                {/* Rooms */}
                {rooms.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8B6914] font-bold mb-1.5">الغرف ({rooms.length})</p>
                    {rooms.map(r => (
                      <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-[#f0e8d8] last:border-0">
                        <span className="text-xs text-[#5C3D11] font-bold">{r.label}</span>
                        <span className="text-xs text-[#8B6914]">{r.width.toFixed(1)} × {r.height.toFixed(1)} = <strong>{(r.width * r.height).toFixed(2)} م²</strong></span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Walls */}
                {walls.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8B6914] font-bold mb-1.5">الجدران ({walls.length})</p>
                    {walls.map((w, i) => (
                      <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-[#f0e8d8] last:border-0">
                        <span className="text-xs text-[#5C3D11]">جدار {i + 1} ({({ normal: "عادي", load_bearing: "حامل", glass: "زجاجي", partition: "فاصل" } as Record<string,string>)[w.wallType]})</span>
                        <span className="text-xs text-[#8B6914]">{dist({ x: w.x1, y: w.y1 }, { x: w.x2, y: w.y2 }).toFixed(2)} م × {w.thickness}سم</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Doors */}
                {doors.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8B6914] font-bold mb-1.5">الأبواب ({doors.length})</p>
                    {doors.map((d, i) => (
                      <div key={d.id} className="flex items-center justify-between py-1.5 border-b border-[#f0e8d8] last:border-0">
                        <span className="text-xs text-[#5C3D11]">باب {i + 1} ({({ single: "مفرد", double: "مزدوج", sliding: "منزلق", folding: "طي", pocket: "خفي" } as Record<string,string>)[d.doorType || "single"]})</span>
                        <span className="text-xs text-[#8B6914]">{d.width.toFixed(1)} م × 2.1م</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Windows */}
                {windows.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8B6914] font-bold mb-1.5">النوافذ ({windows.length})</p>
                    {windows.map((w, i) => (
                      <div key={w.id} className="flex items-center justify-between py-1.5 border-b border-[#f0e8d8] last:border-0">
                        <span className="text-xs text-[#5C3D11]">نافذة {i + 1} ({({ standard: "عادية", panoramic: "بانوراميك", french: "فرنسية", opening: "مفتوحة", fixed: "ثابتة" } as Record<string,string>)[w.windowType || "standard"]})</span>
                        <span className="text-xs text-[#8B6914]">{w.width.toFixed(1)} م</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Electrical */}
                {electricals.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8B6914] font-bold mb-1.5">الكهرباء ({electricals.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(electricals.reduce((acc, e) => ({ ...acc, [e.elType]: (acc[e.elType] || 0) + 1 }), {} as Record<string, number>)).map(([type, count]) => {
                        const elLabels: Record<string, string> = { outlet: "مخرج", switch: "مفتاح", light: "إضاءة", panel: "لوحة", tv: "تلفزيون", data: "بيانات" };
                        return (
                          <span key={type} className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[9px] font-bold">
                            {elLabels[type] || type} ×{count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* AC */}
                {acs.length > 0 && (
                  <div>
                    <p className="text-[10px] text-[#8B6914] font-bold mb-1.5">التكييف ({acs.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(acs.reduce((acc, e) => ({ ...acc, [e.acType]: (acc[e.acType] || 0) + 1 }), {} as Record<string, number>)).map(([type, count]) => {
                        const acLabels: Record<string, string> = { split: "سبليت", central: "مركزي", window_unit: "شباك", cassette: "كاسيت" };
                        return (
                          <span key={type} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-bold">
                            {acLabels[type] || type} ×{count}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ===== Bottom Status Bar ===== */}
      <div className="bg-white border-t border-[#e8d9c0] px-3 py-1.5 flex items-center gap-3 text-[9px] text-[#8B6914]">
        <span className="font-bold text-[#5C3D11]">م. سارة — لوحة الرسم المعماري</span>
        <span>•</span>
        <span>{elements.filter(e => e.type === "room").length} غرفة</span>
        <span>{elements.filter(e => e.type === "wall").length} جدار</span>
        <span>{elements.filter(e => e.type === "door").length} باب</span>
        <span>{elements.filter(e => e.type === "window").length} نافذة</span>
        <span>{elements.filter(e => e.type === "electrical").length} كهرباء</span>
        <span>{elements.filter(e => e.type === "ac").length} تكييف</span>
        <span className="mr-auto">
          {selectedEl ? `محدد: ${selectedEl.type === "room" ? (selectedEl as RoomShape).label : selectedEl.type}` : ""}
        </span>
        <span>Ctrl+Z تراجع • Ctrl+C نسخ • Del حذف</span>
      </div>
    </div>
  );
}
