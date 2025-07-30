'use client';

import { useEffect, useState } from 'react';
import Widget from './Widget';
import { apiGet } from '@/lib/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  category: string;
  priority: '높음' | '보통' | '낮음';
  status: '미완료' | '진행중' | '완료';
  assigned_type: '누구나' | '전 인원' | '특정조교';
  assigned_name?: string;
  target_date: string;
  created_by_name?: string;
  created_at?: string;
}

export default function AssistantTasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayTasks();
  }, []);

  const fetchTodayTasks = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiGet(`/api/tasks/date/${today}`);

      if (response.ok) {
        const data = await response.json();
        setTasks(data.slice(0, 5)); // 최대 5개만 표시
      }
    } catch (error) {
      console.error('조교 업무 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return 'text-red-600 bg-red-50';
      case '보통': return 'text-yellow-600 bg-yellow-50';
      case '낮음': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return 'text-green-600 bg-green-50';
      case '진행중': return 'text-blue-600 bg-blue-50';
      case '미완료': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '임시업무': return 'text-purple-600 bg-purple-50';
      case '정기업무': return 'text-blue-600 bg-blue-50';
      case '특별업무': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Widget title="오늘의 조교 업무" icon="📋">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </Widget>
    );
  }

  return (
    <Widget title="오늘의 조교 업무" icon="📋">
      <div className="space-y-3" style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            오늘 등록된 조교 업무가 없습니다.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-sm line-clamp-1">{task.title}</h4>
                <div className="flex items-center space-x-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                </div>
              </div>
              
              {task.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full font-medium ${getCategoryColor(task.category)}`}>
                    {task.category}
                  </span>
                  <span className="text-gray-500">
                    {task.assigned_type === '특정조교' && task.assigned_name 
                      ? task.assigned_name 
                      : task.assigned_type}
                  </span>
                </div>
                {task.created_by_name && (
                  <span className="text-gray-400">
                    by {task.created_by_name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        
        {tasks.length > 0 && (
          <div className="pt-3 border-t">
            <a 
              href="/dashboard/assistant-work" 
              className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              모든 조교 업무 보기 →
            </a>
          </div>
        )}
      </div>
    </Widget>
  );
} 