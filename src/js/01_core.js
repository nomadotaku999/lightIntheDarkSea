/* =====================================================================
   어두운 바다의 등불이 되어 — 비공식 팬게임
   엔진 코어: 설정, 상태, 판정, 시간(붕괴도), 박무현의 기억, 저장
   원칙: 모든 무작위 굴림과 상태 변경은 "클릭하는 순간"(setup.go)에만 일어난다.
         패시지 본문은 상태를 읽기만 한다. (새로고침해도 결과가 바뀌지 않게)
   ===================================================================== */

/* ---------- SugarCube 설정 ---------- */
Config.history.maxStates = 1;          // 되돌리기 없음
Config.history.controls = false;
Config.saves.maxSlotSaves = 6;         // 슬롯 = 캐릭터
Config.saves.maxAutoSaves = 0;
Config.saves.version = 1;
Config.ui.stowBarInitially = true;
Config.passages.nobr = false;
Config.cleanupWikifierOutput = true;

Setting.addToggle("showOdds", {
  label: "선택지 옆에 성공 확률을 숫자로 표시",
  default: true
});

/* 저장 데이터 버전 이행: 업데이트로 항목이 늘어도 기존 저장이 깨지지 않게 */
Save.onLoad.add(function (save) {
  if (!save.version || save.version < 1) {
    /* 향후 버전 이행 코드를 여기에 추가 */
  }
});

const V = () => State.variables;

/* 기본 사이드바를 없애고, 모바일 안전 영역을 쓰도록 뷰포트를 바꾼다 */
UIBar.destroy();
(function () {
  var m = document.querySelector('meta[name="viewport"]');
  if (!m) { m = document.createElement("meta"); m.name = "viewport"; document.head.appendChild(m); }
  m.content = "width=device-width, initial-scale=1, viewport-fit=cover";
})();

/* ---------- 기본 상수 ---------- */
setup.STATS = ["str", "agi", "tec", "kno", "obs", "neg"];
setup.STAT_KO = { str: "근력", agi: "민첩", tec: "기술", kno: "지식", obs: "관찰", neg: "교섭" };
setup.DIFF = { "쉬움": 20, "보통": 0, "어려움": -20, "매우 어려움": -35 };

setup.JOBS = {
  eng: { ko: "엔지니어", base: { str: 50, agi: 35, tec: 55, kno: 50, obs: 35, neg: 25 } },
  sci: { ko: "해양연구팀", base: { str: 25, agi: 35, tec: 40, kno: 60, obs: 55, neg: 35 } },
  min: { ko: "채굴팀", base: { str: 60, agi: 50, tec: 45, kno: 30, obs: 40, neg: 25 } },
  spc: { ko: "특수직", base: { str: 35, agi: 40, tec: 30, kno: 40, obs: 45, neg: 60 } }
};
setup.TEAMS = {
  ga: { ko: "가팀", nat: "한국" },
  na: { ko: "나팀", nat: "일본" },
  da: { ko: "다팀", nat: "러시아" },
  ra: { ko: "라팀", nat: "중국권" },
  ma: { ko: "마팀", nat: "미국" },
  ba: { ko: "바팀", nat: "뉴질랜드" },
  sa: { ko: "사팀", nat: "오스트레일리아" },
  ah: { ko: "아팀", nat: "캐나다" }
};
setup.NATIONS = ["한국", "일본", "러시아", "중국", "미국", "뉴질랜드", "오스트레일리아", "캐나다"];

setup.STAGES = [
  { min: 0, name: "이상 징후" },
  { min: 25, name: "침수 확산" },
  { min: 50, name: "구조 손상" },
  { min: 75, name: "붕괴 임박" }
];

/* ---------- 유틸 ---------- */
setup.rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
setup.pick = arr => arr[Math.floor(Math.random() * arr.length)];
setup.chanceRoll = pct => Math.random() * 100 < pct;
setup.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
setup.shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ---------- 초기화 ---------- */
setup.init = function () {
  const v = V();
  v.slot = null;
  v.started = false;
  v.create = null;
  v.char = null;
  v.meta = null;
  v.run = null;
};

