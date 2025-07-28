'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ContentPopup from '@/components/ui/ContentPopup';
import ContentSidePanel from '@/components/ui/ContentSidePanel';

interface Withdrawal {
  id: number;
  withdrawal_date: string;
  student_name: string;
  withdrawal_reason: string;
  withdrawal_content: string;
  teacher?: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
  created_by_name?: string;
}

interface EditableWithdrawal extends Omit<Withdrawal, 'id'> {
  id?: number;
  isNew?: boolean;
  isEditing?: boolean;
  isSaving?: boolean;
  hasError?: boolean;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function WithdrawalsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [withdrawals, setWithdrawals] = useState<EditableWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{rowIndex: number, field: string} | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    text: string;
    metadata?: Record<string, any>;
    withdrawalId?: number;
    field?: string;
  } | null>(null);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // 사이드패널에서 내용 저장
  const handleSidePanelSave = async (newText: string) => {
    if (!selectedContent?.withdrawalId || !selectedContent?.field) return;

    try {
      const token = localStorage.getItem('token');
      const withdrawal = withdrawals.find(w => w.id === selectedContent.withdrawalId);
      if (!withdrawal) return;

      const updatedWithdrawal = { ...withdrawal, [selectedContent.field]: newText };

      const response = await fetch(`http://localhost:3001/api/withdrawals/${selectedContent.withdrawalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedWithdrawal)
      });

      if (response.ok) {
        setWithdrawals(prev => prev.map(w => 
          w.id === selectedContent.withdrawalId 
            ? { ...w, [selectedContent.field!]: newText }
            : w
        ));
        
        // 사이드패널 내용도 업데이트
        setSelectedContent(prev => prev ? { ...prev, text: newText } : null);
      }
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 로컬 스토리지에서 임시 데이터 복원
  const restoreTempData = () => {
    try {
      const tempData = localStorage.getItem('withdrawals_temp_data');
      if (tempData) {
        const parsed = JSON.parse(tempData);
        setWithdrawals(parsed);
        console.log('임시 데이터 복원됨:', parsed.length, '개 항목');
      }
    } catch (error) {
      console.error('임시 데이터 복원 실패:', error);
    }
  };

  // 임시 데이터를 로컬 스토리지에 저장
  const saveTempData = (data: EditableWithdrawal[]) => {
    try {
      localStorage.setItem('withdrawals_temp_data', JSON.stringify(data));
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
      fetchWithdrawals();
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [router]);

  // withdrawals 상태가 변경될 때마다 임시 저장
  useEffect(() => {
    if (isInitialized && withdrawals.length > 0) {
      saveTempData(withdrawals);
    }
  }, [withdrawals, isInitialized]);

  const fetchWithdrawals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/withdrawals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const processedData = data.map((withdrawal: Withdrawal) => ({
          ...withdrawal,
          isNew: false,
          isEditing: false,
          isSaving: false,
          hasError: false
        }));
        
        // 서버 데이터와 임시 데이터 병합
        const tempData = withdrawals.filter(w => w.isNew);
        const finalData = [...processedData, ...tempData];
        
        setWithdrawals(finalData);
        console.log('서버 데이터 로드됨:', processedData.length, '개 항목');
      } else {
        console.error('퇴원 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  };

  const addNewRow = () => {
    const newWithdrawal: EditableWithdrawal = {
      withdrawal_date: new Date().toISOString().slice(0, 10),
      student_name: '',
      withdrawal_reason: '',
      withdrawal_content: '',
      teacher: '',
      created_by: user?.id || 1,
      created_at: new Date().toISOString(),
      isNew: true,
      isEditing: true,
      isSaving: false,
      hasError: false
    };
    setWithdrawals(prev => [newWithdrawal, ...prev]);
    setEditingCell({ rowIndex: 0, field: 'student_name' });
    setEditingValue('');
  };

  const startEditing = (rowIndex: number, field: string, value: string) => {
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
      const withdrawal = withdrawals[rowIndex];
      if (withdrawal && (withdrawal as any)[field] !== value) {
        console.log('자동 저장:', field, value);
        saveCellWithValue(rowIndex, field, value);
      }
    }, 2000);

    setAutoSaveTimeout(timeout);
  };

  // 값과 함께 저장하는 함수
  const saveCellWithValue = async (rowIndex: number, field: string, value: string) => {
    const withdrawal = withdrawals[rowIndex];
    const updatedWithdrawal = { ...withdrawal, [field]: value };
    
    console.log('saveCellWithValue 호출:', { rowIndex, field, value, withdrawal });
    
    setWithdrawals(prev => prev.map((item, index) => 
      index === rowIndex 
        ? { ...item, [field]: value, isSaving: true }
        : item
    ));

    try {
      const token = localStorage.getItem('token');
      console.log('토큰:', token ? '존재' : '없음');
      
      if (withdrawal.isNew) {
        // 새 퇴원 생성 - 모든 필수 필드가 채워졌을 때만 저장
        const hasRequiredFields = updatedWithdrawal.withdrawal_date && 
                                updatedWithdrawal.student_name && 
                                updatedWithdrawal.withdrawal_reason;
        
        if (!hasRequiredFields) {
          console.log('필수 필드 부족, 로컬 상태만 업데이트');
          setWithdrawals(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: value, isSaving: false }
              : item
          ));
          setEditingCell(null);
          setEditingValue('');
          return;
        }

        console.log('새 퇴원 저장 시도:', updatedWithdrawal);
        const requestBody = {
          withdrawal_date: updatedWithdrawal.withdrawal_date,
          student_name: updatedWithdrawal.student_name,
          withdrawal_reason: updatedWithdrawal.withdrawal_reason,
          withdrawal_content: updatedWithdrawal.withdrawal_content,
          teacher: updatedWithdrawal.teacher,
          created_by: updatedWithdrawal.created_by
        };
        console.log('요청 본문:', requestBody);
        
        const response = await fetch('http://localhost:3001/api/withdrawals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const savedWithdrawal = await response.json();
          console.log('저장된 퇴원:', savedWithdrawal);
          setWithdrawals(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { 
                  ...savedWithdrawal, 
                  isNew: false, 
                  isSaving: false, 
                  hasError: false,
                  isEditing: false
                }
              : item
          ));
          
          // 저장 성공 시 임시 데이터 정리
          setTimeout(() => {
            const currentData = withdrawals.filter(w => !w.isNew);
            saveTempData(currentData);
          }, 100);
        } else {
          const errorText = await response.text();
          console.error('저장 실패 응답:', errorText);
          throw new Error(`저장 실패: ${response.status} ${errorText}`);
        }
      } else {
        // 기존 퇴원 수정
        console.log('기존 퇴원 수정:', withdrawal.id, field, value);
        const response = await fetch(`http://localhost:3001/api/withdrawals/${withdrawal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ [field]: value })
        });

        console.log('수정 응답 상태:', response.status);
        
        if (response.ok) {
          setWithdrawals(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: value, isSaving: false, hasError: false }
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
      setWithdrawals(prev => prev.map((item, index) => 
        index === rowIndex 
          ? { ...item, hasError: true, isSaving: false }
          : item
      ));
    }

    setEditingCell(null);
    setEditingValue('');
  };

  const saveCell = async (rowIndex: number, field: string) => {
    const withdrawal = withdrawals[rowIndex];
    const updatedWithdrawal = { ...withdrawal, [field]: editingValue };
    
    console.log('saveCell 호출:', { rowIndex, field, editingValue, withdrawal });
    
    setWithdrawals(prev => prev.map((item, index) => 
      index === rowIndex 
        ? { ...item, [field]: editingValue, isSaving: true }
        : item
    ));

    try {
      const token = localStorage.getItem('token');
      console.log('토큰:', token ? '존재' : '없음');
      
      if (withdrawal.isNew) {
        // 새 퇴원 생성 - 모든 필수 필드가 채워졌을 때만 저장
        const hasRequiredFields = updatedWithdrawal.withdrawal_date && 
                                updatedWithdrawal.student_name && 
                                updatedWithdrawal.withdrawal_reason;
        
        if (!hasRequiredFields) {
          console.log('필수 필드 부족, 로컬 상태만 업데이트');
          setWithdrawals(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: editingValue, isSaving: false }
              : item
          ));
          setEditingCell(null);
          setEditingValue('');
          return;
        }

        console.log('새 퇴원 저장 시도:', updatedWithdrawal);
        const requestBody = {
          withdrawal_date: updatedWithdrawal.withdrawal_date,
          student_name: updatedWithdrawal.student_name,
          withdrawal_reason: updatedWithdrawal.withdrawal_reason,
          withdrawal_content: updatedWithdrawal.withdrawal_content,
          teacher: updatedWithdrawal.teacher,
          created_by: updatedWithdrawal.created_by
        };
        console.log('요청 본문:', requestBody);
        
        const response = await fetch('http://localhost:3001/api/withdrawals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log('응답 상태:', response.status);
        
        if (response.ok) {
          const savedWithdrawal = await response.json();
          console.log('저장된 퇴원:', savedWithdrawal);
          setWithdrawals(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { 
                  ...savedWithdrawal, 
                  isNew: false, 
                  isSaving: false, 
                  hasError: false,
                  isEditing: false
                }
              : item
          ));
          
          // 저장 성공 시 임시 데이터 정리
          setTimeout(() => {
            const currentData = withdrawals.filter(w => !w.isNew);
            saveTempData(currentData);
          }, 100);
        } else {
          const errorText = await response.text();
          console.error('저장 실패 응답:', errorText);
          throw new Error(`저장 실패: ${response.status} ${errorText}`);
        }
      } else {
        // 기존 퇴원 수정
        console.log('기존 퇴원 수정:', withdrawal.id, field, editingValue);
        const response = await fetch(`http://localhost:3001/api/withdrawals/${withdrawal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ [field]: editingValue })
        });

        console.log('수정 응답 상태:', response.status);
        
        if (response.ok) {
          setWithdrawals(prev => prev.map((item, index) => 
            index === rowIndex 
              ? { ...item, [field]: editingValue, isSaving: false, hasError: false }
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
      setWithdrawals(prev => prev.map((item, index) => 
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

  const deleteWithdrawal = async (rowIndex: number) => {
    const withdrawal = withdrawals[rowIndex];
    if (!withdrawal.id) {
      setWithdrawals(prev => prev.filter((_, index) => index !== rowIndex));
      return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/withdrawals/${withdrawal.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setWithdrawals(prev => prev.filter((_, index) => index !== rowIndex));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

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
                <h1 className="text-2xl font-bold text-gray-900">퇴원 DB 관리</h1>
                <p className="text-sm text-gray-600">학원 퇴원 기록 관리</p>
              </div>
              <button
                onClick={addNewRow}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <span className="text-lg">+</span>
                새 퇴원 기록
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* 스프레드시트 스타일 테이블 */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        퇴원일자
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        학생명
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        퇴원사유
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        퇴원내용
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        담당강사
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal, rowIndex) => (
                      <tr 
                        key={withdrawal.id || `new-${rowIndex}`} 
                        className={`hover:bg-gray-50 transition-colors duration-200 ${
                          withdrawal.isNew ? 'bg-red-50' : ''
                        } ${withdrawal.hasError ? 'bg-red-50' : ''}`}
                      >
                        {/* 퇴원일자 */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'withdrawal_date' ? (
                            <input
                              type="date"
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'withdrawal_date', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'withdrawal_date')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'withdrawal_date', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-red-300 rounded focus:ring-2 focus:ring-red-500 text-sm"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200 text-sm"
                              onClick={() => startEditing(rowIndex, 'withdrawal_date', withdrawal.withdrawal_date ? new Date(withdrawal.withdrawal_date).toISOString().slice(0, 10) : '')}
                            >
                              {withdrawal.withdrawal_date ? new Date(withdrawal.withdrawal_date).toLocaleDateString() : '클릭하여 입력'}
                            </div>
                          )}
                        </td>

                        {/* 학생명 */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'student_name' ? (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'student_name', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'student_name')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'student_name', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-red-300 rounded focus:ring-2 focus:ring-red-500"
                              placeholder="학생 이름"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => startEditing(rowIndex, 'student_name', withdrawal.student_name)}
                            >
                              {withdrawal.student_name || '클릭하여 입력'}
                            </div>
                          )}
                        </td>

                        {/* 퇴원사유 */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'withdrawal_reason' ? (
                            <select
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'withdrawal_reason')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'withdrawal_reason', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                              autoFocus
                            >
                              <option value="">선택하세요</option>
                              <option value="개인사정">개인사정</option>
                              <option value="학업부진">학업부진</option>
                              <option value="이사">이사</option>
                              <option value="경제적 사정">경제적 사정</option>
                              <option value="기타">기타</option>
                            </select>
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => startEditing(rowIndex, 'withdrawal_reason', withdrawal.withdrawal_reason)}
                            >
                              {withdrawal.withdrawal_reason || '클릭하여 선택'}
                            </div>
                          )}
                        </td>

                        {/* 퇴원내용 */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          {editingCell?.rowIndex === rowIndex && editingCell?.field === 'withdrawal_content' ? (
                            <textarea
                              value={editingValue}
                              onChange={(e) => {
                                setEditingValue(e.target.value);
                                autoSave(rowIndex, 'withdrawal_content', e.target.value);
                              }}
                              onKeyDown={(e) => handleKeyDown(e, rowIndex, 'withdrawal_content')}
                              onBlur={() => {
                                if (autoSaveTimeout) {
                                  clearTimeout(autoSaveTimeout);
                                }
                                saveCellWithValue(rowIndex, 'withdrawal_content', editingValue);
                              }}
                              className="w-full px-2 py-1 border border-red-300 rounded focus:ring-2 focus:ring-red-500 resize-none"
                              placeholder="퇴원 상세 내용"
                              rows={2}
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => {
                                if (withdrawal.withdrawal_content) {
                                  setSelectedContent({
                                    title: `퇴원 내용 - ${withdrawal.student_name}`,
                                    text: withdrawal.withdrawal_content,
                                    metadata: {
                                      '학생명': withdrawal.student_name,
                                      '퇴원일': withdrawal.withdrawal_date ? new Date(withdrawal.withdrawal_date).toLocaleDateString() : '-',
                                      '퇴원사유': withdrawal.withdrawal_reason || '-',
                                      '담당강사': withdrawal.teacher || '-',
                                      '등록일': withdrawal.created_at ? new Date(withdrawal.created_at).toLocaleDateString() : '-'
                                    },
                                    withdrawalId: withdrawal.id,
                                    field: 'withdrawal_content'
                                  });
                                  setSidePanelOpen(true);
                                } else {
                                  startEditing(rowIndex, 'withdrawal_content', withdrawal.withdrawal_content);
                                }
                              }}
                            >
                              {withdrawal.withdrawal_content ? (
                                <div className="text-left">
                                  {withdrawal.withdrawal_content.length > 30 
                                    ? `${withdrawal.withdrawal_content.substring(0, 30)}...` 
                                    : withdrawal.withdrawal_content
                                  }
                                </div>
                              ) : (
                                '클릭하여 입력'
                              )}
                            </div>
                          )}
                        </td>

                        {/* 담당강사 */}
                        <td className="px-4 py-3 whitespace-nowrap text-center">
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
                              className="w-full px-2 py-1 border border-red-300 rounded focus:ring-2 focus:ring-red-500"
                              placeholder="담당 강사명"
                              autoFocus
                            />
                          ) : (
                            <div 
                              className="cursor-pointer hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200"
                              onClick={() => startEditing(rowIndex, 'teacher', withdrawal.teacher || '')}
                            >
                              {withdrawal.teacher || '클릭하여 입력'}
                            </div>
                          )}
                        </td>

                        {/* 작업 */}
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => deleteWithdrawal(rowIndex)}
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
            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-sm font-medium text-red-900 mb-2">💡 사용법</h3>
              <ul className="text-xs text-red-800 space-y-1">
                <li>• 셀을 클릭하여 바로 입력/수정할 수 있습니다</li>
                <li>• Enter: 저장, Esc: 취소</li>
                <li>• 입력 후 2초 뒤 자동으로 저장됩니다</li>
                <li>• 퇴원사유는 드롭다운으로 선택 가능합니다</li>
                <li>• 퇴원내용은 상세한 퇴원 사유를 입력할 수 있습니다</li>
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