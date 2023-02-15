import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceLaughWink, faBell, faCircleUser, faMessage } from '@fortawesome/free-regular-svg-icons';
import { faBars, faGear } from '@fortawesome/free-solid-svg-icons';

import SignInForm from '../SignInForm/SignInForm';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import SearchBar from '../SearchBar/SearchBar';

import { useAuth } from '../../contexts/AuthContext';

import { NotificationCountContext } from '../../contexts/NotificationCountContext';
import useMediaQuery from '../../hooks/useMediaQuery';

import './GlobalHeader.css';

const GlobalHeader = ({ isOpenDrawer, setIsOpenDrawer, closeDrawer }) => {
  const { authState: { currentUser }, isAuthenticated } = useAuth();
  const { notificationCount } = useContext(NotificationCountContext);
  const isWideEnoughForIcons = useMediaQuery('(min-width: 810px)');
  const isWideEnoughForSearchBar = useMediaQuery('(min-width: 1000px)');
  const isWideEnoughForForm = useMediaQuery('(min-width: 1300px)');

  // More semantic code to tell if either type of drawer is open
  const isOpenAnyDrawer = Object.values(isOpenDrawer).some((v) => v);

  // Close any open drawers if user navigates to another
  // URL, or navigates to current URL (clicking icon, etc)
  const handleClick = () => {
    if (isOpenAnyDrawer) {
      closeDrawer();
    }
  };

  let headerRight;

  if (isAuthenticated()) {
    if (isWideEnoughForIcons) {
      headerRight = (
        <nav className="globalNav">
          <ul className="globalNav__list">
            <li className="globalNav__item">
              <Link to={`/profile/${ currentUser._id }`} onClick={handleClick}>
                <FontAwesomeIcon className="globalNav__icon" icon={faCircleUser} />
              </Link>
            </li>
            <li className="globalNav__item">
              <Link to="/messenger" onClick={handleClick}>
                <FontAwesomeIcon className="globalNav__icon" icon={faMessage} />
              </Link>
            </li>
            <li className="globalNav__item globalNav__notificationAlert">
              <FontAwesomeIcon
                className="globalNav__icon"
                icon={faBell}
                onClick={() => setIsOpenDrawer((prev) => ({ mainMenu: false, notifications: !prev.notifications }))}
              />
              {!!notificationCount && <div className="globalNav__notificationCount">{notificationCount}</div>}
            </li>
            <li className="globalNav__item">
              <FontAwesomeIcon
                className="globalNav__icon"
                icon={faGear}
                onClick={() => setIsOpenDrawer((prev) => ({ mainMenu: !prev.mainMenu, notifications: false }))}
              />
            </li>
          </ul>
        </nav>
      );
    } else { 
      headerRight = (
        <nav className="globalNav">
          <ul className="globalNav__list">
            <li
              className="globalNav__item globalNav__notificationAlert"
              onClick={() => setIsOpenDrawer((prev) => ({ mainMenu: false, notifications: !prev.notifications }))}
            >
              <FontAwesomeIcon className="globalNav__icon" icon={faBell} />
              {!!notificationCount && <div className="globalNav__notificationCount">{notificationCount}</div>}
            </li>
            <li className="globalNav__item" onClick={() => setIsOpenDrawer((prev) => ({ mainMenu: !prev.mainMenu, notifications: false }))}>
              <FontAwesomeIcon className="globalNav__icon" icon={faBars} />
            </li>
          </ul>
        </nav>
      );
    }
  } else {
    if (isWideEnoughForForm) {
      headerRight = (
        <div className="globalHeader__desktopOptions">
          <SignInForm />
          {/* <div className="globalHeader__separator" /> */}
          <GoogleSignIn />
        </div>
      );
    } else {      
      headerRight = (
        <button
          className="globalHeader__drawerToggle"
          type="button" onClick={() => setIsOpenDrawer((prev) => ({ mainMenu: !prev.mainMenu, notifications: false }))}
        >
          {isOpenDrawer.mainMenu ? "CLOSE" : "SIGN IN"}
        </button>
      );
    }
  }

  return (
    <header className="globalHeader">
      <div className="globalHeader__innerWrapper">
        <Link className="logo" to={isAuthenticated() ? "/timeline" : ""} onClick={handleClick}>
          <FontAwesomeIcon className="logo__icon" icon={faFaceLaughWink} />
          <h1 className="logo__name">FakeMates</h1>
        </Link>
        { isAuthenticated() && isWideEnoughForSearchBar && <SearchBar isOpen={isOpenAnyDrawer} /> }
        {headerRight}
      </div>
    </header>
  );
};

export default GlobalHeader;
