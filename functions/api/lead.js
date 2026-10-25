/* ================================================================
   /api/lead  (Cloudflare Pages Function)

   Runs on Cloudflare's servers every time a SoCal estimate form is
   submitted on the site. It:
     1. Adds the visitor to Quo as a contact (name, phone, email,
        ZIP, page), so their name shows up when they call or text.
     2. Sends them one instant text from the Aggrepoxy Quo number.
     3. Pushes a clean alert to your phone (Pushover): name, number,
        project details. Tapping the number opens Quo.

   The Web3Forms email still fires separately from the browser.

   SETUP (Cloudflare dashboard > Workers & Pages > aggrepoxy site >
   Settings > Variables and Secrets), add to Production AND Preview:
     QUO_API_KEY   (Secret)  your Quo API key
     QUO_FROM      (Text)    +12139715868
     TEXT_ENABLED  (Text)    on    (set to "off" to stop texts but
                                    keep adding contacts)
     LEAD_TEXT     (Text)    optional: custom message. {first} is
                             replaced with their first name.
     PUSHOVER_TOKEN (Secret) Pushover application API token
     PUSHOVER_USER  (Secret) your Pushover user key

   Quo bills API texts at about $0.01 each from prepaid API credits.
================================================================ */

const QUO = 'https://api.quo.com/v1';

const DEFAULT_TEXT =
  "Hi {first}, it's Jordan, owner of Aggrepoxy Floor Coatings. Got your floor estimate request! " +
  'Do weekdays or weekends work better for a free 20-min visit? Reply STOP to opt out';

// Don't text the same number twice within this window (resubmits, double clicks).
const RETEXT_AFTER_DAYS = 7;

export async function onRequestPost({ request, env }) {
  const out = { ok: true, contact: 'skipped', text: 'skipped' };

  // Only accept posts from our own site (live domain or Cloudflare previews).
  const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
  let host = '';
  try { host = new URL(origin).hostname; } catch (e) {}
  const allowed = host === 'aggrepoxy.com' || host.endsWith('.aggrepoxy.com') || host.endsWith('.pages.dev');
  if (!allowed) return json({ ok: false, error: 'origin' }, 403);

  let d;
  try { d = await request.json(); } catch (e) { return json({ ok: false, error: 'bad json' }, 400); }

  // Chicago forms aren't on the SoCal number.
  if (/chicago/i.test(String(d.form || ''))) return json(out);

  const phone = toE164(d.phone);
  if (!phone) return json({ ok: false, error: 'phone' }, 400);

  const first = clean(d.first_name, 40) || clean(d.name, 40).split(' ')[0] || 'there';
  const last = clean(d.last_name, 40);
  const email = clean(d.email, 120);
  const zip = clean(d.zip, 10);
  const page = clean(d.page, 120);
  const details = clean(d.details, 600);
  const fullName = clean(d.name, 80) || [first, last].filter(Boolean).join(' ');

  // 0. Phone alert first, so it lands fastest.
  out.push = await pushAlert(env, { fullName, phone, details });

  if (!env.QUO_API_KEY) { console.log('lead: QUO_API_KEY not set'); return json({ ...out, error: 'not configured' }); }
  const headers = { Authorization: env.QUO_API_KEY, 'Content-Type': 'application/json' };
  const externalId = 'web-' + phone.slice(2);

  // 1. Contact: reuse if this website lead already exists in Quo.
  let existing = null;
  try {
    const r = await fetch(`${QUO}/contacts?externalIds=${encodeURIComponent(externalId)}&maxResults=1`, { headers });
    if (r.ok) { const j = await r.json(); existing = (j.data || []).find(c => c.externalId === externalId) || null; }
  } catch (e) { console.log('lead: contact lookup failed', String(e)); }

  if (existing) {
    out.contact = 'exists';
  } else {
    const body = {
      defaultFields: {
        firstName: first === 'there' ? 'Website lead' : first,
        lastName: last && last !== first ? last : null,
        company: null,
        role: ['Website lead', zip ? 'ZIP ' + zip : ''].filter(Boolean).join(', '),
        emails: email ? [{ name: 'email', value: email }] : [],
        phoneNumbers: [{ name: 'mobile', value: phone }],
      },
      source: 'aggrepoxy-website',
      sourceUrl: 'https://aggrepoxy.com' + (page.startsWith('/') ? page : '/'),
      externalId,
    };
    try {
      const r = await fetch(`${QUO}/contacts`, { method: 'POST', headers, body: JSON.stringify(body) });
      out.contact = r.ok ? 'created' : 'error ' + r.status;
      if (!r.ok) console.log('lead: contact create failed', r.status, await r.text());
    } catch (e) { out.contact = 'error'; console.log('lead: contact create threw', String(e)); }
  }

  // 2. Instant text.
  const recentlyTexted = existing && existing.createdAt &&
    (Date.now() - Date.parse(existing.createdAt)) < RETEXT_AFTER_DAYS * 86400000;
  if (String(env.TEXT_ENABLED || 'on').toLowerCase() === 'off') {
    out.text = 'disabled';
  } else if (recentlyTexted) {
    out.text = 'already texted';
  } else if (!env.QUO_FROM) {
    out.text = 'no QUO_FROM';
  } else {
    const content = (env.LEAD_TEXT || DEFAULT_TEXT).replace(/\{first\}/g, first);
    try {
      const r = await fetch(`${QUO}/messages`, {
        method: 'POST', headers,
        body: JSON.stringify({ content, from: env.QUO_FROM, to: [phone] }),
      });
      out.text = r.ok ? 'sent' : 'error ' + r.status;
      if (!r.ok) console.log('lead: text failed', r.status, await r.text());
    } catch (e) { out.text = 'error'; console.log('lead: text threw', String(e)); }
  }

  console.log('lead:', externalId, out.contact, out.text, 'push', out.push);
  return json(out);
}

// Pushover alert: name, tappable number (opens Quo), project details.
async function pushAlert(env, { fullName, phone, details }) {
  if (!env.PUSHOVER_TOKEN || !env.PUSHOVER_USER) return 'not configured';
  const pretty = `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
  const from = String(env.QUO_FROM || '').replace(/\D/g, '').slice(-10);
  const dial = `openphone://dial?number=${encodeURIComponent(phone)}`;
  const call = dial + (from ? `&from=${from}` : '') + '&action=call';
  const message = [
    `<b>${esc(fullName || 'Website lead')}</b>`,
    `<a href="${dial}">${pretty}</a>`,
    details ? esc(details) : '<i>No project details</i>',
  ].join('\n');
  const form = new URLSearchParams({
    token: env.PUSHOVER_TOKEN,
    user: env.PUSHOVER_USER,
    title: 'New website lead',
    message,
    html: '1',
    url: call,
    url_title: `Call ${pretty} in Quo`,
    priority: '1',
  });
  try {
    const r = await fetch('https://api.pushover.net/1/messages.json', { method: 'POST', body: form });
    if (!r.ok) { console.log('lead: pushover failed', r.status, await r.text()); return 'error ' + r.status; }
    return 'sent';
  } catch (e) { console.log('lead: pushover threw', String(e)); return 'error'; }
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// US/Canada numbers only, valid area code and exchange.
function toE164(raw) {
  let n = String(raw || '').replace(/\D/g, '');
  if (n.length === 11 && n[0] === '1') n = n.slice(1);
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(n)) return null;
  return '+1' + n;
}

function clean(v, max) {
  return String(v || '').replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
