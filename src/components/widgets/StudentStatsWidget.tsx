'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Widget from './Widget';

interface StudentStats {
  totalStudents: number;
  todayAttendance: number;
  attendanceRate: number;
  newStudents: number;
  activeStudents: number;
}

export default function StudentStatsWidget() {
  const [stats, setStats] = useState<StudentStats>({
    totalStudents: 0,
    todayAttendance: 0,
    attendanceRate: 0,
    newStudents: 0,
    activeStudents: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/students/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('학생 통계 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <Widget 
      title="학생 현황" 
      icon="👥"
      onRefresh={fetchStats}
      loading={loading}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
          <div className="text-xs text-gray-500">전체 학생</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
          <div className="text-xs text-gray-500">활성 학생</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.todayAttendance}</div>
          <div className="text-xs text-gray-500">오늘 출석</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.attendanceRate}%</div>
          <div className="text-xs text-gray-500">출석률</div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">신규 등록</span>
          <span className="text-sm font-medium text-green-600">+{stats.newStudents}명</span>
        </div>
        <Link 
          href="/dashboard/students" 
          className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
        >
          학생 관리 →
        </Link>
      </div>
    </Widget>
  );
} 