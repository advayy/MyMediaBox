import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import './skins/retro98.css';
import { applySkin } from './lib/theme';
import { DEFAULT_SETTINGS } from './types';

applySkin(DEFAULT_SETTINGS);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
