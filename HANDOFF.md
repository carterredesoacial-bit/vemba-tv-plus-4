# VEMBA TV PLUS: HANDOFF
Atualizado em: 18/11/2026 (sessão 7)
Cole este arquivo no início de qualquer chat novo e reanexe as 3 imagens de referência (abertura, volume, início).
[CONFIRMADO] = decidido pelo dono do projeto. Não mudar sem perguntar.
[PROPOSTA] = sugerido, aguardando aprovação.
[PENDENTE] = informação que falta.

1. Visão geral
- App de TV ao vivo chamado VEMBA TV PLUS. Slogan: "Assista o que ama, quando e onde quiser" (alterado pelo dono em 18/11/2026; antes era "Sempre consigo!").
- API pública [CONFIRMADO]: Base `https://api.reidoscanais.im`.
  - Rotas implementadas: `/channels`, `/sports?status=live`, `/search?q=<termo>`.
- Plataformas principais [CONFIRMADO]: Windows e Android (celular e Android TV).
- Prioridades [CONFIRMADO]: abrir e trocar de canal muito rápido; autoplay obrigatório; visual profissional sem nenhum botão de play ou volume visível; anúncios e redirecionamentos neutralizados.

2. Stack
[CONFIRMADO] Base única de código em React + TypeScript (Vite). Estado: Zustand.
- Player: Iframe com Sandbox rigoroso + Recorte/Overlay anti-controlos terceiros (nenhum botão nativo visível e bloqueio de cliques no iframe).
- Input: Gamepad API + Teclado unificados (`src/input/useInputController.ts`).

3. Estado atual
- Feito:
  - Remoção visual e funcional dos controlos terceiros do player (play, volume, barra inferior vermelha ocultados via recorte de container e overlay bloqueador).
  - Motor de Gamepad API (Xbox/PlayStation) e Teclado implementado com navegação em tempo real pela lista de canais, menu lateral e troca rápida de canais (LB/RB ou PageUp/PageDown).
- Lema trocado em Splash.tsx, Sidebar.tsx e SettingsScreen.tsx.
  - Projeto reorganizado em pastas: src/app, src/api, src/components, src/input, src/screens, src/store, src/styles.
  - Correções: seletor "Sinal" da aba TV não é mais cortado; dados carregam em paralelo com o splash; relógio atualiza sozinho; botões A/B/LB/RB do comando disparam uma vez por aperto (direções repetem com atraso); comando navega também em Início e Esportes; botões "Assistir via..." em Esportes tocam o evento no player (store.playSport).
- Sessão 5 (feito):
  - Barra inferior de informações (src/components/EpgBar.tsx): aparece 6s ao trocar de canal/servidor, mostra logo, programa atual (com horário e linha de progresso) e o seguinte. Usa `channel.epg.current/next` que já vem de `/channels`. Aceita tempo em segundos ou milissegundos. Em evento esportivo (sem EPG) mostra descrição/categoria. Fica no player normal e no ecrã inteiro.
  - Anel de volume (src/components/VolumeRing.tsx): círculo com degradê azul/rosa, ícone de som e percentagem, no centro da tela, some em 1,8s. Estado no store (volume, muted, volumeRingTick, adjustVolume, toggleMute). Volume guardado em localStorage.
  - Controles de volume: teclado + / - e M (mudo); comando LT/RT (gatilhos, botões 6 e 7) com repetição. Atalhos listados em Definições.
  - Ponte nativa opcional em src/app/native.ts: `window.vembaNative.setVolume(percent, muted)`. O iframe é de outro site, então o navegador não deixa mexer no volume dele; o anel só mexe no som de verdade quando a casca nativa (Electron/Android) implementar essa função.
- Sessão 6 (feito): novo visual do topo (TopBar.tsx), menu lateral com ícones (SideMenu.tsx) e tela Início nova (InicioScreen.tsx) com banner do canal em foco e fileira de canais, seguindo a imagem de referência. Guia TV e Rádios aparecem como "Em breve". Pesquisar e Notificações ficam apagados (sem tela nem dados). Definições passou para o topo. Favoritos: tecla F / botão Y na lista de TV, guardados em localStorage; sem favoritos, o Início mostra os 6 primeiros canais. Sidebar.tsx e HomeScreen.tsx antigos foram apagados.
- Falta aplicar o novo visual em TV Direto, Esportes e Definições.
- Falta (seção 6): Gestor de Canais (seta para cima), adicionar canal por embed (R3 / A), idioma e cidade/clima em Definições, barra de info com cidade e temperatura, alavanca direita para rolar listas, confirmação de sair, Rádios.
- Sessão 7 (feito): Select e Start + mapeamento do comando conforme a seção 6.
  - Select curto: menu horizontal de canais por cima do vídeo (ChannelMenu.tsx). No canal em foco mostra "Agora" e "A seguir" com hora de início e fim; os dois são selecionáveis. "Agora" assiste; "A seguir" agenda a troca. Chegando a hora, contagem de 15s com A (ir já) e B (cancelar) (CountdownOverlay em Overlays.tsx, vigia em useScheduleWatcher.ts). Start com o menu aberto também agenda o seguinte. Y com o menu aberto favorita.
  - Select segurado 3s: pergunta se quer ir às Rádios (as Rádios ainda não existem, responde "em breve").
  - Start curto: janela de Eventos Desportivos (EventsOverlay.tsx): jogos de hoje (equipas, competição, hora, Ao Vivo/Agendado) + eventos adicionados à mão (nome, data/hora, link https opcional; formulário só com teclado). Start segurado 3s: abre Definições.
  - Painel "Teste do comando" recriado em Definições (GamepadTest.tsx).
  - Programação (canais) atualizada de 5 em 5 minutos. Helpers de hora em src/api/epgTime.ts.
