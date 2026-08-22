import React, { useState, useEffect, useRef } from 'react';
import { analyticsService, orderService, expenseService, inventoryService } from '../../services/opsService';
import { recipeService } from '../../services/catalogService';
import { KPIStats, ChartsData, Order, Expense, InventoryItem, ExpenseCategory } from '../../types';
import { AttaStatCard } from '../../components/ui/AttaStatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ExportModal } from '../../components/ui/ExportModal';
import { exportElementToPdf } from '../../utils/pdfExport';
import { useNotification } from '../../contexts/NotificationContext';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Download, Award, AlertCircle, Calendar, PieChart, Medal, Info } from 'lucide-react';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';

/** Estimated per-product financials computed on the client */
interface ProductStat {
  name: string;
  qty: number;
  revenue: number;
  /** Estimated net profit (revenue − recipe cost) when recipe data exists; otherwise null */
  profit: number | null;
}

const rankValue = (p: ProductStat) => (p.profit !== null ? p.profit : p.revenue);

const EXPENSE_CATEGORY_META: Record<ExpenseCategory, { label: string; color: string }> = {
  rent: { label: 'الإيجار', color: 'bg-purple-500' },
  salaries: { label: 'الرواتب', color: 'bg-blue-500' },
  utilities: { label: 'المرافق', color: 'bg-cyan-500' },
  inventory: { label: 'مشتريات المخزون', color: 'bg-rose-500' },
  other: { label: 'أخرى', color: 'bg-gray-400' },
};

