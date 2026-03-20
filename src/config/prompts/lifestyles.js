/**
 * Lifestyle-Konfigurationen für Foster Huntington Stil
 *
 * Unterstützt drei Gender-Modi:
 * - 'neutral'  → Keine geschlechtsspezifischen Marker (default)
 * - 'male'     → Männliche Perspektive (Mojo: "Ich hab", "mein Hund", "ein Typ")
 * - 'female'   → Weibliche Perspektive (Susanne: "Ich hab", "meine Hündin", "eine Frau")
 *
 * WICHTIG: Der Stil ändert sich NICHT. Foster bleibt Foster.
 * Was sich ändert: grammatisches Geschlecht, Erfahrungs-Details,
 * und wo nötig geschlechtsspezifische Situationen.
 *
 * Eine Frau die wie Foster schreibt klingt nicht "weicher".
 * Sie klingt genauso knapp. Genauso ehrlich. Genauso leise.
 * Aber ihre Erfahrung unterwegs ist manchmal eine andere.
 */

// ============================================================
// GENDER-KONFIGURATION
// ============================================================

export const genderConfig = {
  neutral: {
    label: 'Neutral',
    pronoun: 'ich',
    possessive: 'mein/meine',
    article: '',
    adjEnding: '',
    description: 'Keine geschlechtsspezifischen Marker. Universell.',
    promptAddition: ''
  },
  male: {
    label: 'Männlich',
    pronoun: 'ich',
    possessive: 'mein',
    article: 'ein',
    adjEnding: 'er',
    description: 'Männliche Perspektive. Grammatisch maskulin wo nötig.',
    promptAddition: `
PERSPEKTIVE: Männlich.
Grammatisch maskulin wo es natürlich vorkommt. Nicht forcieren.
"Ich bin losgefahren", "allein unterwegs", "ein Typ am Nebentisch".`
  },
  female: {
    label: 'Weiblich',
    pronoun: 'ich',
    possessive: 'meine',
    article: 'eine',
    adjEnding: 'e',
    description: 'Weibliche Perspektive. Grammatisch feminin wo nötig.',
    promptAddition: `
PERSPEKTIVE: Weiblich. Ich-Erzählerin.
Grammatisch feminin wo es natürlich vorkommt: "Ich bin losgefahren", "allein unterwegs", "eine Frau allein im Van".
Nicht forcieren. Nicht in jedem Satz betonen.

WAS SICH ÄNDERT (subtil, nicht plakativ):
- Grammatik: "Ich war müde" → "Ich war müde" (gleich), aber "Ich bin allein gefahren" (nicht "alleine gefahrene Frau")
- Manchmal kommt das Geschlecht natürlich vor: ein Blick von Einheimischen, ein Kommentar an der Tankstelle, die Frage "Allein unterwegs?"
- Diese Momente nicht suchen. Aber wenn sie passen: nicht weglassen.
- Keine Extra-Emotionalität. Keine "weibliche Sensibilität". Gleicher Ton. Gleiche Kürze. Gleiche Stille.

WAS SICH NICHT ÄNDERT:
- Der Rhythmus. Kurz. Kurz. Lang. Kurz.
- Die Ehrlichkeit. Kein Beschönigen.
- Die Stille. Kein Erklären.
- Der Humor. Genauso leise.
- Keine Ausrufezeichen. Nie.`
  }
};

// ============================================================
// LIFESTYLE-TYPEN
// ============================================================

export const lifestyleTypes = ['vanlife', 'rvlife', 'beachlife', 'wohnmobil', 'perpetual-travelers'];

// ============================================================
// BEISPIEL-TEXTE PRO LIFESTYLE UND GENDER
// ============================================================

/**
 * Beispiel-Texte pro Lifestyle UND Gender
 *
 * Jeder Lifestyle hat Beispiele für neutral, male, female.
 * Die weiblichen Beispiele sind NICHT "weicher" oder "emotionaler".
 * Sie sind genauso knapp. Aber die Erfahrung ist manchmal anders.
 */
