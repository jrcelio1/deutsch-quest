// =============================================================
//  Deutsch Quest — interface principal
//  Telas: Trilha (unidades), Dupla, Perfil e a Sessão de exercícios.
// =============================================================

import { CURRICULUM, ITEM_INDEX } from "../data/curriculum.js";
import * as store from "./store.js";
import { newCard, review, strength } from "./srs.js";
import { buildLesson, buildReview, buildBoss, check, isProduction, ARTICLE } from "./exercises.js";
import { speak, listen } from "./speech.js";
import * as sync from "./sync.js";
import { esc, todayStr, addDays } from "./util.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let tab = "path";

// =============================================================
//  Inicialização
// =============================================================

async function init() {
  $$("#tabbar button").forEach((b) =>
    b.addEventListener("click", () => {
      tab = b.dataset.tab;
      $$("#tabbar button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    })
  );

  store.onChange(() => sync.schedulePush());
  render();

  try {
    await sync.initCloud();
  } catch (e) {
    console.warn("Supabase indisponível — seguindo no modo local.", e);
  }
  render();

  if (!store.getState().profile.name) showOnboarding();

  // Volta para o app depois de um tempo? Atualiza (streak/dia novo, dados da dupla)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && $("#overlay").hidden) {
      sync.pull().finally(render);
    }
  });
}

function render() {
  renderTopbar();
  const view = $("#view");
  if (tab === "path") renderPath(view);
  else if (tab === "duo") renderDuo(view);
  else renderProfile(view);
}

function renderTopbar() {
  const s = store.getState();
  const lv = store.levelInfo();
  const cloud = sync.cloudEnabled()
    ? sync.currentUser() ? `<span class="pill cloud" title="Sincronizado">☁️</span>` : `<span class="pill cloud" title="Sem login: progresso só neste aparelho">💾</span>`
    : "";
  $("#topbar").innerHTML = `
    <div class="brand"><span class="flag"><i></i><i></i><i></i></span>Deutsch Quest</div>
    ${cloud}
    <span class="pill streak ${s.streak.last === todayStr() ? "on" : ""}" title="Dias seguidos">🔥 ${s.streak.count}</span>
    <span class="pill" title="Nível ${lv.level} — ${lv.into}/${lv.need} XP">⭐ Nv ${lv.level}</span>`;
}

// =============================================================
//  Trilha
// =============================================================

function renderPath(view) {
  const s = store.getState();
  const goal = s.profile.dailyGoal;
  const pct = Math.min(1, s.daily.xp / goal);
  const missions = store.todaysMissions();
  const due = store.dueCards();
  const firstName = esc(s.profile.name.split(" ")[0] || "");

  let html = `
    <div class="card goal">
      <div class="ring" style="--p:${pct}"><div>${s.daily.xp}<br><span class="muted">/${goal}</span></div></div>
      <div class="grow">
        <h2>${pct >= 1 ? "Meta batida! 🎉" : `Hallo${firstName ? ", " + firstName : ""}!`}</h2>
        <div class="muted small">${pct >= 1 ? "Tudo a mais agora é bônus para o duelo da semana." : `Faltam <b>${goal - s.daily.xp} XP</b> para a meta de hoje.`}</div>
        ${s._freezeUsed ? `<div class="small" style="margin-top:6px">🧊 Um congelamento salvou seu streak ontem!</div>` : ""}
      </div>
    </div>`;

  if (due.length) {
    html += `
      <button class="card review-cta btn" id="review-btn" style="width:100%;text-align:left;margin-top:12px">
        <span class="big">🧠</span>
        <span class="grow"><b style="font-size:18px">Revisão do dia</b><br><span class="muted small">${due.length} ${due.length === 1 ? "palavra está" : "palavras estão"} quase sendo esquecidas</span></span>
        <span>▶</span>
      </button>`;
  }

  html += `<div class="section-title">Missões de hoje</div><div class="card">`;
  for (const m of missions) {
    html += `
      <div class="mission ${m.done ? "done" : ""}">
        <span class="chk">${m.done ? "✓" : ""}</span>
        <div class="grow">
          <div style="font-weight:800">${m.text}</div>
          <div class="bar green" style="height:6px;margin-top:6px"><i style="width:${(m.progress / m.goal) * 100}%"></i></div>
        </div>
        ${m.done && !m.claimed ? `<button class="btn primary sm" data-claim="${m.id}">+${store.XP.missionBonus} XP</button>` : m.claimed ? `<span class="muted small">pego ✓</span>` : `<span class="muted small" style="font-family:var(--mono)">${m.progress}/${m.goal}</span>`}
      </div>`;
  }
  html += `</div><div class="section-title">Trilha A1.1</div>`;

  CURRICULUM.forEach((unit, i) => {
    const unlocked = store.isUnitUnlocked(i);
    const prog = store.unitProgress(unit);
    const us = s.units[unit.id] || {};
    const bossReady = prog.seen === prog.total;
    const tag = unit.track === "ti" ? `<span class="track-tag">💻 TI</span>` : unit.track === "edu" ? `<span class="track-tag">🍎 Educação</span>` : "";
    html += `
      <div class="card unit ${unlocked ? "" : "locked"} ${us.bossPassed ? "done" : ""}">
        <div class="row">
          <div class="ico">${unlocked ? unit.icon : "🔒"}</div>
          <div class="grow">
            <h3>${unit.title}${tag}${us.bossPassed ? " 👑" : ""}</h3>
            <div class="muted small">${unit.subtitle}</div>
            <div class="bar" style="margin-top:8px"><i style="width:${prog.pct * 100}%"></i></div>
            <div class="muted small" style="margin-top:4px">${prog.seen}/${prog.total} palavras · ${us.lessons || 0} lições</div>
          </div>
        </div>
        ${unlocked ? `
        <div class="actions">
          <button class="btn ghost sm" data-tip="${unit.id}">📖 Dica</button>
          <button class="btn ${bossReady ? "" : "primary"} sm" data-lesson="${unit.id}">${prog.seen === 0 ? "Começar" : bossReady ? "Praticar" : "Continuar"}</button>
          <button class="btn ${bossReady && !us.bossPassed ? "primary" : ""} sm" data-boss="${unit.id}" ${bossReady ? "" : "disabled"} title="${bossReady ? "" : "Aprenda todas as palavras da unidade para liberar"}">⚔️ Chefão</button>
        </div>` : `<div class="muted small" style="margin-top:10px">Vença o chefão anterior para liberar.</div>`}
      </div>`;
  });

  html += `<p class="muted small" style="text-align:center;margin-top:24px">Mais módulos (A1.2 → B1) chegam em breve. 🚧</p>`;
  view.innerHTML = html;

  $("#review-btn", view)?.addEventListener("click", () => startSession(buildReview(store.dueCards())));
  $$("[data-claim]", view).forEach((b) =>
    b.addEventListener("click", () => {
      handleEvents(store.claimMission(b.dataset.claim));
      toast(`Missão completa! +${store.XP.missionBonus} XP`);
      render();
    })
  );
  $$("[data-tip]", view).forEach((b) => b.addEventListener("click", () => showTip(b.dataset.tip)));
  $$("[data-lesson]", view).forEach((b) =>
    b.addEventListener("click", () => {
      const unit = CURRICULUM.find((u) => u.id === b.dataset.lesson);
      const st = store.getState();
      // Primeira vez na unidade: mostra a dica de gramática antes
      if (!st.units[unit.id]?.lessons && !st.cards[unit.items[0].id]) {
        showTip(unit.id, () => startSession(buildLesson(unit)));
      } else startSession(buildLesson(unit));
    })
  );
  $$("[data-boss]", view).forEach((b) =>
    b.addEventListener("click", () => {
      const unit = CURRICULUM.find((u) => u.id === b.dataset.boss);
      startSession(buildBoss(unit));
    })
  );
}

