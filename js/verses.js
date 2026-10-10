/*
 * Verse – Elberfelder Bibel 1905 (unrevidiert, gemeinfrei).
 * Angepasst: Gottesname „Jehova“ als „HERR“ wiedergegeben, Rechtschreibung modernisiert
 * (daß → dass, vergiß → vergiss), Psalm-Überschriften weggelassen, Versnummern nach deutscher Zählung.
 * Jede Einheit hat fünf Verse.
 */
window.W = window.W || {};

W.UNITS = [
  {
    id: 'u1', title: 'Der erste Same', subtitle: 'Wo alles anfängt',
    color: '#1cb0f6', dark: '#1491cc',
    verses: [
      { id: 'gen1-1', ref: '1. Mose 1,1', text: 'Im Anfang schuf Gott die Himmel und die Erde.' },
      { id: 'joh1-1', ref: 'Johannes 1,1', text: 'Im Anfang war das Wort, und das Wort war bei Gott, und das Wort war Gott.' },
      { id: 'ps23-1', ref: 'Psalm 23,1', text: 'Der HERR ist mein Hirte, mir wird nichts mangeln.' },
      { id: 'ps119-105', ref: 'Psalm 119,105', text: 'Dein Wort ist Leuchte meinem Fuße und Licht für meinen Pfad.' },
      { id: 'joh3-16', ref: 'Johannes 3,16', text: 'Denn also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass jeder, der an ihn glaubt, nicht verloren gehe, sondern ewiges Leben habe.' }
    ]
  },
  {
    id: 'u2', title: 'Vertrauen', subtitle: 'Sich ganz auf Gott verlassen',
    color: '#3b82f6', dark: '#2563c9',
    verses: [
      { id: 'spr3-5', ref: 'Sprüche 3,5', text: 'Vertraue auf den HERRN mit deinem ganzen Herzen, und stütze dich nicht auf deinen Verstand.' },
      { id: 'spr3-6', ref: 'Sprüche 3,6', text: 'Erkenne ihn auf allen deinen Wegen, und er wird gerade machen deine Pfade.' },
      { id: 'ps37-5', ref: 'Psalm 37,5', text: 'Befiehl dem HERRN deinen Weg und vertraue auf ihn! Und er wird handeln.' },
      { id: '1petr5-7', ref: '1. Petrus 5,7', text: 'Indem ihr alle eure Sorge auf ihn werfet; denn er ist besorgt für euch.' },
      { id: 'roem8-28', ref: 'Römer 8,28', text: 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Guten mitwirken, denen, die nach Vorsatz berufen sind.' }
    ]
  },
  {
    id: 'u3', title: 'Mut & Stärke', subtitle: 'Fürchte dich nicht',
    color: '#2f6bdb', dark: '#2152ad',
    verses: [
      { id: 'phil4-13', ref: 'Philipper 4,13', text: 'Alles vermag ich in dem, der mich kräftigt.' },
      { id: '2tim1-7', ref: '2. Timotheus 1,7', text: 'Denn Gott hat uns nicht einen Geist der Furchtsamkeit gegeben, sondern der Kraft und der Liebe und der Besonnenheit.' },
      { id: 'ps27-1', ref: 'Psalm 27,1', text: 'Der HERR ist mein Licht und mein Heil, vor wem sollte ich mich fürchten? Der HERR ist meines Lebens Stärke, vor wem sollte ich erschrecken?' },
      { id: 'jos1-9', ref: 'Josua 1,9', text: 'Habe ich dir nicht geboten: Sei stark und mutig? Erschrick nicht und fürchte dich nicht! Denn der HERR, dein Gott, ist mit dir überall, wohin du gehst.' },
      { id: 'jes41-10', ref: 'Jesaja 41,10', text: 'Fürchte dich nicht, denn ich bin mit dir; schaue nicht ängstlich umher, denn ich bin dein Gott; ich stärke dich, ja, ich helfe dir, ja, ich stütze dich mit der Rechten meiner Gerechtigkeit.' }
    ]
  },
  {
    id: 'u4', title: 'Liebe', subtitle: 'Die größte unter ihnen',
    color: '#5b6cf0', dark: '#4351c7',
    verses: [
      { id: '1joh4-19', ref: '1. Johannes 4,19', text: 'Wir lieben, weil er uns zuerst geliebt hat.' },
      { id: '1kor13-13', ref: '1. Korinther 13,13', text: 'Nun aber bleibt Glaube, Hoffnung, Liebe, diese drei; die größte aber von diesen ist die Liebe.' },
      { id: 'roem5-8', ref: 'Römer 5,8', text: 'Gott aber erweist seine Liebe gegen uns darin, dass Christus, da wir noch Sünder waren, für uns gestorben ist.' },
      { id: 'mt22-37', ref: 'Matthäus 22,37', text: 'Du sollst den Herrn, deinen Gott, lieben mit deinem ganzen Herzen und mit deiner ganzen Seele und mit deinem ganzen Verstande.' },
      { id: 'gal5-22', ref: 'Galater 5,22–23', text: 'Die Frucht des Geistes aber ist: Liebe, Freude, Friede, Langmut, Freundlichkeit, Gütigkeit, Treue, Sanftmut, Enthaltsamkeit.' }
    ]
  },
  {
    id: 'u5', title: 'Licht', subtitle: 'Das Licht der Welt',
    color: '#06a3c4', dark: '#04829d',
    verses: [
      { id: 'mt5-14', ref: 'Matthäus 5,14', text: 'Ihr seid das Licht der Welt; eine Stadt, die oben auf einem Berge liegt, kann nicht verborgen sein.' },
      { id: 'joh14-6', ref: 'Johannes 14,6', text: 'Ich bin der Weg und die Wahrheit und das Leben. Niemand kommt zum Vater, als nur durch mich.' },
      { id: 'ps36-10', ref: 'Psalm 36,10', text: 'Denn bei dir ist der Quell des Lebens, in deinem Lichte werden wir das Licht sehen.' },
      { id: 'jes60-1', ref: 'Jesaja 60,1', text: 'Stehe auf, leuchte! Denn dein Licht ist gekommen, und die Herrlichkeit des HERRN ist über dir aufgegangen.' },
      { id: 'joh8-12', ref: 'Johannes 8,12', text: 'Ich bin das Licht der Welt; wer mir nachfolgt, wird nicht in der Finsternis wandeln, sondern wird das Licht des Lebens haben.' }
    ]
  },
  {
    id: 'u6', title: 'Tief verwurzelt', subtitle: 'Wie ein Baum am Wasser',
    color: '#1b8bb0', dark: '#136c8a',
    verses: [
      { id: 'jer17-7', ref: 'Jeremia 17,7', text: 'Gesegnet ist der Mann, der auf den HERRN vertraut und dessen Vertrauen der HERR ist!' },
      { id: 'mt6-33', ref: 'Matthäus 6,33', text: 'Trachtet aber zuerst nach dem Reiche Gottes und nach seiner Gerechtigkeit, und dies alles wird euch hinzugefügt werden.' },
      { id: 'joh15-5', ref: 'Johannes 15,5', text: 'Ich bin der Weinstock, ihr seid die Reben. Wer in mir bleibt und ich in ihm, dieser bringt viel Frucht, denn außer mir könnt ihr nichts tun.' },
      { id: 'kol2-7', ref: 'Kolosser 2,7', text: 'Gewurzelt und auferbaut in ihm und befestigt in dem Glauben, so wie ihr gelehrt worden seid, überströmend in demselben mit Danksagung.' },
      { id: 'ps1-3', ref: 'Psalm 1,3', text: 'Und er ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit, und dessen Blatt nicht verwelkt; und alles, was er tut, gelingt.' }
    ]
  },
  {
    id: 'u7', title: 'Freude & Dank', subtitle: 'Seid allezeit fröhlich',
    color: '#4a9df8', dark: '#2f7fd6',
    verses: [
      { id: 'ps118-24', ref: 'Psalm 118,24', text: 'Dies ist der Tag, den der HERR gemacht hat; frohlocken wir und freuen wir uns in ihm.' },
      { id: 'ps34-9', ref: 'Psalm 34,9', text: 'Schmecket und sehet, dass der HERR gütig ist! Glückselig der Mann, der auf ihn traut!' },
      { id: 'ps103-2', ref: 'Psalm 103,2', text: 'Preise den HERRN, meine Seele, und vergiss nicht alle seine Wohltaten!' },
      { id: 'ps139-14', ref: 'Psalm 139,14', text: 'Ich preise dich darüber, dass ich auf eine erstaunliche, ausgezeichnete Weise gemacht bin. Wunderbar sind deine Werke, und meine Seele weiß es sehr wohl.' },
      { id: '1thess5-16', ref: '1. Thessalonicher 5,16–18', text: 'Freuet euch allezeit; betet unablässig; danksaget in allem, denn dieses ist der Wille Gottes in Christo Jesu gegen euch.' }
    ]
  },
  {
    id: 'u8', title: 'Hoffnung', subtitle: 'Alle Morgen neu',
    color: '#2563eb', dark: '#1a4bbf',
    verses: [
      { id: 'mt28-20', ref: 'Matthäus 28,20', text: 'Und siehe, ich bin bei euch alle Tage bis zur Vollendung des Zeitalters.' },
      { id: 'mt11-28', ref: 'Matthäus 11,28', text: 'Kommet her zu mir, alle ihr Mühseligen und Beladenen, und ich werde euch Ruhe geben.' },
      { id: 'jer29-11', ref: 'Jeremia 29,11', text: 'Denn ich weiß ja die Gedanken, die ich über euch denke, spricht der HERR, Gedanken des Friedens und nicht zum Unglück, um euch Ausgang und Hoffnung zu gewähren.' },
      { id: 'klgl3-22', ref: 'Klagelieder 3,22–23', text: 'Es sind die Gütigkeiten des HERRN, dass wir nicht aufgerieben sind; denn seine Erbarmungen sind nicht zu Ende; sie sind alle Morgen neu, deine Treue ist groß.' },
      { id: 'jes40-31', ref: 'Jesaja 40,31', text: 'Aber die auf den HERRN harren, gewinnen neue Kraft: sie heben die Schwingen empor wie die Adler; sie laufen und ermatten nicht, sie gehen und ermüden nicht.' }
    ]
  },
  {
    id: 'u9', title: 'Gnade', subtitle: 'Alles ist neu geworden',
    color: '#0ea5e9', dark: '#0b84bb',
    verses: [
      { id: 'hebr13-8', ref: 'Hebräer 13,8', text: 'Jesus Christus ist derselbe gestern und heute und in Ewigkeit.' },
      { id: 'eph2-8', ref: 'Epheser 2,8', text: 'Denn durch die Gnade seid ihr errettet, mittelst des Glaubens; und das nicht aus euch, Gottes Gabe ist es.' },
      { id: '2kor5-17', ref: '2. Korinther 5,17', text: 'Daher, wenn jemand in Christo ist, da ist eine neue Schöpfung; das Alte ist vergangen, siehe, alles ist neu geworden.' },
      { id: 'hebr11-1', ref: 'Hebräer 11,1', text: 'Der Glaube aber ist eine Verwirklichung dessen, was man hofft, eine Überzeugung von Dingen, die man nicht sieht.' },
      { id: 'mi6-8', ref: 'Micha 6,8', text: 'Er hat dir kundgetan, o Mensch, was gut ist; und was fordert der HERR von dir, als Recht zu üben und Güte zu lieben, und demütig zu wandeln mit deinem Gott?' }
    ]
  }
];

// Schneller Zugriff: id → Vers (mit Einheit)
W.VERSES = {};
W.VERSE_LIST = [];
W.UNITS.forEach((u, ui) => u.verses.forEach((v, vi) => {
  v.unit = u.id; v.unitIndex = ui; v.index = vi;
  W.VERSES[v.id] = v;
  W.VERSE_LIST.push(v);
}));
