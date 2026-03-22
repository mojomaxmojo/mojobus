import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

// ===== PROMPTS AUS src/config/prompts/ IMPORTIEREN =====
// Alle Prompts sind zentral in src/config/prompts/ definiert
// Bei Änderungen: NUR dort ändern, nicht hier!
import {
  getLifestyleConfig,
  getGenderPromptAddition,
  generateMediaPrompt,
  generateTripPrompt,
  generateArticlePrompt,
  generateNotePrompt,
  generatePlacePrompt,
  getMediaImageAnalysisPrompt,
  getMediaVideoAnalysisPrompt,
  getTripImageAnalysisPrompt,
  getArticleImageAnalysisPrompt,
  getNoteImageAnalysisPrompt,
  getPlaceImageAnalysisPrompt
} from '../src/config/prompts/index.js'

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max pro Bild
})

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// Hilfsfunktion: Input sanitization
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') return ''
  return input.trim().substring(0, 500) // Max 500 Zeichen
}

// Hilfsfunktion: API-Key validieren
const validateApiKey = () => {
  if (!process.env.GROQ_API_KEY) {
    console.error('[KI] GROQ_API_KEY fehlt in Umgebungsvariablen')
    return false
  }
  return true
}

// Hilfsfunktion für sicheres JSON-Parsing
const safelyParseJSON = (str) => {
  if (!str) return null
  try {
    return JSON.parse(str)
  } catch (e) {
    return null
  }
}

// ===== PROMPT FUNKTIONEN WERDEN AUS src/config/prompts/ IMPORTIERT =====
// Siehe: src/config/prompts/index.js
// - generateMediaPrompt() → Medien-Tab (media.js)
// - generateTripPrompt() → Trips-Tab (trips.js)
// - generateArticlePrompt() → Berichte-Tab (articles.js)
// - generateNotePrompt() → Note-Tab (notes.js)
// - generatePlacePrompt() → Plätze-Tab (place.js)

// ===== KI-MODELL FUNKTION =====
const generateWithModel = async (prompt, model = 'llama4', lifestyle = 'vanlife', options = {}) => {
  const startTime = Date.now()
  const lifestyleConfig = getLifestyleConfig(lifestyle)

  // Defaults die pro Tab überschrieben werden können
  const maxTokens = options.maxTokens || 700
  const temperature = options.temperature || 0.8

  try {
    if (model === 'claude') {
      // Claude Sonnet (Anthropic)
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY fehlt')
      }

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-sonnet-4-6',
        max_tokens: maxTokens,
        temperature,
        system: `Du schreibst wie Foster Huntington. Erste Person. Kurze Sätze. Keine Überschriften, kein Fettdruck, keine Listen. Keine Leseransprache, keine Tipps, keine Ausrufezeichen.`,
        messages: [{ role: 'user', content: prompt }]
      }, {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        timeout: 60000
      })

      const duration = Date.now() - startTime
      console.log(`[KI] Claude Sonnet generiert in ${duration}ms (maxTokens: ${maxTokens})`)
      return response.data.content[0].text

    } else {
      // Llama 4 Scout (Groq) - Standard
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'Du schreibst wie Foster Huntington. Erste Person. Kurze Sätze. Keine Überschriften, kein Fettdruck, keine Listen. Keine Leseransprache, keine Tipps, keine Ausrufezeichen.'
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature,
        top_p: 0.9
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 45000
      })

      const duration = Date.now() - startTime
      console.log(`[KI] Llama 4 Scout generiert in ${duration}ms (maxTokens: ${maxTokens})`)
      return response.data.choices[0].message.content
    }
  } catch (error) {
    console.error(`[KI] Fehler mit ${model}:`, error.response?.data || error.message)
    throw error
  }
}


