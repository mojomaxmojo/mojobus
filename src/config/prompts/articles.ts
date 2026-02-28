/**
 * KI-Prompt für Artikel/Berichte (ArticleForm)
 * Tab: "Berichte" in /veroeffentlichen
 *
 * Foster Huntington Stil für alle Lifestyles
 * Erweitert mit Kontext-Feldern: category, tags, country
 */

import { LifestyleConfig, fosterHuntingtonStyle } from './lifestyles'

export interface ArticlePromptParams {
  title: string
  description?: string
  location?: string
  text?: string
  imageDescriptions: string[]
  lifestyleConfig: LifestyleConfig
  // Zusätzliche Kontext-Felder
  category?: string
  tags?: string[]
  country?: string
}

/**
 * Generiert den Foster Huntington Prompt für Berichte-Artikel
 */
export const generateArticlePrompt = (params: ArticlePromptParams): string => {
  const {
    title,
    description,
    location,
    text,
    imageDescriptions,
    lifestyleConfig,
    category,
    tags,
    country
  } = params

  // Baue Kontext-Informationen zusammen
  let contextInfo = ''
  if (category) contextInfo += `\nKategorie: ${category}`
  if (tags && tags.length > 0) contextInfo += `\nTags: ${tags.join(', ')}`
  if (country) contextInfo += `\nLand: ${country}`

  return `Du bist Foster Huntington und schreibst einen Bericht für ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS:
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

VERMEIDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a.replace('[Lifestyle]', lifestyleConfig.vehicle)}`).join('\n')}

SCHREIBE EINEN BERICHT ÜBER: "${title}${description ? ' - ' + description : ''}"
${contextInfo}

STRUKTUR:
1. Hook: Beginne mit einer starken Aussage oder Frage
2. Problem: Was war die Herausforderung?
3. Lösung: Wie hast du es gelöst?
4. Lektion: Was hast du gelernt?
5. Call-to-Action: Frage an die Community

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location || 'Unbekannt'}${country ? `, ${country}` : ''}
Kontext: ${text || 'Bericht'}${tags && tags.length > 0 ? `\nSchlagworte: ${tags.join(', ')}` : ''}

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
