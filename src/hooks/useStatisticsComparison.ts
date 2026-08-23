import { useMemo } from 'react';

export type TimeRange = 'today' | 'week' | 'month' | 'year';

export interface ComparisonResult {
  current: number;
  previous: number;
  changePercent: number;
  changeAbsolute: number;
  trend: 'up' | 'down' | 'neutral';
  previousPeriodLabel: string;
  currentPeriodLabel: string;
}

export interface ComparisonConfig {
  timeRange: TimeRange;
  currentData: number[];
  previousData: number[];
  currentDates: Date[];
  previousDates: Date[];
  label?: string;
}

function getPeriodBounds(timeRange: TimeRange, referenceDate: Date = new Date()): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
  previousLabel: string;
  currentLabel: string;
} {
  const now = new Date(referenceDate);
  const oneDayMs = 24 * 60 * 60 * 1000;

  switch (timeRange) {
    case 'today': {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return {
        currentStart: todayStart,
        currentEnd: new Date(todayStart.getTime() + oneDayMs),
        previousStart: new Date(todayStart.getTime() - oneDayMs),
        previousEnd: todayStart,
        previousLabel: 'أمس',
        currentLabel: 'اليوم',
      };
    }
    case 'week': {
      const weekStart = new Date(now.getTime() - 6 * oneDayMs);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(now.getTime() + oneDayMs);
      weekEnd.setHours(0, 0, 0, 0);
      return {
        currentStart: weekStart,
        currentEnd: weekEnd,
        previousStart: new Date(weekStart.getTime() - 7 * oneDayMs),
        previousEnd: weekStart,
        previousLabel: 'الأسبوع السابق',
        currentLabel: 'هذا الأسبوع',
      };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return {
        currentStart: monthStart,
        currentEnd: monthEnd,
        previousStart: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        previousEnd: monthStart,
        previousLabel: 'الشهر السابق',
        currentLabel: 'هذا الشهر',
      };
    }
    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
      return {
        currentStart: yearStart,
        currentEnd: yearEnd,
        previousStart: new Date(now.getFullYear() - 1, 0, 1),
        previousEnd: yearStart,
        previousLabel: 'العام السابق',
        currentLabel: 'هذا العام',
      };
    }
  }
}

function filterDataByPeriod<T extends { createdAt?: string; date?: string; totalAmount?: number; amount?: number }>(
  data: T[],
  start: Date,
  end: Date,
  valueExtractor: (item: T) => number
): number {
  return data
    .filter((item) => {
      const itemDate = new Date(item.date || item.createdAt || '');
      return itemDate >= start && itemDate < end;
    })
    .reduce((sum, item) => sum + valueExtractor(item), 0);
}

export function useStatisticsComparison<
  T extends { createdAt?: string; date?: string; totalAmount?: number; amount?: number }
>(
  timeRange: TimeRange,
  currentData: T[],
  valueExtractor: (item: T) => number,
  referenceDate?: Date
): ComparisonResult {
  const bounds = useMemo(() => getPeriodBounds(timeRange, referenceDate), [timeRange, referenceDate]);

  const current = useMemo(() =>
    filterDataByPeriod(currentData, bounds.currentStart, bounds.currentEnd, valueExtractor),
    [currentData, bounds.currentStart, bounds.currentEnd, valueExtractor]
  );

  const previous = useMemo(() =>
    filterDataByPeriod(currentData, bounds.previousStart, bounds.previousEnd, valueExtractor),
    [currentData, bounds.previousStart, bounds.previousEnd, valueExtractor]
  );

  const changeAbsolute = current - previous;
  const changePercent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((changeAbsolute / previous) * 100);

  return {
    current,
    previous,
    changePercent,
    changeAbsolute,
    trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
    previousPeriodLabel: bounds.previousLabel,
    currentPeriodLabel: bounds.currentLabel,
  };
}

export function useMultiMetricComparison<T extends { createdAt: string }>(
  timeRange: TimeRange,
  data: T[],
  metrics: Array<{ key: string; extractor: (item: T) => number }>,
  referenceDate?: Date
): Record<string, ComparisonResult> {
  const results: Record<string, ComparisonResult> = {};

  metrics.forEach(({ key, extractor }) => {
    results[key] = useStatisticsComparison(timeRange, data, extractor, referenceDate);
  });

  return results;
}