/* ---------- 캐릭터 생성 ---------- */
setup.newCreate = function (slot) {
  const v = V();
  v.slot = slot;
  v.create = { name: "", job: null, team: null, nat: null, pts: { str: 0, agi: 0, tec: 0, kno: 0, obs: 0, neg: 0 } };
};
setup.createLeft = function () {
  const p = V().create.pts;
  return 50 - setup.STATS.reduce((s, k) => s + p[k], 0);
};
setup.createStat = function (k) {
  const c = V().create;
  if (!c.job) return 0;
  return setup.JOBS[c.job].base[k] + c.pts[k];
};
setup.createAdj = function (k, d) {
  const c = V().create;
  if (!c.job) return;
  const next = c.pts[k] + d;
  if (next < 0) return;
  if (d > 0 && setup.createLeft() < d) return;
  if (setup.JOBS[c.job].base[k] + next > 80) return;
  c.pts[k] = next;
};
setup.createReady = function () {
  const c = V().create;
  if (!c || !c.name || !c.name.trim()) return "이름을 입력해 주세요.";
  if (!c.job) return "직군을 골라 주세요.";
  if (c.job === "eng" && !c.team) return "소속 팀을 골라 주세요.";
  if (c.job !== "eng" && !c.nat) return "국적을 골라 주세요.";
  if (setup.createLeft() > 0) return "자유 포인트 " + setup.createLeft() + "점이 남았어요.";
  return null;
};

setup.startGame = function () {
  const v = V(), c = v.create;
  const stats = {};
  setup.STATS.forEach(k => stats[k] = setup.createStat(k));
  v.char = {
    name: c.name.trim(),
    job: c.job,
    team: c.job === "eng" ? c.team : null,
    nat: c.job === "eng" ? setup.TEAMS[c.team].nat : c.nat,
    stats: stats,
    room: setup.rand(1, 79)
  };
  v.meta = {
    loop: 0,
    parkAff: 10,          // 박무현 호감도(회차를 넘어 유지)
    memory: {},           // 박무현이 기억하는 정보 { factId: 회차 }
    rescued: {},          // 누적 구조 기록 { npcId: 처음 구한 회차 }
    history: [],          // 회차 기록
    finished: false,
    ending: null
  };
  v.create = null;
  v.started = true;
  setup.newLoop();
};

setup.jobLabel = function () {
  const ch = V().char;
  if (!ch) return "";
  return ch.job === "eng" ? "엔지니어 " + setup.TEAMS[ch.team].ko : setup.JOBS[ch.job].ko + " · " + ch.nat;
};

setup.homeLoc = function () {
  const ch = V().char;
  if (ch.job === "sci") return "jj_hall";
  if (ch.job === "eng" && ch.team === "ra") return "cr_hall";
  return "bh_hall";
};

