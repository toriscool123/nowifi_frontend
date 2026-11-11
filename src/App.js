import { useState } from 'react';
import BrandPanel from './components/BrandPanel';
import LoginForm from './components/LoginForm';
import LoginSuccess from './components/LoginSuccess';
import Home from './components/Home';
import './App.css';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      <main className="page">

        <BrandPanel />
        <LoginForm onLogin={() => setIsLoggedIn(true)} />
      </main>

      {isLoggedIn && (
        <LoginSuccess onBack={() => setIsLoggedIn(false)} />
      )}
    </>
  );
}