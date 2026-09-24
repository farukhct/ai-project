import {
  User,
  CourtCase,
  CaseProceeding,
  CaseDocument,
  ResultOption,
  SystemSettings,
  DashboardData,
  Pagination,
  AuditLogItem
} from '../types.js';

const TOKEN_KEY = 'court_dairy_auth_token';
const USER_KEY = 'court_dairy_auth_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const u = localStorage.getItem(USER_KEY);
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch {
    return null;
  }
}

export function setStoredSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearStoredSession();
    // Dispatch custom event to let App know session expired
    window.dispatchEvent(new CustomEvent('auth:expired'));
    throw new Error('Session expired or unauthorized. Please log in.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

// API Methods
export const api = {
  // System status
  async getStatus(): Promise<{ setupRequired: boolean; totalUsers: number; totalCases: number; database: string }> {
    return request('/api/status');
  },

  // First-run admin setup
  async setupAdmin(payload: { username: string; password: string; fullName: string }): Promise<{ token: string; user: User }> {
    return request('/api/setup', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Auth
  async login(payload: { username: string; password: string }): Promise<{ token: string; user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      clearStoredSession();
    }
  },

  async getMe(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  // Dashboard
  async getDashboard(): Promise<DashboardData> {
    return request('/api/dashboard');
  },

  // Cases
  async getCases(params: Record<string, string | number> = {}): Promise<{ records: CourtCase[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, String(v));
      }
    });
    return request(`/api/cases?${query.toString()}`);
  },

  async getNextSerial(): Promise<{ nextSerial: number }> {
    return request('/api/cases/next-serial');
  },

  async getCase(id: number): Promise<{ case: CourtCase; proceedings: CaseProceeding[]; documents: CaseDocument[] }> {
    return request(`/api/cases/${id}`);
  },

  async createCase(payload: Partial<CourtCase>): Promise<{ caseId: number; serialNo: number; message: string }> {
    return request('/api/cases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCase(id: number, payload: Partial<CourtCase>): Promise<{ message: string }> {
    return request(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteCase(id: number): Promise<{ message: string }> {
    return request(`/api/cases/${id}`, {
      method: 'DELETE',
    });
  },

  async bulkImport(records: any[]): Promise<{ message: string; successCount: number; failedCount: number; errors: any[] }> {
    return request('/api/cases/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ records }),
    });
  },

  // Proceedings
  async addProceeding(caseId: number, payload: {
    hearingDate: string;
    businessRecorded: string;
    nextHearingDate?: string;
    benchNotes?: string;
    updateResult?: string;
  }): Promise<{ message: string }> {
    return request(`/api/cases/${caseId}/proceedings`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteProceeding(id: number): Promise<{ message: string }> {
    return request(`/api/proceedings/${id}`, {
      method: 'DELETE',
    });
  },

  // Documents
  async uploadDocument(caseId: number, payload: {
    title: string;
    documentType: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    base64Data: string;
  }): Promise<{ message: string; docId: number }> {
    return request(`/api/cases/${caseId}/documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async downloadDocument(id: number): Promise<{
    title: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    base64Data: string;
  }> {
    return request(`/api/documents/${id}/download`);
  },

  async deleteDocument(id: number): Promise<{ message: string }> {
    return request(`/api/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Results
  async getResults(): Promise<ResultOption[]> {
    return request('/api/results');
  },

  async addResult(resultName: string): Promise<{ message: string }> {
    return request('/api/results', {
      method: 'POST',
      body: JSON.stringify({ resultName }),
    });
  },

  async updateResult(id: number, payload: { resultName?: string; isActive?: boolean }): Promise<{ message: string }> {
    return request(`/api/results/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteResult(id: number): Promise<{ message: string }> {
    return request(`/api/results/${id}`, {
      method: 'DELETE',
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    return request('/api/users');
  },

  async createUser(payload: { username: string; password: string; fullName: string; role: string }): Promise<{ message: string }> {
    return request('/api/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateUser(id: number, payload: Partial<User & { password?: string }>): Promise<{ message: string }> {
    return request(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async deleteUser(id: number): Promise<{ message: string }> {
    return request(`/api/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Settings
  async getSettings(): Promise<SystemSettings> {
    return request('/api/settings');
  },

  async updateSettings(settings: Partial<SystemSettings>): Promise<{ message: string }> {
    return request('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Backup & Restore
  async restoreDatabase(base64Data: string, confirmation: string): Promise<{ message: string }> {
    return request('/api/backup/restore', {
      method: 'POST',
      body: JSON.stringify({ base64Data, confirmation }),
    });
  },

  async getAuditLogs(): Promise<AuditLogItem[]> {
    return request('/api/audit-logs');
  },
};
