import { useState } from 'react';
import { api } from '../api';
import AdminUserHandeling from './AdminUserHandeling';
import AdminGroupHandeling from './AdminGroupHandeling';
import AdminCreateWiki from './AdminCreateWiki';
import AdminWikiHandeling from './AdminWikiHandeling';
import HelpPageAdmin from './HelpPageAdmin';

export default function AdminPage({ me, onBack, onLogout }) {
  const [result, setResult] = useState(null);
  const [currentView, setCurrentView] = useState('main'); // 'main', 'users', 'groups', 'create-wiki', 'manage-wikis'

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

  if (currentView === 'help') {
    return <HelpPageAdmin me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }

  if (currentView === 'users') {
    return <AdminUserHandeling me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'groups') {
    return <AdminGroupHandeling me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'create-wiki') {
    return <AdminCreateWiki me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }
  if (currentView === 'manage-wikis') {
    return <AdminWikiHandeling me={me} onBack={() => setCurrentView('main')} onLogout={onLogout} />;
  }

  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Till startsidan">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">

          <button className="text-button" type="button" onClick={() => setCurrentView('help')}>
            Hjälp?
          </button>

          <button className="text-button" type="button" onClick={onLogout}>
            Logga ut
          </button>
        </div>
      </header>

      <main className="home-content">
        <section className="wiki-heading">
          <button className="text-button" type="button" onClick={onBack}>
            Tillbaka till startsidan
          </button>
          <div aria-hidden="true" style={{ height: '1rem' }} />
          <p className="eyebrow">Administration</p>
          <h1>Adminpanel</h1>
          <p>
            Inloggad som {me.username} – tjänster: {me.services?.join(', ') || 'inga'}
          </p>
        </section>

        {/* Dashboard Grid */}
        <div className="admin-card-grid">
          
          <section className="admin-section admin-card">
            <h2>Användarhantering</h2>
            <p>Lägg till, redigera eller ta bort användare.</p>
            <button type="button" className="btn btn-primary card-btn" onClick={() => setCurrentView('users')}>
              Hantera användare
            </button>
          </section>

          <section className="admin-section admin-card">
            <h2>Grupp hantering</h2>
            <p>Hantera användargrupper och behörigheter.</p>
            <button type="button" className="btn btn-primary card-btn" onClick={() => setCurrentView('groups')}>
              Hantera grupper
            </button>
          </section>

          <section className="admin-section admin-card">
            <h2>Skapa wiki</h2>
            <p>Gå till verktyget för att skapa nya wikis.</p>
            <button type="button" className="btn btn-primary card-btn" onClick={() => setCurrentView('create-wiki')}>
              Skapa wiki
            </button>
          </section>

          <section className="admin-section admin-card">
            <h2>Hantera wiki</h2>
            <p>Administrera befintliga wikis och dess collaborators.</p>
            <button type="button" className="btn btn-primary card-btn" onClick={() => setCurrentView('manage-wikis')}>
              Hantera wikis
            </button>
          </section>

        </div>

        
      </main>
    </div>
  );
}