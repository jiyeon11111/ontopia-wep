"""
data/schools.json 만들기.
입력: 교육부 학교위치 CSV(학교명·도로명주소·위도·경도·학교급·운영상태),
      우정사업본부 우체국 현황에 좌표를 붙인 CSV(우체국명·주소(도로명)·위도·경도).
출력: [학교명, 시도, 시군구, 권역(동/읍/면), 가장 가까운 우체국, 거리(m)] 목록.
실행: python3 scripts/build_schools.py 학교.csv 우체국_좌표.csv data/schools.json
"""
import sys, json
import numpy as np, pandas as pd
from sklearn.neighbors import BallTree

R = 6371000
SIDO = {'서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주',
        '대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원',
        '강원도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라북도':'전북',
        '전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'}

def area_of(addr):
    for tok in str(addr).split()[1:4]:
        if tok.endswith('읍'): return '읍'
        if tok.endswith('면'): return '면'
    return '동'

def main(school_csv, po_csv, out):
    s = pd.read_csv(school_csv, encoding='utf-8-sig', dtype=str)
    e = s[(s['학교급구분'] == '초등학교') & (s['운영상태'] == '운영')].copy()
    e[['위도', '경도']] = e[['위도', '경도']].astype(float)
    addr = e['소재지도로명주소'].str.split()
    e['시도'] = addr.str[0]; e['시군구'] = addr.str[1]
    e['권역'] = e['소재지도로명주소'].map(area_of)

    p = pd.read_csv(po_csv, encoding='utf-8-sig', dtype=str)
    p.columns = [c.strip() for c in p.columns]
    p['위도'] = pd.to_numeric(p['위도'], errors='coerce'); p['경도'] = pd.to_numeric(p['경도'], errors='coerce')
    usable = (~p['주소(도로명)'].str.contains('운영중지', na=False)      # 운영 중지 제외
              & ~p['우체국명'].str.contains('군사|구내', na=False)        # 아이가 갈 수 없는 곳 제외
              & p['위도'].between(33, 39) & p['경도'].between(124, 132))
    ok = p[usable].reset_index(drop=True)

    tree = BallTree(np.radians(ok[['위도', '경도']].values), metric='haversine')
    d, i = tree.query(np.radians(e[['위도', '경도']].values), k=1)
    e['dist'] = (d[:, 0] * R).round().astype(int)
    e['po'] = ok.loc[i[:, 0], '우체국명'].values

    rows = [[r.학교명, SIDO.get(r.시도, r.시도), r.시군구 if isinstance(r.시군구, str) else '', r.권역, r.po, int(r.dist)]
            for r in e.itertuples()]
    json.dump(rows, open(out, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'초등학교 {len(rows)}곳, 우체국 {len(ok)}곳 → {out}')

if __name__ == '__main__':
    main(*sys.argv[1:4])
