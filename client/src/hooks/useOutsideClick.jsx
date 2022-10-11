import { useEffect, useRef } from 'react';

const useOutsideClick = (cb) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        cb();
      }
    }

    document.addEventListener('click', handleClick);
    // document.addEventListener('touchstart', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
      // document.removeEventListener('touchstart', handleClick);
    };
  }, [ref, cb]);

  return ref;
};

export default useOutsideClick;
