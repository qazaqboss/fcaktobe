// Сборка для Vercel: копирует сайт в dist/ и подставляет абсолютный адрес
// для превью ссылки (og:image). Vercel сам задаёт VERCEL_PROJECT_PRODUCTION_URL.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const host = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of ['assets', 'og.png', 'favicon.svg', 'apple-touch-icon.png']) cpSync(f, `dist/${f}`, { recursive: true });
writeFileSync('dist/index.html', readFileSync('index.html', 'utf8').replaceAll('%SITE_URL%', host));
console.log('built dist/ with SITE_URL =', host || '(relative)');
