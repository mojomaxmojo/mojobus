import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { execFile, spawn } from 'child_process'
import { promisify } from 'util'
import crypto from 'crypto'
import os from 'os'
const execFileAsync = promisify(execFile)

// ── ffmpeg Pfade (AlmaLinux custom build) ──────────────────────────────────
const FFMPEG  = process.env.FFMPEG_PATH  || '/opt/bin/ffmpeg'
const FFPROBE = process.env.FFPROBE_PATH || '/opt/bin/ffprobe'
const MUSIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'music')
const TMP_DIR   = path.join(os.tmpdir(), 'slideshow')

// Temp-Ordner beim Start anlegen
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

// In-Memory Job-Store für Slideshow-Jobs
const slideshowJobs = new Map()
// { jobId: { status, progress, videoUrl, error, created } }

// ===== PROMPTS AUS src/config/prompts/ IMPORTIEREN =====
// Alle Prompts sind zentral in src/config/prompts/ definiert
// Bei Änderungen: NUR dort ändern, nicht hier!
import {
  getLifestyleConfig,
  getGenderPromptAddition,
  generateMediaPrompt,
  generateTripPrompt,
  generateTripCaptionPrompt,
  generateArticlePrompt,
  generateArticleSummaryPrompt,
  generateArticleTitlesPrompt,
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
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max pro Datei
    files: 30,                  // max 30 Dateien pro Request
    fieldSize: 1 * 1024 * 1024  // 1MB max pro Textfeld
  }
})

// Hilfsfunktion: Multer-Fehler als JSON zurückgeben
const handleMulterError = (err, req, res, next) => {
  if (err && err.code) {
    // Multer-spezifische Fehler
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: `Bild zu groß: max. 20MB pro Datei erlaubt. (${err.field || 'images'})` })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({ error: 'Zu viele Dateien: max. 30 Bilder erlaubt.' })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: `Unerwartetes Dateifeld: ${err.field}` })
    }
    if (err.code === 'LIMIT_FIELD_VALUE') {
      return res.status(400).json({ error: 'Textfeld zu lang.' })
    }
    return res.status(400).json({ error: `Upload-Fehler: ${err.message || err.code}` })
  }
  next(err)
}

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
const generateWithModel = async (prompt, model = 'llama4', lifestyle = 'mojobus', options = {}) => {
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
app.post('/api/generate-media-article', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    next()
  })
}, async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Mein Abenteuer'
  const description = sanitizeInput(req.body.description) || ''
  const text = sanitizeInput(req.body.text) || 'Abenteuer Reise Freiheit'
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  const model = req.body.model || 'llama4' // Modell-Auswahl
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'mojobus' // Lifestyle-Typ
  const gender = sanitizeInput(req.body.gender) || 'couple' // Gender: neutral/male/female/couple
  const images = req.files

  // Zusätzliche Kontext-Felder für bessere KI-Generierung
  const mainCategory = sanitizeInput(req.body.mainCategory) || ''
  const subCategories = safelyParseJSON(req.body.subCategories) || []
  const detailedTags = safelyParseJSON(req.body.detailedTags) || []
  const additionalImageUrls = sanitizeInput(req.body.additionalImageUrls) || ''
  const manualTags = safelyParseJSON(req.body.manualTags) || []
  const country = sanitizeInput(req.body.country) || ''
  const tripType = sanitizeInput(req.body.tripType) || ''

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Media-Artikel: "${title}", Bilder: ${images.length}, Standort: ${location}, Modell: ${model}, Lifestyle: ${lifestyle}`)
  console.log(`[KI] Kontext: Kategorie=${mainCategory}, SubTags=${subCategories.length}, DetailTags=${detailedTags.length}, ManualTags=${manualTags.length}`)
  if (tripType) console.log(`[KI] Trip-Typ: ${tripType}`)

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
      gender,
      tripType
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

// ===== /api/generate-trip → weiter unten definiert (vollständige Version) =====

// ===== API FÜR RUNWAY GEN-4 TURBO VIDEO-GENERIERUNG =====
// Tab: "Berichte" in /veroeffentlichen
// PPQ_API_KEY muss als Umgebungsvariable gesetzt sein
// Prompt wird automatisch aus Artikeldaten aufgebaut

app.post('/api/generate-video', async (req, res) => {
  const ppqKey = process.env.PPQ_API_KEY
  if (!ppqKey) {
    console.error('[Video] PPQ_API_KEY fehlt in Umgebungsvariablen')
    return res.status(500).json({ error: 'PPQ_API_KEY nicht konfiguriert auf dem Server.' })
  }

  const {
    imageUrl,       // Titelbild-URL → Start-Frame
    title,
    summary,
    location,
    country,
    lifestyle,
    tags,
    duration = '10',
    aspectRatio = '16:9'
  } = req.body

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl (Titelbild) ist erforderlich.' })
  }

  // ── Kling 2.5 Turbo I2V bei ppq.ai ──────────────────────────────────────
  // Modell: kling-2.5-turbo-i2v
  // Dauer:  5s ($0.23) oder 10s ($0.46)
  // Kein quality-Parameter — wird ignoriert
  // aspect_ratio: 16:9 oder 9:16
  const resolvedDuration = ['5', '10'].includes(String(duration)) ? String(duration) : '10'

  // Video-Prompt automatisch aus Artikeldaten aufbauen
  const lifestyleMap = {
    mojobus: 'vintage US bus life, oldtimer bus on the road, slow travel couple',
    vanlife: 'vanlife, van life on wheels, road trip',
    rvlife: 'RV life, recreational vehicle adventure',
    beachlife: 'beach life, surf and sun lifestyle',
    wohnmobil: 'motorhome, camper van travel',
    'perpetual-travelers': 'perpetual travel, nomadic lifestyle'
  }
  const lifestyleText = lifestyleMap[lifestyle] || 'travel'
  const locationText = location ? `, ${location}` : ''
  const countryText = country ? `, ${country}` : ''
  const titleText = title ? `. ${title}` : ''
  const summaryText = summary ? ` ${summary.slice(0, 120)}` : ''
  const tagsText = Array.isArray(tags) && tags.length > 0 ? `. ${tags.slice(0, 5).join(', ')}` : ''

  const videoPrompt = [
    'Cinematic travel video,',
    lifestyleText,
    locationText,
    countryText,
    titleText,
    summaryText,
    '. Smooth camera movement, golden light, authentic atmosphere',
    tagsText,
    '. High quality, cinematic, 4K look'
  ].join('').replace(/\s+/g, ' ').trim()

  console.log(`[Video] Starte Kling 2.5 Turbo I2V: "${title || 'Kein Titel'}", ${resolvedDuration}s, ${aspectRatio}`)
  console.log(`[Video] Prompt: ${videoPrompt.slice(0, 120)}...`)

  // Exakte Parameter die an ppq.ai gehen
  const ppqPayload = {
    model: 'kling-2.5-turbo-i2v',
    prompt: videoPrompt,
    image_url: imageUrl,
    aspect_ratio: aspectRatio,
    duration: resolvedDuration
  }
  console.log('[Video] ppq.ai Payload:', JSON.stringify(ppqPayload))

  try {
    // Schritt 1: Job bei ppq.ai einreichen
    const submitRes = await axios.post('https://api.ppq.ai/v1/videos', ppqPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ppqKey}`
      },
      timeout: 30000
    })

    const job = submitRes.data
    console.log('[Video] ppq.ai Job-Antwort vollständig:', JSON.stringify(job))

    // Job-ID zurückgeben – Frontend pollt dann /api/video-status/:id
    res.json({
      jobId: job.id,
      status: job.status,
      estimatedCost: job.estimated_cost,
      prompt: videoPrompt,
      sentParams: { duration: resolvedDuration, aspectRatio }
    })

  } catch (error) {
    // Vollständige ppq.ai Antwort loggen für Debugging
    const rawData = error.response?.data
    const httpStatus = error.response?.status

    console.error('[Video] HTTP Status:', httpStatus)
    console.error('[Video] ppq.ai Antwort (raw):', JSON.stringify(rawData, null, 2))
    console.error('[Video] Axios Fehler:', error.message)

    // Fehlertext sicher extrahieren (kein [object Object])
    let errMsg = error.message
    if (rawData) {
      if (typeof rawData === 'string') {
        errMsg = rawData
      } else if (typeof rawData.error === 'string') {
        errMsg = rawData.error
      } else if (typeof rawData.message === 'string') {
        errMsg = rawData.message
      } else if (typeof rawData.detail === 'string') {
        errMsg = rawData.detail
      } else {
        errMsg = JSON.stringify(rawData)
      }
    }

    if (httpStatus === 401) {
      res.status(401).json({ error: 'PPQ_API_KEY ungültig oder abgelaufen.', detail: errMsg })
    } else if (httpStatus === 402) {
      res.status(402).json({ error: 'Nicht genug Guthaben auf ppq.ai Account.', detail: errMsg })
    } else if (httpStatus === 429) {
      res.status(429).json({ error: 'API-Limit erreicht. Bitte kurz warten.', detail: errMsg })
    } else if (httpStatus === 422) {
      res.status(422).json({ error: `Ungültige Parameter für ppq.ai: ${errMsg}`, detail: errMsg })
    } else {
      res.status(500).json({ error: `Video-Job fehlgeschlagen (HTTP ${httpStatus || 'no-response'}): ${errMsg}` })
    }
  }
})