- Próximo passo: implementar `window.vembaNative.setVolume` na casca nativa (Windows) e tratar a EPG vazia/atrasada; depois empacotar.

4. Regras para a IA
- Responder em português.
- Entregar código completo, sem placeholders.
- Não alterar itens [CONFIRMADO] sem perguntar.
- Ritual de troca obrigatório: atualizar este HANDOFF.md ao fim de cada resposta que mude o estado do projeto.

5. Pendências conhecidas [PENDENTE]
- ZIP da sessão 5 não tinha o painel "Teste do comando" em Definições nem o favicon no index.html (o HANDOFF diz que existem). Conferir se a versão do dono está mais nova que o zip.
- Volume real: sem a casca nativa, o anel muda mas o som do iframe não muda. Definir como mexer: Electron (volume do sistema via módulo nativo) e Android (AudioManager). No Android TV o sistema já mostra o próprio anel.
- [RESOLVIDO sessão 5] EPG: start_time/end_time vêm em SEGUNDOS (10 dígitos). `formatted_time` vem em hora de Brasília e em texto longo; a barra agora calcula o horário pelos timestamps, no fuso do aparelho (Luanda), e usa formatted_time só como reserva.
- Autoplay: o iframe não aceita cliques (pointer-events none + escudo). Em navegador puro o vídeo/som pode ser bloqueado até haver um gesto do usuário. No app final liberar nativamente (Electron: autoplay-policy=no-user-gesture-required; Android WebView: setMediaPlaybackRequiresUserGesture(false)).
- Recorte de 54px do player (globals.css) é fixo; pode precisar de valor por provedor.
- Sem estado de erro quando a API falha (CORS, sem internet): fica em "A carregar transmissão...". Verificar o console (F12).
- "Ecrã inteiro" é só um overlay; falta requestFullscreen real no Windows.
- Windows/Android com a mesma base ainda depende de empacotar (Tauri/Electron/Capacitor); não está no package.json. No Android TV tratar o botão voltar no useInputController.
- PageUp chama próximo canal e PageDown o anterior (inverso do intuitivo); decidir se inverte.

6. Mapeamento do comando e teclado [CONFIRMADO pelo dono]
- LB / RB / Q / E: canal anterior / seguinte (PageUp/PageDown também).
- LT / RT / - / +: volume.
- X / M: mudo.
- Y / W: ecrã inteiro (ESC sai no PC). Com o menu de canais aberto, Y favorita.
- A / Enter: confirma. B / D: fecha qualquer menu e volta ao vídeo. [FALTA: sem menu aberto, confirmação para sair do app]
- Setas / D-Pad / analógico esquerdo: navegar. [FALTA: analógico direito para rolar listas longas]
- L3 / I: mostra a barra de informação inferior. [FALTA: cidade e temperatura]
- R3 / A: adicionar canal personalizado por link embed/iframe https. [FALTA]
- Seta para cima no vídeo: Gestor de Canais (reordenar, favoritar, ocultar, restaurar). [FALTA; hoje não faz nada em ecrã inteiro]
- Seta para baixo no ecrã inteiro: troca de servidor do canal. [FEITO]
- Select / V: toque curto abre o menu horizontal de canais; segurar 3s pergunta se quer ir às Rádios. [FEITO, Rádios em breve]
- Start / Espaço: toque curto (menu fechado) abre Eventos Desportivos; com o menu de canais aberto agenda a troca para o programa seguinte; segurar 3s abre Definições (idioma PT/FR/Lingala/EN e cidade do clima ainda por fazer).
- Favoritar canal: tecla F, ou Y dentro do menu de canais (Select).
- Programa a seguir agendado: ao chegar a hora, contagem de 15s; A vai já, B cancela.
