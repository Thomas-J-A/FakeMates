import { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
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

import { AuthProvider } from './contexts/AuthContext';

import './App.css';

const App = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    setIsOpen((prevValue) => !prevValue);
  };

  const closeDrawer = () => {
    setIsOpen(false);
  }

  return (
    <Router>
      <AuthProvider>
        <GlobalHeader isOpen={isOpen} toggleDrawer={toggleDrawer} />
        <Routes>
          <Route path="/" element={<Landing isOpen={isOpen} closeDrawer={closeDrawer} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/messenger" element={<Messenger />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <GlobalFooter />
      </AuthProvider>
    </Router>
  );
};

export default App;
