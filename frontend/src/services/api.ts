const API_BASE = '/api/v1'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token')

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || 'An error occurred')
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: any) =>
    request<{ accessToken: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<{ user: any; student: any }>('/auth/me'),

  updateStudentProfile: (data: any) =>
    request<any>('/auth/student-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<void>('/auth/logout', { method: 'POST' }),
}

export const studentApi = {
  getProfile: () => request<{ student: any }>('/students/me'),
  createProfile: (data: any) =>
    request<{ student: any }>('/students/me', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: any) =>
    request<{ student: any }>('/students/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}

export const organizationApi = {
  getProfile: () => request<{ organization: any; documents: any[] }>('/organizations/me'),
  createProfile: (data: any) =>
    request<{ organization: any }>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: any) =>
    request<{ organization: any }>('/organizations/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submitForVerification: () =>
    request<{ organization: any }>('/organizations/me/verification', {
      method: 'POST',
    }),
  uploadDocument: (file: File, documentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return fetch(`${API_BASE}/organizations/me/documents`, {
      method: 'POST',
      headers,
      body: formData,
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((error) => {
          throw new Error(error.error?.message || 'Failed to upload document');
        });
      }
      return response.json();
    });
  },
}

export const opportunityApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return request<{ opportunities: any[]; pagination: any }>(`/opportunities${query}`)
  },
  get: (id: string) => request<{ opportunity: any }>(`/opportunities/${id}`),
  getFilters: () => request<{ filters: any }>('/opportunities/filters'),
  create: (data: any) =>
    request<{ opportunity: any }>('/opportunities/me', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMy: () => request<{ opportunities: any[] }>('/opportunities/me'),
  submit: (id: string) =>
    request<{ opportunity: any }>(`/opportunities/me/${id}/submit`, { method: 'POST' }),
  close: (id: string) =>
    request<{ opportunity: any }>(`/opportunities/me/${id}/close`, { method: 'POST' }),
}

export const applicationApi = {
  create: (data: any) =>
    request<{ application: any }>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listMy: () => request<{ applications: any[]; pagination: any }>('/applications/my'),
  listAll: (params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ''
    return request<{ applications: any[]; pagination: any }>(`/applications${query}`)
  },
  updateStatus: (id: string, data: any) =>
    request<{ application: any }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
}
