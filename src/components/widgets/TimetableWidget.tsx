'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Widget from './Widget';

interface TodayStudent {
  id: number | string;
  name: string;
  grade: string;
  school: string;
  subject: string;
  notes: string;
}

export default function TodayStudentsWidget() {
  const [todayStudents, setTodayStudents] = useState<TodayStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/students/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTodayStudents(data.slice(0, 6)); // 최대 6명만 표시
      }
    } catch (error) {
      console.error('오늘 학생 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayStudents();
  }, []);

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      '수업': 'bg-green-50 text-green-600',
      '재시험': 'bg-red-100 text-red-800',
      '보충': 'bg-yellow-100 text-yellow-800', // 시간표와 동일한 노란색
      '보충 수업': 'bg-yellow-100 text-yellow-800',
      '화상': 'bg-indigo-100 text-indigo-800',
      '화상 수업': 'bg-indigo-100 text-indigo-800',
      'OT': 'bg-purple-100 text-purple-800',
      '결석': 'bg-gray-100 text-gray-800',
      '피드백': 'bg-pink-100 text-pink-800',
      '추가': 'bg-yellow-100 text-yellow-800',
      '추가 점검': 'bg-yellow-100 text-yellow-800',
      '시험': 'bg-orange-100 text-orange-800',
      '복습': 'bg-teal-100 text-teal-800',
      '연습': 'bg-cyan-100 text-cyan-800',
      '상담': 'bg-emerald-100 text-emerald-800',
      '청해': 'bg-blue-100 text-blue-800',
      '작문': 'bg-purple-100 text-purple-800',
      '독해': 'bg-orange-100 text-orange-800',
      '회화': 'bg-pink-100 text-pink-800',
      '문법': 'bg-indigo-100 text-indigo-800',
      '어휘': 'bg-teal-100 text-teal-800'
    };
    return colors[subject] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Widget 
      title="오늘 수업 학생" 
      icon="👥"
      onRefresh={fetchTodayStudents}
      loading={loading}
    >
      {todayStudents.length > 0 ? (
        <div className="space-y-2">
          {todayStudents.map((student) => (
            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                    {student.name.charAt(0)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900">{student.name}</span>
                    {student.grade && (
                      <span className="text-xs text-gray-500">{student.grade}</span>
                    )}
                  </div>
                  {student.school && (
                    <div className="text-xs text-gray-500">{student.school}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 text-xs rounded-full ${getSubjectColor(student.subject)}`}>
                  {student.subject}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <Link 
              href="/dashboard/timetable" 
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              전체 시간표 보기 →
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">오늘 수업 예정인 학생이 없습니다</p>
          <Link 
            href="/dashboard/timetable" 
            className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
          >
            시간표 관리하기 →
          </Link>
        </div>
      )}
    </Widget>
  );
} 