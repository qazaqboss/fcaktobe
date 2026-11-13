/* =====================================================================
   ФК «Актобе» · Манеж 78×120 — расчётная модель
   Все площади, объёмы и стоимости считаются из геометрии профиля
   и единичных расценок. Цены — ноябрь 2026, без НДС, ±15–20 %.
   ===================================================================== */

export const RATE = 449;            // ₸ за $ (НБ РК 10.11.2026 — 448,98)
export const W = 78, L = 120, R = W / 2; // габариты зала, м
export const FIELD = { w: 68, l: 105 }, PITCH = { w: 75, l: 115 };
export const TOUCH_X = FIELD.w / 2; // бровка поля от оси, м
export const STEP = 6;              // шаг рам, м
export const FRAMES = L / STEP + 1; // 21 рама
export const HALL = W * L;          // 9 360 м²
export const PITCH_AREA = PITCH.w * PITCH.l; // 8 625 м²
export const RES = 0.05;            // резерв на непредвиденные
export const CLEAR_MIN = 12;        // мин. высота в свету над бровкой, м
export const INS = 0.35;            // отступ каркаса от оболочки, м

/* ---------- климат Актобе и тарифы ---------- */
export const CLIMATE = {
  tOut: -31,      // расчётная зимняя, °C (наиболее холодная пятидневка)
  tIn: 12,        // в зоне поля, °C
  days: 198,      // отопительный период, сут
  tAvg: -6.2,     // средняя за отопительный период, °C
  gainFactor: 0.8 // учёт теплопоступлений (свет, люди) и ночного режима +8 °C
};
export const TARIFF = { kwh: 32, gas: 42, gasKwh: 9.3, boilerEff: 0.92 };

/* ---------- единичные расценки (монтаж «под ключ») ---------- */
export const PRICE = {
  steel: 1.06,        // млн ₸/т: изготовление, окраска, монтаж
  glulam: 0.92,       // млн ₸/м³: клеёная древесина GL28h с доставкой
  glulamMount: 0.15,  // млн ₸/м³: монтаж + стальные узлы
  fireWood: 0.035,    // млн ₸/м³: огнезащита
  membrane: 29000,    // ₸/м²: ПВХ 900 г/м² + базальт 100 мм + ПВХ
  pirWall120: 21500, pirWall150: 23500,
  pirRoof150: 25500, pirRoof200: 36000,
  poly: 31000,        // ₸/м²: сотовый поликарбонат 32 мм в каркасе
  glass: 98000,       // ₸/м²: стоечно-ригельное остекление
  lamella: 38000      // ₸/м²: PIR + деревянные ламели
};
export const U = { // Вт/(м²·К) с учётом мостиков холода
  membrane: 0.45, pirWall120: 0.20, pirWall150: 0.17, pirRoof150: 0.17,
  pirRoof200: 0.13, poly: 1.5, glass: 1.1, lamella: 0.18
};

/* ---------- общее для всех вариантов, млн ₸ ---------- */
const turfRates = { base: 12000, pad: 5500, turf: 15500 }; // ₸/м²
export const COMMON = [
  ['Изыскания, проектирование, экспертиза', 90],
  ['Подготовка территории, вертикальная планировка, дренаж', 70],
  [`Поле: основание 300 мм + shock-pad 12 мм + газон FIFA Quality Pro 60 мм (${fmtInt(PITCH_AREA)} м²)`,
    Math.round(PITCH_AREA * (turfRates.base + turfRates.pad + turfRates.turf) / 1e6)],
  ['Спортоборудование: ворота, защитные сетки, скамейки, табло-таймер', 55],
  ['Освещение LED 500–750 лк (≈ 95 кВт) с управлением DALI', 150],
  ['Слаботочные системы: пожарная сигнализация, оповещение, видео, СКУД, Wi-Fi', 95],
  ['АБК 1 200 м² с отделкой и инженерией (≈ 360 тыс. ₸/м²)', 432],
  ['Наружные сети: ТП 1000 кВА, газ, вода, канализация', 260],
  ['Благоустройство: парковка, площадь, озеленение, ограждение, наружное освещение', 190]
];
export const COMMON_SUM = COMMON.reduce((s, x) => s + x[1], 0);
export const TURF_REPLACE = PITCH_AREA * turfRates.turf / 1e6; // млн ₸ раз в 9 лет

