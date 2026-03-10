import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, ZoomIn, ZoomOut, Eye, Layers, Sun } from "lucide-react";

interface RoomDimensions {
  width: number;   // عرض الغرفة بالمتر
  length: number;  // طول الغرفة بالمتر
  height: number;  // ارتفاع الغرفة بالمتر
}

interface DesignColors {
  floor?: string;
  walls?: string;
  ceiling?: string;
  accent?: string;
}

interface FurnitureItem {
  name: string;
  type: "sofa" | "bed" | "table" | "chair" | "wardrobe" | "desk";
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color?: string;
}

interface Room3DViewerProps {
  dimensions?: RoomDimensions;
  colors?: DesignColors;
  furniture?: FurnitureItem[];
  roomName?: string;
  designStyle?: string;
}

const DEFAULT_DIMENSIONS: RoomDimensions = { width: 5, length: 6, height: 3 };
const DEFAULT_COLORS: DesignColors = {
  floor: "#D4A96A",
  walls: "#F5EBD8",
  ceiling: "#FAFAF8",
  accent: "#B8860B",
};

export default function Room3DViewer({
  dimensions = DEFAULT_DIMENSIONS,
  colors = DEFAULT_COLORS,
  furniture = [],
  roomName = "الغرفة",
  designStyle = "عصري",
}: Room3DViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: Math.max(dimensions.width, dimensions.length) * 1.8 });

  const [viewMode, setViewMode] = useState<"3d" | "top" | "front">("3d");
  const [showFurniture, setShowFurniture] = useState(true);
  const [showLighting, setShowLighting] = useState(true);

  useEffect(() => {
    if (!mountRef.current) return;

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // === إعداد المشهد ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#1a1208");
    scene.fog = new THREE.Fog("#1a1208", 15, 40);
    sceneRef.current = scene;

    // === الكاميرا ===
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    const r = cameraAngle.current.radius;
    const theta = cameraAngle.current.theta;
    const phi = cameraAngle.current.phi;
    camera.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi),
      r * Math.sin(phi) * Math.sin(theta)
    );
    camera.lookAt(0, dimensions.height / 2, 0);
    cameraRef.current = camera;

    // === المُصيِّر ===
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === الإضاءة ===
    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5d6, 1.2);
    sunLight.position.set(dimensions.width * 0.8, dimensions.height * 2, dimensions.length * 0.8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.1;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -15;
    sunLight.shadow.camera.right = 15;
    sunLight.shadow.camera.top = 15;
    sunLight.shadow.camera.bottom = -15;
    scene.add(sunLight);

    // إضاءة داخلية دافئة
    const pointLight1 = new THREE.PointLight(0xffd700, 0.8, 15);
    pointLight1.position.set(0, dimensions.height - 0.3, 0);
    pointLight1.castShadow = true;
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffe4b5, 0.5, 10);
    pointLight2.position.set(-dimensions.width / 3, dimensions.height * 0.7, -dimensions.length / 3);
    scene.add(pointLight2);

    // === بناء الغرفة ===
    const W = dimensions.width;
    const L = dimensions.length;
    const H = dimensions.height;

    // الأرضية
    const floorGeo = new THREE.PlaneGeometry(W, L, 20, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.floor || "#D4A96A"),
      roughness: 0.3,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // خطوط الأرضية (بلاط)
    const gridHelper = new THREE.GridHelper(Math.max(W, L), Math.max(W, L) * 2, 0x8B6914, 0x8B6914);
    (gridHelper.material as THREE.Material & { opacity: number; transparent: boolean }).opacity = 0.15;
    (gridHelper.material as THREE.Material & { opacity: number; transparent: boolean }).transparent = true;
    scene.add(gridHelper);

    // مواد الجدران
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.walls || "#F5EBD8"),
      roughness: 0.6,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    // الجدار الخلفي
    const backWallGeo = new THREE.PlaneGeometry(W, H);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, H / 2, -L / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // الجدار الأمامي (شفاف جزئياً للرؤية)
    const frontWallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.walls || "#F5EBD8"),
      roughness: 0.6,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), frontWallMat);
    frontWall.position.set(0, H / 2, L / 2);
    frontWall.rotation.y = Math.PI;
    scene.add(frontWall);

    // الجدار الأيسر
    const leftWallGeo = new THREE.PlaneGeometry(L, H);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // الجدار الأيمن (شفاف جزئياً)
    const rightWallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.walls || "#F5EBD8"),
      roughness: 0.6,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    });
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(L, H), rightWallMat);
    rightWall.position.set(W / 2, H / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);

    // السقف
    const ceilingGeo = new THREE.PlaneGeometry(W, L);
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.ceiling || "#FAFAF8"),
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = H;
    scene.add(ceiling);

    // إضافة إطار ذهبي للسقف
    const ceilingFrameMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.8, roughness: 0.2 });
    const frameThickness = 0.05;
    const frameHeight = 0.08;
    [
      { pos: [0, H - frameHeight / 2, -L / 2 + frameThickness], rot: [0, 0, 0], size: [W, frameHeight, frameThickness] },
      { pos: [0, H - frameHeight / 2, L / 2 - frameThickness], rot: [0, 0, 0], size: [W, frameHeight, frameThickness] },
      { pos: [-W / 2 + frameThickness, H - frameHeight / 2, 0], rot: [0, 0, 0], size: [frameThickness, frameHeight, L] },
      { pos: [W / 2 - frameThickness, H - frameHeight / 2, 0], rot: [0, 0, 0], size: [frameThickness, frameHeight, L] },
    ].forEach(({ pos, size }) => {
      const geo = new THREE.BoxGeometry(size[0], size[1], size[2]);
      const mesh = new THREE.Mesh(geo, ceilingFrameMat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      scene.add(mesh);
    });

    // === الأثاث ===
    if (showFurniture) {
      const furnitureItems = furniture.length > 0 ? furniture : getDefaultFurniture(W, L, designStyle);
      furnitureItems.forEach((item) => addFurnitureMesh(scene, item, colors.accent));
    }

    // === الإضاءة الديكورية ===
    if (showLighting) {
      // ثريا مركزية
      const chandelierGroup = new THREE.Group();
      const chandelierBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.9, roughness: 0.1 })
      );
      chandelierGroup.add(chandelierBase);

      // ذراعات الثريا
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const arm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.01, 0.4, 8),
          new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.9, roughness: 0.1 })
        );
        arm.rotation.z = Math.PI / 2;
        arm.position.set(Math.cos(angle) * 0.2, -0.2, Math.sin(angle) * 0.2);
        arm.rotation.x = Math.atan2(Math.sin(angle) * 0.2, -0.2);
        arm.rotation.z = Math.atan2(Math.cos(angle) * 0.2, -0.2);
        chandelierGroup.add(arm);

        // لمبة
        const bulb = new THREE.Mesh(
          new THREE.SphereGeometry(0.04, 8, 8),
          new THREE.MeshStandardMaterial({ color: 0xFFE4B5, emissive: 0xFFD700, emissiveIntensity: 0.8 })
        );
        bulb.position.set(Math.cos(angle) * 0.35, -0.38, Math.sin(angle) * 0.35);
        chandelierGroup.add(bulb);
      }

      chandelierGroup.position.set(0, H - 0.1, 0);
      scene.add(chandelierGroup);
    }

    // === التحكم بالكاميرا (السحب للتدوير) ===
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !cameraRef.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      cameraAngle.current.theta -= dx * 0.01;
      cameraAngle.current.phi = Math.max(0.1, Math.min(Math.PI / 2, cameraAngle.current.phi + dy * 0.01));
      lastMouse.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onMouseUp = () => { isDragging.current = false; };
    const onWheel = (e: WheelEvent) => {
      cameraAngle.current.radius = Math.max(3, Math.min(20, cameraAngle.current.radius + e.deltaY * 0.01));
      updateCamera();
    };

    const updateCamera = () => {
      if (!cameraRef.current) return;
      const { radius, theta, phi } = cameraAngle.current;
      cameraRef.current.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      cameraRef.current.lookAt(0, H / 2, 0);
    };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("wheel", onWheel);

    // Touch support
    const onTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - lastMouse.current.x;
      const dy = e.touches[0].clientY - lastMouse.current.y;
      cameraAngle.current.theta -= dx * 0.01;
      cameraAngle.current.phi = Math.max(0.1, Math.min(Math.PI / 2, cameraAngle.current.phi + dy * 0.01));
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCamera();
    };
    renderer.domElement.addEventListener("touchstart", onTouchStart);
    renderer.domElement.addEventListener("touchmove", onTouchMove);
    renderer.domElement.addEventListener("touchend", onMouseUp);

    // === حلقة التحريك ===
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // === تغيير الحجم ===
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      renderer.domElement.removeEventListener("touchmove", onTouchMove);
      renderer.domElement.removeEventListener("touchend", onMouseUp);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [dimensions, colors, furniture, showFurniture, showLighting, designStyle]);

  // تغيير زاوية الكاميرا حسب وضع العرض
  useEffect(() => {
    if (!cameraRef.current) return;
    const H = dimensions.height;
    const r = cameraAngle.current.radius;
    if (viewMode === "top") {
      cameraRef.current.position.set(0, r * 1.5, 0.01);
      cameraRef.current.lookAt(0, H / 2, 0);
    } else if (viewMode === "front") {
      cameraRef.current.position.set(0, H / 2, r);
      cameraRef.current.lookAt(0, H / 2, 0);
    } else {
      cameraAngle.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: r };
      const { radius, theta, phi } = cameraAngle.current;
      cameraRef.current.position.set(
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
      cameraRef.current.lookAt(0, H / 2, 0);
    }
  }, [viewMode, dimensions.height]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-gold/30">
      {/* عنوان الغرفة */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <Badge className="bg-black/60 text-gold border-gold/40 backdrop-blur-sm text-xs">
          {roomName} — {designStyle}
        </Badge>
        <Badge className="bg-black/60 text-beige border-beige/30 backdrop-blur-sm text-xs">
          {dimensions.width}م × {dimensions.length}م × {dimensions.height}م
        </Badge>
      </div>

      {/* أدوات التحكم */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        <Button
          size="sm"
          variant="outline"
          className={`h-8 w-8 p-0 backdrop-blur-sm border-gold/30 ${viewMode === "3d" ? "bg-gold/20 text-gold" : "bg-black/50 text-beige"}`}
          onClick={() => setViewMode("3d")}
          title="منظور ثلاثي الأبعاد"
        >
          <Eye className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={`h-8 w-8 p-0 backdrop-blur-sm border-gold/30 ${viewMode === "top" ? "bg-gold/20 text-gold" : "bg-black/50 text-beige"}`}
          onClick={() => setViewMode("top")}
          title="مسقط أفقي"
        >
          <Layers className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={`h-8 w-8 p-0 backdrop-blur-sm border-gold/30 ${showFurniture ? "bg-gold/20 text-gold" : "bg-black/50 text-beige"}`}
          onClick={() => setShowFurniture(!showFurniture)}
          title="إظهار/إخفاء الأثاث"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={`h-8 w-8 p-0 backdrop-blur-sm border-gold/30 ${showLighting ? "bg-gold/20 text-gold" : "bg-black/50 text-beige"}`}
          onClick={() => setShowLighting(!showLighting)}
          title="إضاءة ديكورية"
        >
          <Sun className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0 bg-black/50 text-beige backdrop-blur-sm border-gold/30"
          onClick={() => {
            cameraAngle.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: Math.max(dimensions.width, dimensions.length) * 1.8 };
            setViewMode("3d");
          }}
          title="إعادة تعيين الزاوية"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* تلميح التحكم */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
        <Badge className="bg-black/50 text-beige/70 border-beige/20 backdrop-blur-sm text-xs">
          اسحب للتدوير • عجلة الماوس للتكبير
        </Badge>
      </div>

      {/* حاوية Three.js */}
      <div ref={mountRef} className="w-full h-full" style={{ cursor: "grab" }} />
    </div>
  );
}