// ===== API FÜR MEDIEN ARTIKEL GENERIERUNG =====
// Generiert authentische Artikel im Foster Huntington Stil
// Verwendet in: Medien-Tab der Publish-Seite
app.post('/api/generate-media-article', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Mein Abenteuer'
  const description = sanitizeInput(req.body.description) || ''
  const text = sanitizeInput(req.body.text) || 'Abenteuer Reise Freiheit'
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  const model = req.body.model || 'llama4' // Modell-Auswahl
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife' // Lifestyle-Typ
  const gender = sanitizeInput(req.body.gender) || 'neutral' // Gender: neutral/male/female
  const images = req.files

  // Zusätzliche Kontext-Felder für bessere KI-Generierung
  const mainCategory = sanitizeInput(req.body.mainCategory) || ''
  const subCategories = safelyParseJSON(req.body.subCategories) || []
  const detailedTags = safelyParseJSON(req.body.detailedTags) || []
  const additionalImageUrls = sanitizeInput(req.body.additionalImageUrls) || ''
  const manualTags = safelyParseJSON(req.body.manualTags) || []
  const country = sanitizeInput(req.body.country) || ''

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Media-Artikel: "${title}", Bilder: ${images.length}, Standort: ${location}, Modell: ${model}, Lifestyle: ${lifestyle}`)
  console.log(`[KI] Kontext: Kategorie=${mainCategory}, SubTags=${subCategories.length}, DetailTags=${detailedTags.length}, ManualTags=${manualTags.length}`)

    try {
      // ===== BILD UND VIDEO ANALYSE FÜR MEDIEN ARTIKEL =====
      // Prompt: siehe src/config/prompts/media.ts
      const lifestyleConfig = getLifestyleConfig(lifestyle)
      
      // Trenne Bilder und Videos
      const imageFiles = images.filter(img => img.mimetype.startsWith('image/'))
      const videoFiles = images.filter(img => img.mimetype.startsWith('video/'))
      
      console.log(`[KI] Medien-Analyse: ${imageFiles.length} Bilder, ${videoFiles.length} Videos`)
      
      // ===== BILD ANALYSE =====
      const imageDescriptions = await Promise.all(imageFiles.map(async (img) => {
        const base64 = img.buffer.toString('base64')
        console.log(`[KI] Analysiere Bild, Größe: ${(img.size / 1024).toFixed(1)}KB`)

        const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: getMediaImageAnalysisPrompt(lifestyleConfig) },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }],
          max_tokens: 150,
          temperature: 0.7
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 30000
        })
        return visionResponse.data.choices[0].message.content
      }))
      
      // ===== VIDEO ANALYSE FÜR MEDIEN ARTIKEL =====
      // Verwendet OpenRouter API mit Google Gemini 2.5 Flash (kostengünstig)
      const videoDescriptions = await Promise.all(videoFiles.map(async (video) => {
        const base64 = video.buffer.toString('base64')
        console.log(`[KI] Analysiere Video, Größe: ${(video.size / 1024 / 1024).toFixed(2)}MB, Typ: ${video.mimetype}`)
        
        // OpenRouter API für Video-Analyse
        const videoResponse = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: 'google/gemini-2.5-flash',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: getMediaVideoAnalysisPrompt(lifestyleConfig) },
              { 
                type: 'video_url', 
                video_url: { 
                  url: `data:${video.mimetype};base64,${base64}` 
                } 
              }
            ]
          }],
          max_tokens: 300,
          temperature: 0.7
        }, {
          headers: { 
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // Videos brauchen mehr Zeit
        })
        return videoResponse.data.choices[0].message.content
      }))
      
      // Kombiniere Bild- und Video-Beschreibungen
      const allDescriptions = [...imageDescriptions, ...videoDescriptions]

    console.log(`[KI] ${allDescriptions.length} Medien analysiert (${imageDescriptions.length} Bilder, ${videoDescriptions.length} Videos)`)

    // ===== FOSTER HUNTINGTON STIL PROMPT =====
    // Generiert mit: generateMediaPrompt() - importiert aus src/config/prompts/media.js
    const prompt = generateMediaPrompt({
      title,
      description,
      location,
      text,
      imageDescriptions: allDescriptions,
      lifestyleConfig,
      mainCategory,
      subCategories,
      detailedTags,
      additionalImageUrls,
      manualTags,
      country,
      gender
    })

    // Artikel generieren – MEDIEN: max 150 Tokens (35-50 Wörter + Hashtags)
    const article = await generateWithModel(prompt, model, lifestyle, {
      maxTokens: 150,
      temperature: 0.7
    })

    // Hashtags extrahieren (verbessert)
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    console.log(`[KI] Media-Post generiert: ${article.length} Zeichen, Hashtags: ${uniqueHashtags.length}`)

    res.json({
      article,
      hashtags: uniqueHashtags.join(' '),
      model,
      lifestyle,
      imageDescriptions: allDescriptions, // Bild- und Video-Beschreibungen kombiniert
      videoDescriptions: videoDescriptions.length > 0 ? videoDescriptions : undefined // Separat für Frontend-Debugging
    })
  } catch (error) {
    console.error('[KI] Fehler bei Media-Artikel-Generierung:', error.response?.data || error.message)

    if (error.response?.status === 429) {
      res.status(429).json({ error: 'API-Limit erreicht. Bitte warte einen Moment.' })
    } else if (error.response?.status === 400) {
      res.status(400).json({ error: 'Ungültige Anfrage. Prüfe deine Eingaben.' })
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Zeitüberschreitung. Versuche es erneut.' })
    } else {
      res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
    }
  }
})

// ===== API FÜR TRIP ARTIKEL GENERIERUNG =====
// Generiert zusammenhängende Reiseberichte im Foster Huntington Stil
// Verwendet in: Trips-Tab der Publish-Seite
app.post('/api/generate-trip', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Meine Reise'
  const description = sanitizeInput(req.body.description) || ''
  const locations = req.body.locations ? JSON.parse(req.body.locations) : []
  const startDate = sanitizeInput(req.body.startDate) || ''
  const endDate = sanitizeInput(req.body.endDate) || ''
  const model = req.body.model || 'llama4' // Modell-Auswahl
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife' // Lifestyle-Typ
  const gender = sanitizeInput(req.body.gender) || 'neutral' // Gender: neutral/male/female
  const images = req.files

  // Zusätzliche Kontext-Felder
  const tripType = sanitizeInput(req.body.tripType) || ''
  const stationDescriptions = safelyParseJSON(req.body.stationDescriptions) || []
  const tripLength = sanitizeInput(req.body.tripLength) || 'medium'

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Trip-Artikel: "${title}", Bilder: ${images.length}, Stationen: ${locations.length}, Modell: ${model}, Lifestyle: ${lifestyle}, Länge: ${tripLength}`)
  if (tripType) console.log(`[KI] Trip-Typ: ${tripType}`)
  if (stationDescriptions.length > 0) console.log(`[KI] Station-Beschreibungen: ${stationDescriptions.length}`)

    try {
      // ===== BILD ANALYSE FÜR TRIP ARTIKEL =====
      // Prompt: siehe src/config/prompts/trips.ts
      const lifestyleConfig = getLifestyleConfig(lifestyle)
      const imageDescriptions = await Promise.all(images.map(async (img, index) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild ${index + 1}/${images.length}, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
             { type: 'text', text: getTripImageAnalysisPrompt(lifestyleConfig, tripLength, tripType) },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }],
        max_tokens: 150,
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 30000
      })

      const desc = visionResponse.data.choices[0].message.content
      console.log(`[KI] Bild ${index + 1} analysiert: ${desc.substring(0, 50)}...`)
      return desc
    }))

    // ===== FOSTER HUNTINGTON TRIP PROMPT =====
    // Generiert mit: generateTripPrompt() - importiert aus src/config/prompts/trips.js
    const prompt = generateTripPrompt({
      title,
      description,
      locations,
      startDate,
      endDate,
      imageDescriptions,
      lifestyleConfig,
      tripType,
      stationDescriptions, // [{location, description}] – wird in trips.js als stationDescriptions gelesen
      stations: locations,  // string[] – Fallback wenn keine Beschreibungen
      tripLength,
      gender
    })

    // Trips: maxTokens abhängig von tripLength
    const tripMaxTokens = tripLength === 'short' ? 500 : tripLength === 'medium' ? 1400 : 2500
    const article = await generateWithModel(prompt, model, lifestyle, {
      maxTokens: tripMaxTokens,
      temperature: 0.8
    })
    console.log(`[KI] Trip-Artikel generiert: ${article.length} Zeichen (maxTokens: ${tripMaxTokens})`)

    // Hashtags extrahieren
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      article,
      imageDescriptions,
      hashtags: uniqueHashtags.join(' '),
      lifestyle,
      tripLength
    })
  } catch (error) {
    console.error('[KI] Fehler bei Trip-Generierung:', error.response?.data || error.message)

    if (error.response?.status === 429) {
      res.status(429).json({ error: 'API-Limit erreicht. Bitte warte einen Moment.' })
    } else if (error.response?.status === 400) {
      res.status(400).json({ error: 'Ungültige Anfrage. Prüfe deine Eingaben.' })
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({ error: 'Zeitüberschreitung. Versuche es erneut.' })
    } else {
      res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
    }
  }
})

