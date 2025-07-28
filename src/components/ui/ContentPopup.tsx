'use client';

import { useState } from 'react';

interface ContentPopupProps {
  content: string;
  title: string;
  maxLength?: number;
  className?: string;
}

export default function ContentPopup({ content, title, maxLength = 50, className = '' }: ContentPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const truncatedContent = content.length > maxLength 
    ? content.substring(0, maxLength) + '...' 
    : content;

  const shouldShowPopup = content.length > maxLength;

  return (
    <>
      <div 
        className={`cursor-pointer hover:bg-blue-50 transition-colors ${className}`}
        onClick={() => shouldShowPopup && setIsOpen(true)}
      >
        {shouldShowPopup ? (
          <span className="text-blue-600 hover:text-blue-800">
            {truncatedContent}
            <span className="text-xs text-gray-500 ml-1">(클릭하여 전체보기)</span>
          </span>
        ) : (
          <span>{content}</span>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {content}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 