import { Firestore, collection, addDoc, Timestamp, query, where, orderBy, limit, getDocs, updateDoc, doc, writeBatch } from 'firebase/firestore';
import type { Notification, NotificationType, Achievement, TradeOffer, PriceAlert, GradedCard } from './types';

// Create a notification
export async function createNotification(
  firestore: Firestore,
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Notification['data']
): Promise<string> {
  const notificationRef = await addDoc(collection(firestore, 'notifications'), {
    userId,
    type,
    title,
    message,
    data: data || {},
    isRead: false,
    createdAt: Timestamp.now(),
  });
  return notificationRef.id;
}

// Achievement notification
export async function notifyAchievementUnlocked(
  firestore: Firestore,
  userId: string,
  achievement: Achievement
): Promise<string> {
  const rarityEmoji = {
    common: '🥉',
    rare: '🥈',
    epic: '🥇',
    legendary: '💎',
  };
  
  return createNotification(
    firestore,
    userId,
    'achievement_unlocked',
    `${rarityEmoji[achievement.rarity]} Achievement Unlocked!`,
    `You earned "${achievement.name}" - ${achievement.description}`,
    {
      achievementId: achievement.id,
      achievementName: achievement.name,
      achievementIcon: achievement.icon,
      achievementRarity: achievement.rarity,
    }
  );
}

// Trade notifications
export async function notifyTradeReceived(
  firestore: Firestore,
  userId: string,
  trade: TradeOffer
): Promise<string> {
  const cardCount = trade.offeredCards.length + trade.requestedCards.length;
  const hasCards = trade.offeredCards.length > 0;
  const hasCash = (trade.senderCash ?? 0) > 0;
  
  let message = `${trade.senderUsername} wants to trade with you`;
  if (trade.tradeType === 'cash-only') {
    message = `${trade.senderUsername} offered $${trade.senderCash} for your cards`;
  } else if (trade.tradeType === 'cards-and-cash') {
    message = `${trade.senderUsername} offered cards + $${trade.senderCash ?? 0}`;
  }
  
  return createNotification(
    firestore,
    userId,
    'trade_received',
    '🔄 New Trade Offer',
    message,
    {
      tradeId: trade.id,
      tradeSenderUsername: trade.senderUsername,
    }
  );
}

export async function notifyTradeAccepted(
  firestore: Firestore,
  userId: string,
  trade: TradeOffer
): Promise<string> {
  return createNotification(
    firestore,
    userId,
    'trade_accepted',
    '✅ Trade Accepted!',
    `${trade.receiverUsername} accepted your trade offer`,
    {
      tradeId: trade.id,
      tradeReceiverUsername: trade.receiverUsername,
    }
  );
}

export async function notifyTradeRejected(
  firestore: Firestore,
  userId: string,
  trade: TradeOffer
): Promise<string> {
  return createNotification(
    firestore,
    userId,
    'trade_rejected',
    '❌ Trade Declined',
    `${trade.receiverUsername} declined your trade offer`,
    {
      tradeId: trade.id,
      tradeReceiverUsername: trade.receiverUsername,
    }
  );
}

// Price alert notification
export async function notifyPriceAlert(
  firestore: Firestore,
  userId: string,
  alert: PriceAlert,
  card: GradedCard,
  currentPrice: number
): Promise<string> {
  const direction = alert.condition === 'above' ? '📈 Price Increased!' : '📉 Price Dropped!';
  const actionWord = alert.condition === 'above' ? 'risen above' : 'fallen below';
  
  return createNotification(
    firestore,
    userId,
    'price_alert_triggered',
    direction,
    `${card.cardName} has ${actionWord} your target of $${alert.targetPrice}. Current: $${currentPrice}`,
    {
      alertId: alert.id,
      cardId: card.id,
      cardName: card.cardName,
      targetPrice: alert.targetPrice,
      currentPrice,
      condition: alert.condition,
    }
  );
}

// New follower notification
export async function notifyNewFollower(
  firestore: Firestore,
  userId: string,
  followerUsername: string,
  followerId: string
): Promise<string> {
  return createNotification(
    firestore,
    userId,
    'new_follower',
    '👤 New Follower',
    `${followerUsername} started following you`,
    {
      followerId,
      followerUsername,
    }
  );
}

// Mark notification as read
export async function markNotificationRead(
  firestore: Firestore,
  notificationId: string
): Promise<void> {
  await updateDoc(doc(firestore, 'notifications', notificationId), {
    isRead: true,
  });
}

// Mark all notifications as read for a user
export async function markAllNotificationsRead(
  firestore: Firestore,
  userId: string
): Promise<void> {
  const q = query(
    collection(firestore, 'notifications'),
    where('userId', '==', userId),
    where('isRead', '==', false)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(firestore);
  
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });
  
  await batch.commit();
}

// Get notification icon based on type
export function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'achievement_unlocked':
      return '🏆';
    case 'trade_received':
      return '📥';
    case 'trade_accepted':
      return '✅';
    case 'trade_rejected':
      return '❌';
    case 'trade_expired':
      return '⏰';
    case 'price_alert_triggered':
      return '💰';
    case 'new_follower':
      return '👤';
    case 'card_comment':
      return '💬';
    default:
      return '🔔';
  }
}

// Get notification link based on type
export function getNotificationLink(notification: Notification): string {
  switch (notification.type) {
    case 'achievement_unlocked':
      return '/achievements';
    case 'trade_received':
    case 'trade_accepted':
    case 'trade_rejected':
    case 'trade_expired':
      return `/trades${notification.data?.tradeId ? `?id=${notification.data.tradeId}` : ''}`;
    case 'price_alert_triggered':
      return notification.data?.cardId ? `/card/${notification.data.cardId}` : '/portfolio';
    case 'new_follower':
      return notification.data?.followerUsername ? `/${notification.data.followerUsername}` : '/discover';
    case 'card_comment':
      return notification.data?.cardId ? `/card/${notification.data.cardId}` : '/dashboard';
    default:
      return '/dashboard';
  }
}
