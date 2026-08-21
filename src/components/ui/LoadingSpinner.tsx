import React from 'react';

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string; text?: string }> = ({
  size = 'md',
  className = '',
  text = 'جاري التحميل...',
}) => {
  // If size is 'sm', keep a small elegant skeleton inline
  if (size === 'sm') {
    return (
      <div className={`flex items-center gap-2 animate-pulse ${className}`}>
        <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
        <div className="h-3 w-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Otherwise, render a professional Facebook/Instagram-like Social Media Skeleton Screen Loader
  return (
    <div className={`w-full max-w-7xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Skeleton Header */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-gray-150 bg-gray-200/60 rounded"></div>
        </div>
        <div className="h-10 w-28 bg-gray-200 rounded-xl"></div>
      </div>

      {/* Grid of Skeleton Cards mimicking Social Media feed or Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-xs animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded-md w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded-md w-1/3"></div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3.5 bg-gray-200 rounded-md"></div>
              <div className="h-3.5 bg-gray-200 rounded-md w-5/6"></div>
              <div className="h-3.5 bg-gray-100 rounded-md w-2/3"></div>
            </div>
            <div className="flex gap-2 pt-4 border-t border-gray-50">
              <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
              <div className="h-8 bg-gray-100 rounded-lg w-16"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
