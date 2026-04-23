export const api = {
  async fetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const response = await fetch(endpoint, { ...options, headers });
    
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
      throw new Error(error.message || 'Falha na requisição');
    }

    return response.json();
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
