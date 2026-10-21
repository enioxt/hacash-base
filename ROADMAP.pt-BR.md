# Roadmap

Trabalho aberto na Hacash Base, dividido em tarefas pequenas que qualquer pessoa pode pegar.
English version: [ROADMAP.md](ROADMAP.md).

## Como pegar uma tarefa

1. Escolha uma issue com o rótulo [`good first issue`](https://github.com/enioxt/hacash-base/issues?q=is%3Aopen+label%3A%22good+first+issue%22) ou [`help wanted`](https://github.com/enioxt/hacash-base/issues?q=is%3Aopen+label%3A%22help+wanted%22).
2. Comente "vou pegar" na issue, para duas pessoas não fazerem o mesmo trabalho.
3. Abra um pull request pequeno que cumpra a lista "Done when" (pronto quando) da issue.
4. Um mantenedor revisa. Ajuste pequeno pode ir e voltar uma ou duas vezes.

Tamanho é estimativa, não medição: **P** até 2 horas · **M** até 1 dia · **G** mais de 1 dia. Nos rótulos do GitHub: `size:S`, `size:M`, `size:L`.
As regras de [Como contribuir](README.pt-BR.md#como-contribuir) valem para toda tarefa: fonte e data em cada afirmação, as duas línguas iguais, nunca chave ou seed em issue ou log.

## Agora

- Revisar o mapa de rotas em português, como falante nativo. [#3](https://github.com/enioxt/hacash-base/issues/3) · `translation` `good first issue` · P
- Revisar o mapa de rotas em inglês, como falante nativo. [#4](https://github.com/enioxt/hacash-base/issues/4) · `translation` `docs` `good first issue` · P
- Escrever sugestões de correção para os 6 erros do material oficial. [#7](https://github.com/enioxt/hacash-base/issues/7) · `docs` `good first issue` · P
- Criar uma ferramenta MCP só leitura para a taxa média. [#8](https://github.com/enioxt/hacash-base/issues/8) · `mcp` `good first issue` · P
- Testar sozinho o 2º endereço de `boot_nodes` do README do fullnode. [#13](https://github.com/enioxt/hacash-base/issues/13) · `node` `good first issue` · P
- Rodar os testes do MCP e a checagem do mapa de rotas na CI. [#14](https://github.com/enioxt/hacash-base/issues/14) · `tests` `good first issue` · P
- Traduzir o `mcp/README.md` para o inglês. [#5](https://github.com/enioxt/hacash-base/issues/5) · `docs` `translation` `mcp` `good first issue` · M
- Revisar o mapa de rotas em chinês, como falante nativo. [#1](https://github.com/enioxt/hacash-base/issues/1) · `translation` `help wanted` · M
- Revisar o mapa de rotas em turco, como falante nativo. [#2](https://github.com/enioxt/hacash-base/issues/2) · `translation` `help wanted` · M

## Próximo

- Redigir, no formato da doc oficial v2, as 20 rotas que faltam nela. [#6](https://github.com/enioxt/hacash-base/issues/6) · `api-map` `docs` `help wanted` · M
- Conferir os parâmetros do `api/rotas.json` com cada handler. [#15](https://github.com/enioxt/hacash-base/issues/15) · `api-map` `tests` `help wanted` · M
- Preparar o pacote MCP para o npm e o registro de MCP, sem publicar. [#10](https://github.com/enioxt/hacash-base/issues/10) · `mcp` `help wanted` · M
- Testar os pacotes da release 1.2.5 no Windows e no macOS. [#12](https://github.com/enioxt/hacash-base/issues/12) · `node` `help wanted` · M
- Criar um transporte HTTP remoto opcional no servidor MCP. [#9](https://github.com/enioxt/hacash-base/issues/9) · `mcp` `help wanted` · G
- Medir o binário da release sincronizando até a ponta da cadeia. [#11](https://github.com/enioxt/hacash-base/issues/11) · `node` `help wanted` · G

## Depois (ainda sem issue)

Para pegar um destes, abra uma issue antes.

- Medir a sincronia com validação completa (`fast_sync = false`): tempo e disco. · `node` · G
- Compilar a tag `1.2.5` do código e comparar com o commit `ce25368a`. · `node` · M
- Rodar o SDK WASM oficial e documentar um exemplo só de leitura. · `docs` · M
- Criar mais ferramentas MCP só leitura (hashrate, blocos recentes, lista de diamantes). · `mcp` · M
- Descobrir por que `/query/contract/sandboxcall` respondeu diferente em dois horários. · `api-map` · P
- Escrever o cenário de 6 passos da `fullnode#61` como teste de integração, como contribuição ao `hacash/fullnode` depois de ler a HIP-12. · `tests` · G
- Ligar cada HIP ao código e à altura de ativação; achar a HIP-19 e a HIP-24. · `docs` · G
- Comparar as fontes em chinês com as em inglês (white paper, `doc-chinese` e `doc`). · `translation` · M
- Somar os termos em turco ao glossário (seção 11 do `HACASH.pt-BR.md`). · `translation` · P
- Recontar as licenças dos repositórios `hacash` com uma régua declarada. · `docs` · P
