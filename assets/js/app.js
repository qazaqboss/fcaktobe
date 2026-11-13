import {
  V, ALL, calc, COMMON_Q, HALL, PITCH_AREA, TOUCH_X, CLEAR_MIN, CLIMATE, basePts, innerPts, fmtInt, dec
} from './model.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const R0 = ALL();
const byId = id => R0.find(r => r.v.id === id);
const peaks = R0.map(r => r.e.peakKW), minP = Math.min(...peaks);
const fastest = Math.min(...R0.map(r => r.v.months));
// рекомендация по проектным критериям: капитальность + энергоэффективность, при равенстве — меньшие теплопотери
const ranked = [...R0].sort((a, b) => (b.v.rate.capital + b.v.rate.energy) - (a.v.rate.capital + a.v.rate.energy) || a.e.peakKW - b.e.peakKW);
const BEST = ranked[0].v.id, ALT = 'hyb';
const m1 = n => dec(n, n % 1 ? 1 : 0);
const ss = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const XC = Object.fromEntries(V.map(v => [v.id, v.color]));

const G = {
  tent: [['Изыскания, проект, экспертиза', 0, 3, 1], ['Производство каркаса и мембраны', 2, 3], ['Фундаменты', 3, 1.5], ['Монтаж каркаса', 4.5, 1.5], ['Монтаж оболочки', 5.5, 1.5], ['Инженерные системы', 5.5, 2], ['Поле: основание + газон', 6.5, 1.5], ['АБК и благоустройство', 3.5, 4.5], ['Пусконаладка, ввод', 8, 1]],
  box: [['Изыскания, проект, экспертиза', 0, 3, 1], ['Производство каркаса', 2, 4], ['Фундаменты', 3, 2.5], ['Монтаж каркаса и ферм', 5, 3], ['Кровля и стены PIR', 7, 2.5], ['Инженерные системы', 7.5, 3], ['Поле: основание + газон', 9.5, 1.5], ['АБК и благоустройство', 3.5, 7], ['Пусконаладка, ввод', 11, 1]],
  hyb: [['Изыскания, проект, экспертиза', 0, 3, 1], ['Производство каркаса и мембраны', 2, 3.5], ['Фундаменты', 3, 2], ['Монтаж каркаса', 4.5, 2.5], ['Стены PIR + мембранная кровля', 6.5, 2], ['Инженерные системы', 6.5, 2.5], ['Поле: основание + газон', 8, 1.5], ['АБК и благоустройство', 3.5, 6], ['Пусконаладка, ввод', 9.5, 1]],
  wood: [['Изыскания, проект, экспертиза', 0, 3.5, 1], ['Производство и доставка клеёных арок', 2, 5], ['Фундаменты', 3.5, 2.5], ['Монтаж арок', 7, 3], ['Кровля и фасады', 9, 3], ['Инженерные системы', 9, 3.5], ['Поле: основание + газон', 12, 1.5], ['АБК и благоустройство', 4, 9], ['Пусконаладка, ввод', 13.5, 1]]
};

/* ---------- hero numbers ---------- */
const setK = (k, t) => $$(`[data-k="${k}"]`).forEach(e => e.textContent = t);
setK('pitch', fmtInt(PITCH_AREA) + ' м²');
setK('peakMin', fmtInt(Math.min(...R0.map(r => r.e.peakKW))));
setK('peakMax', fmtInt(Math.max(...R0.map(r => r.e.peakKW))));

