import { useState } from 'react';
import mockCredentials from '../mockCredentials.json';

export default function LoginForm({ onLogin, onCancel }) {
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email');
    const password = formData.get('password');

    if (
      email === mockCredentials.user &&
      password === mockCredentials.password
    ) {
      setError('');
      onLogin();
      return;
    }

    setError('E-postadressen eller lösenordet stämmer inte.');
  }

  return (
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

        <button className="login-cancel" type="button" onClick={onCancel}>
          Tillbaka till wikis
        </button>

        <p className="login-note"></p>

        <p className="login-note">
          Demo-inloggning – ingen riktig tjänst är ansluten.
        </p>
      </div>
    </section>
  );
}