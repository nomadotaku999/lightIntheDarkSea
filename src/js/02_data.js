/* =====================================================================
   게임 데이터: 정보(박무현의 기억), 장소, 행동, 게시판, 위험, 끼어드는 사건
   이벤트를 늘릴 때는 여기에 항목을 추가하고, 문장은 story/*.twee 에 쓴다.
   ===================================================================== */

/* ---------- 정보: 알게 되면 박무현에게 전할 수 있다 ---------- */
setup.FACTS = {
  henry80:      { cat: "인물", short: "백호동 80호의 아이", text: "백호동 80호, 원래 빈 방이어야 할 곳에 어린아이가 잠들어 있다." },
  gayoung77:    { cat: "인물", short: "주작동 77호의 구조 요청", text: "주작동 숙소 77호의 문이 열리지 않아 연구원 김가영이 갇혀 있다." },
  kevin:        { cat: "인물", short: "복도의 케빈 윌슨", text: "백호동 탈출정 포트에서 중앙동으로 이어지는 복도에서 마팀 케빈 윌슨이 숨진 채 발견된다. 벽의 쇠손잡이에 머리를 부딪힌 흔적. 이유는 알 수 없다." },
  cult_target:  { cat: "무한교", short: "무한교가 박무현을 찾는다", text: "무한교라 불리는 사람들이 치과의사 박무현을 찾고 있다. 해치려는 게 아니라 '데려가려는' 것 같다." },
  phrase_A:     { cat: "무한교", short: "검문 답: 생존한다", text: "\"우리는?\"이라는 물음에 \"어떠한 상황에서도 생존한다\"고 답하는 무리가 있다." },
  phrase_B1:    { cat: "무한교", short: "검문 답: 과거로 향한다", text: "\"우리는?\"이라는 물음에 \"살기 위해 과거로 향한다\"고 답하는 무리가 있다." },
  checkpoint:   { cat: "무한교", short: "중앙동의 검문", text: "상황이 나빠지면 중앙동 곳곳에서 무한교 사람들이 지나가는 이들을 붙잡고 물음을 던진다." },
  pods_bh:      { cat: "루트", short: "백호동 탈출정 13정 고장", text: "백호동 탈출정 55정 가운데 13정은 사출되지 않는다. 점검 기록에 흔적이 남아 있다." },
  port_na:      { cat: "루트", short: "나팀이 막은 포트", text: "나팀이 탈출정 포트 하나를 점거하고 다른 사람들을 들이지 않는다. 어느 포트인지는 그때그때 다르다." },
  central_stop: { cat: "루트", short: "중앙 엘리베이터의 함정", text: "구조 손상이 시작되면 중앙 엘리베이터는 멈춘다. 대한도에 먼저 올라간 사람들이 기다리고 있을 수도 있다." },
  cargo:        { cat: "루트", short: "주작동 화물 엘리베이터", text: "주작동 연구센터의 화물 엘리베이터는 대한도까지 곧장 올라간다. 연구센터 출입 권한이 필요하다." },
  lifesupport:  { cat: "루트", short: "청룡동 생명유지장치", text: "청룡동 생명유지장치는 러시아에서 들여온 장비라, 엔지니어 다팀이 고치는 법을 안다." },
  pump:         { cat: "루트", short: "현무동 배수 펌프", text: "현무동은 오래된 건물이라 배수 펌프를 수동으로 돌릴 수 있다. 잠시나마 침수를 늦춘다." },
  player:       { cat: "사람", short: "당신", text: "" }
};

/* 박무현이 이전의 긴 루프에서 이미 알고 있던 것(매 회차 기본) */
setup.PARK_BASE = ["henry80", "kevin", "cult_target", "gayoung77"];

/* ---------- 상황 보정 ---------- */
setup.CTX_BONUS = {
  pods: v => {
    const r = v.run;
    let b = 0;
    if (r.loc === "bh_port" && setup.knows("pods_bh")) b += 25;
    if (v.char.job === "eng") b += 10;
    return b;
  },
  life: v => (v.run.daWoken ? 20 : 0) + (v.char.team === "da" ? 15 : 0) + (v.char.job === "eng" ? 5 : 0),
  door: v => (v.char.job === "eng" ? 10 : 0),
  cult: v => (setup.knows("checkpoint") ? 10 : 0),
  na: v => Math.round(v.run.npcAff.na / 3),
  da: v => Math.round(v.run.npcAff.da / 3),
  hae: v => Math.round(v.run.npcAff.hae / 3),
  ambush: v => (setup.knows("central_stop") ? 25 : 0)
};

