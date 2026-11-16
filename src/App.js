import { useState } from 'react';
import { api } from './api';
import Home from './components/Home';
import LoginForm from './components/LoginForm';
import AdminPage from './pages/AdminPage';
import HelpPage from './pages/Helppage';
import UserPage from './pages/UserPage';

export default function App() {
  const [me, setMe] = useState(null);
  // Vilken sida som visas: 'home' (startsida), 'login', 'admin' eller 'help'
  const [view, setView] = useState('home');

  function handleLogin(foundUser) {
    setMe({
      username: foundUser.user,
      role: foundUser.role,
      services: foundUser.services || [],
    });
    setView('home'); // Efter inloggning landar man alltid på Home
  }

  async function handleLogout() {
    try {
      await api('userlogout', 'POST');
    } catch {
      // Ignorera – vi loggar ut lokalt ändå
    }
    localStorage.removeItem('token');
    setMe(null);
    setView('home');
  }

  // Inloggningssidan visas bara när man klickat på "Logga in"
  if (view === 'login' && !me) {
    return <LoginForm onLogin={handleLogin} onCancel={() => setView('home')} />;
  }

  // Adminpanelen är bara tillgänglig för admins
  if (view === 'admin' && me?.role === 'admin') {
    return (
      <AdminPage
        me={me}
        onBack={() => setView('home')}
        onLogout={handleLogout}
      />
    );
  }

  // Användarpanelen är bara tillgänglig om man är inloggad
  if (view === 'user' && me) {
    return (
      <UserPage
        me={me}
        onBack={() => setView('home')}
        onLogout={handleLogout}
      />
    );
  }

  // Hjälpsidan – öppen för alla, även utloggade
  if (view === 'help') {
    return <HelpPage onBack={() => setView('home')} />;
  }

  // Startsidan – fungerar både utloggad, som vanlig user och som admin
  return (
    <Home
      user={me}
      isLoggedIn={Boolean(me)}
      onLoginClick={() => setView('login')}
      onLogout={handleLogout}
      onAdminClick={() => setView('admin')}
      onUserClick={() => setView('user')}
      onHelpClick={() => setView('help')}
    />
  );
}