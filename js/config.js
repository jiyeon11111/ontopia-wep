// 서비스 설정: 그림 파일 경로, 발송 경로 기준, 문구에 쓰는 숫자.
// 그림을 바꿀 때는 assets/ 아래 같은 이름으로 덮어쓰거나 여기 경로만 고친다.

const C = 'assets/characters/';
export const ASSETS = {
  hero: 'assets/hero.jpg',
  // 캐릭터: avatar(원형 흉상), full(전신). 모두 투명 PNG
  characters: {
    aengdu: { name: '앵두', src: C + 'avatar/aengdu.webp', full: C + 'full/aengdu.webp' },
    dali:   { name: '달이', src: C + 'avatar/dali.webp',   full: C + 'full/dali.webp' },
    hoi:    { name: '호이', src: C + 'avatar/hoi.webp',    full: C + 'full/hoi.webp' },
    kwati:  { name: '콰티', src: C + 'avatar/kwati.webp',  full: C + 'full/kwati.webp' },
    shasha: { name: '샤샤', src: C + 'avatar/shasha.webp', full: C + 'full/shasha.webp' },
  },
  // 진행·완료 여권 스탬프
  stamps: {
    search: 'assets/stamps/search.webp', package: 'assets/stamps/package.webp',
    send: 'assets/stamps/send.webp', done: 'assets/stamps/done.webp',
  },
  // 장식 (GPT 시안에서 잘라 냄)
  deco: {
    crest: 'assets/deco/coin-crest.webp', postage: 'assets/deco/postage.webp',
    coinLearn: 'assets/deco/coin-learn.webp', coinWrite: 'assets/deco/coin-write.webp', coinSend: 'assets/deco/coin-send.webp',
  },
  // 장면 그림
  scenes: {
    friends: 'assets/scenes/step1-friends.jpg',
    empty: 'assets/scenes/empty.jpg',
    school: 'assets/scenes/school.jpg',
    routeMap: 'assets/scenes/route-map.jpg',
    pkgLearn: 'assets/scenes/pkg-learn.jpg', pkgWrite: 'assets/scenes/pkg-write.jpg', pkgSend: 'assets/scenes/pkg-send.jpg',
    postcardFront: 'assets/scenes/postcard-front.jpg', postcardBack: 'assets/scenes/postcard-back.jpg',
    box: 'assets/scenes/box.jpg', postOffice: 'assets/scenes/post-office.jpg', miniMap: 'assets/scenes/mini-map.jpg',
    done: 'assets/scenes/done-mailbox.jpg',
  },
};

// 학교에서 가장 가까운 우체국까지 이 거리(m)를 넘고 읍·면이면 단체 모바일 엽서로 배정한다.
export const FAR_METERS = 2000;
// 아이 걸음 기준: 시속 4km = 1km에 15분
export const MIN_PER_KM = 15;

export const STATS = { totalSchools: 6286, city: 3779, ruralNear: 1729, ruralFar: 778 };

export const DATA_URL = 'data/schools.json';
// schools.json 한 줄 = [학교명, 시도, 시군구, 권역(동/읍/면), 가장 가까운 우체국, 거리(m)]
