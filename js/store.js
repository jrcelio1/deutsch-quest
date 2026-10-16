// =============================================================
//  Estado do jogador: XP, nível, streak, missões, cards de revisão.
//  Fica salvo no localStorage do navegador e, se o Supabase estiver
//  configurado, é sincronizado na nuvem (ver sync.js).
// =============================================================

import { todayStr, addDays, daysBetween, weekStart } from "./util.js";
import { CURRICULUM } from "../data/curriculum.js";

const KEY = "dq_state_v1";
const listeners = new Set();

export const XP = {
  correct: 10,
  production: 15, // digitar, montar frase, falar: vale mais (produzir > reconhecer)
  lessonBonus: 20,
  perfectBonus: 10,
  bossWin: 100,
  missionBonus: 25,
};

function defaultState() {
  return {
    version: 1,
    owner: null, // id do usuário no Supabase (null = modo local)
    profile: { name: "", dailyGoal: 100, voiceRate: 0.9 },
    xp: 0,
    streak: { count: 0, best: 0, last: null, freezes: 1 },
    daily: freshDaily(),
    history: {}, // { 'YYYY-MM-DD': xp }
    goalDays: [], // dias em que bateu a meta
    cards: {},
    units: {},
    achievements: [],
    updatedAt: 0,
  };
}

function freshDaily() {
  return {
    date: todayStr(),
    xp: 0,
    lessons: 0,
    reviews: 0,
    typedCorrect: 0,
    bestCombo: 0,
    bosses: 0,
    claimed: [],
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn("Estado local corrompido, recomeçando.", e);
  }
  return defaultState();
}

function migrate(s) {
  const base = defaultState();
  return {
    ...base,
    ...s,
    profile: { ...base.profile, ...(s.profile || {}) },
    streak: { ...base.streak, ...(s.streak || {}) },
    daily: { ...freshDaily(), ...(s.daily || {}) },
  };
}

export function getState() {
  rolloverDay();
  return state;
}

export function replaceState(s) {
  state = migrate(s);
  persist(false);
}

export function resetState(owner = null) {
  state = defaultState();
  state.owner = owner;
  persist();
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function persist(touch = true) {
  if (touch) state.updatedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Não foi possível salvar no localStorage", e);
  }
  listeners.forEach((fn) => fn(state));
}

// Virou o dia? Zera o "daily" e verifica se o streak quebrou.
function rolloverDay() {
  const today = todayStr();
  if (state.daily.date === today) return;
  state.daily = freshDaily();

  const last = state.streak.last;
  if (last) {
    const gap = daysBetween(last, today);
    if (gap === 2 && state.streak.freezes > 0) {
      // Perdeu exatamente 1 dia: usa um "congelamento" de streak
      state.streak.freezes -= 1;
      state.streak.last = addDays(today, -1);
      state._freezeUsed = true;
    } else if (gap > 1) {
      state.streak.count = 0;
    }
  }
  persist();
}

// ---------- XP, nível e streak ----------

export function levelInfo(xp = state.xp) {
  // Cada nível pede um pouco mais de XP que o anterior
  let level = 1;
  let need = 150;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need = Math.round(need * 1.15);
  }
  return { level, into: rest, need, pct: rest / need };
}

export function addXP(amount) {
  rolloverDay();
  const before = levelInfo().level;
  const goal = state.profile.dailyGoal;
  const wasBelowGoal = state.daily.xp < goal;

  state.xp += amount;
  state.daily.xp += amount;
  const t = todayStr();
  state.history[t] = (state.history[t] || 0) + amount;

  const events = [];
  // Primeira atividade do dia mantém/aumenta o streak
  if (state.streak.last !== t) {
    const gap = state.streak.last ? daysBetween(state.streak.last, t) : 99;
    state.streak.count = gap === 1 ? state.streak.count + 1 : 1;
    state.streak.last = t;
    state.streak.best = Math.max(state.streak.best, state.streak.count);
    // A cada 7 dias de streak ganha um congelamento (máx. 2)
    if (state.streak.count % 7 === 0) state.streak.freezes = Math.min(2, state.streak.freezes + 1);
    events.push({ type: "streak", count: state.streak.count });
  }
  if (wasBelowGoal && state.daily.xp >= goal) {
    if (!state.goalDays.includes(t)) state.goalDays.push(t);
    state.goalDays = state.goalDays.slice(-120);
    events.push({ type: "goal" });
  }
  const after = levelInfo().level;
  if (after > before) events.push({ type: "level", level: after });
  return events;
}

export function weekXP(history = state.history) {
  const start = weekStart();
  return Object.entries(history)
    .filter(([d]) => d >= start)
    .reduce((sum, [, v]) => sum + v, 0);
}

export function last7Days(history = state.history) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(todayStr(), -i);
    out.push({ date: d, xp: history[d] || 0 });
  }
  return out;
}

// ---------- Progresso nas unidades ----------

export function unitProgress(unit) {
  const seen = unit.items.filter((it) => state.cards[it.id]).length;
  return { seen, total: unit.items.length, pct: seen / unit.items.length };
}