// دالة لإضافة قطعة أثاث للمشهد
function addFurnitureMesh(scene: THREE.Scene, item: FurnitureItem, accentColor?: string) {
  const color = item.color || accentColor || "#8B6914";
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.5,
    metalness: 0.1,
  });

  const geo = new THREE.BoxGeometry(item.width, item.height, item.depth);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(item.x, item.height / 2, item.z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  // تفاصيل إضافية حسب نوع الأثاث
  if (item.type === "sofa") {
    // مسند الكنبة
    const backMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.85), roughness: 0.6 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(item.width, item.height * 0.8, item.depth * 0.15), backMat);
    back.position.set(item.x, item.height + item.height * 0.4, item.z - item.depth / 2 + item.depth * 0.075);
    back.castShadow = true;
    scene.add(back);

    // وسادات
    for (let i = 0; i < 3; i++) {
      const cushion = new THREE.Mesh(
        new THREE.BoxGeometry(item.width / 3.5, item.height * 0.3, item.depth * 0.6),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(1.2), roughness: 0.8 })
      );
      cushion.position.set(item.x + (i - 1) * (item.width / 3.2), item.height + item.height * 0.15, item.z);
      scene.add(cushion);
    }
  } else if (item.type === "bed") {
    // وسادات السرير
    const pillow1 = new THREE.Mesh(
      new THREE.BoxGeometry(item.width * 0.35, 0.1, item.depth * 0.25),
      new THREE.MeshStandardMaterial({ color: 0xFFFAF0, roughness: 0.9 })
    );
    pillow1.position.set(item.x - item.width * 0.2, item.height + 0.05, item.z - item.depth * 0.3);
    scene.add(pillow1);
    const pillow2 = pillow1.clone();
    pillow2.position.set(item.x + item.width * 0.2, item.height + 0.05, item.z - item.depth * 0.3);
    scene.add(pillow2);
  } else if (item.type === "table") {
    // أرجل الطاولة
    const legMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), metalness: 0.3 });
    const legPositions = [
      [-item.width / 2 + 0.05, 0, -item.depth / 2 + 0.05],
      [item.width / 2 - 0.05, 0, -item.depth / 2 + 0.05],
      [-item.width / 2 + 0.05, 0, item.depth / 2 - 0.05],
      [item.width / 2 - 0.05, 0, item.depth / 2 - 0.05],
    ];
    legPositions.forEach(([lx, , lz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, item.height * 0.9, 8), legMat);
      leg.position.set(item.x + lx, item.height * 0.45, item.z + lz);
      scene.add(leg);
    });
  }
}

