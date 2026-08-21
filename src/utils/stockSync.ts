import { productService, recipeService } from '../services/catalogService';
import { inventoryService } from '../services/opsService';

/**
 * After restocking an inventory item, recalculate and update stockQuantity
 * for all products that use this item in their recipe (bill of materials).
 *
 * @param inventoryItemId - The _id of the restocked inventory item
 * @returns number of products updated
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
    const allInventory = invRes.data;

    // Convert any unit to its base unit (GRAM or ML or PIECE)
    const toBase = (qty: number, unit: string): number => {
      const u = (unit || '').toUpperCase();
      if (u === 'KG') return qty * 1000;
      if (u === 'LITER') return qty * 1000;
      return qty; // GRAM, ML, PIECE
    };

    // Find all recipes that include this inventory item as an ingredient
    const affectedRecipes = allRecipes.filter((recipe: any) =>
      recipe.ingredients?.some((ing: any) => {
        const ingId = typeof ing.inventoryItem === 'string'
          ? ing.inventoryItem
          : ing.inventoryItem?._id;
        return ingId === inventoryItemId;
      })
    );

    if (affectedRecipes.length === 0) return 0;

    let updatedCount = 0;

    for (const recipe of affectedRecipes) {
      const productId = typeof recipe.product === 'string'
        ? recipe.product
        : recipe.product?._id;
      if (!productId) continue;

      // Calculate how many product units can be made from current inventory
      let minAvailable = Infinity;

      for (const ing of recipe.ingredients) {
        const ingId = typeof ing.inventoryItem === 'string'
          ? ing.inventoryItem
          : ing.inventoryItem?._id;

        const invItem = allInventory.find((i: any) => i._id === ingId);
        if (!invItem || invItem.quantity <= 0) {
          minAvailable = 0;
          break;
        }

        const inputQtyBase = toBase(ing.inputQuantity || 1, ing.inputUnit || 'KG');
        const consumePerUnit = inputQtyBase / (ing.outputQuantity || 1);
        const invBase = toBase(invItem.quantity, invItem.unit);
        const available = consumePerUnit > 0 ? Math.floor(invBase / consumePerUnit) : Infinity;
        minAvailable = Math.min(minAvailable, available);
      }

      const newQty = Number.isFinite(minAvailable) ? minAvailable : 0;

      // Push updated stockQuantity to the server
      const fd = new FormData();
      fd.append('stockQuantity', String(newQty));
      fd.append('inStock', String(newQty > 0));
      await productService.updateProduct(productId, fd);
      updatedCount++;
    }

    return updatedCount;
  } catch (err) {
    console.error('syncProductStockAfterRestock error:', err);
    return 0;
  }
}
