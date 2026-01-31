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
};
