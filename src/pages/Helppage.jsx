import react from "react";

export default function HelpPage({ onBack }) {
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
        </div>
      </header>

      <main className="home-content">
        <article className="wiki-page help-page" style={{ margin: '0 auto', maxWidth: '800px' }}>
          
          <header className="wiki-heading" style={{ marginBottom: '32px' }}>
            <p className="eyebrow">Support</p>
            <h1>Hjälp & Dokumentation</h1>
            <p>Här hittar du information om hur du använder NoWifi och hanterar ditt innehåll.</p>
          </header>

          <div className="help-content">
            <section className="help-topic">
              <h2>Om NoWifi</h2>
              <p>NoWifi är en webbapplikation som gör det möjligt att skapa och hantera wikis. En wiki består av en titel, taggar och en samling wikipages. Varje wikipage har en titel, innehåll, taggar och eventuellt bilder.</p>
              <p>Du kan skapa, redigera och ta bort wikis och wikipages, samt hantera användare och grupper om du är administratör.</p>
            </section>

            <section className="help-topic">
              <h2>Skapa en wiki</h2>
              <p>För att skapa en ny wiki, klicka på "Skapa ny wiki" på startsidan. Ange en titel och eventuella taggar, och klicka sedan på "Spara".</p>
            </section>

            <section className="help-topic">
              <h2>Skapa en wikipage</h2>
              <p>För att skapa en ny wikipage, gå till den wiki du vill lägga till sidan i och klicka på "Skapa ny wikipage". Ange en titel, innehåll och eventuella taggar, och klicka sedan på "Spara".</p>
            </section>

            <section className="help-topic">
              <h2>Redigera en wiki eller wikipage</h2>
              <p>För att redigera en wiki eller wikipage, klicka på "Redigera" på den sida du vill ändra. Gör dina ändringar och klicka sedan på "Spara".</p>
            </section>

            <section className="help-topic">
              <h2>Ta bort en wiki eller wikipage</h2>
              <p>För att ta bort en wiki eller wikipage, klicka på "Ta bort" på den sida du vill radera. Bekräfta sedan att du vill ta bort sidan.</p>
            </section>

            <section className="help-topic">
              <h2>Hantera användare och grupper</h2>
              <p>Om du är administratör kan du hantera användare och grupper genom att klicka på "Hantera användare" eller "Hantera grupper" i adminpanelen. Här kan du lägga till, redigera och ta bort användare och grupper.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}