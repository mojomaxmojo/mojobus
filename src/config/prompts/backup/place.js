/**
 * KI-Prompt für Platz-Beschreibungen (PlaceForm)
 * Tab: "Plätze" in /veroeffentlichen
 *
 * Foster Huntington Stil für alle Lifestyles
 * Erweitert mit Kontext-Feldern: category, facilities, bestFor, country
 */

import { fosterHuntingtonStyle } from './lifestyles.js'

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
    country
  } = params

  // Baue Kontext-Informationen zusammen
  let contextInfo = ''
  if (category) contextInfo += `\nKategorie: ${category}`
  if (country) contextInfo += `\nLand: ${country}`
  if (facilities && facilities.length > 0) contextInfo += `\nEinrichtungen: ${facilities.join(', ')}`
  if (bestFor && bestFor.length > 0) contextInfo += `\nGeeignet für: ${bestFor.join(', ')}`

  return `Du bist Foster Huntington und beschreibst einen Ort für ${lifestyleConfig.community}. Dein Stil ist praktisch, direkt und ehrlich - keine Werbetexte, sondern echte Infos für Reisende.

BEISPIEL DEINES STILS:
"Dieser Platz hat nichts Spektakuläres. Aber er hat das, was zählt: Ruhe, Schatten und keinen Stress mit der Polizei. Genau das brauchst du manchmal."
→ Beachte: direkt, praktisch, ehrlich über Vor- und Nachteile

VERMEIDE UNBEDINGT:
- Klischees: "idyllisch gelegen", "traumhafte Aussicht", "paradiesischer Ort"
- Werbesprache: "ein Muss für jeden Reisenden", "absolut empfehlenswert"
- Vage Beschreibungen: "schöner Platz", "tolle Lage"
- Perfekte Beschreibungen ohne Nachteile

BESCHREIBE DEN ORT: "${title}${description ? ' - ' + description : ''}"
${contextInfo}

ORT-DETAILS:
Standort: ${location}${country ? `, ${country}` : ''}
GPS: ${gps_lat && gps_lon ? `${gps_lat}, ${gps_lon}` : 'Nicht verfügbar'}

BILD-DETAILS:
${imageDescriptions.map((desc, i) => `Bild ${i + 1}: ${desc}`).join('\n')}
${facilities && facilities.length > 0 ? `\nVorhandene Einrichtungen: ${facilities.join(', ')}` : ''}
${bestFor && bestFor.length > 0 ? `Geeignet für: ${bestFor.join(', ')}` : ''}

AUTHENTIZITÄTS-ANFORDERUNGEN:
- Mindestens 1 Nachteil/Warning erwähnen (Lärm, keine Versorgung, schwierige Zufahrt, etc.)
- Konkrete Details statt Adjektive: nicht "ruhiger Platz" → "3 Autos pro Stunde, nachts still"
- Praktische Infos: Zufahrt? Wasser? Strom? Handyempfang?
- Ehrlich über Vor- und Nachteile

FOSTER'S STIMME - SO SCHREIBST DU:
- Kurz und direkt
- Praktisch, nicht poetisch
- Ehrlich über Schwierigkeiten
- Fokus auf das, was Reisende wissen müssen
- Immer konkret: "2km Schotter" statt "schlechte Zufahrt"

STRUKTUR (kurz und praktisch):
1. Was ist das Besondere? (1 Satz, direkt)
2. Praktische Infos (Zufahrt, Infrastruktur, Versorgung)
3. Warnings (Lärm, Polizei, schwierige Bedingungen)
4. Für wen geeignet? (Van, Wohnmobil, Zelt, etc.)

LÄNGE: 100-150 Wörter
HASHTAGS: 3-5 relevante Hashtags am Ende (inklusive #${lifestyleConfig.keywords[0]})
SPRACHE: Deutsch, praktisch, wie eine ehrliche Empfehlung

WICHTIG: Starte direkt mit dem wichtigsten Punkt.
NICHT: "Dieser wunderschöne Platz liegt...", "Hier findet man..."
SONDERN: "Ruhiger Parkplatz, 500m vom Strand. Keine Infrastruktur, aber kostenlos."

Jetzt beschreibe den Ort - ehrlich, praktisch, direkt.`
}

/**
 * Bild-Analyse-Prompt für Place-Tab
 */
export const getPlaceImageAnalysisPrompt = (lifestyleConfig) => {
  return `Analysiere dieses Bild für eine ${lifestyleConfig.community}-Platzbeschreibung.

BESCHREIBE PRAKTISCH:
- Was ist zu sehen? (Oberfläche, Größe, Umgebung)
- Zufahrt: Schotter? Asphalt? Steil? Eng?
- Infrastruktur: Wasser? Strom? Mülleimer? Toiletten?
- Umgebung: Natur? Stadt? Strand? Wald?
- Parkmöglichkeiten: Wie viele Fahrzeuge? Größe?

SCHREIBSTIL:
- Faktisch, nicht romantisch
- 2-3 Sätze, präzise
- Fokus auf praktische Infos für Reisende
- Erwähne auch Nachteile (Dreck, Lärm, schwierige Zufahrt)

NICHT SCHREIBEN:
- "Wunderschön", "malerisch", "idyllisch", "traumhaft"
- Vermutungen: "scheint zu sein", "könnte", "vielleicht"
- Vage Beschreibungen: "ein schöner Ort", "tolle Aussicht"
- Werbesprache

BEISPIEL SCHLECHT: 
"Ein wunderschöner, idyllischer Parkplatz mit traumhafter Aussicht"

BEISPIEL GUT: 
"Schotterplatz, ca. 10 Vans. Ebenerdig, gute Zufahrt. Keine Infrastruktur. 200m zum Strand. Einheimische kommen morgens spazieren, sonst ruhig. Nachts dunkel."

Beschreibe jetzt den Ort - praktisch und ehrlich.`
}
