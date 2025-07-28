'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CalendarEvent {
  id: number;
  title: string;
  start_date: string;
  start_time?: string;
  is_all_day: boolean;
  color: string;
  category: string;
  calendar_type: 'personal' | 'shared';
  created_by_name?: string;
}

interface UpcomingEventsData {
  shared: CalendarEvent[];
  personal: CalendarEvent[];
}

export default function UpcomingEventsWidget() {
  const [events, setEvents] = useState<UpcomingEventsData>({ shared: [], personal: [] });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/calendar/upcoming?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('다가오는 일정 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '오늘';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '내일';
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const EventItem = ({ event }: { event: CalendarEvent }) => (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
      <div className="flex items-center space-x-3 flex-1">
        <div 
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: event.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {event.title}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(event.start_date)}
            {!event.is_all_day && event.start_time && ` ${formatTime(event.start_time)}`}
            {event.category && ` • ${event.category}`}
          </div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 다가오는 일정</h3>
        <div className="text-center text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📅 다가오는 일정</h3>
        <button
          onClick={() => router.push('/dashboard/calendar')}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          전체보기
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 분원 일정 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            🏢 분원 일정
          </h4>
          <div className="space-y-1">
            {events.shared.length > 0 ? (
              events.shared.map((event) => (
                <EventItem key={`shared-${event.id}`} event={event} />
              ))
            ) : (
              <div className="text-xs text-gray-400 p-2 text-center">예정된 분원 일정이 없습니다</div>
            )}
          </div>
        </div>

        {/* 개인 일정 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            📱 개인 일정
          </h4>
          <div className="space-y-1">
            {events.personal.length > 0 ? (
              events.personal.map((event) => (
                <EventItem key={`personal-${event.id}`} event={event} />
              ))
            ) : (
              <div className="text-xs text-gray-400 p-2 text-center">예정된 개인 일정이 없습니다</div>
            )}
          </div>
        </div>
      </div>

      {events.shared.length === 0 && events.personal.length === 0 && (
        <div className="text-center text-gray-500 py-4 mt-4">
          앞으로 7일간 예정된 일정이 없습니다
        </div>
      )}
    </div>
  );
} 