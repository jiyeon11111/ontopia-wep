import { ASSETS, FAR_METERS, MIN_PER_KM, STATS, DATA_URL } from './config.js';
import * as api from './api.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const km = m => (m >= 1000 ? (m / 1000).toFixed(1) + 'km' : m + 'm');
const walkMin = m => Math.round((m / 1000) * MIN_PER_KM);

const state = {
  schools: [],
  school: null,      // { name, sido, sigungu, area, po, dist }
  letters: [],       // 업로드한 편지 이미지 (data URL)
  order: [],         // 명단 i번째 학생에게 붙는 편지 인덱스
  application: null, // 저장된 신청서 (학생별 보호자 코드 포함)
  addr: {},          // 보호자 코드 → 입력 여부
};

// ---------- 그림 ----------
function applyAssets(root = document) {
  root.querySelectorAll('[data-asset]').forEach(img => { img.src = ASSETS[img.dataset.asset]; });
  root.querySelectorAll('[data-character]').forEach(img => {
    const c = ASSETS.characters[img.dataset.character];
    img.src = c.src;
    if (!img.alt) img.alt = c.name;
  });
  root.querySelectorAll('[data-character-name]').forEach(el => { el.textContent = ASSETS.characters[el.dataset.characterName].name; });
}

// ---------- 단계 이동 ----------
function go(n) {
  [1, 2, 3, 4].forEach(i => { $('step-' + i).hidden = i !== n; });
  document.querySelectorAll('#progress li').forEach(li => {
    const s = +li.dataset.step;
    const done = s < n || n === 4;
    li.classList.toggle('is-done', done);
    if (s === n && !done) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    li.querySelector('.progress__stamp').textContent = done ? '✓' : s;
  });
  if (n === 2) renderPackage();
  if (n === 3) renderSend();
  if (n === 4) renderSummary();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  $('step-' + n).querySelector('h1, h2').focus?.();
}

// ---------- 학교 데이터 ----------
const routeOf = s => (s.area !== '동' && s.dist > FAR_METERS ? 'post' : 'box');

async function loadSchools() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(res.status);
    const rows = await res.json();
    state.schools = rows.map(r => ({ name: r[0], sido: r[1], sigungu: r[2], area: r[3], po: r[4], dist: r[5] }));
  } catch (e) {
    const el = $('data-error');
    el.hidden = false;
    el.textContent = '학교 목록을 불러오지 못했어요. 웹 서버로 열었는지 확인해 주세요 (README 참고).';
  }
}