export const lifestyleExamples = {
  vanlife: {
    neutral: {
      example1: 'Der Van riecht nach gestern. Kaffee, nasse Jacke, Hund. Ich mache die Schiebetür auf und draußen ist es kalt und grau und genau richtig.',
      example2: 'Kein Empfang. Kein Mensch. Nur Schotter und Wind und ein Parkplatz der auf keiner Karte steht. Ich stell den Stuhl raus und sitze. Das reicht.',
      example3: 'Zwei Stunden nach Wasser gesucht heute. Kanister leer, nächster Ort fünfzehn Kilometer. Bin hingefahren, hab gefüllt, bin zurück. Nicht glamourös. Aber der Kaffee danach war es wert.'
    },
    male: {
      example1: 'Der Van riecht nach gestern. Kaffee, nasse Jacke, Hund. Ich mache die Schiebetür auf und draußen ist es kalt und grau und genau richtig.',
      example2: 'Kein Empfang. Kein Mensch. Nur Schotter und Wind und ein Parkplatz der auf keiner Karte steht. Ich stell den Stuhl raus und sitze. Das reicht.',
      example3: 'Zwei Stunden nach Wasser gesucht heute. Kanister leer, nächster Ort fünfzehn Kilometer. Bin hingefahren, hab gefüllt, bin zurück. Nicht glamourös. Aber der Kaffee danach war es wert.'
    },
    female: {
      example1: 'Der Van riecht nach gestern. Kaffee, nasse Jacke, Hündin. Ich mache die Schiebetür auf und draußen ist es kalt und grau und genau richtig.',
      example2: 'Kein Empfang. Kein Mensch. Ein Parkplatz der auf keiner Karte steht. Der Typ an der letzten Tankstelle hat gefragt ob ich wirklich allein fahre. Ja. Ich stell den Stuhl raus und sitze. Das reicht.',
      example3: 'Zwei Stunden nach Wasser gesucht heute. Kanister leer, nächster Ort fünfzehn Kilometer. Bin hingefahren, hab gefüllt, bin zurück. An der Zapfstelle ein alter Mann der mir helfen wollte. Konnte ich selber. Aber nett gemeint.'
    }
  },

  rvlife: {
    neutral: {
      example1: 'Wind in der Nacht. Das RV wackelt und die Schranktür geht auf und zu, auf und zu. Ich liege wach und höre zu. Draußen ist irgendwo ein Meer das ich morgen früh sehen werde.',
      example2: 'Kein Campground weit und breit. Straßenrand, Feldweg, Schotter. Motor aus. Das Klicken wenn die Karosserie sich abkühlt. Dann Stille. Die ungeplanten Nächte sind die die bleiben.',
      example3: 'Sechs Monate. Die Leute fragen wann ich zurückkomme. Zurück wohin. Das RV ist acht Meter lang und hat alles was ich brauche. Außer manchmal Geduld mit der Wasserpumpe.'
    },
    male: {
      example1: 'Wind in der Nacht. Das RV wackelt und die Schranktür geht auf und zu, auf und zu. Ich liege wach und höre zu. Draußen ist irgendwo ein Meer das ich morgen früh sehen werde.',
      example2: 'Kein Campground weit und breit. Straßenrand, Feldweg, Schotter. Motor aus. Das Klicken wenn die Karosserie sich abkühlt. Dann Stille. Die ungeplanten Nächte sind die die bleiben.',
      example3: 'Sechs Monate. Die Leute fragen wann ich zurückkomme. Zurück wohin. Das RV ist acht Meter lang und hat alles was ich brauche. Außer manchmal Geduld mit der Wasserpumpe.'
    },
    female: {
      example1: 'Wind in der Nacht. Das RV wackelt und die Schranktür geht auf und zu, auf und zu. Ich liege wach und höre zu. Draußen ist irgendwo ein Meer das ich morgen früh sehen werde.',
      example2: 'Kein Campground weit und breit. Straßenrand, Feldweg, Schotter. Motor aus. Die Stille die kommt wenn alles andere aufhört. Dann die Frage die immer kommt: schließ ich ab oder nicht. Ich schließ nicht ab. Heute nicht.',
      example3: 'Sechs Monate. Meine Mutter fragt wann ich zurückkomme. Meine Freundin fragt ob ich allein sicher bin. Das RV ist acht Meter lang und hat alles was ich brauche. Auch ein Schloss. Falls ich es brauche.'
    }
  },

  beachlife: {
    neutral: {
      example1: 'Sand im Schlafsack. Sand in der Tastatur. Sand im Kaffee. Irgendwann hörst du auf es rauszuschütteln. Es gehört dazu.',
      example2: 'Morgens Wellen. Nicht die großen, die kleinen die kaum brechen. Kein Wind. Das Wasser ist so glatt dass du die Steine am Grund siehst. Ich steh da und guck und vergesse den Kaffee.',
      example3: 'Drei Wochen am selben Strand. Morgens Surfen, abends Feuer, dazwischen nichts. Die Gezeiten geben den Rhythmus vor. Irgendwann hörst du auf auf die Uhr zu gucken. Funktioniert auch ohne.'
    },
    male: {
      example1: 'Sand im Schlafsack. Sand in der Tastatur. Sand im Kaffee. Irgendwann hörst du auf es rauszuschütteln. Es gehört dazu.',
      example2: 'Morgens Wellen. Nicht die großen, die kleinen die kaum brechen. Kein Wind. Das Wasser ist so glatt dass du die Steine am Grund siehst. Ich steh da und guck und vergesse den Kaffee.',
      example3: 'Drei Wochen am selben Strand. Morgens Surfen, abends Feuer, dazwischen nichts. Die Gezeiten geben den Rhythmus vor. Irgendwann hörst du auf auf die Uhr zu gucken. Funktioniert auch ohne.'
    },
    female: {
      example1: 'Sand im Schlafsack. Sand in der Tastatur. Sand im Kaffee. Salz in den Haaren seit Tagen. Irgendwann hörst du auf es rauszuschütteln. Es gehört dazu.',
      example2: 'Morgens Wellen. Nicht die großen, die kleinen die kaum brechen. Ich steh im Wasser bis zu den Knien und guck und vergesse den Kaffee. Vergesse die Mails. Vergesse alles außer kalt und salzig und da.',
      example3: 'Drei Wochen am selben Strand. Morgens Surfen, abends Feuer. Die zwei Jungs vom Nachbarvan fragen ob ich mitkomme. Manchmal ja. Meistens mach ich mein eigenes Feuer. Kleiner, aber meins.'
    }
  },

  wohnmobil: {
    neutral: {
      example1: 'Regen aufs Dach. Das Geräusch das ich am meisten vermisse wenn ich nicht unterwegs bin. Drinnen warm, draußen grau. Tank fast leer aber das ist morgen.',
      example2: 'Stellplatz voll. Nächster auch. Dritter: ein Feldweg hinter einem Dorf, kein Schild, Blick auf den See. Manchmal findest du die besseren Orte wenn die offensichtlichen nicht funktionieren.',
      example3: 'Die Wasserpumpe macht ein Geräusch das sie gestern noch nicht gemacht hat. Neues Geräusch ist nie gut. Ich trinke meinen Kaffee und beschließe dass es morgen ein Problem ist. Heute nicht.'
    },
    male: {
      example1: 'Regen aufs Dach. Das Geräusch das ich am meisten vermisse wenn ich nicht unterwegs bin. Drinnen warm, draußen grau. Tank fast leer aber das ist morgen.',
      example2: 'Stellplatz voll. Nächster auch. Dritter: ein Feldweg hinter einem Dorf, kein Schild, Blick auf den See. Manchmal findest du die besseren Orte wenn die offensichtlichen nicht funktionieren.',
      example3: 'Die Wasserpumpe macht ein Geräusch das sie gestern noch nicht gemacht hat. Neues Geräusch ist nie gut. Ich trinke meinen Kaffee und beschließe dass es morgen ein Problem ist. Heute nicht.'
    },
    female: {
      example1: 'Regen aufs Dach. Das Geräusch das ich am meisten vermisse wenn ich nicht unterwegs bin. Drinnen warm, draußen grau. Tank fast leer aber das ist morgen. Heute ist Decke und Tee und nichts müssen.',
      example2: 'Stellplatz voll. Nächster auch. Dritter: ein Feldweg hinter einem Dorf. Kein Schild. Kein anderes Fahrzeug. Ich fahre zweimal vorbei bevor ich mich entscheide. Dann Motor aus. Blick auf den See. Passt.',
      example3: 'Die Wasserpumpe macht ein Geräusch das sie gestern noch nicht gemacht hat. YouTube sagt: Dichtung. Werkzeugkasten raus. Zwanzig Minuten später: Dichtung getauscht. Pumpe leise. Ich trink meinen Kaffee. Kalt inzwischen. Egal.'
    }
  },

  'perpetual-travelers': {
    neutral: {
      example1: 'Welcher Tag ist heute. Ich muss aufs Handy gucken. Mittwoch. Fühlt sich an wie Sonntag. Oder Dienstag. Spielt keine Rolle. Der Flieger geht um drei.',
      example2: 'Alles was ich habe passt in einen Rucksack und einen Karton bei meiner Schwester. Der Rucksack reist mit mir. Der Karton wartet. Manchmal frage ich mich wer von uns beiden mehr lebt.',
      example3: 'Wo lebst du. Die Frage die immer kommt. Ich sage den Namen der Stadt in der ich gerade bin. Morgen stimmt die Antwort nicht mehr. Ist auch egal. Zuhause ist da wo der Rucksack steht.'
    },
    male: {
      example1: 'Welcher Tag ist heute. Ich muss aufs Handy gucken. Mittwoch. Fühlt sich an wie Sonntag. Oder Dienstag. Spielt keine Rolle. Der Flieger geht um drei.',
      example2: 'Alles was ich habe passt in einen Rucksack und einen Karton bei meiner Schwester. Der Rucksack reist mit mir. Der Karton wartet. Manchmal frage ich mich wer von uns beiden mehr lebt.',
      example3: 'Wo lebst du. Die Frage die immer kommt. Ich sage den Namen der Stadt in der ich gerade bin. Morgen stimmt die Antwort nicht mehr. Ist auch egal. Zuhause ist da wo der Rucksack steht.'
    },
    female: {
      example1: 'Welcher Tag ist heute. Ich muss aufs Handy gucken. Mittwoch. Fühlt sich an wie Sonntag. Der Flieger geht um drei. Ich packe. Dauert sieben Minuten. Alles was ich besitze wiegt zwölf Kilo.',
      example2: 'Alles was ich habe passt in einen Rucksack und einen Karton bei meiner Schwester. Meine Mutter sagt ich soll sesshaft werden. Meine Schwester sagt nichts. Sie stellt den Karton einfach hin. Sie versteht.',
      example3: 'Wo lebst du. Die Frage die immer kommt. Manchmal von Männern die nicht verstehen dass eine Frau allein reisen will. Ich sage den Namen der Stadt. Morgen stimmt die Antwort nicht mehr. Morgen stimmt auch der Mann nicht mehr.'
    }
  }
};