setup.STAGE_NEWS = [
  "",
  "발목까지 찬 물이 복도를 따라 번져 간다. 어딘가에서 차단벽이 내려가는 소리가 들린다. (침수 확산)",
  "벽이 길게 우는 소리를 낸다. 구간 엘리베이터들이 멈췄다는 안내 방송이 끊기듯 이어진다. (구조 손상)",
  "천장 이음새에서 물줄기가 뿜어져 나온다. 시간이 거의 남지 않았다. (붕괴 임박)"
];

setup.HAZARDS = [
  { stat: "agi", dmg: 12, hit: "천장 패널이 떨어져 어깨를 스쳤다.", dodge: "머리 위에서 패널이 떨어졌다. 간발의 차로 피했다." },
  { stat: "obs", dmg: 8, hit: "물에 잠긴 바닥의 틈을 보지 못해 발목을 삐었다.", dodge: "물 밑 바닥이 꺼진 자리를 먼저 알아채고 돌아갔다." },
  { stat: "agi", dmg: 10, hit: "갑자기 쏟아진 물살에 휩쓸려 벽에 부딪혔다.", dodge: "배관이 터지는 소리에 반사적으로 몸을 낮췄다." },
  { stat: "tec", dmg: 6, hit: "합선된 배전반 근처에서 전기가 튀었다.", dodge: "불꽃이 튀는 배전반의 차단기를 내려 두고 지나갔다." }
];

/* ---------- 장소 ---------- */
setup.LOCS = {
  bh_hall:     { name: "백호동 숙소 복도", area: "백호동", to: { bh_port: 1, bh_corridor: 1 } },
  bh_port:     { name: "백호동 탈출정 포트", area: "백호동", to: { bh_hall: 1, bh_corridor: 1 } },
  bh_corridor: { name: "중앙동으로 가는 복도", area: "백호동", to: { bh_hall: 1, bh_port: 1, jc_plaza: 1 } },
  jc_plaza:    { name: "중앙동 중앙휴게실", area: "중앙동", to: { bh_corridor: 1, jc_elev: 1, jc_dental: 1, cr_bridge: 1, jj_hall: 2, hm_plaza: 2 } },
  jc_elev:     { name: "중앙 엘리베이터", area: "중앙동", to: { jc_plaza: 1 } },
  jc_dental:   { name: "치과 딥 블루", area: "중앙동", to: { jc_plaza: 1 } },
  jj_hall:     { name: "주작동 숙소 복도", area: "주작동", to: { jc_plaza: 2, jj_lab: 1, jj_port: 1 } },
  jj_lab:      { name: "주작동 연구센터", area: "주작동", to: { jj_hall: 1 } },
  jj_port:     { name: "주작동 탈출정 포트", area: "주작동", to: { jj_hall: 1 } },
  cr_bridge:   { name: "청룡동으로 가는 다리", area: "청룡동", to: { jc_plaza: 1, cr_hall: 1 } },
  cr_hall:     { name: "청룡동 숙소 복도", area: "청룡동", to: { cr_bridge: 1, cr_life: 1, cr_port: 1, cr_elev: 1 } },
  cr_life:     { name: "청룡동 생명유지장치실", area: "청룡동", to: { cr_hall: 1 } },
  cr_port:     { name: "청룡동 탈출정 포트", area: "청룡동", to: { cr_hall: 1 } },
  cr_elev:     { name: "청룡동 엘리베이터", area: "청룡동", to: { cr_hall: 1 } },
  hm_plaza:    { name: "현무동 휴게광장", area: "현무동", to: { jc_plaza: 2, hm_pump: 1, hm_port: 1, hm_elev: 1 } },
  hm_pump:     { name: "현무동 배수 펌프실", area: "현무동", to: { hm_plaza: 1 } },
  hm_port:     { name: "현무동 탈출정 포트", area: "현무동", to: { hm_plaza: 1 } },
  hm_elev:     { name: "현무동 엘리베이터", area: "현무동", to: { hm_plaza: 1 } }
};

/* 포트별 고장 탈출정 비율 */
setup.POD_BROKEN = { bh_port: 24, jj_port: 10, cr_port: 12, hm_port: 15 };

/* ---------- 장소에서 할 수 있는 일 ----------
   cond(v) 가 참일 때만 선택지로 나온다. turns: 걸리는 시간 */