/* ---------- STORY overlay ---------- */
const story = $('.story'), pin = $('#storyPin');
const chapters = $$('.ch').map(e => ({ e, a: +e.dataset.a, b: +e.dataset.b }));
const SV = [0.835, 0.875, 0.915, 0.955];
const svIdx = p => { let i = 0; SV.forEach((q, k) => { if (p >= q) i = k; }); return i; };
$('#svDots').innerHTML = V.map(v => `<span>${v.code}</span>`).join('');
let lastSv = -1;
function updateChapters(p) {
  const f = 0.028;
  for (const c of chapters) {
    const fin = c.a <= 0 ? 1 : ss((p - c.a) / f), fout = 1 - ss((p - (c.b - f)) / f);
    const o = Math.min(fin, fout);
    c.e.classList.toggle('vis', o > 0.001);
    if (o > 0.001) { c.e.style.opacity = o.toFixed(3); c.e.style.transform = `translate3d(0,${((1 - o) * 24).toFixed(1)}px,0)`; }
  }
  const i = svIdx(p);
  if (i !== lastSv) {
    lastSv = i; const r = R0[i];
    $('#svName').innerHTML = `<span style="color:${i === 1 ? '#ff5262' : XC[r.v.id]}">${r.v.code}</span> · ${r.v.name}`;
    $('#svType').textContent = r.v.type + ' · ' + r.v.tag;
    $('#svCap').textContent = `${m1(r.v.geo.H)} / ${m1(r.v.geo.h0)} м`; $('#svTco').textContent = `${fmtInt(r.e.peakKW)} кВт`; $('#svTerm').textContent = `${m1(r.v.months)} мес`;
    $$('#svDots span').forEach((s, k) => s.classList.toggle('on', k === i));
  }
  $('#rail').style.transform = `scaleY(${p.toFixed(4)})`;
  $('#cue').style.opacity = p > 0.02 ? 0 : 1;
}

/* ---------- 01 cross-section ---------- */
let cur = BEST;
function renderX() {
  let s = `<svg viewBox="-46 -26 92 32" width="100%" style="display:block" role="img" aria-label="Поперечные разрезы четырёх вариантов">`;
  s += `<rect x="-37.5" y="-0.6" width="75" height="0.6" fill="#2f8a3c"/><line x1="-46" y1="0" x2="46" y2="0" stroke="#3a4760" stroke-width=".25"/>`;
  s += `<line x1="-46" y1="-12" x2="46" y2="-12" stroke="#8f9db5" stroke-width=".16" stroke-dasharray="1 1"/><text x="-45.5" y="-12.7" font-size="1.8" fill="#8f9db5">12 м — мин. в свету над бровкой</text>`;
  s += `<line x1="-34" y1="0" x2="-34" y2="-1.2" stroke="#fff" stroke-width=".3"/><line x1="34" y1="0" x2="34" y2="-1.2" stroke="#fff" stroke-width=".3"/><text x="0" y="2.7" font-size="1.8" fill="#8f9db5" text-anchor="middle">поле 68 м · площадка 75 м · пролёт 78 м</text>`;
  s += `<path d="M-8,0 Q0,-26 8,0" fill="none" stroke="#fbbf24" stroke-width=".2" stroke-dasharray=".8 .6" opacity=".7"/><circle cx="0" cy="-13" r=".5" fill="#fbbf24"/>`;
  V.forEach(v => {
    const on = v.id === cur, p = basePts(v.geo);
    s += `<polyline points="${p.map(q => q[0].toFixed(2) + ',' + (-q[1]).toFixed(2)).join(' ')}" fill="${on ? 'rgba(227,25,43,.07)' : 'none'}" stroke="${XC[v.id]}" stroke-width="${on ? .55 : .22}" opacity="${on ? 1 : .5}"/>`;
    if (on) {
      const q = innerPts(v, 1).filter(t => t[1] > 0.3);
      s += `<polyline points="${q.map(t => t[0].toFixed(2) + ',' + (-t[1]).toFixed(2)).join(' ')}" fill="none" stroke="${XC[v.id]}" stroke-width=".2" stroke-dasharray=".6 .5" opacity=".9"/>`;
      const c = byId(v.id).g.clear;
      [-1, 1].forEach(sg => { s += `<line x1="${sg * TOUCH_X}" y1="0" x2="${sg * TOUCH_X}" y2="${-c}" stroke="#4ade80" stroke-width=".25"/><circle cx="${sg * TOUCH_X}" cy="${-c}" r=".45" fill="#4ade80"/>`; });
      s += `<text x="${TOUCH_X - 0.8}" y="${-c / 2}" font-size="1.7" fill="#4ade80" text-anchor="end">${dec(c, 1)} м</text>`;
    }
  });
  s += `<rect x="-30.4" y="-1.8" width=".5" height="1.8" fill="#fff"/><text x="-29.6" y="-0.4" font-size="1.4" fill="#8f9db5">1,8 м</text></svg>`;
  $('#xsec').innerHTML = s;
  $('#xleg').innerHTML = V.map(v => `<span><i style="background:${XC[v.id]}"></i>${v.code} · ${v.name} — конёк ${dec(v.geo.H, v.geo.H % 1 ? 1 : 0)} м</span>`).join('')
    + `<span><i style="background:#4ade80"></i>в свету над бровкой (выбранный)</span>`;
}

