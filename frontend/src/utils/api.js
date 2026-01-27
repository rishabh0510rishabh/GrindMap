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

// Mock update profile function
const mockUpdateProfile = (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === localStorage.getItem('userEmail'));
      if (user) {
        user.name = userData.name;
        user.email = userData.email;
        user.username = userData.username;
        user.bio = userData.bio;
      }
      resolve({
        data: {
          id: user?.id || '1',
          name: userData.name,
          email: userData.email,
          username: userData.username,
          bio: userData.bio,
          token: localStorage.getItem('token'),
        },
      });
    }, 500);
  });
};

// Mock change password function
const mockChangePassword = (passwordData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === localStorage.getItem('userEmail'));
      if (!user || user.password !== passwordData.currentPassword) {
        reject({
          response: {
            data: {
              message: 'Current password is incorrect',
            },
          },
        });
        return;
      }
      user.password = passwordData.newPassword;
      resolve({ data: { message: 'Password changed successfully' } });
    }, 500);
  });
};

// Mock delete account function
const mockDeleteAccount = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userEmail = localStorage.getItem('userEmail');
      const index = mockUsers.findIndex(u => u.email === userEmail);
      if (index > -1) {
        mockUsers.splice(index, 1);
      }
      resolve({ data: { message: 'Account deleted successfully' } });
    }, 500);
  });
};

// Mock settings storage
let mockSettings = {
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    dailyReminders: true,
    weeklyDigest: true,
    streakReminders: true,
    reminderFrequency: 'daily',
    reminderTime: '09:00',
  },
  privacy: {
    profileVisibility: 'public',
    showEmail: false,
    showStats: true,
    showBadges: true,
    showActivity: true,
    allowDataSharing: false,
    allowAnalytics: true,
  },
  display: {
    theme: 'light',
    dashboardLayout: 'grid',
    showAnimations: true,
    compactMode: false,
    fontSize: 'medium',
    language: 'en',
  },
  platform: {
    autoSync: true,
    syncFrequency: 'hourly',
    notifyOnSync: false,
    connectedPlatforms: [],
  },
  security: {
    twoFactorEnabled: false,
    sessionTimeout: 30,
    showActiveSessions: true,
    loginAlerts: true,
  },
  activeSessions: [
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, USA',
      lastActive: '2 minutes ago',
      current: true,
    },
  ],
};

// Mock get settings
const mockGetSettings = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data: mockSettings });
    }, 500);
  });
};

// Mock update settings
const mockUpdateSettings = (settingsData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSettings = { ...mockSettings, ...settingsData };
      resolve({ data: { message: 'Settings updated successfully', settings: mockSettings } });
    }, 500);
  });
};

// Mock export data
const mockExportData = (format) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userData = {
        user: JSON.parse(localStorage.getItem('user') || '{}'),
        settings: mockSettings,
        exportDate: new Date().toISOString(),
        format: format,
      };
      resolve({ data: userData });
    }, 500);
  });
};

// Mock terminate session
const mockTerminateSession = (sessionId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSettings.activeSessions = mockSettings.activeSessions.filter(s => s.id !== sessionId);
      resolve({ data: { message: 'Session terminated successfully' } });
    }, 500);
  });
};

// Mock toggle 2FA
const mockToggle2FA = (enabled) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockSettings.security.twoFactorEnabled = enabled;
      resolve({ data: { message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully` } });
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
  updateProfile: (userData) => {
    // Try real API first, fall back to mock
    return api
      .put('/user/profile', userData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockUpdateProfile(userData);
      });
  },
  changePassword: (passwordData) => {
    // Try real API first, fall back to mock
    return api
      .post('/user/change-password', passwordData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockChangePassword(passwordData);
      });
  },
  deleteAccount: () => {
    // Try real API first, fall back to mock
    return api
      .delete('/user/account')
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockDeleteAccount();
      });
  },
};

export const settingsAPI = {
  getSettings: () => {
    return api
      .get('/user/settings')
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockGetSettings();
      });
  },
  updateSettings: (settingsData) => {
    return api
      .put('/user/settings', settingsData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockUpdateSettings(settingsData);
      });
  },
  exportData: (format) => {
    return api
      .get(`/user/export?format=${format}`)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockExportData(format);
      });
  },
  terminateSession: (sessionId) => {
    return api
      .delete(`/user/sessions/${sessionId}`)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockTerminateSession(sessionId);
      });
  },
  toggle2FA: (enabled) => {
    return api
      .post('/user/2fa', { enabled })
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockToggle2FA(enabled);
      });
  },
};

export default api;