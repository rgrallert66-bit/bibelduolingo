"""
Baut data/bibel.js: die ganze Elberfelder Bibel 1905 (gemeinfrei) für die Suche in der App.

Quelle: scrollmapper/bible_databases, formats/json/GerElb1905.json (Versnummern nach englischer Zählung).
Aufruf:  python3 -I tools/build-bible.py GerElb1905.json data/bibel.js

Angepasst wie bei den ausgewählten Versen der App:
- Versnummern nach deutscher Zählung (Psalm-Überschriften als eigener Vers, abweichende Kapitelgrenzen)
- Gottesname „Jehova“/„Jah“ als „HERR“ mit passendem Artikel („der HERR“, „dem HERRN“, „des HERRN“ …)
- Rechtschreibung: „daß“ → „dass“ und andere ß nach kurzem Vokal → ss
"""
import json
import re
import sys

BOOKS = [
    ('Genesis', '1. Mose'), ('Exodus', '2. Mose'), ('Leviticus', '3. Mose'), ('Numbers', '4. Mose'), ('Deuteronomy', '5. Mose'),
    ('Joshua', 'Josua'), ('Judges', 'Richter'), ('Ruth', 'Ruth'), ('I Samuel', '1. Samuel'), ('II Samuel', '2. Samuel'),
    ('I Kings', '1. Könige'), ('II Kings', '2. Könige'), ('I Chronicles', '1. Chronika'), ('II Chronicles', '2. Chronika'),
    ('Ezra', 'Esra'), ('Nehemiah', 'Nehemia'), ('Esther', 'Esther'), ('Job', 'Hiob'), ('Psalms', 'Psalm'), ('Proverbs', 'Sprüche'),
    ('Ecclesiastes', 'Prediger'), ('Song of Solomon', 'Hohelied'), ('Isaiah', 'Jesaja'), ('Jeremiah', 'Jeremia'),
    ('Lamentations', 'Klagelieder'), ('Ezekiel', 'Hesekiel'), ('Daniel', 'Daniel'), ('Hosea', 'Hosea'), ('Joel', 'Joel'),
    ('Amos', 'Amos'), ('Obadiah', 'Obadja'), ('Jonah', 'Jona'), ('Micah', 'Micha'), ('Nahum', 'Nahum'), ('Habakkuk', 'Habakuk'),
    ('Zephaniah', 'Zephanja'), ('Haggai', 'Haggai'), ('Zechariah', 'Sacharja'), ('Malachi', 'Maleachi'),
    ('Matthew', 'Matthäus'), ('Mark', 'Markus'), ('Luke', 'Lukas'), ('John', 'Johannes'), ('Acts', 'Apostelgeschichte'),
    ('Romans', 'Römer'), ('I Corinthians', '1. Korinther'), ('II Corinthians', '2. Korinther'), ('Galatians', 'Galater'),
    ('Ephesians', 'Epheser'), ('Philippians', 'Philipper'), ('Colossians', 'Kolosser'), ('I Thessalonians', '1. Thessalonicher'),
    ('II Thessalonians', '2. Thessalonicher'), ('I Timothy', '1. Timotheus'), ('II Timothy', '2. Timotheus'), ('Titus', 'Titus'),
    ('Philemon', 'Philemon'), ('Hebrews', 'Hebräer'), ('James', 'Jakobus'), ('I Peter', '1. Petrus'), ('II Peter', '2. Petrus'),
    ('I John', '1. Johannes'), ('II John', '2. Johannes'), ('III John', '3. Johannes'), ('Jude', 'Judas'), ('Revelation of John', 'Offenbarung'),
]

# ---------- Versnummern: englische → deutsche Zählung ----------
# Psalmen, deren Überschrift im Hebräischen (und Deutschen) ein eigener Vers ist (+1) bzw. zwei Verse (+2)
PSALM_PLUS1 = {3, 4, 5, 6, 7, 8, 9, 12, 13, 18, 19, 20, 21, 22, 30, 31, 34, 36, 38, 39, 40, 41, 42, 44, 45, 46, 47, 48, 49, 53,
               55, 56, 57, 58, 59, 61, 62, 63, 64, 65, 67, 68, 69, 70, 75, 76, 77, 80, 81, 83, 84, 85, 88, 89, 92, 102, 108, 140, 142}
