# Outfit Tinder

Kleine Web-App zur gemeinsamen Outfit-Auswahl.

## Funktionen

- Outfit-Galerie mit Kategorien
- Detailansicht mit Bewertung, Favorit und Kommentar
- Mobile Detailansicht als Vollbild-Panel
- Tinder-Modus mit Swipe-Auswahl und Rundenlogik
- Teilnehmername beim Oeffnen der App
- gemeinsame Speicherung pro Projekt und Name ueber Cloudflare D1
- gemeinsame Ergebnisansicht ueber "Alle Ergebnisse"
- Export als JSON oder CSV
- lokaler Fallback im Browser, falls D1 noch nicht verbunden ist

## Hosting

Die App laeuft als Cloudflare Pages Projekt. Die D1-Bindung ist in `wrangler.toml` hinterlegt.

## D1 Setup

Die App erwartet in Cloudflare Pages eine D1 Binding Variable mit dem Namen:

```txt
DB
```

Aktuelle D1-Konfiguration:

```toml
[[d1_databases]]
binding = "DB"
database_name = "outfit-tinder"
database_id = "af9c9f94-0865-4f81-b850-e60aa076ce57"
```

Falls Cloudflare Pages die `wrangler.toml` nicht automatisch uebernimmt, im Pages Projekt `outfit-tinder` unter Settings > Functions > D1 database bindings die Datenbank manuell als `DB` binden.

Optional kann `schema.sql` in D1 ausgefuehrt werden. Die API legt die Tabelle aber auch selbst an, falls sie fehlt.

## Nutzung

Beim ersten Oeffnen fragt die App nach einem Namen, z. B. `Rosa` oder `Gerrit`.

Optional kann ein Projekt in der URL gesetzt werden:

```txt
https://outfit-tinder.pages.dev/?project=vader&user=rosa
```

Bewertungen/Favoriten/Kommentare werden dann unter diesem Projekt und Namen gespeichert. Ueber "Alle Ergebnisse" werden die gespeicherten Teilnehmer zusammen ausgewertet.
