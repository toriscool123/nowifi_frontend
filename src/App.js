import { useState } from 'react';
import BrandPanel from './components/BrandPanel';
import Home from './components/Home';
import LoginForm from './components/LoginForm';
import './App.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin && !isLoggedIn) {
    return (
      <main className="page">
        <BrandPanel />
        <LoginForm
          onLogin={() => {
            setIsLoggedIn(true);
            setShowLogin(false);
          }}
          onCancel={() => setShowLogin(false)}
        />
      </main>
    );
  }

  return (
    <Home
      isLoggedIn={isLoggedIn}
      onLoginClick={() => setShowLogin(true)}
      onLogout={() => setIsLoggedIn(false)}
    />
  );
}