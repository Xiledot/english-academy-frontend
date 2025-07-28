'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Announcement {
  id: number;
  title: string;
  content?: string;
  created_by_name?: string;
}

export default function AnnouncementWidget() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const today = new Date().toISOString().split('T')[0];

  // 오늘의 조례사항 조회
  const fetchTodayAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/todos/announcements/date/${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error('조례사항 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 사용자 정보 확인
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
      
      // 원장만 조례사항 조회
      if (userData.role === 'director') {
        fetchTodayAnnouncements();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // 원장이 아니면 위젯을 보여주지 않음
  if (!user || user.role !== 'director') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📢</span>
          <h3 className="text-lg font-semibold">오늘의 조례사항</h3>
        </div>
        <Link 
          href="/dashboard/todolist"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          전체보기 →
        </Link>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">오늘의 조례사항이 없습니다</div>
            <Link 
              href="/dashboard/todolist"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              조례사항을 추가해보세요
            </Link>
          </div>
        ) : (
          announcements.slice(0, 3).map((announcement) => (
            <div 
              key={announcement.id} 
              className="p-4 border border-gray-200 rounded-lg bg-purple-50"
            >
              <div className="font-medium text-gray-900 mb-2">
                {announcement.title}
              </div>
              
              {announcement.content && (
                <div className="text-sm text-gray-600 mb-2">
                  {announcement.content.length > 100 
                    ? announcement.content.substring(0, 100) + '...'
                    : announcement.content
                  }
                </div>
              )}
              
              {announcement.created_by_name && (
                <div className="text-xs text-purple-600">
                  작성자: {announcement.created_by_name}
                </div>
              )}
            </div>
          ))
        )}
        
        {announcements.length > 3 && (
          <div className="text-center pt-2">
            <Link 
              href="/dashboard/todolist"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              +{announcements.length - 3}개 더 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 