/* =====================================================================
   3D-движок: один WebGL-контекст на всю страницу.
   Канвас «переезжает» между сценой-историей (скролл) и конфигуратором.
   Тач-скролл никогда не блокируется: в истории канвас без событий,
   в конфигураторе вращение включается только кнопкой «Вращать 3D».
   ===================================================================== */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { V, W, L, R, FRAMES, STEP, INS, basePts, hAt, subdiv, inward } from './model.js';

const COARSE = matchMedia('(pointer: coarse)').matches;
const SMALL = Math.min(screen.width, screen.height) < 820;
const LOW = COARSE && SMALL;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const FR = []; for (let z = -L / 2; z <= L / 2 + 0.01; z += STEP) FR.push(z);

const COLOR = {
  tent: (x, y, wall) => y < 0.9 ? '#3b4048' : (y > 2.4 && y < 3.3 ? '#d0142a' : '#f2f2ee'),
  box: (x, y, wall) => { if (wall) { if (y < 1.2) return '#2d3138'; if (y > 11 && y < 12.8) return '#d0142a'; return '#c9ced6'; } const m = Math.abs(x) % 13; return (m > 5.5 && m < 6.8) ? '#9fc3d9' : '#e6e8eb'; },
  hyb: (x, y, wall) => { if (y <= 8.01 && wall) { if (y < 1) return '#2d3138'; if (y > 6.2 && y < 7.3) return '#d0142a'; return '#3e4550'; } const a = Math.abs(x); return ((a > 8 && a < 11) || (a > 22 && a < 25)) ? '#a9d0e6' : '#f3f3ef'; },
  wood: (x, y, wall) => { if (wall) return y < 0.8 ? '#3a3f46' : '#86a8bf'; return Math.abs(x) < 3 ? '#a9d0e6' : '#30353d'; }
};
const GABLE = { tent: '#efefea', box: '#c9ced6', hyb: '#cfe3ef', wood: '#86a8bf' };

