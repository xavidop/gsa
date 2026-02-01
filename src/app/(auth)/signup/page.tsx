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

export default function SignupPage() {
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md">
      <Link href="/" className="flex items-center gap-2 font-bold font-headline text-2xl">
        <Icons.logo className="w-10 h-10" />
        <h1>Global Slab Authority</h1>
      </Link>
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <AuthForm mode="signup" />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-accent font-medium hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
