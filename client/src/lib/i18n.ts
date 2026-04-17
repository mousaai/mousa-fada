// i18n translations for م. اليازية — Arabic, English, Urdu, French

export type Language = "ar" | "en" | "ur" | "fr";

export const RTL_LANGUAGES: Language[] = ["ar", "ur"];

export const LANGUAGE_NAMES: Record<Language, string> = {
  ar: "العربية",
  en: "English",
  ur: "اردو",
  fr: "Français",
};

export const LANGUAGE_FLAGS: Record<Language, string> = {
  ar: "🇦🇪",
  en: "🇬🇧",
  ur: "🇵🇰",
  fr: "🇫🇷",
};

export type TranslationKey =
  // App & Navigation
  | "app.name"
  | "app.tagline"
  | "app.subtitle"
  | "nav.analyze"
  | "nav.studio"
  | "nav.sarah"
  | "nav.projects"
  | "nav.store"
  // Home
  | "home.hero.title"
  | "home.hero.subtitle"
  | "home.hero.cta"
  | "home.sections.analyze"
  | "home.sections.analyze.desc"
  | "home.sections.studio"
  | "home.sections.studio.desc"
  | "home.sections.store"
  | "home.sections.store.desc"
  | "home.recentProjects"
  | "home.viewAll"
  | "home.welcome"
  | "home.loginPrompt"
  | "home.login"
  // Auth
  | "auth.login"
  | "auth.logout"
  | "auth.welcome"
  | "auth.profile"
  // SmartCapture
  | "smart.title"
  | "smart.subtitle"
  | "smart.upload"
  | "smart.uploadDesc"
  | "smart.analyze"
  | "smart.analyzing"
  | "smart.results"
  | "smart.style"
  | "smart.colors"
  | "smart.materials"
  | "smart.cost"
  | "smart.duration"
  | "smart.advantages"
  | "smart.furniture"
  | "smart.boq"
  | "smart.exportPdf"
  | "smart.buyFromBonyan"
  | "smart.changeStyle"
  | "smart.refine"
  | "smart.regenerate"
  | "smart.download"
  | "smart.share"
  | "smart.zoom"
  | "smart.noResults"
  | "smart.error"
  | "smart.credits"
  | "smart.insufficientCredits"
  | "smart.roomType"
  | "smart.styleType"
  | "smart.ideas"
  | "smart.generateIdeas"
  | "smart.generating"
  // DesignIdeas
  | "ideas.title"
  | "ideas.subtitle"
  | "ideas.generate"
  | "ideas.generating"
  | "ideas.results"
  | "ideas.noResults"
  | "ideas.roomType"
  | "ideas.style"
  | "ideas.budget"
  | "ideas.area"
  // VoiceDesigner
  | "voice.title"
  | "voice.subtitle"
  | "voice.startDrawing"
  | "voice.voiceInput"
  | "voice.listening"
  | "voice.processing"
  | "voice.generate3D"
  | "voice.generating3D"
  | "voice.clear"
  | "voice.undo"
  | "voice.rooms"
  | "voice.addRoom"
  | "voice.walls"
  | "voice.doors"
  | "voice.windows"
  | "voice.stairs"
  | "voice.furniture"
  | "voice.dimensions"
  | "voice.export"
  | "voice.exportPlan"
  | "voice.renderResult"
  // PlanRenderResult
  | "render.title"
  | "render.style"
  | "render.colors"
  | "render.materials"
  | "render.cost"
  | "render.duration"
  | "render.advantages"
  | "render.boq"
  | "render.exportPdf"
  | "render.buyFromBonyan"
  | "render.changeStyle"
  | "render.refine"
  | "render.regenerate"
  | "render.download"
  | "render.share"
  // Projects
  | "projects.title"
  | "projects.empty"
  | "projects.create"
  | "projects.delete"
  | "projects.view"
  | "projects.date"
  // Credits
  | "credits.balance"
  | "credits.buy"
  | "credits.insufficient"
  | "credits.insufficientDesc"
  | "credits.deducted"
  | "credits.cost"
  // Common
  | "common.loading"
  | "common.error"
  | "common.retry"
  | "common.close"
  | "common.save"
  | "common.cancel"
  | "common.confirm"
  | "common.back"
  | "common.next"
  | "common.done"
  | "common.yes"
  | "common.no"
  | "common.search"
  | "common.filter"
  | "common.sort"
  | "common.all"
  | "common.none"
  | "common.or"
  | "common.and"
  | "common.from"
  | "common.to"
  | "common.currency.aed"
  | "common.currency.sar"
  | "common.currency.usd"
  | "common.weeks"
  | "common.months"
  | "common.estimated"
  | "common.comingSoon"
  | "common.new"
  | "common.beta"
  | "common.experimental"
  // Sarah AI
  | "sarah.title"
  | "sarah.subtitle"
  | "sarah.greeting"
  | "sarah.placeholder"
  | "sarah.send"
  | "sarah.thinking";

