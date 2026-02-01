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
  Menu, 
  Settings, 
  LogOut, 
  Users, 
  Plus, 
  Rss, 
  Wallet, 
  ArrowLeftRight, 
  Trophy, 
  Award,
  Sparkles,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AddCardDialog } from '@/components/add-card-dialog';
import { NotificationBell } from '@/components/notification-bell';
import type { Collection } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Collection' },
  { href: '/feed', icon: Rss, label: 'Feed' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/portfolio', icon: Wallet, label: 'Portfolio' },
  { href: '/trades', icon: ArrowLeftRight, label: 'Trades' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/achievements', icon: Award, label: 'Achievements' },
  { href: '/discover', icon: Users, label: 'Discover' },
  { href: '/grading-guide', icon: BookOpen, label: 'Grading Guide' },
];

export function MobileHeader() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);
  const [userData, setUserData] = useState<{ displayName?: string; photoURL?: string } | null>(null);

  // Fetch user's collections
  const collectionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'collections'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: collections = [] } = useCollection<Collection>(collectionsQuery);

  const handleSignOut = async () => {
    await signOut(auth);
    setIsOpen(false);
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

  return (
    <header className="lg:hidden sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 font-bold font-headline text-xl"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icons.logo className="w-8 h-8" />
                    GSA
                  </Link>
                </div>

                {/* Nav Items */}
                <div className="flex-1 overflow-y-auto p-3">
                  <div className="space-y-1">
                    {navItems.map((item) => (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={pathname === item.href ? 'secondary' : 'ghost'}
                          className="w-full justify-start gap-3"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Button>
                      </Link>
                    ))}
                    
                    {username && isProfilePublic && (
                      <>
                        <Separator className="my-2" />
                        <Link href={`/${username}`} target="_blank" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start gap-3">
                            <User className="h-4 w-4" />
                            Public Profile
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>

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
                    <Link href="/account" onClick={() => setIsOpen(false)}>
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
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="flex items-center gap-2 font-bold font-headline text-lg">
            <Icons.logo className="w-6 h-6" />
            GSA
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
            onClick={() => setShowAddCardDialog(true)}
            disabled={!user}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
          
          <Link href="/grade">
            <Button size="sm" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Grade</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Add Card Dialog */}
      <AddCardDialog 
        open={showAddCardDialog} 
        onOpenChange={setShowAddCardDialog}
        collections={collections || []}
      />
    </header>
  );
}
