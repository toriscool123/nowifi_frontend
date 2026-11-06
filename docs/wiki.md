# API-dokumentation – Wiki

Wikis, sidor, versionshistorik och medarbetare. Inloggning och grupper finns i `user.md`, kalendern i `calendar.md` och bloggen i `blog.md`.

## Autentisering

För att anropa skyddade slutpunkter i API:et behöver du skicka med en giltig autentiseringstoken. Detta görs i HTTP-headern för varje anrop med nyckeln `Authorization` och formatet `Bearer <din_token>`:

```
Authorization: Bearer 3f9a0c...e21c
```

Tokenen får du när du loggar in via inloggningsslutpunkten (t.ex. `loginuser`), och den måste inkluderas i alla efterföljande förfrågningar som kräver inloggning.

## Innehåll

1. [Wikis](#1-wikis) – `w_wiki_create`, `w_wiki_list`, `w_wiki_update`
2. [Sidor](#2-sidor) – `w_page_create`, `w_page_list`, `w_search`, `w_page_update`
3. [Historik, radera och återställ](#3-historik-radera-och-återställ) – `w_page_history`, `w_page_delete`, `w_page_restore`
4. [Medarbetare](#4-medarbetare) – `w_add_contributor`, `w_remove_contributor`

---

## 1. Wikis

### `w_wiki_create` – skapa wiki

`POST /?o=w_wiki_create` · Admin

| Fält (body) | Typ | |
|-------------|--------------------------------------|-------|
| `title` | text, max 255 tecken, unik | krävs |
| `status` | `public` (standard) eller `private` | |
| `tags` | taggar | |

Du blir wikins ägare.

**201**
```json
{ "success": true, "message": "Wikin skapades!", "wiki_id": 2 }
```

| Kod | `error` |
|-----|------------------------------------------------|
| 400 | `Titel krävs (max 255 tecken)!` |
| 400 | `Status måste vara 'private' eller 'public'.` |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.` |
| 409 | `En wiki med den titeln finns redan.` |

### `w_wiki_list` – lista wikis

`GET /?o=w_wiki_list` · Alla, även utloggade

| Fält (URL) | Typ | |
|-------------------|-----|----------------------------|
| `mine` | `1` | bara mina wikis (kräver inloggning) |
| `limit`, `offset` | tal | sidor |

Alla wikis du får se, nyast först.

**200**
```json
{
    "success": true,
    "count": 2,
    "wikis": [
        {
            "wiki_id": 2,
            "title": "IT-handboken",
            "status": "private",
            "owner_username": "admin_anna",
            "created_at": "2026-10-20 10:00:00",
            "published_pages": 7,
            "tags": "it, rutin"
        },
        {
            "wiki_id": 1,
            "title": "Personalhandbok",
            "status": "public",
            "owner_username": "admin",
            "created_at": "2026-10-01 09:00:00",
            "published_pages": 15,
            "tags": null
        }
    ]
}
```

`published_pages` räknar bara publicerade sidor.

### `w_wiki_update` – ändra wiki

`POST /?o=w_wiki_update` · Ägaren eller admin

| Fält (body) | Typ | |
|-------------|----------------------------|-------------------|
| `wiki_id` | id från `w_wiki_list` | krävs |
| `title` | text, max 255 tecken, unik | ny titel |
| `status` | `public` eller `private` | ny status |
| `tags` | taggar | ersätter de gamla |

Fält som inte skickas behåller sitt värde.

**200**
```json
{ "success": true, "message": "Wikin uppdaterades!" }
```

| Kod | `error` |
|-----|------------------------------------------------|
| 400 | `Ange 'wiki_id' för att redigera.` |
| 400 | `Titel krävs (max 255 tecken)!` |
| 400 | `Status måste vara 'private' eller 'public'.` |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.` |
| 403 | `Bara wikins ägare kan redigera wikin.` |
| 404 | `Hittade ingen wiki med det ID:t.` |
| 409 | `En wiki med den titeln finns redan.` |

---

## 2. Sidor

### `w_page_create` – skapa sida

`POST /?o=w_page_create` · Redigerare (ägaren, medarbetare eller admin)

| Fält (body) | Typ | |
|--------------------------|---------------------------------------|-------|
| `wiki_id` | id från `w_wiki_list` | krävs |
| `title` | text, max 255 tecken, unik i wikin | krävs |
| `content` | text | krävs |
| `status` | `published` (standard) eller `draft` | |
| `tags` | taggar | |
| `images[]`, `captions[]` | bilder (`multipart/form-data`) | |

Du står som sidans författare (`author_username`).

**201**
```json
{ "success": true, "message": "Sidan publicerades!", "page_id": 31, "version": 1 }
```

Med `status: "draft"` blir `message` i stället `Utkastet sparades!`.

| Kod | `error` |
|-----|----------------------------------------------------------|
| 400 | `Fälten 'wiki_id', 'title' och 'content' krävs!` |
| 400 | `Titeln får vara max 255 tecken.` |
| 400 | `Status måste vara 'draft' eller 'published'.` |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.` |
| 400 / 413 | bildfel |
| 403 | `Du har inte behörighet att skriva i denna wiki.` |
| 404 | `Hittade ingen wiki med det ID:t.` |
| 409 | `En sida med titeln 'VPN' finns redan i denna wiki.` |

### `w_page_list` – en wiki med sidor

`GET /?o=w_page_list&wiki_id=2` · Alla, även utloggade

| Fält (URL) | Typ | |
|-------------------|-----------------------|----------------|
| `wiki_id` | id från `w_wiki_list` | krävs |
| `limit`, `offset` | tal | sidor |

Wikin och dess sidor i bokstavsordning efter titel. Läsare ser bara publicerade sidor. Redigerare ser alla, även raderade (med tom `title` och `content`, så att de kan återställas). `limit` och `offset` gäller sidorna.

**200**
```json
{
    "success": true,
    "wiki": {
        "wiki_id": 2,
        "title": "IT-handboken",
        "status": "private",
        "owner_username": "admin_anna",
        "tags": "it, rutin",
        "contributors": [
            { "username": "utvecklare_erik", "role": "editor", "added_at": "2026-10-21 08:30:00" }
        ]
    },
    "count": 1,
    "pages": [
        {
            "page_id": 31,
            "status": "published",
            "version": 3,
            "title": "VPN",
            "content": "Så här kopplar du upp dig...",
            "author_username": "admin_anna",
            "edited_by_username": "utvecklare_erik",
            "created_at": "2026-10-21 09:00:00",
            "updated_at": "2026-10-24 13:45:00",
            "tags": "it, nätverk, rutin",
            "images": [
                { "image_id": 9, "file_path": "uploads/4b1e7d0a9c3f5e2b8d6a1c4f7e9b0d2c.jpg", "caption": "Karta" }
            ]
        }
    ]
}
```

| Fält | Värden |
|----------------------|-------------------------------------------------------------|
| `version` | nuvarande versionsnummer |
| `author_username` | den som skrev version 1 |
| `edited_by_username` | den som gjorde den senaste versionen |
| `updated_at` | när den senaste versionen skapades |
| `images` | nuvarande versionens bilder, tom lista om det inte finns några |
| `contributors` | wikins medarbetare, tom lista om det inte finns några |

| Kod | `error` |
|-----|-------------------------------------|
| 400 | `Ange parametern 'wiki_id'.` |
| 404 | `Hittade ingen wiki med det ID:t.` (finns inte, eller du får inte se den) |

### `w_search` – sök sidor

`GET /?o=w_search&q=vpn` · Alla, även utloggade

| Fält (URL) | Typ | |
|---------------------|-----------------------|----------------------------------|
| `q` (eller `query`) | sökord | utan sökord kommer alla sidor |
| `wiki_id` | id från `w_wiki_list` | sök bara i den wikin |
| `mine` | `1` | sök bara i mina wikis (kräver inloggning) |
| `limit`, `offset` | tal | sidor |

Söker i sidans nuvarande titel, text och taggar, och i wikins titel och taggar. Delar av ord räknas, och stora och små bokstäver spelar ingen roll. Samma regler som `w_page_list` för vad du får se, men raderade sidor kommer aldrig med. Senast ändrad först.

**200** – varje sida ser ut som i `w_page_list`, plus vilken wiki den ligger i
```json
{
    "success": true,
    "count": 1,
    "pages": [
        {
            "page_id": 31,
            "wiki_id": 2,
            "wiki_title": "IT-handboken",
            "wiki_status": "private",
            "wiki_owner_username": "admin_anna",
            "status": "published",
            "version": 3,
            "title": "VPN",
            "content": "Så här kopplar du upp dig...",
            "author_username": "admin_anna",
            "edited_by_username": "utvecklare_erik",
            "created_at": "2026-10-21 09:00:00",
            "updated_at": "2026-10-24 13:45:00",
            "tags": "it, nätverk, rutin",
            "images": []
        }
    ]
}
```

| Kod | `error` |
|-----|-----------------------------------------------|
| 404 | `Hittade inga sidor som matchade sökningen.` |

### `w_page_update` – ändra sida

`POST /?o=w_page_update` · Redigerare

| Fält (body) | Typ | |
|--------------------------|-----------------------------------------|--------------------------------|
| `page_id` | id från `w_page_list` | krävs |
| `title` | text, max 255 tecken, unik i wikin | ny titel |
| `content` | text | ny text |
| `status` | `published`, `draft` eller `archived` | ny status |
| `tags` | taggar | ersätter sidans egna |
| `images[]`, `captions[]` | bilder (`multipart/form-data`) | läggs till |
| `remove_image_ids` | `image_id` från `images` | följer inte med till nya versionen |

- Varje anrop skapar en ny version, även om inget ändrades. Den gamla versionen ligger kvar i historiken.
- Fält som inte skickas behåller sitt värde.
- Bilderna i nuvarande version följer med till den nya, utom de i `remove_image_ids`. Nya bilder läggs till.
- En raderad sida måste återställas med `w_page_restore` innan den kan ändras.

**200**
```json
{ "success": true, "message": "Sidan uppdaterades till version 4!", "page_id": 31, "version": 4 }
```

| Kod | `error` |
|-----|----------------------------------------------------------------------|
| 400 | `Ange 'page_id' för att uppdatera.` |
| 400 | `Titel och innehåll får inte vara tomma.` |
| 400 | `Titeln får vara max 255 tecken.` |
| 400 | `Status måste vara 'draft', 'published' eller 'archived'.` |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.` |
| 400 / 413 | bildfel |
| 403 | `Du har inte behörighet att ändra denna sida.` |
| 404 | `Hittade ingen sida med det ID:t.` |
| 404 | `En eller flera bilder i 'remove_image_ids' hör inte till sidan.` |
| 409 | `Sidan är raderad. Återställ den först med w_page_restore.` |
| 409 | `En sida med titeln 'VPN' finns redan i denna wiki.` |

---

## 3. Historik, radera och återställ

### `w_page_history` – versionshistorik

`GET /?o=w_page_history&page_id=31` · Alla som får se sidan

| Fält (URL) | Typ | |
|-------------------|-----------------------|----------------|
| `page_id` | id från `w_page_list` | krävs |
| `limit`, `offset` | tal | sidor |

Alla versioner av sidan, nyast först. Läsare ser historiken för publicerade sidor i publika wikis, redigerarna för alla sidor i sin wiki. En radering syns som en version med tom `title` och `content`.

**200**
```json
{
    "success": true,
    "page_id": 31,
    "count": 3,
    "versions": [
        { "version": 3, "title": "VPN", "content": "Så här kopplar du upp dig...", "edited_by_username": "utvecklare_erik", "edited_at": "2026-10-24 13:45:00", "images": [] },
        { "version": 2, "title": "", "content": "", "edited_by_username": "admin_anna", "edited_at": "2026-10-23 10:00:00", "images": [] },
        { "version": 1, "title": "VPN", "content": "Första utkastet", "edited_by_username": "admin_anna", "edited_at": "2026-10-21 09:00:00", "images": [] }
    ]
}
```

| Kod | `error` |
|-----|--------------------------------------|
| 400 | `Ange parametern 'page_id'.` |
| 404 | `Hittade ingen sida med det ID:t.` (finns inte, eller du får inte se den) |

### `w_page_delete` – radera sida

`POST /?o=w_page_delete` · Ägaren eller admin (inte medarbetare)

| Fält (body) | Typ | |
|-------------|-----------------------|-------|
| `page_id` | id från `w_page_list` | krävs |

Sidan försvinner för läsare och ur `w_search`, men **inget raderas på riktigt**. Svaret säger vilken version den kan återställas till.

**200**
```json
{
    "success": true,
    "message": "Sidan raderades. Den kan återställas till version 3 med w_page_restore.",
    "page_id": 31,
    "version": 4
}
```

| Kod | `error` |
|-----|--------------------------------------------------|
| 400 | `Ange 'page_id' för att radera.` |
| 403 | `Du har inte behörighet att ta bort denna sida.` |
| 404 | `Hittade ingen sida med det ID:t.` |
| 409 | `Sidan är redan raderad.` |

### `w_page_restore` – återställ en gammal version

`POST /?o=w_page_restore` · Redigerare. En **raderad** sida kan bara ägaren eller admin återställa.

| Fält (body) | Typ | |
|-------------|-------------------------------------------|----------------|
| `page_id` | id från `w_page_list` | krävs |
| `version` | versionsnummer från `w_page_history` | krävs |
| `status` | `published`, `draft` eller `archived` | ny status |

- Titel, text och bilder från den gamla versionen kopieras till en **ny** version. Inget skrivs över, så även en återställning kan ångras.
- Utan `status` blir en raderad sida `published`, en vanlig sida behåller sin status.
- Taggarna ändras inte.

**200**
```json
{
    "success": true,
    "message": "Sidan återställdes till version 3 (sparad som version 5).",
    "page_id": 31,
    "version": 5
}
```

| Kod | `error` |
|-----|------------------------------------------------------------------|
| 400 | `Ange 'page_id' och 'version'.` |
| 400 | `Version 4 är en radering. Välj en version före den.` |
| 400 | `Status måste vara 'draft', 'published' eller 'archived'.` |
| 403 | `Du har inte behörighet att ändra denna sida.` |
| 403 | `Bara wikins ägare kan återställa en raderad sida.` |
| 404 | `Hittade ingen sida med det ID:t.` |
| 404 | `Sidan har ingen version 9.` |
| 409 | `En annan sida i wikin heter redan 'VPN'.` (titeln har tagits av en annan sida sedan dess) |

---

## 4. Medarbetare

Medarbetare får se wikin (även om den är `private`), skapa sidor, ändra alla sidor och återställa gamla versioner. De kan inte radera sidor eller ändra wikin. Medarbetarna visas i `contributors` i `w_page_list`.

### `w_add_contributor` – lägg till medarbetare

`POST /?o=w_add_contributor` · Ägaren eller admin

| Fält (body) | Typ | |
|--------------------------------|---------------------------------------|-------------------------------|
| `wiki_id` | id från `w_wiki_list` | krävs |
| `usernames` (eller `username`) | lista med användarnamn | `usernames` och/eller `group` |
| `group` | gruppnamn från `g_list`, t.ex. `alla` | `usernames` och/eller `group` |
| `role` | `editor` (standard) eller `author` | |

- `usernames` skickas som JSON-lista, `usernames[]=a&usernames[]=b` eller kommaseparerat `usernames=a, b`.
- Med `group` läggs alla som är med i gruppen **just nu** till. Nya medlemmar i gruppen senare läggs inte till automatiskt.
- Ägaren hoppas över, den har redan full behörighet.
- `role` sparas och visas i `contributors`, men `editor` och `author` får göra samma saker.

| Kod | `success` | Betyder |
|-----|-----------|-------------------------------|
| 200 | `true` | Alla lades till |
| 207 | `false` | Några lades till, se `failed` |
| 400 | `false` | Ingen lades till, se `failed` |

**200 / 207 / 400**
```json
{
    "success": false,
    "message": "1 av 2 är nu medarbetare på wikin.",
    "added": ["utvecklare_erik"],
    "failed": [ { "username": "finnsinte", "error": "Användaren finns inte." } ]
}
```

Möjliga orsaker i `failed`: `Användaren finns inte.` (finns inte eller är avstängd), `Är redan medarbetare på wikin.`

| Kod | `error` |
|-----|-------------------------------------------------------|
| 400 | `Ange 'wiki_id' och 'usernames' eller 'group'.` |
| 400 | `Roll måste vara 'author' eller 'editor'.` |
| 400 | `Ägaren har redan full behörighet till wikin.` (bara ägaren skickades) |
| 403 | `Bara wikins ägare kan lägga till medarbetare.` |
| 404 | `Gruppen finns inte.` |
| 404 | `Hittade ingen wiki med det ID:t.` |

### `w_remove_contributor` – ta bort medarbetare

`POST /?o=w_remove_contributor` · Ägaren eller admin

| Fält (body) | Typ | |
|-------------|-----------------------|-------|
| `wiki_id` | id från `w_wiki_list` | krävs |
| `username` | ett användarnamn | krävs |

Sidor och versioner som medarbetaren har skrivit ligger kvar.

**200**
```json
{ "success": true, "message": "utvecklare_erik är inte längre medarbetare på wikin." }
```

| Kod | `error` |
|-----|-------------------------------------------------|
| 400 | `Ange 'wiki_id' och 'username'.` |
| 403 | `Bara wikins ägare kan ta bort medarbetare.` |
| 404 | `Hittade ingen wiki med det ID:t.` |
| 404 | `utvecklare_erik är inte medarbetare på wikin.` |