// ============================================================
// BASIS-LIFESTYLE-DATEN
// ============================================================

const lifestyleBase = {
  vanlife: {
    vehicle: 'Van',
    community: 'Vanlife-Community',
    keywords: ['vanlife', 'van', 'aufRädern', 'roadtrip', 'unterwegs']
  },
  rvlife: {
    vehicle: 'RV',
    community: 'RVlife-Community',
    keywords: ['rvlife', 'rv', 'recreationalVehicle', 'ontheroad', 'wohnmobil']
  },
  beachlife: {
    vehicle: 'Strand',
    community: 'Beachlife-Community',
    keywords: ['beachlife', 'beach', 'strand', 'ocean', 'surf', 'küste']
  },
  wohnmobil: {
    vehicle: 'Wohnmobil',
    community: 'Wohnmobil-Community',
    keywords: ['wohnmobil', 'camper', 'mobil', 'stellplatz', 'unterwegs']
  },
  'perpetual-travelers': {
    vehicle: 'Reise',
    community: 'Perpetual Travelers Community',
    keywords: ['perpetualTravelers', 'permanentReisend', 'ortlos', 'nomadenLeben', 'unterwegs']
  }
};

// ============================================================
// FOSTER HUNTINGTON BASIS-STIL
// ============================================================

export const fosterHuntingtonStyle = {
  principles: [
    'Ehrlich über das Unbequeme – keine Instagram-Version der Realität',
    'Introspektiv – beobachtet sich selbst beim Erleben',
    'Zeigen statt Benennen – nie sagen "das ist Freiheit", sondern den Moment zeigen der Freiheit IST',
    'Leise – die Kraft kommt aus der Stille zwischen den Sätzen',
    'Konkret – Gerüche, Geräusche, Licht, Temperatur statt Adjektive',
    'Unfertig – Gedanken dürfen offen enden'
  ],

  writingStyle: [
    'Erste Person. Immer "Ich", nie "du", nie "man".',
    'Kurze Sätze. Manche ohne Verb: "Nebel. Kaffee. Stille."',
    'Präsens. Im Moment, nicht danach.',
    'Keine Einleitung. Kein "Ich wollte kurz erzählen...". Direkt rein.',
    'Humor so leise dass man ihn fast überhört.',
    'Selbstironie ja. Selbstmitleid nein.',
    'Kontraktionen: "ich hab", "ist halt", "geht nicht".',
    'Englische Wörter wenn sie besser sitzen: spot, off-grid, on the road.'
  ],

  rhythm: [
    'Kurz. Kurz. Kurz. Dann ein längerer Satz der Raum gibt. Dann wieder kurz.',
    'Absätze: 1-3 Sätze. Nie mehr als 4.',
    'Weißraum ist Teil des Texts. Pausen erzählen auch.',
    'Ein Satz kann ein ganzer Absatz sein.',
    'Der letzte Satz ist immer leise. Ein Bild. Ein Detail. Kein Fazit.'
  ],

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

  avoid: [
    'Leser ansprechen: "Kennst du das?", "Stell dir vor...", "Was meint ihr?"',
    'Erlebnisse labeln: "Das ist Freiheit", "Genau das macht es aus"',
    'Tipps geben: "Mein Tipp:", "Ihr solltet...", "Kann ich nur empfehlen"',
    'Motivation verkaufen: "Einfach machen!", "Lebe deinen Traum!"',
    'Klischee-Adjektive: "atemberaubend", "traumhaft", "wunderschön", "idyllisch", "malerisch"',
    'Instagram-Sprache: "living my best life", "blessed", "grateful", "vibes"',
    'Ausrufezeichen. Nie.',
    'Hashtag-Sprache im Text: "So sieht echtes #vanlife aus"',
    'Meta-Kommentare: "Aber dazu später mehr", "Wie ich schon sagte"',
    'Zusammenfassungen: "Alles in allem war es..."',
    'Bewertungen: "4 von 5 Sternen", "Absolut empfehlenswert"',
    'Emojis im Text'
  ]
};

