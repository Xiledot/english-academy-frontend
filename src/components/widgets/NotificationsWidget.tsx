'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Widget from './Widget';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
  read: boolean;
}

export default function NotificationsWidget() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.slice(0, 3)); // 최대 3개만 표시
      }
    } catch (error) {
      console.error('알림 로딩 실패:', error);
      // 임시 데이터 (실제 API가 없을 때)
      setNotifications([
        {
          id: 1,
          title: '새 학생 등록',
          message: '김영희 학생이 등록되었습니다.',
          type: 'success',
          created_at: new Date().toISOString(),
          read: false
        },
        {
          id: 2,
          title: '상담 일정',
          message: '내일 오후 2시 상담이 예정되어 있습니다.',
          type: 'info',
          created_at: new Date().toISOString(),
          read: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return '방금 전';
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    return `${Math.floor(diffInHours / 24)}일 전`;
  };

  return (
    <Widget 
      title="최근 알림" 
      icon="🔔"
      onRefresh={fetchNotifications}
      loading={loading}
    >
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`p-3 rounded-lg border-l-4 ${
                notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-400'
              }`}
            >
              <div className="flex items-start space-x-2">
                <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {formatTime(notification.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-3 pt-2 border-t border-gray-200">
            <Link 
              href="/dashboard/messages" 
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              모든 알림 보기 →
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">새로운 알림이 없습니다</p>
        </div>
      )}
    </Widget>
  );
} 