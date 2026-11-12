import { useState } from 'react';
import LoginForm from './components/LoginForm';
import Home from './components/Home';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Körs när LoginForm har loggat in och hämtat ?o=me
  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setIsLoggedIn(true);
  }

  // Körs när användaren klickar på "Logga ut"
  function handleLogout() {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
  }

  // Om ej inloggad -> visa inloggningssidan
  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Om inloggad -> visa startsidan och skicka med användaren
  return (
    <Home 
      user={user} 
      isLoggedIn={isLoggedIn} 
      onLogout={handleLogout}
      onAdminClick={() => {
        // Logik för att öppna adminpanelen
        console.log("Öppna admin");
      }}
    />
  );
}
