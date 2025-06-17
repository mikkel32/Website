import React from 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js'
import ReactDOM from 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js'
import { AuthProvider } from './AuthContext.jsx'

function App() {
  return React.createElement('div', null, 'SecureVault App Running');
}

const rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(
  React.createElement(AuthProvider, null, React.createElement(App))
);
