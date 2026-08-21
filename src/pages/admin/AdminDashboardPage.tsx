import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { analyticsService, orderService, inventoryService, expenseService } from '../../services/opsService';
import { KPIStats, ChartsData, Order, InventoryItem, Expense } from '../../types';
import { ReceiptModal } from '../../components/ui/ReceiptModal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import {
  formatPrice,
  formatNumber,
  formatDate,
  formatTime,
  formatDateTime
} from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  ReceiptText,
  ShoppingBag,
  Coins,
  AlertTriangle,
  Download,
  Eye,
  Plus,
  Store,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  RefreshCw,
  Calendar,
} from 'lucide-react';

/**
 * ChangePctBar — shows the real % change vs the previous period.
 * - Positive change → green bar + ↑ icon
 * - Negative change → red bar   + ↓ icon
 * - Zero            → hidden (no previous data to compare)
 * invertColors: for expenses a reduction is "good" (green)
 */
const ChangePctBar: React.FC<{
  change: number;
  invertColors?: boolean;
  label?: string;
}> = ({ change, invertColors = false, label }) => {
  if (change === 0) return null;

  const isPositive = change > 0;
  const isGood = invertColors ? !isPositive : isPositive;
  const absVal = Math.abs(change);
  // Cap visual bar at 100% width but display real number
  const barWidth = Math.min(100, absVal);

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between text-[10px] font-bold mb-1">
        <span className="text-gray-400 flex items-center gap-0.5">
          {isPositive
            ? <TrendingUp className="w-3 h-3" />
            : <TrendingDown className="w-3 h-3" />}
          {label || (isPositive ? 'نمو عن الفترة السابقة' : 'انخفاض عن الفترة السابقة')}
        </span>
        <span className={`font-mono ${isGood ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isPositive ? '+' : '-'}{absVal}%
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isGood ? 'bg-emerald-500' : 'bg-rose-500'}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
};

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast, showError } = useNotification();
  const navigate = useNavigate();
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, chartsRes, ordersRes, invRes, expRes] = await Promise.all([
        analyticsService.getStats(),
        analyticsService.getCharts(),
        orderService.getOrders(),
        inventoryService.listInventory({ lowStock: true }),
        expenseService.listExpenses(),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (chartsRes.success && chartsRes.data) setCharts(chartsRes.data);
      if (ordersRes.success && ordersRes.data) {
        setAllOrders(ordersRes.data);
        setRecentOrders(ordersRes.data.slice(0, 6));
      }
      if (invRes.success && invRes.data) setLowStockItems(invRes.data);
      if (expRes.success && expRes.data) setExpenses(expRes.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  if (isLoading && !stats) {
    return <LoadingSkeleton type="stat" count={4} />;
  }

  // Filter orders by time range
  const filteredOrders = allOrders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    const now = new Date();
    if (timeRange === 'today') {
      return orderDate.toDateString() === now.toDateString();
    } else if (timeRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= weekAgo;
    } else if (timeRange === 'month') {
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Dynamic KPIs from filtered data
  const totalSales = filteredOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpenses = expenses
    .filter((e) => {
      const expDate = new Date(e.date || e.createdAt || '');
      const now = new Date();
      if (timeRange === 'today') {
        return expDate.toDateString() === now.toDateString();
      } else if (timeRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expDate >= weekAgo;
      } else if (timeRange === 'month') {
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }
      return true;
    })
    .reduce((sum, e) => sum + e.amount, 0);
  const ordersCount = filteredOrders.length;
  // Clamped so a period of heavy purchases (expenses) never shows negative "profit"
  const netProfit = Math.max(0, totalSales - totalExpenses);

  // Dynamic comparison with previous period
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;

  let currentStart: Date;
  let prevStart: Date;
  let prevEnd: Date;

  if (timeRange === 'today') {
    currentStart = todayStart;
    prevStart = new Date(todayStart.getTime() - oneDayMs);
    prevEnd = todayStart;
  } else if (timeRange === 'week') {
    currentStart = new Date(now.getTime() - 7 * oneDayMs);
    prevStart = new Date(now.getTime() - 14 * oneDayMs);
    prevEnd = currentStart;
  } else { // month
    currentStart = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    prevStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    prevEnd = currentStart;
  }

  const prevOrdersList = allOrders.filter((o) => {
    const orderDate = new Date(o.createdAt);
    return orderDate >= prevStart && orderDate < prevEnd;
  });
  const prevSales = prevOrdersList
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const prevExpenses = expenses
    .filter((e) => {
      const expDate = new Date(e.date || e.createdAt || '');
      return expDate >= prevStart && expDate < prevEnd;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const prevOrdersCount = prevOrdersList.length;
  const prevNetProfit = Math.max(0, prevSales - prevExpenses);

  const getChangePct = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const salesChange = getChangePct(totalSales, prevSales);
  const expensesChange = getChangePct(totalExpenses, prevExpenses);
  const profitChange = getChangePct(netProfit, prevNetProfit);
  const ordersChange = getChangePct(ordersCount, prevOrdersCount);

  // Helper to render trend badge dynamically
  const TrendBadge: React.FC<{ value: number; invertColors?: boolean }> = ({ value, invertColors = false }) => {
    if (value === 0) return null; // Hide the badge if there is no previous period data to compare with
    const isPositiveChange = value >= 0;
    const isGood = invertColors ? !isPositiveChange : isPositiveChange;
    const sign = isPositiveChange ? '+' : '';
    return (
      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
        isGood ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
      }`}>
        {isPositiveChange ? '↗' : '↘'} {sign}{value}%
      </span>
    );
  };

  // Profit margin — still useful as a real metric on the profit card
  const profitMarginPct = totalSales > 0 ? Math.max(0, Math.round((netProfit / totalSales) * 100)) : 0;
  const prevProfitMarginPct = prevSales > 0 ? Math.max(0, Math.round((prevNetProfit / prevSales) * 100)) : 0;
  const profitMarginChange = getChangePct(profitMarginPct, prevProfitMarginPct);

  // Completed orders ratio — real metric for orders card
  const completedOrdersCount = filteredOrders.filter((o) => o.status === 'completed').length;
  const prevCompletedCount = prevOrdersList.filter((o) => o.status === 'completed').length;
  const completedRatioChange = getChangePct(completedOrdersCount, prevCompletedCount);

  // Dynamic sales trend from orders
  const salesTrendMap = new Map<string, { totalSales: number; ordersCount: number }>();
  filteredOrders.forEach((order) => {
    const day = new Date(order.createdAt).toLocaleDateString('ar-EG', { weekday: 'long' });
    const existing = salesTrendMap.get(day) || { totalSales: 0, ordersCount: 0 };
    existing.totalSales += order.totalAmount;
    existing.ordersCount += 1;
    salesTrendMap.set(day, existing);
  });

  const salesTrend = Array.from(salesTrendMap.entries()).map(([day, val]) => ({
    _id: day,
    totalSales: val.totalSales,
    ordersCount: val.ordersCount,
  }));

  // Dynamic top products from orders
  const productSales = new Map<string, { name: string; quantitySold: number; revenueGenerated: number }>();
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      const pName = typeof item.product === 'object' ? item.product.name : 'منتج';
      const existing = productSales.get(pName) || { name: pName, quantitySold: 0, revenueGenerated: 0 };
      existing.quantitySold += item.quantity;
      existing.revenueGenerated += item.price * item.quantity;
      productSales.set(pName, existing);
    });
  });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
    .slice(0, 3);

  const handleExportCSV = () => {
    try {
      const csvRows = [
        ["تقرير لوحة التحكم", `الفترة: ${timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'}`],
        ["المؤشر", "القيمة"],
        ["إجمالي المبيعات", `${totalSales} ج.م`],
        ["إجمالي المصروفات", `${totalExpenses} ج.م`],
        ["صافي الأرباح", `${netProfit} ج.م`],
        ["حجم الطلبات", `${ordersCount} طلب`]
      ];
      
      const csvContent = "\uFEFF" + csvRows.map(row => row.map(val => `"${val}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `تقرير_لوحة_التحكم_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("تم تصدير التقرير المالي بنجاح", "success");
    } catch (err) {
      showError(err);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header - RTL Layout: Title and description on right, filtering/actions on left */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200/70">
        <div>
          <h1 className="text-xl font-bold font-arabic-heading text-gray-900">
            لوحة الإدارة
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            عرض إحصائيات المبيعات والنشاط المالي الفوري للمقهى.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
            title="تحديث"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#2e5b9f]' : ''}`} />
          </button>

          <div className="bg-[#f0ebe1] p-1 rounded-xl border border-gray-200/70 flex items-center gap-1 text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`py-1 px-3 rounded-lg font-bold transition cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`py-1 px-3 rounded-lg font-bold transition cursor-pointer ${
                timeRange === 'week'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الأسبوع
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`py-1 px-3 rounded-lg font-bold transition cursor-pointer ${
                timeRange === 'month'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الشهر
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-1.5 px-3 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير</span>
          </button>
        </div>
      </div>

      {/* Quick Action Bar - Responsive: 2 cols on xs, 3 on sm, 4 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center justify-between p-2.5 sm:p-3 bg-white hover:bg-blue-50/40 border border-gray-200/80 rounded-xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2e5b9f] flex items-center justify-center font-bold flex-shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">نقطة البيع</span>
            <span className="text-[10px] text-gray-400 truncate block">شاشة الكاشير</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center justify-between p-2.5 sm:p-3 bg-white hover:bg-emerald-50/40 border border-gray-200/80 rounded-xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">إضافة منتج</span>
            <span className="text-[10px] text-gray-400 truncate block">المنيو والأسعار</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/inventory')}
          className="flex items-center justify-between p-2.5 sm:p-3 bg-white hover:bg-amber-50/40 border border-gray-200/80 rounded-xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <Boxes className="w-3.5 h-3.5" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">جرد المخزن</span>
            <span className="text-[10px] text-gray-400 truncate block">أرصدة الخامات</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/expenses')}
          className="flex items-center justify-between p-2.5 sm:p-3 bg-white hover:bg-rose-50/40 border border-gray-200/80 rounded-xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-[#9f1239] flex items-center justify-center font-bold flex-shrink-0">
            <ReceiptText className="w-3.5 h-3.5" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">تسجيل مصروف</span>
            <span className="text-[10px] text-gray-400 truncate block">نفقات وتشغيل</span>
          </div>
        </button>
      </div>

      {/* 4 Metric Cards - Responsive: 1 col on xs, 2 on sm, 3 on md, 4 on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                {timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'}
              </span>
              <TrendBadge value={salesChange} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2e5b9f] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xs text-gray-500 font-bold block">إجمالي المبيعات</span>
            <span className="text-xl font-bold text-[#2e5b9f] mt-0.5 block">
              {formatPrice(totalSales)}
            </span>
            <ChangePctBar 
              change={salesChange} 
              label={
                timeRange === 'today' ? 'مقارنةً باليوم السابق' : 
                timeRange === 'week' ? 'مقارنةً بالأسبوع السابق' : 
                'مقارنةً بالشهر السابق'
              }
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                {timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'}
              </span>
              <TrendBadge value={expensesChange} invertColors />
            </div>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-[#9f1239] flex items-center justify-center font-bold">
              <ReceiptText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xs text-gray-500 font-bold block">إجمالي المصروفات</span>
            <span className="text-xl font-bold text-[#9f1239] mt-0.5 block">
              {formatPrice(totalExpenses)}
            </span>
            <ChangePctBar 
              change={expensesChange} 
              invertColors 
              label={
                timeRange === 'today' ? 'مقارنةً باليوم السابق' : 
                timeRange === 'week' ? 'مقارنةً بالأسبوع السابق' : 
                'مقارنةً بالشهر السابق'
              }
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                {timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'}
              </span>
              <TrendBadge value={profitChange} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xs text-gray-500 font-bold block">صافي الأرباح</span>
            <span className="text-xl font-bold text-emerald-700 mt-0.5 block">
              {formatPrice(netProfit)}
            </span>
            <ChangePctBar 
              change={profitMarginChange} 
              label={
                timeRange === 'today' ? 'تغيير الأرباح vs اليوم السابق' : 
                timeRange === 'week' ? 'تغيير الأرباح vs الأسبوع السابق' : 
                'تغيير الأرباح vs الشهر السابق'
              }
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                {timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : 'الشهر'}
              </span>
              <TrendBadge value={ordersChange} />
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-xs text-gray-500 font-bold block">حجم الطلبات</span>
            <span className="text-xl font-bold text-gray-900 mt-0.5 block">
              {formatNumber(ordersCount)} طلب
            </span>
            <ChangePctBar 
              change={completedRatioChange} 
              label={
                timeRange === 'today' ? 'الطلبات المكتملة vs اليوم السابق' : 
                timeRange === 'week' ? 'الطلبات المكتملة vs الأسبوع السابق' : 
                'الطلبات المكتملة vs الشهر السابق'
              }
            />
          </div>
        </div>
      </div>

      {/* Middle Row: Sales Chart & Top Products - RTL: Chart on right (order-1), Sidebar on left (order-2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Weekly Sales Chart (7 cols) - Right side visually */}
        <div className="lg:col-span-7 lg:order-1 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'آخر 7 أيام' : 'هذا الشهر'}
            </span>
            <h3 className="font-bold text-xs text-gray-900">مبيعات الفترة</h3>
          </div>

          {salesTrend.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-xs">
              لا توجد بيانات مبيعات في هذه الفترة.
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-2.5 pt-4 pb-1">
              {salesTrend.map((item, idx) => {
                const max = Math.max(...salesTrend.map((s) => s.totalSales), 1);
                const heightPercent = Math.min(100, Math.round((item.totalSales / max) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <span className="text-[9px] font-mono text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatNumber(item.totalSales)}
                    </span>
                    <div className="w-full max-w-[32px] bg-[#faf8f5] rounded-t-lg h-32 flex items-end overflow-hidden border border-gray-100">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-[#2e5b9f] group-hover:bg-[#244b85] transition-all rounded-t-lg shadow-2xs"
                      />
                    </div>
                    <span className="text-[10px] font-medium text-gray-600 mt-0.5">{item._id}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Selling Drinks & Alert (5 cols) - Left side visually */}
        <div className="lg:col-span-5 lg:order-2 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
            <span className="text-[11px] text-gray-400 font-mono">الأعلى طلباً</span>
            <h3 className="font-bold text-xs text-gray-900">أكثر المشروبات طلباً</h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-bold">
              لا توجد بيانات مبيعات في هذه الفترة.
            </div>
          ) : (
            <div className="space-y-2">
              {topProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#faf8f5] border border-gray-100"
                >
                  <span className="font-bold text-xs font-mono text-[#2e5b9f]">
                    {formatPrice(prod.revenueGenerated)}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block truncate max-w-[150px]">
                      {prod.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatNumber(prod.quantitySold)} مباع
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lowStockItems.length > 0 && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-right flex items-center justify-between text-xs">
              <button
                onClick={() => navigate('/admin/inventory')}
                className="font-bold text-[#2e5b9f] hover:underline text-[11px]"
              >
                توريد الآن ←
              </button>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-900 text-xs">
                  تنبيه: {lowStockItems[0].name} ({formatNumber(lowStockItems[0].quantity)} {lowStockItems[0].unit})
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <button
            onClick={() => navigate('/admin/sales')}
            className="text-xs font-bold text-[#2e5b9f] hover:underline"
          >
            السجل الكامل ←
          </button>
          <h3 className="font-bold text-xs text-gray-900">أحدث الطلبات</h3>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 mx-2">
            <div className="w-14 h-14 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <p className="text-gray-600 font-bold text-sm">لا توجد طلبات في هذه الفترة</p>
          <p className="text-xs text-gray-500 mt-2">نفّذ طلبات جديدة من شاشة الكاشير وستظهر هنا فوراً.</p>
          </div>
        ) : (
          <>
            {/* Mobile & Tablet Card Layout (< md) */}
            <div className="space-y-3 md:hidden">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-[#faf8f5]/50 border border-gray-200/60 rounded-xl p-3.5 space-y-2.5 text-xs text-right"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-gray-900">
                      #{order.orderNumber.slice(-6)}
                    </span>
                    <span className={`inline-flex items-center gap-1 py-0.5 px-2 text-[10px] font-bold rounded ${
                      order.status === 'cancelled'
                        ? 'bg-rose-50 text-[#9f1239]'
                        : order.status === 'pending'
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-emerald-50 text-emerald-800'
                    }`}>
                      {order.status === 'cancelled' ? 'ملغي' : order.status === 'pending' ? 'قيد التحضير' : 'مكتمل'}
                    </span>
                  </div>
                  
                  <div className="text-[11px] text-gray-400 font-mono">
                    {formatDateTime(order.createdAt)}
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-gray-400">النوع</span>
                      <span className="font-bold text-gray-700">
                        {order.orderType === 'dine-in' ? `صالة #${order.tableNumber || 1}` : 'سفري'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 items-center">
                      <span className="text-[10px] text-gray-400">الأصناف</span>
                      <span className="font-bold text-gray-700 font-mono">
                        {formatNumber(order.items.length)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 items-end">
                      <span className="text-[10px] text-gray-400">المبلغ</span>
                      <span className="font-bold text-[#2e5b9f] font-mono">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-gray-100/50">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex items-center gap-1 text-[#2e5b9f] hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة الفاتورة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout (>= md) */}
            <div className="hidden md:block overflow-x-auto -mx-5 px-5 pb-2">
              <table className="w-full text-right border-collapse text-xs min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                    <th className="pb-2 px-3">رقم الطلب</th>
                    <th className="pb-2 px-3">التاريخ</th>
                    <th className="pb-2 px-3">النوع / الطاولة</th>
                    <th className="pb-2 px-3">الأصناف</th>
                    <th className="pb-2 px-3">المبلغ</th>
                    <th className="pb-2 px-3">الحالة</th>
                    <th className="pb-2 px-3 text-left">معاينة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-800">
                  {filteredOrders.map((order) => {
                    return (
                      <tr key={order._id} className="hover:bg-[#faf8f5]/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                          #{order.orderNumber.slice(-6)}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-mono text-gray-700 text-[11px] font-bold">
                              {formatDate(order.createdAt)}
                            </span>
                            <span className="font-mono text-gray-400 text-[10px]">
                              {formatTime(order.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">
                          <span className="inline-flex py-0.5 px-2 bg-blue-50 text-[#2e5b9f] font-bold rounded text-[10px]">
                            {order.orderType === 'dine-in' ? `صالة #${order.tableNumber || 1}` : 'سفري'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-500 font-mono">{formatNumber(order.items.length)} أصناف</td>
                        <td className="py-2.5 px-3 font-bold font-mono text-[#2e5b9f]">
                          {formatPrice(order.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 py-0.5 px-2 text-[11px] font-bold rounded ${
                            order.status === 'cancelled'
                              ? 'bg-rose-50 text-[#9f1239]'
                              : order.status === 'pending'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {order.status === 'cancelled' ? 'ملغي' : order.status === 'pending' ? 'قيد التحضير' : 'مكتمل'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-left">
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="inline-flex items-center gap-1 text-[#2e5b9f] hover:underline font-bold text-xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>فاتورة</span>
                          </button>
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

      <ReceiptModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};