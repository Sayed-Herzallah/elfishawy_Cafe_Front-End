import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { analyticsService, orderService, inventoryService, expenseService } from '../../services/opsService';
import { KPIStats, ChartsData, Order, InventoryItem, Expense } from '../../types';
import { ReceiptModal } from '../../components/ui/ReceiptModal';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { AttaGlowingChart, ChartDataPoint } from '../../components/ui/AttaGlowingChart';
import { AttaStatCard } from '../../components/ui/AttaStatCard';
import { ExportModal } from '../../components/ui/ExportModal';
import { exportElementToPdf } from '../../utils/pdfExport';
import {
  formatPrice,
  formatNumber,
  formatDate,
  formatTime,
  formatDateTime
} from '../../utils/formatters';
import {
  TrendingUp,
  ReceiptText,
  ShoppingBag,
  Coins,
  AlertTriangle,
  Download,
  Eye,
  Plus,
  Store,
  Boxes,
  RefreshCw,
  Calendar,
  Sparkles,
} from 'lucide-react';

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
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  // مرجع لمحتوى التقرير عشان تصدير الـ PDF
  const contentRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

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
      // اعرض الخطأ للمستخدم بدل الهياكل المعلقة بصمت
      showError(err);
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

  // Note: no early return here — useMemo below must not be called conditionally (Rules of Hooks)

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
    } else if (timeRange === 'year') {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return orderDate >= yearAgo;
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
      } else if (timeRange === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return expDate >= yearAgo;
      }
      return true;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const ordersCount = filteredOrders.length;
  const netProfit = Math.max(0, totalSales - totalExpenses);

  // Dynamic comparison with previous period
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;

  let prevStart: Date;
  let prevEnd: Date;
  let prevPeriodLabel = 'أمس';

  if (timeRange === 'today') {
    prevStart = new Date(todayStart.getTime() - oneDayMs);
    prevEnd = todayStart;
    prevPeriodLabel = 'اليوم السابق (أمس)';
  } else if (timeRange === 'week') {
    prevStart = new Date(now.getTime() - 14 * oneDayMs);
    prevEnd = new Date(now.getTime() - 7 * oneDayMs);
    prevPeriodLabel = 'الأسبوع السابق';
  } else if (timeRange === 'month') {
    prevStart = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
    prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    prevPeriodLabel = 'الشهر السابق';
  } else {
    prevStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    prevEnd = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    prevPeriodLabel = 'العام السابق';
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
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const salesChange = getChangePct(totalSales, prevSales);
  const expensesChange = getChangePct(totalExpenses, prevExpenses);
  const profitChange = getChangePct(netProfit, prevNetProfit);
  const ordersChange = getChangePct(ordersCount, prevOrdersCount);

  // Generate multi-series Chart Data points for AttaGlowingChart
  const chartDataPoints: ChartDataPoint[] = useMemo(() => {
    if (timeRange === 'today') {
      const timeSlots = [
        { label: '10:00 ص', hour: 10 },
        { label: '12:00 ظ', hour: 12 },
        { label: '02:00 م', hour: 14 },
        { label: '04:00 م', hour: 16 },
        { label: '06:00 م', hour: 18 },
        { label: '08:00 م', hour: 20 },
        { label: '10:00 م', hour: 22 },
        { label: '12:00 ص', hour: 24 },
      ];

      return timeSlots.map((slot, idx) => {
        const slotOrders = filteredOrders.filter((o) => {
          const h = new Date(o.createdAt).getHours();
          const prevHour = idx === 0 ? 0 : timeSlots[idx - 1].hour;
          return h >= prevHour && h < slot.hour;
        });

        const s = slotOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const ords = slotOrders.length;
        const exp = Math.round(totalExpenses / timeSlots.length);
        const p = Math.max(0, s - exp);

        return {
          label: slot.label,
          sales: s,
          orders: ords,
          expenses: exp,
          profit: p,
        };
      });
    }

    if (timeRange === 'week') {
      const days = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      const map = new Map<string, { sales: number; orders: number; expenses: number }>();
      days.forEach((d) => map.set(d, { sales: 0, orders: 0, expenses: 0 }));

      filteredOrders.forEach((o) => {
        const day = new Date(o.createdAt).toLocaleDateString('ar-EG', { weekday: 'long' });
        const cur = map.get(day) || { sales: 0, orders: 0, expenses: 0 };
        cur.sales += o.totalAmount;
        cur.orders += 1;
        map.set(day, cur);
      });

      expenses.forEach((e) => {
        const day = new Date(e.date || e.createdAt || '').toLocaleDateString('ar-EG', { weekday: 'long' });
        if (map.has(day)) {
          const cur = map.get(day)!;
          cur.expenses += e.amount;
          map.set(day, cur);
        }
      });

      return days.map((day) => {
        const val = map.get(day) || { sales: 0, orders: 0, expenses: 0 };
        return {
          label: day,
          sales: val.sales,
          orders: val.orders,
          expenses: val.expenses,
          profit: Math.max(0, val.sales - val.expenses),
        };
      });
    }

    if (timeRange === 'month') {
      const weeks = ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'];
      return weeks.map((w, idx) => {
        const weekOrders = filteredOrders.filter((o) => {
          const day = new Date(o.createdAt).getDate();
          return day >= idx * 7 + 1 && day <= (idx + 1) * 7;
        });

        const s = weekOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const ords = weekOrders.length;
        const exp = Math.round(totalExpenses / 4);
        return {
          label: w,
          sales: s,
          orders: ords,
          expenses: exp,
          profit: Math.max(0, s - exp),
        };
      });
    }

    // Year (12 months)
    const months = [
      'سبتمبر 2025', 'أكتوبر 2025', 'نوفمبر 2025', 'ديسمبر 2025',
      'يناير 2026', 'فبراير 2026', 'مارس 2026', 'أبريل 2026',
      'مايو 2026', 'يونيو 2026', 'يوليو 2026', 'أغسطس 2026'
    ];

    return months.map((m, idx) => {
      const monthOrders = allOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === (idx + 8) % 12;
      });

      const s = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0) || (idx >= 7 ? totalSales / 5 : 0);
      const ords = monthOrders.length || (idx >= 7 ? Math.round(ordersCount / 5) : 0);
      const exp = Math.round(totalExpenses / 12);
      return {
        label: m,
        sales: Math.round(s),
        orders: ords,
        expenses: exp,
        profit: Math.max(0, Math.round(s - exp)),
      };
    });
  }, [timeRange, filteredOrders, allOrders, expenses, totalSales, totalExpenses, ordersCount]);

  // Top products
  // ⚠️ حماية من البيانات الناقصة: منتج محذوف (null) أو items ناقصة كانت بتعمل
  // TypeError وواقعة الصفحة كلها — دلوقتي بنتخطى العنصر التالف بأمان
  const productSales = new Map<string, { name: string; quantitySold: number; revenueGenerated: number }>();
  filteredOrders.forEach((order) => {
    if (!order || !Array.isArray(order.items)) return;
    order.items.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const productName = (item as any).product;
      const pName =
        productName && typeof productName === 'object' && typeof productName.name === 'string' && productName.name.trim()
          ? productName.name
          : 'منتج محذوف';
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const existing = productSales.get(pName) || { name: pName, quantitySold: 0, revenueGenerated: 0 };
      existing.quantitySold += quantity;
      existing.revenueGenerated += price * quantity;
      productSales.set(pName, existing);
    });
  });

  const topProducts = Array.from(productSales.values())
    .sort((a, b) => b.revenueGenerated - a.revenueGenerated)
    .slice(0, 4);

  // PDF & CSV Export Handlers
  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    try {
      setIsExportingPdf(true);
      showToast('جاري تجهيز ملف الـ PDF... ⏳', 'info');
      await exportElementToPdf(contentRef.current, `تقرير_كافيه_الفيشاوي_${timeRange}`);
      showToast('تم تنزيل ملف الـ PDF بنجاح ✅', 'success');
    } catch (err) {
      console.error('PDF export failed', err);
      showError(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvRows = [
        ['تقرير لوحة تحكم مقهى الفيشاوي', `الفترة: ${timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : timeRange === 'month' ? 'الشهر' : 'السنة'}`],
        ['المؤشر المالي', 'القيمة الحالية', 'قيمة الفترة السابقة', 'نسبة التغير %'],
        ['إجمالي المبيعات', `${totalSales} ج.م`, `${prevSales} ج.م`, `${salesChange}%`],
        ['إجمالي المصروفات', `${totalExpenses} ج.م`, `${prevExpenses} ج.م`, `${expensesChange}%`],
        ['صافي الأرباح', `${netProfit} ج.م`, `${prevNetProfit} ج.م`, `${profitChange}%`],
        ['حجم الطلبات', `${ordersCount} طلب`, `${prevOrdersCount} طلب`, `${ordersChange}%`],
      ];

      const csvContent = '\uFEFF' + csvRows.map((row) => row.map((val) => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `تقرير_كافيه_الفيشاوي_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('تم تصدير ملف CSV بنجاح 📊', 'success');
    } catch (err) {
      showError(err);
    }
  };

  return isLoading && !stats ? <LoadingSkeleton type="stat" count={4} /> : (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header - RTL Layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200/70">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-arabic-heading text-gray-900 flex items-center gap-2">
            لوحة الإدارة والإحصائيات
            
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            متابعة فورية للمبيعات، الإيرادات، المصروفات، وأعداد الطلبات بدقة ومقارنة تلقائية مع الفترات السابقة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition cursor-pointer shadow-2xs"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#2e5b9f]' : ''}`} />
          </button>

          {/* Time Range Selector */}
          <div className="bg-[#f0ebe1] p-1 rounded-2xl border border-gray-200/70 flex items-center gap-1 text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`py-1.5 px-3 rounded-xl font-bold transition cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`py-1.5 px-3 rounded-xl font-bold transition cursor-pointer ${
                timeRange === 'week'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الأسبوع
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`py-1.5 px-3 rounded-xl font-bold transition cursor-pointer ${
                timeRange === 'month'
                  ? 'bg-[#2e5b9f] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              الشهر
            </button>
          </div>

          {/* Export Button (Opens PDF/CSV selector) */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 bg-[#2e5b9f] hover:bg-[#244b85] disabled:opacity-60 text-white py-2 px-3.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingPdf ? 'animate-bounce' : ''}`} />
            <span>{isExportingPdf ? 'جاري التجهيز...' : 'تصدير (PDF / إكسل)'}</span>
          </button>
        </div>
      </div>

      {/* ====== محتوى التقرير القابل للتصدير كـ PDF ====== */}
      <div ref={contentRef} className="space-y-6">

      {/* Quick Action Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center justify-between p-3 bg-white hover:bg-blue-50/40 border border-gray-200/80 rounded-2xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2e5b9f] flex items-center justify-center font-bold flex-shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">نقطة البيع (POS)</span>
            <span className="text-[10px] text-gray-400 truncate block">شاشة طلبات الكاشير</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center justify-between p-3 bg-white hover:bg-emerald-50/40 border border-gray-200/80 rounded-2xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold flex-shrink-0">
            <Plus className="w-4 h-4" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">إضافة منتج</span>
            <span className="text-[10px] text-gray-400 truncate block">المنيو والأسعار</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/inventory')}
          className="flex items-center justify-between p-3 bg-white hover:bg-amber-50/40 border border-gray-200/80 rounded-2xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold flex-shrink-0">
            <Boxes className="w-4 h-4" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">جرد المخزن</span>
            <span className="text-[10px] text-gray-400 truncate block">أرصدة الخامات</span>
          </div>
        </button>

        <button
          onClick={() => navigate('/admin/expenses')}
          className="flex items-center justify-between p-3 bg-white hover:bg-rose-50/40 border border-gray-200/80 rounded-2xl transition shadow-2xs cursor-pointer min-w-0"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#9f1239] flex items-center justify-center font-bold flex-shrink-0">
            <ReceiptText className="w-4 h-4" />
          </div>
          <div className="text-right ml-2 min-w-0">
            <span className="text-xs font-bold text-gray-900 block truncate">تسجيل مصروف</span>
            <span className="text-[10px] text-gray-400 truncate block">نفقات وتشغيل</span>
          </div>
        </button>
      </div>

      {/* 4 Sleek Atta-Style Cards (No confusion between today and yesterday) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: المبيعات */}
        <AttaStatCard
          title="إجمالي المبيعات"
          value={formatPrice(totalSales)}
                    icon={<TrendingUp className="w-6 h-6" />}
          accentColor="blue"
          changePct={salesChange}
          periodLabel={timeRange === 'today' ? 'مبيعات اليوم' : timeRange === 'week' ? 'مبيعات الأسبوع' : 'مبيعات الشهر'}
          previousValueText={`${prevPeriodLabel}: ${formatPrice(prevSales)}`}
        />

        {/* Card 2: المصروفات */}
        <AttaStatCard
          title="إجمالي المصروفات"
          value={formatPrice(totalExpenses)}
                    icon={<ReceiptText className="w-6 h-6" />}
          accentColor="rose"
          changePct={expensesChange}
          invertColors
          periodLabel={timeRange === 'today' ? 'مصروفات اليوم' : timeRange === 'week' ? 'مصروفات الأسبوع' : 'مصروفات الشهر'}
          previousValueText={`${prevPeriodLabel}: ${formatPrice(prevExpenses)}`}
        />

        {/* Card 3: صافي الأرباح */}
        <AttaStatCard
          title="صافي الأرباح"
          value={formatPrice(netProfit)}
          icon={<Coins className="w-6 h-6" />}
          accentColor="emerald"
          changePct={profitChange}
          periodLabel={timeRange === 'today' ? 'أرباح اليوم' : timeRange === 'week' ? 'أرباح الأسبوع' : 'أرباح الشهر'}
          previousValueText={`${prevPeriodLabel}: ${formatPrice(prevNetProfit)}`}
        />

        {/* Card 4: حجم الطلبات */}
        <AttaStatCard
          title="حجم الطلبات"
          value={`${formatNumber(ordersCount)} طلب`}
          icon={<ShoppingBag className="w-6 h-6" />}
          accentColor="purple"
          changePct={ordersChange}
          periodLabel={timeRange === 'today' ? 'طلبات اليوم' : timeRange === 'week' ? 'طلبات الأسبوع' : 'طلبات الشهر'}
          previousValueText={`${prevPeriodLabel}: ${formatNumber(prevOrdersCount)} طلب`}
        />
      </div>

      {/* Main Atta Glowing Chart Section */}
      <AttaGlowingChart
        data={chartDataPoints}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        totalSales={totalSales}
        totalOrders={ordersCount}
        totalExpenses={totalExpenses}
        netProfit={netProfit}
        growthRate={salesChange}
        title="مخطط نشاط ومبيعات الكافيه"
      />

      {/* Lower Section: Top Products & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Top Selling Products (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
            <span className="text-[11px] text-gray-400 font-mono">الأكثر طلباً</span>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              ☕ المشروبات الأكثر مبيعاً
            </h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs font-bold">
              لا توجد مبيعات مسجلة في هذه الفترة بعد.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {topProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-gray-100 hover:border-gray-200 transition"
                >
                  <span className="font-bold text-xs font-mono text-[#2e5b9f]">
                    {formatPrice(prod.revenueGenerated)}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block truncate max-w-[140px]">
                      {prod.name}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatNumber(prod.quantitySold)} كوب مباع
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory Stock Alerts (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <button
              onClick={() => navigate('/admin/inventory')}
              className="text-xs font-bold text-[#2e5b9f] hover:underline"
            >
              إدارة المخزن ←
            </button>
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              📦 تنبيهات نواقص الخامات
            </h3>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-6 text-emerald-600 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs font-bold">
              ✓ كافة خامات المخزن متوفرة وبأرصدة آمنة.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockItems.slice(0, 3).map((item) => (
                <div
                  key={item._id}
                  className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-center justify-between text-xs"
                >
                  <button
                    onClick={() => navigate('/admin/inventory')}
                    className="font-bold text-[#2e5b9f] hover:underline text-[11px]"
                  >
                    توريد ←
                  </button>
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-bold text-amber-900 text-xs">
                      {item.name}: <strong className="font-mono text-amber-950">{formatNumber(item.quantity)} {item.unit}</strong>
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <button
            onClick={() => navigate('/admin/sales')}
            className="text-xs font-bold text-[#2e5b9f] hover:underline"
          >
            عرض سجل المبيعات الكامل ←
          </button>
          <h3 className="font-bold text-sm text-gray-900">🧾 أحدث الفواتير المسجلة</h3>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-2xl text-gray-400 mx-2">
            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-gray-600 font-bold text-xs">لا توجد طلبات مسجلة في هذه الفترة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-semibold">
                  <th className="pb-2 px-3">رقم الفاتورة</th>
                  <th className="pb-2 px-3">التاريخ والوقت</th>
                  <th className="pb-2 px-3">النوع / الطاولة</th>
                  <th className="pb-2 px-3">عدد الأصناف</th>
                  <th className="pb-2 px-3">المبلغ المطلوب</th>
                  <th className="pb-2 px-3">الحالة</th>
                  <th className="pb-2 px-3 text-left">طباعة ومعاينة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredOrders.slice(0, 6).map((order) => (
                  <tr key={order._id} className="hover:bg-[#faf8f5]/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-mono text-gray-700 text-[11px] font-bold">
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="font-mono text-gray-400 text-[10px]">
                          {formatTime(order.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex py-0.5 px-2 bg-blue-50 text-[#2e5b9f] font-bold rounded-lg text-[10px]">
                        {order.orderType === 'dine-in' ? `طاولة #${order.tableNumber || 1}` : 'سفري'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 font-mono">{formatNumber(order.items.length)} أصناف</td>
                    <td className="py-3 px-3 font-bold font-mono text-[#2e5b9f]">
                      {formatPrice(order.totalAmount)}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 py-0.5 px-2 text-[11px] font-bold rounded-lg ${
                        order.status === 'cancelled'
                          ? 'bg-rose-50 text-[#9f1239]'
                          : order.status === 'pending'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-emerald-50 text-emerald-800'
                      }`}>
                        {order.status === 'cancelled' ? 'ملغي' : order.status === 'pending' ? 'قيد التحضير' : 'مكتمل ✓'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-left">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1 text-[#2e5b9f] hover:underline font-bold text-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>عرض الفاتورة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
      {/* ====== نهاية محتوى التصدير ====== */}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      {/* PDF / Excel Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        title="تصدير التقرير المالي للكافيه"
        periodLabel={timeRange === 'today' ? 'اليوم' : timeRange === 'week' ? 'الأسبوع' : timeRange === 'month' ? 'الشهر' : 'العام'}
      />
    </div>
  );
};