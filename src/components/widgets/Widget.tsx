'use client';

import { ReactNode } from 'react';

interface WidgetProps {
  title: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function Widget({ 
  title, 
  icon, 
  children, 
  className = '',
  onRefresh,
  loading = false 
}: WidgetProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          {icon && <span className="mr-2 text-lg">{icon}</span>}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>
      
      {/* 콘텐츠 */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
} 