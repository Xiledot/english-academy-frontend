'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { v4 as uuidv4 } from 'uuid';
import RecurringTaskModal, { RecurringTaskData } from '@/components/ui/RecurringTaskModal';
import FixedTaskModal, { FixedTaskData } from '@/components/ui/FixedTaskModal';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface Task {
  id?: number;
  title: string;
  description?: string;
  category: '고정업무' | '임시업무' | '긴급업무';
  priority: '높음' | '보통' | '낮음';
  status: '미완료' | '진행중' | '완료' | '보류';
  assigned_type: '누구나' | '전인원' | '특정조교';
  assigned_to?: number;
  assigned_name?: string;
  is_recurring: boolean;
  recurring_type?: '매일' | '매주' | '매월' | '요일별';
  recurring_days?: string[];
  due_date?: string;
  target_date: string;
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  created_by_name?: string;
  isNew?: boolean;
  editing?: boolean;
  tempId?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function AssistantWorkPage() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingField, setEditingField] = useState<{
    identifier: string | number;
    field: string;
  } | null>(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [fixedModalOpen, setFixedModalOpen] = useState(false);
  const router = useRouter();

  // 필드 편집 관련 함수들
  const isFieldEditing = (identifier: string | number, field: string) => {
    return editingField?.identifier === identifier && editingField?.field === field;
  };

  const startFieldEditing = (identifier: string | number, field: string) => {
    setEditingField({ identifier, field });
  };

  const stopFieldEditing = () => {
    setEditingField(null);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      stopFieldEditing();
    } else if (e.key === 'Escape') {
      stopFieldEditing();
    }
  };

  // 업무 업데이트
  const updateTask = (identifier: string | number, field: string, value: any) => {
    setTasks(prev => prev.map(task => {
      const taskId = task.tempId || task.id;
      if (taskId === identifier) {
        const updatedTask = { ...task, [field]: value };
        
        // 상태가 완료로 변경되면 completed_at 설정
        if (field === 'status' && value === '완료') {
          updatedTask.completed_at = new Date().toISOString();
        } else if (field === 'status' && value !== '완료') {
          updatedTask.completed_at = undefined;
        }
        
        return updatedTask;
      }
      return task;
    }));
  };

  // 업무 저장
  const saveTask = async (identifier: string | number) => {
    const task = tasks.find(t => (t.tempId || t.id) === identifier);
    if (!task) return;

    // 필수 필드 검증
    if (!task.title || !task.target_date) {
      alert('업무명과 목표 날짜는 필수입니다.');
      return;
    }

    try {
      if (task.isNew) {
        // 새 업무 생성
        const { tempId, isNew, editing, ...taskData } = task;
        const response = await apiPost('/tasks', taskData);

        if (response.ok) {
          const savedTask = await response.json();
          setTasks(prev => prev.map(t => 
            t.tempId === identifier 
              ? { ...savedTask, editing: false }
              : t
          ));
        } else {
          alert('업무 저장에 실패했습니다.');
        }
      } else {
        // 기존 업무 수정
        const { isNew, editing, tempId, ...taskData } = task;
        const response = await apiPut(`/tasks/${task.id}`, taskData);

        if (response.ok) {
          const updatedTask = await response.json();
          setTasks(prev => prev.map(t => 
            t.id === task.id 
              ? { ...updatedTask, editing: false }
              : t
          ));
        } else {
          alert('업무 수정에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('업무 저장 오류:', error);
      alert('업무 저장 중 오류가 발생했습니다.');
    }
  };

  // 업무 삭제
  const deleteTask = async (id: number | string) => {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      
      // 새로운 업무(id가 string인 경우)는 API 호출 없이 바로 삭제
      if (typeof id === 'string') {
        setTasks(prev => prev.filter(t => (t.tempId || t.id) !== id));
        return;
      }

      const response = await apiDelete(`/tasks/${id}`);

      if (response.ok) {
        setTasks(prev => prev.filter(t => t.id !== id));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 새 업무 추가
  const addNewTask = () => {
    const newTask: Task = {
      tempId: uuidv4(),
      title: '',
      description: '',
      category: '임시업무',
      priority: '보통',
      status: '미완료',
      assigned_type: '누구나',
      is_recurring: false,
      target_date: filterDate,
      isNew: true,
      editing: true
    };

    setTasks(prev => [newTask, ...prev]);
    // 새 업무의 제목 필드를 편집 모드로 설정
    setTimeout(() => {
      startFieldEditing(newTask.tempId!, 'title');
    }, 100);
  };

  // 반복 업무 생성
  const handleRecurringTaskSave = async (taskData: RecurringTaskData) => {
    try {
      const response = await apiPost('/tasks/recurring', taskData);

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        // 현재 날짜의 업무 목록 새로고침
        fetchTasks();
      } else {
        const error = await response.json();
        alert(`반복 업무 생성 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('반복 업무 생성 오류:', error);
      alert('반복 업무 생성 중 오류가 발생했습니다.');
    }
  };

  // 고정 업무 생성
  const handleFixedTaskSave = async (taskData: FixedTaskData) => {
    try {
      const response = await apiPost('/tasks/fixed', taskData);

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        // 현재 날짜의 업무 목록 새로고침
        fetchTasks();
      } else {
        const error = await response.json();
        alert(`고정 업무 생성 실패: ${error.message}`);
      }
    } catch (error) {
      console.error('고정 업무 생성 오류:', error);
      alert('고정 업무 생성 중 오류가 발생했습니다.');
    }
  };

  // 업무 목록 조회
  const fetchTasks = async () => {
    try {
      const response = await apiGet(`/tasks/date/${filterDate}`);

      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('업무 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      fetchTasks();
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    }
  }, [filterDate]);

  // 필터링된 업무 목록
  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    return true;
  });

  // 스타일 클래스
  const inputClassName = "w-full px-2 py-1 border border-gray-300 rounded text-sm";
  const selectClassName = "w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white";
  const textareaClassName = "w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none";

  // 우선순위 색상
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '높음': return 'bg-red-100 text-red-800';
      case '보통': return 'bg-yellow-100 text-yellow-800';
      case '낮음': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case '완료': return 'bg-green-100 text-green-800';
      case '진행중': return 'bg-blue-100 text-blue-800';
      case '보류': return 'bg-orange-100 text-orange-800';
      case '미완료': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 카테고리 색상
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '고정업무': return 'bg-purple-100 text-purple-800';
      case '긴급업무': return 'bg-red-100 text-red-800';
      case '임시업무': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">조교 업무 목록</h1>
            
            {/* 필터 및 컨트롤 */}
            <div className="flex flex-wrap gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="all">전체</option>
                  <option value="미완료">미완료</option>
                  <option value="진행중">진행중</option>
                  <option value="완료">완료</option>
                  <option value="보류">보류</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <option value="all">전체</option>
                  <option value="고정업무">고정업무</option>
                  <option value="임시업무">임시업무</option>
                  <option value="긴급업무">긴급업무</option>
                </select>
              </div>

              <div className="flex items-end space-x-2">
                <button
                  onClick={addNewTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  + 새 업무 추가
                </button>
                <button
                  onClick={() => setRecurringModalOpen(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  🔄 반복 업무 추가
                </button>
                <button
                  onClick={() => setFixedModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  📌 고정 업무 추가
                </button>
              </div>
            </div>
          </div>

          {/* 업무 테이블 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업무명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">우선순위</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마감일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => {
                  const identifier = task.tempId || task.id!;
                  
                  return (
                    <tr key={identifier} className={task.isNew ? 'bg-blue-50' : ''}>
                      {/* 상태 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'status') ? (
                          <select
                            value={task.status}
                            onChange={(e) => updateTask(identifier, 'status', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={selectClassName}
                            autoFocus
                          >
                            <option value="미완료">미완료</option>
                            <option value="진행중">진행중</option>
                            <option value="완료">완료</option>
                            <option value="보류">보류</option>
                          </select>
                        ) : (
                          <span 
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${getStatusColor(task.status)}`}
                            onClick={() => startFieldEditing(identifier, 'status')}
                          >
                            {task.status}
                          </span>
                        )}
                      </td>

                      {/* 업무명 */}
                      <td className="px-4 py-3">
                        {isFieldEditing(identifier, 'title') ? (
                          <input
                            type="text"
                            value={task.title}
                            onChange={(e) => updateTask(identifier, 'title', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={inputClassName}
                            placeholder="업무명 입력"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => startFieldEditing(identifier, 'title')}
                          >
                            {task.title || '클릭하여 입력'}
                          </div>
                        )}
                      </td>

                      {/* 설명 */}
                      <td className="px-4 py-3">
                        {isFieldEditing(identifier, 'description') ? (
                          <textarea
                            value={task.description || ''}
                            onChange={(e) => updateTask(identifier, 'description', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={textareaClassName}
                            placeholder="설명 입력"
                            rows={2}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => startFieldEditing(identifier, 'description')}
                          >
                            {task.description 
                              ? task.description.length > 50 
                                ? task.description.substring(0, 50) + '...'
                                : task.description
                              : '클릭하여 입력'
                            }
                          </div>
                        )}
                      </td>

                      {/* 카테고리 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'category') ? (
                          <select
                            value={task.category}
                            onChange={(e) => updateTask(identifier, 'category', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={selectClassName}
                            autoFocus
                          >
                            <option value="고정업무">고정업무</option>
                            <option value="임시업무">임시업무</option>
                            <option value="긴급업무">긴급업무</option>
                          </select>
                        ) : (
                          <span 
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${getCategoryColor(task.category)}`}
                            onClick={() => startFieldEditing(identifier, 'category')}
                          >
                            {task.category}
                          </span>
                        )}
                      </td>

                      {/* 우선순위 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'priority') ? (
                          <select
                            value={task.priority}
                            onChange={(e) => updateTask(identifier, 'priority', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={selectClassName}
                            autoFocus
                          >
                            <option value="높음">높음</option>
                            <option value="보통">보통</option>
                            <option value="낮음">낮음</option>
                          </select>
                        ) : (
                          <span 
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${getPriorityColor(task.priority)}`}
                            onClick={() => startFieldEditing(identifier, 'priority')}
                          >
                            {task.priority}
                          </span>
                        )}
                      </td>

                      {/* 담당자 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'assigned_type') ? (
                          <select
                            value={task.assigned_type}
                            onChange={(e) => updateTask(identifier, 'assigned_type', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={selectClassName}
                            autoFocus
                          >
                            <option value="누구나">누구나</option>
                            <option value="전인원">전인원</option>
                            <option value="특정조교">특정조교</option>
                          </select>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-sm"
                            onClick={() => startFieldEditing(identifier, 'assigned_type')}
                          >
                            {task.assigned_type}
                            {task.assigned_name && ` (${task.assigned_name})`}
                          </div>
                        )}
                      </td>

                      {/* 마감일 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'due_date') ? (
                          <input
                            type="date"
                            value={task.due_date || ''}
                            onChange={(e) => updateTask(identifier, 'due_date', e.target.value)}
                            onKeyDown={handleFieldKeyDown}
                            onBlur={() => {
                              stopFieldEditing();
                              saveTask(identifier);
                            }}
                            className={inputClassName}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-sm"
                            onClick={() => startFieldEditing(identifier, 'due_date')}
                          >
                            {task.due_date 
                              ? new Date(task.due_date).toLocaleDateString()
                              : '클릭하여 설정'
                            }
                          </div>
                        )}
                      </td>

                      {/* 작업 (삭제 버튼) */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteTask(identifier)}
                          className="text-red-600 hover:text-red-900 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          title="삭제"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTasks.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                해당 날짜에 업무가 없습니다.
              </div>
            )}
          </div>

          {/* 도움말 */}
          {tasks.some(task => task.editing) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-blue-800">💡 사용법</span>
              </div>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• 필수 필드(업무명, 목표날짜)를 입력하면 자동으로 저장됩니다</li>
                <li>• Enter: 저장, Esc: 취소</li>
                <li>• 상태, 카테고리, 우선순위는 태그를 클릭하여 변경 가능합니다</li>
                <li>• 새 업무는 파란색 배경으로 표시됩니다</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* 반복 업무 모달 */}
      <RecurringTaskModal
        isOpen={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        onSave={handleRecurringTaskSave}
      />

      {/* 고정 업무 모달 */}
      <FixedTaskModal
        isOpen={fixedModalOpen}
        onClose={() => setFixedModalOpen(false)}
        onSave={handleFixedTaskSave}
      />
    </div>
  );
} 