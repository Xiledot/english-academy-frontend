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

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊', href: '/dashboard', roles: ['director', 'teacher', 'vice_director', 'assistant'] },
    { id: 'students', label: '학생 관리', icon: '👥', href: '/dashboard/students', roles: ['director', 'teacher', 'vice_director'] },
    { id: 'timetable', label: '시간표 관리', icon: '📅', href: '/dashboard/timetable', roles: ['director', 'teacher', 'vice_director'] },
    { id: 'inquiries', label: '유입 DB', icon: '📝', href: '/dashboard/inquiries', roles: ['director', 'vice_director'] },
    { id: 'consultations', label: '상담 DB', icon: '💬', href: '/dashboard/consultations', roles: ['director', 'vice_director'] },
    { id: 'withdrawals', label: '퇴원 DB', icon: '🚪', href: '/dashboard/withdrawals', roles: ['director', 'vice_director'] },
    { id: 'todolist', label: '투두리스트', icon: '✅', href: '/dashboard/todolist', roles: ['director', 'teacher', 'vice_director', 'assistant'] },
    { id: 'assistant-work', label: '조교 업무', icon: '📋', href: '/dashboard/assistant-work', roles: ['director', 'teacher', 'vice_director', 'assistant'] },
    { id: 'calendar', label: '캘린더', icon: '📆', href: '/dashboard/calendar', roles: ['director', 'teacher', 'vice_director', 'assistant'] },
    { id: 'attendance', label: '출석부 관리', icon: '📋', href: '/dashboard/attendance', roles: ['director', 'teacher', 'vice_director', 'assistant'] },
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