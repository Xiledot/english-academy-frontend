'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TodoItem {
  id: number;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: '높음' | '보통' | '낮음';
  sent_by_name?: string;
}

export default function TodoListWidget() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return 'bg-red-100 text-red-700';
      case '보통': return 'bg-yellow-100 text-yellow-700';
      case '낮음': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 오늘의 투두 목록 조회
  const fetchTodayTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/todos/date/${today}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error('투두 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 투두 상태 토글
  const toggleTodoStatus = async (todoId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/todos/${todoId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updatedTodo = await response.json();
        setTodos(prev => prev.map(t => 
          t.id === todoId ? updatedTodo : t
        ));
      }
    } catch (error) {
      console.error('투두 상태 토글 오류:', error);
    }
  };

  useEffect(() => {
    fetchTodayTodos();
  }, []);

  const completedCount = todos.filter(t => t.is_completed).length;
  const totalCount = todos.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3">📝</span>
          <h3 className="text-lg font-semibold">오늘의 투두리스트</h3>
        </div>
        <Link 
          href="/dashboard/todolist"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          전체보기 →
        </Link>
      </div>

      {/* 진행률 표시 */}
      {totalCount > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>진행률</span>
            <span>{completedCount}/{totalCount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* 투두 목록 */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">오늘 할 일이 없습니다</div>
            <Link 
              href="/dashboard/todolist"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              투두를 추가해보세요
            </Link>
          </div>
        ) : (
                     todos.slice(0, 6).map((todo) => (
             <div 
               key={todo.id} 
               className={`p-3 border rounded-lg transition-all duration-200 ${
                 todo.is_completed ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300'
               }`}
             >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={todo.is_completed}
                  onChange={() => toggleTodoStatus(todo.id)}
                  className="mt-1 h-4 w-4 text-blue-600 rounded cursor-pointer"
                />
                
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${
                    todo.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}>
                    {todo.title}
                  </div>
                  
                  {todo.description && (
                    <div className={`text-xs mt-1 ${
                      todo.is_completed ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {todo.description.length > 50 
                        ? todo.description.substring(0, 50) + '...'
                        : todo.description
                      }
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(todo.priority)}`}>
                      {todo.priority}
                    </span>
                    
                    {todo.sent_by_name && (
                      <span className="text-xs text-blue-600">
                        from {todo.sent_by_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        
        {todos.length > 6 && (
          <div className="text-center pt-2">
            <Link 
              href="/dashboard/todolist"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              +{todos.length - 6}개 더 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 