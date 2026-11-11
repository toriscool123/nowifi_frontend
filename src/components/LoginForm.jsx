import { useState } from 'react';
import '../App.css';

export default function LoginForm({ onLogin, onCancel }) {
  // States för att hantera felmeddelanden och laddningsstatus
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const username = formData.get('email'); 
    const password = formData.get('password');

    // Skapar form-data som matchar det som Thunder Client skickar
    const bodyData = new URLSearchParams();
    bodyData.append('username', username);
    bodyData.append('password', password);

    try {
      // Skickar POST-anrop via proxyn (/api) med urlencoded-innehåll
      const response = await fetch('/api/?o=loginuser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Inloggningen misslyckades');
      }

      // Sparar autentiseringstoken i localStorage för kommande skyddade anrop[cite: 1]
      localStorage.setItem('token', data.token);

      setLoading(false);
      onLogin(data);

    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="page">
      {/* Vänstra panelen med branding */}
      <div className="brand-panel">
        <div>
          <a href="#" className="brand">
            <span className="brand-mark">N</span>
            NoWifi
          </a>
          <div className="brand-content">
            <p className="eyebrow">Ditt arbetsutrymme väntar</p>
            <h1>Hantera nätverk och system enkelt.</h1>
            <p className="brand-description">
              Logga in för att komma åt dina tjänster, verktyg och administration.
            </p>
            <div className="feature-list">
              <span>Säkert</span>
              <span>Snabbt</span>
              <span>Adminverktyg</span>
            </div>
          </div>
        </div>
        <p className="brand-footer">© 2026 NoWifi. Alla rättigheter förbehållna.</p>
      </div>

      {/* Högra panelen med inloggningsformulär */}
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-card">
          <p className="eyebrow">Ditt arbetsutrymme väntar</p>
          <h2 id="login-title">Logga in</h2>
          <p className="login-description">
            Ange dina uppgifter för att fortsätta.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Användarnamn / E-post</label>
            <input
              id="email"
              name="email"
              type="text"
              placeholder="användarnamn"
              autoComplete="username"
              required
            />

            <label htmlFor="password">Lösenord</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Ange ditt lösenord"
              autoComplete="current-password"
              required
            />

            {error && <p className="login-error" role="alert">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? 'Loggar in...' : 'Logga in'}
            </button>
          </form>

          {onCancel && (
            <button type="button" className="login-cancel" onClick={onCancel}>
              Tillbaka till startsidan
            </button>
          )}

          <p className="login-note">
            Anslutet till det riktiga API:et.
          </p>
        </div>
      </section>
    </div>
  );
}