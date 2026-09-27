'use strict';
/* =====================================================================
   SanCalc Y4 • app.js
   Nhiều trang (hash router) • bài học dạng slide ngắn • linh vật "Bé Mầm"
   Công thức theo Chương 1 (skill san-khoa-y4) • chạy offline, không CDN.
   ===================================================================== */

/* ---------------- Helpers ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(res => setTimeout(res, RM ? 0 : ms));
const anim = (el, kf, o = {}) => (el && !RM && el.animate) ? el.animate(kf, { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)', ...o }) : null;
const popIn = (el, delay = 0) => anim(el, [{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { delay, fill: 'backwards' });
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } }
};
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------------- Ngày tháng ---------------- */
const DAY_MS = 864e5;
const pad = n => String(n).padStart(2, '0');
const dim = (y, m) => new Date(y, m, 0).getDate();                 // số ngày của tháng m (1–12)
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const diffDays = (a, b) => Math.round((b - a) / DAY_MS);           // (b − a) theo ngày lịch
const fmtDate = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { if (!s) return null; const [y, m, d] = s.split('-').map(Number); return y ? new Date(y, m - 1, d) : null; };
const todayDate = () => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); };
const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const wd = n => `${Math.floor(n / 7)} tuần ${n % 7} ngày`;
const wds = n => `${Math.floor(n / 7)}w${n % 7}d`;

/* ---------------- CÔNG THỨC ----------------
   Ưu tiên LỜI GIẢNG APP CHƯƠNG 1 (bản chép lời gốc); chỗ bài giảng không nói thì theo SÁCH BỘ MÔN
   ([5] "Định tuổi thai" – Âu Nhựt Luân • [7] "Xác định tuổi thai và các vấn đề có liên quan").
   • Tuổi thai (ngày) = (Khám − Kinh chót) + 1 — đếm TÍNH CẢ ngày kinh chót (APP C1: 01/02 ➜ 02/04 = 28 + 31 + 2 = 61 = 8w5d).
   • Thụ tinh = ngày 14 = 2 tuần ➜ kinh chót lí thuyết = thụ tinh − 13 (APP C1 "cộng 13"; sách [5] bà C.: 20.08 ➜ 07.08).
   • IVF: (Khám − Chuyển phôi) + 17 (phôi 3 ngày) / + 19 (phôi 5 ngày) (APP C1: 08/08 ➜ 17/09 = 8w3d; sách: phôi 3 ngày = 2w3d).
   • Chu kỳ đều X ngày: Naegele + (X − 28) (APP C1: chu kỳ 40 ➜ rụng trứng ngày 26 ➜ tính từ ngày 12).
   • Naegele [7]: (ngày + 7)/(tháng − 3)/(năm + 1).
   • CRL 10–30 mm: Tuổi thai (ngày) = 42 + CRL [5][7]. Ngày tràn tháng (không nguồn nào nói) ➜ giữ quy ước calcNaegele bản cũ. */
function naegele(lmp, cycle = 28) {
  const d = lmp.getDate(), m = lmp.getMonth() + 1, y = lmp.getFullYear();
  const early = m <= 3, m2 = early ? m + 9 : m - 3, y2 = early ? y : y + 1;
  const diff = cycle - 28, raw = d + 7 + diff, max = dim(y2, m2);
  return { d, m, y, early, m2, y2, diff, raw, max, over: raw > max, edd: new Date(y2, m2 - 1, raw) };
}
function naegeleSteps(n) {
  const dp = n.diff ? ` ${n.diff > 0 ? '+' : '−'} ${Math.abs(n.diff)}` : '';
  const s = [
    `📆 Ngày ${n.d} + 7${dp} = <b>${n.raw}</b>`,
    n.early ? `🗓️ Tháng ${n.m} + 9 = <b>${n.m2}</b>` : `🗓️ Tháng ${n.m} − 3 = <b>${n.m2}</b>`,
    n.early ? `🎆 Năm giữ <b>${n.y2}</b>` : `🎆 Năm ${n.y} + 1 = <b>${n.y2}</b>`
  ];
  if (n.over) s.push(`🌊 ${n.raw} > ${n.max} (T${n.m2} có ${n.max} ngày) ➜ ${n.raw} − ${n.max} = <b>${n.raw - n.max}</b>, tháng +1`);
  s.push(`🎯 <b>${fmtDate(n.edd)}</b>`);
  return s;
}
function gaSegments(lmp, exam) {   // đếm theo tháng, TÍNH CẢ ngày kinh chót ➜ tổng = (Khám − KC) + 1
  const d = lmp.getDate();
  if (lmp.getFullYear() === exam.getFullYear() && lmp.getMonth() === exam.getMonth())
    return [{ m: exam.getMonth() + 1, days: exam.getDate() - d + 1, label: `(${exam.getDate()} − ${d} + 1)` }];
  const max = dim(lmp.getFullYear(), lmp.getMonth() + 1);
  const segs = [{ m: lmp.getMonth() + 1, days: max - d + 1, label: d === 1 ? `${max}` : `(${max} − ${d} + 1)` }];
  for (let c = new Date(lmp.getFullYear(), lmp.getMonth() + 1, 1); c.getFullYear() * 12 + c.getMonth() < exam.getFullYear() * 12 + exam.getMonth(); c = new Date(c.getFullYear(), c.getMonth() + 1, 1)) {
    const dd = dim(c.getFullYear(), c.getMonth() + 1);
    segs.push({ m: c.getMonth() + 1, days: dd, label: `${dd}` });
  }
  segs.push({ m: exam.getMonth() + 1, days: exam.getDate(), label: `${exam.getDate()}` });
  return segs;
}

/* ---------------- Âm thanh ---------------- */
let booting = true;
class SoundFX {
  constructor() { this.ctx = null; this.enabled = true; }
  init() {
    if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false; this.ctx = new AC(); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return true;
  }
  tone(freq, { type = 'sine', at = 0, dur = .2, vol = .1, to = null } = {}) {
    if (!this.enabled || booting || !this.init()) return;
    const t = this.ctx.currentTime + at, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + .01);
  }
  playCorrect() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, { type: 'triangle', at: i * .05, dur: .22, vol: .12 })); }
  playWrong() { this.tone(180, { type: 'sawtooth', dur: .2, vol: .16, to: 80 }); }
  playPop() { this.tone(580, { dur: .045, vol: .07, to: 850 }); }
  playTick() { this.tone(1250, { dur: .03, vol: .03 }); }
  playFanfare() { [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => this.tone(f, { type: 'triangle', at: i * .07, dur: .35, vol: .14 })); }
}
const sound = new SoundFX();

/* ---------------- Confetti ---------------- */
const canvas = $('#confettiCanvas'), cctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
function launchConfetti() {
  if (RM) return;
  const colors = ['#ffd6e6', '#ffe2cc', '#fff0ad', '#c9f2de', '#d3e9ff', '#ff6fa3', '#e6dcff'];
  particles = Array.from({ length: 70 }, () => ({
    x: canvas.width / 2 + (Math.random() - .5) * 200, y: canvas.height * .38,
    vx: (Math.random() - .5) * 13, vy: Math.random() * -11 - 4, size: Math.random() * 9 + 4,
    color: pick(colors), rotation: Math.random() * 360, vrot: (Math.random() - .5) * 9, opacity: 1, heart: Math.random() < .3
  }));
  renderConfetti();
}
function renderConfetti() {
  cctx.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.vy += .38; p.rotation += p.vrot; p.opacity -= .017;
    if (p.opacity <= 0) return;
    alive = true;
    cctx.save(); cctx.translate(p.x, p.y); cctx.rotate(p.rotation * Math.PI / 180);
    cctx.globalAlpha = p.opacity; cctx.fillStyle = p.color;
    if (p.heart) { cctx.font = `${p.size * 2}px sans-serif`; cctx.fillText('💗', -p.size, p.size); }
    else cctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * .7);
    cctx.restore();
  });
  if (alive) requestAnimationFrame(renderConfetti); else cctx.clearRect(0, 0, canvas.width, canvas.height);
}

/* =====================================================================
   LINH VẬT "BÉ MẦM"
   ===================================================================== */
const MASCOT_SVG = `<svg class="mascot" viewBox="0 0 120 124" aria-hidden="true"><g class="m-bob">
  <ellipse class="m-shadow" cx="60" cy="117" rx="30" ry="5"/>
  <g class="m-all">
    <path class="m-leaf" d="M60 34 C52 18 62 6 76 8 C76 22 68 30 60 34 Z"/>
    <path class="m-leaf" d="M59 34 C56 24 46 20 40 24 C44 32 52 35 59 34 Z"/>
    <path class="m-arm al" d="M19 78 q-9 -4 -8 -15"/><path class="m-arm ar" d="M101 78 q9 -4 8 -15"/>
    <ellipse class="m-body" cx="60" cy="74" rx="44" ry="40"/>
    <ellipse class="m-belly" cx="60" cy="90" rx="22" ry="14"/>
    <g class="m-eye-n"><ellipse cx="44" cy="68" rx="5.5" ry="7"/><ellipse cx="76" cy="68" rx="5.5" ry="7"/><circle class="m-glint" cx="46" cy="65" r="2"/><circle class="m-glint" cx="78" cy="65" r="2"/></g>
    <g class="m-eye-h"><path d="M38 70 q6 -9 12 0"/><path d="M70 70 q6 -9 12 0"/></g>
    <ellipse class="m-blush" cx="33" cy="81" rx="7.5" ry="4.5"/><ellipse class="m-blush" cx="87" cy="81" rx="7.5" ry="4.5"/>
    <path class="m-mouth m-smile" d="M53 81 q7 7 14 0"/>
    <path class="m-mouth m-grin" d="M50 79 q10 14 20 0 z"/>
    <path class="m-mouth m-sad" d="M52 87 q8 -7 16 0"/>
    <path class="m-tear" d="M81 74 q4 7 0 10 q-4 -3 0 -10z"/>
  </g></g></svg>`;
function mountMascots(root = document) {
  $$('.mascot-slot', root).forEach(s => {
    if (s.firstElementChild) return;
    s.innerHTML = MASCOT_SVG;
    if (s.dataset.size) s.style.width = s.dataset.size + 'px';
    s.addEventListener('click', () => mood(s, 'happy', 1200));
  });
}
function mood(slot, m, ms = 1500) {
  const svg = slot && $('.mascot', slot);
  if (!svg) return;
  svg.classList.remove('happy', 'sad');
  void svg.getBoundingClientRect();
  if (!m) return;
  svg.classList.add(m);
  clearTimeout(slot._mt);
  if (ms) slot._mt = setTimeout(() => svg.classList.remove(m), ms);
}
const TIPS = [
  'Đếm tuổi thai tính luôn ngày kinh chót là ngày 1 🩸',
  'APP chương 1: kinh chót 01/02 ➜ khám 02/04 = 28 + 31 + 2 = 61 ngày = 8w5d 💊',
  'APP chương 1: phôi 5 ngày chuyển 08/08 ➜ 17/09 = 40 + 19 = 59 ngày = 8w3d 🧬',
  'Lúc vừa phóng noãn + thụ tinh, tuổi thai đã là 2 tuần 🥚',
  'Bà C. (sách): phôi 3 ngày chuyển 23.08 ➜ tuổi thai 2w3d, kinh chót lí thuyết 07.08 🧬',
  'Chu kỳ đều 40 ngày: rụng trứng ngày 26 ➜ tính tuổi thai từ ngày 12 (dự sinh + 12) 🔄',
  'Không dùng tránh thai nội tiết trong vòng 2 tháng mới áp Naegele (sách ch.7) 💊',
  'Siêu âm định tuổi thai lý tưởng: 10w0d – 13w6d (CRL 30–84 mm) 📏',
  'CRL tăng khoảng 1 mm mỗi ngày ➜ 10–30 mm: tuổi thai = 42 + CRL',
  'Khẳng định tuổi thai trước hết TCN1 — sau đó không được thay đổi 🔒'
];
let tipIdx = 0;

/* =====================================================================
   STATE
   ===================================================================== */
const state = {
  inputMode: 'type', topic: 'all', streak: 0, score: 0,
  bestStreak: store.get('san_best_streak', 0),
  totalAnswered: store.get('san_total_answered', 0),
  trapsAvoided: store.get('san_traps_avoided', 0),
  topicStats: store.get('san_topic_stats', {}),
  bestBlitz: store.get('san_best_blitz', 0),
  autoYear: store.get('san_auto_year', true),
  seen: store.get('san_seen', {}),
  currentQ: null, answered: false, qStart: 0, times: [], blitz: null
};
function saveStats() {
  store.set('san_best_streak', state.bestStreak);
  store.set('san_total_answered', state.totalAnswered);
  store.set('san_traps_avoided', state.trapsAvoided);
  store.set('san_topic_stats', state.topicStats);
}
function recordAnswer(q, ok) {
  state.totalAnswered++;
  const ts = state.topicStats[q.type] || (state.topicStats[q.type] = [0, 0]);
  ts[1]++;
  if (ok) { ts[0]++; if (q.expectedType === 'trap') state.trapsAvoided++; }
  saveStats();
}

/* =====================================================================
   ROUTER: #home • #path • #lessons • #L1/2 • #drill • #traps • #cheat • #stats
   ===================================================================== */
