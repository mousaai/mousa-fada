/**
 * رفع PDF إلى Supabase والحصول على URL حقيقي
 * Gemini 2.5 يدعم PDF مباشرة عبر file_url — لا حاجة لتحويله لصور
 */
import { nanoid } from "nanoid";
import { storagePut } from "./storage";

export interface PdfPage {
  pageNumber: number;
  imageUrl: string; // https:// URL
  isFloorPlan: boolean;
}

export interface PdfUploadResult {
  pdfUrl: string;    // URL الـ PDF المرفوع على Supabase
  isPdf: true;
}

/**
 * رفع PDF base64 إلى Supabase والحصول على URL حقيقي
 * يُعيد URL واحد للـ PDF بدلاً من صور منفصلة
 */
export async function uploadPdfToStorage(
  base64Pdf: string
): Promise<PdfUploadResult> {
  const buffer = Buffer.from(base64Pdf, "base64");
  const key = `plans/pdf-${nanoid()}.pdf`;
  const { url } = await storagePut(key, buffer, "application/pdf");
  return { pdfUrl: url, isPdf: true };
}

/**
 * للتوافق مع الكود القديم — يرفع PDF ويُعيد "صفحة" واحدة تمثل الـ PDF كاملاً
 */
export async function pdfToImages(
  base64Pdf: string,
  _maxPages = 8
): Promise<PdfPage[]> {
  const result = await uploadPdfToStorage(base64Pdf);
  return [{
    pageNumber: 1,
    imageUrl: result.pdfUrl,
    isFloorPlan: true,
  }];
}
