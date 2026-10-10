# Glaubensbaum

Eine Web-App zum Auswendiglernen von Bibelversen, nach dem Vorbild von Duolingo.
Jeden Tag lernst du einen Vers, und dein **Glaubensbaum** wächst mit.

## So funktioniert’s

- **Lernpfad:** 45 bekannte Verse in 9 Einheiten (Vertrauen, Mut, Liebe, Licht, Tief verwurzelt …).
  Jeder Vers hat 3 Lektionen: kennenlernen, festigen, meistern. Dazu gibt es Schatztruhen und eine Wiederholung am Ende jeder Einheit.
- **Aufgaben:** fehlendes Wort wählen, Lücken füllen, Vers aus Wortkacheln zusammensetzen, falsches Wort finden,
  Bibelstelle zuordnen und den Vers aus dem Gedächtnis schreiben (nur den ersten Buchstaben jedes Wortes tippen).
- **Der Baum wächst von Tag zu Tag:** Die Krone wächst einmal pro Lerntag, nicht mit jeder weiteren Übung am selben Tag.
  Die Wurzeln reichen tiefer, je länger deine Serie ist. Jeder gemeisterte Vers hängt als Frucht am Baum.
  Wenn du heute noch nicht gelernt hast, hat der Baum Durst.
- **Motivation:** tägliche Serie (blaue Flamme), Tagesziel, drei Tagesaufgaben, Perlen, Regenwolken als Serienschutz,
  15 Erfolge, Kombo-Anzeige, Konfetti und Töne.
- **Wiederholung:** Gelernte Verse werden nach einem Zeitplan (1, 2, 4, 7, 14, 30 Tage) wieder fällig, damit sie dauerhaft sitzen.
- **Töne** werden direkt im Browser erzeugt (Web Audio). Neue Verse können vorgelesen werden (Sprachausgabe des Geräts).

Die App passt sich an: Auf dem Handy gibt es unten eine Tab-Leiste, auf dem PC links eine Seitenleiste und rechts eine Spalte mit Serie, Tagesziel und Tagesaufgaben. Lektionen lassen sich am PC komplett mit der Tastatur bedienen (1–4 wählen, Enter prüfen, Buchstaben tippen).

Der Fortschritt wird nur lokal im Browser gespeichert (`localStorage`).

## Starten

Keine Installation nötig: `index.html` im Browser öffnen.
Für die Offline-Funktion und „Zum Startbildschirm hinzufügen“ die Dateien über einen Webserver ausliefern, zum Beispiel:

```bash
npx serve .
```

Auf GitHub Pages veröffentlichen: In den Repository-Einstellungen unter *Pages* den Branch auswählen. Danach lässt sich die App auf dem Handy über „Zum Home-Bildschirm“ wie eine normale App installieren.

Eine einzelne HTML-Datei mit allem darin erzeugen:

```bash
node tools/build-single.mjs dist/glaubensbaum.html
```

## Aufbau

| Datei | Inhalt |
|---|---|
| `js/verses.js` | Einheiten und Verse |
| `js/store.js` | Spielstand, Serie, Baumwachstum, Wiederholungsplan, Aufgaben, Erfolge |
| `js/tree.js` | Der Baum, gezeichnet auf `<canvas>` |
| `js/exercises.js` | Aufgabentypen und Zusammenstellung der Lektionen |
| `js/lesson.js` | Lektionsablauf und Abschluss-Bildschirme |
| `js/ui.js` | Bildschirme: Baum, Lernen, Profil, Dialoge; auf dem PC mit Seitenleiste und rechter Spalte |
| `js/sound.js` | Töne und Vorlesen |

Bibeltext: Lutherbibel 1912 (gemeinfrei), Rechtschreibung behutsam angepasst.
