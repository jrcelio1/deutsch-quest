// =============================================================
//  Conteúdo do curso — Módulo A1.1
//  Cada unidade tem: vocabulário (items), frases (sentences) e uma dica de gramática.
//  Para adicionar conteúdo novo, basta seguir o mesmo formato.
//  g = gênero do substantivo: "m" (der), "f" (die), "n" (das), "pl" (die, plural)
// =============================================================

export const CURRICULUM = [
  {
    id: "u1",
    title: "Hallo!",
    subtitle: "Cumprimentos e despedidas",
    icon: "👋",
    tip: `<p>Em alemão existem duas formas de tratamento: <b>du</b> (informal: amigos, família, colegas de TI quase sempre) e <b>Sie</b> (formal: desconhecidos, entrevista de emprego, repartição pública).</p>
<p>Na dúvida, comece com <b>Sie</b> — a outra pessoa vai propor o <i>du</i> se quiser.</p>
<p>🔊 Pronúncia: <b>ch</b> depois de i/e soa como um “chiado” suave (<i>ich</i>), e <b>w</b> soa como nosso <b>v</b> (<i>wie</i> = “vi”).</p>`,
    items: [
      { id: "u1_1", de: "Hallo", pt: "olá / oi" },
      { id: "u1_2", de: "Guten Morgen", pt: "bom dia" },
      { id: "u1_3", de: "Guten Tag", pt: "boa tarde / bom dia (formal)" },
      { id: "u1_4", de: "Guten Abend", pt: "boa noite (ao chegar)" },
      { id: "u1_5", de: "Gute Nacht", pt: "boa noite (ao dormir)" },
      { id: "u1_6", de: "Tschüss", pt: "tchau" },
      { id: "u1_7", de: "Auf Wiedersehen", pt: "até logo (formal)" },
      { id: "u1_8", de: "Bis morgen", pt: "até amanhã" },
      { id: "u1_9", de: "Danke", pt: "obrigado(a)" },
      { id: "u1_10", de: "Bitte", pt: "por favor / de nada" },
      { id: "u1_11", de: "Entschuldigung", pt: "desculpe / com licença" },
      { id: "u1_12", de: "Wie geht's?", pt: "como vai?" },
      { id: "u1_13", de: "Gut, danke", pt: "bem, obrigado" },
      { id: "u1_14", de: "ja", pt: "sim" },
      { id: "u1_15", de: "nein", pt: "não" },
    ],
    sentences: [
      { de: "Guten Morgen, wie geht's?", pt: "Bom dia, como vai?" },
      { de: "Gut, danke. Und dir?", pt: "Bem, obrigado. E você?" },
      { de: "Tschüss, bis morgen!", pt: "Tchau, até amanhã!" },
      { de: "Entschuldigung, wie bitte?", pt: "Desculpe, como?" },
    ],
  },
  {
    id: "u2",
    title: "Ich bin…",
    subtitle: "Apresentar-se · verbo sein",
    icon: "🙋",
    tip: `<p>O verbo <b>sein</b> (ser/estar) é irregular — vale a pena dominar logo:</p>
<table class="conj"><tr><td>ich</td><td><b>bin</b></td></tr><tr><td>du</td><td><b>bist</b></td></tr><tr><td>er/sie/es</td><td><b>ist</b></td></tr><tr><td>wir</td><td><b>sind</b></td></tr><tr><td>ihr</td><td><b>seid</b></td></tr><tr><td>sie/Sie</td><td><b>sind</b></td></tr></table>
<p>Para dizer o nome: <i>Ich heiße…</i> ou <i>Ich bin…</i>. Para profissões, <b>não</b> se usa artigo: <i>Ich bin Lehrerin</i> (e não “eine Lehrerin”).</p>`,
    items: [
      { id: "u2_1", de: "ich bin", pt: "eu sou / estou" },
      { id: "u2_2", de: "du bist", pt: "você é / está" },
      { id: "u2_3", de: "er ist", pt: "ele é / está" },
      { id: "u2_4", de: "sie ist", pt: "ela é / está" },
      { id: "u2_5", de: "wir sind", pt: "nós somos / estamos" },
      { id: "u2_6", de: "Ich heiße…", pt: "eu me chamo…" },
      { id: "u2_7", de: "Wie heißt du?", pt: "como você se chama?" },
      { id: "u2_8", de: "Woher kommst du?", pt: "de onde você é?" },
      { id: "u2_9", de: "Ich komme aus Brasilien", pt: "eu sou do Brasil" },
      { id: "u2_10", de: "Ich wohne in…", pt: "eu moro em…" },
      { id: "u2_11", de: "Ich bin Entwickler", pt: "eu sou desenvolvedor" },
      { id: "u2_12", de: "Ich bin Lehrerin", pt: "eu sou professora" },
      { id: "u2_13", de: "Freut mich!", pt: "prazer!" },
      { id: "u2_14", de: "Ich spreche ein bisschen Deutsch", pt: "eu falo um pouco de alemão" },
    ],
    sentences: [
      { de: "Ich heiße Ana und komme aus Brasilien.", pt: "Eu me chamo Ana e sou do Brasil." },
      { de: "Wie heißt du?", pt: "Como você se chama?" },
      { de: "Wir sind aus Brasilien.", pt: "Nós somos do Brasil." },
      { de: "Ich bin Entwickler und sie ist Lehrerin.", pt: "Eu sou desenvolvedor e ela é professora." },
      { de: "Ich spreche ein bisschen Deutsch.", pt: "Eu falo um pouco de alemão." },
    ],
  },
  {
    id: "u3",
    title: "Zahlen",
    subtitle: "Números de 0 a 100",
    icon: "🔢",
    tip: `<p>De 21 a 99 o alemão fala <b>a unidade primeiro</b>: 21 = <i>einundzwanzig</i> (“um e vinte”).</p>
<p>Isso confunde no começo com telefones e preços — pratique ditando números em voz alta!</p>
<p>Dica de TI: <b>null</b> = zero. Sim, igual ao <code>null</code> da programação 😄</p>`,
    items: [
      { id: "u3_0", de: "null", pt: "zero (0)" },
      { id: "u3_1", de: "eins", pt: "um (1)" },
      { id: "u3_2", de: "zwei", pt: "dois (2)" },
      { id: "u3_3", de: "drei", pt: "três (3)" },
      { id: "u3_4", de: "vier", pt: "quatro (4)" },
      { id: "u3_5", de: "fünf", pt: "cinco (5)" },
      { id: "u3_6", de: "sechs", pt: "seis (6)" },
      { id: "u3_7", de: "sieben", pt: "sete (7)" },
      { id: "u3_8", de: "acht", pt: "oito (8)" },
      { id: "u3_9", de: "neun", pt: "nove (9)" },
      { id: "u3_10", de: "zehn", pt: "dez (10)" },
      { id: "u3_11", de: "elf", pt: "onze (11)" },
      { id: "u3_12", de: "zwölf", pt: "doze (12)" },
      { id: "u3_13", de: "zwanzig", pt: "vinte (20)" },
      { id: "u3_14", de: "einundzwanzig", pt: "vinte e um (21)" },
      { id: "u3_15", de: "dreißig", pt: "trinta (30)" },
      { id: "u3_16", de: "hundert", pt: "cem (100)" },
    ],
    sentences: [
      { de: "Ich bin dreißig Jahre alt.", pt: "Eu tenho trinta anos." },
      { de: "Wie alt bist du?", pt: "Quantos anos você tem?" },
      { de: "Das kostet zwölf Euro.", pt: "Isso custa doze euros." },
      { de: "Meine Nummer ist null, acht, fünf.", pt: "Meu número é zero, oito, cinco." },
    ],
  },
  {
    id: "u4",
    title: "Familie",
    subtitle: "Família · der, die, das",
    icon: "👨‍👩‍👧",
    tip: `<p>Todo substantivo alemão tem gênero: <b class="m">der</b> (masculino), <b class="f">die</b> (feminino), <b class="n">das</b> (neutro). No plural é sempre <b class="f">die</b>.</p>
<p>⚠️ Nunca aprenda a palavra sozinha: aprenda <b>com o artigo</b>. É por isso que o app mostra cores: <span class="m">azul = der</span>, <span class="f">vermelho = die</span>, <span class="n">verde = das</span>.</p>
<p>Substantivos sempre começam com <b>letra maiúscula</b>.</p>`,
    items: [
      { id: "u4_1", de: "der Vater", pt: "o pai", g: "m" },
      { id: "u4_2", de: "die Mutter", pt: "a mãe", g: "f" },
      { id: "u4_3", de: "die Eltern", pt: "os pais", g: "pl" },
      { id: "u4_4", de: "der Bruder", pt: "o irmão", g: "m" },
      { id: "u4_5", de: "die Schwester", pt: "a irmã", g: "f" },
      { id: "u4_6", de: "das Kind", pt: "a criança", g: "n" },
      { id: "u4_7", de: "der Freund", pt: "o namorado / amigo", g: "m" },
      { id: "u4_8", de: "die Freundin", pt: "a namorada / amiga", g: "f" },
      { id: "u4_9", de: "der Mann", pt: "o homem / marido", g: "m" },
      { id: "u4_10", de: "die Frau", pt: "a mulher / esposa", g: "f" },
      { id: "u4_11", de: "das Haus", pt: "a casa", g: "n" },
      { id: "u4_12", de: "der Hund", pt: "o cachorro", g: "m" },
      { id: "u4_13", de: "die Katze", pt: "o gato", g: "f" },
      { id: "u4_14", de: "mein / meine", pt: "meu / minha" },
    ],
    sentences: [
      { de: "Das ist meine Freundin.", pt: "Esta é minha namorada." },
      { de: "Mein Bruder wohnt in Berlin.", pt: "Meu irmão mora em Berlim." },
      { de: "Die Katze ist klein.", pt: "O gato é pequeno." },
      { de: "Meine Eltern sind in Brasilien.", pt: "Meus pais estão no Brasil." },
    ],
  },
  {
    id: "u5",
    title: "Essen & Trinken",
    subtitle: "Comida · möchten · ein/einen",
    icon: "🥨",
    tip: `<p><b>Ich möchte…</b> (eu gostaria de…) é a frase mais útil num café ou mercado.</p>
<p>Depois de <i>möchten</i>, <i>haben</i>, <i>brauchen</i> o objeto vai para o <b>acusativo</b>. Na prática, no A1, só o <b>masculino muda</b>:</p>
<table class="conj"><tr><td class="m">der Kaffee</td><td>→ Ich möchte <b>einen</b> Kaffee</td></tr><tr><td class="f">die Pizza</td><td>→ Ich möchte <b>eine</b> Pizza</td></tr><tr><td class="n">das Wasser</td><td>→ Ich möchte <b>ein</b> Wasser</td></tr></table>`,
    items: [
      { id: "u5_1", de: "der Kaffee", pt: "o café", g: "m" },
      { id: "u5_2", de: "der Tee", pt: "o chá", g: "m" },
      { id: "u5_3", de: "das Wasser", pt: "a água", g: "n" },
      { id: "u5_4", de: "das Bier", pt: "a cerveja", g: "n" },
      { id: "u5_5", de: "das Brot", pt: "o pão", g: "n" },
      { id: "u5_6", de: "das Brötchen", pt: "o pãozinho", g: "n" },
      { id: "u5_7", de: "der Käse", pt: "o queijo", g: "m" },
      { id: "u5_8", de: "die Milch", pt: "o leite", g: "f" },
      { id: "u5_9", de: "der Apfel", pt: "a maçã", g: "m" },
      { id: "u5_10", de: "die Kartoffel", pt: "a batata", g: "f" },
      { id: "u5_11", de: "Ich möchte…", pt: "eu gostaria de…" },
      { id: "u5_12", de: "Die Rechnung, bitte", pt: "a conta, por favor" },
      { id: "u5_13", de: "lecker", pt: "gostoso" },
      { id: "u5_14", de: "Ich habe Hunger", pt: "estou com fome" },
    ],
    sentences: [
      { de: "Ich möchte einen Kaffee, bitte.", pt: "Eu gostaria de um café, por favor." },
      { de: "Ich möchte ein Wasser.", pt: "Eu gostaria de uma água." },
      { de: "Das Brot ist lecker.", pt: "O pão está gostoso." },
      { de: "Die Rechnung, bitte.", pt: "A conta, por favor." },
      { de: "Wir haben Hunger.", pt: "Nós estamos com fome." },
    ],
  },
  {
    id: "u6",
    title: "Alltag",
    subtitle: "Rotina · verbos regulares",
    icon: "🏠",
    tip: `<p>Verbos regulares seguem um padrão. Tire o <b>-en</b> do infinitivo e adicione a terminação:</p>
<table class="conj"><tr><td>ich</td><td>lern<b>e</b></td></tr><tr><td>du</td><td>lern<b>st</b></td></tr><tr><td>er/sie/es</td><td>lern<b>t</b></td></tr><tr><td>wir</td><td>lern<b>en</b></td></tr><tr><td>ihr</td><td>lern<b>t</b></td></tr><tr><td>sie/Sie</td><td>lern<b>en</b></td></tr></table>
<p>Regra de ouro: em frases afirmativas o <b>verbo fica na 2ª posição</b>. <i>Heute <b>lerne</b> ich Deutsch.</i></p>`,
    items: [
      { id: "u6_1", de: "lernen", pt: "aprender / estudar" },
      { id: "u6_2", de: "arbeiten", pt: "trabalhar" },
      { id: "u6_3", de: "wohnen", pt: "morar" },
      { id: "u6_4", de: "spielen", pt: "jogar / brincar" },
      { id: "u6_5", de: "machen", pt: "fazer" },
      { id: "u6_6", de: "kochen", pt: "cozinhar" },
      { id: "u6_7", de: "kaufen", pt: "comprar" },
      { id: "u6_8", de: "hören", pt: "ouvir" },
      { id: "u6_9", de: "trinken", pt: "beber" },
      { id: "u6_10", de: "gehen", pt: "ir (a pé)" },
      { id: "u6_11", de: "heute", pt: "hoje" },
      { id: "u6_12", de: "morgen", pt: "amanhã" },
      { id: "u6_13", de: "zusammen", pt: "juntos" },
      { id: "u6_14", de: "gern", pt: "com gosto (gostar de)" },
    ],
    sentences: [
      { de: "Wir lernen zusammen Deutsch.", pt: "Nós aprendemos alemão juntos." },
      { de: "Heute arbeite ich zu Hause.", pt: "Hoje eu trabalho em casa." },
      { de: "Sie kocht gern.", pt: "Ela gosta de cozinhar." },
      { de: "Ich spiele gern Videospiele.", pt: "Eu gosto de jogar videogame." },
      { de: "Morgen kaufen wir Brot.", pt: "Amanhã nós compramos pão." },
    ],
  },
  {
    id: "u7",
    title: "Zeit",
    subtitle: "Dias da semana e horas",
    icon: "🕐",
    tip: `<p>Os dias da semana são todos <b class="m">der</b> (masculinos): <i>der Montag</i>. Para dizer “na segunda”: <b>am</b> Montag.</p>
<p>Para horas: <b>um</b> acht Uhr (às oito horas).</p>
<p>⚠️ Cuidado: <i>halb neun</i> = <b>8:30</b> (“meia para as nove”), não 9:30!</p>`,
    items: [
      { id: "u7_1", de: "der Montag", pt: "segunda-feira", g: "m" },
      { id: "u7_2", de: "der Dienstag", pt: "terça-feira", g: "m" },
      { id: "u7_3", de: "der Mittwoch", pt: "quarta-feira", g: "m" },
      { id: "u7_4", de: "der Donnerstag", pt: "quinta-feira", g: "m" },
      { id: "u7_5", de: "der Freitag", pt: "sexta-feira", g: "m" },
      { id: "u7_6", de: "der Samstag", pt: "sábado", g: "m" },
      { id: "u7_7", de: "der Sonntag", pt: "domingo", g: "m" },
      { id: "u7_8", de: "das Wochenende", pt: "o fim de semana", g: "n" },
      { id: "u7_9", de: "die Uhr", pt: "o relógio / hora (horário)", g: "f" },
      { id: "u7_10", de: "Wie spät ist es?", pt: "que horas são?" },
      { id: "u7_11", de: "halb neun", pt: "oito e meia (8:30)" },
      { id: "u7_12", de: "jeden Tag", pt: "todo dia" },
      { id: "u7_13", de: "die Woche", pt: "a semana", g: "f" },
    ],
    sentences: [
      { de: "Am Montag arbeite ich.", pt: "Na segunda eu trabalho." },
      { de: "Wir lernen jeden Tag.", pt: "Nós estudamos todo dia." },
      { de: "Wie spät ist es?", pt: "Que horas são?" },
      { de: "Es ist acht Uhr.", pt: "São oito horas." },
      { de: "Am Wochenende kochen wir zusammen.", pt: "No fim de semana cozinhamos juntos." },
    ],
  },
  {
    id: "u8",
    title: "Tech-Deutsch 1",
    subtitle: "Vocabulário de TI e segurança",
    icon: "💻",
    track: "ti",
    tip: `<p>Muito vocabulário de TI é inglês (<i>der Server</i>, <i>das Update</i>), mas em empresas alemãs você vai ouvir bastante alemão “puro”, principalmente em segurança: <b>Sicherheit</b> (segurança), <b>Schwachstelle</b> (vulnerabilidade), <b>Verschlüsselung</b> (criptografia).</p>
<p>Palavras compostas são montadas como peças de LEGO: <i>Passwort</i> + <i>Manager</i> → <b>der Passwortmanager</b>. O gênero é sempre o da <b>última peça</b>.</p>`,
    items: [
      { id: "u8_1", de: "der Rechner", pt: "o computador", g: "m" },
      { id: "u8_2", de: "das Passwort", pt: "a senha", g: "n" },
      { id: "u8_3", de: "die Sicherheit", pt: "a segurança", g: "f" },
      { id: "u8_4", de: "die Schwachstelle", pt: "a vulnerabilidade", g: "f" },
      { id: "u8_5", de: "die Verschlüsselung", pt: "a criptografia", g: "f" },
      { id: "u8_6", de: "das Netzwerk", pt: "a rede", g: "n" },
      { id: "u8_7", de: "die Datei", pt: "o arquivo", g: "f" },
      { id: "u8_8", de: "die Daten", pt: "os dados", g: "pl" },
      { id: "u8_9", de: "der Fehler", pt: "o erro / bug", g: "m" },
      { id: "u8_10", de: "die Anmeldung", pt: "o login / inscrição", g: "f" },
      { id: "u8_11", de: "der Angriff", pt: "o ataque", g: "m" },
      { id: "u8_12", de: "die Stelle", pt: "a vaga (de emprego)", g: "f" },
      { id: "u8_13", de: "programmieren", pt: "programar" },
      { id: "u8_14", de: "der Entwickler", pt: "o desenvolvedor", g: "m" },
    ],
    sentences: [
      { de: "Das Passwort ist zu kurz.", pt: "A senha é curta demais." },
      { de: "Ich programmiere gern.", pt: "Eu gosto de programar." },
      { de: "Der Server hat einen Fehler.", pt: "O servidor tem um erro." },
      { de: "Ich suche eine Stelle als Entwickler.", pt: "Eu procuro uma vaga de desenvolvedor." },
      { de: "Sicherheit ist wichtig.", pt: "Segurança é importante." },
    ],
  },
  {
    id: "u9",
    title: "Schule & Bildung",
    subtitle: "Vocabulário de educação",
    icon: "🎓",
    track: "edu",
    tip: `<p>Na Alemanha, a educação infantil acontece na <b>Kita</b> (Kindertagesstätte, creche/pré-escola). Quem trabalha lá é <b>Erzieher/Erzieherin</b> — uma profissão muito procurada.</p>
<p>Para profissões, a forma feminina geralmente ganha <b>-in</b>: <i>der Lehrer → die Lehrerin</i>.</p>`,
    items: [
      { id: "u9_1", de: "die Schule", pt: "a escola", g: "f" },
      { id: "u9_2", de: "die Kita", pt: "a creche / pré-escola", g: "f" },
      { id: "u9_3", de: "die Lehrerin", pt: "a professora", g: "f" },
      { id: "u9_4", de: "die Erzieherin", pt: "a educadora (infantil)", g: "f" },
      { id: "u9_5", de: "der Schüler", pt: "o aluno", g: "m" },
      { id: "u9_6", de: "die Klasse", pt: "a turma / sala", g: "f" },
      { id: "u9_7", de: "das Buch", pt: "o livro", g: "n" },
      { id: "u9_8", de: "der Unterricht", pt: "a aula", g: "m" },
      { id: "u9_9", de: "die Pause", pt: "o intervalo / recreio", g: "f" },
      { id: "u9_10", de: "lesen", pt: "ler" },
      { id: "u9_11", de: "schreiben", pt: "escrever" },
      { id: "u9_12", de: "die Hausaufgabe", pt: "a lição de casa", g: "f" },
      { id: "u9_13", de: "die Universität", pt: "a universidade", g: "f" },
    ],
    sentences: [
      { de: "Ich bin Erzieherin.", pt: "Eu sou educadora." },
      { de: "Die Kinder lesen ein Buch.", pt: "As crianças leem um livro." },
      { de: "Der Unterricht ist um acht Uhr.", pt: "A aula é às oito horas." },
      { de: "Die Pause ist kurz.", pt: "O intervalo é curto." },
      { de: "Wir schreiben zusammen.", pt: "Nós escrevemos juntos." },
    ],
  },
];

// Índice rápido: id do item -> { item, unit }
export const ITEM_INDEX = {};
for (const unit of CURRICULUM) {
  for (const item of unit.items) ITEM_INDEX[item.id] = { item, unit };
  unit.sentences.forEach((s, i) => {
    s.id = `${unit.id}_s${i}`;
    ITEM_INDEX[s.id] = { item: { ...s, isSentence: true }, unit };
  });
}
