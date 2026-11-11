import { useState } from 'react';
import mockCredentials from '../mockCredentials.json';
import '../App.css'; // Säkerställ att stilen laddas in

export default function LoginForm({ onLogin }) {
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    const foundUser = mockCredentials.find(
      (cred) => cred.user === email && cred.password === password
    );

    if (foundUser) {
      setError('');
      onLogin(foundUser);
      return;
    }

    setError('E-postadressen eller lösenordet stämmer inte.');
  }

  return (
    <div className="page">
      {/* Vänstra panelen med din snygga gradient och text från CSS */}
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

      {/* Högra panelen med inloggningsformuläret */}
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-card">
          <p className="eyebrow">Ditt arbetsutrymme väntar</p>
          <h2 id="login-title">Logga in</h2>
          <p className="login-description">
            Ange dina uppgifter för att fortsätta.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">E-postadress</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="namn@foretag.se"
              autoComplete="email"
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

            <button type="submit">Logga in</button>
          </form>

          <p className="login-note">
            Demo-inloggning – ingen riktig tjänst är ansluten.
          </p>
        </div>
      </section>
    </div>
  );
}