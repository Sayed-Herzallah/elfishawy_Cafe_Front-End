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

/**
 * حالة مخزون المنتج (الجاهز للبيع) — منطق موحد بين POS والأدمن:
 * ✅ نافذ: inStock = false أو الرصيد ≤ 0.01
 * ✅ منخفض: فيه رصيد لكن وصل حد التنبيه الموحد
 */
export const PRODUCT_LOW_STOCK_THRESHOLD = 5;

export type ProductStockState = 'out' | 'low' | 'available';

interface ProductLike {
  inStock?: boolean;
  stockQuantity: number;
}

export const productStockState = (
  product: Pick<ProductLike, 'inStock' | 'stockQuantity'>
): ProductStockState => {
  if (product.inStock === false || isStockOut(product.stockQuantity)) return 'out';
  return isStockLow(product.stockQuantity, PRODUCT_LOW_STOCK_THRESHOLD) ? 'low' : 'available';
};