/* ---------- 회차 시작 ---------- */
setup.newLoop = function () {
  const v = V(), m = v.meta;
  m.loop += 1;

  /* 박무현의 이번 회차 상태: 기억은 이어지고, 몸과 마음은 매번 다르다 */
  const pMental = setup.rand(35, 100);
  const pConds = [];
  if (Math.random() < 0.45) pConds.push(setup.pick(["그는 이따금 관자놀이를 짓누른다.", "그의 인중에 닦아 낸 코피 자국이 남아 있다.", "잠을 거의 못 잔 얼굴이다.", "그의 손끝이 가늘게 떨린다."]));
  const forgot = [];
  if (pMental < 55) {
    setup.PARK_BASE.forEach(f => { if (Math.random() < 0.4) forgot.push(f); });
  }
  const knowsPlayer = !!m.memory.player;
  const seeking = knowsPlayer && m.parkAff >= 30 && Math.random() < 0.75;

  v.run = {
    turn: 0,
    collapse: 0,
    rate: Math.round((0.9 + Math.random() * 0.7) * 100) / 100,
    hold: 0,
    lastStage: 0,
    loc: setup.homeLoc(),
    hp: 100,
    mental: 100,
    items: {},
    visited: {},
    known: {},            // 이번 회차에 플레이어가 알게 된 것
    done: {},             // 한 번만 일어나는 일
    news: [],
    check: null,
    npcAff: setup.initialAff(),
    park: {
      state: "room",      // room | with | plaza | taken | dead | gone
      loc: "bh_room38",
      mental: pMental,
      conds: pConds,
      forgot: forgot,
      seeking: seeking,
      seekTurn: setup.rand(2, 4),
      leaveTurn: setup.rand(6, 11),
      met: false,
      healed: false,
      fateNote: null
    },
    henry: "asleep",      // asleep | player | park | rescued | gone
    gayoung: "trapped",   // trapped | with | rescued | dead
    gyDeadline: setup.rand(28, 44),
    daWoken: false,
    cult: {
      faction: setup.pick(["A", "B1"]),
      active: setup.rand(22, 48),
      passed: 0,
      lastCheckTurn: -99
    },
    occupied: setup.pick(["bh_port", "jj_port", "hm_port", "cr_port"]),
    naDeal: false,
    board: setup.rollBoard(),
    rescuedNow: [],
    ctx: {},
    deathCause: null,
    epilogue: null
  };
  v.run.visited[v.run.loc] = true;
};

/* 팀 사이의 유대·반감은 호감도 초기값에만 반영 */
setup.initialAff = function () {
  const ch = V().char;
  const a = { hae: 0, na: 0, da: 0, ra: 0, gy: 0 };
  if (ch.team === "ga") { a.hae += 25; a.na -= 10; }
  if (ch.team === "na") { a.na += 35; a.hae -= 5; }
  if (ch.team === "da") { a.da += 35; }
  if (ch.team === "ra") { a.ra += 30; a.na -= 10; }
  if (ch.job === "sci") { a.gy += 15; }
  if (ch.nat === "한국") { a.gy += 5; }
  return a;
};
setup.affBand = function (n) {
  if (n <= -50) return "적대";
  if (n < -10) return "경계";
  if (n < 30) return "중립";
  if (n < 70) return "우호";
  return "신뢰";
};

/* ---------- 붕괴도 ---------- */
setup.stageIdx = function (c) {
  const col = c == null ? V().run.collapse : c;
  if (col >= 75) return 3;
  if (col >= 50) return 2;
  if (col >= 25) return 1;
  return 0;
};
setup.stageName = () => setup.STAGES[setup.stageIdx()].name;
setup.raiseCollapse = function (n) {
  const r = V().run;
  r.collapse = Math.min(100, Math.round((r.collapse + n) * 10) / 10);
};
setup.lowerCollapse = function (n) {
  const r = V().run;
  const floor = setup.STAGES[setup.stageIdx()].min;
  r.collapse = Math.max(floor, Math.round((r.collapse - n) * 10) / 10);
};

/* ---------- 판정 ---------- */
setup.chance = function (stat, diff, ctx) {
  const v = V(), r = v.run;
  let p = v.char.stats[stat] + (setup.DIFF[diff] || 0);
  const st = setup.stageIdx();
  if (st === 2) p -= 10;
  if (st === 3) p -= 20;
  if (r.mental <= 0) p -= 20;
  if (r.henry === "player" && r.park.state !== "with" && (stat === "agi" || stat === "str")) p -= 10;
  if (r.park.state === "with") p += 5;
  if (r.gayoung === "with" && stat === "kno") p += 10;
  if (r.items.pad && ctx === "door") p += 30;
  const bonus = setup.CTX_BONUS[ctx];
  if (bonus) p += bonus(v);
  return setup.clamp(Math.round(p), 5, 95);
};
setup.oddsWord = function (p) {
  if (p >= 75) return "해볼 만하다";
  if (p >= 50) return "반반이다";
  if (p >= 25) return "위험해 보인다";
  return "무모해 보인다";
};