/* ---------- варианты ---------- */
export const V = [
  {
    id: 'tent', code: 'A', name: 'АРКА-ТЕНТ', type: 'Каркасно-тентовый, утеплённый', tag: 'Быстро и экономно',
    color: '#f2f2ee', geo: { type: 'ellipse', h0: 7, H: 22 }, fd: 1.4, fcol: '#b8c0ca',
    steelKgM2: 52, found: { foot: 2.6, grill: 0.30 }, gates: 35, maintPct: 0.6, infil: 1.0, daylight: 0,
    skin: g => ({ roof: [['membrane', g.roofA]], wall: [['membrane', g.wallA]], gable: [['membrane', g.gableA]] }),
    membraneArea: g => g.roofA + g.wallA + g.gableA,
    frameTxt: 'стальные решётчатые арки из трубы, шаг 6 м, 21 рама',
    skinTxt: 'трёхслойные тентовые панели: ПВХ 900 г/м² + базальт 100 мм + ПВХ',
    life: 'каркас 50 лет · мембрана 15–20 лет', build: 6, months: 9,
    pros: ['Самый низкий CAPEX', 'Лёгкие фундаменты', 'Быстрый монтаж', 'Светлый белый интерьер', 'Разборная — можно перенести'],
    cons: ['Самая дорогая эксплуатация', 'Замена мембраны через 15–20 лет', 'Сложнее крепить табло и брендинг', 'Нужен контроль снега на кровле'],
    rate: { price: 5, speed: 5, capital: 2, energy: 2, image: 3 },
    lab: { env: 'Мембрана ПВХ + базальт 100 мм', frame: 'Арки из трубы, шаг 6 м', found: 'Столбчатые фундаменты' }
  },
  {
    id: 'box', code: 'B', name: 'ПРО-БОКС', type: 'Стальной каркас + сэндвич-панели PIR', tag: 'Капитально на 50 лет',
    color: '#e3192b', geo: { type: 'gable', h0: 15.5, H: 19.5 }, fd: 3.0, fcol: '#c8102e',
    steelKgM2: 78, found: { foot: 4.8, grill: 0.42 }, gates: 42, maintPct: 0.35, infil: 0.4, daylight: 0.15,
    skin: g => ({ roof: [['pirRoof150', g.roofA * 0.9], ['poly', g.roofA * 0.1]], wall: [['pirWall120', g.wallA]], gable: [['pirWall120', g.gableA]] }),
    membraneArea: () => 0,
    frameTxt: 'стальные рамы со стропильными фермами 78 м (высота 3,0 м), шаг 6 м',
    skinTxt: 'кровля PIR 150 мм + 10 % зенитных полос; стены PIR 120 мм, цоколь 1,2 м',
    life: '50+ лет, капитальное здание', build: 9, months: 12,
    pros: ['Капитальный объект: страхование, залог, ввод', 'Минимальные теплопотери', 'Легко подвесить сетки, табло, камеры', 'Нет замены мембраны'],
    cons: ['Самый тяжёлый каркас и фундаменты', 'Дольше строить', 'Меньше естественного света'],
    rate: { price: 3, speed: 3, capital: 5, energy: 5, image: 4 },
    lab: { env: 'Сэндвич PIR 150 мм', frame: 'Рамы с фермами 78 м', found: 'Монолитные фундаменты под колонны' }
  },
  {
    id: 'hyb', code: 'C', name: 'ГИБРИД', type: 'Сэндвич-стены 8 м + арочная мембранная кровля', tag: 'Свет и баланс цены',
    color: '#7dd3fc', geo: { type: 'ellipse', h0: 8, H: 22 }, fd: 1.8, fcol: '#c8102e',
    steelKgM2: 60, found: { foot: 3.6, grill: 0.36 }, gates: 40, maintPct: 0.45, infil: 0.6, daylight: 0.25,
    skin: g => ({ roof: [['membrane', g.roofA * 0.88], ['poly', g.roofA * 0.12]], wall: [['pirWall150', g.wallA]],
      gable: [['pirWall150', g.gableLow], ['poly', g.gableA - g.gableLow]] }),
    membraneArea: g => g.roofA * 0.88,
    frameTxt: 'стальные арки на колоннах 8 м, шаг 6 м',
    skinTxt: 'стены PIR 150 мм до 8 м; кровля — утеплённая мембрана + 4 световые полосы; фронтоны из поликарбоната',
    life: 'каркас и стены 50 лет · мембрана 15–20 лет', build: 7.5, months: 10.5,
    pros: ['Максимум естественного света', 'Эффектный арочный силуэт', 'Стены держат удары мяча', 'Дешевле и быстрее «ПРО-БОКС»'],
    cons: ['Замена мембраны кровли через 15–20 лет', 'Сложные узлы примыкания стена–мембрана'],
    rate: { price: 4, speed: 4, capital: 4, energy: 3, image: 4 },
    lab: { env: 'Мембрана + световые полосы', frame: 'Арки на колоннах 8 м', found: 'Монолитные фундаменты' }
  },
  {
    id: 'wood', code: 'D', name: 'ПРЕМИУМ WOOD', type: 'Клеёные деревянные арки + PIR-кровля', tag: 'Флагманский имидж',
    color: '#e0a66a', geo: { type: 'ellipse', h0: 8, H: 22 }, fd: 1.6, fcol: '#b5814c',
    steelKgM2: 0, found: { foot: 5.4, grill: 0.36 }, gates: 48, maintPct: 0.5, infil: 0.5, daylight: 0.2,
    skin: g => ({ roof: [['pirRoof200', g.roofA * 0.94], ['poly', g.roofA * 0.06]], wall: [['glass', g.wallA]], gable: [['lamella', g.gableA]] }),
    membraneArea: () => 0,
    frameTxt: 'арки из клеёной древесины 240×1600 мм, шаг 6 м, огнезащита',
    skinTxt: 'кровля PIR 200 мм + фальц, световой конёк; фасады — остекление 8 м + ламели',
    life: '50+ лет', build: 11, months: 14.5,
    pros: ['Самый сильный имидж — архитектурный объект', '«Тёплый» интерьер и лучшая акустика', 'Дерево не ржавеет — нет антикоррозионки'],
    cons: ['Самый дорогой', 'Долгая логистика клеёного бруса', 'Строже требования пожарной безопасности'],
    rate: { price: 1, speed: 2, capital: 5, energy: 4, image: 5 },
    lab: { env: 'PIR 200 мм + фальц', frame: 'Клеёные арки GL28h', found: 'Фундаменты под распор арок' }
  }
];

