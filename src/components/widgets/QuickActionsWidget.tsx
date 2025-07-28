'use client';

import Link from 'next/link';
import Widget from './Widget';

interface QuickAction {
  id: string;
  label: string;
  icon: string;
  href: string;
  color: string;
}

export default function QuickActionsWidget() {
  const quickActions: QuickAction[] = [
    {
      id: 'add-student',
      label: '학생 추가',
      icon: '👤',
      href: '/dashboard/students/add',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'add-timetable',
      label: '시간표 추가',
      icon: '📅',
      href: '/dashboard/timetable',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'add-counseling',
      label: '상담 기록',
      icon: '📞',
      href: '/dashboard/counseling/add',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'add-grade',
      label: '성적 입력',
      icon: '📊',
      href: '/dashboard/grades/add',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      id: 'add-test',
      label: '시험 추가',
      icon: '📝',
      href: '/dashboard/vocabulary-test/add',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'add-material',
      label: '자료 추가',
      icon: '📚',
      href: '/dashboard/passages/add',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  return (
    <Widget 
      title="빠른 액션" 
      icon="⚡"
    >
      <div className="grid grid-cols-2 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            className={`${action.color} text-white text-center py-3 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex flex-col items-center space-y-1`}
          >
            <span className="text-lg">{action.icon}</span>
            <span>{action.label}</span>
          </Link>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Link 
            href="/dashboard/attendance" 
            className="text-center py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            출석부
          </Link>
          <Link 
            href="/dashboard/messages" 
            className="text-center py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            메시지
          </Link>
          <Link 
            href="/dashboard/analysis" 
            className="text-center py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
          >
            통계
          </Link>
        </div>
      </div>
    </Widget>
  );
} 