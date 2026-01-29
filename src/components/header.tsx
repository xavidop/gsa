import Link from 'next/link';
import { Icons } from '@/components/icons';
import { UserNav } from '@/components/user-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold font-headline text-xl">
          <Icons.logo className="w-8 h-8" />
          GSA
        </Link>
        <UserNav />
      </div>
    </header>
  );
}
