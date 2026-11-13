import { ASSETS } from './config.js';
import * as api from './api.js';

const $ = id => document.getElementById(id);

document.querySelectorAll('[data-character]').forEach(img => { img.src = ASSETS.characters[img.dataset.character].src; });
document.querySelectorAll('[data-character-name]').forEach(el => { el.textContent = ASSETS.characters[el.dataset.characterName].name; });

const code = new URLSearchParams(location.search).get('c');

async function init() {
  const info = code && await api.lookupStudent(code);
  if (!info) { $('error-view').hidden = false; return; }
  if (info.done) return showDone(info);
  $('intro').textContent = `${info.school} ${info.cls} ${info.student} 학생이 쓴 편지를 받을 분의 주소를 알려 주세요.`;
  $('form-view').hidden = false;

  $('addr-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('form-error');
    const zip = $('to-zip').value.trim();
    if (!$('to-name').value.trim() || !$('to-addr').value.trim()) return show(err, '이름과 주소를 입력해 주세요.');
    if (!/^\d{5}$/.test(zip)) return show(err, '우편번호는 숫자 5자리예요.');
    if (!$('agree').checked) return show(err, '주소 사용에 동의해 주세요.');
    await api.submitAddress(code, {
      name: $('to-name').value.trim(), zip, addr: $('to-addr').value.trim(), addr2: $('to-addr2').value.trim(),
    });
    $('form-view').hidden = true;
    showDone(info);
  });
}

function show(el, msg) { el.textContent = msg; el.hidden = false; }
function showDone(info) {
  $('done-text').textContent = `${info.student} 학생의 편지가 엽서로 인쇄되어 이 주소로 배달돼요.`;
  $('done-view').hidden = false;
}

init();