// ---------- 1단계: 검색 ----------
function setupSearch() {
  const q = $('school-q'), list = $('school-list');
  let hits = [], cursor = -1;
  const close = () => { list.hidden = true; q.setAttribute('aria-expanded', 'false'); cursor = -1; };
  const draw = () => {
    list.innerHTML = hits.length
      ? hits.map((s, i) => `<li><button type="button" role="option" data-i="${i}" aria-selected="${i === cursor}"><span>${esc(s.name)}</span><small>${esc(s.sido)} ${esc(s.sigungu)}</small></button></li>`).join('')
      : '<li class="muted" style="padding:9px 12px">찾는 학교가 없어요. 학교 이름을 다시 확인해 주세요.</li>';
    list.hidden = false; q.setAttribute('aria-expanded', 'true');
  };
  q.addEventListener('input', () => {
    const v = q.value.replace(/\s/g, '');
    if (v.length < 2) return close();
    hits = []; cursor = -1;
    for (const s of state.schools) { if (s.name.includes(v)) { hits.push(s); if (hits.length >= 12) break; } }
    draw();
  });
  q.addEventListener('keydown', e => {
    if (list.hidden || !hits.length) return;
    if (e.key === 'ArrowDown') { cursor = Math.min(hits.length - 1, cursor + 1); draw(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { cursor = Math.max(0, cursor - 1); draw(); e.preventDefault(); }
    if (e.key === 'Enter' && cursor >= 0) { choose(hits[cursor]); e.preventDefault(); }
    if (e.key === 'Escape') close();
  });
  list.addEventListener('click', e => { const b = e.target.closest('button'); if (b) choose(hits[+b.dataset.i]); });
  document.addEventListener('click', e => { if (!e.target.closest('.search')) close(); });
  document.querySelectorAll('[data-example]').forEach(b => b.addEventListener('click', () => {
    const [name, sido] = b.dataset.example.split('|');
    const s = state.schools.find(x => x.name === name && x.sido === sido);
    if (s) choose(s);
  }));
  function choose(s) { q.value = s.name; close(); selectSchool(s); }
}

function selectSchool(s) {
  state.school = s;
  state.application = null;
  const rural = s.area !== '동', far = s.dist > FAR_METERS, rt = routeOf(s);
  const pct = Math.min(100, (s.dist / (FAR_METERS * 3)) * 100);
  const why = rt === 'post'
    ? '우체국까지 아이 걸음으로 30분이 넘어요. 반 전체 편지 사진을 한 번에 접수하면 엽서로 인쇄해 배달해요.'
    : rural ? '우체국이 2km 안에 있어요. 학교에 상자 우체통을 두고 모아서 보내요.'
            : '우체국은 가깝지만 직접 보내 볼 기회가 적어요. 학교 안 상자 우체통으로 보내는 습관을 만들어요.';
  const group = rt === 'post' ? `농어촌 중 우체국 2km 밖 ${STATS.ruralFar.toLocaleString()}곳에 해당`
    : rural ? `농어촌 중 우체국 2km 안 ${STATS.ruralNear.toLocaleString()}곳에 해당`
            : `전국 도시 학교 ${STATS.city.toLocaleString()}곳에 해당`;
  $('school-result').innerHTML = `
    <div class="result">
      <div class="panel">
        <span class="tag ${rural ? 'tag--rural' : 'tag--city'}">${rural ? '농어촌(읍·면)' : '도시(동)'}</span>
        <span class="school-name">${esc(s.name)}</span>
        <p class="muted">${esc(s.sido)} ${esc(s.sigungu)} · 가장 가까운 우체국 <b>${esc(s.po)}</b></p>
        <span class="distance">${km(s.dist)}<small>아이 걸음 약 ${walkMin(s.dist)}분</small></span>
        <div class="meter" aria-hidden="true"><span class="meter__bar" style="width:${pct}%;background:${far ? 'var(--color-rural)' : 'var(--color-city)'}"></span><span class="meter__mark"></span></div>
        <div class="meter__labels"><span>0</span><span>2km · 30분 기준</span><span>6km+</span></div>
      </div>
      <div class="route ${rt === 'post' ? 'route--post' : 'route--box'}">
        <span class="muted">자동 배정된 발송 방법</span>
        <strong>${rt === 'post' ? '단체 모바일 엽서' : '모아 보내는 상자 우체통'}</strong>
        <span class="muted">${why}</span>
        <span class="route__flow">${rt === 'post' ? '명단 등록 → 편지 사진 일괄 업로드 → 보호자 주소 입력 → 발송' : '둘 곳 고르기 → 보내는 날 정하기 → 신청'}</span>
        <span class="muted">${group}</span>
      </div>
    </div>`;
  $('go-2').disabled = false;
}

// ---------- 2단계 ----------
function renderPackage() {
  const n = Math.max(1, +$('count').value || 1);
  $('kit-count').textContent = `편지지·봉투 ${n}세트`;
  const rt = routeOf(state.school);
  $('send-title').textContent = '보내기 · ' + (rt === 'post' ? '단체 모바일 엽서' : '상자 우체통');
  $('send-list').innerHTML = rt === 'post'
    ? '<li>반 전체 편지 사진 한 번에 접수</li><li>손글씨 그대로 엽서로 인쇄·배달</li><li>첫 발송 지원</li>'
    : '<li>잠금식 상자 우체통 1개</li><li>우표 없이 투입, 학교가 요금 일괄 납부</li><li>정해진 날 모아서 발송</li>';
}

// ---------- 3단계 ----------
const names = () => $('roster').value.split('\n').map(s => s.trim()).filter(Boolean);

function renderSend() {
  const rt = routeOf(state.school);
  $('flow-post').hidden = rt !== 'post';
  $('flow-box').hidden = rt !== 'box';
  $('t3').textContent = rt === 'post' ? '반 전체 편지 접수' : '상자 우체통 신청';
  const who = rt === 'post' ? 'hoi' : 'shasha';
  $('s3-guide').className = 'guide' + (rt === 'post' ? ' guide--lavender' : '');
  $('s3-guide-img').src = ASSETS.characters[who].src;
  $('s3-guide-img').alt = ASSETS.characters[who].name;
  $('s3-guide-name').textContent = ASSETS.characters[who].name;
  $('s3-guide-text').textContent = rt === 'post'
    ? '명단과 편지 사진만 올리면 돼요. 엽서를 한 장씩 만들 필요가 없어요.'
    : '우체통 둘 곳과 모아서 보내는 날만 정해 주세요.';
  $('preview-from').textContent = `${state.school.name} ${$('cls').value}`;
  $('near-po').textContent = `가까운 우체국: ${state.school.po} (${km(state.school.dist)})`;
  renderRoster();
}

function syncOrder() {
  const n = names().length;
  if (state.order.length !== n) state.order = Array.from({ length: n }, (_, i) => i);
}

function codeOf(i) {
  const s = state.application && state.application.students[i];
  return s && s.name === names()[i] ? s.code : null;
}

function renderRoster() {
  syncOrder();
  const ns = names(), onlyPending = $('only-pending').checked;
  if (!ns.length) {
    $('roster-rows').innerHTML = '<tr><td colspan="5" class="muted">명단을 입력하면 학생별 접수 현황이 여기에 나와요.</td></tr>';
    $('counts').innerHTML = '';
    renderPreview();
    return;
  }
  let withLetter = 0, withAddr = 0;
  const rows = ns.map((n, i) => {
    const letter = state.letters[state.order[i]];
    const code = codeOf(i), hasAddr = code && state.addr[code];
    if (letter) withLetter++;
    if (hasAddr) withAddr++;
    if (onlyPending && letter && hasAddr) return '';
    const addr = hasAddr ? '<span class="badge badge--ok">입력 완료</span>'
      : code ? '<span class="badge badge--wait">보호자 입력 대기</span>'
             : '<span class="badge badge--none">QR 만들기 전</span>';
    return `<tr><td>${i + 1}</td><td>${esc(n)}</td>
      <td>${letter ? `<img class="thumb" src="${letter}" alt="${esc(n)} 편지">` : '<span class="badge badge--none">사진 없음</span>'}</td>
      <td>${addr}</td>
      <td><button class="icon-btn" type="button" data-move="-1" data-i="${i}" aria-label="${esc(n)} 편지를 위 학생과 바꾸기">▲</button><button class="icon-btn" type="button" data-move="1" data-i="${i}" aria-label="${esc(n)} 편지를 아래 학생과 바꾸기">▼</button></td></tr>`;
  }).join('');
  $('roster-rows').innerHTML = rows || '<tr><td colspan="5" class="muted">모든 학생이 준비됐어요.</td></tr>';
  $('counts').innerHTML = `<span class="badge badge--ok">편지 ${withLetter}/${ns.length}</span><span class="badge badge--wait">주소 ${withAddr}/${ns.length}</span>`;
  renderPreview();
}

function renderPreview() {
  const first = state.letters[state.order[0]];
  $('preview-front').innerHTML = first ? `<img src="${first}" alt="첫 번째 학생 편지 미리보기">` : '<div class="postcard__text"><span class="muted">편지 사진이 여기에 인쇄돼요</span></div>';
  $('preview-name').textContent = first && names()[0] ? '· ' + names()[0] : '';
}

function setupRoster() {
  $('roster').addEventListener('input', renderRoster);
  $('only-pending').addEventListener('change', renderRoster);
  $('roster-rows').addEventListener('click', e => {
    const b = e.target.closest('[data-move]'); if (!b) return;
    const i = +b.dataset.i, j = i + +b.dataset.move;
    if (j < 0 || j >= state.order.length) return;
    [state.order[i], state.order[j]] = [state.order[j], state.order[i]];
    renderRoster();
  });
  const input = $('letter-files'), zone = $('dropzone');
  const add = files => {
    const imgs = [...files].filter(f => f.type.startsWith('image/'))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
    if (!imgs.length) return;
    Promise.all(imgs.map(f => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); })))
      .then(urls => { state.letters = urls; state.order = []; renderRoster(); });
  };
  input.addEventListener('change', () => add(input.files));
  ['dragenter', 'dragover'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.add('is-over'); }));
  ['dragleave', 'drop'].forEach(t => zone.addEventListener(t, e => { e.preventDefault(); zone.classList.remove('is-over'); }));
  zone.addEventListener('drop', e => add(e.dataTransfer.files));

  $('make-qr').addEventListener('click', async () => {
    const ns = names();
    if (!ns.length) return showError('먼저 반 명단을 입력해 주세요.');
    await saveDraft();
    const sheet = $('qr-sheet');
    const base = new URL('guardian.html', location.href);
    sheet.innerHTML = state.application.students.map(s => {
      const url = `${base}?c=${s.code}`;
      return `<div class="qr-card"><b>${esc(s.name)} 보호자님께</b><div data-qr="${esc(url)}"></div><a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></div>`;
    }).join('');
    sheet.hidden = false;
    sheet.querySelectorAll('[data-qr]').forEach(el => {
      if (window.QRCode) new window.QRCode(el, { text: el.dataset.qr, width: 128, height: 128 });
    });
    await refreshStatus();
  });
  $('refresh-status').addEventListener('click', refreshStatus);
}

