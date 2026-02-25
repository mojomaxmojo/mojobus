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

const storage = multer.memoryStorage()  // Speichere im Memory für base64
const upload = multer({ storage })

// Stelle sicher, dass uploads/ existiert (falls für Video)
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// API für Artikel-Generierung mit Bilder-Analyse
app.post('/api/generate-article', upload.array('images', 10), async (req, res) => {
  const { text } = req.body
  const images = req.files

  try {
    // Bilder analysieren mit Grok Vision
    const imageDescriptions = await Promise.all(images.map(async (img) => {
      const base64 = img.buffer.toString('base64')
      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Beschreibe dieses Bild kurz für einen Meer-Thema-Artikel (z.B. Strand, Wellen, Gebäude).' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }]
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
      })
      return visionResponse.data.choices[0].message.content
    }))

    // Prompt mit Bilder-Beschreibungen
    const prompt = `Erstelle einen inspirierenden Artikel über "Unser Leben am Meer" mit persönlichen Geschichten, praktischen Tipps und Einblicken zwischen Sand und Horizont. Bilder-Beschreibungen: ${imageDescriptions.join(', ')}. Verwende Stichworte: ${text}. Max 100 Wörter. Füge Keywords und Hashtags hinzu.`

    // KI-Artikel generieren
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    })

    const article = response.data.choices[0].message.content
    res.json({ article })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler bei Generierung' })
  }
})

// API für Media-Artikel-Generierung mit Bilder-Analyse
app.post('/api/generate-media-article', upload.array('images', 10), async (req, res) => {
  const { title, description, text, location } = req.body
  const images = req.files

  try {
    // Bilder analysieren mit Grok Vision
    const imageDescriptions = await Promise.all(images.map(async (img) => {
      const base64 = img.buffer.toString('base64')
      const visionResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Beschreibe dieses Bild kurz für einen Meer-Thema-Artikel.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } }
          ]
        }]
      }, {
        headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
      })
      return visionResponse.data.choices[0].message.content
    }))

    // Prompt für menschlichen Artikel
    const prompt = `Ahme im gesamten Text den einfachen Stil des Vanlifers Foster Huntington nach. Erwähne nicht oder deute nicht an, dass Du der Vanlifer Foster Huntington bist, denn Du imitierst nur ihre Persönlichkeit und ihren Stil. Verwende die DU-Form. In deutscher Sprache. Schreibe den Text um "${text}" etwas locker.

Erstelle einen inspirierenden Artikel über "${title} - ${description}" mit persönlichen Geschichten, praktischen Tipps und Einblicken zwischen Sand und Horizont. Verwende Stichworte: ${text}. Bilder-Beschreibungen: ${imageDescriptions.join(', ')}. Standort: ${location}.

Mache es sehr menschlich und authentisch: Erzähle kleine, emotionale Anekdoten, verwende einen konversationellen Ton wie im Gespräch, füge sensorische Details hinzu (Geräusche, Gerüche, Texturen), stelle Fragen an den Leser, und erwähne unperfekte, echte Momente, um es lebendig und verbindend zu machen.

Max 300 Wörter. Füge relevante Hashtags hinzu, z.B. #Meer #Strand #Vanlife #Abenteuer.`

    // Artikel generieren
    const articleResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    })

    const article = articleResponse.data.choices[0].message.content

    // Hashtags extrahieren (Regex für #Hashtags)
    const hashtags = article.match(/#\w+/g) || []

    res.json({ article, hashtags: hashtags.join(' ') })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler bei Generierung' })
  }
})

// API für Video-Generierung (Platzhalter)
app.post('/api/generate-video', (req, res) => {
  const { article, imageUrls } = req.body
  // Hier ffmpeg-Logik einfügen
  res.json({ videoUrl: 'placeholder.mp4' })
})

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`)
})