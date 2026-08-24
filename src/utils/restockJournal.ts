import { Expense, InventoryItem } from '../types';

/**
 * 📓 يومية التوريدات المحلية (localStorage)
 * السيرفر بيسجل اسم اللي ورّد فقط في قيود الشراء (مشتريات الكاشير) —
 * لكن توريد المدير من شاشة المخزون (/inventory/:id/restock) مبيتسجلش باسم مستخدم،
 * فاليومية دي بتسجل كل توريد من الجهاز نفسه (مين، إمتى، بكام) عشان
 * "تم التوريد بواسطة" وتاريخ الأسعار يظهروا دايماً في تفاصيل الصنف.
 */

export interface RestockJournalEntry {
  id: string;
  itemId: string;
  /** ISO date */
  date: string;
  qty: number;
  totalCost?: number;
  unitCost?: number;
  by: string;
  byRole: 'admin' | 'cashier';
  source: 'admin-restock' | 'cashier-purchase';
}

export interface RestockHistoryEntry {
  id: string;
  source: 'server' | 'journal';
  /** epoch ms */
  dateMs: number;
  qty: number;
  totalCost?: number;
  unitCost?: number;
  by: string;
  byRole?: 'admin' | 'cashier';
  supplier?: string;
}

const JOURNAL_KEY = 'inventory_restock_journal_v1';
const MAX_ENTRIES = 300;

export function getRestockJournal(): RestockJournalEntry[] {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addRestockJournalEntry(entry: Omit<RestockJournalEntry, 'id'>): void {
  try {
    const list = getRestockJournal();
    list.push({
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(list.slice(-MAX_ENTRIES)));
  } catch {
    /* تجاهل — اليومية إضافة تحسينية ومش حرجة */
  }
}

/** استخراج اسم المورد من وصف القيد — بصيغة [مورد: ...] أو (مورد: ...) */
export function parseSupplierName(desc: string): string | undefined {
  const m = (desc || '').match(/[[（(]مورد:\s*([^\])）]+)[\])）]/);
  return m ? m[1].trim() : undefined;
}

/** سعر وحدة قيد الشراء — من unitCost لو الـ API رجّعه وإلا الإجمالي ÷ الكمية */
export function expenseUnitCost(e: Expense): number | undefined {
  if (e.unitCost && e.unitCost > 0) return e.unitCost;
  const qty = e.inventoryQuantityAdded || 0;
  if (qty > 0 && e.amount > 0) return Number((e.amount / qty).toFixed(2));
  return undefined;
}

/**
 * 📈 دمج تاريخ توريدات الصنف: قيود الشراء من السيرفر + يومية التوريدات المحلية
 * مرتبة من الأحدث للأقدم، مع إزالة التكرار لو قيد كاشير اتسجل محلياً على نفس الجهاز
 * (نفس الصنف + نفس الكمية خلال 3 دقائق = توريد واحد).
 */
export function mergeRestockHistory(itemId: string, logs: Expense[]): RestockHistoryEntry[] {
  const server: RestockHistoryEntry[] = logs
    .filter(
      (e) =>
        e.category === 'inventory' &&
        e.inventoryItemLinked &&
        typeof e.inventoryItemLinked === 'object' &&
        (e.inventoryItemLinked as InventoryItem)._id === itemId
    )
    .map((e) => ({
      id: `server-${e._id}`,
      source: 'server' as const,
      dateMs: new Date(e.date || e.createdAt || '').getTime(),
      qty: e.inventoryQuantityAdded || 0,
      totalCost: e.amount,
      unitCost: expenseUnitCost(e),
      by: typeof e.addedBy === 'object' ? e.addedBy?.userName || 'المدير' : e.addedBy || 'المدير',
      supplier: parseSupplierName(e.description || ''),
    }));

  const journal: RestockHistoryEntry[] = getRestockJournal()
    .filter((j) => j.itemId === itemId)
    .map((j) => ({
      id: `journal-${j.id}`,
      source: 'journal' as const,
      dateMs: new Date(j.date).getTime(),
      qty: j.qty,
      totalCost: j.totalCost,
      unitCost: j.unitCost,
      by: j.by,
      byRole: j.byRole,
    }));

  const dedupedJournal = journal.filter(
    (j) =>
      !server.some(
        (s) =>
          s.qty === j.qty &&
          !isNaN(s.dateMs) &&
          !isNaN(j.dateMs) &&
          Math.abs(s.dateMs - j.dateMs) <= 3 * 60 * 1000
      )
  );

  return [...server, ...dedupedJournal]
    .filter((e) => !isNaN(e.dateMs))
    .sort((a, b) => b.dateMs - a.dateMs);
}

/**
 * 📊 ملخص التكلفة الحقيقية للصنف من سجل المشتريات المرتبطة (قيد مخزون).
 * المشكلة اللي بيشتكي منها المستخدم: لما الباك إند بيخزن سعر تكلفة وحدة
 * آخر توريد بس، بييجي يقسم الإجمالي المعروض بالمخزون غلط
 * (مثلاً: شريت ٤٠٠٠ + ٣٣٠٠ = ٥٣٠٠ بس بيظهر ٤٠٠٠).
 * الحل هنا: المتوسط المرجّح من كل الفواتير الفعلية =
 *   الإجمالي المستثمر = Σ مبالغ فواتير الشراء للصنف
 *   متوسط سعر الوحدة = الإجمالي ÷ Σ الكميات المشتراة
 */
export function purchaseSummary(itemId: string, logs: Expense[]) {
  let total = 0, qty = 0, count = 0;
  (logs || []).forEach((e) => {
    if (!e || e.category !== 'inventory') return;
    const linked = e.inventoryItemLinked;
    const linkedId = linked && typeof linked === 'object' ? (linked as InventoryItem)._id : (linked as string | undefined);
    if (!linkedId || linkedId !== itemId) return;
    total += Number(e.amount) || 0;
    qty += Number(e.inventoryQuantityAdded) || 0;
    count += 1;
  });
  // توريدات المدير من شاشة المخزون مبيتعملش عليها قيد سيرفر — نتأكد إنها معروضة
  // بس نستبعد 'cashier-purchase' لأنها ليها قيد سيرفر مطابق (هتتعد مرتين).
  getRestockJournal()
    .filter((j) => j.itemId === itemId && j.source === 'admin-restock')
    .forEach((j) => {
      total += Number(j.totalCost) || 0;
      qty += Number(j.qty) || 0;
      count += 1;
    });
  return {
    total,            // مجموع ما تم دفعه فعلاً
    qty,              // إجمالي الكمية المشتراة
    count,            // عدد فواتير الشراء + عمليات التوريد
    avgUnitCost: qty > 0 ? Number((total / qty).toFixed(2)) : 0,  // متوسط سعر الوحدة
  };
}
