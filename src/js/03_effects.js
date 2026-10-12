/* =====================================================================
   패시지로 넘어가는 순간 적용되는 효과.
   키 = 도착할 패시지 이름. 패시지 본문은 이 결과를 읽어서 보여 주기만 한다.
   ===================================================================== */

setup.henryInGroup = function () {
  const r = V().run;
  return r.henry === "player" || (r.henry === "park" && r.park.state === "with");
};
setup.companions = function () {
  const r = V().run, out = [];
  if (r.park.state === "with") out.push("park");
  if (setup.henryInGroup()) out.push("henry");
  if (r.gayoung === "with") out.push("gayoung");
  return out;
};

setup.ON = {
  "게시판": v => setup.readBoard(),

  /* 박무현 */
  "박무현_만남": v => {
    const r = v.run, p = r.park;
    p.met = true;
    r.ctx.parkRecog = !!v.meta.memory.player;
    if (v.meta.parkAff >= -30) {
      p.state = "with"; p.loc = null;
      setup.parkShares();
      if (r.ctx.parkRecog) setup.parkAff(2);
      r.ctx.parkJoined = true;
    } else {
      r.ctx.parkJoined = false;
    }
  },
  "박무현_찾아옴": v => {
    const r = v.run, p = r.park;
    p.met = true; p.state = "with"; p.loc = null;
    setup.parkShares();
    setup.parkAff(3);
  },
  "박무현_알림": v => {
    const ids = setup.unshared();
    v.run.ctx.told = ids.map(id => setup.FACTS[id].short);
    ids.forEach(id => setup.remember(id));
    if (ids.length) setup.parkAff(Math.min(6, ids.length * 2));
  },
  "박무현_치료": v => { setup.heal(25); v.run.park.healed = true; },
  "구급상자": v => { setup.heal(30); delete v.run.items.medkit; },
  "휴식": v => { v.run.mental = Math.min(100, v.run.mental + 10); setup.heal(3); },
  "치과_수납장": v => { v.run.done.dental = true; v.run.items.medkit = true; },

  /* 헨리 */
  "헨리_80호": v => setup.know("henry80"),
  "헨리_업기": v => {
    const r = v.run;
    r.henry = r.park.state === "with" ? "park" : "player";
    setup.stress(-5);
  },
  "백호동_빈방": v => { v.run.done.bh_rooms = true; },
  "백호동_빈방_발견": v => setup.know("henry80"),

  /* 다팀 */
  "다팀_깨우기": v => { v.run.done.da_try = true; },
  "다팀_깨움": v => {
    v.run.daWoken = true; v.run.npcAff.da += 10;
    setup.know("lifesupport");
  },
  "다팀_실패": v => { v.run.npcAff.da -= 5; },

  /* 케빈 윌슨 */
  "케빈윌슨": v => { setup.know("kevin"); setup.stress(8); },

  /* 신해량 */
  "신해량": v => { v.run.ctx.haeTeam = v.char.team === "ga"; },
  "신해량_성공": v => {
    v.run.items.pad = true; v.run.npcAff.hae += 10;
    setup.know("pods_bh");
  },
  "신해량_실패": v => setup.know("pods_bh"),

  /* 김가영 */
  "주작동_귀기울이기": v => { v.run.done.jj_listen = true; },
  "주작동_발견": v => setup.know("gayoung77"),
  "김가영_77호": v => {
    if (v.run.gayoung === "dead") { v.run.done.gy_seen_dead = true; setup.stress(15); }
  },
  "김가영_문실패": v => setup.hurt(4, "hazard"),
  "김가영_구출": v => {
    v.run.gayoung = "with";
    v.run.npcAff.gy += 20;
    setup.parkAff(4);
  },

  /* 설비 */
  "생명유지장치_성공": v => {
    v.run.done.life = true;
    setup.lowerCollapse(8);
    setup.parkAff(2);
  },
  "생명유지장치_실패": v => {
    const r = v.run;
    r.done.lifeFail = (r.done.lifeFail || 0) + 1;
    if (r.done.lifeFail >= 2) r.done.life = true;
    setup.raiseCollapse(3);
    setup.hurt(6, "hazard");
  },
  "배수펌프_성공": v => { v.run.done.pump = true; v.run.hold += 6; setup.know("pump"); },
  "배수펌프_실패": v => {
    const r = v.run;
    r.done.pumpFail = (r.done.pumpFail || 0) + 1;
    if (r.done.pumpFail >= 2) r.done.pump = true;
    setup.hurt(8, "hazard");
  },

  /* 현무동 */
  "현무동_엿듣기": v => { v.run.done.hm_listen = true; },
  "엿듣기_성공": v => {
    setup.know("checkpoint");
    setup.know("phrase_" + v.run.cult.faction);
    setup.know("cult_target");
  },

  /* 무한교 검문 */
  "검문": v => {
    const r = v.run;
    r.cult.lastCheckTurn = r.turn;
    setup.know("checkpoint");
  },
  "검문_답": (v, opt) => {
    const r = v.run;
    const ok = opt.ctx === r.cult.faction;
    r.ctx.cpOk = ok;
    if (ok) { r.cult.passed += 1; }
    else {
      setup.hurt(30, "cult");
      r.ctx.cpTook = r.park.state === "with";
      if (r.ctx.cpTook) setup.parkTaken("taken");
    }
  },
  "검문_통과": v => {
    const r = v.run;
    r.cult.passed += 1;
    setup.know("phrase_" + r.cult.faction);
  },
  "검문_도주": v => { setup.stress(5); },
  "검문_실패": v => {
    const r = v.run;
    setup.hurt(25, "cult");
    r.ctx.parkLost = false;
    if (r.park.state === "with" && Math.random() < 0.5) { setup.parkTaken("taken"); r.ctx.parkLost = true; }
  },
  "검문_넘김": v => {
    setup.parkTaken("handed");
    setup.parkAff(-45);
    setup.stress(20);
  },

  /* 탈출정 */
  "탈출정": v => { v.run.ctx.podChecked = null; },
  "나팀_통과": v => { v.run.naDeal = true; v.run.npcAff.na += 5; setup.know("port_na"); },
  "나팀_거절": v => { setup.know("port_na"); setup.hurt(5, "hazard"); v.run.npcAff.na -= 10; },
  "탈출정_확인": v => { v.run.ctx.podChecked = true; },
  "탈출정_확인실패": v => { v.run.ctx.podChecked = false; },
  "탈출정_헨리": v => {
    const r = v.run;
    r.henry = "rescued"; setup.rescue("henry");
    setup.parkAff(8);
  },
  "탈출정_김가영": v => {
    const r = v.run;
    r.gayoung = "rescued"; setup.rescue("gayoung");
    setup.parkAff(4);
  },
  "탈출정_탑승": v => {
    const r = v.run;
    const broken = r.ctx.podChecked ? 3 : setup.POD_BROKEN[r.loc];
    if (Math.random() * 100 >= broken) r.ctx.pod = "ok";
    else r.ctx.pod = Math.random() < 0.45 ? "stuck" : "fatal";
    if (r.ctx.pod === "stuck") setup.hurt(10, "pod");
    if (r.ctx.pod === "fatal") r.pendingDeath = "pod";
  },

  /* 중앙 엘리베이터 */
  "중앙엘리베이터_탑승": v => {
    const r = v.run;
    const stop = r.collapse * 0.8;
    if (Math.random() * 100 < stop) { r.ctx.elev = "stop"; r.pendingDeath = "elevator"; }
    else {
      r.ctx.elev = "up";
      r.ctx.ambush = r.turn >= r.cult.active - 4 && Math.random() < 0.6;
    }
  },
  "매복_실패": v => {
    const r = v.run;
    setup.hurt(45, "ambush");
    r.ctx.ambushTook = r.park.state === "with";
    if (r.ctx.ambushTook) setup.parkTaken("taken");
  },

  /* 화물·구간 엘리베이터 */
  "화물_접근실패": v => { setup.hurt(3, "hazard"); },
  "구간_실패": v => { setup.hurt(10, "hazard"); setup.raiseCollapse(2); },

  /* 결말 */
  "해변": (v, opt) => {
    const r = v.run, m = v.meta;
    if (m.finished) return;
    const group = opt.ctx === "group";
    if (group) {
      if (r.gayoung === "with") { r.gayoung = "rescued"; setup.rescue("gayoung"); }
      if (setup.henryInGroup()) { r.henry = "rescued"; setup.rescue("henry"); }
    }
    r.ctx.parkTogether = group && r.park.state === "with";
    r.ctx.route = opt.ctx;
    setup.finishLoop("escape");
    m.finished = true;
    m.ending = {
      loop: m.loop,
      route: opt.ctx,
      parkTogether: r.ctx.parkTogether,
      rescued: Object.keys(m.rescued)
    };
  },

  "사망": v => {
    const r = v.run;
    if (r.epilogue) return;
    if (!r.deathCause) r.deathCause = r.pendingDeath || "unknown";
    r.epilogue = setup.makeEpilogue();
    setup.finishLoop("death");
  },

  "회차시작": (v, opt) => {
    if (opt.ctx === "next") setup.newLoop();
  }
};

