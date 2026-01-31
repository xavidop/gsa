'use client';

import Link from 'next/link';
import { Icons } from '@/components/icons';
import { UserNav } from '@/components/user-nav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, BarChart3, User, PlusCircle, BookOpen, Menu, Settings, LogOut, Users, Plus, Rss } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useAuth, useCollection, useMemoFirebase } from '@/firebase';
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { AddCardDialog } from '@/components/add-card-dialog';
import type { Collection } from '@/lib/types';

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);

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
      }
    };
    fetchUserData();
  }, [user, firestore]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            GSA
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button 
                variant={pathname === '/dashboard' ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Collection
              </Button>
            </Link>
            
            <Link href="/feed">
              <Button 
                variant={pathname === '/feed' ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <Rss className="h-4 w-4" />
                Feed
              </Button>
            </Link>
            
            <Link href="/analytics">
              <Button 
                variant={pathname === '/analytics' ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
            
            <Link href="/discover">
              <Button 
                variant={pathname === '/discover' ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <Users className="h-4 w-4" />
                Discover
              </Button>
            </Link>

            <Link href="/grading-guide">
              <Button 
                variant={pathname === '/grading-guide' ? 'secondary' : 'ghost'} 
                size="sm"
                className="gap-2"
              >
                <BookOpen className="h-4 w-4" />
                Grading Guide
              </Button>
            </Link>
            
            {username && isProfilePublic && (
              <Link href={`/${username}`} target="_blank">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Public Profile
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="gap-2"
            onClick={() => setShowAddCardDialog(true)}
            disabled={!user}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Card</span>
          </Button>
          
          <Link href="/grade">
            <Button size="sm" className="gap-2">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Grade Card</span>
            </Button>
          </Link>
          <div className="hidden md:block">
            <UserNav />
          </div>
          
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <nav className="flex flex-col gap-4 mt-8">
                {/* User Info */}
                <div className="flex items-center gap-3 pb-4 border-b">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
                    <AvatarFallback className="text-sm">
                      {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.displayName || 'My Account'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                
                <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={pathname === '/dashboard' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2"
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Collection
                  </Button>
                </Link>
                
                <Link href="/feed" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={pathname === '/feed' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2"
                  >
                    <Rss className="h-4 w-4" />
                    Feed
                  </Button>
                </Link>
                
                <Link href="/analytics" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={pathname === '/analytics' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Button>
                </Link>
                
                <Link href="/discover" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={pathname === '/discover' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2"
                  >
                    <Users className="h-4 w-4" />
                    Discover
                  </Button>
                </Link>

                <Link href="/grading-guide" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant={pathname === '/grading-guide' ? 'secondary' : 'ghost'} 
                    className="w-full justify-start gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    Grading Guide
                  </Button>
                </Link>
                
                {username && isProfilePublic && (
                  <Link href={`/${username}`} target="_blank" onClick={() => setIsOpen(false)}>
                    <Button 
                      variant="ghost"
                      className="w-full justify-start gap-2"
                    >
                      <User className="h-4 w-4" />
                      Public Profile
                    </Button>
                  </Link>
                )}
                
                <div className="border-t my-2" />
                
                <Link href="/account" onClick={() => setIsOpen(false)}>
                  <Button 
                    variant="ghost"
                    className="w-full justify-start gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {/* Add Card Dialog */}
      {user && (
        <AddCardDialog
          open={showAddCardDialog}
          onOpenChange={setShowAddCardDialog}
          collections={collections || []}
        />
      )}
    </header>
  );
}
