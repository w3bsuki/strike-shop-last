// Emergency mock for Clerk - TEMPORARY FOR BUILD
export const useUser = () => ({
  isSignedIn: false,
  user: null,
  isLoaded: true
});

export const useClerk = () => ({
  signOut: () => Promise.resolve(),
  openUserProfile: () => {},
  openSignIn: () => {},
  openSignUp: () => {}
});

export const SignInButton = ({ children, mode, ...props }: any) => children;
export const UserButton = (props: any) => null;
export const SignedIn = ({ children }: any) => children;
export const SignedOut = ({ children }: any) => children;
export const ClerkProvider = ({ children, ...props }: any) => children;

export default {
  useUser,
  useClerk,
  SignInButton,
  UserButton,
  SignedIn,
  SignedOut,
  ClerkProvider
};