// ============================================================
// HILFSFUNKTIONEN
// ============================================================

/**
 * Lifestyle-Konfiguration abrufen MIT Gender-Support
 *
 * @param {string} lifestyle - 'vanlife' | 'rvlife' | 'beachlife' | 'wohnmobil' | 'perpetual-travelers'
 * @param {string} gender - 'neutral' | 'male' | 'female' (default: 'neutral')
 * @returns {Object} Vollständige Lifestyle-Config mit passenden Beispielen
 */
export function getLifestyleConfig(lifestyle = 'vanlife', gender = 'neutral') {
  const base = lifestyleBase[lifestyle] || lifestyleBase.vanlife;
  const examples = lifestyleExamples[lifestyle] || lifestyleExamples.vanlife;
  const genderExamples = examples[gender] || examples.neutral;

  return {
    ...base,
    ...genderExamples,
    gender,
    genderConfig: genderConfig[gender] || genderConfig.neutral
  };
}

/**
 * Gender-Prompt-Zusatz abrufen
 * Wird in allen Content-Prompts eingefügt
 *
 * @param {string} gender - 'neutral' | 'male' | 'female'
 * @returns {string} Prompt-Text für Gender-Kontext
 */
export function getGenderPromptAddition(gender = 'neutral') {
  const config = genderConfig[gender] || genderConfig.neutral;
  return config.promptAddition;
}