// API für Video-Generierung (Platzhalter)
app.post('/api/generate-video', (req, res) => {
  const { article, imageUrls } = req.body
  console.log(`[KI] Video-Generierung angefordert: ${imageUrls?.length || 0} Bilder`)
  // Hier ffmpeg-Logik einfügen
  res.json({ videoUrl: 'placeholder.mp4' })
})

// ===== API FÜR BERICHT/ARTIKEL GENERIERUNG =====
// Tab: "Berichte" in /veroeffentlichen
app.post('/api/generate-article', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Mein Bericht'
  const description = sanitizeInput(req.body.description) || ''
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  // text NICHT durch sanitizeInput kürzen – der User-Text kann länger als 500 Zeichen sein
  const text = (req.body.text || '').trim()
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife'
  const gender = sanitizeInput(req.body.gender) || 'neutral' // Gender: neutral/male/female
  const images = req.files

  // Zusätzliche Kontext-Felder
  const category = sanitizeInput(req.body.category) || ''
  const tags = safelyParseJSON(req.body.tags) || []
  const country = sanitizeInput(req.body.country) || ''
  const articleLength = sanitizeInput(req.body.articleLength) || 'medium'
  // Bild-URLs aus dem MilkdownEditor-Markdown (bereits hochgeladen, öffentlich erreichbar)
  const markdownImageUrls = safelyParseJSON(req.body.markdownImageUrls) || []

  // Mindestens Titelbild ODER Markdown-Bilder erforderlich
  if ((!images || images.length === 0) && markdownImageUrls.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Bericht: "${title}", Titel-Bilder: ${images?.length || 0}, Markdown-Bilder: ${markdownImageUrls.length}, Modell: ${model}, Lifestyle: ${lifestyle}, Länge: ${articleLength}`)
  console.log(`[KI] Text-Länge: ${text.length} Zeichen`)
  if (category) console.log(`[KI] Kategorie: ${category}`)
  if (tags.length > 0) console.log(`[KI] Tags: ${tags.join(', ')}`)

  // Hilfsfunktion: Bild-URL downloaden → Base64
  const fetchImageAsBase64 = async (url) => {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024 // max 10MB
    })
    return Buffer.from(response.data).toString('base64')
  }

  // Hilfsfunktion: einzelnes Bild analysieren (Base64 → Beschreibung)
  const analyzeImageBase64 = async (base64, mimeType = 'image/jpeg') => {
    const lifestyleConfig = getLifestyleConfig(lifestyle)
    const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: getArticleImageAnalysisPrompt(lifestyleConfig, articleLength) },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
        ]
      }],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 30000
    })
    return visionResponse.data.choices[0].message.content
  }

  try {
    const lifestyleConfig = getLifestyleConfig(lifestyle)

    // ===== TITELBILD(ER) analysieren (hochgeladene Files) =====
    const uploadedImageDescriptions = images && images.length > 0
      ? await Promise.all(images.map(async (img) => {
          const base64 = img.buffer.toString('base64')
          const mimeType = img.mimetype || 'image/jpeg'
          console.log(`[KI] Analysiere Titelbild, Größe: ${(img.size / 1024).toFixed(1)}KB`)
          return analyzeImageBase64(base64, mimeType)
        }))
      : []

    // ===== MARKDOWN-BILDER analysieren (URLs von Blossom) =====
    // Max 5 Bilder aus dem Editor analysieren – mehr bringt wenig, kostet aber Zeit
    const markdownUrlsToAnalyze = markdownImageUrls.slice(0, 5)
    const markdownImageDescriptions = markdownUrlsToAnalyze.length > 0
      ? await Promise.allSettled(markdownUrlsToAnalyze.map(async (url, index) => {
          console.log(`[KI] Lade Markdown-Bild ${index + 1}/${markdownUrlsToAnalyze.length}: ${url.substring(0, 60)}...`)
          const base64 = await fetchImageAsBase64(url)
          // MIME-Type aus URL ableiten
          const mimeType = url.match(/\.(png)$/i) ? 'image/png'
            : url.match(/\.(webp)$/i) ? 'image/webp'
            : url.match(/\.(gif)$/i) ? 'image/gif'
            : 'image/jpeg'
          return analyzeImageBase64(base64, mimeType)
        }))
        .then(results => results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value)
        )
      : []

    if (markdownImageDescriptions.length > 0) {
      console.log(`[KI] ${markdownImageDescriptions.length} Markdown-Bilder analysiert`)
    }

    // Alle Bildbeschreibungen zusammenführen: Titelbild zuerst, dann Markdown-Bilder
    const imageDescriptions = [...uploadedImageDescriptions, ...markdownImageDescriptions]
    console.log(`[KI] Gesamt ${imageDescriptions.length} Bildbeschreibungen für Prompt`)

    // Foster Huntington Prompt für Berichte - importiert aus src/config/prompts/articles.js
    const prompt = generateArticlePrompt({
      title,
      description,
      location,
      text,
      imageDescriptions,
      lifestyleConfig,
      category,
      tags,
      country,
      articleLength,
      gender
    })

    // Berichte: maxTokens abhängig von articleLength
    const articleMaxTokens = articleLength === 'short' ? 500 : articleLength === 'medium' ? 1200 : 2500
    const article = await generateWithModel(prompt, model, lifestyle, {
      maxTokens: articleMaxTokens,
      temperature: 0.8
    })
    
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      article,
      hashtags: uniqueHashtags.join(' '),
      lifestyle,
      articleLength,
      imageDescriptions // Für Frontend-Feedback: wie viele Bilder analysiert wurden
    })
  } catch (error) {
    console.error('[KI] Fehler bei Bericht-Generierung:', error.response?.data || error.message)
    res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
  }
})

// ===== API FÜR PLATZ GENERIERUNG =====
// Tab: "Plätze" in /veroeffentlichen
app.post('/api/generate-place', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Mein Platz'
  // description NICHT kürzen – MilkdownEditor kann langen Text enthalten
  const description = (req.body.description || '').trim()
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  const gps_lat = sanitizeInput(req.body.gps_lat) || ''
  const gps_lon = sanitizeInput(req.body.gps_lon) || ''
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife'
  const gender = sanitizeInput(req.body.gender) || 'neutral'
  const images = req.files

  // Kontext-Felder
  const category = sanitizeInput(req.body.category) || ''
  const facilities = safelyParseJSON(req.body.facilities) || []
  const bestFor = safelyParseJSON(req.body.bestFor) || []
  const country = sanitizeInput(req.body.country) || ''
  const rating = sanitizeInput(req.body.rating) || ''
  const price = sanitizeInput(req.body.price) || ''
  // Zusätzliche Bild-URLs: hochgeladene Zusatzbilder + Markdown-Bilder aus description
  const additionalImageUrls = safelyParseJSON(req.body.additionalImageUrls) || []
  const markdownImageUrls = safelyParseJSON(req.body.markdownImageUrls) || []

  // Mindestens Titelbild ODER andere Bilder erforderlich
  const hasUploadedImages = images && images.length > 0
  const hasExtraImages = additionalImageUrls.length > 0 || markdownImageUrls.length > 0
  if (!hasUploadedImages && !hasExtraImages) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Platz-Beschreibung: "${title}", Titel-Bilder: ${images?.length || 0}, Zusatz-Bilder: ${additionalImageUrls.length}, Markdown-Bilder: ${markdownImageUrls.length}, GPS: ${gps_lat},${gps_lon}, Lifestyle: ${lifestyle}, Modell: ${model}`)
  if (rating) console.log(`[KI] Bewertung: ${rating} Sterne`)
  if (price) console.log(`[KI] Preis: ${price}`)

  // Hilfsfunktion: URL → Base64
  const fetchImageAsBase64 = async (url) => {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      maxContentLength: 10 * 1024 * 1024
    })
    return Buffer.from(response.data).toString('base64')
  }

  // Hilfsfunktion: Base64 → Bildbeschreibung
  const analyzeImageBase64 = async (base64, mimeType = 'image/jpeg') => {
    const lifestyleConfig = getLifestyleConfig(lifestyle)
    const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: getPlaceImageAnalysisPrompt(lifestyleConfig) },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
        ]
      }],
      max_tokens: 150,
      temperature: 0.7
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      timeout: 30000
    })
    return visionResponse.data.choices[0].message.content
  }

  try {
    const lifestyleConfig = getLifestyleConfig(lifestyle)

    // ===== TITELBILD(ER) analysieren =====
    const uploadedImageDescriptions = hasUploadedImages
      ? await Promise.all(images.map(async (img) => {
          const base64 = img.buffer.toString('base64')
          const mimeType = img.mimetype || 'image/jpeg'
          console.log(`[KI] Analysiere Titelbild, Größe: ${(img.size / 1024).toFixed(1)}KB`)
          return analyzeImageBase64(base64, mimeType)
        }))
      : []

    // ===== ZUSATZBILDER analysieren (hochgeladene URLs) =====
    // Max 3 Zusatzbilder – Platz-Beschreibung ist kurz, mehr Bilder bringen wenig
    const additionalUrlsToAnalyze = additionalImageUrls.slice(0, 3)
    const additionalImageDescriptions = additionalUrlsToAnalyze.length > 0
      ? await Promise.allSettled(additionalUrlsToAnalyze.map(async (url, index) => {
          console.log(`[KI] Lade Zusatzbild ${index + 1}/${additionalUrlsToAnalyze.length}: ${url.substring(0, 60)}...`)
          const base64 = await fetchImageAsBase64(url)
          const mimeType = url.match(/\.(png)$/i) ? 'image/png'
            : url.match(/\.(webp)$/i) ? 'image/webp'
            : 'image/jpeg'
          return analyzeImageBase64(base64, mimeType)
        }))
        .then(results => results.filter(r => r.status === 'fulfilled').map(r => r.value))
      : []

    // ===== MARKDOWN-BILDER aus description analysieren =====
    // Max 3 Markdown-Bilder – zusammen mit Zusatzbildern max 6 Bilder total
    const remainingSlots = Math.max(0, 3 - additionalImageDescriptions.length)
    const markdownUrlsToAnalyze = markdownImageUrls.slice(0, remainingSlots)
    const markdownImageDescriptions = markdownUrlsToAnalyze.length > 0
      ? await Promise.allSettled(markdownUrlsToAnalyze.map(async (url, index) => {
          console.log(`[KI] Lade Markdown-Bild ${index + 1}/${markdownUrlsToAnalyze.length}: ${url.substring(0, 60)}...`)
          const base64 = await fetchImageAsBase64(url)
          const mimeType = url.match(/\.(png)$/i) ? 'image/png'
            : url.match(/\.(webp)$/i) ? 'image/webp'
            : 'image/jpeg'
          return analyzeImageBase64(base64, mimeType)
        }))
        .then(results => results.filter(r => r.status === 'fulfilled').map(r => r.value))
      : []

    // Alle Bildbeschreibungen zusammenführen
    const imageDescriptions = [
      ...uploadedImageDescriptions,
      ...additionalImageDescriptions,
      ...markdownImageDescriptions
    ]
    console.log(`[KI] Gesamt ${imageDescriptions.length} Bildbeschreibungen für Platz-Prompt`)

    // Foster Huntington Prompt für Plätze - importiert aus src/config/prompts/place.js
    const prompt = generatePlacePrompt({
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
      rating,
      price,
      gender
    })

    // Plätze: max 300 Tokens (80-150 Wörter + Hashtags)
    const description_text = await generateWithModel(prompt, model, lifestyle, {
      maxTokens: 300,
      temperature: 0.75
    })

    const hashtags = description_text.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      description: description_text,
      hashtags: uniqueHashtags.join(' '),
      lifestyle,
      imageDescriptions
    })
  } catch (error) {
    console.error('[KI] Fehler bei Platz-Generierung:', error.response?.data || error.message)
    res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
  }
})