setup.ACTIONS = [
  { loc: "bh_hall", label: "38호 문을 두드린다", target: "박무현_만남", turns: 1,
    cond: v => v.run.park.state === "room" },
  { loc: "bh_hall", label: "80호 앞으로 간다", target: "헨리_80호", turns: 1,
    cond: v => v.run.henry === "asleep" && (setup.knows("henry80") || v.run.park.state === "with") },
  { loc: "bh_hall", label: "복도 끝 빈 방들을 살펴본다", target: "백호동_빈방", turns: 1,
    cond: v => v.run.henry === "asleep" && !setup.knows("henry80") && !v.run.done.bh_rooms },
  { loc: "bh_hall", label: "65~69호, 다팀 숙소 문을 두드린다", target: "다팀_깨우기", turns: 1,
    cond: v => !v.run.daWoken && !v.run.done.da_try },
  { loc: "bh_port", label: "탈출정 앞으로 간다", target: "탈출정", turns: 0, cond: v => true },
  { loc: "jc_plaza", label: "휴게실 구석의 박무현에게 다가간다", target: "박무현_만남", turns: 1,
    cond: v => v.run.park.state === "plaza" },
  { loc: "jc_elev", label: "비상 버튼 앞에 선다", target: "중앙엘리베이터", turns: 0, cond: v => true },
  { loc: "jc_dental", label: "진료실 수납장을 뒤진다", target: "치과_수납장", turns: 1,
    cond: v => !v.run.done.dental },
  { loc: "jj_hall", label: "77호 앞으로 간다", target: "김가영_77호", turns: 1,
    cond: v => v.run.gayoung !== "with" && v.run.gayoung !== "rescued" && setup.knows("gayoung77") && !v.run.done.gy_seen_dead },
  { loc: "jj_hall", label: "닫힌 문들 너머 소리에 귀를 기울인다", target: "주작동_귀기울이기", turns: 1,
    cond: v => !setup.knows("gayoung77") && !v.run.done.jj_listen },
  { loc: "jj_lab", label: "화물 엘리베이터로 간다", target: "화물엘리베이터", turns: 0, cond: v => true },
  { loc: "jj_port", label: "탈출정 앞으로 간다", target: "탈출정", turns: 0, cond: v => true },
  { loc: "cr_life", label: "생명유지장치를 들여다본다", target: "생명유지장치", turns: 0,
    cond: v => !v.run.done.life },
  { loc: "cr_port", label: "탈출정 앞으로 간다", target: "탈출정", turns: 0, cond: v => true },
  { loc: "cr_elev", label: "엘리베이터 호출 패널 앞에 선다", target: "구간엘리베이터", turns: 0, cond: v => true },
  { loc: "hm_plaza", label: "구석에 모인 사람들의 말을 엿듣는다", target: "현무동_엿듣기", turns: 1,
    cond: v => v.run.turn >= v.run.cult.active - 6 && !v.run.done.hm_listen },
  { loc: "hm_pump", label: "배수 펌프를 수동으로 돌린다", target: "배수펌프", turns: 0,
    cond: v => !v.run.done.pump },
  { loc: "hm_port", label: "탈출정 앞으로 간다", target: "탈출정", turns: 0, cond: v => true },
  { loc: "hm_elev", label: "엘리베이터 호출 패널 앞에 선다", target: "구간엘리베이터", turns: 0, cond: v => true }
];

/* 어디서든 할 수 있는 일 */
setup.COMMON = [
  { label: "박무현에게 지금까지 알게 된 것을 말한다", target: "박무현_알림", turns: 0,
    cond: v => v.run.park.state === "with" && setup.unshared().length > 0 },
  { label: "박무현에게 상처를 봐 달라고 한다", target: "박무현_치료", turns: 1,
    cond: v => v.run.park.state === "with" && !v.run.park.healed && v.run.hp < 75 },
  { label: "구급상자를 쓴다", target: "구급상자", turns: 1,
    cond: v => v.run.items.medkit && v.run.hp < 90 },
  { label: "잠시 숨을 고른다", target: "휴식", turns: 1, cond: v => true }
];

setup.actionsHere = function () {
  const v = V();
  return setup.ACTIONS.filter(a => a.loc === v.run.loc && a.cond(v));
};
setup.commonHere = function () {
  const v = V();
  return setup.COMMON.filter(a => a.cond(v));
};
setup.movesHere = function () {
  const v = V();
  const to = setup.LOCS[v.run.loc].to;
  return Object.keys(to).map(k => ({ id: k, name: setup.LOCS[k].name, area: setup.LOCS[k].area, cost: to[k], seen: !!v.run.visited[k] }));
};

/* ---------- 도착하면 일어나는 일 (첫 방문 등) ---------- */
setup.ARRIVALS = [
  { id: "kevin", passage: "케빈윌슨", when: v => v.run.loc === "bh_corridor" },
  { id: "haeryang", passage: "신해량", when: v => v.run.loc === "bh_hall" && v.run.turn >= 2 && v.run.turn <= 14 && Math.random() < 0.45 },
  { id: "checkpoint", passage: "검문", once: false,
    when: v => (v.run.loc === "jc_plaza" || v.run.loc === "jc_elev") && v.run.turn >= v.run.cult.active
      && v.run.turn - v.run.cult.lastCheckTurn > 10 && Math.random() < 0.5 },
  { id: "da_lifesupport", passage: "다팀_생명유지장치", when: v => v.run.loc === "cr_life" && v.run.daWoken && !v.run.done.life }
];

