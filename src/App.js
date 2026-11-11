import { useEffect, useState } from 'react';
import { api } from './api';
import LoginForm from './components/LoginForm'; // Justera sökvägen om mappen heter något annat

export default function App() {
  const [me, setMe] = useState(null);
  const [result, setResult] = useState(null);

  // Om du vill spara inloggningen i state när man loggar in via LoginForm
  function handleLogin(foundUser) {
    setMe({
      username: foundUser.user,
      role: foundUser.role,
      services: foundUser.services || []
    });
  }

  async function logout() {
    await api('userlogout', 'POST').catch(() => {});
    localStorage.removeItem('token');
    setMe(null);
    setResult(null);
  }

  async function send(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const fields = Object.fromEntries(new URLSearchParams(f.params));
    setResult(await api(f.op, f.method, fields));
  }

  // 1. Om användaren inte är inloggad -> visa din snygga LoginForm med all CSS intakt!
  if (!me) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // 2. Om användaren är inloggad som VANLIG ANVÄNDARE (inte admin)
  if (me.role !== 'admin') {
    return (
      <div>
        <h1>Välkommen, {me.username}!</h1>
        <p>Du är inloggad som en vanlig användare (roll: {me.role}).</p>
        <p>Tillgängliga tjänster: {me.services?.join(', ') || 'inga'}</p>
        <button onClick={logout}>Logga ut</button>
      </div>
    );
  }

  // 3. Om användaren är inloggad OCH är admin -> visa admin-sidan
  return (
    <div>
      <p>
        Inloggad som admin: {me.username} ({me.role}) – tjänster:{' '}
        {me.services?.join(', ') || 'inga'}
      </p>
      <button onClick={logout}>Logga ut</button>

      <h2>Testa API / Adminverktyg</h2>
      <form onSubmit={send}>
        <select name="method">
          <option>GET</option>
          <option>POST</option>
        </select>
        <input name="op" placeholder="t.ex. g_list" required />
        <input name="params" placeholder="group=ekonomi&..." />
        <button>Skicka</button>
      </form>
      <pre>{result && JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}