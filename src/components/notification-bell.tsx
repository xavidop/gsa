'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bell, 
  Trophy, 
  ArrowLeftRight, 
  TrendingUp, 
  UserPlus, 
  MessageSquare,
  Check,
  X,
  Clock
} from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/types';
import { markNotificationRead, markAllNotificationsRead, getNotificationLink } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  achievement_unlocked: <Trophy className="h-4 w-4 text-yellow-500" />,
  trade_received: <ArrowLeftRight className="h-4 w-4 text-blue-500" />,
  trade_accepted: <Check className="h-4 w-4 text-green-500" />,
  trade_rejected: <X className="h-4 w-4 text-red-500" />,
  trade_expired: <Clock className="h-4 w-4 text-gray-500" />,
  price_alert_triggered: <TrendingUp className="h-4 w-4 text-emerald-500" />,
  new_follower: <UserPlus className="h-4 w-4 text-purple-500" />,
  card_comment: <MessageSquare className="h-4 w-4 text-indigo-500" />,
};

const rarityColors: Record<string, string> = {
  common: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  legendary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

export function NotificationBell() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const notificationsQuery = useMemoFirebase(() => {
    // Wait for auth to be fully loaded before querying
    if (!user || !firestore || isUserLoading) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [user, firestore]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!firestore || !notification.id) return;
    
    // Mark as read
    if (!notification.isRead) {
      await markNotificationRead(firestore, notification.id);
    }
    
    // Navigate to relevant page
    const link = getNotificationLink(notification);
    setIsOpen(false);
    router.push(link);
  };

  const handleMarkAllRead = async () => {
    if (!firestore || !user) return;
    await markAllNotificationsRead(firestore, user.uid);
  };

  const formatTime = (date: Timestamp | Date) => {
    const d = date instanceof Date ? date : date.toDate();
    return formatDistanceToNow(d, { addSuffix: true });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={cn(
                    'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                    !notification.isRead && 'bg-primary/5'
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notificationIcons[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          'text-sm truncate',
                          !notification.isRead && 'font-semibold'
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>
                        {notification.type === 'achievement_unlocked' && notification.data?.achievementRarity && (
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs px-1.5 py-0', rarityColors[notification.data.achievementRarity])}
                          >
                            {notification.data.achievementRarity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-sm"
              onClick={() => {
                setIsOpen(false);
                router.push('/notifications');
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