// ===== VIDEO STATUS POLLING =====
// Frontend pollt alle 6 Sekunden bis status === 'completed' oder 'failed'
app.get('/api/video-status/:jobId', async (req, res) => {
  const ppqKey = process.env.PPQ_API_KEY
  if (!ppqKey) {
    return res.status(500).json({ error: 'PPQ_API_KEY nicht konfiguriert.' })
  }

  const { jobId } = req.params
  if (!jobId || !jobId.startsWith('gen_')) {
    return res.status(400).json({ error: 'Ungültige Job-ID.' })
  }

  try {
    const pollRes = await axios.get(`https://api.ppq.ai/v1/videos/${jobId}`, {
      headers: { 'Authorization': `Bearer ${ppqKey}` },
      timeout: 15000
    })

    const data = pollRes.data
    console.log(`[Video] Status für ${jobId}: ${data.status}`)

    if (data.status === 'completed' && data.data?.url) {
      res.json({
        status: 'completed',
        videoUrl: data.data.url,
        cost: data.cost,
        jobId
      })
    } else if (data.status === 'failed') {
      res.json({
        status: 'failed',
        error: data.error || 'Video-Generierung fehlgeschlagen.',
        jobId
      })
    } else {
      // Noch in Bearbeitung
      res.json({
        status: data.status || 'processing',
        jobId
      })
    }

  } catch (error) {
    const rawData = error.response?.data
    const httpStatus = error.response?.status
    let errMsg = error.message
    if (rawData) {
      errMsg = typeof rawData === 'string' ? rawData
        : typeof rawData.error === 'string' ? rawData.error
        : typeof rawData.message === 'string' ? rawData.message
        : JSON.stringify(rawData)
    }
    console.error(`[Video] Polling-Fehler für ${jobId} (HTTP ${httpStatus}):`, errMsg)
    res.status(500).json({ error: `Status-Abfrage fehlgeschlagen: ${errMsg}` })
  }
})

// ===== SLIDESHOW GENERATOR =====
// Erstellt aus Artikel-Bildern ein Video mit Ken Burns / Deep Pan Effekten
// Musik: lokal (server/music/) oder ElevenLabs via ppq.ai
// ffmpeg: /opt/bin/ffmpeg

// ── Ken Burns / Deep Pan Effekte ──────────────────────────────────────────
// Jedes Bild bekommt einen anderen Effekt — abwechselnd, nie langweilig
const ZOOM_PAN_EFFECTS = [
  // Zoom In Mitte (klassisch)
  (d, fps) => `zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Zoom Out Mitte
  (d, fps) => `zoompan=z='if(eq(on,1),1.5,max(zoom-0.0015,1.0))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Pan Links → Rechts
  (d, fps) => `zoompan=z='1.3':x='iw/2-(iw/zoom/2)+on/${d * fps}*(iw-(iw/1.3))':y='ih/2-(ih/zoom/2)':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Pan Rechts → Links
  (d, fps) => `zoompan=z='1.3':x='iw-(iw/zoom)-on/${d * fps}*(iw-(iw/1.3))':y='ih/2-(ih/zoom/2)':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Deep Pan Oben → Unten (cineastisch)
  (d, fps) => `zoompan=z='1.4':x='iw/2-(iw/zoom/2)':y='0+on/${d * fps}*(ih-(ih/1.4))':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Deep Pan Unten → Oben
  (d, fps) => `zoompan=z='1.4':x='iw/2-(iw/zoom/2)':y='ih-(ih/zoom)-on/${d * fps}*(ih-(ih/1.4))':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Zoom In + Pan Diagonal (dramatisch)
  (d, fps) => `zoompan=z='min(zoom+0.001,1.4)':x='on/${d * fps}*(iw/4)':y='on/${d * fps}*(ih/4)':d=${d * fps}:s=1920x1080:fps=${fps}`,
  // Zoom Out + Pan Diagonal
  (d, fps) => `zoompan=z='if(eq(on,1),1.4,max(zoom-0.001,1.0))':x='iw/2-(iw/zoom/2)':y='ih-(ih/zoom)-on/${d * fps}*(ih/4)':d=${d * fps}:s=1920x1080:fps=${fps}`,
]

// ── Aspect Ratio → ffmpeg Größe ────────────────────────────────────────────
const ASPECT_SIZES = {
  '16:9': '1920x1080',
  '9:16': '1080x1920',
  '1:1':  '1080x1080',
}