/* ---------- 02 configurator ---------- */
const vt = $('#vtabs');
V.forEach(v => {
  const b = document.createElement('button'); b.className = 'vtab'; b.type = 'button'; b.dataset.id = v.id; b.setAttribute('role', 'tab');
  b.innerHTML = `<i>${v.code}</i>${v.name}<small>${v.tag}</small>`;
  b.onclick = () => onVariant(v.id); vt.appendChild(b);
});
function renderSpec() {
  const r = byId(cur), v = r.v, g = r.g, e = r.e;
  const mat = v.id === 'wood' ? ['Древесина', `≈ ${fmtInt(g.glulam)} м³ клеёного бруса`] : ['Металл', `≈ ${fmtInt(g.steelT)} т (${v.steelKgM2} кг/м²)`];
  const dl = [
    ['Каркас', v.frameTxt], ['Оболочка', v.skinTxt],
    ['Высоты', `стены ${dec(v.geo.h0, v.geo.h0 % 1 ? 1 : 0)} м · конёк ${dec(v.geo.H, v.geo.H % 1 ? 1 : 0)} м`],
    ['В свету над бровкой', `<span class="ok">${dec(g.clear, 1)} м ✓</span> (норма ≥ ${CLEAR_MIN} м)`],
    mat,
    ['Оболочка, площадь', `${fmtInt(g.envA)} м²`], ['Объём зала', `${fmtInt(g.vol / 1000)} тыс. м³`],
    ['Теплопотери', `${fmtInt(e.peakKW)} кВт при −31 °C · ${fmtInt(e.gasM3 / 1000)} тыс. м³ газа/год`],
    ['Срок стройки', `≈ ${dec(v.build, v.build % 1 ? 1 : 0)} мес после проекта`], ['Ресурс', v.life]
  ];
  $('#spec').innerHTML = `<div class="code">ВАРИАНТ ${v.code} · ${v.tag}${v.id === BEST ? ' · <span style="color:#4ade80">рекомендуем</span>' : ''}</div><h3>${v.name}</h3><div class="type">${v.type}</div>
  <dl>${dl.map(d => `<dt>${d[0]}</dt><dd>${d[1]}</dd>`).join('')}</dl>
  <div class="pc"><div class="p"><h4>Плюсы</h4><ul>${v.pros.map(x => `<li>${x}</li>`).join('')}</ul></div><div class="c"><h4>Минусы</h4><ul>${v.cons.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
  <div class="capex"><div class="muted small">Ключевое</div><b>${fmtInt(e.peakKW)} кВт</b> <span class="muted">теплопотери</span><div class="muted small">${fmtInt(g.envA)} м² оболочки · ${fmtInt(g.vol / 1000)} тыс. м³ · ${m1(v.months)} мес с проектом</div></div>`;
}
let ENGINE = null;
function onVariant(id) {
  cur = id; $$('.vtab').forEach(b => { const on = b.dataset.id === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  renderSpec(); renderX(); ENGINE && ENGINE.setVariant(id);
}

/* ---------- 03 compare ---------- */
function dots(n) { return '●'.repeat(n) + '<i>' + '●'.repeat(5 - n) + '</i>'; }
(function () {
  const row = (n, f) => `<tr><td>${n}</td>${R0.map((r, i) => `<td>${f(r, i)}</td>`).join('')}</tr>`;
  let h = `<tr><th></th>${V.map(v => `<th><span style="color:#ff5262">${v.code}</span> ${v.name}</th>`).join('')}</tr>`;
  h += row('Конструкция', r => r.v.type);
  h += row('Каркас', r => r.v.id === 'wood' ? `${fmtInt(r.g.glulam)} м³ клеёного бруса` : `${fmtInt(r.g.steelT)} т стали`);
  h += row('Конёк / стены', r => `${dec(r.v.geo.H, r.v.geo.H % 1 ? 1 : 0)} / ${dec(r.v.geo.h0, r.v.geo.h0 % 1 ? 1 : 0)} м`);
  h += row('В свету над бровкой', r => `<span class="ok">${dec(r.g.clear, 1)} м ✓</span>`);
  h += row('Оболочка / объём', r => `${fmtInt(r.g.envA)} м²<br><span class="muted">${fmtInt(r.g.vol / 1000)} тыс. м³</span>`);
  h += row('Теплопотери (пик)', r => `<span class="${r.e.peakKW === minP ? 'best' : ''}">${fmtInt(r.e.peakKW)} кВт</span>`);
  h += row('Срок (с проектом)', r => `<span class="${r.v.months === fastest ? 'best' : ''}">${m1(r.v.months)} мес</span>`);
  h += row('Теплопотери / год', r => `<span class="${r.e.peakKW === minP ? 'best' : ''}">${fmtInt(r.e.heatMWh)} МВт·ч</span>`);
  h += row('Ресурс', r => r.v.life);
  [['Скорость', 'speed'], ['Капитальность', 'capital'], ['Энергоэффективность', 'energy'], ['Образ', 'image']]
    .forEach(([n, k]) => h += row(n, r => `<span class="dots">${dots(r.v.rate[k])}</span>`));
  $('#ctbl').innerHTML = h;

  const mp = Math.max(...peaks);
  $('#bars1').innerHTML = R0.map(r => `<div class="row"><div><b style="color:#ff5262">${r.v.code}</b> ${r.v.name}</div><div class="track">${[['skin', '#e3192b'], ['infil', '#fb923c'], ['other', '#7dd3fc']].map(([k, c]) => `<span style="width:${r.e.kw[k] / mp * 100}%;background:${c}"></span>`).join('')}</div><div class="v">${fmtInt(r.e.peakKW)}${r.e.peakKW === minP ? ' ✓' : ''}</div></div>`).join('');
  const mm = 15;
  $('#bars2').innerHTML = R0.map(r => { const d = G[r.v.id][0][2]; return `<div class="row"><div><b style="color:#ff5262">${r.v.code}</b> ${r.v.name}</div><div class="track"><span style="width:${d / mm * 100}%;background:#3b82f6"></span><span style="width:${(r.v.months - d) / mm * 100}%;background:#e3192b"></span></div><div class="v">${m1(r.v.months)}${r.v.months === fastest ? ' ✓' : ''}</div></div>`; }).join('');
  let o = `<tr><th></th>${V.map(v => `<th class="n"><span style="color:#ff5262">${v.code}</span> ${v.name}</th>`).join('')}</tr>`;
  o += `<tr><td>Тепло на отопление, МВт·ч</td>${R0.map(r => `<td class="n">${fmtInt(r.e.heatMWh)}</td>`).join('')}</tr>`;
  o += `<tr><td>Газ, тыс. м³</td>${R0.map(r => `<td class="n">${fmtInt(r.e.gasM3 / 1000)}</td>`).join('')}</tr>`;
  o += `<tr><td>Электроэнергия, МВт·ч</td>${R0.map(r => `<td class="n">${fmtInt(r.e.elecMWh)}</td>`).join('')}</tr>`;
  o += `<tr><td>Естественный свет</td>${R0.map(r => `<td class="n">${r.v.daylight ? '−' + Math.round(r.v.daylight * 100) + ' % на освещение' : '—'}</td>`).join('')}</tr>`;
  o += `<tr><td>Замена мембраны</td>${R0.map(r => `<td class="n">${r.v.id === 'tent' ? 'вся оболочка, 15–20 лет' : r.v.id === 'hyb' ? 'кровля, 15–20 лет' : 'не требуется'}</td>`).join('')}</tr>`;
  $('#otbl').innerHTML = o;
})();

/* ---------- 04 quantities ---------- */
let ev = BEST; const es = $('#eseg');
V.forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.textContent = v.code + ' · ' + v.name; b.dataset.id = v.id; b.onclick = () => { ev = v.id; renderE(); }; es.appendChild(b); });
$('#ctbl2').innerHTML = `<tr><th>Позиция</th><th class="n">Объём</th></tr>` + COMMON_Q.map(q => `<tr><td>${q[0]}</td><td class="n">${q[1]}</td></tr>`).join('');
function renderE() {
  const r = byId(ev); es.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === ev));
  $('#qname').textContent = r.v.code + ' · ' + r.v.name;
  $('#etbl').innerHTML = `<tr><th>Позиция</th><th class="n">Объём</th></tr>` + r.q.map(q => `<tr><td>${q[0]}</td><td class="n">${q[1]}</td></tr>`).join('');
}
renderE();

