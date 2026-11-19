// Hjälpsida för vanliga användare (och besökare som inte är inloggade).
// Innehåll för administratörer hör inte hemma här – det ska ligga i en egen
// hjälp som bara visas i adminpanelen.
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
            <p>Här får du hjälp att hitta, läsa och skriva innehåll i NoWifi.</p>
          </header>

          <div className="help-content">
            <section className="help-topic">
              <h2>Om NoWifi</h2>
              <p>NoWifi är en plats för företagets kunskap. Informationen är ordnad i wikis, och varje wiki innehåller en samling wikipages (ofta kallade bara pages). En wiki har en titel och taggar. En page har en titel, en text, taggar och eventuellt bilder.</p>
              <p>Alla kan läsa publika wikis. När du är inloggad kan du även läsa de privata wikis du har tillgång till, och skriva i de wikis där du är ägare eller collaborator.</p>
            </section>

            <section className="help-topic">
              <h2>Hitta och läsa</h2>
              <p>På startsidan ser du de wikis du har tillgång till som kort. Klicka på en wikis titel för att se dess pages, och klicka sedan på en page för att läsa den. Bara publicerade pages visas.</p>
              <p>Knappen högst upp på en page tar dig tillbaka till wikin, och <strong>Tillbaka till alla wikis</strong> tar dig tillbaka till listan. Klicka på NoWifi-loggan uppe till vänster för att komma till startsidan.</p>
            </section>

            <section className="help-topic">
              <h2>Söka</h2>
              <p>Skriv i sökfältet på startsidan för att söka bland både wikis och pages. För wikis söks titel och taggar. För pages söks titel, text, taggar och bildtexter. Träffarna uppdateras medan du skriver, och det spelar ingen roll om du skriver med stora eller små bokstäver.</p>
              <p>Wikis som matchar visas först, och pages som matchar visas under rubriken Wikipages. Hittar du ingenting kan du prova ett kortare sökord eller en tagg.</p>
            </section>

            <section className="help-topic">
              <h2>Logga in och ut</h2>
              <p>Klicka på <strong>Logga in</strong> uppe till höger och fyll i ditt användarnamn och lösenord. Konton skapas av en administratör, så det går inte att registrera sig själv. Saknar du ett konto eller har glömt dina uppgifter ska du kontakta en administratör.</p>
              <p>Utloggad ser du bara publika wikis. När du är inloggad visas ditt namn uppe till höger. Klicka på det för att öppna menyn med <strong>Min sida</strong>. Bredvid namnet finns <strong>Logga ut</strong>.</p>
            </section>

            <section className="help-topic">
              <h2>Min sida</h2>
              <p>Min sida är din arbetsyta för att skriva. Under Mina Wikis & Samarbeten ser du de wikis du kan arbeta med, märkta som Ägare eller Collaborator. Du kan söka bland dem med sökfältet högst upp.</p>
              <p>Klicka på en wiki för att visa dess pages längre ner på sidan. Därifrån skapar, redigerar och tar du bort pages.</p>
            </section>

            <section className="help-topic">
              <h2>Skapa en page</h2>
              <p>Gå till Min sida, välj den wiki du vill skriva i och klicka på <strong>+ Skapa ny page</strong>. Knappen går inte att klicka på förrän du har valt en wiki.</p>
              <p>Fyll i en titel, som är obligatorisk, och eventuella taggar separerade med komma. Skriv sedan texten i rutan till vänster. Till höger ser du direkt hur pagen kommer att se ut.</p>
              <p>Klicka på <strong>Publicera page</strong> när du är klar. Pagen blir direkt synlig för alla som har tillgång till wikin. Om du lämnar sidan med osparat innehåll får du först en varning.</p>
            </section>

            <section className="help-topic">
              <h2>Formatera texten</h2>
              <p>Texten skrivs i Markdown, men du behöver inte kunna koden. Markera ett ord eller en mening och klicka på en knapp i verktygsfältet ovanför textrutan: <strong>H1</strong>, <strong>H2</strong> och <strong>H3</strong> för rubriker, <strong>B</strong> för fet text, <strong>I</strong> för kursiv text, <strong>Lista</strong> för punktlista och <strong>Färg</strong> för färgad text. Markerar du ingenting läggs en exempeltext in som du kan skriva över direkt.</p>
              <p>För att färga text klickar du på Färg, väljer en färg och klickar på <strong>Spara färg</strong>. Rubriker ska stå på en egen rad. Vill du skriva koden själv fungerar till exempel <code># Rubrik</code>, <code>**fet text**</code> och <code>- listpunkt</code>.</p>
            </section>

            <section className="help-topic">
              <h2>Lägga in bilder</h2>
              <p>Ovanför textrutan finns Lägg till bild med parametrar. Välj en bildfil, skriv gärna en bildtext, välj justering (Center, Vänster eller Höger) och bredd i procent, och klicka på <strong>Infoga bild i text</strong>.</p>
              <p>Bilden läggs in längst ner i texten och syns direkt i förhandsgranskningen, så lägg in bilderna i den ordning du vill att de ska visas. Bildtexten visas under bilden. Skriver du ingen bildtext visas filnamnet i stället.</p>
            </section>

            <section className="help-topic">
              <h2>Redigera en page</h2>
              <p>Gå till Min sida, välj wikin och klicka på <strong>Redigera</strong> på den page du vill ändra. Ändra titel, taggar, text eller bilder och klicka på <strong>Spara ändringar</strong>. Ändringen syns direkt för alla som läser pagen.</p>
              <p>Du kan redigera pages i de wikis där du är ägare eller collaborator.</p>
            </section>

            <section className="help-topic">
              <h2>Ta bort en page</h2>
              <p>Klicka på <strong>Ta bort</strong> på den page du vill radera och bekräfta i rutan som dyker upp. Pagen försvinner då för alla läsare.</p>
              <p>Det finns ingen ångra-knapp i appen, så kontrollera att du har valt rätt page. Det är bara wikins ägare som kan ta bort pages. Är du collaborator får du ett felmeddelande, och då kan du be wikins ägare eller en administratör att ta bort den.</p>
            </section>

            <section className="help-topic">
              <h2>Vanliga problem</h2>
              <p><strong>Jag kan inte logga in.</strong> Kontrollera att du skriver ditt användarnamn och lösenord rätt. Står det att kontot är avstängt ska du kontakta en administratör.</p>
              <p><strong>Jag hittar inte en wiki.</strong> Den kan vara privat. Logga in, och be wikins ägare eller en administratör ge dig tillgång om den fortfarande saknas.</p>
              <p><strong>Jag kan inte skapa eller redigera pages.</strong> Du behöver vara ägare eller collaborator i wikin.</p>
              <p><strong>Jag får felmeddelande om att titeln finns.</strong> Varje page i en wiki måste ha en egen titel, med högst 255 tecken. Varje tagg får vara högst 50 tecken.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}