const crypto = require('crypto');

const COOKIE = 'luxum_session';
const ALLOWED_FILES = ['index.html', 'styles.css', 'script.js'];
const MAX_FILE_SIZE = 2_000_000;

function json(res, status, body, extraHeaders = {}) {
  res.status(status).set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders }).json(body);
}
function config() {
  const required = ['ADMIN_USER', 'ADMIN_PASSWORD', 'ADMIN_SESSION_SECRET', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) throw new Error('Missing Vercel environment variables: ' + missing.join(', '));
  return {
    user: process.env.ADMIN_USER,
    pass: process.env.ADMIN_PASSWORD,
    secret: process.env.ADMIN_SESSION_SECRET,
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER,
    repo: process.env.GITHUB_REPO,
    branch: process.env.GITHUB_BRANCH || 'main'
  };
}
function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}
function makeSession(secret) {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  return payload + '.' + sign(payload, secret);
}
function validSession(req, secret) {
  const raw = (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(COOKIE + '='));
  if (!raw) return false;
  const token = raw.slice(COOKIE.length + 1);
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const expected = Buffer.from(sign(parts[0], secret));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return false;
  try { return JSON.parse(Buffer.from(parts[0], 'base64url').toString()).exp > Date.now(); } catch { return false; }
}
async function github(path, method = 'GET', body) {
  const c = config();
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(c.branch)}`, {
    method,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${c.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'LUXUM-admin'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `GitHub request failed (${response.status})`);
  return data;
}
async function readFile(name) {
  const d = await github(name);
  return { content: Buffer.from(d.content.replace(/\n/g, ''), 'base64').toString('utf8'), sha: d.sha };
}
async function writeFile(name, content, message) {
  const current = await readFile(name);
  return github(name, 'PUT', {
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    sha: current.sha,
    branch: config().branch
  });
}
module.exports = async function handler(req, res) {
  let c;
  try { c = config(); }
  catch (e) { return json(res, 500, { error: e.message }); }
  const action = req.query.action;
  try {
    if (action === 'login' && req.method === 'POST') {
      const { username, password } = req.body || {};
      const u = Buffer.from(String(username || ''));
      const p = Buffer.from(String(password || ''));
      const eu = Buffer.from(c.user), ep = Buffer.from(c.pass);
      const userOK = u.length === eu.length && crypto.timingSafeEqual(u, eu);
      const passOK = p.length === ep.length && crypto.timingSafeEqual(p, ep);
      if (!userOK || !passOK) return json(res, 401, { error: 'Invalid username or password.' });
      const token = makeSession(c.secret);
      return json(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800` });
    }
    if (!validSession(req, c.secret)) return json(res, 401, { error: 'Please sign in.' });
    if (action === 'logout' && req.method === 'POST') {
      return json(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` });
    }
    if (action === 'content' && req.method === 'GET') {
      const contents = {};
      for (const name of ALLOWED_FILES) contents[name] = (await readFile(name)).content;
      const phone = (contents['script.js'].match(/const WHATSAPP_NUMBER = '([^']*)'/) || [])[1] || '';
      return json(res, 200, { files: contents, phone });
    }
    if (action === 'content' && req.method === 'PUT') {
      const files = req.body && req.body.files;
      if (!files || typeof files !== 'object') return json(res, 400, { error: 'No website files received.' });
      for (const name of ALLOWED_FILES) {
        if (typeof files[name] !== 'string') continue;
        if (files[name].length > MAX_FILE_SIZE) return json(res, 413, { error: `${name} is too large.` });
        await writeFile(name, files[name], `LUXUM admin: update ${name}`);
      }
      return json(res, 200, { ok: true, message: 'Saved to GitHub. Vercel will redeploy the website automatically.' });
    }
    if (action === 'phone' && req.method === 'PUT') {
      const phone = String((req.body || {}).phone || '').replace(/\D/g, '');
      if (!/^\d{10,15}$/.test(phone)) return json(res, 400, { error: 'Enter 10–15 digits including country code.' });
      const current = await readFile('script.js');
      const updated = current.content.replace(/const WHATSAPP_NUMBER = '[^']*'/, `const WHATSAPP_NUMBER = '${phone}'`);
      if (updated === current.content) return json(res, 400, { error: 'Could not find the WhatsApp number setting in script.js.' });
      await writeFile('script.js', updated, 'LUXUM admin: update WhatsApp number');
      return json(res, 200, { ok: true, message: 'WhatsApp number saved. Vercel will redeploy automatically.' });
    }
    return json(res, 404, { error: 'Not found.' });
  } catch (e) {
    return json(res, 500, { error: e.message || 'Server error.' });
  }
};
