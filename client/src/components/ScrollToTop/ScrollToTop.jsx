import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp } from '@fortawesome/free-solid-svg-icons';

import './ScrollToTop.css';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    const toggleVisibility = () => {
      window.scrollY > 400
        ? setIsVisible(true)
        : setIsVisible(false);
    };

    window.addEventListener('scroll', toggleVisibility);

    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <button className={`scrollToTop ${ isVisible ? "scrollToTop--visible" : "" }`} type="button" onClick={scrollToTop}>
      <FontAwesomeIcon className="scrollToTop__icon" icon={faChevronUp} />
    </button>
  );
};

export default ScrollToTop;
