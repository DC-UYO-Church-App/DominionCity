const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    dateOfBirth?: string;
    address?: string;
  }) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async login(identifier: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request(`/auth/reset-password/verify?token=${encodeURIComponent(token)}`);
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(data: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfileImage(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/auth/profile/image`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Attendance
  async recordAttendance(data: {
    userId: string;
    eventId?: string;
    serviceDate: string;
    checkInTime?: string;
    status?: string;
    isFirstTimer?: boolean;
    notes?: string;
  }) {
    return this.request('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserAttendance(userId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/attendance/user/${userId}?${params}`);
  }

  async getAttendanceStats(userId: string) {
    return this.request(`/attendance/user/${userId}/stats`);
  }

  async getAdminDashboardStats() {
    return this.request('/admin/stats');
  }

  async createBookshopManager(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    address: string;
    password: string;
    confirmPassword: string;
    profileImage?: File | null;
  }) {
    if (data.profileImage) {
      const formData = new FormData();
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('email', data.email);
      formData.append('phoneNumber', data.phoneNumber);
      formData.append('address', data.address);
      formData.append('password', data.password);
      formData.append('confirmPassword', data.confirmPassword);
      formData.append('profileImage', data.profileImage);

      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/admin/bookshop-managers`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    }

    return this.request('/admin/bookshop-managers', {
      method: 'POST',
      body: JSON.stringify({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        address: data.address,
        password: data.password,
        confirmPassword: data.confirmPassword,
      }),
    });
  }

  async getBookshopManagers() {
    return this.request('/admin/bookshop-managers');
  }

  async deleteBookshopManager(id: string) {
    return this.request(`/admin/bookshop-managers/${id}`, {
      method: 'DELETE',
    });
  }

  async createBook(data: {
    title: string;
    author: string;
    category: string;
    price: number;
    quantity: number;
    summary?: string;
    coverFile?: File | null;
  }) {
    if (data.coverFile) {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('author', data.author);
      formData.append('category', data.category);
      formData.append('price', data.price.toString());
      formData.append('quantity', data.quantity.toString());
      if (data.summary) formData.append('summary', data.summary);
      formData.append('cover', data.coverFile);

      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    }

    return this.request('/books', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        author: data.author,
        category: data.category,
        price: data.price,
        quantity: data.quantity,
        summary: data.summary,
      }),
    });
  }

  async getBooks() {
    return this.request('/books');
  }

  async getBookStats() {
    return this.request('/books/stats');
  }

  async getBookSales() {
    return this.request('/books/sales');
  }

  async updateBook(
    id: string,
    data: {
      title?: string;
      author?: string;
      category?: string;
      price?: number;
      quantity?: number;
      summary?: string;
      coverFile?: File | null;
    }
  ) {
    if (data.coverFile) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.author) formData.append('author', data.author);
      if (data.category) formData.append('category', data.category);
      if (data.price !== undefined) formData.append('price', data.price.toString());
      if (data.quantity !== undefined) formData.append('quantity', data.quantity.toString());
      if (data.summary) formData.append('summary', data.summary);
      formData.append('cover', data.coverFile);

      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: 'PUT',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    }

    return this.request(`/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: data.title,
        author: data.author,
        category: data.category,
        price: data.price,
        quantity: data.quantity,
        summary: data.summary,
      }),
    });
  }

  async deleteBook(id: string) {
    return this.request(`/books/${id}`, {
      method: 'DELETE',
    });
  }

  async createSermon(data: {
    title: string;
    preacher: string;
    duration?: string;
    description?: string;
    videoUrl?: string;
    thumbnailFile?: File | null;
    category?: string;
  }) {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('preacher', data.preacher);
    if (data.duration) formData.append('duration', data.duration);
    if (data.description) formData.append('description', data.description);
    if (data.videoUrl) formData.append('videoUrl', data.videoUrl);
    if (data.category) formData.append('category', data.category);
    if (data.thumbnailFile) formData.append('thumbnail', data.thumbnailFile);

    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/sermons`, {
      method: 'POST',
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async updateSermon(
    id: string,
    data: { title?: string; preacher?: string; description?: string; videoUrl?: string; duration?: string }
  ) {
    return this.request(`/sermons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSermon(id: string) {
    return this.request(`/sermons/${id}`, {
      method: 'DELETE',
    });
  }

  // Events
  async createEvent(data: {
    title: string;
    description?: string;
    eventDate: string;
    address?: string;
    status?: 'scheduled' | 'cancelled';
    coverFile?: File | null;
  }) {
    if (data.coverFile) {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      formData.append('eventDate', data.eventDate);
      if (data.address) formData.append('address', data.address);
      if (data.status) formData.append('status', data.status);
      formData.append('cover', data.coverFile);

      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/events`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    }

    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEvents(filters?: { startDate?: string; endDate?: string; limit?: number; offset?: number }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return this.request(`/events?${params}`);
  }

  async updateEvent(
    id: string,
    data: {
      title?: string;
      description?: string;
      eventDate?: string;
      address?: string;
      status?: 'scheduled' | 'cancelled';
      coverFile?: File | null;
    }
  ) {
    if (data.coverFile) {
      const formData = new FormData();
      if (data.title) formData.append('title', data.title);
      if (data.description) formData.append('description', data.description);
      if (data.eventDate) formData.append('eventDate', data.eventDate);
      if (data.address) formData.append('address', data.address);
      if (data.status) formData.append('status', data.status);
      formData.append('cover', data.coverFile);

      const headers: Record<string, string> = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(`${API_BASE_URL}/events/${id}`, {
        method: 'PUT',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    }

    return this.request(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEvent(id: string) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // Tithes
  async recordTithe(data: {
    userId: string;
    amount: number;
    frequency: string;
    paymentDate?: string;
    paymentMethod: string;
    notes?: string;
  }) {
    return this.request('/tithes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserTithes(userId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return this.request(`/tithes/user/${userId}?${params}`);
  }

  async getTitheStats(userId: string) {
    return this.request(`/tithes/user/${userId}/stats`);
  }

  async getTitheByReceipt(receiptNumber: string) {
    return this.request(`/tithes/receipt/${receiptNumber}`);
  }

  // Sermons
  async getSermons(filters?: {
    preacher?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString());
      });
    }
    return this.request(`/sermons?${params}`);
  }

  async getSermon(id: string) {
    return this.request(`/sermons/${id}`);
  }

  async searchSermons(query: string) {
    return this.request(`/sermons/search?q=${encodeURIComponent(query)}`);
  }

  // Cell Groups
  async getCellGroups() {
    return this.request('/cell-groups');
  }

  async getCellGroup(id: string) {
    return this.request(`/cell-groups/${id}`);
  }

  async getNearestCellGroups(latitude: number, longitude: number, limit?: number) {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    if (limit) params.append('limit', limit.toString());
    return this.request(`/cell-groups/nearest?${params}`);
  }

  async getCellGroupMembers(id: string) {
    return this.request(`/cell-groups/${id}/members`);
  }

  // Cell join requests
  async sendCellJoinRequest(cellGroupId: string) {
    return this.request(`/cell-groups/${cellGroupId}/join-request`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  }

  async getMyJoinRequest() {
    return this.request('/cell-groups/join-requests/mine');
  }

  async getCellJoinRequests(cellGroupId: string) {
    return this.request(`/cell-groups/${cellGroupId}/join-requests`);
  }

  async acceptCellJoinRequest(requestId: string) {
    return this.request(`/cell-groups/join-requests/${requestId}/accept`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  async rejectCellJoinRequest(requestId: string) {
    return this.request(`/cell-groups/join-requests/${requestId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({}),
    });
  }

  // Team management (super-admin)
  async getTeamMembers() {
    return this.request('/admin/team');
  }

  async addTeamMember(data: { userId: string; roles: { type: string; detail?: string }[] }) {
    return this.request('/admin/team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMemberRoles(id: string, roles: { type: string; detail?: string }[]) {
    return this.request(`/admin/team/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ roles }),
    });
  }

  async removeTeamMember(id: string) {
    return this.request(`/admin/team/${id}`, { method: 'DELETE' });
  }

  async searchUsers(q?: string) {
    const params = q ? `?q=${encodeURIComponent(q)}` : '';
    return this.request(`/admin/users${params}`);
  }

  // Admin cell group management
  async getAdminCellGroups() {
    return this.request('/admin/cell-groups');
  }

  async createAdminCellGroup(data: {
    name: string;
    address: string;
    meetingDay: string;
    meetingTime: string;
    leaderId?: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.request('/admin/cell-groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminCellGroup(
    id: string,
    data: {
      name?: string;
      address?: string;
      meetingDay?: string;
      meetingTime?: string;
      leaderId?: string;
    }
  ) {
    return this.request(`/admin/cell-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminCellGroup(id: string) {
    return this.request(`/admin/cell-groups/${id}`, { method: 'DELETE' });
  }

  // Department management (super-admin)
  async getAdminDepartments() {
    return this.request('/admin/departments');
  }

  async createAdminDepartment(data: { name: string; hodId?: string; assistantId?: string }) {
    return this.request('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdminDepartment(
    id: string,
    data: { name?: string; hodId?: string; assistantId?: string }
  ) {
    return this.request(`/admin/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdminDepartment(id: string) {
    return this.request(`/admin/departments/${id}`, { method: 'DELETE' });
  }

  // Shared multipart helper for create/update with an optional cover image
  private async requestMultipart(
    endpoint: string,
    method: string,
    fields: Record<string, any>,
    fileField?: string,
    file?: File | null
  ) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    });
    if (fileField && file) {
      formData.append(fileField, file);
    }

    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      body: formData,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Ongoing Projects
  async getProjects() {
    return this.request("/projects");
  }

  async getProject(id: string) {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: {
    title: string;
    description?: string;
    targetAmount?: number;
    status?: string;
    coverFile?: File | null;
  }) {
    return this.requestMultipart(
      "/projects",
      "POST",
      {
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        status: data.status,
      },
      "cover",
      data.coverFile
    );
  }

  async updateProject(
    id: string,
    data: {
      title?: string;
      description?: string;
      targetAmount?: number;
      status?: string;
      coverFile?: File | null;
    }
  ) {
    return this.requestMultipart(
      `/projects/${id}`,
      "PUT",
      {
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        status: data.status,
      },
      "cover",
      data.coverFile
    );
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}`, { method: "DELETE" });
  }

  async giveToProject(id: string, data: { amount: number; isAnonymous?: boolean; note?: string }) {
    return this.request(`/projects/${id}/give`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Programs (National / State)
  async getPrograms(scope?: "national" | "state") {
    const params = scope ? `?scope=${scope}` : "";
    return this.request(`/programs${params}`);
  }

  async getProgram(id: string) {
    return this.request(`/programs/${id}`);
  }

  async createProgram(data: {
    title: string;
    description?: string;
    scope: "national" | "state";
    location?: string;
    startDate?: string;
    status?: string;
    coverFile?: File | null;
  }) {
    return this.requestMultipart(
      "/programs",
      "POST",
      {
        title: data.title,
        description: data.description,
        scope: data.scope,
        location: data.location,
        startDate: data.startDate,
        status: data.status,
      },
      "cover",
      data.coverFile
    );
  }

  async updateProgram(
    id: string,
    data: {
      title?: string;
      description?: string;
      scope?: "national" | "state";
      location?: string;
      startDate?: string;
      status?: string;
      coverFile?: File | null;
    }
  ) {
    return this.requestMultipart(
      `/programs/${id}`,
      "PUT",
      {
        title: data.title,
        description: data.description,
        scope: data.scope,
        location: data.location,
        startDate: data.startDate,
        status: data.status,
      },
      "cover",
      data.coverFile
    );
  }

  async deleteProgram(id: string) {
    return this.request(`/programs/${id}`, { method: "DELETE" });
  }

  async giveToProgram(id: string, data: { amount: number; isAnonymous?: boolean; note?: string }) {
    return this.request(`/programs/${id}/give`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Weekly Activities
  async getWeeklyActivities(activeOnly?: boolean) {
    const params = activeOnly ? "?active=true" : "";
    return this.request(`/weekly-activities${params}`);
  }

  async createWeeklyActivity(data: {
    title: string;
    description?: string;
    dayOfWeek: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    isActive?: boolean;
    coverFile?: File | null;
  }) {
    return this.requestMultipart(
      "/weekly-activities",
      "POST",
      {
        title: data.title,
        description: data.description,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isActive: data.isActive,
      },
      "cover",
      data.coverFile
    );
  }

  async updateWeeklyActivity(
    id: string,
    data: {
      title?: string;
      description?: string;
      dayOfWeek?: string;
      startTime?: string;
      endTime?: string;
      location?: string;
      isActive?: boolean;
      coverFile?: File | null;
    }
  ) {
    return this.requestMultipart(
      `/weekly-activities/${id}`,
      "PUT",
      {
        title: data.title,
        description: data.description,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        isActive: data.isActive,
      },
      "cover",
      data.coverFile
    );
  }

  async deleteWeeklyActivity(id: string) {
    return this.request(`/weekly-activities/${id}`, { method: "DELETE" });
  }

  // Giving (contributions + admin stats)
  async getGivingStats() {
    return this.request("/giving/stats");
  }

  async getContributions(filters?: { status?: string; sourceType?: string; sourceId?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const qs = params.toString();
    return this.request(`/giving/contributions${qs ? `?${qs}` : ""}`);
  }

  async getMyContributions() {
    return this.request("/giving/mine");
  }

  async confirmContribution(id: string) {
    return this.request(`/giving/contributions/${id}/confirm`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
  }

  async rejectContribution(id: string) {
    return this.request(`/giving/contributions/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({}),
    });
  }

  // Satellite Churches (super-admin) + member view
  async getSatelliteChurches() {
    return this.request("/satellite-churches");
  }

  async getSatelliteChurch(id: string) {
    return this.request(`/satellite-churches/${id}`);
  }

  async getMySatelliteChurches() {
    return this.request("/satellite-churches/mine");
  }

  async createSatelliteChurch(data: {
    name: string;
    location?: string;
    description?: string;
    assignedUserId?: string;
  }) {
    return this.request("/satellite-churches", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSatelliteChurch(
    id: string,
    data: { name?: string; location?: string; description?: string; assignedUserId?: string | null }
  ) {
    return this.request(`/satellite-churches/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSatelliteChurch(id: string) {
    return this.request(`/satellite-churches/${id}`, { method: "DELETE" });
  }

  logout() {
    this.clearToken();
  }
}

export const apiClient = new ApiClient();
