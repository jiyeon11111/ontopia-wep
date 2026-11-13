// 서비스 설정: 그림 파일 경로, 발송 경로 기준, 문구에 쓰는 숫자.
// GPT에서 받은 그림은 assets/ 아래에 같은 이름으로 넣고, 확장자가 다르면 여기만 고친다.

export const ASSETS = {
  hero: 'assets/hero.jpg',
  // 진행 단계 여권 스탬프 (투명 PNG)
  stamps: {
    search:  'assets/stamps/search.png',
    package: 'assets/stamps/package.png',
    send:    'assets/stamps/send.png',
    done:    'assets/stamps/done.png',
  },
  // 화면 속 장면 그림
  scenes: {
    empty:     'assets/scenes/empty.jpg',
    school:    'assets/scenes/school.jpg',
    routeMap:  'assets/scenes/route-map.jpg',
    pkgLearn:  'assets/scenes/pkg-learn.jpg',
    pkgWrite:  'assets/scenes/pkg-write.jpg',
    pkgSend:   'assets/scenes/pkg-send.jpg',
    done:      'assets/scenes/done-mailbox.jpg',
  },
  characters: {
    aengdu: { name: '앵두', src: 'assets/characters/aengdu.jpg' },
    dali:   { name: '달이', src: 'assets/characters/dali.jpg' },
    hoi:    { name: '호이', src: 'assets/characters/hoi.jpg' },
    kwati:  { name: '콰티', src: 'assets/characters/kwati.jpg' },
    shasha: { name: '샤샤', src: 'assets/characters/shasha.jpg' },
  },
};

// 학교에서 가장 가까운 우체국까지 이 거리(m)를 넘고 읍·면이면 단체 모바일 엽서로 배정한다.
export const FAR_METERS = 2000;
// 아이 걸음 기준: 시속 4km = 1km에 15분
export const MIN_PER_KM = 15;

export const STATS = {
  totalSchools: 6286,
  city: 3779,
  ruralNear: 1729,
  ruralFar: 778,
};

export const DATA_URL = 'data/schools.json';
// schools.json 한 줄 = [학교명, 시도, 시군구, 권역(동/읍/면), 가장 가까운 우체국, 거리(m)]
