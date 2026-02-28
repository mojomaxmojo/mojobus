/**
 * KI-Prompt für Medien-Artikel (MediaUploadForm)
 * Tab: "Medien" in /veroeffentlichen
 * 
 * Foster Huntington Stil für alle Lifestyles
 */

import { LifestyleConfig, fosterHuntingtonStyle } from './lifestyles'

export interface MediaPromptParams {
  title: string
  description?: string
  location?: string
  text?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
}

/**
 * Generiert den Foster Huntington Prompt für Medien-Artikel
 */
export const generateMediaPrompt = (params: MediaPromptParams): string => {
  const { title, description, location, text, imageDescriptions, lifestyleConfig } = params

  return `Du bist Foster Huntington und schreibst für deine ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS (authentisch Foster Huntington):
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

"${lifestyleConfig.example3}"

VERMEIDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a.replace('[Lifestyle]', lifestyleConfig.vehicle)}`).join('\n')}

SCHREIBE EINEN ARTIKEL ÜBER: "${title}${description ? ' - ' + description : ''}"

STRUKTUR:
1. Öffne mit einem konkreten, persönlichen Moment
2. Erzähl eine kleine, echte Geschichte
3. Gib einen praktischen Tipp aus der Erfahrung
4. Stelle eine Frage, die den Leser einbindet
5. Schließe ehrlich (mit den Schwierigkeiten)

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location || 'Unbekannt'}
Stichworte: ${text || 'Abenteuer Reise Freiheit'}

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

MAX 300 WÖRTER. Füge 5-8 echte Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).
Beginne direkt mit einem persönlichen Moment. Keine Einleitung wie "In diesem Artikel...".`
}

/**
 * Bild-Analyse-Prompt für Medien-Tab
 */
export const getMediaImageAnalysisPrompt = (lifestyleConfig: LifestyleConfig): string => {
  return `Beschreibe dieses Bild für einen authentischen ${lifestyleConfig.vehicle}-Artikel. Fokus auf: echte Atmosphäre (nicht Instagram), was wirklich passiert, besondere Details, Emotionen. Schreibe wie Foster Huntington - direkt, ehrlich, keine perfekten Beschreibungen.`
}
