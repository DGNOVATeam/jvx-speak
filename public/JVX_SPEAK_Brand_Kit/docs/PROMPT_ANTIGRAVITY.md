# PROMPT PARA ANTIGRAVITY — JVX SPEAK

Você está trabalhando no projeto EXISTENTE JVX SPEAK, publicado em https://jvx-speak.vercel.app/. NÃO recrie o aplicativo do zero. Antes de alterar, examine a estrutura atual (React/Vite/TS ou stack efetiva), componentes, rotas, estilos, assets, PWA e configurações de deploy. Preserve lógica de negócios, autenticação, Supabase, integrações, fluxos e dados.

## Objetivo
Aplicar a identidade visual JVX SPEAK usando os arquivos deste pacote como assets independentes. Marca: JVX (branco/azul-marinho) + SPEAK (dourado), símbolo de balão de conversa, ondas de voz e arco dourado. Assinatura: AI LANGUAGE ACADEMY. Slogan: Learn. Speak. Evolve.

## Arquivos
- `logos/`: SVG e PNG transparentes, versões para fundo claro/escuro, horizontal e símbolo isolado.
- `icons/`: SVG e PNG individuais em dourado, azul-marinho e branco; ícones PWA com fundo sólido e símbolo transparente separado.
- `buttons/`: referências visuais; **implementar botões como componentes reais** com HTML/CSS/Tailwind, NÃO como imagens clicáveis.
- `brand/tokens.json` e `brand/jvx-speak.css`: paleta e estilos de referência.

## Cores
Navy #0B1F3B; Gold #D4AF37; White #FFFFFF; Surface #F4F6FA; Blue #1F4E79. Estas são cores do conceito aprovado; validar contra a identidade oficial da JVX se houver manual de marca.

## Implementação
1. Faça inventário dos componentes atuais e apresente plano de alteração visual antes de executar mudanças destrutivas.
2. Centralize tokens em Tailwind/CSS variables; preserve contraste WCAG AA, foco visível e navegação por teclado.
3. Substitua logo no header/sidebar/login por variante correta conforme o fundo; use SVG preferencialmente.
4. Atualize favicon, apple-touch-icon e PWA manifest (`icons/app-icon-192.png`, `icons/app-icon-512.png`, `icons/app-icon-180.png`), conferindo caminhos finais e cache de service worker.
5. Use os ícones individuais nas áreas: Início, Cursos, Níveis A1–C2, Aulas, Prática de fala, Tutor IA, Metas, Progresso, Conquistas, Configurações. Ícones de apoio: globo, chat, prova, revisão, calendário, fones, perfil.
6. Botão primário: dourado com texto navy; secundário: contorno dourado; fundos navy; superfícies claras onde fizer sentido. Preserve responsividade desktop/mobile.
7. Não substitua textos por imagens. Não use a imagem do moodboard como fundo geral. Evite re-renderizar logotipos via OCR/recortes da prancha.
8. Teste visualmente páginas existentes, dark/light, mobile, rotas, login, console, build e deploy Vercel. Não faça deploy sem verificar alterações.
9. Entregue relatório de arquivos modificados, screenshots antes/depois e pendências.

## Observações
Os SVGs são desenhos vetoriais novos e fiéis ao conceito visual, não uma vetorização pixel a pixel do mockup gerado por IA. Ajustes finos podem ser feitos preservando a identidade. O app já existe: priorize uma migração visual segura.
