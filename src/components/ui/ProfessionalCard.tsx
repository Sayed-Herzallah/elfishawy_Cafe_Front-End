import React, { ReactNode } from 'react';
import { ChevronLeft, MoreVertical, Eye, Edit2, Trash2, Printer, FileText, Calendar, User, DollarSign, ShoppingBag, Box, AlertCircle, CheckCircle2, XCircle, Clock, ArrowDownToLine } from 'lucide-react';

export type CardVariant = 'default' | 'invoice' | 'order' | 'product' | 'expense' | 'inventory' | 'sale';
export type CardStatus = 'pending' | 'completed' | 'cancelled' | 'processing' | 'low' | 'out' | 'available' | 'draft';

export interface ActionButton {
  icon: ReactNode;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
}

export interface ProfessionalCardProps {
  id: string;
  variant?: CardVariant;
  status?: CardStatus;
  title: string;
  subtitle?: string;
  metadata?: Array<{
    label: string;
    value: string | number;
    icon?: ReactNode;
    color?: string;
  }>;
  amounts?: {
    primary?: string;
    secondary?: string;
    currency?: string;
  };
  dates?: {
    created?: string;
    updated?: string;
    due?: string;
  };
  assignee?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  tags?: string[];
  children?: ReactNode;
  actions?: ActionButton[];
  onClick?: () => void;
  onDoubleClick?: () => void;
  isSelected?: boolean;
  className?: string;
  printable?: boolean;
}

const statusStyles: Record<CardStatus, { bg: string; text: string; border: string; icon: ReactNode }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  cancelled: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  processing: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  low: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  out: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', icon: <XCircle className="w-3.5 h-3.5" /> },
  available: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  draft: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', icon: <FileText className="w-3.5 h-3.5" /> },
};

const variantIcons: Record<CardVariant, ReactNode> = {
  default: <Box className="w-5 h-5" />,
  invoice: <FileText className="w-5 h-5" />,
  order: <ShoppingBag className="w-5 h-5" />,
  product: <Box className="w-5 h-5" />,
  expense: <DollarSign className="w-5 h-5" />,
  inventory: <Box className="w-5 h-5" />,
  sale: <DollarSign className="w-5 h-5" />,
};

const variantColors: Record<CardVariant, { bg: string; text: string; border: string }> = {
  default: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  invoice: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  order: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  product: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  expense: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  inventory: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  sale: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-EG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
}

