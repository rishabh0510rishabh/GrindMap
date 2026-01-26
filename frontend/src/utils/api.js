import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust based on your backend

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock authentication data for demo purposes
const mockUsers = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'Demo@123',
  },
];

// Mock login function
const mockLogin = (credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === credentials.email);
      if (user && user.password === credentials.password) {
        resolve({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            token: 'mock_token_' + Date.now(),
          },
        });
      } else {
        reject({
          response: {
            data: {
              message: 'Invalid email or password',
            },
          },
        });
      }
    }, 500);
  });
};

// Mock register function
const mockRegister = (userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if email already exists
      if (mockUsers.find(u => u.email === userData.email)) {
        reject({
          response: {
            data: {
              message: 'Email already registered',
            },
          },
        });
        return;
      }

      // Add new user
      const newUser = {
        id: String(mockUsers.length + 1),
        name: userData.name,
        email: userData.email,
        password: userData.password,
      };
      mockUsers.push(newUser);

      resolve({
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          token: 'mock_token_' + Date.now(),
        },
      });
    }, 500);
  });
};

export const authAPI = {
  login: (credentials) => {
    // Try real API first, fall back to mock
    return api
      .post('/auth/login', credentials)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockLogin(credentials);
      });
  },
  register: (userData) => {
    // Try real API first, fall back to mock
    return api
      .post('/auth/register', userData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockRegister(userData);
      });
  },
};

export default api;