import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { Leaderboard, LeaderboardEntry, Achievement, UserAchievement } from './types';
import { notifyAchievementUnlocked } from './notifications';

/**
 * Pre-defined achievements
 */
export const ACHIEVEMENTS: Achievement[] = [
  // Grading Achievements
  {
    id: 'first_grade',
    name: 'First Grade',
    description: 'Grade your first card',
    icon: '🎯',
    category: 'grading',
    requirement: 1,
    rarity: 'common'
  },
  {
    id: 'perfect_10',
    name: 'Perfect 10',
    description: 'Get your first PSA 10 equivalent grade',
    icon: '💎',
    category: 'grading',
    requirement: 1,
    rarity: 'legendary'
  },
  {
    id: 'grade_master',
    name: 'Grade Master',
    description: 'Grade 100 cards',
    icon: '👑',
    category: 'grading',
    requirement: 100,
    rarity: 'epic'
  },
  {
    id: 'grade_enthusiast',
    name: 'Grade Enthusiast',
    description: 'Grade 50 cards',
    icon: '🏆',
    category: 'grading',
    requirement: 50,
    rarity: 'rare'
  },

  // Collecting Achievements
  {
    id: 'collector_started',
    name: 'Collection Starter',
    description: 'Create your first collection',
    icon: '📚',
    category: 'collecting',
    requirement: 1,
    rarity: 'common'
  },
  {
    id: 'serious_collector',
    name: 'Serious Collector',
    description: 'Have 5 collections',
    icon: '🗃️',
    category: 'collecting',
    requirement: 5,
    rarity: 'rare'
  },

  // Value Achievements
  {
    id: 'first_thousand',
    name: 'First Thousand',
    description: 'Reach $1,000 in portfolio value',
    icon: '💰',
    category: 'value',
    requirement: 1000,
    rarity: 'rare'
  },
  {
    id: 'high_roller',
    name: 'High Roller',
    description: 'Reach $10,000 in portfolio value',
    icon: '💸',
    category: 'value',
    requirement: 10000,
    rarity: 'epic'
  },
  {
    id: 'whale',
    name: 'Whale',
    description: 'Reach $100,000 in portfolio value',
    icon: '🐋',
    category: 'value',
    requirement: 100000,
    rarity: 'legendary'
  },

  // Social Achievements
  {
    id: 'first_follower',
    name: 'First Follower',
    description: 'Get your first follower',
    icon: '👥',
    category: 'social',
    requirement: 1,
    rarity: 'common'
  },
  {
    id: 'influencer',
    name: 'Influencer',
    description: 'Reach 100 followers',
    icon: '⭐',
    category: 'social',
    requirement: 100,
    rarity: 'epic'
  },
  {
    id: 'first_like',
    name: 'Community Member',
    description: 'Like your first card',
    icon: '❤️',
    category: 'social',
    requirement: 1,
    rarity: 'common'
  },

  // Trading Achievements
  {
    id: 'first_trade',
    name: 'First Trade',
    description: 'Complete your first trade',
    icon: '🤝',
    category: 'trading',
    requirement: 1,
    rarity: 'common'
  },
  {
    id: 'trade_veteran',
    name: 'Trade Veteran',
    description: 'Complete 25 trades',
    icon: '🔄',
    category: 'trading',
    requirement: 25,
    rarity: 'rare'
  }
];

/**
 * Generate leaderboard for a specific category
 */
