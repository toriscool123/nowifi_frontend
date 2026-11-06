# API-dokumentation – Företag och The Provider

Hantering av företags-inloggningar mot The Provider och val av aktivt företag. Inloggning och grupper finns i `user.md`, kalendern i `calendar.md`, bloggen i `blog.md` och wikin i `wiki.md`.

## Autentisering och behörighet

För att anropa skyddade slutpunkter i API:et behöver du skicka med en giltig autentiseringstoken i HTTP-headern `Authorization` med formatet `Bearer <din_token>`:

```http
Authorization: Bearer 3f9a0c...e21c
```

Alla `provider_*`-anrop kräver att du är inloggad som **den första administratören i databasen (super-admin)**, dvs. `superadmin` (`user_id = 1`). En vanlig användare får `403 Endast admin har behörighet`, och andra administratörer får `403 Endast den första administratören har behörighet att ändra The Provider`.

## Innehåll

1. [Inloggningar till The Provider](#1-inloggningar-till-the-provider) – `provider_list`, `provider_get`, `provider_add`, `provider_update`, `provider_delete`
2. [Byta aktivt företag](#2-byta-aktivt-företag) – `provider_switch`
3. [Tjänstekontroll](#3-tjänstekontroll) – hur The Provider styr tillgången till kalender, blogg och wiki

---

## 1. Inloggningar till The Provider

Företagens inloggningsuppgifter hos The Provider sparas i tabellen `verysecret`. Lösenorden lämnar aldrig servern – `provider_list` och `provider_get` visar bara `id` och `username`.

### `provider_list` – lista alla företagsinloggningar

`GET /?o=provider_list` · Första adminen (super-admin)

Visar alla sparade inloggningar i `verysecret` sorterade på `id`, samt vilket `company_id` som är aktivt just nu.

**200**
```json
{
    "success": true,
    "active_company_id": 1,
    "logins": [
        { "id": 1, "username": "tea_1" },
        { "id": 2, "username": "tea_2" },
        { "id": 3, "username": "tea_3" }
    ]
}
```

| Kod | `error`                                                                 |
|-----|-------------------------------------------------------------------------|
| 401 | `Ogiltig token`                                                         |
| 403 | `Endast admin har behörighet`                                           |
| 403 | `Endast den första administratören har behörighet att ändra The Provider` |

### `provider_get` – visa aktivt företags inloggning

`GET /?o=provider_get` · Första adminen (super-admin)

Visar `company_id` och `username` hos The Provider för det företag som är valt i `ACTIVE_COMPANY` just nu.

**200**
```json
{ "success": true, "company_id": 1, "username": "tea_1" }
```

| Kod | `error`                                                                 |
|-----|-------------------------------------------------------------------------|
| 401 | `Ogiltig token`                                                         |
| 403 | `Endast admin har behörighet`                                           |
| 403 | `Endast den första administratören har behörighet att ändra The Provider` |
| 404 | `Ingen inloggning hittades för detta företag`                           |

### `provider_add` – lägg till ny företagsinloggning

`POST /?o=provider_add` · Första adminen (super-admin)

| Fält (body) | Typ                          |       |
|-------------|------------------------------|-------|
| `username`  | text, max 50 tecken, unikt   | krävs |
| `password`  | text                         | krävs |

Sparar en ny rad i `verysecret`. Du får tillbaka det nya `id`:t som kan användas med `provider_switch`.

**201**
```json
{
    "success": true,
    "id": 4,
    "message": "Inloggningen till The Provider är tillagd"
}
```

| Kod | `error`                                                                 |
|-----|-------------------------------------------------------------------------|
| 400 | `username och password krävs`                                           |
| 400 | `username får vara max 50 tecken`                                       |
| 401 | `Ogiltig token`                                                         |
| 403 | `Endast admin har behörighet`                                           |
| 403 | `Endast den första administratören har behörighet att ändra The Provider` |
| 409 | `En inloggning med det användarnamnet finns redan`                      |

### `provider_update` – ändra aktivt företags inloggning

`POST /?o=provider_update` · Första adminen (super-admin)

| Fält (body)    | Typ                         |                             |
|----------------|-----------------------------|-----------------------------|
| `old_username` | text                        | nuvarande användarnamn      |
| `old_password` | text                        | nuvarande lösenord          |
| `new_username` | text, max 50 tecken, unikt  | nytt användarnamn           |
| `new_password` | text                        | nytt lösenord               |

Uppdaterar inloggningen i `verysecret` för det **aktiva** företaget. De nuvarande uppgifterna måste stämma. Efter uppdateringen loggar API:et in hos The Provider på nytt så att `COMPANY` får en ny `session_key` direkt.

**200**
```json
{ "success": true, "message": "Inloggningen till The Provider är uppdaterad" }
```

| Kod | `error`                                                                 |
|-----|-------------------------------------------------------------------------|
| 400 | `old_username, old_password, new_username och new_password krävs`       |
| 400 | `new_username får vara max 50 tecken`                                   |
| 401 | `Ogiltig token`                                                         |
| 403 | `Endast admin har behörighet`                                           |
| 403 | `Endast den första administratören har behörighet att ändra The Provider` |
| 403 | `Fel nuvarande användarnamn eller lösenord`                             |
| 409 | `En inloggning med det användarnamnet finns redan`                      |

### `provider_delete` – ta bort företagsinloggning

`POST /?o=provider_delete` · Första adminen (super-admin)

| Fält (body)                  | Typ                     |       |
|------------------------------|-------------------------|-------|
| `id` (eller `company_id`)    | id från `provider_list` | krävs |

Tar bort raden ur `verysecret`.

**200**
```json
{ "success": true, "message": "Inloggningen till The Provider är borttagen" }
```

| Kod | `error`                                                                 |
|-----|-------------------------------------------------------------------------|
| 400 | `id krävs`                                                              |
| 401 | `Ogiltig token`                                                         |
| 403 | `Endast admin har behörighet`                                           |
| 403 | `Endast den första administratören har behörighet att ändra The Provider` |
| 404 | `Ingen inloggning hittades med det id:t`                                |

---

## 2. Byta aktivt företag

### `provider_switch` – byt aktivt företag

`POST /?o=provider_switch` · Första adminen (super-admin)

| Fält (body)  | Typ                     |       |
|--------------|-------------------------|-------|
| `company_id` | id från `provider_list` | krävs |

Byter vilket företag API:et loggar in som hos The Provider:
- Det nya `company_id`:t måste finnas i `verysecret`.
- API:et testar att logga in hos The Provider som det nya företaget innan bytet sparas i `ACTIVE_COMPANY`. Misslyckas inloggningen hos The Provider sparas inte bytet.
- Svaret visar vilka tjänster det nya företaget har tillgång till.

**200**
```json
{
    "success": true,
    "company_id": 1,
    "services": ["calendar", "blog", "wiki"]
}
```

| Kod | `error`                                                                 |
|-----|-------------------------------------------------------------------------|
| 400 | `company_id krävs`                                                      |
| 401 | `Ogiltig token`                                                         |
| 403 | `Endast admin har behörighet`                                           |
| 403 | `Endast den första administratören har behörighet att ändra The Provider` |
| 404 | `Det finns ingen inloggning för företag <id>`                           |
| 502 | `Kunde inte logga in hos The Provider som företag <id>`                 |

---

## 3. Tjänstekontroll

Varje anrop till kalender (`1`), blogg (`2`) och wiki (`4`) kontrollerar via The Provider att det aktiva företaget abonnerar på tjänsten, samt att tjänsten inte har stängts av för den inloggade användaren med `blockservice` (se `user.md`).

| Kod | `error`                                             | Orsak                                                        |
|-----|-----------------------------------------------------|--------------------------------------------------------------|
| 403 | `Företaget har inte tillgång till den här tjänsten` | Tjänsten ingår inte i det aktiva företagets `services`       |
| 403 | `Du har inte tillgång till den här tjänsten`        | En admin har stängt av tjänsten för användaren               |
| 502 | `Kunde inte nå The Provider`                        | The Provider svarar inte eller inloggning i `verysecret` saknas |
