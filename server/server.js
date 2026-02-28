import express from 'express'
import cors from 'cors'
import multer from 'multer'
import axios from 'axios'
import path from 'path'
import fs from 'fs'

// ===== PROMPT KONFIGURATION AUS src/config/prompts/ =====
// Die Prompts sind in separaten Dateien für einfache Wartung
// Siehe: src/config/prompts/lifestyles.ts für Lifestyle-Konfigurationen

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

// ===== LIFESTYLE KONFIGURATION =====
// Siehe src/config/prompts/lifestyles.ts für Dokumentation
// Foster Huntington Stil für alle Lifestyles
const getLifestyleConfig = (lifestyle = 'vanlife') => {
  const configs = {
    vanlife: {
      vehicle: 'Van',
      community: 'Vanlife-Community',
      keywords: ['vanlife', 'van', 'aufRädern'],
      example1: 'Du wachst morgens auf und der Van riecht nach letzter Nacht. Nicht glamourös, aber echt. Genau das macht Vanlife aus. Kennst du das Gefühl?',
      example2: 'Parkst du auch immer am Arsch der Welt? Wo niemand hinfährt? Das sind die besten Plätze. Kein Wifi, aber echte Ruhe.',
      example3: 'Man sagt immer "Freiheit", aber gestern musste ich 2 Stunden nach Wasser suchen. Trotzdem würde ich es nicht anders wollen.'
    },
    rvlife: {
      vehicle: 'RV',
      community: 'RVlife-Community',
      keywords: ['rvlife', 'rv', 'recreationalVehicle'],
      example1: 'Du wachst im RV und draußen ist es stürmisch. Das Wohnmobil wackelt, aber du bist dankbar für vier Wände auf Rädern. RVlife, Baby.',
      example2: 'Mit dem RV durch die Pampa - kein Campground weit und breit. Einfach am Straßenrand geparkt. Die besten Nächte sind die ungeplanten.',
      example3: 'Leute denken, RVlife ist nur Urlaub. Aber nach 6 Monaten on the road weißt du: Es ist ein komplettes Leben. Mit allen Höhen und Tiefen.'
    },
    buslife: {
      vehicle: 'Bus',
      community: 'Buslife-Community',
      keywords: ['buslife', 'bus', 'skoolie'],
      example1: 'Du fährst deinen umgebauten Schulbus auf einen Waldweg. 40 Fuß Stahl und Holz - dein Zuhause. Buslife ist anders, und genau das liebst du.',
      example2: 'Mit dem Bus in der Stadt parken? Vergiss es. Aber das ist okay. Die besten Spots sind sowieso da, wo niemand hinkommt.',
      example3: 'Ein Bus ist nicht nur ein Fahrzeug. Er ist ein Statement. Gegen Normalität, für Freiheit. Auch wenn die Reparaturen manchmal nerven.'
    },
    wohnmobil: {
      vehicle: 'Wohnmobil',
      community: 'Wohnmobil-Community',
      keywords: ['wohnmobil', 'camper', 'mobil'],
      example1: 'Du wachst im Wohnmobil auf, Regen prasselt aufs Dach. Gemütlich, aber du musst tanken. Willkommen im echten Wohnmobil-Leben.',
      example2: 'Stellplätze in Deutschland? Entweder voll oder teuer. Aber manchmal findest du diesen einen perfekten Spot direkt am See.',
      example3: 'Wohnmobil bedeutet nicht immer Luxus. Es bedeutet Freiheit mit praktischen Herausforderungen. Und das ist genau richtig so.'
    },
    'perpetual-travelers': {
      vehicle: 'Reise',
      community: 'Perpetual Travelers Community',
      keywords: ['perpetualTravelers', 'permanentReisend', 'ortlos'],
      example1: 'Du weißt nicht mehr, welcher Tag es ist. Oder welcher Monat. Perpetual Traveler zu sein bedeutet, die Zeit zu vergessen.',
      example2: 'Heute hier, morgen dort. Kein fester Wohnsitz, nur dein Rucksack und die nächste Destination. Das ist dein Zuhause.',
      example3: 'Leute fragen: "Wo lebst du?" Du antwortest: "Überall und nirgendwo." Perpetual Travel ist kein Urlaub, es ist eine Lebensphilosophie.'
    }
  }

  return configs[lifestyle] || configs.vanlife
}

