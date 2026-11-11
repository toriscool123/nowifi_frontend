import { useState } from 'react';
import { api } from '../api';

export default function AdminPage({ me, onBack, onLogout }) {
  const [result, setResult] = useState(null);

  async function send(event) {
    event.preventDefault();

    const form = Object.fromEntries(new FormData(event.currentTarget));
    const fields = Object.fromEntries(new URLSearchParams(form.params));

    try {
      setResult(await api(form.op, form.method, fields));
    } catch (error) {
      setResult({ error: error.message || 'Anropet misslyckades.' });
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Till startsidan">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">
          <button className="text-button" type="button" onClick={onBack}>
            Tillbaka till startsidan
          </button>
          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="wiki-heading">
          <p className="eyebrow">Administration</p>
          <h1>Adminpanel</h1>
          <p>
            Inloggad som {me.username} – tjänster: {me.services?.join(', ') || 'inga'}
          </p>
        </section>

        <section className="admin-section" aria-labelledby="api-tool-title">
          <h2 id="api-tool-title">Testa API</h2>

          <form className="admin-form" onSubmit={send}>
            <select name="method" aria-label="Metod">
              <option>GET</option>
              <option>POST</option>
            </select>
            <input name="op" placeholder="t.ex. g_list" aria-label="Operation" required />
            <input name="params" placeholder="group=ekonomi&..." aria-label="Parametrar" />
            <button type="submit">Skicka</button>
          </form>

          <pre className="admin-result">
            {result ? JSON.stringify(result, null, 2) : 'Inget svar än.'}
          </pre>
        </section>
      </main>
    </div>
  );
}
