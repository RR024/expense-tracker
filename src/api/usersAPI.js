const API_BASE_URL = import.meta.env.VITE_USERS_API_URL || 'http://localhost:8001';
const API_URL = `${API_BASE_URL}/api/users`;

// Fetch with timeout
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
};

export const usersAPI = {
  // Check if email already exists
  checkEmailExists: async (email) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/check-email/${email}`, {}, 3000);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking email:', error);
      return { exists: false };
    }
  },

  // Register new user
  signup: async (userData) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      }, 8000);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error during signup:', error);
      return { success: false, message: error.message === 'Request timeout' ? 'Server is taking too long. Please try again.' : 'Network error. Please try again.' };
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      }, 5000);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, message: error.message === 'Request timeout' ? 'Server is taking too long. Please try again.' : 'Network error. Please try again.' };
    }
  },

  // Health check
  checkHealth: async () => {
    try {
      const response = await fetchWithTimeout(`${API_URL}/health`, {}, 2000);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking health:', error);
      return { status: 'unhealthy' };
    }
  }
};

export default usersAPI;