/* ---------- 탐사로 돌아갈 때 끼어드는 사건 ---------- */
setup.INTERRUPTS = [
  { id: "park_seek", passage: "박무현_찾아옴",
    when: v => v.run.park.seeking && v.run.park.state === "room" && v.run.turn >= v.run.park.seekTurn },
  { id: "arrival", passage: null, once: false, when: () => false } /* 자리 표시 */
];
/* 도착 사건은 이동했을 때만 검사 */
const _baseInterrupt = setup.interrupt;
setup.interrupt = function (opt) {
  const v = V(), r = v.run;
  const hit = _baseInterrupt(opt);
  if (hit) return hit;
  if (opt && opt.move) {
    for (const a of setup.ARRIVALS) {
      const key = "arr_" + a.id;
      if (a.once === false || !r.done[key]) {
        if (a.when(v)) { if (a.once !== false) r.done[key] = true; return a.passage; }
      }
    }
  }
  return null;
};

/* ---------- 게시판 ---------- */
setup.BOARD = {
  help:    { title: "HELP", author: "(익명)", body: "주작동 숙소 77호. 문이 안 열려요. 경보 울렸는데 우리 방만 그대로예요. 물이 조금씩 들어와요. 누구든 봐 주세요.", fact: "gayoung77", always: true },
  pods:    { title: "백호동 탈출정 점검 기록 공유", author: "사팀", body: "지난달 점검 때 백호동 포트 55정 중 13정 부적합 판정 받은 거 수리 안 됐음. 번호 확인하고 타세요. 초록불 안 들어오는 거 타지 마세요.", fact: "pods_bh" },
  central: { title: "중앙 엘리베이터 정상 운행 중", author: "(익명)", body: "지금 중앙 엘리베이터 멀쩡하게 움직입니다. 다들 중앙동으로 모이세요. 대한도에서 사람들이 기다리고 있어요.", fact: "central_stop" },
  dentist: { title: "치과 선생님 보신 분", author: "(익명)", body: "딥 블루 치과 박무현 선생님 찾습니다. 보시면 중앙동으로 모시고 와 주세요. 꼭 모셔야 합니다. 꼭.", fact: "cult_target" },
  port:    { title: "포트 막혔음", author: "바팀", body: "", fact: "port_na", dyn: "port" },
  life:    { title: "청룡동 생명유지장치 경고등", author: "아팀", body: "청룡동 장치실 경고등 전부 빨간불. 다팀 사람들 아는 사람 있으면 좀 깨워 주세요. 저거 러시아 장비라 우리는 손을 못 대요.", fact: "lifesupport" },
  cargo:   { title: "연구센터 화물칸", author: "연구팀", body: "주작동 연구센터 화물 엘리베이터는 대한도 직통이에요. 출입증 없는 분은 연구팀 사람이랑 같이 오세요.", fact: "cargo" },
  tarot:   { title: "오늘의 카드", author: "아팀 카밀라", body: "", dyn: "tarot" },
  pump:    { title: "현무동 펌프 누가 좀", author: "채굴팀", body: "현무동 배수 펌프 자동이 죽었어요. 수동 레버 돌리면 한동안은 버팁니다. 팔 힘 좋은 사람 와 주세요.", fact: "pump" }
};
setup.rollBoard = function () {
  const opt = setup.shuffle(["pods", "central", "dentist", "port", "life", "cargo", "tarot", "pump"]).slice(0, 4);
  return ["help"].concat(opt);
};
setup.boardBody = function (id) {
  const r = V().run, p = setup.BOARD[id];
  if (p.dyn === "port") {
    return "나팀 사람들이 " + setup.LOCS[r.occupied].name + " 입구 막고 있음. 자기들 먼저 다 타고 나머지는 알아서 하라고 함. 다른 데로 돌아가요.";
  }
  if (p.dyn === "tarot") {
    const fast = r.rate >= 1.3;
    const early = r.cult.active <= 32;
    return (fast ? "탑이 나왔어요. 무너지는 건 생각보다 빠를 거예요. " : "절제가 나왔어요. 서두르지 않아도 되는 날이에요, 아직은. ")
      + (early ? "그리고 달이 거꾸로 섰네요. 누군가 일찍부터 움직이고 있어요." : "달은 아직 뒤집히지 않았어요. 수상한 사람들은 조금 늦게 움직일 거예요.");
  }
  return p.body;
};
setup.readBoard = function () {
  const r = V().run;
  r.board.forEach(id => {
    const p = setup.BOARD[id];
    if (id === "help" && r.gayoung !== "trapped") return;
    if (p.fact) setup.know(p.fact);
  });
};

/* ---------- 구조 대상 이름 ---------- */
setup.PEOPLE = {
  henry: "헨리",
  gayoung: "김가영",
  park: "박무현"
};
