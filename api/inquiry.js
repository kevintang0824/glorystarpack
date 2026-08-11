const SALES_EMAIL = 'kevin@glorystarpack.com';
const FROM_EMAIL = 'GloryStarPack Website <rfq@glorystarpack.com>';
const MAX_BODY_BYTES = 16_384;

const fieldLimits = {
  name: 100,
  company: 120,
  email: 254,
  country: 100,
  product: 180,
  capacity: 80,
  quantity: 80,
  closure: 120,
  decoration: 180,
  notes: 2_000,
  sourcePage: 500,
  attributedSourcePage: 500,
  previousSitePage: 500,
  intent: 40,
  website: 200
};

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(JSON.stringify(payload));
}

function clean(value, limit) {
  return String(value ?? '')
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, limit);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseBody(request) {
  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
    return request.body;
  }

  const rawBody = Buffer.isBuffer(request.body)
    ? request.body.toString('utf8')
    : String(request.body || '');
  const contentType = String(request.headers?.['content-type'] || '').toLowerCase();

  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }
  return rawBody ? JSON.parse(rawBody) : {};
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.origin === 'https://www.glorystarpack.com' || parsed.origin === 'https://glorystarpack.com') return true;
    if (parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app')) return true;
    return ['localhost', '127.0.0.1'].includes(parsed.hostname) && parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function emailIsValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function renderRows(payload) {
  const rows = [
    ['Name', payload.name],
    ['Company', payload.company || 'Not provided'],
    ['Email', payload.email],
    ['Product / application', payload.product],
    ['Capacity / size', payload.capacity || 'Not provided'],
    ['Closure / component', payload.closure || 'Not provided'],
    ['Decoration', payload.decoration || 'Not provided'],
    ['Estimated quantity', payload.quantity],
    ['Destination country', payload.country],
    ['Formula / timeline / notes', payload.notes || 'Not provided'],
    ['Website page', payload.sourcePage || 'Not provided'],
    ['Original interest page', payload.attributedSourcePage || 'Not provided'],
    ['Inquiry intent', payload.intent || 'Not provided'],
    ['Previous site page', payload.previousSitePage || 'Not provided']
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = rows.map(([label, value]) => (
    `<tr><th style="padding:8px 12px;text-align:left;vertical-align:top;border-bottom:1px solid #e6e0d7;color:#4b3d27">${escapeHtml(label)}</th>` +
    `<td style="padding:8px 12px;vertical-align:top;border-bottom:1px solid #e6e0d7;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
  )).join('');
  return { text, html };
}

module.exports = async function inquiryHandler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { ok: false, message: 'Method not allowed.' });
  }

  const contentLength = Number(request.headers?.['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return sendJson(response, 413, { ok: false, message: 'The inquiry is too large.' });
  }
  if (!isAllowedOrigin(request.headers?.origin)) {
    return sendJson(response, 403, { ok: false, message: 'Request origin is not allowed.' });
  }

  let rawPayload;
  try {
    rawPayload = parseBody(request);
  } catch {
    return sendJson(response, 400, { ok: false, message: 'Invalid inquiry data.' });
  }

  const payload = Object.fromEntries(
    Object.entries(fieldLimits).map(([field, limit]) => [field, clean(rawPayload[field], limit)])
  );

  // Quietly accept honeypot submissions so automated senders receive no useful feedback.
  if (payload.website) return sendJson(response, 200, { ok: true });

  const missingFields = ['name', 'email', 'country', 'product', 'quantity'].filter(field => !payload[field]);
  if (missingFields.length) {
    return sendJson(response, 400, { ok: false, message: 'Please complete all required fields.' });
  }
  if (!emailIsValid(payload.email)) {
    return sendJson(response, 400, { ok: false, message: 'Please enter a valid business email.' });
  }

  const startedAt = Number(rawPayload.startedAt || 0);
  if (startedAt && Date.now() - startedAt < 1_200) {
    return sendJson(response, 429, { ok: false, message: 'Please review the inquiry details and try again.' });
  }

  if (!process.env.RESEND_API_KEY) {
    return sendJson(response, 503, { ok: false, message: 'The inquiry service is temporarily unavailable.' });
  }

  const rendered = renderRows(payload);
  const productSubject = payload.product.replace(/[\r\n]+/g, ' ');
  const quantitySubject = payload.quantity.replace(/[\r\n]+/g, ' ');
  const countrySubject = payload.country.replace(/[\r\n]+/g, ' ');

  try {
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'glorystarpack-rfq/1.0'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SALES_EMAIL],
        reply_to: payload.email,
        subject: `[Website RFQ] ${productSubject} · ${quantitySubject} · ${countrySubject}`,
        text: `A new website RFQ was submitted.\n\n${rendered.text}\n\nReceived: ${new Date().toISOString()}`,
        html: `<div style="font-family:Arial,sans-serif;color:#211d17;line-height:1.5"><h1 style="font-size:20px">New website RFQ</h1><table style="border-collapse:collapse;width:100%;max-width:760px">${rendered.html}</table><p style="color:#6d6458;font-size:12px">Received ${escapeHtml(new Date().toISOString())}</p></div>`
      })
    });

    if (!resendResponse.ok) {
      return sendJson(response, 502, { ok: false, message: 'The inquiry could not be delivered. Please use email or WhatsApp below.' });
    }
    return sendJson(response, 200, { ok: true });
  } catch {
    return sendJson(response, 502, { ok: false, message: 'The inquiry could not be delivered. Please use email or WhatsApp below.' });
  }
};
