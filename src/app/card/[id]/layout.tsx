'use client';

import { useUser } from '@/firebase';
import { Sidebar } from '@/components/sidebar';
import { MobileHeader } from '@/components/mobile-header';
import { TopBar } from '@/components/top-bar';
import { Icons } from '@/components/icons';
import Link from 'next/link';

export default function CardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useUser();

  // If user is logged in, show sidebar layout
  if (user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <MobileHeader />
          <TopBar />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    );
  }

  // If not logged in, show simple header with logo
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            GSA
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
