'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ContentSidePanel from '@/components/ui/ContentSidePanel';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';

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
  updated_at?: string;
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

function ConsultationsContent() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    text: string;
    consultationId?: number;
    field?: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // 상담 목록 가져오기
  const fetchConsultations = async () => {
    try {
      const response = await apiGet('/api/consultations');
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
        console.log('상담 목록 로드됨:', data.length, '개');
      } else {
        console.error('상담 목록 로드 실패:', response.statusText);
      }
    } catch (error) {
      console.error('상담 목록 로드 중 오류:', error);
    }
  };

  // 문의 목록 가져오기
  const fetchInquiries = async () => {
    try {
      const response = await apiGet('/api/inquiries');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data);
      }
    } catch (error) {
      console.error('문의 목록 로드 중 오류:', error);
    }
  };

  // 학생 목록 가져오기
  const fetchStudents = async () => {
    try {
      const response = await apiGet('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('학생 목록 로드 중 오류:', error);
    }
  };

  // 사이드패널에서 내용 저장
  const handleSidePanelSave = async (newText: string) => {
    if (!selectedContent?.consultationId || !selectedContent?.field) {
      console.error('저장할 상담 정보가 없습니다.');
      return;
    }

    try {
      console.log('상담 내용 저장 시작:', {
        consultationId: selectedContent.consultationId,
        field: selectedContent.field,
        newText: newText.substring(0, 100) + '...' // 로그에서 너무 길지 않게
      });

      const updateData = {
        [selectedContent.field]: newText
      };

      const response = await apiPut(`/api/consultations/${selectedContent.consultationId}`, updateData);

      if (response.ok) {
        const updatedConsultation = await response.json();
        
        // 로컬 상태 업데이트
        setConsultations(prev => prev.map(c =>
          c.id === selectedContent.consultationId
            ? { ...c, [selectedContent.field!]: newText }
            : c
        ));

        // 사이드패널 상태 업데이트
        setSelectedContent(prev => prev ? { ...prev, text: newText } : null);
        setIsEditing(false);
        
        console.log('상담 내용 저장 성공:', updatedConsultation);
      } else {
        const errorData = await response.json();
        console.error('상담 내용 저장 실패:', errorData);
        alert('상담 내용을 저장하는데 실패했습니다.');
      }
    } catch (error) {
      console.error('상담 내용 저장 중 오류:', error);
      alert('상담 내용을 저장하는 중 오류가 발생했습니다.');
    }
  };

  // 상담 내용 클릭 시 사이드패널 열기
  const handleContentClick = (consultation: Consultation, field: string) => {
    const fieldLabels: Record<string, string> = {
      content: '상담 내용',
      attendees: '참석자',
      teacher: '담당 선생님',
      test_type: '시험 유형'
    };

    setSelectedContent({
      title: fieldLabels[field] || field,
      text: consultation[field as keyof Consultation] as string || '',
      consultationId: consultation.id,
      field: field
    });
    setSidePanelOpen(true);
    setIsEditing(false);
  };

  // 새 상담 추가
  const addNewConsultation = async () => {
    try {
      const newConsultation = {
        consultation_date: new Date().toISOString().split('T')[0],
        attendees: '',
        content: '',
        registration_status: 'pending',
        teacher: '',
        test_type: ''
      };

      const response = await apiPost('/api/consultations', newConsultation);
      
      if (response.ok) {
        const createdConsultation = await response.json();
        setConsultations(prev => [createdConsultation, ...prev]);
        console.log('새 상담 추가됨:', createdConsultation);
      } else {
        console.error('새 상담 추가 실패');
      }
    } catch (error) {
      console.error('새 상담 추가 중 오류:', error);
    }
  };

  // 상담 삭제
  const deleteConsultation = async (id: number) => {
    if (!confirm('정말로 이 상담을 삭제하시겠습니까?')) return;

    try {
      const response = await apiDelete(`/api/consultations/${id}`);
      
      if (response.ok) {
        setConsultations(prev => prev.filter(c => c.id !== id));
        console.log('상담 삭제됨:', id);
      } else {
        console.error('상담 삭제 실패');
      }
    } catch (error) {
      console.error('상담 삭제 중 오류:', error);
    }
  };

  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태별 라벨
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'pending': return '대기';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchConsultations(),
        fetchInquiries(),
        fetchStudents()
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
          <div className="flex h-screen bg-gray-50">
        <Sidebar userRole="admin" />
        
        <div className="flex-1 flex flex-col">
        {/* 헤더 */}
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">상담 DB 관리</h1>
            <button
              onClick={addNewConsultation}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              새 상담 추가
            </button>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상담일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      참석자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상담 내용
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당 선생님
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시험 유형
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultations.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {consultation.consultation_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleContentClick(consultation, 'attendees')}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          {consultation.attendees || '클릭하여 입력'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <button
                          onClick={() => handleContentClick(consultation, 'content')}
                          className="text-left hover:text-blue-600 transition-colors max-w-xs truncate block"
                        >
                          {consultation.content || '클릭하여 입력'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleContentClick(consultation, 'teacher')}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          {consultation.teacher || '클릭하여 입력'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          onClick={() => handleContentClick(consultation, 'test_type')}
                          className="text-left hover:text-blue-600 transition-colors"
                        >
                          {consultation.test_type || '클릭하여 입력'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(consultation.registration_status)}`}>
                          {getStatusLabel(consultation.registration_status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => deleteConsultation(consultation.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* 사이드패널 */}
      {sidePanelOpen && selectedContent && (
        <ContentSidePanel
          isOpen={sidePanelOpen}
          onClose={() => setSidePanelOpen(false)}
          content={{
            title: selectedContent.title,
            text: selectedContent.text,
            metadata: {}
          }}
          isEditable={true}
          onSave={handleSidePanelSave}
        />
      )}
    </div>
  );
}

export default function ConsultationsPage() {
  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ConsultationsContent />
    </Suspense>
  );
} 