/* ---------- 알게 된 것 / 박무현의 기억 ---------- */
setup.know = function (id) {
  const v = V(), r = v.run;
  if (!setup.FACTS[id]) return;
  const isNew = !r.known[id];
  r.known[id] = true;
  if (r.park.state === "with") setup.remember(id);
  if (isNew) r.news.push("알게 된 것: " + setup.FACTS[id].short);
};
setup.knows = id => !!V().run.known[id];
setup.remember = function (id) {
  const m = V().meta;
  if (setup.PARK_BASE.includes(id)) return;
  if (!m.memory[id]) m.memory[id] = m.loop;
};
setup.parkKnows = function (id) {
  const v = V();
  if (setup.PARK_BASE.includes(id)) return !v.run.park.forgot.includes(id);
  return !!v.meta.memory[id];
};
/* 동행하는 박무현이 기억을 나눠 준다 */
setup.parkShares = function () {
  const v = V(), r = v.run;
  const got = [];
  Object.keys(setup.FACTS).forEach(id => {
    if (setup.parkKnows(id) && !r.known[id] && id !== "player") { r.known[id] = true; got.push(setup.FACTS[id].short); }
  });
  if (got.length) r.news.push("박무현에게 들은 것: " + got.join(", "));
};
setup.unshared = function () {
  const v = V();
  return Object.keys(v.run.known).filter(id => !v.meta.memory[id] && !setup.PARK_BASE.includes(id));
};
setup.parkAff = function (d) {
  const m = V().meta;
  m.parkAff = setup.clamp(m.parkAff + d, -100, 100);
};

/* ---------- 구조 ---------- */
setup.rescue = function (id) {
  const v = V();
  if (!v.run.rescuedNow.includes(id)) v.run.rescuedNow.push(id);
  if (!v.meta.rescued[id]) v.meta.rescued[id] = v.meta.loop;
};

/* ---------- 체력·정신력 ---------- */
setup.hurt = function (n, why) {
  const r = V().run;
  r.hp = Math.max(0, r.hp - n);
  if (r.hp <= 0 && !r.deathCause) r.deathCause = why || "부상";
};
setup.stress = function (n) {
  const r = V().run;
  r.mental = setup.clamp(r.mental - n, 0, 100);
};
setup.heal = function (n) {
  const r = V().run;
  r.hp = Math.min(100, r.hp + n);
};

/* ---------- 시간 흐름 ---------- */
setup.tick = function (turns) {
  const v = V(), r = v.run;
  for (let i = 0; i < turns; i++) {
    r.turn += 1;
    if (r.hold > 0) { r.hold -= 1; }
    else setup.raiseCollapse(r.rate * (r.daWoken ? 0.85 : 1));

    /* 단계가 바뀌면 */
    const st = setup.stageIdx();
    if (st > r.lastStage) {
      r.lastStage = st;
      setup.stress(6);
      r.news.push(setup.STAGE_NEWS[st]);
    }

    /* 김가영: 시간 제한 */
    if (r.gayoung === "trapped" && (r.turn >= r.gyDeadline || r.collapse >= 50)) r.gayoung = "dead";

    /* 박무현이 곁에 없을 때 */
    setup.parkOffscreen();

    /* 주변 위험 */
    const hz = 3 + st * 5;
    if (setup.chanceRoll(hz)) setup.hazard();

    if (r.collapse >= 100 && !r.deathCause) r.deathCause = "collapse";
    if (r.deathCause) break;
  }
};

