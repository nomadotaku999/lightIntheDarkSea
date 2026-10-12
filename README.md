# 어두운 바다의 등불이 되어: 3,000m (비공식 팬게임)

웹소설 「어두운 바다의 등불이 되어」를 바탕으로 한 텍스트 로그라이크 팬게임입니다.
Twine의 SugarCube 2 포맷으로 만들고, Tweego로 HTML 한 파일로 빌드합니다.

## 폴더 구조

```
src/
  js/01_core.js      엔진: 판정, 붕괴도, 회차, 박무현의 기억, 저장, 매크로
  js/02_data.js      데이터: 정보(기억 항목), 장소, 행동, 게시판, 위험, 도착 사건
  js/03_effects.js   선택지를 눌렀을 때의 결과, 사망 후 박무현 행적 생성
  css/style.css      화면 디자인(어두운/밝은 모드)
  story/*.twee       이야기 패시지(첫 화면, 탐사, 이벤트, 결말)
build/index.html     빌드 결과(배포용)
```

## 빌드 방법

1. Tweego를 내려받습니다: https://www.motoslave.net/tweego/
2. SugarCube 2.37.3 포맷을 Tweego의 `storyformats` 폴더에 넣습니다(Tweego에 기본 포함).
3. 이 폴더에서 실행합니다.

```
tweego -o build/index.html src
```

`build/index.html` 하나를 itch.io(HTML 게임), GitHub Pages 같은 곳에 올리면 됩니다.

## 이벤트를 늘리는 법

1. `story/`의 twee 파일에 새 패시지(문장)를 씁니다.
2. 선택지는 두 가지 매크로로 만듭니다.
   - `<<go "문구" "패시지" 걸리는턴 [이동할장소] [ctx]>>`
   - `<<chk "문구" "능력치" "난이도" "성공패시지" "실패패시지" 걸리는턴 [ctx]>>`
     능력치: str agi tec kno obs neg / 난이도: 쉬움 보통 어려움 "매우 어려움"
3. 상태가 바뀌는 효과는 `js/03_effects.js`의 `setup.ON["패시지 이름"]`에 적습니다.
   패시지 본문에서는 상태를 바꾸지 않습니다(새로고침해도 결과가 바뀌지 않게 하려는 규칙).
4. 장소에서 고를 수 있는 행동은 `js/02_data.js`의 `setup.ACTIONS`에 추가합니다.

## 저장

플레이어의 브라우저(localStorage)에 슬롯별로 자동 저장됩니다. 업데이트로 저장 구조가 바뀌면
`01_core.js`의 `Config.saves.version`을 올리고 `Save.onLoad`에 이전 버전을 고치는 코드를 넣습니다.
