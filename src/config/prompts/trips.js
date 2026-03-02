/**
 * KI-Prompt für Trip-Artikel (TripForm)
 * Tab: "Trips" in /veroeffentlichen
 *
 * Foster Huntington Stil für alle Lifestyles
 * Erweitert mit Kontext-Feldern: tripType, stationDescriptions
 */

import { fosterHuntingtonStyle } from './lifestyles.js'

/**
 * Generiert den Foster Huntington Prompt für Trip-Artikel
 */
export const generateTripPrompt = (params) => {
  const {
    title,
    description,
    locations,
    startDate,
    endDate,
    imageDescriptions,
    lifestyleConfig,
    tripType,
    stationDescriptions
  } = params

  // Baue Kontext-Informationen zusammen
  let contextInfo = ''
  if (tripType) contextInfo += `\nArt der Reise: ${tripType}`

  // Station-Beschreibungen mit Benutzer-Input kombinieren
  let stationDetails = ''
  if (stationDescriptions && stationDescriptions.length > 0) {
    stationDetails = '\n\nBENUTZER-STATION-BESCHREIBUNGEN:\n' +
      stationDescriptions.map((s, i) => `${i + 1}. ${s.location}: ${s.description}`).join('\n')
  }

  return `Du bist Foster Huntington und schreibst einen Reisebericht für ${lifestyleConfig.community}. Dein Stil ist ehrlich, persönlich und direkt - keine perfekten Urlaubsgeschichten, sondern echte Erlebnisse.

BEISPIEL DEINES STILS (authentisch Foster Huntington):
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

VERMEIDE IN REISEBERICHTEN:
- "Wir genossen den wunderschönen Sonnenuntergang"
- "Es war ein unvergessliches Erlebnis"
- "Als Reisender musst du unbedingt..."
- Zu positive, polierte Geschichten

SCHREIBE EINEN REISEBERICHT ÜBER: "${title}${description ? ' - ' + description : ''}"
${contextInfo}

REISE-DETAILS:
Zeitraum: ${startDate || 'unbestimmt'} bis ${endDate || 'unbestimmt'}
Stationen: ${locations.length > 0 ? locations.join(' → ') : imageDescriptions.length + ' Stationen'}

STATIONEN-BESCHREIBUNGEN (aus Bildern analysiert):
${imageDescriptions.map((desc, i) => `Station ${i + 1}: ${desc}`).join('\n')}${stationDetails}

STRUKTUR DES BERICHTS:
1. EINLEITUNG: Warum bist du losgefahren? Was war die Motivation?
2. CHRONOLOGIE: Erzähl die Stationen in Reihenfolge - was war gut, was war scheiße
3. PERSÖNLICHE MOMENTE: Teile echte Gefühle, nicht nur schöne Fotos
4. PRAKTISCHE TIPPS: Was würden andere Reisende wissen wollen?
5. FAZIT: Würdest du es wieder machen? Was hast du gelernt?

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}
- Ehrlich über Schwierigkeiten (Wetter, Parkplatzsuche, Reparaturen)
- Persönliche Anekdoten statt generischer Beschreibungen
- Direkte Fragen an den Leser: "Kennst du das?"
- Humor und Selbstironie
- Verwende "Ich" statt "Man"

LÄNGE: 300-500 Wörter
HASHTAGS: 5-8 relevante Hashtags am Ende (inklusive #${lifestyleConfig.keywords[0]})
SPRACHE: Deutsch, authentisch, wie ein Gespräch

Beginne direkt mit deiner Abreise oder einem konkreten Moment. Keine Einleitung wie "In diesem Reisebericht...".`
}

/**
 * Bild-Analyse-Prompt für Trips-Tab
 */
export const getTripImageAnalysisPrompt = (lifestyleConfig) => {
  return `Beschreibe diese Station ehrlich für einen ${lifestyleConfig.vehicle}-Reisebericht. Was ist wirklich besonders? Atmosphäre? Herausforderungen? Menschen? Schreibe authentisch, nicht touristisch - wie für andere Reisende.`
}
