import { useState } from 'react';
import { api } from './api';
import Home from './components/Home';
import LoginForm from './components/LoginForm';
import AdminPage from './pages/AdminPage';

export default function App() {
  const [me, setMe] = useState(null);
  // Vilken sida som visas: 'home' (startsida), 'login' eller 'admin'
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

  // Startsidan – fungerar både utloggad, som vanlig user och som admin
  return (
    <Home
      user={me}
      isLoggedIn={Boolean(me)}
      onLoginClick={() => setView('login')}
      onLogout={handleLogout}
      onAdminClick={() => setView('admin')}
    />
  );
}