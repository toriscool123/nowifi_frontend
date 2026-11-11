export default function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="Om NoWifi">
      <a className="brand" href="/" aria-label="NoWifi startsida">
        <span className="brand-mark" aria-hidden="true">N</span>
        <span>NoWifi</span>
      </a>

      <div className="brand-content">
        <p className="eyebrow">Kunskap samlad på ett ställe</p>
        <h1>Välkommen till NoWifi</h1>
        <p className="brand-description">
          En plats för företagets wikis, guider och wikipages.
        </p>

        <div className="feature-list" aria-label="Planerade funktioner">
          <span>Wikis</span>
          <span>Wikipages</span>
        </div>
      </div>

      <p className="brand-footer">Din kunskap. Tydligt organiserad.</p>
    </section>
  );
}