/* ---------- 05 site plan ---------- */
(function () {
  let s = `<svg viewBox="-8 -8 196 256" width="100%" style="display:block;max-height:680px" role="img" aria-label="Генплан участка">`;
  s += `<defs><pattern id="pk" width="2.6" height="5" patternUnits="userSpaceOnUse"><rect width="2.6" height="5" fill="#1c2636"/><line x1="0" y1="0" x2="0" y2="5" stroke="#5b6b86" stroke-width=".15"/></pattern></defs>`;
  s += `<rect x="-8" y="228" width="196" height="12" fill="#1a222d"/><line x1="-8" y1="234" x2="188" y2="234" stroke="#fbbf24" stroke-width=".3" stroke-dasharray="3 3"/><text x="2" y="238.5" font-size="3.2" fill="#8f9db5">Подъездная дорога</text>`;
  s += `<rect x="0" y="0" width="180" height="226" fill="#132033" stroke="#4ade80" stroke-width=".4" stroke-dasharray="2 1.5"/>`;
  s += `<rect x="42" y="10" width="96" height="134" fill="#243041" rx="2"/>`;
  s += `<rect x="51" y="20" width="78" height="120" fill="#e9ecef" opacity=".14" stroke="#e3192b" stroke-width=".8"/>`;
  s += `<rect x="52.5" y="22.5" width="75" height="115" fill="#2f8a3c"/><rect x="56" y="27.5" width="68" height="105" fill="none" stroke="#fff" stroke-width=".3"/><line x1="56" y1="80" x2="124" y2="80" stroke="#fff" stroke-width=".3"/><circle cx="90" cy="80" r="9.15" fill="none" stroke="#fff" stroke-width=".3"/>`;
  s += `<rect x="69.8" y="27.5" width="40.3" height="16.5" fill="none" stroke="#fff" stroke-width=".3"/><rect x="69.8" y="116" width="40.3" height="16.5" fill="none" stroke="#fff" stroke-width=".3"/>`;
  s += `<text x="90" y="62" font-size="4.6" fill="#fff" text-anchor="middle" font-weight="800">МАНЕЖ 78×120</text><text x="90" y="100" font-size="3.4" fill="#e9eef7" text-anchor="middle">поле 68×105</text>`;
  s += `<rect x="66" y="140" width="48" height="20" fill="#e3192b"/><text x="90" y="151.5" font-size="4" fill="#fff" text-anchor="middle" font-weight="800">АБК 1 200 м²</text>`;
  s += `<rect x="60" y="160" width="60" height="12" fill="#3a4760"/><text x="90" y="167.5" font-size="3" fill="#e9eef7" text-anchor="middle">входная площадь</text>`;
  s += `<rect x="25" y="174" width="130" height="46" fill="url(#pk)"/><rect x="25" y="194" width="130" height="6" fill="#1a222d"/><text x="90" y="198" font-size="3.4" fill="#e9eef7" text-anchor="middle">Парковка 80 м/м · 4 автобуса</text>`;
  s += `<rect x="82" y="220" width="16" height="8" fill="#1a222d"/>`;
  s += `<rect x="140" y="24" width="28" height="30" fill="#2a3448" stroke="#fb923c" stroke-width=".4"/><text x="154" y="38" font-size="3" fill="#fb923c" text-anchor="middle">Техдвор</text><text x="154" y="42.5" font-size="2.6" fill="#8f9db5" text-anchor="middle">ТП · ГРПШ</text>`;
  s += `<rect x="8" y="40" width="22" height="40" fill="#2f8a3c" opacity=".75" stroke="#fff" stroke-width=".3"/><text x="19" y="86" font-size="2.6" fill="#8f9db5" text-anchor="middle">мини-поле 20×40</text><text x="19" y="89.5" font-size="2.6" fill="#8f9db5" text-anchor="middle">(опция)</text>`;
  s += `<rect x="36" y="4" width="108" height="146" fill="none" stroke="#fbbf24" stroke-width=".3" stroke-dasharray="1.5 1.5" opacity=".7"/><text x="140" y="148" font-size="2.4" fill="#fbbf24" text-anchor="end">пожарный проезд 6 м</text>`;
  for (let y = 6; y < 220; y += 9) s += `<circle cx="4" cy="${y}" r="2.4" fill="#2e6b57"/><circle cx="176" cy="${y}" r="2.4" fill="#2e6b57"/>`;
  for (let x = 13; x < 170; x += 9) s += `<circle cx="${x}" cy="4" r="2.4" fill="#2e6b57"/>`;
  for (let i = 0; i < 14; i++) s += `<circle cx="${12 + (i % 3) * 7}" cy="${100 + Math.floor(i / 3) * 12}" r="2.6" fill="#2e6b57"/>`;
  s += `<g transform="translate(168,206)"><circle r="7" fill="#0d1524" stroke="#3a4760" stroke-width=".4"/><path d="M0,-5 L2,2 L0,0.8 L-2,2Z" fill="#e3192b"/><text y="-7.8" font-size="3" fill="#e9eef7" text-anchor="middle">С</text></g>`;
  s += `<g transform="translate(10,206)"><rect width="20" height="1.4" fill="#e9eef7"/><rect x="10" width="10" height="1.4" fill="#3a4760"/><text y="-1.5" font-size="2.6" fill="#8f9db5">0</text><text x="20" y="-1.5" font-size="2.6" fill="#8f9db5" text-anchor="end">20 м</text></g></svg>`;
  $('#plan').innerHTML = s;
  const vols = R0.map(r => r.g.vol / 1000);
  const tep = [
    ['Площадь участка', '≈ 4,1 га'], ['Площадь застройки', `≈ ${fmtInt(HALL + 960)} м²`], ['Зал манежа', `${fmtInt(HALL)} м²`],
    ['Игровая площадка', `${fmtInt(PITCH_AREA)} м²`], ['АБК (2 этажа)', '1 200 м²'],
    ['Строительный объём зала', `${fmtInt(Math.min(...vols))}–${fmtInt(Math.max(...vols))} тыс. м³`],
    ['Парковка', '80 м/м + 4 автобуса'], ['Озеленение', '≥ 25 %'], ['Электрическая мощность', '≈ 0,8–1,0 МВт'],
    ['Тепловая мощность зала', `${fmtInt(Math.min(...R0.map(r => r.e.peakKW)))}–${fmtInt(Math.max(...R0.map(r => r.e.peakKW)))} кВт + АБК`],
    ['Пропускная способность', 'до 4 групп одновременно']
  ];
  $('#tep').innerHTML = tep.map(t => `<tr><td>${t[0]}</td><td class="n">${t[1]}</td></tr>`).join('');
})();