// ── Lifestyle → ElevenLabs Musik-Prompt ───────────────────────────────────
// Hier die Musik-Stile für ElevenLabs anpassen.
// Format: kurze englische Beschreibung, Kommas trennen Eigenschaften.
// Tipps: Tempo (slow/mid/fast), Instrumente, Stimmung, Genre angeben.
// Beispiele: 'cinematic orchestral, epic, slow build, strings and brass'
//            'upbeat electronic, energetic, synth beats, modern'
//            'jazz lounge, smooth, piano and bass, relaxed evening'
const LIFESTYLE_MUSIC_PROMPTS = {
  // 🚌 MojoBus — Hauptprofil
  mojobus:
    'Vintage Americana, a leisurely road trip, the hum of a diesel engine, the open highway, deep house, progressive house, warm and weathered',

  // 🚐 Vanlife
  vanlife:
    'chill acoustic guitar, road trip vibes, slow tempo, warm sunset atmosphere, indie folk',

  // 🏕️ RV Life
  rvlife:
    'americana country folk, open road, relaxed tempo, guitar and harmonica',

  // 🏖️ Beach Life
  beachlife:
    'tropical chill, reggae influence, ocean waves, summer vibes, laid back',

  // 🇩🇪 Wohnmobil
  wohnmobil:
    'european cafe music, accordion, relaxed journey, soft piano',

  // ✈️ Perpetual Travelers
  'perpetual-travelers':
    'world music ambient, travel vibes, ethnic instruments, meditative journey',
}

// ── Lokale Musik nach Lifestyle wählen ────────────────────────────────────
function getLocalMusicFile(lifestyle) {
  if (!fs.existsSync(MUSIC_DIR)) return null
  const files = fs.readdirSync(MUSIC_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.ogg'))
  if (files.length === 0) return null

  // Erst lifestyle-spezifisch suchen
  const styleFiles = files.filter(f => f.toLowerCase().includes(lifestyle))
  const pool = styleFiles.length > 0 ? styleFiles : files

  // Zufällig aus Pool wählen
  return path.join(MUSIC_DIR, pool[Math.floor(Math.random() * pool.length)])
}

// ── Bild von URL downloaden ────────────────────────────────────────────────
async function downloadImage(url, destPath) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: { 'User-Agent': 'MojoBus-Slideshow/1.0' }
  })
  fs.writeFileSync(destPath, response.data)
  return destPath
}

