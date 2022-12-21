import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTopOnTransition = ({ children }) => {
  const { pathname } = useLocation();

  // useLayoutEffect ensures function runs before browser repaint
  // change url => update DOM => scroll to top => browser repaint
  useLayoutEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'auto',
    });
  }, [pathname]);

  return children;
};

export default ScrollToTopOnTransition;