/* ---------- 07 gantt ---------- */
let gv = BEST; const gs = $('#gseg');
V.forEach(v => { const b = document.createElement('button'); b.type = 'button'; b.textContent = `${v.code} · ${v.name} — ${dec(v.months, v.months % 1 ? 1 : 0)} мес`; b.dataset.id = v.id; b.onclick = () => { gv = v.id; renderG(); }; gs.appendChild(b); });
function renderG() {
  gs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.id === gv));
  let h = G[gv].map(r => `<div class="gr"><div>${r[0]}</div><div class="gt"><div class="gb ${r[3] ? 'd' : ''}" style="left:${r[1] / 15 * 100}%;width:${r[2] / 15 * 100}%"></div></div></div>`).join('');
  h += `<div class="gm"><div></div><div>${Array.from({ length: 15 }, (_, i) => `<span>${i + 1}</span>`).join('')}</div></div>`;
  $('#gantt').innerHTML = h;
}
renderG();

/* ---------- 08 reco ---------- */
(function () {
  const b = byId(BEST), c = byId(ALT), rest = R0.filter(r => r.v.id !== BEST && r.v.id !== ALT);
  $('#recoCard').innerHTML = `<h3>Основной: <span style="color:#ff5262">${b.v.code} · ${b.v.name}</span><span class="badge">капитальный</span></h3>
  <p class="muted" style="margin:8px 0 16px">Для профессионального клуба в климате Актобе — капитальное здание: самые низкие теплопотери (${fmtInt(b.e.peakKW)} кВт при −31 °C против ${fmtInt(Math.max(...peaks))} кВт у мембранных решений), нет замены мембраны, на фермах легко подвесить сетки, табло и камеры. В свету над бровкой — ${dec(b.g.clear, 1)} м.</p>
  <h3>Альтернатива: <span style="color:#7dd3fc">${c.v.code} · ${c.v.name}</span></h3>
  <p class="muted" style="margin:8px 0 16px">Если важны естественный свет, арочный образ и запуск на ${dec(b.v.months - c.v.months, 1)} мес раньше — стены PIR 8 м, мембранная кровля со световыми полосами.</p>
  <p class="muted">${rest.map(r => `<b style="color:#eef2f8">${r.v.code} · ${r.v.name}</b> — ${r.v.id === 'tent' ? 'быстрый и лёгкий старт' : 'флагманский объект для имиджа'} (${m1(r.v.months)} мес)`).join('. ')}.</p>`;
})();

