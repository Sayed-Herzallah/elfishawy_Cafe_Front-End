import React, { useState, useEffect } from 'react';
import { orderService } from '../../services/opsService';
import { Order, OrderStatus } from '../../types';
import { useNotification } from '../../contexts/NotificationContext';
import { ReceiptModal } from '../../components/ui/ReceiptModal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { formatPrice, formatNumber, formatTime } from '../../utils/formatters';
import {
  Clock,
  CheckCircle2,
  BellRing,
  Printer,
  Search,
  RefreshCw,
  ShoppingBag,
  Coffee,
  Check,
  UtensilsCrossed,
} from 'lucide-react';

export const CashierOrdersTrackerPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);

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
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const res = await orderService.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        const label =
          newStatus === 'completed'
            ? 'تم تسليم الطلب للزبون بنجاح'
            : newStatus === 'pending'
            ? 'الطلب قيد التجهيز في البار'
            : 'تم تحديث حالة الطلب';
        showToast(label);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
      }
    } catch (err) {
      showError(err);
    }
  };

  const handlePrintReceipt = (order: Order) => {
    setSelectedReceiptOrder(order);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.tableNumber && String(order.tableNumber).includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="space-y-5 text-right font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/70">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsRefreshing(true);
              loadOrders();
            }}
            disabled={isRefreshing}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2e5b9f]' : ''}`} />
          </button>

          <div className="bg-white p-1 rounded-xl border border-gray-200/80 shadow-2xs flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`py-1.5 px-3 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الكل ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`py-1.5 px-3 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              قيد التحضير ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`py-1.5 px-3 rounded-lg font-bold transition cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              تم التسليم ({completedCount})
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-lg font-bold font-arabic-heading text-gray-900">
            متابعة الطلبات والتسليم
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            متابعة حالة تحضير المشروبات وتسليم الفواتير للزبائن في الوقت الفعلي.
          </p>
        </div>
      </div>

      {/* Search Bar & Counter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ابحث برقم الطلب أو رقم الطاولة — مثال: #4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl pr-10 pl-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#2e5b9f] shadow-2xs"
          />
        </div>

        <span className="text-xs font-mono font-bold text-gray-500">
          عرض {filteredOrders.length} طلبات
        </span>
      </div>

      {/* Orders Grid */}
      {isLoading ? (
        <LoadingSkeleton type="tile" count={4} />
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6 shadow-2xs">
          <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
          <p className="text-gray-700 font-bold text-sm">لا توجد طلبات مسجلة بهذه الحالة</p>
          <p className="text-xs text-gray-400 mt-1">أي طلب جديد ينشئه الكاشير يظهر هنا فوراً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isPending = order.status === 'pending';
            const formattedTime = formatTime(order.createdAt);

            return (
              <div
                key={order._id}
                className={`bg-white rounded-2xl border transition p-4 shadow-2xs flex flex-col justify-between ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-300/30'
                    : 'border-gray-200/80 hover:border-gray-300'
                }`}
              >
                <div>
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formattedTime}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{order.orderNumber.slice(-4)}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isPending
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isPending ? 'قيد التحضير ⏳' : 'تم التسليم ✓'}
                      </span>
                    </div>
                  </div>

                  {/* Order Meta */}
                  <div className="py-2.5 flex items-center justify-between text-xs text-gray-700">
                    <span className="font-bold">
                      {order.orderType === 'dine-in'
                        ? `طاولة رقم #${order.tableNumber || 1}`
                        : 'طلب سفري / تيك أواي'}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {formatNumber(order.items.length)} أصناف
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2 py-2.5 border-y border-dashed border-gray-200 bg-[#faf8f5]/80 p-3 rounded-xl">
                    {order.items.map((item, idx) => {
                      const name =
                        typeof item.product === 'object' ? item.product.name : 'مشروب';
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="font-mono text-gray-500 font-bold">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-gray-900 truncate text-xs">{name}</span>
                            <span className="font-bold font-mono text-[#2e5b9f] bg-blue-50 px-1.5 py-0.5 rounded text-xs">
                              ×{formatNumber(item.quantity)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Total & Action Buttons */}
                <div className="mt-3.5 pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-bold font-mono text-[#2e5b9f]">
                      {formatPrice(order.totalAmount)}
                    </span>
                    <span className="text-xs text-gray-600 font-bold">المجموع الإجمالي:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handlePrintReceipt(order)}
                      className="inline-flex items-center justify-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5 text-gray-500" />
                      <span>طباعة الفاتورة</span>
                    </button>

                    {isPending ? (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'completed')}
                        className="inline-flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تم التسليم ✓</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'pending')}
                        className="inline-flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <span>إعادة للتحضير</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        order={selectedReceiptOrder}
        isOpen={!!selectedReceiptOrder}
        onClose={() => setSelectedReceiptOrder(null)}
      />
    </div>
  );
};