// ── ElevenLabs Musik generieren via ppq.ai ────────────────────────────────
async function generateElevenLabsMusic(lifestyle, durationSeconds, ppqKey) {
  const prompt = LIFESTYLE_MUSIC_PROMPTS[lifestyle] || LIFESTYLE_MUSIC_PROMPTS['mojobus']
  const duration = Math.min(durationSeconds + 4, 180) // +4s für Fade, max 180s
  console.log(`[ElevenLabs] Musik generieren: prompt="${prompt}", duration=${duration}s`)
  console.log(`[ElevenLabs] API-Key vorhanden: ${ppqKey ? 'ja (' + ppqKey.slice(0,8) + '...)' : 'NEIN!'}`)

  let response
  try {
    response = await axios.post('https://api.ppq.ai/v1/audio/generations', {
      model: 'elevenlabs-music-v1',
      prompt,
      duration_seconds: duration
    }, {
      headers: {
        'Authorization': `Bearer ${ppqKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 180000 // 3 Minuten — ElevenLabs kann lange dauern
    })
  } catch (axiosErr) {
    const status = axiosErr.response?.status
    const body = JSON.stringify(axiosErr.response?.data || axiosErr.message)
    console.error(`[ElevenLabs] HTTP-Fehler ${status}: ${body}`)
    throw new Error(`ElevenLabs API-Fehler (HTTP ${status}): ${body}`)
  }

  console.log(`[ElevenLabs] Antwort-Status: ${response.status}`)
  console.log(`[ElevenLabs] Antwort-Body: ${JSON.stringify(response.data).slice(0, 300)}`)

  // URL aus Antwort extrahieren — verschiedene mögliche Strukturen
  const musicUrl =
    response.data?.data?.[0]?.url ||
    response.data?.data?.[0]?.audio_url ||
    response.data?.url ||
    response.data?.audio_url ||
    response.data?.data?.url

  if (!musicUrl) {
    throw new Error('Keine Musik-URL in Antwort: ' + JSON.stringify(response.data).slice(0, 200))
  }

  console.log(`[ElevenLabs] Musik-URL erhalten: ${musicUrl.slice(0, 80)}...`)
  return musicUrl
}

// ── ffmpeg filter_complex für Slideshow aufbauen ──────────────────────────
function buildFilterComplex(imageCount, imageDuration, fps, aspectRatio, fadeDuration = 1.0) {
  const size = ASPECT_SIZES[aspectRatio] || ASPECT_SIZES['16:9']
  const [w, h] = size.split('x').map(Number)
  const filterSize = `${w}x${h}`

  let filters = []
  let overlayChain = ''

  for (let i = 0; i < imageCount; i++) {
    const effect = ZOOM_PAN_EFFECTS[i % ZOOM_PAN_EFFECTS.length]
    const zpFilter = effect(imageDuration, fps).replace('1920x1080', filterSize)

    // Scale → pad → zoompan für jedes Bild
    filters.push(
      `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,` +
      `crop=${w}:${h},` +
      `${zpFilter},` +
      `setsar=1[v${i}]`
    )
  }

  // Crossfade-Kette aufbauen
  if (imageCount === 1) {
    overlayChain = '[v0]'
  } else {
    let lastLabel = '[v0]'
    for (let i = 1; i < imageCount; i++) {
      const offset = i * imageDuration - fadeDuration
      const outLabel = i === imageCount - 1 ? '[vout]' : `[xf${i}]`
      filters.push(
        `${lastLabel}[v${i}]xfade=transition=fade:duration=${fadeDuration}:offset=${offset.toFixed(2)}${outLabel}`
      )
      lastLabel = `[xf${i}]`
    }
    if (imageCount === 1) overlayChain = '[v0]'
  }

  return filters.join('; ')
}

// ── Hauptfunktion: Slideshow Job asynchron ausführen ──────────────────────
async function runSlideshowJob(jobId, params) {
  const { imageUrls, musicMode, lifestyle, aspectRatio, imageDuration, ppqKey } = params
  const fps = 30
  const fadeDuration = 1.0
  const totalDuration = imageUrls.length * imageDuration
  const jobDir = path.join(TMP_DIR, jobId)

  const updateJob = (update) => {
    const current = slideshowJobs.get(jobId) || {}
    slideshowJobs.set(jobId, { ...current, ...update })
  }

  try {
    fs.mkdirSync(jobDir, { recursive: true })
    updateJob({ status: 'downloading', progress: 5 })
    console.log(`[Slideshow] Job ${jobId}: ${imageUrls.length} Bilder, ${musicMode} Musik, ${imageDuration}s/Bild`)

    // ── Schritt 1: Bilder downloaden ─────────────────────────────────────
    const imagePaths = []
    for (let i = 0; i < imageUrls.length; i++) {
      const ext = imageUrls[i].includes('.png') ? 'png' : 'jpg'
      const imgPath = path.join(jobDir, `img_${i}.${ext}`)
      try {
        await downloadImage(imageUrls[i], imgPath)
        imagePaths.push(imgPath)
        console.log(`[Slideshow] Bild ${i + 1}/${imageUrls.length} heruntergeladen`)
        updateJob({ progress: 5 + Math.round((i + 1) / imageUrls.length * 25) })
      } catch (err) {
        console.warn(`[Slideshow] Bild ${i} fehlgeschlagen, überspringe: ${err.message}`)
      }
    }

    if (imagePaths.length === 0) throw new Error('Kein einziges Bild konnte heruntergeladen werden.')
    if (imagePaths.length === 1) {
      // Mit nur 1 Bild kein xfade möglich
      console.log('[Slideshow] Nur 1 Bild — kein Crossfade')
    }

    updateJob({ status: 'music', progress: 32 })

    // ── Schritt 2: Musik besorgen ─────────────────────────────────────────
    let musicPath = null
    let musicSource = 'none'  // 'elevenlabs' | 'local' | 'silent'

    if (musicMode === 'elevenlabs' && ppqKey) {
      console.log(`[Slideshow] Starte ElevenLabs Musik-Generierung für lifestyle="${lifestyle}", ${totalDuration}s`)
      try {
        const musicUrl = await generateElevenLabsMusic(lifestyle, totalDuration, ppqKey)
        musicPath = path.join(jobDir, 'music.mp3')
        console.log(`[Slideshow] Lade Musik von: ${musicUrl.slice(0, 80)}...`)
        await downloadImage(musicUrl, musicPath)
        musicSource = 'elevenlabs'
        const sizeMB = (fs.statSync(musicPath).size / 1024 / 1024).toFixed(2)
        console.log(`[Slideshow] ✅ ElevenLabs Musik heruntergeladen: ${sizeMB}MB → ${musicPath}`)
      } catch (err) {
        console.error('[Slideshow] ❌ ElevenLabs fehlgeschlagen:', err.message)
        // Fallback auf lokale Musik — im Job-Status vermerken
        musicPath = getLocalMusicFile(lifestyle)
        if (musicPath) {
          musicSource = 'local_fallback'
          console.log(`[Slideshow] Fallback auf lokale Musik: ${path.basename(musicPath)}`)
          updateJob({ elevenlabsError: err.message })
        } else {
          musicSource = 'silent'
          updateJob({ elevenlabsError: err.message })
        }
      }
    } else if (musicMode === 'elevenlabs' && !ppqKey) {
      console.error('[Slideshow] ❌ musicMode=elevenlabs aber PPQ_API_KEY fehlt!')
      musicPath = getLocalMusicFile(lifestyle)
      if (musicPath) musicSource = 'local'
    } else {
      musicPath = getLocalMusicFile(lifestyle)
      if (musicPath) {
        musicSource = 'local'
      }
    }

    if (musicPath) {
      console.log(`[Slideshow] Musik (${musicSource}): ${path.basename(musicPath)}`)
    } else {
      musicSource = 'silent'
      console.log('[Slideshow] Kein Musik-File gefunden — verwende ffmpeg lavfi Stille als Audio-Track')
      console.log(`[Slideshow] HINWEIS: Lege MP3-Dateien in ${MUSIC_DIR} ab um lokale Musik zu aktivieren`)
    }

    updateJob({ status: 'rendering', progress: 40 })

    // ── Schritt 3: ffmpeg Slideshow bauen ─────────────────────────────────
    const outputPath = path.join(jobDir, 'slideshow.mp4')
    const n = imagePaths.length
    const size = ASPECT_SIZES[aspectRatio] || ASPECT_SIZES['16:9']
    const [w, h] = size.split('x').map(Number)

    // ffmpeg Input-Args aufbauen
    // Bilder als Loop-Inputs
    const inputArgs = []
    for (const imgPath of imagePaths) {
      inputArgs.push('-loop', '1', '-t', String(imageDuration), '-i', imgPath)
    }

    // Audio-Input: echte Musik-Datei ODER lavfi-Stille als Fallback
    let audioInputLabel = null
    if (musicPath) {
      inputArgs.push('-i', musicPath)
      audioInputLabel = `[${n}:a]`   // n-ter Input = Musik-Datei
    } else {
      // lavfi anullsrc: synthetische Stille – immer verfügbar in ffmpeg
      // Kein extra -i nötig, wird direkt im filter_complex definiert
      audioInputLabel = null  // wird unten als anullsrc in filterLines gebaut
    }

    // Filter Complex aufbauen
    let filterLines = []

    // Video-Filter: Scale + Crop + Ken Burns pro Bild
    for (let i = 0; i < n; i++) {
      const effect = ZOOM_PAN_EFFECTS[i % ZOOM_PAN_EFFECTS.length]
      const zpFilter = effect(imageDuration, fps).replace('1920x1080', `${w}x${h}`)
      filterLines.push(
        `[${i}:v]scale=${w}:${h}:force_original_aspect_ratio=increase,` +
        `crop=${w}:${h},setsar=1,` +
        `${zpFilter}[v${i}]`
      )
    }

    // Video Crossfade-Kette
    if (n === 1) {
      filterLines.push(`[v0]copy[vout]`)
    } else {
      let lastLabel = '[v0]'
      for (let i = 1; i < n; i++) {
        const offset = (i * imageDuration - fadeDuration).toFixed(2)
        const outLabel = i === n - 1 ? '[vout]' : `[xf${i}]`
        filterLines.push(`${lastLabel}[v${i}]xfade=transition=fade:duration=${fadeDuration}:offset=${offset}${outLabel}`)
        lastLabel = outLabel === '[vout]' ? '[vout]' : `[xf${i}]`
      }
    }

    // Audio: immer einen Audio-Track bauen (Musik oder Stille)
    const fadeStart = Math.max(0, totalDuration - 2)
    if (musicPath) {
      // Echte Musik-Datei: trim auf Video-Länge + fade out
      filterLines.push(
        `[${n}:a]atrim=0:${totalDuration},` +
        `afade=t=out:st=${fadeStart}:d=2[aout]`
      )
    } else {
      // Kein Musik-File: lavfi anullsrc als separater -i Input
      // Wird als letzter Input NACH den Bildern hinzugefügt
      inputArgs.push('-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo:d=${totalDuration}`)
      filterLines.push(
        `[${n}:a]afade=t=out:st=${fadeStart}:d=2[aout]`
      )
    }

    const filterComplex = filterLines.join('; ')

    // ffmpeg Output-Args: immer mit Audio-Track (-map [aout])
    const outputArgs = [
      '-map', '[vout]',
      '-map', '[aout]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', musicPath ? '192k' : '64k',
      '-movflags', '+faststart',
      '-t', String(totalDuration),
      outputPath
    ]

    const ffmpegArgs = [
      '-y',           // Overwrite
      ...inputArgs,
      '-filter_complex', filterComplex,
      ...outputArgs
    ]

    console.log(`[Slideshow] ffmpeg starten: ${FFMPEG} ${ffmpegArgs.slice(0, 8).join(' ')}...`)

    await execFileAsync(FFMPEG, ffmpegArgs, { timeout: 600000 }) // max 10 Min. (20 Bilder × zoompan)

    console.log(`[Slideshow] ffmpeg fertig: ${outputPath}`)

    const videoSizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
    console.log(`[Slideshow] Video: ${videoSizeMB}MB`)

    // Video bleibt auf Disk — Frontend downloadet via /api/slideshow-download/:jobId
    updateJob({
      status: 'completed',
      progress: 100,
      outputPath,   // Disk-Pfad für Download-Endpoint
      videoSizeMB,
      imageCount: imagePaths.length,
      musicUsed: musicPath
        ? `${path.basename(musicPath)}${musicSource === 'local_fallback' ? ' (ElevenLabs fehlgeschlagen → Fallback)' : ''}`
        : (musicSource === 'silent' ? 'keine (Stille)' : null),
      musicSource,
      totalDuration
    })

  } catch (err) {
    console.error(`[Slideshow] Job ${jobId} fehlgeschlagen:`, err.message)
    updateJob({ status: 'failed', error: err.message })
  } finally {
    // Temp-Ordner nach 15 Min. aufräumen (genug Zeit für Download + Blossom-Upload)
    setTimeout(() => {
      try { fs.rmSync(jobDir, { recursive: true, force: true }) } catch {}
      slideshowJobs.delete(jobId)
    }, 15 * 60 * 1000)
  }
}

// ── POST /api/generate-slideshow ──────────────────────────────────────────
app.post('/api/generate-slideshow', async (req, res) => {
  const {
    imageUrls,                    // Array von Bild-URLs
    musicMode = 'local',          // 'local' | 'elevenlabs'
    lifestyle = 'mojobus',
    aspectRatio = '16:9',
    imageDuration = 4,            // Sekunden pro Bild
  } = req.body

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    return res.status(400).json({ error: 'imageUrls Array erforderlich (min. 1 Bild).' })
  }
  if (imageUrls.length > 30) {
    return res.status(400).json({ error: `Zu viele Bilder: ${imageUrls.length} (Maximum 30). Bitte maximal 30 Bilder verwenden.` })
  }

  const ppqKey = process.env.PPQ_API_KEY
  if (musicMode === 'elevenlabs' && !ppqKey) {
    return res.status(400).json({ error: 'PPQ_API_KEY fehlt für ElevenLabs Musik.' })
  }

  // Job-ID generieren
  const jobId = 'sl_' + crypto.randomBytes(8).toString('hex')
    const totalDuration = Math.min(imageUrls.length, 30) * imageDuration
  const estimatedCost = musicMode === 'elevenlabs' ? 0.50 : 0.00

  // Job registrieren
  slideshowJobs.set(jobId, {
    status: 'pending',
    progress: 0,
    created: Date.now()
  })

  console.log(`[Slideshow] Neuer Job: ${jobId}, ${imageUrls.length} Bilder, ${musicMode}, ${aspectRatio}`)

  // Job asynchron starten (nicht awaiten!)
  runSlideshowJob(jobId, {
    imageUrls: imageUrls.slice(0, 30),
    musicMode,
    lifestyle,
    aspectRatio,
    imageDuration: Math.min(Math.max(imageDuration, 2), 8), // 2-8s pro Bild
    ppqKey
  })

  // Sofort Job-ID zurückgeben
  res.json({
    jobId,
    status: 'pending',
      imageCount: Math.min(imageUrls.length, 30),
    totalDuration,
    estimatedCost,
    musicMode
  })
})

