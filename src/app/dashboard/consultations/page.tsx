'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ContentPopup from '@/components/ui/ContentPopup';
import ContentSidePanel from '@/components/ui/ContentSidePanel';

interface Consultation {
  id: number;
  inquiry_id?: number;
  student_id?: number;
  consultation_date: string;
  attendees: string;
  content: string;
  registration_status: string;
  created_by: number;
  created_at: string;
  inquiry_name?: string;
  student_name?: string;
  created_by_name?: string;
  teacher?: string;
  test_type?: string;
  vocabulary_score?: number;
  structure_score?: number;
  grammar_score?: number;
  reading_score?: number;
  language_score?: number;
  listening_score?: number;
}

interface EditableConsultation extends Omit<Consultation, 'id'> {
  id?: number;
  isNew?: boolean;
  isEditing?: boolean;
  isSaving?: boolean;
  hasError?: boolean;
}

interface Inquiry {
  id: number;
  name: string;
  phone: string;
  email?: string;
  inquiry_source: string;
  inquiry_content: string;
  status: string;
}

interface Student {
  id: number;
  name: string;
  phone: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function ConsultationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [consultations, setConsultations] = useState<EditableConsultation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [editingCell, setEditingCell] = useState<{rowIndex: number, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    text: string;
    metadata?: Record<string, any>;
    consultationId?: number;
    field?: string;
  } | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 사이드패널에서 내용 저장
  const handleSidePanelSave = async (newText: string) => {
    if (!selectedContent?.consultationId || !selectedContent?.field) return;

    try {
      const token = localStorage.getItem('token');
      const consultation = consultations.find(c => c.id === selectedContent.consultationId);
      if (!consultation) return;

      const updatedConsultation = { ...consultation, [selectedContent.field]: newText };

      const response = await fetch(`http://localhost:3001/api/consultations/${selectedContent.consultationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedConsultation)
      });

      if (response.ok) {
        setConsultations(prev => prev.map(c => 
          c.id === selectedContent.consultationId 
            ? { ...c, [selectedContent.field!]: newText }
            : c
        ));
        
        // 사이드패널 내용도 업데이트
        setSelectedContent(prev => prev ? { ...prev, text: newText } : null);
      }
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };
  const searchParams = useSearchParams();
  const inquiryId = searchParams.get('inquiry_id');

  // 로컬 스토리지에서 임시 데이터 복원
  const restoreTempData = () => {
    try {
      const tempData = localStorage.getItem('consultations_temp_data');
      if (tempData) {
        const parsed = JSON.parse(tempData);
        setConsultations(parsed);
        console.log('임시 데이터 복원됨:', parsed.length, '개 항목');
      }
    } catch (error) {
      console.error('임시 데이터 복원 실패:', error);
    }
  };

  // 임시 데이터를 로컬 스토리지에 저장
  const saveTempData = (data: EditableConsultation[]) => {
    try {
      localStorage.setItem('consultations_temp_data', JSON.stringify(data));
    } catch (error) {
      console.error('임시 데이터 저장 실패:', error);
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
      
      // 임시 데이터 복원
      restoreTempData();
      
      // 서버에서 데이터 로드
      fetchConsultations();
      fetchInquiries();
      fetchStudents();
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [router]);

  // consultations 상태가 변경될 때마다 임시 저장
  useEffect(() => {
    if (isInitialized && consultations.length > 0) {
      saveTempData(consultations);
    }
  }, [consultations, isInitialized]);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/consultations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((consultation: Consultation) => ({
          ...consultation,
          isNew: false,
          isEditing: false,
          isSaving: false,
          hasError: false
        }));
        
        // 서버 데이터와 임시 데이터 병합
        const tempData = consultations.filter(c => c.isNew);
        const finalData = [...processedData, ...tempData];
        
        setConsultations(finalData);
        console.log('서버 데이터 로드됨:', processedData.length, '개 항목');
      } else {
        console.error('상담 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  };

  const fetchInquiries = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/inquiries', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('문의 목록을 불러오는데 실패했습니다.');
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('학생 목록을 불러오는데 실패했습니다.');
    }
  };

  const addNewRow = () => {
    const newConsultation: EditableConsultation = {
      inquiry_id: inquiryId ? parseInt(inquiryId) : undefined,
      student_id: undefined,
      consultation_date: new Date().toISOString().slice(0, 10),
      attendees: '',
      content: '',
      registration_status: 'pending',
      created_by: user?.id || 1,
      created_at: new Date().toISOString(),
      teacher: '',
      test_type: '고등용',
      vocabulary_score: undefined,
      structure_score: undefined,
      grammar_score: undefined,
      reading_score: undefined,
      language_score: undefined,
      listening_score: undefined,
      isNew: true,
      isEditing: true,
      isSaving: false,
      hasError: false
    };
    setConsultations(prev => [newConsultation, ...prev]);
    setEditingCell({ rowIndex: 0, field: 'teacher' });
    setEditingValue('');
  };

  const startEditing = (rowIndex: number, field: string, value: string | number) => {
    setEditingCell({ rowIndex, field });
    setEditingValue(String(value || ''));
  };

  // 자동 저장 함수
  const autoSave = (rowIndex: number, field: string, value: string) => {
    // 기존 타이머가 있다면 취소
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    // 2초 후 자동 저장
    const timeout = setTimeout(() => {
      const consultation = consultations[rowIndex];
      if (consultation && (consultation as any)[field] !== value) {
        console.log('자동 저장:', field, value);
        saveCellWithValue(rowIndex, field, value);
      }
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  // 값과 함께 저장하는 함수
  const saveCellWithValue = async (rowIndex: number, field: string, value: string) => {
    const consultation = consultations[rowIndex];
    let valueToSave: string | number | undefined = value;
    
    // 점수 필드인 경우 숫자로 변환
    if (field.includes('_score')) {
      valueToSave = value === '' ? undefined : Number(value);
    }
    
    const updatedConsultation = { ...consultation, [field]: valueToSave };
    
    console.log('saveCellWithValue 호출:', { rowIndex, field, value, valueToSave, consultation });
    
    setConsultations(prev => prev.map((item, index) => 
      index === rowIndex 
        ? { ...item, [field]: valueToSave, isSaving: true }
        : item
    ));

    try {
      const token = localStorage.getItem('token');
      console.log('토큰:', token ? '존재' : '없음');
      
      if (consultation.isNew) {
        // 새 상담 생성 - 모든 필수 필드가 채워졌을 때만 저장
        const hasRequiredFields = updatedConsultation.consultation_date && 
                                updatedConsultation.attendees && 
                                updatedConsultation.content;
        
        if (!hasRequiredFields) {
          console.log('필수 필드 부족, 로컬 상태만 업데이트');
          setConsultations(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: valueToSave, isSaving: false }
              : item
          ));
          setEditingCell(null);
          setEditingValue('');
          return;
        }

        console.log('새 상담 저장 시도:', updatedConsultation);
        const requestBody = {
          inquiry_id: updatedConsultation.inquiry_id,
          student_id: updatedConsultation.student_id,
          consultation_date: updatedConsultation.consultation_date,
          attendees: updatedConsultation.attendees,
          content: updatedConsultation.content,
          registration_status: updatedConsultation.registration_status,
          created_by: updatedConsultation.created_by,
          teacher: updatedConsultation.teacher,
          test_type: updatedConsultation.test_type,
          vocabulary_score: updatedConsultation.vocabulary_score,
          structure_score: updatedConsultation.structure_score,
          grammar_score: updatedConsultation.grammar_score,
          reading_score: updatedConsultation.reading_score,
          language_score: updatedConsultation.language_score,
          listening_score: updatedConsultation.listening_score
        };
        console.log('요청 본문:', requestBody);
        
        const response = await fetch('http://localhost:3001/api/consultations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const savedConsultation = await response.json();
          console.log('저장된 상담:', savedConsultation);
          setConsultations(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { 
                  ...savedConsultation, 
                  isNew: false, 
                  isSaving: false, 
                  hasError: false,
                  isEditing: false
                }
              : item
          ));
          
          // 저장 성공 시 임시 데이터 정리
          setTimeout(() => {
            const currentData = consultations.filter(c => !c.isNew);
            saveTempData(currentData);
          }, 100);
        } else {
          const errorText = await response.text();
          console.error('저장 실패 응답:', errorText);
          throw new Error(`저장 실패: ${response.status} ${errorText}`);
        }
      } else {
        // 기존 상담 수정
        console.log('기존 상담 수정:', consultation.id, field, value);
        const response = await fetch(`http://localhost:3001/api/consultations/${consultation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ [field]: valueToSave })
        });

        console.log('수정 응답 상태:', response.status);
        
        if (response.ok) {
          setConsultations(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: valueToSave, isSaving: false, hasError: false }
              : item
          ));
        } else {
          const errorText = await response.text();
          console.error('수정 실패 응답:', errorText);
          throw new Error(`수정 실패: ${response.status} ${errorText}`);
        }
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setConsultations(prev => prev.map((item, index) => 
        index === rowIndex 
          ? { ...item, hasError: true, isSaving: false }
          : item
      ));
    }

    setEditingCell(null);
    setEditingValue('');
  };

  const saveCell = async (rowIndex: number, field: string) => {
    const consultation = consultations[rowIndex];
    let valueToSave: string | number | undefined = editingValue;
    
    // 점수 필드인 경우 숫자로 변환
    if (field.includes('_score')) {
      valueToSave = editingValue === '' ? undefined : Number(editingValue);
    }
    
    const updatedConsultation = { ...consultation, [field]: valueToSave };
    
    console.log('saveCell 호출:', { rowIndex, field, editingValue, valueToSave, consultation });
    
    setConsultations(prev => prev.map((item, index) => 
      index === rowIndex 
        ? { ...item, [field]: valueToSave, isSaving: true }
        : item
    ));

    try {
      const token = localStorage.getItem('token');
      console.log('토큰:', token ? '존재' : '없음');
      
      if (consultation.isNew) {
        // 새 상담 생성 - 모든 필수 필드가 채워졌을 때만 저장
        const hasRequiredFields = updatedConsultation.consultation_date && 
                                updatedConsultation.attendees && 
                                updatedConsultation.content;
        
        if (!hasRequiredFields) {
          console.log('필수 필드 부족, 로컬 상태만 업데이트');
          setConsultations(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: valueToSave, isSaving: false }
              : item
          ));
          setEditingCell(null);
          setEditingValue('');
          return;
        }

        console.log('새 상담 저장 시도:', updatedConsultation);
        const requestBody = {
          inquiry_id: updatedConsultation.inquiry_id,
          student_id: updatedConsultation.student_id,
          consultation_date: updatedConsultation.consultation_date,
          attendees: updatedConsultation.attendees,
          content: updatedConsultation.content,
          registration_status: updatedConsultation.registration_status,
          created_by: updatedConsultation.created_by,
          teacher: updatedConsultation.teacher,
          test_type: updatedConsultation.test_type,
          vocabulary_score: updatedConsultation.vocabulary_score,
          structure_score: updatedConsultation.structure_score,
          grammar_score: updatedConsultation.grammar_score,
          reading_score: updatedConsultation.reading_score,
          language_score: updatedConsultation.language_score,
          listening_score: updatedConsultation.listening_score
        };
        console.log('요청 본문:', requestBody);
        
        const response = await fetch('http://localhost:3001/api/consultations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const savedConsultation = await response.json();
          console.log('저장된 상담:', savedConsultation);
          setConsultations(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { 
                  ...savedConsultation, 
                  isNew: false, 
                  isSaving: false, 
                  hasError: false,
                  isEditing: false
                }
              : item
          ));
          
          // 저장 성공 시 임시 데이터 정리
          setTimeout(() => {
            const currentData = consultations.filter(c => !c.isNew);
            saveTempData(currentData);
          }, 100);
        } else {
          const errorText = await response.text();
          console.error('저장 실패 응답:', errorText);
          throw new Error(`저장 실패: ${response.status} ${errorText}`);
        }
      } else {
        // 기존 상담 수정
        console.log('기존 상담 수정:', consultation.id, field, valueToSave);
        const response = await fetch(`http://localhost:3001/api/consultations/${consultation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ [field]: valueToSave })
        });

        console.log('수정 응답 상태:', response.status);
        
        if (response.ok) {
          setConsultations(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: valueToSave, isSaving: false, hasError: false }
              : item
          ));
        } else {
          const errorText = await response.text();
          console.error('수정 실패 응답:', errorText);
          throw new Error(`수정 실패: ${response.status} ${errorText}`);
        }
      }
    } catch (error) {
      console.error('저장 오류:', error);
      setConsultations(prev => prev.map((item, index) => 
        index === rowIndex 
          ? { ...item, hasError: true, isSaving: false }
          : item
      ));
    }

    setEditingCell(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveCell(rowIndex, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditingValue('');
    }
  };

  const handleStatusUpdate = async (rowIndex: number, newStatus: string) => {
    console.log('handleStatusUpdate 호출:', rowIndex, newStatus);
    const consultation = consultations[rowIndex];
    
    // 새 상담인 경우 로컬 상태만 업데이트
    if (!consultation.id) {
      console.log('새 상담 상태 업데이트:', newStatus);
      setConsultations(prev => prev.map((item, index) => 
        index === rowIndex 
          ? { ...item, registration_status: newStatus }
          : item
      ));
      return;
    }

    console.log('기존 상담 상태 업데이트:', consultation.id, newStatus);
    setConsultations(prev => prev.map((item, index) => 
      index === rowIndex 
        ? { ...item, registration_status: newStatus, isSaving: true }
        : item
    ));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/consultations/${consultation.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ registration_status: newStatus })
      });

      if (response.ok) {
        console.log('상태 업데이트 성공');
        setConsultations(prev => prev.map((item, index) => 
          index === rowIndex 
            ? { ...item, registration_status: newStatus, isSaving: false, hasError: false }
            : item
        ));
      } else {
        throw new Error('상태 업데이트 실패');
      }
    } catch (error) {
      console.error('상태 업데이트 오류:', error);
      setConsultations(prev => prev.map((item, index) => 
        index === rowIndex 
          ? { ...item, hasError: true, isSaving: false }
          : item
      ));
    }
  };

  const deleteConsultation = async (rowIndex: number) => {
    const consultation = consultations[rowIndex];
    if (!consultation.id) {
      setConsultations(prev => prev.filter((_, index) => index !== rowIndex));
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/consultations/${consultation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setConsultations(prev => prev.filter((_, index) => index !== rowIndex));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return '검토중';
      case 'registered': return '등록완료';
      case 'rejected': return '등록거절';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'registered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTestTypeMaxScores = (testType: string) => {
    switch (testType) {
      case '고등용':
        return { vocabulary: 30, structure: 30, reading: 40, grammar: 0, language: 0, listening: 0 };
      case '중등용':
        return { vocabulary: 30, structure: 20, grammar: 14, reading: 28, language: 8, listening: 0 };
      case '수능용':
        return { vocabulary: 30, structure: 30, grammar: 0, reading: 25, language: 5, listening: 10 };
      default:
        return { vocabulary: 30, structure: 30, reading: 40, grammar: 0, language: 0, listening: 0 };
    }
  };

  const getTotalScore = (consultation: EditableConsultation) => {
    const scores = [
      Number(consultation.vocabulary_score) || 0,
      Number(consultation.structure_score) || 0,
      Number(consultation.grammar_score) || 0,
      Number(consultation.reading_score) || 0,
      Number(consultation.language_score) || 0,
      Number(consultation.listening_score) || 0
    ];
    const total = scores.reduce((sum, score) => sum + score, 0);
    return total;
  };

  const getMaxScore = (consultation: EditableConsultation) => {
    const maxScores = getTestTypeMaxScores(consultation.test_type || '고등용');
    return Object.values(maxScores).reduce((sum, score) => sum + score, 0);
  };

  const filteredConsultations = filterType === 'all' 
    ? consultations 
    : consultations.filter(consultation => consultation.test_type === filterType);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar userRole={user.role} />
      
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">상담 DB 관리</h1>
                <p className="text-sm text-gray-600">학원 상담 기록 및 레벨 테스트 관리</p>
              </div>
              <button
                onClick={addNewRow}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                새 상담 기록
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* 필터 */}
            <div className="mb-6">
              <div className="flex gap-2">
                {['all', '고등용', '중등용', '수능용'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      filterType === type 
                        ? 'bg-green-600 text-white shadow-md' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {type === 'all' ? '전체' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* 스프레드시트 스타일 테이블 */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상담일시
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        참석자
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        담당T
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상담내용
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        테스트유형
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        어휘
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        구조
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        문법
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        독해
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        언어력
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        듣기
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총점
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        등록상태
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredConsultations.map((consultation, rowIndex) => (
                      <tr 
                        key={consultation.id || `new-${rowIndex}`} 
                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                          consultation.isNew ? 'bg-green-50' : ''
                        } ${consultation.hasError ? 'bg-red-50' : ''}`}
                      >
                        {/* 상담일시 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'consultation_date' ? (
                            <input
                              type="date"
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'consultation_date', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'consultation_date')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'consultation_date', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-sm"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-sm"
                              onClick={() => startEditing(rowIndex, 'consultation_date', consultation.consultation_date ? new Date(consultation.consultation_date).toISOString().slice(0, 10) : '')}
                            >
                              {consultation.consultation_date ? new Date(consultation.consultation_date).toLocaleDateString() : '클릭하여 입력'}
                            </div>
                          )}
                        </td>

                        {/* 참석자 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'attendees' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'attendees', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'attendees')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'attendees', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                              placeholder="예: 김영희, 김영희 부모님, 원장"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 max-w-xs truncate"
                              onClick={() => startEditing(rowIndex, 'attendees', consultation.attendees)}
                              title={consultation.attendees}
                            >
                              {consultation.attendees || '클릭하여 입력'}
                            </div>
                          )}
                        </td>

                        {/* 담당T */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'teacher' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'teacher', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'teacher')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'teacher', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                              placeholder="담당 강사명"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => startEditing(rowIndex, 'teacher', consultation.teacher || '')}
                            >
                              {consultation.teacher || '클릭하여 입력'}
                            </div>
                          )}
                        </td>

                        {/* 상담내용 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'content' ? (
                            <textarea
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'content', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'content')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'content', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 bg-white"
                              rows={3}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => {
                                if (consultation.content && consultation.content.length > 50) {
                                  setSelectedContent({
                                    title: `상담 내용 - ${consultation.inquiry_name || consultation.student_name || '상담'}`,
                                    text: consultation.content,
                                    metadata: {
                                      '상담일': consultation.consultation_date ? new Date(consultation.consultation_date).toLocaleDateString() : '-',
                                      '참석자': consultation.attendees || '-',
                                      '등록상태': getStatusLabel(consultation.registration_status),
                                      '테스트유형': consultation.test_type || '-',
                                      '총점': `${getTotalScore(consultation)}/${getMaxScore(consultation)}`,
                                      '등록일': consultation.created_at ? new Date(consultation.created_at).toLocaleDateString() : '-'
                                    },
                                    consultationId: consultation.id,
                                    field: 'content'
                                  });
                                  setSidePanelOpen(true);
                                } else {
                                  startEditing(rowIndex, 'content', consultation.content);
                                }
                              }}
                            >
                              {consultation.content ? (
                                <div className="text-left">
                                  {consultation.content.length > 30 
                                    ? `${consultation.content.substring(0, 30)}...` 
                                    : consultation.content
                                  }
                                </div>
                              ) : (
                                '클릭하여 입력'
                              )}
                            </div>
                          )}
                        </td>

                        {/* 테스트유형 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'test_type' ? (
                            <select
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'test_type', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'test_type')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'test_type', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500"
                              autoFocus
                            >
                              <option value="고등용">고등용</option>
                              <option value="중등용">중등용</option>
                              <option value="수능용">수능용</option>
                            </select>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => startEditing(rowIndex, 'test_type', consultation.test_type || '고등용')}
                            >
                              {consultation.test_type || '클릭하여 선택'}
                            </div>
                          )}
                        </td>

                        {/* 어휘 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'vocabulary_score' ? (
                            <input
                              type="number"
                              min="0"
                              max={getTestTypeMaxScores(consultation.test_type || '고등용').vocabulary}
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'vocabulary_score', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'vocabulary_score')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'vocabulary_score', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-center"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-center"
                              onClick={() => startEditing(rowIndex, 'vocabulary_score', consultation.vocabulary_score || 0)}
                            >
                              {consultation.vocabulary_score || '-'}
                              <div className="text-xs text-gray-500">
                                /{getTestTypeMaxScores(consultation.test_type || '고등용').vocabulary}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 구조 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'structure_score' ? (
                            <input
                              type="number"
                              min="0"
                              max={getTestTypeMaxScores(consultation.test_type || '고등용').structure}
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'structure_score', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'structure_score')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'structure_score', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-center"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-center"
                              onClick={() => startEditing(rowIndex, 'structure_score', consultation.structure_score || 0)}
                            >
                              {consultation.structure_score || '-'}
                              <div className="text-xs text-gray-500">
                                /{getTestTypeMaxScores(consultation.test_type || '고등용').structure}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 문법 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'grammar_score' ? (
                            <input
                              type="number"
                              min="0"
                              max={getTestTypeMaxScores(consultation.test_type || '고등용').grammar}
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'grammar_score', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'grammar_score')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'grammar_score', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-center"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-center"
                              onClick={() => startEditing(rowIndex, 'grammar_score', consultation.grammar_score || 0)}
                            >
                              {consultation.grammar_score || '-'}
                              <div className="text-xs text-gray-500">
                                /{getTestTypeMaxScores(consultation.test_type || '고등용').grammar}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 독해 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'reading_score' ? (
                            <input
                              type="number"
                              min="0"
                              max={getTestTypeMaxScores(consultation.test_type || '고등용').reading}
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'reading_score', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'reading_score')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'reading_score', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-center"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-center"
                              onClick={() => startEditing(rowIndex, 'reading_score', consultation.reading_score || 0)}
                            >
                              {consultation.reading_score || '-'}
                              <div className="text-xs text-gray-500">
                                /{getTestTypeMaxScores(consultation.test_type || '고등용').reading}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 언어력 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'language_score' ? (
                            <input
                              type="number"
                              min="0"
                              max={getTestTypeMaxScores(consultation.test_type || '고등용').language}
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'language_score', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'language_score')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'language_score', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-center"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-center"
                              onClick={() => startEditing(rowIndex, 'language_score', consultation.language_score || 0)}
                            >
                              {consultation.language_score || '-'}
                              <div className="text-xs text-gray-500">
                                /{getTestTypeMaxScores(consultation.test_type || '고등용').language}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 듣기 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'listening_score' ? (
                            <input
                              type="number"
                              min="0"
                              max={getTestTypeMaxScores(consultation.test_type || '고등용').listening}
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'listening_score', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'listening_score')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'listening_score', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-green-300 rounded focus:ring-2 focus:ring-green-500 text-center"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-green-50 px-2 py-1 rounded transition-colors duration-200 text-center"
                              onClick={() => startEditing(rowIndex, 'listening_score', consultation.listening_score || 0)}
                            >
                              {consultation.listening_score || '-'}
                              <div className="text-xs text-gray-500">
                                /{getTestTypeMaxScores(consultation.test_type || '고등용').listening}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 총점 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-center">
                            <div className="font-semibold text-lg">
                              {getTotalScore(consultation)}
                            </div>
                            <div className="text-xs text-gray-500">
                              /{getMaxScore(consultation)}
                            </div>
                          </div>
                        </td>

                        {/* 등록상태 */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <select
                              value={consultation.registration_status}
                              onChange={(e) => {
                                console.log('상태 변경:', e.target.value, '행:', rowIndex);
                                handleStatusUpdate(rowIndex, e.target.value);
                              }}
                              disabled={consultation.isSaving}
                              className={`px-2 py-1 text-xs font-semibold rounded-full border-0 focus:ring-2 focus:ring-green-500 ${
                                consultation.isSaving ? 'opacity-50' : ''
                              } ${getStatusColor(consultation.registration_status)}`}
                            >
                              <option value="pending">검토중</option>
                              <option value="registered">등록완료</option>
                              <option value="rejected">등록거절</option>
                            </select>
                            {consultation.isSaving && (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600"></div>
                            )}
                          </div>
                        </td>

                        {/* 작업 */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-2">
                            <button
                              onClick={() => deleteConsultation(rowIndex)}
                              className="text-red-600 hover:text-red-900 text-xs font-medium"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 사용법 안내 */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">💡 사용법</h3>
              <ul className="text-xs text-green-800 space-y-1">
                <li>• 셀을 클릭하여 바로 입력/수정할 수 있습니다</li>
                <li>• Enter: 저장, Esc: 취소</li>
                <li>• 테스트 유형에 따라 최대 점수가 자동으로 설정됩니다</li>
                <li>• 총점은 자동으로 계산되어 표시됩니다</li>
                <li>• 등록상태는 드롭다운으로 빠르게 변경 가능합니다</li>
                <li>• 입력 중인 데이터는 페이지 이동 시에도 보존됩니다</li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* 사이드 패널 */}
      {selectedContent && (
        <ContentSidePanel
          isOpen={sidePanelOpen}
          onClose={() => {
            setSidePanelOpen(false);
            setSelectedContent(null);
          }}
          content={selectedContent}
          isEditable={true}
          onSave={handleSidePanelSave}
        />
      )}
    </div>
  );
} 