// =============================================================
//  Revisão espaçada (Spaced Repetition) — algoritmo SM-2 simplificado
//  Cada palavra vira um "card". Quanto melhor você responde,
//  maior o intervalo até o app mostrar a palavra de novo.
//  quality: 0..5  (0-2 = errou, 3 = acertou com dificuldade, 4 = acertou, 5 = fácil/perfeito)
// =============================================================

import { todayStr, addDays } from "./util.js";

export function newCard() {
  return { ef: 2.5, reps: 0, interval: 0, due: todayStr(), lapses: 0, seen: 0 };
}

export function review(card, quality) {
  const c = { ...card };
  c.seen = (c.seen || 0) + 1;

  if (quality < 3) {
    // errou: volta para o início, revisa de novo amanhã
    c.reps = 0;
    c.interval = 1;
    c.lapses = (c.lapses || 0) + 1;
  } else {
    c.reps += 1;
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = 3;
    else c.interval = Math.round(c.interval * c.ef);
  }

  // Fator de facilidade (EF) — nunca abaixo de 1.3
  c.ef = Math.max(1.3, c.ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  c.due = addDays(todayStr(), c.interval);
  return c;
}

export function isDue(card) {
  return card && card.due <= todayStr();
}

// "Força" da memória de 0 a 4, usada para mostrar barrinhas na interface
export function strength(card) {
  if (!card) return 0;
  if (card.interval >= 21) return 4;
  if (card.interval >= 7) return 3;
  if (card.interval >= 3) return 2;
  return 1;
}
