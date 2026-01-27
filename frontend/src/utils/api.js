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

// Mock activities data
const mockActivities = [
  {
    id: '1',
    date: new Date().toISOString(),
    platform: 'LeetCode',
    problemName: 'Two Sum',
    problemLink: 'https://leetcode.com/problems/two-sum',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 25,
    language: 'Python',
    tags: ['Array', 'Hash Table'],
    attempts: 1,
    score: 100,
    notes: 'Used hash map for O(n) solution',
  },
  {
    id: '2',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'Codeforces',
    problemName: 'Beautiful Matrix',
    problemLink: 'https://codeforces.com/problemset/problem/263/A',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 15,
    language: 'C++',
    tags: ['Implementation'],
    attempts: 1,
    score: 500,
  },
  {
    id: '3',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'LeetCode',
    problemName: 'Longest Substring Without Repeating Characters',
    problemLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    status: 'Solved',
    timeSpent: 45,
    language: 'JavaScript',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    attempts: 2,
    score: 100,
  },
  {
    id: '4',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'HackerRank',
    problemName: 'Array Manipulation',
    problemLink: 'https://www.hackerrank.com/challenges/crush',
    difficulty: 'Hard',
    status: 'Attempted',
    timeSpent: 60,
    language: 'Java',
    tags: ['Array', 'Prefix Sum'],
    attempts: 3,
  },
  {
    id: '5',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'CodeChef',
    problemName: 'ATM Problem',
    problemLink: 'https://www.codechef.com/problems/HS08TEST',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 10,
    language: 'Python',
    tags: ['Ad-Hoc'],
    attempts: 1,
    score: 100,
  },
  {
    id: '6',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'LeetCode',
    problemName: 'Median of Two Sorted Arrays',
    problemLink: 'https://leetcode.com/problems/median-of-two-sorted-arrays',
    difficulty: 'Hard',
    status: 'Solved',
    timeSpent: 90,
    language: 'Python',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    attempts: 4,
    score: 100,
  },
  {
    id: '7',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'LeetCode',
    problemName: 'Valid Parentheses',
    problemLink: 'https://leetcode.com/problems/valid-parentheses',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 20,
    language: 'JavaScript',
    tags: ['String', 'Stack'],
    attempts: 1,
    score: 100,
  },
  {
    id: '8',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'Codeforces',
    problemName: 'Watermelon',
    problemLink: 'https://codeforces.com/problemset/problem/4/A',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 5,
    language: 'C++',
    tags: ['Math', 'Brute Force'],
    attempts: 1,
    score: 500,
  },
];

// Mock get activities
const mockGetActivities = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        data: { 
          activities: mockActivities,
          total: mockActivities.length,
        } 
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

export const activityAPI = {
  getActivities: () => {
    return api
      .get('/activity/history')
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockGetActivities();
      });
  },
};

export default api;