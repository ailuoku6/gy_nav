import React from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore
import App from './App';
import { Provider as StoreProvider } from 'react-redux';
// @ts-ignore
import store from './redux/store';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider store={store}>
      <App />
    </StoreProvider>
  </React.StrictMode>
);
