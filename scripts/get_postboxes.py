"""
우체국 찾기 API로 전국 우체통 위치를 받아 postboxes.csv로 저장합니다.

실행 방법 (터미널에서, 이 파일이 있는 폴더로 이동한 뒤):
  Mac/Linux:  KOREAPOST_KEY='서비스키' python3 get_postboxes.py
  Windows:    set KOREAPOST_KEY=서비스키
              python get_postboxes.py

서비스키는 코드에 직접 적지 말고 위처럼 환경변수로만 넣으세요.
추가 설치 필요 없음 (파이썬 기본 라이브러리만 사용).
"""
import csv
import os
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

BASE = "https://www.koreapost.go.kr/koreapost/openapi/searchPostSearchList.do"
REGIONS = ["se", "gi", "bs", "cc", "kb", "kw", "jn", "jb", "jj"]  # 가이드 2-3 지역코드
PAGE = 50  # 가이드상 최대값

key = os.environ.get("KOREAPOST_KEY", "").strip()
if not key:
    sys.exit("KOREAPOST_KEY 환경변수에 서비스키를 넣고 다시 실행하세요.")
key = urllib.parse.unquote(key)  # 이미 인코딩된 키를 넣어도 되도록


def call(params):
    q = urllib.parse.urlencode({"serviceKey": key, **params})
    req = urllib.request.Request(f"{BASE}?{q}", headers={"User-Agent": "Mozilla/5.0"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return ET.fromstring(r.read())
        except Exception as e:
            if attempt == 2:
                raise
            print(f"  재시도 ({e})")
            time.sleep(2)


def text(el, tag):
    v = el.findtext(tag)
    return "" if v in (None, "null") else v.strip()


rows, seen = [], set()
for region in REGIONS:
    page, total_page = 1, 1
    while page <= total_page:
        root = call({"postTopId": region, "postDivType": 2, "pageCount": PAGE, "nowPage": page})
        head = root.find("postMsgHeader")
        if head is None:
            print(f"[{region}] 응답 형식이 예상과 다릅니다:")
            print(ET.tostring(root, encoding="unicode")[:500])
            sys.exit(1)
        total = int(text(head, "totalCount") or 0)
        total_page = int(text(head, "totalPage") or 0)
        if page == 1:
            print(f"[{region}] 전체 {total}건, {total_page}페이지")
        for it in root.findall("postItem"):
            pid = text(it, "postId")
            if pid in seen:
                continue
            seen.add(pid)
            rows.append({
                "region": region,
                "postId": pid,
                "postDiv": text(it, "postDiv"),
                "name": text(it, "postNm"),
                "addr": text(it, "postAddr"),
                "lat": text(it, "postLat"),
                "lon": text(it, "postLon"),
                "serviceTime": text(it, "postServiceTime"),
                "modDt": text(it, "modDt"),
            })
        page += 1
        time.sleep(0.2)

with open("postboxes.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0].keys()) if rows else ["postId"])
    w.writeheader()
    w.writerows(rows)

print(f"\n완료: 우체통 {len(rows)}곳 -> postboxes.csv")
by_div = {}
for r in rows:
    by_div[r["postDiv"]] = by_div.get(r["postDiv"], 0) + 1
print("postDiv별 개수 (2가 우체통):", by_div)
