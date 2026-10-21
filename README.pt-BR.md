# Hacash Base

Base de conhecimento aberta e ferramentas só de leitura para a rede Hacash.

**Para quem:** quem quer entender a Hacash, rodar um nó ou contribuir com ela.

Cada afirmação da base de conhecimento traz fonte e data, ou um ⚪ com onde buscar.
English version: [README.md](README.md).

## Comece em 3 passos

1. Clone este repositório.

   ```
   git clone https://github.com/enioxt/hacash-base
   cd hacash-base
   ```

2. Rode um nó leve no Linux com a release oficial 1.2.5: baixar, trocar 3 linhas (sincronia rápida, sem P2P de entrada e RPC fixada nesta máquina), rodar.

   ```
   curl -LO https://github.com/hacash/fullnode/releases/download/1.2.5/hacash_fullnode_ubuntu64.zip
   echo "7cdaec926eef0b7b2bedb9583b402efca8d51840c6c77da0837a91fc7e01bad1  hacash_fullnode_ubuntu64.zip" | sha256sum -c
   unzip hacash_fullnode_ubuntu64.zip -d ~/hacash-node && cd ~/hacash-node
   sed -i -e 's/^fast_sync = false$/fast_sync = true/' -e 's/^listen_port = 3337$/listen_port = 0/' -e 's/^\[server\]$/[server]\nlisten_ip = 127.0.0.1/' hacash.config.ini
   diff <(grep -E '^(\[|fast_sync|listen_port|listen_ip|enable)' hacash.config.ini) - <<'EOF' && chmod +x hacash_fullnode_ubuntu && HACASH_DB_SMALL_MACHINE=1 ./hacash_fullnode_ubuntu
   [engine]
   fast_sync = true
   [p2p]
   listen_port = 0
   [server]
   listen_ip = 127.0.0.1
   enable = true
   listen_port = 8082
   [mint]
   [miner]
   [diamond_miner]
   [vm]
   EOF
   ```

   Isto baixa e executa um programa: rodar a release é confiar em quem a publica (a organização `hacash` no GitHub). a conferência de SHA-256 acima liga o arquivo ao que o GitHub publica para a release 1.2.5 (o mesmo digest está na página da release e em `gh api repos/hacash/fullnode/releases/tags/1.2.5`); ela não prova quem compilou. Se você não quer rodar um binário desse publicador, pule este passo: leia só a base de conhecimento, ou compile do código depois de ler o fonte (alternativa abaixo). O `diff` compara só as linhas que importam para a segurança (não valida o arquivo inteiro, e não auditamos o binário) com o que a release 1.2.5 deve ter depois do `sed`: sincronia rápida ligada, sem P2P de entrada, RPC em 127.0.0.1:8082 e nenhuma linha `enable` em `[miner]` ou `[diamond_miner]` (mineração desligada). Se o `diff` imprimir qualquer coisa, **o nó não sobe**: pare ali, não mude nada à mão e abra uma issue com essa saída.

   As 2 primeiras linhas: `fast_sync = true` (sincronia rápida) e `[p2p] listen_port = 0` (sem conexões de entrada). O terceiro `sed` escreve `listen_ip = 127.0.0.1` em `[server]`, então a RPC escuta só nesta máquina (porta 8082; é também o padrão do código, [`base/src/api/config.rs:17`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/base/src/api/config.rs#L17), commit `ce25368a`). A mineração vem desligada. A RPC não tem autenticação: só abra para uma rede atrás de firewall ou proxy.
   No teste (21/10/2026) a API respondeu em 0,5 s e o nó tinha 30.000 blocos após 60 s. ⚪ O tempo até a ponta com o binário da release não foi medido (seção 2.1 do [HACASH.pt-BR.md](HACASH.pt-BR.md)).
   Para compilar do código, a alternativa é `bash scripts/rodar-no.sh` (com o Rust já instalado, <https://rustup.rs>; o script não instala nada; cerca de 3 min para compilar, 12 min para sincronizar, 2,1 GB de disco).

3. Consulte o seu nó.

   ```
   curl -s http://127.0.0.1:8082/query/latest
   ```

   Formato esperado (números de 21/10/2026; mudam): `{"ret":0,"height":792751,"diamond":138627}`.

## Consultar com uma IA (MCP)

Um servidor MCP só de leitura, em [`mcp/`](mcp/), responde 8 perguntas: altura, oferta, saldo, diamante, transação, bloco, ativo e canal de pagamento.
Ainda não está no npm. A partir de um clone deste repositório:

```
cd mcp && bun install
claude mcp add hacash --scope user -e HACASH_RPC_URL=http://127.0.0.1:8082 -- bun "$PWD/src/cli.ts"
```

Depois pergunte à sua IA, por exemplo: "Qual é a altura atual do bloco da Hacash e a oferta em circulação?"

Ele não assina, não transmite e não cria conta. Só chama 8 rotas `GET`, na URL definida em `HACASH_RPC_URL`. Só leitura não é privacidade: toda consulta, inclusive o endereço ou hash que você pergunta, vai para essa URL (o seu nó local por padrão; o endpoint público `rpcapi.hacash.org` é operado pela comunidade, sem garantia nossa, e só funciona em `http://` puro: o certificado HTTPS dele não cobre esse nome, conferido em 21/10/2026. Por isso não mande a ele endereço nem consulta que você quer privada; prefira o seu nó). `claude mcp add --scope user` grava a configuração para o seu usuário; para remover: `claude mcp remove hacash`. Outros clientes (Codex, Claude Desktop): veja [mcp/README.md](mcp/README.md).

## O que tem aqui

| arquivo | o que é |
|---|---|
| [HACASH.pt-BR.md](HACASH.pt-BR.md) · [HACASH.md](HACASH.md) | a base inteira, 11 seções, em português e inglês |
| [api/rotas.json](api/rotas.json) | as 55 rotas do nó: método, parâmetros, handler Rust (`arquivo:linha`), risco, exemplo real |
| [scripts/rodar-no.sh](scripts/rodar-no.sh) | alternativa ao passo 2: compila do código e roda um nó só de leitura; rodar de novo reaproveita o que existe e recusa config que minera ou abre a RPC |
| [mcp/](mcp/) | servidor MCP só de leitura (8 ferramentas), com testes e README próprio |
| [apresentacao/](apresentacao/) | deck curto em inglês e português |
| [SECURITY.md](SECURITY.md) | o que este projeto não toca |

Seções do HACASH.pt-BR.md:

1. O que é a Hacash
2. Rodar um nó
3. Repositórios e licenças
4. API do nó
5. Governança
6. HIPs
7. Issues e PRs
8. Onde contribuir, com as primeiras tarefas
9. Divergências
10. Lacunas
11. Glossário

## Opções do script de compilação (`scripts/rodar-no.sh`)

| variável | padrão | significado |
|---|---|---|
| `HACASH_PASTA` | `$HOME/hacash` | pasta de trabalho |
| `HACASH_MODO` | `leve` | `leve` = sincronia rápida; `completo` = valida cada bloco (tempo não medido) |
| `HACASH_RPC_PORTA` | `8082` | porta HTTP local |
| `HACASH_REF` | `ce25368a` | commit ou tag do `fullnode` a compilar |

A RPC escuta só em `127.0.0.1`. Mineração e P2P de entrada ficam desligados.

## Como contribuir

1. Meça antes de escrever. Cada afirmação precisa de fonte (`arquivo:linha`, comando ou URL) e data.
2. Se não deu para medir, marque `⚪` e diga onde buscar.
3. Altere as duas línguas: `HACASH.md` e `HACASH.pt-BR.md` mantêm os mesmos números e caminhos.
4. Abra uma issue ou um pull request pequeno neste repositório.
5. Nunca cole chave privada, seed ou senha em issue, PR ou log.

Mudanças na própria Hacash vão para os repositórios da Hacash e seguem a HIP-12 (seção 5 do `HACASH.pt-BR.md`).

## Licença

Nosso texto, catálogo de rotas, scripts, deck curto e código do servidor MCP (`mcp/`): MIT ([LICENSE](LICENSE); escopo em [NOTICE.md](NOTICE.md)). As fixtures de teste em `mcp/test/fixtures/` são respostas gravadas de um nó a consultas públicas de leitura (saída factual).
O código da Hacash pertence aos seus autores. 19 dos 33 repositórios `hacash` não tinham arquivo de licença em 21/10/2026 (seção 3). Este repositório não copia código deles.
