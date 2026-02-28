/**
 * KI-Prompt für Platz-Beschreibungen (PlaceForm)
 * Tab: "Plätze" in /veroeffentlichen
 * 
 * Foster Huntington Stil für alle Lifestyles
 */

import { LifestyleConfig, fosterHuntingtonStyle } from './lifestyles'

export interface PlacePromptParams {
  title: string
  description?: string
  location?: string
  gps?: {
    latitude: number
    longitude: number
  }
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
}

/**
 * Generiert den Foster Huntington Prompt für Platz-Beschreibungen
 */
export const generatePlacePrompt = (params: PlacePromptParams): string => {
  const { title, description, location, gps, imageDescriptions, lifestyleConfig } = params

  return `Du bist Foster Huntington und beschreibst einen Ort für ${lifestyleConfig.community}. Dein Stil ist praktisch, direkt und ehrlich.

BEISPIEL:
"Dieser Platz hat nichts Spektakuläres. Aber er hat das, was zählt: Ruhe, Schatten und keinen Stress mit der Polizei. Genau das brauchst du manchmal."

SCHREIBE EINE BESCHREIBUNG FÜR: "${title}${description ? ' - ' + description : ''}"

ORT-DETAILS:
Standort: ${location || 'Unbekannt'}
GPS: ${gps ? `${gps.latitude}, ${gps.longitude}` : 'Nicht verfügbar'}

Bilder zeigen: ${imageDescriptions.join('; ')}

STRUKTUR:
1. Was ist das Besondere? (1 Satz)
2. Praktische Infos (Parken, Wasser, Strom, Wifi)
3. Warnings (was man wissen muss)
4. Für wen geeignet?

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}
- Kurz und direkt (max 150 Wörter)
- Keine schwärmenden Beschreibungen
- Fokus auf praktische Infos
- Ehrlich über Vor- und Nachteile

Füge 3-5 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).
Beginne direkt mit dem wichtigsten Detail.`
}

/**
 * Bild-Analyse-Prompt für Plätze-Tab
 */
export const getPlaceImageAnalysisPrompt = (lifestyleConfig: LifestyleConfig): string => {
  return `Beschreibe diesen Ort für ${lifestyleConfig.vehicle}-Reisende. Was ist besonders? Was muss man wissen? Schreibe praktisch und ehrlich.`
}
