// ============================================================================
// Vercel Serverless Function: /api/create-payment-intent
// Genera un PaymentIntent con Stripe soportando montos dinámicos:
// - $30 USD (3000 centavos) · Abono Inicial (Saldo pendiente: $47 USD)
// - $50 USD (5000 centavos) · Abono Parcial (Saldo pendiente: $27 USD)
// - $77 USD (7700 centavos) · Pago Completo Fundador (Saldo: $0 USD)
// Cero dependencias externas (usa native fetch de Node 18+)
// ============================================================================

module.exports = async function handler(req, res) {
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
    const { name, email, phone, eventOption, amount } = req.body || {};

    // Diccionario de montos permitidos para validar seguridad
    const ALLOWED_AMOUNTS = {
      3000: { usd: 30, label: 'Abono Inicial ($30 USD)', remaining: 47, plan: 'abono_inicial' },
      5000: { usd: 50, label: 'Abono Parcial ($50 USD)', remaining: 27, plan: 'abono_parcial' },
      7700: { usd: 77, label: 'Pago Completo Fundador ($77 USD)', remaining: 0, plan: 'pago_completo' },
      9000: { usd: 90, label: 'Entrada General ($90 USD)', remaining: 0, plan: 'pago_completo' }
    };

    let chargeAmount = 7700;
    const requestedNum = parseInt(amount, 10);
    if (ALLOWED_AMOUNTS[requestedNum]) {
      chargeAmount = requestedNum;
    } else if ([30, 50, 77, 90].includes(requestedNum)) {
      chargeAmount = requestedNum * 100;
    }

    const planInfo = ALLOWED_AMOUNTS[chargeAmount] || ALLOWED_AMOUNTS[7700];

    const params = new URLSearchParams();
    params.append('amount', chargeAmount.toString());
    params.append('currency', 'usd');
    params.append('automatic_payment_methods[enabled]', 'true');
    params.append('description', `Terapia de Sonido Grupal - ${planInfo.label} - ${eventOption || 'General'}`);
    if (email) params.append('receipt_email', email);
    
    // Metadatos para trazabilidad en Stripe Dashboard y webhooks
    params.append('metadata[customer_name]', name || '');
    params.append('metadata[customer_email]', email || '');
    params.append('metadata[customer_phone]', phone || '');
    params.append('metadata[event_option]', eventOption || '');
    params.append('metadata[payment_type]', planInfo.plan);
    params.append('metadata[amount_paid_usd]', planInfo.usd.toString());
    params.append('metadata[remaining_balance_usd]', planInfo.remaining.toString());
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
      chargeAmount: chargeAmount,
      amountUsd: planInfo.usd,
      remainingUsd: planInfo.remaining,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
    });

  } catch (error) {
    console.error('Error interno en create-payment-intent:', error);
    return res.status(500).json({ error: error.message });
  }
};
