import type { Timestamp } from 'firebase/firestore';

export type Subgrades = {
  centering: number;
  corners: number;
  edges: number;
  surface: number;
};

export type GradedCard = {
  id: string;
  userId: string;
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
};
