const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { data, headers = {}, ...rest } = options;
  const isFormData = data instanceof FormData;

  const reqHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (!isFormData && data !== undefined) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  let response = await fetch(url, {
    ...rest,
    headers: reqHeaders,
    body: isFormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
    credentials: 'include', // Includes httpOnly cookies
  });

  // Handle automatic token refresh on 401
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        // Retry initial request
        response = await fetch(url, {
          ...rest,
          headers: reqHeaders,
          body: isFormData ? data : data !== undefined ? JSON.stringify(data) : undefined,
          credentials: 'include',
        });
      }
    } catch {
      // ignore
    }
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = json.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', data }),
  put: <T = any>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', data }),
  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
