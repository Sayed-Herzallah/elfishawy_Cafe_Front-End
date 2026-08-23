import jsPDF from 'jspdf';
// ⚠️ ملاحظة مهمة: html2canvas القديمة (1.4.1) بتفشل مع ألوان Tailwind CSS v4 (oklch)
// وده كان سبب إن تصدير الـ PDF مش شغال خالص. html2canvas-pro بيدعم oklch/lab بالكامل.
import html2canvas from 'html2canvas-pro';

/**
 * تصدير أي عنصر HTML إلى ملف PDF احترافي (A4 متعدد الصفحات).
 * العربي والـ RTL بيطلعوا مظبوطين 100% لأن المحتوى بيتلقط كصورة عالية الدقة.
 *
 * @param element العنصر المطلوب تصديره
 * @param fileName اسم الملف بدون امتداد
 */
export const exportElementToPdf = async (
  element: HTMLElement,
  fileName: string
): Promise<void> => {
  let canvas: HTMLCanvasElement;
  try {
    // لقطة عالية الدقة للعنصر (2x عشان جودة الطباعة)
    canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      // نمرر أبعاد النافذة الحقيقية عشان الـ layout يتحسب صح
      windowWidth: element.scrollWidth || undefined,
      windowHeight: element.scrollHeight || undefined,
    });
  } catch (err) {
    console.error('html2canvas capture failed:', err);
    throw new Error('فشل تحويل التقرير لصورة. جرّب تاني أو استخدم تصدير CSV.');
  }

  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('التقرير فاضي أو لم يتم التقاطه بشكل صحيح.');
  }

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm
  const margin = 6;
  const imageWidth = pageWidth - margin * 2;
  const fullImageHeight = (canvas.height * imageWidth) / canvas.width;

  // لو المحتوى صفحة واحدة → رسمة مباشرة
  if (fullImageHeight <= pageHeight - margin * 2) {
    pdf.addImage(
      canvas.toDataURL('image/jpeg', 0.95),
      'JPEG',
      margin,
      margin,
      imageWidth,
      fullImageHeight
    );
  } else {
    // تقسيم المحتوى الطويل على صفحات A4 متعددة
    const sliceHeightPx = Math.floor((canvas.width * (pageHeight - margin * 2)) / imageWidth);
    let offsetY = 0;
    let pageIndex = 0;

    while (offsetY < canvas.height) {
      const sliceH = Math.min(sliceHeightPx, canvas.height - offsetY);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sliceH;

      const ctx = slice.getContext('2d');
      if (!ctx) break;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, slice.width, slice.height);
      ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      if (pageIndex > 0) pdf.addPage();
      pdf.addImage(
        slice.toDataURL('image/jpeg', 0.95),
        'JPEG',
        margin,
        margin,
        imageWidth,
        (sliceH * imageWidth) / canvas.width
      );

      offsetY += sliceH;
      pageIndex++;
    }
  }

  pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
};
