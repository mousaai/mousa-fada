import { useState } from "react";

const sections = [
  {
    id: "principles",
    title: "1. مبادئ التصميم",
    icon: "🎯",
  },
  {
    id: "costs",
    title: "2. جدول التكاليف الأساسية",
    icon: "📊",
  },
  {
    id: "volume",
    title: "3. معامل الحجم",
    icon: "📦",
  },
  {
    id: "session",
    title: "4. معامل التكرار اليومي",
    icon: "🔄",
  },
  {
    id: "formula",
    title: "5. صيغة الاحتساب",
    icon: "🧮",
  },
  {
    id: "packages",
    title: "6. باقات النقاط",
    icon: "💎",
  },
  {
    id: "special",
    title: "7. حالات خاصة",
    icon: "⭐",
  },
  {
    id: "comparison",
    title: "8. مقارنة النظامين",
    icon: "⚖️",
  },
];

export default function CreditsDoc() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8f5f0] font-sans">
      {/* Header */}
      <div className="bg-gradient-to-l from-[#8B6914] to-[#6B4F10] text-white py-10 px-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">🏛️</span>
                <span className="text-sm bg-white/20 rounded-full px-3 py-1">وثيقة تقنية داخلية</span>
              </div>
              <h1 className="text-3xl font-bold mb-1">نظام احتساب النقاط</h1>
              <p className="text-white/80 text-lg">منصة م. اليازية × Mousa.ai — الإصدار 1.0</p>
              <p className="text-white/60 text-sm mt-1">مارس 2026 | fada.mousa.ai</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition rounded-xl px-5 py-3 text-sm font-medium"
            >
              {copied ? "✅ تم النسخ!" : "🔗 نسخ الرابط"}
            </button>
          </div>

          {/* Quick nav */}
          <div className="flex flex-wrap gap-2 mt-6">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs bg-white/15 hover:bg-white/25 transition rounded-full px-3 py-1"
              >
                {s.icon} {s.title.replace(/^\d+\.\s/, "")}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* 1. مبادئ التصميم */}
        <section id="principles" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            🎯 1. مبادئ التصميم
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: "⚙️",
                title: "نوع العملية",
                desc: "كل عملية AI لها تكلفة ثابتة تعكس الموارد الحسابية المستهلكة فعلياً. العمليات التي تستدعي نماذج متعددة (رؤية + نص + صورة) تُكلَّف أكثر.",
                color: "bg-amber-50 border-amber-200",
              },
              {
                icon: "📐",
                title: "الحجم",
                desc: "رفع صورة واحدة يختلف عن رفع 6 صور أو فيديو. الزيادة تدريجية لا خطية لتبقى الأسعار معقولة للمستخدم العادي.",
                color: "bg-blue-50 border-blue-200",
              },
              {
                icon: "🔁",
                title: "التكرار اليومي",
                desc: "المستخدم الذي يُجري 10 عمليات في اليوم يستهلك موارد أكثر. المعامل يُشجّع الاستخدام المعتدل ويحمي المنصة من الاستهلاك المفرط.",
                color: "bg-green-50 border-green-200",
              },
            ].map((p) => (
              <div key={p.title} className={`rounded-xl border p-4 ${p.color}`}>
                <div className="text-2xl mb-2">{p.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#f8f5f0] rounded-xl p-4 border border-[#e8dcc8]">
            <p className="text-sm text-gray-700 font-mono text-center font-bold">
              النقاط النهائية = التكلفة الأساسية × معامل الحجم × معامل التكرار
            </p>
          </div>
        </section>

        {/* 2. جدول التكاليف */}
        <section id="costs" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            📊 2. جدول التكاليف الأساسية
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#6B4F10] text-white">
                  <th className="text-right p-3 rounded-tr-lg">العملية</th>
                  <th className="text-right p-3">الوصف</th>
                  <th className="text-center p-3">الحالي</th>
                  <th className="text-center p-3 rounded-tl-lg">المقترح</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { op: "تحليل صورة واحدة", desc: "رؤية حاسوبية + تحليل معماري + BOQ", current: 20, proposed: 15, down: true },
                  { op: "تحليل + توليد أفكار (موحّد)", desc: "تحليل + 3-6 أفكار تصميمية", current: 20, proposed: 25, down: false },
                  { op: "توليد أفكار تصميمية", desc: "3-6 أفكار بدون تحليل جديد", current: 20, proposed: 20, down: null },
                  { op: "توليد صورة تصورية واحدة", desc: "رندر واقعي لفكرة واحدة", current: 20, proposed: 10, down: true },
                  { op: "تغيير النمط (Apply Style)", desc: "تطبيق نمط جديد على فكرة موجودة", current: 15, proposed: 8, down: true },
                  { op: "تحسين التصميم (Refine)", desc: "تحسين بالقلم أو التعليق", current: 15, proposed: 8, down: true },
                  { op: "تصميم صوتي", desc: "أمر صوتي → تحديث المخطط", current: 20, proposed: 12, down: true },
                  { op: "توليد رندر 3D", desc: "رندر ثلاثي الأبعاد من المسقط", current: 25, proposed: 30, down: false },
                  { op: "تحليل مسقط المخطط", desc: "استخراج بيانات من مخطط معماري", current: 20, proposed: 18, down: true },
                  { op: "تصدير PDF", desc: "تجميع التقرير وتصديره", current: 5, proposed: 3, down: true },
                  { op: "تحليل AR Scan", desc: "تحليل بيانات المسح ثلاثي الأبعاد", current: null, proposed: 20, down: null },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-3 font-medium text-gray-800">{row.op}</td>
                    <td className="p-3 text-gray-500 text-xs">{row.desc}</td>
                    <td className="p-3 text-center text-gray-400">
                      {row.current !== null ? `${row.current} ✦` : "—"}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center gap-1 font-bold px-2 py-1 rounded-full text-xs ${
                        row.down === true ? "bg-green-100 text-green-700" :
                        row.down === false ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {row.proposed} ✦
                        {row.down === true && " ↓"}
                        {row.down === false && " ↑"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-200 inline-block"></span> انخفاض (أرخص للمستخدم)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-200 inline-block"></span> ارتفاع (يعكس التكلفة الحقيقية)</span>
          </div>
        </section>

        {/* 3. معامل الحجم */}
        <section id="volume" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            📦 3. معامل الحجم (Volume Multiplier)
          </h2>
          <p className="text-sm text-gray-600 mb-4">عند رفع أكثر من صورة واحدة أو فيديو، تُضاف نقاط إضافية بشكل تدريجي:</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "صورة واحدة", mult: "×1.0", example: "15 ✦", color: "bg-gray-50 border-gray-200" },
              { label: "2-3 صور", mult: "×1.3", example: "20 ✦", color: "bg-yellow-50 border-yellow-200" },
              { label: "4-6 صور", mult: "×1.6", example: "24 ✦", color: "bg-orange-50 border-orange-200" },
              { label: "بانوراما", mult: "×1.4", example: "21 ✦", color: "bg-blue-50 border-blue-200" },
              { label: "فيديو 30 ث", mult: "×1.8", example: "27 ✦", color: "bg-purple-50 border-purple-200" },
            ].map((v) => (
              <div key={v.label} className={`rounded-xl border p-4 text-center ${v.color}`}>
                <div className="text-xl font-bold text-[#6B4F10]">{v.mult}</div>
                <div className="text-xs text-gray-600 mt-1">{v.label}</div>
                <div className="text-xs text-gray-400 mt-1">مثال: {v.example}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            💡 <strong>المبرر:</strong> كل صورة إضافية تعني استدعاءً إضافياً لنموذج الرؤية الحاسوبية. الزيادة التدريجية تجعل الأسعار معقولة للمستخدم العادي.
          </div>
        </section>

        {/* 4. معامل التكرار */}
        <section id="session" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            🔄 4. معامل التكرار اليومي (Session Multiplier)
          </h2>
          <p className="text-sm text-gray-600 mb-4">يُحسب عدد العمليات الناجحة للمستخدم في نفس اليوم الميلادي (00:00 - 23:59):</p>
          <div className="space-y-3">
            {[
              { range: "1 — 5 عمليات", mult: "×1.0", label: "استخدام عادي", color: "bg-green-500", width: "20%" },
              { range: "6 — 10 عمليات", mult: "×1.2", label: "استخدام متوسط", color: "bg-yellow-500", width: "45%" },
              { range: "11 — 20 عملية", mult: "×1.5", label: "استخدام مكثّف", color: "bg-orange-500", width: "70%" },
              { range: "أكثر من 20 عملية", mult: "×2.0", label: "استخدام مفرط", color: "bg-red-500", width: "100%" },
            ].map((s) => (
              <div key={s.range} className="flex items-center gap-4">
                <div className="w-36 text-sm text-gray-600 shrink-0">{s.range}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full ${s.color} rounded-full flex items-center justify-end pr-3 transition-all`}
                    style={{ width: s.width }}
                  >
                    <span className="text-white text-xs font-bold">{s.mult}</span>
                  </div>
                </div>
                <div className="w-28 text-xs text-gray-500 shrink-0">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-800">
            ✅ <strong>تغيير مقترح:</strong> النظام الحالي يُضاعف من العملية الثانية. النظام المقترح يمنح المستخدم <strong>5 عمليات مجانية بدون زيادة</strong> قبل أن يبدأ معامل التكرار.
          </div>
        </section>

        {/* 5. صيغة الاحتساب */}
        <section id="formula" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            🧮 5. أمثلة عملية على الاحتساب
          </h2>
          <div className="space-y-3">
            {[
              { scenario: "مستخدم يرفع صورة واحدة للمرة الأولى اليوم", calc: "15 × 1.0 × 1.0", result: 15, color: "bg-green-50 border-green-200" },
              { scenario: "مستخدم يرفع 4 صور للمرة الثالثة اليوم", calc: "15 × 1.6 × 1.0", result: 24, color: "bg-blue-50 border-blue-200" },
              { scenario: "مستخدم يولّد رندر 3D للمرة الثامنة اليوم", calc: "30 × 1.0 × 1.2", result: 36, color: "bg-orange-50 border-orange-200" },
              { scenario: "مستخدم يرفع فيديو للمرة الخامسة عشرة اليوم", calc: "15 × 1.8 × 1.5", result: 41, color: "bg-red-50 border-red-200" },
              { scenario: "تصدير PDF بأي وقت", calc: "3 × 1.0 × 1.0", result: 3, color: "bg-gray-50 border-gray-200" },
            ].map((ex, i) => (
              <div key={i} className={`rounded-xl border p-4 flex items-center justify-between gap-4 ${ex.color}`}>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{ex.scenario}</p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{ex.calc}</p>
                </div>
                <div className="text-2xl font-bold text-[#6B4F10] shrink-0">{ex.result} ✦</div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. باقات النقاط */}
        <section id="packages" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            💎 6. باقات النقاط المقترحة
          </h2>
          <div className="grid md:grid-cols-5 gap-4">
            {[
              { name: "تجربة", points: 100, price: "10 د.إ", desc: "6 تحليلات أساسية", color: "border-gray-300 bg-gray-50", badge: "" },
              { name: "أساسية", points: 500, price: "40 د.إ", desc: "30 تحليلاً أو 15 تصميماً", color: "border-amber-300 bg-amber-50", badge: "" },
              { name: "احترافية", points: 1500, price: "100 د.إ", desc: "90 تحليلاً أو 50 تصميماً", color: "border-[#6B4F10] bg-[#f8f5f0] shadow-md", badge: "الأكثر طلباً" },
              { name: "مكتب", points: 5000, price: "300 د.إ", desc: "فريق 3-5 أشخاص", color: "border-blue-300 bg-blue-50", badge: "" },
              { name: "مؤسسي", points: 20000, price: "1,000 د.إ", desc: "مكتب هندسي كبير", color: "border-purple-300 bg-purple-50", badge: "" },
            ].map((pkg) => (
              <div key={pkg.name} className={`rounded-2xl border-2 p-5 text-center relative ${pkg.color}`}>
                {pkg.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6B4F10] text-white text-xs px-3 py-1 rounded-full">
                    {pkg.badge}
                  </div>
                )}
                <div className="text-lg font-bold text-gray-800 mb-1">{pkg.name}</div>
                <div className="text-3xl font-bold text-[#6B4F10]">{pkg.points.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mb-2">نقطة</div>
                <div className="text-xl font-bold text-gray-700 mb-1">{pkg.price}</div>
                <div className="text-xs text-gray-500">{pkg.desc}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#f8f5f0] border border-[#e8dcc8] rounded-xl p-3 text-sm text-gray-600">
            💡 سعر النقطة الواحدة: <strong>0.05 — 0.08 درهم</strong> حسب الباقة، وهو أقل بكثير من تكلفة استدعاء نماذج AI مباشرةً (GPT-4o Vision ≈ 0.3 درهم/صورة).
          </div>
        </section>

        {/* 7. حالات خاصة */}
        <section id="special" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            ⭐ 7. حالات خاصة واستثناءات
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-green-800 mb-2">✅ مجاني دائماً</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• عرض المشاريع المحفوظة</li>
                <li>• قراءة نتائج التحليل السابقة</li>
                <li>• تصفّح متجر الأثاث</li>
                <li>• المحادثة النصية (بدون توليد صور)</li>
              </ul>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-blue-800 mb-2">🔄 استرداد النقاط</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• ✅ خطأ من جانب المنصة → استرداد تلقائي</li>
                <li>• ❌ النتيجة لم تُعجب المستخدم → لا استرداد</li>
                <li>• ✅ انقطاع الشبكة → استرداد تلقائي</li>
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 mb-2">🎁 نقاط مكافأة</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• أول تسجيل دخول: <strong>50 ✦</strong></li>
                <li>• مشاركة مشروع: <strong>10 ✦</strong></li>
                <li>• إحالة مستخدم جديد: <strong>100 ✦</strong></li>
              </ul>
            </div>
          </div>
        </section>

        {/* 8. مقارنة */}
        <section id="comparison" className="bg-white rounded-2xl shadow-sm p-6 border border-[#e8dcc8]">
          <h2 className="text-xl font-bold text-[#6B4F10] mb-4 flex items-center gap-2">
            ⚖️ 8. مقارنة النظام الحالي بالمقترح
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-right p-3">المعيار</th>
                  <th className="text-center p-3 text-red-600">النظام الحالي</th>
                  <th className="text-center p-3 text-green-600">النظام المقترح</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["أقل تكلفة لعملية AI", "5 ✦ (PDF)", "3 ✦ (PDF)"],
                  ["تكلفة التحليل الأساسي", "20 ✦", "15 ✦"],
                  ["معامل التكرار يبدأ من", "العملية الثانية", "العملية السادسة"],
                  ["دعم معامل الحجم", "❌ لا", "✅ نعم"],
                  ["عمليات مجانية يومياً", "❌ لا", "✅ 5 عمليات بدون زيادة"],
                  ["أقصى معامل تكرار", "×2", "×2"],
                  ["وضوح للمستخدم", "متوسط", "عالٍ"],
                ].map(([criterion, current, proposed], i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    <td className="p-3 font-medium text-gray-700">{criterion}</td>
                    <td className="p-3 text-center text-red-600">{current}</td>
                    <td className="p-3 text-center text-green-600 font-medium">{proposed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400 pb-6">
          <p>وثيقة داخلية — منصة م. اليازية | fada.mousa.ai</p>
          <p className="mt-1">للتواصل: من خلال منصة Mousa.ai</p>
        </div>
      </div>
    </div>
  );
}
