/**
 * ThreeJSViewer — عرض المبنى ثلاثياً من بيانات تحليل المخطط
 * يبني نموذج 3D حقيقي من الغرف والأبواب والنوافذ المستخرجة
 * مع إمكانية التجوّل داخل المبنى
 */
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

type RoomData = {
  name: string;
  type: string;
  area: number;
  dimensions: string;
  floor: string;
  ceilingHeight?: number;
  doors?: Array<{ wall?: string; openDirection?: string; width?: number }>;
  windows?: Array<{ wall?: string; width?: number; height?: number }>;
};

type ThreeJSViewerProps = {
  rooms: RoomData[];
  totalArea?: number;
  floors?: number;
  className?: string;
  onClose?: () => void;
};

// ألوان الغرف حسب النوع
const ROOM_COLORS: Record<string, number> = {
  bedroom: 0xE8D5C4,
  living: 0xD4E8D4,
  kitchen: 0xF5E6C8,
  bathroom: 0xC8E0F0,
  dining: 0xEAD4E8,
  corridor: 0xE8E8E8,
  entrance: 0xF0E8C8,
  balcony: 0xC8F0D4,
  majlis: 0xF0D4C8,
  staircase: 0xD4D4F0,
  elevator: 0xE0E0E0,
  storage: 0xD8D8C8,
  office: 0xD4E0F0,
  prayer: 0xF0EAD4,
  laundry: 0xD4EAF0,
  garage: 0xD8D8D8,
  outdoor: 0xC8E8C8,
  hall: 0xE8E4D4,
  closet: 0xE4D8E4,
  room: 0xE8E8D4,
};

// تحليل الأبعاد من نص مثل "5×4 م" أو "5x4"
function parseDimensions(dim: string, area: number): { w: number; d: number } {
  if (!dim) {
    const side = Math.sqrt(area) || 3;
    return { w: side, d: side };
  }
  const match = dim.match(/(\d+(?:\.\d+)?)\s*[×x×]\s*(\d+(?:\.\d+)?)/);
  if (match) {
    return { w: parseFloat(match[1]), d: parseFloat(match[2]) };
  }
  const side = Math.sqrt(area) || 3;
  return { w: side, d: side };
}

// ترتيب الغرف في شبكة
function layoutRooms(rooms: RoomData[]): Array<RoomData & { x: number; z: number; w: number; d: number; y: number }> {
  const floorOrder: Record<string, number> = { ground: 0, first: 1, second: 2, third: 3, basement: -1 };
  const WALL_THICKNESS = 0.2;
  const result: Array<RoomData & { x: number; z: number; w: number; d: number; y: number }> = [];

  // تجميع الغرف حسب الطابق
  const byFloor: Record<string, RoomData[]> = {};
  for (const room of rooms) {
    const fl = room.floor || "ground";
    if (!byFloor[fl]) byFloor[fl] = [];
    byFloor[fl].push(room);
  }

  for (const [floorName, floorRooms] of Object.entries(byFloor)) {
    const floorY = (floorOrder[floorName] ?? 0) * 4; // 4م بين الطوابق
    let currentX = 0;
    let rowMaxZ = 0;
    let currentZ = 0;
    const ROW_WIDTH = 20; // عرض الصف

    for (const room of floorRooms) {
      const { w, d } = parseDimensions(room.dimensions, room.area || 9);
      const rw = Math.max(w, 2);
      const rd = Math.max(d, 2);

      if (currentX + rw > ROW_WIDTH) {
        currentX = 0;
        currentZ += rowMaxZ + WALL_THICKNESS;
        rowMaxZ = 0;
      }

      result.push({ ...room, x: currentX, z: currentZ, w: rw, d: rd, y: floorY });
      currentX += rw + WALL_THICKNESS;
      rowMaxZ = Math.max(rowMaxZ, rd);
    }
  }

  return result;
}

