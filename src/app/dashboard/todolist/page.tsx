'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { v4 as uuidv4 } from 'uuid';
import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from '@/lib/api';

interface TodoItem {
  id?: number;
  user_id: number;
  target_date: string;
  title: string;
  description?: string;
  is_completed: boolean;
  priority: '높음' | '보통' | '낮음';
  sent_by?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  sent_by_name?: string;
  isNew?: boolean;
  tempId?: string;
}

interface Announcement {
  id?: number;
  target_date: string;
  title: string;
  content?: string;
  created_by: number;
  created_at?: string;
  updated_at?: string;
  created_by_name?: string;
  isNew?: boolean;
  tempId?: string;
}

interface PersonalMemo {
  id?: number;
  user_id: number;
  target_date: string;
  content: string;
  updated_at?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function TodoListPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [memo, setMemo] = useState<PersonalMemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTodoForSend, setSelectedTodoForSend] = useState<TodoItem | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false); // 중복 저장 방지
  const router = useRouter();

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return 'bg-red-100 text-red-800 border-red-200';
      case '보통': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '낮음': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 투두 목록 조회
  const fetchTodos = async () => {
    try {
      console.log('투두 조회 시도:', selectedDate);
      
      const response = await apiGet(`/api/todos/date/${selectedDate}`);

      console.log('투두 조회 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('조회된 투두 목록:', data);
        setTodos(data);
      } else {
        const errorText = await response.text();
        console.error('투두 조회 실패:', response.status, errorText);
      }
    } catch (error) {
      console.error('투두 조회 오류:', error);
    }
  };

  // 조례사항 조회 (원장만)
  const fetchAnnouncements = async () => {
    if (user?.role !== 'director') return;

    try {
      console.log('조례사항 조회 시도:', selectedDate);
      
      const response = await apiGet(`/api/todos/announcements/date/${selectedDate}`);

      console.log('조례사항 조회 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('조회된 조례사항 목록:', data);
        setAnnouncements(data);
      } else {
        const errorText = await response.text();
        console.error('조례사항 조회 실패:', response.status, errorText);
      }
    } catch (error) {
      console.error('조례사항 조회 오류:', error);
    }
  };

  // 메모 조회
  const fetchMemo = async () => {
    try {
      const response = await apiGet(`/api/todos/memo/date/${selectedDate}`);

      if (response.ok) {
        const data = await response.json();
        setMemo(data);
      } else {
        setMemo(null);
      }
    } catch (error) {
      console.error('메모 조회 오류:', error);
    }
  };

  // 사용자 목록 조회 (원장/부원장만)
  const fetchUsers = async () => {
    if (user?.role !== 'director' && user?.role !== 'vice_director') return;

    try {
      const response = await apiGet('/api/todos/users');

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
    }
  };

  // 새 투두 추가
  const addNewTodo = () => {
    const newTodo: TodoItem = {
      tempId: uuidv4(),
      user_id: user!.id,
      target_date: selectedDate,
      title: '',
      description: '',
      is_completed: false,
      priority: '보통',
      isNew: true
    };

    setTodos(prev => [newTodo, ...prev]);
    
    // 새 투두 입력 필드에 포커스
    setTimeout(() => {
      const newInput = document.querySelector(`input[data-todo-id="${newTodo.tempId}"]`) as HTMLInputElement;
      if (newInput) {
        newInput.focus();
      }
    }, 100);
  };

  // 투두 저장
  const saveTodo = async (todo: TodoItem) => {
    // 중복 호출 방지
    if (isSaving) {
      console.log('이미 저장 중입니다. 중복 호출 방지');
      return;
    }

    // 제목이 비어있으면 삭제 처리
    if (!todo.title.trim()) {
      if (todo.isNew) {
        setTodos(prev => prev.filter(t => t.tempId !== todo.tempId));
      }
      return;
    }

    setIsSaving(true);
    console.log('투두 저장 시도:', todo);

    try {
      if (todo.isNew) {
        const { tempId, isNew, ...todoData } = todo;
        console.log('새 투두 저장 데이터:', todoData);
        
        const response = await apiPost('/api/todos', todoData);

        console.log('새 투두 저장 응답 상태:', response.status);
        
        if (response.ok) {
          const savedTodo = await response.json();
          console.log('저장된 투두:', savedTodo);
          setTodos(prev => prev.map(t => 
            t.tempId === todo.tempId ? savedTodo : t
          ));
        } else {
          const errorText = await response.text();
          console.error('투두 저장 실패:', response.status, errorText);
        }
      } else {
        const { isNew, tempId, ...todoData } = todo;
        console.log('기존 투두 업데이트 데이터:', todoData);
        
        const response = await apiPut(`/api/todos/${todo.id}`, todoData);

        console.log('기존 투두 업데이트 응답 상태:', response.status);

        if (response.ok) {
          const updatedTodo = await response.json();
          console.log('업데이트된 투두:', updatedTodo);
          setTodos(prev => prev.map(t => 
            t.id === todo.id ? updatedTodo : t
          ));
        } else {
          const errorText = await response.text();
          console.error('투두 업데이트 실패:', response.status, errorText);
        }
      }
    } catch (error) {
      console.error('투두 저장 오류:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 투두 상태 토글
  const toggleTodoStatus = async (todoId: number) => {
    try {
      const response = await apiPatch(`/api/todos/${todoId}/toggle`);

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

  // 투두 삭제
  const deleteTodo = async (todo: TodoItem) => {
    if (!confirm('정말로 이 투두를 삭제하시겠습니까?')) return;

    try {
      if (todo.isNew) {
        setTodos(prev => prev.filter(t => t.tempId !== todo.tempId));
        return;
      }

      const response = await apiDelete(`/api/todos/${todo.id}`);

      if (response.ok) {
        setTodos(prev => prev.filter(t => t.id !== todo.id));
      }
    } catch (error) {
      console.error('투두 삭제 오류:', error);
    }
  };

  // 새 조례사항 추가 (원장만)
  const addNewAnnouncement = () => {
    const newAnnouncement: Announcement = {
      tempId: uuidv4(),
      target_date: selectedDate,
      title: '',
      content: '',
      created_by: user!.id,
      isNew: true
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  // 조례사항 저장
  const saveAnnouncement = async (announcement: Announcement) => {
    // 제목이 비어있으면 삭제 처리
    if (!announcement.title.trim()) {
      if (announcement.isNew) {
        setAnnouncements(prev => prev.filter(a => a.tempId !== announcement.tempId));
      }
      return;
    }

    console.log('조례사항 저장 시도:', announcement);

    try {
      
      
      if (announcement.isNew) {
        const { tempId, isNew, ...announcementData } = announcement;
        console.log('새 조례사항 저장 데이터:', announcementData);
        
        const response = await apiPost('/api/todos/announcements', announcementData);

        console.log('새 조례사항 저장 응답 상태:', response.status);

        if (response.ok) {
          const savedAnnouncement = await response.json();
          console.log('저장된 조례사항:', savedAnnouncement);
          setAnnouncements(prev => prev.map(a => 
            a.tempId === announcement.tempId ? savedAnnouncement : a
          ));
        } else {
          const errorText = await response.text();
          console.error('조례사항 저장 실패:', response.status, errorText);
        }
      } else {
        const { isNew, tempId, ...announcementData } = announcement;
        console.log('기존 조례사항 업데이트 데이터:', announcementData);
        
        const response = await apiPut(`/api/todos/announcements/${announcement.id}`, announcementData);

        console.log('기존 조례사항 업데이트 응답 상태:', response.status);

        if (response.ok) {
          const updatedAnnouncement = await response.json();
          console.log('업데이트된 조례사항:', updatedAnnouncement);
          setAnnouncements(prev => prev.map(a => 
            a.id === announcement.id ? updatedAnnouncement : a
          ));
        } else {
          const errorText = await response.text();
          console.error('조례사항 업데이트 실패:', response.status, errorText);
        }
      }
    } catch (error) {
      console.error('조례사항 저장 오류:', error);
    }
  };

  // 조례사항 삭제
  const deleteAnnouncement = async (announcement: Announcement) => {
    if (!confirm('정말로 이 조례사항을 삭제하시겠습니까?')) return;

    try {
      if (announcement.isNew) {
        setAnnouncements(prev => prev.filter(a => a.tempId !== announcement.tempId));
        return;
      }

      const response = await apiDelete(`/api/todos/announcements/${announcement.id}`);

      if (response.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
      }
    } catch (error) {
      console.error('조례사항 삭제 오류:', error);
    }
  };

  // 메모 저장
  const saveMemo = async (content: string) => {
    try {
      const response = await apiPut(`/api/todos/memo/date/${selectedDate}`, { content });

      if (response.ok) {
        const savedMemo = await response.json();
        setMemo(savedMemo);
      }
    } catch (error) {
      console.error('메모 저장 오류:', error);
    }
  };

  // 투두 전송 모달 열기
  const openSendModal = (todo: TodoItem) => {
    setSelectedTodoForSend(todo);
    setShowSendModal(true);
  };

  // 투두 전송 (원장/부원장만)
  const sendTodo = async (toUserId: number, title: string, description: string, priority: '높음' | '보통' | '낮음') => {
    try {
      const response = await apiPost('/api/todos/send', {
        toUserId,
        targetDate: selectedDate,
        title,
        description,
        priority
      });

      if (response.ok) {
        alert('투두가 성공적으로 전송되었습니다.');
        setShowSendModal(false);
        setSelectedTodoForSend(null);
      } else {
        alert('투두 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('투두 전송 오류:', error);
      alert('투두 전송 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    

    if (!userStr) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodos();
      fetchAnnouncements();
      fetchMemo();
      fetchUsers();
      setLoading(false);
    }
  }, [user, selectedDate]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar userRole={user?.role || 'assistant'} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-lg">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user?.role || 'assistant'} />
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">투두리스트</h1>
            
            {/* 날짜 선택 */}
            <div className="flex items-end space-x-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden shadow-sm h-10">
                  <button
                    onClick={() => {
                      const currentDate = new Date(selectedDate);
                      currentDate.setDate(currentDate.getDate() - 1);
                      setSelectedDate(currentDate.toISOString().split('T')[0]);
                    }}
                    className="px-3 h-full flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border-r border-gray-300"
                    title="이전 날"
                  >
                    <span className="text-lg font-medium">‹</span>
                  </button>
                  
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 h-full text-sm border-none focus:ring-0 focus:outline-none bg-transparent min-w-[140px]"
                  />
                  
                  <button
                    onClick={() => {
                      const currentDate = new Date(selectedDate);
                      currentDate.setDate(currentDate.getDate() + 1);
                      setSelectedDate(currentDate.toISOString().split('T')[0]);
                    }}
                    className="px-3 h-full flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors border-l border-gray-300"
                    title="다음 날"
                  >
                    <span className="text-lg font-medium">›</span>
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-4 h-10 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm flex items-center"
                  title="오늘 날짜로 이동"
                >
                  오늘 날짜로 이동
                </button>
              </div>

            </div>
          </div>

          {/* 메인 콘텐츠 */}
          <div className={`grid gap-6 ${user?.role === 'director' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            
            {/* 투두리스트 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">📝 투두리스트</h2>
                  <button
                    onClick={addNewTodo}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  >
                    + 추가
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {todos.map((todo) => {
                  const identifier = todo.tempId || todo.id!;
                  
                  return (
                    <div key={identifier} className={`p-3 border rounded-lg transition-all duration-200 ${
                      todo.isNew 
                        ? 'border-blue-300 bg-blue-50' 
                        : todo.is_completed 
                          ? 'border-gray-200 bg-gray-50' 
                          : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start space-x-3">
                        {!todo.isNew && (
                          <input
                            type="checkbox"
                            checked={todo.is_completed}
                            onChange={() => toggleTodoStatus(todo.id!)}
                            className="mt-1 h-4 w-4 text-blue-600 rounded"
                          />
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            data-todo-id={todo.tempId || todo.id}
                            value={todo.title}
                            onChange={(e) => setTodos(prev => prev.map(t => 
                              (t.tempId || t.id) === identifier 
                                ? { ...t, title: e.target.value }
                                : t
                            ))}
                            onBlur={() => saveTodo(todo)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                saveTodo(todo);
                                // e.currentTarget.blur(); // 중복 저장 방지를 위해 제거
                              }
                            }}
                            className={`w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0 ${
                              todo.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                            }`}
                            placeholder="투두 제목 입력..."
                          />
                          
                          <textarea
                            value={todo.description || ''}
                            onChange={(e) => setTodos(prev => prev.map(t => 
                              (t.tempId || t.id) === identifier 
                                ? { ...t, description: e.target.value }
                                : t
                            ))}
                            onBlur={() => saveTodo(todo)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.ctrlKey) {
                                e.preventDefault();
                                saveTodo(todo);
                                e.currentTarget.blur();
                              }
                            }}
                            className={`w-full mt-1 text-xs bg-transparent border-none p-0 resize-none focus:ring-0 ${
                              todo.is_completed ? 'line-through text-gray-400' : 'text-gray-600'
                            }`}
                            placeholder="설명 (선택사항)"
                            rows={2}
                          />
                          
                          <div className="flex items-center justify-between mt-2">
                            <select
                              value={todo.priority}
                              onChange={(e) => {
                                const newTodo = { ...todo, priority: e.target.value as any };
                                setTodos(prev => prev.map(t => 
                                  (t.tempId || t.id) === identifier ? newTodo : t
                                ));
                                saveTodo(newTodo);
                              }}
                              disabled={todo.is_completed}
                              className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)} ${
                                todo.is_completed ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              <option value="높음">높음</option>
                              <option value="보통">보통</option>
                              <option value="낮음">낮음</option>
                            </select>
                            
                            {todo.sent_by_name && (
                              <span className={`text-xs ${todo.is_completed ? 'text-gray-400' : 'text-blue-600'}`}>
                                from {todo.sent_by_name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {(user?.role === 'director' || user?.role === 'vice_director') && !todo.isNew && (
                            <button
                              onClick={() => openSendModal(todo)}
                              className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              전송
                            </button>
                          )}
                          <button
                            onClick={() => deleteTodo(todo)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {todos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    투두가 없습니다.
                  </div>
                )}
              </div>
            </div>

            {/* 조례사항 섹션 (원장만) */}
            {user?.role === 'director' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">📢 조례사항</h2>
                    <button
                      onClick={addNewAnnouncement}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                    >
                      + 추가
                    </button>
                  </div>
                </div>
                
                <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                  {announcements.map((announcement) => {
                    const identifier = announcement.tempId || announcement.id!;
                    
                    return (
                      <div key={identifier} className={`p-3 border rounded-lg ${announcement.isNew ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={announcement.title}
                              onChange={(e) => setAnnouncements(prev => prev.map(a => 
                                (a.tempId || a.id) === identifier 
                                  ? { ...a, title: e.target.value }
                                  : a
                              ))}
                              onBlur={() => saveAnnouncement(announcement)}
                              className="w-full text-sm font-medium bg-transparent border-none p-0 focus:ring-0"
                              placeholder="조례사항 제목 입력..."
                            />
                            
                            <textarea
                              value={announcement.content || ''}
                              onChange={(e) => setAnnouncements(prev => prev.map(a => 
                                (a.tempId || a.id) === identifier 
                                  ? { ...a, content: e.target.value }
                                  : a
                              ))}
                              onBlur={() => saveAnnouncement(announcement)}
                              className="w-full mt-1 text-xs text-gray-600 bg-transparent border-none p-0 resize-none focus:ring-0"
                              placeholder="조례사항 내용 입력..."
                              rows={3}
                            />
                          </div>
                          
                          <button
                            onClick={() => deleteAnnouncement(announcement)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {announcements.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      조례사항이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 메모 섹션 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">📄 메모</h2>
              </div>
              
              <div className="p-4">
                <textarea
                  value={memo?.content || ''}
                  onChange={(e) => setMemo(prev => prev ? { ...prev, content: e.target.value } : {
                    user_id: user!.id,
                    target_date: selectedDate,
                    content: e.target.value
                  })}
                  onBlur={(e) => saveMemo(e.target.value)}
                  className="w-full h-80 p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="메모를 작성하세요..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 투두 전송 모달 */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">투두 전송</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              sendTodo(
                parseInt(formData.get('toUserId') as string),
                formData.get('title') as string,
                formData.get('description') as string,
                formData.get('priority') as any
              );
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">받는 사람</label>
                  <select name="toUserId" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">선택하세요</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                  <input
                    name="title"
                    type="text"
                    required
                    defaultValue={selectedTodoForSend?.title || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="투두 제목"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea
                    name="description"
                    defaultValue={selectedTodoForSend?.description || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="투두 설명 (선택사항)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                  <select 
                    name="priority" 
                    defaultValue={selectedTodoForSend?.priority || '보통'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="낮음">낮음</option>
                    <option value="보통">보통</option>
                    <option value="높음">높음</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSendModal(false);
                    setSelectedTodoForSend(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  전송
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 