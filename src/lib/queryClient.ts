import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 minutes
      gcTime: 1000 * 60 * 120, // 2 hours
      retry: 1,
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: true,
      refetchOnMount: true
    }
  }
});