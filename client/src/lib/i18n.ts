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
  | "sarah.thinking"
  | "analyze.analyze"
  | "analyze.results"
  | "analyze.title"
  | "analyze.upload"
  | "ar.subtitle"
  | "ar.title"
  | "auth.gate.btn"
  | "auth.gate.subtitle"
  | "auth.gate.title"
  | "costs.subtitle"
  | "costs.title"
  | "credit.badge.balance"
  | "credit.badge.buy"
  | "credits.buyMore"
  | "credits.costLabel"
  | "credits.deductedMsg"
  | "credits.insufficientMsg"
  | "credits.perOperation"
  | "credits.title"
  | "credits.yourBalance"
  | "error.apology"
  | "error.details"
  | "error.reload"
  | "error.unexpected"
  | "home.hero.badge"
  | "home.hero.facades"
  | "home.hero.interior"
  | "home.hero.landscape"
  | "home.hero.pools"
  | "home.noProjects"
  | "home.sections.title"
  | "home.startAnalysis"
  | "ideas.page.area"
  | "ideas.page.budget"
  | "ideas.page.generate"
  | "ideas.page.generating"
  | "ideas.page.noResults"
  | "ideas.page.roomType"
  | "ideas.page.style"
  | "ideas.page.subtitle"
  | "ideas.page.title"
  | "login.btn"
  | "login.features.analyze"
  | "login.features.design"
  | "login.features.save"
  | "login.subtitle"
  | "login.title"
  | "moodboard.addImage"
  | "moodboard.export"
  | "moodboard.generate"
  | "moodboard.save"
  | "moodboard.subtitle"
  | "moodboard.title"
  | "nav.designIdeas"
  | "nav.furnitureStore"
  | "nav.home"
  | "nav.logout"
  | "nav.myProjects"
  | "nav.quickAnalyze"
  | "nav.smartCapture"
  | "nav.voiceDesigner"
  | "plan.subtitle"
  | "plan.title"
  | "project.detail.cost"
  | "project.detail.delete"
  | "project.detail.export"
  | "project.detail.materials"
  | "project.detail.overview"
  | "project.detail.palette"
  | "project.detail.share"
  | "project.detail.title"
  | "projects.analyzeNow"
  | "projects.deleteConfirm"
  | "projects.deleted"
  | "projects.myProjects"
  | "projects.noProjects"
  | "projects.startFirst"
  | "projects.type.quick"
  | "projects.type.smart"
  | "projects.type.voice"
  | "quick.analyze.btn"
  | "quick.analyzing"
  | "quick.analyzing.subtitle"
  | "quick.budget.custom"
  | "quick.budget.economy"
  | "quick.budget.from"
  | "quick.budget.medium"
  | "quick.budget.premium"
  | "quick.budget.title"
  | "quick.budget.to"
  | "quick.capture.fromGallery"
  | "quick.capture.multi.title"
  | "quick.capture.nextStyle"
  | "quick.capture.noImage"
  | "quick.capture.note.label"
  | "quick.capture.note.optional"
  | "quick.capture.note.placeholder"
  | "quick.capture.openCamera"
  | "quick.capture.title"
  | "quick.mode.multi"
  | "quick.mode.multi.desc"
  | "quick.mode.panorama"
  | "quick.mode.panorama.desc"
  | "quick.mode.single"
  | "quick.mode.single.desc"
  | "quick.mode.subtitle"
  | "quick.mode.title"
  | "quick.mode.video"
  | "quick.mode.video.desc"
  | "quick.result.chat"
  | "quick.result.copied"
  | "quick.result.copy"
  | "quick.result.cost"
  | "quick.result.export"
  | "quick.result.generate"
  | "quick.result.generating"
  | "quick.result.newAnalysis"
  | "quick.result.overview"
  | "quick.result.palette"
  | "quick.result.reanalyze"
  | "quick.result.suggestions"
  | "quick.style.classic"
  | "quick.style.gulf"
  | "quick.style.japanese"
  | "quick.style.luxury"
  | "quick.style.minimal"
  | "quick.style.modern"
  | "quick.style.moroccan"
  | "quick.style.scandinavian"
  | "quick.style.subtitle"
  | "quick.style.title"
  | "quick.tip.label"
  | "quick.title"
  | "sarah.chat.applyDesign"
  | "sarah.chat.attachImage"
  | "sarah.chat.creditPerMsg"
  | "sarah.chat.generateImage"
  | "sarah.chat.modifiedDesign"
  | "sarah.chat.placeholder"
  | "sarah.chat.send"
  | "sarah.chat.subtitle"
  | "sarah.chat.tapToGenerate"
  | "sarah.chat.thinking"
  | "sarah.chat.title"
  | "sarah.chat.willGenerate"
  | "scanner.back"
  | "scanner.backDesc"
  | "scanner.backWall"
  | "scanner.cameraError"
  | "scanner.ceiling"
  | "scanner.ceilingDesc"
  | "scanner.corner"
  | "scanner.corner.dir"
  | "scanner.cornerDesc"
  | "scanner.down"
  | "scanner.floor"
  | "scanner.floorDesc"
  | "scanner.forward"
  | "scanner.frontDesc"
  | "scanner.frontWall"
  | "scanner.left"
  | "scanner.leftDesc"
  | "scanner.leftWall"
  | "scanner.right"
  | "scanner.rightDesc"
  | "scanner.rightWall"
  | "scanner.up"
  | "smart.capture.advantages"
  | "smart.capture.analyzeBtn"
  | "smart.capture.analyzing"
  | "smart.capture.boq"
  | "smart.capture.buyFromBonyan"
  | "smart.capture.changeStyle"
  | "smart.capture.cost"
  | "smart.capture.download"
  | "smart.capture.duration"
  | "smart.capture.error"
  | "smart.capture.exportPdf"
  | "smart.capture.furniture"
  | "smart.capture.generateIdeas"
  | "smart.capture.materials"
  | "smart.capture.noResults"
  | "smart.capture.overview"
  | "smart.capture.palette"
  | "smart.capture.refine"
  | "smart.capture.regenerate"
  | "smart.capture.results"
  | "smart.capture.roomType"
  | "smart.capture.share"
  | "smart.capture.style"
  | "smart.capture.styleType"
  | "smart.capture.title"
  | "smart.capture.upload"
  | "store.addToCart"
  | "store.comingSoon"
  | "store.filter.all"
  | "store.filter.bed"
  | "store.filter.dining"
  | "store.filter.office"
  | "store.filter.outdoor"
  | "store.filter.sofa"
  | "store.noResults"
  | "store.search"
  | "store.subtitle"
  | "store.title"
  | "store.viewProduct"
  | "studio.description"
  | "studio.generate"
  | "studio.generating"
  | "studio.result"
  | "studio.roomType"
  | "studio.style"
  | "studio.subtitle"
  | "studio.title"
  | "ui.all"
  | "ui.back"
  | "ui.beta"
  | "ui.cancel"
  | "ui.close"
  | "ui.comingSoon"
  | "ui.confirm"
  | "ui.currency.aed"
  | "ui.currency.sar"
  | "ui.currency.usd"
  | "ui.done"
  | "ui.error"
  | "ui.estimated"
  | "ui.filter"
  | "ui.loading"
  | "ui.months"
  | "ui.new"
  | "ui.next"
  | "ui.no"
  | "ui.retry"
  | "ui.save"
  | "ui.search"
  | "ui.sort"
  | "ui.weeks"
  | "ui.yes"
  | "urban.subtitle"
  | "urban.title"
  | "voice.page.ac"
  | "voice.page.addRoom"
  | "voice.page.clear"
  | "voice.page.dimensions"
  | "voice.page.door"
  | "voice.page.doors"
  | "voice.page.electricity"
  | "voice.page.export"
  | "voice.page.exportPlan"
  | "voice.page.furniture"
  | "voice.page.generate3D"
  | "voice.page.generating3D"
  | "voice.page.listening"
  | "voice.page.processing"
  | "voice.page.renderResult"
  | "voice.page.room"
  | "voice.page.rooms"
  | "voice.page.selected"
  | "voice.page.stairs"
  | "voice.page.startDrawing"
  | "voice.page.subtitle"
  | "voice.page.title"
  | "voice.page.undo"
  | "voice.page.voiceInput"
  | "voice.page.wall"
  | "voice.page.walls"
  | "voice.page.window"
  | "voice.page.windows"
  | "quick.capture.angle"
  | "quick.capture.cameraError"
  | "quick.capture.fromGallery"
  | "quick.capture.nextStyle"
  | "quick.capture.noImage"
  | "quick.capture.noVideo"
  | "quick.capture.openCamera"
  | "quick.capture.uploadVideo"
  | "quick.result.newAnalysis"
  | "smart.capture.changeStyle"
  | "smart.capture.zoom"
  | "ui.add"
  | "ui.colorName"
  | "ui.editColor"

  | "chat.analysisError"
  | "chat.expert.title"
  | "chat.imageError"
  | "chat.imageUploaded"
  | "chat.linkProject"
  | "chat.loginRequired"
  | "chat.noProject"
  | "chat.quickQuestion"
  | "chat.sendError"
  | "chat.session.element"
  | "chat.session.element.desc"
  | "chat.session.floorPlan"
  | "chat.session.floorPlan.desc"
  | "chat.session.general"
  | "chat.session.general.desc"
  | "chat.session.scan360"
  | "chat.session.scan360.desc"
  | "chat.welcome.subtitle"
  | "chat.welcome.title"
  | "credit.balance"
  | "credit.buy"
  | "credit.empty"
  | "credit.hello"
  | "credit.link"
  | "credit.linkDesc"
  | "credit.linkTitle"
  | "credit.login"
  | "credit.loginDesc"
  | "credit.loginTitle"
  | "credit.low"
  | "credit.refresh"
  | "credit.yourBalance"
  | "voice.commands.title"
  | "voice.help"
  | "voice.hint1"
  | "voice.hint2"
  | "voice.hint3"
  | "voice.hint4"
  | "voice.hint5"
  | "voice.openAR"
  | "voice.openAnalyze"
  | "voice.openChat"
  | "voice.openCosts"
  | "voice.openMoodboard"
  | "voice.openProjects"
  | "voice.openStudio"
  | "voice.startListening"
  | "voice.stop"
  | "voice.stopListening"
  | "ar.scanning"
  | "costs.area"
  | "costs.calculate"
  | "costs.level"
  | "costs.total"
  | "ideas.category"
  | "mood.create"
  | "mood.title"
  | "projects.name"
  | "projects.new"
  | "projects.start"
  | "sc.benefit"
  | "sc.direction"
  | "sc.level"
  | "sc.materials"
  | "sc.perspective"
  | "sc.reason"
  | "sc.specialist"
  | "sc.treatment"
  | "sc.untouched"
  | "ar.startScan"
  | "ar.stopScan"
  | "ar.scanSpace"
  | "mood.addImage"
  | "projects.confirmDelete"
  | "projects.createdAt"
  | "projects.roomType"
  | "projects.updatedAt"
  | "sc.analyzeFrame"
  | "sc.colorPalette"
  | "sc.currentDesign"
  | "sc.currentMaterials"
  | "sc.designFeatures"
  | "sc.designImage"
  | "sc.designLimits"
  | "sc.noProducts"
  | "sc.searchingBinyan"
  | "sc.structuralSuggestions"
  | "sc.zoom"
  | "sc.alyaziaFeatures"
  | "store.addToProject"
  | "store.price"
  | "store.vendor"
  | "studio.budget"
  | "studio.chooseRoom"
  | "studio.chooseStyle"
  | "studio.descPlaceholder"
  | "studio.room"
  | "ui.capturePhoto"
  | "ui.chooseImage"
  | "ui.copied"
  | "ui.copy"
  | "ui.delete"
  | "ui.description"
  | "ui.details"
  | "ui.download"
  | "ui.edit"
  | "ui.errorOccurred"
  | "ui.less"
  | "ui.loading2"
  | "ui.more"
  | "ui.ok"
  | "ui.prev"
  | "ui.preview"
  | "ui.reset"
  | "ui.share"
  | "ui.start"
  | "ui.success"
  | "ui.uploadImage"
  | "ui.viewAll"
  | "ui.wait"
  | "voice.design.title"
  | "voice.listening2"
  | "voice.pressToSpeak"
  | "home.planDesign.title"
  | "home.planDesign.desc"
  | "studio.login_required"
  | "studio.back_home"
  | "studio.step_project"
  | "studio.step_identity"
  | "studio.step_floors"
  | "studio.step_walls"
  | "studio.step_ceilings"
  | "studio.step_doors"
  | "studio.step_lighting"
  | "studio.step_furniture"
  | "studio.step_perspective"
  | "studio.style_modern"
  | "studio.style_gulf"
  | "studio.style_classic"
  | "studio.style_minimal"
  | "studio.style_japanese"
  | "studio.style_scandinavian"
  | "studio.style_mediterranean"
  | "studio.style_industrial"
  | "studio.style_moroccan"
  | "studio.style_luxury"
  | "studio.budget_economic"
  | "studio.budget_medium"
  | "studio.budget_luxury"
  | "studio.budget_premium"
  | "studio.select_project"
  | "studio.new_project"
  | "studio.select_room"
  | "studio.design_element"
  | "studio.generate_perspective"
  | "studio.select_project_first"
  | "studio.design_success"
  | "studio.design_error"
  | "studio.perspective_success"
  | "studio.perspective_error"
  | "studio.room_living"
  | "studio.room_master"
  | "studio.room_bedroom"
  | "studio.room_kitchen"
  | "studio.room_bathroom"
  | "studio.room_office"
  | "studio.room_dining"
  | "studio.room_kids"
  | "studio.room_majlis"
  | "studio.room_entrance"
  | "studio.visual_identity"
  | "studio.select_style"
  | "studio.select_budget"
  | "studio.next"
  | "studio.prev"
  | "studio.designing"
  | "studio.progress"
  | "studio.completed"
  | "studio.projects_link"
  | "studio.chat_link"
  | "voice.start"
  | "voice.generating"
  | "voice.result"
  | "voice.try_again"
  | "voice.save"
  | "voice.saved"
  | "voice.error_mic"
  | "voice.error_process"
  | "voice.placeholder"
  | "voice.login_required"
  | "sc.title"
  | "sc.upload_photo"
  | "sc.take_photo"
  | "sc.analyzing"
  | "sc.analysis_result"
  | "sc.design_suggestion"
  | "sc.save_result"
  | "sc.new_analysis"
  | "sc.no_image"
  | "sc.error"
  | "sc.scan_title"
  | "sc.scan_subtitle"
  | "sc.scan_start"
  | "sc.scan_stop"
  | "projects.empty_desc"
  | "projects.type"
  | "projects.delete_confirm"
  | "projects.created"
  | "projects.open"
  | "projects.designs"
  | "projects.last_updated"
  | "projects.login_required"
  | "projects.loading"
  | "projects.error"
  | "furniture.title"
  | "furniture.subtitle"
  | "furniture.search"
  | "furniture.filter"
  | "furniture.category"
  | "furniture.price"
  | "furniture.add_to_project"
  | "furniture.view_details"
  | "furniture.no_results"
  | "furniture.loading"
  | "furniture.beta_notice"
  | "furniture.sofa"
  | "furniture.bed"
  | "furniture.table"
  | "furniture.chair"
  | "furniture.wardrobe"
  | "mood.subtitle"
  | "mood.add_image"
  | "mood.add_color"
  | "mood.save"
  | "mood.clear"
  | "mood.generate"
  | "mood.empty"
  | "mood.saved"
  | "common.edit"
  | "common.delete"
  | "common.share"
  | "common.download"
  | "common.prev"
  | "common.login"
  | "common.logout"
  | "common.profile"
  | "common.settings"
  | "common.guest"
  | "common.free"
  | "common.premium"
  | "common.required"
  | "common.optional"
  | "common.success"
  | "common.failed"
  | "common.sar"
  | "common.credits"
  | "common.buy_credits"
  | "common.insufficient_credits"
  | "common.view_all"
  | "common.see_more"
  | "studio.consult"
  | "studio.elements_done"
  | "studio.choose_project"
  | "studio.choose_project_desc"
  | "studio.no_projects"
  | "studio.create_project"
  | "studio.room_area"
  | "studio.area_m2"
  | "studio.next_identity"
  | "studio.visual_identity_desc"
  | "studio.design_style"
  | "studio.total_budget"
  | "studio.identity_details"
  | "studio.customized"
  | "studio.reset_default"
  | "studio.start_design"
  | "studio.design_details"
  | "studio.element_designed_success"
  | "studio.overall_progress"
  | "studio.room_hall"
  | "studio.redesign"
  | "studio.redesigning"
  | "studio.design_me"
  | "studio.perspective_generated"
  | "studio.generate_new_perspective"
  | "studio.generating_perspective"
  | "studio.generate_full_perspective"
  | "studio.perspective_generating"
  | "studio.min_elements_warning"
  | "studio.prev_step"
  | "studio.next_step"
  | "studio.designed_badge"
  | "studio.sarah_tips"
  | "studio.applied_identity"
  | "studio.primary_color"
  | "studio.secondary_color"
  | "studio.accent_color"
  | "studio.identity_warning"
  | "studio.design_concept"
  | "studio.harmony_note"
  | "studio.cost_range"
  | "studio.products"
  | "studio.color_palette"
  | "studio.installation_steps"
  | "studio.professional_notes"
  | "common.back_home"
  ;