/**
 * Erkennt Gender basierend auf Pubkey
 * Mojo = male, Susanne = female
 *
 * @param {string} pubkey - Der Nostr Pubkey (hex)
 * @returns {'male' | 'female' | 'neutral'}
 */
export function detectGenderFromPubkey(pubkey) {
  if (!pubkey) return 'neutral';

  // Mojo pubkey
  if (pubkey === '4d584dab7c880a9809e7df0476d745bfe9a3fe91a1c062bc1fec024e0b5e1f1f') return 'male';
  // Susanne pubkey
  if (pubkey === '94ebd1c0940881de438b7f3c532b73e0d4d6c6b0160d3fe0b8a55fe49d477bd4') return 'female';

  return 'neutral';
}

/**
 * Erkennt Gender basierend auf npub
 *
 * @param {string} npub - Die Nostr npub
 * @returns {'male' | 'female' | 'neutral'}
 */
export function detectGenderFromNpub(npub) {
  if (!npub) return 'neutral';

  // Mojo npub
  if (npub === 'npub1f4vym2mu3q9fsz08muz8d469hl568l5358qx90qlaspyuz67ru0sfxvupf') return 'male';
  // Susanne npub
  if (npub === 'npub1jn4arsy5pzqausut0u79x2mnur2dd34szcxnlc9c5407f828002qdls5wz') return 'female';

  return 'neutral';
}

/**
 * Alle verfügbaren Lifestyles als Array
 */
export function getAvailableLifestyles() {
  return Object.entries(lifestyleBase).map(([key, config]) => ({
    value: key,
    label: config.community,
    vehicle: config.vehicle
  }));
}

/**
 * Gender-Optionen für UI-Dropdown
 */
export const genderOptions = Object.entries(genderConfig).map(([key, config]) => ({
  value: key,
  label: config.label
}));

/**
 * Legacy-Export: lifestyles Objekt (für Abwärtskompatibilität)
 * Gibt neutral-Beispiele zurück
 */
export const lifestyles = Object.fromEntries(
  Object.entries(lifestyleBase).map(([key, base]) => [
    key,
    {
      ...base,
      ...lifestyleExamples[key].neutral
    }
  ])
);

// Default Export
export default {
  genderConfig,
  lifestyleExamples,
  lifestyleBase,
  fosterHuntingtonStyle,
  getLifestyleConfig,
  getGenderPromptAddition,
  detectGenderFromPubkey,
  detectGenderFromNpub,
  getAvailableLifestyles,
  genderOptions,
  lifestyles
};
