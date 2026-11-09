import { useEffect, useState } from 'react';
import { api } from './api';

export default function App() {
  const [me, setMe] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function loadMe() {
    const r = await api('me');
    if (!r.success) localStorage.removeItem('token');
    setMe(r.success ? r : null);
  }

  useEffect(() => {
    if (localStorage.getItem('token')) loadMe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(e) {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.target));
    const r = await api('loginuser', 'POST', fields);
    if (!r.success) return setError(r.error || `Fel (${r.status})`);
    localStorage.setItem('token', r.token);
    setError('');
    loadMe();
  }

  async function logout() {
    await api('userlogout', 'POST');
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

  if (!me) {
    return (
      <form onSubmit={login}>
        <h1>Logga in</h1>
        <input name="username" placeholder="Användarnamn" />
        <input name="password" type="password" placeholder="Lösenord" />
        <button>Logga in</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    );
  }

  return (
    <div>
      <p>
        Inloggad som {me.username} ({me.role}) – tjänster:{' '}
        {me.services.join(', ') || 'inga'}
      </p>
      <button onClick={logout}>Logga ut</button>

      <h2>Testa API</h2>
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