'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface Schedule {
  id: number;
  day_of_week: number;
  time_slot: string;
  subject: string;
  teacher_id: number;
  student_ids: number[];
  room?: string;
  notes?: string;
}

interface TimeSlot {
  id: number;
  start_time: string;
  end_time: string;
  slot_name: string;
  is_active: boolean;
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SUBJECTS = {
  reading: '독해',
  grammar: '문법',
  vocabulary: '단어',
  listening: '청해',
  speaking: '회화',
  writing: '작문'
};

export default function FullTimetablePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchedules();
    fetchTimeSlots();
  }, []);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/schedules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data);
      }
    } catch (error) {
      console.error('시간표 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:3001/api/schedules/time-slots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data.data);
      }
    } catch (error) {
      console.error('시간대 조회 오류:', error);
    }
  };

  const getScheduleForTimeSlot = (day: number, timeSlot: string) => {
    return schedules.find(schedule => 
      schedule.day_of_week === day && schedule.time_slot === timeSlot
    );
  };

  const getSubjectLabel = (subject: string) => {
    return SUBJECTS[subject as keyof typeof SUBJECTS] || subject;
  };

  const getSubjectColor = (subject: string) => {
    const colors = {
      reading: 'bg-blue-100 text-blue-800',
      grammar: 'bg-green-100 text-green-800',
      vocabulary: 'bg-yellow-100 text-yellow-800',
      listening: 'bg-purple-100 text-purple-800',
      speaking: 'bg-pink-100 text-pink-800',
      writing: 'bg-indigo-100 text-indigo-800'
    };
    return colors[subject as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">전체 시간표를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">전체 시간표</h1>
        <p className="text-gray-600">학원 전체 시간표를 한눈에 볼 수 있습니다.</p>
      </div>

      {/* 전체 시간표 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시간
                </th>
                {DAYS.map((day, index) => (
                  <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {day}요일
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timeSlots.map((timeSlot) => (
                <tr key={timeSlot.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap bg-gray-50">
                    <div className="text-sm font-medium text-gray-900">
                      {timeSlot.slot_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {timeSlot.start_time} - {timeSlot.end_time}
                    </div>
                  </td>
                  {DAYS.map((day, dayIndex) => {
                    const schedule = getScheduleForTimeSlot(dayIndex, timeSlot.slot_name);
                    
                    return (
                      <td key={dayIndex} className="px-6 py-4 whitespace-nowrap">
                        {schedule ? (
                          <div className="text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectColor(schedule.subject)}`}>
                              {getSubjectLabel(schedule.subject)}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {schedule.room}
                            </div>
                            <div className="text-xs text-gray-400">
                              {schedule.student_ids.length}명
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-400 text-sm">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 과목별 색상 설명 */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">과목별 색상</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(SUBJECTS).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubjectColor(key)}`}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 