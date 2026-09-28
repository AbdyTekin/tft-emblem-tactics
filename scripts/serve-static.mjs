// scripts/serve-static.mjs
// Serves the static export in out/ with the same response headers as production (vercel.json),
// so CSP and caching can be checked locally: `npm run build && npm run preview`.
// Only the simple regex-style `source` patterns used in vercel.json are supported.
import fs from 'fs';
import http from 'http';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'out');
const PORT = Number(process.env.PORT) || 4173;
const HOST = '127.0.0.1';

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
};

if (!fs.existsSync(ROOT)) {
    console.error('out/ not found. Run `npm run build` first.');
    process.exit(1);
}

const vercel = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'vercel.json'), 'utf8'));
const headerRules = (vercel.headers || []).map(rule => ({ pattern: new RegExp(`^${rule.source}$`), headers: rule.headers }));

function resolveFile(urlPath) {
    const candidates = urlPath.endsWith('/')
        ? [path.join(urlPath, 'index.html')]
        : [urlPath, `${urlPath}.html`, path.join(urlPath, 'index.html')];
    for (const candidate of candidates) {
        const file = path.resolve(ROOT, `.${candidate}`);
        // Never serve anything outside out/
        if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null;
        if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
    }
    return null;
}

http.createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' }).end();
        return;
    }

    let urlPath;
    try {
        urlPath = decodeURIComponent(new URL(req.url, `http://${HOST}`).pathname);
    } catch {
        res.writeHead(400).end();
        return;
    }

    for (const rule of headerRules) {
        if (rule.pattern.test(urlPath)) for (const { key, value } of rule.headers) res.setHeader(key, value);
    }

    const file = resolveFile(urlPath);
    const status = file ? 200 : 404;
    const body = file ?? path.join(ROOT, '404.html');
    res.writeHead(status, { 'Content-Type': MIME[path.extname(body)] || 'application/octet-stream' });
    if (req.method === 'HEAD') res.end();
    else fs.createReadStream(body).pipe(res);
}).listen(PORT, HOST, () => {
    console.log(`Serving out/ with production headers at http://${HOST}:${PORT}`);
});
