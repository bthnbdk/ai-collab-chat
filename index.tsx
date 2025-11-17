import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const renderError = (title: string, message: string) => {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'flex items-center justify-center h-screen bg-gray-900 text-white text-center p-4';
  errorDiv.innerHTML = `
    <div class="bg-red-900/50 border border-red-500 text-red-300 p-6 rounded-lg">
      <h1 class="text-2xl font-bold mb-2">${title}</h1>
      <p>${message}</p>
    </div>
  `;
  rootElement.innerHTML = '';
  rootElement.appendChild(errorDiv);
};

const renderLoading = (message: string) => {
  root.render(
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      <div className="text-xl">{message}</div>
    </div>
  );
};

const initializeApp = async () => {
  renderLoading('Fetching configuration...');
  try {
    const response = await fetch('/.netlify/functions/auth0-config');
    if (!response.ok) {
      throw new Error('Could not fetch Auth0 configuration from the server.');
    }
    const config = await response.json();

    if (!config.domain || !config.clientId || !config.audience) {
      renderError(
        'Auth0 Configuration Error',
        'Please ensure the Auth0 extension is correctly installed and configured in your Netlify site settings.'
      );
      return;
    }

    root.render(
      <React.StrictMode>
        <Auth0Provider
          domain={config.domain}
          clientId={config.clientId}
          authorizationParams={{
            audience: config.audience,
          }}
        >
          <App />
        </Auth0Provider>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Initialization failed:', error);
    renderError(
      'Application Failed to Load',
      'Could not connect to the backend service. Please check your network connection and try again.'
    );
  }
};

initializeApp();
