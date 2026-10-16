// =============================================================
//  Áudio: síntese de voz (ouvir) e reconhecimento de fala (falar).
//  Usa as APIs nativas do navegador — sem custo e sem servidor.
//  Dica: no celular, instale a voz "Alemão" nas configurações de
//  texto-para-fala do sistema para uma pronúncia melhor.
// =============================================================

let voices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith("de"));
}
if ("speechSynthesis" in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

export function hasGermanVoice() {
  return voices.length > 0;
}

export function speak(text, rate = 0.9) {
  if (!("speechSynthesis" in window)) return;
  const clean = String(text).replace(/…/g, "").replace(/ \/ /g, ", ");
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(clean);
  u.lang = "de-DE";
  u.rate = rate;
  // prefere vozes "naturais"/Google quando existem
  const preferred =
    voices.find((v) => /natural|google|neural/i.test(v.name)) || voices[0];
  if (preferred) u.voice = preferred;
  speechSynthesis.speak(u);
}

export function listen({ onResult, onError, onEnd }) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    onError?.("Seu navegador não suporta reconhecimento de voz (use o Chrome).");
    return null;
  }
  const rec = new SR();
  rec.lang = "de-DE";
  rec.interimResults = false;
  rec.maxAlternatives = 3;
  rec.onresult = (e) => {
    const alts = Array.from(e.results[0]).map((r) => r.transcript);
    onResult?.(alts);
  };
  rec.onerror = (e) => onError?.(e.error === "not-allowed" ? "Permissão de microfone negada." : `Erro: ${e.error}`);
  rec.onend = () => onEnd?.();
  rec.start();
  return rec;
}
