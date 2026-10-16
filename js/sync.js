// =============================================================
//  Sincronização com o Supabase (login, progresso na nuvem, dupla)
//  Estratégia simples: "local-first" + "a versão mais nova vence"
//  (last-write-wins pelo campo updatedAt).
// =============================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";
import { getState, replaceState, resetState, weekXP, persist } from "./store.js";
import { todayStr, weekStart } from "./util.js";

let sb = null;
let user = null;
let pushTimer = null;

export const cloudEnabled = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);
export const currentUser = () => user;

export async function initCloud() {
  if (!cloudEnabled()) return null;
  // Carrega a biblioteca só se o Supabase estiver configurado
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
  sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  const { data } = await sb.auth.getSession();
  user = data.session?.user ?? null;
  if (user) await pull();
  return user;
}

export async function signUp(email, password, name) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: name },
      emailRedirectTo: location.origin + location.pathname,
    },
  });
  if (error) throw error;
  if (data.session) {
    user = data.user;
    await adoptLocalOrPull();
  }
  return { needsConfirmation: !data.session };
}

export async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
  user = data.user;
  await adoptLocalOrPull();
}

export async function signOut() {
  await pushNow();
  await sb.auth.signOut();
  user = null;
  resetState(null);
}

// Ao logar pela primeira vez neste aparelho: se o progresso local não tem dono,
// ele passa a ser deste usuário (assim quem começou sem login não perde nada).
async function adoptLocalOrPull() {
  const s = getState();
  if (!s.owner) {
    s.owner = user.id;
    persist(false);
  } else if (s.owner !== user.id) {
    resetState(user.id);
  }
  await pull();
}

export async function pull() {
  if (!sb || !user) return;
  const { data, error } = await sb
    .from("user_state")
    .select("state, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.warn("Falha ao baixar progresso", error);
    return;
  }
  const local = getState();
  const remote = data?.state;
  if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
    replaceState({ ...remote, owner: user.id });
  } else {
    local.owner = user.id;
    await pushNow();
  }
}

// Agenda um envio (debounce) para não chamar a API a cada clique
export function schedulePush() {
  if (!sb || !user) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(pushNow, 1500);
}

export async function pushNow() {
  if (!sb || !user) return;
  clearTimeout(pushTimer);
  const s = getState();
  const { error } = await sb.from("user_state").upsert({
    user_id: user.id,
    state: s,
    updated_at: new Date().toISOString(),
  });
  if (error) console.warn("Falha ao enviar progresso", error);

  // Estatísticas públicas para a dupla (só números, nada sensível)
  const stats = {
    user_id: user.id,
    display_name: s.profile.name || "Jogador",
    xp: s.xp,
    streak: s.streak.count,
    streak_last: s.streak.last,
    today: todayStr(),
    today_xp: s.daily.xp,
    week_start: weekStart(),
    week_xp: weekXP(),
    goal_days: s.goalDays.slice(-60),
    updated_at: new Date().toISOString(),
  };
  const { error: e2 } = await sb.from("duo_stats").upsert(stats);
  if (e2) console.warn("Falha ao enviar estatísticas", e2);
}

// ---------- Dupla ----------

export async function getMyProfile() {
  if (!sb || !user) return null;
  const { data } = await sb.from("profiles").select("id, display_name, duo_code").eq("id", user.id).maybeSingle();
  return data;
}

export async function updateDisplayName(name) {
  if (!sb || !user) return;
  await sb.from("profiles").update({ display_name: name }).eq("id", user.id);
}

export async function createDuo() {
  const { data, error } = await sb.rpc("create_duo");
  if (error) throw error;
  return data;
}

export async function joinDuo(code) {
  const { error } = await sb.rpc("join_duo", { code: code.trim().toUpperCase() });
  if (error) throw error;
}

export async function leaveDuo() {
  const { error } = await sb.rpc("leave_duo");
  if (error) throw error;
}

// Retorna as estatísticas do(a) parceiro(a), ou null
export async function getPartnerStats() {
  if (!sb || !user) return null;
  const { data, error } = await sb.from("duo_stats").select("*").neq("user_id", user.id).limit(1);
  if (error || !data?.length) return null;
  const p = data[0];
  // Ajusta valores que "venceram" (o parceiro ainda não jogou hoje / nesta semana)
  if (p.today !== todayStr()) p.today_xp = 0;
  if (p.week_start !== weekStart()) p.week_xp = 0;
  return p;
}