const PAGES = ['home', 'path', 'lessons', 'lesson', 'drill', 'traps', 'cheat', 'stats'];
const ORDER = ['L0', 'L1', 'L1B', 'L2', 'L3', 'L4'];
const DECKS = {};
const route = { page: null, deck: null, slide: 0 };
function initDecks() {
  $$('.deck').forEach(el => {
    const d = el.dataset;
    DECKS[d.deck] = { id: d.deck, el, slides: $$('.slide', el), title: d.title, num: d.num, icon: d.icon, color: d.color, topic: d.topic, f: d.f };
  });
}
function parseHash() {
  const [p, s] = decodeURIComponent(location.hash.slice(1) || 'home').split('/');
  if (DECKS[p]) return { page: 'lesson', deck: p, slide: Math.max(0, Math.min(+s || 0, DECKS[p].slides.length - 1)) };
  return { page: PAGES.includes(p) && p !== 'lesson' ? p : 'home', deck: null, slide: 0 };
}
function go(h) { if (location.hash === '#' + h) render(); else location.hash = h; }
function render() {
  const r = parseHash(), prev = { ...route };
  Object.assign(route, r);
  const changed = r.page !== prev.page;
  if (changed) {
    $$('.page').forEach(p => p.classList.toggle('active', p.dataset.page === r.page));
    const navKey = { lesson: 'lessons', path: 'home', cheat: 'home' }[r.page] || r.page;
    $$('#nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === navKey));
    window.scrollTo(0, 0);
    sound.playPop();
  }
  if (r.page !== 'drill') hideSheet();
  const fn = PAGE_ENTER[r.page];
  if (fn) fn(r, prev, changed);
}
const PAGE_ENTER = {
  path: (r, prev, changed) => { if (changed) renderWiz(0); },
  lessons: () => renderLessonGrid(),
  lesson: (r, prev) => showSlide(r.deck, r.slide, prev.page === 'lesson' && prev.deck === r.deck ? Math.sign(r.slide - prev.slide) : 1),
  drill: () => { if (!state.currentQ) nextQuestion(); else if (!state.answered) setTimeout(focusFirstInput, 80); },
  stats: () => updateBadgeView()
};
function startTopicDrill(topic) {
  go('drill');
  setTopic(topic);
  sound.playFanfare();
}

/* =====================================================================
   BÀI HỌC: slide
   ===================================================================== */
function showSlide(id, idx, dir) {
  const D = DECKS[id], n = D.slides.length, s = D.slides[idx];
  $$('.deck').forEach(d => d.classList.toggle('active', d === D.el));
  D.slides.forEach((x, i) => x.classList.toggle('active', i === idx));
  if (dir) anim(s, [{ opacity: 0, transform: `translateX(${dir * 60}px) rotate(${dir * 1.5}deg)` }, { opacity: 1, transform: 'none' }], { duration: 420 });
  $('[data-page="lesson"]').style.setProperty('--lpc', D.color);
  $('#lpNum').textContent = D.num;
  $('#lpTitle').textContent = D.title;
  if (idx + 1 > (state.seen[id] || 0)) { state.seen[id] = idx + 1; store.set('san_seen', state.seen); }
  $('#lpDots').innerHTML = D.slides.map((_, i) => `<button class="${i === idx ? 'on' : i < state.seen[id] ? 'seen' : ''}" aria-label="Slide ${i + 1}" onclick="go('${id}/${i}')"></button>`).join('');
  $('#lpCount').textContent = `${idx + 1} / ${n}`;
  $('#lpPrev').textContent = idx ? '◀ Trước' : '◀ Bài học';
  const nextD = ORDER[ORDER.indexOf(id) + 1];
  $('#lpNext').textContent = idx < n - 1 ? 'Tiếp ▶' : nextD ? 'Bài tiếp ▶' : '🚫 Sang 6 bẫy ▶';
  const q = $('.quiz', s);
  if (q && !q.firstElementChild) newQuiz(q);
  const hook = SLIDE_ENTER[`${id}-${idx}`];
  if (hook) setTimeout(hook, 150);
}
function slideNext() {
  const D = DECKS[route.deck], i = route.slide;
  if (i < D.slides.length - 1) return go(`${D.id}/${i + 1}`);
  const nextD = ORDER[ORDER.indexOf(D.id) + 1];
  go(nextD ? `${nextD}/0` : 'traps');
}
function slidePrev() { if (route.slide) go(`${route.deck}/${route.slide - 1}`); else go('lessons'); }

function renderLessonGrid() {
  $('#lessonGrid').innerHTML = ORDER.map((id, k) => {
    const D = DECKS[id], n = D.slides.length, seen = state.seen[id] || 0, [ok, tot] = state.topicStats[D.topic] || [0, 0];
    return `<a class="lg-tile" href="#${id}/${seen > 0 && seen < n ? seen : 0}" style="--c:${D.color};animation-delay:${k * 60}ms">
      <div class="lg-art"><span class="lg-num">${D.num}</span>${seen >= n ? '<span class="lg-done">✅</span>' : ''}<i>${D.icon}</i></div>
      <div class="lg-body"><h4>${D.title}</h4><div class="lg-f">${D.f}</div>
        <div class="lg-dots">${D.slides.map((_, i) => `<i class="${i < seen ? 'on' : ''}"></i>`).join('')}</div>
        <div class="lg-stat">${n} slide • ${tot ? `🎯 ${Math.round(ok / tot * 100)}% đúng (${tot} câu)` : 'chưa luyện'}</div></div></a>`;
  }).join('') + (() => {
    const [ok, tot] = state.topicStats.traps || [0, 0];
    return `<a class="lg-tile" href="#traps" style="--c:#ffe4e8;animation-delay:${6 * 60}ms"><div class="lg-art"><span class="lg-num">5</span><i>🚫</i></div>
      <div class="lg-body"><h4>6 bẫy điểm liệt</h4><div class="lg-f">Nhận diện ➜ NÉ, không áp công thức</div><div class="lg-stat">6 thẻ lật • ${tot ? `🎯 ${Math.round(ok / tot * 100)}% đúng` : 'chưa luyện'}</div></div></a>`;
  })();
}

/* =====================================================================
   TRANG CHỦ: VÒNG XOAY THAI KỲ
   ===================================================================== */
const RING = { C: 150, R: 112, gap: 30 };
const ringAng = d => (-90 + RING.gap / 2 + d / 280 * (360 - RING.gap)) * Math.PI / 180;
const ringPt = (d, r) => [RING.C + r * Math.cos(ringAng(d)), RING.C + r * Math.sin(ringAng(d))];
function ringArc(d1, d2, r) {
  const [x1, y1] = ringPt(d1, r), [x2, y2] = ringPt(d2, r);
  const big = (d2 - d1) / 280 * (360 - RING.gap) > 180 ? 1 : 0;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 ${big} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}
const RING_MARKS = [
  { d: 1, r: 112, icon: '🩸', sub: 'kinh chót = ngày 1', title: 'Ngày đầu kinh chót = ngày thứ 1', text: 'Đếm tuổi thai tính luôn ngày này (APP chương 1).', go: 'L0/0' },
  { d: 14, r: 112, icon: '🥚', sub: 'phóng noãn + thụ tinh', title: 'Phóng noãn + thụ tinh = 2 tuần (2w0d)', text: 'Sách: vừa phóng noãn và thụ tinh thì tuổi thai đã được tính là 2 tuần.', go: 'L0/1' },
  { d: 19, r: 86, small: true, icon: '🧬', sub: 'chuyển phôi N5', title: 'Chuyển phôi: N3 = 17 ngày • N5 = 19 ngày', text: 'Sách (bà C.): phôi 3 ngày chuyển ➜ 2w3d. Hôm khám = (Khám − Chuyển phôi) + 17 / + 19.', go: 'L3/1' },
  { d: 63, r: 86, small: true, icon: '📏', sub: 'CRL 21 mm', title: 'CRL 10 – 30 mm ➜ 42 + CRL', text: 'VD: CRL 21 mm = 63 ngày = 9w0d.', go: 'L4/0' },
  { d: 98, r: 112, icon: '🔒', sub: 'hết 3 tháng đầu', title: 'Hết 3 tháng đầu (14w0d)', text: 'Dự sinh chốt ở TCN1 ➜ KHÓA CHẾT, TCN2 / TCN3 lệch cũng không đổi.', go: 'traps' },
  { d: 280, r: 112, icon: '👶', sub: 'ngày dự sinh', title: 'Ngày dự sanh = 280 ngày (40 tuần) sau kinh cuối', text: 'Naegele: (ngày + 7) / (tháng − 3) / (năm + 1).', go: 'L1/0' }
];
const ringState = { d: 0, raf: 0 };
function renderRing() {
  const { R } = RING;
  let h = `<path d="${ringArc(0, 280, R)}" class="ring-track"/>`;
  [[0, 98, '#bff0d6', 'TCN1'], [98, 196, '#ffeaa1', 'TCN2'], [196, 280, '#ffc6da', 'TCN3']].forEach(([a, b, c, t]) => {
    h += `<path d="${ringArc(a + .8, b - .8, R)}" stroke="${c}" class="ring-tri"/>`;
    const [x, y] = ringPt((a + b) / 2, R);
    h += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="ring-tri-t">${t}</text>`;
  });
  for (let w = 0; w <= 40; w++) {
    const big = w % 10 === 0, [x1, y1] = ringPt(w * 7, R + 11), [x2, y2] = ringPt(w * 7, R + (big ? 19 : 15));
    h += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" class="ring-tick${big ? ' big' : ''}"/>`;
    if (big) { const [tx, ty] = ringPt(w * 7, R + 28); h += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" class="ring-wk">${w}w</text>`; }
  }
  h += `<path d="${ringArc(52, 72, R - 26)}" class="ring-crl"/>`;
  h += `<path id="ringProg" class="ring-prog" d=""/><circle id="ringDot" r="6" class="ring-dot" cx="0" cy="0"/>`;
  RING_MARKS.forEach((m, i) => {
    const [x, y] = ringPt(m.d, m.r);
    h += `<g class="ring-mark${m.d === 280 ? ' pulse' : ''}" data-i="${i}" tabindex="0" role="button" aria-label="${m.title}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m.small ? 11 : 14}"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}">${m.icon}</text></g>`;
  });
  h += `<text id="ringWeek" x="150" y="160">0w0d</text><text id="ringSub" x="150" y="180">tuổi thai</text>`;
  $('#ringSvg').innerHTML = h;
  $$('.ring-mark').forEach(g => {
    g.onclick = () => showRingMark(+g.dataset.i);
    g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showRingMark(+g.dataset.i); } };
  });
}
function ringSet(d) {
  ringState.d = d;
  $('#ringProg').setAttribute('d', d > .5 ? ringArc(0, d, RING.R - 13) : '');
  const [x, y] = ringPt(d, RING.R - 13);
  $('#ringDot').setAttribute('cx', x.toFixed(1)); $('#ringDot').setAttribute('cy', y.toFixed(1));
  $('#ringWeek').textContent = wds(Math.round(d));
}
function ringTo(target, ms) {
  cancelAnimationFrame(ringState.raf);
  if (RM) return ringSet(target);
  const from = ringState.d, t0 = performance.now();
  const f = t => {
    const p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
    ringSet(from + (target - from) * e);
    if (p < 1) ringState.raf = requestAnimationFrame(f);
  };
  ringState.raf = requestAnimationFrame(f);
}
function showRingMark(i) {
  const m = RING_MARKS[i];
  $$('.ring-mark').forEach(g => g.classList.toggle('sel', +g.dataset.i === i));
  ringTo(m.d, 700);
  $('#ringSub').textContent = m.sub;
  const cap = $('#ringCaption');
  cap.innerHTML = `<b>${m.icon} ${m.title}</b><br>${m.text} <a class="btn btn-sm btn-sky" style="margin-top:6px" href="#${m.go}">📖 Xem</a>`;
  popIn(cap);
  sound.playPop();
}

/* =====================================================================
   CHỌN CÔNG THỨC (wizard)
   ===================================================================== */
const WIZ = [
  { key: 's0', icon: '🍼', q: 'Thai có từ IVF không?', opts: [['no', '🌸', 'Thai tự nhiên'], ['ivf', '🧬', 'Thai IVF (biết ngày chuyển phôi)'], ['ivf_fgr', '🚨', 'Thai IVF + siêu âm thấy thai nhỏ']] },
  { key: 's1', icon: '📅', q: 'Nhớ chính xác ngày đầu kinh chót (LMP)?', sub: 'kèm: không dùng nội tiết ≥ 3 tháng, không cho con bú / mới sảy', opts: [['yes', '✅', 'Nhớ rõ từng ngày'], ['no', '❓', 'Không nhớ / Cho con bú / Vô kinh']] },
  { key: 's2', icon: '🔄', q: 'Chu kỳ kinh nguyệt như thế nào?', opts: [['regular', '✅', 'Đều 28 - 30 ngày'], ['long', '⚠️', 'Đều nhưng dài (32 - 35 ngày)'], ['irregular', '🎢', 'KHÔNG ĐỀU (dao động 30-60 ngày)']] },
  { key: 's3', icon: '🔍', q: 'Có yếu tố nhiễu / bẫy đặc biệt nào không?', opts: [['none', '✅', 'Không có gì bất thường'], ['intercourse', '💑', 'Quan hệ duy nhất 1 lần'], ['postinor', '💊', 'Uống Postinor-1 khẩn cấp'], ['bpd', '📐', 'Siêu âm tuần 20 BPD lệch 2 tuần']] }
];
const SAFE = { s0: ['no', 'ivf'], s1: ['yes'], s2: ['regular', 'long'], s3: ['none'] };
const TREE_RESULTS = {
  ivf: { icon: '🧬', html: '<b>THAI IVF — ĐÃ KHẲNG ĐỊNH:</b> Tuổi thai dựa vào ngày chuyển phôi và tuổi phôi (sách: phôi 3 ngày ➜ 2w3d, phôi 5 ngày ➜ 2w5d). Không được thay đổi bằng bất cứ thông tin nào khác.', formula: 'Tuổi thai hôm khám = (Khám − Chuyển phôi) + 17 / + 19', learn: 'L3/2', drill: 'ivf' },
  ivf_fgr: { bad: true, icon: '🚫', html: '<b>BẪY TIÊN ĐỀ TIER 0:</b> Thai IVF chuẩn tuyệt đối 100%. Thai nhỏ là do FGR hoặc Lệch bội, CẤM đổi ngày dự sinh!', trap: 'ivf', drill: 'traps' },
  nolmp: { bad: true, icon: '🚫', html: '<b>BẪY ĐIỂM LIỆT: KHÔNG NHỚ KINH CHÓT!</b> Cấm dùng Naegele. Bắt buộc đo CRL siêu âm 3 tháng đầu!', formula: 'Tuổi thai (ngày) = 42 + CRL (mm)', learn: 'L4/0', drill: 'crl' },
  irregular: { bad: true, icon: '🚫', html: '<b>BẪY ĐIỂM LIỆT: KINH KHÔNG ĐỀU!</b> Ngày rụng trứng bất định. CẤM dùng kinh chót, bắt buộc dùng CRL siêu âm TCN1!', formula: 'Tuổi thai (ngày) = 42 + CRL (mm)', learn: 'L4/0', drill: 'crl' },
  intercourse: { bad: true, icon: '🚫', html: '<b>BẪY: QUAN HỆ 1 LẦN!</b> Sách: ngày giao hợp không hẳn là ngày thụ thai, tinh trùng sống 5 – 7 ngày. CẤM lấy ngày quan hệ làm ngày thụ tinh!', trap: 'intercourse', drill: 'traps' },
  postinor: { bad: true, icon: '🚫', html: '<b>BẪY POSTINOR-1:</b> Hoãn rụng trứng muộn ➔ Kinh chót mất hoàn toàn giá trị, không vội chẩn đoán thai lưu!', trap: 'postinor', drill: 'traps' },
  bpd: { bad: true, icon: '🔒', html: '<b>KHÓA CHẾT TCN1:</b> Đã xác lập ở TCN1 thì KHÓA CHẾT ngày dự sinh, không bao giờ chỉnh lại ở TCN2/TCN3.', trap: 'bpd', drill: 'traps' },
  long: { icon: '✅', html: '<b>ĐỦ ĐIỀU KIỆN HIỆU CHỈNH CHU KỲ DÀI:</b> Naegele chuẩn + Bù ngày chênh lệch (Chu kỳ - 28 ngày).', formula: 'Dự sinh = Naegele + (X − 28) ngày', learn: 'L2/1', drill: 'naegele_cycle' },
  ok: { icon: '✅', html: '<b>ĐỦ ĐIỀU KIỆN ÁP DỤNG NAEGELE:</b> Kinh đều, nhớ rõ kinh chót ➔ Ngày +7, Tháng -3/+9.', formula: 'Ngày +7 • Tháng −3 (T1–3: +9) • Năm +1', learn: 'L1/0', drill: 'naegele_simple' }
};
const wiz = { ans: {}, step: 0 };
function wizOutcome(a) {
  if (a.s0 && a.s0 !== 'no') return a.s0;
  if (a.s1 === 'no') return 'nolmp';
  if (a.s2 === 'irregular') return 'irregular';
  if (a.s3) return a.s3 !== 'none' ? a.s3 : a.s2 === 'long' ? 'long' : 'ok';
  return null;
}
function renderWiz(dir = 1) {
  const out = wizOutcome(wiz.ans), done = WIZ.filter(w => wiz.ans[w.key]);
  $('#wizProg').innerHTML = WIZ.map((_, i) => `<i class="${i < done.length ? 'on' : ''}"></i>`).join('');
  $('#wizTrail').innerHTML = done.map(w => {
    const o = w.opts.find(x => x[0] === wiz.ans[w.key]);
    return `<button class="${SAFE[w.key].includes(o[0]) ? '' : 'red'}" onclick="wizBack(${WIZ.indexOf(w)})" title="Sửa câu này">${o[1]} ${o[2]}</button>`;
  }).join('<span class="muted">›</span>');
  const card = $('#wizCard');
  if (out) {
    const r = TREE_RESULTS[out];
    const learn = r.trap ? `<button class="btn btn-sm btn-sky" onclick="go('traps'); flipTrap('${r.trap}')">📖 Xem thẻ bẫy</button>` : `<a class="btn btn-sm btn-sky" href="#${r.learn}">📖 Học bài này</a>`;
    card.innerHTML = `<div class="wiz-res"><span class="mascot-slot" data-size="130"></span><div>
      <div class="wiz-verdict ${r.bad ? 'bad' : 'good'}"><span class="big-ic">${r.icon}</span>${r.html}</div>
      ${r.formula ? `<p style="margin-top:12px"><span class="formula-chip">🧮 ${r.formula}</span></p>` : ''}
      <div class="row-c" style="justify-content:flex-start;margin-top:14px">${learn}<button class="btn btn-sm btn-butter" onclick="startTopicDrill('${r.drill}')">⚡ Luyện ngay</button><button class="btn btn-sm" onclick="wizBack(0)">🔁 Làm lại</button></div></div></div>`;
    mountMascots(card);
    setTimeout(() => mood($('.mascot-slot', card), r.bad ? 'sad' : 'happy', 2200), 100);
    if (r.bad) sound.playWrong(); else { sound.playCorrect(); launchConfetti(); }
  } else {
    const w = WIZ[wiz.step];
    card.innerHTML = `<div class="wiz-icon">${w.icon}</div><span class="kick">Câu ${wiz.step} / 3</span><h3>${w.q}</h3>${w.sub ? `<p class="sub">${w.sub}</p>` : ''}
      <div class="wiz-opts">${w.opts.map(([v, ic, lab], i) => `<button class="wiz-opt" style="animation-delay:${i * 70}ms" onclick="wizPick('${w.key}','${v}')"><i>${ic}</i>${lab}</button>`).join('')}</div>`;
  }
  anim(card, [{ opacity: 0, transform: `translateX(${dir * 50}px)` }, { opacity: 1, transform: 'none' }], { duration: 380 });
}
function wizPick(key, val) {
  const i = WIZ.findIndex(w => w.key === key);
  wiz.ans[key] = val;
  WIZ.slice(i + 1).forEach(w => delete wiz.ans[w.key]);
  wiz.step = Math.min(i + 1, 3);
  sound.playPop();
  renderWiz(1);
}
function wizBack(i) {
  WIZ.slice(i).forEach(w => delete wiz.ans[w.key]);
  wiz.step = i;
  renderWiz(-1);
}

/* =====================================================================
   BÀI 0 • NỀN TẢNG
   ===================================================================== */
function renderJourney() {
  const stops = [[60, 168, '🩸', 'var(--pink)', 'Ngày đầu kinh chót', 'ngày 1', 0], [320, 128, '🥚', 'var(--butter)', 'Phóng noãn + thụ tinh', '2 tuần', .45], [580, 88, '👶', 'var(--mint)', 'Ngày dự sanh', '280 ngày = 40 tuần', .9]];
  $('#journeySvg').innerHTML = `
    <defs><linearGradient id="jg" x1="0" x2="1"><stop offset="0" stop-color="#ff9fc2"/><stop offset=".5" stop-color="#ffd35c"/><stop offset="1" stop-color="#6fd3a3"/></linearGradient></defs>
    <path id="jPath" d="M60 168 C 160 60, 250 60, 320 128 S 480 205, 580 88" fill="none" stroke="url(#jg)" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 16"/>
    ${stops.map(([x, y, e, c, l, b, d]) => `<g class="j-stop" style="animation-delay:${d}s">
      <text x="${x}" y="${y - 42}" class="j-badge">${b}</text>
      <circle cx="${x}" cy="${y}" r="28" fill="${c}" stroke="#3b2f4a" stroke-width="3"/>
      <text x="${x}" y="${y + 1}" font-size="26" text-anchor="middle" dominant-baseline="central">${e}</text>
      <text x="${x}" y="${y + 48}" class="j-lab">${l}</text></g>`).join('')}
    <g><circle r="11" fill="#ff6fa3" stroke="#3b2f4a" stroke-width="2.5"/><circle cx="-3.5" cy="-2" r="1.8" fill="#3b2f4a"/><circle cx="3.5" cy="-2" r="1.8" fill="#3b2f4a"/>
      <path d="M-3 3 q3 3 6 0" stroke="#3b2f4a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#jPath"/></animateMotion></g>`;
}

const OFF = { x0: 95, cw: 28, n: 21, marks: { 0: ['🩸', 'KC lí thuyết'], 13: ['🥚', 'thụ tinh 2w0d'], 16: ['🧫', 'chuyển N3 2w3d'], 18: ['🧬', 'N5 2w5d'] } };
let offRun = 0;
function renderOffset() {
  const { x0, cw, n, marks } = OFF;
  let h = `<text x="${x0 - 8}" y="39" class="row-l">Ngày (bà C.)</text><text x="${x0 - 8}" y="71" class="row-l">Ngày thứ</text>`;
  h += `<path d="M${x0 + 2} 18 V11 H${x0 + 13 * cw - 2} V18" class="tl-br"/><text x="${x0 + 6.5 * cw}" y="8" class="tl-br-t">07.08 ➜ 20.08: lùi 13 ngày từ ngày thụ tinh</text>`;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * cw, k = marks[i] ? ' key' : '';
    h += `<rect x="${x + 1}" y="22" width="${cw - 2}" height="26" rx="7" class="oc${k}"/><text x="${x + cw / 2}" y="39" class="ot sm">${pad(7 + i)}/08</text>`;
    h += `<rect x="${x + 1}" y="54" width="${cw - 2}" height="26" rx="7" class="oc g${k}"/><text x="${x + cw / 2}" y="71" class="ot">${i + 1}</text>`;
    if (marks[i]) h += `<text x="${x + cw / 2}" y="100" class="om">${marks[i][0]}</text><text x="${x + cw / 2}" y="118" class="omt">${marks[i][1]}</text>`;
  }
  h += `<rect id="offCur" x="${x0 - 1}" y="19" width="${cw + 2}" height="64" rx="9" class="ocur" style="opacity:0"/>`;
  $('#offsetSvg').innerHTML = h;
}
async function playOffset() {
  const id = ++offRun, cur = $('#offCur');
  cur.style.opacity = 1;
  for (let i = 0; i <= 18; i++) {
    if (id !== offRun) return;
    cur.style.transform = `translateX(${i * OFF.cw}px)`;
    sound.playTick();
    if (OFF.marks[i]) { sound.playPop(); await sleep(700); } else await sleep(160);
  }
}

