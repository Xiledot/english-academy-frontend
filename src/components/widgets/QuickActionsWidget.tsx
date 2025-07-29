'use client';

import Link from 'next/link';
import Widget from './Widget';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export default function QuickActionsWidget() {
  const quickActions: QuickAction[] = [
    {
      title: '학생 추가',
      description: '새로운 학생 정보를 등록합니다',
      icon: '👤',
      href: '/dashboard/students',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: '시간표 관리',
      description: '수업 시간표를 관리합니다',
      icon: '📅',
      href: '/dashboard/timetable',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: '투두리스트',
      description: '할 일 목록을 관리합니다',
      icon: '✅',
      href: '/dashboard/todolist',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: '캘린더',
      description: '일정을 관리합니다',
      icon: '📆',
      href: '/dashboard/calendar',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <Widget 
      title="빠른 액션" 
      icon="⚡"
    >
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={`${action.color} text-center py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center space-y-1`}
          >
            <span className="text-lg">{action.icon}</span>
            <span>{action.title}</span>
          </Link>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Link 
            href="/dashboard/attendance" 
            className="text-center py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            출석부
          </Link>
          <Link 
            href="/dashboard/assistant-work" 
            className="text-center py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            조교 업무
          </Link>
        </div>
      </div>
    </Widget>
  );
} 