import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { SkeletonTheme } from 'react-loading-skeleton';

import App from './App';

import { AuthProvider } from './contexts/AuthContext';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <Router>
      <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <SkeletonTheme baseColor="#e9e9e9" highlightColor="#f7f7f7">
            <App />
          </SkeletonTheme>
        </AuthProvider>
    </GoogleOAuthProvider>
  </Router>
);

// Subscribe to HMR
if (module.hot) {
  module.hot.accept();
}