export async function generateLeaderboard(
  type: 'collection-value' | 'card-count' | 'average-grade' | 'trading-volume',
  period: 'daily' | 'weekly' | 'monthly' | 'all-time' = 'all-time',
  maxEntries: number = 50
): Promise<Leaderboard> {
  const { firestore } = initializeFirebase();
  
  // Get all users with their metrics
  const usersQuery = query(collection(firestore, 'users'));
  const usersSnap = await getDocs(usersQuery);
  
  const entries: LeaderboardEntry[] = [];

  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    
    // Skip users with private profiles
    if (userData.isProfilePublic === false) {
      continue;
    }
    
    let score = 0;

    switch (type) {
      case 'collection-value':
        // Get user's portfolio metrics
        const metricsQuery = query(
          collection(firestore, 'portfolioMetrics'),
          where('userId', '==', userDoc.id)
        );
        const metricsSnap = await getDocs(metricsQuery);
        if (!metricsSnap.empty) {
          score = metricsSnap.docs[0].data().totalValue || 0;
        }
        break;

      case 'card-count':
        const gradedCardsQuery = query(
          collection(firestore, 'users', userDoc.id, 'graded_cards')
        );
        const gradedCardsSnap = await getDocs(gradedCardsQuery);
        
        const collectionCardsQuery = query(
          collection(firestore, 'users', userDoc.id, 'collection_cards')
        );
        const collectionCardsSnap = await getDocs(collectionCardsQuery);
        
        score = gradedCardsSnap.size + collectionCardsSnap.size;
        break;

      case 'average-grade':
        const allCardsQuery = query(
          collection(firestore, 'users', userDoc.id, 'graded_cards')
        );
        const allCardsSnap = await getDocs(allCardsQuery);
        if (allCardsSnap.size > 0) {
          const totalGrade = allCardsSnap.docs.reduce((sum, doc) => sum + (doc.data().grade || 0), 0);
          score = totalGrade / allCardsSnap.size;
        }
        break;

      case 'trading-volume':
        const tradesQuery = query(
          collection(firestore, 'tradeOffers'),
          where('status', '==', 'accepted')
        );
        const tradesSnap = await getDocs(tradesQuery);
        score = tradesSnap.docs.filter(doc => {
          const data = doc.data();
          return data.senderId === userDoc.id || data.receiverId === userDoc.id;
        }).length;
        break;
    }

    if (score > 0) {
      entries.push({
        userId: userDoc.id,
        username: userData.username || 'Unknown',
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        score,
        rank: 0 // Will be set after sorting
      });
    }
  }

  // Sort by score and assign ranks
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Limit to max entries
  const limitedEntries = entries.slice(0, maxEntries);

  const leaderboard: Leaderboard = {
    id: `${type}-${period}`,
    type,
    period,
    entries: limitedEntries,
    updatedAt: Timestamp.now()
  };

  // Note: Leaderboard caching to Firestore should be done via Cloud Functions
  // For now, we just return the generated leaderboard
  // await setDoc(doc(firestore, 'leaderboards', leaderboard.id), leaderboard);

  return leaderboard;
}

/**
 * Check and award achievements for a user
 */
