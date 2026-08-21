import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/opsService';
import { productService, recipeService } from '../../services/catalogService';
import { InventoryItem } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';
import { StatCard } from '../../components/ui/StatCard';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterDialog } from '../../components/ui/FilterDialog';
import {
  Boxes,
  AlertTriangle,
  Plus,
  ArrowDownToLine,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Search,
  Calendar,
  Filter,
  Eye,
  Edit2,
} from 'lucide-react';

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'out'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; quantity?: string; minLimit?: string }>({});
  const [restockErrors, setRestockErrors] = useState<{ quantity?: string }>({});
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [isRestockSubmitted, setIsRestockSubmitted] = useState(false);
  
  // Filter Dialog
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    quantity: '10',
    unit: 'KG',
    minLimit: '5',
  });

  // Edit item states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    unit: 'KG',
    minLimit: '5',
  });
  const [editFormErrors, setEditFormErrors] = useState<{ name?: string; minLimit?: string }>({});
  const [isEditFormSubmitted, setIsEditFormSubmitted] = useState(false);

  // View Detail State
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);

  const { showToast, showError } = useNotification();

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const res = await inventoryService.listInventory();
      if (res.success && res.data) {
        setItems(res.data);
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  // Filter Dialog Config
  const filterDialogConfig = {
    title: 'تصفية المخزون',
    fields: [
      {
        name: 'search',
        label: 'بحث',
        type: 'input' as const,
        placeholder: 'اسم المادة...',
        defaultValue: searchQuery,
      },
      {
        name: 'filterMode',
        label: 'حالة المخزون',
        type: 'select' as const,
        options: [
          { value: 'all', label: 'الكل' },
          { value: 'low', label: 'منخفض' },
          { value: 'out', label: 'نافد' },
        ],
        defaultValue: filterMode,
      },
      {
        name: 'dateFrom',
        label: 'من تاريخ التوريد',
        type: 'date' as const,
        defaultValue: dateFrom,
      },
      {
        name: 'dateTo',
        label: 'إلى تاريخ التوريد',
        type: 'date' as const,
        defaultValue: dateTo,
      },
    ],
    activeFiltersCount: (searchQuery ? 1 : 0) + (filterMode !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0),
  };

  const handleFilterApply = (values: any) => {
    if (values.search !== undefined) setSearchQuery(values.search);
    if (values.filterMode !== undefined) setFilterMode(values.filterMode);
    if (values.dateFrom !== undefined) setDateFrom(values.dateFrom);
    if (values.dateTo !== undefined) setDateTo(values.dateTo);
    setIsFilterDialogOpen(false);
  };

  const handleFilterReset = () => {
    setSearchQuery('');
    setFilterMode('all');
    setDateFrom('');
    setDateTo('');
    setIsFilterDialogOpen(false);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFormSubmitted(true);
    const errors: { name?: string; quantity?: string; minLimit?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'اسم الصنف مطلوب';
    }
    if (formData.quantity === '' || Number(formData.quantity) < 0) {
      errors.quantity = 'الرجاء إدخال كمية صحيحة (0 أو أكثر)';
    }
    if (formData.minLimit === '' || Number(formData.minLimit) < 1) {
      errors.minLimit = 'الرجاء تحديد حد أدنى صحيح (1 أو أكثر)';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('الرجاء تصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setFormErrors({});

    try {
      setIsSubmitting(true);
      const res = await inventoryService.createItem({
        name: formData.name.trim(),
        quantity: Number(formData.quantity) || 0,
        unit: formData.unit,
        minLimit: Number(formData.minLimit) || 5,
      });

      if (res.success) {
        showToast('تمت إضافة صنف المخزون بنجاح');
        setIsAddModalOpen(false);
        setIsFormSubmitted(false);
        setFormErrors({});
        setFormData({ name: '', quantity: '10', unit: 'KG', minLimit: '5' });
        loadInventory();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRestockSubmitted(true);
    const errors: { quantity?: string } = {};

    if (!restockQty || Number(restockQty) <= 0) {
      errors.quantity = 'الرجاء إدخال كمية توريد صحيحة أكبر من صفر';
    }

    if (Object.keys(errors).length > 0) {
      setRestockErrors(errors);
      showToast('الرجاء تصحيح الحقل المميز باللون الأحمر', 'error');
      return;
    }

    setRestockErrors({});

    try {
      setIsSubmitting(true);
      const res = await inventoryService.restockItem(selectedItem!._id, Number(restockQty));
      if (res.success) {
        showToast(`تم توريد ${restockQty} ${selectedItem!.unit} لـ ${selectedItem!.name}`);
        setIsRestockModalOpen(false);
        setIsRestockSubmitted(false);
        setRestockErrors({});
        setRestockQty('');

        // ✅ Auto-sync: recalculate product stockQuantity for all products linked to this inventory item
        try {
          const [recipesRes, productsRes, freshInvRes] = await Promise.all([
            recipeService.listRecipes(),
            productService.listProducts(),
            inventoryService.listInventory(),
          ]);

          if (recipesRes.success && recipesRes.data && productsRes.success && productsRes.data && freshInvRes.success && freshInvRes.data) {
            const allRecipes = recipesRes.data;
            const allProducts = productsRes.data;
            const allInventory = freshInvRes.data;

            // Find recipes that use this inventory item
            const affectedRecipes = allRecipes.filter((recipe: any) =>
              recipe.ingredients?.some((ing: any) => {
                const ingId = typeof ing.inventoryItem === 'string' ? ing.inventoryItem : ing.inventoryItem?._id;
                return ingId === selectedItem!._id;
              })
            );

            // Helper: convert to base unit
            const toBase = (qty: number, unit: string): number => {
              const u = (unit || '').toUpperCase();
              if (u === 'KG') return qty * 1000;
              if (u === 'LITER') return qty * 1000;
              return qty;
            };

            // For each affected recipe, recalculate available qty and update the product
            for (const recipe of affectedRecipes) {
              const productId = typeof recipe.product === 'string' ? recipe.product : recipe.product?._id;
              if (!productId) continue;

              let minAvailable = Infinity;
              for (const ing of recipe.ingredients) {
                const ingId = typeof ing.inventoryItem === 'string' ? ing.inventoryItem : ing.inventoryItem?._id;
                const invItem = allInventory.find((i: any) => i._id === ingId);
                if (!invItem || invItem.quantity <= 0) { minAvailable = 0; break; }

                const inputQtyBase = toBase(ing.inputQuantity || 1, ing.inputUnit || 'KG');
                const consumePerUnit = inputQtyBase / (ing.outputQuantity || 1);
                const invBase = toBase(invItem.quantity, invItem.unit);
                const available = consumePerUnit > 0 ? Math.floor(invBase / consumePerUnit) : Infinity;
                minAvailable = Math.min(minAvailable, available);
              }

              const newQty = Number.isFinite(minAvailable) ? minAvailable : 0;

              // Update the product's stock quantity via API
              const productData = allProducts.find((p: any) => p._id === productId);
              if (productData !== undefined) {
                const fd = new FormData();
                fd.append('stockQuantity', String(newQty));
                fd.append('inStock', String(newQty > 0));
                await productService.updateProduct(productId, fd);
              }
            }

            if (affectedRecipes.length > 0) {
              showToast(`تم تحديث ${affectedRecipes.length} منتج مرتبط بهذه الخامة تلقائياً`, 'info');
            }
          }
        } catch (syncErr) {
          console.error('Product stock sync error after restock:', syncErr);
        }

        loadInventory();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditFormSubmitted(true);
    const errors: { name?: string; minLimit?: string } = {};

    if (!editFormData.name.trim()) {
      errors.name = 'اسم الصنف مطلوب';
    }
    if (editFormData.minLimit === '' || Number(editFormData.minLimit) < 1) {
      errors.minLimit = 'الرجاء تحديد حد أدنى صحيح (1 أو أكثر)';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      showToast('الرجاء تصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setEditFormErrors({});

    try {
      setIsSubmitting(true);
      const res = await inventoryService.updateItem(editingItem!._id, {
        name: editFormData.name.trim(),
        unit: editFormData.unit,
        minLimit: Number(editFormData.minLimit),
      });

      if (res.success) {
        showToast('تم تحديث صنف المخزون بنجاح');
        setIsEditModalOpen(false);
        setIsEditFormSubmitted(false);
        setEditFormErrors({});
        setEditingItem(null);
        loadInventory();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await inventoryService.deleteItem(deleteTarget.id);
      if (res.success) {
        showToast('تم حذف الصنف من المخزن');
        loadInventory();
      }
    } catch (err) {
      showError(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const lowStockCount = items.filter((i) => i.quantity > 0 && i.quantity <= i.minLimit).length;
  const outOfStockCount = items.filter((i) => i.quantity <= 0).length;
  const totalValue = items.reduce((sum, i) => sum + (i.costPrice || 0) * i.quantity, 0);

  // Real percentage indicators (share of total items)
  const availableCount = Math.max(0, items.length - lowStockCount - outOfStockCount);
  const availablePct = items.length > 0 ? Math.round((availableCount / items.length) * 100) : 0;
  const lowPct = items.length > 0 ? Math.round((lowStockCount / items.length) * 100) : 0;
  const outPct = items.length > 0 ? Math.round((outOfStockCount / items.length) * 100) : 0;

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    if (filterMode === 'low') return matchesSearch && item.quantity > 0 && item.quantity <= item.minLimit;
    if (filterMode === 'out') return matchesSearch && item.quantity <= 0;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header - Swapped to put text on right, and actions on left */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold font-arabic-heading text-gray-900">
            دفتر المخزون والمواد الخام
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            تتبع كميات البن، الحليب، العبوات ومستلزمات التشغيل اليومية.
          </p>
        </div>

        <div>
          <Button
            onClick={() => {
              setFormErrors({});
              setIsAddModalOpen(true);
            }}
            variant="primary"
            leftIcon={<Plus className="w-4 h-4 ml-1.5" />}
            className="bg-[#2e5b9f] hover:bg-[#244b85]"
          >
            إضافة صنف مخزون
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الأصناف"
          value={`${formatNumber(items.length)} صنف`}
          percentage={availablePct}
          icon={<Boxes className="w-5 h-5 text-gray-500" />}
          variant="neutral"
        />
        <StatCard
          title="مخزون منخفض"
          value={`${formatNumber(lowStockCount)} صنف`}
          subtitle="أقل من حد الأمان"
          percentage={lowPct}
          isPositive={false}
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          variant="neutral"
        />
        <StatCard
          title="نفد من المخزون"
          value={`${formatNumber(outOfStockCount)} صنف`}
          subtitle="يحتاج لتوريد عاجل"
          percentage={outPct}
          isPositive={false}
          icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
          variant="pink"
        />
        <StatCard
          title="قيمة المخزون التقديرية"
          value={formatPrice(totalValue)}
          icon={<CheckCircle2 className="w-5 h-5 text-[#2e5b9f]" />}
          variant="blue"
        />
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث في الأصناف والمواد — مثال: بن، سكر، أكواب"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFilterDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200/60 rounded-xl text-xs font-bold text-gray-700 hover:bg-[#faf8f5] transition cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" />
              تصفية متقدمة
            </button>
            {(filterMode !== 'all' || searchQuery) && (
              <button
                onClick={handleFilterReset}
                className="flex items-center justify-center gap-1 py-2 px-3 border border-gray-200/60 rounded-xl text-xs font-bold text-rose-600 hover:bg-[#fff5f5] transition cursor-pointer"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-500 ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" /> الحالة:
          </span>
          <button
            onClick={() => setFilterMode('all')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterMode === 'all'
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            الكل ({items.length})
          </button>
          <button
            onClick={() => setFilterMode('low')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterMode === 'low'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            منخفض ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterMode('out')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterMode === 'out'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            نافد ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout - RTL: Content on right (order-1), Sidebar on left (order-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content: Inventory Table (8 cols) - Right side visually */}
        <div className="lg:col-span-8 lg:order-1 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-mono">
              {filteredItems.length} صنف معروض
            </span>
            <h3 className="font-bold text-base text-gray-900">الأصناف الحالية</h3>
          </div>

          {isLoading ? (
            <LoadingSkeleton type="table" count={8} />
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-14 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 mx-2">
              <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
                <Boxes className="w-6 h-6" />
              </div>
              <p className="text-gray-600 font-bold text-sm">لا توجد أصناف مطابقة</p>
              <p className="text-xs text-gray-500 mt-2">جرّب كلمة بحث أخرى أو امسح الفلاتر لعرض كل الأصناف.</p>
            </div>
          ) : (
            <>
              {/* Mobile & Tablet Card Layout (< md) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                {filteredItems.map((item) => {
                  const isLow = item.quantity > 0 && item.quantity <= item.minLimit;
                  const isOut = item.quantity <= 0;
                  const restockerName =
                    item.lastRestockedBy && typeof item.lastRestockedBy === 'object'
                      ? item.lastRestockedBy.userName
                      : typeof item.lastRestockedBy === 'string'
                      ? item.lastRestockedBy
                      : null;

                  return (
                    <div
                      key={item._id}
                      className="bg-[#faf8f5]/50 border border-gray-200/60 rounded-2xl p-4 space-y-3 text-right"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-gray-900 text-sm block">{item.name}</span>
                          {item.lastRestocked && (
                            <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                              آخر تعديل: {formatDate(item.lastRestocked)}
                              {restockerName ? ` • ${restockerName}` : ''}
                            </span>
                          )}
                        </div>
                        <Badge
                          variant={isOut ? 'out' : isLow ? 'low' : 'available'}
                          size="sm"
                        >
                          {isOut ? 'نافد' : isLow ? 'منخفض' : 'مستقر'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-gray-100 text-xs">
                        <div>
                          <span className="text-[10px] text-gray-400 block mb-0.5">الكمية الحالية</span>
                          <span className="font-bold text-gray-900 font-mono">
                            {formatNumber(item.quantity)} {item.unit}
                          </span>
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] text-gray-400 block mb-0.5">حد الأمان</span>
                          <span className="font-bold text-gray-500 font-mono">
                            {formatNumber(item.minLimit)} {item.unit}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100/50">
                        <button
                          onClick={() => setViewingItem(item)}
                          className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold transition text-[11px]"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>تفاصيل</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setEditFormData({
                              name: item.name,
                              unit: item.unit,
                              minLimit: String(item.minLimit),
                            });
                            setEditFormErrors({});
                            setIsEditFormSubmitted(false);
                            setIsEditModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold transition text-[11px]"
                          title="تعديل الصنف"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedItem(item);
                            setRestockQty('10');
                            setRestockErrors({});
                            setIsRestockModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-blue-50 text-[#2e5b9f] hover:bg-blue-100 font-bold transition text-[11px]"
                        >
                          <ArrowDownToLine className="w-3.5 h-3.5" />
                          <span>توريد</span>
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="حذف الصنف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table Layout (>= md) */}
              <div className="hidden md:block overflow-x-auto -mx-6 px-6 pb-2">
                <table className="w-full text-right border-collapse text-xs min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                      <th className="pb-3 px-3">اسم المادة / الصنف</th>
                      <th className="pb-3 px-3">الكمية الحالية</th>
                      <th className="pb-3 px-3">حد الأمان</th>
                      <th className="pb-3 px-3">آخر توريد</th>
                      <th className="pb-3 px-3">الحالة</th>
                      <th className="pb-3 px-3 text-left">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-800">
                    {filteredItems.map((item) => {
                      const isLow = item.quantity > 0 && item.quantity <= item.minLimit;
                      const isOut = item.quantity <= 0;
                      const restockerName =
                        item.lastRestockedBy && typeof item.lastRestockedBy === 'object'
                          ? item.lastRestockedBy.userName
                          : typeof item.lastRestockedBy === 'string'
                          ? item.lastRestockedBy
                          : null;

                      return (
                        <tr key={item._id} className="hover:bg-[#faf8f5]/60 transition">
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-gray-900 block">{item.name}</span>
                            {item.lastRestocked && (
                              <span className="text-[10px] text-gray-400 font-mono">
                                {formatDate(item.lastRestocked)}
                                {restockerName ? ` • ${restockerName}` : ''}
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-3 font-mono font-bold text-sm text-gray-900">
                            {formatNumber(item.quantity)} {item.unit}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-gray-500">
                            {formatNumber(item.minLimit)} {item.unit}
                          </td>

                          <td className="py-3.5 px-3 font-mono text-gray-500 text-[11px]">
                            {formatDate(item.lastRestocked)}
                          </td>

                          <td className="py-3.5 px-3">
                            <Badge
                              variant={isOut ? 'out' : isLow ? 'low' : 'available'}
                              size="sm"
                            >
                              {isOut ? 'نفد المخزون' : isLow ? 'مخزون منخفض' : 'متوفر ومستقر'}
                            </Badge>
                          </td>

                          <td className="py-3.5 px-3 text-left">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setViewingItem(item)}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold transition text-[11px]"
                                title="عرض التفاصيل"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>تفاصيل</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditFormData({
                                    name: item.name,
                                    unit: item.unit,
                                    minLimit: String(item.minLimit),
                                  });
                                  setEditFormErrors({});
                                  setIsEditFormSubmitted(false);
                                  setIsEditModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold transition text-[11px]"
                                title="تعديل الصنف"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>تعديل</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedItem(item);
                                  setRestockQty('10');
                                  setRestockErrors({});
                                  setIsRestockModalOpen(true);
                                }}
                                className="inline-flex items-center gap-1 py-1 px-2.5 rounded-lg bg-blue-50 text-[#2e5b9f] hover:bg-blue-100 font-bold transition text-[11px]"
                              >
                                <ArrowDownToLine className="w-3.5 h-3.5" />
                                <span>توريد</span>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item._id, item.name)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="حذف الصنف"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Sidebar: Stock Movements Log (4 cols) - Left side visually */}
        <div className="lg:col-span-4 lg:order-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-400">سجل العمليات</span>
            <h3 className="font-bold text-base text-gray-900">حركة المخزون</h3>
          </div>

          <div className="space-y-3 text-xs">
            {items.slice(0, 5).map((item) => {
              const isLow = item.quantity > 0 && item.quantity <= item.minLimit;
              const isOut = item.quantity <= 0;
              return (
                <div key={item._id} className="p-3 rounded-xl bg-[#faf8f5] border border-gray-100 space-y-1">
                  <div className="flex justify-between items-center text-gray-800 font-bold">
                    <span className={`font-mono ${isOut ? 'text-rose-700' : isLow ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {item.quantity} {item.unit}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {isOut ? 'نفد من المخزون - يحتاج توريد عاجل' : isLow ? 'مخزون منخفض - قريب من حد الأمان' : 'متوفر ومستقر'}
                  </p>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">
                لا توجد حركة مخزون مسجلة بعد.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsFormSubmitted(false);
          setFormErrors({});
          setFormData({ name: '', quantity: '10', unit: 'KG', minLimit: '5' });
        }}
        title="إضافة صنف مخزون جديد"
        maxWidth="md"
      >
        <form noValidate onSubmit={handleCreateItem} className="space-y-4 text-right">
          <Input
            label="اسم الصنف / المادة الخام *"
            placeholder="مثال: حبوب بن برازيلي، سكر بني، أكواب 12oz..."
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (formErrors.name) setFormErrors({ ...formErrors, name: undefined });
            }}
            error={formErrors.name}
            isSubmitted={isFormSubmitted}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="الكمية الابتدائية *"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => {
                setFormData({ ...formData, quantity: e.target.value });
                if (formErrors.quantity) setFormErrors({ ...formErrors, quantity: undefined });
              }}
              error={formErrors.quantity}
              isSubmitted={isFormSubmitted}
              required
            />

            <Select
              label="وحدة القياس *"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              options={[
                { value: 'KG', label: 'كيلوجرام (KG)' },
                { value: 'GRAM', label: 'جرام (GRAM)' },
                { value: 'LITER', label: 'لتر (LITER)' },
                { value: 'ML', label: 'مليلتر (ML)' },
                { value: 'PIECE', label: 'قطعة (PIECE)' },
              ]}
            />
          </div>

          <Input
            label="حد الأمان الأدنى (Min Limit) *"
            type="number"
            min="1"
            value={formData.minLimit}
            onChange={(e) => {
              setFormData({ ...formData, minLimit: e.target.value });
              if (formErrors.minLimit) setFormErrors({ ...formErrors, minLimit: undefined });
            }}
            error={formErrors.minLimit}
            isSubmitted={isFormSubmitted}
            helperText="سيتم إظهار تنبيه فور وصول المخزون لهذه الكمية أو أقل."
            required
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsFormSubmitted(false);
                setFormErrors({});
                setFormData({ name: '', quantity: '10', unit: 'KG', minLimit: '5' });
              }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#2e5b9f]"
            >
              إضافة الصنف
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Restock Modal */}
      <Modal
        isOpen={isRestockModalOpen}
        onClose={() => {
          setIsRestockModalOpen(false);
          setIsRestockSubmitted(false);
          setRestockErrors({});
          setRestockQty('');
        }}
        title={`توريد كمية إضافية: ${selectedItem?.name || ''}`}
        maxWidth="sm"
      >
        <form noValidate onSubmit={handleRestock} className="space-y-4 text-right">
          <p className="text-xs text-gray-500">
            الكمية الحالية:{' '}
            <span className="font-bold text-gray-900 font-mono">
              {selectedItem?.quantity} {selectedItem?.unit}
            </span>
          </p>

          <Input
            label={`الكمية المضافة (${selectedItem?.unit}) *`}
            type="number"
            min="1"
            placeholder="10"
            value={restockQty}
            onChange={(e) => {
              setRestockQty(e.target.value);
              if (restockErrors.quantity) setRestockErrors({ ...restockErrors, quantity: undefined });
            }}
            error={restockErrors.quantity}
            isSubmitted={isRestockSubmitted}
            autoFocus
            required
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsRestockModalOpen(false);
                setIsRestockSubmitted(false);
                setRestockErrors({});
                setRestockQty('');
              }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#2e5b9f]"
            >
              تأكيد التوريد
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="تأكيد الحذف"
        message={`هل أنت متأكد من حذف الصنف "${deleteTarget?.name}" من المخزن؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        config={filterDialogConfig}
        onApply={handleFilterApply}
        onReset={handleFilterReset}
      />

      {/* View Item Detail Modal */}
      <Modal
        isOpen={!!viewingItem}
        onClose={() => setViewingItem(null)}
        title={`تفاصيل الصنف: ${viewingItem?.name || ''}`}
        maxWidth="md"
      >
        {viewingItem && (
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-4 p-4 bg-[#faf8f5] rounded-2xl border border-gray-100">
              <Boxes className="w-10 h-10 rounded-xl bg-[#2e5b9f] text-white flex items-center justify-center" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewingItem.name}</h3>
                <p className="text-xs text-gray-500 mt-1">صنف مخزون</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">الكمية الحالية</span>
                <span className="text-lg font-bold font-mono text-[#2e5b9f]">{formatNumber(viewingItem.quantity)} {viewingItem.unit}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">حد الأمان (Min Limit)</span>
                <span className="text-lg font-bold font-mono text-gray-900">{formatNumber(viewingItem.minLimit)} {viewingItem.unit}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">الحالة</span>
                <Badge
                  variant={viewingItem.quantity <= 0 ? 'out' : viewingItem.quantity <= viewingItem.minLimit ? 'low' : 'available'}
                  size="sm"
                >
                  {viewingItem.quantity <= 0 ? 'نفد المخزون' : viewingItem.quantity <= viewingItem.minLimit ? 'مخزون منخفض' : 'متوفر ومستقر'}
                </Badge>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">آخر توريد</span>
                <span className="text-sm font-bold font-mono text-gray-900">{viewingItem.lastRestocked ? formatDate(viewingItem.lastRestocked) : '—'}</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-gray-200 col-span-2">
                <span className="text-[10px] text-gray-400 font-bold block">تم التوريد بواسطة</span>
                <span className="text-sm font-bold text-gray-900">
                  {viewingItem.lastRestockedBy && typeof viewingItem.lastRestockedBy === 'object'
                    ? viewingItem.lastRestockedBy.userName
                    : typeof viewingItem.lastRestockedBy === 'string'
                    ? viewingItem.lastRestockedBy
                    : '—'}
                </span>
              </div>

              {/* Timestamps */}
              <div className="col-span-2 flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-xl">
                  <span className="text-base">📅</span>
                  <span className="text-[10px] text-blue-500 font-bold">أُنشئ في</span>
                  <span className="font-mono font-bold">{formatDate(viewingItem.createdAt)}</span>
                </span>
                {viewingItem.updatedAt && viewingItem.updatedAt !== viewingItem.createdAt && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-xl">
                    <span className="text-base">✏️</span>
                    <span className="text-[10px] text-amber-600 font-bold">آخر تعديل</span>
                    <span className="font-mono font-bold">{formatDate(viewingItem.updatedAt)}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setViewingItem(null)}>
                إغلاق
              </Button>
              <Button
                type="button"
                variant="primary"
                className="bg-[#2e5b9f]"
                onClick={() => {
                  setSelectedItem(viewingItem);
                  setRestockQty('10');
                  setRestockErrors({});
                  setIsRestockModalOpen(true);
                  setViewingItem(null);
                }}
              >
                <ArrowDownToLine className="w-3.5 h-3.5 ml-1" />
                <span>توريد كمية</span>
              </Button>
            </div>
            </div>
        )}
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIsEditFormSubmitted(false);
          setEditFormErrors({});
          setEditingItem(null);
        }}
        title={`تعديل صنف مخزون: ${editingItem?.name || ''}`}
        maxWidth="md"
      >
        <form noValidate onSubmit={handleUpdateItem} className="space-y-4 text-right">
          <Input
            label="اسم الصنف / المادة الخام *"
            placeholder="مثال: حبوب بن برازيلي، سكر بني..."
            value={editFormData.name}
            onChange={(e) => {
              setEditFormData({ ...editFormData, name: e.target.value });
              if (editFormErrors.name) setEditFormErrors({ ...editFormErrors, name: undefined });
            }}
            error={editFormErrors.name}
            isSubmitted={isEditFormSubmitted}
            required
          />

          <Select
            label="وحدة القياس *"
            value={editFormData.unit}
            onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
            options={[
              { value: 'KG', label: 'كيلوجرام (KG)' },
              { value: 'GRAM', label: 'جرام (GRAM)' },
              { value: 'LITER', label: 'لتر (LITER)' },
              { value: 'ML', label: 'مليلتر (ML)' },
              { value: 'PIECE', label: 'قطعة (PIECE)' },
            ]}
          />

          <Input
            label="حد الأمان الأدنى (Min Limit) *"
            type="number"
            min="1"
            value={editFormData.minLimit}
            onChange={(e) => {
              setEditFormData({ ...editFormData, minLimit: e.target.value });
              if (editFormErrors.minLimit) setEditFormErrors({ ...editFormErrors, minLimit: undefined });
            }}
            error={editFormErrors.minLimit}
            isSubmitted={isEditFormSubmitted}
            helperText="سيتم إظهار تنبيه فور وصول المخزون لهذه الكمية أو أقل."
            required
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setIsEditFormSubmitted(false);
                setEditFormErrors({});
                setEditingItem(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="bg-[#2e5b9f]"
            >
              حفظ التعديلات
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};