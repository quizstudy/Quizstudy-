// netlify/functions/approve-payment.js
// Admin approves a payment — updates user's plan in Neon DB

const { neon } = require('@neondatabase/serverless');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const { userId, planId, planName, price, days } = JSON.parse(event.body || '{}');

    if (!userId || !planId || !days) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing fields' }) };
    }

    const sql = neon(process.env.NETLIFY_DATABASE_URL);

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    const plan = {
      planId,
      planName,
      price,
      days,
      activatedAt: new Date().toISOString(),
      expiry: expiry.toISOString(),
    };

    await sql`
      UPDATE users
      SET plan = ${JSON.stringify(plan)}, pending_plan = NULL
      WHERE id = ${userId}
    `;

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, plan }) };

  } catch (err) {
    console.error('approve-payment error', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error: ' + err.message }),
    };
  }
};

