import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import path from 'path'
import fs from 'fs'

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

// Hilfsfunktion: Generiere Text mit ausgewähltem Modell
const generateWithModel = async (prompt, model = 'llama4') => {
  const startTime = Date.now()

  try {
    if (model === 'claude') {
      // Claude 3.5 Sonnet (Anthropic)
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY fehlt')
      }

      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 700,
        temperature: 0.9,
        system: "Du bist ein erfahrener Vanlifer im Stil von Foster Huntington. Schreibe authentische, menschliche Geschichten.",
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
      console.log(`[KI] Claude 3.5 Sonnet generiert in ${duration}ms, Kosten: ~$0.015`)
      return response.data.content[0].text

    } else {
      // Llama 4 Scout (Groq) - Standard
      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 700,
        temperature: 0.85,
        top_p: 0.9
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
        timeout: 45000
      })

      const duration = Date.now() - startTime
      console.log(`[KI] Llama 4 Scout generiert in ${duration}ms, Kosten: ~$0.005`)
      return response.data.choices[0].message.content
    }
  } catch (error) {
    console.error(`[KI] Fehler mit ${model}:`, error.response?.data || error.message)
    throw error
  }
}

// API für Artikel-Generierung mit Bilder-Analyse (Legacy - für PerpetualTravelers)
app.post('/api/generate-article', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const text = sanitizeInput(req.body.text) || 'Meer Abenteuer'
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Artikel (Legacy), Bilder: ${images.length}, Text: ${text}`)

  try {
    // Bilder analysieren
    const imageDescriptions = await Promise.all(images.map(async (img, index) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild ${index + 1}/${images.length}, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Beschreibe dieses Bild kurz für einen Meer-Thema-Artikel (z.B. Strand, Wellen, Gebäude).' },
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

    // Artikel generieren
    const prompt = `Erstelle einen inspirierenden Artikel über "Unser Leben am Meer" mit persönlichen Geschichten, praktischen Tipps und Einblicken zwischen Sand und Horizont. Bilder-Beschreibungen: ${imageDescriptions.join(', ')}. Verwende Stichworte: ${text}. Max 100 Wörter. Füge Keywords und Hashtags hinzu.`

    const article = await generateWithModel(prompt, 'llama4')
    res.json({ article })
  } catch (error) {
    console.error('[KI] Fehler bei Generierung:', error.response?.data || error.message)

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

// API für Media-Artikel-Generierung mit Bilder-Analyse (Verbessert)
app.post('/api/generate-media-article', upload.array('images', 10), async (req, res) => {
  if (!validateApiKey()) {
    return res.status(500).json({ error: 'Server-Konfigurationsfehler' })
  }

  const title = sanitizeInput(req.body.title) || 'Mein Vanlife Abenteuer'
  const description = sanitizeInput(req.body.description) || ''
  const text = sanitizeInput(req.body.text) || 'Meer Abenteuer Strand'
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  const model = req.body.model || 'llama4' // Modell-Auswahl
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Media-Artikel: "${title}", Bilder: ${images.length}, Standort: ${location}, Modell: ${model}`)

  try {
    // Bilder analysieren mit Grok Vision
    const imageDescriptions = await Promise.all(images.map(async (img) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Beschreibe dieses Bild detailliert für einen Vanlife/Reise-Artikel. Fokus auf: Atmosphäre, Farben, Menschen, Aktivitäten, Besonderheiten. Schreibe in 2-3 Sätzen.' },
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

    console.log(`[KI] ${imageDescriptions.length} Bilder analysiert`)

    // Verbesserter Prompt mit Beispielen
    const prompt = `Ahme im gesamten Text den einfachen, authentischen Stil des Vanlifers Foster Huntington nach. Du schreibst wie ein erfahrener Vanlifer, der seine Erlebnisse teilt - direkt, ungeschönt und herzlich. Verwende die DU-Form.

BEISPIEL-STIL:
"Du wachst morgens mit dem Geräusch der Wellen auf. Der Sand knirscht unter deinen Füßen, während du zum Kaffee gehst. Nicht immer perfekt, aber genau das macht's echt. Hast du das auch schon erlebt?"

Erstelle einen Artikel über "${title}${description ? ' - ' + description : ''}" mit:
- Persönlichen Anekdoten aus dem Vanlife (z.B. ein spezieller Morgen am Strand)
- Praktischen Tipps für andere Reisende (z.B. "Park hier nie bei Flut")
- Sensorischen Details: Was hörst du? Was riechst du? Wie fühlt es sich an?
- Fragen an den Leser, um ihn einzubinden
- Ehrlichen, unperfekten Momenten, die es echt machen

Bilder-Beschreibungen (integriere diese natürlich): ${imageDescriptions.join('; ')}
Standort: ${location}
Stichworte: ${text}

WICHTIG:
- Max 300 Wörter
- Sehr menschlich und konversationell
- Keine perfekten Sätze - wie im echten Gespräch
- Füge 5-8 relevante Hashtags am Ende hinzu (z.B. #Vanlife #Meer #Strand #Abenteuer)

Beginne direkt mit einer persönlichen Anekdote oder Frage. Keine Einleitung wie "In diesem Artikel...".`

    // Artikel generieren mit ausgewähltem Modell
    const article = await generateWithModel(prompt, model)

    // Hashtags extrahieren (verbessert)
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    console.log(`[KI] Artikel generiert: ${article.length} Zeichen, Hashtags: ${uniqueHashtags.length}`)

    res.json({
      article,
      hashtags: uniqueHashtags.join(' '),
      model,
      imageDescriptions // Für Frontend-Debugging
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

// API für Trip-Generierung (mit Schritt-für-Schritt-Bildanalyse)
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
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Trip-Artikel: "${title}", Bilder: ${images.length}, Stationen: ${locations.length}, Modell: ${model}`)

  try {
    // SCHRITT 1: Für jedes Bild eine Kurzbeschreibung generieren
    const imageDescriptions = await Promise.all(images.map(async (img, index) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild ${index + 1}/${images.length}, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `Beschreibe diese Station für einen Reisebericht. Fokus auf: Atmosphäre, Besonderheiten. Schreibe in 2-3 Sätzen.` },
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

    // SCHRITT 2: Trip-Artikel aus allen Bildbeschreibungen generieren
    const prompt = `Ahme den Stil eines erfahrenen Vanlifers nach. Schreibe einen Reisebericht über "${title}${description ? ' - ' + description : ''}".

Reisezeit: ${startDate || 'unbestimmt'} bis ${endDate || 'unbestimmt'}
Stationen: ${locations.length > 0 ? locations.join(', ') : images.length + ' Stationen'}

Für jede Station habe ich eine Beschreibung:
${imageDescriptions.map((desc, i) => `Station ${i + 1}: ${desc}`).join('\n')}

Erstelle einen zusammenhängenden Reisebericht (300-500 Wörter) mit:
- Einleitung: Motivation für die Reise
- Chronologischer Ablauf der Stationen
- Persönliche Eindrücke und Erlebnisse
- Praktische Tipps für andere Reisende
- Fazit: Empfehlung

WICHTIG:
- Sehr menschlich und authentisch
- Keine perfekten Sätze
- Wie im echten Gespräch
- Füge 5-8 relevante Hashtags am Ende hinzu (z.B. #Vanlife #Reise #Abenteuer)`

    // Artikel generieren mit ausgewähltem Modell
    const article = await generateWithModel(prompt, model)
    console.log(`[KI] Trip-Artikel generiert: ${article.length} Zeichen`)

    // Hashtags extrahieren
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      article,
      imageDescriptions,
      hashtags: uniqueHashtags.join(' ')
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    groqApiKey: process.env.GROQ_API_KEY ? 'configured' : 'missing',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`[Server] Backend läuft auf Port ${PORT}`)
  console.log(`[Server] GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
  console.log(`[Server] ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
})