// node scripts/render-og.cjs  (нужен локальный сервер на :8080)
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await p.goto('http://localhost:8080/scripts/og.html', { waitUntil: 'networkidle' });
  await p.waitForSelector('body[data-ready]', { timeout: 30000 });
  await p.screenshot({ path: 'og.png' });
  // иконки
  await p.setViewportSize({ width: 180, height: 180 });
  await p.setContent(`<body style="margin:0;background:#070c16;display:grid;place-items:center;height:180px"><svg viewBox="0 0 32 32" width="132" height="132"><path d="M16 2 28 7v9c0 7-5.2 12.2-12 14C9.2 28.2 4 23 4 16V7z" fill="#e3192b"/><path d="M16 5.2 25 9v7c0 5.4-3.8 9.6-9 11.2-5.2-1.6-9-5.8-9-11.2V9z" fill="none" stroke="#fff" stroke-width="1.4"/><path d="M11 21 16 9l5 12h-2.6l-1-2.6h-2.8l-1 2.6zm4.2-4.6h1.6L16 14.2z" fill="#fff"/></svg></body>`);
  await p.screenshot({ path: 'apple-touch-icon.png' });
  await b.close();
})();