setup.parkOffscreen = function () {
  const r = V().run, p = r.park;
  if (p.state === "room" && r.turn >= p.leaveTurn) {
    /* 박무현은 알고 있는 대로 80호의 아이부터 챙긴다 */
    p.state = "plaza"; p.loc = "jc_plaza";
    if (r.henry === "asleep" && setup.parkKnows("henry80")) r.henry = "park";
  }
  if (p.state === "plaza") {
    if (r.turn >= r.cult.active && Math.random() < 0.06) {
      p.state = "taken"; p.loc = null; p.fateNote = "taken";
      if (r.henry === "park") r.henry = "gone";
    } else if (setup.stageIdx() >= 3 && Math.random() < 0.05) {
      p.state = "dead"; p.loc = null; p.fateNote = "dead_plaza";
      if (r.henry === "park") r.henry = "gone";
    }
  }
};

setup.hazard = function () {
  const v = V(), r = v.run;
  const h = setup.pick(setup.HAZARDS);
  const p = setup.chance(h.stat, "보통");
  if (Math.random() * 100 < p) {
    r.news.push(h.dodge);
  } else {
    r.news.push(h.hit);
    setup.hurt(h.dmg, "hazard");
    setup.stress(4);
  }
};

/* ---------- 이동과 진행: 모든 변경은 여기서 ---------- */
setup.go = function (target, opt) {
  const v = V(), r = v.run;
  opt = opt || {};
  if (r) {
    r.news = [];
    r.check = opt.check || null;
    if (opt.move) { r.loc = opt.move; }
    if (setup.ON[target]) setup.ON[target](v, opt);
    const rr = v.run;   /* 회차가 새로 시작됐을 수 있으니 다시 읽는다 */
    const turns = opt.turns == null ? 1 : opt.turns;
    if (turns > 0 && !rr.deathCause) setup.tick(turns);
    if (opt.move) rr.visited[opt.move] = true;

    if (rr.deathCause && target !== "사망") {
      setup.ON["사망"](v, {});
      return Engine.play("사망");
    }
    /* 탐사로 돌아갈 때만 끼어드는 사건 */
    if (target === "탐사") {
      const intr = setup.interrupt(opt);
      if (intr) {
        if (setup.ON[intr]) setup.ON[intr](v, {});
        return Engine.play(intr);
      }
    }
  }
  Engine.play(target);
};

setup.interrupt = function (opt) {
  const v = V(), r = v.run;
  for (const e of setup.INTERRUPTS) {
    if (!r.done["intr_" + e.id] && e.when(v, opt)) {
      if (e.once !== false) r.done["intr_" + e.id] = true;
      return e.passage;
    }
  }
  return null;
};

/* ---------- 게임 종료 처리 ---------- */
setup.finishLoop = function (kind) {
  const v = V(), r = v.run, m = v.meta;
  m.history.push({
    loop: m.loop,
    kind: kind,
    cause: r.deathCause,
    loc: r.loc,
    turn: r.turn,
    parkMet: r.park.met,
    parkWith: r.park.state === "with",
    rescued: r.rescuedNow.slice()
  });
  if (r.park.met) setup.remember("player");
};

/* ---------- 저장 ---------- */
setup.saveNow = function () {
  const v = V();
  if (v.slot == null || !v.started || !v.char) return;
  try {
    Save.browser.slot.save(v.slot, v.char.name, {
      name: v.char.name,
      job: setup.jobLabel(),
      loop: v.meta.loop,
      finished: v.meta.finished
    });
  } catch (e) { console.error("저장 실패", e); }
};
setup.afterRender = function () {
  setup.saveNow();
};

