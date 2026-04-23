export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    // Suporte para URL absoluta em ambientes de hospedagem externa
    const baseUrl = window.location.origin.includes('github.io') 
      ? 'https://ais-pre-fwov3hkj5zlgfx4lrbfmxl-625006080676.us-east1.run.app' // Substitua pela sua URL real do Cloud Run
      : '';
    
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const contentType = response.headers.get('content-type');
    if (!response.ok) {
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.message || 'Falha na requisição');
      } else {
        const text = await response.text();
        console.error('Non-JSON Error Response:', text);
        throw new Error(`Erro do Servidor (${response.status}): O servidor não retornou JSON.`);
      }
    }

    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response;
  },

  async login(credentials: any) {
    const data = await this.fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    localStorage.setItem('token', data.token);
    return data;
  },

  async getMe() {
    return this.fetch('/api/me');
  },

  async getPosts() {
    return this.fetch('/api/posts');
  },

  async createPost(post: any) {
    return this.fetch('/api/posts', {
      method: 'POST',
      body: JSON.stringify(post)
    });
  },

  async deletePost(id: string) {
    return this.fetch(`/api/posts/${id}`, {
      method: 'DELETE'
    });
  },

  async updatePost(id: string, post: any) {
    return this.fetch(`/api/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(post)
    });
  },

  async getUsers() {
    return this.fetch('/api/admin/users');
  },

  async createUser(user: any) {
    return this.fetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  },

  async updateUser(id: string, user: any) {
    return this.fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user)
    });
  },

  async deleteUser(id: string) {
    return this.fetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });
  },

  async getCategories() {
    return this.fetch('/api/categories');
  },

  async createCategory(category: any) {
    return this.fetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category)
    });
  },

  async deleteCategory(id: string) {
    return this.fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
  }
};
