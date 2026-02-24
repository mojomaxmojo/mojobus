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

// API für Video-Generierung (Platzhalter)
app.post('/api/generate-video', (req, res) => {
  const { article, imageUrls } = req.body
  // Hier ffmpeg-Logik einfügen
  res.json({ videoUrl: 'placeholder.mp4' })
})

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`)
})