/* ---------- footer assumptions ---------- */
$('#assump').innerHTML = `Концептуальный проект. Климат: −31 °C расчётная, ${CLIMATE.days} сут отопления, средняя ${dec(CLIMATE.tAvg, 1)} °C; в зале +${CLIMATE.tIn} °C. Нагрузки — по СП РК EN 1991 для Актюбинской области. Тоннаж, сечения и фундаменты — укрупнённо, подтверждаются расчётом в рабочем проекте после изысканий.`;

/* ---------- UI: buttons ---------- */
$$('.vbtn[data-view]').forEach(b => b.onclick = () => ENGINE && ENGINE.view(b.dataset.view));
$('#xray').onclick = e => { const t = e.currentTarget; t.classList.toggle('on'); ENGINE && ENGINE.xray(t.classList.contains('on')); };
$('#explode').addEventListener('input', e => ENGINE && ENGINE.setExplode(e.target.value / 100));
const liveBtn = $('#liveBtn');
function setLive(b) { if (!ENGINE) return; ENGINE.setInteractive(b); liveBtn.classList.toggle('on', ENGINE.interactive); liveBtn.querySelector('span').textContent = ENGINE.interactive ? 'Готово' : 'Вращать 3D'; }
liveBtn.onclick = () => setLive(!(ENGINE && ENGINE.interactive));
$('#goInside').onclick = () => { $('#variants').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => ENGINE && ENGINE.view('in'), 700); };

