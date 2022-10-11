import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceLaughWink, faBell, faCircleUser, faMessage } from '@fortawesome/free-regular-svg-icons';
import { faBars, faGear } from '@fortawesome/free-solid-svg-icons';

import SignInForm from '../SignInForm/SignInForm';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';
import SearchBar from '../SearchBar/SearchBar';

import { useAuth } from '../../contexts/AuthContext';

import useMediaQuery from '../../hooks/useMediaQuery';

import './GlobalHeader.css';

const GlobalHeader = ({ isOpen, toggleDrawer, closeDrawer }) => {
  const { authState: { currentUser }, isAuthenticated } = useAuth();
  const isWideEnoughForIcons = useMediaQuery('(min-width: 810px)');
  const isWideEnoughForSearchBar = useMediaQuery('(min-width: 1000px)');
  const isWideEnoughForForm = useMediaQuery('(min-width: 1300px)');

  // useLocation hook in App.jsx closes drawer when user navigates to
  // a new URL, but if user clicks an icon which navigates to current URL
  // it won't execute, so this function closes drawer in such cases
  const handleClick = () => {
    if (isOpen) {
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
            <li className="globalNav__item">
              <FontAwesomeIcon className="globalNav__icon" icon={faBell} onClick={toggleDrawer} />
            </li>
            <li className="globalNav__item">
              <FontAwesomeIcon className="globalNav__icon" icon={faGear} onClick={toggleDrawer} />
            </li>
          </ul>
        </nav>
      );
    } else { 
      headerRight = (
        <nav className="globalNav">
          <ul className="globalNav__list">
            <li className="globalNav__item" onClick={toggleDrawer}>
              <FontAwesomeIcon className="globalNav__icon" icon={faBell} />
            </li>
            <li className="globalNav__item" onClick={toggleDrawer}>
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
          type="button" onClick={toggleDrawer}
        >
          {isOpen ? "CLOSE" : "SIGN IN"}
        </button>
      );
    }
  }

  return (
    <header className="globalHeader">
      <Link className="logo" to={isAuthenticated() ? "/timeline" : ""} onClick={handleClick}>
        <FontAwesomeIcon className="logo__icon" icon={faFaceLaughWink} />
        <h1 className="logo__name">FakeMates</h1>
      </Link>
      { isAuthenticated() && isWideEnoughForSearchBar && <SearchBar isOpen={isOpen} /> }
      {headerRight}
    </header>
  );
};

export default GlobalHeader;
