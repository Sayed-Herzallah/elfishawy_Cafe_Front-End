import { productService, recipeService } from '../services/catalogService';
import { inventoryService } from '../services/opsService';

// Helper to convert units to base unit
export const toBase = (qty: number, unit: string): number => {
  const u = (unit || '').toUpperCase();
  if (u === 'KG') return qty * 1000;
  if (u === 'LITER') return qty * 1000;
  return qty; // GRAM, ML, PIECE
};

/**
 * ⚠️ تمت إزالة "الربط بالأسماء" نهائيًا — كان بيربط المنتج بأي خام اسمه قريب
 * (مثل: منتج "شاي" مع خام زبالة اسمه "00000شاي") وبيملّي أرصدة وهمية.
 * المزامنة دلولتً تعتمد على الوصفات فقط — لو الوصفة مكسورة (منتجها اتمسح)
 * يتم تخطيها بأمان بدون أي تحديث خاطئ.
 */

/**
 * Recalculate and update stockQuantity on the server for a specific product.
 * Sends the full product details (name, price, category) to pass backend validations.
 */
async function updateProductStockOnServer(product: any, newQty: number): Promise<boolean> {
  try {
    const fd = new FormData();
    fd.append('name', product.name);
    fd.append('price', String(product.price));

    const catId = typeof product.category === 'string'
      ? product.category
      : (product.category?._id || '');
    fd.append('category', catId);

    fd.append('stockQuantity', String(newQty));
    fd.append('inStock', String(newQty > 0));

    if (product.description) {
      fd.append('description', product.description);
    }

    const res = await productService.updateProduct(product._id, fd);
    return res.success;
  } catch (e) {
    console.error(`Failed to update product stock for ${product.name} (${product._id}):`, e);
    return false;
  }
}

/** استخراج معرف المنتج من الوصفة سواء كان ID أو object معبأ — أو null لو مكسورة */
const recipeProductId = (recipe: any): string | null => {
  const p = recipe?.product;
  if (!p) return null;
  if (typeof p === 'string') return p;
  return p._id || null;
};

/** حساب المتاح من وصفة واحدة بناءً على أرصدة مكوناتها */
const calcRecipeAvailability = (recipe: any, allInventory: any[]): number | null => {
  if (!recipe?.ingredients?.length) return null;

  let minAvailable = Infinity;
  for (const ing of recipe.ingredients) {
    const ingId = typeof ing.inventoryItem === 'string' ? ing.inventoryItem : ing.inventoryItem?._id;
    const invItem = allInventory.find((i: any) => i._id === ingId);
    if (!invItem || invItem.quantity <= 0) return 0;

    const inputQtyBase = toBase(ing.inputQuantity || 1, ing.inputUnit || 'KG');
    const consumePerUnit = inputQtyBase / (ing.outputQuantity || 1);
    const invBase = toBase(invItem.quantity, invItem.unit);
    const available = consumePerUnit > 0 ? Math.floor(invBase / consumePerUnit) : Infinity;
    minAvailable = Math.min(minAvailable, available);
  }

  return Number.isFinite(minAvailable) ? minAvailable : 0;
};

/**
 * After restocking an inventory item, recalculate and update stockQuantity
 * for all products that use this item via recipes (bill of materials).
 * الوصفات المكسورة (منتجها اتمسح) يتم تجاهلها بأمان.
 */
export async function syncProductStockAfterRestock(inventoryItemId: string): Promise<number> {
  try {
    const [recipesRes, productsRes, invRes] = await Promise.all([
      recipeService.listRecipes(),
      productService.listProducts(),
      inventoryService.listInventory(),
    ]);

    if (!recipesRes.success || !recipesRes.data) return 0;
    if (!productsRes.success || !productsRes.data) return 0;
    if (!invRes.success || !invRes.data) return 0;

    const allRecipes = recipesRes.data;
    const allProducts = productsRes.data;
    const allInventory = invRes.data;

    // الوصفات المتأثرة بالخام المتورّد — مع تجاهل الوصفات المكسورة (product: null)
    const affectedRecipes = allRecipes.filter((recipe: any) => {
      if (!recipeProductId(recipe)) return false;
      return recipe.ingredients?.some((ing: any) => {
        const ingId = typeof ing.inventoryItem === 'string' ? ing.inventoryItem : ing.inventoryItem?._id;
        return ingId === inventoryItemId;
      });
    });

    let updatedCount = 0;

    for (const recipe of affectedRecipes) {
      const productId = recipeProductId(recipe);
      const product = allProducts.find((p: any) => p._id === productId);
      if (!product) continue;

      const newQty = calcRecipeAvailability(recipe, allInventory);
      if (newQty === null) continue;

      if (product.stockQuantity !== newQty) {
        const success = await updateProductStockOnServer(product, newQty);
        if (success) updatedCount++;
      }
    }

    return updatedCount;
  } catch (err) {
    console.error('syncProductStockAfterRestock error:', err);
    return 0;
  }
}

/**
 * Synchronize all products' stock levels with the current inventory — via recipes ONLY.
 * المنتجات بدون وصفة صالحة لا يتم لمسها إطلاقًا (رصيدها يدوي للأدمن).
 */
export async function syncAllProductsStock(): Promise<number> {
  try {
    const [recipesRes, productsRes, invRes] = await Promise.all([
      recipeService.listRecipes(),
      productService.listProducts(),
      inventoryService.listInventory(),
    ]);

    if (!recipesRes.success || !recipesRes.data) return 0;
    if (!productsRes.success || !productsRes.data) return 0;
    if (!invRes.success || !invRes.data) return 0;

    const allRecipes = recipesRes.data;
    const allProducts = productsRes.data;
    const allInventory = invRes.data;

    let updatedCount = 0;

    for (const product of allProducts) {
      const recipe = allRecipes.find((r: any) => recipeProductId(r) === product._id);
      if (!recipe) continue; // بدون وصفة صالحة → الرصيد يدوي، ممنوع نلمسه

      const finalQty = calcRecipeAvailability(recipe, allInventory);
      if (finalQty === null) continue;

      if (product.stockQuantity !== finalQty) {
        const success = await updateProductStockOnServer(product, finalQty);
        if (success) updatedCount++;
      }
    }

    return updatedCount;
  } catch (err) {
    console.error('syncAllProductsStock error:', err);
    return 0;
  }
}
