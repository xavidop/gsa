import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { AuthForm } from '../auth-form';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <Link href="/" className="flex items-center gap-2 font-bold font-headline text-2xl">
        <Icons.logo className="w-10 h-10" />
        <h1>Global Slab Authority</h1>
      </Link>
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Enter your email below to log in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AuthForm mode="login" />
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