// Foster Huntington Basis-Stil (konstant für alle Lifestyles)
const fosterHuntingtonStyle = {
  principles: [
    'Ehrlich und ungeschönt (zeige die Realität, nicht Instagram)',
    'Persönlich und konversationell (wie ein Gespräch mit einem alten Freund)',
    'Direkt und relatable (verwende "Du", "Ich", keine perfekten Sätze)',
    'Minimalistisch (kurze Sätze, echte Emotionen)'
  ],
  avoid: [
    '"Der wunderschöne Sonnenaufgang tauchte die Landschaft in goldenes Licht"',
    '"In diesem Artikel zeige ich dir..."',
    'Perfekte, polierte Sätze'
  ],
  writingStyle: [
    'Verwende Kontraktionen: du bist → du bist, ich habe → ich hab',
    'Kurze Sätze mischen mit längeren',
    'Rhetorische Fragen: "Kennst du das?"',
    'Selbstironie und Humor',
    'Direkte Ansprache: "Du", "Ich" statt "Man"'
  ]
}

// ===== PROMPT GENERATOR FUNKTIONEN =====
// Diese Funktionen nutzen die Lifestyle-Konfiguration
// Für Wartung und Anpassung: siehe src/config/prompts/
// - media.ts    → Medien-Tab
// - trips.ts    → Trips-Tab
// - articles.ts → Berichte-Tab
// - notes.ts    → Note-Tab

/**
 * Generiert Foster Huntington Prompt für Medien-Artikel
 * Tab: "Medien" in /veroeffentlichen
 */
const generateMediaPrompt = (title, description, location, text, imageDescriptions, lifestyleConfig) => {
  return `Du bist Foster Huntington und schreibst für deine ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS (authentisch Foster Huntington):
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

"${lifestyleConfig.example3}"

VERMEIDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a}`).join('\n')}
- "Als ${lifestyleConfig.vehicle}-Reisender musst du unbedingt..."

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
 * Generiert Foster Huntington Prompt für Trip-Artikel
 * Tab: "Trips" in /veroeffentlichen
 */
