import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeOptimizedFirestore } from './lib/firestore-optimizations';

// Initialize backend optimizations
initializeOptimizedFirestore();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
