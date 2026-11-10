const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware pour parser le JSON et servir le dossier public
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables d'environnement
const CLIENT_ID = process.env.FRANCE_TRAVAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.FRANCE_TRAVAIL_CLIENT_SECRET;

// Fonction pour obtenir le token d'accès OAuth2 France Travail
async function getAccessToken() {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('scope', 'api_labonneboitev2'); // Scope pour La Bonne Boite

        const response = await axios.post(
            'https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error('Erreur lors de la récupération du token :', error.response?.data || error.message);
        throw new Error('Impossible de s authentifier auprès de l API France Travail');
    }
}

// Route API pour rechercher des entreprises qui recrutent via La Bonne Boite
app.get('/api/jobs', async (req, res) => {
    try {
        const { what, where } = req.query;
        const accessToken = await getAccessToken();

        // Exemple de requête sur La Bonne Boite (autour d'une géolocalisation ou code ROME)
        // Par défaut, on cherche des entreprises (ex: code ROME M1605 pour l'informatique ou paramètres par défaut)
        const response = await axios.get(
            'https://api.francetravail.io/partenaire/labonneboitev2/v1/rome',
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                params: {
                    rome_code: 'M1605', // Code ROME par défaut (ex: développement informatique)
                    latitude: 48.8566,   // Paris par défaut (ou coordonnées basées sur 'where')
                    longitude: 2.3522,
                    distance: 30
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Erreur API La Bonne Boite :', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des données',
            details: error.response?.data || error.message 
        });
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});