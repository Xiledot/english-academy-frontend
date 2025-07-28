'use client';

import { useState, useEffect } from 'react';
import Calendar from '../../../components/Calendar';
import Sidebar from '../../../components/Sidebar';

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

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarType, setCalendarType] = useState<'personal' | 'shared'>('shared');
  const [isLoading, setIsLoading] = useState(false);

  // 컴포넌트 마운트 시 현재 월 일정 조회
  useEffect(() => {
    console.log('🚀 캘린더 컴포넌트 마운트, 현재 날짜:', currentDate);
    console.log('🚀 현재 캘린더 타입:', calendarType);
    console.log('🚀 fetchMonthEvents 함수 호출 시작');
    fetchMonthEvents(currentDate, calendarType);
  }, [currentDate, calendarType]);

  // 추가: 컴포넌트 마운트 시 강제 호출
  useEffect(() => {
    console.log('🔄 강제 데이터 로딩 시작');
    const timer = setTimeout(() => {
      fetchMonthEvents(new Date(), 'shared');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // 월별 일정 조회
  const fetchMonthEvents = async (date: Date, type: 'personal' | 'shared' = calendarType) => {
    setIsLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      console.log('📅 월별 일정 조회 시도:', { year, month, type });
      
      const token = localStorage.getItem('token');
      console.log('🔑 조회용 토큰:', token ? `토큰 있음 (${token.substring(0, 20)}...)` : '토큰 없음');
      
      const url = `/api/calendar/month/${year}/${month}?calendar_type=${type}`;
      console.log('🌐 요청 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 응답 상태:', response.status);
      console.log('📡 응답 헤더:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP 에러:', { status: response.status, error: errorText });
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ 조회된 일정 데이터:', data);
      console.log('📊 조회된 일정 개수:', data.length);
      
      if (data.length > 0) {
        console.log('📋 첫 번째 일정 예시:', data[0]);
      }
      
      setEvents(data);
    } catch (error) {
      console.error('❌ 일정 조회 실패:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 일정 생성
  const createEvent = async (eventData: Omit<CalendarEvent, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'created_by_name'>) => {
    try {
      const token = localStorage.getItem('token');
      
      const eventWithType = {
        ...eventData,
        calendar_type: calendarType
      };
      
      console.log('일정 생성 시도:', eventWithType);
      
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventWithType),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newEvent = await response.json();
      console.log('생성된 일정:', newEvent);
      
      // 현재 월의 일정을 다시 조회
      await fetchMonthEvents(currentDate, calendarType);
      
      return newEvent;
    } catch (error) {
      console.error('일정 생성 실패:', error);
      throw error;
    }
  };

  // 일정 수정
  const updateEvent = async (id: number, eventData: Partial<CalendarEvent>) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedEvent = await response.json();
      console.log('✅ 백엔드에서 받은 업데이트된 이벤트:', updatedEvent);
      
      // 현재 월의 일정을 다시 조회
      console.log('🔄 드래그 앤 드롭 후 데이터 재조회 시작');
      await fetchMonthEvents(currentDate, calendarType);
      console.log('🔄 드래그 앤 드롭 후 데이터 재조회 완료');
      
      return updatedEvent;
    } catch (error) {
      console.error('일정 수정 실패:', error);
      throw error;
    }
  };

  // 일정 삭제
  const deleteEvent = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 현재 월의 일정을 다시 조회
      await fetchMonthEvents(currentDate, calendarType);
    } catch (error) {
      console.error('일정 삭제 실패:', error);
      throw error;
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (type: 'personal' | 'shared') => {
    setCalendarType(type);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole="director" />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="p-3">
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-gray-800">캘린더</h1>
            </div>
            
            {/* 탭 메뉴 */}
            <div className="mb-4">
              <div className="flex space-x-1 bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => handleTabChange('shared')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    calendarType === 'shared'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🏢 분원 캘린더
                </button>
                <button
                  onClick={() => handleTabChange('personal')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    calendarType === 'personal'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📱 개인 캘린더
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">로딩 중...</div>
              </div>
            ) : (
              <Calendar
                events={events}
                currentDate={currentDate}
                calendarType={calendarType}
                onDateChange={setCurrentDate}
                onCreateEvent={createEvent}
                onUpdateEvent={updateEvent}
                onDeleteEvent={deleteEvent}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
} 