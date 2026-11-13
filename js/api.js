// 저장소 계층. 지금은 브라우저 localStorage에 저장하는 임시 구현이다.
// 실제 운영에서는 이 파일의 함수만 서버 API(예: Supabase, Firebase, 자체 서버) 호출로 바꾸면 된다.
// 화면 코드(app.js, guardian.js)는 이 함수들만 쓴다.

const KEY = 'ontopia:v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || { applications: {}, addresses: {} }; }
  catch { return { applications: {}, addresses: {} }; }
}
function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* 저장 불가 환경: 무시 */ }
}
function code() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}

// 신청서 저장. students = [{ name }] → 학생마다 보호자 입력 코드를 붙여 돌려준다.
export async function saveApplication(app) {
  const db = load();
  const id = app.id || 'app_' + code();
  const prev = db.applications[id];
  const students = app.students.map((s, i) => ({
    name: s.name,
    code: (prev && prev.students[i] && prev.students[i].name === s.name) ? prev.students[i].code : code(),
  }));
  db.applications[id] = { ...app, id, students, savedAt: new Date().toISOString() };
  save(db);
  return db.applications[id];
}

export async function submitApplication(id) {
  const db = load();
  if (!db.applications[id]) throw new Error('신청서를 찾을 수 없어요.');
  db.applications[id].status = 'submitted';
  db.applications[id].submittedAt = new Date().toISOString();
  save(db);
  return db.applications[id];
}

// 보호자 화면: 코드로 학생·학교 정보만 조회 (주소는 돌려주지 않는다)
export async function lookupStudent(studentCode) {
  const db = load();
  for (const app of Object.values(db.applications)) {
    const s = app.students.find(x => x.code === studentCode);
    if (s) return { school: app.school.name, cls: app.cls, student: s.name, done: !!db.addresses[studentCode] };
  }
  return null;
}

export async function submitAddress(studentCode, form) {
  const db = load();
  db.addresses[studentCode] = { ...form, at: new Date().toISOString() };
  save(db);
  return true;
}

// 교사 화면: 주소 내용 없이 입력 여부만 돌려준다
export async function addressStatus(codes) {
  const db = load();
  const out = {};
  codes.forEach(c => { out[c] = !!db.addresses[c]; });
  return out;
}