// ===== API FÜR NOTE GENERIERUNG =====
// Tab: "Note" in /veroeffentlichen
app.post('/api/generate-note', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

   const title = sanitizeInput(req.body.title) || 'Notiz'
  const description = sanitizeInput(req.body.description) || ''
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  const text = sanitizeInput(req.body.text) || ''
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife'
  const gender = sanitizeInput(req.body.gender) || 'neutral' // Gender: neutral/male/female
  const images = req.files

  // Zusätzliche Kontext-Felder
  const country = sanitizeInput(req.body.country) || ''

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Notiz: "${title}", Bilder: ${images.length}, Lifestyle: ${lifestyle}`)

  try {
    const lifestyleConfig = getLifestyleConfig(lifestyle)
    
    // Bilder analysieren
    const imageDescriptions = await Promise.all(images.map(async (img) => {
      const base64 = img.buffer.toString('base64')
      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: getNoteImageAnalysisPrompt(lifestyleConfig) },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }],
        max_tokens: 100,
        temperature: 0.7
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 30000
      })
      return visionResponse.data.choices[0].message.content
    }))

    // Foster Huntington Prompt für Notizen - importiert aus src/config/prompts/notes.js
    const prompt = generateNotePrompt({
      title,
      description,
      location,
      text,
      imageDescriptions,
      lifestyleConfig,
      country,
      gender
    })

    // Notizen: max 120 Tokens (20-80 Wörter + Hashtags)
    const note = await generateWithModel(prompt, model, lifestyle, {
      maxTokens: 120,
      temperature: 0.7
    })
    
    const hashtags = note.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      note,
      hashtags: uniqueHashtags.join(' '),
      lifestyle
    })
  } catch (error) {
    console.error('[KI] Fehler bei Notiz-Generierung:', error.response?.data || error.message)
    res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
  }
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    groqApiKey: process.env.GROQ_API_KEY ? 'configured' : 'missing',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    openrouterApiKey: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`[Server] Backend läuft auf Port ${PORT}`)
  console.log(`[Server] GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
  console.log(`[Server] ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
  console.log(`[Server] OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ Konfiguriert (für Video-Analyse)' : '✗ Fehlt (Video-Analyse nicht verfügbar)'}`)
})