export function formatComparisonDisplay(comparison: ComparisonResult, currency ='جنيها'): string {
  const { current, previous, changePercent, trend } = comparison;
  const formattedCurrent = typeof current === 'number' && currency === 'جنيها'
    ? `${current.toLocaleString('en-US')} ${currency}`
    : `${current.toLocaleString('en-US')}`;

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-gray-500';

  return `${formattedCurrent} <span class="${trendColor} font-bold">${trendIcon} ${changePercent >= 0 ? '+' : ''}${changePercent}%</span>`;
}

export function getComparisonTooltip(comparison: ComparisonResult, currency = 'جنيها'): string {
  const { current, previous, changePercent, changeAbsolute, previousPeriodLabel, currentPeriodLabel } = comparison;
  const formattedCurrent = typeof current === 'number' && currency === 'جنيها'
    ? `${current.toLocaleString('en-US')} ${currency}`
    : `${current.toLocaleString('en-US')}`;
  const formattedPrevious = typeof previous === 'number' && currency === 'جنيها'
    ? `${previous.toLocaleString('en-US')} ${currency}`
    : `${previous.toLocaleString('en-US')}`;

  const direction = changePercent > 0 ? 'ارتفاع' : changePercent < 0 ? 'انخفاض' : 'ثبات';
  const absChange = changeAbsolute >= 0 ? `+${changeAbsolute.toLocaleString('en-US')}` : changeAbsolute.toLocaleString('en-US');

  return `${currentPeriodLabel}: ${formattedCurrent}\n${previousPeriodLabel}: ${formattedPrevious}\nالتغير: ${absChange} (${direction} ${Math.abs(changePercent)}%)`;
}

export function useSalesComparison(
  timeRange: TimeRange,
  orders: Array<{ createdAt: string; status: string; totalAmount: number }>,
  referenceDate?: Date
): ComparisonResult {
  return useStatisticsComparison(
    timeRange,
    orders,
    (order) => order.status === 'completed' ? order.totalAmount : 0,
    referenceDate
  );
}

export function useOrdersCountComparison(
  timeRange: TimeRange,
  orders: Array<{ createdAt: string; status: string }>,
  referenceDate?: Date
): ComparisonResult {
  return useStatisticsComparison(
    timeRange,
    orders,
    () => 1,
    referenceDate
  );
}

export function useExpensesComparison(
  timeRange: TimeRange,
  expenses: Array<{ createdAt?: string; amount: number; date?: string }>,
  referenceDate?: Date
): ComparisonResult {
  return useStatisticsComparison(
    timeRange,
    expenses,
    (expense) => expense.amount,
    referenceDate
  );
}

export function useProfitComparison(
  timeRange: TimeRange,
  orders: Array<{ createdAt: string; status: string; totalAmount: number }>,
  expenses: Array<{ createdAt?: string; amount: number; date?: string }>,
  referenceDate?: Date
): ComparisonResult {
  const bounds = getPeriodBounds(timeRange, referenceDate);

  const currentSales = orders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d >= bounds.currentStart && d < bounds.currentEnd && o.status === 'completed';
    })
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const currentExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d >= bounds.currentStart && d < bounds.currentEnd;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const previousSales = orders
    .filter((o) => {
      const d = new Date(o.createdAt);
      return d >= bounds.previousStart && d < bounds.previousEnd && o.status === 'completed';
    })
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const previousExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d >= bounds.previousStart && d < bounds.previousEnd;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // ✅ صافي الربح الحقيقي — ممكن يكون بالسالب (خسارة) لو المصروفات أكبر من المبيعات
  const current = currentSales - currentExpenses;
  const previous = previousSales - previousExpenses;
  const changeAbsolute = current - previous;
  const changePercent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((changeAbsolute / previous) * 100);

  return {
    current,
    previous,
    changePercent,
    changeAbsolute,
    trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'neutral',
    previousPeriodLabel: bounds.previousLabel,
    currentPeriodLabel: bounds.currentLabel,
  };
}