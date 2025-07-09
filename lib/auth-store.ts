// Legacy compatibility export for auth store
// This file provides backward compatibility for components still importing @/lib/auth-store
// New components should use @/lib/stores for the unified store

import { useStore } from './stores';

export const useAuthStore = () => {
  const auth = useStore((state) => state.auth);
  const actions = useStore((state) => state.actions.auth);
  
  return {
    ...auth,
    ...actions,
  };
};

export { 
  useAuthActions,
  useUser,
  useIsAuthenticated,
  useAuthLoading 
} from './stores';