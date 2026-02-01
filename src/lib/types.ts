import type { Timestamp } from 'firebase/firestore';

export type Subgrades = {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
};

export type Collection = {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  cardCount?: number;
  isPublic?: boolean;
};

export type CollectionCard = {
  id: string;
  userId: string;
  collectionId: string;
  cardName: string;
  set?: string;
  year?: string;
  cardNumber?: string;
  variant?: string;
  imageUrl?: string;
  quantity?: number;
  purchasePrice?: number;
  purchaseDate?: Timestamp | Date;
  notes?: string;
  condition?: string;
  isPublic?: boolean;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
};

export type GradingHistory = {
  grade: number;
  subgrades: Subgrades;
  gradedAt: Timestamp | Date;
  notes?: string;
};

export type CardComment = {
  id: string;
  cardId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  createdAt: Timestamp | Date;
};

export type SearchPreset = {
  id: string;
  userId: string;
  name: string;
  filters: {
    searchQuery?: string;
    collectionId?: string;
    gradeMin?: number;
    gradeMax?: number;
    year?: string;
    set?: string;
  };
  createdAt: Timestamp | Date;
};

export type UserFollow = {
  followerId: string;
  followingId: string;
  createdAt: Timestamp | Date;
};

export type UserProfile = {
  userId: string;
  username?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  bio?: string;
  isProfilePublic?: boolean;
  tradingEnabled?: boolean;
  followerCount?: number;
  followingCount?: number;
  createdAt?: Timestamp | Date;
};

export type GradedCard = {
  id: string;
  userId: string;
  username?: string; // Username of the card owner
  frontImageUrl: string;
  backImageUrl: string;
  cardName?: string;
  set?: string;
  year?: string;
  grade: number;
  subgrades: Subgrades;
  confidence: number;
  createdAt: Timestamp | Date;
  publicShareId: string;
  isPublic?: boolean;
  collectionId?: string;
  
  // Notes & History
  notes?: string;
  purchasePrice?: number;
  purchaseDate?: Timestamp | Date;
  acquisitionInfo?: string;
  gradingHistory?: GradingHistory[];
  
  // Social Features
  likes?: string[]; // Array of user IDs who liked
  likeCount?: number;
  commentCount?: number;
  
  // Market Data
  currentMarketPrice?: number;
  lastPriceUpdate?: Timestamp | Date;
  priceHistory?: PricePoint[];
};

export type PricePoint = {
  price: number;
  date: Timestamp | Date;
  source?: string;
};

export type PriceAlert = {
  id: string;
  userId: string;
  cardId?: string;
  cardName?: string;
  set?: string;
  grade?: number;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  triggeredAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
};

export type PortfolioMetrics = {
  userId: string;
  totalValue: number;
  totalInvestment: number;
  roi: number;
  cardCount: number;
  averageGrade: number;
  topCard?: {
    id: string;
    name: string;
    value: number;
  };
  updatedAt: Timestamp | Date;
};

export type TradeCard = {
  id: string;
  type: 'graded' | 'collection';
  // Snapshot data stored at trade creation for history
  name?: string;
  imageUrl?: string;
  grade?: number;
  quantity?: number;
};

export type TradeOffer = {
  id: string;
  senderId: string;
  senderUsername: string;
  receiverId: string;
  receiverUsername: string;
  offeredCards: TradeCard[]; // Cards with type info
  requestedCards: TradeCard[]; // Cards with type info
  senderCash?: number; // Cash offered by sender
  receiverCash?: number; // Cash requested from receiver
  tradeType: 'cards-only' | 'cards-and-cash' | 'cash-only';
  senderValue: number;
  receiverValue: number;
  fairnessScore: number; // 0-100, how balanced the trade is
  status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';
  message?: string;
  createdAt: Timestamp | Date;
  expiresAt: Timestamp | Date;
  respondedAt?: Timestamp | Date;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'grading' | 'collecting' | 'social' | 'trading' | 'value';
  requirement: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
};

export type UserAchievement = {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
};

export type LeaderboardEntry = {
  userId: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  score: number;
  rank: number;
  change?: number; // Position change from previous period
};

export type Leaderboard = {
  id: string;
  type: 'collection-value' | 'card-count' | 'average-grade' | 'trading-volume';
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  entries: LeaderboardEntry[];
  updatedAt: Timestamp | Date;
};

export type NotificationType = 
  | 'achievement_unlocked'
  | 'trade_received'
  | 'trade_accepted'
  | 'trade_rejected'
  | 'trade_expired'
  | 'price_alert_triggered'
  | 'new_follower'
  | 'card_comment';

export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    achievementId?: string;
    achievementName?: string;
    achievementIcon?: string;
    achievementRarity?: string;
    tradeId?: string;
    tradeSenderUsername?: string;
    tradeReceiverUsername?: string;
    cardId?: string;
    cardName?: string;
    alertId?: string;
    targetPrice?: number;
    currentPrice?: number;
    condition?: 'above' | 'below';
    followerId?: string;
    followerUsername?: string;
    commentId?: string;
    commentText?: string;
  };
  isRead: boolean;
  createdAt: Timestamp | Date;
};
