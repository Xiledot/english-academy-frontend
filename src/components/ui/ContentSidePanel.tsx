'use client';

import { useEffect, useState } from 'react';
import { X, Edit, Save, RotateCcw } from 'lucide-react';

interface ContentSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  content: {
    title: string;
    text: string;
    metadata?: Record<string, any>;
  };
  isEditable?: boolean;
  onSave?: (newText: string) => void;
}

export default function ContentSidePanel({ 
  isOpen, 
  onClose, 
  content, 
  isEditable = false, 
  onSave 
}: ContentSidePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content.text);

  // content.text가 변경될 때 editText 동기화
  useEffect(() => {
    setEditText(content.text);
  }, [content.text]);

  // ESC 키로 패널 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEditing) {
          // 편집 중이면 편집 취소
          setIsEditing(false);
          setEditText(content.text);
        } else {
          // 편집 중이 아니면 패널 닫기
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isEditing, content.text]);

  const handleSave = () => {
    if (onSave) {
      onSave(editText);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(content.text);
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 배경 오버레이 - 거의 투명하게 */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
        onClick={onClose}
      />
      
      {/* 사이드 패널 */}
      <div 
        className="fixed right-0 top-0 h-full w-full sm:w-96 lg:w-1/3 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {content.title}
            </h2>
            {isEditable && (
              <div className="flex items-center space-x-1 ml-2">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                    title="편집"
                  >
                    <Edit size={16} className="text-gray-600" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-1.5 rounded-md hover:bg-green-100 transition-colors"
                      title="저장"
                    >
                      <Save size={16} className="text-green-600" />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 rounded-md hover:bg-red-100 transition-colors"
                      title="취소"
                    >
                      <RotateCcw size={16} className="text-red-600" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-200 transition-colors"
            aria-label="패널 닫기"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 메타데이터가 있는 경우 */}
          {content.metadata && Object.keys(content.metadata).length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">추가 정보</h3>
              <div className="space-y-1">
                {Object.entries(content.metadata).map(([key, value]) => (
                  <div key={key} className="flex text-sm">
                    <span className="font-medium text-gray-600 w-20">{key}:</span>
                    <span className="text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메인 텍스트 내용 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">내용</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              {isEditing ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="내용을 입력하세요..."
                  autoFocus
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
                  {content.text || '내용이 없습니다.'}
                </div>
              )}
            </div>
            
            {isEditing && (
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  저장
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 