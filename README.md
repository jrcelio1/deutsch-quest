# 🥨 Deutsch Quest

Aprenda alemão em dupla, um pouco todo dia. É um app web gamificado, feito com HTML, CSS e JavaScript puro, sem framework e sem etapa de build.

- **Funciona sozinho no navegador.** O progresso fica salvo no próprio aparelho.
- **Com o Supabase (opcional, grátis):**
  - Login com e-mail e senha.
  - Progresso sincronizado entre celular e PC.
  - **Modo dupla**: duelo semanal de XP e streak do casal.
- **Hospedagem:** GitHub Pages, de graça.

## O que tem no MVP

| Recurso | Como funciona |
|---|---|
| 🗺️ Trilha A1.1 | 9 unidades, mais de 120 palavras e mais de 40 frases. Termina com as trilhas de 💻 TI e 🍎 Educação |
| 🧠 Revisão espaçada | Algoritmo SM-2 (`js/srs.js`). Cada palavra volta na hora certa, antes de ser esquecida |
| ✍️ Produção acima de reconhecimento | Digitar, montar frases e **falar** (microfone, no Chrome) valem mais XP que clicar |
| 🔊 Áudio | Voz alemã nativa do navegador, com botão 🐢 para ouvir devagar |
| 🎮 Gamificação | XP, níveis, 🔥 streak com congelamento, 3 missões diárias, combo, ⚔️ chefão com 3 vidas e conquistas |
| 🎨 Artigos por cor | der = azul · die = vermelho · das = verde |
| 💞 Dupla | Duelo semanal de XP, streak do casal e progresso do outro em tempo real |
| 💾 Backup | Exportar e importar o progresso em JSON |

---

## 1. Rodar no seu computador

O app usa ES modules, então precisa de um servidor local. Abrir o `index.html` direto com duplo clique não funciona.

```bash
cd deutsch-quest
python3 -m http.server 8000   # ou: npx serve .
```

Depois, abra http://localhost:8000.

## 2. Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `deutsch-quest`.
2. Envie os arquivos:
   ```bash
   cd deutsch-quest
   git init
   git add .
   git commit -m "Deutsch Quest MVP"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/deutsch-quest.git
   git push -u origin main
   ```
3. No GitHub, vá em **Settings → Pages → Build and deployment**.
4. Em **Source**, escolha `Deploy from a branch`. Em **Branch**, escolha `main` e a pasta `/ (root)`. Clique em **Save**.
5. Espere cerca de 1 minuto. O app fica disponível em `https://SEU_USUARIO.github.io/deutsch-quest/`.

> 📱 **No celular:** abra o link e use a opção "Adicionar à tela inicial". O app abre como se fosse nativo.

## 3. Ligar o Supabase (login, sincronização e modo dupla)

1. Crie uma conta em https://supabase.com e depois um projeto novo. O plano Free basta.
2. Crie as tabelas:
   - Abra o **SQL Editor** e clique em **New query**.
   - Cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   - O resultado deve ser "Success".
3. Configure as URLs:
   - Vá em **Authentication → URL Configuration**.
   - Em **Site URL**, coloque `https://SEU_USUARIO.github.io/deutsch-quest/`.
   - Em **Redirect URLs**, adicione esse mesmo link e também `http://localhost:8000`.
4. Copie as chaves:
   - Vá em **Project Settings → API Keys**.
   - Copie a **Project URL** e a chave **publishable** (ou a `anon`, nos projetos antigos).
   - Cole as duas em `js/config.js`.
5. Publique: faça `git commit` e `git push`.
6. Criem as contas e a dupla:
   - Cada um cria a própria conta em **Perfil → Conta** e confirma pelo link enviado por e-mail.
   - Um de vocês vai em **Dupla → Criar dupla** e manda o código de 8 letras para o outro.
   - O outro vai em **Dupla** e entra com esse código.

> ⏸️ **Projeto pausado:** projetos gratuitos do Supabase pausam depois de cerca de 7 dias sem uso. Usando todo dia, isso não acontece. Se pausar, é só reativar no painel.

---

## 🔐 Notas de segurança (estude isto, futuro profissional de cyber!)

O projeto já vem com algumas defesas de verdade, para você entender e explicar numa entrevista:

1. **A chave no `config.js` pode ser pública. Quem protege os dados é o RLS** (`supabase/schema.sql`):
   - `user_state` (seu progresso completo): **só o dono** lê e escreve.
   - `duo_stats` (XP e streak): o dono escreve. O dono **e a dupla** leem.
   - `profiles.duo_code` **não pode** ser alterado direto, por causa do privilégio por coluna. Só as funções `create_duo` e `join_duo` mexem nele, e elas validam o formato e o **limite de 2 pessoas** por dupla.
   - Visitantes não logados (`anon`) não acessam nada.
2. **Nunca** coloque a chave `secret` ou `service_role` no front-end. Ela ignora o RLS.
3. **XSS:**
   - Todo texto que vem do banco (como o nome do parceiro) passa por `esc()` antes de ir para o HTML.
   - O `index.html` tem uma **Content-Security-Policy** que só permite scripts do próprio site e do CDN do Supabase.
4. **Limites no banco:** os `check constraints` restringem o tamanho do JSON, o tamanho do nome e impedem XP negativo.
5. **Senhas:** quem guarda é o Supabase Auth, com hash bcrypt. O app nunca vê nem armazena a senha.

Todas essas políticas foram testadas num Postgres local: tentativas de ler o progresso do outro, de forjar o `duo_code`, de entrar como 3º membro e de acessar sem login foram todas **bloqueadas**.

> 🧪 **Desafio para depois:** tente atacar seu próprio app. Use o console do navegador e o cliente do Supabase para ler dados que não são seus. Se conseguir, achou uma falha e aprendeu algo. Se não conseguir, entendeu por que o RLS funciona.

---

## Estrutura

```
index.html            # casca do app + CSP
css/style.css         # visual (tema claro/escuro automático)
data/curriculum.js    # 📚 TODO o conteúdo do curso, fácil de editar
js/app.js             # telas e sessão de exercícios
js/exercises.js       # gera exercícios e corrige respostas
js/srs.js             # revisão espaçada (SM-2)
js/store.js           # estado, XP, streak, missões, conquistas
js/sync.js            # Supabase: login, sync, dupla
js/speech.js          # voz (TTS) e microfone
js/config.js          # suas chaves do Supabase
supabase/schema.sql   # tabelas + RLS + funções
```

### Adicionar conteúdo

Edite `data/curriculum.js` e copie o formato de uma unidade que já existe. Use `g: "m" | "f" | "n" | "pl"` nos substantivos para ativar o exercício de artigo e as cores.

## Próximos passos (roadmap)

- [ ] Módulo A1.2: acusativo completo, verbos modais, verbos separáveis
- [ ] Tela "Minhas palavras" com a força de cada palavra
- [ ] Testes automatizados (Vitest) para `srs.js` e `exercises.js`
- [ ] GitHub Actions: lint e testes a cada push
- [ ] Algoritmo FSRS no lugar do SM-2
- [ ] Laboratório Oracle Cloud: VM com hardening, nginx e TLS como espelho do app
