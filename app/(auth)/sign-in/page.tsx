// CVE-2025-29927 Compliant: Server Component with Data Access Layer auth
import { redirectIfAuthenticated } from '@/lib/auth/server';
import { SignInForm } from './SignInForm';

export default async function SignInPage() {
  // Redirect authenticated users to account page
  await redirectIfAuthenticated('/account');
  return <SignInForm />;
}