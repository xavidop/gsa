'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Trophy, 
  ArrowLeftRight, 
  TrendingUp, 
  UserPlus, 
  MessageSquare,
  Check,
  X,
  Clock,
  Trash2,
  CheckCheck
} from 'lucide-react';
import type { Notification, NotificationType } from '@/lib/types';
import { markNotificationRead, markAllNotificationsRead, getNotificationLink } from '@/lib/notifications';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  achievement_unlocked: <Trophy className="h-5 w-5 text-yellow-500" />,
  trade_received: <ArrowLeftRight className="h-5 w-5 text-blue-500" />,
  trade_accepted: <Check className="h-5 w-5 text-green-500" />,
  trade_rejected: <X className="h-5 w-5 text-red-500" />,
  trade_expired: <Clock className="h-5 w-5 text-gray-500" />,
  price_alert_triggered: <TrendingUp className="h-5 w-5 text-emerald-500" />,
  new_follower: <UserPlus className="h-5 w-5 text-purple-500" />,
  card_comment: <MessageSquare className="h-5 w-5 text-indigo-500" />,
};

const rarityColors: Record<string, string> = {
  common: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  rare: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  epic: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  legendary: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const categoryFilters = [
  { value: 'all', label: 'All' },
  { value: 'achievements', label: 'Achievements', types: ['achievement_unlocked'] },
  { value: 'trades', label: 'Trades', types: ['trade_received', 'trade_accepted', 'trade_rejected', 'trade_expired'] },
  { value: 'alerts', label: 'Price Alerts', types: ['price_alert_triggered'] },
  { value: 'social', label: 'Social', types: ['new_follower', 'card_comment'] },
];

export default function NotificationsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  const notificationsQuery = useMemoFirebase(() => {
    if (!user || !firestore || isUserLoading) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [user, firestore, isUserLoading]);

  const { data: notifications, isLoading } = useCollection<Notification>(notificationsQuery);

  const filteredNotifications = notifications?.filter(n => {
    if (activeTab === 'all') return true;
    const filter = categoryFilters.find(f => f.value === activeTab);
    return filter?.types?.includes(n.type);
  });

  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleNotificationClick = async (notification: Notification) => {
    if (!firestore || !notification.id) return;
    
    if (!notification.isRead) {
      await markNotificationRead(firestore, notification.id);
    }
    
    const link = getNotificationLink(notification);
    router.push(link);
  };

  const handleMarkAllRead = async () => {
    if (!firestore || !user) return;
    await markAllNotificationsRead(firestore, user.uid);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'notifications', notificationId));
  };

  const formatTime = (date: Timestamp | Date) => {
    const d = date instanceof Date ? date : date.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      return formatDistanceToNow(d, { addSuffix: true });
    } else if (diffDays < 7) {
      return format(d, 'EEEE \'at\' h:mm a');
    } else {
      return format(d, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  const groupNotificationsByDate = (notifications: Notification[]) => {
    const groups: { [key: string]: Notification[] } = {};
    const now = new Date();
    
    notifications.forEach(notification => {
      const date = notification.createdAt instanceof Date 
        ? notification.createdAt 
        : notification.createdAt.toDate();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let groupKey: string;
      if (diffDays === 0) {
        groupKey = 'Today';
      } else if (diffDays === 1) {
        groupKey = 'Yesterday';
      } else if (diffDays < 7) {
        groupKey = 'This Week';
      } else if (diffDays < 30) {
        groupKey = 'This Month';
      } else {
        groupKey = 'Older';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  };

  const groupedNotifications = filteredNotifications 
    ? groupNotificationsByDate(filteredNotifications) 
    : {};

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'You\'re all caught up!'
            }
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          {categoryFilters.map(filter => {
            const count = filter.value === 'all' 
              ? notifications?.length ?? 0
              : notifications?.filter(n => filter.types?.includes(n.type)).length ?? 0;
            
            return (
              <TabsTrigger key={filter.value} value={filter.value} className="gap-2">
                {filter.label}
                {count > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading notifications...
              </CardContent>
            </Card>
          ) : !filteredNotifications || filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'You don\'t have any notifications yet'
                    : `No ${categoryFilters.find(f => f.value === activeTab)?.label.toLowerCase()} notifications`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedNotifications).map(([groupName, groupNotifications]) => (
                <div key={groupName}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                    {groupName}
                  </h3>
                  <Card>
                    <div className="divide-y">
                      {groupNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-start gap-4 group cursor-pointer',
                            !notification.isRead && 'bg-primary/5'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex-shrink-0 mt-1 p-2 rounded-full bg-muted">
                            {notificationIcons[notification.type]}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  'text-sm',
                                  !notification.isRead && 'font-semibold'
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(notification.createdAt)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => handleDeleteNotification(e, notification.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            
                            {notification.type === 'achievement_unlocked' && notification.data?.achievementRarity && (
                              <Badge 
                                variant="outline" 
                                className={cn('mt-2 text-xs', rarityColors[notification.data.achievementRarity])}
                              >
                                {notification.data.achievementRarity} achievement
                              </Badge>
                            )}
                            
                            {notification.type === 'price_alert_triggered' && notification.data && (
                              <div className="mt-2 flex items-center gap-2 text-xs">
                                <Badge variant="outline">
                                  Target: ${notification.data.targetPrice}
                                </Badge>
                                <Badge variant={notification.data.condition === 'above' ? 'default' : 'destructive'}>
                                  Current: ${notification.data.currentPrice}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
