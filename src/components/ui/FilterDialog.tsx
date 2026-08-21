import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const inputRef = useRef<HTMLInputElement>(null);
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

    return `${isSelected ? 'bg-[#2e5b9f] text-white' : ''} ${isInRange ? 'bg-[#2e5b9f]/10 text-[#2e5b9f]' : ''} ${isToday ? 'ring-2 ring-[#2e5b9f]' : ''} ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-[#2e5b9f]/10 text-gray-900'}`;
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

  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

  return (
    <div className="relative" ref={inputRef}>
      <label className="block text-xs font-bold text-gray-700 mb-1.5 select-none flex items-center justify-start gap-1">
        <Calendar className="w-3.5 h-3.5 text-[#2e5b9f]" />
        {label}
      </label>
      
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          readOnly
          placeholder={placeholder || 'من تاريخ'}
          value={value.from ? formatDate(value.from) : ''}
          onClick={() => { setFocusedInput('from'); setIsOpen(true); }}
          className="bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f] cursor-pointer"
        />
        <input
          type="text"
          readOnly
          placeholder={placeholder || 'إلى تاريخ'}
          value={value.to ? formatDate(value.to) : ''}
          onClick={() => { setFocusedInput('to'); setIsOpen(true); }}
          className="bg-[#faf8f5] hover:bg-white focus:bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f] cursor-pointer"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 z-50 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 w-[320px] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="font-bold text-sm text-gray-900">
              {monthNames[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-0.5 mb-2 text-center text-[10px] text-gray-500 font-bold">
            {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(d => <div key={d}>{d}</div>)}
          </div>
          
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfMonth(viewMonth) }, (_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth(viewMonth) }, (_, i) => {
              const day = i + 1;
              const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
              const isDisabled = date > today;
              return (
                <button
                  key={day}
                  onClick={() => !isDisabled && handleDayClick(day)}
                  disabled={isDisabled}
                  className={`aspect-square rounded-lg text-[11px] font-bold transition ${getDayClass(day)} disabled:opacity-30`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
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

  const baseInputClasses = 'w-full bg-[#faf8f5] hover:bg-white focus:bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 transition-all duration-150 focus:outline-none';
  const labelClasses = 'block text-xs font-bold text-gray-700 mb-1.5 select-none flex items-center justify-start gap-1';

  const renderField = (field: FilterField) => {
    const value = values[field.name] ?? field.defaultValue ?? '';

    switch (field.type) {
      case 'select':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
            <select id={field.name} value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`${baseInputClasses} appearance-none`}>
              <option value="">{field.placeholder || 'الكل'}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );
      case 'date':
        if (field.isDateRange) {
          return (
            <div key={field.name} className="mb-4">
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
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
            <input type="date" id={field.name} className={baseInputClasses} value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)} />
          </div>
        );
      case 'input':
        return (
          <div key={field.name} className="mb-4">
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
            <input type={field.placeholder === 'number' ? 'number' : 'text'} id={field.name}
              placeholder={field.placeholder || ''} className={baseInputClasses} value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)} />
          </div>
        );
      case 'checkbox':
        return (
          <div key={field.name} className="mb-4 flex items-start justify-start gap-2.5">
            <input type="checkbox" id={field.name} checked={value ?? false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2e5b9f] focus:ring-[#2e5b9f]" />
            <label htmlFor={field.name} className={labelClasses}>{field.label}</label>
          </div>
        );
      case 'radio':
        return (
          <div key={field.name} className="mb-4">
            <label className={labelClasses}>{field.label}</label>
            <div className="flex flex-col gap-1.5">
              {field.options?.map((opt) => (
                <div key={opt.value} className="flex items-center justify-start gap-2.5">
                  <input type="radio" id={`${field.name}_${opt.value}`} name={field.name}
                    value={opt.value} checked={value === opt.value}
                    onChange={() => handleFieldChange(field.name, opt.value)}
                    className="h-4 w-4 text-[#2e5b9f] focus:ring-[#2e5b9f]" />
                  <label htmlFor={`${field.name}_${opt.value}`} className="text-xs text-gray-700">{opt.label}</label>
                </div>
              ))}
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
        <div className="mb-4 text-xs text-gray-500">
          {config.activeFiltersCount !== undefined && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
              <span className="w-2 h-2 bg-[#2e5b9f] rounded-full"></span>
              {config.activeFiltersCount} فلاتر نشطة
            </span>
          )}
        </div>

        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
          {config.fields.map((field) => renderField(field))}
        </div>

        <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>إعادة ضبط</Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>إلغاء</Button>
          <Button type="button" variant="primary" size="sm" onClick={handleApply} className="bg-[#2e5b9f]">تطبيق الفلاتر</Button>
        </div>
      </div>
    </Modal>
  );
};