export const AdminReportsPage: React.FC = () => {
  const { showToast, showError } = useNotification();
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  /** productId → estimated cost per unit, derived from active recipes + inventory cost prices */
  const [unitCostMap, setUnitCostMap] = useState<Map<string, number>>(new Map());
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const [statsRes, chartsRes, ordersRes, expRes, recipesRes, invRes] = await Promise.all([
          analyticsService.getStats(),
          analyticsService.getCharts(),
          orderService.getOrders(),
          expenseService.listExpenses(),
          recipeService.listRecipes().catch(() => null),
          inventoryService.listInventory().catch(() => null),
        ]);
        if (statsRes?.success && statsRes.data) setStats(statsRes.data);
        if (chartsRes?.success && chartsRes.data) setCharts(chartsRes.data);
        if (ordersRes?.success && ordersRes.data) setOrders(ordersRes.data);
        if (expRes?.success && expRes.data) setExpenses(expRes.data);

        // Build estimated unit-cost map (best-effort — silently skipped if data unavailable)
        try {
          const invList = invRes?.success && Array.isArray(invRes.data) ? invRes.data : [];
          const invById = new Map<string, InventoryItem>(invList.map((i) => [i._id, i]));
          const recipes = recipesRes?.success && Array.isArray(recipesRes.data) ? recipesRes.data : [];
          const costMap = new Map<string, number>();
          recipes.forEach((r) => {
            if (!r.isActive) return;
            const pid = typeof r.product === 'string' ? r.product : r.product._id;
            const unitCost = r.ingredients.reduce((sum, ing) => {
              const inv = typeof ing.inventoryItem === 'object' ? ing.inventoryItem : invById.get(ing.inventoryItem);
              if (!inv || !inv.costPrice) return sum;
              return sum + (ing.consumptionPerUnitInBase || 0) * inv.costPrice;
            }, 0);
            if (unitCost > 0) costMap.set(pid, unitCost);
          });
          setUnitCostMap(costMap);
        } catch (costErr) {
          console.warn('Cost estimation skipped:', costErr);
        }
      } catch (err) {
        console.error('Error loading reports', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, []);

  if (isLoading) {
    return <LoadingSpinner text="جاري تجهيز التقارير المالية..." />;
  }

  // Filter orders by date
  const filteredOrders = orders.filter((o) => {
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
      }
    }
    return matchesDate;
  });

  // Filter expenses by date
  const filteredExpenses = expenses.filter((e) => {
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
    return matchesDate;
  });

  // Dynamic KPIs from filtered data
  const totalRevenue = filteredOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);
  const totalExpensesFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  // Clamped so purchases/more expenses never surface a negative "net profit"
  const netProfit = Math.max(0, totalRevenue - totalExpensesFiltered);
  const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // Real percentage indicators for the KPI cards
  const combinedTotal = totalRevenue + totalExpensesFiltered;
  const revenueShare = combinedTotal > 0 ? Math.round((totalRevenue / combinedTotal) * 100) : 0;
  const expensesShare = combinedTotal > 0 ? Math.round((totalExpensesFiltered / combinedTotal) * 100) : 0;

  // Per-product stats from filtered orders (+ estimated profit when recipe cost data exists)
  const productStats = new Map<string, ProductStat>();
  filteredOrders.forEach((order) => {
    order.items.forEach((item) => {
      const pId = typeof item.product === 'object' ? item.product._id : item.product;
      const pName = typeof item.product === 'object' ? item.product.name : 'منتج';
      const existing = productStats.get(pName) || { name: pName, qty: 0, revenue: 0, profit: null };
      existing.qty += item.quantity;
      existing.revenue += item.price * item.quantity;
      const unitCost = pId ? unitCostMap.get(pId) : undefined;
      if (unitCost !== undefined) {
        existing.profit = (existing.profit ?? 0) + (item.price - unitCost) * item.quantity;
      }
      productStats.set(pName, existing);
    });
  });
  const hasCostData = Array.from(productStats.values()).some((p) => p.profit !== null);

  const sortedByProfit = Array.from(productStats.values()).sort((a, b) => rankValue(b) - rankValue(a));

  // Top performers — best 5 by estimated profit (falls back to revenue when no recipes)
  const topProducts = sortedByProfit.slice(0, 5);
  const topProductNames = new Set(topProducts.map((p) => p.name));

  // Bottom performers — NEVER overlap with the top list (same product can't appear in both)
  const bottomProducts = sortedByProfit
    .filter((p) => !topProductNames.has(p.name))
    .sort((a, b) => rankValue(a) - rankValue(b))
    .slice(0, 5);

  const maxTopValue = Math.max(...topProducts.map((p) => Math.abs(rankValue(p))), 1);
  const maxBottomValue = Math.max(...bottomProducts.map((p) => Math.abs(rankValue(p))), 1);

  // Expense totals per category (respects the selected period filter)
  const expenseCategoryRows = Object.entries(
    filteredExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {})
  )
    .map(([cat, amount]) => ({ cat: cat as ExpenseCategory, amount }))
    .sort((a, b) => b.amount - a.amount);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    try {
      setIsExportingPdf(true);
      showToast('جاري تجهيز ملف الـ PDF... ⏳', 'info');
      await exportElementToPdf(contentRef.current, `تقرير_مالي_الفيشاوي_${dateFilter}`);
      showToast('تم تنزيل ملف PDF بنجاح ✅', 'success');
    } catch (err) {
      showError(err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportCSV = () => {
    try {
      const csvRows = [
        ["التقرير المالي - مقهى الفيشاوي", `الفترة: ${dateFilter === 'today' ? 'اليوم' : dateFilter === 'week' ? 'آخر 7 أيام' : dateFilter === 'month' ? 'هذا الشهر' : 'الكل'}`],
        ["المؤشر", "القيمة"],
        ["إجمالي الإيرادات", `${totalRevenue} ج.م`],
        ["إجمالي المصروفات", `${totalExpensesFiltered} ج.م`],
        ["صافي الأرباح", `${netProfit} ج.م`],
        ["هامش الربحية", `${profitMargin}%`],
        ["", ""],
        ...topProducts.map((p, i) => [`أعلى ربحاً #${i + 1}`, `${p.name} — ${formatPrice(rankValue(p))} (${formatNumber(p.qty)} وحدة)`] as [string, string]),
        ...bottomProducts.map((p, i) => [`الأقل ربحاً #${i + 1}`, `${p.name} — ${formatPrice(rankValue(p))} (${formatNumber(p.qty)} وحدة)`] as [string, string]),
      ];
      const csvContent = "\uFEFF" + csvRows.map(row => row.map(val => `"${val}"`).join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `تقرير_مالي_${dateFilter}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={contentRef} className="space-y-6 text-right font-sans print-report bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs text-gray-900">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold font-arabic-heading text-gray-900 flex items-center gap-2">
            التقارير المالية والتحليلية
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            مؤشرات الربحية، كفاءة التشغيل، ومقارنات أداء المبيعات مقابل المصروفات.
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={isExportingPdf}
          className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-4 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer no-print border border-blue-500/30"
        >
          <Download className="w-4 h-4" />
          <span>تصدير التقرير (PDF / إكسل)</span>
        </button>
      </div>
      
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right text-gray-900">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-gray-500 ml-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#2e5b9f]" /> الفترة:
          </span>
          {(
            [
              { id: 'all', label: 'كل الفترات' },
              { id: 'today', label: 'اليوم' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'month', label: 'هذا الشهر' },
            ] as const
          ).map((df) => (
            <button
              key={df.id}
              onClick={() => setDateFilter(df.id)}
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

        <span className="text-xs font-mono font-bold text-gray-500">
          {formatNumber(filteredOrders.length)} طلب • {formatNumber(filteredExpenses.length)} مصروف
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AttaStatCard
          title="إجمالي الإيرادات"
          value={formatPrice(totalRevenue)}
          accentColor="blue"
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          periodLabel="الإيرادات الكلية"
        />
        <AttaStatCard
          title="إجمالي المصروفات"
          value={formatPrice(totalExpensesFiltered)}
          accentColor="rose"
          icon={<DollarSign className="w-5 h-5 text-rose-500" />}
          periodLabel="المصروفات الكلية"
        />
        <AttaStatCard
          title="صافي الربح"
          value={formatPrice(netProfit)}
          accentColor="emerald"
          icon={<Award className="w-5 h-5 text-emerald-500" />}
          periodLabel="الأرباح المحققة"
        />
        <AttaStatCard
          title="هامش الربح التشغيلي"
          value={`%${formatNumber(profitMargin)}`}
          accentColor="purple"
          icon={<BarChart3 className="w-5 h-5 text-purple-500" />}
          periodLabel={profitMargin > 50 ? 'معدل ممتاز' : profitMargin > 30 ? 'معدل جيد' : 'يحتاج تحسين'}
        />
      </div>

      {/* Profitability Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Top Profitable Products */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-1 rounded-lg">
              الأعلى ربحية
            </span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                <Medal className="w-4 h-4 text-emerald-600" />
              </span>
              <span>المنتجات الأكثر ربحاً</span>
            </h3>
          </div>

          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            {hasCostData
              ? 'الترتيب حسب صافي الربح التقديري (السعر − تكلفة الوصفة)'
              : 'الترتيب حسب الإيراد — أضف وصفات تكلفة للمنتجات لحساب الربح الفعلي'}
          </p>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا توجد بيانات مبيعات في هذه الفترة.
            </div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className={`w-7 h-7 shrink-0 rounded-xl border flex items-center justify-center text-[11px] font-black font-mono ${
                    idx === 0
                      ? 'bg-amber-50 border-amber-300 text-amber-600'
                      : idx === 1
                        ? 'bg-slate-50 border-slate-300 text-slate-500'
                        : idx === 2
                          ? 'bg-orange-50 border-orange-200 text-orange-500'
                          : 'bg-emerald-50/60 border-emerald-200/60 text-emerald-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900 truncate">{p.name}</span>
                      <span className="text-xs font-black font-mono text-emerald-600 shrink-0">
                        {formatPrice(rankValue(p))}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, Math.round((Math.abs(rankValue(p)) / maxTopValue) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 font-mono">
                      <span>{p.profit !== null ? 'ربح تقديري' : 'إيراد'}</span>
                      <span>{formatNumber(p.qty)} وحدة • {formatPrice(p.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Least Profitable Products — guaranteed no overlap with the top list */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200/60 px-2 py-1 rounded-lg">
              تحتاج مراجعة
            </span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </span>
              <span>المنتجات الأقل ربحاً</span>
            </h3>
          </div>

          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            لا يتكرر أي منتج هنا مع قائمة الأعلى ربحية — منتجات مختلفة تماماً.
          </p>

          {bottomProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              {productStats.size === 0
                ? 'لا توجد بيانات مبيعات في هذه الفترة.'
                : 'عدد المنتجات المباعة قليل — لا توجد منتجات خارج قائمة الأعلى.'}
            </div>
          ) : (
            <div className="space-y-3">
              {bottomProducts.map((p, idx) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="w-7 h-7 shrink-0 rounded-xl border border-rose-200/60 bg-rose-50/60 flex items-center justify-center text-[11px] font-black font-mono text-rose-500">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-900 truncate">{p.name}</span>
                      <span className="text-xs font-black font-mono text-rose-500 shrink-0">
                        {formatPrice(rankValue(p))}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-rose-300 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, Math.round((Math.abs(rankValue(p)) / maxBottomValue) * 100))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400 font-mono">
                      <span>{p.profit !== null ? 'ربح تقديري' : 'إيراد'}</span>
                      <span>{formatNumber(p.qty)} وحدة فقط • {formatPrice(p.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Expense Breakdown + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Expenses by Category */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs text-gray-400 font-mono">{formatPrice(totalExpensesFiltered)}</span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200/60 flex items-center justify-center">
                <PieChart className="w-4 h-4 text-rose-500" />
              </span>
              <span>توزيع المصروفات حسب الفئة</span>
            </h3>
          </div>

          {expenseCategoryRows.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا توجد مصروفات في هذه الفترة.
            </div>
          ) : (
            <div className="space-y-3">
              {expenseCategoryRows.map(({ cat, amount }) => {
                const meta = EXPENSE_CATEGORY_META[cat] || EXPENSE_CATEGORY_META.other;
                const pct = totalExpensesFiltered > 0 ? Math.round((amount / totalExpensesFiltered) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="font-black font-mono text-gray-900">
                        {formatPrice(amount)} <span className="text-gray-400 font-normal">({formatNumber(pct)}%)</span>
                      </span>
                      <span className="font-bold text-gray-700">{meta.label}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`${meta.color} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(3, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Orders Summary */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
          <span className="text-xs text-gray-400 font-mono">آخر العمليات</span>
          <h3 className="font-bold text-base text-gray-900">ملخص الطلبات والمصروفات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 mb-2">أحدث الطلبات</h4>
            {filteredOrders.slice(0, 5).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-gray-100 text-xs">
                <span className="font-mono font-bold text-gray-900">#{order.orderNumber.slice(-4)}</span>
                <span className="text-gray-500 font-mono">{formatDate(order.createdAt)}</span>
                <span className="font-bold font-mono text-[#2e5b9f]">{formatPrice(order.totalAmount)}</span>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">لا توجد طلبات في هذه الفترة.</div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-700 mb-2">أحدث المصروفات</h4>
            {filteredExpenses.slice(0, 5).map((exp) => (
              <div key={exp._id} className="flex items-center justify-between p-2.5 rounded-xl bg-[#faf8f5] border border-gray-100 text-xs">
                <span className="font-bold text-gray-900 truncate max-w-[150px]">{exp.description}</span>
                <span className="text-gray-500 font-mono">{formatDate(exp.date)}</span>
                <span className="font-bold font-mono text-[#9f1239]">{formatPrice(exp.amount)}</span>
              </div>
            ))}
            {filteredExpenses.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-xs">لا توجد مصروفات في هذه الفترة.</div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Export Selection Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        title="تصدير التقرير المالي للكافيه"
        periodLabel={dateFilter === 'today' ? 'اليوم' : dateFilter === 'week' ? 'الأسبوع' : dateFilter === 'month' ? 'الشهر' : 'العام'}
      />
    </div>
  );
};