PSALM_PLUS2 = {51, 52, 54, 60}
# (Buch, Kapitel, von, bis) englisch → (Kapitel, erster Vers) deutsch
RANGES = [
    ('Genesis', 31, 55, 55, 32, 1), ('Genesis', 32, 1, 32, 32, 2),
    ('Exodus', 8, 1, 4, 7, 26), ('Exodus', 8, 5, 32, 8, 1), ('Exodus', 22, 1, 1, 21, 37), ('Exodus', 22, 2, 31, 22, 1),
    ('Leviticus', 6, 1, 7, 5, 20), ('Leviticus', 6, 8, 30, 6, 1),
    ('Numbers', 16, 36, 50, 17, 1), ('Numbers', 17, 1, 13, 17, 16), ('Numbers', 29, 40, 40, 30, 1), ('Numbers', 30, 1, 16, 30, 2),
    ('Deuteronomy', 12, 32, 32, 13, 1), ('Deuteronomy', 13, 1, 18, 13, 2), ('Deuteronomy', 22, 30, 30, 23, 1),
    ('Deuteronomy', 23, 1, 25, 23, 2), ('Deuteronomy', 29, 1, 1, 28, 69), ('Deuteronomy', 29, 2, 29, 29, 1),
    ('I Samuel', 23, 29, 29, 24, 1), ('I Samuel', 24, 1, 22, 24, 2),
    ('II Samuel', 18, 33, 33, 19, 1), ('II Samuel', 19, 1, 43, 19, 2),
    ('I Kings', 4, 21, 34, 5, 1), ('I Kings', 5, 1, 18, 5, 15),
    ('II Kings', 11, 21, 21, 12, 1), ('II Kings', 12, 1, 21, 12, 2),
    ('I Chronicles', 6, 1, 15, 5, 27), ('I Chronicles', 6, 16, 81, 6, 1),
    ('II Chronicles', 2, 1, 1, 1, 18), ('II Chronicles', 2, 2, 18, 2, 1), ('II Chronicles', 14, 1, 1, 13, 23), ('II Chronicles', 14, 2, 15, 14, 1),
    ('Nehemiah', 4, 1, 6, 3, 33), ('Nehemiah', 4, 7, 23, 4, 1), ('Nehemiah', 9, 38, 38, 10, 1), ('Nehemiah', 10, 1, 39, 10, 2),
    ('Job', 41, 1, 8, 40, 25), ('Job', 41, 9, 34, 41, 1),
    ('Ecclesiastes', 5, 1, 1, 4, 17), ('Ecclesiastes', 5, 2, 20, 5, 1),
    ('Song of Solomon', 6, 13, 13, 7, 1), ('Song of Solomon', 7, 1, 13, 7, 2),
    ('Isaiah', 9, 1, 1, 8, 23), ('Isaiah', 9, 2, 21, 9, 1), ('Isaiah', 64, 1, 1, 63, 19), ('Isaiah', 64, 2, 12, 64, 1),
    ('Jeremiah', 9, 1, 1, 8, 23), ('Jeremiah', 9, 2, 26, 9, 1),
    ('Ezekiel', 20, 45, 49, 21, 1), ('Ezekiel', 21, 1, 32, 21, 6),
    ('Daniel', 4, 1, 3, 3, 31), ('Daniel', 4, 4, 37, 4, 1), ('Daniel', 5, 31, 31, 6, 1), ('Daniel', 6, 1, 28, 6, 2),
    ('Hosea', 1, 10, 11, 2, 1), ('Hosea', 2, 1, 23, 2, 3), ('Hosea', 11, 12, 12, 12, 1), ('Hosea', 12, 1, 14, 12, 2),
    ('Hosea', 13, 16, 16, 14, 1), ('Hosea', 14, 1, 9, 14, 2),
    ('Joel', 2, 28, 32, 3, 1), ('Joel', 3, 1, 21, 4, 1),
    ('Jonah', 1, 17, 17, 2, 1), ('Jonah', 2, 1, 10, 2, 2),
    ('Micah', 5, 1, 1, 4, 14), ('Micah', 5, 2, 15, 5, 1),
    ('Nahum', 1, 15, 15, 2, 1), ('Nahum', 2, 1, 13, 2, 2),
    ('Zechariah', 1, 18, 21, 2, 1), ('Zechariah', 2, 1, 13, 2, 5),
    ('Malachi', 4, 1, 6, 3, 19),
    ('II Corinthians', 13, 13, 13, 13, 12), ('II Corinthians', 13, 14, 14, 13, 13),
]

