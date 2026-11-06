# API-dokumentation – Blogg

Bloggar, inlägg, kommentarer och medarbetare. Inloggning och grupper finns i `user.md`, kalendern i `calendar.md` och wikin i `wiki.md`.

## Autentisering

För att anropa skyddade slutpunkter i API:et behöver du skicka med en giltig autentiseringstoken. Detta görs i HTTP-headern för varje anrop med nyckeln `Authorization` och formatet `Bearer <din_token>`:

```http
Authorization: Bearer 3f9a0c...e21c
```

Tokenen får du när du loggar in via inloggningsslutpunkten (t.ex. `loginuser`), och den måste inkluderas i alla efterföljande förfrågningar som kräver inloggning.

## Innehåll

1. [Bloggar](#1-bloggar) – `b_blog_create`, `b_blog_list`, `b_blog_update`, `b_blog_delete`
2. [Inlägg](#2-inlägg) – `b_post_create`, `b_post_list`, `b_search`, `b_post_update`, `b_post_delete`
3. [Kommentarer](#3-kommentarer) – `b_comment_create`, `b_comment_delete`
4. [Medarbetare](#4-medarbetare) – `b_add_contributor`, `b_remove_contributor`

---

## 1. Bloggar

### `b_blog_create` – skapa blogg

`POST /?o=b_blog_create` · Admin

| Fält (body) | Typ                                  |       |
|-------------|--------------------------------------|-------|
| `title`     | text, max 255 tecken, unik           | krävs |
| `status`    | `public` (standard) eller `private`  |       |
| `tags`      | taggar                               |       |

Du blir bloggens ägare.

**201**
```json
{ "success": true, "message": "Bloggen skapades!", "blog_id": 3 }
```

| Kod | `error`                                        |
|-----|------------------------------------------------|
| 400 | `Titel krävs (max 255 tecken)!`                |
| 400 | `Status måste vara 'private' eller 'public'.`  |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.`  |
| 409 | `En blogg med den titeln finns redan.`         |

### `b_blog_list` – lista bloggar

`GET /?o=b_blog_list` · Alla, även utloggade

| Fält (URL)        | Typ |                            |
|-------------------|-----|----------------------------|
| `mine`            | `1` | bara mina bloggar (kräver inloggning) |
| `limit`, `offset` | tal | sidor                      |

Alla bloggar du får se, nyast först.

**200**
```json
{
    "success": true,
    "count": 2,
    "blogs": [
        {
            "blog_id": 3,
            "title": "Ekonomibloggen",
            "status": "private",
            "owner_username": "admin_anna",
            "created_at": "2026-10-20 10:00:00",
            "published_posts": 4,
            "tags": "budget, ekonomi"
        },
        {
            "blog_id": 1,
            "title": "Företagsnytt",
            "status": "public",
            "owner_username": "admin",
            "created_at": "2026-10-01 09:00:00",
            "published_posts": 12,
            "tags": null
        }
    ]
}
```

`published_posts` räknar bara publicerade inlägg.

### `b_blog_update` – ändra blogg

`POST /?o=b_blog_update` · Ägaren eller admin

| Fält (body) | Typ                        |                   |
|-------------|----------------------------|-------------------|
| `blog_id`   | id från `b_blog_list`      | krävs             |
| `title`     | text, max 255 tecken, unik | ny titel          |
| `status`    | `public` eller `private`   | ny status         |
| `tags`      | taggar                     | ersätter de gamla |

Fält som inte skickas behåller sitt värde.

**200**
```json
{ "success": true, "message": "Bloggen uppdaterades!" }
```

| Kod | `error`                                        |
|-----|------------------------------------------------|
| 400 | `Ange 'blog_id' för att redigera.`             |
| 400 | `Titel krävs (max 255 tecken)!`                |
| 400 | `Status måste vara 'private' eller 'public'.`  |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.`  |
| 403 | `Bara bloggens ägare kan redigera bloggen.`    |
| 404 | `Hittade ingen blogg med det ID:t.`            |
| 409 | `En blogg med den titeln finns redan.`         |

### `b_blog_delete` – radera blogg

`POST /?o=b_blog_delete` · Ägaren eller admin

| Fält (body) | Typ                   |       |
|-------------|-----------------------|-------|
| `blog_id`   | id från `b_blog_list` | krävs |

**Allt raderas permanent:** bloggen, alla inlägg, deras bilder och kommentarer, och alla medarbetare. Taggarna finns kvar för andra bloggar.

**200**
```json
{ "success": true, "message": "Bloggen och alla dess inlägg raderades." }
```

| Kod | `error`                                    |
|-----|--------------------------------------------|
| 400 | `Ange 'blog_id' för att radera.`           |
| 403 | `Bara bloggens ägare kan radera bloggen.`  |
| 404 | `Hittade ingen blogg med det ID:t.`        |

---

## 2. Inlägg

### `b_post_create` – skriv inlägg

`POST /?o=b_post_create` · Ägaren, medarbetare eller admin

| Fält (body)              | Typ                                  |       |
|--------------------------|---------------------------------------|-------|
| `blog_id`                | id från `b_blog_list`                 | krävs |
| `title`                  | text, max 255 tecken                  | krävs |
| `content`                | text                                  | krävs |
| `status`                 | `published` (standard) eller `draft`  |       |
| `tags`                   | taggar                                |       |
| `images[]`, `captions[]` | bilder (`multipart/form-data`)        |       |

Du står som författare (`author_username`). Inläggets titel behöver inte vara unik.

**201**
```json
{ "success": true, "message": "Inlägget publicerades!", "post_id": 21 }
```

Med `status: "draft"` blir `message` i stället `Utkastet sparades!`.

| Kod | `error`                                                |
|-----|--------------------------------------------------------|
| 400 | `Fälten 'blog_id', 'title' och 'content' krävs!`       |
| 400 | `Titeln får vara max 255 tecken.`                      |
| 400 | `Status måste vara 'draft' eller 'published'.`         |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.`          |
| 400 / 413 | bildfel                                            |
| 403 | `Du har inte behörighet att skriva i denna blogg.`     |
| 404 | `Hittade ingen blogg med det ID:t.`                    |

### `b_post_list` – en blogg med inlägg

`GET /?o=b_post_list&blog_id=3` · Alla, även utloggade

| Fält (URL)        | Typ                   |                |
|-------------------|-----------------------|----------------|
| `blog_id`         | id från `b_blog_list` | krävs          |
| `limit`, `offset` | tal                   | sidor          |

Bloggen och dess inlägg, nyast först (efter publiceringsdatum, annars när de skapades). Läsare ser bara publicerade inlägg, ägaren, medarbetare och admin ser alla. `limit` och `offset` gäller inläggen.

**200**
```json
{
    "success": true,
    "blog": {
        "blog_id": 3,
        "title": "Ekonomibloggen",
        "status": "private",
        "owner_username": "admin_anna",
        "tags": "budget, ekonomi",
        "contributors": [
            { "username": "ekonomi_lars", "role": "editor", "added_at": "2026-10-21 08:30:00" }
        ]
    },
    "count": 1,
    "posts": [
        {
            "post_id": 21,
            "status": "published",
            "author_username": "ekonomi_lars",
            "title": "Budget 2027",
            "content": "Här är förslaget...",
            "published_at": "2026-10-22 14:00:00",
            "created_at": "2026-10-22 14:00:00",
            "updated_at": "2026-10-23 09:12:00",
            "tags": "budget, ekonomi, prognos",
            "images": [
                { "image_id": 7, "file_path": "uploads/9f2c4b0e6a1d8e3f5c7b9a2d4e6f8a1c.png", "caption": "Kontoret" }
            ],
            "comments": [
                { "comment_id": 5, "username": "ekonomi_pia", "content": "Snyggt!", "created_at": "2026-10-22 15:01:00" }
            ]
        }
    ]
}
```

| Fält           | Värden                                                                 |
|----------------|------------------------------------------------------------------------|
| `published_at` | när inlägget publicerades första gången, `null` för ett utkast som aldrig varit publicerat |
| `updated_at`   | senaste ändringen                                                      |
| `images`       | tom lista om det inte finns några                                      |
| `comments`     | äldst först, tom lista om det inte finns några                         |
| `contributors` | bloggens medarbetare, tom lista om det inte finns några                |

| Kod | `error`                                     |
|-----|---------------------------------------------|
| 400 | `Ange parametern 'blog_id'.`                |
| 404 | `Hittade ingen blogg med det ID:t.` (finns inte, eller du får inte se den) |

### `b_search` – sök inlägg

`GET /?o=b_search&q=budget` · Alla, även utloggade

| Fält (URL)          | Typ                   |                                     |
|---------------------|-----------------------|-------------------------------------|
| `q` (eller `query`) | sökord                | utan sökord kommer alla inlägg      |
| `blog_id`           | id från `b_blog_list` | sök bara i den bloggen              |
| `mine`              | `1`                   | sök bara i mina bloggar (kräver inloggning) |
| `limit`, `offset`   | tal                   | sidor                               |

Söker i inläggets titel, text och taggar, och i bloggens titel och taggar. Delar av ord räknas, och stora och små bokstäver spelar ingen roll. Samma regler som `b_post_list` för vad du får se. Nyast först.

**200** – varje inlägg ser ut som i `b_post_list`, plus vilken blogg det ligger i
```json
{
    "success": true,
    "count": 1,
    "posts": [
        {
            "post_id": 21,
            "blog_id": 3,
            "blog_title": "Ekonomibloggen",
            "blog_status": "private",
            "blog_owner_username": "admin_anna",
            "status": "published",
            "author_username": "ekonomi_lars",
            "title": "Budget 2027",
            "content": "Här är förslaget...",
            "published_at": "2026-10-22 14:00:00",
            "created_at": "2026-10-22 14:00:00",
            "updated_at": "2026-10-23 09:12:00",
            "tags": "budget, ekonomi, prognos",
            "images": [],
            "comments": []
        }
    ]
}
```

| Kod | `error`                                        |
|-----|------------------------------------------------|
| 404 | `Hittade inga inlägg som matchade sökningen.`  |

### `b_post_update` – ändra inlägg

`POST /?o=b_post_update` · Ägaren, medarbetare eller admin

| Fält (body)              | Typ                                     |                          |
|--------------------------|-----------------------------------------|--------------------------|
| `post_id`                | id från `b_blog_list`                   | krävs                    |
| `title`                  | text, max 255 tecken                    | ny titel                 |
| `content`                | text                                    | ny text                  |
| `status`                 | `published`, `draft` eller `archived`   | ny status                |
| `tags`                   | taggar                                  | ersätter inläggets egna  |
| `images[]`, `captions[]` | bilder (`multipart/form-data`)          | läggs till               |
| `remove_image_ids`       | `image_id` från `images`                | tas bort                 |

- Fält som inte skickas behåller sitt värde.
- Ändringen syns direkt. Det finns ingen historik, det gamla innehållet skrivs över.
- `published_at` sätts första gången inlägget publiceras och ändras inte sedan.
- Nya bilder läggs till bredvid de gamla.

**200**
```json
{ "success": true, "message": "Inlägget uppdaterades!", "post_id": 21 }
```

| Kod | `error`                                                              |
|-----|----------------------------------------------------------------------|
| 400 | `Ange 'post_id' för att uppdatera.`                                  |
| 400 | `Titel och innehåll får inte vara tomma.`                            |
| 400 | `Titeln får vara max 255 tecken.`                                    |
| 400 | `Status måste vara 'draft', 'published' eller 'archived'.`           |
| 400 | `Taggen '<tagg>' är för lång, max 50 tecken.`                        |
| 400 / 413 | bildfel                                                        |
| 403 | `Du har inte behörighet att ändra detta inlägg.`                     |
| 404 | `Hittade inget inlägg med det ID:t.`                                 |
| 404 | `En eller flera bilder i 'remove_image_ids' hör inte till inlägget.` |

### `b_post_delete` – radera inlägg

`POST /?o=b_post_delete` · Ägaren eller admin (inte medarbetare)

| Fält (body) | Typ                   |       |
|-------------|-----------------------|-------|
| `post_id`   | id från `b_blog_list` | krävs |

Inlägget, dess bilder och kommentarer raderas permanent. Vill du bara dölja det, sätt `status: "archived"` med `b_post_update`.

**200**
```json
{ "success": true, "message": "Inlägget raderades." }
```

| Kod | `error`                                           |
|-----|---------------------------------------------------|
| 400 | `Ange 'post_id' för att radera.`                  |
| 403 | `Du har inte behörighet att ta bort detta inlägg.` |
| 404 | `Hittade inget inlägg med det ID:t.`              |

---

## 3. Kommentarer

Kommentarerna visas i `comments` på varje inlägg i `b_post_list` och `b_search`. De kan inte ändras, bara raderas.

### `b_comment_create` – kommentera

`POST /?o=b_comment_create` · Inloggad

| Fält (body) | Typ                       |       |
|-------------|---------------------------|-------|
| `post_id`   | id från `b_blog_list`     | krävs |
| `content`   | text, max 65 535 byte     | krävs |

Alla inloggade kan kommentera publicerade inlägg i bloggar de får se. Utkast och arkiverade inlägg kan bara ägaren, medarbetare och admin kommentera. Mellanslag först och sist tas bort.

**201**
```json
{ "success": true, "message": "Kommentaren publicerades!", "comment_id": 5 }
```

| Kod | `error`                                         |
|-----|-------------------------------------------------|
| 400 | `Fälten 'post_id' och 'content' krävs!`         |
| 400 | `Kommentaren är för lång.`                      |
| 404 | `Hittade inget inlägg med det ID:t.` (finns inte, eller du får inte se det) |

### `b_comment_delete` – radera kommentar

`POST /?o=b_comment_delete` · Bloggens ägare eller admin

| Fält (body)  | Typ                                   |       |
|--------------|---------------------------------------|-------|
| `comment_id` | id från `comments` i `b_post_list`    | krävs |

Den som skrev kommentaren och medarbetare kan **inte** radera den.

**200**
```json
{ "success": true, "message": "Kommentaren raderades." }
```

| Kod | `error`                                                  |
|-----|----------------------------------------------------------|
| 400 | `Ange 'comment_id' för att radera.`                      |
| 403 | `Bara bloggens ägare och admin kan ta bort kommentarer.` |
| 404 | `Hittade ingen kommentar med det ID:t.`                  |

---

## 4. Medarbetare

Medarbetare får se bloggen (även om den är `private`), skriva nya inlägg och ändra alla inlägg i den. De kan inte radera något eller ändra bloggen. Medarbetarna visas i `contributors` i `b_post_list`.

### `b_add_contributor` – lägg till medarbetare

`POST /?o=b_add_contributor` · Ägaren eller admin

| Fält (body)                    | Typ                                    |                               |
|--------------------------------|----------------------------------------|-------------------------------|
| `blog_id`                      | id från `b_blog_list`                  | krävs                         |
| `usernames` (eller `username`) | lista med användarnamn                 | `usernames` och/eller `group` |
| `group`                        | gruppnamn från `g_list`, t.ex. `alla`  | `usernames` och/eller `group` |
| `role`                         | `editor` (standard) eller `author`     |                               |

- `usernames` skickas som JSON-lista, `usernames[]=a&usernames[]=b` eller kommaseparerat `usernames=a, b`.
- Med `group` läggs alla som är med i gruppen **just nu** till. Nya medlemmar i gruppen senare läggs inte till automatiskt.
- Ägaren hoppas över, den har redan full behörighet.
- `role` sparas och visas i `contributors`, men `editor` och `author` får göra samma saker.

| Kod | `success` | Betyder                              |
|-----|-----------|--------------------------------------|
| 200 | `true`    | Alla lades till                      |
| 207 | `false`   | Några lades till, se `failed`        |
| 400 | `false`   | Ingen lades till, se `failed`        |

**200 / 207 / 400**
```json
{
    "success": false,
    "message": "1 av 2 är nu medarbetare på bloggen.",
    "added": ["ekonomi_pia"],
    "failed": [ { "username": "ekonomi_lars", "error": "Är redan medarbetare på bloggen." } ]
}
```

Möjliga orsaker i `failed`: `Användaren finns inte.` (finns inte eller är avstängd), `Är redan medarbetare på bloggen.`

| Kod | `error`                                                |
|-----|--------------------------------------------------------|
| 400 | `Ange 'blog_id' och 'usernames' eller 'group'.`        |
| 400 | `Roll måste vara 'author' eller 'editor'.`             |
| 400 | `Ägaren har redan full behörighet till bloggen.` (bara ägaren skickades) |
| 403 | `Bara bloggens ägare kan lägga till medarbetare.`      |
| 404 | `Gruppen finns inte.`                                  |
| 404 | `Hittade ingen blogg med det ID:t.`                    |

### `b_remove_contributor` – ta bort medarbetare

`POST /?o=b_remove_contributor` · Ägaren eller admin

| Fält (body) | Typ                   |       |
|-------------|-----------------------|-------|
| `blog_id`   | id från `b_blog_list` | krävs |
| `username`  | ett användarnamn      | krävs |

Inlägg som medarbetaren har skrivit ligger kvar.

**200**
```json
{ "success": true, "message": "ekonomi_lars är inte längre medarbetare på bloggen." }
```

| Kod | `error`                                            |
|-----|----------------------------------------------------|
| 400 | `Ange 'blog_id' och 'username'.`                   |
| 403 | `Bara bloggens ägare kan ta bort medarbetare.`     |
| 404 | `Hittade ingen blogg med det ID:t.`                |
| 404 | `ekonomi_lars är inte medarbetare på bloggen.`     |