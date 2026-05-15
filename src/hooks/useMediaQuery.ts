import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (for SSR compatibility)
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      
      // Set initial value
      setMatches(mediaQuery.matches);
      
      // Create event listener
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };
      
      // Add event listener
      mediaQuery.addEventListener('change', handleChange);
      
      // Clean up
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    
    // Default to false if window is not available
    return () => {};
  }, [query]);

  return matches;
}