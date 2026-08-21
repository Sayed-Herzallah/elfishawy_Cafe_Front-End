import { productService, recipeService } from '../services/catalogService';
import { inventoryService } from '../services/opsService';

// Helper to convert units to base unit
const toBase = (qty: number, unit: string): number => {
  const u = (unit || '').toUpperCase();
  if (u === 'KG') return qty * 1000;
  if (u === 'LITER') return qty * 1000;
  return qty; // GRAM, ML, PIECE
};

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

/**
 * After restocking an inventory item, recalculate and update stockQuantity
 * for all products that use this item via recipes (bill of materials).
 *
 * FALLBACK: If no recipes are found, try to find products whose name
 * closely matches the inventory item name and update their stock directly.
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

    const restockedItem = allInventory.find((i: any) => i._id === inventoryItemId);

    // ── PATH 1: Recipe-based sync ────────────────────────────────────────────
    const affectedRecipes = allRecipes.filter((recipe: any) =>
      recipe.ingredients?.some((ing: any) => {
        const ingId = typeof ing.inventoryItem === 'string'
          ? ing.inventoryItem
          : ing.inventoryItem?._id;
        return ingId === inventoryItemId;
      })
    );

    let updatedCount = 0;

    if (affectedRecipes.length > 0) {
      for (const recipe of affectedRecipes) {
        const productId = typeof recipe.product === 'string'
          ? recipe.product
          : recipe.product?._id;
        if (!productId) continue;

        const product = allProducts.find((p: any) => p._id === productId);
        if (!product) continue;

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
        
        if (product.stockQuantity !== newQty) {
          const success = await updateProductStockOnServer(product, newQty);
          if (success) updatedCount++;
        }
      }

      return updatedCount;
    }

    // ── PATH 2: Name-based fallback (no recipe found) ────────────────────────
    if (restockedItem) {
      const itemName = restockedItem.name.trim().toLowerCase();
      const newQty = Math.max(0, Math.floor(toBase(restockedItem.quantity, restockedItem.unit) / 100));
      const fallbackQty = newQty > 0 ? newQty : (restockedItem.quantity > 0 ? 1 : 0);

      const matchingProducts = allProducts.filter((p: any) => {
        const pName = (p.name || '').trim().toLowerCase();
        return (
          pName.includes(itemName) ||
          itemName.includes(pName) ||
          pName.split(' ').some((word: string) => word.length > 2 && itemName.includes(word)) ||
          itemName.split(' ').some((word: string) => word.length > 2 && pName.includes(word))
        );
      });

      for (const prod of matchingProducts) {
        if (prod.stockQuantity !== fallbackQty) {
          const success = await updateProductStockOnServer(prod, fallbackQty);
          if (success) updatedCount++;
        }
      }
    }

    return updatedCount;
  } catch (err) {
    console.error('syncProductStockAfterRestock error:', err);
    return 0;
  }
}

/**
 * Synchronize all products' stock levels with the current inventory.
 * Useful to run once on page load to fix any pre-existing desyncs.
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
      let finalQty = 0;
      let hasSyncSource = false;

      const recipe = allRecipes.find((r: any) => {
        const pId = typeof r.product === 'string' ? r.product : r.product?._id;
        return pId === product._id;
      });

      if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
        hasSyncSource = true;
        let minAvailable = Infinity;
        for (const ing of recipe.ingredients) {
          const ingId = typeof ing.inventoryItem === 'string' ? ing.inventoryItem : ing.inventoryItem?._id;
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
        finalQty = Number.isFinite(minAvailable) ? minAvailable : 0;
      } else {
        const pName = (product.name || '').trim().toLowerCase();
        const matchingInv = allInventory.find((item: any) => {
          const itemName = (item.name || '').trim().toLowerCase();
          return (
            pName.includes(itemName) ||
            itemName.includes(pName) ||
            pName.split(' ').some((word: string) => word.length > 2 && itemName.includes(word)) ||
            itemName.split(' ').some((word: string) => word.length > 2 && pName.includes(word))
          );
        });

        if (matchingInv) {
          hasSyncSource = true;
          const baseQty = toBase(matchingInv.quantity, matchingInv.unit);
          const calculated = Math.floor(baseQty / 100);
          finalQty = calculated > 0 ? calculated : (matchingInv.quantity > 0 ? 1 : 0);
        }
      }

      if (hasSyncSource && product.stockQuantity !== finalQty) {
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