type Translations = Record<TranslationKey, string>;

export const translations: Record<Language, Translations> = {
  ar: {
    // App & Navigation
    "app.name": "م. اليازية",
    "app.tagline": "خبيرة التصميم المعماري والبيئي",
    "app.subtitle": "صمّم أي فضاء بلمسة واحدة",
    "nav.analyze": "تحليل",
    "nav.studio": "استوديو",
    "nav.sarah": "م. اليازية",
    "nav.projects": "مشاريعي",
    "nav.store": "متجر الأثاث",
    // Home
    "home.hero.title": "صمّم أي فضاء\nبلمسة واحدة",
    "home.hero.subtitle": "داخلي • واجهات المباني • لاندسكيب • مسابح",
    "home.hero.cta": "تحليل الآن",
    "home.sections.analyze": "تحليل سريع",
    "home.sections.analyze.desc": "التقط صورة واليازية تحللها",
    "home.sections.studio": "ارسم بصوتك",
    "home.sections.studio.desc": "صف فضاءك واليازية تصممه",
    "home.sections.store": "متجر الأثاث",
    "home.sections.store.desc": "أثاث حقيقي من متاجر محلية",
    "home.recentProjects": "آخر المشاريع",
    "home.viewAll": "عرض الكل",
    "home.welcome": "مرحباً",
    "home.loginPrompt": "سجّل دخولك للبدء",
    "home.login": "تسجيل الدخول",
    // Auth
    "auth.login": "تسجيل الدخول",
    "auth.logout": "تسجيل الخروج",
    "auth.welcome": "مرحباً",
    "auth.profile": "الملف الشخصي",
    // SmartCapture
    "smart.title": "التحليل الذكي",
    "smart.subtitle": "التقط صورة لأي فضاء واليازية تحلله فوراً",
    "smart.upload": "رفع صورة",
    "smart.uploadDesc": "اضغط لرفع صورة أو التقاطها",
    "smart.analyze": "تحليل الصورة",
    "smart.analyzing": "جاري التحليل...",
    "smart.results": "نتائج التحليل",
    "smart.style": "النمط",
    "smart.colors": "لوحة الألوان",
    "smart.materials": "المواد والتشطيبات",
    "smart.cost": "التكلفة التقديرية",
    "smart.duration": "مدة التنفيذ",
    "smart.advantages": "مزايا التصميم",
    "smart.furniture": "الأثاث المقترح",
    "smart.boq": "جدول الكميات (BOQ)",
    "smart.exportPdf": "تصدير دفتر التصميم (PDF)",
    "smart.buyFromBonyan": "اشتري هذا الديكور من بنيان",
    "smart.changeStyle": "تغيير النمط",
    "smart.refine": "تحسين التصميم",
    "smart.regenerate": "إعادة توليد",
    "smart.download": "تحميل الصورة",
    "smart.share": "مشاركة",
    "smart.zoom": "تكبير",
    "smart.noResults": "لا توجد نتائج بعد",
    "smart.error": "حدث خطأ، حاول مجدداً",
    "smart.credits": "كريدت",
    "smart.insufficientCredits": "رصيد غير كافٍ",
    "smart.roomType": "نوع الغرفة",
    "smart.styleType": "النمط المطلوب",
    "smart.ideas": "أفكار التصميم",
    "smart.generateIdeas": "توليد أفكار",
    "smart.generating": "جاري التوليد...",
    // DesignIdeas
    "ideas.title": "أفكار التصميم",
    "ideas.subtitle": "أفكار تصميم مخصصة لفضاءك",
    "ideas.generate": "توليد أفكار",
    "ideas.generating": "جاري التوليد...",
    "ideas.results": "الأفكار المقترحة",
    "ideas.noResults": "لا توجد أفكار بعد",
    "ideas.roomType": "نوع الغرفة",
    "ideas.style": "النمط",
    "ideas.budget": "الميزانية",
    "ideas.area": "المساحة",
    // VoiceDesigner
    "voice.title": "الرسم بالصوت",
    "voice.subtitle": "صف فضاءك واليازية ترسم المسقط",
    "voice.startDrawing": "ابدأ الرسم",
    "voice.voiceInput": "إدخال صوتي",
    "voice.listening": "جاري الاستماع...",
    "voice.processing": "جاري المعالجة...",
    "voice.generate3D": "إنشاء رندر 3D",
    "voice.generating3D": "جاري إنشاء الرندر...",
    "voice.clear": "مسح الكل",
    "voice.undo": "تراجع",
    "voice.rooms": "الغرف",
    "voice.addRoom": "إضافة غرفة",
    "voice.walls": "الجدران",
    "voice.doors": "الأبواب",
    "voice.windows": "النوافذ",
    "voice.stairs": "الدرج",
    "voice.furniture": "الأثاث",
    "voice.dimensions": "الأبعاد",
    "voice.export": "تصدير",
    "voice.exportPlan": "تصدير المسقط",
    "voice.renderResult": "نتيجة الرندر",
    // PlanRenderResult
    "render.title": "نتيجة الرندر",
    "render.style": "النمط",
    "render.colors": "لوحة الألوان",
    "render.materials": "المواد والتشطيبات",
    "render.cost": "التكلفة التقديرية",
    "render.duration": "مدة التنفيذ",
    "render.advantages": "مزايا التصميم",
    "render.boq": "جدول الكميات (BOQ)",
    "render.exportPdf": "تصدير دفتر التصميم (PDF)",
    "render.buyFromBonyan": "اشتري هذا الديكور من بنيان",
    "render.changeStyle": "تغيير النمط",
    "render.refine": "تحسين التصميم",
    "render.regenerate": "إعادة توليد",
    "render.download": "تحميل الصورة",
    "render.share": "مشاركة",
    // Projects
    "projects.title": "مشاريعي",
    "projects.empty": "لا توجد مشاريع بعد",
    "projects.create": "إنشاء مشروع",
    "projects.delete": "حذف",
    "projects.view": "عرض",
    "projects.date": "التاريخ",
    // Credits
    "credits.balance": "الرصيد",
    "credits.buy": "شراء كريدت",
    "credits.insufficient": "رصيد غير كافٍ",
    "credits.insufficientDesc": "رصيدك الحالي لا يكفي لهذه العملية",
    "credits.deducted": "تم خصم",
    "credits.cost": "التكلفة",
    // Common
    "common.loading": "جاري التحميل...",
    "common.error": "حدث خطأ",
    "common.retry": "إعادة المحاولة",
    "common.close": "إغلاق",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.confirm": "تأكيد",
    "common.back": "رجوع",
    "common.next": "التالي",
    "common.done": "تم",
    "common.yes": "نعم",
    "common.no": "لا",
    "common.search": "بحث",
    "common.filter": "تصفية",
    "common.sort": "ترتيب",
    "common.all": "الكل",
    "common.none": "لا شيء",
    "common.or": "أو",
    "common.and": "و",
    "common.from": "من",
    "common.to": "إلى",
    "common.currency.aed": "درهم إماراتي",
    "common.currency.sar": "ريال سعودي",
    "common.currency.usd": "دولار أمريكي",
    "common.weeks": "أسابيع",
    "common.months": "أشهر",
    "common.estimated": "تقديري",
    "common.comingSoon": "قريباً",
    "common.new": "جديد",
    "common.beta": "تجريبي",
    "common.experimental": "تجريبي",
    // Sarah AI
    "sarah.title": "م. اليازية",
    "sarah.subtitle": "خبيرتك في التصميم المعماري والبيئي",
    "sarah.greeting": "مرحباً! أنا م. اليازية، خبيرتك في التصميم الداخلي، الواجهات، اللاندسكيب والزراعة التجميلية، المسابح، والتصميم الحضري. كيف يمكنني مساعدتك؟",
    "sarah.placeholder": "اسألي م. اليازية عن التصميم...",
    "sarah.send": "إرسال",
    "sarah.thinking": "م. اليازية تفكر...",
  },

  en: {
    // App & Navigation
    "app.name": "Eng. Alyazia",
    "app.tagline": "Architectural & Environmental Design Expert",
    "app.subtitle": "Design any space with one touch",
    "nav.analyze": "Analyze",
    "nav.studio": "Studio",
    "nav.sarah": "Eng. Alyazia",
    "nav.projects": "My Projects",
    "nav.store": "Furniture Store",
    // Home
    "home.hero.title": "Design Any Space\nWith One Touch",
    "home.hero.subtitle": "Interior • Facades • Landscape • Pools",
    "home.hero.cta": "Analyze Now",
    "home.sections.analyze": "Quick Analysis",
    "home.sections.analyze.desc": "Take a photo and Alyazia analyzes it",
    "home.sections.studio": "Draw by Voice",
    "home.sections.studio.desc": "Describe your space and Alyazia designs it",
    "home.sections.store": "Furniture Store",
    "home.sections.store.desc": "Real furniture from local stores",
    "home.recentProjects": "Recent Projects",
    "home.viewAll": "View All",
    "home.welcome": "Welcome",
    "home.loginPrompt": "Sign in to get started",
    "home.login": "Sign In",
    // Auth
    "auth.login": "Sign In",
    "auth.logout": "Sign Out",
    "auth.welcome": "Welcome",
    "auth.profile": "Profile",
    // SmartCapture
    "smart.title": "Smart Analysis",
    "smart.subtitle": "Capture any space and Alyazia analyzes it instantly",
    "smart.upload": "Upload Photo",
    "smart.uploadDesc": "Tap to upload or take a photo",
    "smart.analyze": "Analyze Photo",
    "smart.analyzing": "Analyzing...",
    "smart.results": "Analysis Results",
    "smart.style": "Style",
    "smart.colors": "Color Palette",
    "smart.materials": "Materials & Finishes",
    "smart.cost": "Estimated Cost",
    "smart.duration": "Timeline",
    "smart.advantages": "Design Advantages",
    "smart.furniture": "Suggested Furniture",
    "smart.boq": "Bill of Quantities (BOQ)",
    "smart.exportPdf": "Export Design Book (PDF)",
    "smart.buyFromBonyan": "Buy This Decor from Bonyan",
    "smart.changeStyle": "Change Style",
    "smart.refine": "Refine Design",
    "smart.regenerate": "Regenerate",
    "smart.download": "Download Image",
    "smart.share": "Share",
    "smart.zoom": "Zoom",
    "smart.noResults": "No results yet",
    "smart.error": "An error occurred, please try again",
    "smart.credits": "credits",
    "smart.insufficientCredits": "Insufficient Credits",
    "smart.roomType": "Room Type",
    "smart.styleType": "Desired Style",
    "smart.ideas": "Design Ideas",
    "smart.generateIdeas": "Generate Ideas",
    "smart.generating": "Generating...",
    // DesignIdeas
    "ideas.title": "Design Ideas",
    "ideas.subtitle": "Personalized design ideas for your space",
    "ideas.generate": "Generate Ideas",
    "ideas.generating": "Generating...",
    "ideas.results": "Suggested Ideas",
    "ideas.noResults": "No ideas yet",
    "ideas.roomType": "Room Type",
    "ideas.style": "Style",
    "ideas.budget": "Budget",
    "ideas.area": "Area",
    // VoiceDesigner
    "voice.title": "Voice Drawing",
    "voice.subtitle": "Describe your space and Alyazia draws the floor plan",
    "voice.startDrawing": "Start Drawing",
    "voice.voiceInput": "Voice Input",
    "voice.listening": "Listening...",
    "voice.processing": "Processing...",
    "voice.generate3D": "Generate 3D Render",
    "voice.generating3D": "Generating render...",
    "voice.clear": "Clear All",
    "voice.undo": "Undo",
    "voice.rooms": "Rooms",
    "voice.addRoom": "Add Room",
    "voice.walls": "Walls",
    "voice.doors": "Doors",
    "voice.windows": "Windows",
    "voice.stairs": "Stairs",
    "voice.furniture": "Furniture",
    "voice.dimensions": "Dimensions",
    "voice.export": "Export",
    "voice.exportPlan": "Export Floor Plan",
    "voice.renderResult": "Render Result",
    // PlanRenderResult
    "render.title": "Render Result",
    "render.style": "Style",
    "render.colors": "Color Palette",
    "render.materials": "Materials & Finishes",
    "render.cost": "Estimated Cost",
    "render.duration": "Timeline",
    "render.advantages": "Design Advantages",
    "render.boq": "Bill of Quantities (BOQ)",
    "render.exportPdf": "Export Design Book (PDF)",
    "render.buyFromBonyan": "Buy This Decor from Bonyan",
    "render.changeStyle": "Change Style",
    "render.refine": "Refine Design",
    "render.regenerate": "Regenerate",
    "render.download": "Download Image",
    "render.share": "Share",
    // Projects
    "projects.title": "My Projects",
    "projects.empty": "No projects yet",
    "projects.create": "Create Project",
    "projects.delete": "Delete",
    "projects.view": "View",
    "projects.date": "Date",
    // Credits
    "credits.balance": "Balance",
    "credits.buy": "Buy Credits",
    "credits.insufficient": "Insufficient Credits",
    "credits.insufficientDesc": "Your current balance is not enough for this operation",
    "credits.deducted": "Deducted",
    "credits.cost": "Cost",
    // Common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.retry": "Retry",
    "common.close": "Close",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.confirm": "Confirm",
    "common.back": "Back",
    "common.next": "Next",
    "common.done": "Done",
    "common.yes": "Yes",
    "common.no": "No",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.sort": "Sort",
    "common.all": "All",
    "common.none": "None",
    "common.or": "or",
    "common.and": "and",
    "common.from": "from",
    "common.to": "to",
    "common.currency.aed": "AED",
    "common.currency.sar": "SAR",
    "common.currency.usd": "USD",
    "common.weeks": "weeks",
    "common.months": "months",
    "common.estimated": "Estimated",
    "common.comingSoon": "Coming Soon",
    "common.new": "New",
    "common.beta": "Beta",
    "common.experimental": "Experimental",
    // Sarah AI
    "sarah.title": "Eng. Alyazia",
    "sarah.subtitle": "Your architectural & environmental design expert",
    "sarah.greeting": "Hello! I'm Eng. Alyazia, your expert in interior design, facades, landscape & ornamental planting, pools, and urban design. How can I help you?",
    "sarah.placeholder": "Ask Eng. Alyazia about design...",
    "sarah.send": "Send",
    "sarah.thinking": "Eng. Alyazia is thinking...",
  },

  ur: {
    // App & Navigation
    "app.name": "م. الیازیہ",
    "app.tagline": "تعمیراتی ڈیزائن ماہر",
    "app.subtitle": "ایک لمس سے کوئی بھی جگہ ڈیزائن کریں",
    "nav.analyze": "تجزیہ",
    "nav.studio": "اسٹوڈیو",
    "nav.sarah": "م. الیازیہ",
    "nav.projects": "میرے منصوبے",
    "nav.store": "فرنیچر اسٹور",
    // Home
    "home.hero.title": "ایک لمس سے\nکوئی بھی جگہ ڈیزائن کریں",
    "home.hero.subtitle": "اندرونی • عمارت کے اگلے حصے • لینڈسکیپ • تالاب",
    "home.hero.cta": "ابھی تجزیہ کریں",
    "home.sections.analyze": "فوری تجزیہ",
    "home.sections.analyze.desc": "تصویر لیں اور الیازیہ تجزیہ کرے گی",
    "home.sections.studio": "آواز سے ڈرائنگ",
    "home.sections.studio.desc": "اپنی جگہ بیان کریں اور الیازیہ ڈیزائن کرے گی",
    "home.sections.store": "فرنیچر اسٹور",
    "home.sections.store.desc": "مقامی اسٹورز سے حقیقی فرنیچر",
    "home.recentProjects": "حالیہ منصوبے",
    "home.viewAll": "سب دیکھیں",
    "home.welcome": "خوش آمدید",
    "home.loginPrompt": "شروع کرنے کے لیے سائن ان کریں",
    "home.login": "سائن ان",
    // Auth
    "auth.login": "سائن ان",
    "auth.logout": "سائن آؤٹ",
    "auth.welcome": "خوش آمدید",
    "auth.profile": "پروفائل",
    // SmartCapture
    "smart.title": "ذہین تجزیہ",
    "smart.subtitle": "کوئی بھی جگہ کیپچر کریں اور الیازیہ فوری تجزیہ کرے گی",
    "smart.upload": "تصویر اپلوڈ کریں",
    "smart.uploadDesc": "تصویر اپلوڈ یا لینے کے لیے ٹیپ کریں",
    "smart.analyze": "تصویر کا تجزیہ کریں",
    "smart.analyzing": "تجزیہ ہو رہا ہے...",
    "smart.results": "تجزیہ کے نتائج",
    "smart.style": "انداز",
    "smart.colors": "رنگ پیلیٹ",
    "smart.materials": "مواد اور تکمیل",
    "smart.cost": "تخمینی لاگت",
    "smart.duration": "وقت کا تخمینہ",
    "smart.advantages": "ڈیزائن کے فوائد",
    "smart.furniture": "تجویز کردہ فرنیچر",
    "smart.boq": "مقدار کا بل (BOQ)",
    "smart.exportPdf": "ڈیزائن بک برآمد کریں (PDF)",
    "smart.buyFromBonyan": "بنیان سے یہ ڈیکور خریدیں",
    "smart.changeStyle": "انداز تبدیل کریں",
    "smart.refine": "ڈیزائن بہتر کریں",
    "smart.regenerate": "دوبارہ بنائیں",
    "smart.download": "تصویر ڈاؤنلوڈ کریں",
    "smart.share": "شیئر کریں",
    "smart.zoom": "زوم",
    "smart.noResults": "ابھی کوئی نتائج نہیں",
    "smart.error": "ایک خرابی پیش آئی، دوبارہ کوشش کریں",
    "smart.credits": "کریڈٹ",
    "smart.insufficientCredits": "ناکافی کریڈٹ",
    "smart.roomType": "کمرے کی قسم",
    "smart.styleType": "مطلوبہ انداز",
    "smart.ideas": "ڈیزائن کے خیالات",
    "smart.generateIdeas": "خیالات بنائیں",
    "smart.generating": "بن رہا ہے...",
    // DesignIdeas
    "ideas.title": "ڈیزائن کے خیالات",
    "ideas.subtitle": "آپ کی جگہ کے لیے ذاتی ڈیزائن کے خیالات",
    "ideas.generate": "خیالات بنائیں",
    "ideas.generating": "بن رہا ہے...",
    "ideas.results": "تجویز کردہ خیالات",
    "ideas.noResults": "ابھی کوئی خیالات نہیں",
    "ideas.roomType": "کمرے کی قسم",
    "ideas.style": "انداز",
    "ideas.budget": "بجٹ",
    "ideas.area": "رقبہ",
    // VoiceDesigner
    "voice.title": "آواز سے ڈرائنگ",
    "voice.subtitle": "اپنی جگہ بیان کریں اور الیازیہ فلور پلان بنائے گی",
    "voice.startDrawing": "ڈرائنگ شروع کریں",
    "voice.voiceInput": "آواز سے ان پٹ",
    "voice.listening": "سن رہا ہے...",
    "voice.processing": "پروسیسنگ ہو رہی ہے...",
    "voice.generate3D": "3D رینڈر بنائیں",
    "voice.generating3D": "رینڈر بن رہا ہے...",
    "voice.clear": "سب صاف کریں",
    "voice.undo": "واپس کریں",
    "voice.rooms": "کمرے",
    "voice.addRoom": "کمرہ شامل کریں",
    "voice.walls": "دیواریں",
    "voice.doors": "دروازے",
    "voice.windows": "کھڑکیاں",
    "voice.stairs": "سیڑھیاں",
    "voice.furniture": "فرنیچر",
    "voice.dimensions": "پیمائش",
    "voice.export": "برآمد کریں",
    "voice.exportPlan": "فلور پلان برآمد کریں",
    "voice.renderResult": "رینڈر نتیجہ",
    // PlanRenderResult
    "render.title": "رینڈر نتیجہ",
    "render.style": "انداز",
    "render.colors": "رنگ پیلیٹ",
    "render.materials": "مواد اور تکمیل",
    "render.cost": "تخمینی لاگت",
    "render.duration": "وقت کا تخمینہ",
    "render.advantages": "ڈیزائن کے فوائد",
    "render.boq": "مقدار کا بل (BOQ)",
    "render.exportPdf": "ڈیزائن بک برآمد کریں (PDF)",
    "render.buyFromBonyan": "بنیان سے یہ ڈیکور خریدیں",
    "render.changeStyle": "انداز تبدیل کریں",
    "render.refine": "ڈیزائن بہتر کریں",
    "render.regenerate": "دوبارہ بنائیں",
    "render.download": "تصویر ڈاؤنلوڈ کریں",
    "render.share": "شیئر کریں",
    // Projects
    "projects.title": "میرے منصوبے",
    "projects.empty": "ابھی کوئی منصوبے نہیں",
    "projects.create": "منصوبہ بنائیں",
    "projects.delete": "حذف کریں",
    "projects.view": "دیکھیں",
    "projects.date": "تاریخ",
    // Credits
    "credits.balance": "بیلنس",
    "credits.buy": "کریڈٹ خریدیں",
    "credits.insufficient": "ناکافی کریڈٹ",
    "credits.insufficientDesc": "اس آپریشن کے لیے آپ کا موجودہ بیلنس کافی نہیں",
    "credits.deducted": "کٹوتی کی گئی",
    "credits.cost": "لاگت",
    // Common
    "common.loading": "لوڈ ہو رہا ہے...",
    "common.error": "ایک خرابی پیش آئی",
    "common.retry": "دوبارہ کوشش کریں",
    "common.close": "بند کریں",
    "common.save": "محفوظ کریں",
    "common.cancel": "منسوخ کریں",
    "common.confirm": "تصدیق کریں",
    "common.back": "واپس",
    "common.next": "اگلا",
    "common.done": "مکمل",
    "common.yes": "ہاں",
    "common.no": "نہیں",
    "common.search": "تلاش",
    "common.filter": "فلٹر",
    "common.sort": "ترتیب",
    "common.all": "سب",
    "common.none": "کچھ نہیں",
    "common.or": "یا",
    "common.and": "اور",
    "common.from": "سے",
    "common.to": "تک",
    "common.currency.aed": "AED",
    "common.currency.sar": "SAR",
    "common.currency.usd": "USD",
    "common.weeks": "ہفتے",
    "common.months": "مہینے",
    "common.estimated": "تخمینی",
    "common.comingSoon": "جلد آ رہا ہے",
    "common.new": "نیا",
    "common.beta": "بیٹا",
    "common.experimental": "تجرباتی",
    // Sarah AI
    "sarah.title": "م. الیازیہ",
    "sarah.subtitle": "آپ کی اندرونی ڈیزائن معاون",
    "sarah.greeting": "السلام علیکم! میں م. الیازیہ ہوں، آپ کی اندرونی ڈیزائن ماہر۔ میں آپ کی کیسے مدد کر سکتی ہوں؟",
    "sarah.placeholder": "م. الیازیہ سے ڈیزائن کے بارے میں پوچھیں...",
    "sarah.send": "بھیجیں",
    "sarah.thinking": "م. الیازیہ سوچ رہی ہے...",
  },

  fr: {
    // App & Navigation
    "app.name": "Ing. Alyazia",
    "app.tagline": "Experte en Design Architectural & Environnemental",
    "app.subtitle": "Concevez n'importe quel espace en un seul toucher",
    "nav.analyze": "Analyser",
    "nav.studio": "Studio",
    "nav.sarah": "Ing. Alyazia",
    "nav.projects": "Mes Projets",
    "nav.store": "Boutique Meubles",
    // Home
    "home.hero.title": "Concevez n'importe\nquel espace en un toucher",
    "home.hero.subtitle": "Intérieur • Façades • Paysage • Piscines",
    "home.hero.cta": "Analyser Maintenant",
    "home.sections.analyze": "Analyse Rapide",
    "home.sections.analyze.desc": "Prenez une photo et Alyazia l'analyse",
    "home.sections.studio": "Dessiner par Voix",
    "home.sections.studio.desc": "Décrivez votre espace et Alyazia le conçoit",
    "home.sections.store": "Boutique Meubles",
    "home.sections.store.desc": "Vrais meubles de magasins locaux",
    "home.recentProjects": "Projets Récents",
    "home.viewAll": "Voir Tout",
    "home.welcome": "Bienvenue",
    "home.loginPrompt": "Connectez-vous pour commencer",
    "home.login": "Se Connecter",
    // Auth
    "auth.login": "Se Connecter",
    "auth.logout": "Se Déconnecter",
    "auth.welcome": "Bienvenue",
    "auth.profile": "Profil",
    // SmartCapture
    "smart.title": "Analyse Intelligente",
    "smart.subtitle": "Capturez n'importe quel espace et Alyazia l'analyse instantanément",
    "smart.upload": "Télécharger Photo",
    "smart.uploadDesc": "Appuyez pour télécharger ou prendre une photo",
    "smart.analyze": "Analyser la Photo",
    "smart.analyzing": "Analyse en cours...",
    "smart.results": "Résultats d'Analyse",
    "smart.style": "Style",
    "smart.colors": "Palette de Couleurs",
    "smart.materials": "Matériaux et Finitions",
    "smart.cost": "Coût Estimé",
    "smart.duration": "Délai",
    "smart.advantages": "Avantages du Design",
    "smart.furniture": "Mobilier Suggéré",
    "smart.boq": "Devis Quantitatif (BOQ)",
    "smart.exportPdf": "Exporter le Livre de Design (PDF)",
    "smart.buyFromBonyan": "Acheter ce Décor chez Bonyan",
    "smart.changeStyle": "Changer le Style",
    "smart.refine": "Affiner le Design",
    "smart.regenerate": "Régénérer",
    "smart.download": "Télécharger l'Image",
    "smart.share": "Partager",
    "smart.zoom": "Zoom",
    "smart.noResults": "Pas encore de résultats",
    "smart.error": "Une erreur s'est produite, veuillez réessayer",
    "smart.credits": "crédits",
    "smart.insufficientCredits": "Crédits Insuffisants",
    "smart.roomType": "Type de Pièce",
    "smart.styleType": "Style Souhaité",
    "smart.ideas": "Idées de Design",
    "smart.generateIdeas": "Générer des Idées",
    "smart.generating": "Génération en cours...",
    // DesignIdeas
    "ideas.title": "Idées de Design",
    "ideas.subtitle": "Idées de design personnalisées pour votre espace",
    "ideas.generate": "Générer des Idées",
    "ideas.generating": "Génération en cours...",
    "ideas.results": "Idées Suggérées",
    "ideas.noResults": "Pas encore d'idées",
    "ideas.roomType": "Type de Pièce",
    "ideas.style": "Style",
    "ideas.budget": "Budget",
    "ideas.area": "Surface",
    // VoiceDesigner
    "voice.title": "Dessin par Voix",
    "voice.subtitle": "Décrivez votre espace et Alyazia dessine le plan",
    "voice.startDrawing": "Commencer à Dessiner",
    "voice.voiceInput": "Entrée Vocale",
    "voice.listening": "Écoute en cours...",
    "voice.processing": "Traitement en cours...",
    "voice.generate3D": "Générer Rendu 3D",
    "voice.generating3D": "Génération du rendu...",
    "voice.clear": "Tout Effacer",
    "voice.undo": "Annuler",
    "voice.rooms": "Pièces",
    "voice.addRoom": "Ajouter une Pièce",
    "voice.walls": "Murs",
    "voice.doors": "Portes",
    "voice.windows": "Fenêtres",
    "voice.stairs": "Escaliers",
    "voice.furniture": "Mobilier",
    "voice.dimensions": "Dimensions",
    "voice.export": "Exporter",
    "voice.exportPlan": "Exporter le Plan",
    "voice.renderResult": "Résultat du Rendu",
    // PlanRenderResult
    "render.title": "Résultat du Rendu",
    "render.style": "Style",
    "render.colors": "Palette de Couleurs",
    "render.materials": "Matériaux et Finitions",
    "render.cost": "Coût Estimé",
    "render.duration": "Délai",
    "render.advantages": "Avantages du Design",
    "render.boq": "Devis Quantitatif (BOQ)",
    "render.exportPdf": "Exporter le Livre de Design (PDF)",
    "render.buyFromBonyan": "Acheter ce Décor chez Bonyan",
    "render.changeStyle": "Changer le Style",
    "render.refine": "Affiner le Design",
    "render.regenerate": "Régénérer",
    "render.download": "Télécharger l'Image",
    "render.share": "Partager",
    // Projects
    "projects.title": "Mes Projets",
    "projects.empty": "Pas encore de projets",
    "projects.create": "Créer un Projet",
    "projects.delete": "Supprimer",
    "projects.view": "Voir",
    "projects.date": "Date",
    // Credits
    "credits.balance": "Solde",
    "credits.buy": "Acheter des Crédits",
    "credits.insufficient": "Crédits Insuffisants",
    "credits.insufficientDesc": "Votre solde actuel est insuffisant pour cette opération",
    "credits.deducted": "Déduit",
    "credits.cost": "Coût",
    // Common
    "common.loading": "Chargement...",
    "common.error": "Une erreur s'est produite",
    "common.retry": "Réessayer",
    "common.close": "Fermer",
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.confirm": "Confirmer",
    "common.back": "Retour",
    "common.next": "Suivant",
    "common.done": "Terminé",
    "common.yes": "Oui",
    "common.no": "Non",
    "common.search": "Rechercher",
    "common.filter": "Filtrer",
    "common.sort": "Trier",
    "common.all": "Tout",
    "common.none": "Aucun",
    "common.or": "ou",
    "common.and": "et",
    "common.from": "de",
    "common.to": "à",
    "common.currency.aed": "AED",
    "common.currency.sar": "SAR",
    "common.currency.usd": "USD",
    "common.weeks": "semaines",
    "common.months": "mois",
    "common.estimated": "Estimé",
    "common.comingSoon": "Bientôt Disponible",
    "common.new": "Nouveau",
    "common.beta": "Bêta",
    "common.experimental": "Expérimental",
    // Sarah AI
    "sarah.title": "Ing. Alyazia",
    "sarah.subtitle": "Votre experte en design architectural et environnemental",
    "sarah.greeting": "Bonjour! Je suis Ing. Alyazia, votre experte en design d'intérieur, façades, paysagisme, piscines et design urbain. Comment puis-je vous aider?",
    "sarah.placeholder": "Demandez à Ing. Alyazia sur le design...",
    "sarah.send": "Envoyer",
    "sarah.thinking": "Ing. Alyazia réfléchit...",
  },
};

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations["ar"][key] ?? key;
}

export function isRTL(lang: Language): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem("sarah_language");
    if (stored && ["ar", "en", "ur", "fr"].includes(stored)) {
      return stored as Language;
    }
  } catch {}
  return "ar";
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem("sarah_language", lang);
  } catch {}
}
