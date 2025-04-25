const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();

const PORT = 3000;
const LOG_FILE = 'logs.json';
const WHOIS_API = 'https://ipwho.is';

app.get('/track', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0];

  try {
    const response = await axios.get(`${WHOIS_API}/${ip}`);
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

    let logs = [];
    if (fs.existsSync(LOG_FILE)) {
      const fileData = fs.readFileSync(LOG_FILE);
      logs = JSON.parse(fileData);
    }

    logs.push(logEntry);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));

    res.redirect('https://iziway.cm/')
  } catch (error) {
    console.error('Erreur WHOIS:', error.message);
    res.status(500).send('Erreur lors du tracking.');
  }
});

app.get('/dashboard', (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.send('<h1>Aucune donnée de tracking trouvée.</h1>');
  }

  const logs = JSON.parse(fs.readFileSync(LOG_FILE));

  let html = `
    <html>
      <head>
        <title>Dashboard Tracking</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
          table { border-collapse: collapse; width: 100%; background: white; }
          th, td { padding: 10px; border: 1px solid #ccc; text-align: left; }
          th { background: #eee; }
        </style>
      </head>
      <body>
        <h1>Visiteurs trackés</h1>
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Date</th>
              <th>Pays</th>
              <th>Région</th>
              <th>Ville</th>
              <th>Latitude</th>
              <th>Longitude</th>
            </tr>
          </thead>
          <tbody>
  `;

  for (const entry of logs) {
    html += `
      <tr>
        <td>${entry.ip}</td>
        <td>${entry.timestamp}</td>
        <td>${entry.location.country}</td>
        <td>${entry.location.region}</td>
        <td>${entry.location.city}</td>
        <td>${entry.location.latitude}</td>
        <td>${entry.location.longitude}</td>
      </tr>
    `;
  }

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  res.send(html);
});

app.listen(PORT, () => {
  console.log(`Serveur en écoute sur http://localhost:${PORT}/track`);
});