function formatCurrency(amount: string | number, currency = 'ج.م') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return `0 ${currency}`;
  return `${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
}

export const ProfessionalCard: React.FC<ProfessionalCardProps> = ({
  id,
  variant = 'default',
  status = 'draft',
  title,
  subtitle,
  metadata = [],
  amounts,
  dates,
  assignee,
  tags = [],
  children,
  actions = [],
  onClick,
  onDoubleClick,
  isSelected = false,
  className = '',
  printable = false,
}) => {
  const statusStyle = statusStyles[status] || statusStyles.draft;
  const variantColor = variantColors[variant] || variantColors.default;
  const variantIcon = variantIcons[variant] || variantIcons.default;

  const handleClick = (e: React.MouseEvent) => {
    if (actions.some(a => e.target === (e.currentTarget as any))) return;
    onClick?.();
  };

  const handleActionClick = (action: ActionButton, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick(e);
  };

  const cardBaseClasses = `
    bg-white border rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer
    ${variantColor.border} border-l-4
    ${isSelected ? 'ring-2 ring-[#2e5b9f]/20 bg-[#faf8f5]' : ''}
    ${onClick ? 'group' : ''}
    ${className}
  `;

  return (
    <article
      id={id}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
      className={cardBaseClasses}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) { e.preventDefault(); onClick(); } }}
    >
      {/* Print-only header */}
      {printable && (
        <div className="hidden print:block mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {variantIcon}
              <h3 className="font-bold text-lg text-gray-900">{title}</h3>
            </div>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusStyle.icon}
              <span className="ml-1">{status}</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Card Content */}
      <div className="p-5 print:p-0">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${variantColor.bg} ${variantColor.text} shrink-0`}>
              {variantIcon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-gray-900 truncate">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {/* Status Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusStyle.icon}
              <span className="ml-1 capitalize">{status}</span>
            </span>
          </div>
        </div>

        {/* Amounts */}
        {amounts && (
          <div className="mb-4 flex items-center gap-4 flex-wrap">
            {amounts.primary && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-lg font-bold font-mono text-emerald-700">{formatCurrency(amounts.primary)}</span>
                {amounts.secondary && (
                  <span className="text-xs text-gray-500 font-mono">({formatCurrency(amounts.secondary)})</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Metadata Grid */}
        {(metadata.length > 0 || dates.created || dates.due || assignee) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4 text-right">
            {metadata.map((meta, idx) => (
              <div key={idx} className="p-3 bg-[#faf8f5] rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mb-1">
                  {meta.icon}
                  {meta.label}
                </div>
                <span className={`font-mono text-sm ${meta.color || 'text-gray-900'}`}>{meta.value}</span>
              </div>
            ))}
            {dates.created && (
              <div className="p-3 bg-[#faf8f5] rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  تاريخ الإنشاء
                </div>
                <span className="font-mono text-sm text-gray-900">{formatDate(dates.created)}</span>
              </div>
            )}
            {dates.due && (
              <div className="p-3 bg-[#faf8f5] rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  تاريخ الاستحقاق
                </div>
                <span className="font-mono text-sm text-gray-900">{formatDate(dates.due)}</span>
              </div>
            )}
            {assignee && (
              <div className="p-3 bg-[#faf8f5] rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 mb-1">
                  <User className="w-3.5 h-3.5" />
                  المسؤول
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#2e5b9f]/10 flex items-center justify-center text-[#2e5b9f] font-bold text-sm">
                    {assignee.avatar || assignee.name.charAt(0)}
                  </div>
                  <div>
                    <span className="font-bold text-sm text-gray-900 block">{assignee.name}</span>
                    {assignee.role && <span className="text-[10px] text-gray-500">{assignee.role}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {tags.map((tag, idx) => (
              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Custom Children */}
        {children && <div className="mb-4">{children}</div>}

        {/* Footer with Dates and Quick Actions */}
        <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-gray-500 font-mono flex-wrap">
            {dates.created && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(dates.created)}
              </span>
            )}
            {dates.updated && dates.updated !== dates.created && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                تم التحديث: {formatDate(dates.updated)}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => handleActionClick(action, e)}
                disabled={action.disabled}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  action.variant === 'primary' ? 'bg-[#2e5b9f] text-white hover:bg-[#244b85]' :
                  action.variant === 'danger' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200' :
                  'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                } ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
};

// Specialized Card Components
export const InvoiceCard: React.FC<Omit<ProfessionalCardProps, 'variant'>> = (props) => (
  <ProfessionalCard {...props} variant="invoice" />
);

export const OrderCard: React.FC<Omit<ProfessionalCardProps, 'variant'>> = (props) => (
  <ProfessionalCard {...props} variant="order" />
);

export const ProductCard: React.FC<Omit<ProfessionalCardProps, 'variant'>> = (props) => (
  <ProfessionalCard {...props} variant="product" />
);

export const ExpenseCard: React.FC<Omit<ProfessionalCardProps, 'variant'>> = (props) => (
  <ProfessionalCard {...props} variant="expense" />
);

export const InventoryCard: React.FC<Omit<ProfessionalCardProps, 'variant'>> = (props) => (
  <ProfessionalCard {...props} variant="inventory" />
);

export const SaleCard: React.FC<Omit<ProfessionalCardProps, 'variant'>> = (props) => (
  <ProfessionalCard {...props} variant="sale" />
);

// Card Grid Layout Component
export interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: number;
  className?: string;
}

export const CardGrid: React.FC<CardGridProps> = ({ children, columns = 2, gap = 4, className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-${columns >= 2 ? 2 : 1} lg:grid-cols-${columns} gap-${gap} ${className}`}>
    {children}
  </div>
);

// Card List Layout (single column, compact)
export interface CardListProps {
  children: ReactNode;
  className?: string;
  divided?: boolean;
}

export const CardList: React.FC<CardListProps> = ({ children, className = '', divided = true }) => (
  <div className={`space-y-${divided ? 3 : 0} ${className}`}>
    {React.Children.map(children, (child, idx) => (
      <div key={idx} className={divided && idx > 0 ? 'border-t border-gray-100 pt-4' : ''}>
        {child}
      </div>
    ))}
  </div>
);