/* =====================================================================
   ФК «Актобе» · Манеж 78×120 — расчётная модель
   Все площади, объёмы, тоннаж и теплопотери считаются из геометрии
   профиля. Нагрузки и сечения подтверждаются расчётом в проекте.
   ===================================================================== */

export const W = 78, L = 120, R = W / 2; // габариты зала, м
export const FIELD = { w: 68, l: 105 }, PITCH = { w: 75, l: 115 };
export const TOUCH_X = FIELD.w / 2; // бровка поля от оси, м
export const STEP = 6;              // шаг рам, м
export const FRAMES = L / STEP + 1; // 21 рама
export const HALL = W * L;          // 9 360 м²
export const PITCH_AREA = PITCH.w * PITCH.l; // 8 625 м²
export const CLEAR_MIN = 12;        // мин. высота в свету над бровкой, м
export const INS = 0.35;            // отступ каркаса от оболочки, м

/* ---------- климат Актобе ---------- */
export const CLIMATE = {
  tOut: -31,      // расчётная зимняя, °C (наиболее холодная пятидневка)
  tIn: 12,        // в зоне поля, °C
  days: 198,      // отопительный период, сут
  tAvg: -6.2,     // средняя за отопительный период, °C
  gainFactor: 0.8 // учёт теплопоступлений (свет, люди) и ночного режима +8 °C
};
export const GAS = { kwh: 9.3, eff: 0.92 };

export const U = { // Вт/(м²·К) с учётом мостиков холода
  membrane: 0.45, pirWall120: 0.20, pirWall150: 0.17, pirRoof150: 0.17,
  pirRoof200: 0.13, poly: 1.5, glass: 1.1, lamella: 0.18
};

