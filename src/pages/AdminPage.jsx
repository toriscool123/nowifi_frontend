import { useState } from 'react';
import { api } from '../api';
import AdminUserHandeling from './AdminUserHandeling';
import AdminGroupHandeling from './AdminGroupHandeling';

export default function AdminPage({ me, onBack, onLogout }) {
  const [result, setResult] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'users', eller 'groups'

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

  // Om användaren har klickat på "Hantera användare"
  if (currentView === 'users') {
    return (
      <AdminUserHandeling 
        me={me} 
        onBack={() => setCurrentView('main')} 
        onLogout={onLogout} 
      />
    );
  }

  if (currentView === 'groups') {
  return (
    <AdminGroupHandeling 
      me={me} 
      onBack={() => setCurrentView('main')} 
      onLogout={onLogout} 
    />
  );
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

        {/* Grid för Användarhantering och Grupphantering bredvid varandra */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          
          {/* Användarhantering-sektion */}
          <section className="admin-section" style={{ marginBottom: 0 }}>
            <h2>Användarhantering</h2>
            <p>Klicka nedan för att lägga till, redigera eller ta bort användare.</p>
            <button 
              type="button" 
              className="header-login-button" 
              onClick={() => setCurrentView('users')}
              style={{ marginTop: '12px' }}
            >
              Hantera användare
            </button>
          </section>

          {/* Grupphantering-sektion */}
          <section className="admin-section" style={{ marginBottom: 0 }}>
            <h2>Grupp hantering</h2>
            <p>Klicka nedan för att hantera användargrupper och behörigheter.</p>
           <button 
            type="button" 
            className="header-login-button" 
            onClick={() => setCurrentView('groups')} // <-- Ändra från alert till detta!
            style={{ marginTop: '12px' }}
            >
            Hantera grupper
            </button>
          </section>

        </div>

        {/* Testa API */}
        <section className="admin-section" aria-labelledby="api-tool-title" style={{ marginTop: '32px' }}>
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