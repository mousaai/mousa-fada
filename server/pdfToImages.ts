/**
 * تحويل PDF إلى صور PNG باستخدام pdftoppm
 * يُستخدم لإرسال صفحات المخطط إلى Gemini كـ image_url
 */
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

export interface PdfPage {
  pageNumber: number;
  imageUrl: string; // https:// URL أو data: URL
  isFloorPlan: boolean; // هل تحتوي على مخطط معماري؟
}

/**
 * تحويل PDF base64 إلى قائمة صور مرفوعة على Supabase
 * يُعيد أول 8 صفحات كحد أقصى لتجنب التكلفة الزائدة
 */
export async function pdfToImages(
  base64Pdf: string,
  maxPages = 8
): Promise<PdfPage[]> {
  const tmpDir = path.join(os.tmpdir(), `pdf-${nanoid()}`);
  const pdfPath = path.join(tmpDir, "input.pdf");
  const outputPrefix = path.join(tmpDir, "page");

  try {
    // إنشاء مجلد مؤقت
    fs.mkdirSync(tmpDir, { recursive: true });

    // حفظ PDF
    const buffer = Buffer.from(base64Pdf, "base64");
    fs.writeFileSync(pdfPath, buffer);

    // تحويل PDF إلى صور PNG بدقة 150 DPI
    execSync(
      `pdftoppm -r 150 -png -l ${maxPages} "${pdfPath}" "${outputPrefix}"`,
      { timeout: 60000 }
    );

    // قراءة الصور المولّدة
    const files = fs
      .readdirSync(tmpDir)
      .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
      .sort();

    if (files.length === 0) {
      throw new Error("لم يتم توليد أي صور من PDF");
    }

    const pages: PdfPage[] = [];

    for (let i = 0; i < Math.min(files.length, maxPages); i++) {
      const file = files[i];
      const pageNum = i + 1;
      const imgPath = path.join(tmpDir, file);
      const imgBuffer = fs.readFileSync(imgPath);

      // رفع الصورة إلى Supabase
      const key = `plans/pdf-page-${nanoid()}-${pageNum}.png`;
      const { url } = await storagePut(key, imgBuffer, "image/png");

      pages.push({
        pageNumber: pageNum,
        imageUrl: url,
        isFloorPlan: true, // سيتم تحديده لاحقاً بالذكاء الاصطناعي
      });
    }

    return pages;
  } finally {
    // تنظيف الملفات المؤقتة
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // تجاهل أخطاء التنظيف
    }
  }
}
