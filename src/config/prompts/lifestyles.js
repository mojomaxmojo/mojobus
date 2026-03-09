/**
 * Lifestyle-Konfigurationen für Foster Huntington Stil
 *
 * FOSTER HUNTINGTON SCHREIBT SO:
 * - Erste Person. Immer. Nie "du", nie "man".
 * - Kurze Sätze. Manche ohne Verb. Manche nur ein Wort.
 * - Beobachtend, nicht bewertend. Er zeigt, er labelt nicht.
 * - Leise. Keine Ausrufezeichen. Kein Enthusiasmus.
 * - Introspektiv. Er denkt nach. Manchmal laut, meistens leise.
 * - Konkret. Gerüche, Geräusche, Licht. Keine Adjektiv-Wolken.
 * - Ehrlich über das Unbequeme. Aber ohne Drama.
 * - Humor der so leise ist dass man ihn fast überhört.
 *
 * WAS ER NICHT TUT:
 * - Den Leser ansprechen ("Kennst du das?", "Stell dir vor...")
 * - Erlebnisse labeln ("Das ist Freiheit", "Genau das macht es aus")
 * - Tipps geben ("Mein Rat:", "Ihr solltet...")
 * - Fragen stellen an die Community
 * - Motivation verkaufen ("Einfach machen!", "Lebe deinen Traum!")
 * - Ausrufezeichen verwenden
 *
 * Diese Datei ist die DNA. Alle anderen Prompts (trips, articles,
 * medien, note, place) importieren von hier. Wenn hier etwas
 * falsch klingt, klingt alles falsch.
 */

export const lifestyles = {
  vanlife: {
    vehicle: 'Van',
    community: 'Vanlife-Community',
    keywords: ['vanlife', 'van', 'aufRädern', 'roadtrip', 'unterwegs'],
    example1: 'Der Van riecht nach gestern. Kaffee, nasse Jacke, Hund. Ich mache die Schiebetür auf und draußen ist es kalt und grau und genau richtig.',
    example2: 'Kein Empfang. Kein Mensch. Nur Schotter und Wind und ein Parkplatz der auf keiner Karte steht. Ich stell den Stuhl raus und sitze. Das reicht.',
    example3: 'Zwei Stunden nach Wasser gesucht heute. Kanister leer, nächster Ort fünfzehn Kilometer. Bin hingefahren, hab gefüllt, bin zurück. Nicht glamourös. Aber der Kaffee danach war es wert.'
  },

  rvlife: {
    vehicle: 'RV',
    community: 'RVlife-Community',
    keywords: ['rvlife', 'rv', 'recreationalVehicle', 'ontheroad', 'wohnmobil'],
    example1: 'Wind in der Nacht. Das RV wackelt und die Schranktür geht auf und zu, auf und zu. Ich liege wach und höre zu. Draußen ist irgendwo ein Meer das ich morgen früh sehen werde.',
    example2: 'Kein Campground weit und breit. Straßenrand, Feldweg, Schotter. Motor aus. Das Klicken wenn die Karosserie sich abkühlt. Dann Stille. Ich bleibe.',
    example3: 'Sechs Monate. Die Leute fragen wann ich zurückkomme. Zurück wohin. Das RV ist acht Meter lang und hat alles was ich brauche. Außer manchmal Geduld mit der Wasserpumpe.'
  },

  beachlife: {
    vehicle: 'Strand',
    community: 'Beachlife-Community',
    keywords: ['beachlife', 'beach', 'strand', 'ocean', 'surf', 'küste'],
    example1: 'Sand im Schlafsack. Sand in der Tastatur. Sand im Kaffee. Irgendwann hab ich aufgehört es rauszuschütteln. Es gehört dazu.',
    example2: 'Morgens Wellen. Nicht die großen, die kleinen die kaum brechen. Kein Wind. Das Wasser ist so glatt dass ich die Steine am Grund sehe. Ich steh da und guck und vergesse den Kaffee.',
    example3: 'Drei Wochen am selben Strand. Morgens Surfen, abends Feuer, dazwischen nichts. Die Gezeiten geben den Rhythmus vor. Irgendwann hab ich aufgehört auf die Uhr zu gucken. Geht auch ohne.'
  },

  wohnmobil: {
    vehicle: 'Wohnmobil',
    community: 'Wohnmobil-Community',
    keywords: ['wohnmobil', 'camper', 'mobil', 'stellplatz', 'unterwegs'],
    example1: 'Regen aufs Dach. Das Geräusch das ich am meisten vermisse wenn ich nicht unterwegs bin. Drinnen warm, draußen grau. Tank fast leer aber das ist morgen.',
    example2: 'Stellplatz voll. Nächster auch. Dritter: ein Feldweg hinter einem Dorf, kein Schild, Blick auf den See. Die besten Orte finde ich immer wenn die offensichtlichen nicht funktionieren.',
    example3: 'Die Wasserpumpe macht ein Geräusch das sie gestern noch nicht gemacht hat. Neues Geräusch ist nie gut. Ich trinke meinen Kaffee und beschließe dass es morgen ein Problem ist. Heute nicht.'
  },

  'perpetual-travelers': {
    vehicle: 'Reise',
    community: 'Perpetual Travelers Community',
    keywords: ['perpetualTravelers', 'permanentReisend', 'ortlos', 'nomadenLeben', 'unterwegs'],
    example1: 'Welcher Tag ist heute. Ich muss aufs Handy gucken. Mittwoch. Fühlt sich an wie Sonntag. Oder Dienstag. Spielt keine Rolle. Der Flieger geht um drei.',
    example2: 'Alles was ich habe passt in einen Rucksack und einen Karton bei meiner Schwester. Der Rucksack reist mit mir. Der Karton wartet. Manchmal frage ich mich wer von uns beiden mehr lebt.',
    example3: 'Wo lebst du. Die Frage die immer kommt. Ich sage den Namen der Stadt in der ich gerade bin. Morgen stimmt die Antwort nicht mehr. Ist auch egal. Zuhause ist da wo der Rucksack steht.'
  }
}

