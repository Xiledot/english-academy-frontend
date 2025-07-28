// API 기본 URL 설정
const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

// 공통 fetch 함수
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}${endpoint}`;
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers: defaultHeaders,
  });
};

// GET 요청
export const apiGet = (endpoint: string) => {
  return apiFetch(endpoint, { method: 'GET' });
};

// POST 요청
export const apiPost = (endpoint: string, data?: any) => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// PUT 요청
export const apiPut = (endpoint: string, data?: any) => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

// DELETE 요청
export const apiDelete = (endpoint: string) => {
  return apiFetch(endpoint, { method: 'DELETE' });
};

// PATCH 요청
export const apiPatch = (endpoint: string, data?: any) => {
  return apiFetch(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}; 