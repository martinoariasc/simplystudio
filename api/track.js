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

    // Identificadores de atribución que manda el navegador (fbc = id de clic del
    // anuncio, fbp = id de navegador, external_id = id propio estable).
    // Sin estos, Meta no puede vincular la compra con el anuncio y la calidad de
    // coincidencias se desploma (~3/10), que es lo que hace que las ventas "no figuren".
    const ident = body.ident || {};
    const user_data = {
      client_ip_address: ip,
      client_user_agent: ua
    };
    if (ident.fbc) user_data.fbc = ident.fbc;
    if (ident.fbp) user_data.fbp = ident.fbp;
    if (ident.external_id) user_data.external_id = ident.external_id;

    const event = {
      event_name: body.event_name || 'PageView',
      event_time: Math.floor(Date.now() / 1000),
      event_id: body.event_id,
      action_source: 'website',
      event_source_url: body.event_source_url || req.headers['referer'] || '',
      user_data,
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
