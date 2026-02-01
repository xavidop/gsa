'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  BarChart3, 
  User, 
  BookOpen, 
  Users, 
  Rss, 
  Wallet, 
  ArrowLeftRight, 
  Trophy, 
  Award,
  Settings,
  LogOut,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationBell } from '@/components/notification-bell';
import type { Notification } from '@/lib/types';

const mainNavItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Collection' },
  { href: '/feed', icon: Rss, label: 'Feed' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { href: '/trades', icon: ArrowLeftRight, label: 'Trades' },
];

const communityNavItems = [
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/achievements', icon: Award, label: 'Achievements' },
  { href: '/discover', icon: Users, label: 'Discover' },
];

const resourceNavItems = [
  { href: '/grading-guide', icon: BookOpen, label: 'Grading Guide' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [userData, setUserData] = useState<{ displayName?: string; photoURL?: string } | null>(null);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      const userDoc = await getDoc(doc(firestore, 'users', user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUsername(data?.username || null);
        setIsProfilePublic(data?.isProfilePublic !== false);
        setUserData({
          displayName: data?.displayName || user.displayName || user.email,
          photoURL: data?.photoURL || user.photoURL,
        });
      }
    };
    fetchUserData();
  }, [user, firestore]);

  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => (
    <Link href={href}>
      <Button
        variant={pathname === href ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start gap-3',
          pathname === href && 'bg-secondary'
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );

  return (
    <div className="hidden lg:flex flex-col w-64 border-r bg-card min-h-screen h-full sticky top-0 self-start">
      {/* Logo and Notifications */}
      <div className="h-14 px-4 border-b flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold font-headline text-xl">
          <Icons.logo className="w-8 h-8" />
          GSA
        </Link>
        <NotificationBell />
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Community
        </div>
        <div className="space-y-1">
          {communityNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>

        <Separator className="my-4" />

        <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Resources
        </div>
        <div className="space-y-1">
          {resourceNavItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
          {username && isProfilePublic && (
            <Link href={`/${username}`} target="_blank">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <User className="h-4 w-4" />
                Public Profile
              </Button>
            </Link>
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-3 mb-3 px-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={userData?.photoURL || ''} />
            <AvatarFallback>
              {userData?.displayName?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userData?.displayName || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{username || 'username'}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <Link href="/account">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
