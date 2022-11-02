import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleUser, faMessage } from '@fortawesome/free-regular-svg-icons';
import { faChevronRight, faArrowRightFromBracket, faUserXmark } from '@fortawesome/free-solid-svg-icons';

import SignInForm from '../SignInForm/SignInForm';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import SearchBar from '../SearchBar/SearchBar';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';

import { useAuth } from '../../contexts/AuthContext';

import useMediaQuery from '../../hooks/useMediaQuery';

import './Drawer.css';

const Drawer = ({ isOpen, closeDrawer }) => {
  const { authState: { currentUser }, logOut, isAuthenticated } = useAuth();
  const formRef = useRef(null);
  const bodyRef = useRef(document.querySelector('body'));
  const isNarrowEnoughForLinks = useMediaQuery('(max-width: 809px)');
  const isNarrowEnoughForSearchBar = useMediaQuery('(max-width: 1000px)');

  // Clear input fields when drawer closes
  useEffect(() => {
    const clearFields = () => {
      formRef.current?.resetForm();
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

  // Prevent scrolling while drawer is open
  useEffect(() => {
    const updatePageScroll = () => {
      if (isOpen) {
        bodyRef.current.style.overflow = 'hidden';
      } else {
        bodyRef.current.style.overflow = '';
      }
    };

    updatePageScroll();
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      const res = await fetch('http://192.168.8.146:3000/api/auth/logout', {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 204) {
        // Logout attempt successful
        return logOut();
      }
      
      if (res.status === 500) {
        // Unknown 500 error on server
        const body = await res.json();
        throw new Error(body.message);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account');
  };

  const handleClick = () => {
    if (isOpen) {
      closeDrawer();
    }
  };

  return (
    <div className={`drawer ${ isOpen ? "drawer--open" : "" }`}>
      <div className="drawer__innerWrapper">
        { isAuthenticated()
          ? (
              <>
                { isNarrowEnoughForSearchBar && <SearchBar isOpen={isOpen} closeDrawer={closeDrawer} /> }
                { isNarrowEnoughForLinks &&
                  <nav className="drawerNav">
                    <ul className="drawerNav__list">
                      <li className="drawerNav__item">
                        <Link className="drawerNav__link" to={`/profile/${ currentUser._id }`} onClick={handleClick} state={{ userId: currentUser._id }}>
                          <FontAwesomeIcon className="drawerNav__linkIcon" icon={faCircleUser} />
                          <span className="drawerNav__linkText">Profile</span>
                        </Link>
                      </li>
                      <li className="drawerNav__item">
                        <Link className="drawerNav__link" to="/messenger" onClick={handleClick}>
                          <FontAwesomeIcon className="drawerNav__linkIcon" icon={faMessage} />
                          <span className="drawerNav__linkText">Messenger</span>
                        </Link>
                      </li>
                    </ul>
                  </nav>
                }
                <ToggleSwitch />
                <div className="drawer__buttons">
                  <button
                    className="drawer__signOut"
                    type="button"
                    onClick={handleSignOut}
                  >
                    <FontAwesomeIcon icon={faArrowRightFromBracket} />
                    SIGN OUT
                  </button>
                  <button
                    className="drawer__deleteAccount"
                    type="button"
                    onClick={handleDeleteAccount}
                  >
                    <FontAwesomeIcon icon={faUserXmark} />
                    DELETE ACCOUNT
                  </button>
                </div>
              </>
          ) : (
            <>
              <SignInForm ref={formRef} /> 
              <div className="orSeparator">
                <div className="orSeparator__line" />
                <p className="orSeparator__text">OR</p>
                <div className="orSeparator__line" />
              </div>
              <GoogleSignIn />
            </>
          )
        }
      </div>
      {/* <button
        className="closeDrawer"
        type="button"
        onClick={closeDrawer}
        >
        <FontAwesomeIcon className="closeDrawer__icon" icon={faChevronRight} />
      </button> */}
    </div>
  );
};

export default Drawer;