let beads = [];
function renderBeadGrid() {
  const x0 = 24, y0 = 30, c = 16;
  let h = '';
  [[0, 14, 'var(--mint)', 'TCN1 • 3 tháng đầu'], [14, 28, 'var(--butter)', 'TCN2'], [28, 42, 'var(--pink)', 'TCN3']].forEach(([a, b, col, t]) => {
    h += `<rect x="${x0 + a * c + 1}" y="6" width="${(b - a) * c - 2}" height="18" rx="8" fill="${col}" class="band"/><text x="${x0 + (a + b) / 2 * c}" y="19" class="band-t">${t}</text>`;
  });
  h += `<rect x="${x0 + 40 * c}" y="${y0 - 2}" width="${c}" height="${7 * c + 4}" rx="5" class="edd-col"/>`;
  for (let w = 0; w < 42; w++) {
    for (let d = 0; d < 7; d++) h += `<circle cx="${x0 + w * c + 8}" cy="${y0 + d * c + 8}" r="5.5" class="bd"/>`;
    if (w % 2 === 0) h += `<text x="${x0 + w * c + 8}" y="${y0 + 7 * c + 15}" class="wk-n"${w === 40 ? ' style="fill:var(--brand)"' : ''}>${w === 40 ? '40👶' : w}</text>`;
  }
  h += `<g id="bCur" style="transition:transform .2s ease"><rect x="${x0 + 1}" y="${y0 - 3}" width="${c - 2}" height="${7 * c + 6}" rx="5" class="bcur"/></g>`;
  $('#beadSvg').innerHTML = h;
  beads = $$('#beadSvg .bd');
}
function setGa(n) {
  n = Math.max(0, Math.min(294, Math.round(n)));
  $('#gaSlider').value = n;
  const w = Math.floor(n / 7), d = n % 7;
  beads.forEach((b, i) => b.setAttribute('class', 'bd' + (i < n ? (Math.floor(i / 7) === w ? ' cur' : ` t${i < 98 ? 1 : i < 196 ? 2 : 3}`) : '')));
  $('#bCur').style.transform = `translateX(${w * 16}px)`;
  $('#gaDisplay').innerHTML = `${n} ngày = 7 × ${w} + ${d} = <span style="color:var(--ink)">${w} tuần ${d} ngày</span>${n === 280 ? ' 👶' : ''}`;
}
let gaRaf = 0;
function gaTo(target) {
  cancelAnimationFrame(gaRaf);
  sound.playPop();
  if (RM) return setGa(target);
  const from = +$('#gaSlider').value, t0 = performance.now(), ms = 600;
  const f = t => { const p = Math.min(1, (t - t0) / ms); setGa(from + (target - from) * (1 - Math.pow(1 - p, 3))); if (p < 1) gaRaf = requestAnimationFrame(f); };
  gaRaf = requestAnimationFrame(f);
}
const GA_PRESETS = [[1, '🩸 kinh chót = ngày 1'], [14, '🥚 thụ tinh 2w0d'], [17, '🧫 N3 2w3d'], [19, '🧬 N5 2w5d'], [61, '💊 61 ngày 8w5d'], [63, '📏 CRL 21mm'], [280, '👶 40w0d']];
function gaExample() {   // APP chương 1 (bài giảng): kinh chót 01/02/2021, khám 02/04/2021 ➜ 28 + 31 + 2 = 61 ngày = 8w5d
  $('#gaLmp').value = '2021-02-01'; $('#gaExam').value = '2021-04-02'; runGaCalc(true);
}
function runGaCalc(animate) {
  const lmp = parseISO($('#gaLmp').value), exam = parseISO($('#gaExam').value), out = $('#gaCalcOut'), segEl = $('#gaSegments');
  if (!lmp || !exam) return;
  const n = diffDays(lmp, exam) + 1;   // tính cả ngày kinh chót (APP C1)
  if (n < 1) { segEl.innerHTML = ''; out.innerHTML = '⚠️ Ngày khám phải sau kỳ kinh chót.'; return; }
  const segs = gaSegments(lmp, exam);
  segEl.innerHTML = segs.map(s => `<div class="seg-b" style="flex:${Math.max(s.days, 1)} 1 0"><b>T${s.m}</b>${s.label}${s.label.startsWith('(') ? ` = ${s.days}` : ''}</div>`).join('');
  out.innerHTML = `Σ ${segs.map(s => s.days).join(' + ')} = <b>${n} ngày</b> ➜ <b class="hl">${wd(n)}</b> • dự sinh <b>${fmtDate(naegele(lmp).edd)}</b>`;
  if (animate) {
    $$('.seg-b', segEl).forEach((el, i) => anim(el, [{ transform: 'scaleX(0)', opacity: 0 }, { transform: 'scaleX(1)', opacity: 1 }], { duration: 420, delay: i * 150, easing: 'ease-out', fill: 'backwards' }));
    anim(out, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { duration: 350, delay: segs.length * 150, fill: 'backwards' });
    setTimeout(() => sound.playCorrect(), segs.length * 150);
  }
}

/* =====================================================================
   BÀI 1 • NAEGELE: lịch lật số, vòng 12 tháng, máy tính từng bước
   ===================================================================== */
let flipRun = 0;
async function flipNum(tile, text) {
  const num = $('.fd-num', tile);
  if (RM || !num.animate) { num.textContent = text; return; }
  await num.animate([{ transform: 'rotateX(0)' }, { transform: 'rotateX(90deg)' }], { duration: 160, easing: 'ease-in' }).finished;
  num.textContent = text;
  await num.animate([{ transform: 'rotateX(-90deg)' }, { transform: 'rotateX(0)' }], { duration: 240, easing: 'ease-out' }).finished;
}
async function flipDemo() {
  const id = ++flipRun, m = rnd(1, 12), d = rnd(1, 20), n = naegele(new Date(2026, m - 1, d));
  const T = { d: $('#fdD'), m: $('#fdM'), y: $('#fdY') };
  $('.fd-num', T.d).textContent = pad(d); $('.fd-num', T.m).textContent = pad(m); $('.fd-num', T.y).textContent = 2026;
  $$('.fd-op').forEach(o => o.classList.remove('show'));
  $$('.fd-tile, .r3').forEach(x => x.classList.remove('on'));
  $('#fdResult').innerHTML = '';
  await sleep(450);
  for (const [k, op, val] of [['d', '+7', pad(n.raw)], ['m', n.early ? '+9' : '−3', pad(n.m2)], ['y', n.early ? '=' : '+1', String(n.y2)]]) {
    if (id !== flipRun) return;
    $$('.r3').forEach(r => r.classList.toggle('on', r.dataset.k === k));
    $$('.fd-tile').forEach(t => t.classList.toggle('on', t === T[k]));
    const o = $('.fd-op', T[k]); o.textContent = op; o.classList.add('show');
    sound.playPop();
    await flipNum(T[k], val);
    await sleep(520);
  }
  if (id !== flipRun) return;
  $$('.fd-tile, .r3').forEach(x => x.classList.remove('on'));
  $('#fdResult').innerHTML = `🎯 Dự sinh: <span class="hl">${fmtDate(n.edd)}</span> ${n.early ? '<span class="chip-mini">T1–3: +9, năm giữ</span>' : '<span class="chip-mini">T4–12: −3, năm +1</span>'}`;
  popIn($('#fdResult'));
  sound.playCorrect();
}

function drawWheel(svg, start, year) {
  const C = 110, P = (a, r) => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
  let h = '';
  for (let i = 0; i < 12; i++) {
    const a0 = (-90 + i * 30 - 14) * Math.PI / 180, a1 = (-90 + i * 30 + 14) * Math.PI / 180, am = (-90 + i * 30) * Math.PI / 180;
    h += `<path class="seg ${i < 3 ? 'early' : 'late'}${i + 1 === start ? ' start' : ''}" data-m="${i + 1}" d="M${P(a0, 60)} L${P(a0, 102)} A102 102 0 0 1 ${P(a1, 102)} L${P(a1, 60)} A60 60 0 0 0 ${P(a0, 60)} Z"/>`;
    h += `<text class="seg-t" x="${(C + 81 * Math.cos(am)).toFixed(1)}" y="${(C + 81 * Math.sin(am)).toFixed(1)}">T${i + 1}</text>`;
  }
  h += `<path class="back-arc" d=""/>`;
  h += `<g class="ptr" style="transform:rotate(${(start - 1) * 30}deg)"><line x1="110" y1="110" x2="110" y2="62"/><circle cx="110" cy="62" r="5"/></g>`;
  h += `<circle cx="110" cy="110" r="30" class="hub"/><text class="hub-y" x="110" y="106">${year}</text><text class="hub-s" x="110" y="124">năm</text>`;
  svg.innerHTML = h;
  $$('.seg', svg).forEach(s => { s.onclick = () => spinWheel(+s.dataset.m); });
}
function drawBackArc(svg, start) {
  const C = 110, r = 46, a0 = (-90 + (start - 1) * 30) * Math.PI / 180, a1 = a0 - Math.PI / 2;
  const p = a => `${(C + r * Math.cos(a)).toFixed(1)} ${(C + r * Math.sin(a)).toFixed(1)}`;
  $('.back-arc', svg).setAttribute('d', `M${p(a0)} A${r} ${r} 0 0 0 ${p(a1)}`);
}
let wheelRun = 0, wheelSpun = false;
async function spinWheel(m) {
  wheelSpun = true;
  const id = ++wheelRun, svg = $('#bigWheel'), early = m <= 3, m2 = early ? m + 9 : m - 3;
  drawWheel(svg, m, 2026);
  $('#wheelOut').innerHTML = `T${m} ➜ đi tới 9 tháng…`;
  const ptr = $('.ptr', svg), hubY = $('.hub-y', svg);
  for (let k = 1; k <= 9; k++) {
    await sleep(150);
    if (id !== wheelRun) return;
    const mm = (m - 1 + k) % 12 + 1;
    ptr.style.transform = `rotate(${(m - 1 + k) * 30}deg)`;
    $$('.seg', svg).forEach(s => s.classList.toggle('cur', +s.dataset.m === mm && k < 9));
    sound.playTick();
    if (mm === 1) { hubY.textContent = 2027; hubY.classList.add('bump'); }
  }
  $(`.seg[data-m="${m2}"]`, svg).classList.add('end');
  if (!early) drawBackArc(svg, m);
  $('#wheelOut').innerHTML = early
    ? `<b>T${m} + 9 = T${m2}</b><br>chưa qua T12 ➜ <b>năm giữ nguyên</b>`
    : `<b>T${m} + 9 = T${m2} năm sau</b><br>= <b>T${m} − 3</b> & <b>năm +1</b> 🎆`;
  popIn($('#wheelOut'));
  sound.playCorrect();
}

let M1, M2;
function createMachine(root) {
  const slot = (k, lab) => `<div class="slot slot-${k}"><span class="slot-op"></span><span class="slot-lab">${lab}</span><span class="slot-val">--</span></div>`;
  root.innerHTML = `<div class="slots">${slot('d', 'NGÀY')}<span class="slot-sep">/</span>${slot('m', 'THÁNG')}<span class="slot-sep">/</span>${slot('y', 'NĂM')}</div>
    <ol class="steps"><li class="step idle">Bấm ▶ để máy tính nhẩm từng bước</li></ol><div class="result-card" hidden></div>`;
  return { runId: 0, root, val: k => $(`.slot-${k} .slot-val`, root), op: k => $(`.slot-${k} .slot-op`, root), steps: $('.steps', root), result: $('.result-card', root) };
}
function countTo(el, from, to, ms) {
  return new Promise(res => {
    if (!ms || RM) { el.textContent = pad(to); return res(); }
    const t0 = performance.now();
    const f = t => { const p = Math.min(1, (t - t0) / ms); el.textContent = pad(Math.round(from + (to - from) * p)); if (p < 1) requestAnimationFrame(f); else res(); };
    requestAnimationFrame(f);
  });
}
async function runMachine(M, lmp, cycle = 28, fast = false) {
  if (!lmp) return;
  const id = ++M.runId, alive = () => id === M.runId, wait = ms => fast ? Promise.resolve() : sleep(ms);
  const n = naegele(lmp, cycle), nm = n.m2 % 12 + 1;
  const hot = (k, op) => {
    $$('.slot', M.root).forEach(s => s.classList.remove('hot'));
    $(`.slot-${k}`, M.root).classList.add('hot');
    const o = M.op(k); o.textContent = op; o.className = 'slot-op show';
    if (!fast) { popIn(o); sound.playPop(); }
  };
  const step = (icon, html) => {
    const li = document.createElement('li');
    li.className = 'step'; li.innerHTML = `<span class="step-i">${icon}</span><span>${html}</span>`;
    M.steps.appendChild(li); if (!fast) popIn(li);
  };
  M.val('d').textContent = pad(n.d); M.val('m').textContent = pad(n.m); M.val('y').textContent = n.y;
  ['d', 'm', 'y'].forEach(k => { M.op(k).className = 'slot-op'; $(`.slot-${k}`, M.root).classList.remove('hot', 'done'); });
  M.steps.innerHTML = ''; M.result.hidden = true;

  await wait(200); if (!alive()) return;
  hot('d', `+7${n.diff ? (n.diff > 0 ? '+' : '−') + Math.abs(n.diff) : ''}`);
  await countTo(M.val('d'), n.d, n.raw, fast ? 0 : 550);
  step('📆', `<b>Ngày</b> ${n.d} + 7${n.diff ? ` ${n.diff > 0 ? '+' : '−'} ${Math.abs(n.diff)} <i>(chu kỳ ${cycle} − 28)</i>` : ''} = <b>${n.raw}</b>`);
  await wait(550); if (!alive()) return;

  hot('m', n.early ? '+9' : '−3');
  M.val('m').textContent = pad(n.m2); if (!fast) popIn(M.val('m'));
  step('🗓️', n.early ? `<b>Tháng</b> ${n.m} + 9 = <b>${n.m2}</b> <i>(tháng 1–3)</i>` : `<b>Tháng</b> ${n.m} − 3 = <b>${n.m2}</b> <i>(tháng 4–12)</i>`);
  await wait(550); if (!alive()) return;

  hot('y', n.early ? '=' : '+1');
  M.val('y').textContent = n.y2; if (!fast) popIn(M.val('y'));
  step('🎆', n.early ? `<b>Năm</b> giữ nguyên = <b>${n.y2}</b>` : `<b>Năm</b> ${n.y} + 1 = <b>${n.y2}</b>`);
  await wait(550); if (!alive()) return;

  if (n.over) {
    hot('d', `−${n.max}`);
    step('🌊', `<b>Vắt tháng:</b> ${n.raw} > ${n.max} (T${n.m2} có ${n.max} ngày) ➜ ${n.raw} − ${n.max} = <b>${n.raw - n.max}</b>, tháng ➜ <b>${nm}</b>${n.m2 === 12 ? ', năm +1' : ''}`);
    await wait(300); if (!alive()) return;
    M.val('d').textContent = pad(n.edd.getDate()); M.val('m').textContent = pad(n.edd.getMonth() + 1); M.val('y').textContent = n.edd.getFullYear();
    if (!fast) $$('.slot-val', M.root).forEach(v => popIn(v));
  } else step('✅', `<b>Không vắt:</b> ${n.raw} ≤ ${n.max} (T${n.m2} có ${n.max} ngày)`);

  $$('.slot', M.root).forEach(s => { s.classList.remove('hot'); s.classList.add('done'); });
  M.result.innerHTML = `<div class="rc-lab">🎯 NGÀY DỰ SINH</div><div class="rc-date">${fmtDate(n.edd)}</div><div class="rc-sub">${WEEKDAYS[n.edd.getDay()]}${cycle !== 28 ? ` • chu kỳ ${cycle} ngày` : ''}</div>`;
  M.result.hidden = false;
  if (!fast) { popIn(M.result); sound.playCorrect(); }
}
function randomLmp(sel, M) {
  const m = rnd(1, 12), d = new Date(2026, m - 1, rnd(1, dim(2026, m)));
  $(sel).value = toISO(d);
  runMachine(M, d, M === M2 ? +$('#cycleSlider').value : 28);
}

