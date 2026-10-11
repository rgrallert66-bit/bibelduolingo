# Glaubensbaum

Eine Web-App zum Auswendiglernen von Bibelversen, nach dem Vorbild von Duolingo.
Jeden Tag lernst du einen Vers, und dein **Glaubensbaum** wächst mit.

## So funktioniert’s

- **Level für Level:** Der Lernpfad beginnt bei Level 1 und geht immer weiter. Für jedes Level wählst du selbst den Vers:
  aus Vorschlägen (die bekanntesten und schönsten Verse zuerst), über die Suche in der **ganzen Bibel** oder nach Themen.
  Das Auswahlfenster zeigt jeden Vers vollständig.
  Eigene Verse in beliebiger Übersetzung lassen sich ebenfalls wählen. Ein Level ist geschafft, wenn sein Vers sitzt (3 Lektionen: kennenlernen, festigen, meistern);
  danach öffnet sich das nächste Level. Je 5 Level bilden einen Abschnitt mit Schatztruhe (nach 3 Leveln) und gemischter Wiederholung (nach 5 Leveln).
- **Die ganze Bibel durchsuchen:** alle rund 31.000 Verse, nach Wort („Hirte“, „Gnade genügt“) oder nach Stelle („Joh 3,16“, „Psalm 23“, „1. Mose 1,1-3“).
  Bei einer Stelle mit Bereich lässt sich der ganze Abschnitt als ein Lernvers wählen (bis 90 Wörter). Die Bibel wird erst beim ersten Suchen geladen.
- **Lieblingsfarbe:** Blau, Grün, Lila, Gelb oder Rot (Profil → Einstellungen). Die ganze App samt Baum wechselt die Farbe.
- **114 ausgewählte Verse** in 9 Themen (Grundlagen, Vertrauen, Mut, Liebe, Licht & Segen, Tief verwurzelt, Freude, Hoffnung, Gnade), darunter Vaterunser und Aaronitischer Segen.
- **Lernmethode Anfangsbuchstaben:** Zuerst liest du den Vers. Dann fehlen einige Wörter, und du tippst nur den ersten Buchstaben jedes fehlenden Wortes.
  Runde für Runde verschwinden mehr Wörter (25 % → 50 % → 75 %), zuletzt der ganze Vers. Diese letzte Runde wiederholt sich, bis sie ohne einen einzigen Fehler gelingt;
  nach Fehlern siehst du den Vers kurz noch einmal. Ein Vers hat 3 Lektionen: Lektion 1 beginnt bei 25 %, Lektion 2 bei 50 %, Lektion 3 direkt ganz aus dem Gedächtnis.
  Wiederholungen und Dauerschleife nutzen dieselbe Methode.
- **Der Baum wächst von Tag zu Tag:** In den ersten 100 Lerntagen wächst er an jedem Lerntag gleichmäßig ein kleines, sichtbares Stück (danach langsamer weiter), nicht mit jeder weiteren Übung am selben Tag. Höhe und Wurzeltiefe werden realistisch angezeigt (Keimling: 10 cm hoch, 4 cm Wurzeln; nach einem Jahr: etwa 7,6 m hoch, 2,4 m Wurzeln).
  Die Wurzeln reichen tiefer, je länger deine Serie ist. Jeder gemeisterte Vers hängt als Frucht am Baum.
  Wenn du heute noch nicht gelernt hast, hat der Baum Durst.
- **Motivation:** tägliche Serie (blaue Flamme), Tagesziel, drei Tagesaufgaben, Perlen, Regenwolken als Serienschutz,
  15 Erfolge, Konfetti und Töne. Jeder richtige Anfangsbuchstabe in Folge spielt den nächsten Ton einer aufsteigenden Tonleiter (nach jeder Oktave ein Glitzerakkord, bei einem Fehler beginnt sie von vorn); die Wörter schweben beim Aufdecken weich ein.
- **Immer weiter:** Nach jeder Lektion führt „Weiterlernen“ direkt zum nächsten Schritt (nächste Lektion, Verswahl fürs nächste Level oder fälliger Test).
- **Zwischentests:** Nach jedem dritten Level kommt ein Test mit bis zu 3 älteren Versen, ganz aus dem Gedächtnis (schwache und lange nicht geübte zuerst). Erst wenn er fehlerfrei bestanden ist, öffnet sich das nächste Level. Zusätzlich prüft etwa jede dritte Lektion zwischendurch einen älteren Vers.
- **Dauerschleife:** Gelernte Verse ohne Ende wiederholen, bis du auf „Fertig“ tippst. Wähle alle gelernten, nur fällige, nur gemeisterte oder einzelne Verse. Schwächere und zuletzt falsch beantwortete Verse kommen öfter dran. Ab 3 Runden zählt die Dauerschleife für Serie und EP.
- **Wiederholung:** Gelernte Verse werden nach einem Zeitplan (1, 2, 4, 7, 14, 30 Tage) wieder fällig, damit sie dauerhaft sitzen.
- **Töne** werden direkt im Browser erzeugt (Web Audio): warme Glocken- und Kalimba-Klänge in C-Dur mit sanftem Hall. Neue Verse können vorgelesen werden (Sprachausgabe des Geräts).

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
| `js/verses.js` | Einheiten und ausgewählte Verse |
| `js/bible.js` | Suche in der ganzen Bibel (lädt `data/bibel.js` bei Bedarf) |
| `data/bibel.js` | Elberfelder 1905, deutsche Verszählung; erzeugt mit `tools/build-bible.py` |
| `js/theme.js` | Lieblingsfarben: verschiebt alle Blautöne auf die gewählte Farbe |
| `js/store.js` | Spielstand, Serie, Baumwachstum, Wiederholungsplan, Aufgaben, Erfolge |
| `js/tree.js` | Der Baum, gezeichnet auf `<canvas>` |
| `js/exercises.js` | Anfangsbuchstaben-Runden und Ablauf der Lektionen |
| `js/lesson.js` | Lektionsablauf und Abschluss-Bildschirme |
| `js/ui.js` | Bildschirme: Baum, Lernen, Profil, Dialoge; auf dem PC mit Seitenleiste und rechter Spalte |
| `js/sound.js` | Töne und Vorlesen |

Bibeltext: Elberfelder Bibel 1905 (unrevidiert, gemeinfrei). Der Gottesname „Jehova“ ist als „HERR“ wiedergegeben, die Rechtschreibung ist angepasst (daß → dass). Die revidierte Elberfelder (1985/2006) ist urheberrechtlich geschützt und deshalb nicht enthalten; eigene Verse in jeder Übersetzung lassen sich in der App selbst hinzufügen.

Die ganze Bibel für die Suche stammt aus [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases) (`GerElb1905`) und wird mit `python3 -I tools/build-bible.py GerElb1905.json data/bibel.js` umgewandelt: Versnummern nach deutscher Zählung, „Jehova“ → „HERR“ mit passendem Artikel, ß → ss nach kurzem Vokal. Die Umwandlung geschieht nach Regeln; in seltenen Fällen kann eine Formulierung holpern.
