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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage })

// Stelle sicher, dass uploads/ existiert
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}

// API für Artikel-Generierung (Meer-Thema)
app.post('/api/generate-article', upload.array('images', 10), async (req, res) => {
  const { text } = req.body
  const images = req.files

  try {
    // Groq-API Call (ersetze mit echtem Key)
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
      messages: [{
        role: 'user',
        content: `Erstelle einen inspirierenden Artikel über "Unser Leben am Meer" mit persönlichen Geschichten, praktischen Tipps und Einblicken zwischen Sand und Horizont. Verwende Stichworte: ${text}. Max 100 Wörter. Füge Keywords und Hashtags hinzu.`
      }]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` }
    })

    const article = response.data.choices[0].message.content
    res.json({ article })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Fehler bei Artikel-Generierung' })
  }
})

// API für Video-Generierung (Platzhalter)
app.post('/api/generate-video', (req, res) => {
  const { article } = req.body
  // Hier ffmpeg-Logik einfügen später
  res.json({ videoUrl: 'placeholder.mp4' })
})

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`)
})