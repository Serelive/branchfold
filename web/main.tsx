import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Workspace from './Workspace';
import './style.css';
createRoot(document.getElementById('root')!).render(<StrictMode><Workspace /></StrictMode>);
