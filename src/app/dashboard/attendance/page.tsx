'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { apiGet } from '@/lib/api';

interface AttendanceCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
}

interface AttendanceGroup {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  year?: number;
  semester?: number;
  exam_type?: string;
  round_number?: number;
  month?: number;
  created_at: string;
  category_name?: string;
}

export default function AttendancePage() {
  const [categories, setCategories] = useState<AttendanceCategory[]>([]);
  const [groups, setGroups] = useState<{ [key: number]: AttendanceGroup[] }>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await apiGet('/api/newAttendance/categories');
      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
        // 첫 번째 카테고리를 자동으로 확장
        if (categoriesData.length > 0) {
          toggleCategory(categoriesData[0].id);
        }
      }
    } catch (error) {
      console.error('카테고리 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async (categoryId: number) => {
    try {
      const response = await apiGet(`/api/newAttendance/categories/${categoryId}/groups`);
      if (response.ok) {
        const groupsData = await response.json();
        setGroups(prev => ({
          ...prev,
          [categoryId]: groupsData
        }));
      }
    } catch (error) {
      console.error('그룹 조회 오류:', error);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
      // 그룹이 아직 로드되지 않았다면 로드
      if (!groups[categoryId]) {
        fetchGroups(categoryId);
      }
    }
    setExpandedCategories(newExpanded);
  };

  const handleGroupClick = (groupId: number, groupName: string) => {
    router.push(`/dashboard/attendance/groups/${groupId}?name=${encodeURIComponent(groupName)}`);
  };

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case '월간평가': return '📊';
      case '서킷 모의고사': return '🔄';
      case '최종 파이널': return '🎯';
      case '예비고사': return '📚';
      default: return '📋';
    }
  };

  const getGroupDisplayInfo = (group: AttendanceGroup) => {
    const { category_name, name, year, month, semester, exam_type, round_number } = group;
    
    let additionalInfo = '';
    if (category_name === '월간평가' && year && month) {
      additionalInfo = `${year}년 ${month}월`;
    } else if (category_name === '서킷 모의고사' && round_number) {
      additionalInfo = `${round_number}회차`;
    } else if (category_name === '최종 파이널' && round_number) {
      additionalInfo = `${round_number}회차`;
    } else if (category_name === '예비고사' && year && semester && exam_type) {
      additionalInfo = `${year}학년도 ${semester}학기 ${exam_type}`;
    }

    return { name, additionalInfo };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar userRole="director" />
        <div className="flex-1 p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">출석부 데이터를 불러오는 중...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">출석부 관리</h1>
          <p className="text-gray-600">계층적 출석부 시스템으로 체계적인 출석 관리를 제공합니다.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="space-y-4">
              {categories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 카테고리 헤더 */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getCategoryIcon(category.name)}</span>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-600">{category.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {groups[category.id] && (
                        <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
                          {groups[category.id].length}개 그룹
                        </span>
                      )}
                      <svg 
                        className={`w-5 h-5 transition-transform ${expandedCategories.has(category.id) ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* 그룹 목록 */}
                  {expandedCategories.has(category.id) && (
                    <div className="border-t border-gray-200">
                      {groups[category.id] ? (
                        groups[category.id].length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
                            {groups[category.id].map((group) => {
                              const { name, additionalInfo } = getGroupDisplayInfo(group);
                              return (
                                <button
                                  key={group.id}
                                  onClick={() => handleGroupClick(group.id, group.name)}
                                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 text-left group"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                      {name}
                                    </h4>
                                    <svg 
                                      className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" 
                                      fill="none" 
                                      stroke="currentColor" 
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                  {additionalInfo && (
                                    <p className="text-sm text-gray-600">{additionalInfo}</p>
                                  )}
                                  <div className="mt-3 flex items-center text-xs text-gray-500">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {new Date(group.created_at).toLocaleDateString('ko-KR')}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>이 카테고리에는 아직 그룹이 없습니다.</p>
                          </div>
                        )
                      ) : (
                        <div className="p-6 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                          <p className="mt-2 text-gray-600">그룹을 불러오는 중...</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">출석부 시스템 안내</h3>
              <div className="text-blue-800 space-y-1">
                <p>• <strong>월간평가:</strong> 매월 진행되는 정기 평가의 출석 관리</p>
                <p>• <strong>서킷 모의고사:</strong> 13~22회차 서킷 모의고사 출석 관리</p>
                <p>• <strong>최종 파이널:</strong> 1~20회차 최종 파이널 모의고사 출석 관리</p>
                <p>• <strong>예비고사:</strong> 학기별 중간고사/기말고사 학교별 출석 관리</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 