export default function ThreeJSViewer({ rooms, totalArea, floors, className, onClose }: ThreeJSViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: Math.PI / 4, phi: Math.PI / 3 });
  const cameraRadius = useRef(30);
  const cameraTarget = useRef(new THREE.Vector3(10, 0, 8));

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"3d" | "top">("3d");
  const [isLoaded, setIsLoaded] = useState(false);

  const buildScene = useCallback(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5F0E8);
    scene.fog = new THREE.Fog(0xF5F0E8, 40, 80);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 200);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFFF8E7, 1.2);
    sunLight.position.set(20, 30, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    scene.add(sunLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0xD4C9B0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid
    const gridHelper = new THREE.GridHelper(60, 60, 0xBBAA99, 0xCCBBAA);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Build rooms
    const layouted = layoutRooms(rooms);
    const WALL_H = 3; // ارتفاع افتراضي
    const WALL_T = 0.15;

    for (const room of layouted) {
      const roomH = room.ceilingHeight || WALL_H;
      const color = ROOM_COLORS[room.type] || 0xE8E8E8;

      // الأرضية
      const floorGeo = new THREE.BoxGeometry(room.w, 0.1, room.d);
      const floorMat = new THREE.MeshLambertMaterial({ color });
      const floorMesh = new THREE.Mesh(floorGeo, floorMat);
      floorMesh.position.set(room.x + room.w / 2, room.y + 0.05, room.z + room.d / 2);
      floorMesh.receiveShadow = true;
      floorMesh.userData = { roomName: room.name, roomType: room.type };
      scene.add(floorMesh);

      // الجدران — 4 جدران شفافة
      const wallMat = new THREE.MeshLambertMaterial({
        color: 0xF5F0E8,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });

      // جدار شمالي (z-)
      const northWall = new THREE.Mesh(
        new THREE.BoxGeometry(room.w, roomH, WALL_T),
        wallMat.clone()
      );
      northWall.position.set(room.x + room.w / 2, room.y + roomH / 2, room.z);
      northWall.castShadow = true;
      scene.add(northWall);

      // جدار جنوبي (z+)
      const southWall = new THREE.Mesh(
        new THREE.BoxGeometry(room.w, roomH, WALL_T),
        wallMat.clone()
      );
      southWall.position.set(room.x + room.w / 2, room.y + roomH / 2, room.z + room.d);
      southWall.castShadow = true;
      scene.add(southWall);

      // جدار غربي (x-)
      const westWall = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_T, roomH, room.d),
        wallMat.clone()
      );
      westWall.position.set(room.x, room.y + roomH / 2, room.z + room.d / 2);
      westWall.castShadow = true;
      scene.add(westWall);

      // جدار شرقي (x+)
      const eastWall = new THREE.Mesh(
        new THREE.BoxGeometry(WALL_T, roomH, room.d),
        wallMat.clone()
      );
      eastWall.position.set(room.x + room.w, room.y + roomH / 2, room.z + room.d / 2);
      eastWall.castShadow = true;
      scene.add(eastWall);

      // السقف (شفاف جداً)
      const ceilMat = new THREE.MeshLambertMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.15,
      });
      const ceil = new THREE.Mesh(
        new THREE.BoxGeometry(room.w, 0.1, room.d),
        ceilMat
      );
      ceil.position.set(room.x + room.w / 2, room.y + roomH, room.z + room.d / 2);
      scene.add(ceil);

      // تسمية الغرفة
      addRoomLabel(scene, room.name, room.x + room.w / 2, room.y + 0.2, room.z + room.d / 2);

      // النوافذ (مستطيلات زرقاء شفافة)
      if (room.windows) {
        for (const win of room.windows) {
          const winW = win.width || 1.2;
          const winH = win.height || 1.0;
          const winMat = new THREE.MeshLambertMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.5,
          });
          const winMesh = new THREE.Mesh(
            new THREE.BoxGeometry(winW, winH, 0.05),
            winMat
          );
          const wall = win.wall || "north";
          if (wall === "north") {
            winMesh.position.set(room.x + room.w / 2, room.y + roomH * 0.6, room.z + 0.05);
          } else if (wall === "south") {
            winMesh.position.set(room.x + room.w / 2, room.y + roomH * 0.6, room.z + room.d - 0.05);
          } else if (wall === "east") {
            winMesh.rotation.y = Math.PI / 2;
            winMesh.position.set(room.x + room.w - 0.05, room.y + roomH * 0.6, room.z + room.d / 2);
          } else {
            winMesh.rotation.y = Math.PI / 2;
            winMesh.position.set(room.x + 0.05, room.y + roomH * 0.6, room.z + room.d / 2);
          }
          scene.add(winMesh);
        }
      }

      // الأبواب (مستطيلات بنية)
      if (room.doors) {
        for (const door of room.doors) {
          const doorW = door.width || 0.9;
          const doorMat = new THREE.MeshLambertMaterial({ color: 0x8B6914 });
          const doorMesh = new THREE.Mesh(
            new THREE.BoxGeometry(doorW, 2.1, 0.08),
            doorMat
          );
          const wall = door.wall || "north";
          if (wall === "north") {
            doorMesh.position.set(room.x + room.w / 2, room.y + 1.05, room.z + 0.04);
          } else if (wall === "south") {
            doorMesh.position.set(room.x + room.w / 2, room.y + 1.05, room.z + room.d - 0.04);
          } else if (wall === "east") {
            doorMesh.rotation.y = Math.PI / 2;
            doorMesh.position.set(room.x + room.w - 0.04, room.y + 1.05, room.z + room.d / 2);
          } else {
            doorMesh.rotation.y = Math.PI / 2;
            doorMesh.position.set(room.x + 0.04, room.y + 1.05, room.z + room.d / 2);
          }
          scene.add(doorMesh);
        }
      }
    }

    // تحديث موضع الكاميرا
    updateCamera(camera);
    setIsLoaded(true);

    // Animation loop
    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [rooms]);

  function updateCamera(camera: THREE.PerspectiveCamera) {
    const { theta, phi } = cameraAngle.current;
    const r = cameraRadius.current;
    const target = cameraTarget.current;
    camera.position.set(
      target.x + r * Math.sin(phi) * Math.sin(theta),
      target.y + r * Math.cos(phi),
      target.z + r * Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  }

  useEffect(() => {
    const cleanup = buildScene();
    return cleanup;
  }, [buildScene]);

  // Mouse controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !cameraRef.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };

    cameraAngle.current.theta -= dx * 0.01;
    cameraAngle.current.phi = Math.max(0.2, Math.min(Math.PI / 2, cameraAngle.current.phi + dy * 0.01));
    updateCamera(cameraRef.current);
  };

  const handleMouseUp = () => { isDragging.current = false; };

  const handleWheel = (e: React.WheelEvent) => {
    if (!cameraRef.current) return;
    cameraRadius.current = Math.max(5, Math.min(60, cameraRadius.current + e.deltaY * 0.05));
    updateCamera(cameraRef.current);
  };

  const setTopView = () => {
    if (!cameraRef.current) return;
    cameraAngle.current.phi = 0.1;
    cameraRadius.current = 35;
    updateCamera(cameraRef.current);
    setViewMode("top");
  };

  const set3DView = () => {
    if (!cameraRef.current) return;
    cameraAngle.current.phi = Math.PI / 3;
    cameraRadius.current = 30;
    updateCamera(cameraRef.current);
    setViewMode("3d");
  };

  return (
    <div className={`relative bg-[#F5F0E8] rounded-2xl overflow-hidden ${className || ""}`} style={{ height: "500px" }}>
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        <button
          onClick={set3DView}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium shadow transition-all ${viewMode === "3d" ? "bg-[#C9A96E] text-white" : "bg-white/80 text-gray-700 hover:bg-white"}`}
        >
          🏠 ثلاثي الأبعاد
        </button>
        <button
          onClick={setTopView}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium shadow transition-all ${viewMode === "top" ? "bg-[#C9A96E] text-white" : "bg-white/80 text-gray-700 hover:bg-white"}`}
        >
          📐 مسقط أفقي
        </button>
      </div>

      {/* Info */}
      <div className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur rounded-lg px-3 py-2 text-xs text-gray-600 text-right">
        <div className="font-semibold text-gray-800">{rooms.length} فضاء</div>
        {totalArea && <div>{totalArea} م²</div>}
        {floors && floors > 1 && <div>{floors} طوابق</div>}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/80 backdrop-blur rounded-lg px-2 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 mb-0.5"><span className="w-3 h-3 rounded inline-block" style={{ background: "#87CEEB" }}></span><span>نافذة</span></div>
        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded inline-block" style={{ background: "#8B6914" }}></span><span>باب</span></div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 right-3 z-10 text-xs text-gray-400 bg-white/60 rounded px-2 py-1">
        اسحب للتدوير • عجلة للتكبير
      </div>

      {/* Close */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-white/80 hover:bg-white text-gray-600 rounded-full w-7 h-7 flex items-center justify-center shadow text-sm"
        >
          ✕
        </button>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-[#F5F0E8]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <div className="text-sm text-gray-500">جاري بناء النموذج ثلاثي الأبعاد...</div>
          </div>
        </div>
      )}

      {/* Three.js canvas mount */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}

// إضافة تسمية نصية للغرفة (sprite)
function addRoomLabel(scene: THREE.Scene, text: string, x: number, y: number, z: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.roundRect(4, 4, 248, 56, 8);
  ctx.fill();

  ctx.fillStyle = "#4A3728";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.substring(0, 14), 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(x, y + 0.5, z);
  sprite.scale.set(3, 0.75, 1);
  scene.add(sprite);
}
