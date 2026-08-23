import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  Sun,
  History,
  CalendarDays,
  CalendarRange,
  PieChart,
  Sparkles,
} from 'lucide-react';

export type PresetRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface DateRange {
  from: Date | null;
  to: Date | null;
  preset: PresetRange;
}

export interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  showPresets?: boolean;
  locale?: string;
}

/** تحويل محلي صحيح YYYY-MM-DD — toISOString بيزحف التاريخ بسبب المنطقة الزمنية */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PRESET_LABELS: Record<PresetRange, string> = {
  today: 'اليوم',
  yesterday: 'أمس',
  week: 'آخر ٧ أيام',
  month: 'هذا الشهر',
  quarter: 'هذا الربع',
  year: 'هذا العام',
  custom: 'نطاق مخصص',
};

const PRESET_OPTIONS: PresetRange[] = ['today', 'yesterday', 'week', 'month', 'quarter', 'year'];

const PRESET_ICONS: Record<PresetRange, React.ElementType> = {
  today: Sun,
  yesterday: History,
  week: CalendarDays,
  month: CalendarRange,
  quarter: PieChart,
  year: Sparkles,
  custom: Calendar,
};

function getPresetRange(preset: PresetRange, maxDate: Date = new Date()): { from: Date; to: Date } {
  const now = new Date(maxDate);
  now.setHours(23, 59, 59, 999);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const oneDayMs = 24 * 60 * 60 * 1000;

  switch (preset) {
    case 'today':
      return { from: todayStart, to: now };
    case 'yesterday': {
      const yesterday = new Date(todayStart.getTime() - oneDayMs);
      return { from: yesterday, to: new Date(yesterday.getTime() + oneDayMs - 1) };
    }
    case 'week': {
      const weekStart = new Date(now.getTime() - 6 * oneDayMs);
      weekStart.setHours(0, 0, 0, 0);
      return { from: weekStart, to: now };
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart, to: now };
    }
    case 'quarter': {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return { from: quarterStart, to: now };
    }
    case 'year': {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return { from: yearStart, to: now };
    }
    default:
      return { from: todayStart, to: now };
  }
}