// ── GET /api/slideshow-music-status ──────────────────────────────────────
// Prüft ob lokale Musik-Files vorhanden sind
app.get('/api/slideshow-music-status', (req, res) => {
  const exists = fs.existsSync(MUSIC_DIR)
  const files = exists
    ? fs.readdirSync(MUSIC_DIR).filter(f => f.endsWith('.mp3') || f.endsWith('.m4a') || f.endsWith('.ogg'))
    : []
  res.json({
    musicDir: MUSIC_DIR,
    available: files.length > 0,
    fileCount: files.length,
    files: files.slice(0, 10), // max 10 anzeigen
    hint: files.length === 0
      ? `Lege MP3-Dateien in ${MUSIC_DIR} ab um lokale Musik zu aktivieren`
      : null
  })
})

// ── GET /api/slideshow-status/:jobId ─────────────────────────────────────
app.get('/api/slideshow-status/:jobId', (req, res) => {
  const { jobId } = req.params
  const job = slideshowJobs.get(jobId)

  if (!job) {
    return res.status(404).json({ error: 'Job nicht gefunden oder bereits abgelaufen.' })
  }

  if (job.status === 'completed') {
    res.json({
      status: 'completed',
      progress: 100,
      videoSizeMB: job.videoSizeMB,
      imageCount: job.imageCount,
      musicUsed: job.musicUsed,
      musicSource: job.musicSource,
      elevenlabsError: job.elevenlabsError || null,  // ElevenLabs-Fehler ans Frontend weitergeben
      totalDuration: job.totalDuration,
      downloadUrl: `/api/slideshow-download/${jobId}`
    })
  } else if (job.status === 'failed') {
    res.json({ status: 'failed', error: job.error })
    slideshowJobs.delete(jobId)
  } else {
    // Noch in Arbeit — Status + Phase zurückgeben
    res.json({
      status: job.status,
      progress: job.progress
    })
  }
})

// ── GET /api/slideshow-download/:jobId ───────────────────────────────────
// Liefert das fertige MP4 direkt als Datei-Stream
app.get('/api/slideshow-download/:jobId', (req, res) => {
  const { jobId } = req.params
  const job = slideshowJobs.get(jobId)

  if (!job || job.status !== 'completed' || !job.outputPath) {
    return res.status(404).json({ error: 'Video nicht gefunden oder noch nicht fertig.' })
  }
  if (!fs.existsSync(job.outputPath)) {
    return res.status(410).json({ error: 'Video bereits gelöscht (15 Min. Limit).' })
  }

  const filename = `slideshow-${jobId}.mp4`
  console.log(`[Slideshow] Download: ${filename} (${job.videoSizeMB}MB)`)

  res.setHeader('Content-Type', 'video/mp4')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.setHeader('Content-Length', fs.statSync(job.outputPath).size)

  const stream = fs.createReadStream(job.outputPath)
  stream.pipe(res)
})

// Alte Jobs alle 30 Min. aufräumen (Memory Leak Prevention)
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000
  for (const [id, job] of slideshowJobs.entries()) {
    if (job.created < cutoff) slideshowJobs.delete(id)
  }
}, 30 * 60 * 1000)

