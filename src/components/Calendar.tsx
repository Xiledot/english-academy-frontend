'use client';

import { useState } from 'react';

interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_all_day: boolean;
  color: string;
  category: string;
  location?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  is_holiday: boolean;
  calendar_type: 'personal' | 'shared';
  created_by_name?: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  currentDate: Date;
  calendarType: 'personal' | 'shared';
  onDateChange: (date: Date) => void;
  onCreateEvent: (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_name'>) => Promise<CalendarEvent | null>;
  onUpdateEvent: (id: number, eventData: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  onDeleteEvent: (id: number) => Promise<boolean>;
}

// 색상 옵션
const colorOptions = [
  // 기본 색상
  { name: '파란색', value: '#3B82F6' },
  { name: '빨간색', value: '#EF4444' },
  { name: '초록색', value: '#10B981' },
  { name: '노란색', value: '#F59E0B' },
  { name: '보라색', value: '#8B5CF6' },
  { name: '분홍색', value: '#EC4899' },
  { name: '청록색', value: '#06B6D4' },
  { name: '주황색', value: '#F97316' },
  
  // 파스텔 색상
  { name: '파스텔 핑크', value: '#F8BBD9' },
  { name: '파스텔 라벤더', value: '#E4C1F9' },
  { name: '파스텔 블루', value: '#A8DADC' },
  { name: '파스텔 민트', value: '#B4F8C8' },
  { name: '파스텔 피치', value: '#FFD3A5' },
  { name: '파스텔 옐로우', value: '#FFF3B0' },
  { name: '파스텔 코랄', value: '#FFAAA5' },
  { name: '파스텔 퍼플', value: '#D4A5FF' },
  
  // 추가 색상
  { name: '네이비', value: '#1E3A8A' },
  { name: '마룬', value: '#7C2D12' },
  { name: '올리브', value: '#65A30D' },
  { name: '틸', value: '#0F766E' },
  { name: '인디고', value: '#4338CA' },
  { name: '로즈', value: '#E11D48' },
  { name: '라임', value: '#84CC16' },
  { name: '앰버', value: '#D97706' },
  
  // 뉴트럴 색상
  { name: '회색', value: '#6B7280' },
  { name: '다크그레이', value: '#374151' },
  { name: '검은색', value: '#1F2937' },
  { name: '화이트', value: '#FFFFFF' },
];

// 카테고리 옵션
const categoryOptions = [
  { value: '중요', label: '중요' },
  { value: '연습', label: '연습' },
  { value: '특강', label: '특강' },
  { value: '휴무', label: '휴무' },
  { value: '홍보', label: '홍보' },
  { value: '서킷', label: '서킷' },
  { value: '내신', label: '내신' },
  { value: '예비고사', label: '예비고사' },
  { value: '영어시험', label: '영어시험' },
];



export default function Calendar({
  events,
  currentDate,
  calendarType,
  onDateChange,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
}: CalendarProps) {
  const [editingEvent, setEditingEvent] = useState<number | null>(null);
  const [newEventDate, setNewEventDate] = useState<string | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // 중복 저장 방지

  // 팝업 위치 계산 함수
  const getPopupPosition = (eventId: number) => {
    const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
    if (!eventElement) return { top: 'top-full', left: 'left-0' };
    
    const rect = eventElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const popupHeight = 400; // 팝업 높이를 더 크게 예상
    const margin = 20; // 여백
    
    // 하단 공간이 부족한 경우 위쪽에 표시
    if (rect.bottom + popupHeight + margin > viewportHeight) {
      return { top: 'bottom-full', left: 'left-0', transform: 'translateY(-10px)' };
    }
    
    return { top: 'top-full', left: 'left-0', transform: 'translateY(10px)' };
  };

  // 월의 첫 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 = 일요일
  const daysInMonth = lastDayOfMonth.getDate();

  // 캘린더 그리드에 표시할 날짜들 생성
  const calendarDays = [];
  
  // 이전 달의 마지막 날들 (빈 칸 채우기)
  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevYear = currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
    const prevMonthNum = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth(); // 0-based month
    
    calendarDays.push({
      date: prevMonth.getDate() - i,
      isCurrentMonth: false,
      isToday: false,
      dateString: `${prevYear}-${String(prevMonthNum).padStart(2, '0')}-${String(prevMonth.getDate() - i).padStart(2, '0')}`,
    });
  }

  // 현재 달의 날들
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = 
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day;

    calendarDays.push({
      date: day,
      isCurrentMonth: true,
      isToday,
      dateString,
    });
  }

  // 다음 달의 첫 날들 (6주 완성)
  const remainingDays = 42 - calendarDays.length; // 6주 * 7일 = 42일
  for (let day = 1; day <= remainingDays; day++) {
    const nextYear = currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear();
    const nextMonthNum = currentDate.getMonth() === 11 ? 1 : currentDate.getMonth() + 2;
    
    calendarDays.push({
      date: day,
      isCurrentMonth: false,
      isToday: false,
      dateString: `${nextYear}-${String(nextMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  }

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (dateString: string) => {
    // 항상 전체 이벤트 데이터 출력
    console.log('🔍 전체 이벤트 데이터:', events);
    console.log('🔍 이벤트 개수:', events.length);
    
    return events.filter(event => {
      // 단순히 문자열 비교 (YYYY-MM-DD 형식)
      const eventStartDate = event.start_date.split('T')[0];
      
      // 정확한 날짜 매칭
      const isMatch = dateString === eventStartDate;
      
      return isMatch;
    });
  };

  // 이전/다음 달로 이동
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    onDateChange(newDate);
  };

  // 오늘로 이동
  const goToToday = () => {
    onDateChange(new Date());
  };

  // 새 이벤트 입력 시작
  const startNewEvent = (dateString: string) => {
    setNewEventDate(dateString);
    setNewEventTitle('');
    setEditingEvent(null);
  };

  // 새 이벤트 저장
  const saveNewEvent = async () => {
    // 중복 호출 방지
    if (isSaving) {
      console.log('이미 저장 중입니다. 중복 호출 방지');
      return;
    }

    if (!newEventTitle.trim() || !newEventDate) {
      console.log('저장 실패: 제목 또는 날짜 없음', { title: newEventTitle, date: newEventDate });
      return;
    }

    setIsSaving(true);
    console.log('새 이벤트 저장 시도:', { title: newEventTitle.trim(), date: newEventDate });

    try {
      const eventData = {
        title: newEventTitle.trim(),
        start_date: newEventDate,
        is_all_day: true,
        color: '#3B82F6',
        category: '중요',
        is_holiday: false,
        calendar_type: calendarType,
      };

      console.log('전송할 이벤트 데이터:', eventData);
      const result = await onCreateEvent(eventData);
      console.log('이벤트 생성 결과:', result);
      
      if (result) {
        console.log('이벤트 저장 성공, 입력 필드 초기화');
        setNewEventDate(null);
        setNewEventTitle('');
      } else {
        console.log('이벤트 저장 실패');
      }
    } catch (error) {
      console.error('이벤트 저장 중 오류:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 새 이벤트 입력 취소
  const cancelNewEvent = () => {
    setNewEventDate(null);
    setNewEventTitle('');
  };

  // 이벤트 색상 변경
  const changeEventColor = async (event: CalendarEvent, color: string) => {
    if (event.id) {
      await onUpdateEvent(event.id, { color });
    }
  };

  // 이벤트 카테고리 변경
  const changeEventCategory = async (event: CalendarEvent, category: string) => {
    if (event.id) {
      await onUpdateEvent(event.id, { category });
    }
  };

  // 이벤트 삭제
  const handleDeleteEvent = async (event: CalendarEvent) => {
    if (event.id && confirm('정말로 이 일정을 삭제하시겠습니까?')) {
      await onDeleteEvent(event.id);
    }
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    console.log('🎯🎯🎯 드래그 시작!!! 이벤트:', event.title);
    console.log('🎯🎯🎯 드래그 시작!!! ID:', event.id);
    console.log('🎯🎯🎯 드래그 시작!!! 전체 이벤트 데이터:', event);
    setDraggedEvent(event);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    
    // 드래그 중인 요소 스타일 설정
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  // 드래그 종료
  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedEvent(null);
    setDragOverDate(null);
    (e.target as HTMLElement).style.opacity = '1';
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent, dateString: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateString);
  };

  // 드래그 리브
  const handleDragLeave = (e: React.DragEvent) => {
    // 자식 요소로 이동하는 경우는 제외
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDate(null);
    }
  };

  // 드롭
  const handleDrop = async (e: React.DragEvent, targetDateString: string) => {
    e.preventDefault();
    setDragOverDate(null);
    
    if (!draggedEvent) {
      console.log('❌ 드래그된 이벤트가 없음');
      return;
    }

    if (draggedEvent.start_date === targetDateString) {
      console.log('❌ 같은 날짜로 드롭 (변경 없음)');
      return;
    }

    console.log('🎯 드래그 앤 드롭 실행:', {
      eventId: draggedEvent.id,
      eventTitle: draggedEvent.title,
      originalDate: draggedEvent.start_date,
      originalDateParsed: draggedEvent.start_date.split('T')[0],
      targetDateString: targetDateString,
      currentMonth: currentDate.getMonth() + 1,
      currentYear: currentDate.getFullYear(),
      드롭한날짜셀정보: `${targetDateString} (${new Date(targetDateString).toLocaleDateString('ko-KR')})`,
      원본날짜정보: `${draggedEvent.start_date.split('T')[0]} (${new Date(draggedEvent.start_date.split('T')[0]).toLocaleDateString('ko-KR')})`
    });
    
    // 일정의 날짜를 새로운 날짜로 업데이트
    if (draggedEvent.id) {
      const updateData = { 
        start_date: targetDateString,
        end_date: targetDateString, // 단일 날짜 일정인 경우
        calendar_type: draggedEvent.calendar_type // 기존 calendar_type 보존
      };
      
      console.log('📤 백엔드로 전송할 데이터:', updateData);
      console.log('🔍 드래그된 이벤트의 원본 calendar_type:', draggedEvent.calendar_type);
      console.log('🔍 드래그된 이벤트 전체 정보:', draggedEvent);
      
      try {
        const result = await onUpdateEvent(draggedEvent.id, updateData);
        console.log('✅ 업데이트 성공:', result);
      } catch (error) {
        console.error('❌ 업데이트 실패:', error);
      }
    }
    
    setDraggedEvent(null);
  };

  // 월 이름 포맷
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      {/* 캘린더 헤더 - 그라데이션 배경 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
              title="이전 달"
            >
              <span className="text-xl font-bold">‹</span>
            </button>
            
            <h2 className="text-xl font-bold">
              {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
            </h2>
            
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-105"
              title="다음 달"
            >
              <span className="text-xl font-bold">›</span>
            </button>
          </div>

          <button
            onClick={goToToday}
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-medium"
          >
            오늘
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 bg-gray-50">
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={`p-3 text-center text-sm font-semibold ${
              index === 0 
                ? 'text-red-500' 
                : index === 6 
                ? 'text-blue-500' 
                : 'text-gray-700'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const eventsForDate = getEventsForDate(day.dateString);
          const isWeekend = index % 7 === 0 || index % 7 === 6;
          const isSunday = index % 7 === 0;
          const isSaturday = index % 7 === 6;

          return (
            <div
              key={`${day.dateString}-${index}`}
              className={`min-h-[140px] p-2 border-r border-b relative cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                !day.isCurrentMonth 
                  ? 'bg-gray-50 text-gray-400' 
                  : day.isToday 
                  ? 'bg-blue-100 ring-2 ring-blue-400 ring-inset' 
                  : isSunday
                  ? 'bg-red-50/30'
                  : isSaturday
                  ? 'bg-blue-50/30'
                  : 'bg-white hover:bg-gray-50'
              } ${
                dragOverDate === day.dateString 
                  ? 'ring-2 ring-green-400 bg-green-50' 
                  : ''
              }`}
              onClick={(e) => {
                // 배경 클릭 시에만 새 이벤트 시작
                if (e.target === e.currentTarget) {
                  startNewEvent(day.dateString);
                }
              }}
              onDragOver={(e) => handleDragOver(e, day.dateString)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                console.log('🎯 드롭 이벤트 발생! 날짜 셀 정보:', {
                  날짜: day.date,
                  dateString: day.dateString,
                  isCurrentMonth: day.isCurrentMonth,
                  실제날짜확인: new Date(day.dateString).toLocaleDateString('ko-KR')
                });
                handleDrop(e, day.dateString);
              }}
            >
              {/* 날짜 숫자 */}
              <div className={`text-sm font-medium mb-1 ${
                day.isToday 
                  ? 'text-blue-700 font-bold text-base' 
                  : !day.isCurrentMonth 
                  ? 'text-gray-400' 
                  : isSunday
                  ? 'text-red-600'
                  : isSaturday
                  ? 'text-blue-600'
                  : 'text-gray-900'
              }`}>
                {day.date}
              </div>

              {/* 새 이벤트 입력 */}
              {newEventDate === day.dateString && (
                <div 
                  className="mb-2"
                  onClick={(e) => e.stopPropagation()} // 입력 필드 클릭 시 이벤트 전파 방지
                >
                  <input
                    type="text"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation(); // 키 이벤트 전파 방지
                      if (e.key === 'Enter') {
                        e.preventDefault(); // 폼 제출 방지
                        saveNewEvent();
                      } else if (e.key === 'Escape') {
                        cancelNewEvent();
                      }
                    }}
                    placeholder="일정 제목..."
                    className="w-full text-xs px-2 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    autoFocus
                  />
                  <div className="flex space-x-1 mt-1">
                    <button
                      onClick={saveNewEvent}
                      disabled={isSaving}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={cancelNewEvent}
                      className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* 기존 이벤트들 */}
              {eventsForDate.map((event) => (
                <div key={event.id} className="relative mb-1">
                  <div
                    data-event-id={event.id}
                    draggable
                    className="text-xs px-2 py-1 rounded-lg text-white cursor-move hover:opacity-90 transition-all duration-200 truncate shadow-sm hover:shadow-md transform hover:scale-105"
                    style={{ backgroundColor: event.color }}
                    onClick={(e) => {
                      e.stopPropagation(); // 이벤트 전파 방지
                      setEditingEvent(editingEvent === event.id ? null : event.id!);
                    }}
                    onDragStart={(e) => handleDragStart(e, event)}
                    onDragEnd={handleDragEnd}
                    title={`${event.category}: ${event.title} (드래그하여 이동)`}
                  >
                    {event.category} | {event.start_time && !event.is_all_day && `${event.start_time} `}
                    {event.title}
                  </div>

                  {/* 이벤트 편집 메뉴 */}
                  {editingEvent === event.id && (
                    <>
                      {/* 배경 오버레이 - 블러 처리된 반투명 배경 */}
                      <div 
                        className="fixed inset-0 bg-white/30 backdrop-blur-sm z-40"
                        onClick={() => setEditingEvent(null)}
                      />
                      {/* 팝업 */}
                      <div 
                        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white border border-gray-200 rounded-xl shadow-2xl p-4 min-w-[280px] max-w-[90vw] max-h-[80vh] overflow-y-auto backdrop-blur-md"
                        onClick={(e) => e.stopPropagation()} // 편집 메뉴 클릭 시 이벤트 전파 방지
                      >
                        <div className="space-y-3">
                          {/* 색상 선택 */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">색상</label>
                            <div className="grid grid-cols-6 gap-1">
                              {colorOptions.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => changeEventColor(event, color.value)}
                                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                                    event.color === color.value ? 'border-gray-800 scale-110 shadow-md' : 'border-gray-300 hover:border-gray-500'
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  title={color.name}
                                />
                              ))}
                            </div>
                          </div>

                          {/* 카테고리 선택 */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">카테고리</label>
                            <select
                              value={event.category}
                              onChange={(e) => changeEventCategory(event, e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              {categoryOptions.map((category) => (
                                <option key={category.value} value={category.value}>
                                  {category.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleDeleteEvent(event)}
                            className="w-full px-3 py-2 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 transition-colors font-medium"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
} 