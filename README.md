# Glaubensbaum

Eine Web-App zum Auswendiglernen von Bibelversen, nach dem Vorbild von Duolingo.
Jeden Tag lernst du einen Vers, und dein **Glaubensbaum** wächst mit.

## So funktioniert’s

- **Freie Verswahl:** Du entscheidest, welchen Vers du lernst. Alle 45 Verse in 9 Themen (Vertrauen, Mut, Liebe, Licht, Tief verwurzelt …)
  sind von Anfang an offen. Deinen „Lernvers“ wechselst du jederzeit über „Ändern“, im Lernpfad oder unter „Alle Verse“ (mit Suche und Filtern).
  Eigene Verse in beliebiger Übersetzung lassen sich hinzufügen und werden genauso geübt.
- **Lektionen:** Jeder Vers hat 3 Lektionen: kennenlernen, festigen, meistern. Schatztruhen öffnen sich ab 3 gemeisterten Versen eines Themas,
  die Themen-Wiederholung, sobald alle 5 sitzen.
- **Aufgaben:** fehlendes Wort wählen, Lücken füllen, Vers aus Wortkacheln zusammensetzen, falsches Wort finden,
  Bibelstelle zuordnen und den Vers aus dem Gedächtnis schreiben (nur den ersten Buchstaben jedes Wortes tippen).
- **Der Baum wächst von Tag zu Tag:** Die Krone wächst einmal pro Lerntag, nicht mit jeder weiteren Übung am selben Tag.
  Die Wurzeln reichen tiefer, je länger deine Serie ist. Jeder gemeisterte Vers hängt als Frucht am Baum.
  Wenn du heute noch nicht gelernt hast, hat der Baum Durst.
- **Motivation:** tägliche Serie (blaue Flamme), Tagesziel, drei Tagesaufgaben, Perlen, Regenwolken als Serienschutz,
  15 Erfolge, Kombo-Anzeige, Konfetti und Töne.
- **Dauerschleife:** Gelernte Verse ohne Ende wiederholen, bis du auf „Fertig“ tippst. Wähle alle gelernten, nur fällige, nur gemeisterte oder einzelne Verse. Schwächere und zuletzt falsch beantwortete Verse kommen öfter dran. Ab 5 Aufgaben zählt die Runde für Serie und EP (1 EP pro richtiger Antwort, höchstens 60).
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

Bibeltext: Elberfelder Bibel 1905 (unrevidiert, gemeinfrei). Der Gottesname „Jehova“ ist als „HERR“ wiedergegeben, die Rechtschreibung ist angepasst (daß → dass). Die revidierte Elberfelder (1985/2006) ist urheberrechtlich geschützt und deshalb nicht enthalten; eigene Verse in jeder Übersetzung lassen sich in der App selbst hinzufügen.
