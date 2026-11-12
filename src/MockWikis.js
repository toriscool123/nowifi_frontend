// Hårdkodad testdata – byts mot anrop till API:t senare.
// (Ligger bredvid mockCredentials.json på samma sätt.)
//
// Wiki:      { id, title, tags }
// Wikipage:  { id, wiki_id, title, content, status, tags, images }
//   - wiki_id  = id på wikin sidan hör till
//   - status   = 'published' | 'draft' (bara published visas i Home)
//   - tags     = array. Måste matcha taggfiltret (teknik, guider, internt)
//   - images   = [{ src, caption }]. API:t skickar images[] och captions[] som
//                två listor – slå ihop dem parvis när datan kommer därifrån.

// Platshållarbild så att bild + bildtext går att testa utan riktiga filer
function placeholderImage(label) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">' +
    '<rect width="800" height="450" fill="#e8eefb"/>' +
    `<text x="400" y="235" font-family="sans-serif" font-size="32" fill="#2457d6" text-anchor="middle">${label}</text>` +
    '</svg>';

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const wikis = [
  { id: 1, title: 'Onboarding', tags: ['guider', 'internt'] },
  { id: 2, title: 'Nätverk och VPN', tags: ['teknik', 'guider'] },
  { id: 3, title: 'Lösenord och inloggning', tags: ['teknik', 'internt'] },
  { id: 4, title: 'Support och felanmälan', tags: ['guider'] },
  { id: 5, title: 'IT-säkerhet', tags: ['teknik', 'internt'] },
  { id: 6, title: 'Utrustning och beställningar', tags: ['guider', 'internt'] },
];

export const wikipages = [
  {
    id: 1,
    wiki_id: 1,
    title: 'Din första dag',
    content:
      'Din närmaste chef hjälper dig med nyckelkort, dator och konton. Se till att du har loggat in på alla system innan lunch, så att eventuella problem hinner lösas samma dag.\n\nOm något saknas, kontakta supporten direkt i stället för att vänta till nästa dag.',
    status: 'published',
    tags: ['guider'],
    images: [],
  },
  {
    id: 2,
    wiki_id: 1,
    title: 'Checklista för första veckan',
    content:
      'Boka korta introduktionsmöten med teamet du ska arbeta med och läs igenom de wikis som är taggade som guider. Sätt upp ett första uppföljningsmöte med din chef i slutet av veckan.',
    status: 'published',
    tags: ['guider', 'internt'],
    images: [],
  },
  {
    id: 3,
    wiki_id: 2,
    title: 'Ansluta till kontorets nätverk',
    content:
      'Anslut till nätverket NoWifi-Intern med ditt vanliga konto. Gästnätverket ger bara tillgång till internet och ska inte användas för arbetsdatorer.',
    status: 'published',
    tags: ['teknik'],
    images: [],
  },
  {
    id: 4,
    wiki_id: 2,
    title: 'Installera och använda VPN',
    content:
      'Installera VPN-klienten från företagsportalen och logga in med ditt konto.\n\nOm anslutningen bryts upprepade gånger, starta om klienten innan du kontaktar supporten.',
    status: 'published',
    tags: ['teknik', 'guider'],
    images: [{ src: placeholderImage('vpn-klient.png'), caption: 'VPN-klientens startvy' }],
  },
  {
    id: 5,
    wiki_id: 3,
    title: 'Skapa ett starkt lösenord',
    content:
      'Använd en lång lösenfras och ett unikt lösenord för varje tjänst. Företagets lösenordshanterare kommer ihåg dem åt dig.',
    status: 'published',
    tags: ['teknik'],
    images: [],
  },
  {
    id: 6,
    wiki_id: 3,
    title: 'Tvåstegsverifiering',
    content:
      'Alla konton ska ha tvåstegsverifiering aktiverad. Använd autentiseringsappen i första hand och spara reservkoderna på en säker plats.',
    status: 'published',
    tags: ['teknik', 'internt'],
    images: [],
  },
  {
    id: 7,
    wiki_id: 4,
    title: 'Så skapar du ett ärende',
    content:
      'Beskriv vad du försökte göra, vad som hände och när det hände. Bifoga gärna en skärmdump, det kortar ofta ner handläggningstiden.',
    status: 'published',
    tags: ['guider'],
    images: [],
  },
  {
    id: 8,
    wiki_id: 5,
    title: 'Känna igen nätfiske',
    content:
      'Klicka inte på länkar eller bilagor från avsändare du inte känner igen. Är du osäker, vidarebefordra mejlet till säkerhetsteamet i stället för att svara.',
    status: 'published',
    tags: ['teknik', 'guider'],
    images: [],
  },
  {
    // Utkast – ska inte synas eller gå att söka på
    id: 9,
    wiki_id: 5,
    title: 'Incidentrutiner',
    content: 'Utkast som ska granskas av säkerhetsteamet innan publicering.',
    status: 'draft',
    tags: ['internt'],
    images: [],
  },
  {
    id: 10,
    wiki_id: 6,
    title: 'Beställa ny dator',
    content:
      'Beställningar görs via formuläret i företagsportalen och godkänns av din chef. Leverans tar normalt en till två veckor.',
    status: 'published',
    tags: ['guider', 'internt'],
    images: [],
  },
];