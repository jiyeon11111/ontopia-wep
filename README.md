# 낙온 ONTOPIA · 우정문화 패키지 신청

학교·어린이도서관이 우정문화 패키지(배우기·쓰기·보내기)를 신청하고, 반 전체 편지를 학교 위치에 맞는 방법으로 보내는 웹 서비스입니다. 포커스온 7기 낙온팀.

빌드 도구 없이 HTML·CSS·JavaScript만으로 되어 있어서, 어떤 정적 호스팅에도 폴더째 올리면 됩니다.

## 화면

| 파일 | 쓰는 사람 | 내용 |
| --- | --- | --- |
| `index.html` | 교사·사서 | 1 학교 찾기 → 2 패키지 구성 → 3 발송 준비 → 4 신청 완료 |
| `guardian.html` | 보호자 | 가정통신문 QR로 들어와 편지 받을 분 주소 입력 |

발송 방법은 학교를 고르면 자동으로 정해집니다. 읍·면 학교이면서 가장 가까운 우체국이 2km 넘게 떨어져 있으면 단체 모바일 엽서(778곳)로 정해지고, 나머지(5,508곳)는 모아 보내는 상자 우체통으로 정해집니다.

## 로컬에서 실행

`fetch`로 학교 데이터를 읽기 때문에 파일을 더블클릭하면 안 되고, 웹 서버로 열어야 합니다.

```
cd ontopia-web
python3 -m http.server 8000
```

브라우저에서 http://localhost:8000 을 엽니다.

## 배포

- **GitHub Pages:** 저장소에 올린 뒤 Settings → Pages에서 브랜치 루트를 지정합니다.
- **Netlify:** app.netlify.com/drop 에 폴더를 끌어다 놓습니다.
- **Vercel:** 저장소를 연결합니다. 빌드 설정은 필요 없습니다.

## 디자인 바꾸기 (GPT 디자인 연동)

| 바꿀 것 | 위치 |
| --- | --- |
| 색·글꼴·크기·모서리·그림자 | `css/tokens.css`의 `:root` 값만 덮어쓰기 |
| 캐릭터 그림 | `assets/characters/`에 같은 이름으로 넣기. 확장자가 다르면(.png) `js/config.js`의 경로만 수정 |
| 첫 화면 그림 | `assets/hero.jpg` 교체 (또는 `config.js`에서 경로 수정) |
| 레이아웃·컴포넌트 | `css/app.css` (색 값은 직접 쓰지 말고 토큰 변수만 사용) |
| 문구 | `index.html`, `guardian.html`, 상황별 문구는 `js/app.js` |

데이터 색 규칙: 도시는 `--color-city`(코랄), 농어촌은 `--color-rural`(남색)입니다. 발표 자료의 지도·차트와 같은 의미이니 다른 용도로 쓰지 않습니다.

## 지금 임시로 되어 있는 것

`js/api.js`는 데이터를 브라우저 localStorage에 저장합니다. 그래서 신청서와 보호자 주소가 같은 브라우저 안에서만 이어집니다. 같은 컴퓨터에서 QR 링크를 새 탭으로 열면 흐름 전체를 시연할 수 있습니다.

실제 운영하려면 `api.js`의 다섯 함수(`saveApplication`, `submitApplication`, `lookupStudent`, `submitAddress`, `addressStatus`)만 서버 호출로 바꾸면 됩니다. 화면 코드는 그대로 둡니다.
- 서버 후보: Supabase, Firebase(무료 등급으로 시작 가능)
- 주소는 교사에게 돌려주지 않고 입력 여부만 돌려줍니다. 서버에서도 이 원칙을 유지합니다.

아직 없는 것: 실제 엽서 인쇄·발송 연동, 요금후납 처리, 운영자(진흥원) 관리 화면, 로그인.

## 데이터

`data/schools.json` 한 줄 = `[학교명, 시도, 시군구, 권역(동/읍/면), 가장 가까운 우체국, 거리(m)]`, 6,286곳.

- 출처: 교육부 학교위치(2026.10), 우정사업본부 우체국 현황(2026.8, 카카오 지도 API로 좌표 변환)
- 군사·구내 우체국과 운영 중지 우체국은 제외(분석 대상 3,235곳)
- 거리는 직선거리라 실제 걷는 거리는 더 깁니다.
- 다시 만들기: `python3 scripts/build_schools.py 학교.csv 우체국_좌표.csv data/schools.json` (pandas, numpy, scikit-learn 필요)

## 폴더

```
ontopia-web/
├── index.html          교사 신청 화면
├── guardian.html       보호자 주소 입력 화면
├── css/tokens.css      디자인 토큰
├── css/app.css         레이아웃·컴포넌트
├── js/config.js        그림 경로, 발송 기준(2km), 통계 숫자
├── js/api.js           저장소 (지금은 localStorage)
├── js/app.js           교사 화면 동작
├── js/guardian.js      보호자 화면 동작
├── data/schools.json   전국 초등학교 6,286곳
├── assets/             캐릭터·첫 화면 그림
└── scripts/build_schools.py
```
