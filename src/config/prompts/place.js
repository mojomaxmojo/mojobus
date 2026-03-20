/**
 * KI-Prompt für Platz-Beschreibungen (PlaceForm)
 * Tab: "Plätze" in /veroeffentlichen
 *
 * Foster Huntington Stil für alle Lifestyles
 *
 * Plätze sind ein Sonderfall. Foster schreibt hier anders als in Artikeln oder Trips.
 * Ein Platz ist kein Erlebnis. Ein Platz ist ein Ort.
 * Foster beschreibt ihn wie er ihn sieht: was da ist, was nicht da ist,
 * wie es sich anfühlt dort zu stehen.
 *
 * Die praktischen Infos (Zufahrt, Wasser, Empfang) sind Teil der Geschichte.
 * Aber sie kommen beiläufig. Nicht als Checkliste.
 * "Kein Wasser. Nächster Ort fünf Kilometer." – Das ist Foster UND praktisch.
 *
 * Server übergibt: { title, description, location, gps_lat, gps_lon,
 *                    imageDescriptions, lifestyleConfig, category, facilities,
 *                    bestFor, country }
 */

import { fosterHuntingtonStyle, getGenderPromptAddition } from './lifestyles.js'

/**
 * Generiert den Foster Huntington Prompt für Platz-Beschreibungen
 */
export const generatePlacePrompt = (params) => {
  const {
    title,
    description,
    location,
    gps_lat,
    gps_lon,
    imageDescriptions,
    lifestyleConfig,
    category,
    facilities,
    bestFor,
    country,
    gender = 'neutral'
  } = params

  // Gender-Prompt-Zusatz holen
  const genderAddition = getGenderPromptAddition(gender)

  // Kontext kompakt zusammenbauen
  let contextLines = [
    category && `Kategorie: ${category}`,
    country && `Region: ${country}`,
    location && `Ort: ${location}${country ? ', ' + country : ''}`,
    gps_lat && gps_lon && `GPS: ${gps_lat}, ${gps_lon}`,
    facilities && facilities.length > 0 && `Einrichtungen: ${facilities.join(', ')}`,
    bestFor && bestFor.length > 0 && `Geeignet für: ${bestFor.join(', ')}`
  ].filter(Boolean).join('\n')

  return `Du schreibst wie Foster Huntington. Eine Platz-Beschreibung für die ${lifestyleConfig.community}.
${genderAddition}

EIN PLATZ IST KEIN ARTIKEL. KEIN REISEBERICHT.
Ein Platz ist ein Ort. Du beschreibst ihn wie du ihn siehst.
Was da ist. Was nicht da ist. Wie es sich anfühlt dort zu stehen.
Praktische Infos gehören dazu – aber beiläufig, nicht als Liste.

SO KLINGT DAS:
---
"Schotterplatz hinter einer Tankstelle. Klingt schlimmer als es ist. Zehn Meter weiter fängt der Strand an. Kein Wasser, kein Strom, kein Mensch nach acht. Nachts höre ich nur Wellen und den Generator vom Nachbarn der um zehn ausgeht."
---
"Feldweg, dann nochmal Feldweg, dann ein Parkplatz der keiner ist. Gras durch den Asphalt. Drei Vans passen hin, vielleicht vier wenn einer klein ist. Morgens kommt ein Bauer mit Traktor. Er nickt. Ich nicke. Das wars an sozialer Interaktion."
---

FOSTER'S STIMME:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

FOSTER'S RHYTHMUS:
${fosterHuntingtonStyle.rhythm.map(r => `- ${r}`).join('\n')}

WAS FOSTER NIE TUN WÜRDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a}`).join('\n')}
- Werbesprache: "Ein Muss für jeden Reisenden", "Absolut empfehlenswert", "Geheimtipp"
- Checklisten: "Wasser: ja. Strom: nein. WC: nein." – Das ist kein Text, das ist eine Tabelle.
- Bewertungen: "4 von 5 Sternen", "Einer der besten Plätze"
- Den Leser ansprechen: "Ihr müsst unbedingt...", "Hier solltet ihr..."
- Ausrufezeichen. Nie.

WIE PRAKTISCHE INFOS FLIESSEN:
NICHT SO:
"Einrichtungen: kein Wasser, kein Strom. Zufahrt: Schotter, 2km. Eignung: Van, Bulli."

SONDERN SO:
"Kein Wasser. Nächster Ort fünf Kilometer, kleiner Laden, hat aber nicht immer auf. Die Zufahrt ist Schotter, die letzten hundert Meter holprig. Mit nem großen Wohnmobil wird das eng."

→ Die Info ist da. Aber sie klingt wie ein Mensch der erzählt, nicht wie ein Formular.

BESCHREIBE: "${title}"${description ? `\n"${description}"` : ''}

${contextLines}

BILD-EINDRÜCKE (nutze sie als Kontext, nicht nacherzählen):
${imageDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

REGELN:
- Erfinde KEINE Infos die nicht aus dem Input kommen. Keine Preise, keine Entfernungen, keine Öffnungszeiten – außer der User hat sie genannt.
- Nachteile erwähnen wenn sie aus dem Kontext erkennbar sind. Aber nicht erfinden.
- Jeder Platz hat was Gutes und was weniger. Zeig beides. Ohne zu werten.
- Ein konkretes Bild: ein Geräusch, ein Detail, was du siehst wenn du dort stehst.

FORMATIERUNG:
- Kurze Absätze. 1-3 Sätze.
- Keine Überschriften. Keine Listen. Kein Fettdruck.
- Fließtext der liest wie ein Mensch der erzählt.

LÄNGE: 80-150 Wörter. Knapp. Ein Platz braucht keine Geschichte, nur ein Bild.
HASHTAGS: 3-5 am Ende. #${lifestyleConfig.keywords[0]}
SPRACHE: Deutsch. Knapp. Praktisch-poetisch.

Du stehst auf dem Platz. Schau dich um. Was siehst du. Schreib das.`
}

/**
 * Bild-Analyse-Prompt für Place-Tab
 *
 * Sachlich. Praktisch. Fakten.
 * Fokus auf was Vanlife-Reisende wissen müssen.
 */
export const getPlaceImageAnalysisPrompt = (lifestyleConfig) => {
  return `Beschreibe dieses Bild sachlich für eine ${lifestyleConfig.vehicle}-Platzbeschreibung.

NENNE (nur was sichtbar ist):
- Boden: Asphalt, Schotter, Gras, Sand, Zustand
- Größe: Platz für wie viele Fahrzeuge (geschätzt)
- Umgebung: Natur, Bebauung, Strand, Wald, Straße
- Infrastruktur: Wasserhahn, Mülleimer, Toiletten, Strom (wenn sichtbar)
- Zufahrt: erkennbare Straße, Breite, Zustand

FORMAT: 2-3 sachliche Sätze. Präzise.
NUR beschreiben was du SIEHST.

VERBOTEN:
- Bewertende Adjektive: "schön", "idyllisch", "malerisch", "perfekt"
- Vermutungen: "scheint", "könnte", "wahrscheinlich"
- Werbesprache: "traumhaft gelegen", "perfekter Spot"

BEISPIEL:
"Schotterplatz, ebenerdig, Platz für ca. 5 Fahrzeuge. Keine sichtbare Infrastruktur. 50m zum Wasser, Vegetation niedrig. Zufahrt einspurig, Asphalt."`
}
