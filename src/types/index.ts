export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  bio?: string;
  followersCount: number;
  followingCount: number;
}

export interface Tweet {
  id: string;
  author: User;
  content: string;
  images?: string[];
  createdAt: string;
  likesCount: number;
  retweetsCount: number;
  repliesCount: number;
  isLiked: boolean;
  isRetweeted: boolean;
  isBookmarked: boolean;
}

export interface AppState {
  user: User | null;
  tweets: Tweet[];
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

export interface UIState {
  sidebarOpen: boolean;
  preloaderVisible: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
  read: boolean;
  createdAt: string;
}