function showTip(unitId, onContinue) {
  const unit = CURRICULUM.find((u) => u.id === unitId);
  const words = unit.items
    .map((it) => `<li><b class="${it.g || ""}">${esc(it.de)}</b> — <span class="muted">${esc(it.pt)}</span></li>`)
    .join("");
  modal(`
    <h3>${unit.icon} ${unit.title}</h3>
    ${unit.tip}
    <details style="margin:8px 0 16px"><summary style="cursor:pointer;font-weight:800">Ver todas as palavras (${unit.items.length})</summary><ul style="padding-left:18px">${words}</ul></details>
    <button class="btn primary block" data-close>${onContinue ? "Bora! ▶" : "Entendi"}</button>
  `, onContinue);
}

// =============================================================
//  Dupla
// =============================================================

async function renderDuo(view) {
  if (!sync.cloudEnabled()) {
    view.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">💞 Modo dupla</h3>
        <p>Para competir e acompanhar o progresso um do outro, conecte o app ao <b>Supabase</b> (gratuito).</p>
        <p class="muted small">Siga o passo a passo no <code>README.md</code> → seção “Supabase”. Depois, preencha <code>js/config.js</code>.</p>
        <p class="muted small">Enquanto isso, o app funciona normalmente no modo local 💾.</p>
      </div>`;
    return;
  }
  if (!sync.currentUser()) {
    view.innerHTML = `<div class="card"><h3 style="margin-top:0">💞 Modo dupla</h3><p class="muted">Entre na sua conta para jogar em dupla e salvar o progresso na nuvem.</p><div id="auth"></div></div>`;
    renderAuth($("#auth", view));
    return;
  }

  view.innerHTML = `<div class="card muted">Carregando dupla…</div>`;
  const s = store.getState();
  await sync.pushNow();
  const [profile, partner] = await Promise.all([sync.getMyProfile(), sync.getPartnerStats()]);
  if (tab !== "duo") return;

  if (!profile?.duo_code) {
    view.innerHTML = `
      <div class="card">
        <h3 style="margin-top:0">💞 Crie sua dupla</h3>
        <p>Um de vocês cria a dupla e manda o código para o outro.</p>
        <button class="btn primary block" id="create-duo">Criar dupla</button>
      </div>
      <div class="card">
        <h3 style="margin-top:0">🔑 Já tem um código?</h3>
        <div class="field"><input id="duo-code" maxlength="8" placeholder="EX: K7P2QW9M" autocomplete="off" style="text-transform:uppercase;font-family:var(--mono);letter-spacing:.15em" /></div>
        <button class="btn block" id="join-duo">Entrar na dupla</button>
        <p class="small" id="duo-err" style="color:var(--bad)"></p>
      </div>`;
    $("#create-duo").onclick = async () => {
      try { await sync.createDuo(); renderDuo(view); } catch (e) { toast("Erro: " + e.message); }
    };
    $("#join-duo").onclick = async () => {
      try { await sync.joinDuo($("#duo-code").value); renderDuo(view); }
      catch (e) { $("#duo-err").textContent = e.message; }
    };
    return;
  }

  const myWeek = store.weekXP();
  let html = "";
  if (!partner) {
    html += `
      <div class="card">
        <h3 style="margin-top:0">Esperando seu par… ⏳</h3>
        <p>Mande este código para ela entrar na dupla (aba <b>Dupla</b> → “Já tem um código?”):</p>
        <div class="code">${esc(profile.duo_code)}</div>
        <button class="btn block" style="margin-top:12px" id="copy-code">Copiar código</button>
      </div>`;
  } else {
    const pName = esc(partner.display_name);
    const myName = esc(s.profile.name || "Você");
    const lead = myWeek === partner.week_xp ? "Empate! 🤝" : myWeek > partner.week_xp ? `${myName} está na frente 🏃` : `${pName} está na frente 🏃‍♀️`;
    const duoStreak = coupleStreak(s.goalDays, partner.goal_days || []);
    html += `
      <div class="section-title">Duelo da semana</div>
      <div class="card">
        <div class="duel">
          <div class="who"><b>${myName}</b><span class="num">${myWeek}</span><div class="muted small">XP</div></div>
          <div class="vs">VS</div>
          <div class="who"><b>${pName}</b><span class="num">${partner.week_xp}</span><div class="muted small">XP</div></div>
        </div>
        <div class="bar" style="margin-top:14px"><i style="width:${(myWeek / Math.max(1, myWeek + partner.week_xp)) * 100}%"></i></div>
        <p style="text-align:center;font-weight:800;margin:12px 0 0">${lead}</p>
        <p class="muted small" style="text-align:center;margin:4px 0 0">Zera toda segunda-feira. Quem perder escolhe o filme / paga o café ☕</p>
      </div>
      <div class="section-title">Juntos</div>
      <div class="card row">
        <span style="font-size:40px">💞</span>
        <div class="grow"><b style="font-size:22px;font-family:var(--mono)">${duoStreak} ${duoStreak === 1 ? "dia" : "dias"}</b>
        <div class="muted small">Streak da dupla: dias em que <b>os dois</b> bateram a meta</div></div>
      </div>
      <div class="card">
        <div class="row"><b class="grow">${pName} hoje</b><span class="muted small">🔥 ${partner.streak} · Nv ${store.levelInfo(partner.xp).level}</span></div>
        <div class="bar green" style="margin-top:10px"><i style="width:${Math.min(100, partner.today_xp)}%"></i></div>
        <div class="muted small" style="margin-top:6px">${partner.today_xp} XP hoje ${partner.today_xp === 0 ? "— que tal dar um empurrãozinho? 😉" : ""}</div>
      </div>`;
  }
  html += `
    <div class="section-title">Configurações da dupla</div>
    <div class="card row"><div class="grow muted small">Código: <code>${esc(profile.duo_code)}</code></div><button class="btn ghost sm" id="leave-duo">Sair da dupla</button></div>`;
  view.innerHTML = html;

  $("#copy-code")?.addEventListener("click", () => {
    navigator.clipboard?.writeText(profile.duo_code).then(() => toast("Código copiado!"));
  });
  $("#leave-duo").onclick = async () => {
    if (!confirm("Sair da dupla? Vocês podem criar outra depois.")) return;
    await sync.leaveDuo();
    renderDuo(view);
  };
}

function coupleStreak(mine, theirs) {
  const a = new Set(mine), b = new Set(theirs);
  let d = todayStr();
  if (!(a.has(d) && b.has(d))) d = addDays(d, -1);
  let n = 0;
  while (a.has(d) && b.has(d)) { n++; d = addDays(d, -1); }
  return n;
}

// =============================================================
//  Perfil / Conta
// =============================================================

function renderProfile(view) {
  const s = store.getState();
  const lv = store.levelInfo();
  const days = store.last7Days();
  const max = Math.max(1, ...days.map((d) => d.xp));
  const wd = ["D", "S", "T", "Q", "Q", "S", "S"];
  const learned = Object.keys(s.cards).length;
  const strong = Object.values(s.cards).filter((c) => strength(c) >= 3).length;

  view.innerHTML = `
    <div class="card">
      <div class="row">
        <span style="font-size:44px">🧑‍🎓</span>
        <div class="grow"><b style="font-size:22px">${esc(s.profile.name || "Sem nome")}</b>
        <div class="muted small">Nível ${lv.level} · ${s.xp} XP no total</div>
        <div class="bar" style="margin-top:8px"><i style="width:${lv.pct * 100}%"></i></div>
        <div class="muted small" style="margin-top:4px">${lv.into}/${lv.need} XP para o nível ${lv.level + 1}</div></div>
      </div>
    </div>
    <div class="stats" style="margin-top:12px">
      <div class="stat"><b>${learned}</b><span>palavras</span></div>
      <div class="stat"><b>${strong}</b><span>dominadas</span></div>
      <div class="stat"><b>${s.streak.best}</b><span>melhor streak</span></div>
    </div>

    <div class="section-title">Últimos 7 dias</div>
    <div class="card"><div class="week">
      ${days.map((d) => {
        const [y, m, dd] = d.date.split("-").map(Number);
        const w = wd[new Date(y, m - 1, dd).getDay()];
        return `<div class="col ${d.xp ? "" : "zero"}" title="${d.xp} XP"><i style="height:${(d.xp / max) * 85}%"></i><span>${w}</span></div>`;
      }).join("")}
    </div><div class="muted small" style="margin-top:8px">🧊 Congelamentos de streak: ${s.streak.freezes} (ganhe 1 a cada 7 dias seguidos)</div></div>

    <div class="section-title">Conquistas</div>
    <div class="ach-grid">
      ${store.ACHIEVEMENTS.map((a) => `<div class="ach ${s.achievements.includes(a.id) ? "" : "off"}"><div class="i">${a.icon}</div><b>${a.name}</b><span>${a.desc}</span></div>`).join("")}
    </div>

    <div class="section-title">Ajustes</div>
    <div class="card">
      <div class="field"><label for="p-name">Seu nome</label><input id="p-name" maxlength="40" value="${esc(s.profile.name)}" /></div>
      <div class="field"><label for="p-goal">Meta diária</label>
        <select id="p-goal">
          ${[[50, "Leve · ~15 min"], [100, "Normal · ~30 min"], [150, "Puxado · ~45 min"], [200, "Intenso · ~60 min"]]
            .map(([v, l]) => `<option value="${v}" ${s.profile.dailyGoal === v ? "selected" : ""}>${v} XP — ${l}</option>`).join("")}
        </select></div>
      <div class="field"><label for="p-rate">Velocidade da voz</label>
        <select id="p-rate">
          ${[[0.7, "Lenta"], [0.9, "Normal"], [1, "Nativa"]].map(([v, l]) => `<option value="${v}" ${s.profile.voiceRate === v ? "selected" : ""}>${l}</option>`).join("")}
        </select></div>
      <div class="field"><label><input type="checkbox" id="p-mic" ${s.profile.mic !== false ? "checked" : ""}/> Exercícios de fala (microfone — funciona melhor no Chrome)</label></div>
      <button class="btn" id="test-voice">🔊 Testar voz alemã</button>
    </div>

    <div class="section-title">Conta</div>
    <div class="card" id="account"></div>

    <div class="section-title">Backup</div>
    <div class="card">
      <p class="muted small" style="margin-top:0">Exporte seu progresso para um arquivo (útil no modo local ou antes de trocar de aparelho).</p>
      <div class="row" style="flex-wrap:wrap">
        <button class="btn sm" id="export">⬇️ Exportar</button>
        <label class="btn sm" style="display:inline-block">⬆️ Importar<input type="file" id="import" accept="application/json" hidden /></label>
        <button class="btn ghost sm" id="reset" style="margin-left:auto">Zerar progresso</button>
      </div>
    </div>`;

  const save = () => { store.persist(); renderTopbar(); };
  $("#p-name").onchange = (e) => {
    s.profile.name = e.target.value.trim().slice(0, 40);
    save();
    sync.updateDisplayName(s.profile.name || "Jogador");
  };
  $("#p-goal").onchange = (e) => { s.profile.dailyGoal = Number(e.target.value); save(); };
  $("#p-rate").onchange = (e) => { s.profile.voiceRate = Number(e.target.value); save(); speak("Guten Tag!", s.profile.voiceRate); };
  $("#p-mic").onchange = (e) => { s.profile.mic = e.target.checked; save(); };
  $("#test-voice").onclick = () => speak("Hallo! Wir lernen zusammen Deutsch.", s.profile.voiceRate);

  $("#export").onclick = () => {
    const blob = new Blob([JSON.stringify(store.getState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `deutsch-quest-${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  $("#import").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (typeof data !== "object" || typeof data.xp !== "number" || typeof data.cards !== "object") throw new Error("arquivo inválido");
      data.owner = sync.currentUser()?.id ?? null;
      store.replaceState(data);
      store.persist();
      toast("Progresso importado!");
      render();
    } catch (err) {
      toast("Não foi possível importar: " + err.message);
    }
  };
  $("#reset").onclick = () => {
    if (!confirm("Apagar TODO o progresso? Isso não pode ser desfeito.")) return;
    store.resetState(sync.currentUser()?.id ?? null);
    render();
  };

  const acc = $("#account");
  if (!sync.cloudEnabled()) {
    acc.innerHTML = `<p class="muted small" style="margin:0">Modo local 💾 — o progresso fica só neste navegador. Configure o Supabase (README) para login e sincronização.</p>`;
  } else if (sync.currentUser()) {
    acc.innerHTML = `<div class="row"><div class="grow small">Logado como <b>${esc(sync.currentUser().email)}</b> ☁️</div><button class="btn ghost sm" id="logout">Sair</button></div>`;
    $("#logout").onclick = async () => { await sync.signOut(); render(); };
  } else {
    renderAuth(acc);
  }
}

