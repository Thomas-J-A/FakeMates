import { useEffect, useRef } from 'react';

import './Backdrop.css';

// When backdrop is used with a drawer component it doesn't cover header and footer
// When backdrop is used with a modal component it covers full viewport
const Backdrop = ({ type, isVisible, close }) => {
  const bodyRef = useRef(document.querySelector('body'));
  
  // Prevent scrolling while drawer/modal is visible
  useEffect(() => {
    const updatePageScroll = () => {
      if (isVisible) {
        bodyRef.current.style.overflow = 'hidden';
      } else {
        bodyRef.current.style.overflow = '';
      }
    };

    updatePageScroll();
  }, [isVisible]);

  return (
    <div
      className={`
        backdrop
        ${ type === 'drawer' ? "backdrop--drawer" : "backdrop--modal"}
        ${ isVisible ? "backdrop--visible" : "" }
      `}
      onClick={close}
    />
  );
};

export default Backdrop;
