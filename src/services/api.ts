const API_BASE = '/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const base = window.location.origin + API_BASE + '/';
  const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = new URL(path, base);
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  const response = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  members: {
    getAll: () => request<any[]>('/members'),
    getById: (id: string) => request<any>(`/members/${id}`),
  },
  
  slots: {
    getAll: (params?: { start?: string; end?: string }) => 
      request<any[]>('/slots', { params }),
    getById: (id: string) => request<any>(`/slots/${id}`),
    create: (data: any) => 
      request<any>('/slots', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      request<any>(`/slots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => 
      request<void>(`/slots/${id}`, { method: 'DELETE' }),
  },
  
  availabilities: {
    getAll: (params?: { memberId?: string; date?: string }) => 
      request<any[]>('/availabilities', { params }),
    getByMember: (memberId: string) => 
      request<any[]>(`/availabilities?memberId=${memberId}`),
    create: (data: any) => 
      request<any>('/availabilities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => 
      request<any>(`/availabilities/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => 
      request<void>(`/availabilities/${id}`, { method: 'DELETE' }),
  },
  
  bookings: {
    getAll: (params?: { slotId?: string; memberId?: string }) => 
      request<any[]>('/bookings', { params }),
    getBySlot: (slotId: string) => 
      request<any[]>(`/bookings?slotId=${slotId}`),
    create: (data: any) => 
      request<any>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: string) => 
      request<any>(`/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) }),
  },
};
