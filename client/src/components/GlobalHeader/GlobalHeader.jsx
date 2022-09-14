import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceLaughWink } from '@fortawesome/free-regular-svg-icons';

import SignInForm from '../SignInForm/SignInForm';
import GoogleSignIn from '../GoogleSignIn/GoogleSignIn';

import useMediaQuery from '../../hooks/useMediaQuery';

import './GlobalHeader.css';

const GlobalHeader = ({ isOpen, toggleDrawer }) => {
  const isWideEnough = useMediaQuery('(min-width: 1300px)');

  return (
    <header className="globalHeader">
      <div className="logo">
        <FontAwesomeIcon className="logo__icon" icon={faFaceLaughWink} />
        <h1 className="logo__name">FakeMates</h1>
      </div>
      { isWideEnough
        ? (
          <div className="globalHeader__desktopOptions">
            <SignInForm />
            {/* <div className="globalHeader__separator" /> */}
            <GoogleSignIn />
          </div>
        ) : (
          <button className="globalHeader__drawerToggle" type="button" onClick={toggleDrawer}>{isOpen ? "CLOSE" : "SIGN IN"}</button>
        )
      }
    </header>
  );
};

export default GlobalHeader;
