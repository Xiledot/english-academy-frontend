'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '../../../../components/Sidebar';
import React from 'react';

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
  session_date: string;
  start_time?: string;
  end_time?: string;
  teacher_name?: string;
  notes?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  student_count?: number;
}

interface Student {
  id: number;
  name: string;
  school: string;
  type_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export default function AttendanceTypeDetailPage() {
  const params = useParams();
  const typeId = params.typeId as string;
  
  const [attendanceType, setAttendanceType] = useState<AttendanceType | null>(null);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [showClassSelection, setShowClassSelection] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showStudentEdit, setShowStudentEdit] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{day: string, student: Student} | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newStudent, setNewStudent] = useState({ name: '', school: '' });
  const [editStudent, setEditStudent] = useState({ name: '', school: '' });

  // Google Meet Study 교시 정보
  const classSchedule = [
    { name: '1교시', time: '17:00-17:50', start_time: '17:00', end_time: '17:50' },
    { name: '2교시', time: '18:00-18:50', start_time: '18:00', end_time: '18:50' },
    { name: '3교시', time: '19:00-19:50', start_time: '19:00', end_time: '19:50' },
    { name: '4교시', time: '20:00-20:50', start_time: '20:00', end_time: '20:50' },
    { name: '5교시', time: '21:00-21:50', start_time: '21:00', end_time: '21:50' }
  ];

  const [newSession, setNewSession] = useState({
    session_name: '',
    session_date: '',
    start_time: '',
    end_time: '',
    teacher_name: '',
    notes: ''
  });

  useEffect(() => {
    if (typeId) {
      fetchAttendanceType();
      fetchSessions();
      fetchStudents();
    }
  }, [typeId]);

  const fetchAttendanceType = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/attendance/types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const type = data.find((t: AttendanceType) => t.id === parseInt(typeId));
        setAttendanceType(type);
      }
    } catch (error) {
      console.error('출석부 유형 조회 오류:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/attendance/sessions?typeId=${typeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('세션 조회 오류:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📚 학생 목록 조회 시작:', { typeId, token: token ? '토큰 있음' : '토큰 없음' });
      
      const response = await fetch(`http://localhost:3001/api/attendance/types/${typeId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('📚 학생 목록 응답:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📚 조회된 학생 수:', data.length, data);
        setStudents(data);
      } else {
        const error = await response.text();
        console.log('📚 학생 목록 조회 실패:', error);
      }
    } catch (error) {
      console.error('학생 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!newSession.session_name.trim() || !newSession.session_date) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/attendance/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type_id: parseInt(typeId),
          ...newSession,
        }),
      });

      if (response.ok) {
        setNewSession({
          session_name: '',
          session_date: '',
          start_time: '',
          end_time: '',
          teacher_name: '',
          notes: ''
        });
        setShowNewSessionForm(false);
        fetchSessions();
      }
    } catch (error) {
      console.error('세션 생성 오류:', error);
    }
  };

  const deleteSession = async (sessionId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/attendance/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchSessions();
      }
    } catch (error) {
      console.error('세션 삭제 오류:', error);
    }
  };

  const createStudent = async () => {
    if (!newStudent.name.trim()) return;

    console.log('👨‍🎓 학생 생성 시작:', { name: newStudent.name, school: newStudent.school, typeId });

    try {
      const token = localStorage.getItem('token');
      const studentData = {
        name: newStudent.name,
        school: newStudent.school,
        type_id: parseInt(typeId),
      };
      
      console.log('👨‍🎓 학생 생성 요청 데이터:', studentData);
      
      const response = await fetch('http://localhost:3001/api/attendance/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      console.log('👨‍🎓 학생 생성 응답:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('👨‍🎓 학생 생성 성공:', result);
        setNewStudent({ name: '', school: '' });
        setShowStudentForm(false);
        await fetchStudents(); // await 추가
      } else {
        const error = await response.text();
        console.log('👨‍🎓 학생 생성 실패:', error);
      }
    } catch (error) {
      console.error('학생 생성 오류:', error);
    }
  };

  const updateStudent = async () => {
    if (!editingStudent || !editStudent.name.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/attendance/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editStudent.name,
          school: editStudent.school,
        }),
      });

      if (response.ok) {
        setEditingStudent(null);
        setEditStudent({ name: '', school: '' });
        setShowStudentEdit(false);
        fetchStudents();
      }
    } catch (error) {
      console.error('학생 수정 오류:', error);
    }
  };

  const handleSessionClick = (sessionId: number) => {
    window.location.href = `/dashboard/attendance/session/${sessionId}`;
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  // 요일별로 세션을 그룹화하는 함수
  const groupSessionsByWeekday = () => {
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const grouped: { [key: string]: AttendanceSession[] } = {};
    
    weekdays.forEach(day => {
      grouped[day] = [];
    });

    sessions.forEach(session => {
      const date = new Date(session.session_date);
      const dayOfWeek = weekdays[date.getDay()];
      grouped[dayOfWeek].push(session);
    });

    return grouped;
  };

  // 특정 학생과 요일에 대한 세션 찾기
  const findSessionForStudentAndDay = (student: Student, day: string, classInfo: typeof classSchedule[0]) => {
    const groupedSessions = groupSessionsByWeekday();
    const daySessions = groupedSessions[day] || [];
    
    return daySessions.find(session => 
      session.session_name === classInfo.name &&
      session.start_time === classInfo.start_time &&
      session.notes && session.notes.includes(student.name)
    );
  };

  // 빈 칸 클릭 핸들러
  const handleEmptySlotClick = (day: string, student: Student) => {
    console.log('handleEmptySlotClick 호출됨:', { day, student });
    setSelectedSlot({ day, student });
    setShowClassSelection(true);
  };

  // 세션 칸 클릭 핸들러 (삭제)
  const handleSessionSlotClick = async (session: AttendanceSession, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`${session.session_name}을(를) 삭제하시겠습니까?`)) {
      await deleteSession(session.id);
    }
  };

  // 교시 선택 핸들러
  const handleClassSelect = async (classInfo: typeof classSchedule[0]) => {
    console.log('handleClassSelect 호출됨:', { classInfo, selectedSlot });
    if (!selectedSlot) return;

    console.log('세션 생성 정보 (요일 기반):', { 
      day: selectedSlot.day, 
      student: selectedSlot.student.name,
      class: classInfo.name 
    });

    // 중복 체크 (요일 기반)
    try {
      const token = localStorage.getItem('token');
      const checkResponse = await fetch(
        `http://localhost:3001/api/attendance/sessions/check-duplicate?typeId=${typeId}&sessionName=${classInfo.name}&dayOfWeek=${selectedSlot.day}&startTime=${classInfo.start_time}&studentName=${selectedSlot.student.name}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const checkData = await checkResponse.json();
      console.log('중복 체크 결과:', checkData);
      
      if (checkData.isDuplicate) {
        alert('이미 해당 시간에 세션이 존재합니다.');
        setShowClassSelection(false);
        setSelectedSlot(null);
        return;
      }

      // 세션 생성 (요일 기반, 날짜 없음)
      const sessionData = {
        type_id: parseInt(typeId),
        session_name: classInfo.name,
        day_of_week: selectedSlot.day, // 날짜 대신 요일 사용
        start_time: classInfo.start_time,
        end_time: classInfo.end_time,
        teacher_name: '온라인',
        notes: `${selectedSlot.student.name} - ${classInfo.name}`
      };
      
      console.log('세션 생성 요청 데이터:', sessionData);
      
      const response = await fetch('http://localhost:3001/api/attendance/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(sessionData),
      });

      console.log('세션 생성 응답:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('세션 생성 성공:', result);
        await fetchSessions(); // await 추가로 즉시 업데이트
        setShowClassSelection(false);
        setSelectedSlot(null);
      } else {
        const error = await response.text();
        console.log('세션 생성 실패:', error);
        alert('세션 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('세션 생성 오류:', error);
    }
  };

  // 학생 이름 클릭 핸들러
  const handleStudentNameClick = (student: Student) => {
    setEditingStudent(student);
    setEditStudent({ name: student.name, school: student.school });
    setShowStudentEdit(true);
  };

  // 시간표 스타일로 표시할지 결정
  const shouldShowTimetableStyle = () => {
    return attendanceType && (
      attendanceType.name === 'Google Meet Study' || 
      attendanceType.name === '교시제' || 
      attendanceType.name === '자율자습'
    );
  };

  // Google Meet Study 전용 시간표 렌더링
  const renderGoogleMeetTimetable = () => {
    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {attendanceType?.name} 시간표 관리
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            빈 칸을 클릭하여 교시를 선택하고, 기존 세션을 클릭하면 삭제됩니다.
          </p>
        </div>

        {/* 시간표 그리드 */}
        <div className="p-6">
          <div className="grid grid-cols-8 gap-2 min-h-[600px]">
            {/* 학생 열 헤더 */}
            <div className="font-semibold text-gray-700 text-center">
              학생
            </div>
            
            {/* 요일 헤더 */}
            {weekdays.map(day => (
              <div key={day} className="font-semibold text-gray-700 text-center py-2">
                {day}
              </div>
            ))}

            {/* 학생별 시간표 행들 */}
            {students.map((student, studentIndex) => (
              <React.Fragment key={studentIndex}>
                {/* 학생 이름 */}
                <div 
                  className="py-2 px-3 bg-gray-50 border rounded text-center font-medium cursor-pointer hover:bg-gray-100"
                  onClick={() => handleStudentNameClick(student)}
                >
                  <div className="text-sm font-semibold">{student.name}</div>
                  <div className="text-xs text-gray-500">{student.school}</div>
                </div>
                
                {/* 각 요일별 시간표 */}
                {weekdays.map(day => (
                  <div key={`${student.name}-${day}`} className="border border-gray-200 p-1 min-h-[80px]">
                    {/* 기존 세션들 표시 */}
                    {classSchedule.map(classInfo => {
                      const session = findSessionForStudentAndDay(student, day, classInfo);
                      
                      if (session) {
                        return (
                          <div
                            key={`${session.id}-${classInfo.name}`}
                            onClick={(e) => handleSessionSlotClick(session, e)}
                            className="text-xs p-2 mb-1 rounded cursor-pointer hover:opacity-75 transition-opacity"
                            style={{ 
                              backgroundColor: `${attendanceType?.color}20`, 
                              color: attendanceType?.color,
                              border: `1px solid ${attendanceType?.color}40`
                            }}
                          >
                            <div className="font-semibold">{session.session_name}</div>
                            <div className="text-xs opacity-75">
                              {formatTime(session.start_time)}-{formatTime(session.end_time)}
                            </div>
                          </div>
                        );
                      }
                      
                      return null;
                    })}
                    
                    {/* 빈 칸 클릭 영역 - 항상 표시 */}
                    <div
                      className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center"
                      onClick={() => {
                        console.log('빈 칸 클릭됨:', day, student.name);
                        handleEmptySlotClick(day, student);
                      }}
                    >
                      <span className="text-gray-400 text-xs">+</span>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 시간표 스타일 렌더링 (기존)
  const renderTimetableStyle = () => {
    const groupedSessions = groupSessionsByWeekday();
    const weekdays = ['월', '화', '수', '목', '금', '토', '일'];

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-50 p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {attendanceType?.name} 시간표 관리
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            학생별 수업/자습 시간을 매트릭스로 관리합니다
          </p>
        </div>

        {/* 시간표 그리드 */}
        <div className="p-6">
          <div className="grid grid-cols-8 gap-2 min-h-[600px]">
            {/* 학생 열 헤더 */}
            <div className="font-semibold text-gray-700 text-center">
              학생
            </div>
            
            {/* 요일 헤더 */}
            {weekdays.map(day => (
              <div key={day} className="font-semibold text-gray-700 text-center py-2">
                {day}
              </div>
            ))}

            {/* 학생별 시간표 행들 */}
            {students.map((student, studentIndex) => (
              <React.Fragment key={studentIndex}>
                {/* 학생 이름 */}
                <div 
                  className="py-2 px-3 bg-gray-50 border rounded text-center font-medium cursor-pointer hover:bg-gray-100"
                  onClick={() => handleStudentNameClick(student)}
                >
                  <div className="text-sm font-semibold">{student.name}</div>
                  <div className="text-xs text-gray-500">{student.school}</div>
                </div>
                
                {/* 각 요일별 시간표 */}
                {weekdays.map(day => (
                  <div key={`${student.name}-${day}`} className="border border-gray-200 p-1 min-h-[80px]">
                    {groupedSessions[day].map(session => (
                      <div
                        key={session.id}
                        onClick={() => handleSessionClick(session.id)}
                        className="text-xs p-2 mb-1 rounded cursor-pointer hover:opacity-75 transition-opacity"
                        style={{ backgroundColor: `${attendanceType?.color}20`, color: attendanceType?.color }}
                      >
                        <div className="font-semibold">{session.session_name}</div>
                        {session.start_time && (
                          <div className="text-xs opacity-75">
                            {formatTime(session.start_time)}-{formatTime(session.end_time)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
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

  if (!attendanceType) {
    return (
      <div className="flex h-screen">
        <Sidebar userRole="director" />
        <div className="flex-1 p-6">
          <div className="flex items-center justify-center h-full">
            <div className="text-lg text-red-600">출석부 유형을 찾을 수 없습니다.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <Sidebar userRole="director" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center mb-2">
              <button
                onClick={() => window.location.href = '/dashboard/attendance'}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← 돌아가기
              </button>
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: attendanceType.color }}
              ></div>
              <h1 className="text-3xl font-bold text-gray-900">{attendanceType.name}</h1>
            </div>
            {attendanceType.description && (
              <p className="text-gray-600 mb-4">{attendanceType.description}</p>
            )}
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                총 {sessions.length}개의 세션, {students.length}명의 학생
              </div>
              <div className="flex gap-2">
                {!shouldShowTimetableStyle() && (
                  <button
                    onClick={() => setShowNewSessionForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    + 새 세션 추가
                  </button>
                )}
                <button
                  onClick={() => setShowStudentForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  + 학생 추가
                </button>
              </div>
            </div>
          </div>

          {/* 학생 추가 폼 */}
          {showStudentForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h2 className="text-xl font-semibold mb-4">새 학생 추가</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학생 이름 *
                    </label>
                    <input
                      type="text"
                      value={newStudent.name}
                      onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="학생 이름을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학교
                    </label>
                    <input
                      type="text"
                      value={newStudent.school}
                      onChange={(e) => setNewStudent({...newStudent, school: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="학교명을 입력하세요"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={createStudent}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setShowStudentForm(false);
                      setNewStudent({ name: '', school: '' });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 학생 수정 폼 */}
          {showStudentEdit && editingStudent && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h2 className="text-xl font-semibold mb-4">학생 정보 수정</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학생 이름 *
                    </label>
                    <input
                      type="text"
                      value={editStudent.name}
                      onChange={(e) => setEditStudent({...editStudent, name: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      학교
                    </label>
                    <input
                      type="text"
                      value={editStudent.school}
                      onChange={(e) => setEditStudent({...editStudent, school: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={updateStudent}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex-1"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      setShowStudentEdit(false);
                      setEditingStudent(null);
                      setEditStudent({ name: '', school: '' });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 교시 선택 팝업 */}
          {showClassSelection && selectedSlot && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-96">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedSlot.student.name} - {selectedSlot.day}요일 교시 선택
                </h2>
                <div className="space-y-2">
                  {classSchedule.map((classInfo) => (
                    <button
                      key={classInfo.name}
                      onClick={() => handleClassSelect(classInfo)}
                      className="w-full p-3 text-left border border-gray-300 rounded-md hover:bg-gray-50 hover:border-blue-500 transition-colors"
                    >
                      <div className="font-medium">{classInfo.name}</div>
                      <div className="text-sm text-gray-500">{classInfo.time}</div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setShowClassSelection(false);
                    setSelectedSlot(null);
                  }}
                  className="w-full mt-4 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 새 세션 추가 폼 (기존 출석부 유형용) */}
          {showNewSessionForm && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border">
              <h2 className="text-xl font-semibold mb-4">새 세션 추가</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    세션명 *
                  </label>
                  <input
                    type="text"
                    value={newSession.session_name}
                    onChange={(e) => setNewSession({...newSession, session_name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예: 1교시, 월요일 등"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜 *
                  </label>
                  <input
                    type="date"
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({...newSession, session_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당교사
                  </label>
                  <input
                    type="text"
                    value={newSession.teacher_name}
                    onChange={(e) => setNewSession({...newSession, teacher_name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="담당교사명"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={newSession.start_time}
                    onChange={(e) => setNewSession({...newSession, start_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={newSession.end_time}
                    onChange={(e) => setNewSession({...newSession, end_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    메모
                  </label>
                  <input
                    type="text"
                    value={newSession.notes}
                    onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="메모 (선택사항)"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createSession}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowNewSessionForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 컨텐츠 영역 */}
          {shouldShowTimetableStyle() ? (
            attendanceType.name === 'Google Meet Study' ? 
              renderGoogleMeetTimetable() : 
              renderTimetableStyle()
          ) : (
            // 기존 리스트 스타일 (서킷 모의고사, 최종 파이널 등)
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4 hover:shadow-lg transition-shadow cursor-pointer"
                  style={{ borderLeftColor: attendanceType.color }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {session.session_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          👥 {session.student_count || 0}명
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span className="flex items-center">
                          📅 {new Date(session.session_date).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short'
                          })}
                        </span>
                        {session.start_time && (
                          <span className="flex items-center">
                            🕐 {formatTime(session.start_time)}
                            {session.end_time && ` - ${formatTime(session.end_time)}`}
                          </span>
                        )}
                        {session.teacher_name && (
                          <span className="flex items-center">
                            👨‍🏫 {session.teacher_name}
                          </span>
                        )}
                      </div>
                      
                      {session.notes && (
                        <p className="text-gray-500 text-sm mt-2">{session.notes}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="text-red-600 hover:text-red-800 p-2"
                        title="삭제"
                      >
                        🗑️
                      </button>
                      <div className="text-blue-600 text-sm">
                        출석 관리 →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sessions.length === 0 && students.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg">등록된 세션과 학생이 없습니다.</p>
              <p className="text-sm">먼저 학생을 추가해보세요!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 