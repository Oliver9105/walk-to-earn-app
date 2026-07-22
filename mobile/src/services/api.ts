import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:3000/api'; // Android emulator localhost
// For physical device, use your machine's IP: http://192.168.x.x:3000/api

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          // Trigger logout event
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(data: { phoneNumber: string; fullName: string; password: string; email?: string }) {
    const response = await this.client.post('/auth/register', data);
    if (response.data.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async login(data: { phoneNumber: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    if (response.data.data?.token) {
      await AsyncStorage.setItem('auth_token', response.data.data.token);
    }
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.patch('/auth/profile', data);
    return response.data;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    const response = await this.client.post('/auth/change-password', data);
    return response.data;
  }

  // Wallet
  async getWalletBalance() {
    const response = await this.client.get('/wallet/balance');
    return response.data;
  }

  async getTransactions(params?: { page?: number; limit?: number; type?: string; status?: string }) {
    const response = await this.client.get('/wallet/transactions', { params });
    return response.data;
  }

  async withdraw(data: { phoneNumber: string; amount: number }) {
    const response = await this.client.post('/wallet/withdraw', data);
    return response.data;
  }

  // M-Pesa
  async deposit(data: { phoneNumber: string; amount: number; description?: string }) {
    const response = await this.client.post('/mpesa/deposit', data);
    return response.data;
  }

  async getTransactionStatus(transactionId: string) {
    const response = await this.client.get(`/mpesa/status/${transactionId}`);
    return response.data;
  }

  // Challenges
  async getChallenges(params?: { status?: string; category?: string; difficulty?: string; featured?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/challenges', { params });
    return response.data;
  }

  async getChallenge(id: string) {
    const response = await this.client.get(`/challenges/${id}`);
    return response.data;
  }

  async enrollInChallenge(data: { challengeId: string; useGuarantee?: boolean }) {
    const response = await this.client.post('/challenges/enroll', data);
    return response.data;
  }

  async getMyEnrollments(status?: string) {
    const response = await this.client.get('/challenges/my/enrolled', { params: { status } });
    return response.data;
  }

  async logChallengeSteps(data: { userChallengeId: string; steps: number; distance?: number; duration?: number; calories?: number }) {
    const response = await this.client.post('/challenges/log-steps', data);
    return response.data;
  }

  async forfeitChallenge(enrollmentId: string) {
    const response = await this.client.post(`/challenges/forfeit/${enrollmentId}`);
    return response.data;
  }

  // Steps
  async logSteps(data: { steps: number; distance?: number; duration?: number; calories?: number; latitude?: number; longitude?: number }) {
    const response = await this.client.post('/steps/log', data);
    return response.data;
  }

  async getStepHistory(days?: number) {
    const response = await this.client.get('/steps/history', { params: { days } });
    return response.data;
  }

  async getTodayStats() {
    const response = await this.client.get('/steps/today');
    return response.data;
  }

  // User
  async getProfile() {
    const response = await this.client.get('/user/profile');
    return response.data;
  }

  async getLeaderboard(params?: { type?: string; period?: string; page?: number; limit?: number }) {
    const response = await this.client.get('/user/leaderboard', { params });
    return response.data;
  }

  async searchUsers(query: string) {
    const response = await this.client.get('/user/search', { params: { q: query } });
    return response.data;
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number; unread?: boolean }) {
    const response = await this.client.get('/notifications', { params });
    return response.data;
  }

  async markNotificationRead(id: string) {
    const response = await this.client.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllNotificationsRead() {
    const response = await this.client.patch('/notifications/read-all');
    return response.data;
  }

  async deleteNotification(id: string) {
    const response = await this.client.delete(`/notifications/${id}`);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const api = new ApiService();
