// node presentation/build.mjs — из slides.json собирает сценарий, тексты для TTS и субтитры
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const D = JSON.parse(readFileSync(join(here, 'slides.json'), 'utf8'));
const tc = s => { const m = Math.floor(s / 60), x = Math.round(s % 60); return `${m}:${String(x).padStart(2, '0')}`; };
const srtT = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = Math.floor(s % 60), ms = Math.round((s % 1) * 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')},${String(ms).padStart(3, '0')}`; };
// реальная длительность озвучки, если она уже сгенерирована
let dur = {}; try { dur = JSON.parse(readFileSync(join(here, 'audio', 'durations.json'), 'utf8')); } catch {}
mkdirSync(join(here, 'narration'), { recursive: true });
let t = 0, md = `# ${D.title}\n\n**${D.subtitle}**\n\n- **Формат:** ${D.format}\n- **Музыка:** ${D.music}\n- **Где брать кадры:** сайт проекта — 3D-история на первом экране (проценты — доля прокрутки истории) и разделы ниже.\n\n`;
const rows = [], srt = [];
for (const s of D.slides) {
  const id = String(s.n).padStart(2, '0');
  const a = dur[id] ? Math.max(s.sec, Math.ceil(dur[id] + 1.5)) : s.sec;
  writeFileSync(join(here, 'narration', `${id}.txt`), s.tts + '\n');
  rows.push(`| ${s.n} | ${s.name} | ${tc(t)}–${tc(t + a)} | ${a} с |`);
  md += `---\n\n## Слайд ${s.n} · ${s.name}\n\n**${tc(t)} – ${tc(t + a)}** · ${a} с${dur[id] ? ` · голос ${dur[id].toFixed(1)} с` : ''}\n\n**Кадр:** ${s.shot}\n\n**Титры на экране:**\n${s.screen.map(x => `- ${x}`).join('\n')}\n\n**Закадровый текст:**\n\n> ${s.vo}\n\n`;
  // субтитры: делим текст на фразы и распределяем по длительности голоса
  const speech = dur[id] || s.sec - 1.5, parts = s.vo.match(/[^.!?]+[.!?]+/g) || [s.vo];
  const total = parts.reduce((x, p) => x + p.length, 0); let st = t + 0.5;
  for (const p of parts) { const d = speech * p.length / total; srt.push(`${srt.length + 1}\n${srtT(st)} --> ${srtT(st + d)}\n${p.trim()}\n`); st += d; }
  t += a;
}
md = md.replace('\n\n---', `\n\n## Хронометраж\n\n| № | Слайд | Время | Длит. |\n|---|---|---|---|\n${rows.join('\n')}\n| | **Итого** | | **${tc(t)}** |\n\n---`);
md += `---\n\n## Полный закадровый текст (для диктора)\n\n${D.slides.map(s => `**${s.n}.** ${s.vo}`).join('\n\n')}\n`;
writeFileSync(join(here, 'script.md'), md);
writeFileSync(join(here, 'subtitles.srt'), srt.join('\n'));
console.log('slides', D.slides.length, 'total', tc(t), 'words', D.slides.reduce((x, s) => x + s.vo.split(/\s+/).length, 0));
