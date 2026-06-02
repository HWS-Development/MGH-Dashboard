import axios from 'axios';

/**
 * Laravel API client configured for Sanctum SPA authentication.
 * Pure HTTP-based auth — no WebSocket or real-time dependencies.
 */
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  withXSRFToken: true,
});

/**
 * Response interceptor:
 * - 419: CSRF token expired → refresh token and retry once
 * - 401: Unauthenticated → reject (handled by AuthContext)
 */
let isRefreshingCsrf = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // CSRF token mismatch — refresh and retry once
    if (error.response?.status === 419 && !originalRequest._retried) {
      originalRequest._retried = true;
      if (!isRefreshingCsrf) {
        isRefreshingCsrf = true;
        try {
          await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        } finally {
          isRefreshingCsrf = false;
        }
      }
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

/**
 * Get CSRF cookie from Sanctum before making state-changing requests.
 * Retries once on transient network errors.
 */
export async function getCsrfCookie() {
  try {
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
  } catch (error) {
    if (error.response?.status === 500 || error.code === 'ERR_NETWORK') {
      // Single retry after a brief delay for transient failures
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        return;
      } catch (retryError) {
        throw new Error(
          'Backend server is not reachable. Ensure Laravel is running on port 8000.'
        );
      }
    }
    throw error;
  }
}

/**
 * Auth methods that replace base44.auth.*
 */
export const auth = {
  async login(credentials) {
    await getCsrfCookie();
    const response = await api.post('/login', credentials);
    return response.data;
  },

  async register(data) {
    await getCsrfCookie();
    const response = await api.post('/register', data);
    return response.data;
  },

  async logout(redirectUrl = null) {
    try {
      await api.post('/logout');
    } catch (e) {
      // ignore
    }
    if (redirectUrl) {
      window.location.href = '/login';
    }
  },

  async me() {
    const response = await api.get('/user');
    return response.data;
  },

  redirectToLogin(fromUrl) {
    window.location.href = '/login';
  },

  async forgotPassword(email) {
    await getCsrfCookie();
    const response = await api.post('/forgot-password', { email });
    return response.data;
  },

  async resetPassword(data) {
    await getCsrfCookie();
    const response = await api.post('/reset-password', data);
    return response.data;
  },
};

/**
 * Entities helper - replaces base44.entities.*
 * Proxies CRUD operations to Laravel API endpoints.
 */
const entities = {
  pending_updates: {
    async filter(params = {}) {
      const response = await api.post('/data/query', {
        action: 'list',
        table: 'pending_updates',
        params,
      });
      return response.data?.data || [];
    },
    async create(data) {
      const response = await api.post('/data/query', {
        action: 'insert',
        table: 'pending_updates',
        data,
      });
      return response.data;
    },
    async update(id, data) {
      const response = await api.post('/data/query', {
        action: 'update',
        table: 'pending_updates',
        id,
        data,
      });
      return response.data;
    },
    async delete(id) {
      const response = await api.post('/data/query', {
        action: 'delete',
        table: 'pending_updates',
        id,
      });
      return response.data;
    },
  },
};

/**
 * Functions helper - replaces base44.functions.invoke()
 */
const functions = {
  async invoke(functionName, payload) {
    const response = await api.post(`/functions/${functionName}`, payload);
    return response.data;
  },
};

/**
 * Backward-compatible base44 object.
 * All existing code that imports { base44 } will continue to work.
 */
export const base44 = {
  auth,
  entities,
  functions,
};

export default api;