// أثاث افتراضي حسب نمط التصميم
function getDefaultFurniture(W: number, L: number, style: string): FurnitureItem[] {
  const isGulf = style.includes("خليجي") || style.includes("gulf");
  const isJapanese = style.includes("ياباني") || style.includes("japanese");

  const sofaColor = isGulf ? "#8B6914" : isJapanese ? "#5C4033" : "#6B4F2A";
  const tableColor = isGulf ? "#B8860B" : isJapanese ? "#4A3728" : "#8B7355";

  return [
    { name: "كنبة رئيسية", type: "sofa", x: 0, z: -L / 2 + 1.2, width: Math.min(2.5, W * 0.5), depth: 0.9, height: 0.45, color: sofaColor },
    { name: "طاولة وسط", type: "table", x: 0, z: -L / 2 + 2.5, width: 1.0, depth: 0.6, height: 0.4, color: tableColor },
    { name: "كرسي جانبي", type: "chair", x: W / 2 - 0.7, z: -L / 2 + 1.5, width: 0.7, depth: 0.7, height: 0.45, color: sofaColor },
    { name: "خزانة", type: "wardrobe", x: -W / 2 + 0.3, z: -L / 2 + 0.4, width: 0.5, depth: 0.5, height: 1.8, color: tableColor },
  ];
}
