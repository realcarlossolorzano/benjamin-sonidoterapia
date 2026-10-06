// ============================================================================
// Vercel Serverless Function: /api/create-payment-intent
// Genera un PaymentIntent directamente contra la REST API de Stripe ($77 USD)
// Cero dependencias externas (usa native fetch de Node 18+)
// ============================================================================

export default async function handler(req, res) {
  // Encabezados CORS
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

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return res.status(500).json({
      error: 'STRIPE_SECRET_KEY no está configurada en las variables de entorno de Vercel.',
      configNeeded: true
    });
  }

  try {
    const { name, email, phone, eventOption } = req.body || {};

    // Monto fijo: $77 USD (7700 centavos)
    const params = new URLSearchParams();
    params.append('amount', '7700');
    params.append('currency', 'usd');
    params.append('automatic_payment_methods[enabled]', 'true');
    params.append('description', `Terapia de Sonido Grupal - Entrada Fundador ($77 USD) - ${eventOption || 'General'}`);
    if (email) params.append('receipt_email', email);
    
    // Metadatos para trazabilidad en Stripe Dashboard
    params.append('metadata[customer_name]', name || '');
    params.append('metadata[customer_email]', email || '');
    params.append('metadata[customer_phone]', phone || '');
    params.append('metadata[event_option]', eventOption || '');
    params.append('metadata[product_name]', 'Del Ruido a la Presencia - Terapia de sonido grupal');
    params.append('metadata[ghl_location_id]', process.env.GHL_LOCATION_ID || 'pWmoIvATwHwAM1vn0m0x');

    const stripeRes = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error('Error de Stripe API:', data);
      return res.status(stripeRes.status).json({
        error: data.error ? data.error.message : 'Error al conectar con Stripe'
      });
    }

    return res.status(200).json({
      clientSecret: data.client_secret,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
    });

  } catch (error) {
    console.error('Error interno en create-payment-intent:', error);
    return res.status(500).json({ error: error.message });
  }
}
