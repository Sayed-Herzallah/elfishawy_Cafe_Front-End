import React, { useState, useEffect, useMemo } from 'react';
import { orderService } from '../../services/opsService';
import { Order, OrderStatus } from '../../types';
import { Badge } from '../../components/ui/Badge';
import { StatCard } from '../../components/ui/StatCard';
import { ReceiptModal } from '../../components/ui/ReceiptModal';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { Pagination } from '../../components/ui/Pagination';
import { FilterDialog, FilterConfig } from '../../components/ui/FilterDialog';
import { ProfessionalCard, OrderCard } from '../../components/ui/ProfessionalCard';
import { useNotification } from '../../contexts/NotificationContext';
import { formatPrice, formatNumber, formatDate, formatTime } from '../../utils/formatters';
import {
  ShoppingBag,
  TrendingUp,
  CreditCard,
  ReceiptText,
  Search,
  Printer,
  Calendar,
  Filter,
  ChevronLeft,
  MoreVertical,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const AdminSalesPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  
  // --- Pagination ---
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // --- Filter Dialog ---
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState<boolean>(false);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});

  // --- Edit Order States ---
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editOrderData, setEditOrderData] = useState({
    paymentMethod: 'cash' as 'cash' | 'card',
    orderType: 'dine-in' as 'dine-in' | 'takeaway',
    tableNumber: '',
  });
  const [isEditOrderSubmitting, setIsEditOrderSubmitting] = useState<boolean>(false);

  const { showToast, showError } = useNotification();

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const res = await orderService.getOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateFilter, customDate, filterValues]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'cancelled') {
      showToast('إلغاء الطلب سيتم إرجاع المنتجات للمخزون', 'info');
    }

    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        showToast(
          newStatus === 'cancelled'
            ? 'تم إلغاء الطلب وإرجاع المنتجات للمخزون'
            : 'تم تحديث حالة الطلب بنجاح'
        );
        loadOrders();
      }
    } catch (err) {
      showError(err);
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setIsEditOrderSubmitting(true);
      const payload: Record<string, any> = {
        paymentMethod: editOrderData.paymentMethod,
        orderType: editOrderData.orderType,
      };
      if (editOrderData.orderType === 'dine-in' && editOrderData.tableNumber) {
        payload.tableNumber = Number(editOrderData.tableNumber);
      }

      const res = await orderService.updateOrder(editingOrder._id, payload as any);
      if (res.success) {
        showToast('تم تحديث بيانات الطلب بنجاح');
        setIsEditOrderModalOpen(false);
        setEditingOrder(null);
        loadOrders();
      }
    } catch (err) {
      showError(err);
    } finally {
      setIsEditOrderSubmitting(false);
    }
  };

  // --- Filtered Orders (memoized) ---
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== 'all') {
        const orderDate = new Date(o.createdAt);
        const now = new Date();
        if (dateFilter === 'today') {
          matchesDate = orderDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = orderDate >= weekAgo;
        } else if (dateFilter === 'month') {
          matchesDate =
            orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        } else if (dateFilter === 'custom' && customDate) {
          const selectedDate = new Date(customDate);
          matchesDate = orderDate.toDateString() === selectedDate.toDateString();
        }
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesStatus && matchesDate;

      const tableStr = o.tableNumber ? String(o.tableNumber) : '';
      const hasMatchingProduct = o.items.some((item) => {
        const pName = typeof item.product === 'object' ? item.product.name : '';
        return pName.toLowerCase().includes(q);
      });

      const matchesSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o._id.toLowerCase().includes(q) ||
        tableStr.includes(q) ||
        hasMatchingProduct;

      return matchesStatus && matchesDate && matchesSearch;
    });
  }, [orders, statusFilter, dateFilter, customDate, searchQuery]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = useMemo(
    () => filteredOrders.slice(startIndex, startIndex + itemsPerPage),
    [filteredOrders, startIndex, itemsPerPage]
  );

  // --- Filter Dialog Config ---
  const filterDialogConfig: FilterConfig = {
    title: 'تصفية الطلبات',
    fields: [
      {
        name: 'search',
        label: 'بحث',
        type: 'input',
        placeholder: 'رقم الطلب، اسم المنتج، رقم الطاولة...',
        defaultValue: searchQuery,
      },
      {
        name: 'status',
        label: 'الحالة',
        type: 'select',
        options: [
          { label: 'الكل', value: 'all' },
          { label: 'مكتمل', value: 'completed' },
          { label: 'قيد التحضير', value: 'pending' },
          { label: 'ملغي', value: 'cancelled' },
        ],
        defaultValue: statusFilter,
      },
      {
        name: 'date',
        label: 'تاريخ الطلب',
        type: 'date',
        isDateRange: true,
      },
    ],
    activeFiltersCount: Object.keys(filterValues).length,
  };

  const handleApplyFilters = (values: Record<string, any>) => {
    setFilterValues(values);
    if (values.search !== undefined) setSearchQuery(values.search || '');
    if (values.status !== undefined) setStatusFilter(values.status || 'all');
    setIsFilterDialogOpen(false);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setFilterValues({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    // This would require state management for itemsPerPage
    // For now, we'll keep it simple
  };

  // --- Existing calculations (post-filter) ---
  const completedOrders = filteredOrders.filter((o) => o.status === 'completed');
  const totalSalesAmount = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const averageOrderValue =
    completedOrders.length > 0 ? Math.round(totalSalesAmount / completedOrders.length) : 0;
  const completedRatio = filteredOrders.length > 0 ? Math.round((completedOrders.length / filteredOrders.length) * 100) : 0;

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold font-arabic-heading text-gray-900">
            سجل المبيعات والطلبات
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            متابعة فواتير المبيعات، تفاصيل كل طلب، وإدارة الفواتير والطباعة.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي مبيعات الفلتر"
          value={formatPrice(totalSalesAmount)}
          percentage={completedRatio}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          title="عدد الطلبات المعروضة"
          value={`${formatNumber(filteredOrders.length)} طلب`}
          icon={<ShoppingBag className="w-5 h-5" />}
          variant="neutral"
        />
        <StatCard
          title="متوسط قيمة الفاتورة"
          value={formatPrice(averageOrderValue)}
          icon={<ReceiptText className="w-5 h-5" />}
          variant="neutral"
        />
        <StatCard
          title="الطلبات المكتملة"
          value={`${formatNumber(completedOrders.length)} طلب`}
          percentage={completedRatio}
          icon={<CreditCard className="w-5 h-5 text-emerald-600" />}
          variant="neutral"
        />
      </div>

      {/* Filter and Search Section */}
      {/* Enhanced Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث برقم الطلب، اسم المشروب، أو رقم الطاولة"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl pr-10 pl-3 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]"
            />
          </div>

          {/* Action Buttons (right side) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsFilterDialogOpen(true)}
              className="flex items-center justify-center gap-1.5 py-1.5 px-3 border border-gray-200/60 rounded-xl text-xs font-bold text-gray-700 hover:bg-[#faf8f5] transition cursor-pointer"
              title="فتح فلاتر متقدمة"
            >
              <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" />
              فلاتر متقدمة
            </button>

            {(dateFilter !== 'all' || statusFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setDateFilter('all'); setCurrentPage(1); }}
                className="flex items-center justify-center gap-1 py-1.5 px-3 border border-gray-200/60 rounded-xl text-xs font-bold text-rose-600 hover:bg-[#fff5f5] transition cursor-pointer"
                title="مسح الفلاتر"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* Inline Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {([
            { id: 'all', label: 'كل الفترات' },
            { id: 'today', label: 'اليوم' },
            { id: 'week', label: 'آخر 7 أيام' },
            { id: 'month', label: 'هذا الشهر' },
            { id: 'custom', label: 'تاريخ محدد' },
          ] as const).map((df) => (
            <button
              key={df.id}
              onClick={() => { setDateFilter(df.id); setCurrentPage(1); }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                dateFilter === df.id
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* Custom Date Picker */}
        {dateFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
            <label className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#2e5b9f]" />
              اختر التاريخ:
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]"
            />
          </div>
        )}

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-500 ml-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#2e5b9f]" /> الحالة:
          </span>
          <button
            onClick={() => setStatusFilter('all')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            الكل ({orders.length})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            مكتمل ({orders.filter((o) => o.status === 'completed').length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            قيد التحضير ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('cancelled')}
            className={`py-1 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'cancelled'
                ? 'bg-rose-600 text-white'
                : 'bg-gray-50 text-gray-600 border border-gray-200/60 hover:bg-gray-100'
            }`}
          >
            ملغي ({orders.filter((o) => o.status === 'cancelled').length})
          </button>
        </div>
      </div>


      {/* Orders as Cards (clickable) */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <span className="text-xs text-gray-800 bg-gray-100/80 border border-gray-200 px-2.5 py-1 rounded-xl font-bold font-mono">
            {filteredOrders.length} فاتورة مسجلة
          </span>
          <h3 className="font-bold text-base text-gray-900">سجل الفواتير والعمليات</h3>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="tile" count={itemsPerPage} />
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-14 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 mx-2">
            <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-gray-600 font-bold text-sm">لا توجد طلبات مطابقة</p>
            <p className="text-xs text-gray-500 mt-2">جرّب تعديل كلمة البحث أو اختيار فلترة مختلفة لعرض النتائج.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedOrders.map((order) => {
              const statusStyle = 
                order.status === 'completed' ? 'completed' :
                order.status === 'pending' ? 'pending' : 'cancelled';

              const itemsPreview = order.items.slice(0, 3).map((item, idx) => {
                const pName =
                  typeof item.product === 'object' ? item.product.name : 'مشروب';
                return (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                    {pName} ×{formatNumber(item.quantity)}
                  </span>
                );
              });
              const remaining = order.items.length - 3;

              return (
                <OrderCard
                  key={order._id}
                  id={order._id}
                  status={statusStyle as any}
                  title={order.orderNumber}
                  subtitle={`#${order._id.slice(-6)} • ${formatDate(order.createdAt)}`}
                  onClick={() => setSelectedReceiptOrder(order)}
                  onDoubleClick={() => setSelectedReceiptOrder(order)}
                  amounts={{
                    primary: formatNumber(order.totalAmount),
                    currency: 'ج.م',
                  }}
                  metadata={[
                    { label: 'النوع', value: order.orderType === 'dine-in' ? `صالة #${order.tableNumber || 1}` : 'سفري', icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                    { label: 'الوقت', value: formatTime(order.createdAt), icon: <Calendar className="w-3.5 h-3.5" /> },
                    { label: 'عدد الأصناف', value: formatNumber(order.items.length), icon: <ShoppingBag className="w-3.5 h-3.5" /> },
                  ]}
                  dates={{
                    created: order.createdAt,
                    updated: order.updatedAt,
                  }}
                  tags={[order.orderType === 'dine-in' ? `طاولة #${order.tableNumber || 1}` : 'سفري']}
                  actions={[
                    {
                      icon: <Printer className="w-3.5 h-3.5" />,
                      label: 'طباعة',
                      onClick: (e) => { e.stopPropagation(); setSelectedReceiptOrder(order); },
                      variant: 'primary',
                    },
                    {
                      icon: <Eye className="w-3.5 h-3.5" />,
                      label: 'عرض',
                      onClick: (e) => { e.stopPropagation(); setSelectedReceiptOrder(order); },
                      variant: 'default',
                    },
                    ...(order.status !== 'cancelled' ? [{
                      icon: <Edit2 className="w-3.5 h-3.5" />,
                      label: 'تعديل',
                      onClick: (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setEditingOrder(order);
                        setEditOrderData({
                          paymentMethod: order.paymentMethod as 'cash' | 'card',
                          orderType: order.orderType as 'dine-in' | 'takeaway',
                          tableNumber: order.tableNumber ? String(order.tableNumber) : '',
                        });
                        setIsEditOrderModalOpen(true);
                      },
                      variant: 'default' as const,
                    }] : []),
                    ...(order.status === 'pending' ? [{
                      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                      label: 'إكمال',
                      onClick: (e: React.MouseEvent) => { e.stopPropagation(); handleUpdateStatus(order._id, 'completed'); },
                      variant: 'primary' as const,
                    }] : []),
                    ...(order.status !== 'cancelled' ? [{
                      icon: <XCircle className="w-3.5 h-3.5" />,
                      label: 'إلغاء',
                      onClick: (e: React.MouseEvent) => { e.stopPropagation(); handleUpdateStatus(order._id, 'cancelled'); },
                      variant: 'danger' as const,
                    }] : []),
                  ]}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-gray-500">المكان</span>
                      <span className="font-medium text-gray-900">
                        {order.orderType === 'dine-in' ? `صالة #${order.tableNumber || 1}` : 'سفري'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">الإجمالي</span>
                      <span className="font-bold font-mono text-[#2e5b9f]">{formatPrice(order.totalAmount)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">الوقت</span>
                      <span className="font-mono text-gray-700 text-[10px]">
                        {formatTime(order.createdAt)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-500">الحالة</span>
                      <Badge
                        variant={
                          order.status === 'completed' ? 'completed' :
                          order.status === 'pending' ? 'pending' : 'cancelled'
                        }
                        size="sm"
                      >
                        {order.status === 'completed' ? 'مكتمل' :
                         order.status === 'pending' ? 'قيد التحضير' : 'ملغي'}
                      </Badge>
                    </div>
                    <div className="sm:col-span-2 flex flex-wrap gap-1">
                      {itemsPreview}
                      {remaining > 0 && (
                        <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                          +{formatNumber(remaining)} المزيد
                        </span>
                      )}
                    </div>
                  </div>
                </OrderCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination (Professional Google-style) */}
      {!isLoading && filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={setItemsPerPage}
          maxPages={7}
          showItemsPerPage={true}
          itemsPerPageOptions={[10, 25, 50, 100]}
        />
      )}

      {/* Advanced Filter Dialog */}
      <FilterDialog
        config={filterDialogConfig}
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
        order={selectedReceiptOrder}
      />

      {/* Edit Order Modal */}
      <Modal
        isOpen={isEditOrderModalOpen}
        onClose={() => {
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
        }}
        title={`تعديل الطلب: ${editingOrder?.orderNumber || ''}`}
        maxWidth="md"
      >
        <form noValidate onSubmit={handleUpdateOrder} className="space-y-4 text-right">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
            ⚠️ تعديل الطلب يحسب الفرق في المخزون تلقائياً. لا يمكن تعديل الأصناف من هنا — استخدم الإلغاء وإنشاء طلب جديد لتغيير المنتجات.
          </div>

          <Select
            label="طريقة الدفع *"
            value={editOrderData.paymentMethod}
            onChange={(e) =>
              setEditOrderData({ ...editOrderData, paymentMethod: e.target.value as 'cash' | 'card' })
            }
            options={[
              { value: 'cash', label: '💵 نقدي' },
              { value: 'card', label: '💳 بطاقة' },
            ]}
          />

          <Select
            label="نوع الطلب *"
            value={editOrderData.orderType}
            onChange={(e) =>
              setEditOrderData({ ...editOrderData, orderType: e.target.value as 'dine-in' | 'takeaway' })
            }
            options={[
              { value: 'dine-in', label: '🪑 صالة (Dine-in)' },
              { value: 'takeaway', label: '🛍️ سفري (Takeaway)' },
            ]}
          />

          {editOrderData.orderType === 'dine-in' && (
            <Input
              label="رقم الطاولة"
              type="number"
              min="1"
              placeholder="مثال: 5"
              value={editOrderData.tableNumber}
              onChange={(e) =>
                setEditOrderData({ ...editOrderData, tableNumber: e.target.value })
              }
            />
          )}

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditOrderModalOpen(false);
                setEditingOrder(null);
              }}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isEditOrderSubmitting}
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
