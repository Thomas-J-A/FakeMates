import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Routes,
  Route,
  useLocation,
} from 'react-router-dom';

import Landing from './pages/Landing/Landing';
import Search from './pages/Search/Search';
import Profile from './pages/Profile/Profile';
import Timeline from './pages/Timeline/Timeline';
import PostDetail from './pages/PostDetail/PostDetail';
import Messenger from './pages/Messenger/Messenger';
import NotFound from './pages/NotFound/NotFound';

import GlobalHeader from './components/GlobalHeader/GlobalHeader';
import GlobalFooter from './components/GlobalFooter/GlobalFooter';
import Backdrop from './components/Backdrop/Backdrop';
import Drawer from './components/Drawer/Drawer';

import { useAuth } from './contexts/AuthContext';

import './App.css';

const App = () => {
  const [isOpenDrawer, setIsOpenDrawer] = useState({
    mainMenu: false,
    notifications: false,
  });

  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  // Close any drawer that is currently open
  const closeDrawer = useCallback(() => {
    setIsOpenDrawer({
      mainMenu: false,
      notifications: false,
    });
  }, [setIsOpenDrawer]);

  // Create more semantic, memoized code to tell if any type of drawer is open
  const isOpenAnyDrawer = useMemo(() => Object.values(isOpenDrawer).some((v) => v), [isOpenDrawer]);

  // Close drawer when navigating to a new page
  // Drawer is closed elsewhere in most cases,
  // but during sign-in/out the check will pass
  useEffect(() => {
    if (isOpenAnyDrawer) {
      closeDrawer();
    }
  }, [pathname]);

  // Close drawer by pressing esc key
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        // If any input in drawer is focused, remove focus
        e.target.blur();
        closeDrawer();
      }
    };

    if (isOpenAnyDrawer) {
      window.addEventListener('keyup', handleKeyPress);
    }

    return () => {
      window.removeEventListener('keyup', handleKeyPress);
    }
  }, [isOpenAnyDrawer, closeDrawer]);

  return (
    <>
      <GlobalHeader
        isOpenDrawer={isOpenDrawer}
        setIsOpenDrawer={setIsOpenDrawer}
        closeDrawer={closeDrawer}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:id" element={<Profile key={pathname} />} /> {/* NOTE 1 */}
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/messenger" element={<Messenger />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Backdrop
        type="drawer"
        isVisible={Object.values(isOpenDrawer).some((v) => v)}
        close={closeDrawer}
      />
      <Drawer 
        type="mainMenu"
        isOpen={isOpenDrawer.mainMenu}
        closeDrawer={closeDrawer}
      />
      {isAuthenticated() && (
        <Drawer
          type="notifications"
          isOpen={isOpenDrawer.notifications}
          closeDrawer={closeDrawer}
        />
      )}
      <GlobalFooter />
    </>
  );
};

export default App;

// NOTE 1
// Using a key ensures that whenever the :id path param changes, the whole component is simply remounted rather than
// updated; by default, the component is just updated because technically the route remains the same. This means
// that when a user navigates to a profile page from another profile page, less code is needed to try and reinitialize
// loading state, posts already stored in state belonging to the previous profile, etc.
