import { useState, useEffect } from 'react';
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

import './App.css';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  // Close drawer when navigating to a new page
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  }, [pathname]);

  const toggleDrawer = () => {
    setIsOpen((prevValue) => !prevValue);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  }

  return (
    <>
      <GlobalHeader isOpen={isOpen} toggleDrawer={toggleDrawer} closeDrawer={closeDrawer} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile/:id" element={<Profile key={pathname} />} /> {/* NOTE 1 */}
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/post/:id" element={<PostDetail />} />
        <Route path="/messenger" element={<Messenger />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Backdrop type="drawer" isVisible={isOpen} close={closeDrawer} />
      <Drawer isOpen={isOpen} closeDrawer={closeDrawer} />
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