// ===== API FÜR TRIP GENERIERUNG =====
// Tab: "Trips" in /veroeffentlichen
// Input: images (alle Station-Bilder), title, description, locations, stationDescriptions, tripType, country, tripLength, model, lifestyle, gender
// Output: { article (Zusammenfassung), captions (Bild-Texte pro Station) }
app.post('/api/generate-trip', (req, res, next) => {
  upload.array('images', 30)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    next()
  })
}, async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Meine Reise'
  const description = (req.body.description || '').trim()
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'mojobus'
  const gender = sanitizeInput(req.body.gender) || 'couple'
  const tripType = sanitizeInput(req.body.tripType) || ''
  const country = sanitizeInput(req.body.country) || ''
  const tripLength = sanitizeInput(req.body.tripLength) || 'medium'
  const startDate = sanitizeInput(req.body.startDate) || ''
  const endDate = sanitizeInput(req.body.endDate) || ''
  const locations = safelyParseJSON(req.body.locations) || []
  const stationDescriptions = safelyParseJSON(req.body.stationDescriptions) || []
  const images = req.files || []

  console.log(`[KI] Generiere Trip: "${title}", Bilder: ${images.length}, Stationen: ${stationDescriptions.length}, Modell: ${model}, Lifestyle: ${lifestyle}, Länge: ${tripLength}`)
  if (tripType) console.log(`[KI] Trip-Typ: ${tripType}`)
  if (country) console.log(`[KI] Land: ${country}`)

  try {
    const lifestyleConfig = getLifestyleConfig(lifestyle)

    // ===== BILDER ANALYSIEREN – Google Gemini 2.5 Flash via OpenRouter =====
    // Kein Rate-Limit-Problem (bezahltes API), alle Bilder PARALLEL, sehr günstig
    // Fallback auf Groq wenn OPENROUTER_API_KEY fehlt
    const MAX_IMAGES_TO_ANALYZE = 12  // Stufe 1=12, 2=10, 3=6 (Frontend-Stufen)
    const MAX_IMAGE_BYTES = 4 * 1024 * 1024  // 4MB max pro Bild
    const imagesToAnalyze = images.slice(0, MAX_IMAGES_TO_ANALYZE)
    const useGemini = !!process.env.OPENROUTER_API_KEY
    console.log(`[KI] Analysiere ${imagesToAnalyze.length} von ${images.length} Bildern via ${useGemini ? 'Gemini 2.5 Flash (OpenRouter)' : 'Groq Llama-4 (Fallback)'} – PARALLEL`)

    // Einzelnes Bild analysieren: Gemini preferred, Groq als Fallback
    const analyzeOneBild = async (img, index) => {
      if (img.buffer.length > MAX_IMAGE_BYTES) {
        console.warn(`[KI] Bild ${index + 1} zu groß (${(img.buffer.length/1024/1024).toFixed(1)}MB > 4MB), überspringe`)
        return '(Bild übersprungen – zu groß)'
      }
      const base64   = img.buffer.toString('base64')
      const mimeType = img.mimetype || 'image/jpeg'
      const sizeKB   = (img.size / 1024).toFixed(0)
      const prompt   = getTripImageAnalysisPrompt(lifestyleConfig, tripLength, tripType)

      // ── Gemini 2.5 Flash via OpenRouter ─────────────────────────────────
      if (useGemini) {
        try {
          console.log(`[KI] Gemini Bild ${index + 1}/${imagesToAnalyze.length}: ${sizeKB}KB`)
          const r = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'google/gemini-2.5-flash',
            messages: [{
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
              ]
            }],
            max_tokens: 150,
            temperature: 0.7
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 45000
          })
          return r.data.choices[0].message.content
        } catch (geminiErr) {
          const status = geminiErr.response?.status
          const msg    = geminiErr.response?.data?.error?.message || geminiErr.message
          console.warn(`[KI] Gemini Bild ${index + 1} fehlgeschlagen (HTTP ${status}): ${msg} – versuche Groq Fallback`)
          // Weiter zum Groq-Fallback
        }
      }

      // ── Groq Llama-4-Scout Fallback (sequentiell, mit Pause) ────────────
      try {
        console.log(`[KI] Groq Fallback Bild ${index + 1}/${imagesToAnalyze.length}: ${sizeKB}KB`)
        const r = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
          }],
          max_tokens: 120,
          temperature: 0.7
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
          timeout: 30000
        })
        return r.data.choices[0].message.content
      } catch (groqErr) {
        const status = groqErr.response?.status
        const msg    = groqErr.response?.data?.error?.message || groqErr.message
        console.warn(`[KI] Groq Bild ${index + 1} fehlgeschlagen (HTTP ${status}): ${msg}`)
        if (status === 429) return '(Rate-Limit – bitte erneut versuchen)'
        return '(Bild nicht analysierbar)'
      }
    }

    // PARALLEL analysieren (Gemini hat kein striktes Rate-Limit-Problem)
    // Bei Groq-Fallback: max 4 gleichzeitig um Rate-Limit zu schonen
    let imageDescriptions = []
    if (useGemini) {
      // Alle parallel via Gemini
      const results = await Promise.allSettled(
        imagesToAnalyze.map((img, i) => analyzeOneBild(img, i))
      )
      imageDescriptions = results.map(r => r.status === 'fulfilled' ? r.value : '(Fehler)')
    } else {
      // Groq: sequentiell mit 1s Pause
      for (let i = 0; i < imagesToAnalyze.length; i++) {
        imageDescriptions.push(await analyzeOneBild(imagesToAnalyze[i], i))
        if (i < imagesToAnalyze.length - 1) await new Promise(r => setTimeout(r, 1000))
      }
    }

    console.log(`[KI] ${imageDescriptions.length} Bilder analysiert (${useGemini ? 'Gemini' : 'Groq'})`)

    // ===== TRIP-ZUSAMMENFASSUNG GENERIEREN =====
    const tripPrompt = generateTripPrompt({
      title,
      description,
      locations,
      text: description,
      imageDescriptions,
      lifestyleConfig,
      country,
      stations: locations,
      stationDescriptions,
      tripType,
      tripLength,
      gender
    })

    const tripMaxTokens = tripLength === 'short' ? 500 : tripLength === 'medium' ? 1400 : 2800

    console.log(`[KI] Generiere Trip-Text (${tripLength}, max ${tripMaxTokens} Tokens)...`)
    const article = await generateWithModel(tripPrompt, model, lifestyle, {
      maxTokens: tripMaxTokens,
      temperature: 0.85
    })
    console.log(`[KI] Trip-Text fertig: ${article.length} Zeichen`)

    // ===== BILD-CAPTIONS FÜR STATIONEN GENERIEREN =====
    // Jede Station bekommt einen kurzen Foster-Bildtext (20-100 Wörter)
    // Nur wenn Stationen vorhanden
    let captions = []
    if (imagesToAnalyze.length > 0) {
      console.log(`[KI] Generiere ${imagesToAnalyze.length} Bild-Captions...`)

      // Captions sequentiell generieren (nicht parallel - Groq Rate-Limits)
      // Kurze Pause zwischen den Anfragen um Rate-Limit zu vermeiden
      for (let i = 0; i < imagesToAnalyze.length; i++) {
        const station = stationDescriptions[i] || {}
        const stationLocation = station.location || locations[i] || `Station ${i + 1}`
        const userDescription = station.description || ''

        const captionPrompt = generateTripCaptionPrompt({
          imageDescription: imageDescriptions[i] || '',
          stationTitle: stationLocation,
          stationLocation,
          userDescription,
          tripTitle: title,
          lifestyleConfig,
          gender,
          stationIndex: i,
          totalStations: imagesToAnalyze.length
        })

        try {
          const caption = await generateWithModel(captionPrompt, model, lifestyle, {
            maxTokens: 120,
            temperature: 0.8
          })
          captions.push(caption.trim())
          console.log(`[KI] Caption ${i + 1}/${imagesToAnalyze.length} fertig`)
          // Kleine Pause zwischen Caption-Anfragen (Groq Rate-Limit)
          if (i < imagesToAnalyze.length - 1) {
            await new Promise(r => setTimeout(r, 300))
          }
        } catch (captionErr) {
          const capStatus = captionErr.response?.status
          console.warn(`[KI] Caption ${i + 1} fehlgeschlagen (HTTP ${capStatus}):`, captionErr.response?.data?.error?.message || captionErr.message)
          captions.push('') // Leerer String als Fallback
          // Bei Rate-Limit: länger warten
          if (capStatus === 429) {
            console.log('[KI] Caption Rate-Limit, warte 5s...')
            await new Promise(r => setTimeout(r, 5000))
          }
        }
      }

      // Für Bilder die nicht analysiert wurden (>MAX): leere Captions
      for (let i = imagesToAnalyze.length; i < images.length; i++) {
        captions.push('')
      }
    }

    console.log(`[KI] Trip fertig: ${article.length} Zeichen, ${captions.length} Captions`)

    res.json({
      article,
      captions,
      imageCount: images.length,
      analyzedCount: imagesToAnalyze.length,
      tripLength,
      lifestyle
    })

  } catch (error) {
    // Detailliertes Logging für Debugging
    const errData = error.response?.data
    const httpStatus = error.response?.status
    const errMsg = error.message || 'Unbekannter Fehler'
    console.error(`[KI] Fehler bei Trip-Generierung (HTTP ${httpStatus || 'no-response'}):`, errData || errMsg)
    if (errData) console.error('[KI] API-Antwort:', JSON.stringify(errData).slice(0, 500))

    // Sprechende Fehlermeldung ans Frontend
    let userError = 'Fehler bei Trip-Generierung. Bitte versuche es erneut.'
    if (httpStatus === 429 || errData?.error?.type === 'rate_limit_exceeded') {
      userError = 'Groq API-Limit erreicht. Bitte 30 Sekunden warten und erneut versuchen.'
    } else if (httpStatus === 413 || errMsg.includes('too large') || errMsg.includes('image_too_large')) {
      userError = 'Ein oder mehrere Bilder sind zu groß für die KI-Analyse. Bitte kleinere Bilder verwenden (max. 4MB pro Bild für Groq).'
    } else if (error.code === 'ECONNABORTED' || errMsg.includes('timeout')) {
      userError = 'Zeitüberschreitung bei der KI-Analyse. Versuche es mit weniger Bildern (max. 6).'
    } else if (errData?.error?.message) {
      userError = `KI-Fehler: ${errData.error.message}`
    } else if (errMsg && errMsg !== 'Unbekannter Fehler') {
      userError = `Fehler: ${errMsg}`
    }

    res.status(httpStatus || 500).json({ error: userError })
  }
})

