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

  return `Du bist Foster Huntington und beschreibst einen Ort für ${lifestyleConfig.community}. Dein Stil ist praktisch, direkt und ehrlich.

BEISPIEL:
"Dieser Platz hat nichts Spektakuläres. Aber er hat das, was zählt: Ruhe, Schatten und keinen Stress mit der Polizei. Genau das brauchst du manchmal."

SCHREIBE EINE BESCHREIBUNG FÜR: "${title}${description ? ' - ' + description : ''}"
${contextInfo}

ORT-DETAILS:
Standort: ${location}${country ? `, ${country}` : ''}
GPS: ${gps_lat && gps_lon ? `${gps_lat}, ${gps_lon}` : 'Nicht verfügbar'}

Bilder zeigen: ${imageDescriptions.join('; ')}

STRUKTUR:
1. Was ist das Besondere? (1 Satz)
2. Praktische Infos (Parken, Wasser, Strom, Wifi)
3. Warnings (was man wissen muss)
4. Für wen geeignet?

SCHREIBSTIL:
- Kurz und direkt (max 150 Wörter)
- Keine schwärmenden Beschreibungen
- Fokus auf praktische Infos
- Ehrlich über Vor- und Nachteile

Füge 3-5 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).`
}

/**
 * Bild-Analyse-Prompt für Place-Tab
 */
export const getPlaceImageAnalysisPrompt = (lifestyleConfig) => {
  return `Beschreibe diesen Ort für ${lifestyleConfig.community}. Fokus auf: Was sieht man? Parkmöglichkeit? Infrastruktur? Umgebung? Schreibe praktisch und direkt.`
}
