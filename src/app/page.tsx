'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 로그인 페이지로 리다이렉트
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">영어 학원 관리 시스템</h1>
        <p className="text-gray-600">로그인 페이지로 이동 중...</p>
      </div>
    </div>
  );
}
