import { useState, useEffect, useMemo } from 'react';

const useMediaQuery = (query) => {
  const media = useMemo(() => window.matchMedia(query), [query]);

  // Check match status on initial render
  const [isMatching, setIsMatching] = useState(media.matches);

  // Check match status for duration of component
  useEffect(() => {
    const handleChange = (e) => setIsMatching(e.matches);
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, [media]);

  return isMatching;
};

export default useMediaQuery;
