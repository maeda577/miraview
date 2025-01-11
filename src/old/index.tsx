import React from 'react';
import ReactDOM from 'react-dom/client';
import Miraview from './Miraview';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Miraview />
  </React.StrictMode>
);
