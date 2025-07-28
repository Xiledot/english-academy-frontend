'use client';

import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';

interface AttendanceType {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AttendanceSession {
  id: number;
  type_id: number;
  type_name?: string;
  type_color?: string;
  session_name: string;
  day_of_week?: string; // 요일 기반으로 변경
  start_time?: string;
  end_time?: string;
  teacher_name?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

export default function AttendancePage() {
  const [attendanceTypes, setAttendanceTypes] = useState<AttendanceType[]>([]);
  const [recentSessions, setRecentSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#3B82F6');

  useEffect(() => {
    fetchAttendanceTypes();
    fetchRecentSessions();
  }, []);

  const fetchAttendanceTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/types', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAttendanceTypes(data);
      }
    } catch (error) {
      console.error('출석부 유형 조회 오류:', error);
    }
  };

  const fetchRecentSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentSessions(data.slice(0, 5)); // 최근 5개만
      }
    } catch (error) {
      console.error('최근 세션 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAttendanceType = async () => {
    if (!newTypeName.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/attendance/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTypeName.trim(),
          description: newTypeDescription.trim() || undefined,
          color: newTypeColor,
        }),
      });

      if (response.ok) {
        setNewTypeName('');
        setNewTypeDescription('');
        setNewTypeColor('#3B82F6');
        setShowNewTypeForm(false);
        fetchAttendanceTypes();
      }
    } catch (error) {
      console.error('출석부 유형 생성 오류:', error);
    }
  };

  const deleteAttendanceType = async (id: number) => {
    if (!confirm('이 출석부 유형을 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/attendance/types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchAttendanceTypes();
      }
    } catch (error) {
      console.error('출석부 유형 삭제 오류:', error);
    }
  };

  const handleTypeClick = (typeId: number) => {
    window.location.href = `/dashboard/attendance/${typeId}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar userRole="director" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar userRole="director" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">출석부 관리</h1>
            <button
              onClick={() => setShowNewTypeForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 새 출석부 유형 추가
            </button>
          </div>

          {/* 새 출석부 유형 추가 폼 */}
          {showNewTypeForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
              <h2 className="text-xl font-semibold mb-4">새 출석부 유형 추가</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    유형명 *
                  </label>
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 교시제, 자율자습 등"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    설명
                  </label>
                  <input
                    type="text"
                    value={newTypeDescription}
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="출석부 유형 설명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    색상
                  </label>
                  <input
                    type="color"
                    value={newTypeColor}
                    onChange={(e) => setNewTypeColor(e.target.value)}
                    className="w-full h-10 p-1 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createAttendanceType}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowNewTypeForm(false);
                    setNewTypeName('');
                    setNewTypeDescription('');
                    setNewTypeColor('#3B82F6');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 출석부 유형 목록 */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">출석부 유형</h2>
            <div className="space-y-3">
              {attendanceTypes.map((type) => (
                <div
                  key={type.id}
                  onClick={() => handleTypeClick(type.id)}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ borderLeftColor: type.color }}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                        {type.description && (
                          <p className="text-gray-600 text-sm mt-1">{type.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAttendanceType(type.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="삭제"
                      >
                        🗑️
                      </button>
                      <div className="text-blue-600 text-sm">
                        클릭하여 관리 →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {attendanceTypes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📋</div>
                <p className="text-lg">등록된 출석부 유형이 없습니다.</p>
                <p className="text-sm">새 출석부 유형을 추가해보세요!</p>
              </div>
            )}
          </div>

          {/* 최근 출석부 세션 */}
          {recentSessions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">최근 출석부 세션</h2>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-lg shadow-md p-4 border-l-4"
                    style={{ borderLeftColor: session.type_color }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: session.type_color }}
                          >
                            {session.type_name}
                          </span>
                          <h3 className="text-lg font-medium">{session.session_name}</h3>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>📅 {session.day_of_week || '매주'}</span>
                          {session.start_time && <span>🕐 {session.start_time}</span>}
                          {session.teacher_name && <span>👨‍🏫 {session.teacher_name}</span>}
                          <span>👥 {session.student_count || 0}명</span>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = `/dashboard/attendance/session/${session.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        관리 →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 