const generateTripPrompt = (title, description, locations, startDate, endDate, imageDescriptions, lifestyleConfig) => {
  return `Du bist Foster Huntington und schreibst einen Reisebericht für ${lifestyleConfig.community}. Dein Stil ist ehrlich, persönlich und direkt - keine perfekten Urlaubsgeschichten, sondern echte Erlebnisse.

BEISPIEL DEINES STILS (authentisch Foster Huntington):
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

VERMEIDE IN REISEBERICHTEN:
- "Wir genossen den wunderschönen Sonnenuntergang"
- "Es war ein unvergessliches Erlebnis"
- "Als Reisender musst du unbedingt..."
- Zu positive, polierte Geschichten

SCHREIBE EINEN REISEBERICHT ÜBER: "${title}${description ? ' - ' + description : ''}"

REISE-DETAILS:
Zeitraum: ${startDate || 'unbestimmt'} bis ${endDate || 'unbestimmt'}
Stationen: ${locations.length > 0 ? locations.join(' → ') : imageDescriptions.length + ' Stationen'}

STATIONEN-BESCHREIBUNGEN:
${imageDescriptions.map((desc, i) => `Station ${i + 1}: ${desc}`).join('\n')}

STRUKTUR DES BERICHTS:
1. EINLEITUNG: Warum bist du losgefahren? Was war die Motivation?
2. CHRONOLOGIE: Erzähl die Stationen in Reihenfolge - was war gut, was war scheiße
3. PERSÖNLICHE MOMENTE: Teile echte Gefühle, nicht nur schöne Fotos
4. PRAKTISCHE TIPPS: Was würden andere Reisende wissen wollen?
5. FAZIT: Würdest du es wieder machen? Was hast du gelernt?

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}
- Ehrlich über Schwierigkeiten (Wetter, Parkplatzsuche, Reparaturen)
- Persönliche Anekdoten statt generischer Beschreibungen
- Direkte Fragen an den Leser: "Kennst du das?"
- Humor und Selbstironie
- Verwende "Ich" statt "Man"

LÄNGE: 300-500 Wörter
HASHTAGS: 5-8 relevante Hashtags am Ende (inklusive #${lifestyleConfig.keywords[0]})
SPRACHE: Deutsch, authentisch, wie ein Gespräch

Beginne direkt mit deiner Abreise oder einem konkreten Moment. Keine Einleitung wie "In diesem Reisebericht...".`
}
const generateWithModel = async (prompt, model = 'llama4', lifestyle = 'vanlife') => {
  const startTime = Date.now()
  const lifestyleConfig = getLifestyleConfig(lifestyle)

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
        system: `Du bist ein erfahrener ${lifestyleConfig.vehicle}-Reisender im authentischen Foster Huntington Stil. Schreibe ehrlich, direkt, ungeschönt - keine perfekten Instagram-Geschichten.`,
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


// ===== API FÜR MEDIEN ARTIKEL GENERIERUNG =====
// Generiert authentische Vanlife-Artikel im Foster Huntington Stil
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
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Media-Artikel: "${title}", Bilder: ${images.length}, Standort: ${location}, Modell: ${model}, Lifestyle: ${lifestyle}`)

    try {
      // ===== BILD ANALYSE FÜR MEDIEN ARTIKEL =====
      // Prompt: siehe src/config/prompts/media.ts
      const lifestyleConfig = getLifestyleConfig(lifestyle)
      const imageDescriptions = await Promise.all(images.map(async (img) => {
      const base64 = img.buffer.toString('base64')
      console.log(`[KI] Analysiere Bild, Größe: ${(img.size / 1024).toFixed(1)}KB`)

      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
             { type: 'text', text: `Beschreibe dieses Bild für einen authentischen ${lifestyleConfig.vehicle}-Artikel. Fokus auf: echte Atmosphäre (nicht Instagram), was wirklich passiert, besondere Details, Emotionen. Schreibe wie Foster Huntington - direkt, ehrlich, keine perfekten Beschreibungen.` },
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
    // Generiert mit: generateMediaPrompt() - siehe oben
    const prompt = generateMediaPrompt(title, description, location, text, imageDescriptions, lifestyleConfig)

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
      lifestyle,
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
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife' // Lifestyle-Typ
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Trip-Artikel: "${title}", Bilder: ${images.length}, Stationen: ${locations.length}, Modell: ${model}, Lifestyle: ${lifestyle}`)

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
             { type: 'text', text: `Beschreibe diese Station ehrlich für einen ${lifestyleConfig.vehicle}-Reisebericht. Was ist wirklich besonders? Atmosphäre? Herausforderungen? Menschen? Schreibe authentisch, nicht touristisch - wie für andere Reisende.` },
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
    // Generiert mit: generateTripPrompt() - siehe oben
    const prompt = generateTripPrompt(title, description, locations, startDate, endDate, imageDescriptions, lifestyleConfig)

    // Artikel generieren mit ausgewähltem Modell
    const article = await generateWithModel(prompt, model)
    console.log(`[KI] Trip-Artikel generiert: ${article.length} Zeichen`)

    // Hashtags extrahieren
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      article,
      imageDescriptions,
      hashtags: uniqueHashtags.join(' '),
      lifestyle
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
  const text = sanitizeInput(req.body.text) || 'Bericht'
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife'
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Bericht: "${title}", Bilder: ${images.length}, Modell: ${model}, Lifestyle: ${lifestyle}`)

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
            { type: 'text', text: `Beschreibe dieses Bild für einen authentischen ${lifestyleConfig.vehicle}-Bericht. Fokus auf: Details, Problemlösung, praktische Aspekte. Schreibe wie Foster Huntington - direkt, ehrlich, informativ.` },
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

    // Foster Huntington Prompt für Berichte
    const prompt = `Du bist Foster Huntington und schreibst einen Bericht für ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS:
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

VERMEIDE:
${fosterHuntingtonStyle.avoid.map(a => `- ${a}`).join('\n')}

SCHREIBE EINEN BERICHT ÜBER: "${title}${description ? ' - ' + description : ''}"

STRUKTUR:
1. Hook: Beginne mit einer starken Aussage oder Frage
2. Problem: Was war die Herausforderung?
3. Lösung: Wie hast du es gelöst?
4. Lektion: Was hast du gelernt?
5. Call-to-Action: Frage an die Community

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location}
Kontext: ${text}

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

