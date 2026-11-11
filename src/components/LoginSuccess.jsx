import mockCredentials from '../mockCredentials.json';

export default function LoginSuccess({ onBack, email: emailProp }) {
  const storedEmail = typeof window !== 'undefined' ? window.localStorage.getItem('email') ?? '' : '';
  const email = emailProp || storedEmail || mockCredentials.user || '';

  if (email && storedEmail !== email && typeof window !== 'undefined') {
    window.localStorage.setItem('email', email);
  }

  return (
    <section className="success-overlay" role="dialog" aria-modal="true" aria-labelledby="success-title">
      <div className="success-card">
        <div className="success-icon" aria-hidden="true">✓</div>
        <p className="eyebrow">NoWifi</p>
        <h1 id="success-title">Inloggningen lyckades!</h1>
        <p>Du är nu inloggad i demoarbetsutrymmet.</p>
        <p className="success-description">Du kan nu utforska NoWifi och dess funktioner.</p>
        {email && <p>Inloggad som: <strong>{email}</strong></p>}
        <button type="button" onClick={onBack}>Tillbaka till inloggningen</button>
      </div>
    </section>
  );
}