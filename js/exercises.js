// =============================================================
//  Gerador de exercícios.
//  Monta as sessões (lição, revisão, chefão) e corrige as respostas.
//  A ideia pedagógica: começar reconhecendo (múltipla escolha) e
//  avançar para PRODUZIR (digitar, montar frase, falar).
// =============================================================

import { CURRICULUM, ITEM_INDEX } from "../data/curriculum.js";
import { shuffle, sample, normalize } from "./util.js";
import { getState } from "./store.js";

export const ARTICLE = { m: "der", f: "die", n: "das", pl: "die" };

export function speechRecognitionAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// ---------- helpers ----------

function stripArticle(de) {
  return de.replace(/^(der|die|das)\s+/i, "");
}

function allItems() {
  return CURRICULUM.flatMap((u) => u.items);
}

function distractors(item, field, n, pool) {
  const used = new Set([item[field]]);
  const candidates = shuffle(pool.filter((x) => x.id !== item.id));
  const out = [];
  for (const c of candidates) {
    if (out.length >= n) break;
    if (!used.has(c[field])) {
      used.add(c[field]);
      out.push(c[field]);
    }
  }
  // completa com itens de outras unidades se faltar
  if (out.length < n) {
    for (const c of shuffle(allItems())) {
      if (out.length >= n) break;
      if (!used.has(c[field])) {
        used.add(c[field]);
        out.push(c[field]);
      }
    }
  }
  return out;
}

function typeAnswers(de) {
  // "mein / meine" aceita qualquer um; "Ich heiße…" ignora as reticências
  return de.split(" / ").map((s) => s.replace(/…/g, "").trim());
}

function canType(item) {
  return item.de.length <= 32;
}

// ---------- fábrica de exercícios ----------

function ex(type, item, unit, extra = {}) {
  return { type, itemId: item.id, unitId: unit.id, item, ...extra };
}

function makeIntro(item, unit) {
  return ex("intro", item, unit);
}

function makeMC(item, unit, dir, pool) {
  const field = dir === "de2pt" ? "pt" : "de";
  const answer = item[field];
  const options = shuffle([answer, ...distractors(item, field, 3, pool)]);
  return ex(dir === "de2pt" ? "mc_de2pt" : "mc_pt2de", item, unit, { answer, options });
}

function makeListen(item, unit, pool) {
  const answer = item.pt;
  const options = shuffle([answer, ...distractors(item, "pt", 3, pool)]);
  return ex("listen", item, unit, { answer, options });
}

function makeArticle(item, unit) {
  return ex("article", item, unit, {
    noun: stripArticle(item.de),
    answer: ARTICLE[item.g],
    options: ["der", "die", "das"],
  });
}

function makeType(item, unit) {
  return ex("type", item, unit, { answers: typeAnswers(item.de) });
}

function sentenceWords(de) {
  return de.replace(/[.!?]$/, "").split(/\s+/);
}

function makeBuild(sentence, unit) {
  const words = sentenceWords(sentence.de);
  const lower = new Set(words.map((w) => normalize(w)));
  const others = unit.sentences
    .filter((s) => s !== sentence)
    .flatMap((s) => sentenceWords(s.de))
    .filter((w) => !lower.has(normalize(w))); // evita "Meine" vs "meine"
  const seenLower = new Set();
  const unique = others.filter((w) => !seenLower.has(normalize(w)) && seenLower.add(normalize(w)));
  const extra = sample(unique, 2);
  return {
    type: "build",
    itemId: sentence.id,
    unitId: unit.id,
    item: { ...sentence, isSentence: true },
    answer: words.join(" "),
    tiles: shuffle([...words, ...extra]),
  };
}

function makeSpeak(target, unit) {
  return {
    type: "speak",
    itemId: target.id,
    unitId: unit.id,
    item: target,
    answer: target.de,
  };
}

// Escolhe um exercício "variado" para um item já conhecido
function practiceFor(item, unit, pool, { hard = false } = {}) {
  const opts = ["mc_pt2de", "listen", "mc_de2pt"];
  if (item.g) opts.push("article");
  if (canType(item)) opts.push("type", "type");
  if (hard && canType(item)) opts.push("type");
  const kind = opts[Math.floor(Math.random() * opts.length)];
  switch (kind) {
    case "mc_pt2de": return makeMC(item, unit, "pt2de", pool);
    case "mc_de2pt": return makeMC(item, unit, "de2pt", pool);
    case "listen": return makeListen(item, unit, pool);
    case "article": return makeArticle(item, unit);
    default: return makeType(item, unit);
  }
}

