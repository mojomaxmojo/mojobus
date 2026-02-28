/**
 * KI-Prompt für Artikel/Berichte (ArticleForm)
 * Tab: "Berichte" in /veroeffentlichen
 * 
 * Foster Huntington Stil für alle Lifestyles
 */

import { LifestyleConfig, fosterHuntingtonStyle } from './lifestyles'

export interface ArticlePromptParams {
  title: string
  description?: string
  location?: string
  text?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
}

/**
 * Generiert den Foster Huntington Prompt für Berichte-Artikel
 */
export const generateArticlePrompt = (params: ArticlePromptParams): string => {
  const { title, description, location, text, imageDescriptions, lifestyleConfig } = params

  return `Du bist Foster Huntington und schreibst einen Bericht für ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS:
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

VERMEIDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a.replace('[Lifestyle]', lifestyleConfig.vehicle)}`).join('\n')}

SCHREIBE EINEN BERICHT ÜBER: "${title}${description ? ' - ' + description : ''}"

STRUKTUR:
1. Hook: Beginne mit einer starken Aussage oder Frage
2. Problem: Was war die Herausforderung?
3. Lösung: Wie hast du es gelöst?
4. Lektion: Was hast du gelernt?
5. Call-to-Action: Frage an die Community

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location || 'Unbekannt'}
Kontext: ${text || 'Bericht'}

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

MAX 300 WÖRTER. Füge 5-8 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).
Beginne direkt. Keine Einleitung wie "In diesem Bericht...".`
}

/**
 * Bild-Analyse-Prompt für Berichte-Tab
 */
export const getArticleImageAnalysisPrompt = (lifestyleConfig: LifestyleConfig): string => {
  return `Beschreibe dieses Bild für einen authentischen ${lifestyleConfig.vehicle}-Bericht. Fokus auf: Details, Problemlösung, praktische Aspekte. Schreibe wie Foster Huntington - direkt, ehrlich, informativ.`
}