/* =====================================================================
   BÀI 1B • VẮT THÁNG: nắm tay đếm tháng + lịch tràn ô
   ===================================================================== */
const FK = [[110, 83], [190, 83], [270, 83], [350, 83]], FV = [[150, 112], [230, 112], [310, 112]];
const FSEQ = ['K0', 'V0', 'K1', 'V1', 'K2', 'V2', 'K3', 'K0', 'V0', 'K1', 'V1', 'K2'];
let fistRun = 0;
function renderFist() {
  $('#fistSvg').innerHTML = `
    <path class="fist" d="M70 112 A42 42 0 0 1 150 112 A42 42 0 0 1 230 112 A42 42 0 0 1 310 112 A42 42 0 0 1 390 112 L390 192 Q390 230 352 230 L108 230 Q70 230 70 192 Z"/>
    ${FK.map(([x, y]) => `<ellipse class="kshine" cx="${x - 10}" cy="${y + 10}" rx="9" ry="5" transform="rotate(-25 ${x - 10} ${y + 10})"/>`).join('')}
    ${FV.map(([x, y]) => `<line x1="${x}" y1="${y + 4}" x2="${x}" y2="${y + 48}" class="fline"/>`).join('')}
    <path class="thumb" d="M76 182 Q140 150 216 172 Q236 186 216 200 Q150 214 84 204 Z"/>
    <ellipse cx="204" cy="184" rx="9" ry="6" fill="#fff" stroke="#3b2f4a" stroke-width="2" opacity=".85"/>
    <g id="fTag" class="ftag" style="opacity:0;transition:opacity .2s"><rect x="-40" y="-15" width="80" height="28" rx="12"/><text id="fTagT" x="0" y="0">T1 • 31</text></g>
    <g id="fBall" style="transform:translate(110px,67px)"><circle r="13" class="fball"/><text class="fball-t" id="fBallT">1</text></g>`;
  $('#monthStrip').innerHTML = Array.from({ length: 12 }, (_, i) => { const d = dim(2026, i + 1); return `<div class="ms d${d}">T${i + 1}<b>${i === 1 ? '28/29' : d}</b></div>`; }).join('');
}
function hop(el, [x0, y0], [x1, y1], ms) {
  el.style.transform = `translate(${x1}px, ${y1}px)`;
  if (RM || !el.animate) return Promise.resolve();
  const up = Math.min(y0, y1) - (ms > 500 ? 80 : 40);
  return el.animate([{ transform: `translate(${x0}px, ${y0}px)` }, { transform: `translate(${(x0 + x1) / 2}px, ${up}px)`, offset: .5 }, { transform: `translate(${x1}px, ${y1}px)` }],
    { duration: ms, easing: 'ease-in-out' }).finished.catch(() => {});
}
async function playFist() {
  const id = ++fistRun;
  renderFist();
  const ball = $('#fBall'), tag = $('#fTag');
  let prev = null;
  for (let i = 0; i < 12; i++) {
    const key = FSEQ[i], [x, y] = key[0] === 'K' ? FK[+key[1]] : FV[+key[1]], tgt = [x, key[0] === 'K' ? y - 16 : y - 12];
    tag.style.opacity = 0;
    if (prev) await hop(ball, prev, tgt, i === 7 ? 650 : 360); else ball.style.transform = `translate(${tgt[0]}px, ${tgt[1]}px)`;
    if (id !== fistRun) return;
    $('#fBallT').textContent = i + 1;
    $('#fTagT').textContent = `T${i + 1} • ${i === 1 ? '28/29' : dim(2026, i + 1)}`;
    tag.style.transform = `translate(${tgt[0]}px, ${tgt[1] - 34}px)`;
    tag.style.opacity = 1;
    $$('#monthStrip .ms')[i].classList.add('lit');
    sound.playTick();
    await sleep(i === 6 ? 700 : 380);
    if (id !== fistRun) return;
    prev = tgt;
  }
  sound.playCorrect();
}

let ovRun = 0;
function initOverflow() {
  $('#ovMonth').innerHTML = Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}">Tháng ${i + 1}</option>`).join('');
  $('#ovMonth').value = 5;
  ['#ovMonth', '#ovYear'].forEach(s => { $(s).onchange = () => updateOverflow(true); });
  $('#ovDay').oninput = () => updateOverflow(false);
  $('#ovDay').onchange = () => updateOverflow(true);
  updateOverflow(false);
}
function updateOverflow(animate) {
  const m = +$('#ovMonth').value, y = +$('#ovYear').value, sl = $('#ovDay');
  sl.max = dim(y, m);
  if (+sl.value > +sl.max) sl.value = sl.max;
  const d = +sl.value, n = naegele(new Date(y, m - 1, d)), nm = n.m2 % 12 + 1, thr = n.max - 6;
  $('#ovDayVal').textContent = `${pad(d)}/${pad(m)}/${y}`;
  $('#ovText').innerHTML = `${d} + 7 = <b>${n.raw}</b> • tháng dự sinh <b>T${n.m2}</b> có <b>${n.max}</b> ngày ➜ ` +
    (n.over ? `<span class="bad">VẮT</span> ${n.raw} − ${n.max} = <b>${n.raw - n.max}</b>, sang T${nm}` : `<span class="good">không vắt</span>`) +
    ` ➜ <b class="hl">${fmtDate(n.edd)}</b><br><span class="hint">📌 Kinh chót tháng ${m}: từ ngày ${thr} trở đi là vắt (${n.max} − 7 + 1)</span>`;
  const id = ++ovRun;
  renderWalk($('#ovCal'), n, animate ? 45 : 0, () => id === ovRun);
}
async function renderWalk(el, n, delay, alive = () => true) {
  const { d, raw, max, y2, m2 } = n, over = raw > max;
  const nm = m2 % 12 + 1, ny = m2 === 12 ? y2 + 1 : y2;
  const grid = (y, m, count, offset, spill) => {
    const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7;
    let c = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(t => `<span class="cal-dow">${t}</span>`).join('') + '<span class="cal-cell pad"></span>'.repeat(lead);
    for (let i = 1; i <= count; i++) c += `<span class="cal-cell" data-k="${i + offset}">${i}</span>`;
    return `<div class="cal${spill ? ' spill' : ''}"><div class="cal-h">Tháng ${m}/${y} ${spill ? '• tràn sang 🌊' : `• ${max} ngày`}</div><div class="cal-grid">${c}</div></div>`;
  };
  const nextCount = over ? Math.min(dim(ny, nm), Math.max(raw - max + 2, 7)) : 0;
  el.innerHTML = `<div class="cal-pair">${grid(y2, m2, max, 0)}${over ? `<div class="cal-arrow">➜</div>${grid(ny, nm, nextCount, max, true)}` : ''}</div>`;
  const cell = k => $(`.cal-cell[data-k="${k}"]`, el);
  const s = cell(d);
  if (s) s.classList.add('start');
  for (let k = d + 1; k <= raw; k++) {
    if (delay) { await sleep(delay); if (!alive()) return; sound.playTick(); }
    const c = cell(k); if (c) c.classList.add('walk');
  }
  const e = cell(raw);
  if (e) { e.classList.add('end'); popIn(e); }
}

/* =====================================================================
   BÀI 2 • CHU KỲ
   ===================================================================== */
function updateCycleVisualizer(cycleVal) {
  const cycle = +cycleVal, diff = cycle - 28, fol = cycle - 14;
  $('#cycleDisplay').textContent = `${cycle} ngày ${cycle === 28 ? '(Chuẩn)' : (diff > 0 ? `(+${diff}d)` : `(${diff}d)`)}`;
  $('#follicularDisplay').textContent = `${fol} ngày`;
  $('#offsetDisplay').textContent = `${diff >= 0 ? '+' : ''}${diff} ngày`;
  $('#cycleNow').textContent = cycle;
  const x0 = 80, s = 560 / 45, X = d => x0 + d * s;
  let h = `<defs><marker id="arrC" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" fill="#ff6fa3"/></marker></defs>`;
  h += `<text x="${x0 - 10}" y="36" class="row-l">Chuẩn 28</text>`;
  h += `<rect x="${X(0)}" y="24" width="${14 * s}" height="18" rx="8" class="ph fol ghost"/><rect x="${X(14)}" y="24" width="${14 * s}" height="18" rx="8" class="ph lut ghost"/>`;
  h += `<circle cx="${X(14)}" cy="33" r="7" class="ov ghost"/><text x="${X(28) + 8}" y="37" class="lab-l">rụng trứng N14</text>`;
  h += `<line x1="${X(14)}" y1="42" x2="${X(14)}" y2="80" class="guide"/>`;
  h += `<text x="${x0 - 10}" y="100" class="row-l">Thực tế</text>`;
  h += `<rect x="${X(0)}" y="82" width="${fol * s}" height="30" rx="10" class="ph fol"/><text x="${X(fol / 2)}" y="101" class="ph-t">${fol * s > 130 ? `Pha Nang Noãn (${fol}d)` : `Nang noãn ${fol}d`}</text>`;
  h += `<rect x="${X(fol)}" y="82" width="${14 * s}" height="30" rx="10" class="ph lut"/><text x="${X(fol + 7)}" y="101" class="ph-t g">Hoàng Thể (14d cố định)</text>`;
  if (diff) h += `<line x1="${X(14)}" y1="68" x2="${X(fol) + (diff > 0 ? -8 : 8)}" y2="68" class="shift" marker-end="url(#arrC)"/><text x="${X((14 + fol) / 2)}" y="60" class="shift-t">${diff > 0 ? '+' : ''}${diff} ngày</text>`;
  h += `<g class="egg-g"><circle cx="${X(fol)}" cy="97" r="15" class="ov"/><text x="${X(fol)}" y="102" class="egg">🥚</text></g>`;
  h += `<text x="${X(fol)}" y="134" class="ov-t">Rụng Trứng (N${fol})</text>`;
  h += `<circle cx="${X(0)}" cy="97" r="6" class="dot"/><text x="${X(0)}" y="134" class="lab">LMP (N1)</text>`;
  h += `<circle cx="${X(cycle)}" cy="97" r="6" class="dot"/><text x="${X(cycle)}" y="134" class="lab">Kỳ sau (N${cycle})</text>`;
  $('#cycleSvg').innerHTML = h;
}
function setCycleVal(val) {
  $('#cycleSlider').value = val;
  updateCycleVisualizer(val);
  sound.playPop();
}
function restartJitter() {
  const j = $('#jitter');
  j.classList.remove('play'); void j.offsetWidth; j.classList.add('play');
  anim($('.jfix'), [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: 1500, fill: 'backwards' });
  setTimeout(() => sound.playWrong(), RM ? 0 : 900);
}

/* =====================================================================
   BÀI 3 • IVF / IUI
   ===================================================================== */
const ivf = { stage: 'D3', run: 0 };
const art = { type: 'D5' };
const EMB_NAMES = ['Hợp tử (2 tiền nhân) — ngày chọc hút / thụ tinh', '2 tế bào', '4 tế bào', '8 tế bào (Cleavage)', 'Phôi dâu (Morula)', 'Phôi nang (Blastocyst)'];
function embryoCells(day) {
  const ring = (n, R, r, rot = 0) => Array.from({ length: n }, (_, i) => { const a = rot + i * 2 * Math.PI / n; return [R * Math.cos(a), R * Math.sin(a), r]; });
  return [
    [[0, 0, 62]],
    [[-30, 0, 33], [30, 0, 33]],
    [[-25, -24, 27], [25, -24, 27], [-25, 24, 27], [25, 24, 27]],
    [...ring(6, 38, 21, .5), [-11, 0, 19], [11, 0, 19]],
    [...ring(10, 44, 15), ...ring(5, 20, 14, .6), [0, 0, 13]]
  ][day];
}
function drawEmbryo(day) {
  let h = '';
  if (day < 5) {
    h += `<circle cx="100" cy="100" r="86" class="zona"/>`;
    h += embryoCells(day).map(([x, y, r], i) => `<circle cx="${(100 + x).toFixed(1)}" cy="${(100 + y).toFixed(1)}" r="${r}" class="cell${day === 4 ? ' mor' : ''}" style="animation-delay:${i * 45}ms"/>`).join('');
    if (day === 0) h += `<circle cx="86" cy="100" r="9" class="pn"/><circle cx="114" cy="100" r="9" class="pn"/>`;
  } else {
    h += `<circle cx="100" cy="100" r="93" class="zona thin"/><circle cx="100" cy="100" r="76" class="cavity"/>`;
    for (let i = 0; i < 22; i++) {
      const a = i * 2 * Math.PI / 22, x = 100 + 76 * Math.cos(a), y = 100 + 76 * Math.sin(a);
      h += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="10" ry="5" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" class="cell te" style="animation-delay:${i * 25}ms"/>`;
    }
    [[0, -56], [-13, -48], [13, -48], [-7, -37], [7, -37], [-20, -58], [20, -58]].forEach(([x, y], i) => {
      h += `<circle cx="${100 + x}" cy="${100 + y}" r="10" class="cell icm" style="animation-delay:${500 + i * 50}ms"/>`;
    });
    h += `<text x="100" y="86" class="emb-t">ICM (khối tế bào trong)</text><text x="100" y="128" class="emb-t">Khoang phôi nang</text>`;
  }
  $('#embryoSvg').innerHTML = h;
  $$('#dayChips button').forEach((b, i) => b.classList.toggle('on', i === day));
  $('#embryoLabel').innerHTML = `<b>N${day}</b> • ${EMB_NAMES[day]}<br>Tuổi thai: 14 + ${day} = <b class="hl">${14 + day} ngày</b> (${wds(14 + day)})`;
}
async function playEmbryoAll() {
  const id = ++ivf.run;
  for (let d = 0; d <= 5; d++) {
    if (id !== ivf.run) return;
    drawEmbryo(d); sound.playPop();
    await sleep(850);
  }
  if (id === ivf.run) sound.playCorrect();
}
function renderIvf() {
  const x = ivf.stage === 'D3' ? 3 : 5, ga = 14 + x;
  $('#ivfAgeDisplay').textContent = `Phôi N${x} ➜ ${ga} ngày (${wds(ga)})`;
  $('#ivfM2v').textContent = `Kinh chót lý thuyết = chuyển phôi − ${13 + x}`;
  $('#ivfM3v').textContent = 'Sách: thụ tinh = 2 tuần ➜ + tuổi phôi';
  const X = k => 40 + (k - 1) * 30;          // k = ngày thứ k (kinh chót lý thuyết = ngày 1)
  let h = `<line x1="${X(1)}" y1="62" x2="${X(22)}" y2="62" class="tl-track"/>`;
  for (let k = 1; k <= 22; k++) {
    h += `<line x1="${X(k)}" y1="${k % 7 ? 58 : 53}" x2="${X(k)}" y2="${k % 7 ? 66 : 71}" class="tl-tick"/>`;
    if (k % 7 === 0) h += `<text x="${X(k)}" y="84" class="tl-wk">${k / 7}w0d</text>`;
  }
  h += `<path d="M${X(1)} 24 V16 H${X(14)} V24" class="tl-br"/><text x="${(X(1) + X(14)) / 2}" y="12" class="tl-br-t">lùi 13 ngày từ thụ tinh ➔ kinh cuối lí thuyết</text>`;
  h += `<path d="M${X(14)} 24 V16 H${X(ga)} V24" class="tl-br" style="stroke:var(--blue)"/><text x="${(X(14) + X(ga)) / 2}" y="12" class="tl-br-t" style="fill:var(--blue)">+${x} tuổi phôi</text>`;
  const pt = (k, emoji, fill, r, top, bot, anchor = 'middle', topCls = '') =>
    `<circle cx="${X(k)}" cy="62" r="${r}" fill="${fill}" class="tl-pt"/><text x="${X(k)}" y="62" class="tl-e">${emoji}</text>` +
    (top ? `<text x="${X(k)}" y="${62 - r - 7}" class="tl-top ${topCls}">${top}</text>` : '') +
    `<text x="${anchor === 'start' ? X(k) - 12 : X(k)}" y="104" class="tl-bot" text-anchor="${anchor}">${bot}</text>`;
  h += pt(1, '🩸', 'var(--pink)', 12, 'ngày thứ 1', 'Kinh cuối lí thuyết', 'start');
  h += pt(14, '🧫', 'var(--peach)', 12, 'thụ tinh = 2w0d', 'Phóng noãn / Thụ tinh');
  ['D3', 'D5'].forEach(st => {
    const dx = st === 'D3' ? 3 : 5, sel = st === ivf.stage;
    h += sel ? pt(14 + dx, dx === 3 ? '🥚' : '🧬', 'var(--sky)', 16, `${ga} ngày (${wds(ga)})`, `Chuyển Phôi N${dx}`, 'middle', 'tl-sel')
      : pt(14 + dx, '', '#eee', 8, '', `N${dx}`);
  });
  $('#ivfSvg').innerHTML = h;
}
function setIvfStage(stage) {
  ivf.stage = stage;
  $('#ivfBtnD3').classList.toggle('active', stage === 'D3');
  $('#ivfBtnD5').classList.toggle('active', stage === 'D5');
  renderIvf(); sound.playPop();
}
function setArtType(t) {
  art.type = t;
  $$('#artType button').forEach(b => b.classList.toggle('active', b.dataset.t === t));
  runIvfCalc();
}
const stepsHTML = arr => `<ol class="calc-steps">${arr.map((s, i) => `<li style="--i:${i}">${s}</li>`).join('')}</ol>`;
function ivfExample() {   // APP chương 1: phôi 5 ngày chuyển 08/08, hôm nay 17/09 ➜ 8w3d
  $('#ivfTransfer').value = '2026-08-08'; $('#ivfExam').value = '2026-09-17'; setArtType('D5'); sound.playPop();
}
function runIvfCalc() {
  const t = art.type, d0 = parseISO($('#ivfTransfer').value), ex = parseISO($('#ivfExam').value);
  const ov = t === 'IUI', x = ov ? 0 : t === 'D3' ? 3 : 5, plus = 14 + x;
  $('#artDateLab').firstChild.textContent = ov ? 'Ngày phóng noãn' : 'Ngày chuyển phôi';
  $('#artFormula').innerHTML = ov
    ? 'Ngày phóng noãn = mốc <b>2 tuần</b> ➜ tuổi thai = (Khám − Phóng noãn) + <b>14</b> <span class="muted">(tạm tính)</span>'
    : `Phôi ${x} ngày ➜ ngày chuyển = <b>${wds(plus)}</b> ➜ tuổi thai = (Khám − Chuyển phôi) + <b>${plus}</b>`;
  if (!d0 || !ex) return;
  const fert = addDays(d0, -x), dd = diffDays(d0, ex), ga = dd + plus, lmp = addDays(fert, -13);
  $('#ivfCalcOut').innerHTML = stepsHTML([
    ov ? `🥚 Phóng noãn ${fmtDate(fert)} = <b>2 tuần</b>` : `🧫 Thụ tinh = ${fmtDate(d0)} − ${x} = <b>${fmtDate(fert)}</b> (2 tuần) ➜ ngày chuyển = <b>${wds(plus)}</b>`,
    ga >= 0 ? `➕ (${fmtDate(ex)} − ${fmtDate(d0)}) + ${plus} = ${dd} + ${plus} = <b>${ga} ngày</b> = <b class="hl">${wd(ga)}</b>` : '⚠️ Ngày khám đang trước kinh cuối lí thuyết',
    `🩸 Kinh chót lí thuyết = ${fmtDate(fert)} − 13 = <b>${fmtDate(lmp)}</b> <span class="muted">(thụ tinh là ngày 14)</span>`,
    `🎯 Dự sinh = Naegele(kinh chót lí thuyết ${fmtDate(lmp)}) = <b>${fmtDate(naegele(lmp).edd)}</b>${ov ? '' : ' 🔒 bất biến'}`
  ]);
}

