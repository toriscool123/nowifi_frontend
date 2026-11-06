# API-dokumentation – Användare och grupper

Inloggning, användarkonton och grupper. Kalendern finns i `calendar.md`, bloggen i `blog.md`, wikin i `wiki.md` och taggar i `doc.md`.

## Autentisering

För att anropa skyddade slutpunkter i API:et behöver du skicka med en giltig autentiseringstoken. Detta görs i HTTP-headern för varje anrop med nyckeln `Authorization` och formatet `Bearer <din_token>`:

```http
Authorization: Bearer 3f9a0c...e21c
```

Tokenen får du när du loggar in via inloggningsslutpunkten (t.ex. `loginuser`), och den måste inkluderas i alla efterföljande förfrågningar som kräver inloggning.

## Innehåll

1. [Inloggning](#1-inloggning) – `loginuser`, `userlogout`, `me`
2. [Användare (admin)](#2-användare-admin) – `adduser`, `userupdate`, `banuser`, `unbanuser`, `blockservice`, `unblockservice`
3. [Lista användare](#3-lista-användare) – `listusers`
4. [Grupper](#4-grupper) – `g_create`, `g_list`, `g_list_members`, `g_add_member`, `g_remove_member`

---

## 1. Inloggning

### `loginuser` – logga in

`POST /?o=loginuser` · Utloggad (skicka ingen giltig token)

| Fält (body) | Typ | |
|-------------|------|-------|
| `username` | text | krävs |
| `password` | text | krävs |

**200**
```json
{ "success": true, "token": "3f9a0c...e21c" }
```

| Kod | `error` | Orsak |
|-----|-----------------------------------|-------------------------------------------------------------------------|
| 401 | `Fel användarnamn eller lösenord` | Användaren finns inte, fel lösenord eller fält saknas (samma svar för alla) |
| 403 | `Kontot är avstängt` | Rätt lösenord men kontot är avstängt (`banuser`) |
| 409 | `Du är redan inloggad` | En giltig token skickades med i anropet |

### `userlogout` – logga ut

`POST /?o=userlogout` · Inloggad

Token slutar gälla direkt.

**200**
```json
{ "success": true, "message": "Du är utloggad" }
```

| Kod | `error` |
|-----|-----------------------|
| 401 | `Du är inte inloggad` |

### `me` – vem är jag?

`GET /?o=me` · Inloggad

Den inloggade användaren och de tjänster den får använda: företagets tjänster (från The Provider) utom de som admin har stängt av för användaren med `blockservice`. Tjänster man inte har tillgång till visas inte.

**200**
```json
{ "success": true, "username": "utvecklare_erik", "role": "user", "services": ["calendar", "blog", "wiki"] }
```

| Fält | Värden |
|------------|-------------------------------------------------------|
| `role` | `user` eller `admin` |
| `services` | lista med `calendar`, `blog` och `wiki`, kan vara tom |

---

## 2. Användare (admin)

### `adduser` – skapa användare

`POST /?o=adduser` · Admin

| Fält (body) | Typ | |
|-------------|---------------------------------|-------|
| `username` | text, max 100 tecken, unikt | krävs |
| `password` | text, minst 8 tecken | krävs |
| `role` | `user` (standard) eller `admin` | |

Allt annat än `admin` i `role` blir `user`. Den nya användaren läggs automatiskt till i gruppen `alla`.

**201**
```json
{ "success": true, "username": "ekonomi_lars", "role": "user" }
```

| Kod | `error` |
|-----|----------------------------------------------------------------------|
| 400 | `username och password krävs` |
| 400 | `Användarnamnet får vara max 100 tecken` |
| 400 | `Lösenordet måste vara minst 8 tecken` |
| 409 | `Användarnamnet är upptaget` (även avstängda håller kvar sitt namn) |

### `userupdate` – ändra användare

`POST /?o=userupdate` · Admin

| Fält (body) | Typ | |
|----------------|-----------------------------|-----------------------|
| `username` | text, vem som ska ändras | krävs |
| `new_username` | text, max 100 tecken, unikt | nytt användarnamn |
| `password` | text, minst 8 tecken | nytt lösenord |
| `role` | `user` eller `admin` | ny roll |

Fält som inte skickas behåller sitt värde. Fungerar även på avstängda användare. Allt användaren äger och är med i följer med vid namnbyte.

**200** – användaren som den ser ut efter ändringen
```json
{ "success": true, "username": "lars_ekonomi", "role": "user" }
```

| Kod | `error` |
|-----|--------------------------------------------------------|
| 400 | `Användarnamnet får vara max 100 tecken och inte tomt` |
| 400 | `Lösenordet måste vara minst 8 tecken` |
| 400 | `role måste vara 'admin' eller 'user'` |
| 400 | `Du kan inte ta bort din egen admin-roll` |
| 404 | `Användaren finns inte` (även när `username` saknas) |
| 409 | `Användarnamnet är upptaget` |

### `banuser` – stäng av användare

`POST /?o=banuser` · Admin

| Fält (body) | Typ | |
|-------------|------|-------|
| `username` | text | krävs |

Användaren loggas ut direkt och kan inte logga in igen (`loginuser` ger 403 `Kontot är avstängt`). Den syns inte längre i `listusers` för vanliga användare eller bland gruppernas medlemmar.

**Användarens egna kalenderevent och inbjudningar raderas permanent.** Blogg- och wikiinnehåll ligger kvar.

**200**
```json
{ "success": true, "message": "Användaren skribent_maria är avstängd" }
```

| Kod | `error` |
|-----|-----------------------------------------------------------------|
| 400 | `username krävs` |
| 400 | `Du kan inte stänga av dig själv` |
| 404 | `Användaren hittades inte` (finns inte eller är redan avstängd) |
| 500 | `Kunde inte stänga av användaren` |

### `unbanuser` – återaktivera användare

`POST /?o=unbanuser` · Admin

| Fält (body) | Typ | |
|-------------|------|-------|
| `username` | text | krävs |

Användaren kan logga in igen och syns i sina grupper igen. Kalenderdata som raderades vid avstängningen kommer inte tillbaka.

**200**
```json
{ "success": true, "message": "Användaren skribent_maria är återaktiverad" }
```

| Kod | `error` |
|-----|------------------------------------------------|
| 400 | `username krävs` |
| 404 | `Användaren finns inte eller är inte avstängd` |

### `blockservice` / `unblockservice` – stäng av eller slå på en tjänst för en användare

`POST /?o=blockservice` · `POST /?o=unblockservice` · Admin

| Fält (body) | Typ | |
|-------------|---------------------------------|-------|
| `username` | text | krävs |
| `service` | `calendar`, `blog` eller `wiki` | krävs |

En användare som är avstängd från en tjänst får 403 `Du har inte tillgång till den här tjänsten` när den försöker skapa eller ändra något i tjänsten. Publika bloggar och wikis går fortfarande att läsa, som utloggad. Inget raderas, och allt fungerar igen efter `unblockservice`. Tjänsten försvinner också ur `services` i `me`.

Att stänga av en tjänst som redan är avstängd (eller slå på en som redan är på) ger inget fel.

**200** – `blocked_services` är alla tjänster som är avstängda för användaren efter anropet
```json
{ "success": true, "username": "utvecklare_erik", "blocked_services": ["wiki"] }
```

| Kod | `error` |
|-----|----------------------------------------------------------------|
| 400 | `username och service ('calendar', 'blog' eller 'wiki') krävs` |
| 404 | `Användaren finns inte` |

---

## 3. Lista användare

### `listusers` – lista användare

`GET /?o=listusers` · Inloggad

Svaret beror på vem som frågar. Sorterat på användarnamn.

**200 – vanlig användare:** bara aktiva användares namn (t.ex. för att välja vem man ska bjuda in)
```json
{
    "success": true,
    "users": [
        { "username": "admin_anna" },
        { "username": "ekonomi_lars" }
    ]
}
```

**200 – admin:** alla användare, även avstängda, med roll
```json
{
    "success": true,
    "users": [
        { "username": "admin_anna", "role": "admin" },
        { "username": "gamla_gustav", "role": "user", "banned_at": "2026-10-01 10:00:00" },
        { "username": "utvecklare_erik", "role": "user", "blocked_services": ["wiki"] }
    ]
}
```

- `banned_at` finns bara på avstängda användare.
- `blocked_services` finns bara på användare som är avstängda från minst en tjänst.

---

## 4. Grupper

En grupp är en namngiven lista med användare, t.ex. `ekonomi`. Grupper används för att bjuda in många på en gång: till ett kalenderevent (`c_invite`) och som medarbetare på en blogg eller wiki (`b_add_contributor`, `w_add_contributor`). Se `calendar.md`, `blog.md` och `wiki.md`.

- Grupper pekas ut med sitt **namn** (`group`), inte med ett id.
- Bara admin kan skapa grupper och ändra medlemmar. Alla inloggade kan se dem.
- Avstängda användare visas inte bland medlemmarna, men finns kvar i gruppen om de återaktiveras.
- **Gruppen `alla`** innehåller hela företaget. Nya användare läggs till automatiskt, och ingen kan tas bort ur den. Använd `group=alla` för att bjuda in alla.

### `g_create` – skapa grupp

`POST /?o=g_create` · Admin

| Fält (body) | Typ | |
|--------------------------------|------------------------|--------------------------|
| `group` | text, max 100 tecken, unikt | krävs |
| `usernames` (eller `username`) | lista med användarnamn | medlemmar från början |

Gruppen skapas även om några användarnamn inte gick att lägga till. De står då i `failed`.

**201**
```json
{
    "success": true,
    "message": "Gruppen ekonomi skapades med 2 medlemmar.",
    "added": ["admin_anna", "ekonomi_lars"],
    "failed": [ { "username": "finnsinte", "error": "Användaren finns inte." } ]
}
```

Möjliga orsaker i `failed`: `Användaren finns inte.` (finns inte eller är avstängd).

| Kod | `error` |
|-----|----------------------------------------|
| 400 | `Ange 'group' (max 100 tecken).` |
| 409 | `En grupp med det namnet finns redan.` |

### `g_list` – lista alla grupper

`GET /?o=g_list` · Inloggad

Sorterat på namn, medlemmarna på användarnamn.

**200**
```json
{
    "success": true,
    "count": 3,
    "groups": [
        { "name": "alla", "members": ["admin", "admin_anna", "ekonomi_lars", "ekonomi_pia", "skribent_maria", "utvecklare_erik"] },
        { "name": "ekonomi", "members": ["admin_anna", "ekonomi_lars", "ekonomi_pia"] },
        { "name": "utveckling", "members": ["utvecklare_erik"] }
    ]
}
```

### `g_list_members` – medlemmar i en grupp

`GET /?o=g_list_members&group=ekonomi` · Inloggad

Som `g_list`, men bara en grupp. Bra när det finns många grupper.

| Fält (URL) | Typ | |
|------------|-----------|-------|
| `group` | gruppnamn | krävs |

`group` måste ligga i URL:en, inte i bodyn.

**200**
```json
{
    "success": true,
    "group": "ekonomi",
    "count": 3,
    "members": ["admin_anna", "ekonomi_lars", "ekonomi_pia"]
}
```

| Kod | `error` |
|-----|-----------------------|
| 400 | `Ange 'group'.` |
| 404 | `Gruppen finns inte.` |

### `g_add_member` – lägg till medlemmar

`POST /?o=g_add_member` · Admin

| Fält (body) | Typ | |
|--------------------------------|------------------------|-------|
| `group` | gruppnamn | krävs |
| `usernames` (eller `username`) | lista med användarnamn | krävs |

Alla som går läggs till. Svaret visar vilka som lades till och vilka som inte gick, och varför.

| Kod | `success` | Betyder |
|-----|-----------|---------------------------------|
| 200 | `true` | Alla lades till |
| 207 | `false` | Några lades till, se `failed` |
| 400 | `false` | Ingen lades till, se `failed` |

**200 / 207 / 400**
```json
{
    "success": false,
    "message": "1 av 2 tillagda.",
    "added": ["ekonomi_pia"],
    "failed": [ { "username": "ekonomi_lars", "error": "Användaren är redan med i gruppen." } ]
}
```

Möjliga orsaker i `failed`: `Användaren finns inte.` (finns inte eller är avstängd), `Användaren är redan med i gruppen.`

| Kod | `error` |
|-----|--------------------------------------------|
| 400 | `Ange 'group' och minst ett användarnamn.` |
| 404 | `Gruppen finns inte.` |

### `g_remove_member` – ta bort medlem

`POST /?o=g_remove_member` · Admin

| Fält (body) | Typ | |
|-------------|---------------|-------|
| `group` | gruppnamn | krävs |
| `username` | ett användarnamn | krävs |

Användaren tas bort ur gruppen. Bloggar, wikis och event som användaren redan bjudits in till via gruppen påverkas inte.

**200**
```json
{ "success": true, "message": "ekonomi_lars är inte längre med i gruppen ekonomi." }
```

| Kod | `error` |
|-----|------------------------------------------------|
| 400 | `Ange 'group' och 'username'.` |
| 400 | `Alla användare är alltid med i gruppen alla.` |
| 404 | `Gruppen finns inte.` |
| 404 | `ekonomi_lars är inte med i gruppen.` |