setup.slots = function () {
  const out = [];
  const entries = Save.browser.slot.entries();
  for (let i = 0; i < Config.saves.maxSlotSaves; i++) {
    const e = entries.find(x => x.index === i);
    out.push(e ? { index: i, info: e.info } : { index: i, info: null });
  }
  return out;
};
setup.loadSlot = function (i) {
  Save.browser.slot.load(i).then(() => Engine.show()).catch(e => alert("불러오지 못했어요: " + e.message));
};
setup.freeSlot = function () {
  const s = setup.slots().find(x => !x.info);
  return s ? s.index : null;
};
setup.importLoaded = function () {
  const v = V();
  const free = setup.freeSlot();
  if (free == null) { alert("빈 슬롯이 없어요. 슬롯 하나를 지운 뒤 다시 불러와 주세요."); Engine.play("시작"); return; }
  v.slot = free;
  setup.saveNow();
  Engine.show();
};
setup.importCode = function (code) {
  if (!code || !code.trim()) { alert("저장 코드를 붙여 넣어 주세요."); return; }
  Save.base64.load(code.trim()).then(() => setup.importLoaded()).catch(e => alert("코드를 읽지 못했어요: " + e.message));
};
setup.importFile = function (ev) {
  Save.disk.load(ev).then(() => setup.importLoaded()).catch(e => alert("파일을 읽지 못했어요: " + e.message));
};
setup.exportCode = function () {
  const v = V();
  return Save.base64.save({ name: v.char.name, job: setup.jobLabel(), loop: v.meta.loop, finished: v.meta.finished });
};
setup.exportFile = function () {
  const v = V();
  const fname = "어바등_" + v.char.name + "_" + v.meta.loop + "회차";
  try {
    Save.disk.save(fname, { name: v.char.name, job: setup.jobLabel(), loop: v.meta.loop, finished: v.meta.finished });
  } catch (e) { alert("이 환경에서는 파일 저장이 막혀 있어요. 저장 코드 복사를 이용해 주세요."); }
};

/* ---------- 매크로 ---------- */
/* <<go "문구" "패시지" [턴] [이동할 장소] [ctx]>> */
Macro.add("go", {
  handler() {
    const [label, target, turns, move, ctx] = this.args;
    const a = jQuery('<a class="choice" tabindex="0"></a>');
    a.append(jQuery('<span class="choice-label"></span>').text(label));
    if (turns === 0) a.addClass("free");
    a.ariaClick({ one: true }, () => setup.go(target, { turns: turns == null ? 1 : turns, move: move || null, ctx: ctx || null }));
    a.appendTo(this.output);
  }
});

/* <<chk "문구" "능력치" "난이도" "성공 패시지" "실패 패시지" [턴] [ctx]>> */
Macro.add("chk", {
  handler() {
    const [label, stat, diff, okP, ngP, turns, ctx] = this.args;
    const p = setup.chance(stat, diff, ctx);
    const a = jQuery('<a class="choice check" tabindex="0"></a>');
    a.append(jQuery('<span class="choice-label"></span>').text(label));
    const odds = settings.showOdds
      ? setup.STAT_KO[stat] + " " + p + "%"
      : setup.STAT_KO[stat] + " · " + setup.oddsWord(p);
    a.append(jQuery('<span class="odds"></span>').text(odds));
    a.ariaClick({ one: true }, () => {
      const roll = setup.rand(1, 100);
      const ok = roll <= p;
      setup.go(ok ? okP : ngP, {
        turns: turns == null ? 1 : turns,
        ctx: ctx || null,
        check: { stat: stat, p: p, ok: ok, label: label }
      });
    });
    a.appendTo(this.output);
  }
});

/* 코드로 바로 실행하는 버튼(상태 변경 없는 메뉴용) */
Macro.add("btn", {
  tags: null,
  handler() {
    const label = this.args[0];
    const code = this.payload[0].contents;
    const b = jQuery('<button type="button" class="btn"></button>').text(label);
    if (this.args[1]) b.addClass(this.args[1]);
    b.ariaClick(this.shadowHandler(() => { Wikifier.wikifyEval(code); }));
    b.appendTo(this.output);
  }
});

/* 다이얼로그 열기 */
setup.openDialog = function (title, passage) {
  Dialog.create(title, "ubd-dialog");
  Dialog.wiki(Story.get(passage).processText());
  Dialog.open();
};
