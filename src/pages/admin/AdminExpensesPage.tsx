import React, { useState, useEffect, useMemo } from 'react';
import { expenseService, inventoryService } from '../../services/opsService';
import { Expense, InventoryItem, ExpenseCategory } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { StatCard } from '../../components/ui/StatCard';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterDialog } from '../../components/ui/FilterDialog';
import { Pagination } from '../../components/ui/Pagination';
import { ProfessionalCard, ExpenseCard } from '../../components/ui/ProfessionalCard';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';
import {
  ReceiptText,
  DollarSign,
  Plus,
  Trash2,
  PieChart,
  Calendar,
  Search,
  Filter,
  ChevronLeft,
  MoreVertical,
  Eye,
  Edit2,
  FileText,
  User,
} from 'lucide-react';

export const AdminExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<{ description?: string; amount?: string; inventoryQuantityAdded?: string }>({});

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'inventory' as ExpenseCategory,
    inventoryItemLinked: '',
    inventoryQuantityAdded: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Delete Confirm
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);
  
  // View detail modal state
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  
  // Edit expense states
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editFormData, setEditFormData] = useState({
    description: '',
    amount: '',
    category: 'inventory' as ExpenseCategory,
    inventoryItemLinked: '',
    inventoryQuantityAdded: '',
    date: new Date().toISOString().slice(0, 10),
  });
  const [editFormErrors, setEditFormErrors] = useState<{ description?: string; amount?: string; inventoryQuantityAdded?: string }>({});
  const [isEditFormSubmitted, setIsEditFormSubmitted] = useState<boolean>(false);

  // Filter Dialog
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);

  // Pagination
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

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
        setInventoryItems(invRes.data);
        if (invRes.data.length > 0) {
          setFormData((prev) => ({ ...prev, inventoryItemLinked: invRes.data[0]._id }));
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

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, dateFilter, searchQuery, dateFrom, dateTo]);

  // Filter Dialog Config
  const filterDialogConfig = {
    title: 'تصفية المصروفات',
    fields: [
      {
        name: 'search',
        label: 'بحث',
        type: 'input' as const,
        placeholder: 'بيان المصروف...',
        defaultValue: searchQuery,
      },
      {
        name: 'categoryFilter',
        label: 'الفئة',
        type: 'select' as const,
        options: [
          { value: 'all', label: 'الكل' },
          { value: 'inventory', label: 'المواد الخام والمخزون' },
          { value: 'salaries', label: 'الرواتب والأجور' },
          { value: 'utilities', label: 'المرافق والخدمات' },
          { value: 'rent', label: 'الإيجار والمقر' },
          { value: 'marketing', label: 'التسويق والدعاية' },
          { value: 'maintenance', label: 'الصيانة' },
          { value: 'other', label: 'مصاريف أخرى' },
        ],
        defaultValue: categoryFilter,
      },
      {
        name: 'dateFilter',
        label: 'فترة سريعة',
        type: 'select' as const,
        options: [
          { value: 'all', label: 'الكل' },
          { value: 'today', label: 'اليوم' },
          { value: 'week', label: 'أسبوع' },
          { value: 'month', label: 'شهر' },
        ],
        defaultValue: dateFilter,
      },
      {
        name: 'dateFrom',
        label: 'من تاريخ',
        type: 'date' as const,
        defaultValue: dateFrom,
      },
      {
        name: 'dateTo',
        label: 'إلى تاريخ',
        type: 'date' as const,
        defaultValue: dateTo,
      },
    ],
    activeFiltersCount: (searchQuery ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0) + (dateFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0),
  };

  const handleFilterApply = (values: any) => {
    if (values.search !== undefined) setSearchQuery(values.search);
    if (values.categoryFilter !== undefined) setCategoryFilter(values.categoryFilter);
    if (values.dateFilter !== undefined) setDateFilter(values.dateFilter);
    if (values.dateFrom !== undefined) setDateFrom(values.dateFrom);
    if (values.dateTo !== undefined) setDateTo(values.dateTo);
    setIsFilterDialogOpen(false);
  };

  const handleFilterReset = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setDateFilter('all');
    setDateFrom('');
    setDateTo('');
    setIsFilterDialogOpen(false);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { description?: string; amount?: string; inventoryQuantityAdded?: string } = {};

    if (!formData.description.trim()) {
      errors.description = 'بيان المصروف مطلوب';
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = 'الرجاء إدخال مبلغ صحيح أكبر من صفر';
    }
    if (formData.category === 'inventory' && (!formData.inventoryQuantityAdded || Number(formData.inventoryQuantityAdded) <= 0)) {
      errors.inventoryQuantityAdded = 'الرجاء إدخال كمية التوريد';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      showToast('الرجاء تصحيح الحقول المطلوبة المميزة باللون الأحمر', 'error');
      return;
    }

    setFormErrors({});

    try {
      setIsSubmitting(true);
      const res = await expenseService.createExpense({
        description: formData.description.trim(),
        amount: Number(formData.amount),
        category: formData.category,
        inventoryItemLinked:
          formData.category === 'inventory' ? formData.inventoryItemLinked : undefined,
        inventoryQuantityAdded:
          formData.category === 'inventory' && formData.inventoryQuantityAdded
            ? Number(formData.inventoryQuantityAdded)
            : undefined,
        date: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
      });

      if (res.success) {
        showToast('تم تسجيل المصروف بنجاح وتحديث السجلات');
        setIsAddModalOpen(false);
        setFormErrors({});
        setFormData({
          description: '',
          amount: '',
          category: 'inventory',
          inventoryItemLinked: inventoryItems[0]?._id || '',
          inventoryQuantityAdded: '',
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

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditFormSubmitted(true);
    const errors: { description?: string; amount?: string; inventoryQuantityAdded?: string } = {};

    if (!editFormData.description.trim()) {
      errors.description = 'بيان المصروف مطلوب';
    }
    if (!editFormData.amount || Number(editFormData.amount) <= 0) {
      errors.amount = 'الرجاء إدخال مبلغ صحيح أكبر من صفر';
    }
    if (
      editFormData.category === 'inventory' &&
      (!editFormData.inventoryQuantityAdded || Number(editFormData.inventoryQuantityAdded) <= 0)
    ) {
      errors.inventoryQuantityAdded = 'الرجاء إدخال كمية التوريد';
    }

    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      showToast('الرجاء تصحيح الحقول المطلوبة المميزة باللون الأحمر', 'error');
      return;
    }

    setEditFormErrors({});

    try {
      setIsSubmitting(true);
      const res = await expenseService.updateExpense(editingExpense!._id, {
        description: editFormData.description.trim(),
        amount: Number(editFormData.amount),
        category: editFormData.category,
        inventoryItemLinked:
          editFormData.category === 'inventory' ? editFormData.inventoryItemLinked : undefined,
        inventoryQuantityAdded:
          editFormData.category === 'inventory' && editFormData.inventoryQuantityAdded
            ? Number(editFormData.inventoryQuantityAdded)
            : undefined,
        date: editFormData.date ? new Date(editFormData.date).toISOString() : undefined,
      });

      if (res.success) {
        showToast('تم تحديث المصروف بنجاح');
        setIsEditModalOpen(false);
        setIsEditFormSubmitted(false);
        setEditFormErrors({});
        setEditingExpense(null);
        loadData();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: string) => {
    setDeleteTarget({ id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await expenseService.deleteExpense(deleteTarget.id);
      if (res.success) {
        showToast('تم حذف قيد المصروف بنجاح');
        loadData();
      }
    } catch (err) {
      showError(err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const todayExpenses = expenses
    .filter((e) => new Date(e.date).toDateString() === new Date().toDateString())
    .reduce((s, e) => s + e.amount, 0);

  const categoryLabels: Record<ExpenseCategory, string> = {
    inventory: 'المواد الخام والمخزون',
    salaries: 'الرواتب والأجور',
    utilities: 'المرافق والخدمات',
    rent: 'الإيجار والمقر',
    other: 'مصاريف أخرى ونثريات',
  };

  // Dynamic category breakdown
  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  const categoryPercentages = Object.entries(categoryTotals)
    .map(([cat, amount]) => ({
      category: cat as ExpenseCategory,
      amount,
      percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categoryPercentages[0];

  const categoryColors: Record<ExpenseCategory, string> = {
    inventory: 'bg-[#2e5b9f]',
    salaries: 'bg-[#eab308]',
    utilities: 'bg-[#06b6d4]',
    rent: 'bg-[#a855f7]',
    other: 'bg-[#f97316]',
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;

    let matchesDate = true;
    if (dateFilter !== 'all') {
      const expDate = new Date(e.date || e.createdAt);
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

    const q = searchQuery.trim().toLowerCase();
    if (!q) return matchesCategory && matchesDate;

    const matchesSearch =
      e.description.toLowerCase().includes(q) ||
      (categoryLabels[e.category] || '').toLowerCase().includes(q) ||
      String(e.amount).includes(q);

    return matchesCategory && matchesDate && matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = useMemo(
    () => filteredExpenses.slice(startIndex, startIndex + itemsPerPage),
    [filteredExpenses, startIndex, itemsPerPage]
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold font-arabic-heading text-gray-900">
            سجل المصروفات والتشغيل
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            متابعة فواتير التوريد، الرواتب، الإيجارات، وتكلفة المواد الخام.
          </p>
        </div>

        <Button
          onClick={() => {
            setFormErrors({});
            setIsAddModalOpen(true);
            showToast('تم فتح نافذة تسجيل مصروف جديد', 'info');
          }}
          variant="primary"
          leftIcon={<Plus className="w-4 h-4 ml-1.5" />}
          className="bg-[#2e5b9f]"
        >
          تسجيل مصروف جديد
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المصروفات"
          value={formatPrice(totalExpenses)}
          icon={<ReceiptText className="w-5 h-5 text-[#9f1239]" />}
          variant="pink"
        />
        <StatCard
          title="مصروفات اليوم"
          value={formatPrice(todayExpenses)}
          icon={<DollarSign className="w-5 h-5 text-gray-500" />}
          variant="neutral"
        />
        <StatCard
          title="أكبر فئة مصروفات"
          value={topCategory ? `${categoryLabels[topCategory.category]} (${formatNumber(topCategory.percentage)}%)` : '—'}
          icon={<PieChart className="w-5 h-5 text-[#2e5b9f]" />}
          variant="blue"
        />
        <StatCard
          title="عدد القيود المسجلة"
          value={`${formatNumber(expenses.length)} قيد`}
          icon={<Calendar className="w-5 h-5 text-gray-500" />}
          variant="neutral"
        />
      </div>

      {/* Main 2-Column Grid - RTL: Content on right (order-1), Sidebar on left (order-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Content: Expenses Table (8 cols) - Right side visually */}
        <div className="lg:col-span-8 lg:order-1 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
          {/* Search and Period Filter Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 w-full">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ابحث في المصروفات — مثال: بن، صيانة، كهرباء"
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
              {(categoryFilter !== 'all' || dateFilter !== 'all' || searchQuery) && (
                <button
                  onClick={handleFilterReset}
                  className="flex items-center justify-center gap-1 py-2 px-3 border border-gray-200/60 rounded-xl text-xs font-bold text-rose-600 hover:bg-[#fff5f5] transition cursor-pointer"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>

          {/* Period Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
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
                className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  dateFilter === df.id
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-gray-500 ml-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" /> الفئة:
              </span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`py-1 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                الكل
              </button>
              <button
                onClick={() => setCategoryFilter('inventory')}
                className={`py-1 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === 'inventory'
                    ? 'bg-[#2e5b9f] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                المخزون
              </button>
              <button
                onClick={() => setCategoryFilter('salaries')}
                className={`py-1 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === 'salaries'
                    ? 'bg-[#2e5b9f] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                الرواتب
              </button>
              <button
                onClick={() => setCategoryFilter('utilities')}
                className={`py-1 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === 'utilities'
                    ? 'bg-[#2e5b9f] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                المرافق
              </button>
              <button
                onClick={() => setCategoryFilter('rent')}
                className={`py-1 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === 'rent'
                    ? 'bg-[#2e5b9f] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                الإيجار
              </button>
              <button
                onClick={() => setCategoryFilter('other')}
                className={`py-1 px-2.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                  categoryFilter === 'other'
                    ? 'bg-[#2e5b9f] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                أخرى
              </button>
            </div>

            <span className="text-xs text-gray-800 bg-gray-100/80 border border-gray-200 px-2.5 py-1 rounded-xl font-bold font-mono">
              {filteredExpenses.length} عملية مسجلة
            </span>
          </div>

          {isLoading ? (
            <LoadingSkeleton type="tile" count={itemsPerPage} />
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-14 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 mx-2">
              <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
                <ReceiptText className="w-6 h-6" />
              </div>
              <p className="text-gray-600 font-bold text-sm">لا توجد مصروفات مطابقة</p>
              <p className="text-xs text-gray-500 mt-2">جرّب كلمة بحث أخرى أو امسح الفلاتر لعرض كل المصروفات.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedExpenses.map((exp) => {
                const authorName =
                  typeof exp.addedBy === 'object' ? exp.addedBy.userName : exp.addedBy || 'المدير';

                return (
                  <ExpenseCard
                    key={exp._id}
                    id={exp._id}
                    status={exp.amount > 10000 ? 'processing' : 'completed'}
                    title={exp.description}
                    subtitle={`#${exp._id.slice(-6)} • ${formatDate(exp.date)}`}
                    onClick={() => setViewingExpense(exp)}
                    amounts={{
                      primary: formatNumber(exp.amount),
                      currency: 'ج.م',
                    }}
                    metadata={[
                      { label: 'الفئة', value: categoryLabels[exp.category] || exp.category, icon: <ReceiptText className="w-3.5 h-3.5" /> },
                      { label: 'المسجل', value: authorName, icon: <User className="w-3.5 h-3.5" /> },
                      { label: 'التاريخ', value: formatDate(exp.date), icon: <Calendar className="w-3.5 h-3.5" /> },
                    ]}
                    dates={{
                      created: exp.date,
                      updated: exp.createdAt,
                    }}
                    tags={exp.inventoryQuantityAdded ? [`+${formatNumber(exp.inventoryQuantityAdded)} وحدة للمخزن`] : []}
                    actions={[
                      {
                        icon: <Eye className="w-3.5 h-3.5" />,
                        label: 'عرض',
                        onClick: (e) => { e.stopPropagation(); setViewingExpense(exp); },
                        variant: 'default',
                      },
                      {
                        icon: <FileText className="w-3.5 h-3.5" />,
                        label: 'تفاصيل',
                        onClick: (e) => { e.stopPropagation(); setViewingExpense(exp); },
                        variant: 'default',
                      },
                      {
                        icon: <Edit2 className="w-3.5 h-3.5" />,
                        label: 'تعديل',
                        onClick: (e) => {
                          e.stopPropagation();
                          setEditingExpense(exp);
                          setEditFormData({
                            description: exp.description,
                            amount: String(exp.amount),
                            category: exp.category as ExpenseCategory,
                            inventoryItemLinked:
                              exp.inventoryItemLinked
                                ? typeof exp.inventoryItemLinked === 'object'
                                  ? exp.inventoryItemLinked._id
                                  : exp.inventoryItemLinked
                                : inventoryItems[0]?._id || '',
                            inventoryQuantityAdded: exp.inventoryQuantityAdded
                              ? String(exp.inventoryQuantityAdded)
                              : '',
                            date: exp.date
                              ? new Date(exp.date).toISOString().slice(0, 10)
                              : new Date().toISOString().slice(0, 10),
                          });
                          setEditFormErrors({});
                          setIsEditFormSubmitted(false);
                          setIsEditModalOpen(true);
                        },
                        variant: 'default',
                      },
                      {
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        label: 'حذف',
                        onClick: (e) => { e.stopPropagation(); handleDeleteExpense(exp._id); },
                        variant: 'danger',
                      },
                    ]}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="flex flex-col">
                        <span className="text-gray-500">البيان</span>
                        <span className="font-medium text-gray-900 truncate">{exp.description}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">المبلغ</span>
                        <span className="font-bold font-mono text-rose-600">{formatPrice(exp.amount)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">الفئة</span>
                        <span className="font-medium text-gray-900">{categoryLabels[exp.category] || exp.category}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">التاريخ</span>
                        <span className="font-mono text-gray-700 text-[10px]">{formatDate(exp.date)}</span>
                      </div>
                    </div>
                  </ExpenseCard>
                );
              })}
            </div>
          )} 
        </div>

        {/* Sidebar: Category Breakdown Bars (4 cols) - Left side visually */}
        <div className="lg:col-span-4 lg:order-2 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-400">تحليل نسبي</span>
            <h3 className="font-bold text-base text-gray-900">توزيع المصروفات</h3>
          </div>

          {categoryPercentages.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا توجد بيانات مصروفات لعرض التحليل.
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {categoryPercentages.map(({ category, amount, percentage }) => (
                <div key={category}>
                  <div className="flex justify-between text-gray-700 mb-1 font-medium">
                    <span className="font-mono">{formatPrice(amount)} ({formatNumber(percentage)}%)</span>
                    <span>{categoryLabels[category]}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${categoryColors[category]} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تسجيل مصروف تشغيلي جديد"
        maxWidth="md"
      >
        <form noValidate onSubmit={handleCreateExpense} className="space-y-4 text-right">
          <Input
            label="بيان المصروف *"
            placeholder="مثال: فاتورة بن كولومبي، صيانة ماكينة، كهرباء..."
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (formErrors.description) setFormErrors({ ...formErrors, description: undefined });
            }}
            error={formErrors.description}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="المبلغ (ج.م) *"
              type="number"
              min="1"
              placeholder="1500"
              value={formData.amount}
              onChange={(e) => {
                setFormData({ ...formData, amount: e.target.value });
                if (formErrors.amount) setFormErrors({ ...formErrors, amount: undefined });
              }}
              error={formErrors.amount}
              required
            />

            <Select
              label="فئة المصروف *"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ExpenseCategory })
              }
              options={[
                { value: 'inventory', label: 'شراء مواد خام ومخزون' },
                { value: 'salaries', label: 'رواتب وأجور' },
                { value: 'utilities', label: 'مرافق وكهرباء ومياه' },
                { value: 'rent', label: 'إيجار المقر' },
                { value: 'other', label: 'مصاريف أخرى' },
              ]}
            />
          </div>

          {/* Dynamic Auto-Restock Link Fields (Backend Business Rule) */}
          {formData.category === 'inventory' && (
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 space-y-3">
              <p className="text-[11px] font-bold text-[#2e5b9f]">
                ربط التوريد التلقائي بصنف المخزن (ميزة النظام):
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  label="اختر صنف المخزن"
                  value={formData.inventoryItemLinked}
                  onChange={(e) =>
                    setFormData({ ...formData, inventoryItemLinked: e.target.value })
                  }
                  options={inventoryItems.map((i) => ({
                    value: i._id,
                    label: `${i.name} (${i.unit})`,
                  }))}
                />
                <Input
                  label="الكمية المضافة *"
                  type="number"
                  min="1"
                  placeholder="20"
                  value={formData.inventoryQuantityAdded}
                  onChange={(e) => {
                    setFormData({ ...formData, inventoryQuantityAdded: e.target.value });
                    if (formErrors.inventoryQuantityAdded) setFormErrors({ ...formErrors, inventoryQuantityAdded: undefined });
                  }}
                  error={formErrors.inventoryQuantityAdded}
                  helperText="ستتم زيادة رصيد المخزن فورياً."
                  required
                />
              </div>
            </div>
          )}

          <Input
            label="تاريخ المصروف"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          />

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
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
              className="bg-[#2e5b9f]"
            >
              حفظ المصروف
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
        message="هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء."
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

      {/* View Detail Modal */}
      <Modal
        isOpen={!!viewingExpense}
        onClose={() => setViewingExpense(null)}
        title="تفاصيل قيد المصروف"
        maxWidth="md"
      >
        {viewingExpense && (
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-4 p-4 bg-[#faf8f5] rounded-2xl border border-gray-100">
              <ReceiptText className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{viewingExpense.description}</h3>
                <p className="text-xs text-gray-500 mt-1">
                  قيد مصروف #${viewingExpense._id.slice(-8)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">القيمة الإجمالية</span>
                <span className="text-lg font-bold font-mono text-rose-600">
                  {formatPrice(viewingExpense.amount)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">فئة المصروف</span>
                <span className="text-sm font-bold text-gray-900">
                  {categoryLabels[viewingExpense.category] || viewingExpense.category}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">تاريخ الفاتورة / القيد</span>
                <span className="text-sm font-bold font-mono text-gray-900">
                  {formatDate(viewingExpense.date || viewingExpense.createdAt)}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-200">
                <span className="text-[10px] text-gray-400 font-bold block">تم التسجيل بواسطة</span>
                <span className="text-sm font-bold text-gray-900">
                  {typeof viewingExpense.addedBy === 'object'
                    ? viewingExpense.addedBy.userName
                    : viewingExpense.addedBy || 'المدير'}
                </span>
              </div>

              {viewingExpense.inventoryItemLinked && (
                <div className="p-3 bg-white rounded-xl border border-gray-200 col-span-1 sm:col-span-2 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold block">تفاصيل التوريد المرتبط</span>
                  <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 flex items-center justify-between">
                    <span>
                      تحديث رصيد المخزن بمقدار:{' '}
                      <span className="font-bold text-emerald-700 font-mono">
                        +{formatNumber(viewingExpense.inventoryQuantityAdded || 0)}
                      </span>
                    </span>
                    <span className="font-bold text-gray-900">
                      الصنف:{' '}
                      {typeof viewingExpense.inventoryItemLinked === 'object' && viewingExpense.inventoryItemLinked !== null
                        ? (viewingExpense.inventoryItemLinked as any).name || String((viewingExpense.inventoryItemLinked as any)._id).slice(-8)
                        : String(viewingExpense.inventoryItemLinked).slice(-8)}
                    </span>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="col-span-1 sm:col-span-2 flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-xl">
                  <span className="text-base">📅</span>
                  <span className="text-[10px] text-blue-500 font-bold">أُنشئ في</span>
                  <span className="font-mono font-bold">{formatDate(viewingExpense.createdAt)}</span>
                </span>
                {viewingExpense.updatedAt && viewingExpense.updatedAt !== viewingExpense.createdAt && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-xl">
                    <span className="text-base">✏️</span>
                    <span className="text-[10px] text-amber-600 font-bold">آخر تعديل</span>
                    <span className="font-mono font-bold">{formatDate(viewingExpense.updatedAt)}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setViewingExpense(null)}>
                إغلاق
              </Button>
              <Button
                type="button"
                variant="danger"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
                onClick={() => {
                  handleDeleteExpense(viewingExpense._id);
                  setViewingExpense(null);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 ml-1" />
                <span>حذف القيد</span>
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Expense Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setIsEditFormSubmitted(false);
          setEditFormErrors({});
          setEditingExpense(null);
        }}
        title="تعديل قيد مصروف"
        maxWidth="lg"
      >
        <form noValidate onSubmit={handleUpdateExpense} className="space-y-4 text-right">
          <Input
            label="بيان المصروف *"
            placeholder="مثال: شراء حبوب بن، إيجار شهري..."
            value={editFormData.description}
            onChange={(e) => {
              setEditFormData({ ...editFormData, description: e.target.value });
              if (editFormErrors.description) setEditFormErrors({ ...editFormErrors, description: undefined });
            }}
            error={editFormErrors.description}
            isSubmitted={isEditFormSubmitted}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="المبلغ (ج.م) *"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="مثال: 500"
              value={editFormData.amount}
              onChange={(e) => {
                setEditFormData({ ...editFormData, amount: e.target.value });
                if (editFormErrors.amount) setEditFormErrors({ ...editFormErrors, amount: undefined });
              }}
              error={editFormErrors.amount}
              isSubmitted={isEditFormSubmitted}
              required
            />

            <Input
              label="تاريخ المصروف"
              type="date"
              value={editFormData.date}
              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
            />
          </div>

          <Select
            label="فئة المصروف *"
            value={editFormData.category}
            onChange={(e) =>
              setEditFormData({ ...editFormData, category: e.target.value as ExpenseCategory })
            }
            options={[
              { value: 'inventory', label: '📦 مواد خام / توريد مخزن' },
              { value: 'salaries', label: '👥 رواتب' },
              { value: 'rent', label: '🏠 إيجار' },
              { value: 'utilities', label: '⚡ مرافق (كهرباء / مياه / غاز)' },
              { value: 'other', label: '📋 أخرى' },
            ]}
          />

          {editFormData.category === 'inventory' && (
            <div className="space-y-3 p-4 bg-[#f0f5ff] rounded-xl border border-[#2e5b9f]/20">
              <p className="text-xs font-bold text-[#2e5b9f]">
                📦 ربط بمخزون — سيتم تعديل كمية المخزن تلقائياً
              </p>
              <Select
                label="اختر الصنف من المخزن"
                value={editFormData.inventoryItemLinked}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, inventoryItemLinked: e.target.value })
                }
                options={inventoryItems.map((inv) => ({
                  value: inv._id,
                  label: `${inv.name} (${formatNumber(inv.quantity)} ${inv.unit})`,
                }))}
              />
              <Input
                label="الكمية المضافة للمخزن *"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="مثال: 10"
                value={editFormData.inventoryQuantityAdded}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, inventoryQuantityAdded: e.target.value });
                  if (editFormErrors.inventoryQuantityAdded)
                    setEditFormErrors({ ...editFormErrors, inventoryQuantityAdded: undefined });
                }}
                error={editFormErrors.inventoryQuantityAdded}
                isSubmitted={isEditFormSubmitted}
                required
              />
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setIsEditFormSubmitted(false);
                setEditFormErrors({});
                setEditingExpense(null);
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