'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface Schedule {
  id: number;
  day_of_week: number;
  time_slot: string;
  subject: string;
  teacher_id: number;
  student_ids: number[];
  room?: string;
  notes?: string;
}

const DAYS = ['월', '화', '수', '목', '금', '토'];
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

const SUBJECTS = {
  class: '수업',
  retest: '재시험',
  supplement: '보충 수업',
  online: '화상 수업',
  ot: 'OT',
  absent: '결석',
  feedback: '피드백',
  check: '추가 점검',
  exam: '시험',
  review: '복습',
  practice: '연습',
  consultation: '상담'
};

export default function TimetablePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{day: number, timeSlot: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [draggedSchedule, setDraggedSchedule] = useState<Schedule | null>(null);
  const [editingTimeSlot, setEditingTimeSlot] = useState<number | null>(null);
  const [timeSlotEditValue, setTimeSlotEditValue] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // 사용자 정보 가져오기
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        setUser(userData);
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error);
      }
    }
    
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await apiGet('/api/schedules');

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.data || []);
      }
    } catch (error) {
      console.error('시간표 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForTimeSlot = (day: number, timeSlot: string) => {
    return schedules.find(schedule => 
      schedule.day_of_week === day && schedule.time_slot === timeSlot
    );
  };

  // 학생명과 과목을 분리하는 함수
  const parseStudentAndSubject = (input: string) => {
    const parts = input.split('/');
    if (parts.length >= 2) {
      const studentName = parts[0].trim();
      const subject = parts[1].trim();
      return { studentName, subject };
    }
    return { studentName: input.trim(), subject: '수업' };
  };

  // 과목명을 영어로 변환
  const getSubjectKey = (subject: string) => {
    const subjectMap: { [key: string]: string } = {
      '수업': 'class',
      '재시험': 'retest',
      '보충 수업': 'supplement',
      '보충수업': 'supplement', // 공백 없는 형태도 지원
      '화상 수업': 'online',
      '화상수업': 'online', // 공백 없는 형태도 지원
      'OT': 'ot',
      '결석': 'absent',
      '피드백': 'feedback',
      '추가 점검': 'check',
      '추가점검': 'check', // 공백 없는 형태도 지원
      '시험': 'exam',
      '복습': 'review',
      '연습': 'practice',
      '상담': 'consultation',
      // 단축형도 지원
      '보충': 'supplement',
      '점검': 'check',
      'class': 'class',
      'retest': 'retest',
      'supplement': 'supplement',
      'online': 'online',
      'ot': 'ot',
      'absent': 'absent',
      'feedback': 'feedback',
      'check': 'check',
      'exam': 'exam',
      'review': 'review',
      'practice': 'practice',
      'consultation': 'consultation'
    };
    return subjectMap[subject] || 'class';
  };

  // 드래그 시작
  const handleDragStart = (e: React.DragEvent, schedule: Schedule) => {
    setDraggedSchedule(schedule);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', schedule.id.toString());
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // 드롭
  const handleDrop = async (e: React.DragEvent, targetDay: number, targetTimeSlot: string) => {
    e.preventDefault();
    
    if (!draggedSchedule) return;

    const targetDayDB = targetDay; // 데이터베이스 인덱스로 변환
    
    try {
      // 기존 스케줄 삭제
      await apiDelete(`/api/schedules/${draggedSchedule.id}`);

      // 새 위치에 스케줄 생성
      const response = await apiPost('/api/schedules', {
        day_of_week: targetDayDB,
        time_slot: targetTimeSlot,
        subject: draggedSchedule.subject,
        room: draggedSchedule.room || '',
        notes: draggedSchedule.notes || '',
        teacher_id: draggedSchedule.teacher_id,
        student_ids: draggedSchedule.student_ids || []
      });

      if (response.ok) {
        await fetchSchedules();
      }
    } catch (error) {
      console.error('드래그 앤 드롭 오류:', error);
    } finally {
      setDraggedSchedule(null);
    }
  };

  const handleCellClick = (day: number, timeSlot: string) => {
    const schedule = getScheduleForTimeSlot(day, timeSlot);
    setEditingCell({ day, timeSlot });
    
    if (schedule) {
      // 기존 데이터가 있으면 원본 형태로 표시
      const originalNotes = schedule.notes || '';
      
      // 이미 파싱된 형태인지 확인 (예: "학생명/과목명/과목명")
      if (originalNotes.includes('/') && originalNotes.split('/').length > 2) {
        // 중복된 형태라면 첫 번째와 두 번째 부분만 사용
        const parts = originalNotes.split('/');
        setEditValue(`${parts[0]}/${parts[1]}`);
      } else {
        setEditValue(originalNotes);
      }
    } else {
      setEditValue('');
    }
  };

  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      console.log('시간표 저장 시작:', { editingCell, editValue });
      
      // 특별 시간 행(dayIndex 6)인 경우 일반 텍스트로 저장
      if (editingCell.day === 6) {
        const scheduleData = {
          day_of_week: 7, // 특별 시간은 day_of_week 7
          time_slot: editingCell.timeSlot,
          subject: 'text', // 일반 텍스트
          teacher_id: 1,
          student_ids: [],
          notes: editValue // 입력한 텍스트 그대로 저장
        };

        console.log('특별 시간 저장 데이터:', scheduleData);
        const response = await apiPost('/api/schedules', scheduleData);
        console.log('특별 시간 저장 응답:', response.status, response.ok);

        if (response.ok) {
          await fetchSchedules();
        }
      } else {
        // 일반 요일은 기존 로직 사용
        const { studentName, subject } = parseStudentAndSubject(editValue);
        
        // 공란으로 입력한 경우 기존 스케줄 삭제
        if (!editValue.trim()) {
          console.log('공란 입력 - 기존 스케줄 삭제');
          const existingSchedule = getScheduleForTimeSlot(editingCell.day, editingCell.timeSlot);
          if (existingSchedule) {
            console.log('기존 스케줄 삭제:', existingSchedule.id);
            await apiDelete(`/api/schedules/${existingSchedule.id}`);
          }
          await fetchSchedules();
          setEditingCell(null);
          setEditValue('');
          return;
        }

        const scheduleData = {
          day_of_week: editingCell.day + 1, // 0부터 시작하는 인덱스를 1부터 시작하는 요일로 변환
          time_slot: editingCell.timeSlot,
          subject: getSubjectKey(subject),
          teacher_id: 1,
          student_ids: [],
          notes: editValue // 원본 입력값 그대로 저장
        };

        console.log('일반 요일 저장 데이터:', scheduleData);
        const response = await apiPost('/api/schedules', scheduleData);
        console.log('일반 요일 저장 응답:', response.status, response.ok);

        if (response.ok) {
          await fetchSchedules();
        }
      }
    } catch (error) {
      console.error('시간표 저장 오류:', error);
    } finally {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const handleTimeSlotClick = (rowIndex: number) => {
    setEditingTimeSlot(rowIndex);
    setTimeSlotEditValue(TIME_SLOTS[rowIndex]);
  };

  const handleTimeSlotSave = () => {
    if (editingTimeSlot !== null) {
      // 시간대 배열 업데이트
      const updatedTimeSlots = [...TIME_SLOTS];
      updatedTimeSlots[editingTimeSlot] = timeSlotEditValue;
      
      // 로컬 스토리지에 저장
      localStorage.setItem('customTimeSlots', JSON.stringify(updatedTimeSlots));
      
      // 페이지 새로고침으로 변경사항 적용
      window.location.reload();
    }
    setEditingTimeSlot(null);
    setTimeSlotEditValue('');
  };

  const handleTimeSlotCancel = () => {
    setEditingTimeSlot(null);
    setTimeSlotEditValue('');
  };

  const handleTimeSlotKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeSlotSave();
    } else if (e.key === 'Escape') {
      handleTimeSlotCancel();
    }
  };

  // 커스텀 시간대 로드 - 기본 시간대만 사용
  const getTimeSlots = (): string[] => {
    return TIME_SLOTS; // 항상 기본 시간대 사용
  };

  const getSubjectColor = (subject: string) => {
    console.log('Getting color for subject:', subject); // 디버깅용
    
    // 한글 과목명을 영어 키워드로 변환
    const subjectKey = getSubjectKey(subject);
    console.log('Converted subject key:', subjectKey); // 디버깅용
    
    const colors = {
      class: 'bg-green-50 text-green-600', // 더 부드럽고 연한 초록색
      retest: 'bg-red-100 text-red-800',
      supplement: 'bg-yellow-100 text-yellow-800', // 노란색
      online: 'bg-indigo-100 text-indigo-800',
      ot: 'bg-purple-100 text-purple-800',
      absent: 'bg-gray-100 text-gray-800',
      feedback: 'bg-pink-100 text-pink-800',
      check: 'bg-yellow-100 text-yellow-800',
      exam: 'bg-orange-100 text-orange-800',
      review: 'bg-teal-100 text-teal-800',
      practice: 'bg-cyan-100 text-cyan-800',
      consultation: 'bg-emerald-100 text-emerald-800'
    };
    const color = colors[subjectKey as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    console.log('Selected color:', color); // 디버깅용
    return color;
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar userRole={user?.role || 'director'} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">시간표를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 사이드바 */}
      <Sidebar userRole={user?.role || 'director'} />
      
      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <header className="bg-white shadow">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  시간표 관리
                </h1>
                <p className="text-sm text-gray-600">
                  수업 시간표를 관리하세요. 셀을 클릭하여 수정할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* 시간표 콘텐츠 */}
        <main className="flex-1 p-6">
          {/* 스프레드시트 스타일 시간표 */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-100">
                      시간표
                    </th>
                    {DAYS.slice(0, 5).map((day, index) => (
                      <th key={index} className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-100">
                        {day}요일
                      </th>
                    ))}
                    <th className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-100">
                      시간표
                    </th>
                    <th key={5} className="border border-gray-300 px-4 py-3 text-center text-sm font-medium text-gray-700 bg-gray-100">
                      토요일
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getTimeSlots().map((timeSlot, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 bg-gray-50 text-center">
                        {editingTimeSlot === rowIndex ? (
                          <input
                            type="text"
                            value={timeSlotEditValue}
                            onChange={(e) => setTimeSlotEditValue(e.target.value)}
                            onKeyPress={handleTimeSlotKeyPress}
                            onBlur={handleTimeSlotSave}
                            className="w-full p-1 border border-blue-300 rounded"
                            autoFocus
                          />
                        ) : (
                          <span onClick={() => handleTimeSlotClick(rowIndex)}>{timeSlot}</span>
                        )}
                      </td>
                      {DAYS.slice(0, 5).map((day, dayIndex) => {
                        const schedule = getScheduleForTimeSlot(dayIndex, timeSlot);
                        const isEditing = editingCell?.day === dayIndex && editingCell?.timeSlot === timeSlot;
                        const isDragOver = draggedSchedule && draggedSchedule.id !== schedule?.id;
                        
                        return (
                          <td 
                            key={dayIndex} 
                            className={`border border-gray-300 px-4 py-3 text-sm cursor-pointer transition-colors ${
                              isEditing ? 'bg-blue-100 border-blue-300' : 
                              isDragOver ? 'bg-green-100 border-green-300' : 
                              'hover:bg-blue-50'
                            }`}
                            onClick={() => handleCellClick(dayIndex, timeSlot)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, dayIndex, timeSlot)}
                          >
                            {isEditing ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full p-1 border border-blue-300 rounded"
                                autoFocus
                              />
                            ) : schedule ? (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, schedule)}
                                className="relative text-center"
                              >
                                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${getSubjectColor(parseStudentAndSubject(schedule.notes || '').subject)}`}>
                                  {parseStudentAndSubject(schedule.notes || '').subject}
                                </div>
                                <div className="font-medium text-gray-900">
                                  {parseStudentAndSubject(schedule.notes || '').studentName}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">&nbsp;</div>
                            )}
                          </td>
                        );
                      })}
                      {/* 특별 시간 열 추가 */}
                      <td 
                        className="border border-gray-300 px-4 py-3 text-sm cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50"
                        onClick={() => handleCellClick(6, timeSlot)} // dayIndex 6은 특별 시간
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 6, timeSlot)}
                      >
                        {(() => {
                          const schedule = getScheduleForTimeSlot(7, timeSlot); // day_of_week 7은 특별 시간
                          const isEditing = editingCell?.day === 6 && editingCell?.timeSlot === timeSlot;
                          
                          if (isEditing) {
                            return (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full p-1 border border-blue-300 rounded"
                                autoFocus
                              />
                            );
                          } else if (schedule) {
                            return (
                              <div className="font-medium text-gray-900 text-center">
                                {schedule.notes || '텍스트'}
                              </div>
                            );
                          } else {
                            return <div className="text-center">&nbsp;</div>;
                          }
                        })()}
                      </td>
                      {/* 토요일 열 */}
                      <td 
                        className={`border border-gray-300 px-4 py-3 text-sm cursor-pointer transition-colors ${
                          (() => {
                            const schedule = getScheduleForTimeSlot(6, timeSlot); // day_of_week 6은 토요일
                            const isEditing = editingCell?.day === 5 && editingCell?.timeSlot === timeSlot;
                            const isDragOver = draggedSchedule && draggedSchedule.id !== schedule?.id;
                            
                            if (isEditing) return 'bg-blue-100 border-blue-300';
                            if (isDragOver) return 'bg-green-100 border-green-300';
                            return 'hover:bg-blue-50';
                          })()
                        }`}
                        onClick={() => handleCellClick(5, timeSlot)} // dayIndex 5는 토요일
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 5, timeSlot)}
                      >
                        {(() => {
                          const schedule = getScheduleForTimeSlot(6, timeSlot); // day_of_week 6은 토요일
                          const isEditing = editingCell?.day === 5 && editingCell?.timeSlot === timeSlot;
                          
                          if (isEditing) {
                            return (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full p-1 border border-blue-300 rounded"
                                autoFocus
                              />
                            );
                          } else if (schedule) {
                            return (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, schedule)}
                                className="relative text-center"
                              >
                                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-1 ${getSubjectColor(parseStudentAndSubject(schedule.notes || '').subject)}`}>
                                  {parseStudentAndSubject(schedule.notes || '').subject}
                                </div>
                                <div className="font-medium text-gray-900">
                                  {parseStudentAndSubject(schedule.notes || '').studentName}
                                </div>
                              </div>
                            );
                          } else {
                            return <div className="text-center">&nbsp;</div>;
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 사용법 안내 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-900 mb-2">사용법</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 셀을 클릭하여 수업 정보를 입력하세요</li>
              <li>• 입력 형식: "학생명/과목명" (예: "김철수/수업")</li>
              <li>• 수업을 드래그하여 다른 시간대로 이동할 수 있습니다</li>
              <li>• Enter: 저장, Esc: 취소</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
} 