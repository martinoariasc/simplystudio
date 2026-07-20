// API de Conversiones (CAPI) de Meta — función serverless en Vercel.
// Recibe un evento desde el navegador y lo reenvía a Meta servidor-a-servidor.
// El token va en la variable de entorno META_CAPI_TOKEN (secreta, NO en el código).

const PIXEL_ID = '1448725857302388';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'method not allowed' });
  }

  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    // Todavía no se configuró el token: no rompemos nada, solo avisamos.
    return res.status(200).json({ ok: false, reason: 'META_CAPI_TOKEN no configurado' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    body = body || {};

    const xff = req.headers['x-forwarded-for'] || '';
    const ip = xff.split(',')[0].trim();
    const ua = req.headers['user-agent'] || '';

    const event = {
      event_name: body.event_name || 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      action_source: 'website',
      event_source_url: body.event_source_url || req.headers['referer'] || '',
      user_data: {
        client_ip_address: ip,
        client_user_agent: ua
      },
      custom_data: body.params || {}
    };

    const url = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [event] })
    });
    const json = await resp.json();
    return res.status(200).json({ ok: resp.ok, meta: json });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