export async function checkAchievements(userId: string): Promise<UserAchievement[]> {
  const { firestore } = initializeFirebase();
  const newAchievements: UserAchievement[] = [];

  try {
    // Get user's current achievements
    const userAchievementsQuery = query(
      collection(firestore, 'userAchievements'),
      where('userId', '==', userId)
    );
    const userAchievementsSnap = await getDocs(userAchievementsQuery);
    const completedAchievementIds = new Set(
      userAchievementsSnap.docs
        .filter(doc => doc.data().completed)
        .map(doc => doc.data().achievementId)
    );

    // Get user stats
    const cardsQuery = query(
      collection(firestore, 'users', userId, 'graded_cards')
    );
    const cardsSnap = await getDocs(cardsQuery);
    const cards = cardsSnap.docs.map(doc => doc.data());

    let collectionsCount = 0;
    try {
      const collectionsQuery = query(
        collection(firestore, 'users', userId, 'collections')
      );
      const collectionsSnap = await getDocs(collectionsQuery);
      collectionsCount = collectionsSnap.size;
    } catch (e) {
      // Collections query failed, continue with 0
      console.warn('Could not fetch collections for achievement check');
    }

  // Get trade count (completed trades where user is sender or receiver)
  const sentTradesQuery = query(
    collection(firestore, 'tradeOffers'),
    where('senderId', '==', userId),
    where('status', '==', 'accepted')
  );
  const receivedTradesQuery = query(
    collection(firestore, 'tradeOffers'),
    where('receiverId', '==', userId),
    where('status', '==', 'accepted')
  );
  const [sentTradesSnap, receivedTradesSnap] = await Promise.all([
    getDocs(sentTradesQuery),
    getDocs(receivedTradesQuery)
  ]);
  const totalCompletedTrades = sentTradesSnap.size + receivedTradesSnap.size;

  // Get follower count
  const followersQuery = query(
    collection(firestore, 'user_follows'),
    where('followingId', '==', userId)
  );
  const followersSnap = await getDocs(followersQuery);
  const followerCount = followersSnap.size;

  // Get likes given count (count cards where user is in the likes array)
  const publicCardsQuery = query(
    collection(firestore, 'public_graded_cards')
  );
  const publicCardsSnap = await getDocs(publicCardsQuery);
  let likesGivenCount = 0;
  publicCardsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.likes && Array.isArray(data.likes) && data.likes.includes(userId)) {
      likesGivenCount++;
    }
  });

  // Calculate portfolio value from graded cards and collection cards
  let totalPortfolioValue = 0;
  
  // Add graded cards value (use market price, purchase price, or grade-based estimate)
  for (const card of cards) {
    if (card.currentMarketPrice) {
      totalPortfolioValue += card.currentMarketPrice;
    } else if (card.purchasePrice) {
      totalPortfolioValue += card.purchasePrice;
    } else if (card.grade) {
      // Estimate based on grade
      const basePrice = 50;
      const gradeMultiplier = Math.pow(1.5, card.grade - 5);
      totalPortfolioValue += basePrice * gradeMultiplier;
    }
  }
  
  // Add collection cards value
  const collectionCardsQuery = query(
    collection(firestore, 'users', userId, 'collection_cards')
  );
  const collectionCardsSnap = await getDocs(collectionCardsQuery);
  for (const cardDoc of collectionCardsSnap.docs) {
    const card = cardDoc.data();
    const price = card.purchasePrice || 0;
    const qty = card.quantity || 1;
    totalPortfolioValue += price * qty;
  }

  // Check each achievement
  for (const achievement of ACHIEVEMENTS) {
    if (completedAchievementIds.has(achievement.id)) continue;

    let progress = 0;
    let completed = false;

    switch (achievement.id) {
      case 'first_grade':
      case 'grade_enthusiast':
      case 'grade_master':
        progress = cardsSnap.size;
        break;

      case 'perfect_10':
        progress = cards.filter(c => c.grade === 10).length;
        break;

      case 'collector_started':
      case 'serious_collector':
        progress = collectionsCount;
        break;

      case 'first_thousand':
      case 'high_roller':
      case 'whale':
        // Use calculated portfolio value
        progress = totalPortfolioValue;
        break;

      // Trading achievements
      case 'first_trade':
      case 'trade_veteran':
        progress = totalCompletedTrades;
        break;

      // Social achievements
      case 'first_follower':
      case 'influencer':
        progress = followerCount;
        break;

      case 'first_like':
        progress = likesGivenCount;
        break;
    }

    completed = progress >= achievement.requirement;

    const userAchievement: UserAchievement = {
      id: `${userId}_${achievement.id}`,
      userId,
      achievementId: achievement.id,
      progress,
      completed,
      ...(completed && { completedAt: Timestamp.now() }),
      createdAt: Timestamp.now()
    };

    // Save or update achievement
    await setDoc(doc(firestore, 'userAchievements', userAchievement.id), userAchievement);

    if (completed && !completedAchievementIds.has(achievement.id)) {
      newAchievements.push(userAchievement);
      
      // Send notification for newly unlocked achievement
      await notifyAchievementUnlocked(firestore, userId, achievement);
    }
  }

    return newAchievements;
  } catch (error) {
    console.error('Achievement check failed:', error);
    return [];
  }
}

/**
 * Trigger achievement check in the background (non-blocking)
 * Call this after key user actions to award achievements in real-time
 */
export function checkAchievementsInBackground(userId: string): void {
  // Run achievement check without blocking the main flow
  checkAchievements(userId).catch(error => {
    console.error('Background achievement check failed:', error);
  });
}

/**
 * Get achievements for a user
 */
export async function getUserAchievements(userId: string): Promise<{
  completed: (UserAchievement & { achievement: Achievement })[];
  inProgress: (UserAchievement & { achievement: Achievement })[];
}> {
  const { firestore } = initializeFirebase();

  const userAchievementsQuery = query(
    collection(firestore, 'userAchievements'),
    where('userId', '==', userId)
  );
  const userAchievementsSnap = await getDocs(userAchievementsQuery);

  const completed: (UserAchievement & { achievement: Achievement })[] = [];
  const inProgress: (UserAchievement & { achievement: Achievement })[] = [];

  for (const doc of userAchievementsSnap.docs) {
    const userAchievement = { id: doc.id, ...doc.data() } as UserAchievement;
    const achievement = ACHIEVEMENTS.find(a => a.id === userAchievement.achievementId);

    if (achievement) {
      const combined = { ...userAchievement, achievement };
      if (userAchievement.completed) {
        completed.push(combined);
      } else {
        inProgress.push(combined);
      }
    }
  }

  return { completed, inProgress };
}
