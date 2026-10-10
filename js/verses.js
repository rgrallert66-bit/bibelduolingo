/*
 * Verse – Elberfelder Bibel 1905 (unrevidiert, gemeinfrei), wörtlich übernommen.
 * Angepasst: Gottesname „Jehova“ als „HERR“ wiedergegeben, Rechtschreibung modernisiert
 * (daß → dass, vergiß → vergiss), Psalm-Überschriften weggelassen, Versnummern nach deutscher Zählung.
 * Bei langen Versen steht nur der bekannte Kern (z. B. Jesaja 43,1; 2. Korinther 12,9).
 * Die Verse sind nach Themen sortiert; W.TOP ist die Reihenfolge der Vorschläge
 * (die bekanntesten und schönsten Verse zuerst).
 */
window.W = window.W || {};

W.UNITS = [
  {
    id: 'u1', title: 'Der erste Same', subtitle: 'Die Grundlagen des Glaubens',
    color: '#1cb0f6', dark: '#1491cc',
    verses: [
      { id: 'gen1-1', ref: '1. Mose 1,1', text: 'Im Anfang schuf Gott die Himmel und die Erde.' },
      { id: 'joh1-1', ref: 'Johannes 1,1', text: 'Im Anfang war das Wort, und das Wort war bei Gott, und das Wort war Gott.' },
      { id: 'ps23-1', ref: 'Psalm 23,1', text: 'Der HERR ist mein Hirte, mir wird nichts mangeln.' },
      { id: 'ps119-105', ref: 'Psalm 119,105', text: 'Dein Wort ist Leuchte meinem Fuße und Licht für meinen Pfad.' },
      { id: 'joh3-16', ref: 'Johannes 3,16', text: 'Denn also hat Gott die Welt geliebt, dass er seinen eingeborenen Sohn gab, auf dass jeder, der an ihn glaubt, nicht verloren gehe, sondern ewiges Leben habe.' },
      { id: 'joh1-14', ref: 'Johannes 1,14', text: 'Und das Wort ward Fleisch und wohnte unter uns (und wir haben seine Herrlichkeit angeschaut, eine Herrlichkeit als eines Eingeborenen vom Vater), voller Gnade und Wahrheit.' },
      { id: 'gen1-27', ref: '1. Mose 1,27', text: 'Und Gott schuf den Menschen in seinem Bilde, im Bilde Gottes schuf er ihn; Mann und Weib schuf er sie.' },
      { id: 'joh10-11', ref: 'Johannes 10,11', text: 'Ich bin der gute Hirte; der gute Hirte lässt sein Leben für die Schafe.' },
      { id: 'joh11-25', ref: 'Johannes 11,25', text: 'Ich bin die Auferstehung und das Leben; wer an mich glaubt, wird leben, auch wenn er gestorben ist.' },
      { id: 'apg4-12', ref: 'Apostelgeschichte 4,12', text: 'Und es ist in keinem anderen das Heil, denn auch kein anderer Name ist unter dem Himmel, der unter den Menschen gegeben ist, in welchem wir errettet werden müssen.' },
      { id: 'roem10-9', ref: 'Römer 10,9', text: 'Wenn du mit deinem Munde Jesum als Herrn bekennen und in deinem Herzen glauben wirst, dass Gott ihn aus den Toten auferweckt hat, du errettet werden wirst.' },
      { id: 'offb3-20', ref: 'Offenbarung 3,20', text: 'Siehe, ich stehe an der Tür und klopfe an; wenn jemand meine Stimme hört und die Tür auftut, zu dem werde ich eingehen und das Abendbrot mit ihm essen, und er mit mir.' },
      { id: 'mt6-9', ref: 'Matthäus 6,9–13', text: 'Unser Vater, der du bist in den Himmeln, geheiligt werde dein Name; dein Reich komme; dein Wille geschehe, wie im Himmel also auch auf Erden. Unser nötiges Brot gib uns heute; und vergib uns unsere Schulden, wie auch wir unseren Schuldnern vergeben; und führe uns nicht in Versuchung, sondern errette uns von dem Bösen.' }
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
      { id: 'roem8-28', ref: 'Römer 8,28', text: 'Wir wissen aber, dass denen, die Gott lieben, alle Dinge zum Guten mitwirken, denen, die nach Vorsatz berufen sind.' },
      { id: 'ps37-4', ref: 'Psalm 37,4', text: 'Und ergötze dich an dem HERRN: so wird er dir geben die Bitten deines Herzens.' },
      { id: 'ps46-2', ref: 'Psalm 46,2', text: 'Gott ist uns Zuflucht und Stärke, eine Hilfe, reichlich gefunden in Drangsalen.' },
      { id: 'ps62-2', ref: 'Psalm 62,2', text: 'Nur auf Gott vertraut still meine Seele, von ihm kommt meine Rettung.' },
      { id: 'jes26-3', ref: 'Jesaja 26,3', text: 'Den festen Sinn bewahrst du in Frieden, in Frieden; denn er vertraut auf dich.' },
      { id: 'phil4-6', ref: 'Philipper 4,6', text: 'Seid um nichts besorgt, sondern in allem lasset durch Gebet und Flehen mit Danksagung eure Anliegen vor Gott kundwerden.' },
      { id: 'phil4-7', ref: 'Philipper 4,7', text: 'Und der Friede Gottes, der allen Verstand übersteigt, wird eure Herzen und euren Sinn bewahren in Christo Jesu.' },
      { id: 'mt6-34', ref: 'Matthäus 6,34', text: 'So seid nun nicht besorgt auf den morgenden Tag, denn der morgende Tag wird für sich selbst sorgen. Jeder Tag hat an seinem Übel genug.' },
      { id: 'ps56-4', ref: 'Psalm 56,4', text: 'An dem Tage, da ich mich fürchte, vertraue ich auf dich.' }
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
      { id: 'jes41-10', ref: 'Jesaja 41,10', text: 'Fürchte dich nicht, denn ich bin mit dir; schaue nicht ängstlich umher, denn ich bin dein Gott; ich stärke dich, ja, ich helfe dir, ja, ich stütze dich mit der Rechten meiner Gerechtigkeit.' },
      { id: '5mo31-6', ref: '5. Mose 31,6', text: 'Seid stark und mutig, fürchtet euch nicht und erschrecket nicht vor ihnen! Denn der HERR, dein Gott, er ist es, der mit dir geht; er wird dich nicht versäumen und dich nicht verlassen.' },
      { id: 'ps121-1', ref: 'Psalm 121,1–2', text: 'Ich hebe meine Augen auf zu den Bergen, woher meine Hilfe kommen wird. Meine Hilfe kommt von dem HERRN, der Himmel und Erde gemacht hat.' },
      { id: 'jes43-1', ref: 'Jesaja 43,1', text: 'Fürchte dich nicht, denn ich habe dich erlöst; ich habe dich bei deinem Namen gerufen, du bist mein.' },
      { id: 'roem8-31', ref: 'Römer 8,31', text: 'Was sollen wir nun hierzu sagen? Wenn Gott für uns ist, wer wider uns?' },
      { id: '2kor12-9', ref: '2. Korinther 12,9', text: 'Meine Gnade genügt dir, denn meine Kraft wird in Schwachheit vollbracht.' },
      { id: 'ps91-1', ref: 'Psalm 91,1–2', text: 'Wer im Schirm des Höchsten sitzt, wird bleiben im Schatten des Allmächtigen. Ich sage von dem HERRN: Meine Zuflucht und meine Burg; mein Gott, auf ihn will ich vertrauen.' },
      { id: 'roem8-37', ref: 'Römer 8,37', text: 'Aber in diesem allen sind wir mehr als Überwinder durch den, der uns geliebt hat.' }
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
      { id: 'gal5-22', ref: 'Galater 5,22–23', text: 'Die Frucht des Geistes aber ist: Liebe, Freude, Friede, Langmut, Freundlichkeit, Gütigkeit, Treue, Sanftmut, Enthaltsamkeit.' },
      { id: '1kor13-4', ref: '1. Korinther 13,4', text: 'Die Liebe ist langmütig, ist gütig; die Liebe neidet nicht; die Liebe tut nicht groß, sie bläht sich nicht auf.' },
      { id: '1joh4-16', ref: '1. Johannes 4,16', text: 'Gott ist Liebe, und wer in der Liebe bleibt, bleibt in Gott und Gott in ihm.' },
      { id: 'joh13-34', ref: 'Johannes 13,34', text: 'Ein neues Gebot gebe ich euch, dass ihr einander liebet, auf dass, gleichwie ich euch geliebt habe, auch ihr einander liebet.' },
      { id: 'joh15-13', ref: 'Johannes 15,13', text: 'Größere Liebe hat niemand, als diese, dass jemand sein Leben lässt für seine Freunde.' },
      { id: 'roem8-38', ref: 'Römer 8,38–39', text: 'Denn ich bin überzeugt, dass weder Tod noch Leben, weder Engel noch Fürstentümer, weder Gegenwärtiges noch Zukünftiges, noch Gewalten, weder Höhe noch Tiefe, noch irgend ein anderes Geschöpf uns zu scheiden vermögen wird von der Liebe Gottes, die in Christo Jesu ist, unserem Herrn.' },
      { id: 'jer31-3', ref: 'Jeremia 31,3', text: 'Ja, mit ewiger Liebe habe ich dich geliebt; darum habe ich dir fortdauern lassen meine Güte.' },
      { id: 'mt22-39', ref: 'Matthäus 22,39', text: 'Du sollst deinen Nächsten lieben wie dich selbst.' },
      { id: '1petr4-8', ref: '1. Petrus 4,8', text: 'Vor allen Dingen aber habt untereinander eine inbrünstige Liebe, denn die Liebe bedeckt eine Menge von Sünden.' }
    ]
  },
  {
    id: 'u5', title: 'Licht & Segen', subtitle: 'Das Licht der Welt',
    color: '#06a3c4', dark: '#04829d',
    verses: [
      { id: 'mt5-14', ref: 'Matthäus 5,14', text: 'Ihr seid das Licht der Welt; eine Stadt, die oben auf einem Berge liegt, kann nicht verborgen sein.' },
      { id: 'joh14-6', ref: 'Johannes 14,6', text: 'Ich bin der Weg und die Wahrheit und das Leben. Niemand kommt zum Vater, als nur durch mich.' },
      { id: 'ps36-10', ref: 'Psalm 36,10', text: 'Denn bei dir ist der Quell des Lebens, in deinem Lichte werden wir das Licht sehen.' },
      { id: 'jes60-1', ref: 'Jesaja 60,1', text: 'Stehe auf, leuchte! Denn dein Licht ist gekommen, und die Herrlichkeit des HERRN ist über dir aufgegangen.' },
      { id: 'joh8-12', ref: 'Johannes 8,12', text: 'Ich bin das Licht der Welt; wer mir nachfolgt, wird nicht in der Finsternis wandeln, sondern wird das Licht des Lebens haben.' },
      { id: 'mt5-16', ref: 'Matthäus 5,16', text: 'Also lasset euer Licht leuchten vor den Menschen, damit sie eure guten Werke sehen und euren Vater, der in den Himmeln ist, verherrlichen.' },
      { id: 'joh1-5', ref: 'Johannes 1,5', text: 'Und das Licht scheint in der Finsternis, und die Finsternis hat es nicht erfasst.' },
      { id: '4mo6-24', ref: '4. Mose 6,24–26', text: 'Der HERR segne dich und behüte dich! Der HERR lasse sein Angesicht über dir leuchten und sei dir gnädig! Der HERR erhebe sein Angesicht auf dich und gebe dir Frieden!' },
      { id: 'jes9-1', ref: 'Jesaja 9,1', text: 'Das Volk, das im Finstern wandelt, hat ein großes Licht gesehen; die da wohnen im Lande des Todesschattens, Licht hat über sie geleuchtet.' },
      { id: 'jes9-5', ref: 'Jesaja 9,5', text: 'Denn ein Kind ist uns geboren, ein Sohn uns gegeben, und die Herrschaft ruht auf seiner Schulter; und man nennt seinen Namen: Wunderbarer, Berater, starker Gott, Vater der Ewigkeit, Friedefürst.' },
      { id: 'mt5-8', ref: 'Matthäus 5,8', text: 'Glückselig die reinen Herzens sind, denn sie werden Gott schauen.' },
      { id: 'ps18-29', ref: 'Psalm 18,29', text: 'Denn du, du machst meine Leuchte scheinen; der HERR, mein Gott, erhellt meine Finsternis.' }
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
      { id: 'ps1-3', ref: 'Psalm 1,3', text: 'Und er ist wie ein Baum, gepflanzt an Wasserbächen, der seine Frucht bringt zu seiner Zeit, und dessen Blatt nicht verwelkt; und alles, was er tut, gelingt.' },
      { id: 'jer17-8', ref: 'Jeremia 17,8', text: 'Und er wird sein wie ein Baum, der am Wasser gepflanzt ist und am Bache seine Wurzeln ausstreckt, und sich nicht fürchtet, wenn die Hitze kommt; und sein Laub ist grün, und im Jahre der Dürre ist er unbekümmert, und er hört nicht auf, Frucht zu tragen.' },
      { id: 'ps1-2', ref: 'Psalm 1,2', text: 'Sondern seine Lust hat am Gesetz des HERRN und über sein Gesetz sinnt Tag und Nacht!' },
      { id: 'eph3-17', ref: 'Epheser 3,17', text: 'Dass der Christus durch den Glauben in euren Herzen wohne, indem ihr in Liebe gewurzelt und gegründet seid.' },
      { id: 'jos1-8', ref: 'Josua 1,8', text: 'Dieses Buch des Gesetzes soll nicht von deinem Munde weichen, und du sollst darüber sinnen Tag und Nacht, auf dass du darauf achtest, zu tun nach allem, was darin geschrieben ist; denn alsdann wirst du auf deinem Wege Erfolg haben, und alsdann wird es dir gelingen.' },
      { id: 'mt7-24', ref: 'Matthäus 7,24', text: 'Jeder nun, der irgend diese meine Worte hört und sie tut, den werde ich einem klugen Manne vergleichen, der sein Haus auf den Felsen baute.' },
      { id: '2tim3-16', ref: '2. Timotheus 3,16', text: 'Alle Schrift ist von Gott eingegeben und nütze zur Lehre, zur Überführung, zur Zurechtweisung, zur Unterweisung in der Gerechtigkeit.' },
      { id: 'hebr4-12', ref: 'Hebräer 4,12', text: 'Denn das Wort Gottes ist lebendig und wirksam und schärfer als jedes zweischneidige Schwert, und durchdringend bis zur Scheidung von Seele und Geist, sowohl der Gelenke als auch des Markes, und ein Beurteiler der Gedanken und Gesinnungen des Herzens.' },
      { id: 'ps119-11', ref: 'Psalm 119,11', text: 'In meinem Herzen habe ich dein Wort verwahrt, auf dass ich nicht wider dich sündige.' },
      { id: 'roem12-2', ref: 'Römer 12,2', text: 'Und seid nicht gleichförmig dieser Welt, sondern werdet verwandelt durch die Erneuerung eures Sinnes, dass ihr prüfen möget, was der gute und wohlgefällige und vollkommene Wille Gottes ist.' }
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
      { id: '1thess5-16', ref: '1. Thessalonicher 5,16–18', text: 'Freuet euch allezeit; betet unablässig; danksaget in allem, denn dieses ist der Wille Gottes in Christo Jesu gegen euch.' },
      { id: 'phil4-4', ref: 'Philipper 4,4', text: 'Freuet euch in dem Herrn allezeit! Wiederum will ich sagen: Freuet euch!' },
      { id: 'ps100-4', ref: 'Psalm 100,4', text: 'Kommet in seine Tore mit Lob, in seine Vorhöfe mit Lobgesang! Lobet ihn, preiset seinen Namen!' },
      { id: 'neh8-10', ref: 'Nehemia 8,10', text: 'Betrübet euch nicht, denn die Freude an dem HERRN ist eure Stärke.' },
      { id: 'ps16-11', ref: 'Psalm 16,11', text: 'Du wirst mir kundtun den Weg des Lebens; Fülle von Freuden ist vor deinem Angesicht, Lieblichkeiten in deiner Rechten immerdar.' },
      { id: 'ps103-1', ref: 'Psalm 103,1', text: 'Preise den HERRN, meine Seele, und all mein Inneres seinen heiligen Namen!' },
      { id: 'ps150-6', ref: 'Psalm 150,6', text: 'Alles, was Odem hat, lobe den HERRN! Lobet den HERRN!' },
      { id: 'pred3-1', ref: 'Prediger 3,1', text: 'Alles hat eine bestimmte Zeit, und jedes Vornehmen unter dem Himmel hat seine Zeit.' }
    ]
  },
  {
    id: 'u8', title: 'Hoffnung & Frieden', subtitle: 'Alle Morgen neu',
    color: '#2563eb', dark: '#1a4bbf',
    verses: [
      { id: 'mt28-20', ref: 'Matthäus 28,20', text: 'Und siehe, ich bin bei euch alle Tage bis zur Vollendung des Zeitalters.' },
      { id: 'mt11-28', ref: 'Matthäus 11,28', text: 'Kommet her zu mir, alle ihr Mühseligen und Beladenen, und ich werde euch Ruhe geben.' },
      { id: 'jer29-11', ref: 'Jeremia 29,11', text: 'Denn ich weiß ja die Gedanken, die ich über euch denke, spricht der HERR, Gedanken des Friedens und nicht zum Unglück, um euch Ausgang und Hoffnung zu gewähren.' },
      { id: 'klgl3-22', ref: 'Klagelieder 3,22–23', text: 'Es sind die Gütigkeiten des HERRN, dass wir nicht aufgerieben sind; denn seine Erbarmungen sind nicht zu Ende; sie sind alle Morgen neu, deine Treue ist groß.' },
      { id: 'jes40-31', ref: 'Jesaja 40,31', text: 'Aber die auf den HERRN harren, gewinnen neue Kraft: sie heben die Schwingen empor wie die Adler; sie laufen und ermatten nicht, sie gehen und ermüden nicht.' },
      { id: 'offb21-4', ref: 'Offenbarung 21,4', text: 'Und er wird jede Träne von ihren Augen abwischen, und der Tod wird nicht mehr sein, noch Trauer, noch Geschrei, noch Schmerz wird mehr sein; denn das Erste ist vergangen.' },
      { id: 'roem15-13', ref: 'Römer 15,13', text: 'Der Gott der Hoffnung aber erfülle euch mit aller Freude und allem Frieden im Glauben, damit ihr überreich seiet in der Hoffnung durch die Kraft des Heiligen Geistes.' },
      { id: 'joh14-1', ref: 'Johannes 14,1', text: 'Euer Herz werde nicht bestürzt. Ihr glaubet an Gott, glaubet auch an mich.' },
      { id: 'joh14-27', ref: 'Johannes 14,27', text: 'Frieden lasse ich euch, meinen Frieden gebe ich euch; nicht wie die Welt gibt, gebe ich euch. Euer Herz werde nicht bestürzt, sei auch nicht furchtsam.' },
      { id: 'roem12-12', ref: 'Römer 12,12', text: 'In Hoffnung freuet euch; in Trübsal harret aus; im Gebet haltet an.' },
      { id: 'joh16-33', ref: 'Johannes 16,33', text: 'In der Welt habt ihr Drangsal; aber seid gutes Mutes, ich habe die Welt überwunden.' },
      { id: 'ps42-12', ref: 'Psalm 42,12', text: 'Was beugst du dich nieder, meine Seele, und was bist du unruhig in mir? Harre auf Gott! Denn ich werde ihn noch preisen, der das Heil meines Angesichts und mein Gott ist.' }
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
      { id: 'mi6-8', ref: 'Micha 6,8', text: 'Er hat dir kundgetan, o Mensch, was gut ist; und was fordert der HERR von dir, als Recht zu üben und Güte zu lieben, und demütig zu wandeln mit deinem Gott?' },
      { id: 'roem3-23', ref: 'Römer 3,23–24', text: 'Denn alle haben gesündigt und erreichen nicht die Herrlichkeit Gottes, und werden umsonst gerechtfertigt durch seine Gnade, durch die Erlösung, die in Christo Jesu ist.' },
      { id: 'roem6-23', ref: 'Römer 6,23', text: 'Denn der Lohn der Sünde ist der Tod, die Gnadengabe Gottes aber ewiges Leben in Christo Jesu, unserem Herrn.' },
      { id: '1joh1-9', ref: '1. Johannes 1,9', text: 'Wenn wir unsere Sünden bekennen, so ist er treu und gerecht, dass er uns die Sünden vergibt und uns reinigt von aller Ungerechtigkeit.' },
      { id: 'eph2-10', ref: 'Epheser 2,10', text: 'Denn wir sind sein Werk, geschaffen in Christo Jesu zu guten Werken, welche Gott zuvor bereitet hat, auf dass wir in ihnen wandeln sollen.' },
      { id: 'ps51-12', ref: 'Psalm 51,12', text: 'Schaffe mir, Gott, ein reines Herz, und erneuere in meinem Innern einen festen Geist!' },
      { id: 'jes53-5', ref: 'Jesaja 53,5', text: 'Doch um unserer Übertretungen willen war er verwundet, um unserer Missetaten willen zerschlagen. Die Strafe zu unserem Frieden lag auf ihm, und durch seine Striemen ist uns Heilung geworden.' },
      { id: 'gal2-20', ref: 'Galater 2,20', text: 'Ich bin mit Christo gekreuzigt, und nicht mehr lebe ich, sondern Christus lebt in mir; was ich aber jetzt lebe im Fleische, lebe ich durch Glauben, durch den an den Sohn Gottes, der mich geliebt und sich selbst für mich hingegeben hat.' },
      { id: 'ps32-8', ref: 'Psalm 32,8', text: 'Ich will dich unterweisen und dich lehren den Weg, den du wandeln sollst; mein Auge auf dich richtend, will ich dir raten.' }
    ]
  }
];