// ===== API FÜR BERICHT/ARTIKEL GENERIERUNG =====
// Tab: "Berichte" in /veroeffentlichen
app.post('/api/generate-article', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    next()
  })
}, async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Mein Bericht'
  const description = sanitizeInput(req.body.description) || ''
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  // text NICHT durch sanitizeInput kürzen – der User-Text kann länger als 500 Zeichen sein
  const text = (req.body.text || '').trim()
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'mojobus'
  const gender = sanitizeInput(req.body.gender) || 'couple' // Gender: neutral/male/female/couple
  const images = req.files

  // Zusätzliche Kontext-Felder
  const category = sanitizeInput(req.body.category) || ''
  const tags = safelyParseJSON(req.body.tags) || []
  const country = sanitizeInput(req.body.country) || ''
  const articleLength = sanitizeInput(req.body.articleLength) || 'medium'
  const tripType = sanitizeInput(req.body.tripType) || ''
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

    // Alle Bilder als Objekte {url, description} zusammenführen:
    // Titelbild(er) haben keine öffentliche URL (Buffer-Upload) → url: null
    // Markdown-Bilder haben eine öffentliche Blossom-URL → url: string
    const imageObjects = [
      ...uploadedImageDescriptions.map(desc => ({ url: null, description: desc })),
      ...markdownUrlsToAnalyze.map((url, i) => ({
        url,
        description: markdownImageDescriptions[i] || ''
      })).filter(obj => obj.description)
    ]
    console.log(`[KI] Gesamt ${imageObjects.length} Bilder für Prompt (${uploadedImageDescriptions.length} Titel, ${markdownImageDescriptions.length} Markdown)`)

    // Foster Huntington Prompt für Berichte - importiert aus src/config/prompts/articles.js
    const prompt = generateArticlePrompt({
      title,
      description,
      location,
      text,
      imageObjects,  // neu: [{url, description}] statt imageDescriptions[]
      lifestyleConfig,
      category,
      tags,
      country,
      articleLength,
      gender,
      tripType
    })

    // Berichte: maxTokens abhängig von articleLength
    const articleMaxTokens = articleLength === 'short' ? 500 : articleLength === 'medium' ? 1200 : 2500

    // Schritt 1: Artikel generieren
    console.log(`[KI] Generiere Artikel (${articleLength}, max ${articleMaxTokens} Tokens)...`)
    const article = await generateWithModel(prompt, model, lifestyle, {
      maxTokens: articleMaxTokens,
      temperature: 0.8
    })
    console.log(`[KI] Artikel fertig: ${article.length} Zeichen`)

    // Schritt 2: Summary + 3 Titel-Vorschläge parallel aus dem fertigen Artikel generieren
    const summaryPromptText = generateArticleSummaryPrompt({
      articleText: article,
      title,
      lifestyleConfig,
      gender
    })
    const titlesPromptText = generateArticleTitlesPrompt({
      articleText: article,
      currentTitle: title,
      lifestyleConfig,
      gender
    })

    console.log(`[KI] Generiere Summary + Titel-Vorschläge parallel...`)
    const [summaryRaw, titlesRaw] = await Promise.all([
      generateWithModel(summaryPromptText, model, lifestyle, {
        maxTokens: 80,
        temperature: 0.7
      }),
      generateWithModel(titlesPromptText, model, lifestyle, {
        maxTokens: 80,
        temperature: 0.9  // etwas mehr Variation für Titel
      })
    ])

    // Titel parsen: eine Zeile = ein Titel, max 3
    const titleSuggestions = titlesRaw
      .split('\n')
      .map(l => l.trim().replace(/^[-–•*\d.]+\s*/, '').replace(/^["']|["']$/g, ''))
      .filter(l => l.length > 2 && l.length < 80)
      .slice(0, 3)

    const summary = summaryRaw.trim().replace(/^["']|["']$/g, '')

    console.log(`[KI] Summary: "${summary.substring(0, 60)}..."`)
    console.log(`[KI] Titel-Vorschläge: ${JSON.stringify(titleSuggestions)}`)

    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      article,
      summary,             // Kurzfassung (1-2 Sätze) → geht ins Summary-Feld
      titleSuggestions,    // 3 Titel-Vorschläge → klickbar im Frontend
      hashtags: uniqueHashtags.join(' '),
      lifestyle,
      articleLength,
      imageObjects
    })
  } catch (error) {
    console.error('[KI] Fehler bei Bericht-Generierung:', error.response?.data || error.message)
    res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
  }
})