function envGeo(v) {
  const p = subdiv(basePts(v.geo), 0.7), pos = [], col = [], c = new THREE.Color(), z0 = -L / 2, z1 = L / 2;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i], [x1, y1] = p[i + 1], mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    const wall = Math.abs(x0 - x1) < 0.01 && Math.abs(Math.abs(mx) - R) < 0.01;
    c.set(COLOR[v.id](mx, my, wall));
    const q = [[x0, y0, z0], [x1, y1, z0], [x0, y0, z1], [x1, y1, z1]];
    for (const k of [0, 2, 1, 2, 3, 1]) { pos.push(...q[k]); col.push(c.r, c.g, c.b); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

const UP = new THREE.Vector3(0, 1, 0), DV = new THREE.Vector3(), O3 = new THREE.Object3D();
function beams(list, mat, shadow = true) {
  const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, list.length);
  list.forEach((b, i) => {
    const [a, c, tx, tz] = b;
    DV.set(c[0] - a[0], c[1] - a[1], c[2] - a[2]); const len = DV.length(); DV.normalize();
    O3.position.set((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2);
    O3.quaternion.setFromUnitVectors(UP, DV); O3.scale.set(tx, len, tz); O3.updateMatrix(); m.setMatrixAt(i, O3.matrix);
  });
  m.castShadow = shadow; m.instanceMatrix.needsUpdate = true; return m;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function fieldTex() {
  const s = LOW ? 7 : 10;
  return canvasTex(75 * s, 115 * s, (g, w, h) => {
    for (let i = 0; i < 23; i++) { g.fillStyle = i % 2 ? '#2e8a3d' : '#38a04b'; g.fillRect(0, i * 5 * s, w, 5 * s); }
    g.strokeStyle = '#f4f7f2'; g.fillStyle = '#f4f7f2'; g.lineWidth = 0.14 * s;
    const ox = 3.5 * s, oy = 5 * s, fw = 68 * s, fl = 105 * s, cx = ox + fw / 2;
    g.strokeRect(ox, oy, fw, fl); g.beginPath(); g.moveTo(ox, oy + fl / 2); g.lineTo(ox + fw, oy + fl / 2); g.stroke();
    g.beginPath(); g.arc(cx, oy + fl / 2, 9.15 * s, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(cx, oy + fl / 2, 0.3 * s, 0, Math.PI * 2); g.fill();
    const ang = Math.asin(5.5 / 9.15);
    [0, 1].forEach(e => {
      const y0 = e ? oy + fl : oy, dir = e ? -1 : 1, pw = 40.32 * s, pd = 16.5 * s, gw = 18.32 * s, gd = 5.5 * s;
      g.strokeRect(cx - pw / 2, e ? y0 - pd : y0, pw, pd); g.strokeRect(cx - gw / 2, e ? y0 - gd : y0, gw, gd);
      const cy = y0 + dir * 11 * s; g.beginPath(); g.arc(cx, cy, 0.25 * s, 0, Math.PI * 2); g.fill();
      g.beginPath(); if (!e) g.arc(cx, cy, 9.15 * s, ang, Math.PI - ang); else g.arc(cx, cy, 9.15 * s, Math.PI + ang, 2 * Math.PI - ang); g.stroke();
    });
    [[ox, oy, 0], [ox + fw, oy, Math.PI / 2], [ox + fw, oy + fl, Math.PI], [ox, oy + fl, 1.5 * Math.PI]].forEach(([x, y, a]) => { g.beginPath(); g.arc(x, y, 1 * s, a, a + Math.PI / 2); g.stroke(); });
    g.globalAlpha = .18; g.font = `800 ${4.2 * s}px Unbounded, sans-serif`; g.textAlign = 'center'; g.fillText('АКТОБЕ', cx, oy + fl / 2 - 12 * s); g.globalAlpha = 1;
  });
}

const ss = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- сценарий скролл-истории ---------- */
// az/el — сферические углы камеры вокруг target, d — дистанция, fit — подгонять под узкий экран
export const STORY = [
  { p: 0.00, az: 0.72, el: 0.40, d: 265, t: [0, 6, 6], fit: 1, lf: 2.1 },
  { p: 0.12, az: 0.95, el: 0.36, d: 245, t: [0, 6, 4], fit: 1, lf: 1.5 },
  { p: 0.28, az: 1.30, el: 0.34, d: 250, t: [0, 16, 0], fit: 1 },
  { p: 0.44, az: 1.70, el: 0.26, d: 225, t: [0, 8, 0], fit: 1 },
  { p: 0.60, az: 2.05, el: 0.14, d: 200, t: [0, -6, 0], fit: 1 },
  { p: 0.66, az: 2.30, el: 0.10, d: 150, t: [-4, 4, -10], fit: 0.6 },
  { p: 0.72, az: 0.36, el: -0.04, d: 92, t: [-6, 7, -40], fit: 0 },
  { p: 0.79, az: 0.62, el: 0.02, d: 86, t: [-6, 8, -40], fit: 0 },
  { p: 0.84, az: 2.60, el: 0.36, d: 255, t: [0, 6, 4], fit: 1 },
  { p: 1.00, az: 3.70, el: 0.30, d: 245, t: [0, 6, 4], fit: 1 }
];
// раскладка слоёв по прогрессу
function storyLayers(p) {
  const up = (a, b) => ss(clamp((p - a) / (b - a)));
  const env = up(0.12, 0.26) * (1 - up(0.62, 0.70));
  const frame = up(0.28, 0.42) * (1 - up(0.62, 0.70));
  const field = up(0.44, 0.58) * (1 - up(0.62, 0.70));
  return { env, frame, field };
}
export const STORY_VARIANTS = [0.835, 0.875, 0.915, 0.955]; // A, B, C, D
export function storyVariant(p) { let i = 1; STORY_VARIANTS.forEach((q, k) => { if (p >= q) i = k; }); return p < STORY_VARIANTS[0] ? 1 : i; }

export function createEngine() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.5 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const stage = document.createElement('div'); stage.className = 'stage';
  stage.appendChild(renderer.domElement);
  const lblBox = document.createElement('div'); lblBox.className = 'lbls'; stage.appendChild(lblBox);
  const cv = renderer.domElement; cv.style.touchAction = 'pan-y';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070c16'); scene.fog = new THREE.Fog('#070c16', 380, 950);
  const cam = new THREE.PerspectiveCamera(38, 1, 1, 2000); cam.position.set(165, 95, 190);
  const ctl = new OrbitControls(cam, cv);
  ctl.target.set(0, 6, 6); ctl.enableDamping = true; ctl.maxPolarAngle = 1.52; ctl.minDistance = 8; ctl.maxDistance = 480;
  ctl.autoRotateSpeed = 0.35; ctl.enabled = false; ctl.enableZoom = false; ctl.enablePan = false;
  cv.style.touchAction = 'pan-y'; // OrbitControls ставит none — возвращаем скролл

  const hemi = new THREE.HemisphereLight('#d6e6ff', '#18202c', 1.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e6', 2.3); sun.position.set(130, 170, 90); sun.castShadow = true;
  sun.shadow.mapSize.set(LOW ? 1024 : 2048, LOW ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 500 }); sun.shadow.bias = -0.0005; scene.add(sun);
  scene.add(new THREE.AmbientLight('#8fb3ff', 0.12));
  const rim = new THREE.DirectionalLight('#ff3b4e', 0.55); rim.position.set(-160, 40, -120); scene.add(rim);

  const M = (c, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, metalness: 0 }, o));
  const plane = (w, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; scene.add(m); return m; };
  const box = (w, h, d, mat, x, y, z, par) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; (par || scene).add(m); return m; };

  /* участок */
  plane(1600, 1600, M('#0c1422'), 0, -0.06, 0);
  const grid = new THREE.GridHelper(1000, 100, '#1b2840', '#121c30'); grid.position.y = -0.04; scene.add(grid);
  plane(180, 226, M('#13213a'), 0, -0.03, 33);
  plane(96, 134, M('#253146'), 0, -0.01, -5);
  plane(60, 12, M('#3a4760'), 0, -0.01, 86);
  plane(130, 46, M('#1c2636'), 0, -0.01, 117);
  plane(1000, 10, M('#1a222d'), 0, -0.02, 155); plane(16, 8, M('#1a222d'), 0, -0.02, 146);
  plane(22, 40, M('#2f8a3c'), -71, 0.0, -20);
  box(28, 0.2, 30, M('#2a3448'), 64, 0.05, -41); box(5, 3, 3, M('#9aa3ad'), 58, 1.5, -48); box(4, 2.4, 3, M('#fbbf24'), 68, 1.2, -48);
  const stripes = []; for (let x = -62; x <= 62; x += 2.6) { stripes.push([[x, 0.02, 96], [x, 0.02, 111], 0.12, 0.02]); stripes.push([[x, 0.02, 123], [x, 0.02, 138], 0.12, 0.02]); }
  scene.add(beams(stripes, M('#5b6b86'), false));
  const rnd = (s => () => (s = (s * 9301 + 49297) % 233280) / 233280)(7);
  const cars = new THREE.InstancedMesh(new THREE.BoxGeometry(1.9, 1.5, 4.4), M('#ffffff', { roughness: .4, metalness: .3 }), 46);
  const cc = ['#e9eef7', '#1f2937', '#9ca3af', '#b91c1c', '#334155', '#e5e7eb', '#0f172a'];
  for (let i = 0; i < 46; i++) { const row = i % 2, x = -61 + Math.floor(rnd() * 47) * 2.6 + 1.3; O3.position.set(x, 0.75, row ? 103 : 130); O3.quaternion.identity(); O3.scale.set(1, 1, 1); O3.updateMatrix(); cars.setMatrixAt(i, O3.matrix); cars.setColorAt(i, new THREE.Color(cc[Math.floor(rnd() * cc.length)])); }
  cars.castShadow = true; scene.add(cars);
  [-40, -25, 25, 40].forEach((x, i) => box(2.5, 3.2, 12, M(i % 2 ? '#e3192b' : '#f2f2ee'), x + (i < 2 ? -15 : 15), 1.6, 128));
  const tp = []; for (let z = -74; z < 142; z += 9) tp.push([-86, z], [86, z]); for (let x = -77; x < 80; x += 9) tp.push([x, -76]); for (let i = 0; i < 14; i++) tp.push([-78 + (i % 3) * 7, 20 + Math.floor(i / 3) * 12]);
  const tree = new THREE.InstancedMesh(new THREE.ConeGeometry(2.4, 7, 7), M('#2e6b57'), tp.length);
  tp.forEach((p, i) => { const s = 0.8 + rnd() * 0.5; O3.position.set(p[0], 3.5 * s, p[1]); O3.scale.set(s, s, s); O3.quaternion.identity(); O3.updateMatrix(); tree.setMatrixAt(i, O3.matrix); });
  tree.castShadow = true; scene.add(tree);

  /* АБК */
  const ann = new THREE.Group(); scene.add(ann);
  box(48, 8.4, 20, M('#e4e7eb'), 0, 4.2, 70, ann);
  const glassM = M('#5f87a6', { roughness: .15, metalness: .6 });
  box(44, 2.6, 0.3, glassM, 0, 2.2, 80.1, ann); box(44, 2.6, 0.3, glassM, 0, 6.1, 80.1, ann);
  box(48.4, 0.6, 20.4, M('#2d3138'), 0, 8.7, 70, ann); box(14, 0.5, 6, M('#e3192b'), 0, 3.8, 83, ann);
  box(0.4, 3.6, 0.4, M('#2d3138'), -6.6, 1.8, 85.6, ann); box(0.4, 3.6, 0.4, M('#2d3138'), 6.6, 1.8, 85.6, ann);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(34, 2.4), new THREE.MeshBasicMaterial({
    map: canvasTex(1360, 96, (g, w, h) => { g.fillStyle = '#d0142a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = '800 54px Unbounded, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ФК «АКТОБЕ» · ТРЕНИРОВОЧНЫЙ МАНЕЖ', w / 2, h / 2 + 2); })
  }));
  sign.position.set(0, 10.3, 80.25); ann.add(sign);

  /* поле по слоям */
  const gTurf = new THREE.Group(), gPad = new THREE.Group(), gGrav = new THREE.Group(), gFound = new THREE.Group();
  [gTurf, gPad, gGrav, gFound].forEach(g => scene.add(g));
  const turf = new THREE.Mesh(new THREE.PlaneGeometry(75, 115), new THREE.MeshStandardMaterial({ map: fieldTex(), roughness: .95 }));
  turf.rotation.x = -Math.PI / 2; turf.position.y = 0.14; turf.receiveShadow = true; gTurf.add(turf);
  const gm = M('#ffffff', { roughness: .4 });
  [-1, 1].forEach(s => { const z = s * 52.5; box(0.14, 2.44, 0.14, gm, -3.66, 1.36, z, gTurf); box(0.14, 2.44, 0.14, gm, 3.66, 1.36, z, gTurf); box(7.46, 0.14, 0.14, gm, 0, 2.58, z, gTurf); const net = new THREE.Mesh(new THREE.BoxGeometry(7.3, 2.4, 2), new THREE.MeshStandardMaterial({ color: '#fff', transparent: true, opacity: .18 })); net.position.set(0, 1.34, z + s * 1); gTurf.add(net); });
  box(75, 0.04, 115, M('#1c1f24'), 0, 0.11, 0, gPad);
  box(75, 0.36, 115, M('#7c7468'), 0, -0.1, 0, gGrav);
  box(W, 0.3, L, M('#8d939a'), 0, -0.1, 0, gFound);
  const fm0 = M('#a3a8ae');
  FR.forEach(z => [-1, 1].forEach(s => box(2.8, 1.6, 2.8, fm0, s * (R - 0.4), -0.9, z, gFound)));
  box(0.6, 1, L, fm0, -R, -0.5, 0, gFound); box(0.6, 1, L, fm0, R, -0.5, 0, gFound); box(W, 1, 0.6, fm0, 0, -0.5, -L / 2, gFound); box(W, 1, 0.6, fm0, 0, -0.5, L / 2, gFound);

  /* варианты */
  const gFrame = new THREE.Group(), gEnv = new THREE.Group(); scene.add(gFrame, gEnv);
  let envMats = [], cur = null, labels = [], xr = false;
  const lay = { env: 0, frame: 0, field: 0 }, layT = { env: 0, frame: 0, field: 0 };

  function clear(g) { g.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map && m.map.dispose(); m.dispose(); }); }); g.clear(); }
  function build(id) {
    if (cur && cur.id === id) return;
    const v = V.find(x => x.id === id); cur = v; clear(gFrame); clear(gEnv); envMats = [];
    const base = v.id === 'tent' ? 0.95 : 1;
    const em = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: v.id === 'box' ? 0.5 : 0.6, metalness: v.id === 'box' ? 0.25 : 0.05, transparent: true, opacity: base, flatShading: v.geo.type === 'gable' });
    em.userData.base = base; envMats.push(em);
    const env = new THREE.Mesh(envGeo(v), em); env.castShadow = true; env.receiveShadow = true; gEnv.add(env);
    const sh = new THREE.Shape(); basePts(v.geo).forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
    const gmat = new THREE.MeshStandardMaterial({ color: GABLE[v.id], side: THREE.DoubleSide, roughness: .6, transparent: true, opacity: v.id === 'wood' ? 0.82 : v.id === 'hyb' ? 0.9 : base });
    gmat.userData.base = gmat.opacity; envMats.push(gmat);
    [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), gmat); m.position.z = s * L / 2; m.castShadow = true; gEnv.add(m); });
    const dm = new THREE.MeshStandardMaterial({ color: '#2d3138', transparent: true, opacity: 1 }); dm.userData.base = 1; envMats.push(dm);
    [-18, 18].forEach(x => { const d = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 0.4), dm); d.position.set(x, 3, -L / 2 - 0.2); gEnv.add(d); });
    const rb = new THREE.MeshStandardMaterial({ color: '#d0142a', transparent: true, opacity: 1 }); rb.userData.base = 1; envMats.push(rb);
    const st = new THREE.Mesh(new THREE.BoxGeometry(W * 0.55, 1.2, 0.3), rb); st.position.set(0, hAt(v.geo, 0) * 0.62, -L / 2 - 0.25); gEnv.add(st);
    // каркас
    const p = subdiv(basePts(v.geo), v.id === 'wood' ? 1.6 : 2.6), n = inward(p), d = v.fd;
    const out = p.map((q, i) => [q[0] + n[i][0] * INS, q[1] + n[i][1] * INS]);
    const inn = p.map((q, i) => { const k = (i === 0 || i === p.length - 1) ? 0.7 : 1; return [q[0] + n[i][0] * (INS + d * k), q[1] + n[i][1] * (INS + d * k)]; });
    const fm = new THREE.MeshStandardMaterial({ color: v.fcol, roughness: v.id === 'wood' ? 0.7 : 0.4, metalness: v.id === 'wood' ? 0 : 0.55 });
    const ch = [], dg = [], ties = [];
    FR.forEach(z => {
      for (let i = 0; i < p.length - 1; i++) {
        if (v.id === 'wood') { const a = [(out[i][0] + inn[i][0]) / 2, (out[i][1] + inn[i][1]) / 2, z], b = [(out[i + 1][0] + inn[i + 1][0]) / 2, (out[i + 1][1] + inn[i + 1][1]) / 2, z]; ch.push([a, b, d, 0.42]); }
        else {
          ch.push([[...out[i], z], [...out[i + 1], z], 0.26, 0.26]); ch.push([[...inn[i], z], [...inn[i + 1], z], 0.26, 0.26]);
          dg.push([[...out[i], z], [...inn[i], z], 0.12, 0.12]); dg.push([i % 2 ? [...out[i], z] : [...inn[i], z], i % 2 ? [...inn[i + 1], z] : [...out[i + 1], z], 0.12, 0.12]);
        }
      }
    });
    for (let j = 0; j < FR.length - 1; j++) for (let i = 1; i < p.length - 1; i += (v.id === 'wood' ? 3 : 2)) ties.push([[...out[i], FR[j]], [...out[i], FR[j + 1]], 0.16, 0.16]);
    gFrame.add(beams(ch, fm)); if (dg.length) gFrame.add(beams(dg, fm)); gFrame.add(beams(ties, M('#7b8794', { metalness: .5, roughness: .4 })));
    const lg = []; [-28, -14, 0, 14, 28].forEach(x => FR.slice(1, -1).forEach(z => { const y = hAt(v.geo, x) - INS - d - 0.6; lg.push([[x, y, z - 0.8], [x, y, z + 0.8], 0.6, 0.22]); }));
    gFrame.add(beams(lg, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff6d8', emissiveIntensity: 2.2 }), false));
    // подписи
    lblBox.innerHTML = '';
    const L2 = [
      ['env', v.lab.env, [-R * 0.55, hAt(v.geo, -R * 0.55) + 1, 18], gEnv],
      ['frame', v.lab.frame, [R * 0.62, hAt(v.geo, R * 0.62) - d, -24], gFrame],
      ['frame', 'LED 500–750 лк · DALI', [0, hAt(v.geo, 0) - d - 1.5, 30], gFrame],
      ['field', 'Газон FIFA Quality Pro 60 мм', [-18, 0.3, -34], gTurf],
      ['field', 'Shock-pad 12 мм', [24, 0.1, -46], gPad],
      ['field', 'Щебёночное основание + дренаж', [-30, -0.1, 44], gGrav],
      ['field', v.lab.found, [R, -1, -48], gFound]
    ];
    labels = L2.map(([k, t, a, g]) => { const e = document.createElement('div'); e.className = 'lbl'; e.textContent = t; lblBox.appendChild(e); return { k, e, a: new THREE.Vector3(...a), g }; });
    applyLayers(); dirty = true;
  }
  function applyLayers() {
    const e1 = ss(lay.env), e2 = ss(lay.frame), e3 = ss(lay.field);
    gEnv.position.y = 30 * e1; gFrame.position.y = 12 * e2;
    gPad.position.y = -4 * e3; gGrav.position.y = -10 * e3; gFound.position.y = -18 * e3;
    envMats.forEach(m => { const b = m.userData.base, op = xr ? 0.12 : b * (1 - 0.5 * e1); m.opacity = op; m.depthWrite = op > 0.9; });
  }

  /* ---------- режимы ---------- */
  let mode = null, host = null, visible = false, dirty = true, interactive = false;
  let ps = 0, pt = 0, fresh = true;                    // прогресс истории (сглаженный / целевой)
  const cfg = { pos: new THREE.Vector3(165, 95, 190), tgt: new THREE.Vector3(0, 6, 6), variant: 'box', auto: true };
  let tw = null;
  const VIEWS = { ext: [[150, 85, 175], [0, 8, 10]], in: [[26, 2.6, 46], [-6, 7, -40]], top: [[0.1, 300, 60], [0, 0, 30]] };
  const storyVar = { id: 'box' };

  function resize() {
    if (!host) return;
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); cv.style.width = '100%'; cv.style.height = '100%';
    cam.aspect = w / h; cam.updateProjectionMatrix(); dirty = true;
  }
  const ro = new ResizeObserver(resize);

  function attach(el, m) {
    if (host === el) return;
    if (mode === 'config') { cfg.pos.copy(cam.position); cfg.tgt.copy(ctl.target); }
    if (host) ro.unobserve(host);
    host = el; mode = m; el.appendChild(stage); ro.observe(el); resize();
    setInteractive(false);
    if (m === 'config') {
      if (cam.view && cam.view.enabled) cam.clearViewOffset();
      cam.position.copy(cfg.pos); ctl.target.copy(cfg.tgt); ctl.autoRotate = cfg.auto && !REDUCED; ctl.enabled = !COARSE;
      build(cfg.variant); lay.env = lay.frame = lay.field = layT.env; applyLayers();
      stage.classList.add('m-cfg'); stage.classList.remove('m-story');
    } else {
      ctl.enabled = false; ctl.autoRotate = false; ps = pt;
      stage.classList.add('m-story'); stage.classList.remove('m-cfg'); applyStory(ps); fresh = true;
    }
    dirty = true;
  }
  const STORY_VARIANT_ID = p => V[storyVariant(p)].id;

  const sph = new THREE.Vector3(), tgt = new THREE.Vector3();
  function storyCam(p) {
    let i = 0; while (i < STORY.length - 2 && p > STORY[i + 1].p) i++;
    const a = STORY[i], b = STORY[i + 1], k = ss(clamp((p - a.p) / (b.p - a.p)));
    const az = lerp(a.az, b.az, k), el = lerp(a.el, b.el, k), fit = lerp(a.fit, b.fit, k);
    let d = lerp(a.d, b.d, k);
    if (cam.aspect < 1.25) d *= 1 + fit * (Math.pow(1.25 / cam.aspect, 0.82) - 1);
    tgt.set(lerp(a.t[0], b.t[0], k), lerp(a.t[1], b.t[1], k), lerp(a.t[2], b.t[2], k));
    // портрет: текст снизу — сдвигаем кадр вверх
    const w = host.clientWidth, h = host.clientHeight;
    const sh = cam.aspect < 1 ? fit * lerp(a.lf || 1, b.lf || 1, k) * 0.11 * h * (1 - cam.aspect) / 0.54 : 0;
    if (sh > 0.5) cam.setViewOffset(w, h, 0, sh, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    sph.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(d).add(tgt);
    cam.position.copy(sph); cam.lookAt(tgt);
    const inside = p > 0.69 && p < 0.82;
    hemi.intensity = inside ? 1.7 : 1.0;
  }
  function applyStory(p) {
    const id = STORY_VARIANT_ID(p); if (id !== storyVar.id) { storyVar.id = id; }
    build(id);
    const l = storyLayers(p); lay.env = l.env; lay.frame = l.frame; lay.field = l.field; applyLayers();
    storyCam(p);
  }

  const tmp = new THREE.Vector3();
  function updateLabels() {
    if (!labels.length) return;
    const w = host.clientWidth, h = host.clientHeight;
    labels.forEach(l => {
      const ex = l.k === 'env' ? lay.env : l.k === 'frame' ? lay.frame : lay.field;
      const op = clamp((ss(ex) - 0.35) / 0.35);
      tmp.copy(l.a); tmp.y += l.g.position.y; tmp.project(cam);
      const on = tmp.z < 1 && op > 0 && Math.abs(tmp.x) < 1.1 && Math.abs(tmp.y) < 1.1;
      l.e.style.opacity = on ? op : 0;
      if (on) l.e.style.transform = `translate3d(${((tmp.x * .5 + .5) * w).toFixed(1)}px,${((-tmp.y * .5 + .5) * h).toFixed(1)}px,0) translate(-50%,-50%)`;
    });
  }

  ctl.addEventListener('start', () => { ctl.autoRotate = false; cfg.auto = false; tw = null; });
  ctl.addEventListener('change', () => { dirty = true; });

  function loop(now) {
    requestAnimationFrame(loop);
    if (!host || !visible || document.hidden) return;
    if (mode === 'story') {
      const dp = pt - ps; ps = Math.abs(dp) < 1e-4 ? pt : ps + dp * (REDUCED ? 1 : 0.12);
      if (dp !== 0 || fresh) { applyStory(ps); dirty = true; if (onStory) onStory(ps); fresh = false; }
    } else {
      let anim = false;
      for (const k of ['env', 'frame', 'field']) { const d = layT[k] - lay[k]; if (Math.abs(d) > 1e-4) { lay[k] += d * 0.14; anim = true; } else lay[k] = layT[k]; }
      if (anim) { applyLayers(); dirty = true; }
      if (tw) {
        let k = Math.min(1, (now - tw.t0) / 1400); k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        cam.position.lerpVectors(tw.p0, tw.p1, k); ctl.target.lerpVectors(tw.q0, tw.q1, k); if (k >= 1) tw = null; dirty = true;
      }
      if (ctl.update()) dirty = true;
      if (ctl.autoRotate) dirty = true;
    }
    if (dirty) { renderer.render(scene, cam); updateLabels(); dirty = false; }
  }
  requestAnimationFrame(loop);

  let onStory = null;
  function setInteractive(b) {
    interactive = b && mode === 'config';
    ctl.enabled = mode === 'config' && (interactive || !COARSE);
    ctl.enableZoom = interactive; ctl.enablePan = false;
    cv.style.touchAction = interactive ? 'none' : 'pan-y';
    stage.classList.toggle('live', interactive);
  }

  return {
    stage, attach,
    setVisible(b) { visible = b; if (b) dirty = true; else if (interactive) setInteractive(false); },
    setStoryProgress(p) { pt = clamp(p); },
    onStory(fn) { onStory = fn; },
    setVariant(id) { cfg.variant = id; if (mode === 'config') build(id); },
    setExplode(t) { layT.env = layT.frame = layT.field = t; if (REDUCED) { lay.env = lay.frame = lay.field = t; applyLayers(); } dirty = true; },
    view(k) {
      if (mode !== 'config') return; const [p, t] = VIEWS[k];
      tw = { t0: performance.now(), p0: cam.position.clone(), q0: ctl.target.clone(), p1: new THREE.Vector3(...p), q1: new THREE.Vector3(...t) };
      ctl.autoRotate = k === 'ext' && !REDUCED; cfg.auto = ctl.autoRotate; hemi.intensity = k === 'in' ? 1.8 : 1.0; dirty = true;
    },
    xray(b) { xr = b; applyLayers(); dirty = true; },
    setInteractive, get interactive() { return interactive; },
    renderNow() { dirty = true; }
  };
}