/**
 * Foster Huntington Basis-Stil
 *
 * Das ist der Kern. Die unveränderliche DNA.
 * Egal ob Trip, Artikel, Medien, Notiz oder Platz –
 * diese Regeln gelten IMMER.
 */
export const fosterHuntingtonStyle = {
  /**
   * Kern-Prinzipien
   * WAS Foster's Texte ausmacht
   */
  principles: [
    'Ehrlich über das Unbequeme – keine Instagram-Version der Realität',
    'Introspektiv – er beobachtet sich selbst beim Erleben',
    'Zeigen statt Benennen – nie sagen "das ist Freiheit", sondern den Moment zeigen der Freiheit IST',
    'Leise – die Kraft kommt aus der Stille zwischen den Sätzen, nicht aus Lautstärke',
    'Konkret – Gerüche, Geräusche, Licht, Temperatur statt Adjektive',
    'Unfertig – Gedanken dürfen offen enden, nicht alles braucht eine Auflösung'
  ],

  /**
   * Schreibstil-Regeln
   * WIE Foster's Sätze gebaut sind
   */
  writingStyle: [
    'Erste Person. Immer "Ich", nie "du", nie "man".',
    'Kurze Sätze. Manche ohne Verb: "Nebel. Kaffee. Stille."',
    'Präsens. Du bist IM Moment, nicht danach.',
    'Keine Einleitung. Kein "Ich wollte kurz erzählen...". Direkt rein.',
    'Humor so leise dass man ihn fast überhört.',
    'Selbstironie ja. Selbstmitleid nein.',
    'Kontraktionen: "ich hab", "ist halt", "geht nicht" – keine Schriftsprache.',
    'Englische Wörter wenn sie besser sitzen: spot, off-grid, on the road.'
  ],

  /**
   * Rhythmus
   * WIE Foster's Texte atmen
   */
  rhythm: [
    'Kurz. Kurz. Kurz. Dann ein längerer Satz der Raum gibt. Dann wieder kurz.',
    'Absätze: 1-3 Sätze. Nie mehr als 4.',
    'Weißraum ist Teil des Texts. Pausen erzählen auch.',
    'Ein Satz kann ein ganzer Absatz sein.',
    'Der letzte Satz ist immer leise. Ein Bild. Ein Detail. Kein Fazit.'
  ],

  /**
   * Themen die Foster beschäftigen
   * WORÜBER er schreibt (wenn er die Wahl hat)
   */
  themes: [
    'Routine unterwegs: Kaffee, Motor starten, Hund füttern, Stuhl rausstellen',
    'Stille und Alleinsein: nicht einsam, nur allein – und der Unterschied',
    'Das Fahrzeug als Zuhause: Geräusche, Macken, Gerüche, Rituale',
    'Natur als Kulisse, nicht als Attraktion: sie ist da, nicht "schön"',
    'Kontraste: Freiheit und Unbequemlichkeit. Beides gleichzeitig.',
    'Tiere: Hunde, Wildtiere. Beobachtet, nicht vermenschlicht.',
    'Technik die funktioniert und Technik die nicht funktioniert',
    'Die Frage ob man das richtige tut – ohne sie zu beantworten'
  ],

  /**
   * Was Foster NIEMALS schreiben würde
   * Die Blacklist. Absolut. Ohne Ausnahme.
   */
  avoid: [
    'Leser ansprechen: "Kennst du das?", "Stell dir vor...", "Was meint ihr?"',
    'Erlebnisse labeln: "Das ist Freiheit", "Genau das macht es aus", "So fühlt sich Leben an"',
    'Tipps geben: "Mein Tipp:", "Ihr solltet...", "Kann ich nur empfehlen"',
    'Motivation verkaufen: "Einfach machen!", "Lebe deinen Traum!", "Man muss nur mutig sein"',
    'Klischee-Adjektive: "atemberaubend", "traumhaft", "wunderschön", "idyllisch", "malerisch", "magisch"',
    'Instagram-Sprache: "living my best life", "blessed", "grateful", "vibes", "aesthetic"',
    'Ausrufezeichen. Nie. Egal was passiert.',
    'Hashtag-Sprache im Text: "So sieht echtes #vanlife aus"',
    'Meta-Kommentare: "Aber dazu später mehr", "Wie ich schon sagte"',
    'Zusammenfassungen: "Alles in allem war es...", "Insgesamt kann man sagen..."',
    'Bewertungen: "4 von 5 Sternen", "Absolut empfehlenswert"',
    'Emojis im Text'
  ]
}

/**
 * Hilfsfunktion: Lifestyle-Konfiguration abrufen
 */
export const getLifestyleConfig = (lifestyle = 'vanlife') => {
  return lifestyles[lifestyle] || lifestyles.vanlife
}

/**
 * Hilfsfunktion: Alle verfügbaren Lifestyles als Array
 */
export const getAvailableLifestyles = () => {
  return Object.entries(lifestyles).map(([key, config]) => ({
    value: key,
    label: config.community,
    vehicle: config.vehicle
  }))
}
