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

Die App laeuft als Cloudflare Pages Projekt.

## D1 Setup

Die App erwartet in Cloudflare Pages eine D1 Binding Variable mit dem Namen:

```txt
DB
```

Empfohlene Schritte in Cloudflare:

1. D1 Datenbank erstellen, z. B. `outfit_tinder`.
2. Im Pages Projekt `outfit-tinder` unter Settings > Functions > D1 database bindings die Datenbank als `DB` binden.
3. Optional `schema.sql` in D1 ausfuehren. Die API legt die Tabelle aber auch selbst an, falls sie fehlt.
4. Pages neu deployen.

## Nutzung

Beim ersten Oeffnen fragt die App nach einem Namen, z. B. `Rosa` oder `Gerrit`.

Optional kann ein Projekt in der URL gesetzt werden:

```txt
https://outfit-tinder.pages.dev/?project=vader&user=rosa
```

Bewertungen/Favoriten/Kommentare werden dann unter diesem Projekt und Namen gespeichert. Ueber "Alle Ergebnisse" werden die gespeicherten Teilnehmer zusammen ausgewertet.
