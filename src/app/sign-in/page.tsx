'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message || 'Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await authClient.signIn.social({ provider: 'google' });
      if (result.error) setError(result.error.message || 'Failed to sign in with Google');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-stone-50">
      <Card className="w-full max-w-md bg-white border-stone-200">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-stone-900">Welcome to THE WAY</CardTitle>
          <CardDescription className="text-stone-500">Sign in to continue your journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button variant="outline" onClick={handleGoogleSignIn} disabled={googleLoading} className="w-full">
            {googleLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : (
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-stone-500">or sign in with email</span>
          </div>

          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Email</label>
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-stone-700 mb-1 block">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <Link href="/sign-up" className="text-stone-900 font-medium hover:underline">Sign up</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
