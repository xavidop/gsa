import { collection, getDocs, getDoc, doc, query, where, updateDoc, Timestamp } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import type { PriceAlert, GradedCard } from './types';
import { notifyPriceAlert } from './notifications';

/**
 * Check all active price alerts for a user and trigger notifications if conditions are met
 * This should ideally be run via Cloud Functions on a schedule or when prices update
 */
export async function checkPriceAlerts(
  firestore: Firestore, 
  userId: string
): Promise<number> {
  let triggeredCount = 0;
  
  // Get all active alerts for the user
  const alertsQuery = query(
    collection(firestore, 'priceAlerts'),
    where('userId', '==', userId),
    where('isActive', '==', true)
  );
  
  const alertsSnap = await getDocs(alertsQuery);
  
  for (const alertDoc of alertsSnap.docs) {
    const alert = { id: alertDoc.id, ...alertDoc.data() } as PriceAlert;
    
    // Get the card to check current price
    const cardDoc = await getDoc(doc(firestore, 'users', userId, 'graded_cards', alert.cardId || ''));
    
    if (!cardDoc.exists()) continue;
    
    const card = { id: cardDoc.id, ...cardDoc.data() } as GradedCard;
    const currentPrice = card.currentMarketPrice || 0;
    
    // Check if alert condition is met
    let triggered = false;
    
    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
      triggered = true;
    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
      triggered = true;
    }
    
    if (triggered) {
      // Send notification
      await notifyPriceAlert(firestore, userId, alert, card, currentPrice);
      
      // Mark alert as triggered (deactivate it)
      await updateDoc(doc(firestore, 'priceAlerts', alert.id), {
        isActive: false,
        triggeredAt: Timestamp.now(),
        triggeredPrice: currentPrice
      });
      
      triggeredCount++;
    }
  }
  
  return triggeredCount;
}

/**
 * Check price alerts for all users (to be run via Cloud Function)
 */
export async function checkAllPriceAlerts(firestore: Firestore): Promise<number> {
  let totalTriggered = 0;
  
  // Get all active alerts
  const alertsQuery = query(
    collection(firestore, 'priceAlerts'),
    where('isActive', '==', true)
  );
  
  const alertsSnap = await getDocs(alertsQuery);
  const userIds = new Set<string>();
  
  alertsSnap.docs.forEach(doc => {
    const data = doc.data();
    if (data.userId) {
      userIds.add(data.userId);
    }
  });
  
  // Check alerts for each user
  for (const userId of userIds) {
    const triggered = await checkPriceAlerts(firestore, userId);
    totalTriggered += triggered;
  }
  
  return totalTriggered;
}

/**
 * Manually trigger a price alert check for a specific card
 * Useful when prices are updated via an external API
 */
export async function checkCardPriceAlert(
  firestore: Firestore,
  userId: string,
  cardId: string,
  newPrice: number
): Promise<boolean> {
  // Get active alerts for this specific card
  const alertsQuery = query(
    collection(firestore, 'priceAlerts'),
    where('userId', '==', userId),
    where('cardId', '==', cardId),
    where('isActive', '==', true)
  );
  
  const alertsSnap = await getDocs(alertsQuery);
  let triggered = false;
  
  for (const alertDoc of alertsSnap.docs) {
    const alert = { id: alertDoc.id, ...alertDoc.data() } as PriceAlert;
    
    // Get the card for notification details
    const cardDoc = await getDoc(doc(firestore, 'users', userId, 'graded_cards', cardId));
    if (!cardDoc.exists()) continue;
    
    const card = { id: cardDoc.id, ...cardDoc.data() } as GradedCard;
    
    // Check condition
    let shouldTrigger = false;
    if (alert.condition === 'above' && newPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.condition === 'below' && newPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }
    
    if (shouldTrigger) {
      await notifyPriceAlert(firestore, userId, alert, card, newPrice);
      
      await updateDoc(doc(firestore, 'priceAlerts', alert.id), {
        isActive: false,
        triggeredAt: Timestamp.now(),
        triggeredPrice: newPrice
      });
      
      triggered = true;
    }
  }
  
  return triggered;
}