/* =====================================================================
   BÀI 4 • CRL: siêu âm, tư thế đo, cân LMP–CRL, khóa chết
   ===================================================================== */
function buildUS() {
  const fanR = 220, a = 55 * Math.PI / 180, fx = fanR * Math.sin(a), fy = 10 + fanR * Math.cos(a);
  const fan = `M180 10 L${(180 - fx).toFixed(1)} ${fy.toFixed(1)} A${fanR} ${fanR} 0 0 0 ${(180 + fx).toFixed(1)} ${fy.toFixed(1)} Z`;
  let ticks = '';
  for (let i = 0; i < 11; i++) ticks += `<line x1="352" y1="${20 + i * 21}" x2="${i % 2 ? 347 : 342}" y2="${20 + i * 21}" stroke="#aaa" stroke-width="1"/>`;
  $('#usSvg').innerHTML = `
    <defs>
      <clipPath id="fanClip"><path d="${fan}"/></clipPath>
      <radialGradient id="fanGrad" cx="50%" cy="0%" r="100%"><stop offset="0" stop-color="#4a4a4a"/><stop offset=".7" stop-color="#262626"/><stop offset="1" stop-color="#141414"/></radialGradient>
      <filter id="speckle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  1.3 0 0 0 -.45"/></filter>
      <filter id="usBlur"><feGaussianBlur stdDeviation="1.1"/></filter>
    </defs>
    <rect width="360" height="240" fill="#050505"/>
    <g clip-path="url(#fanClip)">
      <rect width="360" height="240" fill="url(#fanGrad)"/>
      <rect width="360" height="240" filter="url(#speckle)" opacity=".5"/>
      <ellipse id="usSac" cx="180" cy="128" rx="60" ry="40" fill="#030303" stroke="#b5b5b5" stroke-width="6" stroke-opacity=".75" filter="url(#usBlur)"/>
      <g id="usFetusT">
        <g filter="url(#usBlur)">
          <circle cx="8" cy="24" r="24" fill="#d6d6d6"/>
          <path d="M-10 36 C-24 58 -20 86 0 100 C14 106 30 96 30 80 C30 64 34 50 26 40 Z" fill="#cfcfcf"/>
          <ellipse cx="32" cy="60" rx="9" ry="4" transform="rotate(30 32 60)" fill="#c4c4c4"/>
          <ellipse cx="28" cy="92" rx="9" ry="4" transform="rotate(-20 28 92)" fill="#c4c4c4"/>
        </g>
        <circle id="usHeart" cx="16" cy="60" r="3" class="us-heart"/>
      </g>
      <line class="us-scan" x1="180" y1="10" x2="180" y2="240"/>
    </g>
    <line id="usCal" stroke="#ffe066" stroke-width="1.5" stroke-dasharray="3 3"/>
    <path id="usCalA" stroke="#ffe066" stroke-width="1.8" fill="none"/><path id="usCalB" stroke="#ffe066" stroke-width="1.8" fill="none"/>
    ${ticks}
    <text x="10" y="20" class="us-t">SanCalc US • OB</text>
    <text x="10" y="37" class="us-t y" id="usCrl"></text>
    <text x="10" y="53" class="us-t y" id="usGa"></text>
    <text x="10" y="232" class="us-t" id="usZone"></text>
    <text x="338" y="232" class="us-t" text-anchor="end">42 + CRL</text>`;
}
function updateUS(crl, w, d) {
  const L = crl * 1.8, s = L / 100, cx = 180, cy = 128;
  const rx = Math.max(36, L / 2 + 26 + crl * .15), ry = Math.max(26, rx * .66);
  $('#usSac').setAttribute('rx', rx.toFixed(1)); $('#usSac').setAttribute('ry', ry.toFixed(1));
  $('#usFetusT').setAttribute('transform', `translate(${(cx - L / 2).toFixed(1)} ${cy}) scale(${s.toFixed(3)}) rotate(-90)`);
  $('#usHeart').setAttribute('r', (2.3 / s).toFixed(2));
  const ax = cx - L / 2, ay = cy - 8 * s, bx = cx + L / 2 + s, by = cy - 2 * s;
  const c = $('#usCal');
  c.setAttribute('x1', ax.toFixed(1)); c.setAttribute('y1', ay.toFixed(1)); c.setAttribute('x2', bx.toFixed(1)); c.setAttribute('y2', by.toFixed(1));
  const plus = (x, y) => `M${(x - 5).toFixed(1)} ${y.toFixed(1)}h10M${x.toFixed(1)} ${(y - 5).toFixed(1)}v10`;
  $('#usCalA').setAttribute('d', plus(ax, ay)); $('#usCalB').setAttribute('d', plus(bx, by));
  $('#usCrl').textContent = `CRL  ${crl}.0 mm`;
  $('#usGa').textContent = `GA   ${w}w${d}d`;
  $('#usZone').textContent = crl <= 30 ? 'Vùng 10–30mm: 42+CRL ✓' : 'Vùng 30–84mm: lý tưởng';
}
function renderMiniBeads(el, n) {
  const w = Math.floor(n / 7), d = n % 7;
  let h = '';
  for (let i = 0; i < w; i++) h += `<span class="wk" style="animation-delay:${i * 30}ms">${'<i></i>'.repeat(7)}</span>`;
  h += `<span class="wk part" style="animation-delay:${w * 30}ms">${'<i></i>'.repeat(d)}${'<i class="e"></i>'.repeat(7 - d)}</span>`;
  el.innerHTML = `<div class="mb-row">${h}</div>`;
}
function updateCrlVisualizer(crlVal) {
  const crl = +crlVal, total = 42 + crl, w = Math.floor(total / 7), d = total % 7;
  $('#crlDisplay').textContent = `CRL ${crl} mm`;
  $('#crlFormulaDisplay').textContent = `42 + ${crl} = ${total} ngày`;
  $('#crlGaDisplay').innerHTML = `${total} = 7 × ${w} + ${d} ➜ <b class="hl">${w} tuần ${d} ngày</b>`;
  $('#crlNow').textContent = crl;
  const z = $('#crlZone');
  z.className = `zone ${crl <= 30 ? 'ok' : 'best'}`;
  z.innerHTML = crl <= 30 ? '✅ 10 – 30 mm: tạm tính nhanh 42 + CRL (thai 6 đến dưới 10 tuần)' : '🌟 30 – 84 mm: lí tưởng (10w0d – 13w6d) — tra cơ sở dữ liệu FMF, không dùng 42 + CRL';
  updateUS(crl, w, d);
  renderMiniBeads($('#crlBeads'), total);
}
function runCrlCalc() {
  const crl = +$('#crlSlider').value, scan = parseISO($('#crlScan').value);
  if (!scan) return;
  const ga = 42 + crl, lmp = addDays(scan, -(ga - 1));   // ngày SA là ngày thứ ga (tính cả ngày KC)
  $('#crlCalcOut').innerHTML = stepsHTML([
    `📏 CRL ${crl} mm ➜ tuổi thai lúc siêu âm = 42 + ${crl} = <b>${ga} ngày</b> (${wds(ga)})`,
    `🩸 Đếm ngược ${ga} ngày từ ${fmtDate(scan)} ➜ kinh cuối lí thuyết = <b>${fmtDate(lmp)}</b> <span class="muted">(cách sách tính ở bà A.)</span>`,
    `🎯 Dự sinh (Naegele): <b class="hl">${fmtDate(naegele(lmp).edd)}</b> ➜ 🔒 khóa chết từ đây`
  ]);
}
function crlExample() {   // sách [5], bà A.: 23.08.2020 siêu âm 10 tuần 0/7 (= 42 + 28) ➜ kinh cuối lí thuyết 15.06.2020
  $('#crlScan').value = '2020-08-23'; setCrl(28); sound.playPop();
}
function setCrl(v) {
  $('#crlSlider').value = v;
  updateCrlVisualizer(v); runCrlCalc();
}

const posture = { kind: 'neutral' };
const P_ROT = { flex: -30, neutral: 0, ext: 30 };
const P_TXT = { flex: '🙇 Gập quá mức (hay gặp 6 – 9 tuần) ➜ đo thành <b class="bad">chiều dài cổ – mông</b>', neutral: '😊 Tư thế trung tính ➜ CRL <b class="good">chuẩn</b>', ext: '🙆 Không trung tính ➜ sai số tăng <b class="bad">từ 5 lên 7 ngày</b>' };
function renderPosture() {
  $('#postureSvg').innerHTML = `
    <ellipse cx="210" cy="118" rx="200" ry="98" fill="#eaf5ff" stroke="#9fc3ea" stroke-width="3" stroke-dasharray="8 6"/>
    <path class="p-skin" d="M168 92 C 225 64, 322 74, 342 128 C 350 158, 324 172, 298 166 C 258 158, 216 150, 174 132 Z"/>
    <ellipse class="p-skin" cx="226" cy="156" rx="14" ry="7" transform="rotate(20 226 156)"/>
    <ellipse class="p-skin" cx="300" cy="170" rx="15" ry="7" transform="rotate(-10 300 170)"/>
    <g class="p-head" id="pHead">
      <circle class="p-skin" cx="123" cy="127" r="46"/>
      <circle cx="109" cy="141" r="4" fill="#3b2f4a"/>
      <ellipse cx="119" cy="153" rx="6" ry="3.5" fill="#ff9dbd" opacity=".7"/>
    </g>
    <line class="p-cal" id="pCal"/>
    <path class="p-plus" id="pA"/><path class="p-plus" id="pB"/>
    <text x="210" y="210" class="b-t" id="pLen"></text>`;
}
function crownOf(kind) {
  const phi = (160 + P_ROT[kind]) * Math.PI / 180;
  return [170 + 96 * Math.cos(phi), 110 + 96 * Math.sin(phi)];
}
function setPosture(kind) {
  posture.kind = kind;
  $$('#postureSw button').forEach(b => b.classList.toggle('active', b.dataset.p === kind));
  $('#pHead').style.transform = `rotate(${P_ROT[kind]}deg)`;
  const R = [338, 142], [cx, cy] = crownOf(kind), [nx, ny] = crownOf('neutral');
  const len = Math.hypot(R[0] - cx, R[1] - cy), len0 = Math.hypot(R[0] - nx, R[1] - ny);
  setTimeout(() => {
    const c = $('#pCal');
    c.setAttribute('x1', cx.toFixed(1)); c.setAttribute('y1', cy.toFixed(1)); c.setAttribute('x2', R[0]); c.setAttribute('y2', R[1]);
    const plus = (x, y) => `M${(x - 6).toFixed(1)} ${y.toFixed(1)}h12M${x.toFixed(1)} ${(y - 6).toFixed(1)}v12`;
    $('#pA').setAttribute('d', plus(cx, cy)); $('#pB').setAttribute('d', plus(R[0], R[1]));
    $('#pLen').textContent = `thước đo: ${len < len0 - 1 ? 'ngắn hơn ⬇' : len > len0 + 1 ? 'dài hơn ⬆' : 'chuẩn ✓'}`;
  }, RM ? 0 : 300);
  $('#postureOut').innerHTML = P_TXT[kind];
  sound.playPop();
}

const bal = { early: true };
function renderBalance() {
  const pan = (x, e, t) => `<line x1="${x}" y1="70" x2="${x - 30}" y2="140" class="b-str"/><line x1="${x}" y1="70" x2="${x + 30}" y2="140" class="b-str"/>
    <path d="M${x - 40} 140 Q${x} 176 ${x + 40} 140 Z" class="b-pan-s"/><text x="${x}" y="126" class="b-e">${e}</text><text x="${x}" y="194" class="b-t">${t}</text>`;
  $('#balanceSvg').innerHTML = `
    <path d="M160 222 L260 222 L232 204 L188 204 Z" class="b-wood"/>
    <rect x="204" y="72" width="12" height="134" rx="5" class="b-wood"/>
    <g class="b-beam" id="bBeam"><rect x="70" y="64" width="280" height="12" rx="6" class="b-wood"/><circle cx="210" cy="70" r="9" class="b-wood"/></g>
    <g class="b-pan" id="bPanL">${pan(80, '🩸', 'Kinh chót')}</g>
    <g class="b-pan" id="bPanR">${pan(340, '📏', 'Siêu âm CRL')}</g>`;
}
function updateBalance() {
  const diff = +$('#balDiff').value, thr = bal.early ? 5 : 7, change = diff > thr, tilt = change ? 10 : -10;
  $('#bBeam').style.transform = `rotate(${tilt}deg)`;
  const dy = 130 * Math.sin(tilt * Math.PI / 180);
  $('#bPanL').style.transform = `translateY(${-dy}px)`;
  $('#bPanR').style.transform = `translateY(${dy}px)`;
  $('#balDiffRead').textContent = `Lệch ${diff} ngày`;
  const v = $('#balVerdict');
  v.className = `verdict ${change ? 'change' : 'keep'}`;
  v.innerHTML = change ? `${diff} > ${thr} ➜ 📏 tính theo SIÊU ÂM` : `${diff} ≤ ${thr} ➜ 🩸 GIỮ kinh cuối`;
}
function setBalGroup(g) {
  bal.early = g === 'early';
  $$('#balGroup button').forEach(b => b.classList.toggle('active', b.dataset.g === g));
  updateBalance(); sound.playPop();
}

/* =====================================================================
   QUIZ cuối mỗi bài
   ===================================================================== */
