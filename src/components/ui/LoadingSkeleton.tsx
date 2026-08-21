import React from 'react';

/**
 * A reusable skeleton loader that simulates the layout of content blocks.
 * Supports: text lines, cards, tables, stat cards, and product/order tiles.
 */
export const LoadingSkeleton: React.FC<{
  /** Type of skeleton to render */
  type?: 'text' | 'card' | 'stat' | 'table' | 'tile' | 'avatar';
  /** Number of items to render for lists */
  count?: number;
  /** Additional classes */
  className?: string;
}> = ({ type = 'text', count = 1, className = '' }) => {
  const shimmer =
    'relative overflow-hidden bg-[#faf8f5] rounded-xl animate-pulse';

  const renderItem = () => {
    switch (type) {
      case 'stat':
        return (
          <div className={`${shimmer} ${className} p-4 h-24 flex flex-col justify-between`}>
            <div className="h-3 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 w-1/2 bg-gray-300 rounded animate-pulse mt-2" />
            <div className="h-2 w-full bg-gray-200 rounded animate-pulse mt-1" />
          </div>
        );

      case 'card':
        return (
          <div className={`${shimmer} ${className} p-4 h-60 flex flex-col gap-3`}>
            <div className="h-4 w-2/3 bg-gray-300 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-5/6 bg-gray-200 rounded" />
            <div className="h-3 w-1/2 bg-gray-300 rounded mt-auto" />
          </div>
        );

      case 'tile':
        return (
          <div className={`${shimmer} ${className} p-4 h-28 flex flex-col gap-2.5`}>
            <div className="flex justify-between items-center">
              <div className="h-4 w-1/3 bg-gray-300 rounded" />
              <div className="h-5 w-12 bg-gray-200 rounded-full" />
            </div>
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="flex justify-between items-center mt-auto">
              <div className="h-3 w-1/4 bg-gray-300 rounded" />
              <div className="h-3 w-1/6 bg-gray-200 rounded" />
            </div>
          </div>
        );

      case 'avatar':
        return (
          <div className={`${shimmer} ${className} w-10 h-10 rounded-full animate-pulse`} />
        );

      case 'table':
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  {[...Array(6)].map((_, colIdx) => (
                    <th key={colIdx} className="pb-2 px-3">
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(count)].map((_, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-100">
                    {[...Array(6)].map((_, colIdx) => (
                      <td key={colIdx} className="py-3.5 px-3">
                        <div className={`h-3 bg-gray-200 rounded animate-pulse ${
                          colIdx === 5 ? 'w-12' : 'w-20'
                        }`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'text':
      default:
        return (
          <div className="flex flex-col gap-1.5">
            {[...Array(count)].map((_, idx) => (
              <div
                key={idx}
                className={`h-3 bg-gray-200 rounded animate-pulse ${
                  idx === count - 1 ? 'w-5/6' : 'w-full'
                }`}
              />
            ))}
          </div>
        );
    }
  };

  if (type === 'table') {
    return <div className="animate-pulse">{renderItem()}</div>;
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {[...Array(count)].map((_, idx) => (
        <div key={idx} className="animate-pulse">
          {renderItem()}
        </div>
      ))}
    </div>
  );
};