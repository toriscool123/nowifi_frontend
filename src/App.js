import { useState } from 'react';
import { api } from './api';
import Home from './components/Home';
import LoginForm from './components/LoginForm';
import AdminPage from './pages/AdminPage';
import HelpPage from './pages/Helppage';
import UserPage from './pages/UserPage';
import ProviderPanel from './pages/ProviderPanel';

export default function App() {
  const [me, setMe] = useState(null);
  // Vilken sida som visas: 'home', 'login', 'admin', 'superadmin', 'user' eller 'help'
  const [view, setView] = useState('home');

  function handleLogin(foundUser) {
    setMe({
      username: foundUser.username || foundUser.user,
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

  // SuperAdminPanelen är bara tillgänglig för användaren Superadmin
  if (view === 'superadmin' && me?.username === 'superadmin') {
    return (
      <ProviderPanel
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

  // Startsidan – fungerar både utloggad, som vanlig user, admin och superadmin
  return (
    <Home
      user={me}
      isLoggedIn={Boolean(me)}
      onLoginClick={() => setView('login')}
      onLogout={handleLogout}
      onAdminClick={() => setView('admin')}
      onSuperAdminClick={() => setView('superadmin')} // <-- Se till att denna rad finns med!
      onUserClick={() => setView('user')}
      onHelpClick={() => setView('help')}
    />
  );
}