/**
 * تحويل الكمية لأصغر وحدة أساس (GRAM / ML / PIECE)
 */
export const toBaseQty = (value: number, unit: string): number => {
  const u = (unit || '').toUpperCase();
  if (u === 'KG' || u === 'LITER') return value * 1000;
  return value;
};

type ConsumeLike = {
  inputQuantity?: number;
  inputUnit?: string;
  outputQuantity?: number;
  consumptionPerUnitInBase?: number;
};

/** كم وحدة منتج يمكن إنتاجها من خامة واحدة */
export const availableFromIngredient = (
  consumeQty: number,
  consumeUnit: string,
  invQty: number,
  invUnit: string,
  outputQty = 1
): number => {
  const consumeBase = toBaseQty(consumeQty, consumeUnit) / (outputQty > 0 ? outputQty : 1);
  const invBase = toBaseQty(invQty, invUnit);
  return consumeBase > 0 ? Math.floor(invBase / consumeBase) : 0;
};

/**
 * إصلاح نسبة الاستهلاك المفسدة (خطأ ×1000):
 * 20 كيلo محفوظة بدل 0.02 كيلo، أو 20 كيلo بدل 20 جرام.
 */
export const repairConsumeQty = (
  qty: number,
  unit: string,
  invQty: number,
  invUnit: string,
  outputQty = 1
): { qty: number; unit: string; repaired: boolean } => {
  if (qty <= 0 || invQty <= 0) return { qty, unit, repaired: false };

  if (availableFromIngredient(qty, unit, invQty, invUnit, outputQty) > 0) {
    return { qty, unit, repaired: false };
  }

  const u = (unit || 'KG').toUpperCase();
  if (u === 'KG' || u === 'LITER') {
    const divided = qty / 1000;
    if (divided >= 0.000001 && availableFromIngredient(divided, unit, invQty, invUnit, outputQty) > 0) {
      return { qty: divided, unit, repaired: true };
    }

    const subUnit = u === 'KG' ? 'GRAM' : 'ML';
    if (availableFromIngredient(qty, subUnit, invQty, invUnit, outputQty) > 0) {
      return { qty, unit: subUnit, repaired: true };
    }
  }

  return { qty, unit, repaired: false };
};

/**
 * استخراج كمية الاستهلاك للعرض/الحفظ مع محاولة إصلاح القيم المفسدة.
 */
export const normalizeRecipeConsumeQty = (
  ing: ConsumeLike,
  invQty?: number,
  invUnit?: string
): number => {
  const consumeUnit = ing.inputUnit || 'KG';
  const out = Number(ing.outputQuantity) > 0 ? Number(ing.outputQuantity) : 1;
  let qty = Number(ing.inputQuantity) || 0;

  if (qty > 0 && invQty !== undefined && invUnit) {
    const repaired = repairConsumeQty(qty, consumeUnit, invQty, invUnit, out);
    return repaired.qty;
  }

  return qty;
};
