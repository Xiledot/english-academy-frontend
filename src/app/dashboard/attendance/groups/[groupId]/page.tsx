'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

interface AttendanceSession {
  id: number;
  group_id: number;
  name: string;
  school_name?: string;
  session_date?: string;
  start_time?: string;
  end_time?: string;
  teacher_name?: string;
  notes?: string;
  created_by?: number;
  created_at: string;
  group_name?: string;
  category_name?: string;
  student_count?: number;
}

export default function GroupPage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newSession, setNewSession] = useState({
    name: '',
    school_name: '',
    session_date: '',
    start_time: '',
    end_time: '',
    teacher_name: '',
    notes: ''
  });
  
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const groupId = params.groupId as string;
  const groupName = searchParams.get('name') || '그룹';

  useEffect(() => {
    if (groupId) {
      fetchSessions();
    }
  }, [groupId]);

  const fetchSessions = async () => {
    try {
      const response = await apiGet(`/api/newAttendance/groups/${groupId}/sessions`);
      if (response.ok) {
        const sessionsData = await response.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('세션 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSession.name.trim()) {
      alert('세션명을 입력해주세요.');
      return;
    }

    try {
      const sessionData = {
        ...newSession,
        group_id: parseInt(groupId),
        session_date: newSession.session_date || null,
        start_time: newSession.start_time || null,
        end_time: newSession.end_time || null,
        teacher_name: newSession.teacher_name || null,
        notes: newSession.notes || null,
        school_name: newSession.school_name || null
      };

      const response = await apiPost('/api/newAttendance/sessions', sessionData);
      if (response.ok) {
        setNewSession({
          name: '',
          school_name: '',
          session_date: '',
          start_time: '',
          end_time: '',
          teacher_name: '',
          notes: ''
        });
        setShowNewSessionForm(false);
        fetchSessions();
      } else {
        alert('세션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 생성 오류:', error);
      alert('세션 생성 중 오류가 발생했습니다.');
    }
  };

  const deleteSession = async (sessionId: number) => {
    if (!confirm('이 세션을 삭제하시겠습니까? 관련된 모든 출석 데이터가 함께 삭제됩니다.')) {
      return;
    }

    try {
      const response = await apiDelete(`/api/newAttendance/sessions/${sessionId}`);
      if (response.ok) {
        fetchSessions();
      } else {
        alert('세션 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 삭제 오류:', error);
      alert('세션 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSessionClick = (sessionId: number, sessionName: string) => {
    router.push(`/dashboard/attendance/sessions/${sessionId}?name=${encodeURIComponent(sessionName)}`);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // HH:MM 형식으로 표시
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar userRole="director" />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">세션 데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole="director" />
      <div className="flex-1 p-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{groupName}</h1>
              <p className="text-gray-600">세션 관리</p>
            </div>
          </div>
          <button
            onClick={() => setShowNewSessionForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 새 세션 추가
          </button>
        </div>

        {/* 새 세션 추가 폼 */}
        {showNewSessionForm && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">새 세션 추가</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  세션명 *
                </label>
                <input
                  type="text"
                  value={newSession.name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="예: 고등학교A 중간고사"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학교명
                </label>
                <input
                  type="text"
                  value={newSession.school_name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, school_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="학교명 (예비고사용)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시험일
                </label>
                <input
                  type="date"
                  value={newSession.session_date}
                  onChange={(e) => setNewSession(prev => ({ ...prev, session_date: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작시간
                </label>
                <input
                  type="time"
                  value={newSession.start_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료시간
                </label>
                <input
                  type="time"
                  value={newSession.end_time}
                  onChange={(e) => setNewSession(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  담당교사
                </label>
                <input
                  type="text"
                  value={newSession.teacher_name}
                  onChange={(e) => setNewSession(prev => ({ ...prev, teacher_name: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="담당교사명"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비고
              </label>
              <textarea
                value={newSession.notes}
                onChange={(e) => setNewSession(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="추가 정보나 특이사항"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={createSession}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowNewSessionForm(false);
                  setNewSession({
                    name: '',
                    school_name: '',
                    session_date: '',
                    start_time: '',
                    end_time: '',
                    teacher_name: '',
                    notes: ''
                  });
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* 세션 목록 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">세션 목록</h2>
            {sessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {session.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSessionClick(session.id, session.name)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="출석 관리"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      {session.school_name && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          {session.school_name}
                        </div>
                      )}
                      {session.session_date && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(session.session_date)}
                        </div>
                      )}
                      {(session.start_time || session.end_time) && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </div>
                      )}
                      {session.teacher_name && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {session.teacher_name}
                        </div>
                      )}
                      <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-100">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(session.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">세션이 없습니다</p>
                <p className="text-sm mt-1">새 세션을 추가해보세요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 