import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

import SignInForm from '../SignInForm/SignInForm';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';

import './Drawer.css';

const Drawer = ({ isOpen, closeDrawer }) => {
  const formRef = useRef(null);

  // Clear input fields when drawer closes
  useEffect(() => {
    const clearFields = () => {
      formRef.current.resetForm();
    };

    if (!isOpen) {
      setTimeout(clearFields, 300);
    }
  }, [isOpen]);

  // Close drawer by pressing esc key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        // If any input in drawer is focused, remove focus
        e.target.blur();
        closeDrawer();
      }
    };

    if (isOpen) {
      window.addEventListener('keyup', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keyup', handleKeyPress);
    }
  }, [isOpen, closeDrawer]);

  return (
    <div className={`drawer ${ isOpen ? "drawer--open" : "" }`}>
      <SignInForm ref={formRef} />
      <div className="orSeparator">
        <div className="orSeparator__line" />
        <p className="orSeparator__text">OR</p>
        <div className="orSeparator__line" />
      </div>
      <GoogleSignIn />
      <button
        className="closeDrawer"
        type="button"
        onClick={closeDrawer}
      >
        <FontAwesomeIcon className="closeDrawer__icon" icon={faChevronRight} />
      </button>
    </div>
  );
};

export default Drawer;


// const bodyRef = useRef(document.querySelector('body'));

// // Prevent scrolling when drawer is open
// useEffect(() => {
//   const updatePageScroll = () => {
//     if (isOpen) {
//       bodyRef.current.style.overflow = 'hidden';
//     } else {
//       bodyRef.current.style.overflow = '';
//     }
//   };

//   updatePageScroll();
// }, [isOpen]);





  // const isMounted = useRef(false);
    // // Not necessary to reset fields on mount
    // if (!isMounted.current) {
    //   console.log('isMounted ref changed')
    //   isMounted.current = true;
