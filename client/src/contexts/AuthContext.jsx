import { useState, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = localStorage.getItem('currentUser');
  const expiresAt = localStorage.getItem('expiresAt');

  // optionally, use state initializer function here
  const [authState, setAuthState] = useState({
    currentUser: currentUser ? JSON.parse(currentUser) : null,
    expiresAt,
  });

  // Used in private/public route guards in order to skip the checks
  // when they only execute as a result of a re-render (caused by updating
  // authState) in which case we just want to re-render the page as-is
  // update authState => app re-renders as-is => navigate away
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const setAuthInfo = ({ currentUser, expiresAt }) => {
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    localStorage.setItem('expiresAt', expiresAt);

    setAuthState({
      currentUser,
      expiresAt,
    });
  };

  const logIn = (authState) => {
    setIsLoggingIn(true);

    setAuthInfo(authState);

    // Redirect to referer, or homepage
    const from = location.state?.from || '/timeline';
    navigate(from, { replace: true });

    setIsLoggingIn(false);
  }

  const logOut = () => {
    setIsLoggingOut(true);

    localStorage.removeItem('currentUser');
    localStorage.removeItem('expiresAt');

    setAuthState({}); // runs before navigate() despite being async

    navigate('/login');

    setIsLoggingOut(false);
  };

  const isAuthenticated = () => !!authState.currentUser;

  // const isAdmin = () => authState.currentUser.role === 'admin'; // authState.currentUser?.role === 'admin' || false;

  return (
    <AuthContext.Provider
      value={{
        authState,
        logIn,
        isLoggingIn,
        logOut,
        isLoggingOut,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, useAuth };

// auth flow: add to localStorage => add to state => redirect

// Use redux action LOGIN_START/LOGOUT_START ({ user, isFetching, error })
// with isFetching set to true instead of isLoggingIn/isLoggingOut
