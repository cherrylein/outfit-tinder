# Outfit Tinder

Kleine Web-App zur gemeinsamen Outfit-Auswahl.

Aktueller Stand: **v1.11 Star Filter**

## Funktionen

- Outfit-Galerie mit Kategorien
- Detailansicht mit Bewertung, Favorit und Kommentar
- Mobile Detailansicht als Vollbild-Panel
- Tinder-Modus mit Swipe-Auswahl und Rundenlogik
- Teilnehmername beim Oeffnen der App
- gemeinsame Speicherung pro Projekt und Name ueber Cloudflare D1
- gemeinsame Ergebnisansicht ueber "Alle Ergebnisse"
- Meine Topliste fuer die lokale Auswahl
- lokale Bewertungstools im Admin statt in der normalen App-Leiste
- lokaler Fallback im Browser, falls D1 noch nicht verbunden ist
- Outfit-Verwaltung ueber `outfits.json`
- Admin-Oberflaeche unter `/admin.html`
- versteckter Admin-Zugang ueber 7 Klicks/Taps auf den Versions-Badge
- Uebersichtsfilter "Nur Sterne" fuer Outfits mit Tinder-Sternen

## v1.6 Notizen

- `mobile.css` verbessert das Handy-Layout, speziell Detailansicht, kleine Displays und Zoom-Situationen.
- `app-enhancements.js` setzt die Versionsanzeige, ergaenzt Teilen/Topliste/Bildgroesse und fuegt Wischgesten in der Detailansicht hinzu.
- `sync.js` und `functions/api/state.js` bilden die gemeinsame Speicherung pro Name/Projekt ab.
- `v1.6.1`: Tinder-Rechts-Swipe vergibt nur noch einen Tinder-Stern und setzt nicht mehr automatisch den Favorit-Haken.
- `v1.7`: Bewertungen senden ein explizites Sync-Signal an D1; Outfits werden aus `outfits.json` geladen.
- `v1.8`: Admin-UI zum Aktivieren, Bearbeiten, Ergaenzen und Speichern der Outfits in D1.
- `v1.9`: Detailbild auf Handy groesser; Admin-Link ist aus der Button-Leiste entfernt und ueber 7 Taps auf die Version erreichbar.
- `v1.10`: Export, Link kopieren und Bewertungen leeren aus der normalen App-Leiste entfernt; diese Werkzeuge liegen im Admin. Das Bildgroessen-Tool ist aus der normalen App entfernt.
- `v1.11`: Button "Nur Sterne" in der Uebersicht, um nur Outfits mit Tinder-Sternen anzuzeigen.

## Outfits verwalten

Die sichtbaren Bilder koennen unter `/admin.html` verwaltet werden. Die App laedt zuerst die gespeicherte D1-Konfiguration aus `/api/outfits`. Wenn dort noch nichts gespeichert ist, wird `outfits.json` als Fallback genutzt.

Optional kann im Cloudflare Pages Projekt eine Environment Variable `ADMIN_KEY` gesetzt werden. Dann muss derselbe Key beim Speichern in der Admin-Oberflaeche eingegeben werden.

Die Fallback-Liste steht in `outfits.json`.

Ein Outfit ausblenden:

```json
{
  "active": false,
  "id": "04",
  "file": "images/04-skirt-sleeves-fabric-boots.jpg",
  "name": "Rock + Stoffstiefel",
  "group": "Basis",
  "note": "Ohne Panzer, noch mit Aermeln."
}
```

Ein neues Outfit hinzufuegen:

1. Bild in den Ordner `images/` legen.
2. Neuen Eintrag in `outfits.json` ergaenzen.
3. `id` eindeutig vergeben, z. B. `"38"`.
4. `active` auf `true` setzen.

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