TITLE_WORDS = re.compile(r'Vorsänger|Psalm|Lied|David|Asaph|Korah|Maskil|Michtam|Gebet|Salomo|Mose|Ethan|Heman|Jeduthun|Gittith|'
                         r'Scheminith|Alamoth|Schuschan|Neginoth|Nechiloth|Machalath|Muth|Taube|Hindin|Gedächtnis|Dankopfer|Sabbat|'
                         r'Lehre|Ajeleth|Jonath|Schiggajon|Edom|Syrer|Höhle|Wüste|Absalom|Saul|Doeg|Siph|Nathan|Bathseba|Abimelech|'
                         r'Kusch|Lilien|Zeugnis|Joab|Aram|Salztal|Tempelweihe|Saitenspiel|verdirb nicht|Zehnsaitig', re.I)


def split_title(text):
    """Trennt die Psalm-Überschrift (steht in der Quelle vor dem ersten Vers) vom eigentlichen Text."""
    parts = re.split(r'(?<=[.])\s+', text)
    title = []
    for p in parts[:-1]:
        if TITLE_WORDS.search(p) and len(p) < 170:
            title.append(p)
        else:
            break
    if not title:
        return '', text
    return ' '.join(title), text[len(' '.join(title)):].strip()


# ---------- Rechtschreibung ----------
LONG_EXACT = {'aß', 'aßt', 'fraß', 'fraßt', 'saß', 'saßt', 'vergaß', 'maß', 'maßt', 'gemäß', 'spaß', 'bloß', 'groß'}
LONG_PART = ('groß', 'größ', 'fuß', 'füß', 'gefäß', 'süß', 'stoß', 'stöß', 'gruß', 'grüß', 'büß', 'buß', 'kloß', 'ruß', 'blöß', 'mäß', 'gemäß')


def modern(word):
    if 'ß' not in word:
        return word
    low = word.lower()
    if low in LONG_EXACT or any(p in low for p in LONG_PART) or word in ('Schoß', 'Floß', 'Schoße'):
        return word
    out = []
    for i, ch in enumerate(word):
        if ch != 'ß':
            out.append(ch); continue
        nxt = word[i + 1] if i + 1 < len(word) else ''
        prev2 = word[max(0, i - 2):i].lower()
        if nxt.lower() in 'aeiouäöüy' and nxt:          # zwischen Vokalen: ß bleibt
            out.append(ch)
        elif prev2 in ('ei', 'ai', 'au', 'eu', 'äu', 'ie'):   # nach Doppellaut: ß bleibt
            out.append(ch)
        else:
            out.append('ss')
    return ''.join(out)


def modernize(text):
    return re.sub(r'[A-Za-zÄÖÜäöüß]+', lambda m: modern(m.group(0)), text)


