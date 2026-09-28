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

/**
 * Lifecycle of the auth slice.
 *
 * `initializing` exists so route guards can wait for Firebase to re-hydrate the
 * session instead of bouncing an already-signed-in user to /login on refresh.
 * `pending` covers an in-flight sign-in/sign-up request.
 */
export type AuthStatus = 'initializing' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  pending: boolean;
  error: string | null;
  /** True once the password-reset email has been sent, used for UI feedback. */
  resetEmailSent: boolean;
}

/* ------------------------------------------------------------------ *
 * App-level toasts (transient UI messages)
 * Named `AppNotification` so it never collides with the domain-level
 * `Notification` (likes / follows / mentions) further down.
 * ------------------------------------------------------------------ */
export type AppNotificationType = 'info' | 'success' | 'error' | 'warning';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface UIState {
  sidebarOpen: boolean;
  preloaderVisible: boolean;
  theme: 'light' | 'dark';
  notifications: AppNotification[];
}

/* ------------------------------------------------------------------ *
 * Domain models (formerly duplicated across mockData / Explore / Follow)
 * ------------------------------------------------------------------ */
export interface TrendingTopic {
  id: string;
  topic: string;
  description: string;
  tweetCount: number;
  category?: string;
}

export interface CategoryTopic {
  id: string;
  name: string;
  description: string;
  tweetCount: number;
}

export interface SuggestedUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  verified: boolean;
  bio: string;
  followersCount: number;
}

export interface FollowSuggestion extends SuggestedUser {
  followingCount: number;
  mutualFollowers?: string[];
  reason?: string;
}

export type ActivityType = 'like' | 'retweet' | 'reply' | 'follow' | 'mention' | 'quote';

export interface Notification {
  id: string;
  type: ActivityType;
  actor: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'verified'>;
  tweet?: {
    id: string;
    content: string;
    author: { username: string; displayName: string };
  };
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'verified'>[];
  lastMessage: { content: string; senderId: string; createdAt: string };
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface ProfileUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  banner: string;
  verified: boolean;
  bio: string;
  location: string;
  website: string;
  joinDate: string;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  mediaCount: number;
  likesCount: number;
}

export interface ProfileTweet extends Tweet {
  isReply?: boolean;
  replyTo?: { username: string; displayName: string };
}

/** Reduced shape used by the "Likes" tab, whose author has no counters. */
export interface LikedTweet extends Omit<Tweet, 'author'> {
  author: Pick<User, 'id' | 'username' | 'displayName' | 'avatar' | 'verified'>;
}
