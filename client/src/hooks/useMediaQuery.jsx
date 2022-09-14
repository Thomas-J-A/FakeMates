import { useState, useEffect } from 'react';

const useMediaQuery = (query) => {
  const [isMatching, setIsMatching] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);

    // Initial check on page load
    if (media.matches !== isMatching) {
      setIsMatching(media.matches);
    }

    // Check for changes to viewport width for duration of component
    const handleChange = (e) => setIsMatching(e.matches);
    media.addEventListener('change', handleChange);

    return () => media.removeEventListener('change', handleChange);
  }, [query]);

  return isMatching;
};

export default useMediaQuery;
