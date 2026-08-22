import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { X, Calendar, ChevronLeft, ChevronRight, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string | number;
}

interface FilterField {
  name: string;
  label: string;
  type: 'select' | 'input' | 'date' | 'checkbox' | 'radio';
  options?: FilterOption[];
  defaultValue?: string | number | boolean;
  placeholder?: string;
  isDateRange?: boolean;
}

export interface FilterConfig {
  title: string;
  fields: FilterField[];
  activeFiltersCount?: number;
}

interface FilterDialogProps {
  config: FilterConfig;
  isOpen: boolean;
  onClose: () => void;
  onApply: (values: Record<string, any>) => void;
  onReset: () => void;
}

// ---------- shared class helpers ----------
const inputClasses =
  'w-full bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]';
const labelClasses =
  'block text-xs font-bold text-gray-700 mb-1.5 select-none';

// Date Range Picker Component
const DateRangePicker: React.FC<{
  name: string;
  label: string;
  value: { from?: string; to?: string };
  onChange: (name: string, value: any) => void;
  placeholder?: string;
}> = ({ name, label, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value.from ? new Date(value.from) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const inputRef = useRef<HTMLDivElement>(null);
  const [focusedInput, setFocusedInput] = useState<'from' | 'to' | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Sunday
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDayClass = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const isToday = date.getTime() === today.getTime();
    const isSelected = value.from && date.getTime() === new Date(value.from).getTime() || 
                       value.to && date.getTime() === new Date(value.to).getTime();
    const isInRange = value.from && value.to && date > new Date(value.from) && date < new Date(value.to);
    const isDisabled = date > today;

    return `${isSelected ? 'bg-[#2e5b9f] text-white shadow-sm' : ''} ${isInRange ? 'bg-[#2e5b9f]/10 text-[#2e5b9f]' : ''} ${isToday && !isSelected ? 'ring-1 ring-[#2e5b9f]/60' : ''} ${isDisabled ? 'text-gray-300 cursor-not-allowed' : isSelected ? '' : 'hover:bg-[#2e5b9f]/10 text-gray-900'} transition-colors duration-100`;
  };

  const handleDayClick = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (date > today) return;
    
    if (!value.from || (value.from && value.to)) {
      onChange(`${name}_from`, date.toISOString().split('T')[0]);
      onChange(`${name}_to`, '');
      setFocusedInput('to');
    } else {
      const fromDate = new Date(value.from);
      if (date < fromDate) {
        onChange(`${name}_from`, date.toISOString().split('T')[0]);
      } else {
        onChange(`${name}_to`, date.toISOString().split('T')[0]);
        setIsOpen(false);
      }
    }
  };

  /** Quick range presets */
  const applyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    let from: Date, to: Date;
    if (preset === 'today') {
      from = new Date(now); to = new Date(now);
    } else if (preset === 'yesterday') {
      const y = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      from = y; to = y;
    } else if (preset === 'week') {
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); to = new Date(now);
    } else {
      from = new Date(now.getFullYear(), now.getMonth(), 1); to = new Date(now);
    }
    setViewMonth(new Date(from.getFullYear(), from.getMonth(), 1));
    onChange(`${name}_from`, from.toISOString().split('T')[0]);
    onChange(`${name}_to`, to.toISOString().split('T')[0]);
  };

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const quickPresets: { id: 'today' | 'yesterday' | 'week' | 'month'; label: string }[] = [
    { id: 'today', label: 'اليوم' },
    { id: 'yesterday', label: 'أمس' },
    { id: 'week', label: 'آخر ٧ أيام' },
    { id: 'month', label: 'هذا الشهر' },
  ];

  return (
    <div className="relative" ref={inputRef}>
      <label className={`${labelClasses} flex items-center justify-start gap-1`}>
        <Calendar className="w-3.5 h-3.5 text-[#2e5b9f]" />
        {label}
      </label>

      {/* Quick presets */}
      <div className="flex flex-wrap items-center gap-1 mb-2">
        {quickPresets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset(p.id)}
            className="px-2 py-1 rounded-lg bg-gray-50 border border-gray-200/70 text-[10px] font-bold text-gray-600 hover:bg-[#2e5b9f]/5 hover:text-[#2e5b9f] hover:border-[#2e5b9f]/30 transition cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            type="text"
            readOnly
            placeholder={placeholder || 'من تاريخ'}
            value={value.from ? formatDate(value.from) : ''}
            onClick={() => { setFocusedInput('from'); setIsOpen(true); }}
            className={`${inputClasses} cursor-pointer pl-8`}
          />
          <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <input
            type="text"
            readOnly
            placeholder={placeholder || 'إلى تاريخ'}
            value={value.to ? formatDate(value.to) : ''}
            onClick={() => { setFocusedInput('to'); setIsOpen(true); }}
            className={`${inputClasses} cursor-pointer pl-8`}
          />
          <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-300/30 p-4 w-[320px] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3 bg-gray-50 border border-gray-100 rounded-xl py-1.5 px-2">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
                className="p-1.5 text-gray-500 hover:text-[#2e5b9f] hover:bg-white rounded-lg transition shadow-2xs cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-bold text-xs text-gray-900 select-none">
                {monthNames[viewMonth.getMonth()]} <span className="text-gray-400 font-mono">{viewMonth.getFullYear()}</span>
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
                className="p-1.5 text-gray-500 hover:text-[#2e5b9f] hover:bg-white rounded-lg transition shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1.5 text-center text-[10px] text-gray-400 font-bold">
              {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(d => <div key={d} className="py-0.5">{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDayOfMonth(viewMonth) }, (_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth(viewMonth) }, (_, i) => {
                const day = i + 1;
                const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
                const isDisabled = date > today;
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => !isDisabled && handleDayClick(day)}
                    disabled={isDisabled}
                    className={`aspect-square rounded-lg text-[11px] font-bold ${getDayClass(day)} disabled:opacity-40 disabled:hover:bg-transparent`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-[10px] text-gray-400 font-mono truncate">
                {value.from ? formatDate(value.from) : '—'} ← {value.to ? formatDate(value.to) : '—'}
              </span>
              <button
                type="button"
                onClick={() => { onChange(`${name}_from`, ''); onChange(`${name}_to`, ''); }}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer shrink-0 mr-2"
              >
                مسح التواريخ
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

export const FilterDialog: React.FC<FilterDialogProps> = ({
  config,
  isOpen,
  onClose,
  onApply,
  onReset,
}) => {
  const [values, setValues] = React.useState<Record<string, any>>({});

  const handleFieldChange = (name: string, value: any) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleApply = () => { onApply(values); };
  const handleReset = () => { setValues({}); onReset(); };

  const renderField = (field: FilterField) => {
    const value = values[field.name] ?? field.defaultValue ?? '';
    const isFullWidth = field.type === 'date' && field.isDateRange;

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className={isFullWidth ? 'sm:col-span-2' : ''}>
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
            <div className="relative">
              <select id={field.name} value={value}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className={`${inputClasses} appearance-none pl-8 pr-3.5 cursor-pointer`}>
                <option value="">{field.placeholder || 'الكل'}</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        );
      case 'date':
        if (field.isDateRange) {
          return (
            <div key={field.name} className="sm:col-span-2">
              <DateRangePicker
                name={field.name}
                label={field.label}
                value={{ from: values[`${field.name}_from`], to: values[`${field.name}_to`] }}
                onChange={handleFieldChange}
                placeholder={field.placeholder}
              />
            </div>
          );
        }
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
            <input type="date" id={field.name} className={`${inputClasses} cursor-pointer`} value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)} />
          </div>
        );
      case 'input':
        return (
          <div key={field.name}>
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
            <input type={field.placeholder === 'number' ? 'number' : 'text'} id={field.name}
              placeholder={field.placeholder || ''} className={inputClasses} value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)} />
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.name} className="sm:col-span-2">
            <label htmlFor={field.name}
              className={`flex items-center justify-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${value ? 'border-[#2e5b9f]/40 bg-[#2e5b9f]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input type="checkbox" id={field.name} checked={value ?? false}
                onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#2e5b9f] focus:ring-[#2e5b9f] cursor-pointer" />
              <span className="text-xs font-bold text-gray-700">{field.label}</span>
            </label>
          </div>
        );
      case 'radio':
        return (
          <div key={field.name}>
            <label className={labelClasses}>{field.label}</label>
            <div className="flex flex-col gap-1.5">
              {field.options?.map((opt) => {
                const checked = value === opt.value;
                return (
                  <label key={opt.value} htmlFor={`${field.name}_${opt.value}`}
                    className={`flex items-center justify-start gap-2.5 px-2.5 py-2 rounded-xl border cursor-pointer transition ${checked ? 'border-[#2e5b9f]/40 bg-[#2e5b9f]/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input type="radio" id={`${field.name}_${opt.value}`} name={field.name}
                      value={opt.value} checked={checked}
                      onChange={() => handleFieldChange(field.name, opt.value)}
                      className="h-4 w-4 text-[#2e5b9f] focus:ring-[#2e5b9f] cursor-pointer" />
                    <span className="text-xs font-bold text-gray-700">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={config.title} maxWidth="md">
      <div className="text-right">
        {/* Dialog header strip */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#2e5b9f]" />
            خصّص نتائج العرض
          </span>
          {config.activeFiltersCount !== undefined && config.activeFiltersCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              {config.activeFiltersCount} فلاتر نشطة
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 max-h-[55vh] overflow-y-auto pl-1 pr-0.5 py-0.5">
          {config.fields.map((field) => renderField(field))}
        </div>

        <div className="pt-4 mt-4 flex items-center justify-between gap-2 border-t border-gray-100">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}
            className="!text-rose-600 !border-rose-200 hover:!bg-rose-50">
            إعادة ضبط
          </Button>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
            <Button type="button" variant="primary" size="sm" onClick={handleApply}
              className="bg-[#2e5b9f] hover:bg-[#254a84] shadow-sm">
              تطبيق الفلاتر
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};