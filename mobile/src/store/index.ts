import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, WalletTransaction, Challenge, UserChallenge, StepHistory, Achievement, NotificationItem, NeumorphicTheme, defaultTheme, darkTheme } from '../types';

interface AppStore {
  // Auth
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => void;

  // Wallet
  walletBalance: number;
  transactions: WalletTransaction[];
  setWalletBalance: (balance: number) => void;
  setTransactions: (transactions: WalletTransaction[]) => void;
  addTransaction: (transaction: WalletTransaction) => void;

  // Challenges
  challenges: Challenge[];
  myEnrollments: UserChallenge[];
  setChallenges: (challenges: Challenge[]) => void;
  setMyEnrollments: (enrollments: UserChallenge[]) => void;
  updateEnrollment: (enrollment: UserChallenge) => void;

  // Steps
  stepHistory: StepHistory | null;
  setStepHistory: (history: StepHistory | null) => void;

  // Achievements
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;

  // Notifications
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  setUnreadCount: (count: number) => void;
  markNotificationRead: (id: string) => void;

  // Theme
  isDarkMode: boolean;
  theme: NeumorphicTheme;
  toggleTheme: () => void;

  // UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showOnboarding: boolean;
  setShowOnboarding: (value: boolean) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false,
        walletBalance: 0,
        transactions: [],
        challenges: [],
        myEnrollments: [],
        stepHistory: null,
        achievements: [],
        notifications: [],
        unreadCount: 0,
      }),

      // Wallet
      walletBalance: 0,
      transactions: [],
      setWalletBalance: (walletBalance) => set({ walletBalance }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions],
      })),

      // Challenges
      challenges: [],
      myEnrollments: [],
      setChallenges: (challenges) => set({ challenges }),
      setMyEnrollments: (myEnrollments) => set({ myEnrollments }),
      updateEnrollment: (enrollment) => set((state) => ({
        myEnrollments: state.myEnrollments.map((e) =>
          e.id === enrollment.id ? enrollment : e
        ),
      })),

      // Steps
      stepHistory: null,
      setStepHistory: (stepHistory) => set({ stepHistory }),

      // Achievements
      achievements: [],
      setAchievements: (achievements) => set({ achievements }),

      // Notifications
      notifications: [],
      unreadCount: 0,
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      })),

      // Theme
      isDarkMode: false,
      theme: defaultTheme,
      toggleTheme: () => set((state) => ({
        isDarkMode: !state.isDarkMode,
        theme: state.isDarkMode ? defaultTheme : darkTheme,
      })),

      // UI
      activeTab: 'home',
      setActiveTab: (activeTab) => set({ activeTab }),
      showOnboarding: true,
      setShowOnboarding: (showOnboarding) => set({ showOnboarding }),
    }),
    {
      name: 'walk-to-earn-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isDarkMode: state.isDarkMode,
        showOnboarding: state.showOnboarding,
      }),
    }
  )
);