MAX 300 WÖRTER. Füge 5-8 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).
Beginne direkt. Keine Einleitung wie "In diesem Bericht...".`

    const article = await generateWithModel(prompt, model, lifestyle)
    
    const hashtags = article.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      article,
      hashtags: uniqueHashtags.join(' '),
      lifestyle
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
  const description = sanitizeInput(req.body.description) || ''
  const location = sanitizeInput(req.body.location) || 'Unbekannt'
  const gps_lat = sanitizeInput(req.body.gps_lat) || ''
  const gps_lon = sanitizeInput(req.body.gps_lon) || ''
  const model = req.body.model || 'llama4'
  const lifestyle = sanitizeInput(req.body.lifestyle) || 'vanlife'
  const images = req.files

  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'Mindestens ein Bild erforderlich' })
  }

  console.log(`[KI] Generiere Platz-Beschreibung: "${title}", Bilder: ${images.length}, GPS: ${gps_lat},${gps_lon}, Lifestyle: ${lifestyle}`)

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
            { type: 'text', text: `Beschreibe diesen Ort für ${lifestyleConfig.vehicle}-Reisende. Was ist besonders? Was muss man wissen? Schreibe praktisch und ehrlich.` },
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

    // Foster Huntington Prompt für Plätze
    const prompt = `Du bist Foster Huntington und beschreibst einen Ort für ${lifestyleConfig.community}. Dein Stil ist praktisch, direkt und ehrlich.

BEISPIEL:
"Dieser Platz hat nichts Spektakuläres. Aber er hat das, was zählt: Ruhe, Schatten und keinen Stress mit der Polizei. Genau das brauchst du manchmal."

SCHREIBE EINE BESCHREIBUNG FÜR: "${title}${description ? ' - ' + description : ''}"

ORT-DETAILS:
Standort: ${location}
GPS: ${gps_lat && gps_lon ? `${gps_lat}, ${gps_lon}` : 'Nicht verfügbar'}

Bilder zeigen: ${imageDescriptions.join('; ')}

STRUKTUR:
1. Was ist das Besondere? (1 Satz)
2. Praktische Infos (Parken, Wasser, Strom, Wifi)
3. Warnings (was man wissen muss)
4. Für wen geeignet?

SCHREIBSTIL:
- Kurz und direkt (max 150 Wörter)
- Keine schwärmenden Beschreibungen
- Fokus auf praktische Infos
- Ehrlich über Vor- und Nachteile

Füge 3-5 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).`

    const description_text = await generateWithModel(prompt, model, lifestyle)
    
    const hashtags = description_text.match(/#\w+/g) || []
    const uniqueHashtags = [...new Set(hashtags.map(tag => tag.replace('#', '')))]

    res.json({
      description: description_text,
      hashtags: uniqueHashtags.join(' '),
      lifestyle
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
  const images = req.files

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
            { type: 'text', text: `Beschreibe dieses Bild für eine authentische ${lifestyleConfig.vehicle}-Notiz. Fokus auf: Moment, Stimmung, was gerade passiert. Schreibe wie Foster Huntington - direkt, kurz, ehrlich.` },
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

    // Foster Huntington Prompt für Notizen
    const prompt = `Du bist Foster Huntington und schreibst eine kurze Notiz für ${lifestyleConfig.community}. Dein Stil ist:
${fosterHuntingtonStyle.principles.map(p => `- ${p}`).join('\n')}

BEISPIEL DEINES STILS:
"${lifestyleConfig.example1}"

"${lifestyleConfig.example2}"

SCHREIBE EINE NOTIZ ÜBER: "${title}${description ? ' - ' + description : ''}"

STRUKTUR:
1. Moment: Was passiert gerade?
2. Gefühl: Wie fühlst du dich dabei?
3. Frage: Was möchtest du wissen oder teilen?

Bilder zeigen: ${imageDescriptions.join('; ')}
Standort: ${location}
Kontext: ${text}

SCHREIBSTIL:
${fosterHuntingtonStyle.writingStyle.map(s => `- ${s}`).join('\n')}

MAX 150 WÖRTER. Füge 3-5 relevante Hashtags hinzu (inklusive #${lifestyleConfig.keywords[0]}).
Kurz, direkt, authentisch. Wie ein Instagram-Post, aber ehrlich.`

    const note = await generateWithModel(prompt, model, lifestyle)
    
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
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  console.log(`[Server] Backend läuft auf Port ${PORT}`)
  console.log(`[Server] GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
  console.log(`[Server] ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✓ Konfiguriert' : '✗ Fehlt!'}`)
})