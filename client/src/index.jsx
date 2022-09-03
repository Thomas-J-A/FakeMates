import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(<App />);

// Subscribe to HMR
if (module.hot) {
  module.hot.accept();
}
