'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import ContentSidePanel from '@/components/ui/ContentSidePanel';

interface Inquiry {
  id?: number;
  name: string;
  phone: string;
  inquiry_source: string;
  inquiry_content: string;
  status: string;
  scheduled_date?: string;
  memo?: string;
  created_at: string;
  isNew?: boolean;
  editing?: boolean;
  tempId?: string;
}

interface User {
  id: number;
  name: string;
  role: string;
}

export default function InquiriesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<{
    title: string;
    text: string;
    metadata?: Record<string, any>;
    inquiryId?: number;
    field?: string;
  } | null>(null);
  const [editingMemo, setEditingMemo] = useState<string | number | null>(null);
  const [editingField, setEditingField] = useState<{
    identifier: string | number;
    field: string;
  } | null>(null);
  const router = useRouter();

  // 사이드패널에서 내용 저장
  const handleSidePanelSave = async (newText: string) => {
    if (!selectedContent?.inquiryId || !selectedContent?.field) return;

    try {
      const token = localStorage.getItem('token');
      const inquiry = inquiries.find(i => i.id === selectedContent.inquiryId);
      if (!inquiry) return;

      const updatedInquiry = { ...inquiry, [selectedContent.field]: newText };

      const response = await fetch(`http://localhost:3001/api/inquiries/${selectedContent.inquiryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedInquiry)
      });

      if (response.ok) {
        setInquiries(prev => prev.map(i => 
          i.id === selectedContent.inquiryId 
            ? { ...i, [selectedContent.field!]: newText }
            : i
        ));
        
        // 사이드패널 내용도 업데이트
        setSelectedContent(prev => prev ? { ...prev, text: newText } : null);
      }
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  // 문의 삭제
  const deleteInquiry = async (id: number | string) => {
    if (!confirm('정말로 이 문의를 삭제하시겠습니까?')) return;

    try {
      const token = localStorage.getItem('token');
      
      // 새로운 문의(id가 string인 경우)는 API 호출 없이 바로 삭제
      if (typeof id === 'string') {
        setInquiries(prev => prev.filter(i => (i.tempId || i.id) !== id));
        return;
      }

      const response = await fetch(`http://localhost:3001/api/inquiries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setInquiries(prev => prev.filter(i => i.id !== id));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제 중 오류가 발생했습니다.');
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
      fetchInquiries();
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

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
        setInquiries(data.map((inquiry: any) => ({
          ...inquiry,
          isNew: false,
          editing: false
        })));
      } else {
        console.error('문의 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('API 호출 오류:', error);
    }
  };

  const addNewInquiry = () => {
    const newInquiry: Inquiry = {
      tempId: Date.now().toString(),
      name: '',
      phone: '',
      inquiry_source: '전화',
      inquiry_content: '',
      status: 'new',
      memo: '',
      created_at: new Date().toISOString(),
      isNew: true,
      editing: false
    };
    setInquiries(prev => [newInquiry, ...prev]);
    // 새 문의 추가 시 이름 필드부터 편집 시작
    setTimeout(() => {
      setEditingField({ identifier: newInquiry.tempId!, field: 'name' });
    }, 100);
  };

  const saveInquiry = async (inquiry: Inquiry) => {
    if (!inquiry.name || !inquiry.phone || !inquiry.inquiry_content || !inquiry.inquiry_source) {
      return; // 필수 필드가 없으면 저장하지 않음
    }

    try {
      const token = localStorage.getItem('token');
      
      if (inquiry.isNew) {
        // 새 문의 생성
        const response = await fetch('http://localhost:3001/api/inquiries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: inquiry.name,
            phone: inquiry.phone,
            inquiry_source: inquiry.inquiry_source,
            inquiry_content: inquiry.inquiry_content,
            status: inquiry.status,
            memo: inquiry.memo
          })
        });

        if (response.ok) {
          const savedInquiry = await response.json();
          setInquiries(prev => prev.map(item => 
            item.tempId === inquiry.tempId 
              ? { ...savedInquiry, isNew: false, editing: false }
              : item
          ));
        }
      } else {
        // 기존 문의 수정
        const response = await fetch(`http://localhost:3001/api/inquiries/${inquiry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(inquiry)
        });

        if (response.ok) {
          setInquiries(prev => prev.map(item => 
            item.id === inquiry.id 
              ? { ...inquiry, editing: false }
              : item
          ));
        }
      }
    } catch (error) {
      console.error('저장 오류:', error);
    }
  };

  const updateInquiry = (identifier: string | number, field: string, value: string) => {
    setInquiries(prev => prev.map(item => {
      const isTarget = item.id === identifier || item.tempId === identifier;
      if (isTarget) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, identifier: string | number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inquiry = inquiries.find(item => item.id === identifier || item.tempId === identifier);
      if (inquiry) {
        saveInquiry(inquiry);
      }
    } else if (e.key === 'Escape') {
      setInquiries(prev => prev.map(item => {
        const isTarget = item.id === identifier || item.tempId === identifier;
        return isTarget ? { ...item, editing: false } : item;
      }));
    }
  };

  const handleBlur = (identifier: string | number) => {
    const inquiry = inquiries.find(item => item.id === identifier || item.tempId === identifier);
    if (inquiry) {
      saveInquiry(inquiry);
    }
  };

  // input/textarea 스타일에서 focus 효과 완전히 제거하고 크기 고정
  const inputClassName = "w-full px-2 py-1 border border-blue-300 rounded outline-none ring-0 focus:ring-0 focus:border-blue-300 transition-none";
  const textareaClassName = "w-full px-2 py-1 border border-blue-300 rounded outline-none resize-none ring-0 focus:ring-0 focus:border-blue-300 transition-none";
  const selectClassName = "w-full px-2 py-1 border border-blue-300 rounded outline-none ring-0 focus:ring-0 focus:border-blue-300 transition-none";

  // 메모 필드 onClick 로직 수정
  const handleMemoClick = (inquiry: Inquiry, identifier: string | number) => {
    if (editingMemo === identifier) {
      // 이미 편집 중이면 아무것도 하지 않음
      return;
    } else if (inquiry.memo && inquiry.memo.length > 50) {
      // 편집 모드가 아니고 긴 텍스트인 경우 사이드 패널 열기
      setSelectedContent({
        title: `${inquiry.name}님의 메모`,
        text: inquiry.memo,
        metadata: {
          연락처: inquiry.phone,
          등록일: new Date(inquiry.created_at).toLocaleDateString()
        },
        inquiryId: inquiry.id,
        field: 'memo'
      });
      setSidePanelOpen(true);
    } else {
      // 메모 필드만 편집 모드로 변경
      setEditingMemo(identifier);
    }
  };

  const handleMemoBlur = (identifier: string | number) => {
    const inquiry = inquiries.find(item => item.id === identifier || item.tempId === identifier);
    if (inquiry) {
      saveInquiry(inquiry);
    }
    setEditingMemo(null);
  };

  const handleMemoKeyDown = (e: React.KeyboardEvent, identifier: string | number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inquiry = inquiries.find(item => item.id === identifier || item.tempId === identifier);
      if (inquiry) {
        saveInquiry(inquiry);
      }
      setEditingMemo(null);
    } else if (e.key === 'Escape') {
      setEditingMemo(null);
    }
  };



  const startFieldEditing = (identifier: string | number, field: string) => {
    setEditingField({ identifier, field });
  };

  const stopFieldEditing = () => {
    if (editingField) {
      const inquiry = inquiries.find(item => 
        item.id === editingField.identifier || item.tempId === editingField.identifier
      );
      if (inquiry) {
        saveInquiry(inquiry);
      }
    }
    setEditingField(null);
  };

  const handleFieldKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      stopFieldEditing();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const isFieldEditing = (identifier: string | number, field: string) => {
    return editingField?.identifier === identifier && editingField?.field === field;
  };

  const filteredInquiries = inquiries.filter(inquiry => {
    if (filterStatus === 'all') return true;
    return inquiry.status === filterStatus;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-screen">로딩 중...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={user?.role || 'guest'} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">유입 DB 관리</h1>
            <button
              onClick={addNewInquiry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + 문의 추가
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="mb-4">
            <div className="flex space-x-2">
              {['all', 'new', 'contacted', 'scheduled', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? '전체' : 
                   status === 'new' ? '신규' :
                   status === 'contacted' ? '연락완료' :
                   status === 'scheduled' ? '상담예약' : '상담완료'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문의경로</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">문의내용</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">메모</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => {
                  const identifier = inquiry.id || inquiry.tempId!;
                  
                  return (
                    <tr key={identifier} className={inquiry.isNew ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                      {/* 이름 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'name') ? (
                          <input
                            type="text"
                            value={inquiry.name}
                            onChange={(e) => updateInquiry(identifier, 'name', e.target.value)}
                            onKeyDown={(e) => handleFieldKeyDown(e)}
                            onBlur={() => stopFieldEditing()}
                            className={inputClassName}
                            placeholder="이름 입력"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => startFieldEditing(identifier, 'name')}
                          >
                            {inquiry.name || '클릭하여 입력'}
                          </div>
                        )}
                      </td>

                      {/* 연락처 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'phone') ? (
                          <input
                            type="tel"
                            value={inquiry.phone}
                            onChange={(e) => updateInquiry(identifier, 'phone', e.target.value)}
                            onKeyDown={(e) => handleFieldKeyDown(e)}
                            onBlur={() => stopFieldEditing()}
                            className={inputClassName}
                            placeholder="연락처 입력"
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => startFieldEditing(identifier, 'phone')}
                          >
                            {inquiry.phone || '클릭하여 입력'}
                          </div>
                        )}
                      </td>

                      {/* 문의경로 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isFieldEditing(identifier, 'inquiry_source') ? (
                          <select
                            value={inquiry.inquiry_source}
                            onChange={(e) => updateInquiry(identifier, 'inquiry_source', e.target.value)}
                            onKeyDown={(e) => handleFieldKeyDown(e)}
                            onBlur={() => stopFieldEditing()}
                            className={inputClassName}
                            autoFocus
                          >
                            <option value="전화">전화</option>
                            <option value="워크인">워크인</option>
                            <option value="네이버스마트플레이스">네이버스마트플레이스</option>
                            <option value="기타">기타</option>
                          </select>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => startFieldEditing(identifier, 'inquiry_source')}
                          >
                            {inquiry.inquiry_source}
                          </div>
                        )}
                      </td>

                      {/* 문의내용 */}
                      <td className="px-4 py-3">
                        {isFieldEditing(identifier, 'inquiry_content') ? (
                          <textarea
                            value={inquiry.inquiry_content}
                            onChange={(e) => updateInquiry(identifier, 'inquiry_content', e.target.value)}
                            onKeyDown={(e) => handleFieldKeyDown(e)}
                            onBlur={() => stopFieldEditing()}
                            className={textareaClassName}
                            placeholder="문의내용 입력"
                            rows={2}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => {
                              if (inquiry.inquiry_content && inquiry.inquiry_content.length > 50) {
                                setSelectedContent({
                                  title: `${inquiry.name}님의 문의내용`,
                                  text: inquiry.inquiry_content,
                                  metadata: {
                                    연락처: inquiry.phone,
                                    문의경로: inquiry.inquiry_source,
                                    등록일: new Date(inquiry.created_at).toLocaleDateString()
                                  },
                                  inquiryId: inquiry.id,
                                  field: 'inquiry_content'
                                });
                                setSidePanelOpen(true);
                              } else {
                                startFieldEditing(identifier, 'inquiry_content');
                              }
                            }}
                          >
                            {inquiry.inquiry_content 
                              ? inquiry.inquiry_content.length > 50 
                                ? inquiry.inquiry_content.substring(0, 50) + '...'
                                : inquiry.inquiry_content
                              : '클릭하여 입력'
                            }
                          </div>
                        )}
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <select
                          value={inquiry.status}
                          onChange={(e) => updateInquiry(identifier, 'status', e.target.value)}
                          onKeyDown={(e) => handleFieldKeyDown(e)}
                          onBlur={() => stopFieldEditing()}
                          className={selectClassName}
                        >
                          <option value="new">신규</option>
                          <option value="contacted">연락완료</option>
                          <option value="scheduled">상담예약</option>
                          <option value="completed">상담완료</option>
                        </select>
                      </td>

                      {/* 메모 */}
                      <td className="px-4 py-3">
                        {editingMemo === identifier ? (
                          <textarea
                            value={inquiry.memo || ''}
                            onChange={(e) => updateInquiry(identifier, 'memo', e.target.value)}
                            onKeyDown={(e) => handleMemoKeyDown(e, identifier)}
                            onBlur={() => handleMemoBlur(identifier)}
                            className={textareaClassName}
                            placeholder="메모 입력"
                            rows={2}
                            autoFocus
                          />
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                            onClick={() => handleMemoClick(inquiry, identifier)}
                          >
                            {inquiry.memo 
                              ? inquiry.memo.length > 50 
                                ? inquiry.memo.substring(0, 50) + '...'
                                : inquiry.memo
                              : '클릭하여 입력'
                            }
                          </div>
                        )}
                      </td>

                      {/* 등록일 */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </td>

                      {/* 작업 (삭제 버튼) */}
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteInquiry(identifier)}
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
          </div>

          {inquiries.some(inquiry => inquiry.editing) && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="text-blue-800">💡 사용법</span>
              </div>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• 필수 필드(이름, 연락처, 문의경로, 문의내용)를 모두 입력하면 자동으로 저장됩니다</li>
                <li>• Enter: 저장, Esc: 취소</li>
                <li>• 입력 후 2초 뒤 자동으로 저장됩니다</li>
                <li>• 상태는 드롭다운으로 변경 가능합니다</li>
                <li>• 새 문의는 자동으로 편집 모드로 시작됩니다</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {selectedContent && (
        <ContentSidePanel
          isOpen={sidePanelOpen}
          onClose={() => setSidePanelOpen(false)}
          content={selectedContent}
          isEditable={true}
          onSave={handleSidePanelSave}
        />
      )}
    </div>
  );
} 