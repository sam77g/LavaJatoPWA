# Prompt 1: Adicionar Despesas ao app Lava Jato

## Contexto
PWA já funcional (HTML+CSS+JS puro, sem build, tema dark/verde) que controla receitas de um lava jato. Dados salvos no `localStorage`. Público-alvo: donos de lava jato com pouca experiência em tecnologia — sem jargão técnico, textos curtos, botões grandes.

## Única tarefa desta etapa
Adicionar uma aba de **Despesas**, simétrica à de receitas.

1. Nova aba na navegação inferior: "💸 Despesas".
2. Usuário cadastra categorias livremente (texto + botão "adicionar categoria"). Sem lista fixa.
3. Cada despesa tem: categoria, valor (R$), data, e tipo **fixa ou variável**:
   - Fixa: repete todo mês automaticamente, sem o usuário lançar de novo.
   - Variável: lançamento único, manual.
4. Lançar uma despesa **soma** ao que já existe no dia/mês (nunca substitui) — mesmo padrão já usado nas receitas.
5. Resumo de despesas por dia/semana/mês, reaproveitando os estilos visuais já existentes (`.wchart` para semana, `.mrow`/`.mtrack` para categoria no mês).
6. No topo da aba Mês, mostrar: `Receita − Despesa = Lucro`. Verde se positivo, vermelho se negativo. Sem termos como "margem" ou "EBITDA".

## Restrições técnicas
- HTML/CSS/JS puro, sem framework, sem build.
- Manter o tema dark/verde já existente (variáveis CSS em `:root`).
- Lógica de "salvar" sempre soma, nunca substitui.
- Sem login, sem dependência externa.
- Todo texto visível ao usuário em português simples, sem jargão.
- Incrementar a versão do cache em `sw.js` ao final.

## Entregável
`index.html` atualizado e `sw.js` (se necessário), prontos para colar no Netlify sem configuração extra.