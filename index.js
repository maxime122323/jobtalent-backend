const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialisation de l'IA Google Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Route de test
app.get('/', (req, res) => {
    res.json({ status: "JobTalent Backend en ligne 🚀" });
});

// Route sécurisée pour l'IA Tailor (Optimisation de CV)
app.post('/api/tailor', async (req, res) => {
    try {
        const { cv, jobDescription } = req.body;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Agis en tant qu'expert RH. Adapte ce CV pour qu'il corresponde parfaitement à cette offre d'emploi :\n\nCV du candidat :\n${cv}\n\nOffre d'emploi :\n${jobDescription}`,
        });

        res.json({ success: true, optimizedCv: response.text });
    } catch (error) {
        console.error("Erreur IA :", error);
        res.status(500).json({ success: false, error: "Erreur lors de la génération par l'IA" });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});