/* ---------- геометрия профиля ---------- */
export function basePts(g) {
  const p = [[-R, 0], [-R, g.h0]];
  if (g.type === 'gable') p.push([0, g.H], [R, g.h0]);
  else {
    const N = 64;
    for (let i = 1; i < N; i++) { const a = Math.PI - i / N * Math.PI; p.push([R * Math.cos(a), g.h0 + (g.H - g.h0) * Math.sin(a)]); }
    p.push([R, g.h0]);
  }
  p.push([R, 0]);
  return p;
}
export function hAt(g, x) {
  const a = Math.min(1, Math.abs(x) / R);
  return g.type === 'gable' ? g.h0 + (g.H - g.h0) * (1 - a) : g.h0 + (g.H - g.h0) * Math.sqrt(1 - a * a);
}
export function subdiv(p, m) {
  const o = [p[0]];
  for (let i = 1; i < p.length; i++) {
    const [x0, y0] = p[i - 1], [x1, y1] = p[i];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / m));
    for (let k = 1; k <= n; k++) o.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  return o;
}
export function inward(p) {
  return p.map((pt, i) => {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    return [ty / l, -tx / l];
  });
}
/** Внутренний контур каркаса (нижний пояс / внутренняя грань арки) */
export function innerPts(v, step = 0.5) {
  const p = subdiv(basePts(v.geo), step), n = inward(p), d = INS + v.fd;
  return p.map((q, i) => [q[0] + n[i][0] * d, q[1] + n[i][1] * d]);
}
/** Высота в свету под каркасом над бровкой поля */
export function clearAt(v, x = TOUCH_X) {
  const q = innerPts(v, 0.25).filter(p => p[1] > 0.5);
  for (let i = 1; i < q.length; i++) {
    const [x0, y0] = q[i - 1], [x1, y1] = q[i];
    if ((x0 - x) * (x1 - x) <= 0 && x1 !== x0 && y0 > 1 && y1 > 1) return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return 0;
}

function shoelace(p) { let s = 0; for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; }

export function geometry(v) {
  const p = basePts(v.geo);
  let roofLen = 0;
  for (let i = 2; i < p.length - 2; i++) roofLen += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  roofLen += Math.hypot(p[p.length - 2][0] - p[p.length - 3][0], p[p.length - 2][1] - p[p.length - 3][1]);
  const S = shoelace(p);                       // площадь поперечного сечения
  const roofA = roofLen * L * 1.03;            // +3 % свесы, нахлёсты
  const wallA = 2 * v.geo.h0 * L;              // продольные стены
  const gableA = 2 * S;                        // два торца
  const gableLow = 2 * W * v.geo.h0;           // нижняя часть торцов
  const vol = S * L;
  // клеёная древесина: арка по оси сечения × 21 + 28 % прогоны/связи
  const arch = innerPts(v, 0.5);
  let archLen = 0; for (let i = 1; i < arch.length; i++) archLen += Math.hypot(arch[i][0] - arch[i - 1][0], arch[i][1] - arch[i - 1][1]);
  const glulam = v.id === 'wood' ? archLen * 0.24 * 1.6 * FRAMES * 1.28 : 0;
  const steelT = v.steelKgM2 * HALL / 1000 + (v.id === 'wood' ? 0 : 0);
  return { roofLen, S, roofA, wallA, gableA, gableLow, vol, glulam, steelT, envA: roofA + wallA + gableA, clear: clearAt(v) };
}

const SKIN_NAME = {
  membrane: 'Утеплённая тентовая оболочка (3 слоя)', pirWall120: 'Стены PIR 120 мм', pirWall150: 'Стены PIR 150 мм',
  pirRoof150: 'Кровля PIR 150 мм', pirRoof200: 'Кровля PIR 200 мм + фальц', poly: 'Поликарбонат: световые полосы / фронтоны',
  glass: 'Фасадное остекление', lamella: 'Торцы: PIR + деревянные ламели'
};

/* ---------- тепло и энергия ---------- */
export function energy(v, g = geometry(v)) {
  const s = v.skin(g);
  let UA = 0;
  for (const part of Object.values(s)) for (const [k, a] of part) UA += U[k] * a;
  UA += 0.075 * HALL;                                  // пол по грунту (приведённо)
  const infil = v.infil * g.envA * 0.335;              // Вт/К, инфильтрация
  const vent = 12000 * (1 - 0.75) * 0.335;             // приток 12 000 м³/ч, рекуперация 75 %
  const H = UA + infil + vent;                         // Вт/К
  const peakKW = H * (CLIMATE.tIn - CLIMATE.tOut) / 1000;
  const heatMWh = H * CLIMATE.days * 24 * (CLIMATE.tIn - CLIMATE.tAvg) * CLIMATE.gainFactor / 1e6;
  const gasM3 = heatMWh * 1000 / (TARIFF.gasKwh * TARIFF.boilerEff);
  const lightMWh = 95 * 0.7 * 14 * 330 * (1 - v.daylight) / 1000;
  const elecMWh = lightMWh + 120 + 150;                // + вентиляция/дестратификаторы + АБК
  return { UA, H, peakKW, heatMWh, gasM3, elecMWh };
}

/* ---------- смета зала ---------- */
export function hallSpec(v, g = geometry(v), e = energy(v, g)) {
  const rows = [];
  const foundTxt = { tent: 'Фундаменты: столбчатые монолитные + ростверк', box: 'Фундаменты: монолитные под колонны + ростверк',
    hyb: 'Фундаменты: монолитные под колонны + ростверк', wood: 'Фундаменты под распор арок + ростверк' }[v.id];
  rows.push({ n: foundTxt, q: `${FRAMES * 2} опор · ${2 * (W + L)} м ростверка`, m: FRAMES * 2 * v.found.foot + 2 * (W + L) * v.found.grill, k: 'found' });
  if (v.id === 'wood') {
    rows.push({ n: 'Клеёные арки GL28h: поставка', q: `${fmtInt(g.glulam)} м³ × ${PRICE.glulam} млн`, m: g.glulam * PRICE.glulam, k: 'frame' });
    rows.push({ n: 'Монтаж арок, стальные узлы, связи', q: `${fmtInt(g.glulam)} м³`, m: g.glulam * PRICE.glulamMount, k: 'frame2' });
    rows.push({ n: 'Огнезащита древесины', q: `${fmtInt(g.glulam)} м³`, m: g.glulam * PRICE.fireWood, k: 'fire' });
  } else {
    rows.push({ n: `Стальной каркас: изготовление, окраска, монтаж`, q: `${fmtInt(g.steelT)} т × ${PRICE.steel} млн`, m: g.steelT * PRICE.steel, k: 'frame' });
  }
  const s = v.skin(g), agg = {};
  for (const part of Object.values(s)) for (const [k, a] of part) agg[k] = (agg[k] || 0) + a;
  for (const [k, a] of Object.entries(agg)) rows.push({ n: SKIN_NAME[k], q: `${fmtInt(a)} м² × ${fmtInt(PRICE[k] / 1000)} тыс.`, m: a * PRICE[k] / 1e6, k: 'skin' });
  rows.push({ n: 'Ворота, двери, эвакуационные выходы', q: 'компл.', m: v.gates, k: 'gates' });
  const hv = 65 + e.peakKW * 0.075 + g.vol * 0.00022;
  rows.push({ n: 'Отопление и вентиляция: газовые воздухонагреватели, приток с рекуперацией, дестратификация',
    q: `${fmtInt(e.peakKW)} кВт · ${fmtInt(g.vol / 1000)} тыс. м³`, m: hv, k: 'hvac' });
  rows.forEach(r => r.m = Math.round(r.m));
  return rows;
}

export const OPTS = [
  { id: 'azm', name: 'Каркас местного производства — АЗМ, Актобе (−12 % по металлу: логистика и наценка)',
    calc: (v, spec) => -Math.round(spec.find(s => s.k === 'frame').m * 0.12), skip: 'wood' },
  { id: 'tv', name: 'Освещение 1 200 лк под ТВ-трансляцию', calc: () => 85 },
  { id: 'video', name: 'LED-экран + система видеоаналитики тренировок', calc: () => 65 },
  { id: 'pv', name: 'Солнечная станция 200 кВт на кровле АБК и навесах парковки', calc: () => 75 }
];

/* ---------- эксплуатация ---------- */
export const OPEXN = ['Электроэнергия', 'Газ на отопление', 'Резерв на замену мембраны', 'Резерв на замену газона (раз в 9 лет)', 'Обслуживание и ремонт зала'];
export function opex(v, g, e, spec) {
  const hallSum = spec.reduce((s, r) => s + r.m, 0);
  return [
    e.elecMWh * 1000 * TARIFF.kwh / 1e6,
    e.gasM3 * TARIFF.gas / 1e6,
    v.membraneArea(g) * PRICE.membrane * 1.15 / 1e6 / 18,
    TURF_REPLACE / 9,
    hallSum * v.maintPct / 100
  ];
}

/* ---------- сборка ---------- */
export function calc(v, opts = []) {
  const g = geometry(v), e = energy(v, g), spec = hallSpec(v, g, e);
  const hall = spec.reduce((s, r) => s + r.m, 0);
  let optSum = 0;
  for (const id of opts) { const O = OPTS.find(o => o.id === id); if (O && O.skip !== v.id) optSum += O.calc(v, spec); }
  const base = COMMON_SUM + hall + optSum;
  const capex = base * (1 + RES);
  const op = opex(v, g, e, spec), opY = op.reduce((a, b) => a + b, 0);
  return { v, g, e, spec, hall, optSum, base, reserve: base * RES, capex, op, opY, tco25: capex + 25 * opY, perM2: capex * 1e3 / HALL };
}
export const ALL = () => V.map(v => calc(v));

/* ---------- форматирование ---------- */
export function fmtInt(n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' '); }
export const bn = m => (m / 1000).toFixed(2).replace('.', ',') + ' млрд ₸';
export const mn = m => fmtInt(m) + ' млн ₸';
export const usd = m => '$' + (m / RATE).toFixed(2).replace('.', ',') + ' млн';
export const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
