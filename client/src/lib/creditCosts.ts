export type CreditOperation =
  | "analyzePhoto"
  | "generateIdeas"
  | "applyStyle"
  | "refineDesign"
  | "generate3D"
  | "generatePlanDesign"
  | "generatePDF"
  | "voiceDesign";

export const CREDIT_COSTS: Record<CreditOperation, number> = {
  analyzePhoto: 20,
  generateIdeas: 20,
  applyStyle: 15,
  refineDesign: 15,
  generate3D: 25,
  generatePlanDesign: 20,
  generatePDF: 5,
  voiceDesign: 20,
};

export const CREDIT_COSTS_LABELS: { key: CreditOperation; label: string; cost: number }[] = [
  { key: "analyzePhoto", label: "تحليل صورة داخلية", cost: 20 },
  { key: "generateIdeas", label: "توليد أفكار تصميم", cost: 20 },
  { key: "applyStyle", label: "تغيير نمط التصميم", cost: 15 },
  { key: "refineDesign", label: "تحسين التصميم", cost: 15 },
  { key: "generate3D", label: "توليد رندر 3D", cost: 25 },
  { key: "generatePlanDesign", label: "تحليل مخطط المسقط", cost: 20 },
  { key: "generatePDF", label: "تصدير دفتر التصميم PDF", cost: 5 },
  { key: "voiceDesign", label: "تصميم صوتي بالذكاء الاصطناعي", cost: 20 },
];