function newQuiz(el) {
  const q = makeQuestion(pick(el.dataset.topic.split(',')));
  let done = false;
  el.innerHTML = `
    <div class="qz-card"><span class="mascot-slot" data-size="64"></span><div>
      <span class="qz-tag">${q.categoryTag}</span>
      <div class="qz-date">${q.dateStr}</div><div class="qz-cond">${q.condition}</div><div class="qz-target">${q.target}</div></div></div>
    <div class="qz-opts">${q.options.map((o, i) => `<button class="opt-btn${o.includes('🚫') ? ' is-trap-btn' : ''}" data-i="${i}"><span class="opt-text">${o}</span></button>`).join('')}</div>
    <div class="qz-fb"></div>
    <div class="row-c"><button class="btn btn-sm btn-sky" data-act="new">🎲 Câu khác</button><button class="btn btn-sm btn-butter" data-act="drill">⚡ Luyện tiếp</button></div>`;
  mountMascots(el);
  $$('.opt-btn', el).forEach(b => {
    b.onclick = () => {
      if (done) return;
      done = true;
      const ok = q.options[+b.dataset.i] === q.correct;
      $$('.opt-btn', el).forEach(x => { x.disabled = true; if (q.options[+x.dataset.i] === q.correct) x.classList.add('correct'); });
      if (!ok) b.classList.add('wrong');
      recordAnswer(q, ok);
      mood($('.mascot-slot', el), ok ? 'happy' : 'sad', 1800);
      $('.qz-fb', el).innerHTML = (ok ? '✅ <b>Chuẩn luôn!</b> ' : '⚠️ <b>Chưa đúng nha.</b> ') + q.hack;
      if (ok) { sound.playCorrect(); launchConfetti(); } else sound.playWrong();
    };
  });
  $('[data-act="new"]', el).onclick = () => { newQuiz(el); popIn($('.qz-card', el)); };
  $('[data-act="drill"]', el).onclick = () => startTopicDrill(q.type);
}

/* =====================================================================
   HOOK khi mở slide
   ===================================================================== */
const SLIDE_ENTER = {
  'L0-0': renderJourney,
  'L0-1': playOffset,
  'L1-0': flipDemo,
  'L1-1': () => { if (!wheelSpun) spinWheel(5); },
  'L1B-0': playFist,
  'L1B-1': () => updateOverflow(true),
  'L2-2': restartJitter,
  'L3-0': playEmbryoAll,
  'L4-2': updateBalance
};

/* =====================================================================
   BẪY (thẻ lật)
   ===================================================================== */
const TRAPS = [
  { id: 'nolmp', icon: '🤱', stamp: 'CẤM NAEGELE', title: 'Kinh cuối không tin cậy',
    q: 'Quên ngày kinh / chỉ nhớ mơ hồ • cho con bú • vô kinh • dùng hormone gần đây',
    rule: 'Sách: quên hoặc mơ hồ, chu kỳ không phóng noãn, dùng hormone trong chu kỳ có thai, lần hành kinh cuối "khác lạ" ➔ <b>không dùng trực tiếp kinh cuối</b> ➔ tìm kinh cuối lí thuyết (siêu âm).' },
  { id: 'irregular', icon: '🎢', stamp: 'CẤM NAEGELE', title: 'Kinh nguyệt không đều (30 - 60 ngày)',
    q: 'Kinh chót 18/04, chu kỳ lúc 30 lúc 60 ngày',
    rule: 'Ngày rụng trứng bất định ➔ <b>CẤM dùng Naegele</b>, bắt buộc dựa vào siêu âm TCN1 (CRL).' },
  { id: 'intercourse', icon: '💑', stamp: 'KHÔNG TÍNH ĐƯỢC', title: 'Quan hệ duy nhất 1 lần (chồng về thăm)',
    q: 'Chồng về thăm, quan hệ đúng 1 lần rồi đi. Lấy ngày đó làm mốc?',
    rule: 'Sách: ngày giao hợp không hẳn là ngày thụ thai — tinh trùng sống <b>5 – 7 ngày</b> ➔ <b>CẤM lấy ngày quan hệ làm ngày thụ tinh</b>!' },
  { id: 'postinor', icon: '💊', stamp: 'CHƯA KẾT LUẬN LƯU', title: 'Uống viên khẩn cấp Postinor-1',
    q: 'Uống Postinor-1 sau quan hệ • siêu âm thấy phôi nhỏ hơn tuổi thai theo kinh chót',
    rule: 'Sách: dùng steroid sinh dục ngoại sinh trong chu kỳ có thai ➔ không dùng trực tiếp kinh cuối. Hoãn rụng trứng muộn ➔ <b>kinh chót mất độ tin cậy</b>, không được vội chẩn đoán thai lưu.' },
  { id: 'ivf', icon: '🧬', stamp: 'CẤM ĐỔI', title: 'Thai IVF siêu âm tuần 12 thấy thai nhỏ',
    q: 'IVF chuyển phôi ngày 5, siêu âm tuần 12 CRL nhỏ hơn 8 ngày',
    rule: 'Sách: tuổi thai IVF đã khẳng định, <b>không được thay đổi</b>. Mâu thuẫn ➔ kết luận <b>thai phát triển bất thường</b> (FGR hoặc lệch bội), không hiệu chỉnh tuổi thai.' },
  { id: 'bpd', icon: '🔒', stamp: 'KHÓA CHẾT', title: 'Siêu âm tuần 20 đo BPD nhỏ hơn 2 tuần',
    q: 'Tuổi thai đã khẳng định ở 3 tháng đầu • tuần 20: BPD nhỏ hơn 2 tuần',
    rule: 'Sách: hoàn tất định tuổi thai trước hết TCN1 — <b>kể từ đây không được thay đổi</b>, không chỉnh theo TCN2 / TCN3.' }
];
function renderTraps() {
  $('#trapGrid').innerHTML = TRAPS.map((t, i) => `
    <div class="flip" data-id="${t.id}" tabindex="0" role="button" aria-label="Thẻ bẫy ${i + 1}: ${t.title}" style="animation-delay:${i * 60}ms">
      <div class="flip-inner">
        <div class="flip-face front"><span class="trap-no">${i + 1}</span><div class="trap-icon">${t.icon}</div><div class="trap-q">${t.q}</div><span class="flip-hint">🤔 Tính được không? • chạm để lật</span></div>
        <div class="flip-face fback"><span class="stamp small">${t.stamp}</span><div class="trap-title">${t.icon} ${t.title}</div><div class="trap-rule">${t.rule}</div></div>
      </div>
    </div>`).join('');
  $$('.flip').forEach(f => {
    f.onclick = () => flipCard(f);
    f.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipCard(f); } };
  });
}
function flipCard(f, force) { f.classList.toggle('flipped', force ?? !f.classList.contains('flipped')); sound.playPop(); }
function flipAll() {
  const cards = $$('.flip'), open = cards.some(c => !c.classList.contains('flipped'));
  cards.forEach((c, i) => setTimeout(() => c.classList.toggle('flipped', open), i * 90));
  sound.playPop();
}
function flipTrap(id) {
  setTimeout(() => {
    const f = $(`.flip[data-id="${id}"]`);
    if (!f) return;
    f.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
    flipCard(f, true);
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  }, 350);
}

/* =====================================================================
   ĐẤU TRƯỜNG — BỘ SINH CÂU HỎI
   ===================================================================== */