// ===== API FÜR PLATZ GENERIERUNG =====
// Tab: "Plätze" in /veroeffentlichen
app.post('/api/generate-place', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    next()
  })
}, async (req, res) => {
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
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'mojobus'
  const gender = sanitizeInput(req.body.gender) || 'couple'
  const images = req.files

  // Kontext-Felder
  const category = sanitizeInput(req.body.category) || ''
  const facilities = safelyParseJSON(req.body.facilities) || []
  const bestFor = safelyParseJSON(req.body.bestFor) || []
  const country = sanitizeInput(req.body.country) || ''
  const rating = sanitizeInput(req.body.rating) || ''
  const price = sanitizeInput(req.body.price) || ''
  const tripType = sanitizeInput(req.body.tripType) || ''
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

    // Alle Bilder als Objekte {url, description} zusammenführen
    // Titelbild hat keine öffentliche URL → url: null
    // Zusatz- und Markdown-Bilder haben öffentliche URLs
    const imageObjects = [
      ...uploadedImageDescriptions.map(desc => ({ url: null, description: desc })),
      ...additionalUrlsToAnalyze.map((url, i) => ({
        url,
        description: additionalImageDescriptions[i] || ''
      })).filter(obj => obj.description),
      ...markdownUrlsToAnalyze.map((url, i) => ({
        url,
        description: markdownImageDescriptions[i] || ''
      })).filter(obj => obj.description)
    ]
    console.log(`[KI] Gesamt ${imageObjects.length} Bilder für Platz-Prompt`)

    // Foster Huntington Prompt für Plätze - importiert aus src/config/prompts/place.js
    const prompt = generatePlacePrompt({
      title,
      description,
      location,
      gps_lat,
      gps_lon,
      imageObjects,  // neu: [{url, description}] statt imageDescriptions[]
      lifestyleConfig,
      category,
      facilities,
      bestFor,
      country,
      rating,
      price,
      gender,
      tripType
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
      imageObjects // [{url, description}] – Frontend ersetzt [BILD_N] mit den URLs
    })
  } catch (error) {
    console.error('[KI] Fehler bei Platz-Generierung:', error.response?.data || error.message)
    res.status(500).json({ error: 'Fehler bei Generierung. Versuche es erneut.' })
  }
})

// ===== API FÜR NOTE GENERIERUNG =====
// Tab: "Note" in /veroeffentlichen
app.post('/api/generate-note', (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next)
    next()
  })
}, async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || ''
  const description = sanitizeInput(req.body.description) || ''
  const location = sanitizeInput(req.body.location) || ''
  // text NICHT kürzen – User-Notiztext kann relevant lang sein
  const text = (req.body.text || '').trim()
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'mojobus'
  const gender = sanitizeInput(req.body.gender) || 'couple'
  const images = req.files

  // Zusätzliche Kontext-Felder
  const country = sanitizeInput(req.body.country) || ''
  const tripType = sanitizeInput(req.body.tripType) || ''

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Notiz: "${title || '(kein Titel)'}", Text: ${text.length} Zeichen, Bilder: ${images.length}, Lifestyle: ${lifestyle}, Modell: ${model}`)
  if (tripType) console.log(`[KI] Trip-Typ: ${tripType}`)

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
      gender,
      tripType
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

// ===== DEBUG: ppq.ai Video-API direkter Test =====
// Nur für Debugging – zeigt rohe ppq.ai Antwort
app.post('/api/debug-video', async (req, res) => {
  const ppqKey = process.env.PPQ_API_KEY
  if (!ppqKey) return res.status(500).json({ error: 'PPQ_API_KEY fehlt' })

  try {
    const response = await axios.post('https://api.ppq.ai/v1/videos', {
      model: 'kling-2.5-turbo-i2v',
      prompt: 'Cinematic travel video, vintage bus road trip, smooth camera movement, golden light',
      image_url: req.body.imageUrl || 'https://picsum.photos/800/450',
      aspect_ratio: '16:9',
      duration: '10'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ppqKey}`
      },
      timeout: 30000
    })
    console.log('[Debug] ppq.ai Erfolg:', JSON.stringify(response.data))
    res.json({ ok: true, data: response.data })
  } catch (error) {
    const rawData = error.response?.data
    console.error('[Debug] ppq.ai Fehler raw:', JSON.stringify(rawData))
    res.status(error.response?.status || 500).json({
      ok: false,
      httpStatus: error.response?.status,
      rawResponse: rawData,
      axiosMessage: error.message
    })
  }
})

// ===== GLOBALER ERROR-HANDLER =====
// Fängt alle unbehandelten Fehler ab und gibt immer JSON zurück (nie HTML)
// MUSS nach allen Routen stehen
app.use((err, req, res, next) => {
  console.error('[Server] Unbehandelter Fehler:', err.message || err)
  // Multer-Fehler die durch next(err) kamen
  if (err && err.code) {
    return handleMulterError(err, req, res, () => {
      res.status(500).json({ error: err.message || 'Interner Server-Fehler' })
    })
  }
  // Alle anderen Fehler
  const status = err.status || err.statusCode || 500
  res.status(status).json({ error: err.message || 'Interner Server-Fehler' })
})

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    groqApiKey: process.env.GROQ_API_KEY ? 'configured' : 'missing',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    openrouterApiKey: process.env.OPENROUTER_API_KEY ? 'configured' : 'missing',
    ppqApiKey: process.env.PPQ_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`[Server] Backend läuft auf Port ${PORT}`)
  console.log(`[Server] GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
  console.log(`[Server] ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
  console.log(`[Server] OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ Konfiguriert (für Video-Analyse)' : '✗ Fehlt (Video-Analyse nicht verfügbar)'}`)
  console.log(`[Server] PPQ_API_KEY: ${process.env.PPQ_API_KEY ? '✓ Konfiguriert (Runway Gen-4 Video)' : '✗ Fehlt (Video-Generierung nicht verfügbar)'}`)
})