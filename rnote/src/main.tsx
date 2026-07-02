import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './presentation/app/App';
// Token definitions must load before the Tailwind layers that consume them.
import './presentation/theme/tokens.css';
import './presentation/theme/globals.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found.');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