setup.parkTaken = function (kind) {
  const r = V().run;
  r.park.state = "taken"; r.park.loc = null; r.park.fateNote = kind;
  if (r.henry === "park") r.henry = "player";
};

setup.DEATH_TEXT = {
  collapse: "해저기지가 무너졌다.",
  hazard: "몸이 더는 버티지 못했다.",
  pod: "탈출정은 끝내 바다 위로 떠오르지 못했다.",
  elevator: "멈춰 선 엘리베이터 안으로 물이 들어찼다.",
  cult: "총성이 울렸다.",
  ambush: "대한도에 닿기 직전, 모든 것이 끊겼다.",
  unknown: "어둠이 내려앉았다."
};

/* 플레이어가 죽은 뒤, 박무현의 남은 이야기를 짧게 만든다. 끝은 늘 같다. */
setup.makeEpilogue = function () {
  const r = V().run, p = r.park;
  const P = setup.pick;
  const lines = [];
  const place = P(["청룡동 쪽 다리", "현무동으로 가는 긴 복도", "중앙 엘리베이터 앞", "주작동 연구센터 입구", "백호동 탈출정 포트"]);
  const block = P(["차오르는 물", "내려앉은 차단벽", "무너진 천장", "푸른 천을 두른 사람들"]);

  if (p.state === "with") {
    lines.push(P([
      "당신이 쓰러진 자리에서 박무현은 한참 동안 일어나지 못했다.",
      "박무현은 당신의 맥을 두 번 짚었다. 두 번 다 같은 결과였다.",
      "박무현은 당신의 눈을 감겨 주고, 입술을 한 번 깨물었다."
    ]));
    lines.push(P([
      "그는 남은 사람들을 데리고 " + place + "로 향했다.",
      "그는 혼자서 " + place + "까지 걸었다. 발소리만 복도에 남았다.",
      "그는 당신이 가려던 길을 대신 걸어 " + place + "에 닿았다."
    ]));
    lines.push(block + "이 그의 앞을 가로막았다.");
  } else if (p.state === "taken") {
    lines.push(p.fateNote === "handed"
      ? "당신이 넘긴 사람은 푸른 천이 드리운 중앙동으로 끌려갔다. 그는 끝까지 뒤를 돌아보지 않았다."
      : "무한교 사람들은 그를 푸른 천이 드리운 중앙동으로 데려갔다.");
    lines.push(P([
      "보석과 꽃에 둘러싸인 채, 그는 누군가의 소원을 들어줄 수 없다는 말만 되풀이했다.",
      "사람들은 그를 떠받들었고, 동시에 어디에도 가지 못하게 했다.",
      "그는 틈을 노려 빠져나왔지만, 그 틈은 너무 늦게 열렸다."
    ]));
  } else if (p.state === "dead") {
    lines.push("그는 이미 중앙동 어딘가에서 숨을 거둔 뒤였다. 당신은 그 사실을 알지 못했다.");
  } else {
    lines.push(P([
      "그 시각 박무현은 " + (r.henry === "park" ? "잠든 아이를 업고 " : "") + place + "를 지나고 있었다.",
      "박무현은 아는 길을 전부 더듬어 " + place + "까지 갔다.",
      "박무현은 당신이라는 사람이 있었다는 것조차 모른 채 " + place + "로 뛰었다."
    ]));
    lines.push(block + "이 그의 앞을 가로막았다.");
  }
  lines.push("박무현도 끝내 대한도의 해변에 닿지 못했다.");
  return lines;
};

setup.histLine = function (h) {
  const where = setup.LOCS[h.loc] ? setup.LOCS[h.loc].name : "어딘가";
  const res = h.rescued && h.rescued.length ? " 그 회차에 " + h.rescued.map(id => setup.PEOPLE[id]).join(", ") + "을(를) 내보냈다." : "";
  if (h.kind === "escape") return h.loop + "회차. 당신은 끝내 빠져나갔다." + res;
  return h.loop + "회차. 당신은 " + where + "에서 쓰러졌다." + (h.parkWith ? " 그는 곁에 있었다." : " 그는 나중에야 그 사실을 알았다.") + res;
};