export function unitState(unitId) {
  return (state.units[unitId] ||= { lessons: 0, bossPassed: false, bestBoss: 0 });
}

export function isUnitUnlocked(index) {
  if (index === 0) return true;
  const unit = CURRICULUM[index];
  // Trilhas especiais (TI / Educação) abrem juntas depois da última unidade "base"
  if (unit.track) {
    const lastBase = [...CURRICULUM.slice(0, index)].reverse().find((u) => !u.track);
    return !!state.units[lastBase.id]?.bossPassed;
  }
  return !!state.units[CURRICULUM[index - 1].id]?.bossPassed;
}

export function dueCards() {
  const t = todayStr();
  return Object.entries(state.cards)
    .filter(([, c]) => c.due <= t)
    .map(([id]) => id);
}

// ---------- Missões diárias ----------

const MISSION_POOL = [
  { id: "lessons2", text: "Complete 2 lições", check: (d) => d.lessons >= 2, goal: 2, val: (d) => d.lessons },
  { id: "review1", text: "Faça 1 sessão de revisão", check: (d) => d.reviews >= 1, goal: 1, val: (d) => d.reviews },
  { id: "typed8", text: "Acerte 8 respostas digitadas/faladas", check: (d) => d.typedCorrect >= 8, goal: 8, val: (d) => d.typedCorrect },
  { id: "combo10", text: "Faça um combo de 10 acertos", check: (d) => d.bestCombo >= 10, goal: 10, val: (d) => d.bestCombo },
  { id: "xp150", text: "Ganhe 150 XP hoje", check: (d) => d.xp >= 150, goal: 150, val: (d) => d.xp },
  { id: "lessons3", text: "Complete 3 lições", check: (d) => d.lessons >= 3, goal: 3, val: (d) => d.lessons },
  { id: "typed15", text: "Acerte 15 respostas digitadas/faladas", check: (d) => d.typedCorrect >= 15, goal: 15, val: (d) => d.typedCorrect },
];

// As 3 missões do dia são as mesmas para os dois (sorteio baseado na data)
export function todaysMissions() {
  const seed = todayStr().split("-").reduce((a, b) => a * 31 + Number(b), 7);
  const pool = [...MISSION_POOL];
  const picked = [];
  let s = seed;
  while (picked.length < 3) {
    s = (s * 9301 + 49297) % 233280;
    picked.push(pool.splice(s % pool.length, 1)[0]);
  }
  return picked.map((m) => ({
    ...m,
    done: m.check(state.daily),
    claimed: state.daily.claimed.includes(m.id),
    progress: Math.min(m.goal, m.val(state.daily)),
  }));
}

export function claimMission(id) {
  const m = todaysMissions().find((x) => x.id === id);
  if (!m || !m.done || m.claimed) return [];
  state.daily.claimed.push(id);
  const ev = addXP(XP.missionBonus);
  persist();
  return ev;
}

// ---------- Conquistas ----------

export const ACHIEVEMENTS = [
  { id: "first", icon: "🌱", name: "Erster Schritt", desc: "Complete sua primeira lição", test: (s) => totalLessons(s) >= 1 },
  { id: "streak3", icon: "🔥", name: "Am Ball", desc: "Streak de 3 dias", test: (s) => s.streak.best >= 3 },
  { id: "streak7", icon: "🔥", name: "Eine Woche!", desc: "Streak de 7 dias", test: (s) => s.streak.best >= 7 },
  { id: "streak30", icon: "🏆", name: "Unaufhaltsam", desc: "Streak de 30 dias", test: (s) => s.streak.best >= 30 },
  { id: "words50", icon: "📚", name: "Wortschatz", desc: "Aprenda 50 palavras", test: (s) => Object.keys(s.cards).length >= 50 },
  { id: "words100", icon: "🧠", name: "Hundert", desc: "Aprenda 100 palavras", test: (s) => Object.keys(s.cards).length >= 100 },
  { id: "boss1", icon: "⚔️", name: "Drachentöter", desc: "Vença seu primeiro chefão", test: (s) => Object.values(s.units).some((u) => u.bossPassed) },
  { id: "tech", icon: "🛡️", name: "Hacker auf Deutsch", desc: "Vença o chefão de Tech-Deutsch", test: (s) => s.units.u8?.bossPassed },
  { id: "school", icon: "🍎", name: "Frau Lehrerin", desc: "Vença o chefão de Schule & Bildung", test: (s) => s.units.u9?.bossPassed },
  { id: "level5", icon: "⭐", name: "Level 5", desc: "Chegue ao nível 5", test: (s) => levelInfo(s.xp).level >= 5 },
];

function totalLessons(s) {
  return Object.values(s.units).reduce((a, u) => a + (u.lessons || 0), 0);
}

export function checkAchievements() {
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements.includes(a.id) && a.test(state)) {
      state.achievements.push(a.id);
      fresh.push(a);
    }
  }
  if (fresh.length) persist();
  return fresh;
}
