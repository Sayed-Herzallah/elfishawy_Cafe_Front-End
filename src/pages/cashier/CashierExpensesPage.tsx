import React, { useState, useEffect } from 'react';
import { expenseService, inventoryService } from '../../services/opsService';
import { Expense, InventoryItem } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';
import {
  Plus,
  ShoppingBag,
  FileSpreadsheet,
  Search,
  SearchX,
  CheckCircle2,
  Calendar,
  Receipt,
  Boxes,
  Filter,
} from 'lucide-react';

export const CashierExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{ description?: string; amount?: string; quantity?: string }>({});

  const [formData, setFormData] = useState({
    description: '',
    unitCost: '',
    quantity: '10',
    amount: '',
    isAutoCalc: true,
    inventoryItemLinked: '',
    supplierName: '',
    invoiceNumber: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const { showToast, showError } = useNotification();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expRes, invRes] = await Promise.all([
        expenseService.listExpenses(),
        inventoryService.listInventory(),
      ]);

      if (expRes.success && expRes.data) setExpenses(expRes.data);
      if (invRes.success && invRes.data) {
        const invData = invRes.data;
        setInventoryItems(invData);
        if (invData.length > 0 && !formData.inventoryItemLinked) {
          setFormData((prev) => ({
            ...prev,
            inventoryItemLinked: invData[0]._id,
            unitCost: invData[0].costPrice ? String(invData[0].costPrice) : '',
          }));
        }
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUnitCostOrQtyChange = (field: 'unitCost' | 'quantity', val: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: val };
      if (updated.isAutoCalc) {
        const uCost = parseFloat(updated.unitCost) || 0;
        const q = parseFloat(updated.quantity) || 0;
        if (uCost > 0 && q > 0) {
          updated.amount = (uCost * q).toFixed(0);
        }
      }
      return updated;
    });
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { description?: string; amount?: string; quantity?: string } = {};

    if (!formData.description.trim()) {
      errors.description = 'اسم المادة الخام / البيان مطلوب';
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'المبلغ الإجمالي مطلوب ويجب أن يكون أكبر من صفر';
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      errors.quantity = 'الكمية المشتراة مطلوبة ويجب أن تكون أكبر من صفر';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('الرجاء تصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setFormErrors({});

    try {
      setIsSubmitting(true);

      const descriptionPrefix = formData.supplierName
        ? `[مورد: ${formData.supplierName.trim()}] `
        : '';
      const invoiceSuffix = formData.invoiceNumber
        ? ` (فاتورة #${formData.invoiceNumber.trim()})`
        : '';

      const fullDescription = `${descriptionPrefix}${formData.description.trim()}${invoiceSuffix}`;

      const res = await expenseService.createExpense({
        description: fullDescription,
        amount: Number(formData.amount),
        category: 'inventory',
        inventoryItemLinked: formData.inventoryItemLinked || undefined,
        inventoryQuantityAdded: formData.quantity ? Number(formData.quantity) : undefined,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      });

      if (res.success) {
        showToast('تم تسجيل فاتورة الشراء وتوريد الكمية بنجاح');
        setIsAddModalOpen(false);
        setFormErrors({});
        setFormData({
          description: '',
          unitCost: '',
          quantity: '10',
          amount: '',
          isAutoCalc: true,
          inventoryItemLinked: inventoryItems[0]?._id || '',
          supplierName: '',
          invoiceNumber: '',
          date: new Date().toISOString().slice(0, 10),
        });
        loadData();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(searchQuery.trim().toLowerCase());

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const expDate = new Date(e.date || e.createdAt || '');
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = expDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = expDate >= weekAgo;
      } else if (dateFilter === 'month') {
        matchesDate =
          expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesDate;
  });

  const totalMyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const selectedLinkedItem = inventoryItems.find((i) => i._id === formData.inventoryItemLinked);

  return (
    <div className="space-y-5 text-right font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/70">
        <div>
          <h1 className="text-lg font-bold font-arabic-heading text-gray-900">
            مشتريات البضاعة والتشغيل
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            تسجيل فواتير شراء مستلزمات المقهى وزيادة رصيد المخزن تلقائياً.
          </p>
        </div>

        <button
          onClick={() => {
            setFormErrors({});
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white py-2.5 px-5 rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ تسجيل شراء بضاعة</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold block">إجمالي المشتريات المسجلة</span>
            <span className="text-2xl font-bold text-[#2e5b9f] font-mono mt-1 block">
              {formatPrice(totalMyExpenses)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2e5b9f] flex items-center justify-center font-bold shadow-2xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-bold block">عدد عمليات الشراء</span>
            <span className="text-2xl font-bold text-gray-900 font-mono mt-1 block">
              {formatNumber(expenses.length)} فواتير
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Expenses Table Container */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث في فواتير الشراء — مثال: مورد، رقم فاتورة"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#faf8f5] border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2e5b9f]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-gray-500 ml-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#2e5b9f]" /> الفترة:
            </span>
            {(
              [
                { id: 'all', label: 'الكل' },
                { id: 'today', label: 'اليوم' },
                { id: 'week', label: 'أسبوع' },
                { id: 'month', label: 'شهر' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                onClick={() => setDateFilter(df.id)}
                className={`py-1.5 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  dateFilter === df.id
                    ? 'bg-[#2e5b9f] text-white shadow-2xs'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-gray-500">
            {formatNumber(filteredExpenses.length)} فواتير مسجلة
          </span>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" count={5} />
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400">
            <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
            <SearchX className="w-6 h-6" />
          </div>
          <p className="text-gray-600 font-bold text-sm">لا توجد فواتير مشتريات مطابقة</p>
          <p className="text-xs text-gray-500 mt-2">جرّب تغيير كلمة البحث أو امسح الفلاتر لعرض كل الفواتير.</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="space-y-3 md:hidden">
              {filteredExpenses.map((exp) => (
                <div key={exp._id} className="p-4 bg-[#faf8f5]/60 rounded-2xl border border-gray-100 shadow-3xs text-right space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-gray-900 text-xs">
                      {exp.description}
                    </span>
                    <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-blue-50 text-[#2e5b9f] text-[10px] font-bold rounded-lg">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>تمت الزيادة</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                    <div>
                      <span className="block text-[10px] text-gray-400">المبلغ</span>
                      <span className="font-bold font-mono text-[#2e5b9f] text-xs">{formatPrice(exp.amount)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400">الكمية الموردة</span>
                      <span className="font-mono text-xs text-gray-800">
                        {exp.inventoryQuantityAdded ? `+ ${formatNumber(exp.inventoryQuantityAdded)} وحدة` : '—'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[10px] text-gray-400">التاريخ</span>
                      <span className="font-mono text-gray-700">{formatDate(exp.date)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="pb-3 px-3">بيان الشراء والصنف</th>
                    <th className="pb-3 px-3">المبلغ الإجمالي</th>
                    <th className="pb-3 px-3">الكمية الموردة</th>
                    <th className="pb-3 px-3">التاريخ</th>
                    <th className="pb-3 px-3 text-left">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredExpenses.map((exp) => (
                    <tr key={exp._id} className="hover:bg-[#faf8f5]/80 transition">
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-gray-900 block text-xs">
                          {exp.description}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-bold font-mono text-sm text-[#2e5b9f]">
                        {formatPrice(exp.amount)}
                      </td>

                      <td className="py-3.5 px-3">
                        {exp.inventoryQuantityAdded ? (
                          <span className="inline-flex items-center py-1 px-2.5 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-xs">
                            + {formatNumber(exp.inventoryQuantityAdded)} وحدة
                          </span>
                        ) : (
                          <span className="text-gray-400 font-mono">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-xs text-gray-500">
                        {formatDate(exp.date)}
                      </td>

                      <td className="py-3.5 px-3 text-left">
                        <span className="inline-flex items-center gap-1 py-1 px-2.5 bg-blue-50 text-[#2e5b9f] text-xs font-bold rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تمت الزيادة</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تسجيل شراء بضاعة وخامات"
        maxWidth="md"
      >
        <form noValidate onSubmit={handleCreateExpense} className="space-y-4 text-right font-sans">
          <Input
            label="اسم المادة الخام / البيان *"
            placeholder="مثال: حبوب بن برازيلي، حليب طبيعي..."
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (formErrors.description) setFormErrors({ ...formErrors, description: undefined });
            }}
            error={formErrors.description}
            autoFocus
            required
          />

          {/* Link to Inventory Item */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700">
              ربط الصنف بالمخزون (لزيادة الرصيد تلقائياً):
            </label>
            <Select
              value={formData.inventoryItemLinked}
              onChange={(e) => {
                const targetId = e.target.value;
                const found = inventoryItems.find((i) => i._id === targetId);
                setFormData((prev) => ({
                  ...prev,
                  inventoryItemLinked: targetId,
                  unitCost: found?.costPrice ? String(found.costPrice) : prev.unitCost,
                }));
              }}
              options={inventoryItems.map((item) => ({
                value: item._id,
                label: `${item.name} (رصيده الحالي: ${item.quantity} ${item.unit})`,
              }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`الكمية المشتراة (${selectedLinkedItem?.unit || 'وحدة'}) *`}
              type="number"
              min="0.1"
              step="any"
              placeholder="10"
              value={formData.quantity}
              onChange={(e) => {
                handleUnitCostOrQtyChange('quantity', e.target.value);
                if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: undefined });
              }}
              error={formErrors.quantity}
              required
            />

            <Input
              label="سعر الوحدة (ج.م)"
              type="number"
              min="0.1"
              step="any"
              placeholder="سعر القطعة"
              value={formData.unitCost}
              onChange={(e) => handleUnitCostOrQtyChange('unitCost', e.target.value)}
            />
          </div>

          <Input
            label="المبلغ الإجمالي للفاتورة (ج.م) *"
            type="number"
            min="1"
            placeholder="المبلغ الإجمالي"
            value={formData.amount}
            onChange={(e) => {
              setFormData({ ...formData, amount: e.target.value, isAutoCalc: false });
              if (formErrors.amount) setFormErrors({ ...formErrors, amount: undefined });
            }}
            error={formErrors.amount}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="اسم المورد (اختياري)"
              placeholder="مثال: مطاحن النصر"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            />

            <Input
              label="رقم الفاتورة الورقية"
              placeholder="مثال: #892"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#2e5b9f] hover:bg-[#244b85] py-2 px-5 rounded-xl text-xs font-bold"
            >
              حفظ الفاتورة وتوريد الكمية
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};