async function refreshStatus() {
  if (!state.application) return renderRoster();
  state.addr = await api.addressStatus(state.application.students.map(s => s.code));
  renderRoster();
}

function showError(msg) {
  const el = $('s3-error'); el.textContent = msg; el.hidden = !msg;
}

async function saveDraft() {
  const s = state.school;
  state.application = await api.saveApplication({
    id: state.application && state.application.id,
    school: { name: s.name, sido: s.sido, sigungu: s.sigungu, area: s.area, po: s.po, dist: s.dist },
    cls: $('cls').value.trim(),
    count: +$('count').value,
    route: routeOf(s),
    box: { place: $('box-place').value, day: $('box-day').value },
    students: names().map(name => ({ name })),
  });
}

// ---------- 4단계 ----------
async function submit() {
  showError('');
  if (routeOf(state.school) === 'post' && !names().length) return showError('반 명단을 입력해 주세요.');
  await saveDraft();
  await api.submitApplication(state.application.id);
  await refreshStatus();
  go(4);
}

function renderSummary() {
  const s = state.school, rt = routeOf(s), ns = names();
  const rows = [
    ['신청 상태', '신청 완료'],
    ['다음 단계', '패키지 준비 안내'],
    ['학교', `${s.name} (${s.sido} ${s.sigungu})`],
    ['학년·반', `${$('cls').value} · 학생 ${$('count').value}명`],
    ['발송 방법', rt === 'post' ? '단체 모바일 엽서' : `상자 우체통 · ${$('box-place').value} · ${$('box-day').value}`],
  ];
  if (rt === 'post' && ns.length) {
    const letters = ns.filter((_, i) => state.letters[state.order[i]]).length;
    const addrs = ns.filter((_, i) => codeOf(i) && state.addr[codeOf(i)]).length;
    rows.push(['접수 현황', `편지 ${letters}/${ns.length}장 · 주소 ${addrs}/${ns.length}명`]);
  }
  rows.push(['신청 번호', state.application.id]);
  $('summary').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('');
}

// ---------- 시작 ----------
async function init() {
  applyAssets();
  setupSearch();
  setupRoster();
  $('count').addEventListener('input', renderPackage);
  $('go-2').addEventListener('click', () => go(2));
  $('go-3').addEventListener('click', () => go(3));
  $('submit').addEventListener('click', submit);
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
  $('restart').addEventListener('click', () => {
    Object.assign(state, { school: null, letters: [], order: [], application: null, addr: {} });
    $('roster').value = ''; $('school-q').value = ''; $('school-result').innerHTML = '';
    $('qr-sheet').hidden = true; $('go-2').disabled = true; go(1);
  });
  window.addEventListener('focus', () => { if (!$('step-3').hidden) refreshStatus(); });
  go(1);
  await loadSchools();
}

init();
