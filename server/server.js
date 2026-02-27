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
        model: 'claude-sonnet-4-6',
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

// ===== API FÜR MEDIEN ARTIKEL GENERIERUNG =====
// Generiert authentische Vanlife-Artikel im Foster Huntington Stil
// Verwendet in: Medien-Tab der Publish-Seite
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
      // ===== BILD ANALYSE FÜR MEDIEN ARTIKEL =====
      // Hier kannst du die Bild-Analyse-Prompts anpassen
      // Für verschiedene Themen können spezifische Analyse-Anweisungen hinzugefügt werden
      const imageDescriptions = await Promise.all(images.map(async (img) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
             { type: 'text', text: 'Beschreibe dieses Bild für einen authentischen Vanlife-Artikel. Fokus auf: echte Atmosphäre (nicht Instagram), was wirklich passiert, besondere Details, Emotionen. Schreibe wie Foster Huntington - direkt, ehrlich, keine perfekten Beschreibungen.' },
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

    // ===== FOSTER HUNTINGTON STIL PROMPT =====
    // Diese Prompt ist optimiert für authentischen Vanlife-Stil
    // Einfach anpassbar für verschiedene Themen
    const prompt = `Du bist Foster Huntington und schreibst für deine Vanlife-Community. Dein Stil ist:
- Ehrlich und ungeschönt (zeige die Realität, nicht Instagram)
- Persönlich und konversationell (wie ein Gespräch mit einem alten Freund)
- Direkt und relatable (verwende "Du", "Ich", keine perfekten Sätze)
- Minimalistisch (kurze Sätze, echte Emotionen)

BEISPIEL DEINES STILS:
"Du wachst morgens auf und der Van riecht nach letzter Nacht. Nicht glamourös, aber echt. Genau das macht Vanlife aus. Kennst du das Gefühl?"

"Parkst du auch immer am Arsch der Welt? Wo niemand hinfährt? Das sind die besten Plätze. Kein Wifi, aber echte Ruhe."

"Man sagt immer 'Freiheit', aber gestern musste ich 2 Stunden nach Wasser suchen. Trotzdem würde ich es nicht anders wollen."

VERMEIDE:
- "Der wunderschöne Sonnenaufgang tauchte die Landschaft in goldenes Licht"
- "In diesem Artikel zeige ich dir..."
- "Als Vanlifer musst du unbedingt..."
- Perfekte, polierte Sätze

SCHREIBE EINEN ARTIKEL ÜBER: "${title}${description ? ' - ' + description : ''}"

STRUKTUR:
1. Öffne mit einem konkreten, persönlichen Moment
2. Erzähl eine kleine, echte Geschichte
3. Gib einen praktischen Tipp aus der Erfahrung
4. Stelle eine Frage, die den Leser einbindet
5. Schließe ehrlich (mit den Schwierigkeiten)

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location}
Stichworte: ${text}

SCHREIBSTIL:
- Verwende Kontraktionen: du bist → du bist, ich habe → ich hab
- Kurze Sätze mischen mit längeren
- Rhetorische Fragen: "Kennst du das?"
- Selbstironie und Humor
- Direkte Ansprache: "Du", "Ich" statt "Man"

MAX 300 WÖRTER. Füge 5-8 echte Hashtags hinzu.
Beginne direkt mit einem persönlichen Moment. Keine Einleitung wie "In diesem Artikel...".`

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
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Trip-Artikel: "${title}", Bilder: ${images.length}, Stationen: ${locations.length}, Modell: ${model}`)

    try {
      // ===== BILD ANALYSE FÜR TRIP ARTIKEL =====
      // Schritt 1: Für jedes Bild eine Kurzbeschreibung generieren
      // Hier kannst du die Analyse-Prompts für Reisebilder anpassen
      const imageDescriptions = await Promise.all(images.map(async (img, index) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild ${index + 1}/${images.length}, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
             { type: 'text', text: `Beschreibe diese Station ehrlich für einen Vanlife-Reisebericht. Was ist wirklich besonders? Atmosphäre? Herausforderungen? Menschen? Schreibe authentisch, nicht touristisch - wie für andere Reisende.` },
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
    // Speziell für Reiseberichte optimiert
    // Kann für verschiedene Reisearten angepasst werden
    const prompt = `Du bist Foster Huntington und schreibst einen Reisebericht für andere Vanlifer. Dein Stil ist ehrlich, persönlich und direkt - keine perfekten Urlaubsgeschichten, sondern echte Erlebnisse.

BEISPIEL DEINES STILS:
"Die erste Nacht im Van war scheiße kalt. Regen prasselte aufs Dach, und ich fragte mich, ob das die richtige Entscheidung war. Am nächsten Morgen sah alles anders aus."

"Du denkst, Vanlife ist Freiheit? Manchmal ist es nur: Wo parke ich heute? Wo finde ich Strom? Aber genau das macht's echt."

VERMEIDE IN REISEBERICHTEN:
- "Wir genossen den wunderschönen Sonnenuntergang"
- "Es war ein unvergessliches Erlebnis"
- "Als Reisender musst du unbedingt..."
- Zu positive, polierte Geschichten

SCHREIBE EINEN REISEBERICHT ÜBER: "${title}${description ? ' - ' + description : ''}"

REISE-DETAILS:
Zeitraum: ${startDate || 'unbestimmt'} bis ${endDate || 'unbestimmt'}
Stationen: ${locations.length > 0 ? locations.join(' → ') : images.length + ' Stationen'}

STATIONEN-BESCHREIBUNGEN:
${imageDescriptions.map((desc, i) => `Station ${i + 1}: ${desc}`).join('\n')}

STRUKTUR DES BERICHTS:
1. EINLEITUNG: Warum bist du losgefahren? Was war die Motivation?
2. CHRONOLOGIE: Erzähl die Stationen in Reihenfolge - was war gut, was war scheiße
3. PERSÖNLICHE MOMENTE: Teile echte Gefühle, nicht nur schöne Fotos
4. PRAKTISCHE TIPPS: Was würden andere Reisende wissen wollen?
5. FAZIT: Würdest du es wieder machen? Was hast du gelernt?

SCHREIBSTIL:
- Ehrlich über Schwierigkeiten (Wetter, Parkplatzsuche, Reparaturen)
- Persönliche Anekdoten statt generischer Beschreibungen
- Direkte Fragen an den Leser: "Kennst du das?"
- Humor und Selbstironie
- Verwende "Ich" statt "Man"

LÄNGE: 300-500 Wörter
HASHTAGS: 5-8 relevante Hashtags am Ende
SPRACHE: Deutsch, authentisch, wie ein Gespräch

Beginne direkt mit deiner Abreise oder einem konkreten Moment. Keine Einleitung wie "In diesem Reisebericht...".`

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