W.TOP = ['joh3-16', 'ps23-1', 'phil4-13', 'jer29-11', 'jes41-10', '4mo6-24', 'mt6-9', 'ps121-1', '1kor13-13', 'roem8-28', 'spr3-5', 'jes40-31', 'mt11-28', 'mt28-20', 'joh14-6', '1kor13-4', 'ps46-2', 'jes43-1', 'jos1-9', '2tim1-7', 'ps119-105', 'gen1-1', 'joh1-1', 'mt6-33', 'roem8-38', '1petr5-7', 'phil4-6', 'klgl3-22', 'joh11-25', 'jes9-5', 'ps91-1', 'ps37-5', 'joh15-5', 'ps139-14', 'offb21-4', '2kor12-9', 'roem12-12', 'joh8-12', 'ps27-1', 'roem6-23', 'eph2-8', 'ps1-3', 'mt5-14', 'joh14-27', 'joh16-33', 'gal5-22', '1joh4-19', 'roem5-8', 'hebr11-1', 'roem12-2', 'phil4-7', 'ps51-12', 'jes53-5', '1joh1-9', 'mt5-16', 'ps103-2', 'ps118-24', 'phil4-4', 'hebr13-8', '2kor5-17'];

// Schneller Zugriff: id → Vers (mit Thema)
W.VERSES = {};
W.VERSE_LIST = [];
W.UNITS.forEach((u, ui) => u.verses.forEach((v, vi) => {
  v.unit = u.id; v.unitIndex = ui; v.index = vi;
  W.VERSES[v.id] = v;
  W.VERSE_LIST.push(v);
}));