/* ---------- варианты ---------- */
export const V = [
  {
    id: 'tent', code: 'A', name: 'АРКА-ТЕНТ', type: 'Каркасно-тентовый, утеплённый', tag: 'Быстро и легко',
    color: '#f2f2ee', geo: { type: 'ellipse', h0: 7, H: 22 }, fd: 1.4, fcol: '#b8c0ca',
    steelKgM2: 52, infil: 1.0, daylight: 0,
    skin: g => ({ roof: [['membrane', g.roofA]], wall: [['membrane', g.wallA]], gable: [['membrane', g.gableA]] }),
    frameTxt: 'стальные решётчатые арки из трубы, шаг 6 м, 21 рама',
    skinTxt: 'трёхслойные тентовые панели: ПВХ 900 г/м² + базальт 100 мм + ПВХ',
    life: 'каркас 50 лет · мембрана 15–20 лет', build: 6, months: 9,
    pros: ['Самая лёгкая конструкция', 'Лёгкие фундаменты', 'Быстрый монтаж', 'Светлый белый интерьер', 'Разборная — можно перенести'],
    cons: ['Самые высокие теплопотери', 'Замена мембраны через 15–20 лет', 'Сложнее крепить табло и брендинг', 'Нужен контроль снега на кровле'],
    rate: { speed: 5, capital: 2, energy: 2, image: 3 },
    lab: { env: 'Мембрана ПВХ + базальт 100 мм', frame: 'Арки из трубы, шаг 6 м', found: 'Столбчатые фундаменты' }
  },
  {
    id: 'box', code: 'B', name: 'ПРО-БОКС', type: 'Стальной каркас + сэндвич-панели PIR', tag: 'Капитально на 50 лет',
    color: '#e3192b', geo: { type: 'gable', h0: 15.5, H: 19.5 }, fd: 3.0, fcol: '#c8102e',
    steelKgM2: 78, infil: 0.4, daylight: 0.15,
    skin: g => ({ roof: [['pirRoof150', g.roofA * 0.9], ['poly', g.roofA * 0.1]], wall: [['pirWall120', g.wallA]], gable: [['pirWall120', g.gableA]] }),
    frameTxt: 'стальные рамы со стропильными фермами 78 м (высота 3,0 м), шаг 6 м',
    skinTxt: 'кровля PIR 150 мм + 10 % зенитных полос; стены PIR 120 мм, цоколь 1,2 м',
    life: '50+ лет, капитальное здание', build: 9, months: 12,
    pros: ['Капитальный объект: страхование, залог, ввод', 'Минимальные теплопотери', 'Легко подвесить сетки, табло, камеры', 'Нет замены мембраны'],
    cons: ['Самый тяжёлый каркас и фундаменты', 'Дольше строить', 'Меньше естественного света'],
    rate: { speed: 3, capital: 5, energy: 5, image: 4 },
    lab: { env: 'Сэндвич PIR 150 мм', frame: 'Рамы с фермами 78 м', found: 'Монолитные фундаменты под колонны' }
  },
  {
    id: 'hyb', code: 'C', name: 'ГИБРИД', type: 'Сэндвич-стены 8 м + арочная мембранная кровля', tag: 'Свет и арочный образ',
    color: '#7dd3fc', geo: { type: 'ellipse', h0: 8, H: 22 }, fd: 1.8, fcol: '#c8102e',
    steelKgM2: 60, infil: 0.6, daylight: 0.25,
    skin: g => ({ roof: [['membrane', g.roofA * 0.88], ['poly', g.roofA * 0.12]], wall: [['pirWall150', g.wallA]],
      gable: [['pirWall150', g.gableLow], ['poly', g.gableA - g.gableLow]] }),
    frameTxt: 'стальные арки на колоннах 8 м, шаг 6 м',
    skinTxt: 'стены PIR 150 мм до 8 м; кровля — утеплённая мембрана + 4 световые полосы; фронтоны из поликарбоната',
    life: 'каркас и стены 50 лет · мембрана 15–20 лет', build: 7.5, months: 10.5,
    pros: ['Максимум естественного света', 'Эффектный арочный силуэт', 'Стены держат удары мяча', 'Легче и быстрее «ПРО-БОКС»'],
    cons: ['Замена мембраны кровли через 15–20 лет', 'Сложные узлы примыкания стена–мембрана'],
    rate: { speed: 4, capital: 4, energy: 3, image: 4 },
    lab: { env: 'Мембрана + световые полосы', frame: 'Арки на колоннах 8 м', found: 'Монолитные фундаменты' }
  },
  {
    id: 'wood', code: 'D', name: 'ПРЕМИУМ WOOD', type: 'Клеёные деревянные арки + PIR-кровля', tag: 'Флагманский имидж',
    color: '#e0a66a', geo: { type: 'ellipse', h0: 8, H: 22 }, fd: 1.6, fcol: '#b5814c',
    steelKgM2: 0, infil: 0.5, daylight: 0.2,
    skin: g => ({ roof: [['pirRoof200', g.roofA * 0.94], ['poly', g.roofA * 0.06]], wall: [['glass', g.wallA]], gable: [['lamella', g.gableA]] }),
    frameTxt: 'арки из клеёной древесины 240×1600 мм, шаг 6 м, огнезащита',
    skinTxt: 'кровля PIR 200 мм + фальц, световой конёк; фасады — остекление 8 м + ламели',
    life: '50+ лет', build: 11, months: 14.5,
    pros: ['Самый сильный имидж — архитектурный объект', '«Тёплый» интерьер и лучшая акустика', 'Дерево не ржавеет — нет антикоррозионки'],
    cons: ['Самый сложный в производстве', 'Долгая логистика клеёного бруса', 'Строже требования пожарной безопасности'],
    rate: { speed: 2, capital: 5, energy: 4, image: 5 },
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
  const steelT = v.steelKgM2 * HALL / 1000;
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
  const gasM3 = heatMWh * 1000 / (GAS.kwh * GAS.eff);
  const lightMWh = 95 * 0.7 * 14 * 330 * (1 - v.daylight) / 1000;
  const elecMWh = lightMWh + 120 + 150;                // + вентиляция/дестратификаторы + АБК
  const dT = CLIMATE.tIn - CLIMATE.tOut, floorWK = 0.075 * HALL;
  return { UA, H, peakKW, heatMWh, gasM3, elecMWh, lightMWh, kw: { skin: (UA - floorWK) * dT / 1000, infil: infil * dT / 1000, other: (vent + floorWK) * dT / 1000 } };
}

/* ---------- ведомость объёмов ---------- */
export function quantities(v, g = geometry(v), e = energy(v, g)) {
  const rows = [];
  const foundTxt = { tent: 'Фундаменты столбчатые монолитные + ростверк', box: 'Фундаменты монолитные под колонны + ростверк',
    hyb: 'Фундаменты монолитные под колонны + ростверк', wood: 'Фундаменты под распор арок + ростверк' }[v.id];
  rows.push([foundTxt, `${FRAMES * 2} опор · ${2 * (W + L)} м`]);
  if (v.id === 'wood') rows.push(['Клеёные арки GL28h 240×1600 мм + прогоны и связи', `${fmtInt(g.glulam)} м³`]);
  else rows.push(['Стальной каркас (рамы, фермы, связи, прогоны)', `${fmtInt(g.steelT)} т`]);
  rows.push(['Рам / шаг', `${FRAMES} шт / ${STEP} м`]);
  const s = v.skin(g), agg = {};
  for (const part of Object.values(s)) for (const [k, a] of part) agg[k] = (agg[k] || 0) + a;
  for (const [k, a] of Object.entries(agg)) rows.push([SKIN_NAME[k], `${fmtInt(a)} м²`]);
  rows.push(['Отопление: газовые воздухонагреватели, мощность', `${fmtInt(e.peakKW)} кВт`]);
  rows.push(['Приточная вентиляция с рекуперацией 75 %', '12 000 м³/ч']);
  rows.push(['Строительный объём зала', `${fmtInt(g.vol)} м³`]);
  return rows;
}
export const COMMON_Q = [
  ['Газон FIFA Quality Pro 60 мм', `${fmtInt(PITCH_AREA)} м²`],
  ['Shock-pad 12 мм', `${fmtInt(PITCH_AREA)} м²`],
  ['Щебёночное основание 300 мм + дренаж', `${fmtInt(PITCH_AREA * 0.3)} м³`],
  ['Освещение LED 500–750 лк, DALI', '≈ 95 кВт'],
  ['Спортоборудование: ворота, сетки, скамейки, табло', 'компл.'],
  ['АБК, 2 этажа', '1 200 м²'],
  ['Трансформаторная подстанция', '1 000 кВА'],
  ['Парковка', '80 м/м + 4 автобуса']
];

export function calc(v) { const g = geometry(v), e = energy(v, g); return { v, g, e, q: quantities(v, g, e) }; }
export const ALL = () => V.map(calc);

/* ---------- форматирование ---------- */
export function fmtInt(n) { return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' '); }
export const dec = (n, d = 1) => n.toFixed(d).replace('.', ',');
