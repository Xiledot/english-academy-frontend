'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: MenuItem[];
  roles: string[];
}

interface SidebarProps {
  userRole: string;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();

  // 컴포넌트 마운트 시 localStorage에서 메뉴 상태 복원
  useEffect(() => {
    // 항상 모든 메뉴가 열려있도록 설정
    const allMenus = ['learning', 'materials', 'students', 'tests', 'work', 'communication'];
    console.log('모든 메뉴 열기:', allMenus);
    setExpandedMenus(allMenus);
    localStorage.setItem('expandedMenus', JSON.stringify(allMenus));
  }, []);

  // 메뉴 상태 변경 시에도 항상 모든 메뉴가 열린 상태 유지
  useEffect(() => {
    const allMenus = ['learning', 'materials', 'students', 'tests', 'work', 'communication'];
    localStorage.setItem('expandedMenus', JSON.stringify(allMenus));
  }, [expandedMenus]);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: '대시보드',
      icon: '🏠',
      href: '/dashboard',
      roles: ['director', 'teacher', 'assistant', 'vice_director'],
    },
    {
      id: 'learning',
      label: '학습 관리',
      icon: '📚',
      roles: ['director', 'teacher', 'assistant', 'vice_director'],
      children: [
        { id: 'timetable', label: '시간표 관리', icon: '📅', href: '/dashboard/timetable', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'attendance', label: '출석부 관리', icon: '✅', href: '/dashboard/attendance', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'grades', label: '학생 성적 관리', icon: '📊', href: '/dashboard/grades', roles: ['director', 'teacher', 'vice_director'] },
        { id: 'goals', label: '학생 목표/대학', icon: '🎯', href: '/dashboard/goals', roles: ['director', 'teacher', 'vice_director'] },
        { id: 'roadmap', label: '학생 로드맵', icon: '🗺️', href: '/dashboard/roadmap', roles: ['director', 'teacher', 'vice_director'] },
        { id: 'exam-scope', label: '학교 시험 범위', icon: '📖', href: '/dashboard/exam-scope', roles: ['director', 'teacher', 'vice_director'] },
      ]
    },
    {
      id: 'materials',
      label: '내신 자료 제작',
      icon: '📝',
      roles: ['director', 'teacher', 'vice_director'],
      children: [
        { id: 'passages', label: '지문 라이브러리', icon: '📄', href: '/dashboard/passages', roles: ['director', 'teacher', 'vice_director'] },
        { id: 'vocabulary', label: '단어 라이브러리', icon: '📚', href: '/dashboard/vocabulary', roles: ['director', 'teacher', 'vice_director'] },
      ]
    },
    {
      id: 'students',
      label: '학생/상담 관리',
      icon: '👥',
      roles: ['director', 'teacher', 'assistant', 'vice_director'],
      children: [
        { id: 'student-info', label: '학생 정보 관리', icon: '👤', href: '/dashboard/students', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'inquiries', label: '유입 DB 관리', icon: '📥', href: '/dashboard/inquiries', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'counseling', label: '상담 DB 관리', icon: '📞', href: '/dashboard/consultations', roles: ['director', 'teacher', 'vice_director'] },
        { id: 'withdrawals', label: '퇴원 DB 관리', icon: '📤', href: '/dashboard/withdrawals', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'authentication', label: '학생 인증 관리', icon: '🔐', href: '/dashboard/authentication', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
      ]
    },
    {
      id: 'tests',
      label: '테스트 관리',
      icon: '🧠',
      roles: ['director', 'teacher', 'vice_director'],
      children: [
        { id: 'vocabulary-test', label: '단어 테스트', icon: '📝', href: '/dashboard/vocabulary-test', roles: ['director', 'teacher', 'vice_director'] },
      ]
    },
    {
      id: 'work',
      label: '업무 관리',
      icon: '📋',
      roles: ['director', 'assistant', 'vice_director'],
      children: [
        { id: 'assistant-work', label: '조교 업무 목록', icon: '📋', href: '/dashboard/assistant-work', roles: ['director', 'assistant', 'vice_director'] },
        { id: 'attendance', label: '출석부 관리', icon: '✅', href: '/dashboard/attendance', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
      ]
    },
    {
      id: 'analysis',
      label: '분석/통계',
      icon: '📊',
      href: '/dashboard/analysis',
      roles: ['director', 'vice_director'],
    },
    {
      id: 'communication',
      label: '소통',
      icon: '💬',
      roles: ['director', 'teacher', 'assistant', 'vice_director'],
      children: [
        { id: 'messages', label: '메시지', icon: '💬', href: '/dashboard/messages', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'todolist', label: '투두리스트', icon: '📝', href: '/dashboard/todolist', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
        { id: 'calendar', label: '캘린더', icon: '📅', href: '/dashboard/calendar', roles: ['director', 'teacher', 'assistant', 'vice_director'] },
      ]
    },
    {
      id: 'system',
      label: '시스템 관리',
      icon: '⚙️',
      href: '/dashboard/system',
      roles: ['director'],
    },
  ];

  const toggleMenu = (menuId: string) => {
    // 메뉴 토글 비활성화 - 항상 모든 메뉴가 열린 상태 유지
    console.log('메뉴 토글 시도 (비활성화됨):', menuId);
    return;
  };

  const hasAccess = (roles: string[]) => {
    return roles.includes(userRole);
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!hasAccess(item.roles)) return null;

    const isExpanded = expandedMenus.includes(item.id);
    const isActive = pathname === item.href;

    return (
      <div key={item.id}>
        {item.children ? (
          // 하위 메뉴가 있는 경우
          <div
            className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => toggleMenu(item.id)}
          >
            <div className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        ) : (
          // 링크가 있는 경우
          <Link
            href={item.href || '#'}
            className={`flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-3">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </Link>
        )}
        
        {item.children && isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {item.children
              .filter(child => hasAccess(child.roles))
              .map(child => (
                <Link
                  key={child.id}
                  href={child.href || '#'}
                  className={`block px-4 py-2 text-sm rounded-md transition-colors ${
                    pathname === child.href
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {child.label}
                </Link>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-56 bg-white shadow-lg h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          메뉴
        </h2>
        <nav className="space-y-1">
          {menuItems.map(renderMenuItem)}
        </nav>
      </div>
    </div>
  );
} 