function optionsOf(correct, distract, edd) {
  const set = new Set([correct]);
  distract.forEach(x => { if (set.size < 4) set.add(x); });
  for (let k = 2; set.size < 4; k++) set.add(fmtDate(addDays(edd, 7 * k)));
  return shuffle([...set]);
}
function dateQ(o) {
  const eddStr = fmtDate(o.n.edd);
  return {
    type: o.type, categoryTag: o.categoryTag, label: 'KỲ KINH CHÓT (LMP)', dateStr: fmtDate(o.lmp), condition: o.condition,
    target: '👉 NGÀY DỰ SINH (EDD)? 👈', expectedType: 'date',
    expDay: pad(o.n.edd.getDate()), expMonth: pad(o.n.edd.getMonth() + 1), expYear: String(o.n.edd.getFullYear()),
    correct: eddStr, options: optionsOf(eddStr, o.distract, o.n.edd), hack: o.hack, steps: naegeleSteps(o.n), replay: o.replay
  };
}
function trapQ(o) {
  return { type: 'traps', expectedType: 'trap', options: shuffle([o.correct, ...o.wrong]), replay: { trap: o.trapId }, ...o };
}
function genSimpleNaegele() {
  const year = 2026, month = rnd(1, 12), day = rnd(1, 20);
  const lmp = new Date(year, month - 1, day), n = naegele(lmp), eddStr = fmtDate(n.edd);
  const yearSlip = fmtDate(new Date(n.early ? year + 1 : year, n.m2 - 1, n.raw)); // lỗi hay gặp: nhầm năm
  return dateQ({
    type: 'naegele_simple', categoryTag: 'BÀI 1: NAEGELE CƠ BẢN', lmp, n, condition: 'Chu kỳ kinh đều 28 ngày',
    distract: [yearSlip, fmtDate(addDays(n.edd, -7)), fmtDate(addDays(n.edd, 7))],
    hack: `💡 <b>Nhìn 1 giây:</b> Ngày ${day} + 7 = <b>${day + 7}</b> | Tháng ${month <= 3 ? `${month} + 9 = ${month + 9}` : `${month} - 3 = ${month - 3}`} | Năm ${month <= 3 ? year : year + 1} → <b>${eddStr}</b>`,
    replay: { lesson: 'L1', slide: 2, lmp }
  });
}
function genOverflowNaegele() {
  const year = 2026, month = rnd(1, 12), day = dim(year, month) - rnd(0, 5);
  const lmp = new Date(year, month - 1, day), n = naegele(lmp), eddStr = fmtDate(n.edd);
  const t = addDays(lmp, 7), tm = t.getMonth() + 1;   // lỗi hay gặp: trừ số ngày của tháng kinh chót
  const slip = fmtDate(new Date(tm <= 3 ? t.getFullYear() : t.getFullYear() + 1, (tm <= 3 ? tm + 9 : tm - 3) - 1, t.getDate()));
  return dateQ({
    type: 'naegele_overflow', categoryTag: 'BÀI 1B: VẮT CUỐI THÁNG', lmp, n, condition: 'Chu kỳ đều 28 ngày • ⚠️ cuối tháng: coi chừng vắt!',
    distract: [slip, fmtDate(addDays(n.edd, 7)), '🚫 KHÔNG TÍNH ĐƯỢC', fmtDate(addDays(n.edd, -7))],
    hack: n.over
      ? `💡 <b>Nhẩm vắt tháng:</b> Ngày ${day} + 7 = ${n.raw}. Tháng dự sinh ${n.m2} chỉ có ${n.max} ngày → ${n.raw} − ${n.max} = <b>${n.raw - n.max}</b>, tháng tự tăng thêm 1 → <b>${eddStr}</b>!`
      : `💡 <b>Không vắt:</b> Ngày ${day} + 7 = ${n.raw} ≤ ${n.max} (tháng dự sinh ${n.m2} có ${n.max} ngày) → <b>${eddStr}</b>!`,
    replay: { lesson: 'L1B', slide: 1, lmp }
  });
}
function genCycleNaegele() {
  const year = 2026, cycle = Math.random() > .5 ? 35 : 32, diff = cycle - 28, month = rnd(1, 9), day = rnd(1, 18);
  const lmp = new Date(year, month - 1, day), n = naegele(lmp, cycle), eddStr = fmtDate(n.edd);
  return dateQ({
    type: 'naegele_cycle', categoryTag: `BÀI 2: CHU KỲ DÀI ${cycle} NGÀY`, lmp, n,
    condition: `Chu kỳ kinh đều ${cycle} ngày (dài hơn chuẩn ${diff} ngày)`,
    distract: [fmtDate(naegele(lmp).edd), fmtDate(addDays(n.edd, -7)), fmtDate(addDays(n.edd, 14))],
    hack: `💡 <b>Nhẩm chu kỳ ${cycle} ngày:</b> Rụng trứng trễ hơn ${diff} ngày → Lấy Naegele chuẩn (+7 ngày) <b>CỘNG THÊM ${diff} NGÀY</b> → <b>${eddStr}</b>!`,
    replay: { lesson: 'L2', slide: 1, lmp, cycle }
  });
}
function genCrlQuick() {
  const crl = pick([10, 12, 14, 16, 18, 21, 24, 28]), total = 42 + crl, w = Math.floor(total / 7), d = total % 7, ans = `${w} tuần ${d} ngày`;
  return {
    type: 'crl', categoryTag: 'BÀI 4: CRL 10 - 30 mm', label: 'CHIỀU DÀI ĐẦU MÔNG (CRL)', dateStr: `${crl} mm`,
    condition: 'Công thức Thầy Luân & Bá Duy: 42 + CRL (ngày)', target: '👉 TUỔI THAI TƯƠNG ỨNG? 👈',
    expectedType: 'text', expTotal: total, correct: ans,
    options: shuffle([ans, `${w} tuần ${(d + 2) % 7} ngày`, `${w - 1} tuần ${d} ngày`, `${w + 1} tuần ${(d + 5) % 7} ngày`]),
    hack: `💡 <b>Nhẩm trong 1 giây:</b> 42 + ${crl} = <b>${total} ngày</b> → 7 × ${w} + ${d} = <b>${ans}</b>!`,
    steps: [`📏 42 + ${crl} = <b>${total}</b> ngày`, `➗ ${total} = 7 × ${w} + ${d}`, `🎯 <b>${ans}</b>`],
    replay: { lesson: 'L4', slide: 0, crl }
  };
}
function genLmpVsCrl() {
  const early = Math.random() < .5, crl = early ? rnd(10, 20) : rnd(21, 30), thr = early ? 5 : 7;
  const gaUS = 42 + crl, delta = rnd(0, 12) * (Math.random() < .5 ? -1 : 1), gaLMP = gaUS + delta;
  const scan = new Date(2026, rnd(1, 10), rnd(1, 28)), lmp = addDays(scan, -(gaLMP - 1)), change = Math.abs(delta) > thr;
  const A = '🩸 Giữ tuổi thai theo kinh cuối', B = '📏 Tính tuổi thai theo siêu âm';
  return {
    type: 'lmpcrl', categoryTag: 'BÀI 4: KINH CUỐI HAY SIÊU ÂM?', label: 'KINH CHÓT TIN CẬY • SIÊU ÂM', dateStr: `${fmtDate(lmp)} • SA ${fmtDate(scan)}`,
    condition: `Ngày siêu âm đo CRL = ${crl} mm`, target: '👉 DỰ SINH CHÍNH THỨC THEO? 👈', expectedType: 'choice', correct: change ? B : A, options: [A, B],
    hack: `💡 Theo kinh chót (tính cả ngày kinh chót): <b>${gaLMP} ngày</b> (${wds(gaLMP)}) • theo CRL: 42 + ${crl} = <b>${gaUS} ngày</b> (${wds(gaUS)}) ➜ lệch <b>${Math.abs(delta)} ngày</b>. ${early ? 'SA trước 9w0d: ngưỡng 5 ngày' : 'SA 9w0d – 13w6d: ngưỡng 7 ngày'} (sách) ➜ <b>${change ? 'ĐỔI theo siêu âm' : 'GIỮ kinh chót'}</b>.`,
    steps: [`🩸 LMP: ${gaLMP} ngày`, `📏 CRL: ${gaUS} ngày`, `↔️ lệch ${Math.abs(delta)} ${change ? '>' : '≤'} ${thr}`, `🎯 <b>${change ? 'Đổi theo SA' : 'Giữ LMP'}</b>`],
    replay: { lesson: 'L4', slide: 2, early, diff: Math.min(Math.abs(delta), 14) }
  };
}
function genIvfTransferAge() {
  const isD5 = Math.random() > .5, x = isD5 ? 5 : 3, days = 14 + x;
  const typeStr = isD5 ? 'Phôi Ngày 5 (Blastocyst)' : 'Phôi Ngày 3 (Cleavage)';
  const f = n => `${n} ngày (${Math.floor(n / 7)} tuần ${n % 7} ngày)`, ans = f(days);
  return {
    type: 'ivf', categoryTag: 'BÀI 3: IVF • TUỔI THAI NGÀY CHUYỂN PHÔI',
    label: `CHUYỂN ${typeStr.toUpperCase()}`, dateStr: 'Ngày Chuyển Phôi',
    condition: 'Sách: vừa phóng noãn + thụ tinh = 2 tuần',
    target: '👉 TUỔI THAI TẠI NGÀY CHUYỂN PHÔI? 👈', expectedType: 'text', expTotal: days, correct: ans,
    options: shuffle([ans, f(days - 1), f(14), f(21)]),
    hack: `💡 Sách: thụ tinh = 2 tuần → phôi ${x} ngày tuổi = <b>${wds(days)} (${days} ngày)</b>. VD bà C.: phôi 3 ngày chuyển 23.08 ↔ thụ tinh 20.08 → 2w3d. (${days - 1} là số ngày lùi về kinh cuối lí thuyết, không phải tuổi thai!)`,
    steps: [`🧫 Thụ tinh = 2 tuần`, `➕ Phôi ${x} ngày: 14 + ${x} = <b>${days}</b> ngày`, `🎯 <b>${wd(days)}</b>`],
    replay: { lesson: 'L3', slide: 1, stage: isD5 ? 'D5' : 'D3' }
  };
}
function genIvfExam() {
  const isD5 = Math.random() > .5, x = isD5 ? 5 : 3, base = 14 + x, d0 = new Date(2026, rnd(0, 10), rnd(1, 28)), dd = rnd(10, 60), ex = addDays(d0, dd), ga = dd + base;
  return {
    type: 'ivf', categoryTag: `BÀI 3: IVF • PHÔI N${x} ➔ HÔM KHÁM`, label: 'NGÀY CHUYỂN PHÔI ➔ NGÀY KHÁM', dateStr: `${fmtDate(d0)} ➔ ${fmtDate(ex)}`,
    condition: `Chuyển phôi ngày ${x}`, target: '👉 TUỔI THAI HÔM KHÁM? 👈',
    expectedType: 'text', expTotal: ga, correct: wd(ga), options: shuffle([wd(ga), wd(ga - 1), wd(ga + 1), wd(ga + 7)]),
    hack: `💡 (Khám − Chuyển phôi) + ${base} = ${dd} + ${base} = <b>${ga} ngày</b> = <b>${wd(ga)}</b> <i>(APP C1: thụ tinh = chuyển − ${x}, đếm cả ngày thụ tinh rồi + 13 — VD 08/08 ➜ 17/09 = 8w3d)</i>`,
    steps: [`📆 ${fmtDate(ex)} − ${fmtDate(d0)} = <b>${dd}</b> ngày`, `➕ ${dd} + ${base} = <b>${ga}</b>`, `🎯 <b>${wd(ga)}</b>`],
    replay: { lesson: 'L3', slide: 2, t: isD5 ? 'D5' : 'D3', d0, ex }
  };
}
function genIui() {   // sách [5]: có thai nhờ canh ngày phóng noãn ➜ ngày phóng noãn = mốc 2 tuần (tạm tính)
  const d0 = new Date(2026, rnd(0, 10), rnd(1, 28)), dd = rnd(14, 70), ex = addDays(d0, dd), ga = dd + 14;
  return {
    type: 'ivf', categoryTag: 'BÀI 3: CANH PHÓNG NOÃN', label: 'NGÀY PHÓNG NOÃN ➔ NGÀY KHÁM', dateStr: `${fmtDate(d0)} ➔ ${fmtDate(ex)}`,
    condition: 'Có thai nhờ canh ngày phóng noãn (± bơm tinh trùng)', target: '👉 TUỔI THAI TẠM TÍNH HÔM KHÁM? 👈',
    expectedType: 'text', expTotal: ga, correct: wd(ga), options: shuffle([wd(ga), wd(ga - 1), wd(dd + 16), wd(dd)]),
    hack: `💡 <b>Sách:</b> ngày phóng noãn là mốc <b>2 tuần</b> ➜ (Khám − Phóng noãn) + 14 = ${dd} + 14 = <b>${ga} ngày</b> = <b>${wd(ga)}</b> (tạm tính, vẫn cần siêu âm kiểm chứng)`,
    steps: [`📆 ${fmtDate(ex)} − ${fmtDate(d0)} = <b>${dd}</b>`, `➕ ${dd} + 14 = <b>${ga}</b>`, `🎯 <b>${wd(ga)}</b>`],
    replay: { lesson: 'L3', slide: 2, t: 'IUI', d0, ex }
  };
}
function genGaToday() {
  const lmp = new Date(2026, rnd(0, 9), rnd(1, 28)), n = rnd(42, 260), exam = addDays(lmp, n - 1), segs = gaSegments(lmp, exam);
  return {
    type: 'ga', categoryTag: 'BÀI 0: TUỔI THAI HÔM KHÁM', label: 'KINH CHÓT ➔ NGÀY KHÁM', dateStr: `${fmtDate(lmp)} ➔ ${fmtDate(exam)}`,
    condition: 'Chu kỳ đều 28 ngày • kinh chót tin cậy', target: '👉 TUỔI THAI HÔM KHÁM? 👈',
    expectedType: 'text', expTotal: n, correct: wd(n), options: shuffle([wd(n), wd(n - 1), wd(n - 7), wd(n + 7)]),
    hack: `💡 <b>Đếm theo tháng, tính cả ngày kinh chót:</b> ${segs.map(s => s.label).join(' + ')} = <b>${n} ngày</b> = 7 × ${Math.floor(n / 7)} + ${n % 7} → <b>${wd(n)}</b>`,
    steps: [...segs.map(s => `T${s.m}: ${s.label}`), `Σ = <b>${n}</b> ngày`, `🎯 <b>${wd(n)}</b>`],
    replay: { lesson: 'L0', slide: 3, lmp, exam }
  };
}
function genTrapIrregular() {
  const lmp = new Date(2026, rnd(0, 11), rnd(1, 28)), naive = naegele(lmp).edd;
  return trapQ({
    trapId: 'irregular', categoryTag: 'BÀI 5: 🚨 BẪY ĐIỂM LIỆT', label: 'KỲ KINH CHÓT (LMP)', dateStr: fmtDate(lmp),
    condition: 'Chu kỳ kinh KHÔNG ĐỀU (dao động 30 - 60 ngày)', target: '👉 TÍNH NGÀY DỰ SINH (EDD)? 👈',
    correct: '🚫 KHÔNG TÍNH ĐƯỢC BẰNG KINH CHÓT (Phải né!)',
    wrong: [fmtDate(naive), fmtDate(addDays(naive, 7)), fmtDate(addDays(naive, -7))],
    hack: `🚨 <b>BẪY NÉ:</b> Kinh không đều thì ngày rụng trứng bất định → <b>TUYỆT ĐỐI KHÔNG DÙNG NAEGELE</b>! Bắt buộc dựa vào siêu âm 3 tháng đầu (CRL)!`,
    steps: ['🎢 Chu kỳ 30–60 ngày', '🥚 Rụng trứng bất định', '📏 Siêu âm CRL TCN1']
  });
}
function genTrapIntercourse() {
  return trapQ({
    trapId: 'intercourse', categoryTag: 'BÀI 5: 🚨 BẪY THẦY VINH', label: 'NGÀY QUAN HỆ DUY NHẤT', dateStr: '14 / 02 / 2026',
    condition: 'Chồng công tác về quan hệ đúng 1 lần rồi đi', target: '👉 LẤY LÀM MỐC TÍNH TUỔI THAI ĐƯỢC KHÔNG? 👈',
    correct: '🚫 KHÔNG ĐƯỢC! Phải biết ngày rụng trứng',
    wrong: ['Được, lấy 14/02 làm ngày thụ tinh (+14 ngày)', 'Được, lấy 14/02 làm ngày kinh chót lý thuyết', 'Được, lấy 14/02 thai được 2 tuần tuổi'],
    hack: `🚨 <b>BẪY NÉ (sách):</b> ngày giao hợp không hẳn là ngày thụ thai — tinh trùng sống và giữ khả năng thụ tinh <b>5 – 7 ngày</b> trong đường sinh dục nữ ➜ <b>KHÔNG lấy ngày quan hệ làm ngày thụ tinh</b>!`,
    steps: ['💑 Quan hệ 1 lần', '🐟 Tinh trùng sống 5–7 ngày', '🥚 Ngày thụ tinh = ?']
  });
}
function genTrapPostinor() {
  return trapQ({
    trapId: 'postinor', categoryTag: 'BÀI 5: 🚨 BẪY LÂM SÀNG', label: 'KỲ KINH CHÓT (LMP)', dateStr: '01 / 02 / 2026',
    condition: 'Uống Postinor-1 sau quan hệ ngày 14 • SA 02/04: CRL 2 mm, chưa tim thai', target: '👉 KINH CHÓT CÓ DÙNG ĐƯỢC KHÔNG? 👈',
    correct: '🚫 MẤT ĐỘ TIN CẬY (Hoãn rụng trứng muộn)',
    wrong: ['Dùng bình thường theo công thức Naegele', 'Kết luận thai lưu vì lệch gần 3 tuần', 'Chỉ cần cộng thêm 3 ngày'],
    hack: `🚨 <b>BẪY NÉ:</b> Sách: người có dùng steroid sinh dục ngoại sinh trong chu kì có thai ➜ không dùng trực tiếp ngày kinh cuối. Postinor-1 làm hoãn phóng noãn muộn → <b>kinh chót mất giá trị</b>, không được vội chẩn đoán thai lưu!`,
    steps: ['💊 Postinor-1', '⏸️ Hoãn rụng trứng', '📅 Kinh chót mất giá trị', '🔎 Chưa kết luận thai lưu']
  });
}
function genTrapIvfRecall() {
  return trapQ({
    trapId: 'ivf', categoryTag: 'BÀI 5: 🚨 TIÊN ĐỀ TIER 0', label: 'THAI KỲ IVF CHUYỂN PHÔI NGÀY 5', dateStr: 'Siêu âm tuần 12 thấy CRL nhỏ hơn 8 ngày',
    condition: 'Bác sĩ có được đổi ngày dự sinh theo siêu âm không?', target: '👉 XỬ TRÍ NGÀY DỰ SINH? 👈',
    correct: '🚫 TUYỆT ĐỐI CẤM ĐỔI! Chuẩn IVF là bất biến',
    wrong: ['Đổi theo siêu âm CRL vì lệch > 7 ngày', 'Lấy trung bình cộng giữa 2 ngày', 'Đợi siêu âm tuần 20 BPD rồi mới đổi'],
    hack: `🚨 <b>BẪY NÉ (sách):</b> Thai IVF đã được khẳng định tuổi thai, không được thay đổi bằng thông tin khác. Mâu thuẫn ➜ <b>kết luận thai phát triển bất thường</b> (FGR hoặc lệch bội), không hiệu chỉnh tuổi thai!`,
    steps: ['🧬 Mốc IVF = 100%', '📏 Thai nhỏ', '🔎 Nghĩ FGR / lệch bội']
  });
}
function genTrapNoLmp() {
  return trapQ({
    trapId: 'nolmp', categoryTag: 'BÀI 5: 🚨 BẪY ĐIỂM LIỆT', label: 'KỲ KINH CHÓT (LMP)', dateStr: 'Không tin cậy',
    condition: pick(['Đang cho con bú, chưa có kinh lại', 'Vô kinh nhiều tháng', 'Chỉ nhớ "khoảng đầu tháng"', 'Mới ngưng thuốc tránh thai nội tiết 1 tháng']), target: '👉 TÍNH NGÀY DỰ SINH (EDD)? 👈',
    correct: '🚫 KHÔNG DÙNG NAEGELE ➔ Siêu âm CRL 3 tháng đầu',
    wrong: ['Lấy ngày 01 của tháng đó rồi +7', 'Lấy ngày 15 của tháng đó (trung bình)', 'Lấy ngày quan hệ gần nhất rồi +14'],
    hack: `🚨 <b>BẪY NÉ:</b> Kinh cuối không tin cậy (quên / mơ hồ / không phóng noãn / dùng tránh thai nội tiết trong vòng 2 tháng) → <b>Cấm dùng Naegele</b>. Tìm kinh cuối lí thuyết bằng siêu âm 3 tháng đầu!`,
    steps: ['📅 Kinh chót ❓', '🚫 Naegele', '📏 CRL TCN1']
  });
}
function genTrapBpd() {
  return trapQ({
    trapId: 'bpd', categoryTag: 'BÀI 5: 🚨 KHÓA CHẾT TCN1', label: 'SIÊU ÂM TUẦN 20', dateStr: 'BPD nhỏ hơn 2 tuần',
    condition: 'Dự sinh đã xác lập bằng CRL 3 tháng đầu', target: '👉 CÓ CHỈNH LẠI NGÀY DỰ SINH? 👈',
    correct: '🚫 KHÔNG! Khóa chết dự sinh TCN1',
    wrong: ['Chỉnh lùi 2 tuần theo BPD', 'Lấy trung bình BPD và CRL', 'Chỉnh nếu FL cũng nhỏ'],
    hack: `🚨 <b>BẪY NÉ (sách):</b> Tuổi thai đã khẳng định trước hết TCN1 thì <b>kể từ đó không được thay đổi</b> — không chỉnh theo BPD, FL, AC ở TCN2/TCN3.`,
    steps: ['📏 CRL TCN1 🔒', '📐 BPD TCN2 lệch', '✖ Không chỉnh']
  });
}
const GENS = [
  { type: 'naegele_simple', fn: genSimpleNaegele },
  { type: 'naegele_overflow', fn: genOverflowNaegele },
  { type: 'naegele_cycle', fn: genCycleNaegele },
  { type: 'ivf', fn: genIvfTransferAge },
  { type: 'ivf', fn: genIvfExam },
  { type: 'ivf', fn: genIui },
  { type: 'crl', fn: genCrlQuick },
  { type: 'lmpcrl', fn: genLmpVsCrl },
  { type: 'ga', fn: genGaToday },
  { type: 'traps', fn: genTrapIrregular },
  { type: 'traps', fn: genTrapIntercourse },
  { type: 'traps', fn: genTrapPostinor },
  { type: 'traps', fn: genTrapIvfRecall },
  { type: 'traps', fn: genTrapNoLmp },
  { type: 'traps', fn: genTrapBpd }
];
const TOPIC_NAMES = { naegele_simple: 'Naegele cơ bản', naegele_overflow: 'Vắt cuối tháng', naegele_cycle: 'Chu kỳ dài', ivf: 'IVF / phóng noãn', crl: 'CRL 42+CRL', lmpcrl: 'Kinh cuối hay siêu âm', ga: 'Tuổi thai hôm khám', traps: 'Bẫy điểm liệt' };
function makeQuestion(topic) {
  const t = topic === 'all' ? pick(Object.keys(TOPIC_NAMES)) : topic;   // "Tất cả": chia đều theo bài
  const pool = GENS.filter(g => g.type === t);
  return pick(pool.length ? pool : GENS).fn();
}
// "9w0d", "9 tuần 0 ngày", "9+0", "63", "63 ngày", "16 ngày (2w2d)" ➔ tổng số ngày
function parseGA(raw) {
  const s = raw.toLowerCase().trim();
  let m;
  if ((m = s.match(/^(\d+)\s*(ngày|ngay|d)/))) return +m[1];
  if ((m = s.match(/(\d+)\s*(?:tuần|tuan|w|t|\+|\s)\s*(\d+)/))) return +m[1] * 7 + +m[2];
  if ((m = s.match(/(\d+)\s*(tuần|tuan|w|t)/))) return +m[1] * 7;
  return (m = s.match(/\d+/)) ? +m[0] : null;
}

/* =====================================================================
   ĐẤU TRƯỜNG — ĐIỀU KHIỂN
   ===================================================================== */