# ---------- Gottesname ----------
DAT_PREP = {'zu', 'vor', 'von', 'mit', 'bei', 'nach', 'aus', 'gegenüber', 'seit', 'außer', 'samt', 'nebst', 'in', 'an', 'unter', 'neben'}
ACC_PREP = {'auf', 'für', 'durch', 'gegen', 'wider', 'ohne', 'um'}
ACC_VERB = {'preiset', 'preise', 'preisen', 'lobet', 'lobe', 'loben', 'fürchtet', 'fürchte', 'fürchten', 'suchet', 'suche', 'suchen',
            'liebet', 'liebe', 'lieben', 'erhebet', 'erhebe', 'ehret', 'ehre', 'segnet', 'versuchet', 'versucht', 'erkennet', 'erkenne',
            'erkannten', 'erkannte', 'verließen', 'verließ', 'verlassen', 'fragte', 'fragten', 'befragte', 'befragten', 'kennen', 'kennt', 'kannten'}
DAT_VERB = {'befiehl', 'befehlet', 'befahl', 'danket', 'danke', 'danken', 'dienet', 'diene', 'dienen', 'dienten', 'diente', 'singet', 'singe', 'singen', 'jauchzet',
            'opfert', 'opferte', 'opferten', 'gehorchet', 'gehorchten', 'glaubte', 'glaubten', 'folgte', 'folgten', 'weihet', 'heiliget'}
NOM_AFTER = {'dein', 'deine', 'sein', 'seine', 'euer', 'eure', 'ihr', 'ihre', 'unser', 'unsere'}


def lord(text):
    out, last = [], 0
    for m in re.finditer(r'\b(Jehova|Jah)(s?)\b', text):
        start, end = m.start(), m.end()
        before, after = text[:start], text[end:]
        pw = re.search(r'([A-Za-zÄÖÜäöüß]+)([^A-Za-zÄÖÜäöüß]*)$', before)
        prev, sep = (pw.group(1).lower(), pw.group(2)) if pw else ('', '')
        sent_start = not before.strip() or re.search(r'[.!?:;"„]\s*$', before) is not None
        nxt = after.lstrip()
        nw = re.match(r'[A-Za-zÄÖÜäöüß]+', nxt)
        next_word = nw.group(0).lower() if nw else ''
        if m.group(2):                                   # Jehovas → des HERRN
            rep = 'des HERRN'
        elif prev == 'o' and sep.strip() == '':
            rep = 'HERR'
        elif prev == 'herr' and sep.strip() in ('', ','):
            if sep.strip() == '':                         # „Herr Jehova“ → „Herr, HERR“
                out.append(text[last:start].rstrip() + ', '); last = start
            rep = 'HERR'
        elif prev == 'dem' and sep.strip() == '' and not re.search(r',\s*dem\s*$', before):
            rep = 'HERRN'                                  # „Opfergabe dem Jehova“ → „dem HERRN“ (sonst Relativsatz: „dem der HERR …“)
        elif prev in ('ich', 'bin'):
            rep = 'der HERR'                               # „ich, Jehova“ / „ich bin Jehova“ → „ich, der HERR“
        elif prev in ('sie', 'er', 'wir') and sep.strip() == '':
            rep = 'den HERRN'                              # „dass sie Jehova fürchten“
        elif prev == 'du' and sep.strip() == ',':
            rep = 'HERR'
        elif sep.strip() == '' and prev in DAT_PREP:
            rep = 'dem HERRN'
        elif sep.strip() == '' and prev in ACC_PREP:
            rep = 'den HERRN'
        elif sep.strip() == '' and prev in ACC_VERB:
            rep = 'den HERRN'
        elif sep.strip() == '' and prev in DAT_VERB:
            rep = 'dem HERRN'
        elif sent_start and re.match(r'\s*(will|wollen|werde|werden|sollst|sollt|sollen)\s+(ich|wir|du|ihr)\b', after):
            rep = 'den HERRN'                              # „Jehova will ich preisen“ → „Den HERRN will ich preisen“
        elif (sent_start or sep.strip() == ',') and (nxt[:1] in '!?' or (nxt[:1] == ',' and next_word not in NOM_AFTER and not re.match(r',\s*(dein|sein|euer|unser)', nxt))) and not (sent_start and nxt[:1] == ',' and re.match(r',\s*(dein|sein|euer|unser)', nxt)):
            rep = 'HERR'                                   # Anrede: „Jehova, wie lange …“, „Errette mich, Jehova!“
        elif sep.strip() == ',' and nxt[:1] in '.;:':
            rep = 'HERR'
        else:
            rep = 'der HERR'
        if sent_start and rep[0].islower():
            rep = rep[0].upper() + rep[1:]
        out.append(text[last:start] + rep)
        last = end
    out.append(text[last:])
    return ''.join(out)