// ---------- sessões ----------

export function buildLesson(unit) {
  const state = getState();
  const pool = unit.items;
  const unseen = unit.items.filter((it) => !state.cards[it.id]);
  const seen = unit.items.filter((it) => state.cards[it.id]);
  const out = [];

  const fresh = unseen.slice(0, 5);
  // 1) apresenta as palavras novas e já pede reconhecimento
  for (const it of fresh) {
    out.push(makeIntro(it, unit));
    out.push(makeMC(it, unit, "de2pt", pool));
  }
  // 2) mistura: produção das novas + reforço de antigas
  const reinforce = sample(seen, fresh.length ? 4 : 8);
  const practice = [];
  for (const it of fresh) {
    practice.push(it.g ? makeArticle(it, unit) : makeListen(it, unit, pool));
    if (canType(it)) practice.push(makeType(it, unit));
    else practice.push(makeMC(it, unit, "pt2de", pool));
  }
  for (const it of reinforce) practice.push(practiceFor(it, unit, pool));
  // 3) frases: montar e (se der) falar
  const sentences = sample(unit.sentences, fresh.length ? 1 : 2);
  for (const s of sentences) practice.push(makeBuild(s, unit));
  if (speechRecognitionAvailable() && state.profile.mic !== false && Math.random() < 0.5) {
    practice.push(makeSpeak(sample(unit.sentences, 1)[0], unit));
  }

  out.push(...shuffle(practice));
  return { kind: "lesson", unitId: unit.id, exercises: out, newItems: fresh.map((i) => i.id) };
}

export function buildReview(ids, max = 15) {
  const chosen = sample(ids, max);
  const exercises = chosen.map((id) => {
    const { item, unit } = ITEM_INDEX[id];
    return practiceFor(item, unit, unit.items, { hard: true });
  });
  return { kind: "review", exercises };
}

export function buildBoss(unit) {
  const pool = unit.items;
  const items = sample(unit.items, 11);
  const exercises = items.map((it) => practiceFor(it, unit, pool, { hard: true }));
  for (const s of sample(unit.sentences, 3)) exercises.push(makeBuild(s, unit));
  const st = getState();
  if (speechRecognitionAvailable() && st.profile.mic !== false) {
    exercises.push(makeSpeak(sample(unit.sentences, 1)[0], unit));
  } else {
    const s = sample(unit.sentences, 1)[0];
    exercises.push(makeBuild(s, unit));
  }
  return { kind: "boss", unitId: unit.id, exercises: shuffle(exercises), hearts: 3 };
}

// ---------- correção ----------

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

export function similarity(a, b) {
  const x = normalize(a), y = normalize(b);
  if (!x && !y) return 1;
  return 1 - levenshtein(x, y) / Math.max(x.length, y.length);
}

/**
 * Retorna { correct, quality, note }
 * quality é usado pelo SRS (0..5)
 */
export function check(exercise, response) {
  switch (exercise.type) {
    case "mc_de2pt":
    case "mc_pt2de":
    case "listen":
    case "article": {
      const ok = response === exercise.answer;
      return { correct: ok, quality: ok ? 4 : 1 };
    }
    case "type": {
      const r = normalize(response);
      if (exercise.answers.some((a) => normalize(a) === r)) return { correct: true, quality: 5 };
      // aceitou sem trema? (ae no lugar de ä etc.)
      if (exercise.answers.some((a) => normalize(a, { foldUmlauts: true }) === normalize(response, { foldUmlauts: true }))) {
        return { correct: true, quality: 4, note: "Quase perfeito! Atenção aos tremas (ä, ö, ü, ß)." };
      }
      // erro de digitação pequeno (1 letra em palavras maiores)
      const best = Math.max(...exercise.answers.map((a) => similarity(a, response)));
      if (best >= 0.88 && r.length >= 6) {
        return { correct: true, quality: 3, note: "Pequeno erro de digitação — confira a grafia." };
      }
      return { correct: false, quality: 1 };
    }
    case "build": {
      const ok = normalize(response) === normalize(exercise.answer);
      return { correct: ok, quality: ok ? 5 : 1 };
    }
    case "speak": {
      const sim = similarity(exercise.answer, response || "");
      if (sim >= 0.8) return { correct: true, quality: 5 };
      if (sim >= 0.6) return { correct: true, quality: 3, note: "Entendi quase tudo! Tente articular um pouco mais." };
      return { correct: false, quality: 2 };
    }
    default:
      return { correct: true, quality: 4 };
  }
}

export function isProduction(type) {
  return type === "type" || type === "build" || type === "speak";
}