function renderAuth(container) {
  container.innerHTML = `
    <form id="auth-form">
      <div class="field"><label for="a-email">E-mail</label><input id="a-email" type="email" autocomplete="email" required /></div>
      <div class="field"><label for="a-pass">Senha (mín. 8 caracteres)</label><input id="a-pass" type="password" minlength="8" autocomplete="current-password" required /></div>
      <div class="row">
        <button class="btn primary grow" type="submit" data-mode="in">Entrar</button>
        <button class="btn grow" type="submit" data-mode="up">Criar conta</button>
      </div>
      <p class="small" id="auth-msg" style="margin-bottom:0"></p>
    </form>`;
  const form = $("#auth-form", container);
  let mode = "in";
  $$("button[type=submit]", form).forEach((b) => b.addEventListener("click", () => (mode = b.dataset.mode)));
  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = $("#a-email", form).value.trim();
    const pass = $("#a-pass", form).value;
    const msg = $("#auth-msg", form);
    msg.style.color = "var(--muted)";
    msg.textContent = "Aguarde…";
    try {
      if (mode === "up") {
        const r = await sync.signUp(email, pass, store.getState().profile.name || "Jogador");
        if (r.needsConfirmation) {
          msg.textContent = "Conta criada! Confirme pelo link enviado ao seu e-mail e depois entre aqui.";
          return;
        }
      } else {
        await sync.signIn(email, pass);
      }
      toast("Conectado ☁️");
      render();
    } catch (err) {
      msg.style.color = "var(--bad)";
      msg.textContent = traduzErro(err.message);
    }
  };
}

