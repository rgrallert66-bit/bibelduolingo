/*
 * Verse – Lutherbibel 1912 (gemeinfrei), Rechtschreibung behutsam modernisiert
 * (daß → dass, laß → lass …). Jede Einheit hat fünf Verse.
 */
window.W = window.W || {};

W.UNITS = [
  {
    id: 'u1', title: 'Der erste Same', subtitle: 'Wo alles anfängt',
    color: '#1cb0f6', dark: '#1491cc',
    verses: [
      { id: 'gen1-1', ref: '1. Mose 1,1', text: 'Am Anfang schuf Gott Himmel und Erde.' },
      { id: 'joh1-1', ref: 'Johannes 1,1', text: 'Im Anfang war das Wort, und das Wort war bei Gott, und Gott war das Wort.' },
      { id: 'ps23-1', ref: 'Psalm 23,1', text: 'Der HERR ist mein Hirte; mir wird nichts mangeln.' },
      { id: 'ps119-105', ref: 'Psalm 119,105', text: 'Dein Wort ist meines Fußes Leuchte und ein Licht auf meinem Wege.' },
      { id: 'joh3-16', ref: 'Johannes 3,16', text: 'Also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass alle, die an ihn glauben, nicht verloren werden, sondern das ewige Leben haben.' }
    ]
  },
  {
    id: 'u2', title: 'Vertrauen', subtitle: 'Sich ganz auf Gott verlassen',
    color: '#3b82f6', dark: '#2563c9',
    verses: [
      { id: 'spr3-5', ref: 'Sprüche 3,5', text: 'Verlass dich auf den HERRN von ganzem Herzen, und verlass dich nicht auf deinen Verstand.' },
      { id: 'spr3-6', ref: 'Sprüche 3,6', text: 'Sondern gedenke an ihn in allen deinen Wegen, so wird er dich recht führen.' },
      { id: 'ps37-5', ref: 'Psalm 37,5', text: 'Befiehl dem HERRN deine Wege und hoffe auf ihn; er wird’s wohl machen.' },
      { id: '1petr5-7', ref: '1. Petrus 5,7', text: 'Alle eure Sorge werfet auf ihn; denn er sorgt für euch.' },
      { id: 'roem8-28', ref: 'Römer 8,28', text: 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Besten dienen, denen, die nach dem Vorsatz berufen sind.' }
    ]
  },
  {
    id: 'u3', title: 'Mut & Stärke', subtitle: 'Fürchte dich nicht',
    color: '#2f6bdb', dark: '#2152ad',
    verses: [
      { id: 'phil4-13', ref: 'Philipper 4,13', text: 'Ich vermag alles durch den, der mich mächtig macht, Christus.' },
      { id: '2tim1-7', ref: '2. Timotheus 1,7', text: 'Denn Gott hat uns nicht gegeben den Geist der Furcht, sondern der Kraft und der Liebe und der Zucht.' },
      { id: 'ps27-1', ref: 'Psalm 27,1', text: 'Der HERR ist mein Licht und mein Heil; vor wem sollte ich mich fürchten? Der HERR ist meines Lebens Kraft; vor wem sollte mir grauen?' },
      { id: 'jos1-9', ref: 'Josua 1,9', text: 'Siehe, ich habe dir geboten, dass du getrost und freudig seist. Lass dir nicht grauen und entsetze dich nicht; denn der HERR, dein Gott, ist mit dir in allem, was du tun wirst.' },
      { id: 'jes41-10', ref: 'Jesaja 41,10', text: 'Fürchte dich nicht, ich bin mit dir; weiche nicht, denn ich bin dein Gott; ich stärke dich, ich helfe dir auch, ich erhalte dich durch die rechte Hand meiner Gerechtigkeit.' }
    ]
  },
  {
    id: 'u4', title: 'Liebe', subtitle: 'Die größte unter ihnen',
    color: '#5b6cf0', dark: '#4351c7',
    verses: [
      { id: '1joh4-19', ref: '1. Johannes 4,19', text: 'Lasset uns ihn lieben, denn er hat uns erst geliebt.' },
      { id: '1kor13-13', ref: '1. Korinther 13,13', text: 'Nun aber bleibt Glaube, Hoffnung, Liebe, diese drei; aber die Liebe ist die größte unter ihnen.' },
      { id: 'roem5-8', ref: 'Römer 5,8', text: 'Darum preiset Gott seine Liebe gegen uns, dass Christus für uns gestorben ist, da wir noch Sünder waren.' },
      { id: 'mt22-37', ref: 'Matthäus 22,37', text: 'Du sollst lieben Gott, deinen Herrn, von ganzem Herzen, von ganzer Seele und von ganzem Gemüte.' },
      { id: 'gal5-22', ref: 'Galater 5,22–23', text: 'Die Frucht aber des Geistes ist Liebe, Freude, Friede, Geduld, Freundlichkeit, Gütigkeit, Glaube, Sanftmut, Keuschheit.' }
    ]
  },
  {
    id: 'u5', title: 'Licht', subtitle: 'Das Licht der Welt',
    color: '#06a3c4', dark: '#04829d',
    verses: [
      { id: 'mt5-14', ref: 'Matthäus 5,14', text: 'Ihr seid das Licht der Welt. Es kann die Stadt, die auf einem Berge liegt, nicht verborgen sein.' },
      { id: 'joh14-6', ref: 'Johannes 14,6', text: 'Ich bin der Weg und die Wahrheit und das Leben; niemand kommt zum Vater denn durch mich.' },
      { id: 'ps36-10', ref: 'Psalm 36,10', text: 'Denn bei dir ist die Quelle des Lebens, und in deinem Lichte sehen wir das Licht.' },
      { id: 'jes60-1', ref: 'Jesaja 60,1', text: 'Mache dich auf, werde licht; denn dein Licht kommt, und die Herrlichkeit des HERRN geht auf über dir!' },
      { id: 'joh8-12', ref: 'Johannes 8,12', text: 'Ich bin das Licht der Welt; wer mir nachfolgt, der wird nicht wandeln in der Finsternis, sondern wird das Licht des Lebens haben.' }
    ]
  },
  {
    id: 'u6', title: 'Tief verwurzelt', subtitle: 'Wie ein Baum am Wasser',
    color: '#1b8bb0', dark: '#136c8a',
    verses: [
      { id: 'jer17-7', ref: 'Jeremia 17,7', text: 'Gesegnet aber ist der Mann, der sich auf den HERRN verlässt und des Zuversicht der HERR ist.' },
      { id: 'mt6-33', ref: 'Matthäus 6,33', text: 'Trachtet am ersten nach dem Reich Gottes und nach seiner Gerechtigkeit, so wird euch solches alles zufallen.' },
      { id: 'joh15-5', ref: 'Johannes 15,5', text: 'Ich bin der Weinstock, ihr seid die Reben. Wer in mir bleibt und ich in ihm, der bringt viel Frucht; denn ohne mich könnt ihr nichts tun.' },
      { id: 'kol2-7', ref: 'Kolosser 2,7', text: 'Und seid gewurzelt und erbaut in ihm und seid fest im Glauben, wie ihr gelehrt seid, und seid in demselben reichlich dankbar.' },
      { id: 'ps1-3', ref: 'Psalm 1,3', text: 'Der ist wie ein Baum, gepflanzt an den Wasserbächen, der seine Frucht bringt zu seiner Zeit, und seine Blätter verwelken nicht; und was er macht, das gerät wohl.' }
    ]
  },
  {
    id: 'u7', title: 'Freude & Dank', subtitle: 'Seid allezeit fröhlich',
    color: '#4a9df8', dark: '#2f7fd6',
    verses: [
      { id: 'ps118-24', ref: 'Psalm 118,24', text: 'Dies ist der Tag, den der HERR macht; lasset uns freuen und fröhlich darinnen sein.' },
      { id: 'ps34-9', ref: 'Psalm 34,9', text: 'Schmecket und sehet, wie freundlich der HERR ist. Wohl dem, der auf ihn trauet!' },
      { id: 'ps103-2', ref: 'Psalm 103,2', text: 'Lobe den HERRN, meine Seele, und vergiss nicht, was er dir Gutes getan hat.' },
      { id: 'ps139-14', ref: 'Psalm 139,14', text: 'Ich danke dir darüber, dass ich wunderbar gemacht bin; wunderbar sind deine Werke, und das erkennt meine Seele wohl.' },
      { id: '1thess5-16', ref: '1. Thessalonicher 5,16–18', text: 'Seid allezeit fröhlich, betet ohne Unterlass, seid dankbar in allen Dingen; denn das ist der Wille Gottes in Christo Jesu an euch.' }
    ]
  },
  {
    id: 'u8', title: 'Hoffnung', subtitle: 'Alle Morgen neu',
    color: '#2563eb', dark: '#1a4bbf',
    verses: [
      { id: 'mt28-20', ref: 'Matthäus 28,20', text: 'Und siehe, ich bin bei euch alle Tage bis an der Welt Ende.' },
      { id: 'mt11-28', ref: 'Matthäus 11,28', text: 'Kommet her zu mir alle, die ihr mühselig und beladen seid; ich will euch erquicken.' },
      { id: 'jer29-11', ref: 'Jeremia 29,11', text: 'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides, dass ich euch gebe das Ende, des ihr wartet.' },
      { id: 'klgl3-22', ref: 'Klagelieder 3,22–23', text: 'Die Güte des HERRN ist’s, dass wir nicht gar aus sind; seine Barmherzigkeit hat noch kein Ende, sondern sie ist alle Morgen neu, und deine Treue ist groß.' },
      { id: 'jes40-31', ref: 'Jesaja 40,31', text: 'Aber die auf den HERRN harren, kriegen neue Kraft, dass sie auffahren mit Flügeln wie Adler, dass sie laufen und nicht matt werden, dass sie wandeln und nicht müde werden.' }
    ]
  },
  {
    id: 'u9', title: 'Gnade', subtitle: 'Alles ist neu geworden',
    color: '#0ea5e9', dark: '#0b84bb',
    verses: [
      { id: 'hebr13-8', ref: 'Hebräer 13,8', text: 'Jesus Christus gestern und heute und derselbe auch in Ewigkeit.' },
      { id: 'eph2-8', ref: 'Epheser 2,8', text: 'Denn aus Gnade seid ihr selig geworden durch den Glauben, und dasselbe nicht aus euch, Gottes Gabe ist es.' },
      { id: '2kor5-17', ref: '2. Korinther 5,17', text: 'Darum, ist jemand in Christo, so ist er eine neue Kreatur; das Alte ist vergangen, siehe, es ist alles neu geworden.' },
      { id: 'hebr11-1', ref: 'Hebräer 11,1', text: 'Es ist aber der Glaube eine gewisse Zuversicht des, das man hofft, und ein Nichtzweifeln an dem, das man nicht sieht.' },
      { id: 'mi6-8', ref: 'Micha 6,8', text: 'Es ist dir gesagt, Mensch, was gut ist und was der HERR von dir fordert, nämlich Gottes Wort halten und Liebe üben und demütig sein vor deinem Gott.' }
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
