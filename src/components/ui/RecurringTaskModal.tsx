'use client';

import { useState } from 'react';

interface RecurringTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: RecurringTaskData) => void;
}

export interface RecurringTaskData {
  title: string;
  description: string;
  category: '고정업무' | '임시업무' | '긴급업무';
  priority: '높음' | '보통' | '낮음';
  assigned_type: '누구나' | '전인원' | '특정조교';
  assigned_name?: string;
  recurring_type: '매일' | '매주' | '매월' | '요일별';
  recurring_days?: string[];
  start_date: string;
  end_date?: string;
}

export default function RecurringTaskModal({ isOpen, onClose, onSave }: RecurringTaskModalProps) {
  const [formData, setFormData] = useState<RecurringTaskData>({
    title: '',
    description: '',
    category: '임시업무',
    priority: '보통',
    assigned_type: '누구나',
    recurring_type: '매일',
    start_date: new Date().toISOString().split('T')[0],
  });

  const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('업무명을 입력해주세요.');
      return;
    }

    if (formData.recurring_type === '요일별' && (!formData.recurring_days || formData.recurring_days.length === 0)) {
      alert('반복할 요일을 선택해주세요.');
      return;
    }

    onSave(formData);
    onClose();
    
    // 폼 초기화
    setFormData({
      title: '',
      description: '',
      category: '임시업무',
      priority: '보통',
      assigned_type: '누구나',
      recurring_type: '매일',
      start_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleWeekdayToggle = (day: string) => {
    const currentDays = formData.recurring_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setFormData(prev => ({ ...prev, recurring_days: newDays }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">반복 업무 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
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
              placeholder="업무명을 입력하세요"
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
              placeholder="업무 설명을 입력하세요"
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

          {/* 반복 유형 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              반복 유형
            </label>
            <select
              value={formData.recurring_type}
              onChange={(e) => setFormData(prev => ({ ...prev, recurring_type: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="매일">매일</option>
              <option value="매주">매주</option>
              <option value="매월">매월</option>
              <option value="요일별">요일별</option>
            </select>
          </div>

          {/* 요일 선택 */}
          {formData.recurring_type === '요일별' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반복할 요일 선택
              </label>
              <div className="flex flex-wrap gap-2">
                {weekdays.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleWeekdayToggle(day)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.recurring_days?.includes(day)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 시작 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              시작 날짜 *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              required
            />
          </div>

          {/* 종료 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              종료 날짜 (선택사항)
            </label>
            <input
              type="date"
              value={formData.end_date || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              min={formData.start_date}
            />
          </div>

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
              className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              생성
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 