/**
 * KI-Prompt für Notizen (NoteForm)
 * Tab: "Note" in /veroeffentlichen
 * 
 * Foster Huntington Stil für alle Lifestyles
 */

import { LifestyleConfig, fosterHuntingtonStyle } from './lifestyles'

export interface NotePromptParams {
  title: string
  description?: string
  location?: string
  text?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
}

/**
 * Generiert den Foster Huntington Prompt für Notizen
 */
export const generateNotePrompt = (params: NotePromptParams): string => {
  const { title, description, location, text, imageDescriptions, lifestyleConfig } = params

  return `Du bist Foster Huntington und schreibst eine kurze Notiz für ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS:
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

VERMEIDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a.replace('[Lifestyle]', lifestyleConfig.vehicle)}`).join('\n')}

SCHREIBE EINE NOTIZ ÜBER: "${title}${description ? ' - ' + description : ''}"

STRUKTUR:
1. Moment: Was passiert gerade?
2. Gefühl: Wie fühlst du dich dabei?
3. Frage: Was möchtest du wissen oder teilen?

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location || 'Unbekannt'}
Kontext: ${text || 'Notiz'}

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

MAX 150 WÖRTER. Füge 3-5 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).
Kurz, direkt, authentisch. Wie ein Instagram-Post, aber ehrlich.`
}

/**
 * Bild-Analyse-Prompt für Note-Tab
 */
export const getNoteImageAnalysisPrompt = (lifestyleConfig: LifestyleConfig): string => {
  return `Beschreibe dieses Bild für eine authentische ${lifestyleConfig.vehicle}-Notiz. Fokus auf: Moment, Stimmung, was gerade passiert. Schreibe wie Foster Huntington - direkt, kurz, ehrlich.`
}
