// ============================================================================
// Vercel Serverless Function: /api/submit-contact
// Envía contactos de forma segura a GoHighLevel API v2
// Protege el Private Integration Token en las variables de entorno de Vercel
// ============================================================================

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID || 'pWmoIvATwHwAM1vn0m0x';

  if (!apiKey) {
    console.error('GHL_API_KEY no está configurada en Vercel.');
    return res.status(500).json({ error: 'Configuración de CRM pendiente.' });
  }

  try {
    const payload = req.body || {};
    payload.locationId = locationId;

    const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28'
      },
      body: JSON.stringify(payload)
    });

    const data = await ghlResponse.json();

    if (!ghlResponse.ok) {
      console.warn('GHL API response warning:', data);
      return res.status(ghlResponse.status).json(data);
    }

    return res.status(200).json({ success: true, contact: data.contact || null });
  } catch (error) {
    console.error('Error enviando contacto a GHL:', error);
    return res.status(500).json({ error: error.message });
  }
};
