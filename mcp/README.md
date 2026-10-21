# @egosbr/mcp-hacash

Read-only MCP server that lets any AI client query a Hacash fullnode: block height, supply, balance, diamond, transaction, block, asset, payment channel.

> **SOMENTE LEITURA.** Este servidor não assina, não transmite transação, não cria conta e não recebe chave privada de ninguém. Oito consultas de leitura, só `GET`, numa lista fechada de rotas, enviadas à URL que você configurar em `HACASH_RPC_URL` (padrão: o seu nó local). Se algum dia você vir um pedido de chave, seed ou senha ligado a ele, não é este pacote. **Só leitura não é privacidade:** cada consulta, inclusive o endereço ou hash que você pergunta, é enviada à URL de `HACASH_RPC_URL`; quem opera esse endpoint a vê.

## Estado (21/10/2026)

- Versão 0.2.0: código e testes prontos (89, com nó falso; eram 62 na 0.1.0). **Ainda não publicado no npm.**
- **Provado ao vivo, 21/10:** as ferramentas (5 na 0.1.0; as 3 novas da 0.2.0 também, ver o CHANGELOG), chamadas por um cliente MCP real via stdio contra o fullnode 1.2.5 local (`http://127.0.0.1:8082`, ~792,7 mil blocos), devolveram dado correto, em 2 a 16 ms cada. As fixtures dos testes são **gravações reais** desse nó, com SHA-256 conferido pela suíte (`test/fixtures.test.ts`).
- Divergência código × rede achada na gravação e corrigida: sem `unit`, o nó devolve valores como `178446320557:240`; com `unit=mei`, como decimal (`1784.46320557`). As ferramentas pedem `unit=mei` e também entendem o outro formato.
- ⚪ **Nó padrão e nó público.** Padrão = `http://127.0.0.1:8082`: é a porta HTTP do código ([`config.md:90`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/config.md#L90), `hacash/fullnode` no commit `ce25368a`) e a que respondeu ao vivo. A documentação v1 do site cita 8081, que está errada. Alternativa documentada: `http://rpcapi.hacash.org`, **operado pela comunidade**, e só em `http` puro: o certificado HTTPS dele cobre `hacash.org`, `www`, `explorer` e `wallet`, não `rpcapi`, e a verificação falha (conferido em 21/10/2026, curl código 60). Tudo que você envia por ele (endereço, hash) trafega sem criptografia (⚪ sem garantia nem SLA nossos; as respostas das 5 consultas foram conferidas idênticas às do nó local em 21/10, e essa comparação não foi refeita neste pacote). Uso, só para dado público e sem endereço seu: `HACASH_RPC_URL=http://rpcapi.hacash.org`. Para dado que importa ou que você quer privado, rode o seu nó.

## As oito ferramentas

| Ferramenta | Entrada | Rota do nó (só GET) | Handler Rust (`hacash/fullnode@ce25368a`) |
|---|---|---|---|
| `hacash_altura` | nenhuma | `/query/latest` | `mint/src/api/query/supply.rs:40` (JSON em `:33`) |
| `hacash_supply` | nenhuma | `/query/supply` | `mint/src/api/query/supply.rs:7` (JSON em `mint/src/api/util/supply.rs:8`) |
| `hacash_saldo` | `endereco` (1 só, base58); `com_nomes_diamantes` (opcional) | `/query/balance` | `mint/src/api/query/balance.rs:129` (item em `:98`) |
| `hacash_diamante` | `nome` (6 letras de `WTYUIAHXVMEKBSZN`) **ou** `numero` (1 a 16777215) | `/query/diamond` | `mint/src/api/query/diamond.rs:12` (JSON em `mint/src/api/util/diamond.rs:55`) |
| `hacash_transacao` | `hash` (64 hex); `incluir_acoes` (opcional) | `/query/transaction` | `mint/src/api/query/tx.rs:50` (JSON em `mint/src/api/util/tx.rs:88`) |
| `hacash_bloco` | `altura` (a partir de 1) **ou** `hash` (64 hex); `incluir_hashes_tx` (opcional) | `/query/block/intro` | `mint/src/api/query/block.rs:9` (JSON em `mint/src/api/util/block.rs:43`) |
| `hacash_ativo` | `serial` (inteiro, 0 a 2^61 − 1; acima de 2^53, mande como texto) | `/query/asset` | `mint/src/api/query/asset.rs:31` (JSON em `:14`) |
| `hacash_canal` | `id` (32 hex) | `/query/channel` | `mint/src/api/query/channel.rs:9` (JSON em `mint/src/api/util/channel.rs:23`) |

As rotas estão registradas em `mint/src/api/mod.rs:78-82,106,110,115`. Parâmetro inválido é barrado **antes** de chamar o nó.

Cada resposta traz `no` (de qual nó veio) e `rota`. Valores em HAC saem como texto decimal exato (`hacash_hac`, `taxa_hac`, `taxa_recebida_hac`, `taxa_lance_hac`, `recompensa_hac`, e `hac` nos lados do canal): o servidor pede `unit=mei` ao nó e, se vier `mantissa:unidade` (`178446320557:240`; regra em `field/src/types/amount.rs:15`), converte sem ponto flutuante. Em `hacash_supply`, os valores em HAC saem do nó como número de ponto flutuante (`mint/src/api/util/request.rs:16`): têm precisão limitada, é do nó.

**Atenção em `hacash_saldo`:** endereço sem histórico volta **zerado**, não erro (o nó trata conta desconhecida como vazia, `balance.rs:165`). Zero aqui não prova que o endereço existe.

**Notas da 0.2.0 (o que o nó 1.2.5 tem e o que não tem):**
- **Bloco:** o 1.2.5 não registra `/query/block` puro. A rota de bloco por altura ou hash é `/query/block/intro` (`mod.rs:110`). `numero_transacoes` não conta a coinbase (`util/block.rs:74`), e a lista de hashes também a pula (`:81`). Altura 0 é barrada: o handler trata `height=0` como ausente (`block.rs:14`). Bloco diferente do pedido ou lista de hashes que não bate com o total vira `resposta_invalida`.
- **Ativo:** a resposta traz ticker (`ticket` no nó), nome, casas decimais e oferta, em átomos e em decimal exato (átomos ÷ 10^casas; "supply {} atoms, {} decimals", `mint-core/src/action/asset.rs:13`). ⚪ **Emissor não sai:** ele existe no estado (`AssetSmelt.issuer`, `field/src/types/asset.rs:106`), mas `/query/asset` não o devolve (`asset.rs:14-28`), e esta ferramenta não o inventa. Serial sem registro volta `metadados: false` com uma nota, não erro (o nó não diferencia ativo inexistente de ativo com mais de 16 casas, `asset.rs:17-27`).
- **Canal:** estado com código e nome (`0 aberto`, `1 em_desafio`, `2 fechado_por_acordo`, `3 fechado_por_arbitragem`; `field/src/types/channel.rs:140-143`), alturas, os dois lados (endereço, HAC, satoshi) e, quando existem, `desafio`, `distribuicao` e `chegada_final` (com juros). Canal aberto tem `fechado_na_altura: null`.

## Provado ao vivo (0.2.0, 21/10/2026)

Cliente MCP real (`@modelcontextprotocol/sdk`, `StdioClientTransport`) subindo `bun src/cli.ts` por stdio, contra o fullnode 1.2.5 local (`HACASH_RPC_URL=http://127.0.0.1:8082`, altura 792.746). Saída resumida (campo `no` omitido; tempo é o da chamada MCP inteira):

```
ferramentas: 8 (as 5 da 0.1.0 + hacash_bloco, hacash_ativo, hacash_canal)
hacash_bloco {altura: 583881, incluir_hashes_tx: true} → 19 ms
  hash 000000000009159f…11812ba · minerador 18cjpz3n…wtx7ww · recompensa_hac "8" · mensagem "baokuai"
  numero_transacoes 2 · hashes_transacoes [d951dff1…cb37e5e0, b563b525…f74b95cbb4]  (o 2º é a tx das fixtures de hacash_transacao)
hacash_bloco {hash: 000000000009159f…11812ba} → 13 ms · altura 583881, mesmo bloco, sem lista de hashes
hacash_bloco {altura: 99999999} → erro nao_encontrado ("block query failed: block not found"), 9 ms
hacash_ativo {serial: 2000} → 20 ms · ticker HACDS · nome hacds · casas 8 · oferta_atomos "5963298700000000" · oferta "59632987"
hacash_ativo {serial: "2001"} → 5 ms · metadados false, com nota (não é erro)
hacash_canal {id: 42d93291…5f0476c0} → 12 ms · fechado_por_acordo · aberto 36428, fechado 147481
  esquerda 504.99 HAC → chegada final 510.5727479397 · direita 539.9999 HAC → chegada final 545.969688172928 (juros)
hacash_canal {id: cdfb81f2…53666bc3} → 6 ms · aberto desde 274651 · 1 HAC de cada lado · fechado_na_altura null
hacash_canal {id: 00…00} → erro nao_encontrado ("channel not found"), 6 ms
```

As fixtures dos testes da 0.2.0 são gravações desse mesmo nó (SHA-256 conferido em `test/fixtures.test.ts`). Os ids de canal foram achados varrendo os blocos crus (`/query/block/datas`) atrás da ação ChannelOpen (kind 2, `mint-core/src/action/channel.rs:6`) e confirmados um a um em `/query/channel`. Nenhum canal em desafio existe hoje no nó local: esse caso é testado com fixture sintética, marcada.

## Limites e falhas

- **1 chamada por vez** (fila interna) e **1 tentativa por chamada**: sem retry. `state changed` do nó vem como erro com `transitorio: true`; quem decide tentar de novo é você.
- **Prazo total de 10 s** por chamada (conexão e corpo juntos), imposto por um temporizador que cancela o leitor da resposta: um nó que manda um pedaço e trava não prende a fila (`tempo esgotado lendo o corpo`). Resposta acima de 1 MiB é recusada.
- **Erro explícito**, nunca resposta inventada. Campo `erro` em: `no_inacessivel` (nó fora do ar, porta fechada ou HTTP desligado), `timeout`, `http` (com `status`), `resposta_invalida` (não é JSON ou o campo esperado não veio), `resposta_grande`, `no_recusou` (o nó respondeu `ret: 1`, com `mensagem_do_no`), `nao_encontrado` (diamante, transação, bloco ou canal que o nó não conhece), `parametro_invalido`.
- **Fora do escopo, por desenho:** `/create/account` (`api/src/account.rs:39`, devolve chave), `/util/transaction/sign` e `/submit/transaction` (`mint/src/api/mod.rs:117,121`), mineração e rotas administrativas. O cliente RPC recusa qualquer rota que não esteja nas oito, e um teste varre o código-fonte atrás de rota de escrita. Assinatura e transmissão, se vierem, serão outro pacote, local, com autorização explícita da pessoa.

## Configuração

Uma única variável: `HACASH_RPC_URL`, a URL HTTP do fullnode (padrão `http://127.0.0.1:8082`; nó público alternativo, operado pela comunidade: `http://rpcapi.hacash.org`, sem criptografia, ver o Estado acima). Aceita `http` e `https`. Com `http` a consulta, inclusive o endereço consultado, trafega sem criptografia: use `http` só para o seu nó em `127.0.0.1` e `https` para qualquer outro endpoint que tenha certificado válido, e prefixo de proxy (`https://exemplo.test/hacash`). Recusa credencial na URL, query e fragmento (segredo em URL vai parar em log).

No `hacash/fullnode` do commit `ce25368a` (21/10/2026), o padrão do código é HTTP **desligado** (`enable = false`, [`config.md:88-90`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/config.md#L88-L90)) e, ligado, escuta em `127.0.0.1:8082`; o `hacash.config.ini` da release 1.2.5 já vem com `[server] enable = true`. Outra versão pode ter outro padrão. O passo 2 do [README](../README.md) fixa `listen_ip = 127.0.0.1` nessa config e só deixa o nó subir se o `diff` das linhas de segurança bater; confira o endereço antes de iniciar (`curl -s http://127.0.0.1:8082/query/latest` só deve responder daqui, não de outra máquina). Se for abrir para a rede, use firewall ou proxy (aviso do próprio `README.md` do nó): a RPC não tem autenticação.

### Claude Code

Hoje, a partir de um clone de `hacash-base` (substitua o caminho):

```bash
claude mcp add hacash --scope user -e HACASH_RPC_URL=http://127.0.0.1:8082 -- bun /caminho/para/hacash-base/mcp/src/cli.ts
claude mcp list   # hacash ... ✔ Connected
```

Depois de publicado (⚪ ainda não): `claude mcp add hacash --scope user -e HACASH_RPC_URL=http://127.0.0.1:8082 -- npx -y @egosbr/mcp-hacash`.

### Codex (`~/.codex/config.toml`)

```toml
[mcp_servers.hacash]
command = "bun"
args = ["/caminho/para/hacash-base/mcp/src/cli.ts"]
env = { HACASH_RPC_URL = "http://127.0.0.1:8082" }
```

### Claude Desktop e outros clientes stdio (`claude_desktop_config.json`)

```json
{ "mcpServers": { "hacash": { "command": "bun", "args": ["/caminho/para/hacash-base/mcp/src/cli.ts"], "env": { "HACASH_RPC_URL": "http://127.0.0.1:8082" } } } }
```

### ChatGPT

⚪ **Não funciona com este pacote ainda.** Em 21/10/2026 o ChatGPT conectava a servidor MCP **remoto** (endereço HTTPS), não a um processo local; este pacote fala só stdio. Falta o MCP remoto (HTTPS, somente leitura, com limites), possível etapa futura, **não feita nem testada**. Antes de qualquer exposição pública seria preciso restringir CORS e bloquear as rotas administrativas. Onde buscar: documentação oficial do ChatGPT sobre servidores MCP personalizados, que varia por plano.

## Desenvolvimento

```bash
bun test test/        # 89 testes, nó falso em porta local, sem rede externa
bun run typecheck
bun run build         # dist/cli.mjs (bundle para Node >= 18.15)
```

Estrutura: `src/rpc.ts` (cliente: rotas fechadas, fila, timeout, erros), `src/ferramentas.ts` (as 8, com a citação do handler), `src/servidor.ts` (MCP stdio), `src/hac.ts` (`mantissa:unidade` e átomos de ativo para decimal), `test/fixtures.ts` + `test/fixtures/` (gravações reais do nó, com SHA-256; poucas sintéticas, marcadas).

## Licença

MIT. Nenhum código do `hacash/fullnode` foi copiado: só o **formato** das respostas foi lido (o repositório não declara licença na raiz, confirmar antes de reaproveitar código dele).
