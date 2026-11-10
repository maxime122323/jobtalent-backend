const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

const app = express();
app.use(express.static('public'));
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

// Fonction pour récupérer le token d'accès France Travail
async function getFranceTravailToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.FRANCE_TRAVAIL_CLIENT_ID);
  params.append('client_secret', process.env.FRANCE_TRAVAIL_CLIENT_SECRET);
  params.append('scope', 'api_offresdemploiv2 o2demploi');

  const response = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await response.json();
  return data.access_token;
}

// Route pour chercher des offres d'emploi
app.get('/api/jobs', async (req, res) => {
  try {
    const keyword = req.query.keyword || 'developpeur';
    const token = await getFranceTravailToken();

    const response = await fetch(`https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search?motsClefs=${keyword}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const jobs = await response.json();
    res.json(jobs);
  } catch (error) {
    console.error("Erreur France Travail:", error);
    res.status(500).json({ error: "Erreur lors de la récupération des offres" });
  }
});