# API-dokumentation – Kalender

Kalenderevent, inbjudningar och upptagna tider. Inloggning och grupper finns i `user.md`, bloggen i `blog.md` och wikin i `wiki.md`.

## Autentisering

För att anropa skyddade slutpunkter i API:et behöver du skicka med en giltig autentiseringstoken. Detta görs i HTTP-headern för varje anrop med nyckeln `Authorization` och formatet `Bearer <din_token>`:

```
Authorization: Bearer 3f9a0c...e21c
```

Tokenen får du när du loggar in via inloggningsslutpunkten (t.ex. `loginuser`), och den måste inkluderas i alla efterföljande förfrågningar som kräver inloggning.

## Innehåll

1. [Event](#1-event) – `c_create`, `c_list`, `c_edit`, `c_delete`
2. [Inbjudningar](#2-inbjudningar) – `c_invite`, `c_respond`, `c_participants`
3. [Upptagen](#3-upptagen) – `c_busy`

---

## 1. Event

### `c_create` – skapa event

`POST /?o=c_create` · Inloggad

| Fält (body) | Typ | |
|---------------|----------------------------------|-------|
| `title` | text, max 255 tecken | krävs |
| `start_time` | `ÅÅÅÅ-MM-DD TT:MM:SS` | krävs |
| `end_time` | `ÅÅÅÅ-MM-DD TT:MM:SS`, efter start | krävs |
| `description` | text, max 65 535 byte | |
| `location` | text, max 255 tecken | |

Du blir arrangör och har automatiskt tackat ja. Bjud in andra efteråt med `c_invite`.

**201**
```json
{ "success": true, "event_id": 12 }
```

| Kod | `error` |
|-----|----------------------------------------------------------|
| 400 | `Titel, starttid och sluttid är obligatoriska.` |
| 400 | `Titeln får vara max 255 tecken.` |
| 400 | `Platsen får vara max 255 tecken.` |
| 400 | `Beskrivningen är för lång.` |
| 400 | `Ogiltigt datum. Använd formatet ÅÅÅÅ-MM-DD TT:MM:SS.` |
| 400 | `Sluttiden måste vara efter starttiden.` |

### `c_list` – mina event

`GET /?o=c_list` · Inloggad

Alla event du är med i: de du arrangerar och de du är inbjuden till, även obesvarade och nekade. Sorterat på starttid, tidigast först. Tar `limit` och `offset`.

**200**
```json
{
    "success": true,
    "count": 2,
    "events": [
        {
            "event_id": 12,
            "title": "Planeringsmöte",
            "description": "Vi går igenom Q4",
            "start_time": "2026-11-03 09:00:00",
            "end_time": "2026-11-03 10:00:00",
            "location": "Rum 3",
            "participant_status": "accepted",
            "participant_role": "organizer"
        },
        {
            "event_id": 14,
            "title": "Fika",
            "description": null,
            "start_time": "2026-11-04 15:00:00",
            "end_time": "2026-11-04 15:30:00",
            "location": null,
            "participant_status": "pending",
            "participant_role": "attendee"
        }
    ]
}
```

| Fält | Värden |
|----------------------|------------------------------------------------------------------------------|
| `participant_status` | **ditt** svar: `pending` (inte svarat), `accepted` (ja) eller `declined` (nej) |
| `participant_role` | `organizer` (du skapade eventet) eller `attendee` (du är inbjuden) |
| `description`, `location` | `null` om de inte är ifyllda |

### `c_edit` – ändra event

`POST /?o=c_edit` · Inloggad, bara arrangören

| Fält (body) | Typ | |
|---------------|-----------------------|-------------------|
| `event_id` | id från `c_list` | krävs |
| `title` | text, max 255 tecken | ny titel |
| `start_time` | `ÅÅÅÅ-MM-DD TT:MM:SS` | ny starttid |
| `end_time` | `ÅÅÅÅ-MM-DD TT:MM:SS` | ny sluttid |
| `description` | text | ny beskrivning |
| `location` | text | ny plats |

- Fält som inte skickas behåller sitt värde.
- `""` i `description` eller `location` tömmer fältet (blir `null`).
- Tiderna kollas tillsammans: flyttar du bara `start_time` måste den fortfarande vara före den gamla sluttiden.
- Deltagarnas svar ligger kvar efter en ändring.

**200**
```json
{ "success": true, "message": "Eventet har uppdaterats." }
```

| Kod | `error` |
|-----|----------------------------------------------------------|
| 400 | `Event ID krävs.` |
| 400 | `Titeln får inte vara tom.` |
| 400 | `Titeln får vara max 255 tecken.` |
| 400 | `Platsen får vara max 255 tecken.` |
| 400 | `Beskrivningen är för lång.` |
| 400 | `Ogiltigt datum. Använd formatet ÅÅÅÅ-MM-DD TT:MM:SS.` |
| 400 | `Sluttiden måste vara efter starttiden.` |
| 403 | `Du har inte behörighet att redigera detta event.` (även admin) |
| 404 | `Eventet finns inte.` |

### `c_delete` – ta bort event

`POST /?o=c_delete` · Inloggad, arrangören eller admin

| Fält (body) | Typ | |
|-------------|------------------|-------|
| `event_id` | id från `c_list` | krävs |

Eventet och alla inbjudningar tas bort permanent. Det försvinner ur alla deltagares `c_list`.

**200**
```json
{ "success": true, "message": "Eventet har tagits bort." }
```

| Kod | `error` |
|-----|----------------------------------------------------|
| 400 | `Event ID krävs.` |
| 403 | `Du har inte behörighet att ta bort detta event.` |
| 404 | `Eventet finns inte.` |

---

## 2. Inbjudningar

### `c_invite` – bjud in

`POST /?o=c_invite` · Inloggad, bara arrangören

| Fält (body) | Typ | |
|--------------------------------|--------------------------------------|--------------------------|
| `event_id` | id från `c_list` | krävs |
| `usernames` (eller `username`) | lista med användarnamn | `usernames` och/eller `group` |
| `group` | gruppnamn från `g_list`, t.ex. `alla` | `usernames` och/eller `group` |

- Med `group` bjuds alla som är med i gruppen **just nu** in. Den som går med i gruppen senare bjuds inte in automatiskt.
- `usernames` och `group` går att kombinera. Samma person bjuds bara in en gång.
- Du själv hoppas över när du finns i gruppen. Skriver du ditt eget namn i `usernames` hamnar det i `failed`.
- Alla som går bjuds in. Svaret visar vilka som bjöds in och vilka som inte gick, och varför.
- De inbjudna får `participant_status: "pending"` och ser eventet i sin `c_list`.

| Kod | `success` | `status` | Betyder |
|-----|-----------|-----------|---------------------------------|
| 200 | `true` | `success` | Alla bjöds in |
| 207 | `false` | `partial` | Några bjöds in, se `failed` |
| 400 | `false` | `failed` | Ingen bjöds in, se `failed` |

**200 / 207 / 400**
```json
{
    "success": false,
    "status": "partial",
    "message": "2 av 3 inbjudna.",
    "invited": ["ekonomi_lars", "ekonomi_pia"],
    "failed": [ { "username": "finnsinte", "error": "Användaren finns inte." } ]
}
```

Möjliga orsaker i `failed`:

| `error` | Orsak |
|------------------------------------|-----------------------------------------|
| `Användaren finns inte.` | Finns inte eller är avstängd |
| `Du kan inte bjuda in dig själv.` | Ditt eget namn stod i `usernames` |
| `Användaren är redan inbjuden.` | Personen är redan med i eventet |

| Kod | `error` |
|-----|----------------------------------------------------------------------------|
| 400 | `Event ID och minst ett användarnamn eller en grupp med medlemmar krävs.` (även när gruppen bara har dig som medlem) |
| 403 | `Du har inte behörighet att bjuda in till detta event.` |
| 404 | `Gruppen finns inte.` |
| 404 | `Eventet finns inte.` |

### `c_respond` – svara på inbjudan

`POST /?o=c_respond` · Inloggad, bara inbjudna

| Fält (body) | Typ | |
|-------------|----------------------------|-------|
| `event_id` | id från `c_list` | krävs |
| `status` | `accepted` eller `declined` | krävs |

Det går att ändra sitt svar så många gånger man vill. Arrangören kan inte svara, den har alltid tackat ja.

**200**
```json
{ "success": true, "message": "Svar sparat." }
```

| Kod | `error` |
|-----|------------------------------------------------------------|
| 400 | `Event ID och status ('accepted' eller 'declined') krävs.` |
| 404 | `Ingen inbjudan hittades.` (inte inbjuden, eller arrangören) |

### `c_participants` – deltagare i ett event

`GET /?o=c_participants&event_id=12` · Inloggad, bara de som är med i eventet

| Fält (URL) | Typ | |
|------------|------------------|-------|
| `event_id` | id från `c_list` | krävs |

Arrangören först, sedan resten i bokstavsordning.

**200**
```json
{
    "success": true,
    "participants": [
        { "username": "admin_anna", "status": "accepted", "role": "organizer", "invited_at": "2026-10-27 08:12:40", "responded_at": null },
        { "username": "ekonomi_lars", "status": "declined", "role": "attendee", "invited_at": "2026-10-27 08:13:02", "responded_at": "2026-10-27 09:01:15" },
        { "username": "ekonomi_pia", "status": "pending", "role": "attendee", "invited_at": "2026-10-27 08:13:02", "responded_at": null }
    ]
}
```

| Fält | Värden |
|----------------|-------------------------------------------------------------|
| `status` | `pending`, `accepted` eller `declined` |
| `role` | `organizer` eller `attendee` |
| `responded_at` | när personen senast svarade, `null` om den inte har svarat |

| Kod | `error` |
|-----|-------------------------------------------------------|
| 400 | `Event ID krävs.` |
| 404 | `Eventet finns inte.` (finns inte, eller du är inte med) |

---

## 3. Upptagen

### `c_busy` – när är någon upptagen?

`GET /?o=c_busy&username=ekonomi_lars` · Inloggad

| Fält (URL) | Typ | |
|------------|---------------|-------|
| `username` | användarnamn | krävs |

Bra för att hitta en tid innan man bjuder in. Visar bara **tiderna** för kommande event (även pågående) som personen arrangerar eller har tackat ja till. Titel, plats och deltagare visas aldrig, inte ens för admin. Obesvarade och nekade inbjudningar räknas inte. Sorterat på starttid.

**200**
```json
{
    "success": true,
    "username": "ekonomi_lars",
    "count": 2,
    "busy": [
        { "start_time": "2026-11-03 09:00:00", "end_time": "2026-11-03 10:00:00" },
        { "start_time": "2026-11-05 13:00:00", "end_time": "2026-11-05 14:30:00" }
    ]
}
```

Frågar du om **dig själv** får du i stället samma svar som `c_list`, med allt.

| Kod | `error` |
|-----|--------------------------------------------------|
| 400 | `Ange 'username'.` |
| 404 | `Användaren finns inte.` (finns inte eller avstängd) |