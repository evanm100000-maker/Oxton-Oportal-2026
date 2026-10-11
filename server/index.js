const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

// Load service account key – replace with your own file from Firebase console.
// You can place the JSON file at `server/serviceAccountKey.json`.
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = require(serviceAccountPath);
} catch (e) {
  console.warn('⚠️ Service account key not found. Please add `serviceAccountKey.json` in the server folder.');
  serviceAccount = null;
}

if (serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://oxton-oportal-default-rtdb.europe-west1.firebasedatabase.app'
  });
}

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

// Example protected endpoint – clear all flight logs (admin only)
app.post('/admin/clear-logs', async (req, res) => {
  const secret = req.body.secret;
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    await db.ref('flightLogs').remove();
    res.json({ ok: true });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend listening on port ${PORT}`));
