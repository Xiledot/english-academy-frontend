'use client';

import { useState } from 'react';

interface FixedTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: FixedTaskData) => void;
}

export interface FixedTaskData {
  title: string;
  description: string;
  category: '고정업무' | '임시업무' | '긴급업무';
  priority: '높음' | '보통' | '낮음';
  assigned_type: '누구나' | '전인원' | '특정조교';
  assigned_name?: string;
}

export default function FixedTaskModal({ isOpen, onClose, onSave }: FixedTaskModalProps) {
  const [formData, setFormData] = useState<FixedTaskData>({
    title: '',
    description: '',
    category: '고정업무',
    priority: '보통',
    assigned_type: '누구나',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('업무명을 입력해주세요.');
      return;
    }

    onSave(formData);
    onClose();
    
    // 폼 초기화
    setFormData({
      title: '',
      description: '',
      category: '고정업무',
      priority: '보통',
      assigned_type: '누구나',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">고정 업무 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
          <p className="text-sm text-purple-700">
            💡 고정 업무는 모든 날짜에 자동으로 생성됩니다. 매일 해야 하는 기본적인 업무에 사용하세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 업무명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              업무명 *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="예: 출석 체크, 교실 정리 등"
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none"
              placeholder="업무에 대한 상세 설명을 입력하세요"
              rows={3}
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="고정업무">고정업무</option>
              <option value="임시업무">임시업무</option>
              <option value="긴급업무">긴급업무</option>
            </select>
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              우선순위
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="높음">높음</option>
              <option value="보통">보통</option>
              <option value="낮음">낮음</option>
            </select>
          </div>

          {/* 담당자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              담당자
            </label>
            <select
              value={formData.assigned_type}
              onChange={(e) => setFormData(prev => ({ ...prev, assigned_type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="누구나">누구나</option>
              <option value="전인원">전인원</option>
              <option value="특정조교">특정조교</option>
            </select>
          </div>

          {/* 특정조교 이름 */}
          {formData.assigned_type === '특정조교' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                조교 이름
              </label>
              <input
                type="text"
                value={formData.assigned_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, assigned_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="조교 이름을 입력하세요"
              />
            </div>
          )}

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 