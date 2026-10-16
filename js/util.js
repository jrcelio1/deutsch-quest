// Funções utilitárias pequenas, usadas em vários módulos.

// Data local no formato YYYY-MM-DD (usa o fuso do aparelho, não UTC)
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}

export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

// Segunda-feira da semana da data (semana ISO, como na Alemanha)
export function weekStart(dateStr = todayStr()) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7; // 0 = segunda
  dt.setDate(dt.getDate() - dow);
  return todayStr(dt);
}

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample(arr, n) {
  return shuffle(arr).slice(0, n);
}

// IMPORTANTE (segurança): sempre use esc() antes de colocar texto
// vindo de usuário/banco dentro de innerHTML. Evita XSS.
export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Normaliza respostas digitadas para comparação tolerante
export function normalize(s, { foldUmlauts = false } = {}) {
  let t = String(s).toLowerCase().trim();
  t = t.replace(/[.,!?;:¿¡"'“”„…()]/g, "").replace(/\s+/g, " ").trim();
  if (foldUmlauts) {
    t = t
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss");
  }
  return t;
}
