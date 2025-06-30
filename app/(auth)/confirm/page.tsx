'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'email') {
          throw new Error('Invalid confirmation link');
        }

        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (error) throw error;

        // Email verification successful
        // Additional customer setup can be added here if needed

        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting to sign in...');
        
        setTimeout(() => {
          router.push('/sign-in?message=Email confirmed! You can now sign in.');
        }, 2000);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Failed to confirm email');
      }
    };

    confirmEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Email Confirmation</CardTitle>
          <CardDescription>
            Verifying your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
              <p className="text-gray-600">Confirming your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Alert>
                <AlertDescription className="text-center">
                  {message}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <Alert variant="destructive">
                <AlertDescription className="text-center">
                  {message}
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-2 w-full">
                <Button asChild className="w-full">
                  <Link href="/sign-up">
                    Try signing up again
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Go to homepage
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}