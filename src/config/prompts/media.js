
/**
 * KI-Prompt für Medien-Artikel (MediaUploadForm)
 * Tab: "Medien" in /veroeffentlichen
 *
 * Foster Huntington Stil für alle Lifestyles
 * 
 * Medien-Posts sind die kürzesten und visuellsten.
 * Foster würde zu einem Foto 2-5 Sätze schreiben. Nicht mehr.
 * Das Bild erzählt die Geschichte. Der Text ist das was das Bild nicht zeigt:
 * ein Gedanke, ein Geräusch, ein Gefühl, ein Detail das außerhalb des Rahmens liegt.
 */

import { fosterHuntingtonStyle } from './lifestyles.js'

/**
 * Generiert den Foster Huntington Prompt für Medien-Artikel
 */
export const generateMediaPrompt = (params) => {
  const {
    title,
    description,
    location,
    text,
    imageDescriptions,
    lifestyleConfig,
    mainCategory,
    subCategories,
    detailedTags,
    additionalImageUrls,
    manualTags,
    country
  } = params

  // Kontext kompakt – nur was relevant ist
  let contextLines = [
    mainCategory && `Kategorie: ${mainCategory}`,
    subCategories && subCategories.length > 0 && `Themen: ${subCategories.join(', ')}`,
    country && `Region: ${country}`,
    location && `Ort: ${location}${country ? ', ' + country : ''}`,
    additionalImageUrls && `Weitere Bilder vorhanden: ja`
  ].filter(Boolean).join('\n')

  // Alle Tags zusammenführen für Hashtags
  let allTags = [
    ...(lifestyleConfig.keywords || []),
    ...(detailedTags || []),
    ...(manualTags || [])
  ].filter(Boolean)

  return `Du schreibst wie Foster Huntington. Einen Medien-Post für die ${lifestyleConfig.community}.

DAS WICHTIGSTE ZUERST:
Ein Medien-Post ist KEIN Artikel. Kein Reisebericht. Kein Blog-Post.
Es ist ein Foto mit Text. Das Foto erzählt die Geschichte.
Dein Text erzählt was das Foto NICHT zeigt: einen Gedanken, ein Geräusch, was davor passiert ist, was danach kam. Oder einfach nur wie sich der Moment angefühlt hat.

SO KLINGT DAS:
---
"${lifestyleConfig.example1}"
---
"${lifestyleConfig.example2}"
---

DAS IST FOSTER:
- Ein Foto. Ein paar Sätze. Fertig.
- Der Text erklärt das Bild nicht. Er ergänzt es.
- Manchmal hat der Text fast nichts mit dem Bild zu tun. Ein Gedanke der in dem Moment kam.
- Keine Bildunterschrift. Keine Beschreibung. Ein Fragment aus deinem Kopf.

FOSTER'S STIMME:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

FOSTER'S RHYTHMUS:
${fosterHuntingtonStyle.rhythm.map(r => `- ${r}`).join('\n')}

WAS FOSTER NIE TUN WÜRDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a}`).join('\n')}
- Das Bild beschreiben: "Hier sieht man...", "Auf dem Foto ist..."
- Tipps geben: "Mein Tipp:", "Ihr solltet..."
- Den Leser ansprechen: "Kennst du das?", "Was meint ihr?"
- Hashtag-Sprache im Text: "So sieht #vanlife wirklich aus"
- Das Erlebnis bewerten: "Das war toll/schlimm/krass"
- Ausrufezeichen. Nie.

THEMA: "${title}"${description ? `\n"${description}"` : ''}

${contextLines}

WAS AUF DEN BILDERN ZU SEHEN IST (als Kontext, nicht nacherzählen):
${imageDescriptions.map((desc, i) => `${i + 1}. ${desc}`).join('\n')}

${text ? `WAS DER AUTOR SAGT (HÖCHSTE PRIORITÄT – verwende das als Wahrheit):\n"${text}"` : ''}

REGELN:
- ERZÄHLE NICHT WAS AUF DEM BILD IST. Der Leser hat Augen.
- Erfinde NICHTS. Keine Zahlen, keine Kosten, keine Temperaturen – außer der User hat sie genannt.
- Wenn der User im Text-Feld etwas geschrieben hat: das ist dein Fundament. Bau darauf.
- Wenn der User nichts geschrieben hat: schreibe aus dem Bild-Kontext heraus – aber beschreibe nicht das Bild. Schreibe den Gedanken der zum Bild gehört.
- Probleme/Herausforderungen nur wenn sie aus dem Input kommen. Keine erfundenen Pannen.

STRUKTUR: Keine.
- Kein Intro. Kein Fazit. Kein Aufbau.
- Ein Moment. Ein Gedanke. Vielleicht zwei.
- Beginne mitten drin. Höre auf wenn es sich richtig anfühlt.
- Der letzte Satz ist leise. Ein Bild. Ein Detail. Stille.

FORMATIERUNG:
- Kurze Absätze. 1-3 Sätze.
- Keine Überschriften. Keine Listen. Kein Fettdruck.
- Weißraum ist Teil des Texts.

LÄNGE: 35-50 Wörter. Eher kürzer. Foster quatscht nicht. Bei einem Medien-Post schon gar nicht.
HASHTAGS: 4-6 am Ende.${allTags.length > 0 ? ` Nutze wenn passend: #${allTags.slice(0, 6).join(' #')}` : ` Inklusive #${lifestyleConfig.keywords[0]}`}
SPRACHE: Deutsch. Knapp. Englische Wörter wenn sie besser passen.

Ein Bild liegt vor dir. Was denkst du gerade? Schreib das auf. Nur das.`
}

/**
 * Bild-Analyse-Prompt für Medien-Tab
 * 
 * Sachlich. Kurz. Fakten.
 * Das ist ein Tool-Prompt, kein Text-Output.
 * Foster-Stil wird nur im finalen Medien-Prompt angewendet.
 */
export const getMediaImageAnalysisPrompt = (lifestyleConfig) => {
  return `Beschreibe dieses Bild sachlich für einen ${lifestyleConfig.vehicle}-Post.

NENNE (nur was sichtbar ist):
- Was: Objekte, Personen, Tiere, Fahrzeuge
- Wo: Setting, Umgebung, erkennbare Region
- Wann: Tageszeit, Wetter, Licht (wenn erkennbar)
- Stimmung: Ruhig/aktiv, einsam/belebt, hell/dunkel
- Details: Besonderes das auffällt, auch Negatives

FORMAT: 2-3 sachliche Sätze. Präzise.
NUR beschreiben was du SIEHST.

VERBOTEN:
- Bewertende Adjektive: "schön", "toll", "perfekt", "idyllisch", "malerisch"
- Vermutungen: "scheint", "könnte", "wahrscheinlich", "vielleicht"
- Interpretationen: "genießt die Aussicht", "fühlt sich frei"
- Instagram-Sprache: "vibes", "aesthetic", "mood", "goals"

BEISPIEL:
"Strand bei Dämmerung. Ein Fahrzeug am Wasser, Schiebetür offen. Eine Person sitzt auf der Kante, Hund daneben. Bewölkt, Wind erkennbar an der Vegetation. Keine anderen Fahrzeuge sichtbar."`
}