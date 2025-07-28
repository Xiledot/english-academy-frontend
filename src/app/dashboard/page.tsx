'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TodayStudentsWidget from '@/components/widgets/TimetableWidget';
import QuickActionsWidget from '@/components/widgets/QuickActionsWidget';
import NotificationsWidget from '@/components/widgets/NotificationsWidget';
import TodoListWidget from '@/components/widgets/TodoListWidget';
import AnnouncementWidget from '@/components/widgets/AnnouncementWidget';
import UpcomingEventsWidget from '@/components/widgets/UpcomingEventsWidget';

interface User {
  id: number;
  name: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'director': return '원장';
      case 'teacher': return '강사';
      case 'assistant': return '조교';
      case 'vice_director': return '부원장';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <Sidebar userRole={user.role} />
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  영어 학원 관리 시스템
                </h1>
                <p className="text-sm text-gray-600">
                  {getRoleLabel(user.role)} {user.name}님 환영합니다
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                로그아웃
              </button>
            </div>
          </div>
        </header>

        {/* 위젯 대시보드 */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* 환영 메시지 */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                안녕하세요, {user.name}님! 👋
              </h2>
              <p className="text-gray-600">
                오늘도 영어 학원 관리를 효율적으로 해보세요.
              </p>
            </div>

            {/* 위젯 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 첫 번째 행 */}
              <div className="md:col-span-2">
                <TodayStudentsWidget />
              </div>
              <div className="row-span-3">
                <TodoListWidget />
              </div>

              {/* 두 번째 행 */}
              <div>
                <QuickActionsWidget />
              </div>
              <div>
                <AnnouncementWidget />
              </div>

              {/* 세 번째 행 */}
              <div className="md:col-span-2">
                <UpcomingEventsWidget />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 