/* ---------- reveal + nav ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('.rv, .bars').forEach(el => io.observe(el));
const navLinks = $$('#links a');
const secIO = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { navLinks.forEach(a => { const on = a.getAttribute('href') === '#' + e.target.id; a.classList.toggle('on', on); if (on && a.scrollIntoView) a.parentNode.scrollTo({ left: a.offsetLeft - 40, behavior: 'smooth' }); }); }
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main .sec').forEach(s => secIO.observe(s));

/* ---------- scroll loop (один rAF на кадр) ---------- */
const pbar = $('#pbar'), viewerEl = $('#viewer');
let ticking = false, storyP = 0, attached = null;
function visPx(el) { const r = el.getBoundingClientRect(), h = innerHeight; return { r, px: Math.max(0, Math.min(h, r.bottom) - Math.max(0, r.top)) }; }
function onFrame() {
  ticking = false;
  const doc = document.documentElement, max = doc.scrollHeight - innerHeight;
  pbar.style.transform = `scaleX(${max > 0 ? (scrollY / max).toFixed(4) : 0})`;
  const s = visPx(story), v = visPx(viewerEl);
  storyP = clamp(-s.r.top / Math.max(1, s.r.height - pin.offsetHeight));
  if (ENGINE) {
    ENGINE.setStoryProgress(storyP);
    const want = s.px >= v.px ? (s.px > 0 ? 'story' : null) : 'config';
    if (want && want !== attached) { attached = want; ENGINE.attach(want === 'story' ? pin : viewerEl, want); if (want === 'config') ENGINE.setVariant(cur); }
    ENGINE.setVisible(!!want && (want === 'story' ? s.px : v.px) > 0);
    if (attached === 'config' && v.px === 0 && ENGINE.interactive) setLive(false);
  } else updateChapters(storyP);
}
const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } };
addEventListener('scroll', req, { passive: true });
addEventListener('resize', req, { passive: true });

onVariant(BEST);
document.documentElement.classList.add('ready');
updateChapters(0);

/* ---------- 3D ---------- */
(async () => {
  try {
    const t = document.createElement('canvas');
    if (!(t.getContext('webgl2') || t.getContext('webgl'))) throw new Error('no webgl');
    const { createEngine } = await import('./viewer.js');
    await document.fonts?.ready;
    ENGINE = createEngine();
    ENGINE.setVariant(cur);
    ENGINE.onStory(p => updateChapters(p));
    attached = null; onFrame();
  } catch (e) {
    console.error(e); $('#err3d').style.display = 'grid'; liveBtn.style.display = 'none';
  }
})();
