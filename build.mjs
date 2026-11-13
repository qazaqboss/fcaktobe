// Сборка для Vercel: копирует сайт в dist/, подставляет абсолютный адрес
// для превью ссылки (og:image) и проставляет версию во все JS/CSS-адреса,
// чтобы телефоны после обновления не склеивали старые скрипты с новой страницей.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const host = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '');
const ver = (process.env.VERCEL_GIT_COMMIT_SHA || Date.now().toString(36)).slice(0, 8);
rmSync('dist', { recursive: true, force: true });
mkdirSync('dist');
for (const f of ['assets', 'og.png', 'favicon.svg', 'apple-touch-icon.png']) cpSync(f, `dist/${f}`, { recursive: true });

// версия в импортах внутри модулей: from './x.js' / import('./x.js')
const tag = s => s.replace(/(\bfrom\s*|\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"?]+\.js)\2/g, `$1$2$3?v=${ver}$2`);
for (const dir of ['dist/assets/js', 'dist/assets/vendor'])
  for (const f of readdirSync(dir)) if (f.endsWith('.js') && f !== 'three.module.min.js') {
    const p = join(dir, f); writeFileSync(p, tag(readFileSync(p, 'utf8')));
  }
// версия в ссылках страницы
const html = readFileSync('index.html', 'utf8').replaceAll('%SITE_URL%', host)
  .replace(/(\/assets\/(?:css|js|vendor)\/[\w.-]+\.(?:css|js))"/g, `$1?v=${ver}"`);
writeFileSync('dist/index.html', html);
console.log('built dist/ · SITE_URL =', host || '(relative)', '· v =', ver);
