import React, { useState, useEffect } from 'react';
import { analyticsService, orderService, expenseService } from '../../services/opsService';
import { KPIStats, ChartsData, Order, Expense } from '../../types';
import { StatCard } from '../../components/ui/StatCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { BarChart3, TrendingUp, DollarSign, Download, Award, AlertCircle, Calendar } from 'lucide-react';
import { formatPrice, formatNumber, formatDate } from '../../utils/formatters';

export const AdminReportsPage: React.FC = () => {
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [charts, setCharts] = useState<ChartsData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        const [statsRes, chartsRes, ordersRes, expRes] = await Promise.all([
          analyticsService.getStats(),
          analyticsService.getCharts(),
          orderService.getOrders(),
          expenseService.listExpenses(),
        ]);
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (chartsRes.success && chartsRes.data) setCharts(chartsRes.data);
        if (ordersRes.success && ordersRes.data) setOrders(ordersRes.data);
        if (expRes.success && expRes.data) setExpenses(expRes.data);
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
    .slice(0, 5);

  const bottomProducts = Array.from(productSales.values())
    .sort((a, b) => a.revenueGenerated - b.revenueGenerated)
    .slice(0, 5);

  return (
    <div className="space-y-6 text-right font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200/60">
        <div>
          <h1 className="text-2xl font-bold font-arabic-heading text-gray-900">
            التقارير المالية والتحليلية
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            مؤشرات الربحية، كفاءة التشغيل، ومقارنات أداء المبيعات مقابل المصروفات.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 py-2 px-4 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>طباعة التقرير المالي</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
        <StatCard
          title="إجمالي الإيرادات"
          value={formatPrice(totalRevenue)}
          percentage={revenueShare}
          icon={<TrendingUp className="w-5 h-5" />}
          variant="blue"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={formatPrice(totalExpensesFiltered)}
          percentage={expensesShare}
          isPositive={false}
          icon={<DollarSign className="w-5 h-5" />}
          variant="pink"
        />
        <StatCard
          title="صافي الربح"
          value={formatPrice(netProfit)}
          percentage={profitMargin}
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          variant="neutral"
        />
        <StatCard
          title="هامش الربح التشغيلي"
          value={`%${formatNumber(profitMargin)}`}
          percentage={profitMargin}
          subtitle={profitMargin > 50 ? 'معدل ممتاز' : profitMargin > 30 ? 'معدل جيد' : 'يحتاج تحسين'}
          icon={<BarChart3 className="w-5 h-5 text-[#2e5b9f]" />}
          variant="neutral"
        />
      </div>

      {/* Visual Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Products Table */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs text-emerald-700 font-bold">الأعلى ربحية</span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>أفضل المنتجات أداءً</span>
            </h3>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا توجد بيانات مبيعات في هذه الفترة.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#faf8f5]">
                  <span className="font-bold text-xs font-mono text-[#2e5b9f]">
                    {formatPrice(p.revenueGenerated)}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block">{p.name}</span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {formatNumber(p.quantitySold)} طلب
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom 5 Products Table */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-xs text-rose-700 font-bold">تحتاج مراجعة</span>
            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>المنتجات الأقل طلباً</span>
            </h3>
          </div>

          {bottomProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              لا توجد بيانات مبيعات في هذه الفترة.
            </div>
          ) : (
            <div className="space-y-2.5">
              {bottomProducts.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-[#faf8f5]">
                  <span className="font-bold text-xs font-mono text-gray-600">
                    {formatPrice(p.revenueGenerated)}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900 block">{p.name}</span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {formatNumber(p.quantitySold)} طلب فقط
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Summary */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
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
  );
};