const inpD = $('#inpDay'), inpM = $('#inpMonth'), inpY = $('#inpYear'), inpT = $('#inpTextVal');
let qTimerId = 0;
function setTopic(top) {
  state.topic = top;
  $$('#topicRow .pill').forEach(p => p.classList.toggle('active', p.dataset.topic === top));
  sound.playPop();
  nextQuestion();
}
function setInputMode(mode) {
  state.inputMode = mode;
  $('#btnModeType').classList.toggle('active', mode === 'type');
  $('#btnModeChoice').classList.toggle('active', mode === 'choice');
  layoutAnswer();
  if (mode === 'type') focusFirstInput();
  sound.playPop();
}
function layoutAnswer() {
  const q = state.currentQ;
  if (!q) return;
  const useChoice = state.inputMode === 'choice' || q.expectedType === 'choice';
  $('#typeInputContainer').style.display = useChoice ? 'none' : 'block';
  $('#choiceContainer').style.display = useChoice ? 'block' : 'none';
  $('#helperTip').innerHTML = useChoice
    ? '💡 Bấm phím <b>1 – 4</b> hoặc chạm nhanh • <b>Space</b> sang câu kế'
    : '💡 Gõ 2 số ngày sẽ tự nhảy sang tháng • <b>Enter</b> kiểm tra • <b>N</b> khi gặp bẫy';
}
function focusFirstInput() {
  const q = state.currentQ;
  if (!q || route.page !== 'drill' || state.inputMode !== 'type' || q.expectedType === 'choice') return;
  (q.expectedType === 'text' ? inpT : inpD).focus({ preventScroll: true });
}
function startQTimer() {
  clearInterval(qTimerId);
  const el = $('#qTimer');
  qTimerId = setInterval(() => {
    if (state.answered) return clearInterval(qTimerId);
    el.textContent = `⏱ ${((performance.now() - state.qStart) / 1000).toFixed(1)}s`;
  }, 100);
}
function nextQuestion() {
  state.answered = false;
  hideSheet();
  [inpD, inpM, inpY, inpT].forEach(i => { i.value = ''; i.classList.remove('correct', 'wrong'); });
  const q = state.currentQ = makeQuestion(state.topic);
  $('#flashCategory').textContent = q.categoryTag;
  $('#flashLabel').textContent = q.label;
  $('#flashDate').textContent = q.dateStr;
  $('#flashDate').classList.toggle('long', q.dateStr.length > 14);
  $('#flashCondition').textContent = q.condition;
  $('#flashTarget').innerHTML = q.target;
  anim($('#flashcardBox'), [{ transform: 'scale(.95) rotate(-.8deg)', opacity: .6 }, { transform: 'none', opacity: 1 }], { duration: 300 });
  if (q.expectedType === 'text') {
    $('#typeDateRow').style.display = 'none';
    $('#typeTextRow').style.display = 'block';
    inpT.placeholder = q.type === 'ga' ? 'VD: 15w2d • 15 tuần 2 ngày • 107' : q.type === 'ivf' ? 'VD: 19 ngày • 2w5d • 8 tuần 3 ngày' : 'VD: 9w0d • 9 tuần 0 ngày • 63 ngày';
  } else {
    $('#typeDateRow').style.display = 'flex';
    $('#typeTextRow').style.display = 'none';
    if (q.expYear && state.autoYear) inpY.value = q.expYear;
  }
  const grid = $('#optionsGrid');
  grid.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = `opt-btn${opt.includes('🚫') ? ' is-trap-btn' : ''}`;
    btn.dataset.val = opt;
    btn.innerHTML = `<span class="opt-key">${idx + 1}</span><span class="opt-text">${opt}</span>`;
    btn.onclick = () => selectOption(opt, btn);
    grid.appendChild(btn);
  });
  layoutAnswer();
  $('#qTimer').textContent = '⏱ 0.0s';
  state.qStart = performance.now();
  startQTimer();
  setTimeout(focusFirstInput, 50);
}
inpD.addEventListener('input', () => { if (inpD.value.length >= 2) inpM.focus(); });
inpM.addEventListener('input', () => { if (inpM.value.length >= 2 && !inpY.value) inpY.focus(); });
[inpD, inpM, inpY, inpT].forEach(el => el.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); submitTypedAnswer(); }
  else if (e.key.toLowerCase() === 'n' && (el !== inpT || !inpT.value)) { e.preventDefault(); submitTrapAnswer(); }
  else if (el !== inpT && el !== inpY && ['/', '.', '-', ' '].includes(e.key) && !state.answered) { e.preventDefault(); (el === inpD ? inpM : inpY).focus(); }
}));
function submitTypedAnswer() {
  if (state.answered) return;
  const q = state.currentQ;
  if (q.expectedType === 'trap') return handleAnswerResult(false, '❌ ĐÂY LÀ BẪY! Tình huống này KHÔNG TÍNH ĐƯỢC bằng công thức!');
  if (q.expectedType === 'choice') return;
  if (q.expectedType === 'text') {
    const v = parseGA(inpT.value);
    if (v === null) return inpT.focus();
    const ok = v === q.expTotal;
    inpT.classList.add(ok ? 'correct' : 'wrong');
    return handleAnswerResult(ok, ok ? '⚡ CHÍNH XÁC NHANH NHƯ CHỚP!' : `❌ Đáp án: ${q.correct}`);
  }
  if (!inpD.value.trim() || !inpM.value.trim()) return inpD.focus();
  const userY = inpY.value.trim();
  if (!userY && !state.autoYear) return inpY.focus();
  const okD = inpD.value.trim().padStart(2, '0') === q.expDay, okM = inpM.value.trim().padStart(2, '0') === q.expMonth, okY = !userY || userY === q.expYear;
  [[inpD, okD], [inpM, okM], [inpY, okY]].forEach(([el, ok]) => el.classList.add(ok ? 'correct' : 'wrong'));
  const ok = okD && okM && okY;
  handleAnswerResult(ok, ok ? '⚡ CHÍNH XÁC NHANH NHƯ CHỚP!' : `❌ Đáp án: ${q.correct}`);
}
function submitTrapAnswer() {
  if (state.answered) return;
  const ok = state.currentQ.expectedType === 'trap';
  handleAnswerResult(ok, ok ? '🎯 BẮT TRÚNG BẪY! RẤT TỈNH TÁO!' : '❌ BẪY SAI! Tình huống này VẪN TÍNH ĐƯỢC bình thường!');
}
function selectOption(selectedOpt, btnEl) {
  if (state.answered) return;
  const q = state.currentQ, ok = selectedOpt === q.correct, btns = $$('#optionsGrid .opt-btn');
  btns.forEach(b => { b.disabled = true; });
  btnEl.classList.add(ok ? 'correct' : 'wrong');
  if (!ok) btns.forEach(b => { if (b.dataset.val === q.correct) b.classList.add('correct'); });
  handleAnswerResult(ok, ok ? '⚡ CHÍNH XÁC NHANH NHƯ CHỚP!' : '❌ CHƯA CHÍNH XÁC!');
}
function handleAnswerResult(isCorrect, title) {
  state.answered = true;
  clearInterval(qTimerId);
  const q = state.currentQ, sec = (performance.now() - state.qStart) / 1000;
  recordAnswer(q, isCorrect);
  if (state.blitz) { state.blitz.total++; if (isCorrect) state.blitz.ok++; }
  $('#qTimer').textContent = `⏱ ${sec.toFixed(1)}s`;
  const ms = $('#drillMascot');
  if (isCorrect) {
    sound.playCorrect();
    state.streak++; state.score++; state.times.push(sec);
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    if (state.streak >= 10 && state.streak % 5 === 0) { sound.playFanfare(); launchConfetti(); }
    if (state.streak >= 3) { $('#streakFire').classList.add('active'); $('#flashcardBox').classList.add('on-fire'); }
    mood(ms, 'happy', 900);
    showToast(`✅ Chuẩn! ⏱ ${sec.toFixed(1)}s${state.streak >= 3 ? ` • 🔥${state.streak}` : ''}`);
    setTimeout(() => { if (state.answered && route.page === 'drill' && state.currentQ === q) nextQuestion(); }, 380);  // Flow mode
  } else {
    sound.playWrong();
    state.streak = 0;
    $('#streakFire').classList.remove('active');
    $('#flashcardBox').classList.remove('on-fire');
    anim($('#flashcardBox'), [{ transform: 'translateX(0)' }, { transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' }], { duration: 360, easing: 'ease-in-out' });
    mood(ms, 'sad', 2200);
    showSheet(title, q);
    if (state.blitz) setTimeout(() => { if (state.answered && state.currentQ === q && state.blitz) nextQuestion(); }, 1600);
  }
  saveStats(); updateStats();
}
function showSheet(title, q) {
  $('#sheetCard').className = 'sheet-card wrong';
  $('#fbTitle').innerHTML = `⚠️ ${title}`;
  $('#fbHack').innerHTML = q.hack;
  $('#fbSteps').innerHTML = (q.steps || []).map((s, i) =>
    `${i ? `<span class="fb-arrow" style="animation-delay:${i * 120 - 60}ms">➜</span>` : ''}<span class="fb-step" style="animation-delay:${i * 120}ms">${s}</span>`).join('');
  $('#fbReplay').hidden = !q.replay;
  $('#sheet').hidden = false;
}
function hideSheet() { $('#sheet').hidden = true; }
let toastT = 0;
function showToast(html) {
  const t = $('#toast');
  t.innerHTML = html; t.hidden = false;
  t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => { t.hidden = true; }, 950);
}
function updateStats() {
  $('#statStreak').textContent = state.streak;
  $('#statScore').textContent = state.score;
  $('#statBest').textContent = state.bestStreak;
  $('#statAvg').textContent = state.times.length ? `${(state.times.reduce((a, b) => a + b, 0) / state.times.length).toFixed(1)}s` : '–';
}
// "🎬 Xem hoạt ảnh giải": mở đúng slide, nạp số liệu câu hỏi rồi chạy
const REPLAY = {
  'L0-3': r => { $('#gaLmp').value = toISO(r.lmp); $('#gaExam').value = toISO(r.exam); runGaCalc(true); },
  'L1-2': r => { $('#nLmp').value = toISO(r.lmp); runMachine(M1, r.lmp, 28); },
  'L1B-1': r => { $('#ovYear').value = r.lmp.getFullYear(); $('#ovMonth').value = r.lmp.getMonth() + 1; $('#ovDay').value = r.lmp.getDate(); updateOverflow(true); },
  'L2-1': r => { setCycleVal(r.cycle); $('#cLmp').value = toISO(r.lmp); runMachine(M2, r.lmp, r.cycle); },
  'L3-1': r => setIvfStage(r.stage),
  'L3-2': r => { $('#ivfTransfer').value = toISO(r.d0); $('#ivfExam').value = toISO(r.ex); setArtType(r.t); },
  'L4-0': r => setCrl(r.crl),
  'L4-2': r => { $('#balDiff').value = r.diff; setBalGroup(r.early ? 'early' : 'late'); }
};
function replayQ(q) {
  const r = q && q.replay;
  if (!r) return;
  hideSheet();
  if (r.trap) { go('traps'); flipTrap(r.trap); return; }
  go(`${r.lesson}/${r.slide}`);
  setTimeout(() => { const f = REPLAY[`${r.lesson}-${r.slide}`]; if (f) f(r); }, 450);
}

/* ---------------- Blitz 60 giây ---------------- */
let blitzRaf = 0;
function toggleBlitz() { if (state.blitz) endBlitz(true); else startBlitz(); }
function startBlitz() {
  $('#blitzModal').hidden = true;
  if (route.page !== 'drill') go('drill');
  state.blitz = { end: performance.now() + 60000, ok: 0, total: 0 };
  state.streak = 0; updateStats();
  $('#blitzWrap').hidden = false;
  $('#blitzBtn').textContent = '⏹ Dừng Blitz';
  sound.playFanfare();
  nextQuestion();
  const tick = () => {
    if (!state.blitz) return;
    const left = state.blitz.end - performance.now();
    $('#blitzFill').style.width = `${Math.max(0, left / 600)}%`;
    $('#blitzLeft').textContent = `${Math.ceil(Math.max(0, left) / 1000)}s • ✅ ${state.blitz.ok}`;
    if (left <= 0) return endBlitz(false);
    blitzRaf = requestAnimationFrame(tick);
  };
  blitzRaf = requestAnimationFrame(tick);
}
function endBlitz(aborted) {
  cancelAnimationFrame(blitzRaf);
  const b = state.blitz;
  state.blitz = null;
  $('#blitzWrap').hidden = true;
  $('#blitzBtn').textContent = '⏱ Blitz 60s';
  if (aborted || !b) return;
  state.answered = true;
  clearInterval(qTimerId);
  hideSheet();
  const rec = b.ok > state.bestBlitz, acc = b.total ? Math.round(b.ok / b.total * 100) : 0;
  if (rec) { state.bestBlitz = b.ok; store.set('san_best_blitz', b.ok); launchConfetti(); sound.playFanfare(); }
  $('#blitzResult').innerHTML = `<div class="br-big">${b.ok}</div><div>câu đúng / 60 giây • ${b.total} câu • chính xác ${acc}%</div>` +
    (rec ? '<div style="font-size:1.2rem;margin-top:6px">🏆 KỶ LỤC MỚI!</div>' : `<div>Kỷ lục: <b>${state.bestBlitz}</b></div>`);
  $('#blitzModal').hidden = false;
}

/* =====================================================================
   KỶ LỤC
   ===================================================================== */
const ACHIEVEMENTS = [
  { icon: '🔥', name: 'Khởi động', desc: 'Streak 5', ok: s => s.bestStreak >= 5 },
  { icon: '🔥🔥', name: 'Nóng tay', desc: 'Streak 10', ok: s => s.bestStreak >= 10 },
  { icon: '☄️', name: 'Thần tốc', desc: 'Streak 20', ok: s => s.bestStreak >= 20 },
  { icon: '🎯', name: 'Chăm chỉ', desc: '50 câu', ok: s => s.totalAnswered >= 50 },
  { icon: '💯', name: 'Lì đòn', desc: '200 câu', ok: s => s.totalAnswered >= 200 },
  { icon: '🛡️', name: 'Mắt thần', desc: 'Bắt 10 bẫy', ok: s => s.trapsAvoided >= 10 },
  { icon: '⏱️', name: 'Blitz 10', desc: '10 đúng / 60s', ok: s => s.bestBlitz >= 10 },
  { icon: '⚡', name: 'Blitz 20', desc: '20 đúng / 60s', ok: s => s.bestBlitz >= 20 }
];
function countNum(el, to) {
  if (RM) { el.textContent = to; return; }
  const t0 = performance.now(), ms = 700;
  const f = t => { const p = Math.min(1, (t - t0) / ms); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
function updateBadgeView() {
  countNum($('#badgeBestStreak'), state.bestStreak);
  countNum($('#badgeTotal'), state.totalAnswered);
  countNum($('#badgeTraps'), state.trapsAvoided);
  countNum($('#badgeBlitz'), state.bestBlitz);
  $('#achGrid').innerHTML = ACHIEVEMENTS.map(a => `<div class="ach${a.ok(state) ? ' on' : ''}"><div class="ach-i">${a.icon}</div><b>${a.name}</b><span>${a.desc}</span></div>`).join('');
  $('#topicBars').innerHTML = Object.entries(TOPIC_NAMES).map(([k, name]) => {
    const [ok, tot] = state.topicStats[k] || [0, 0], p = tot ? Math.round(ok / tot * 100) : 0;
    return `<div class="tb-row"><span>${name}</span><div class="tb-bar"><div class="tb-fill" style="width:0" data-w="${p}"></div></div><span class="tb-num">${tot ? `${p}% (${ok}/${tot})` : '—'}</span></div>`;
  }).join('');
  void $('#topicBars').offsetWidth;  // reflow để thanh chạy từ 0
  $$('.tb-fill').forEach(f => { f.style.width = f.dataset.w + '%'; });
}
function resetStats() {
  if (!confirm('Xoá toàn bộ kỷ lục, streak và thống kê luyện tập?')) return;
  ['san_best_streak', 'san_total_answered', 'san_traps_avoided', 'san_topic_stats', 'san_best_blitz', 'san_seen'].forEach(k => { try { localStorage.removeItem(k); } catch { /* ignore */ } });
  Object.assign(state, { bestStreak: 0, totalAnswered: 0, trapsAvoided: 0, topicStats: {}, bestBlitz: 0, streak: 0, score: 0, times: [], seen: {} });
  updateStats(); updateBadgeView();
}

/* =====================================================================
   INIT
   ===================================================================== */
window.addEventListener('keydown', e => {
  const inField = e.target.closest && e.target.closest('input, select, textarea');
  if (route.page === 'lesson' && !inField) {
    if (e.key === 'ArrowRight') { e.preventDefault(); slideNext(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); slidePrev(); }
  }
  if (route.page !== 'drill' || !$('#blitzModal').hidden) return;
  const q = state.currentQ, useChoice = q && (state.inputMode === 'choice' || q.expectedType === 'choice');
  if (useChoice && ['1', '2', '3', '4'].includes(e.key) && !state.answered && !inField) {
    const b = $$('#optionsGrid .opt-btn')[+e.key - 1];
    if (b) b.click();
  }
  if (e.code === 'Space' && state.answered) { e.preventDefault(); nextQuestion(); }
});

(function init() {
  initDecks();
  mountMascots();

  // Điều hướng + nút chung
  $('#lpNext').onclick = slideNext;
  $('#lpPrev').onclick = slidePrev;
  let sx = 0, sy = 0, sOk = false;
  $('#deckWrap').addEventListener('touchstart', e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; sOk = !e.target.closest('input, select, .scroll-x, #bigWheel, .us-screen'); }, { passive: true });
  $('#deckWrap').addEventListener('touchend', e => {
    if (!sOk) return;
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 60) (dx < 0 ? slideNext : slidePrev)();
  }, { passive: true });
  $$('#topicRow .pill').forEach(p => { p.onclick = () => setTopic(p.dataset.topic); });
  $('#soundToggle').onclick = () => { sound.enabled = !sound.enabled; $('#soundIcon').textContent = sound.enabled ? '🔊' : '🔇'; };
  $('#autoYear').checked = state.autoYear;
  $('#autoYear').onchange = e => {
    state.autoYear = e.target.checked;
    store.set('san_auto_year', state.autoYear);
    const q = state.currentQ;
    if (q && q.expYear && !state.answered) inpY.value = state.autoYear ? q.expYear : '';
  };
  $('[data-blitz]').addEventListener('click', () => setTimeout(startBlitz, 300));

  // Trang chủ
  renderRing();
  ringTo(280, 3000);
  $('#homeMascot').addEventListener('click', () => {
    const b = $('#homeBubble');
    b.textContent = TIPS[tipIdx++ % TIPS.length];
    b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';
    sound.playPop();
  });

  // Bài 0
  renderJourney();
  renderOffset();
  renderBeadGrid();
  $('#gaPresets').innerHTML = GA_PRESETS.map(([n, t]) => `<button class="btn btn-sm" onclick="gaTo(${n})">${t}</button>`).join('');
  $('#gaSlider').oninput = e => setGa(+e.target.value);
  setGa(63);
  const today = todayDate();
  $('#gaLmp').value = toISO(addDays(today, -75));
  $('#gaExam').value = toISO(today);
  ['#gaLmp', '#gaExam'].forEach(s => { $(s).onchange = () => runGaCalc(true); });
  runGaCalc(false);

  // Bài 1, 1B, 2
  drawWheel($('#bigWheel'), 5, 2026);
  M1 = createMachine($('#machine1'));
  M2 = createMachine($('#machine2'));
  runMachine(M1, parseISO($('#nLmp').value), 28, true);
  runMachine(M2, parseISO($('#cLmp').value), 28, true);
  renderFist();
  initOverflow();
  updateCycleVisualizer(28);

  // Bài 3
  $('#dayChips').innerHTML = [0, 1, 2, 3, 4, 5].map(d => `<button onclick="ivf.run++; drawEmbryo(${d}); sound.playPop()">N${d}</button>`).join('');
  drawEmbryo(3);
  $('#ivfTransfer').value = toISO(addDays(today, -30));
  $('#ivfExam').value = toISO(today);
  ['#ivfTransfer', '#ivfExam'].forEach(s => { $(s).onchange = runIvfCalc; });
  $$('#artType button').forEach(b => { b.onclick = () => { setArtType(b.dataset.t); sound.playPop(); }; });
  renderIvf();
  runIvfCalc();

  // Bài 4
  buildUS();
  $('#crlScan').value = toISO(today);
  $('#crlSlider').oninput = e => updateCrlVisualizer(e.target.value);
  $('#crlSlider').onchange = runCrlCalc;
  $('#crlScan').onchange = runCrlCalc;
  updateCrlVisualizer(21);
  runCrlCalc();
  renderPosture();
  $$('#postureSw button').forEach(b => { b.onclick = () => setPosture(b.dataset.p); });
  setPosture('neutral');
  renderBalance();
  $$('#balGroup button').forEach(b => { b.onclick = () => setBalGroup(b.dataset.g); });
  $('#balDiff').oninput = updateBalance;
  updateBalance();

  // Bẫy + Đấu trường
  renderTraps();
  updateStats();
  nextQuestion();

  window.addEventListener('hashchange', render);
  render();
  booting = false;
})();