MARK = re.compile(r'\(H(\d+):(\d+)\)\s*')


def clean(text):
    text = MARK.sub('', text).replace('"', '').strip()
    text = re.sub(r'\s+-\s*$', '', text)
    return modernize(lord(text)).strip()


def marker_ranges(books):
    """Zusammenhängende Bereiche (mind. 2 Verse), die die Quelle selbst mit (Hk:v) markiert: sie haben Vorrang."""
    res = {}
    for en, _ in BOOKS:
        run = []
        def flush():
            if len(run) >= 2:
                for key, val in run:
                    res[key] = val
        for c in books[en]['chapters']:
            for v in c['verses']:
                m = MARK.search(v['text'])
                if m:
                    key, val = (en, c['chapter'], v['verse']), (int(m.group(1)), int(m.group(2)))
                    if run and run[-1][0][1] == key[1] and run[-1][0][2] == key[2] - 1 and run[-1][1][0] == val[0] and run[-1][1][1] == val[1] - 1:
                        run.append((key, val))
                    else:
                        flush(); run = [(key, val)]
                else:
                    flush(); run = []
        flush()
    return res


def main(src, dst):
    data = json.load(open(src, encoding='utf-8'))
    books = {b['name']: b for b in data['books']}
    rmap = {}
    for (bk, ch, a, b, gch, gv) in RANGES:
        for v in range(a, b + 1):
            rmap[(bk, ch, v)] = (gch, gv + (v - a))
    marks = marker_ranges(books)
    out, merged = [], 0
    for en, de in BOOKS:
        chapters = {}
        for c in books[en]['chapters']:
            ch = c['chapter']
            for v in c['verses']:
                txt, vn, gch = v['text'], v['verse'], ch
                key = (en, ch, vn)
                if key in marks:
                    gch, vn = marks[key]
                elif en == 'Psalms' and (ch in PSALM_PLUS1 or ch in PSALM_PLUS2):
                    off = 2 if ch in PSALM_PLUS2 else 1
                    if vn == 1:
                        title, rest = split_title(txt)
                        chapters.setdefault(ch, {})[1] = clean(title) if title else ''
                        if off == 2:
                            chapters[ch][2] = ''
                        txt = rest
                    vn += off
                elif key in rmap:
                    gch, vn = rmap[key]
                t = clean(txt)
                vs = chapters.setdefault(gch, {})
                if vs.get(vn):                            # zwei Verse auf derselben Nummer: zusammenführen
                    vs[vn] = vs[vn] + ' ' + t; merged += 1
                else:
                    vs[vn] = t
        chs = []
        for ch in sorted(chapters):
            vs = chapters[ch]
            chs.append([vs.get(i, '') for i in range(1, max(vs) + 1)])
        out.append({'n': de, 'c': chs})
    js = 'window.W = window.W || {};\n// Elberfelder Bibel 1905 (gemeinfrei), deutsche Verszählung; erzeugt mit tools/build-bible.py\nW.BIBLE = ' + json.dumps({'books': out}, ensure_ascii=False, separators=(',', ':')) + ';\n'
    open(dst, 'w', encoding='utf-8').write(js)
    print('Bereiche aus Quell-Markierungen:', len(marks), 'Verse | zusammengeführt:', merged)
    print('Bücher:', len(out), '| Verse:', sum(len(c) for b in out for c in b['c']), '| Größe:', round(len(js.encode()) / 1e6, 2), 'MB')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
