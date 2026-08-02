import { QueryClient } from '@tanstack/react-query';

// Shared server-state cache for the app. Sensible mobile defaults:
// data stays fresh 2 min (no refetch), cached 30 min, 1 retry.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