type Translations = Record<TranslationKey, string>
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
    // ===== Missing keys =====
    "quick.capture.angle": "زاوية",
    "quick.capture.cameraError": "لا يمكن الوصول للكاميرا. تأكد من منح الإذن.",
    "quick.capture.noVideo": "لم يتم تسجيل فيديو بعد",
    "quick.capture.uploadVideo": "رفع فيديو",
    "smart.capture.zoom": "تكبير",
    "ui.add": "إضافة",
    "ui.colorName": "اسم اللون",
    "ui.editColor": "تعديل اللون",

    // ===== New translations added =====
    "analyze.analyze": "تحليل",
    "analyze.results": "نتائج التحليل",
    "analyze.title": "تحليل الفضاء",
    "analyze.upload": "رفع صورة",
    "ar.subtitle": "امسح فضاءك بالواقع المعزز",
    "ar.title": "المسح بالواقع المعزز",
    "auth.gate.btn": "تسجيل الدخول",
    "auth.gate.subtitle": "هذه الميزة تتطلب تسجيل الدخول",
    "auth.gate.title": "سجّل دخولك للمتابعة",
    "costs.subtitle": "احسب تكلفة مشروعك التصميمي",
    "costs.title": "حساب التكاليف",
    "credit.badge.balance": "الرصيد",
    "credit.badge.buy": "شراء",
    "credits.buyMore": "شراء كريدت",
    "credits.costLabel": "التكلفة",
    "credits.deductedMsg": "تم خصم",
    "credits.insufficientMsg": "رصيدك الحالي لا يكفي لهذه العملية",
    "credits.perOperation": "كريدت لكل عملية",
    "credits.title": "الكريدت",
    "credits.yourBalance": "رصيدك الحالي",
    "error.apology": "م. اليازية تعتذر عن هذا الخلل المؤقت. يرجى إعادة تحميل الصفحة للمتابعة.",
    "error.details": "تفاصيل الخطأ (للمطورين فقط)",
    "error.reload": "إعادة تحميل الصفحة",
    "error.unexpected": "عذراً، حدث خطأ غير متوقع",
    "home.hero.badge": "مدعوم بالذكاء الاصطناعي",
    "home.hero.facades": "واجهات",
    "home.hero.interior": "داخلي",
    "home.hero.landscape": "لاندسكيب",
    "home.hero.pools": "مسابح",
    "home.noProjects": "لا توجد مشاريع بعد",
    "home.sections.title": "اختر خدمتك",
    "home.startAnalysis": "ابدأ تحليلك الأول",
    "ideas.page.area": "المساحة",
    "ideas.page.budget": "الميزانية",
    "ideas.page.generate": "توليد أفكار",
    "ideas.page.generating": "جاري التوليد...",
    "ideas.page.noResults": "لا توجد أفكار بعد",
    "ideas.page.roomType": "نوع الغرفة",
    "ideas.page.style": "النمط",
    "ideas.page.subtitle": "أفكار تصميم مخصصة لفضاءك",
    "ideas.page.title": "أفكار التصميم",
    "login.btn": "تسجيل الدخول",
    "login.features.analyze": "تحليل الفضاءات بالذكاء الاصطناعي",
    "login.features.design": "توليد تصاميم احترافية",
    "login.features.save": "حفظ مشاريعك ومشاركتها",
    "login.subtitle": "سجّل دخولك للبدء في التصميم",
    "login.title": "مرحباً بك",
    "moodboard.addImage": "إضافة صورة",
    "moodboard.export": "تصدير",
    "moodboard.generate": "توليد لوحة",
    "moodboard.save": "حفظ اللوحة",
    "moodboard.subtitle": "اجمع أفكارك التصميمية في لوحة واحدة",
    "moodboard.title": "لوحة الإلهام",
    "nav.designIdeas": "أفكار التصميم",
    "nav.furnitureStore": "متجر الأثاث",
    "nav.home": "الرئيسية",
    "nav.logout": "تسجيل الخروج",
    "nav.myProjects": "مشاريعي",
    "nav.quickAnalyze": "تحليل سريع",
    "nav.smartCapture": "التحليل الذكي",
    "nav.voiceDesigner": "الرسم بالصوت",
    "plan.subtitle": "ارسم مسقط فضاءك بالذكاء الاصطناعي",
    "plan.title": "تصميم المسقط",
    "project.detail.cost": "التكلفة",
    "project.detail.delete": "حذف المشروع",
    "project.detail.export": "تصدير PDF",
    "project.detail.materials": "المواد",
    "project.detail.overview": "نظرة عامة",
    "project.detail.palette": "لوحة الألوان",
    "project.detail.share": "مشاركة",
    "project.detail.title": "تفاصيل المشروع",
    "projects.analyzeNow": "تحليل الآن",
    "projects.deleteConfirm": "هل تريد حذف هذا المشروع؟",
    "projects.deleted": "تم حذف المشروع",
    "projects.myProjects": "مشاريعي",
    "projects.noProjects": "لا توجد مشاريع بعد",
    "projects.startFirst": "ابدأ بتحليل أول فضاء",
    "projects.type.quick": "تحليل سريع",
    "projects.type.smart": "تحليل ذكي",
    "projects.type.voice": "رسم بالصوت",
    "quick.analyze.btn": "تحليل الآن",
    "quick.analyzing": "جاري التحليل...",
    "quick.analyzing.subtitle": "م. اليازية تحلل الفضاء وتقترح التصميم المثالي",
    "quick.budget.custom": "مخصص",
    "quick.budget.economy": "اقتصادي",
    "quick.budget.from": "من",
    "quick.budget.medium": "متوسط",
    "quick.budget.premium": "بريميوم",
    "quick.budget.title": "الميزانية",
    "quick.budget.to": "إلى",
    "quick.capture.fromGallery": "من المعرض",
    "quick.capture.multi.title": "التقط صور الفضاء",
    "quick.capture.nextStyle": "التالي — اختر النمط",
    "quick.capture.noImage": "لم تُضف صورة بعد",
    "quick.capture.note.label": "أضف ملاحظة أو وصف للتصميم المطلوب",
    "quick.capture.note.optional": "(اختياري)",
    "quick.capture.note.placeholder": "مثال: أريد تغيير الأثاث بأريكة L-shape، فتح نافذة في الجدار الشمالي...",
    "quick.capture.openCamera": "فتح الكاميرا",
    "quick.capture.title": "التقط صورة الغرفة",
    "quick.mode.multi": "صور متعددة",
    "quick.mode.multi.desc": "صوّر كل زوايا الغرفة (حتى 6 صور)",
    "quick.mode.panorama": "بانوراما",
    "quick.mode.panorama.desc": "صورة بانوراما للغرفة كاملة",
    "quick.mode.single": "صورة واحدة",
    "quick.mode.single.desc": "صوّر الغرفة من زاوية واحدة",
    "quick.mode.subtitle": "اختر طريقة التقاط الفضاء",
    "quick.mode.title": "كيف تريد التصوير؟",
    "quick.mode.video": "فيديو",
    "quick.mode.video.desc": "صوّر فيديو للغرفة (حتى 30 ثانية)",
    "quick.result.chat": "تحدث مع م. اليازية",
    "quick.result.copied": "تم النسخ",
    "quick.result.copy": "نسخ التحليل",
    "quick.result.cost": "التكلفة التقديرية",
    "quick.result.export": "تصدير PDF",
    "quick.result.generate": "توليد صورة تصورية",
    "quick.result.generating": "جاري التوليد...",
    "quick.result.newAnalysis": "تحليل جديد",
    "quick.result.overview": "التحليل والتوصيات",
    "quick.result.palette": "لوحة الألوان",
    "quick.result.reanalyze": "إعادة التحليل مع التعديلات",
    "quick.result.suggestions": "اقتراحات التصميم",
    "quick.style.classic": "كلاسيكي",
    "quick.style.gulf": "خليجي",
    "quick.style.japanese": "ياباني",
    "quick.style.luxury": "فاخر",
    "quick.style.minimal": "مينيمال",
    "quick.style.modern": "عصري",
    "quick.style.moroccan": "مغربي",
    "quick.style.scandinavian": "سكندنافي",
    "quick.style.subtitle": "اختر نمط التصميم",
    "quick.style.title": "اختر نمط التصميم",
    "quick.tip.label": "نصيحة م. اليازية",
    "quick.title": "تحليل سريع",
    "sarah.chat.applyDesign": "تطبيق هذا التصميم",
    "sarah.chat.attachImage": "إرفاق صورة",
    "sarah.chat.creditPerMsg": "20 كريدت لكل رسالة",
    "sarah.chat.generateImage": "توليد صورة",
    "sarah.chat.modifiedDesign": "تصميم معدّل",
    "sarah.chat.placeholder": "اسألي م. اليازية عن التصميم...",
    "sarah.chat.send": "إرسال",
    "sarah.chat.subtitle": "خبيرة التصميم المعماري والبيئي",
    "sarah.chat.tapToGenerate": "اضغط لتوليد صورة مع الرد",
    "sarah.chat.thinking": "م. اليازية تفكر...",
    "sarah.chat.title": "م. اليازية",
    "sarah.chat.willGenerate": "سيتم توليد صورة بالتعديلات",
    "scanner.back": "خلفك",
    "scanner.backDesc": "استدر للخلف 180°",
    "scanner.backWall": "الجدار الخلفي",
    "scanner.cameraError": "لا يمكن الوصول للكاميرا. تأكد من منح الإذن.",
    "scanner.ceiling": "السقف",
    "scanner.ceilingDesc": "وجّه الكاميرا للأعلى",
    "scanner.corner": "زاوية الغرفة",
    "scanner.corner.dir": "زاوية",
    "scanner.cornerDesc": "صوّر زاوية تجمع جدارين",
    "scanner.down": "للأسفل",
    "scanner.floor": "الأرضية",
    "scanner.floorDesc": "وجّه الكاميرا للأسفل",
    "scanner.forward": "أمامك",
    "scanner.frontDesc": "وجّه الكاميرا للأمام",
    "scanner.frontWall": "الجدار الأمامي",
    "scanner.left": "يسارك",
    "scanner.leftDesc": "استدر يساراً 90°",
    "scanner.leftWall": "الجدار الأيسر",
    "scanner.right": "يمينك",
    "scanner.rightDesc": "استدر يميناً 90°",
    "scanner.rightWall": "الجدار الأيمن",
    "scanner.up": "للأعلى",
    "smart.capture.advantages": "مزايا التصميم",
    "smart.capture.analyzeBtn": "تحليل الصورة",
    "smart.capture.analyzing": "جاري التحليل...",
    "smart.capture.boq": "جدول الكميات (BOQ)",
    "smart.capture.buyFromBonyan": "اشتري هذا الديكور من بنيان",
    "smart.capture.changeStyle": "تغيير النمط",
    "smart.capture.cost": "التكلفة التقديرية",
    "smart.capture.download": "تحميل الصورة",
    "smart.capture.duration": "مدة التنفيذ",
    "smart.capture.error": "حدث خطأ، حاول مجدداً",
    "smart.capture.exportPdf": "تصدير دفتر التصميم (PDF)",
    "smart.capture.furniture": "الأثاث المقترح",
    "smart.capture.generateIdeas": "توليد أفكار تصميم",
    "smart.capture.materials": "المواد والتشطيبات",
    "smart.capture.noResults": "لا توجد نتائج بعد",
    "smart.capture.overview": "التقييم العام",
    "smart.capture.palette": "لوحة الألوان",
    "smart.capture.refine": "تحسين التصميم",
    "smart.capture.regenerate": "إعادة توليد",
    "smart.capture.results": "نتائج التحليل",
    "smart.capture.roomType": "نوع الغرفة",
    "smart.capture.share": "مشاركة",
    "smart.capture.style": "النمط المقترح",
    "smart.capture.styleType": "النمط المطلوب",
    "smart.capture.title": "التحليل الذكي",
    "smart.capture.upload": "اضغط لرفع صورة أو التقاطها",
    "store.addToCart": "أضف للسلة",
    "store.comingSoon": "قريباً",
    "store.filter.all": "الكل",
    "store.filter.bed": "غرف نوم",
    "store.filter.dining": "طاولات طعام",
    "store.filter.office": "مكاتب",
    "store.filter.outdoor": "خارجي",
    "store.filter.sofa": "أرائك",
    "store.noResults": "لا توجد منتجات",
    "store.search": "ابحث عن أثاث...",
    "store.subtitle": "أثاث حقيقي من متاجر محلية",
    "store.title": "متجر الأثاث",
    "store.viewProduct": "عرض المنتج",
    "studio.description": "وصف التصميم",
    "studio.generate": "توليد التصميم",
    "studio.generating": "جاري التوليد...",
    "studio.result": "نتيجة التصميم",
    "studio.roomType": "نوع الغرفة",
    "studio.style": "النمط",
    "studio.subtitle": "صمّم فضاءك بالذكاء الاصطناعي",
    "studio.title": "استوديو التصميم",
    "ui.all": "الكل",
    "ui.back": "رجوع",
    "ui.beta": "تجريبي",
    "ui.cancel": "إلغاء",
    "ui.close": "إغلاق",
    "ui.comingSoon": "قريباً",
    "ui.confirm": "تأكيد",
    "ui.currency.aed": "د.إ",
    "ui.currency.sar": "ر.س",
    "ui.currency.usd": "دولار",
    "ui.done": "تم",
    "ui.error": "حدث خطأ",
    "ui.estimated": "تقديري",
    "ui.filter": "تصفية",
    "ui.loading": "جاري التحميل...",
    "ui.months": "أشهر",
    "ui.new": "جديد",
    "ui.next": "التالي",
    "ui.no": "لا",
    "ui.retry": "إعادة المحاولة",
    "ui.save": "حفظ",
    "ui.search": "بحث",
    "ui.sort": "ترتيب",
    "ui.weeks": "أسابيع",
    "ui.yes": "نعم",
    "urban.subtitle": "تصميم الفضاءات الحضرية والعامة",
    "urban.title": "التصميم الحضري",
    "voice.page.ac": "تكييف",
    "voice.page.addRoom": "إضافة غرفة",
    "voice.page.clear": "مسح الكل",
    "voice.page.dimensions": "الأبعاد",
    "voice.page.door": "باب",
    "voice.page.doors": "الأبواب",
    "voice.page.electricity": "كهرباء",
    "voice.page.export": "تصدير",
    "voice.page.exportPlan": "تصدير المسقط",
    "voice.page.furniture": "الأثاث",
    "voice.page.generate3D": "إنشاء رندر 3D",
    "voice.page.generating3D": "جاري إنشاء الرندر...",
    "voice.page.listening": "جاري الاستماع...",
    "voice.page.processing": "جاري المعالجة...",
    "voice.page.renderResult": "نتيجة الرندر",
    "voice.page.room": "غرفة",
    "voice.page.rooms": "الغرف",
    "voice.page.selected": "محدد",
    "voice.page.stairs": "الدرج",
    "voice.page.startDrawing": "ابدأ الرسم",
    "voice.page.subtitle": "صف فضاءك واليازية ترسم المسقط",
    "voice.page.title": "الرسم بالصوت",
    "voice.page.undo": "تراجع",
    "voice.page.voiceInput": "إدخال صوتي",
    "voice.page.wall": "جدار",
    "voice.page.walls": "الجدران",
    "voice.page.window": "نافذة",
    "voice.page.windows": "النوافذ",
    "sc.analyzeFrame": "تحليل الإطار",
    "sc.designImage": "صورة التصميم",
    "sc.colorPalette": "لوحة الألوان",
    "sc.materials": "المواد والتشطيبات المقترحة",
    "sc.currentMaterials": "المواد الحالية",
    "sc.structuralSuggestions": "مقترحات تحسين بنيوية",
    "sc.noProducts": "لم يتم العثور على منتجات مطابقة حالياً",
    "sc.designFeatures": "مزايا ومميزات التصميم",
    "sc.alyaziaFeatures": "م. اليازية | مزايا التصميم",
    "sc.searchingBinyan": "م. اليازية تبحث في متاجر بنيان...",
    "sc.designLimits": "حدود التصميم:",
    "sc.perspective": "المنظور:",
    "sc.untouched": "لا يُمَس:",
    "sc.benefit": "الفائدة:",
    "sc.level": "المستوى:",
    "sc.treatment": "المعالجة:",
    "sc.reason": "السبب:",
    "sc.specialist": "المختص:",
    "sc.direction": "الاتجاه:",
    "sc.zoom": "الزوم:",
    "sc.currentDesign": "التصميم الحالي",
    "projects.new": "مشروع جديد",
    "projects.start": "ابدأ مشروعك الأول",
    "ui.delete": "حذف",
    "ui.edit": "تعديل",
    "ui.download": "تحميل",
    "ui.share": "مشاركة",
    "ui.copy": "نسخ",
    "ui.copied": "تم النسخ",
    "ui.success": "نجاح",
    "ui.loading2": "جاري التحميل",
    "studio.chooseStyle": "اختر النمط",
    "studio.room": "الغرفة",
    "studio.chooseRoom": "اختر الغرفة",
    "studio.budget": "الميزانية",
    "studio.descPlaceholder": "أضف وصفاً للتصميم المطلوب",
    "voice.design.title": "التصميم بالصوت",
    "voice.pressToSpeak": "اضغط للتحدث",
    "voice.listening2": "جاري الاستماع",
    "ar.scanSpace": "مسح الفضاء",
    "ar.startScan": "ابدأ المسح",
    "ar.stopScan": "إيقاف المسح",
    "ar.scanning": "جاري المسح",
    "ideas.category": "الفئة",
    "store.addToProject": "إضافة إلى المشروع",
    "store.price": "السعر",
    "store.vendor": "المتجر",
    "mood.title": "لوحة الإلهام",
    "mood.addImage": "إضافة صورة",
    "mood.create": "إنشاء لوحة",
    "costs.area": "المساحة",
    "costs.level": "المستوى",
    "costs.calculate": "احسب التكلفة",
    "costs.total": "التكلفة الإجمالية",
    "ui.wait": "الرجاء الانتظار",
    "ui.errorOccurred": "حدث خطأ",
    "ui.prev": "السابق",
    "ui.viewAll": "عرض الكل",
    "ui.more": "مزيد",
    "ui.less": "أقل",
    "ui.ok": "موافق",
    "ui.start": "ابدأ",
    "ui.reset": "إعادة",
    "ui.uploadImage": "رفع صورة",
    "ui.capturePhoto": "التقاط صورة",
    "ui.chooseImage": "اختر صورة",
    "ui.preview": "معاينة",
    "ui.details": "تفاصيل",
    "ui.description": "وصف",
    "projects.name": "اسم المشروع",
    "projects.roomType": "نوع الغرفة",
    "projects.createdAt": "تاريخ الإنشاء",
    "projects.updatedAt": "آخر تحديث",
    "projects.confirmDelete": "تأكيد الحذف",
    "home.planDesign.title": "صمّم من المخطط",
    "home.planDesign.desc": "ارفع مخططك واحصل على تصميم كامل",
    "chat.analysisError": "خطأ في تحليل الصورة",
    "chat.expert.title": "م. اليازية - خبيرة التصميم",
    "chat.imageError": "خطأ في رفع الصورة",
    "chat.imageUploaded": "تم رفع الصورة بنجاح",
    "chat.linkProject": "ربط بمشروع",
    "chat.loginRequired": "يجب تسجيل الدخول أولاً",
    "chat.noProject": "لا يوجد مشروع محدد",
    "chat.quickQuestion": "سؤال سريع",
    "chat.sendError": "خطأ في الإرسال",
    "chat.session.element": "عنصر محدد",
    "chat.session.element.desc": "ناقش عنصراً معيناً في التصميم",
    "chat.session.floorPlan": "مسقط الطابق",
    "chat.session.floorPlan.desc": "تحليل وتعديل المسقط المعماري",
    "chat.session.general": "محادثة عامة",
    "chat.session.general.desc": "استشارة تصميم عامة مع م. اليازية",
    "chat.session.scan360": "مسح 360°",
    "chat.session.scan360.desc": "تحليل مسح الغرفة الكامل",
    "chat.welcome.subtitle": "اسألني عن أي شيء في التصميم الداخلي",
    "chat.welcome.title": "مرحباً! أنا م. اليازية",
    "credit.balance": "الرصيد",
    "credit.buy": "شراء كريدت",
    "credit.empty": "رصيدك فارغ",
    "credit.hello": "مرحباً",
    "credit.link": "ربط الحساب",
    "credit.linkDesc": "اربط حسابك للحصول على كريدت مجاني",
    "credit.linkTitle": "احصل على كريدت مجاني",
    "credit.login": "تسجيل الدخول",
    "credit.loginDesc": "سجّل دخولك للحصول على كريدت مجاني",
    "credit.loginTitle": "سجّل دخولك",
    "credit.low": "رصيد منخفض",
    "credit.refresh": "تحديث الرصيد",
    "credit.yourBalance": "رصيدك",
    "voice.commands.title": "الأوامر الصوتية",
    "voice.help": "مساعدة",
    "voice.hint1": "قل «افتح التحليل» للذهاب للتحليل",
    "voice.hint2": "قل «افتح الاستوديو» للذهاب للاستوديو",
    "voice.hint3": "قل «افتح المشاريع» للذهاب للمشاريع",
    "voice.hint4": "قل «افتح المحادثة» للذهاب للمحادثة",
    "voice.hint5": "قل «افتح التكاليف» للذهاب للتكاليف",
    "voice.openAR": "افتح المسح الثلاثي",
    "voice.openAnalyze": "افتح التحليل",
    "voice.openChat": "افتح المحادثة",
    "voice.openCosts": "افتح التكاليف",
    "voice.openMoodboard": "افتح لوحة الإلهام",
    "voice.openProjects": "افتح المشاريع",
    "voice.openStudio": "افتح الاستوديو",
    "voice.startListening": "ابدأ الاستماع",
    "voice.stop": "إيقاف",
    "voice.stopListening": "إيقاف الاستماع",
    "studio.login_required": "يرجى تسجيل الدخول للوصول إلى استوديو التصميم",
    "studio.back_home": "العودة للرئيسية",
    "studio.step_project": "المشروع",
    "studio.step_identity": "الهوية البصرية",
    "studio.step_floors": "الأرضيات",
    "studio.step_walls": "الجدران",
    "studio.step_ceilings": "الأسقف",
    "studio.step_doors": "الأبواب والنوافذ",
    "studio.step_lighting": "الإضاءة",
    "studio.step_furniture": "الأثاث",
    "studio.step_perspective": "المنظور الكامل",
    "studio.style_modern": "عصري حديث",
    "studio.style_gulf": "خليجي أصيل",
    "studio.style_classic": "كلاسيكي فاخر",
    "studio.style_minimal": "مينيمال",
    "studio.style_japanese": "ياباني زن",
    "studio.style_scandinavian": "سكندنافي",
    "studio.style_mediterranean": "متوسطي",
    "studio.style_industrial": "صناعي",
    "studio.style_moroccan": "مغربي",
    "studio.style_luxury": "فاخر بريميوم",
    "studio.budget_economic": "اقتصادي",
    "studio.budget_medium": "متوسط",
    "studio.budget_luxury": "فاخر",
    "studio.budget_premium": "بريميوم",
    "studio.select_project": "اختر مشروعاً",
    "studio.new_project": "مشروع جديد",
    "studio.select_room": "اختر الغرفة",
    "studio.design_element": "صمّم هذا العنصر",
    "studio.generate_perspective": "توليد المنظور الكامل",
    "studio.select_project_first": "يرجى اختيار المشروع أولاً",
    "studio.design_success": "تم التصميم بتناسق كامل!",
    "studio.design_error": "حدث خطأ أثناء التصميم",
    "studio.perspective_success": "تم توليد المنظور الكامل!",
    "studio.perspective_error": "حدث خطأ أثناء توليد المنظور",
    "studio.room_living": "غرفة المعيشة",
    "studio.room_master": "غرفة النوم الرئيسية",
    "studio.room_bedroom": "غرفة النوم",
    "studio.room_kitchen": "المطبخ",
    "studio.room_bathroom": "الحمام",
    "studio.room_office": "المكتب",
    "studio.room_dining": "غرفة الطعام",
    "studio.room_kids": "غرفة الأطفال",
    "studio.room_majlis": "المجلس",
    "studio.room_entrance": "المدخل",
    "studio.visual_identity": "الهوية البصرية",
    "studio.select_style": "اختر النمط",
    "studio.select_budget": "اختر الميزانية",
    "studio.next": "التالي",
    "studio.prev": "السابق",
    "studio.designing": "جاري التصميم...",
    "studio.progress": "التقدم",
    "studio.completed": "مكتمل",
    "studio.projects_link": "مشاريعي",
    "studio.chat_link": "استشر م. الياز",
    "voice.start": "ابدأ التسجيل",
    "voice.generating": "جاري التصميم...",
    "voice.result": "نتيجة التصميم",
    "voice.try_again": "جرب مجدداً",
    "voice.save": "حفظ التصميم",
    "voice.saved": "تم الحفظ بنجاح",
    "voice.error_mic": "تعذر الوصول إلى الميكروفون",
    "voice.error_process": "حدث خطأ أثناء المعالجة",
    "voice.placeholder": "اضغط على الميكروفون وصف مساحتك...",
    "voice.login_required": "يرجى تسجيل الدخول للاستخدام",
    "sc.title": "التحليل الذكي",
    "sc.upload_photo": "ارفع صورة",
    "sc.take_photo": "التقط صورة",
    "sc.analyzing": "جاري التحليل...",
    "sc.analysis_result": "نتيجة التحليل",
    "sc.design_suggestion": "اقتراح التصميم",
    "sc.save_result": "حفظ النتيجة",
    "sc.new_analysis": "تحليل جديد",
    "sc.no_image": "يرجى رفع صورة أولاً",
    "sc.error": "حدث خطأ أثناء التحليل",
    "sc.scan_title": "مسح AR",
    "sc.scan_subtitle": "امسح المساحة بكاميرتك",
    "sc.scan_start": "ابدأ المسح",
    "sc.scan_stop": "أوقف المسح",
    "projects.empty_desc": "ابدأ بإنشاء مشروعك الأول",
    "projects.type": "نوع المشروع",
    "projects.delete_confirm": "هل أنت متأكد من حذف هذا المشروع؟",
    "projects.created": "تم إنشاء المشروع",
    "projects.open": "فتح المشروع",
    "projects.designs": "التصاميم",
    "projects.last_updated": "آخر تحديث",
    "projects.login_required": "يرجى تسجيل الدخول لعرض مشاريعك",
    "projects.loading": "جاري تحميل المشاريع...",
    "projects.error": "حدث خطأ في تحميل المشاريع",
    "furniture.title": "متجر الأثاث",
    "furniture.subtitle": "أثاث حقيقي من متاجر محلية",
    "furniture.search": "ابحث عن أثاث...",
    "furniture.filter": "تصفية",
    "furniture.category": "الفئة",
    "furniture.price": "السعر",
    "furniture.add_to_project": "أضف للمشروع",
    "furniture.view_details": "عرض التفاصيل",
    "furniture.no_results": "لا توجد نتائج",
    "furniture.loading": "جاري التحميل...",
    "furniture.beta_notice": "هذه الميزة تجريبية",
    "furniture.sofa": "أريكة",
    "furniture.bed": "سرير",
    "furniture.table": "طاولة",
    "furniture.chair": "كرسي",
    "furniture.wardrobe": "خزانة",
    "mood.subtitle": "اجمع إلهامك في لوحة واحدة",
    "mood.add_image": "أضف صورة",
    "mood.add_color": "أضف لون",
    "mood.save": "حفظ اللوحة",
    "mood.clear": "مسح اللوحة",
    "mood.generate": "توليد تصميم من اللوحة",
    "mood.empty": "اللوحة فارغة",
    "mood.saved": "تم حفظ اللوحة",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.share": "مشاركة",
    "common.download": "تحميل",
    "common.prev": "السابق",
    "common.login": "تسجيل الدخول",
    "common.logout": "تسجيل الخروج",
    "common.profile": "الملف الشخصي",
    "common.settings": "الإعدادات",
    "common.guest": "زائر",
    "common.free": "مجاني",
    "common.premium": "بريميوم",
    "common.required": "مطلوب",
    "common.optional": "اختياري",
    "common.success": "تمت العملية بنجاح",
    "common.failed": "فشلت العملية",
    "common.sar": "ريال",
    "common.credits": "كريدت",
    "common.buy_credits": "شراء كريدت",
    "common.insufficient_credits": "رصيد غير كافٍ",
    "common.view_all": "عرض الكل",
    "common.see_more": "عرض المزيد",
    "common.back_home": "العودة للرئيسية",
    "studio.consult": "استشر م. اليازية",
    "studio.elements_done": "عنصر مكتمل",
    "studio.choose_project": "اختر مشروعك",
    "studio.choose_project_desc": "حدد المشروع والغرفة التي تريد تصميمها",
    "studio.no_projects": "لا توجد مشاريع بعد",
    "studio.create_project": "إنشاء مشروع جديد",
    "studio.room_area": "الغرفة والمساحة",
    "studio.area_m2": "المساحة (م²)",
    "studio.next_identity": "التالي: تحديد الهوية البصرية",
    "studio.visual_identity_desc": "هذه الهوية ستُطبَّق على جميع عناصر التصميم لضمان التناسق الكامل",
    "studio.design_style": "نمط التصميم",
    "studio.total_budget": "الميزانية الإجمالية",
    "studio.identity_details": "تفاصيل الهوية البصرية",
    "studio.customized": "مخصصة",
    "studio.reset_default": "إعادة تعيين للافتراضي",
    "studio.start_design": "ابدأ التصميم",
    "studio.design_details": "تفاصيل التصميم",
    "studio.element_designed_success": "تم التصميم بنجاح",
    "studio.overall_progress": "تقدم التصميم الكلي",
    "studio.room_hall": "الصالة",
    "studio.redesign": "إعادة التصميم بهوية مختلفة",
    "studio.redesigning": "جارٍ إعادة التصميم...",
    "studio.design_me": "صمّمي يا م. اليازية",
    "studio.perspective_generated": "تم توليد المنظور",
    "studio.generate_new_perspective": "توليد منظور جديد",
    "studio.generating_perspective": "جارٍ التوليد...",
    "studio.generate_full_perspective": "ولّدي المنظور الكامل",
    "studio.perspective_generating": "م. اليازية تولّد المنظور...",
    "studio.min_elements_warning": "للحصول على أفضل نتيجة، صمّم على الأقل 3 عناصر أولاً",
    "studio.prev_step": "← السابق",
    "studio.next_step": "التالي →",
    "studio.designed_badge": "✓ مصمّم",
    "studio.sarah_tips": "نصائح م. اليازية",
    "studio.applied_identity": "الهوية البصرية المطبقة على هذا العنصر",
    "studio.primary_color": "الأساسي",
    "studio.secondary_color": "الثانوي",
    "studio.accent_color": "التمييز",
    "studio.identity_warning": "لماذا الهوية البصرية مهمة؟",
    "studio.design_concept": "مفهوم التصميم",
    "studio.harmony_note": "التناسق",
    "studio.cost_range": "نطاق التكلفة",
    "studio.products": "المنتجات",
    "studio.color_palette": "لوحة الألوان",
    "studio.installation_steps": "خطوات التركيب",
    "studio.professional_notes": "ملاحظات مهنية",
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
    // ===== Missing keys =====
    "quick.capture.angle": "Angle",
    "quick.capture.cameraError": "Cannot access camera. Please grant permission.",
    "quick.capture.noVideo": "No video recorded yet",
    "quick.capture.uploadVideo": "Upload Video",
    "smart.capture.zoom": "Zoom",
    "ui.add": "Add",
    "ui.colorName": "Color name",
    "ui.editColor": "Edit Color",

    // ===== New translations added =====
    "analyze.analyze": "Analyze",
    "analyze.results": "Analysis Results",
    "analyze.title": "Space Analysis",
    "analyze.upload": "Upload Photo",
    "ar.subtitle": "Scan your space with augmented reality",
    "ar.title": "AR Scan",
    "auth.gate.btn": "Sign In",
    "auth.gate.subtitle": "This feature requires sign in",
    "auth.gate.title": "Sign in to continue",
    "costs.subtitle": "Calculate your design project cost",
    "costs.title": "Cost Calculator",
    "credit.badge.balance": "Balance",
    "credit.badge.buy": "Buy",
    "credits.buyMore": "Buy Credits",
    "credits.costLabel": "Cost",
    "credits.deductedMsg": "Deducted",
    "credits.insufficientMsg": "Your current balance is not enough for this operation",
    "credits.perOperation": "credits per operation",
    "credits.title": "Credits",
    "credits.yourBalance": "Your Current Balance",
    "error.apology": "Eng. Alyazia apologizes for this temporary issue. Please reload the page to continue.",
    "error.details": "Error Details (Developers Only)",
    "error.reload": "Reload Page",
    "error.unexpected": "Sorry, an unexpected error occurred",
    "home.hero.badge": "Powered by AI",
    "home.hero.facades": "Facades",
    "home.hero.interior": "Interior",
    "home.hero.landscape": "Landscape",
    "home.hero.pools": "Pools",
    "home.noProjects": "No projects yet",
    "home.sections.title": "Choose Your Service",
    "home.startAnalysis": "Start your first analysis",
    "ideas.page.area": "Area",
    "ideas.page.budget": "Budget",
    "ideas.page.generate": "Generate Ideas",
    "ideas.page.generating": "Generating...",
    "ideas.page.noResults": "No ideas yet",
    "ideas.page.roomType": "Room Type",
    "ideas.page.style": "Style",
    "ideas.page.subtitle": "Personalized design ideas for your space",
    "ideas.page.title": "Design Ideas",
    "login.btn": "Sign In",
    "login.features.analyze": "AI-powered space analysis",
    "login.features.design": "Generate professional designs",
    "login.features.save": "Save and share your projects",
    "login.subtitle": "Sign in to start designing",
    "login.title": "Welcome",
    "moodboard.addImage": "Add Image",
    "moodboard.export": "Export",
    "moodboard.generate": "Generate Board",
    "moodboard.save": "Save Board",
    "moodboard.subtitle": "Collect your design ideas in one board",
    "moodboard.title": "Mood Board",
    "nav.designIdeas": "Design Ideas",
    "nav.furnitureStore": "Furniture Store",
    "nav.home": "Home",
    "nav.logout": "Sign Out",
    "nav.myProjects": "My Projects",
    "nav.quickAnalyze": "Quick Analysis",
    "nav.smartCapture": "Smart Analysis",
    "nav.voiceDesigner": "Voice Drawing",
    "plan.subtitle": "Draw your floor plan with AI",
    "plan.title": "Floor Plan Design",
    "project.detail.cost": "Cost",
    "project.detail.delete": "Delete Project",
    "project.detail.export": "Export PDF",
    "project.detail.materials": "Materials",
    "project.detail.overview": "Overview",
    "project.detail.palette": "Color Palette",
    "project.detail.share": "Share",
    "project.detail.title": "Project Details",
    "projects.analyzeNow": "Analyze Now",
    "projects.deleteConfirm": "Do you want to delete this project?",
    "projects.deleted": "Project deleted",
    "projects.myProjects": "My Projects",
    "projects.noProjects": "No projects yet",
    "projects.startFirst": "Start by analyzing your first space",
    "projects.type.quick": "Quick Analysis",
    "projects.type.smart": "Smart Analysis",
    "projects.type.voice": "Voice Drawing",
    "quick.analyze.btn": "Analyze Now",
    "quick.analyzing": "Analyzing...",
    "quick.analyzing.subtitle": "Eng. Alyazia is analyzing the space and suggesting the ideal design",
    "quick.budget.custom": "Custom",
    "quick.budget.economy": "Economy",
    "quick.budget.from": "From",
    "quick.budget.medium": "Medium",
    "quick.budget.premium": "Premium",
    "quick.budget.title": "Budget",
    "quick.budget.to": "To",
    "quick.capture.fromGallery": "From Gallery",
    "quick.capture.multi.title": "Capture Space Photos",
    "quick.capture.nextStyle": "Next — Choose Style",
    "quick.capture.noImage": "No image added yet",
    "quick.capture.note.label": "Add a note or description for the desired design",
    "quick.capture.note.optional": "(optional)",
    "quick.capture.note.placeholder": "Example: I want to change furniture to an L-shape sofa, open a window on the north wall...",
    "quick.capture.openCamera": "Open Camera",
    "quick.capture.title": "Capture Room Photo",
    "quick.mode.multi": "Multiple Photos",
    "quick.mode.multi.desc": "Capture all room angles (up to 6 photos)",
    "quick.mode.panorama": "Panorama",
    "quick.mode.panorama.desc": "Full room panorama photo",
    "quick.mode.single": "Single Photo",
    "quick.mode.single.desc": "Capture the room from one angle",
    "quick.mode.subtitle": "Choose how to capture the space",
    "quick.mode.title": "How do you want to capture?",
    "quick.mode.video": "Video",
    "quick.mode.video.desc": "Record a room video (up to 30 seconds)",
    "quick.result.chat": "Chat with Eng. Alyazia",
    "quick.result.copied": "Copied",
    "quick.result.copy": "Copy Analysis",
    "quick.result.cost": "Estimated Cost",
    "quick.result.export": "Export PDF",
    "quick.result.generate": "Generate Visualization",
    "quick.result.generating": "Generating...",
    "quick.result.newAnalysis": "New Analysis",
    "quick.result.overview": "Analysis & Recommendations",
    "quick.result.palette": "Color Palette",
    "quick.result.reanalyze": "Re-analyze with Changes",
    "quick.result.suggestions": "Design Suggestions",
    "quick.style.classic": "Classic",
    "quick.style.gulf": "Gulf",
    "quick.style.japanese": "Japanese",
    "quick.style.luxury": "Luxury",
    "quick.style.minimal": "Minimal",
    "quick.style.modern": "Modern",
    "quick.style.moroccan": "Moroccan",
    "quick.style.scandinavian": "Scandinavian",
    "quick.style.subtitle": "Choose Design Style",
    "quick.style.title": "Choose Design Style",
    "quick.tip.label": "Eng. Alyazia's Tip",
    "quick.title": "Quick Analysis",
    "sarah.chat.applyDesign": "Apply This Design",
    "sarah.chat.attachImage": "Attach Image",
    "sarah.chat.creditPerMsg": "20 credits per message",
    "sarah.chat.generateImage": "Generate Image",
    "sarah.chat.modifiedDesign": "Modified Design",
    "sarah.chat.placeholder": "Ask Eng. Alyazia about design...",
    "sarah.chat.send": "Send",
    "sarah.chat.subtitle": "Architectural & Environmental Design Expert",
    "sarah.chat.tapToGenerate": "Tap to generate an image with the response",
    "sarah.chat.thinking": "Eng. Alyazia is thinking...",
    "sarah.chat.title": "Eng. Alyazia",
    "sarah.chat.willGenerate": "An image will be generated with the changes",
    "scanner.back": "Back",
    "scanner.backDesc": "Turn back 180°",
    "scanner.backWall": "Back Wall",
    "scanner.cameraError": "Cannot access camera. Make sure permission is granted.",
    "scanner.ceiling": "Ceiling",
    "scanner.ceilingDesc": "Point camera upward",
    "scanner.corner": "Room Corner",
    "scanner.corner.dir": "Corner",
    "scanner.cornerDesc": "Capture a corner joining two walls",
    "scanner.down": "Down",
    "scanner.floor": "Floor",
    "scanner.floorDesc": "Point camera downward",
    "scanner.forward": "Forward",
    "scanner.frontDesc": "Point camera forward",
    "scanner.frontWall": "Front Wall",
    "scanner.left": "Left",
    "scanner.leftDesc": "Turn left 90°",
    "scanner.leftWall": "Left Wall",
    "scanner.right": "Right",
    "scanner.rightDesc": "Turn right 90°",
    "scanner.rightWall": "Right Wall",
    "scanner.up": "Up",
    "smart.capture.advantages": "Design Advantages",
    "smart.capture.analyzeBtn": "Analyze Photo",
    "smart.capture.analyzing": "Analyzing...",
    "smart.capture.boq": "Bill of Quantities (BOQ)",
    "smart.capture.buyFromBonyan": "Buy This Decor from Bonyan",
    "smart.capture.changeStyle": "Change Style",
    "smart.capture.cost": "Estimated Cost",
    "smart.capture.download": "Download Image",
    "smart.capture.duration": "Implementation Duration",
    "smart.capture.error": "An error occurred, please try again",
    "smart.capture.exportPdf": "Export Design Book (PDF)",
    "smart.capture.furniture": "Suggested Furniture",
    "smart.capture.generateIdeas": "Generate Design Ideas",
    "smart.capture.materials": "Materials & Finishes",
    "smart.capture.noResults": "No results yet",
    "smart.capture.overview": "General Assessment",
    "smart.capture.palette": "Color Palette",
    "smart.capture.refine": "Refine Design",
    "smart.capture.regenerate": "Regenerate",
    "smart.capture.results": "Analysis Results",
    "smart.capture.roomType": "Room Type",
    "smart.capture.share": "Share",
    "smart.capture.style": "Suggested Style",
    "smart.capture.styleType": "Desired Style",
    "smart.capture.title": "Smart Analysis",
    "smart.capture.upload": "Tap to upload or capture a photo",
    "store.addToCart": "Add to Cart",
    "store.comingSoon": "Coming Soon",
    "store.filter.all": "All",
    "store.filter.bed": "Bedrooms",
    "store.filter.dining": "Dining Tables",
    "store.filter.office": "Offices",
    "store.filter.outdoor": "Outdoor",
    "store.filter.sofa": "Sofas",
    "store.noResults": "No products found",
    "store.search": "Search for furniture...",
    "store.subtitle": "Real furniture from local stores",
    "store.title": "Furniture Store",
    "store.viewProduct": "View Product",
    "studio.description": "Design Description",
    "studio.generate": "Generate Design",
    "studio.generating": "Generating...",
    "studio.result": "Design Result",
    "studio.roomType": "Room Type",
    "studio.style": "Style",
    "studio.subtitle": "Design your space with AI",
    "studio.title": "Design Studio",
    "ui.all": "All",
    "ui.back": "Back",
    "ui.beta": "Beta",
    "ui.cancel": "Cancel",
    "ui.close": "Close",
    "ui.comingSoon": "Coming Soon",
    "ui.confirm": "Confirm",
    "ui.currency.aed": "AED",
    "ui.currency.sar": "SAR",
    "ui.currency.usd": "USD",
    "ui.done": "Done",
    "ui.error": "An error occurred",
    "ui.estimated": "Estimated",
    "ui.filter": "Filter",
    "ui.loading": "Loading...",
    "ui.months": "months",
    "ui.new": "New",
    "ui.next": "Next",
    "ui.no": "No",
    "ui.retry": "Retry",
    "ui.save": "Save",
    "ui.search": "Search",
    "ui.sort": "Sort",
    "ui.weeks": "weeks",
    "ui.yes": "Yes",
    "urban.subtitle": "Design urban and public spaces",
    "urban.title": "Urban Design",
    "voice.page.ac": "AC",
    "voice.page.addRoom": "Add Room",
    "voice.page.clear": "Clear All",
    "voice.page.dimensions": "Dimensions",
    "voice.page.door": "door",
    "voice.page.doors": "Doors",
    "voice.page.electricity": "electricity",
    "voice.page.export": "Export",
    "voice.page.exportPlan": "Export Floor Plan",
    "voice.page.furniture": "Furniture",
    "voice.page.generate3D": "Generate 3D Render",
    "voice.page.generating3D": "Generating render...",
    "voice.page.listening": "Listening...",
    "voice.page.processing": "Processing...",
    "voice.page.renderResult": "Render Result",
    "voice.page.room": "room",
    "voice.page.rooms": "Rooms",
    "voice.page.selected": "Selected",
    "voice.page.stairs": "Stairs",
    "voice.page.startDrawing": "Start Drawing",
    "voice.page.subtitle": "Describe your space and Alyazia draws the floor plan",
    "voice.page.title": "Voice Drawing",
    "voice.page.undo": "Undo",
    "voice.page.voiceInput": "Voice Input",
    "voice.page.wall": "wall",
    "voice.page.walls": "Walls",
    "voice.page.window": "window",
    "voice.page.windows": "Windows",
    "sc.analyzeFrame": "Analyze Frame",
    "sc.designImage": "Design Image",
    "sc.colorPalette": "Color Palette",
    "sc.materials": "Suggested Materials & Finishes",
    "sc.currentMaterials": "Current Materials",
    "sc.structuralSuggestions": "Structural Improvement Suggestions",
    "sc.noProducts": "No matching products found",
    "sc.designFeatures": "Design Features & Benefits",
    "sc.alyaziaFeatures": "Eng. Alyazia | Design Features",
    "sc.searchingBinyan": "Eng. Alyazia is searching Binyan stores...",
    "sc.designLimits": "Design Limits:",
    "sc.perspective": "Perspective:",
    "sc.untouched": "Untouched:",
    "sc.benefit": "Benefit:",
    "sc.level": "Level:",
    "sc.treatment": "Treatment:",
    "sc.reason": "Reason:",
    "sc.specialist": "Specialist:",
    "sc.direction": "Direction:",
    "sc.zoom": "Zoom:",
    "sc.currentDesign": "Current Design",
    "projects.new": "New Project",
    "projects.start": "Start your first project",
    "ui.delete": "Delete",
    "ui.edit": "Edit",
    "ui.download": "Download",
    "ui.share": "Share",
    "ui.copy": "Copy",
    "ui.copied": "Copied!",
    "ui.success": "Success",
    "ui.loading2": "Loading...",
    "studio.chooseStyle": "Choose Style",
    "studio.room": "Room",
    "studio.chooseRoom": "Choose Room",
    "studio.budget": "Budget",
    "studio.descPlaceholder": "Add a description of the desired design",
    "voice.design.title": "Voice Design",
    "voice.pressToSpeak": "Press to speak",
    "voice.listening2": "Listening...",
    "ar.scanSpace": "Scan Space",
    "ar.startScan": "Start Scan",
    "ar.stopScan": "Stop Scan",
    "ar.scanning": "Scanning...",
    "ideas.category": "Category",
    "store.addToProject": "Add to Project",
    "store.price": "Price",
    "store.vendor": "Store",
    "mood.title": "Mood Board",
    "mood.addImage": "Add Image",
    "mood.create": "Create Board",
    "costs.area": "Area",
    "costs.level": "Level",
    "costs.calculate": "Calculate Cost",
    "costs.total": "Total Cost",
    "ui.wait": "Please wait",
    "ui.errorOccurred": "An error occurred",
    "ui.prev": "Previous",
    "ui.viewAll": "View All",
    "ui.more": "More",
    "ui.less": "Less",
    "ui.ok": "OK",
    "ui.start": "Start",
    "ui.reset": "Reset",
    "ui.uploadImage": "Upload Image",
    "ui.capturePhoto": "Capture Photo",
    "ui.chooseImage": "Choose Image",
    "ui.preview": "Preview",
    "ui.details": "Details",
    "ui.description": "Description",
    "projects.name": "Project Name",
    "projects.roomType": "Room Type",
    "projects.createdAt": "Created At",
    "projects.updatedAt": "Last Updated",
    "projects.confirmDelete": "Confirm Delete",
    "home.planDesign.title": "Design from Plan",
    "home.planDesign.desc": "Upload your plan and get a full design",
    "chat.analysisError": "Image analysis error",
    "chat.expert.title": "Eng. Alyazia - Design Expert",
    "chat.imageError": "Image upload error",
    "chat.imageUploaded": "Image uploaded successfully",
    "chat.linkProject": "Link to project",
    "chat.loginRequired": "Login required",
    "chat.noProject": "No project selected",
    "chat.quickQuestion": "Quick question",
    "chat.sendError": "Send error",
    "chat.session.element": "Specific element",
    "chat.session.element.desc": "Discuss a specific design element",
    "chat.session.floorPlan": "Floor Plan",
    "chat.session.floorPlan.desc": "Analyze and modify the floor plan",
    "chat.session.general": "General chat",
    "chat.session.general.desc": "General design consultation with Eng. Alyazia",
    "chat.session.scan360": "360° Scan",
    "chat.session.scan360.desc": "Analyze full room scan",
    "chat.welcome.subtitle": "Ask me anything about interior design",
    "chat.welcome.title": "Hello! I'm Eng. Alyazia",
    "credit.balance": "Balance",
    "credit.buy": "Buy Credits",
    "credit.empty": "Your balance is empty",
    "credit.hello": "Hello",
    "credit.link": "Link Account",
    "credit.linkDesc": "Link your account to get free credits",
    "credit.linkTitle": "Get Free Credits",
    "credit.login": "Login",
    "credit.loginDesc": "Login to get free credits",
    "credit.loginTitle": "Login Now",
    "credit.low": "Low balance",
    "credit.refresh": "Refresh balance",
    "credit.yourBalance": "Your balance",
    "voice.commands.title": "Voice Commands",
    "voice.help": "Help",
    "voice.hint1": "Say open analysis to go to analysis",
    "voice.hint2": "Say open studio to go to studio",
    "voice.hint3": "Say open projects to go to projects",
    "voice.hint4": "Say open chat to go to chat",
    "voice.hint5": "Say open costs to go to costs",
    "voice.openAR": "Open AR Scan",
    "voice.openAnalyze": "Open Analysis",
    "voice.openChat": "Open Chat",
    "voice.openCosts": "Open Costs",
    "voice.openMoodboard": "Open Mood Board",
    "voice.openProjects": "Open Projects",
    "voice.openStudio": "Open Studio",
    "voice.startListening": "Start listening",
    "voice.stop": "Stop",
    "voice.stopListening": "Stop listening",
    "studio.login_required": "Please log in to access the Design Studio",
    "studio.back_home": "Back to Home",
    "studio.step_project": "Project",
    "studio.step_identity": "Visual Identity",
    "studio.step_floors": "Floors",
    "studio.step_walls": "Walls",
    "studio.step_ceilings": "Ceilings",
    "studio.step_doors": "Doors & Windows",
    "studio.step_lighting": "Lighting",
    "studio.step_furniture": "Furniture",
    "studio.step_perspective": "Full Perspective",
    "studio.style_modern": "Modern",
    "studio.style_gulf": "Gulf Classic",
    "studio.style_classic": "Luxury Classic",
    "studio.style_minimal": "Minimal",
    "studio.style_japanese": "Japanese Zen",
    "studio.style_scandinavian": "Scandinavian",
    "studio.style_mediterranean": "Mediterranean",
    "studio.style_industrial": "Industrial",
    "studio.style_moroccan": "Moroccan",
    "studio.style_luxury": "Premium Luxury",
    "studio.budget_economic": "Economic",
    "studio.budget_medium": "Medium",
    "studio.budget_luxury": "Luxury",
    "studio.budget_premium": "Premium",
    "studio.select_project": "Select a Project",
    "studio.new_project": "New Project",
    "studio.select_room": "Select Room",
    "studio.design_element": "Design This Element",
    "studio.generate_perspective": "Generate Full Perspective",
    "studio.select_project_first": "Please select a project first",
    "studio.design_success": "Design completed with full harmony!",
    "studio.design_error": "An error occurred during design",
    "studio.perspective_success": "Full perspective generated!",
    "studio.perspective_error": "Error generating perspective",
    "studio.room_living": "Living Room",
    "studio.room_master": "Master Bedroom",
    "studio.room_bedroom": "Bedroom",
    "studio.room_kitchen": "Kitchen",
    "studio.room_bathroom": "Bathroom",
    "studio.room_office": "Office",
    "studio.room_dining": "Dining Room",
    "studio.room_kids": "Kids Room",
    "studio.room_majlis": "Majlis",
    "studio.room_entrance": "Entrance",
    "studio.visual_identity": "Visual Identity",
    "studio.select_style": "Select Style",
    "studio.select_budget": "Select Budget",
    "studio.next": "Next",
    "studio.prev": "Previous",
    "studio.designing": "Designing...",
    "studio.progress": "Progress",
    "studio.completed": "Completed",
    "studio.projects_link": "My Projects",
    "studio.chat_link": "Consult Eng. Alyazia",
    "voice.start": "Start Recording",
    "voice.generating": "Generating design...",
    "voice.result": "Design Result",
    "voice.try_again": "Try Again",
    "voice.save": "Save Design",
    "voice.saved": "Saved successfully",
    "voice.error_mic": "Could not access microphone",
    "voice.error_process": "An error occurred during processing",
    "voice.placeholder": "Press the microphone and describe your space...",
    "voice.login_required": "Please log in to use this feature",
    "sc.title": "Smart Analysis",
    "sc.upload_photo": "Upload Photo",
    "sc.take_photo": "Take Photo",
    "sc.analyzing": "Analyzing...",
    "sc.analysis_result": "Analysis Result",
    "sc.design_suggestion": "Design Suggestion",
    "sc.save_result": "Save Result",
    "sc.new_analysis": "New Analysis",
    "sc.no_image": "Please upload an image first",
    "sc.error": "An error occurred during analysis",
    "sc.scan_title": "AR Scan",
    "sc.scan_subtitle": "Scan the space with your camera",
    "sc.scan_start": "Start Scan",
    "sc.scan_stop": "Stop Scan",
    "projects.empty_desc": "Start by creating your first project",
    "projects.type": "Project Type",
    "projects.delete_confirm": "Are you sure you want to delete this project?",
    "projects.created": "Project created",
    "projects.open": "Open Project",
    "projects.designs": "Designs",
    "projects.last_updated": "Last Updated",
    "projects.login_required": "Please log in to view your projects",
    "projects.loading": "Loading projects...",
    "projects.error": "Error loading projects",
    "furniture.title": "Furniture Store",
    "furniture.subtitle": "Real furniture from local stores",
    "furniture.search": "Search for furniture...",
    "furniture.filter": "Filter",
    "furniture.category": "Category",
    "furniture.price": "Price",
    "furniture.add_to_project": "Add to Project",
    "furniture.view_details": "View Details",
    "furniture.no_results": "No results found",
    "furniture.loading": "Loading...",
    "furniture.beta_notice": "This feature is in beta",
    "furniture.sofa": "Sofa",
    "furniture.bed": "Bed",
    "furniture.table": "Table",
    "furniture.chair": "Chair",
    "furniture.wardrobe": "Wardrobe",
    "mood.subtitle": "Collect your inspiration in one board",
    "mood.add_image": "Add Image",
    "mood.add_color": "Add Color",
    "mood.save": "Save Board",
    "mood.clear": "Clear Board",
    "mood.generate": "Generate Design from Board",
    "mood.empty": "Board is empty",
    "mood.saved": "Board saved",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.share": "Share",
    "common.download": "Download",
    "common.prev": "Previous",
    "common.login": "Log In",
    "common.logout": "Log Out",
    "common.profile": "Profile",
    "common.settings": "Settings",
    "common.guest": "Guest",
    "common.free": "Free",
    "common.premium": "Premium",
    "common.required": "Required",
    "common.optional": "Optional",
    "common.success": "Operation successful",
    "common.failed": "Operation failed",
    "common.sar": "SAR",
    "common.credits": "Credits",
    "common.buy_credits": "Buy Credits",
    "common.insufficient_credits": "Insufficient credits",
    "common.view_all": "View All",
    "common.see_more": "See More",
    "common.back_home": "Back to Home",
    "studio.consult": "Consult Eng. Alyazia",
    "studio.elements_done": "elements done",
    "studio.choose_project": "Choose Your Project",
    "studio.choose_project_desc": "Select the project and room you want to design",
    "studio.no_projects": "No projects yet",
    "studio.create_project": "Create New Project",
    "studio.room_area": "Room & Area",
    "studio.area_m2": "Area (m²)",
    "studio.next_identity": "Next: Set Visual Identity",
    "studio.visual_identity_desc": "This identity will be applied to all design elements to ensure full harmony",
    "studio.design_style": "Design Style",
    "studio.total_budget": "Total Budget",
    "studio.identity_details": "Visual Identity Details",
    "studio.customized": "Customized",
    "studio.reset_default": "Reset to Default",
    "studio.start_design": "Start Designing",
    "studio.design_details": "Design Details",
    "studio.element_designed_success": "Design completed successfully",
    "studio.overall_progress": "Overall Design Progress",
    "studio.room_hall": "Hall",
    "studio.redesign": "Redesign with Different Identity",
    "studio.redesigning": "Redesigning...",
    "studio.design_me": "Design it, Eng. Alyazia",
    "studio.perspective_generated": "Perspective generated",
    "studio.generate_new_perspective": "Generate New Perspective",
    "studio.generating_perspective": "Generating...",
    "studio.generate_full_perspective": "Generate Full Perspective",
    "studio.perspective_generating": "Eng. Alyazia is generating the perspective...",
    "studio.min_elements_warning": "For best results, design at least 3 elements first",
    "studio.prev_step": "← Previous",
    "studio.next_step": "Next →",
    "studio.designed_badge": "✓ Designed",
    "studio.sarah_tips": "Eng. Alyazia's Tips",
    "studio.applied_identity": "Visual identity applied to this element",
    "studio.primary_color": "Primary",
    "studio.secondary_color": "Secondary",
    "studio.accent_color": "Accent",
    "studio.identity_warning": "Why is visual identity important?",
    "studio.design_concept": "Design Concept",
    "studio.harmony_note": "Harmony",
    "studio.cost_range": "Cost Range",
    "studio.products": "Products",
    "studio.color_palette": "Color Palette",
    "studio.installation_steps": "Installation Steps",
    "studio.professional_notes": "Professional Notes",
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
    // ===== Missing keys =====
    "quick.capture.angle": "زاویہ",
    "quick.capture.cameraError": "کیمرہ تک رسائی ممکن نہیں۔ اجازت دیں۔",
    "quick.capture.noVideo": "ابھی تک کوئی ویڈیو ریکارڈ نہیں ہوئی",
    "quick.capture.uploadVideo": "ویڈیو اپلوڈ کریں",
    "smart.capture.zoom": "زوم",
    "ui.add": "شامل کریں",
    "ui.colorName": "رنگ کا نام",
    "ui.editColor": "رنگ تبدیل کریں",

    // ===== New translations added =====
    "analyze.analyze": "تجزیہ کریں",
    "analyze.results": "تجزیہ کے نتائج",
    "analyze.title": "جگہ کا تجزیہ",
    "analyze.upload": "تصویر اپلوڈ کریں",
    "ar.subtitle": "اضافی حقیقت سے اپنی جگہ اسکین کریں",
    "ar.title": "AR اسکین",
    "auth.gate.btn": "سائن ان",
    "auth.gate.subtitle": "اس فیچر کے لیے سائن ان ضروری ہے",
    "auth.gate.title": "جاری رکھنے کے لیے سائن ان کریں",
    "costs.subtitle": "اپنے ڈیزائن منصوبے کی لاگت حساب کریں",
    "costs.title": "لاگت کا حساب",
    "credit.badge.balance": "بیلنس",
    "credit.badge.buy": "خریدیں",
    "credits.buyMore": "کریڈٹ خریدیں",
    "credits.costLabel": "لاگت",
    "credits.deductedMsg": "کٹوتی کی گئی",
    "credits.insufficientMsg": "اس آپریشن کے لیے آپ کا موجودہ بیلنس کافی نہیں",
    "credits.perOperation": "ہر آپریشن کے لیے کریڈٹ",
    "credits.title": "کریڈٹ",
    "credits.yourBalance": "آپ کا موجودہ بیلنس",
    "error.apology": "م. الیازیہ اس عارضی خرابی کے لیے معذرت خواہ ہیں۔ جاری رکھنے کے لیے صفحہ دوبارہ لوڈ کریں۔",
    "error.details": "خرابی کی تفصیل (صرف ڈویلپرز کے لیے)",
    "error.reload": "صفحہ دوبارہ لوڈ کریں",
    "error.unexpected": "معذرت، ایک غیر متوقع خرابی پیش آئی",
    "home.hero.badge": "مصنوعی ذہانت سے چلتا ہے",
    "home.hero.facades": "عمارت کے اگلے حصے",
    "home.hero.interior": "اندرونی",
    "home.hero.landscape": "لینڈسکیپ",
    "home.hero.pools": "تالاب",
    "home.noProjects": "ابھی کوئی منصوبے نہیں",
    "home.sections.title": "اپنی سروس منتخب کریں",
    "home.startAnalysis": "اپنا پہلا تجزیہ شروع کریں",
    "ideas.page.area": "رقبہ",
    "ideas.page.budget": "بجٹ",
    "ideas.page.generate": "خیالات بنائیں",
    "ideas.page.generating": "بن رہا ہے...",
    "ideas.page.noResults": "ابھی کوئی خیالات نہیں",
    "ideas.page.roomType": "کمرے کی قسم",
    "ideas.page.style": "انداز",
    "ideas.page.subtitle": "آپ کی جگہ کے لیے ذاتی ڈیزائن کے خیالات",
    "ideas.page.title": "ڈیزائن کے خیالات",
    "login.btn": "سائن ان",
    "login.features.analyze": "مصنوعی ذہانت سے جگہ کا تجزیہ",
    "login.features.design": "پیشہ ورانہ ڈیزائن بنائیں",
    "login.features.save": "اپنے منصوبے محفوظ کریں اور شیئر کریں",
    "login.subtitle": "ڈیزائن شروع کرنے کے لیے سائن ان کریں",
    "login.title": "خوش آمدید",
    "moodboard.addImage": "تصویر شامل کریں",
    "moodboard.export": "برآمد کریں",
    "moodboard.generate": "بورڈ بنائیں",
    "moodboard.save": "بورڈ محفوظ کریں",
    "moodboard.subtitle": "اپنے ڈیزائن کے خیالات ایک بورڈ میں جمع کریں",
    "moodboard.title": "موڈ بورڈ",
    "nav.designIdeas": "ڈیزائن کے خیالات",
    "nav.furnitureStore": "فرنیچر اسٹور",
    "nav.home": "گھر",
    "nav.logout": "سائن آؤٹ",
    "nav.myProjects": "میرے منصوبے",
    "nav.quickAnalyze": "فوری تجزیہ",
    "nav.smartCapture": "ذہین تجزیہ",
    "nav.voiceDesigner": "آواز سے ڈرائنگ",
    "plan.subtitle": "مصنوعی ذہانت سے فلور پلان بنائیں",
    "plan.title": "فلور پلان ڈیزائن",
    "project.detail.cost": "لاگت",
    "project.detail.delete": "منصوبہ حذف کریں",
    "project.detail.export": "PDF برآمد کریں",
    "project.detail.materials": "مواد",
    "project.detail.overview": "جائزہ",
    "project.detail.palette": "رنگ پیلیٹ",
    "project.detail.share": "شیئر کریں",
    "project.detail.title": "منصوبے کی تفصیل",
    "projects.analyzeNow": "ابھی تجزیہ کریں",
    "projects.deleteConfirm": "کیا آپ یہ منصوبہ حذف کرنا چاہتے ہیں؟",
    "projects.deleted": "منصوبہ حذف ہو گیا",
    "projects.myProjects": "میرے منصوبے",
    "projects.noProjects": "ابھی کوئی منصوبے نہیں",
    "projects.startFirst": "پہلی جگہ کا تجزیہ کر کے شروع کریں",
    "projects.type.quick": "فوری تجزیہ",
    "projects.type.smart": "ذہین تجزیہ",
    "projects.type.voice": "آواز سے ڈرائنگ",
    "quick.analyze.btn": "ابھی تجزیہ کریں",
    "quick.analyzing": "تجزیہ ہو رہا ہے...",
    "quick.analyzing.subtitle": "م. الیازیہ جگہ کا تجزیہ کر رہی ہیں",
    "quick.budget.custom": "کسٹم",
    "quick.budget.economy": "اقتصادی",
    "quick.budget.from": "سے",
    "quick.budget.medium": "درمیانہ",
    "quick.budget.premium": "پریمیم",
    "quick.budget.title": "بجٹ",
    "quick.budget.to": "تک",
    "quick.capture.fromGallery": "گیلری سے",
    "quick.capture.multi.title": "جگہ کی تصاویر لیں",
    "quick.capture.nextStyle": "اگلا — انداز منتخب کریں",
    "quick.capture.noImage": "ابھی کوئی تصویر نہیں",
    "quick.capture.note.label": "مطلوبہ ڈیزائن کے لیے نوٹ یا تفصیل شامل کریں",
    "quick.capture.note.optional": "(اختیاری)",
    "quick.capture.note.placeholder": "مثال: میں فرنیچر کو L-shape صوفے سے بدلنا چاہتا ہوں...",
    "quick.capture.openCamera": "کیمرہ کھولیں",
    "quick.capture.title": "کمرے کی تصویر لیں",
    "quick.mode.multi": "متعدد تصاویر",
    "quick.mode.multi.desc": "کمرے کے تمام زاویے (6 تصاویر تک)",
    "quick.mode.panorama": "پینوراما",
    "quick.mode.panorama.desc": "پورے کمرے کی پینوراما تصویر",
    "quick.mode.single": "ایک تصویر",
    "quick.mode.single.desc": "ایک زاویے سے کمرہ کیپچر کریں",
    "quick.mode.subtitle": "جگہ کیپچر کرنے کا طریقہ منتخب کریں",
    "quick.mode.title": "آپ کیسے تصویر لینا چاہتے ہیں؟",
    "quick.mode.video": "ویڈیو",
    "quick.mode.video.desc": "کمرے کی ویڈیو ریکارڈ کریں (30 سیکنڈ تک)",
    "quick.result.chat": "م. الیازیہ سے بات کریں",
    "quick.result.copied": "کاپی ہو گیا",
    "quick.result.copy": "تجزیہ کاپی کریں",
    "quick.result.cost": "تخمینی لاگت",
    "quick.result.export": "PDF برآمد کریں",
    "quick.result.generate": "تصویری خاکہ بنائیں",
    "quick.result.generating": "بن رہا ہے...",
    "quick.result.newAnalysis": "نیا تجزیہ",
    "quick.result.overview": "تجزیہ اور سفارشات",
    "quick.result.palette": "رنگ پیلیٹ",
    "quick.result.reanalyze": "تبدیلیوں کے ساتھ دوبارہ تجزیہ",
    "quick.result.suggestions": "ڈیزائن کی تجاویز",
    "quick.style.classic": "کلاسک",
    "quick.style.gulf": "خلیجی",
    "quick.style.japanese": "جاپانی",
    "quick.style.luxury": "پرتعیش",
    "quick.style.minimal": "مینیمل",
    "quick.style.modern": "جدید",
    "quick.style.moroccan": "مراکشی",
    "quick.style.scandinavian": "اسکینڈینیوین",
    "quick.style.subtitle": "ڈیزائن کا انداز منتخب کریں",
    "quick.style.title": "ڈیزائن کا انداز منتخب کریں",
    "quick.tip.label": "م. الیازیہ کی نصیحت",
    "quick.title": "فوری تجزیہ",
    "sarah.chat.applyDesign": "یہ ڈیزائن لاگو کریں",
    "sarah.chat.attachImage": "تصویر منسلک کریں",
    "sarah.chat.creditPerMsg": "ہر پیغام کے لیے 20 کریڈٹ",
    "sarah.chat.generateImage": "تصویر بنائیں",
    "sarah.chat.modifiedDesign": "ترمیم شدہ ڈیزائن",
    "sarah.chat.placeholder": "م. الیازیہ سے ڈیزائن کے بارے میں پوچھیں...",
    "sarah.chat.send": "بھیجیں",
    "sarah.chat.subtitle": "تعمیراتی ڈیزائن ماہر",
    "sarah.chat.tapToGenerate": "جواب کے ساتھ تصویر بنانے کے لیے ٹیپ کریں",
    "sarah.chat.thinking": "م. الیازیہ سوچ رہی ہے...",
    "sarah.chat.title": "م. الیازیہ",
    "sarah.chat.willGenerate": "تبدیلیوں کے ساتھ تصویر بنائی جائے گی",
    "scanner.back": "پیچھے",
    "scanner.backDesc": "پیچھے 180° مڑیں",
    "scanner.backWall": "پچھلی دیوار",
    "scanner.cameraError": "کیمرہ تک رسائی نہیں۔ اجازت دینا یقینی بنائیں۔",
    "scanner.ceiling": "چھت",
    "scanner.ceilingDesc": "کیمرہ اوپر کریں",
    "scanner.corner": "کمرے کا کونہ",
    "scanner.corner.dir": "کونہ",
    "scanner.cornerDesc": "دو دیواروں کو جوڑنے والا کونہ کیپچر کریں",
    "scanner.down": "نیچے",
    "scanner.floor": "فرش",
    "scanner.floorDesc": "کیمرہ نیچے کریں",
    "scanner.forward": "آگے",
    "scanner.frontDesc": "کیمرہ آگے کریں",
    "scanner.frontWall": "سامنے کی دیوار",
    "scanner.left": "بائیں",
    "scanner.leftDesc": "بائیں 90° مڑیں",
    "scanner.leftWall": "بائیں دیوار",
    "scanner.right": "دائیں",
    "scanner.rightDesc": "دائیں 90° مڑیں",
    "scanner.rightWall": "دائیں دیوار",
    "scanner.up": "اوپر",
    "smart.capture.advantages": "ڈیزائن کے فوائد",
    "smart.capture.analyzeBtn": "تصویر کا تجزیہ کریں",
    "smart.capture.analyzing": "تجزیہ ہو رہا ہے...",
    "smart.capture.boq": "مقدار کا بل (BOQ)",
    "smart.capture.buyFromBonyan": "بنیان سے یہ ڈیکور خریدیں",
    "smart.capture.changeStyle": "انداز تبدیل کریں",
    "smart.capture.cost": "تخمینی لاگت",
    "smart.capture.download": "تصویر ڈاؤنلوڈ کریں",
    "smart.capture.duration": "عمل درآمد کی مدت",
    "smart.capture.error": "ایک خرابی پیش آئی، دوبارہ کوشش کریں",
    "smart.capture.exportPdf": "ڈیزائن بک برآمد کریں (PDF)",
    "smart.capture.furniture": "تجویز کردہ فرنیچر",
    "smart.capture.generateIdeas": "ڈیزائن کے خیالات بنائیں",
    "smart.capture.materials": "مواد اور تکمیل",
    "smart.capture.noResults": "ابھی کوئی نتائج نہیں",
    "smart.capture.overview": "عمومی جائزہ",
    "smart.capture.palette": "رنگ پیلیٹ",
    "smart.capture.refine": "ڈیزائن بہتر کریں",
    "smart.capture.regenerate": "دوبارہ بنائیں",
    "smart.capture.results": "تجزیہ کے نتائج",
    "smart.capture.roomType": "کمرے کی قسم",
    "smart.capture.share": "شیئر کریں",
    "smart.capture.style": "تجویز کردہ انداز",
    "smart.capture.styleType": "مطلوبہ انداز",
    "smart.capture.title": "ذہین تجزیہ",
    "smart.capture.upload": "تصویر اپلوڈ یا لینے کے لیے ٹیپ کریں",
    "store.addToCart": "کارٹ میں شامل کریں",
    "store.comingSoon": "جلد آ رہا ہے",
    "store.filter.all": "سب",
    "store.filter.bed": "بیڈروم",
    "store.filter.dining": "کھانے کی میزیں",
    "store.filter.office": "دفاتر",
    "store.filter.outdoor": "بیرونی",
    "store.filter.sofa": "صوفے",
    "store.noResults": "کوئی پروڈکٹ نہیں ملا",
    "store.search": "فرنیچر تلاش کریں...",
    "store.subtitle": "مقامی اسٹورز سے حقیقی فرنیچر",
    "store.title": "فرنیچر اسٹور",
    "store.viewProduct": "پروڈکٹ دیکھیں",
    "studio.description": "ڈیزائن کی تفصیل",
    "studio.generate": "ڈیزائن بنائیں",
    "studio.generating": "بن رہا ہے...",
    "studio.result": "ڈیزائن کا نتیجہ",
    "studio.roomType": "کمرے کی قسم",
    "studio.style": "انداز",
    "studio.subtitle": "مصنوعی ذہانت سے اپنی جگہ ڈیزائن کریں",
    "studio.title": "ڈیزائن اسٹوڈیو",
    "ui.all": "سب",
    "ui.back": "واپس",
    "ui.beta": "بیٹا",
    "ui.cancel": "منسوخ کریں",
    "ui.close": "بند کریں",
    "ui.comingSoon": "جلد آ رہا ہے",
    "ui.confirm": "تصدیق کریں",
    "ui.currency.aed": "AED",
    "ui.currency.sar": "SAR",
    "ui.currency.usd": "USD",
    "ui.done": "مکمل",
    "ui.error": "ایک خرابی پیش آئی",
    "ui.estimated": "تخمینی",
    "ui.filter": "فلٹر",
    "ui.loading": "لوڈ ہو رہا ہے...",
    "ui.months": "مہینے",
    "ui.new": "نیا",
    "ui.next": "اگلا",
    "ui.no": "نہیں",
    "ui.retry": "دوبارہ کوشش کریں",
    "ui.save": "محفوظ کریں",
    "ui.search": "تلاش",
    "ui.sort": "ترتیب",
    "ui.weeks": "ہفتے",
    "ui.yes": "ہاں",
    "urban.subtitle": "شہری اور عوامی جگہیں ڈیزائن کریں",
    "urban.title": "شہری ڈیزائن",
    "voice.page.ac": "ایئر کنڈیشنر",
    "voice.page.addRoom": "کمرہ شامل کریں",
    "voice.page.clear": "سب صاف کریں",
    "voice.page.dimensions": "پیمائش",
    "voice.page.door": "دروازہ",
    "voice.page.doors": "دروازے",
    "voice.page.electricity": "بجلی",
    "voice.page.export": "برآمد کریں",
    "voice.page.exportPlan": "فلور پلان برآمد کریں",
    "voice.page.furniture": "فرنیچر",
    "voice.page.generate3D": "3D رینڈر بنائیں",
    "voice.page.generating3D": "رینڈر بن رہا ہے...",
    "voice.page.listening": "سن رہا ہے...",
    "voice.page.processing": "پروسیسنگ ہو رہی ہے...",
    "voice.page.renderResult": "رینڈر نتیجہ",
    "voice.page.room": "کمرہ",
    "voice.page.rooms": "کمرے",
    "voice.page.selected": "منتخب",
    "voice.page.stairs": "سیڑھیاں",
    "voice.page.startDrawing": "ڈرائنگ شروع کریں",
    "voice.page.subtitle": "اپنی جگہ بیان کریں اور الیازیہ فلور پلان بنائے گی",
    "voice.page.title": "آواز سے ڈرائنگ",
    "voice.page.undo": "واپس کریں",
    "voice.page.voiceInput": "آواز سے ان پٹ",
    "voice.page.wall": "دیوار",
    "voice.page.walls": "دیواریں",
    "voice.page.window": "کھڑکی",
    "voice.page.windows": "کھڑکیاں",
    "sc.analyzeFrame": "فریم تجزیہ",
    "sc.designImage": "ڈیزائن تصویر",
    "sc.colorPalette": "رنگ پیلیٹ",
    "sc.materials": "تجویز کردہ مواد",
    "sc.currentMaterials": "موجودہ مواد",
    "sc.structuralSuggestions": "ساختی بہتری",
    "sc.noProducts": "کوئی مصنوعات نہیں",
    "sc.designFeatures": "ڈیزائن کی خصوصیات",
    "sc.alyaziaFeatures": "م. الیازیہ | خصوصیات",
    "sc.searchingBinyan": "بنیان اسٹورز میں تلاش",
    "sc.designLimits": "ڈیزائن کی حدود:",
    "sc.perspective": "نقطہ نظر:",
    "sc.untouched": "بدون تبدیلی:",
    "sc.benefit": "فائدہ:",
    "sc.level": "سطح:",
    "sc.treatment": "علاج:",
    "sc.reason": "وجہ:",
    "sc.specialist": "ماہر:",
    "sc.direction": "سمت:",
    "sc.zoom": "زوم:",
    "sc.currentDesign": "موجودہ ڈیزائن",
    "projects.new": "نیا پروجیکٹ",
    "projects.start": "اپنا پہلا پروجیکٹ شروع کریں",
    "ui.delete": "حذف کریں",
    "ui.edit": "ترمیم",
    "ui.download": "ڈاؤن لوڈ",
    "ui.share": "شیئر کریں",
    "ui.copy": "کاپی",
    "ui.copied": "کاپی ہو گیا!",
    "ui.success": "کامیابی",
    "ui.loading2": "لوڈ ہو رہا ہے",
    "studio.chooseStyle": "انداز منتخب کریں",
    "studio.room": "کمرہ",
    "studio.chooseRoom": "کمرہ منتخب کریں",
    "studio.budget": "بجٹ",
    "studio.descPlaceholder": "مطلوبہ ڈیزائن کی وضاحت",
    "voice.design.title": "آواز سے ڈیزائن",
    "voice.pressToSpeak": "بولنے کے لیے دبائیں",
    "voice.listening2": "سن رہا ہے...",
    "ar.scanSpace": "جگہ اسکین کریں",
    "ar.startScan": "اسکین شروع کریں",
    "ar.stopScan": "اسکین روکیں",
    "ar.scanning": "اسکین ہو رہا ہے...",
    "ideas.category": "زمرہ",
    "store.addToProject": "پروجیکٹ میں شامل کریں",
    "store.price": "قیمت",
    "store.vendor": "اسٹور",
    "mood.title": "موڈ بورڈ",
    "mood.addImage": "تصویر شامل کریں",
    "mood.create": "بورڈ بنائیں",
    "costs.area": "رقبہ",
    "costs.level": "سطح",
    "costs.calculate": "لاگت حساب کریں",
    "costs.total": "کل لاگت",
    "ui.wait": "براہ کرم انتظار کریں",
    "ui.errorOccurred": "ایک خطا ہوئی",
    "ui.prev": "پچھلا",
    "ui.viewAll": "سب دیکھیں",
    "ui.more": "مزید",
    "ui.less": "کم",
    "ui.ok": "ٹھیک ہے",
    "ui.start": "شروع کریں",
    "ui.reset": "دوبارہ ترتیب",
    "ui.uploadImage": "تصویر اپ لوڈ کریں",
    "ui.capturePhoto": "تصویر کھینچیں",
    "ui.chooseImage": "تصویر منتخب کریں",
    "ui.preview": "پیش نظارہ",
    "ui.details": "تفصیلات",
    "ui.description": "وضاحت",
    "projects.name": "پروجیکٹ کا نام",
    "projects.roomType": "کمرے کی قسم",
    "projects.createdAt": "بنانے کی تاریخ",
    "projects.updatedAt": "آخری اپ ڈیٹ",
    "projects.confirmDelete": "حذف کی تصدیق",
    "home.planDesign.title": "پلان سے ڈیزائن",
    "home.planDesign.desc": "اپنا پلان اپ لوڈ کریں",
    "chat.analysisError": "تصویر تجزیہ خطا",
    "chat.expert.title": "م. الیازیہ - ڈیزائن ماہر",
    "chat.imageError": "تصویر اپ لوڈ خطا",
    "chat.imageUploaded": "تصویر کامیابی سے اپ لوڈ ہوئی",
    "chat.linkProject": "پروجیکٹ سے لنک کریں",
    "chat.loginRequired": "لاگ ان ضروری ہے",
    "chat.noProject": "کوئی پروجیکٹ منتخب نہیں",
    "chat.quickQuestion": "فوری سوال",
    "chat.sendError": "بھیجنے میں خطا",
    "chat.session.element": "مخصوص عنصر",
    "chat.session.element.desc": "ڈیزائن کے مخصوص عنصر پر بات کریں",
    "chat.session.floorPlan": "فلور پلان",
    "chat.session.floorPlan.desc": "فلور پلان کا تجزیہ اور ترمیم",
    "chat.session.general": "عام گفتگو",
    "chat.session.general.desc": "م. الیازیہ کے ساتھ عام ڈیزائن مشاورت",
    "chat.session.scan360": "360° اسکین",
    "chat.session.scan360.desc": "مکمل کمرے کا اسکین تجزیہ",
    "chat.welcome.subtitle": "اندرونی ڈیزائن کے بارے میں کچھ بھی پوچھیں",
    "chat.welcome.title": "ہیلو! میں م. الیازیہ ہوں",
    "credit.balance": "بیلنس",
    "credit.buy": "کریڈٹ خریدیں",
    "credit.empty": "آپ کا بیلنس خالی ہے",
    "credit.hello": "ہیلو",
    "credit.link": "اکاؤنٹ لنک کریں",
    "credit.linkDesc": "مفت کریڈٹ کے لیے اکاؤنٹ لنک کریں",
    "credit.linkTitle": "مفت کریڈٹ حاصل کریں",
    "credit.login": "لاگ ان",
    "credit.loginDesc": "مفت کریڈٹ کے لیے لاگ ان کریں",
    "credit.loginTitle": "ابھی لاگ ان کریں",
    "credit.low": "کم بیلنس",
    "credit.refresh": "بیلنس تازہ کریں",
    "credit.yourBalance": "آپ کا بیلنس",
    "voice.commands.title": "آواز کے احکامات",
    "voice.help": "مدد",
    "voice.hint1": "تجزیہ کھولنے کے لیے 'تجزیہ کھولیں' کہیں",
    "voice.hint2": "اسٹوڈیو کھولنے کے لیے 'اسٹوڈیو کھولیں' کہیں",
    "voice.hint3": "پروجیکٹس کھولنے کے لیے 'پروجیکٹس کھولیں' کہیں",
    "voice.hint4": "چیٹ کھولنے کے لیے 'چیٹ کھولیں' کہیں",
    "voice.hint5": "اخراجات کھولنے کے لیے 'اخراجات کھولیں' کہیں",
    "voice.openAR": "AR اسکین کھولیں",
    "voice.openAnalyze": "تجزیہ کھولیں",
    "voice.openChat": "چیٹ کھولیں",
    "voice.openCosts": "اخراجات کھولیں",
    "voice.openMoodboard": "موڈ بورڈ کھولیں",
    "voice.openProjects": "پروجیکٹس کھولیں",
    "voice.openStudio": "اسٹوڈیو کھولیں",
    "voice.startListening": "سننا شروع کریں",
    "voice.stop": "روکیں",
    "voice.stopListening": "سننا بند کریں",
    "studio.login_required": "ڈیزائن اسٹوڈیو تک رسائی کے لیے لاگ ان کریں",
    "studio.back_home": "ہوم پر واپس",
    "studio.step_project": "پروجیکٹ",
    "studio.step_identity": "بصری شناخت",
    "studio.step_floors": "فرش",
    "studio.step_walls": "دیواریں",
    "studio.step_ceilings": "چھتیں",
    "studio.step_doors": "دروازے اور کھڑکیاں",
    "studio.step_lighting": "روشنی",
    "studio.step_furniture": "فرنیچر",
    "studio.step_perspective": "مکمل منظر",
    "studio.style_modern": "جدید",
    "studio.style_gulf": "خلیجی کلاسک",
    "studio.style_classic": "لگژری کلاسک",
    "studio.style_minimal": "مینیمل",
    "studio.style_japanese": "جاپانی زین",
    "studio.style_scandinavian": "اسکینڈینیوین",
    "studio.style_mediterranean": "بحیرہ روم",
    "studio.style_industrial": "صنعتی",
    "studio.style_moroccan": "مراکشی",
    "studio.style_luxury": "پریمیم لگژری",
    "studio.budget_economic": "اقتصادی",
    "studio.budget_medium": "درمیانہ",
    "studio.budget_luxury": "لگژری",
    "studio.budget_premium": "پریمیم",
    "studio.select_project": "پروجیکٹ منتخب کریں",
    "studio.new_project": "نیا پروجیکٹ",
    "studio.select_room": "کمرہ منتخب کریں",
    "studio.design_element": "اس عنصر کو ڈیزائن کریں",
    "studio.generate_perspective": "مکمل منظر بنائیں",
    "studio.select_project_first": "پہلے پروجیکٹ منتخب کریں",
    "studio.design_success": "مکمل ہم آہنگی سے ڈیزائن مکمل!",
    "studio.design_error": "ڈیزائن کے دوران خطا",
    "studio.perspective_success": "مکمل منظر بنایا گیا!",
    "studio.perspective_error": "منظر بنانے میں خطا",
    "studio.room_living": "لیونگ روم",
    "studio.room_master": "ماسٹر بیڈروم",
    "studio.room_bedroom": "بیڈروم",
    "studio.room_kitchen": "باورچی خانہ",
    "studio.room_bathroom": "باتھ روم",
    "studio.room_office": "دفتر",
    "studio.room_dining": "ڈائننگ روم",
    "studio.room_kids": "بچوں کا کمرہ",
    "studio.room_majlis": "مجلس",
    "studio.room_entrance": "داخلہ",
    "studio.visual_identity": "بصری شناخت",
    "studio.select_style": "انداز منتخب کریں",
    "studio.select_budget": "بجٹ منتخب کریں",
    "studio.next": "اگلا",
    "studio.prev": "پچھلا",
    "studio.designing": "ڈیزائن ہو رہا ہے...",
    "studio.progress": "پیشرفت",
    "studio.completed": "مکمل",
    "studio.projects_link": "میرے پروجیکٹس",
    "studio.chat_link": "م. الیازیہ سے مشورہ",
    "voice.start": "ریکارڈنگ شروع کریں",
    "voice.generating": "ڈیزائن بن رہا ہے...",
    "voice.result": "ڈیزائن نتیجہ",
    "voice.try_again": "دوبارہ کوشش کریں",
    "voice.save": "ڈیزائن محفوظ کریں",
    "voice.saved": "کامیابی سے محفوظ",
    "voice.error_mic": "مائیکروفون تک رسائی ناکام",
    "voice.error_process": "پروسیسنگ کے دوران خطا",
    "voice.placeholder": "مائیکروفون دبائیں اور اپنی جگہ بیان کریں...",
    "voice.login_required": "استعمال کے لیے لاگ ان کریں",
    "sc.title": "ذہین تجزیہ",
    "sc.upload_photo": "تصویر اپلوڈ کریں",
    "sc.take_photo": "تصویر لیں",
    "sc.analyzing": "تجزیہ ہو رہا ہے...",
    "sc.analysis_result": "تجزیہ کا نتیجہ",
    "sc.design_suggestion": "ڈیزائن کی تجویز",
    "sc.save_result": "نتیجہ محفوظ کریں",
    "sc.new_analysis": "نیا تجزیہ",
    "sc.no_image": "پہلے تصویر اپلوڈ کریں",
    "sc.error": "تجزیہ کے دوران خطا",
    "sc.scan_title": "AR اسکین",
    "sc.scan_subtitle": "اپنے کیمرے سے جگہ اسکین کریں",
    "sc.scan_start": "اسکین شروع کریں",
    "sc.scan_stop": "اسکین روکیں",
    "projects.empty_desc": "اپنا پہلا پروجیکٹ بنائیں",
    "projects.type": "پروجیکٹ کی قسم",
    "projects.delete_confirm": "کیا آپ واقعی حذف کرنا چاہتے ہیں؟",
    "projects.created": "پروجیکٹ بنایا گیا",
    "projects.open": "پروجیکٹ کھولیں",
    "projects.designs": "ڈیزائنز",
    "projects.last_updated": "آخری اپڈیٹ",
    "projects.login_required": "اپنے پروجیکٹس دیکھنے کے لیے لاگ ان کریں",
    "projects.loading": "پروجیکٹس لوڈ ہو رہے ہیں...",
    "projects.error": "پروجیکٹس لوڈ کرنے میں خطا",
    "furniture.title": "فرنیچر اسٹور",
    "furniture.subtitle": "مقامی دکانوں سے حقیقی فرنیچر",
    "furniture.search": "فرنیچر تلاش کریں...",
    "furniture.filter": "فلٹر",
    "furniture.category": "زمرہ",
    "furniture.price": "قیمت",
    "furniture.add_to_project": "پروجیکٹ میں شامل کریں",
    "furniture.view_details": "تفصیلات دیکھیں",
    "furniture.no_results": "کوئی نتیجہ نہیں",
    "furniture.loading": "لوڈ ہو رہا ہے...",
    "furniture.beta_notice": "یہ فیچر بیٹا میں ہے",
    "furniture.sofa": "صوفہ",
    "furniture.bed": "بستر",
    "furniture.table": "میز",
    "furniture.chair": "کرسی",
    "furniture.wardrobe": "الماری",
    "mood.subtitle": "اپنی تحریک ایک بورڈ میں جمع کریں",
    "mood.add_image": "تصویر شامل کریں",
    "mood.add_color": "رنگ شامل کریں",
    "mood.save": "بورڈ محفوظ کریں",
    "mood.clear": "بورڈ صاف کریں",
    "mood.generate": "بورڈ سے ڈیزائن بنائیں",
    "mood.empty": "بورڈ خالی ہے",
    "mood.saved": "بورڈ محفوظ",
    "common.edit": "ترمیم",
    "common.delete": "حذف",
    "common.share": "شیئر",
    "common.download": "ڈاؤنلوڈ",
    "common.prev": "پچھلا",
    "common.login": "لاگ ان",
    "common.logout": "لاگ آؤٹ",
    "common.profile": "پروفائل",
    "common.settings": "ترتیبات",
    "common.guest": "مہمان",
    "common.free": "مفت",
    "common.premium": "پریمیم",
    "common.required": "ضروری",
    "common.optional": "اختیاری",
    "common.success": "آپریشن کامیاب",
    "common.failed": "آپریشن ناکام",
    "common.sar": "ریال",
    "common.credits": "کریڈٹ",
    "common.buy_credits": "کریڈٹ خریدیں",
    "common.insufficient_credits": "ناکافی کریڈٹ",
    "common.view_all": "سب دیکھیں",
    "common.see_more": "مزید دیکھیں",
    "common.back_home": "ہوم پر واپس",
    "studio.consult": "انج. الیازیہ سے مشورہ",
    "studio.elements_done": "عناصر مکمل",
    "studio.choose_project": "اپنا پروجیکٹ منتخب کریں",
    "studio.choose_project_desc": "پروجیکٹ اور کمرہ منتخب کریں",
    "studio.no_projects": "ابھی کوئی پروجیکٹ نہیں",
    "studio.create_project": "نیا پروجیکٹ بنائیں",
    "studio.room_area": "کمرہ اور رقبہ",
    "studio.area_m2": "رقبہ (م²)",
    "studio.next_identity": "اگلہ: بصری شناخت سیٹ کریں",
    "studio.visual_identity_desc": "یہ شناخت تمام عناصر پر لاگو ہوگی",
    "studio.design_style": "ڈیزائن سٹائل",
    "studio.total_budget": "کل بجٹ",
    "studio.identity_details": "بصری شناخت کی تفصیل",
    "studio.customized": "کسٹمائزڈ",
    "studio.reset_default": "ڈیفالٹ پر ریسیٹ",
    "studio.start_design": "ڈیزائن شروع کریں",
    "studio.design_details": "ڈیزائن کی تفصیل",
    "studio.element_designed_success": "ڈیزائن کامیابی سے مکمل",
    "studio.overall_progress": "ڈیزائن کی مجموعی پیشرفت",
    "studio.room_hall": "ہال",
    "studio.redesign": "نئی شناخت کے ساتھ ڈیزائن",
    "studio.redesigning": "ڈیزائن ہو رہا ہے...",
    "studio.design_me": "ڈیزائن کریں انج. الیازیہ",
    "studio.perspective_generated": "منظر تیار ہو گیا",
    "studio.generate_new_perspective": "نیا منظر بنائیں",
    "studio.generating_perspective": "تیار ہو رہا ہے...",
    "studio.generate_full_perspective": "مکمل منظر بنائیں",
    "studio.perspective_generating": "انج. الیازیہ منظر بنا رہی ہیں...",
    "studio.min_elements_warning": "بہتر نتیجے کے لیے پہلے کم از کم 3 عناصر ڈیزائن کریں",
    "studio.prev_step": "← پچھلا",
    "studio.next_step": "اگلہ →",
    "studio.designed_badge": "✓ ڈیزائن",
    "studio.sarah_tips": "انج. الیازیہ کے مشورے",
    "studio.applied_identity": "اس عنصر پر لاگو بصری شناخت",
    "studio.primary_color": "بنیادی",
    "studio.secondary_color": "ثانوی",
    "studio.accent_color": "ایکسینٹ",
    "studio.identity_warning": "بصری شناخت کیوں ضروری ہے؟",
    "studio.design_concept": "ڈیزائن ایڈییہ",
    "studio.harmony_note": "ہماہنگی",
    "studio.cost_range": "لاگت کی سیما",
    "studio.products": "مصنوعات",
    "studio.color_palette": "رنگ پیلیٹ",
    "studio.installation_steps": "نصب کے مراحل",
    "studio.professional_notes": "پیشہ ورانہ نوٹس",
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
    // ===== Missing keys =====
    "quick.capture.angle": "Angle",
    "quick.capture.cameraError": "Impossible d'accéder à la caméra.",
    "quick.capture.noVideo": "Aucune vidéo enregistrée",
    "quick.capture.uploadVideo": "Télécharger une vidéo",
    "smart.capture.zoom": "Zoom",
    "ui.add": "Ajouter",
    "ui.colorName": "Nom de la couleur",
    "ui.editColor": "Modifier la couleur",

    // ===== New translations added =====
    "analyze.analyze": "Analyser",
    "analyze.results": "Résultats d'Analyse",
    "analyze.title": "Analyse de l'Espace",
    "analyze.upload": "Télécharger Photo",
    "ar.subtitle": "Scannez votre espace en réalité augmentée",
    "ar.title": "Scan AR",
    "auth.gate.btn": "Se Connecter",
    "auth.gate.subtitle": "Cette fonctionnalité nécessite une connexion",
    "auth.gate.title": "Connectez-vous pour continuer",
    "costs.subtitle": "Calculez le coût de votre projet de design",
    "costs.title": "Calculateur de Coûts",
    "credit.badge.balance": "Solde",
    "credit.badge.buy": "Acheter",
    "credits.buyMore": "Acheter des Crédits",
    "credits.costLabel": "Coût",
    "credits.deductedMsg": "Déduit",
    "credits.insufficientMsg": "Votre solde actuel est insuffisant pour cette opération",
    "credits.perOperation": "crédits par opération",
    "credits.title": "Crédits",
    "credits.yourBalance": "Votre Solde Actuel",
    "error.apology": "Ing. Alyazia s'excuse pour ce problème temporaire. Veuillez recharger la page pour continuer.",
    "error.details": "Détails de l'Erreur (Développeurs Uniquement)",
    "error.reload": "Recharger la Page",
    "error.unexpected": "Désolé, une erreur inattendue s'est produite",
    "home.hero.badge": "Propulsé par l'IA",
    "home.hero.facades": "Façades",
    "home.hero.interior": "Intérieur",
    "home.hero.landscape": "Paysage",
    "home.hero.pools": "Piscines",
    "home.noProjects": "Pas encore de projets",
    "home.sections.title": "Choisissez votre Service",
    "home.startAnalysis": "Commencez votre première analyse",
    "ideas.page.area": "Surface",
    "ideas.page.budget": "Budget",
    "ideas.page.generate": "Générer des Idées",
    "ideas.page.generating": "Génération en cours...",
    "ideas.page.noResults": "Pas encore d'idées",
    "ideas.page.roomType": "Type de Pièce",
    "ideas.page.style": "Style",
    "ideas.page.subtitle": "Idées de design personnalisées pour votre espace",
    "ideas.page.title": "Idées de Design",
    "login.btn": "Se Connecter",
    "login.features.analyze": "Analyse d'espace par IA",
    "login.features.design": "Générer des designs professionnels",
    "login.features.save": "Sauvegarder et partager vos projets",
    "login.subtitle": "Connectez-vous pour commencer à concevoir",
    "login.title": "Bienvenue",
    "moodboard.addImage": "Ajouter une Image",
    "moodboard.export": "Exporter",
    "moodboard.generate": "Générer un Tableau",
    "moodboard.save": "Sauvegarder le Tableau",
    "moodboard.subtitle": "Rassemblez vos idées de design en un tableau",
    "moodboard.title": "Tableau d'Inspiration",
    "nav.designIdeas": "Idées de Design",
    "nav.furnitureStore": "Boutique Meubles",
    "nav.home": "Accueil",
    "nav.logout": "Se Déconnecter",
    "nav.myProjects": "Mes Projets",
    "nav.quickAnalyze": "Analyse Rapide",
    "nav.smartCapture": "Analyse Intelligente",
    "nav.voiceDesigner": "Dessin par Voix",
    "plan.subtitle": "Dessinez votre plan avec l'IA",
    "plan.title": "Conception du Plan",
    "project.detail.cost": "Coût",
    "project.detail.delete": "Supprimer le Projet",
    "project.detail.export": "Exporter PDF",
    "project.detail.materials": "Matériaux",
    "project.detail.overview": "Aperçu",
    "project.detail.palette": "Palette de Couleurs",
    "project.detail.share": "Partager",
    "project.detail.title": "Détails du Projet",
    "projects.analyzeNow": "Analyser Maintenant",
    "projects.deleteConfirm": "Voulez-vous supprimer ce projet?",
    "projects.deleted": "Projet supprimé",
    "projects.myProjects": "Mes Projets",
    "projects.noProjects": "Pas encore de projets",
    "projects.startFirst": "Commencez par analyser votre premier espace",
    "projects.type.quick": "Analyse Rapide",
    "projects.type.smart": "Analyse Intelligente",
    "projects.type.voice": "Dessin par Voix",
    "quick.analyze.btn": "Analyser Maintenant",
    "quick.analyzing": "Analyse en cours...",
    "quick.analyzing.subtitle": "Ing. Alyazia analyse l'espace et suggère le design idéal",
    "quick.budget.custom": "Personnalisé",
    "quick.budget.economy": "Économique",
    "quick.budget.from": "De",
    "quick.budget.medium": "Moyen",
    "quick.budget.premium": "Premium",
    "quick.budget.title": "Budget",
    "quick.budget.to": "À",
    "quick.capture.fromGallery": "Depuis la Galerie",
    "quick.capture.multi.title": "Capturez les Photos de l'Espace",
    "quick.capture.nextStyle": "Suivant — Choisir le Style",
    "quick.capture.noImage": "Aucune image ajoutée",
    "quick.capture.note.label": "Ajoutez une note ou description pour le design souhaité",
    "quick.capture.note.optional": "(optionnel)",
    "quick.capture.note.placeholder": "Exemple: Je veux changer les meubles par un canapé L-shape...",
    "quick.capture.openCamera": "Ouvrir la Caméra",
    "quick.capture.title": "Capturez la Photo de la Pièce",
    "quick.mode.multi": "Photos Multiples",
    "quick.mode.multi.desc": "Capturez tous les angles (jusqu'à 6 photos)",
    "quick.mode.panorama": "Panorama",
    "quick.mode.panorama.desc": "Photo panoramique de toute la pièce",
    "quick.mode.single": "Photo Unique",
    "quick.mode.single.desc": "Capturez la pièce sous un angle",
    "quick.mode.subtitle": "Choisissez comment capturer l'espace",
    "quick.mode.title": "Comment voulez-vous capturer?",
    "quick.mode.video": "Vidéo",
    "quick.mode.video.desc": "Enregistrez une vidéo de la pièce (30 sec max)",
    "quick.result.chat": "Discuter avec Ing. Alyazia",
    "quick.result.copied": "Copié",
    "quick.result.copy": "Copier l'Analyse",
    "quick.result.cost": "Coût Estimé",
    "quick.result.export": "Exporter PDF",
    "quick.result.generate": "Générer une Visualisation",
    "quick.result.generating": "Génération en cours...",
    "quick.result.newAnalysis": "Nouvelle Analyse",
    "quick.result.overview": "Analyse et Recommandations",
    "quick.result.palette": "Palette de Couleurs",
    "quick.result.reanalyze": "Ré-analyser avec les Modifications",
    "quick.result.suggestions": "Suggestions de Design",
    "quick.style.classic": "Classique",
    "quick.style.gulf": "Golfe",
    "quick.style.japanese": "Japonais",
    "quick.style.luxury": "Luxueux",
    "quick.style.minimal": "Minimaliste",
    "quick.style.modern": "Moderne",
    "quick.style.moroccan": "Marocain",
    "quick.style.scandinavian": "Scandinave",
    "quick.style.subtitle": "Choisir le Style de Design",
    "quick.style.title": "Choisir le Style de Design",
    "quick.tip.label": "Conseil d'Ing. Alyazia",
    "quick.title": "Analyse Rapide",
    "sarah.chat.applyDesign": "Appliquer ce Design",
    "sarah.chat.attachImage": "Joindre une Image",
    "sarah.chat.creditPerMsg": "20 crédits par message",
    "sarah.chat.generateImage": "Générer une Image",
    "sarah.chat.modifiedDesign": "Design Modifié",
    "sarah.chat.placeholder": "Demandez à Ing. Alyazia sur le design...",
    "sarah.chat.send": "Envoyer",
    "sarah.chat.subtitle": "Experte en Design Architectural",
    "sarah.chat.tapToGenerate": "Appuyez pour générer une image avec la réponse",
    "sarah.chat.thinking": "Ing. Alyazia réfléchit...",
    "sarah.chat.title": "Ing. Alyazia",
    "sarah.chat.willGenerate": "Une image sera générée avec les modifications",
    "scanner.back": "Arrière",
    "scanner.backDesc": "Retournez-vous à 180°",
    "scanner.backWall": "Mur Arrière",
    "scanner.cameraError": "Impossible d'accéder à la caméra. Assurez-vous d'accorder la permission.",
    "scanner.ceiling": "Plafond",
    "scanner.ceilingDesc": "Pointez la caméra vers le haut",
    "scanner.corner": "Coin de la Pièce",
    "scanner.corner.dir": "Coin",
    "scanner.cornerDesc": "Capturez un coin joignant deux murs",
    "scanner.down": "Bas",
    "scanner.floor": "Sol",
    "scanner.floorDesc": "Pointez la caméra vers le bas",
    "scanner.forward": "Avant",
    "scanner.frontDesc": "Pointez la caméra vers l'avant",
    "scanner.frontWall": "Mur Avant",
    "scanner.left": "Gauche",
    "scanner.leftDesc": "Tournez à gauche de 90°",
    "scanner.leftWall": "Mur Gauche",
    "scanner.right": "Droite",
    "scanner.rightDesc": "Tournez à droite de 90°",
    "scanner.rightWall": "Mur Droit",
    "scanner.up": "Haut",
    "smart.capture.advantages": "Avantages du Design",
    "smart.capture.analyzeBtn": "Analyser la Photo",
    "smart.capture.analyzing": "Analyse en cours...",
    "smart.capture.boq": "Devis Quantitatif (BOQ)",
    "smart.capture.buyFromBonyan": "Acheter ce Décor chez Bonyan",
    "smart.capture.changeStyle": "Changer le Style",
    "smart.capture.cost": "Coût Estimé",
    "smart.capture.download": "Télécharger l'Image",
    "smart.capture.duration": "Durée d'Exécution",
    "smart.capture.error": "Une erreur s'est produite, veuillez réessayer",
    "smart.capture.exportPdf": "Exporter le Livre de Design (PDF)",
    "smart.capture.furniture": "Mobilier Suggéré",
    "smart.capture.generateIdeas": "Générer des Idées de Design",
    "smart.capture.materials": "Matériaux et Finitions",
    "smart.capture.noResults": "Pas encore de résultats",
    "smart.capture.overview": "Évaluation Générale",
    "smart.capture.palette": "Palette de Couleurs",
    "smart.capture.refine": "Affiner le Design",
    "smart.capture.regenerate": "Régénérer",
    "smart.capture.results": "Résultats d'Analyse",
    "smart.capture.roomType": "Type de Pièce",
    "smart.capture.share": "Partager",
    "smart.capture.style": "Style Suggéré",
    "smart.capture.styleType": "Style Souhaité",
    "smart.capture.title": "Analyse Intelligente",
    "smart.capture.upload": "Appuyez pour télécharger ou prendre une photo",
    "store.addToCart": "Ajouter au Panier",
    "store.comingSoon": "Bientôt Disponible",
    "store.filter.all": "Tout",
    "store.filter.bed": "Chambres",
    "store.filter.dining": "Tables à Manger",
    "store.filter.office": "Bureaux",
    "store.filter.outdoor": "Extérieur",
    "store.filter.sofa": "Canapés",
    "store.noResults": "Aucun produit trouvé",
    "store.search": "Rechercher des meubles...",
    "store.subtitle": "Vrais meubles de magasins locaux",
    "store.title": "Boutique Meubles",
    "store.viewProduct": "Voir le Produit",
    "studio.description": "Description du Design",
    "studio.generate": "Générer le Design",
    "studio.generating": "Génération en cours...",
    "studio.result": "Résultat du Design",
    "studio.roomType": "Type de Pièce",
    "studio.style": "Style",
    "studio.subtitle": "Concevez votre espace avec l'IA",
    "studio.title": "Studio de Design",
    "ui.all": "Tout",
    "ui.back": "Retour",
    "ui.beta": "Bêta",
    "ui.cancel": "Annuler",
    "ui.close": "Fermer",
    "ui.comingSoon": "Bientôt Disponible",
    "ui.confirm": "Confirmer",
    "ui.currency.aed": "AED",
    "ui.currency.sar": "SAR",
    "ui.currency.usd": "USD",
    "ui.done": "Terminé",
    "ui.error": "Une erreur s'est produite",
    "ui.estimated": "Estimé",
    "ui.filter": "Filtrer",
    "ui.loading": "Chargement...",
    "ui.months": "mois",
    "ui.new": "Nouveau",
    "ui.next": "Suivant",
    "ui.no": "Non",
    "ui.retry": "Réessayer",
    "ui.save": "Enregistrer",
    "ui.search": "Rechercher",
    "ui.sort": "Trier",
    "ui.weeks": "semaines",
    "ui.yes": "Oui",
    "urban.subtitle": "Concevoir des espaces urbains et publics",
    "urban.title": "Design Urbain",
    "voice.page.ac": "climatisation",
    "voice.page.addRoom": "Ajouter une Pièce",
    "voice.page.clear": "Tout Effacer",
    "voice.page.dimensions": "Dimensions",
    "voice.page.door": "porte",
    "voice.page.doors": "Portes",
    "voice.page.electricity": "électricité",
    "voice.page.export": "Exporter",
    "voice.page.exportPlan": "Exporter le Plan",
    "voice.page.furniture": "Mobilier",
    "voice.page.generate3D": "Générer Rendu 3D",
    "voice.page.generating3D": "Génération du rendu...",
    "voice.page.listening": "Écoute en cours...",
    "voice.page.processing": "Traitement en cours...",
    "voice.page.renderResult": "Résultat du Rendu",
    "voice.page.room": "pièce",
    "voice.page.rooms": "Pièces",
    "voice.page.selected": "Sélectionné",
    "voice.page.stairs": "Escaliers",
    "voice.page.startDrawing": "Commencer à Dessiner",
    "voice.page.subtitle": "Décrivez votre espace et Alyazia dessine le plan",
    "voice.page.title": "Dessin par Voix",
    "voice.page.undo": "Annuler",
    "voice.page.voiceInput": "Entrée Vocale",
    "voice.page.wall": "mur",
    "voice.page.walls": "Murs",
    "voice.page.window": "fenêtre",
    "voice.page.windows": "Fenêtres",
    "sc.analyzeFrame": "Analyser le cadre",
    "sc.designImage": "Image de design",
    "sc.colorPalette": "Palette de couleurs",
    "sc.materials": "Matériaux suggérés",
    "sc.currentMaterials": "Matériaux actuels",
    "sc.structuralSuggestions": "Suggestions structurelles",
    "sc.noProducts": "Aucun produit trouvé",
    "sc.designFeatures": "Caractéristiques du design",
    "sc.alyaziaFeatures": "Ing. Alyazia | Caractéristiques",
    "sc.searchingBinyan": "Recherche dans les magasins Binyan...",
    "sc.designLimits": "Limites du design:",
    "sc.perspective": "Perspective:",
    "sc.untouched": "Intouché:",
    "sc.benefit": "Avantage:",
    "sc.level": "Niveau:",
    "sc.treatment": "Traitement:",
    "sc.reason": "Raison:",
    "sc.specialist": "Spécialiste:",
    "sc.direction": "Direction:",
    "sc.zoom": "Zoom:",
    "sc.currentDesign": "Design actuel",
    "projects.new": "Nouveau projet",
    "projects.start": "Commencez votre premier projet",
    "ui.delete": "Supprimer",
    "ui.edit": "Modifier",
    "ui.download": "Télécharger",
    "ui.share": "Partager",
    "ui.copy": "Copier",
    "ui.copied": "Copié!",
    "ui.success": "Succès",
    "ui.loading2": "Chargement en cours",
    "studio.chooseStyle": "Choisir le style",
    "studio.room": "Pièce",
    "studio.chooseRoom": "Choisir la pièce",
    "studio.budget": "Budget",
    "studio.descPlaceholder": "Ajoutez une description du design souhaité",
    "voice.design.title": "Design vocal",
    "voice.pressToSpeak": "Appuyez pour parler",
    "voice.listening2": "Écoute en cours...",
    "ar.scanSpace": "Scanner l'espace",
    "ar.startScan": "Démarrer le scan",
    "ar.stopScan": "Arrêter le scan",
    "ar.scanning": "Scan en cours...",
    "ideas.category": "Catégorie",
    "store.addToProject": "Ajouter au projet",
    "store.price": "Prix",
    "store.vendor": "Magasin",
    "mood.title": "Tableau d'humeur",
    "mood.addImage": "Ajouter une image",
    "mood.create": "Créer un tableau",
    "costs.area": "Surface",
    "costs.level": "Niveau",
    "costs.calculate": "Calculer le coût",
    "costs.total": "Coût total",
    "ui.wait": "Veuillez patienter",
    "ui.errorOccurred": "Une erreur s'est produite",
    "ui.prev": "Précédent",
    "ui.viewAll": "Voir tout",
    "ui.more": "Plus",
    "ui.less": "Moins",
    "ui.ok": "OK",
    "ui.start": "Commencer",
    "ui.reset": "Réinitialiser",
    "ui.uploadImage": "Télécharger une image",
    "ui.capturePhoto": "Prendre une photo",
    "ui.chooseImage": "Choisir une image",
    "ui.preview": "Aperçu",
    "ui.details": "Détails",
    "ui.description": "Description",
    "projects.name": "Nom du projet",
    "projects.roomType": "Type de pièce",
    "projects.createdAt": "Date de création",
    "projects.updatedAt": "Dernière mise à jour",
    "projects.confirmDelete": "Confirmer la suppression",
    "home.planDesign.title": "Concevoir depuis le plan",
    "home.planDesign.desc": "Téléchargez votre plan et obtenez un design",
    "chat.analysisError": "Erreur d'analyse d'image",
    "chat.expert.title": "Ing. Alyazia - Expert en design",
    "chat.imageError": "Erreur de téléchargement d'image",
    "chat.imageUploaded": "Image téléchargée avec succès",
    "chat.linkProject": "Lier à un projet",
    "chat.loginRequired": "Connexion requise",
    "chat.noProject": "Aucun projet sélectionné",
    "chat.quickQuestion": "Question rapide",
    "chat.sendError": "Erreur d'envoi",
    "chat.session.element": "Élément spécifique",
    "chat.session.element.desc": "Discuter d'un élément de design spécifique",
    "chat.session.floorPlan": "Plan d'étage",
    "chat.session.floorPlan.desc": "Analyser et modifier le plan d'étage",
    "chat.session.general": "Chat général",
    "chat.session.general.desc": "Consultation générale avec Ing. Alyazia",
    "chat.session.scan360": "Scan 360°",
    "chat.session.scan360.desc": "Analyser le scan complet de la pièce",
    "chat.welcome.subtitle": "Posez-moi des questions sur le design intérieur",
    "chat.welcome.title": "Bonjour! Je suis Ing. Alyazia",
    "credit.balance": "Solde",
    "credit.buy": "Acheter des crédits",
    "credit.empty": "Votre solde est vide",
    "credit.hello": "Bonjour",
    "credit.link": "Lier le compte",
    "credit.linkDesc": "Liez votre compte pour obtenir des crédits gratuits",
    "credit.linkTitle": "Obtenir des crédits gratuits",
    "credit.login": "Connexion",
    "credit.loginDesc": "Connectez-vous pour obtenir des crédits gratuits",
    "credit.loginTitle": "Connectez-vous maintenant",
    "credit.low": "Solde faible",
    "credit.refresh": "Actualiser le solde",
    "credit.yourBalance": "Votre solde",
    "voice.commands.title": "Commandes vocales",
    "voice.help": "Aide",
    "voice.hint1": "Dites ouvrir l'analyse pour aller à l'analyse",
    "voice.hint2": "Dites ouvrir le studio pour aller au studio",
    "voice.hint3": "Dites ouvrir les projets pour aller aux projets",
    "voice.hint4": "Dites ouvrir le chat pour aller au chat",
    "voice.hint5": "Dites ouvrir les coûts pour aller aux coûts",
    "voice.openAR": "Ouvrir le scan AR",
    "voice.openAnalyze": "Ouvrir l'analyse",
    "voice.openChat": "Ouvrir le chat",
    "voice.openCosts": "Ouvrir les coûts",
    "voice.openMoodboard": "Ouvrir le tableau d'humeur",
    "voice.openProjects": "Ouvrir les projets",
    "voice.openStudio": "Ouvrir le studio",
    "voice.startListening": "Commencer à écouter",
    "voice.stop": "Arrêter",
    "voice.stopListening": "Arrêter d'écouter",
    "studio.login_required": "Veuillez vous connecter pour accéder au Studio de Design",
    "studio.back_home": "Retour à l'accueil",
    "studio.step_project": "Projet",
    "studio.step_identity": "Identité Visuelle",
    "studio.step_floors": "Sols",
    "studio.step_walls": "Murs",
    "studio.step_ceilings": "Plafonds",
    "studio.step_doors": "Portes et Fenêtres",
    "studio.step_lighting": "Éclairage",
    "studio.step_furniture": "Mobilier",
    "studio.step_perspective": "Perspective Complète",
    "studio.style_modern": "Moderne",
    "studio.style_gulf": "Classique du Golfe",
    "studio.style_classic": "Classique Luxueux",
    "studio.style_minimal": "Minimaliste",
    "studio.style_japanese": "Zen Japonais",
    "studio.style_scandinavian": "Scandinave",
    "studio.style_mediterranean": "Méditerranéen",
    "studio.style_industrial": "Industriel",
    "studio.style_moroccan": "Marocain",
    "studio.style_luxury": "Luxe Premium",
    "studio.budget_economic": "Économique",
    "studio.budget_medium": "Moyen",
    "studio.budget_luxury": "Luxueux",
    "studio.budget_premium": "Premium",
    "studio.select_project": "Sélectionner un Projet",
    "studio.new_project": "Nouveau Projet",
    "studio.select_room": "Sélectionner la Pièce",
    "studio.design_element": "Concevoir Cet Élément",
    "studio.generate_perspective": "Générer la Perspective Complète",
    "studio.select_project_first": "Veuillez d'abord sélectionner un projet",
    "studio.design_success": "Design complété avec une harmonie complète!",
    "studio.design_error": "Une erreur s'est produite lors du design",
    "studio.perspective_success": "Perspective complète générée!",
    "studio.perspective_error": "Erreur lors de la génération",
    "studio.room_living": "Salon",
    "studio.room_master": "Chambre Principale",
    "studio.room_bedroom": "Chambre",
    "studio.room_kitchen": "Cuisine",
    "studio.room_bathroom": "Salle de Bain",
    "studio.room_office": "Bureau",
    "studio.room_dining": "Salle à Manger",
    "studio.room_kids": "Chambre d'Enfants",
    "studio.room_majlis": "Salon de Réception",
    "studio.room_entrance": "Entrée",
    "studio.visual_identity": "Identité Visuelle",
    "studio.select_style": "Sélectionner le Style",
    "studio.select_budget": "Sélectionner le Budget",
    "studio.next": "Suivant",
    "studio.prev": "Précédent",
    "studio.designing": "Conception en cours...",
    "studio.progress": "Progression",
    "studio.completed": "Terminé",
    "studio.projects_link": "Mes Projets",
    "studio.chat_link": "Consulter Ing. Alyazia",
    "voice.start": "Démarrer l'Enregistrement",
    "voice.generating": "Génération du design...",
    "voice.result": "Résultat du Design",
    "voice.try_again": "Réessayer",
    "voice.save": "Enregistrer le Design",
    "voice.saved": "Enregistré avec succès",
    "voice.error_mic": "Impossible d'accéder au microphone",
    "voice.error_process": "Une erreur s'est produite lors du traitement",
    "voice.placeholder": "Appuyez sur le microphone et décrivez votre espace...",
    "voice.login_required": "Veuillez vous connecter pour utiliser cette fonctionnalité",
    "sc.title": "Analyse Intelligente",
    "sc.upload_photo": "Télécharger une Photo",
    "sc.take_photo": "Prendre une Photo",
    "sc.analyzing": "Analyse en cours...",
    "sc.analysis_result": "Résultat de l'Analyse",
    "sc.design_suggestion": "Suggestion de Design",
    "sc.save_result": "Enregistrer le Résultat",
    "sc.new_analysis": "Nouvelle Analyse",
    "sc.no_image": "Veuillez d'abord télécharger une image",
    "sc.error": "Une erreur s'est produite lors de l'analyse",
    "sc.scan_title": "Scan AR",
    "sc.scan_subtitle": "Scannez l'espace avec votre caméra",
    "sc.scan_start": "Démarrer le Scan",
    "sc.scan_stop": "Arrêter le Scan",
    "projects.empty_desc": "Commencez par créer votre premier projet",
    "projects.type": "Type de Projet",
    "projects.delete_confirm": "Êtes-vous sûr de vouloir supprimer ce projet?",
    "projects.created": "Projet créé",
    "projects.open": "Ouvrir le Projet",
    "projects.designs": "Designs",
    "projects.last_updated": "Dernière Mise à Jour",
    "projects.login_required": "Veuillez vous connecter pour voir vos projets",
    "projects.loading": "Chargement des projets...",
    "projects.error": "Erreur lors du chargement des projets",
    "furniture.title": "Boutique Meubles",
    "furniture.subtitle": "Vrais meubles de magasins locaux",
    "furniture.search": "Rechercher des meubles...",
    "furniture.filter": "Filtrer",
    "furniture.category": "Catégorie",
    "furniture.price": "Prix",
    "furniture.add_to_project": "Ajouter au Projet",
    "furniture.view_details": "Voir les Détails",
    "furniture.no_results": "Aucun résultat trouvé",
    "furniture.loading": "Chargement...",
    "furniture.beta_notice": "Cette fonctionnalité est en bêta",
    "furniture.sofa": "Canapé",
    "furniture.bed": "Lit",
    "furniture.table": "Table",
    "furniture.chair": "Chaise",
    "furniture.wardrobe": "Armoire",
    "mood.subtitle": "Rassemblez votre inspiration sur un tableau",
    "mood.add_image": "Ajouter une Image",
    "mood.add_color": "Ajouter une Couleur",
    "mood.save": "Enregistrer le Tableau",
    "mood.clear": "Effacer le Tableau",
    "mood.generate": "Générer un Design depuis le Tableau",
    "mood.empty": "Le tableau est vide",
    "mood.saved": "Tableau enregistré",
    "common.edit": "Modifier",
    "common.delete": "Supprimer",
    "common.share": "Partager",
    "common.download": "Télécharger",
    "common.prev": "Précédent",
    "common.login": "Se Connecter",
    "common.logout": "Se Déconnecter",
    "common.profile": "Profil",
    "common.settings": "Paramètres",
    "common.guest": "Invité",
    "common.free": "Gratuit",
    "common.premium": "Premium",
    "common.required": "Requis",
    "common.optional": "Optionnel",
    "common.success": "Opération réussie",
    "common.failed": "Opération échouée",
    "common.sar": "SAR",
    "common.credits": "Crédits",
    "common.buy_credits": "Acheter des Crédits",
    "common.insufficient_credits": "Crédits insuffisants",
    "common.view_all": "Voir Tout",
    "common.see_more": "Voir Plus",
    "common.back_home": "Retour à l'accueil",
    "studio.consult": "Consulter Ing. Alyazia",
    "studio.elements_done": "éléments terminés",
    "studio.choose_project": "Choisissez votre projet",
    "studio.choose_project_desc": "Sélectionnez le projet et la pièce à concevoir",
    "studio.no_projects": "Pas encore de projets",
    "studio.create_project": "Créer un nouveau projet",
    "studio.room_area": "Pièce et superficie",
    "studio.area_m2": "Superficie (m²)",
    "studio.next_identity": "Suivant: Définir l'identité visuelle",
    "studio.visual_identity_desc": "Cette identité sera appliquée à tous les éléments de conception",
    "studio.design_style": "Style de design",
    "studio.total_budget": "Budget total",
    "studio.identity_details": "Détails de l'identité visuelle",
    "studio.customized": "Personnalisée",
    "studio.reset_default": "Réinitialiser par défaut",
    "studio.start_design": "Commencer la conception",
    "studio.design_details": "Détails du design",
    "studio.element_designed_success": "Conception terminée avec succès",
    "studio.overall_progress": "Progression globale du design",
    "studio.room_hall": "Hall",
    "studio.redesign": "Reconcevoir avec une identité différente",
    "studio.redesigning": "Reconception en cours...",
    "studio.design_me": "Concevez, Ing. Alyazia",
    "studio.perspective_generated": "Perspective générée",
    "studio.generate_new_perspective": "Générer une nouvelle perspective",
    "studio.generating_perspective": "Génération en cours...",
    "studio.generate_full_perspective": "Générer la perspective complète",
    "studio.perspective_generating": "Ing. Alyazia génère la perspective...",
    "studio.min_elements_warning": "Pour de meilleurs résultats, concevez au moins 3 éléments d'abord",
    "studio.prev_step": "← Précédent",
    "studio.next_step": "Suivant →",
    "studio.designed_badge": "✓ Conçu",
    "studio.sarah_tips": "Conseils d'Ing. Alyazia",
    "studio.applied_identity": "Identité visuelle appliquée à cet élément",
    "studio.primary_color": "Primaire",
    "studio.secondary_color": "Secondaire",
    "studio.accent_color": "Accent",
    "studio.identity_warning": "Pourquoi l'identité visuelle est-elle importante?",
    "studio.design_concept": "Concept de design",
    "studio.harmony_note": "Harmonie",
    "studio.cost_range": "Fourchette de coût",
    "studio.products": "Produits",
    "studio.color_palette": "Palette de couleurs",
    "studio.installation_steps": "Étapes d'installation",
    "studio.professional_notes": "Notes professionnelles",
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
