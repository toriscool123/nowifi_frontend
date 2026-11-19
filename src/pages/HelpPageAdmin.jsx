// Hjälpsida för administratörer. Visas bara i adminpanelen.
// Hjälp för vanliga användare finns i Helppage.jsx.
export default function HelpPageAdmin({ onBack, onLogout }) {
  return (
    <div className="home">
      <header className="home-header">
        <button className="home-brand brand-button" type="button" onClick={onBack} aria-label="Tillbaka">
          <span className="brand-mark" aria-hidden="true">N</span>
          <span>NoWifi</span>
        </button>

        <div className="account-area">
          <button className="text-button" type="button" onClick={onBack}>
            ← Tillbaka till Admin
          </button>
          {onLogout && (
            <button className="text-button" type="button" onClick={onLogout}>
              Logga ut
            </button>
          )}
        </div>
      </header>

      <main className="home-content">
        <article className="wiki-page help-page" style={{ margin: '0 auto', maxWidth: '800px' }}>

          <header className="wiki-heading" style={{ marginBottom: '32px' }}>
            <p className="eyebrow">ADMINISTRATION</p>
            <h1>Adminhjälp</h1>
            <p>Här får du hjälp att hantera användare, grupper och wikis i adminpanelen.</p>
          </header>

          <div className="help-content">
            <section className="help-topic">
              <h2>Om adminpanelen</h2>
              <p>Adminpanelen är bara tillgänglig för användare med rollen admin. Du öppnar den genom att klicka på ditt namn uppe till höger på startsidan och välja <strong>Adminpanel</strong>. Där finns fyra kort: Användarhantering, Grupp hantering, Skapa wiki och Hantera wiki.</p>
              <p>Hur vanliga användare läser och skriver pages förklaras i den vanliga hjälpen, som du når med <strong>Hjälp?</strong> på startsidan. Den här sidan handlar bara om det du gör som admin.</p>
            </section>

            <section className="help-topic">
              <h2>Roller och behörigheter</h2>
              <p>Varje användare har rollen user eller admin. Bara admins kommer åt adminpanelen, och bara admins kan skapa användare, grupper och wikis.</p>
              <p>Inom en wiki finns tre nivåer. Ägaren är den som skapade wikin. Collaborators kan läsa wikin, skapa pages och redigera pages, men de kan inte ta bort pages eller ändra wikin. Alla andra är läsare.</p>
              <p>En wiki är antingen Public, som alla kan läsa även utan inloggning, eller Private, som bara ägaren och wikins collaborators kan läsa.</p>
            </section>

            <section className="help-topic">
              <h2>Skapa en användare</h2>
              <p>Klicka på <strong>Hantera användare</strong> och sedan på <strong>Skapa användare</strong>. Fyll i användarnamn, lösenord och roll (user eller admin) och klicka på <strong>Skapa</strong>. Om något är fel visas ett felmeddelande i rutan.</p>
              <p>Användarnamnet måste vara unikt, även bland avstängda användare, och får vara högst 100 tecken. Lösenordet måste vara minst 8 tecken. Nya användare läggs automatiskt till i gruppen alla. Det finns ingen självregistrering, så du måste själv ge användaren dennes inloggningsuppgifter.</p>
            </section>

            <section className="help-topic">
              <h2>Redigera en användare</h2>
              <p>Klicka på en användare i listan för att välja den, och klicka sedan på <strong>Redigera användare</strong>. Du kan byta användarnamn, ange ett nytt lösenord och ändra roll. Lämnar du lösenordsfältet tomt behåller användaren sitt gamla lösenord. Spara med <strong>Spara ändringar</strong>. Sökfältet ovanför listan hjälper dig hitta rätt användare.</p>
              <p>Allt användaren äger och är med i följer med om du byter användarnamn. Du kan inte ta bort din egen admin-roll, så be en annan admin om du själv ska ändras till user.</p>
            </section>

            <section className="help-topic">
              <h2>Stänga av och återaktivera</h2>
              <p>Välj användaren i listan, klicka på <strong>Stäng av</strong> och bekräfta med <strong>Ja, stäng av</strong>. Användaren loggas ut direkt och kan inte logga in igen. Avstängda användare märks med (Avstängd) i listan, och de syns inte längre i grupper eller i listorna där du väljer användare. Du kan inte stänga av dig själv.</p>
              <p>Användarens egna kalenderevent och inbjudningar raderas permanent, medan wiki- och blogginnehåll ligger kvar. Du kan inte ta bort en användare helt, bara stänga av den.</p>
              <p>För att släppa in användaren igen väljer du den i listan, klickar på <strong>Återaktivera</strong> och bekräftar med <strong>Ja, återaktivera</strong>. Kalenderinnehåll som raderades vid avstängningen kommer inte tillbaka.</p>
            </section>

            <section className="help-topic">
              <h2>Skapa en grupp</h2>
              <p>En grupp är en namngiven lista med användare, till exempel ekonomi. Grupper gör det enkelt att ge många användare tillgång till en wiki på en gång. Klicka på <strong>Hantera grupper</strong> och sedan på <strong>Skapa grupp</strong>, skriv ett gruppnamn och klicka på <strong>Skapa</strong>.</p>
              <p>Gruppnamnet måste vara unikt och får vara högst 100 tecken. En ny grupp är tom, så lägg till medlemmar efteråt. Gruppen alla finns alltid och innehåller hela företaget. Nya användare läggs till i den automatiskt, och ingen kan tas bort ur den.</p>
            </section>

            <section className="help-topic">
              <h2>Hantera en grupp</h2>
              <p>Klicka på en grupp i listan för att välja den. Medlemmarna visas under Medlemmar i gruppen. Klicka på <strong>Lägg till användare</strong>, sök och bocka i de användare du vill lägga till, och klicka på <strong>Lägg till valda</strong>. Avstängda användare och de som redan är medlemmar visas inte i listan.</p>
              <p>För att ta bort medlemmar klickar du på <strong>Ta bort användare</strong>, bockar i dem som ska bort och klickar på <strong>Ta bort valda</strong>. Du kan också klicka på × bredvid ett namn i medlemslistan, men då tas personen bort direkt utan att du får bekräfta.</p>
              <p>Klicka på <strong>Ta bort grupp</strong> och bekräfta med <strong>Ja, ta bort</strong> för att radera hela gruppen permanent. Att ta bort en medlem eller en grupp påverkar inte wikis där personerna redan har lagts till som collaborators.</p>
            </section>

            <section className="help-topic">
              <h2>Skapa en wiki</h2>
              <p>Klicka på <strong>Skapa wiki</strong>. Fyll i en titel, välj status (Public eller Private) och skriv eventuella taggar separerade med komma. Titeln måste vara unik och får vara högst 255 tecken, och varje tagg får vara högst 50 tecken. Du blir wikins ägare.</p>
              <p>Du kan välja vilka som ska få skriva i wikin redan nu. Klicka på <strong>+ Lägg till användare</strong> eller <strong>+ Lägg till grupper</strong>, sök och bocka i dem du vill ha, och klicka på <strong>Klar</strong>. Klicka sedan på <strong>Skapa wiki</strong>. Du kan också lägga till collaborators senare under Hantera wiki.</p>
              <p>Du får ett bekräftelsemeddelande när wikin är skapad, och formuläret töms så att du kan skapa nästa. En ny wiki är tom. Du och dess collaborators skriver pages i den via Min sida.</p>
            </section>

            <section className="help-topic">
              <h2>Hantera en wiki</h2>
              <p>Klicka på <strong>Hantera wikis</strong>. Listan visar wikins ägare, taggar och status, med de nyaste först och högst 50 åt gången. Sök på titel, eller kryssa i <strong>Visa endast mina skapade wikis</strong>. Klicka på en wiki för att välja den, så blir knapparna ovanför listan aktiva.</p>
              <p>Klicka på <strong>Edit wiki</strong> för att ändra titel, status och taggar, och spara med <strong>Spara ändringar</strong>. Taggarna du skriver ersätter de gamla. Byter du status till Private försvinner wikin för alla utom ägaren och collaborators.</p>
            </section>

            <section className="help-topic">
              <h2>Lägga till och ta bort collaborators</h2>
              <p>Välj en wiki och klicka på <strong>Add collaborator</strong> för att ge enskilda användare tillgång, eller på <strong>Add collaborator group</strong> för att ge en hel grupp tillgång. Sök, bocka i dem du vill lägga till och klicka på <strong>Lägg till valda</strong> respektive <strong>Lägg till valda grupper</strong>.</p>
              <p>När du lägger till en grupp får de som är medlemmar just då tillgång. Användare som läggs till i gruppen senare får inte automatiskt tillgång till wikin, så lägg till dem separat eller lägg till gruppen igen.</p>
              <p>Klicka på <strong>Remove collaborator</strong>, bocka i dem som ska bort och klicka på <strong>Ta bort valda</strong>. Pages som de har skrivit ligger kvar i wikin.</p>
            </section>

            <section className="help-topic">
              <h2>Vanliga problem</h2>
              <p><strong>Det går inte att skapa en användare, grupp eller wiki.</strong> Läs felmeddelandet. Vanligaste orsaken är att namnet eller titeln redan är upptaget, eller att lösenordet är kortare än 8 tecken.</p>
              <p><strong>En användare kan inte logga in.</strong> Kontrollera i Hantera användare om användaren är markerad som Avstängd, och återaktivera den om det är rätt.</p>
              <p><strong>En användare ser inte en wiki.</strong> Kontrollera att wikin är Public, eller att användaren eller en grupp användaren är med i har lagts till som collaborator.</p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}