function traduzErro(m = "") {
  if (/invalid login/i.test(m)) return "E-mail ou senha incorretos.";
  if (/not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar (veja a caixa de entrada/spam).";
  if (/already registered/i.test(m)) return "Este e-mail já tem conta. Use “Entrar”.";
  if (/rate limit/i.test(m)) return "Muitas tentativas. Espere um pouco e tente de novo.";
  return m;
}

// =============================================================
//  Onboarding
// =============================================================

function showOnboarding() {
  modal(`
    <h3>Willkommen! 🥨</h3>
    <p>Cada dia vocês ganham <b>XP</b> fazendo exercícios curtos. Bata a meta diária para manter o <b>🔥 streak</b>, cumpra missões e derrote o <b>⚔️ chefão</b> de cada unidade.</p>
    <p class="muted small">Dica: digitar e falar dão mais XP que clicar — porque é produzindo que a gente aprende de verdade.</p>
    <div class="field"><label for="ob-name">Como você quer ser chamado(a)?</label><input id="ob-name" maxlength="40" placeholder="Seu nome" /></div>
    <div class="field"><label for="ob-goal">Meta diária</label>
      <select id="ob-goal"><option value="50">50 XP — Leve (~15 min)</option><option value="100" selected>100 XP — Normal (~30 min)</option><option value="150">150 XP — Puxado (~45 min)</option><option value="200">200 XP — Intenso (~60 min)</option></select></div>
    <button class="btn primary block" id="ob-go">Los geht's! ▶</button>
  `);
  $("#ob-go").onclick = () => {
    const s = store.getState();
    s.profile.name = $("#ob-name").value.trim().slice(0, 40) || "Jogador";
    s.profile.dailyGoal = Number($("#ob-goal").value);
    store.persist();
    sync.updateDisplayName(s.profile.name);
    closeModal();
    render();
  };
}

// =============================================================
//  Sessão de exercícios
// =============================================================

let run = null;

function startSession(session) {
  if (!session.exercises.length) { toast("Nada para revisar agora!"); return; }
  run = {
    session,
    queue: [...session.exercises],
    total: session.exercises.filter((e) => e.type !== "intro").length,
    done: 0,
    graded: 0,
    correct: 0,
    combo: 0,
    bestCombo: 0,
    xp: 0,
    hearts: session.hearts ?? null,
    retried: new Set(),
    failed: false,
  };
  const ov = $("#overlay");
  ov.hidden = false;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", onKey);
  nextExercise();
}

function endSessionUI() {
  $("#overlay").hidden = true;
  $("#overlay").innerHTML = "";
  document.body.style.overflow = "";
  document.removeEventListener("keydown", onKey);
  window.speechSynthesis?.cancel();
  run = null;
  render();
}

function sessionShell(inner, { footer = "" } = {}) {
  const pct = run.total ? (run.done / run.total) * 100 : 0;
  const hearts = run.hearts !== null ? `<span class="hearts">${"❤️".repeat(run.hearts)}${"🖤".repeat(3 - run.hearts)}</span>` : "";
  $("#overlay").innerHTML = `
    <div class="session">
      <div class="session-top">
        <button class="icon-btn" id="quit" aria-label="Sair">✕</button>
        <div class="bar"><i style="width:${pct}%"></i></div>
        ${hearts}
        <span class="combo" id="combo">${run.combo >= 3 ? `🔥x${run.combo}` : ""}</span>
      </div>
      <div class="ex">${inner}</div>
      <div class="feedback" id="footer">${footer}</div>
    </div>`;
  $("#quit").onclick = () => {
    if (run.done === 0 || confirm("Sair da sessão? O XP já ganho fica com você.")) endSessionUI();
  };
}

function nextExercise() {
  if (run.failed) return showResult();
  const ex = run.queue.shift();
  if (!ex) return showResult();
  run.current = ex;
  run.response = null;
  run.answered = false;
  const rate = store.getState().profile.voiceRate;
  const R = RENDERERS[ex.type];
  R(ex, rate);
}

function checkButton(label = "Verificar") {
  return `<button class="btn primary block" id="check" disabled>${label}</button>`;
}

function setResponse(v) {
  run.response = v;
  const b = $("#check");
  if (b) b.disabled = v === null || v === "" || (Array.isArray(v) && !v.length);
}

function speakerBtns(text, rate) {
  return `<button class="speaker" data-say="${esc(text)}" aria-label="Ouvir">🔊</button><button class="speaker slow" data-say-slow="${esc(text)}" aria-label="Ouvir devagar">🐢</button>`;
}

function wireSpeakers(rate) {
  $$("[data-say]").forEach((b) => b.addEventListener("click", () => speak(b.dataset.say, rate)));
  $$("[data-say-slow]").forEach((b) => b.addEventListener("click", () => speak(b.dataset.saySlow, 0.6)));
}

function wireCheck() {
  $("#check").onclick = submit;
}

function gTag(item) {
  if (!item.g) return "";
  const label = { m: "der · masculino", f: "die · feminino", n: "das · neutro", pl: "die · plural" }[item.g];
  return `<span class="gtag ${item.g}">${label}</span>`;
}

function optionsHTML(options, cls = "") {
  return `<div class="options ${cls}">${options
    .map((o, i) => `<button class="opt" data-v="${esc(o)}"><kbd>${i + 1}</kbd>${esc(o)}</button>`)
    .join("")}</div>`;
}

function wireOptions() {
  $$(".opt").forEach((b) =>
    b.addEventListener("click", () => {
      if (run.answered) return;
      $$(".opt").forEach((x) => x.classList.remove("sel"));
      b.classList.add("sel");
      setResponse(b.dataset.v);
    })
  );
}

const RENDERERS = {
  intro(ex, rate) {
    const it = ex.item;
    sessionShell(
      `<div class="ex-kind">✨ Palavra nova</div>
       <div class="card intro-card">
         ${gTag(it)}
         <div class="word ${it.g || ""}">${esc(it.de)}</div>
         <div class="trans">${esc(it.pt)}</div>
         <div class="row" style="justify-content:center;margin-top:18px">${speakerBtns(it.de, rate)}</div>
       </div>
       <p class="muted small" style="text-align:center">Ouça e repita em voz alta 🗣️</p>`,
      { footer: `<button class="btn primary block" id="check">Continuar</button>` }
    );
    wireSpeakers(rate);
    speak(it.de, rate);
    $("#check").onclick = () => {
      // registra a palavra como "vista" para o SRS
      const s = store.getState();
      if (!s.cards[it.id]) s.cards[it.id] = newCard();
      store.persist();
      nextExercise();
    };
  },

  mc_de2pt(ex, rate) {
    sessionShell(
      `<div class="ex-kind">O que significa?</div>
       <div class="ex-prompt">${speakerBtns(ex.item.de, rate)}<span class="${ex.item.g || ""}">${esc(ex.item.de)}</span></div>
       ${optionsHTML(ex.options)}`,
      { footer: checkButton() }
    );
    wireSpeakers(rate); wireOptions(); wireCheck();
    speak(ex.item.de, rate);
  },

  mc_pt2de(ex, rate) {
    sessionShell(
      `<div class="ex-kind">Como se diz em alemão?</div>
       <div class="ex-prompt">“${esc(ex.item.pt)}”</div>
       ${optionsHTML(ex.options)}`,
      { footer: checkButton() }
    );
    wireOptions(); wireCheck();
  },

  listen(ex, rate) {
    sessionShell(
      `<div class="ex-kind">🎧 Ouça e escolha o significado</div>
       <div class="row" style="justify-content:center;gap:14px">
         <button class="speaker huge" data-say="${esc(ex.item.de)}" aria-label="Ouvir">🔊</button>
         <button class="speaker slow" data-say-slow="${esc(ex.item.de)}" aria-label="Ouvir devagar">🐢</button>
       </div>
       ${optionsHTML(ex.options)}`,
      { footer: checkButton() }
    );
    wireSpeakers(rate); wireOptions(); wireCheck();
    setTimeout(() => speak(ex.item.de, rate), 250);
  },

  article(ex) {
    sessionShell(
      `<div class="ex-kind">Qual é o artigo?</div>
       <div class="ex-prompt">___ ${esc(ex.noun)}</div>
       <div class="muted">${esc(ex.item.pt)}</div>
       ${optionsHTML(ex.options, "articles")}`,
      { footer: checkButton() }
    );
    wireOptions(); wireCheck();
  },

  type(ex, rate) {
    sessionShell(
      `<div class="ex-kind">⌨️ Escreva em alemão</div>
       <div class="ex-prompt">“${esc(ex.item.pt)}”</div>
       ${ex.item.g ? `<div class="muted small">Inclua o artigo (der/die/das)!</div>` : ""}
       <input class="answer-input" id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Digite aqui…" />
       <div class="umlauts">${["ä", "ö", "ü", "ß"].map((c) => `<button data-ch="${c}">${c}</button>`).join("")}</div>`,
      { footer: checkButton() }
    );
    const input = $("#answer");
    input.focus();
    input.addEventListener("input", () => setResponse(input.value.trim()));
    $$("[data-ch]").forEach((b) =>
      b.addEventListener("click", () => {
        const { selectionStart: a, selectionEnd: z, value } = input;
        input.value = value.slice(0, a) + b.dataset.ch + value.slice(z);
        input.setSelectionRange(a + 1, a + 1);
        input.focus();
        setResponse(input.value.trim());
      })
    );
    wireCheck();
  },

  build(ex, rate) {
    sessionShell(
      `<div class="ex-kind">🧩 Monte a frase em alemão</div>
       <div class="ex-prompt" style="font-size:22px">“${esc(ex.item.pt)}”</div>
       <div class="build-area" id="area"></div>
       <div class="tiles">${ex.tiles.map((t, i) => `<button class="tile" data-i="${i}">${esc(t)}</button>`).join("")}</div>`,
      { footer: checkButton() }
    );
    const picked = [];
    const area = $("#area");
    const update = () => {
      area.innerHTML = picked.map((i) => `<button class="tile" data-back="${i}">${esc(ex.tiles[i])}</button>`).join("");
      $$("[data-i]").forEach((b) => b.classList.toggle("used", picked.includes(Number(b.dataset.i))));
      $$("[data-back]", area).forEach((b) =>
        b.addEventListener("click", () => {
          if (run.answered) return;
          picked.splice(picked.indexOf(Number(b.dataset.back)), 1);
          update();
        })
      );
      setResponse(picked.length ? picked.map((i) => ex.tiles[i]).join(" ") : null);
    };
    $$("[data-i]").forEach((b) =>
      b.addEventListener("click", () => {
        if (run.answered) return;
        picked.push(Number(b.dataset.i));
        update();
      })
    );
    wireCheck();
  },

  speak(ex, rate) {
    sessionShell(
      `<div class="ex-kind">🗣️ Fale em voz alta</div>
       <div class="ex-prompt" style="font-size:24px">${speakerBtns(ex.item.de, rate)}<span>${esc(ex.item.de)}</span></div>
       <div class="muted">${esc(ex.item.pt)}</div>
       <button class="mic" id="mic" aria-label="Gravar">🎙️</button>
       <div class="heard muted" id="heard">Toque no microfone e leia a frase</div>`,
      { footer: `<div class="row"><button class="btn ghost" id="skip">Não posso falar agora</button><button class="btn primary grow" id="check" disabled>Verificar</button></div>` }
    );
    wireSpeakers(rate); wireCheck();
    $("#skip").onclick = () => { run.done++; nextExercise(); };
    $("#mic").onclick = () => {
      const mic = $("#mic");
      mic.classList.add("rec");
      $("#heard").textContent = "Ouvindo…";
      listen({
        onResult: (alts) => {
          // pega a alternativa mais parecida com a resposta esperada
          const best = alts.sort((a, b) => scoreSpeech(ex, b) - scoreSpeech(ex, a))[0];
          $("#heard").textContent = `“${best}”`;
          setResponse(best);
          submit();
        },
        onError: (m) => { $("#heard").textContent = m; },
        onEnd: () => mic.classList.remove("rec"),
      });
    };
  },
};

function scoreSpeech(ex, alt) {
  return check(ex, alt).quality;
}

function submit() {
  if (run.answered || run.response === null) return;
  run.answered = true;
  const ex = run.current;
  const res = check(ex, run.response);
  const s = store.getState();

  run.done = Math.min(run.total, run.done + 1);
  run.graded++;

  // ---- SRS: atualiza o card da palavra (frases não têm card) ----
  if (!ex.item.isSentence && ITEM_INDEX[ex.itemId]) {
    const card = s.cards[ex.itemId] || newCard();
    s.cards[ex.itemId] = review(card, res.quality);
  }

  let events = [];
  if (res.correct) {
    run.correct++;
    run.combo++;
    run.bestCombo = Math.max(run.bestCombo, run.combo);
    let gain = isProduction(ex.type) ? store.XP.production : store.XP.correct;
    if (run.combo >= 5) gain += 5; // bônus de combo
    run.xp += gain;
    events = store.addXP(gain);
    if (isProduction(ex.type)) s.daily.typedCorrect++;
    s.daily.bestCombo = Math.max(s.daily.bestCombo, run.combo);
  } else {
    run.combo = 0;
    if (run.hearts !== null) {
      run.hearts--;
      if (run.hearts <= 0) run.failed = true;
    } else if (!run.retried.has(ex.itemId)) {
      // errou na lição/revisão: o exercício volta no final (uma vez)
      run.retried.add(ex.itemId);
      run.queue.push({ ...ex });
      run.total++;
    }
  }
  store.persist();
  handleEvents(events);

  // ---- marca opções ----
  $$(".opt").forEach((b) => {
    if (b.dataset.v === ex.answer) b.classList.add("right");
    else if (b.classList.contains("sel")) b.classList.add("wrong");
  });

  const solution = ex.type === "type" ? ex.answers[0]
    : ex.type === "article" ? `${ex.answer} ${ex.noun}`
    : ex.type === "build" || ex.type === "speak" ? ex.item.de
    : ex.type === "mc_pt2de" ? ex.answer
    : `${ex.item.de} = ${ex.item.pt}`;

  const praise = ["Sehr gut!", "Super!", "Genau!", "Richtig!", "Toll!", "Klasse!"];
  const footer = $("#footer");
  footer.className = `feedback ${res.correct ? "ok" : "bad"}`;
  footer.innerHTML = `
    <h4>${res.correct ? praise[Math.floor(Math.random() * praise.length)] + (run.combo >= 3 ? ` 🔥x${run.combo}` : "") : "Quase…"}</h4>
    ${!res.correct || ex.type !== "mc_de2pt" ? `<div class="sol">${res.correct ? "" : "Resposta: "}<span class="${ex.item.g || ""}">${esc(solution)}</span> ${ex.item.de ? `<button class="icon-btn" id="fb-say" aria-label="Ouvir">🔊</button>` : ""}</div>` : ""}
    ${res.note ? `<div class="note">${esc(res.note)}</div>` : ""}
    ${!res.correct && run.hearts !== null ? `<div class="note">Você perdeu um ❤️</div>` : ""}
    <button class="btn ${res.correct ? "ok" : "bad"} block" id="next">Continuar</button>`;
  $("#fb-say")?.addEventListener("click", () => speak(ex.item.de, s.profile.voiceRate));
  if (!res.correct || isProduction(ex.type)) speak(ex.item.de, s.profile.voiceRate);
  $("#next").onclick = nextExercise;
  $("#next").focus({ preventScroll: true });

  // atualiza barra e combo no topo
  $(".session-top .bar > i").style.width = `${(run.done / run.total) * 100}%`;
  const c = $("#combo");
  c.textContent = run.combo >= 3 ? `🔥x${run.combo}` : "";
  c.classList.remove("hot"); void c.offsetWidth; if (run.combo >= 3) c.classList.add("hot");
  const h = $(".hearts");
  if (h && run.hearts !== null) h.textContent = "❤️".repeat(Math.max(0, run.hearts)) + "🖤".repeat(3 - Math.max(0, run.hearts));
}

function onKey(e) {
  if (!run) return;
  if (e.key === "Enter") {
    e.preventDefault();
    const next = $("#next");
    if (next) return next.click();
    const chk = $("#check");
    if (chk && !chk.disabled) chk.click();
    return;
  }
  if (/^[1-4]$/.test(e.key) && document.activeElement?.tagName !== "INPUT") {
    $$(".opt")[Number(e.key) - 1]?.click();
  }
}

function showResult() {
  const { session } = run;
  const s = store.getState();
  const acc = run.graded ? Math.round((run.correct / run.graded) * 100) : 100;
  let events = [];
  let title = "", emoji = "", sub = "";

  if (session.kind === "lesson") {
    const us = store.unitState(session.unitId);
    us.lessons++;
    s.daily.lessons++;
    let bonus = store.XP.lessonBonus + (acc === 100 ? store.XP.perfectBonus : 0);
    run.xp += bonus;
    events = store.addXP(bonus);
    emoji = acc === 100 ? "🏆" : acc >= 80 ? "🎉" : "💪";
    title = acc === 100 ? "Perfekt!" : "Lição completa!";
    sub = session.newItems.length ? `${session.newItems.length} palavras novas aprendidas` : "Bom reforço!";
  } else if (session.kind === "review") {
    s.daily.reviews++;
    emoji = "🧠"; title = "Revisão feita!"; sub = "Sua memória agradece.";
  } else if (session.kind === "boss") {
    const us = store.unitState(session.unitId);
    if (!run.failed) {
      const first = !us.bossPassed;
      us.bossPassed = true;
      us.bestBoss = Math.max(us.bestBoss || 0, acc);
      s.daily.bosses++;
      const bonus = first ? store.XP.bossWin : 30;
      run.xp += bonus;
      events = store.addXP(bonus);
      emoji = "👑"; title = "Chefão derrotado!";
      sub = first ? "Próxima unidade liberada!" : "Mandou bem de novo!";
    } else {
      emoji = "💀"; title = "O chefão venceu…"; sub = "Pratique mais um pouco e tente de novo — o XP ganho fica com você.";
    }
  }
  store.persist();
  handleEvents(events);
  const fresh = store.checkAchievements();

  sessionShell(
    `<div class="result">
       <div class="emoji">${emoji}</div>
       <h2>${title}</h2>
       <div class="muted">${sub}</div>
       <div class="stats">
         <div class="stat"><b>+${run.xp}</b><span>XP</span></div>
         <div class="stat"><b>${acc}%</b><span>acertos</span></div>
         <div class="stat"><b>${run.bestCombo}</b><span>combo</span></div>
       </div>
       ${fresh.map((a) => `<div class="card row" style="width:100%"><span style="font-size:32px">${a.icon}</span><div class="grow" style="text-align:left"><b>Conquista: ${a.name}</b><div class="muted small">${a.desc}</div></div></div>`).join("")}
     </div>`,
    { footer: `<button class="btn primary block" id="next">Continuar</button>` }
  );
  $(".session-top .bar > i").style.width = "100%";
  $("#next").onclick = endSessionUI;
  if (!run.failed) confetti();
  sync.schedulePush();
}

function handleEvents(events = []) {
  for (const ev of events) {
    if (ev.type === "level") { toast(`⭐ Subiu para o nível ${ev.level}!`); confetti(); }
    if (ev.type === "goal") { toast("🎯 Meta diária batida!"); confetti(); }
    if (ev.type === "streak" && ev.count > 1) toast(`🔥 ${ev.count} dias seguidos!`);
  }
  renderTopbar();
}

// =============================================================
//  UI helpers: modal, toast, confetti
// =============================================================

let modalCb = null;
function modal(html, onClose) {
  closeModal();
  modalCb = onClose || null;
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.id = "modal";
  bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);
  $$("[data-close]", bg).forEach((b) => b.addEventListener("click", () => {
    const cb = modalCb;
    closeModal();
    cb?.();
  }));
  bg.addEventListener("click", (e) => { if (e.target === bg && !$("#ob-go")) closeModal(); });
}
function closeModal() {
  $("#modal")?.remove();
  modalCb = null;
}

function toast(text) {
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = text;
  $("#toasts").appendChild(t);
  setTimeout(() => t.remove(), 3300);
}

function confetti() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const box = document.createElement("div");
  box.className = "confetti";
  const colors = ["#ffcc33", "#e5484d", "#5b95ff", "#3dd68c", "#ffffff"];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    p.style.animationDelay = Math.random() * 0.4 + "s";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3800);
}

init();
