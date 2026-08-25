/**
 * تصنيف حالة المخزون — منطق موحد لكل الصفحات
 * --------------------------------------------
 * ✅ نافذ عمليًا: الرصيد ≤ 0.01 من وحدته — بقايا الحسابات الكسرية
 *    (مثل 0.001 كيلو) لا تكفي لأي وحدة بيع فتُعتبر نافذة بدل "منخفض" المضلل.
 * ✅ منخفض: فيه رصيد لكن وصل حد الأمان.
 */

export const OUT_OF_STOCK_EPSILON = 0.01;

export const isStockOut = (quantity: number): boolean =>
  (Number(quantity) || 0) <= OUT_OF_STOCK_EPSILON;

export const isStockLow = (quantity: number, minLimit: number): boolean =>
  !isStockOut(quantity) && (Number(quantity) || 0) <= (Number(minLimit) || 0);