function formatDate(date: Date, locale = 'ar-EG-u-nu-latn'): string {
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatShortDate(date: Date): string {
  return toLocalDateString(date);
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function normalizeDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function countDays(from: Date, to: Date): number {
  return Math.round(Math.abs(normalizeDay(to) - normalizeDay(from)) / (24 * 60 * 60 * 1000)) + 1;
}

function getCurrentPreset(range: DateRange): PresetRange {
  if (!range.from || !range.to) return 'custom';

  for (const preset of PRESET_OPTIONS) {
    const presetRange = getPresetRange(preset);
    if (isSameDay(range.from, presetRange.from) && isSameDay(range.to, presetRange.to)) {
      return preset;
    }
  }
  return 'custom';
}

const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const ARABIC_DAYS = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  minDate,
  maxDate = new Date(),
  disabled = false,
  className = '',
  showPresets = true,
  locale = 'ar-EG-u-nu-latn',
}) => {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value.from || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const currentPreset = useMemo(() => getCurrentPreset(value), [value]);

  // قفل النافذة عند الضغط خارجها أو الضغط على Escape
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // ✅ النافذة مثبتة على مستوى الشاشة (fixed) فلا تتقص جوه أي حاوية overflow
  // الارتفاع دايماً محسوب ضمن مساحة الشاشة المتاحة (maxHeight ديناميكي) —
  // فمفيش أي جزء بيقص تحت أو فوق ومن غير سكرول للصفحة، والتقويم نفسه بيسكرول داخلياً لو الشاشة قصيرة
  useEffect(() => {
    if (!isOpen || !rootRef.current) return;
    const compute = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (window.innerWidth < 640) {
        // 📱 موبايل: شيت عريض أسفل الشاشة بحد أقصى معظم الشاشة
        setPanelStyle({
          position: 'fixed',
          left: 8,
          right: 8,
          bottom: 8,
          width: 'auto',
          maxHeight: window.innerHeight * 0.92,
        });
        return;
      }
      const width = Math.min(372, window.innerWidth - 16);
      const spaceBelow = window.innerHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const MIN_PANEL_SPACE = 380;
      const openUp = spaceBelow < MIN_PANEL_SPACE && spaceAbove > spaceBelow;
      setPanelStyle({
        position: 'fixed',
        top: openUp ? undefined : rect.bottom + 8,
        bottom: openUp ? window.innerHeight - rect.top + 8 : undefined,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        width,
        maxHeight: Math.max(280, openUp ? spaceAbove : spaceBelow),
      });
    };
    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [isOpen]);

  const handlePresetClick = (preset: PresetRange) => {
    if (preset === 'custom') {
      setIsOpen(true);
      return;
    }
    const { from, to } = getPresetRange(preset, maxDate);
    onChange({ from, to, preset });
    setIsOpen(false);
  };

  const handleDateClick = (date: Date) => {
    if (disabled) return;
    if (date > maxDate) return;

    // ✅ سلوك أذكى:
    // 1) أول ضغطة تحدد بداية النطاق وتبقى النافذة مفتوحة لاختيار النهاية.
    // 2) الضغط على نفس تاريخ البداية مرة أخرى = اختيار يوم واحد فقط ويغلق فوراً.
    // 3) الضغط على تاريخ مختلف = يكمل النطاق ويغلق.
    if (value.from && !value.to) {
      const fromDate = new Date(value.from);
      fromDate.setHours(0, 0, 0, 0);
      if (fromDate.getTime() === date.getTime()) {
        onChange({ from: date, to: date, preset: 'custom' });
        setIsOpen(false);
        return;
      }
      if (date < fromDate) {
        onChange({ from: date, to: value.from, preset: 'custom' });
      } else {
        onChange({ from: value.from, to: date, preset: 'custom' });
      }
      setIsOpen(false);
    } else {
      onChange({ from: date, to: null, preset: 'custom' });
      setViewMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      setHoveredDate(null);
    }
  };

  const handleClear = () => {
    onChange({ from: null, to: null, preset: 'custom' });
    setIsOpen(false);
  };

  const daysInMonth = useMemo(
    () => new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate(),
    [viewMonth]
  );

  const firstDayOfMonth = useMemo(
    () => new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay(),
    [viewMonth]
  );

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDateNormalized = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())
    : null;
  const maxDateNormalized = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

  const hasFullRange = Boolean(value.from && value.to);
  const rangeDaysCount =
    value.from && value.to ? countDays(value.from, value.to) : 0;

  interface DayState {
    isEndpoint: boolean;
    isInRange: boolean;
    isToday: boolean;
    isHovered: boolean;
    isDisabled: boolean;
  }

  const getDayState = (day: number): DayState => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);

    const isToday = date.getTime() === today.getTime();
    const isFromSelected = value.from && isSameDay(date, new Date(value.from));
    const isToSelected = value.to && isSameDay(date, new Date(value.to));
    // معاينة حية للنطاق أثناء التمرير قبل اختيار تاريخ النهاية
    const rangeEnd = value.to || (value.from && !value.to ? hoveredDate : null);
    let isInRange = false;
    if (value.from && rangeEnd && !isFromSelected && !isToSelected) {
      const start = Math.min(normalizeDay(new Date(value.from)), normalizeDay(rangeEnd));
      const end = Math.max(normalizeDay(new Date(value.from)), normalizeDay(rangeEnd));
      const t = normalizeDay(date);
      isInRange = t >= start && t <= end;
    }
    const isDisabled = date > maxDateNormalized || (!!minDateNormalized && date < minDateNormalized);

    return {
      isEndpoint: Boolean(isFromSelected || isToSelected),
      isInRange,
      isToday,
      isHovered: Boolean(hoveredDate && isSameDay(date, hoveredDate)),
      isDisabled,
    };
  };

  const getDayClass = ({ isEndpoint, isInRange, isToday, isDisabled }: DayState) => {
    if (isDisabled) return 'text-gray-300 cursor-not-allowed';
    if (isEndpoint)
      return 'bg-gradient-to-br from-[#3a6cb5] to-[#1d4277] text-white shadow-md shadow-[#2e5b9f]/30 ring-2 ring-[#2e5b9f]/20 scale-[1.06]';
    if (isInRange) return 'bg-[#2e5b9f]/[0.09] text-[#1d4277] font-extrabold';
    return 'text-gray-700 hover:bg-[#2e5b9f]/10 hover:text-[#2e5b9f] hover:scale-[1.08] active:scale-95';
  };

  const handlePrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
    if (nextMonth <= maxDateNormalized) {
      setViewMonth(nextMonth);
    }
  };

  const PresetIcon = PRESET_ICONS[currentPreset];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {/* ═══ Trigger Button ═══ */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={isOpen}
        className={`
          w-full flex items-center gap-2.5 p-2 pl-2.5 text-right
          bg-white border rounded-2xl transition-all duration-200 group
          focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
          ${
            isOpen
              ? 'border-[#2e5b9f]/70 ring-4 ring-[#2e5b9f]/10 shadow-lg shadow-[#2e5b9f]/10'
              : 'border-gray-200/90 shadow-2xs hover:border-[#2e5b9f]/40 hover:shadow-md hover:shadow-[#2e5b9f]/5'
          }
        `}
      >
        {/* أيقونة متدرجة داخل مربع زجاجي */}
        <span
          className={`
            w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-white transition-all duration-300
            bg-gradient-to-br from-[#4a7cc9] via-[#2e5b9f] to-[#1d4277]
            shadow-md shadow-[#2e5b9f]/25
            ${isOpen ? 'rotate-6 scale-105' : 'group-hover:scale-105'}
          `}
        >
          <Calendar className="w-4 h-4" strokeWidth={2.2} />
        </span>

        <span className="flex flex-col items-start min-w-0 flex-1 gap-0.5">
          <span className="text-[9px] font-bold text-gray-400 tracking-wide select-none">
            الفترة الزمنية
          </span>
          {value.from && value.to ? (
            <span className="flex items-center gap-1.5 w-full min-w-0">
              <span className="font-mono font-bold text-xs text-gray-900 truncate">
                {formatShortDate(value.from)} <span className="text-[#2e5b9f]">←</span>{' '}
                {formatShortDate(value.to)}
              </span>
              <span className="hidden sm:inline-flex items-center gap-0.5 shrink-0 text-[9px] font-bold text-[#2e5b9f] bg-[#2e5b9f]/[0.07] border border-[#2e5b9f]/20 px-1.5 py-px rounded-full">
                <PresetIcon className="w-2.5 h-2.5" />
                {PRESET_LABELS[currentPreset]}
              </span>
            </span>
          ) : value.from && !value.to ? (
            <span className="font-mono font-bold text-xs text-[#2e5b9f] truncate animate-pulse">
              من {formatShortDate(value.from)} — اختر النهاية...
            </span>
          ) : (
            <span className="text-xs font-bold text-gray-400 truncate">كل الفترات</span>
          )}
        </span>

        {value.from || value.to ? (
          <span
            role="button"
            aria-label="مسح النطاق"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1.5 rounded-full hover:bg-rose-50 transition-all cursor-pointer shrink-0 active:scale-90"
          >
            <X className="w-3.5 h-3.5 text-rose-400 hover:text-rose-600" />
          </span>
        ) : null}
      </button>

      {/* ═══ Dropdown Panel ═══ */}
      {isOpen && (
        <div
          style={panelStyle}
          role="dialog"
          aria-label="اختيار نطاق التاريخ"
          className="z-[70] rounded-t-3xl sm:rounded-3xl border border-gray-200/80 bg-white shadow-2xl shadow-blue-900/15 overflow-y-auto overscroll-contain max-h-[92dvh] animate-pop-in"
        >
          {/* ── الهيدر المتدرج: ملخص الفترة ── */}
          <div className="relative bg-gradient-to-l from-[#1d4277] via-[#2e5b9f] to-[#4a7cc9] px-4 pt-4 pb-6 text-white overflow-hidden">
            {/* لمسات زخرفية ضوئية */}
            <div className="absolute -left-8 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute right-16 -top-10 w-24 h-24 rounded-full bg-cyan-300/15 blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-white/60 tracking-wider mb-0.5">
                  الفترة المحددة
                </p>
                <p className="text-sm font-bold font-mono truncate drop-shadow-sm">
                  {value.from ? formatDate(value.from, locale) : '———'}{' '}
                  <span className="text-white/50">←</span>{' '}
                  {value.to ? formatDate(value.to, locale) : '———'}
                </p>
              </div>
              {hasFullRange && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/15 border border-white/25 backdrop-blur-sm">
                  <CalendarDays className="w-3 h-3" />
                  {rangeDaysCount} يوم
                </span>
              )}
            </div>
          </div>

          <div className="px-2.5 -mt-3 relative z-10 pb-1">
            {/* ── الاختصارات السريعة: شبكة بأيقونات ── */}
            {showPresets && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-blue-900/[0.07] p-1.5 grid grid-cols-3 gap-1">
                {PRESET_OPTIONS.map((preset) => {
                  const Icon = PRESET_ICONS[preset];
                  const isActive = currentPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      disabled={disabled}
                      title={PRESET_LABELS[preset]}
                      className={`
                        flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-150 cursor-pointer
                        ${
                          isActive
                            ? 'bg-gradient-to-br from-[#3a6cb5] to-[#1d4277] text-white shadow-md shadow-[#2e5b9f]/30 scale-[1.03]'
                            : 'bg-[#faf8f5] text-gray-500 hover:bg-[#2e5b9f]/[0.07] hover:text-[#2e5b9f] active:scale-95'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
                      <span className="text-[9.5px] font-bold leading-none">
                        {PRESET_LABELS[preset]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── التقويم ── */}
            <div className="pt-3 px-1 pb-2">
              {/* التنقل بين الشهور */}
              <div className="flex items-center justify-between mb-2.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="الشهر السابق"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 bg-gray-50 hover:bg-[#2e5b9f]/10 hover:text-[#2e5b9f] active:scale-90 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex items-baseline gap-1.5 select-none">
                  <span className="font-arabic-heading font-bold text-sm text-gray-900">
                    {ARABIC_MONTHS[viewMonth.getMonth()]}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#2e5b9f] bg-[#2e5b9f]/[0.07] px-1.5 py-px rounded-md">
                    {viewMonth.getFullYear()}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={
                    viewMonth.getFullYear() > maxDateNormalized.getFullYear() ||
                    (viewMonth.getFullYear() === maxDateNormalized.getFullYear() &&
                      viewMonth.getMonth() >= maxDateNormalized.getMonth())
                  }
                  aria-label="الشهر التالي"
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-500 bg-gray-50 hover:bg-[#2e5b9f]/10 hover:text-[#2e5b9f] active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* أسماء الأيام — الجمعة والسبت بلون مميز */}
              <div className="grid grid-cols-7 gap-y-1 mb-1 text-center">
                {ARABIC_DAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`py-1 text-[9.5px] font-bold tracking-tight ${
                      i >= 5 ? 'text-rose-400' : 'text-gray-400'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* شبكة الأيام */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const state = getDayState(day);
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => !state.isDisabled && handleDateClick(
                        new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day)
                      )}
                      onMouseEnter={() =>
                        !state.isDisabled &&
                        setHoveredDate(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
                      }
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={state.isDisabled}
                      className={`
                        relative aspect-square rounded-xl text-[11.5px] font-bold
                        flex items-center justify-center transition-all duration-150
                        ${getDayClass(state)}
                        ${state.isDisabled ? 'opacity-40 hover:bg-transparent' : 'cursor-pointer'}
                      `}
                    >
                      {day}
                      {/* نقطة اليوم الحالي */}
                      {state.isToday && !state.isEndpoint && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#2e5b9f]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── الفوتر: ملخص + مسح ── */}
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 bg-[#faf8f5]/80 border-t border-gray-100">
            <span className="text-[10.5px] text-gray-500 font-mono truncate">
              {value.from && !value.to ? (
                <span className="text-[#2e5b9f] font-bold">اختر تاريخ النهاية لإتمام النطاق</span>
              ) : hasFullRange ? (
                <>
                  إجمالي <span className="font-bold text-gray-800">{rangeDaysCount}</span> يوم محدد
                </>
              ) : (
                'لم يتم اختيار فترة بعد'
              )}
            </span>
            {(value.from || value.to) && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 hover:bg-rose-500 hover:text-white hover:border-rose-500 active:scale-95 transition-all cursor-pointer"
              >
                <X className="w-3 h-3" />
                مسح
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const useDateRangeFilter = (initialRange?: DateRange) => {
  const [range, setRange] = useState<DateRange>(initialRange || { from: null, to: null, preset: 'custom' });
  return [range, setRange] as const;
};
