# Hacash: fonte única de conhecimento

> Base aberta, em PT-BR, sobre a rede Hacash. Verificada em **21/10/2026**: código `hacash/fullnode` no commit `ce25368a` (versão 1.2.5), GitHub e sites consultados no mesmo dia.
> **Regra:** cada afirmação traz de onde veio (arquivo:linha, comando ou URL) e a data. Onde não foi medido, aparece `⚪` com **onde buscar**.
> Este texto organiza o que já existe. Não substitui o código, as HIPs nem os mantenedores.
> English version: [HACASH.md](HACASH.md). Rotas em formato de máquina: [`api/rotas.json`](api/rotas.json).

## Sumário

1. O que é a Hacash
2. Como rodar um nó (pacote da release, testado; compilar no apêndice)
3. Mapa dos repositórios (33) e licenças
4. APIs do nó (55 caminhos, medidos)
5. Governança e canais
6. HIPs (propostas de melhoria)
7. Issues e PRs abertos (55 + 5) e como estão organizados
8. Onde contribuir (com as primeiras tarefas para quem chega)
9. Divergências entre fontes
10. Lacunas (não medido), cada uma com endereço
11. Glossário para tradução

---

## 1. O que é a Hacash

> Medido em 21/10/2026. Código: `hacash/fullnode`, commit `ce25368a`, versão 1.2.5.
> Cada fato traz a fonte. `⚪` marca o que não foi medido, com "onde buscar".

A Hacash é uma rede de prova de trabalho (PoW) com a moeda **HAC** (símbolo ㄜ) e o **HACD**, diamante digital único obtido em leilão de lances; a transferência de mão única de **BTC** (HIP-13) está prevista e não moveu nenhum BTC até agora (`transferred_bitcoin = 0` em `/query/supply`, 21/10/2026). A explicação completa é do próprio projeto e não é repetida aqui: whitepaper `https://hacash.org/whitepaper.pdf`, `https://hacash.org` e `https://hacash.money`. Esta seção guarda só o que medimos.

### Estado medido em 21/10/2026, 09:35

Nó local sincronizado. As 5 respostas foram conferidas byte a byte com o nó público (ver seção 2.2).

| medida | valor | fonte |
|---|---|---|
| altura do último bloco | 792.727 | `GET /query/latest` |
| HACD minerados | 138.622 | `GET /query/latest` e `/query/supply` |
| circulação de HAC | 1.909.386,75 | `GET /query/supply` → `current_circulation` |
| HAC queimado em taxas | 1.634.517,69 | `GET /query/supply` → `burned_fee` |
| canais de pagamento abertos | 26 (depósito 97.834,00 HAC) | `GET /query/supply` |
| contratos implantados / ativos criados | 11 / 8 | `GET /query/supply` → `contract_deploy_count`, `created_asset` |
| BTC transferido pela ponte | 0 | `GET /query/supply` → `transferred_bitcoin` |
| alvo de bloco | 300 s | `GET /status` → `block_target_seconds` |
| poder de mineração | alvo 5,03 GH/s · tempo real 4,19 GH/s | `GET /query/hashrate` |
| blocos do último dia por pool (288 blocos) | maior pool 146 (50,7%) | `GET /query/block/pools` |

### Medido no código e no GitHub

- **Dificuldade:** **ASERT** desde a altura **738.654** (`mint/src/consensus/difficulty.rs:9`). A palavra "LWMA" não aparece no código da 1.2.5 (busca em `*.rs` e `*.md`, 21/10/2026).
- **Istanbul:** ativa na altura **765.432** (`hacash-params/src/lib.rs:164`, campo `asset_alive_height`). Texto oficial: `hacash/doc/tech/istanbul_upgrade.md`.
- **Versão mais recente:** 1.2.5, de 17/10/2026. Mudou a "magia" P2P: nós 1.2.4 não conectam com nós 1.2.5 (notas da release, `https://github.com/hacash/fullnode/releases/tag/1.2.5`). Seis versões entre 22/09 e 17/10/2026 (1.2.0 a 1.2.5).
- **Quem escreve o código:** no `fullnode`, o mantenedor principal tem 384 dos 398 commits listados pela API de contribuidores (96,5%); outras 3 contas somam 14 (`gh api repos/hacash/fullnode/contributors`, 21/10/2026).

---

## 2. Como rodar um nó (testado em 21/10/2026)

> Máquina de teste: Ubuntu 24.04, 8 núcleos, 15 GB de RAM.
> Caminho curto: baixar o pacote da release, trocar 2 linhas da configuração e rodar (2.1). Compilar do código fica no apêndice (2.3).
> O passo a passo oficial existe (`https://hacash.org/run-full-node`, "two steps"), mas mostra o log do nó Go 0.1.17 (seção 9).

### 2.1 Caminho curto: baixar, trocar 2 linhas, rodar

**1. Baixar** o pacote da release 1.2.5 e conferir o hash:

```
curl -LO https://github.com/hacash/fullnode/releases/download/1.2.5/hacash_fullnode_ubuntu64.zip
sha256sum hacash_fullnode_ubuntu64.zip
# esperado: 7cdaec926eef0b7b2bedb9583b402efca8d51840c6c77da0837a91fc7e01bad1
unzip hacash_fullnode_ubuntu64.zip -d hacash
```

- O zip tem 7.504.517 bytes. O SHA-256 bate com o `digest` que a API do GitHub publica para o arquivo (21/10/2026).
- Conteúdo: `hacash_fullnode_ubuntu`, `hacash_fullnode_ubuntu_16.04` e `hacash.config.ini` (951 bytes, datado de 06/09/2026).

**2. Trocar 2 linhas** do `hacash.config.ini`, para um nó leve e só de leitura:

| seção | linha do zip | trocar para | por quê |
|---|---|---|---|
| `[engine]` | `fast_sync = false` | `fast_sync = true` | sincronia rápida; pula a validação completa dos blocos históricos |
| `[p2p]` | `listen_port = 3337` | `listen_port = 0` | não aceita conexões de entrada (`node/src/transport.rs:124`) |

- Não precisa mexer: o RPC já escuta só em `127.0.0.1` por padrão (`base/src/api/config.rs:17`), na porta 8082.
- `[miner]` e `[diamond_miner]` vêm com `enable` comentado; o padrão é desligado. Os valores de exemplo dessas seções (endereço de recompensa, senha de lance) ficam sem efeito.
- Se a porta 8082 já estiver em uso, troque também `[server] listen_port` (no teste: 8093, porque havia outro nó na 8082).

**3. Rodar**, sem argumento. O binário lê o `hacash.config.ini` da própria pasta e grava os dados em `./hacash_mainnet_data`, ao lado:

```
cd hacash
chmod +x hacash_fullnode_ubuntu
HACASH_DB_SMALL_MACHINE=1 ./hacash_fullnode_ubuntu
```

Medido em 21/10/2026, com usuário comum, dentro de uma caixa de areia (`bwrap`, pasta pessoal oculta) e parado aos 60 s:

| medida | valor |
|---|---|
| versão impressa | `full node v1.2.5, build time: 2026/10/17 #1, database version: 1, backend: leveldb-sys` |
| API respondendo | 0,5 s (altura 0) |
| primeira altura acima de 0 | 14,5 s (altura 9.049; a sincronia vem em lotes de 10.000 blocos) |
| altura após 60 s | 30.000 (3,78% da ponta, que era 792.752) |
| memória residente aos 60 s | 38 MB (38.432 kB) |
| disco da pasta de dados aos 60 s | 10,9 MB |
| pares P2P em 60 s | 10 (os 3 `boot_nodes` do arquivo responderam) |

- A pasta `docs.loc/` que o README do `fullnode` manda copiar **não vem no zip**. O que vem é o próprio `hacash.config.ini`, na raiz, ao lado do binário. Quem baixa a release não tem o problema descrito em 2.3.3.
- O binário da release usa o banco **LevelDB**. O compilado com o comando padrão de 2.3.2 usa `sled`.
- ⚪ Os números aos 60 s não se comparam com os de 2.3.4 (12 min até a ponta, 2,1 GB, 640 MB): o teste parou antes. Onde buscar: repetir 2.1 sem parar e medir até a ponta.
- ⚪ Os pacotes para Windows e macOS não foram testados. Onde buscar: `https://github.com/hacash/fullnode/releases/tag/1.2.5`.

### 2.2 Cinco chamadas RPC reais (nó local × nó público `http://rpcapi.hacash.org`)

Medidas no nó compilado (2.3), mesma versão 1.2.5. O endereço e a transação são exemplos públicos tirados da documentação oficial (`fullnode_api_doc_v2.md`); nenhum endereço nosso foi enviado.
O nó público foi consultado em `http://` puro, porque o certificado HTTPS dele não cobre `rpcapi.hacash.org` (erro 7 da seção 9). Tudo que se envia a ele pode ser lido na rede.
Nenhuma chave, nenhuma carteira, nenhuma transmissão.

| # | consulta | local | público | resposta |
|---|---|---|---|---|
| 1 | altura: `GET /query/latest` | 200 · 0 ms | 200 · 378 ms | `{"ret":0,"height":792727,"diamond":138622}` |
| 2 | oferta: `GET /query/supply` | 200 · 3 ms | 200 · 382 ms | 1.130 bytes; `current_circulation` 1909386.7536 |
| 3 | saldo: `GET /query/balance?address=1AVRuFXNFi3rdMrPH4hdqSgFrEBnWisWaS&unit=mei` | 200 · 1 ms | 200 · 359 ms | `{"hacash":"1784.46320557","diamond":1,"satoshi":0}` |
| 4 | diamante: `GET /query/diamond?number=20001` | 200 · 1 ms | 200 · 369 ms | `name":"ZAKXMI"`, 506 bytes |
| 5 | transação: `GET /query/transaction?hash=b563b525…cbb4&action=true&unit=mei` | 200 · 1 ms | 200 · 338 ms | bloco 583.881, taxa 0,0001 HAC, 448 bytes |

- As 5 respostas são **idênticas byte a byte** entre local e público (`cmp`).
- A API devolve **HTTP 200 mesmo em erro**. O erro vem no corpo: `{"ret":1,"err":"..."}`.
- Exemplos de todas as rotas, com SHA-256: [`api/rotas.json`](api/rotas.json).

### 2.3 Apêndice: compilar do código

> Para quem quer o binário a partir do código-fonte. O README, o `build.md` e o `config.md` do `fullnode` já cobrem isto; aqui ficam os números medidos.
> Atalho: [`scripts/rodar-no.sh`](scripts/rodar-no.sh) faz os 4 passos abaixo.

#### 2.3.1 Preparar

1. Instale o Rust estável só para o seu usuário, com o instalador oficial em <https://rustup.rs> (o teste usou o perfil mínimo; leia o que o instalador faz antes de aceitar).
   Versão usada no teste: `rustc 1.99.1`. O projeto exige a edição 2024 (README do `fullnode`).
2. O `pkg-config` **não** estava instalado e o build passou com o banco padrão (`sled`).
   O README manda instalar `build-essential pkg-config`. Para o `sled`, só o compilador C foi necessário.
   ⚪ Os bancos LevelDB e RocksDB não foram testados. Onde buscar: README do `fullnode`, seção "Build the full node".

#### 2.3.2 Compilar

```
git clone https://github.com/hacash/fullnode
cd fullnode
cargo build --release -p app --bin fullnode
```

- Tempo medido: **3 min 24 s** na primeira rodada; 2 min 33 s numa segunda compilação do zero pelo script, com as dependências já baixadas (mesma máquina).
- Binário: `target/release/fullnode`, com 5.679.496 bytes.
- Versão impressa na partida: `full node v1.2.5, build time: 2026/10/17 #1, database version: 1, backend: sled`.
- Commit testado: `ce25368a`. ⚪ A tag `1.2.5` aponta para outro commit (`710b4af`) e não foi compilada aqui.

#### 2.3.3 Configurar (modo mais leve, só leitura)

O README manda copiar `docs.loc/hacash.config.ini`.
Essa pasta **não existe no clone**: o `.gitignore` contém `*.loc/`. O mesmo arquivo vem pronto no zip da release (2.1).
Use o exemplo mínimo do README ou do `config.md`. O arquivo usado nos testes:

```
[engine]
data_dir = /caminho/absoluto/para/data
fast_sync = true

[p2p]
listen_ip = 127.0.0.1
listen_port = 0          ; 0 = não aceita conexões de entrada
boot_nodes = <copie a linha boot_nodes do README do fullnode ou do ini do zip; o 2º endereço difere, ver seção 9>

[server]
enable = true
listen_ip = 127.0.0.1    ; RPC só na máquina local
listen_port = 8082
debug_routes = false

[mint]
chain_id = 0
diamond_form = true

[miner]
enable = false
[diamond_miner]
enable = false
[vm]
log_enable = false
```

Notas do `config.md`:
- Caminho relativo do arquivo é lido a partir da pasta do executável.
- Chave desconhecida dentro de seção conhecida **impede a partida**.
- `fast_sync = true` **pula a validação completa dos blocos históricos**.
- Para um nó que valida tudo, use `fast_sync = false`. ⚪ Tempo não medido; onde buscar: seção 10, primeira linha.

#### 2.3.4 Rodar e medir

```
HACASH_DB_SMALL_MACHINE=1 ./target/release/fullnode /caminho/absoluto/hacash.config.ini
```

| medida | valor |
|---|---|
| tempo da altura 0 até a ponta (792.727 blocos) | cerca de 12 min (`fast_sync = true`) |
| disco da pasta `data` | 2,1 GB |
| memória residente após a sincronia | cerca de 640 MB |
| pares P2P na partida | 4 |
| avisos de sincronia ("missing parent") | 0 (o `fullnode#57` relata esse aviso no bloco 785.207; não reproduziu aqui) |

---

## 3. Mapa dos repositórios e licenças

> Medido em 21/10/2026 com `gh api orgs/hacash/repos` e `contents` da raiz de cada repositório.

- Organização oficial: `https://github.com/hacash`, criada em 02/01/2019, com **33** repositórios públicos.
- A organização tem 7 membros públicos. Lista: `https://github.com/orgs/hacash/people`.
- Estado = dias desde o último push em 21/10/2026: ativo ≤ 90 · parado 91-365 · legado > 365.
- Resumo: **3 ativos, 7 parados, 23 legados**.
- Código atual do nó: `fullnode` (Rust).
- Em 26/07/2026 o mantenedor informou que `fullnodedev` "será arquivado" (`fullnodedev#9`).
- Os repositórios em Go (`core`, `miner`, `node`, `chain`, `service`…) são a geração anterior.

### Licenças

- **19 dos 33 não têm arquivo LICENSE nem metadado de licença. 14 são MIT.**
- Sem licença: `fullnode`, `explorer`, `hascan`, `fullnodedev`, `fullnodetest`, `doc`, `doc-chinese`, `www`, `wallet`, `dao`, `explorer1`, `www1`, `wallet1`, `paper`, `x16rs` (fork), `pcwallet`, `blockmint`, `bitcoin` (fork), `web_base_framework`.
- Os quatro mais relevantes para quem quer reutilizar código ou texto: `fullnode`, `fullnodedev`, `explorer` e `doc`.
- Sem licença escrita, em geral vale por padrão o direito autoral ("todos os direitos reservados"; informação geral, não é parecer jurídico, e varia por país). Só o mantenedor pode dizer se a reutilização é permitida.
- Esta base não copia código desses repositórios. Ela cita caminhos e linhas e descreve o formato das respostas.

### Tabela

| repositório | linguagem | licença | último push | dias | estado | issues+PRs abertos | nota | descrição (GitHub) |
|---|---|---|---|---:|---|---:|---|---|
| `hacash/fullnode` | Rust | SEM LICENÇA | 2026-10-18 | 3 | ativo (≤90 d) | 19 |  | Hacash Fullnode Software and SDK |
| `hacash/explorer` | JavaScript | SEM LICENÇA | 2026-10-11 | 10 | ativo (≤90 d) | 5 |  | Hacash explorer with rust node |
| `hacash/hascan` | Rust | SEM LICENÇA | 2026-09-25 | 26 | ativo (≤90 d) | 0 |  | Hacash block scaner for explorer |
| `hacash/x16rs-sys` | C | MIT | 2026-07-12 | 101 | parado (91-365 d) | 0 |  | x16rs c binding for rust |
| `hacash/fullnodedev` | Rust | SEM LICENÇA | 2026-07-11 | 102 | parado (91-365 d) | 2 |  | hacash fullnode dev repo |
| `hacash/fullnodetest` | Rust | SEM LICENÇA | 2026-07-04 | 109 | parado (91-365 d) | 0 |  |  |
| `hacash/doc` | n/d | SEM LICENÇA | 2026-06-27 | 116 | parado (91-365 d) | 2 |  | documents |
| `hacash/doc-chinese` | n/d | SEM LICENÇA | 2026-05-14 | 160 | parado (91-365 d) | 0 |  |  |
| `hacash/www` | Less | SEM LICENÇA | 2026-03-07 | 228 | parado (91-365 d) | 2 |  | Hacash.org website |
| `hacash/wallet` | JavaScript | SEM LICENÇA | 2026-02-05 | 258 | parado (91-365 d) | 0 |  | wallet with rust fullnode |
| `hacash/dao` | JavaScript | SEM LICENÇA | 2025-05-30 | 509 | legado (>365 d) | 1 |  | HacashDAO.org |
| `hacash/node` | Go | MIT | 2025-01-10 | 649 | legado (>365 d) | 2 |  |  |
| `hacash/miner` | Go | MIT | 2025-01-10 | 649 | legado (>365 d) | 8 |  |  |
| `hacash/core` | Go | MIT | 2025-01-10 | 649 | legado (>365 d) | 5 |  | Hacash  Core |
| `hacash/service` | Go | MIT | 2024-11-09 | 711 | legado (>365 d) | 3 |  |  |
| `hacash/mint` | Go | MIT | 2024-11-09 | 711 | legado (>365 d) | 0 |  |  |
| `hacash/rust` | C | MIT | 2024-10-25 | 726 | legado (>365 d) | 5 |  | Rust Hacash Node and SDK |
| `hacash/explorer1` | JavaScript | SEM LICENÇA | 2024-07-23 | 820 | legado (>365 d) | 2 |  | blockchain explorer |
| `hacash/www1` | HTML | SEM LICENÇA | 2024-06-22 | 851 | legado (>365 d) | 0 |  | website |
| `hacash/wallet1` | JavaScript | SEM LICENÇA | 2024-06-07 | 866 | legado (>365 d) | 0 |  | wallet |
| `hacash/paper` | n/d | SEM LICENÇA | 2024-05-24 | 880 | legado (>365 d) | 1 |  | theoretical articles |
| `hacash/x16rs` | C | SEM LICENÇA | 2024-03-13 | 952 | legado (>365 d) | 0 | fork | Golang X16RS |
| `hacash/jssdk` | Go | MIT | 2024-02-29 | 965 | legado (>365 d) | 0 |  | Hacash SDK for javascript |
| `hacash/pcwallet` | Go | SEM LICENÇA | 2024-02-29 | 965 | legado (>365 d) | 0 |  | offline wallet on pc |
| `hacash/cmdwallet` | Go | MIT | 2024-02-29 | 965 | legado (>365 d) | 0 |  | Open Source Shell / Command Line Wallet |
| `hacash/channelpay` | Go | MIT | 2024-02-29 | 965 | legado (>365 d) | 1 |  | Implementation of channel chain settlement network protocol. |
| `hacash/rustHacash` | C | MIT | 2024-02-29 | 965 | legado (>365 d) | 1 |  | Hacash full node by Rust |
| `hacash/chain` | Go | MIT | 2024-01-06 | 1019 | legado (>365 d) | 1 |  |  |
| `hacash/HVM` | Go | MIT | 2023-11-29 | 1057 | legado (>365 d) | 0 |  | Hacash Contract Virtual Machine |
| `hacash/blockmint` | Go | SEM LICENÇA | 2022-05-15 | 1620 | legado (>365 d) | 0 |  | Deprecated!!!  move to https://github.com/hacash/miner |
| `hacash/PaymentChannelChainNetServiceNodeRoutes` | n/d | MIT | 2021-08-07 | 1901 | legado (>365 d) | 0 |  | Hacash payment channel service node register and routes |
| `hacash/bitcoin` | Go | SEM LICENÇA | 2020-05-08 | 2357 | legado (>365 d) | 0 | fork | Golang (go) library for manipulating bitcoin (BTC) addresses |
| `hacash/web_base_framework` | JavaScript | SEM LICENÇA | 2019-04-12 | 2749 | legado (>365 d) | 0 |  | web base framework |

### Outras contas ligadas ao ecossistema (fora da organização `hacash`)

- `hacashcom` é uma **conta de usuário** (tipo `User`, criada em 14/07/2023). Tem 8 repositórios: 5 MIT e 3 sem licença. Também é membro público da organização `hacash`.
- `HacashCommunity` é uma organização criada em 27/02/2026. Tem 3 repositórios (`HACPool`, `HacashWallet`, `IVScore`), todos sem licença. Está ligada ao site `hacash.community`.

### SDK oficial em WASM (para assinar, adote este)

- O `fullnode` traz um SDK oficial em WASM. Código: `fullnode/sdk/` (README com 282 linhas). Documentação: `https://github.com/hacash/doc/blob/main/server/sdk_doc.md`.
- Pacote pronto: `hacash_wasm_sdk.zip` na release 1.2.5 (1.131.122 bytes, sha256 `ce404f9fe3f42679cac5f579679c82d6ca5ae80e93448095bbc89e28845f6cb0`). Não está no npm (busca por "hacash" em 21/10/2026: 0 pacotes).
- **O que faz:** 25 operações por uma única porta JSON, `sdk_invoke_json(operation_id, payload)`. Entre elas: montar transação (`tx.build`), inspecionar e revisar (`tx.inspect`), preparar o pedido de assinatura (`tx.prepare_signature`), anexar e verificar assinatura (`tx.attach_signature`, `tx.verify`), decodificar e recodificar (`tx.decode`, `tx.encode`), estimar taxa (`tx.estimate_fee`), validar endereço, converter valores (`amount.parse`, `amount.format`), consultar diamante por nome ou série (`diamond.lookup`) e ler código de contrato (`vm.code`). Tudo offline: "no VM execution, no node" (README do SDK).
- **O que não faz:** não gera, não recebe e não guarda chave privada. "Private keys never cross the SDK boundary": o SDK entrega um `SigningRequest` (o resumo a assinar) e recebe de volta um `SignatureProof`; quem assina é a carteira. Nenhuma das 25 operações transmite à rede; transmitir continua sendo `/submit/transaction` do nó (risco R3, seção 4).
- **Regra desta base:** para qualquer coisa que assine, preferir o SDK oficial a escrever um próprio (motivo: as chaves nunca cruzam a fronteira do SDK e ele é mantido pela equipe da Hacash).
- ⚪ O SDK não foi executado nesta rodada. Onde buscar: descompactar o zip numa pasta nova e chamar a operação 1 (`system.sdk_version`).

---

## 4. APIs do nó (55 caminhos, medidos)

> Medido em 21/10/2026: leitura de todas as chamadas `ApiRoute::` no código e chamadas a um nó local 1.2.5 em `127.0.0.1:8082`.
> Arquivo de máquina, com parâmetros e respostas de exemplo: [`api/rotas.json`](api/rotas.json).

### Contagem

- **55 caminhos** no código = 54 registros `ApiRoute::` + `/_server_` (embutido em `server/src/http.rs:163`).
- Com `debug_routes = false` (padrão) ficam **52** montados. As 3 rotas `/debug/...` respondem 404 (confirmado).
- **45 chamadas ao vivo**: 42 com HTTP 200 e 3 com 404 das rotas de debug.
- Dos 42 com HTTP 200: às 09:35, 34 com dados e 8 com erro esperado no corpo; às 10:39, 33 e 9.
- A diferença é `/query/contract/sandboxcall` sem parâmetros: devolveu `ret 0` às 09:35 e erro de formato às 10:39. ⚪ Causa não investigada; onde buscar: `vm/src/api.rs:316`.
- **10 não chamadas por política**: geram ou recebem chave privada, assinam, mudam estado ou transmitem. Marcadas "NÃO EXECUTAR".
- **35 dos 55 caminhos aparecem na documentação oficial `fullnode_api_doc_v2.md`** (repositório `hacash/doc`, último commit 20/04/2026). Coluna "na doc oficial?" da tabela: **35 sim / 20 não**.
- Para as 35 documentadas, a doc oficial descreve parâmetros e exemplos de uso melhor do que esta tabela: leia a v2. O que só esta tabela traz: as 20 ausentes, o handler, a classe de risco e a resposta medida.
- **20 não aparecem**: `/status`, `/vm/status`, `/block_by_height`, `/query/block/height/latest`, `/pool_summary`, `/miner/pending_replay`, `/query/asset`, `/query/block/pools`, `/query/contract/storage_fee`, os 4 `/query/diamond/inscription_protocol_cost/{append,drop,edit,move}`, os 3 de simulação (`/query/transaction/simulate`, `/query/vm/estimate_gas`, `/query/vm/simulate`), `/_server_` e as 3 de debug.

### Pontos de atenção

- `/query/miner/notice` **existe** (`app/src/fullnode/miner_notice.rs:21`). É uma rota assíncrona de espera longa e responde 200.
- Rotas que recebem **chave privada na query string**: `/create/coin/transfer` (`main_prikey`), `/util/transaction/sign` (`prikey`), `/operate/fee/raise` (`fee_prikey`) (`mint/src/api/transaction.rs:369,453`, `mint/src/api/transfer.rs:235`).
- `/create/account` devolve um par de chaves no corpo (`api/src/account.rs`).
- O servidor HTTP não tem camada de autenticação. A proteção é escutar só em `127.0.0.1` (padrão).
- Exceção: o parâmetro opcional `auth` de `/operate/contract/logs/delete` (`vm/src/api.rs:122-128`).
- `/query/miner/pending` e `/query/diamondminer/init` respondem `{"ret":1,"err":"... not enabled"}` quando a mineração está desligada.
- `/query/block/datas` devolve **bytes**, não JSON. Com `hexbody=true` devolve texto em hex (`mint/src/api/query/block.rs:29`).
- Porta: as duas versões da documentação (`fullnode_api_doc.md`, v1, linkada em `hacash.org/development`, e `fullnode_api_doc_v2.md`, linhas 19, 23 e 25) usam `8081`.
- O padrão do código (`base/src/api/config.rs:18`) e do `config.md` é `8082` (conferido em 21/10/2026).
- A API devolve HTTP 200 mesmo em erro. O erro vem no corpo: `{"ret":1,"err":"..."}`.

### Riscos

R0 leitura · R1 leitura com espera longa · R2 envolve chave privada · R3 muda estado ou transmite · R4 mineração · R5 depuração.

### Tabela

"registro" é onde a rota é montada. "handler" é a função que responde. As respostas são de 21/10/2026, 10:39. Endereços IP de pares P2P foram omitidos.

| método | rota | registro | handler | na doc oficial? | risco | chamada | resposta (resumo) |
|---|---|---|---|---|---|---|---|
| GET | `/` | `mint/src/api/mod.rs:55` | `mint/src/api/console.rs:12` | sim | R0 | executada | 200 · 458 B · `<html><head><title>Hacash node console</title></head><body> <h3>Hacash…` |
| GET | `/_server_` | `server/src/http.rs:163` | `server/src/http.rs:163` | não | R0 | executada | 200 · 17 B · `Hacash Api Server` |
| GET | `/block_by_height` | `api/src/chain.rs:38` | `api/src/chain.rs:7` | não | R0 | executada | 200 · 44 B · `{"height":1000,"hash":"0017696a","size":131}` |
| GET | `/create/account` | `api/src/account.rs:39` | `api/src/account.rs:7` | sim | R2 | **NÃO EXECUTAR** | - |
| GET | `/create/coin/transfer` | `mint/src/api/mod.rs:124` | `mint/src/api/transfer.rs:233` | sim | R2 | **NÃO EXECUTAR** | - |
| POST | `/create/transaction` | `mint/src/api/mod.rs:116` | `mint/src/api/transaction.rs:99` | sim | R2 | **NÃO EXECUTAR** | - |
| GET | `/debug/contract/storage` | `vm/src/api.rs:593` | `vm/src/api.rs:442` | não | R5 | executada | 404 (debug_routes = false) |
| GET | `/debug/p2sh/scriptmh` | `vm/src/api.rs:594` | `vm/src/api.rs:526` | não | R5 | executada | 404 (debug_routes = false) |
| GET | `/debug/pool_print` | `api/src/pool.rs:32` | `api/src/pool.rs:20` | não | R5 | executada | 404 (debug_routes = false) |
| GET | `/miner/pending_replay` | `mint/src/api/mod.rs:58` | `mint/src/api/mod.rs:58` | não | R4 | executada | 200 · 20 B · `{"pending_replay":0}` |
| GET | `/operate/contract/logs/delete` | `vm/src/api.rs:590` | `vm/src/api.rs:122` | sim | R3 | **NÃO EXECUTAR** | - |
| POST | `/operate/fee/raise` | `mint/src/api/mod.rs:119` | `mint/src/api/transaction.rs:451` | sim | R3 | **NÃO EXECUTAR** | - |
| GET | `/pool_summary` | `api/src/pool.rs:31` | `api/src/pool.rs:9` | não | R0 | executada | 200 · 23 B · `{"group0":1,"group1":0}` |
| GET | `/query/asset` | `mint/src/api/mod.rs:81` | `mint/src/api/query/asset.rs:31` | não | R0 | executada | 200 · 123 B · `{"ret":0,"asset":{"serial":"2000","decimal":8,"name":"hacds","ticket":…` |
| GET | `/query/balance` | `mint/src/api/mod.rs:80` | `mint/src/api/query/balance.rs:129` | sim | R0 | executada | 200 · 69 B · `{"ret":0,"list":[{"hacash":"1784.46320557","diamond":1,"satoshi":0}]}` |
| GET | `/query/block/datas` | `mint/src/api/mod.rs:111` | `mint/src/api/query/block.rs:23` | sim | R0 | executada | 200 · 1128 B · `(hex) 0100000c187c006ad87db800000000007526778f036ac4d02ea2c2ea4f9ee82b…` |
| GET | `/query/block/height/latest` | `api/src/chain.rs:41` | `api/src/chain.rs:24` | não | R0 | executada | 200 · 25 B · `{"ret":0,"height":792745}` |
| GET | `/query/block/intro` | `mint/src/api/mod.rs:110` | `mint/src/api/query/block.rs:9` | sim | R0 | executada | 200 · 434 B · `{"ret":0,"hash":"000000000055722910338ec8ac6b5933adc8c1fba7b8094f32638…` |
| GET | `/query/block/pools` | `mint/src/api/mod.rs:113` | `mint/src/api/query/block.rs:110` | não | R0 | executada | 200 · 1501 B · `{"ret":0,"latest_height":792745,"periods":[{"key":"1d","blocks":288,"t…` |
| GET | `/query/block/recents` | `mint/src/api/mod.rs:114` | `mint/src/api/query/block.rs:189` | sim | R0 | executada | 200 · 2385 B · `{"ret":0,"list":[{"height":792745,"hash":"00000000006a220d108ac3a3beab…` |
| GET | `/query/block/views` | `mint/src/api/mod.rs:112` | `mint/src/api/query/block.rs:75` | sim | R0 | executada | 200 · 409 B · `{"ret":0,"latest_height":792745,"list":[{"height":1,"hash":"001e231cb0…` |
| GET | `/query/channel` | `mint/src/api/mod.rs:106` | `mint/src/api/query/channel.rs:9` | sim | R0 | executada | 200 · 43 B · `{"ret":1,"err":"channel id format invalid"}` |
| GET | `/query/coin/transfer` | `mint/src/api/mod.rs:125` | `mint/src/api/transfer.rs:173` | sim | R0 | executada | 200 · 400 B · `{"ret":0,"tx_hash":"d951dff1daac2b4549c4d97365806ea6847324c987dd68ec22…` |
| GET | `/query/contract/logs` | `vm/src/api.rs:589` | `vm/src/api.rs:62` | sim | R0 | executada | 200 · 20 B · `{"ret":0,"end":true}` |
| GET | `/query/contract/sandboxcall` | `vm/src/api.rs:583` | `vm/src/api.rs:316` | sim | R0 | executada | 200 · 49 B · `{"ret":1,"err":"contract address format invalid"}` |
| GET | `/query/contract/storage_fee` | `api/src/contract_storage.rs:99` | `api/src/contract_storage.rs:14` | não | R0 | executada | 200 · 541 B · `{"ret":0,"enabled":true,"rule_version":1,"activation_height":0,"head_h…` |
| GET | `/query/diamond` | `mint/src/api/mod.rs:82` | `mint/src/api/query/diamond.rs:12` | sim | R0 | executada | 200 · 506 B · `{"ret":0,"name":"ZAKXMI","belong":"1EZEiGKCPiJR6itGqVjXvRn95QLBdpxBKX"…` |
| GET | `/query/diamond/bidding` | `mint/src/api/mod.rs:83` | `mint/src/api/query/diamond.rs:279` | sim | R0 | executada | 200 · 35 B · `{"ret":0,"number":138627,"list":[]}` |
| GET | `/query/diamond/engrave` | `mint/src/api/mod.rs:85` | `mint/src/api/query/diamond.rs:355` | sim | R0 | executada | 200 · 135 B · `{"ret":0,"list":[{"action":"inscription","diamonds":"BMABAT","inscript…` |
| GET | `/query/diamond/inscription_protocol_cost` | `mint/src/api/mod.rs:86` | `mint/src/api/query/diamond.rs:244` | sim | R0 | executada | 200 · 40 B · `{"ret":0,"action":"append","cost":"0:0"}` |
| GET | `/query/diamond/inscription_protocol_cost/append` | `mint/src/api/mod.rs:90` | `mint/src/api/query/diamond.rs:251` | não | R0 | executada | 200 · 40 B · `{"ret":0,"action":"append","cost":"0:0"}` |
| GET | `/query/diamond/inscription_protocol_cost/drop` | `mint/src/api/mod.rs:102` | `mint/src/api/query/diamond.rs:272` | não | R0 | executada | 200 · 40 B · `{"ret":0,"action":"drop","cost":"2:247"}` |
| GET | `/query/diamond/inscription_protocol_cost/edit` | `mint/src/api/mod.rs:98` | `mint/src/api/query/diamond.rs:265` | não | R0 | executada | 200 · 40 B · `{"ret":0,"action":"edit","cost":"1:247"}` |
| GET | `/query/diamond/inscription_protocol_cost/move` | `mint/src/api/mod.rs:94` | `mint/src/api/query/diamond.rs:258` | não | R0 | executada | 200 · 44 B · `{"ret":1,"err":"query 'to' cannot be empty"}` |
| GET | `/query/diamond/views` | `mint/src/api/mod.rs:84` | `mint/src/api/query/diamond.rs:73` | sim | R0 | executada | 200 · 293 B · `{"ret":0,"latest_number":138626,"list":[{"name":"NHMYYM","number":1,"b…` |
| GET | `/query/diamondminer/init` | `mint/src/api/mod.rs:70` | `mint/src/api/miner.rs:93` | sim | R4 | executada | 200 · 43 B · `{"ret":1,"err":"diamond miner not enabled"}` |
| GET | `/query/fee/average` | `mint/src/api/mod.rs:107` | `mint/src/api/query/channel.rs:49` | sim | R0 | executada | 200 · 72 B · `{"ret":0,"purity":"6024000000","purity_unit":232,"feasible":"72288:239…` |
| GET | `/query/hashrate` | `mint/src/api/mod.rs:108` | `mint/src/api/query/hashrate.rs:7` | sim | R0 | executada | 200 · 237 B · `{"ret":0,"target":{"rate":5565781627.738558,"show":"5.57GH/s","unit":"…` |
| GET | `/query/hashrate/logs` | `mint/src/api/mod.rs:109` | `mint/src/api/query/hashrate.rs:26` | sim | R0 | executada | 200 · 4471 B · `{"ret":0,"day200":[19489014627,74116421937,18846375819,64783245373,215…` |
| GET | `/query/latest` | `mint/src/api/mod.rs:78` | `mint/src/api/query/supply.rs:40` | sim | R0 | executada | 200 · 42 B · `{"ret":0,"height":792745,"diamond":138626}` |
| GET | `/query/miner/notice` | `app/src/fullnode/miner_notice.rs:21` | `app/src/fullnode/miner_notice.rs:28` | sim | R1 | executada | 200 · 25 B · `{"ret":0,"height":792745}` |
| GET | `/query/miner/pending` | `mint/src/api/mod.rs:64` | `mint/src/api/miner.rs:10` | sim | R4 | executada | 200 · 35 B · `{"ret":1,"err":"miner not enabled"}` |
| GET | `/query/supply` | `mint/src/api/mod.rs:79` | `mint/src/api/query/supply.rs:7` | sim | R0 | executada | 200 · 1131 B · `{"ret":0,"latest_height":792745,"current_circulation":1909434.29047568…` |
| GET | `/query/transaction` | `mint/src/api/mod.rs:115` | `mint/src/api/query/tx.rs:50` | sim | R0 | executada | 200 · 448 B · `{"ret":0,"hash":"b563b525d5a840f14c2f1d7da52a1eb3f7ee7357e784af8b68d0b…` |
| POST | `/query/transaction/simulate` | `vm/src/api.rs:586` | `vm/src/api.rs:188` | não | R0 | executada | 200 · 117 B · `{"ret":1,"success":false,"err":"simulation transaction body is empty",…` |
| POST | `/query/vm/estimate_gas` | `vm/src/api.rs:587` | `vm/src/api.rs:188` | não | R0 | executada | 200 · 117 B · `{"ret":1,"success":false,"err":"simulation transaction body is empty",…` |
| POST | `/query/vm/simulate` | `vm/src/api.rs:588` | `vm/src/api.rs:188` | não | R0 | executada | 200 · 117 B · `{"ret":1,"success":false,"err":"simulation transaction body is empty",…` |
| GET | `/status` | `api/src/status.rs:80` | `api/src/status.rs:9` | não | R0 | executada | 200 · 247 B · `{"height":792745,"chain_id":0,"block_target_seconds":300,"uptime":4600…` |
| POST | `/submit/block` | `mint/src/api/mod.rs:118` | `mint/src/api/query/tx.rs:167` | sim | R3 | **NÃO EXECUTAR** | - |
| POST | `/submit/diamondminer/success` | `mint/src/api/mod.rs:73` | `mint/src/api/miner.rs:113` | sim | R4 | **NÃO EXECUTAR** | - |
| GET | `/submit/miner/success` | `mint/src/api/mod.rs:67` | `mint/src/api/miner.rs:57` | sim | R4 | **NÃO EXECUTAR** | - |
| POST | `/submit/transaction` | `mint/src/api/mod.rs:117` | `mint/src/api/query/tx.rs:129` | sim | R3 | **NÃO EXECUTAR** | - |
| POST | `/util/transaction/check` | `mint/src/api/mod.rs:120` | `mint/src/api/transaction.rs:312` | sim | R0 | executada | 200 · 42 B · `{"ret":1,"err":"transaction body invalid"}` |
| POST | `/util/transaction/sign` | `mint/src/api/mod.rs:121` | `mint/src/api/transaction.rs:367` | sim | R2 | **NÃO EXECUTAR** | - |
| GET | `/vm/status` | `vm/src/api.rs:582` | `vm/src/api.rs:55` | não | R0 | executada | 200 · 40 B · `{"ret":0,"vm":"enabled","height":792745}` |

### Como chamar

```
curl -s http://127.0.0.1:8082/query/latest
curl -s "http://127.0.0.1:8082/query/diamond?name=ZAKXMI"
```

Os parâmetros de cada rota estão em `api/rotas.json`, campo `parametros_query`.
Eles vêm de leitura estática do código. ⚪ Pode faltar parâmetro lido por outro caminho; onde buscar: o `arquivo:linha` do handler.

### Campos de `api/rotas.json`

| campo | significado |
|---|---|
| `metodo` | método HTTP |
| `caminho` | rota |
| `registro` | onde a rota é montada (`arquivo:linha`) |
| `handler`, `handler_nome` | função que responde (`arquivo:linha`, nome) |
| `parametros_query` | parâmetros da query string lidos pelo handler |
| `corpo` | o que o corpo do POST carrega, se houver |
| `na_doc_v2` | aparece em `fullnode_api_doc_v2.md` |
| `risco` | classe de risco (R0 a R5) |
| `executar` | `false` = não executar (chave, assinatura, mudança de estado ou transmissão) |
| `motivo` | por que não executar |
| `exemplo` | chamada real: `chamada`, `http`, `bytes`, `ms`, `sha256`, `resposta`, `medido_em` |
| `nota` | observação sobre a rota |

---

## 5. Governança e canais

> Páginas abertas em 21/10/2026.

### Como a comunidade descreve a governança

Fonte: `https://hacashdao.org/community` (HTTP 200 em 21/10/2026).

- "Hacash não tem fundadores nem equipe". O desenvolvimento é conduzido pela comunidade.
- Quem propõe melhoria recebe um número de **HIP** se a proposta for discutida formalmente.
- "Temas de mercado e corretoras são discutidos no HacashTalk e no Telegram; temas técnicos mais no Discord."
- Não há token de incentivo, pré-mineração nem equipe dedicada.
- O financiamento é por arrecadação da comunidade, iniciada no HacashTalk.

### Fluxo de desenvolvimento

Fonte: `https://hacash.org/development` (HTTP 200).

- Mudanças no núcleo seguem o processo de HIPs.
- A HIP-12 (fórum HacashTalk, 02/2023) define grupos de aplicação, revisão preparatória do núcleo e um grupo de decisão e merge.
- A discussão começa no Discord e depois é formalizada no GitHub.

### Canais

| canal | URL | verificado em 21/10/2026 | mantenedor / dono |
|---|---|---|---|
| Guia de desenvolvimento | `https://hacash.org/development` | 200 | ⚪ onde buscar: repositório `hacash/www` (membros públicos da org: seção 3) |
| HacashDAO, diretório de comunidades | `https://hacashdao.org/community` | 200 | a página lista os donos de cada canal por apelido; identidade não verificada |
| Discord | `https://discord.com/invite/evtt4bDfKu` e `https://discord.gg/6wH9KJeDFC` | ⚪ não aberto (exige conta) | ver linha da HacashDAO |
| Telegram | `https://t.me/hacash` · `https://t.me/hacashhacd` · `https://t.me/HacashCom` | ⚪ não aberto | ver linha da HacashDAO |
| Fórum HacashTalk | `https://hacashtalk.com/` | **sem resposta** da máquina de teste (curl: código 000) | ⚪ onde buscar: abrir no navegador; o HIP-12 e vários HIPs são discutidos lá |
| Portal hacash.community | `https://hacash.community/` | 200 | ⚪ sem mantenedor nomeado na página; onde buscar: `github.com/HacashCommunity` (3 repositórios, org criada em 27/02/2026) e X `@HacashComm`; subdomínios `wallet.`, `webwallet.`, `explorer.`, `pool.hacash.community` |
| Explorer oficial | `https://explorer.hacash.org/` | 200 | repositório `hacash/explorer` (ativo, sem licença) |
| GitHub oficial | `https://github.com/hacash` | 200 | mantenedor principal com 96,5% dos commits do `fullnode`; demais membros públicos em seção 3 |
| X (Twitter) | `@HacashDAO`, `@HacashCom`, `@HacashOrg` e outras 10 contas listadas em `hacashdao.org/community` | ⚪ não aberto | onde buscar: a lista em `hacashdao.org/community` |

### Observações

1. Há mais de uma fonte de documentação: `hacash.org`, `hacashdao.org`, `hacash.community`, repositório `hacash/doc` e `hacash/doc-chinese`.
2. A tabela de HIPs do repositório `hacash/doc` está defasada (ver seção 6).
3. Esta rodada **não** encontrou mantenedor responsável por unir os grupos. A HacashDAO diz que quer fazê-lo ("reunir essas entidades dispersas"). Antes de propor qualquer coisa, fale com ela.

---

## 6. HIPs (propostas de melhoria)

> Tabela oficial, com nomes, documentos e discussão: `https://github.com/hacash/doc/blob/main/HIP/HIP-table.md` (último commit 24/06/2026; lida em 21/10/2026). Esta base não copia a tabela; abaixo fica só o que medimos a mais.

- A tabela oficial lista 22 HIPs (de 1 a 23; falta a 19). Legenda oficial: implementada · aprovada · em discussão. Contagem: 7 implementadas, 1 aprovada, 14 em discussão.

| HIP | a tabela oficial diz | o que medimos | data e fonte |
|---|---|---|---|
| 23 (Istanbul) | em discussão | **ativa** desde a altura 765.432 (cerca de 19/07/2026, estimado pela altura); o código a trata como ativa | `hacash-params/src/lib.rs:164`; altura 792.727 em 21/10/2026 |
| 25 (staking de HACD) | não está na tabela | existe só como PR de terceiros: `hacash/fullnodedev#7` (rascunho, 20 arquivos, ações 37/38) e `hacash/rust#13` (120 arquivos, +8.647 linhas, ações 34/35); busca por "staking" em `*.rs` do `fullnode`: 0 arquivos; ativação na mainnet não definida | `gh api` e busca no código, 21/10/2026 |
| 19 | não está na tabela | citada em `fullnode#6` ("o que aconteceu com a HIP19?") | ⚪ onde buscar: HacashTalk e Discord (canal de desenvolvimento) |
| 24 | não está na tabela | ⚪ não buscada | onde buscar: HacashTalk e Discord |
| a tabela inteira | — | `hacashdao.org` aponta para outra cópia, em `hacash/paper` (último commit 24/05/2024, só HIPs 1 a 16) | seção 9, erro 6 |

- A issue `hacash/doc#1` é o registro para pedir número de HIP novo (3 comentários, última atividade em 27/05/2026).
- A HIP-23 tem pacote próprio de documentos em `hacash/doc/HIP/protocol/hip-23/`: especificação, modelo de ameaças, invariantes, matriz de rastreabilidade, achados de auditoria e lista para carteiras. Não refazer.

---

## 7. Issues e PRs abertos e como estão organizados

> Medido em 21/10/2026 com `gh api search/issues?q=org:hacash+is:open`: **55 issues e 5 PRs** abertos em 16 repositórios.

### Organização para quem chega

- 0 de 55 issues têm etiqueta (label). 0 de 55 têm responsável.
- Nenhum dos 4 repositórios verificados tem `CONTRIBUTING.md`, modelos de issue, `SECURITY.md`, CODE_OF_CONDUCT nem pasta `.github` com fluxo de CI.
- Os 4 verificados: `fullnode` (por clone), `fullnodedev`, `explorer` e `doc` (por API).
- ⚪ Os outros 29 repositórios não foram verificados. Onde buscar: seção 10, última linha.

### Resposta do mantenedor

- 23 das 55 issues têm ao menos um comentário de membro da organização.
- 24 estão respondidas ou sem sintoma hoje e **poderiam ser fechadas** pelo mantenedor.

### Triagem

Critério na tabela abaixo. **LEG** é uma 5ª classe acrescentada aqui, porque 18 issues são de repositórios Go antigos.

| classe | significado | quantidade |
|---|---|---:|
| BPT | boa primeira tarefa: escopo pequeno, verificável, sem decisão de consenso | 4 |
| MANT | precisa de mantenedor: consenso, governança, segurança, site | 12 |
| DUP | duplicada ou já atendida por algo que existe | 5 |
| SR | sem reprodução ou não é tarefa acionável (pergunta de uso, corpo vazio) | 16 |
| LEG | legado Go/2020-2024, candidata a fechar | 18 |
| **total** | | **55** |

No repositório central `fullnode` (17 issues): 1 BPT, 8 MANT, 3 DUP, 5 SR.

Grupos relacionados:
- dificuldade: `#44`, `#46`, `#48`;
- leilão de HACD: `#21`, `#40`, `#58`, `#61` e PR `#60`;
- congelamento de rede/explorer: `#33`, `explorer#2`, `explorer#4`, `#57`;
- minerador GPU: `fullnode#55` e `fullnodedev#9`;
- 6 facetas do mesmo relatório de *data races* de 2021: `chain#2`, `core#2`, `core#3`, `miner#13`, `miner#14`, `service#2`.

### PRs abertos

| PR | título | situação medida |
|---|---|---|
| `fullnode#59` | Fix zero-window boot replay root advancement | +23/−1 em `chain/src/tree.rs`; 0 comentários; teste de regressão do PR passa (ver seção 8) |
| `fullnode#60` | [Example] Prevent strategic invalid HACD bids | +145/−3, 5 arquivos, 1 teste novo; política só de mempool local, não muda consenso |
| `fullnodedev#7` | HIP-25 HACD staking port (rascunho) | +684/−11, 20 arquivos; sem RPC `/query/staking/*`, sem testes portados; conflito (`dirty`); repositório será arquivado |
| `rust#13` | HIP-25 reference: HACD staking | +8.647/−356, 120 arquivos, 35 commits, 5 comentários; autoauditoria "PASS" no texto, sem revisão independente |
| `rust#8` | Support CORS policy for requests | +3/−0, 3 comentários; repositório `rust` sem push desde 25/10/2024 |

### As 55 issues

Autor omitido. `resp.` = há comentário de membro da organização. `fechável` = julgamento desta base; só o mantenedor fecha.

| issue | classe | resp. | fechável | nota |
|---|---|---|---|---|
| issue | classe | resp. | fechável | nota |
|---|---|---|---|---|
| `chain#2` | LEG | N | N | faceta 1/6 do mesmo log de data races (Go, 2021); repo sem push desde 2024-01 |
| `channelpay#4` | SR | N | N | pergunta de uso com capturas de tela; sem passos |
| `core#2` | LEG | N | N | faceta 2/6 data races (Go 2021) |
| `core#3` | LEG | N | N | faceta 3/6 data races (Go 2021) |
| `core#7` | LEG | Y | Y | build Go 1.16 (2024); mantenedor respondeu em 2024-04-01 |
| `core#8` | MANT | Y | N | perguntas de economia (ponte BTC, desequilíbrio de preço); precisa decisão de protocolo |
| `core#9` | SR | N | N | corpo é um ponto final; sem conteúdo |
| `dao#1` | SR | Y | Y | pessoa quer entrar na equipe; não é tarefa; evidencia falta de porta de entrada (sem CONTRIBUTING) |
| `doc#1` | MANT | Y | N | registro de numeração de HIP; deveria ser fixado; HIP-table.md está defasada (HIP-23 ativo aparece como "em discussão") |
| `doc#2` | DUP | N | Y | pede API de taxa média; já existe GET /query/fee/average (fullnode/mint/src/api/mod.rs:107; doc v2 §3.9) |
| `explorer#2` | SR | N | N | "explorer parou"; falha de serviço hospedado, sem diagnóstico; cluster com explorer#4 e fullnode#33 |
| `explorer#3` | BPT | N | N | contagem de HACD na tela (3) difere do hash da tx (6); reproduzível via /query/transaction + HTML |
| `explorer#4` | DUP | N | N | repete explorer#2 (congelamento) |
| `explorer#6` | BPT | Y | Y | valor é histórico por design (resposta do mantenedor); falta rótulo na UI |
| `explorer#7` | BPT | Y | Y | fórmula da média: contar HACD menos 30.000 (resposta do mantenedor); documentar na UI |
| `explorer1#3` | LEG | Y | Y | 2020, explorer antigo |
| `explorer1#10` | LEG | Y | Y | 2020, rpcapi antigo; exemplo mostrava dado sensível em URL |
| `fullnode#6` | MANT | Y | Y | 2025-02: divergência de validação e fork; mantenedor: corrigido na 0.2.5; manter como histórico |
| `fullnode#11` | BPT | N | N | pergunta: diamhash é o txhash? responder lendo x16rs::mine_diamond e documentar lifegene |
| `fullnode#12` | SR | N | N | hash inválido no bloco 635119, sem versão/log |
| `fullnode#15` | SR | N | N | panic OpenCL em binário de 2024-02; sem reprodução |
| `fullnode#21` | MANT | Y | Y | mineradores repetem diamante; mantenedor: corrigido na 0.2.14 |
| `fullnode#28` | MANT | N | N | pede HIP de lista de bloqueio de endereços; decisão de governança; esta base não se posiciona |
| `fullnode#33` | DUP | Y | Y | rede/explorer congelados; mantenedor: atualizar para 1.0.0; mesmo cluster de explorer#2 |
| `fullnode#40` | MANT | N | N | regra de leilão (8 HAC vence 30 HAC); precisa explicação do mantenedor |
| `fullnode#41` | SR | N | Y | não reproduz hoje: hacash.org/whitepaper.pdf responde 200 application/pdf 1.763.282 B (21/10) |
| `fullnode#44` | MANT | Y | Y | dificuldade; mantenedor: corrigido na 1.0.0; algoritmo hoje é ASERT (mint/src/consensus/difficulty.rs:9) |
| `fullnode#46` | MANT | Y | Y | pede LWMA; mantenedor: LWMA na 1.0.1; hoje ASERT desde altura 738.654 |
| `fullnode#47` | SR | N | N | HACD minerado não aparece; sem versão/log/endereço |
| `fullnode#48` | DUP | N | Y | repete fullnode#46 (onde está o LWMA?); comunidade respondeu com commit de fullnodedev |
| `fullnode#55` | DUP | N | N | repete fullnodedev#9 (minerador GPU da comunidade) |
| `fullnode#57` | SR | Y | Y | sync parado; mantenedor: apagar blocos e atualizar para 1.2.1; a sincronia completa na 1.2.5 feita para esta base não reproduziu (ver seção 2.3.4) |
| `fullnode#58` | MANT | Y | Y | proposta de teto/ajuste em leilão; mantenedor recusou com 2 motivos |
| `fullnode#61` | MANT | N | N | lance inválido estratégico; tem PR #60 de exemplo; mexe em mempool/consenso |
| `fullnodedev#9` | MANT | Y | N | pedido de integração oficial do minerador GPU; mantenedor: fullnodedev será arquivado |
| `miner#12` | LEG | N | N | 2021, diamante duplicado (Go) |
| `miner#13` | LEG | N | N | faceta 4/6 data races |
| `miner#14` | LEG | N | N | faceta 5/6 data races |
| `miner#19` | LEG | N | N | 2021, blocos faltando no pool miner |
| `miner#24` | LEG | Y | Y | não compila (Go, 2023) |
| `miner#25` | SR | Y | Y | pergunta sobre flag autobid |
| `miner#27` | LEG | Y | Y | não inicia miner_worker 2022 |
| `miner#28` | LEG | N | N | falta -lOpenCL no link (Go, 2024) |
| `node#2` | SR | Y | Y | pergunta sobre front do pool |
| `node#12` | LEG | Y | Y | nó Go não sincroniza (2025-01) |
| `paper#5` | SR | N | N | divulgação de app HIP-17 xadrez; não é tarefa |
| `rust#4` | LEG | N | N | Windows 7 sem ProcessPrng (toolchain Rust novo não suporta Win7) |
| `rust#10` | SR | N | N | erro de saldo insuficiente em auto-lance; aparenta uso incorreto |
| `rust#12` | SR | N | N | relato de congestionamento, sem métrica |
| `rustHacash#1` | SR | N | N | título "upgrade x16rs.c to rs", corpo vazio |
| `service#1` | LEG | Y | Y | 2020, pedido de esclarecimento da API Go |
| `service#2` | LEG | N | N | faceta 6/6 data races |
| `service#5` | LEG | Y | Y | 2023, uso de quoteFee |
| `www#6` | SR | N | Y | não reproduz hoje: certificado válido até 2026-11-20 (Let's Encrypt) |
| `www#8` | MANT | N | N | aberta pelo autor desta base em 06/09: entrada de menu mesclada não está no ar; o URL redireciona |

---

## 8. Onde contribuir

> Avaliado em 21/10/2026. Nada foi comentado nem aberto no GitHub da Hacash.
> As três primeiras frentes já têm evidência pronta. As demais ficam registradas com o motivo.

### A. Revisão independente do `fullnode#59` (recuperação do nó)

Evidência medida em 21/10/2026:
1. O teste do PR (`cargo test -p chain --lib zero_window_linear_replay_advances_and_preserves_roll_order`) **passa** na ramificação do PR (1 passou).
2. O mesmo teste **falha sem a correção**, em cima do `main` atual (`ce25368a`), com a mensagem exata do PR: `scheduled root must advance above 0, got 0`.
3. Com a correção aplicada sobre o `main` atual, **49 de 49 testes** da biblioteca `chain` passam. O arquivo `chain/src/tree.rs` não mudou entre a base do PR (`76aa835`) e o `main`.
4. A configuração do caso é válida: `unstable_block = 0` só é recusado quando `fast_sync = true` (`app/src/fullnode/config.rs:269`). O padrão é 4.
5. Não reproduzido: o teste de queda com `SIGKILL` descrito no PR (o roteiro não está no PR). O PR não cita `#57`.

Por quê: custo mínimo, baixo risco, evidência objetiva e sem opinião sobre protocolo.

### B. Revisão e cenário adversarial para `fullnode#61` + PR `#60` (lances de HACD inválidos)

O PR é política de mempool local, não consenso. Outro nó ou um minerador pode ignorá-la.

Leitura do código:
- `TxPool::take` copia (`node/src/txpool.rs:158-162`). Então a revalidação em `node/src/submit.rs` do PR não perde transações.
- Há um teste novo (`reserved_bid_uses_highest_usable_fee_for_address`). Ele cobre só o auxiliar `reserved_bid`.
- **Não há teste** da isenção da própria transação de mint, da revalidação de transações antigas do mesmo endereço, nem do cenário em 6 passos da issue `#61`.

Contribuição proposta:
- Escrever esse cenário como teste de integração de motor. A tabela da issue já é o roteiro.
- Escrever uma nota de ameaça comparando mempool local × regra de consenso, sem escolher a solução.
- Isso também ajuda as issues `#21`, `#40` e `#58` (todas sobre leilão).

Hipótese não provada: que o ataque da `#61` funcione na mainnet (falta teste em rede de teste).

### C. Catálogo de rotas da API para a documentação (`hacash/doc`)

- 20 dos 55 caminhos do código não aparecem na documentação v2 (seção 4).
- Há duas versões da documentação: v1 linkada pelo site, v2 mais nova.
- A porta documentada (8081) difere do padrão do código (8082).
- O README do `fullnode` manda copiar uma pasta que o `.gitignore` exclui (`docs.loc/`). O zip da release traz o arquivo pronto (seção 2.1).

Entregável: o catálogo de [`api/rotas.json`](api/rotas.json), com fonte `arquivo:linha`, risco e resposta de exemplo, como proposta de atualização.
É a base segura para qualquer MCP ou SDK futuro: separa o que lê, o que mexe com chave e o que transmite.

### Avaliadas e não recomendadas agora

- **HIP-25 (`fullnodedev#7`, `rust#13`).** O `fullnodedev` "será arquivado", segundo o mantenedor (26/07/2026). O staking não existe em `fullnode`. O `rust#13` tem 120 arquivos e a auditoria é do próprio autor. Revisar agora seria trabalho sobre código cujo repositório de destino está em extinção. Gatilho para reabrir: a HIP-25 ser proposta contra `fullnode`.
- **CORS (`rust#8`).** O PR está no repositório `rust` (sem push desde 25/10/2024). O `fullnode` atual não tem tratamento de CORS (busca no código: 0 ocorrências). Hipótese de risco, não testada: o servidor não tem autenticação e há rotas que recebem chave privada na URL. Liberar CORS amplo no nó permitiria a qualquer página aberta no navegador ler essas respostas. Caminho mais seguro: lista de origens permitidas no próprio nó ou um proxy na frente. A decisão é do mantenedor.
- **Governança de bloqueio de endereços (`fullnode#28`).** É decisão política sobre congelar fundos de terceiros. Esta base não se posiciona.
- **Token, recompra, carteira própria, explorer novo.** Fora de escopo. O explorer oficial responde 200.

### Primeiras tarefas para quem chega

Tamanho estimado: P = até 2 h · M = até 1 dia · G = mais de 1 dia. É estimativa, não medição.
Antes de comentar ou abrir PR, leia a HIP-12 (seção 5) e confira se a issue ainda está aberta.

| tarefa | o que fazer | por quê | tamanho |
|---|---|---|---|
| `explorer#3` (BPT) | reproduzir a diferença entre a contagem de HACD na tela (3) e no hash da transação (6) com `/query/transaction` | bug visível, verificável com uma chamada RPC, não toca consenso | P |
| `explorer#6` (BPT) | propor rótulo na interface dizendo que o valor é histórico | o mantenedor já respondeu; falta só texto | P |
| `explorer#7` (BPT) | documentar na interface a fórmula da média (HACD menos 30.000) | o mantenedor já deu a fórmula | P |
| `fullnode#11` (BPT) | responder se o diamhash é o txhash, lendo `x16rs::mine_diamond`, e documentar o lifegene | pergunta sem resposta; a entrega é texto com citação de código | M |
| `doc#2` (DUP) | comentar que `GET /query/fee/average` já existe, com o exemplo de `api/rotas.json` | fecha uma dúvida com uma rota que já existe | P |
| `fullnode#41`, `www#6` (SR) | comentar a medição de 21/10/2026: o PDF responde 200; o certificado vale até 20/11/2026 | ajuda o mantenedor a fechar o que não reproduz | P cada |
| PR `fullnode#59` | revisar com a evidência da 8.A (o teste falha sem a correção e passa com ela) | evidência pronta, baixo risco, sem opinião de protocolo | P a M |
| PR `fullnode#60` / `fullnode#61` | escrever o cenário de 6 passos da issue como teste de integração (8.B) | falta teste do caso principal; ajuda também `#21`, `#40`, `#58` | G |
| catálogo de rotas | propor a atualização da documentação v2 com `api/rotas.json` (8.C) | 20 dos 55 caminhos não estão documentados; porta 8081 × 8082 | M |

---

## 9. Divergências entre fontes (corrigidas nesta rodada)

> Conferido em 21/10/2026.

| afirmação (origem) | o que foi medido | fonte |
|---|---|---|
| "53 rotas HTTP" (contagem anterior, informal) | **55 caminhos**: 54 registros `ApiRoute::` + `/_server_`. 52 montados por padrão | leitura do código; `server/src/http.rs:163` |
| "a doc cita `/query/miner/notice`, que não aparece no código" | existe em `app/src/fullnode/miner_notice.rs:21` e responde 200 | teste local |
| "4 repositórios sem licença" | **19 de 33** sem LICENSE; 14 MIT | `gh api` + `contents`, 21/10 |
| "`hacashcom` é organização paralela" | é conta de usuário (`type=User`) e membro público da org `hacash` | `gh api users/hacashcom` |
| "issue `#57` e PR `#59` tratam da sincronia" | o PR não cita `#57`; sintomas diferentes (reprodução no boot com `unstable_block=0` × aviso "missing parent"); o mantenedor respondeu `#57` com "apague os blocos e use 1.2.1" | corpo do PR; comentário em `#57` |
| "o guia aponta para arquivo de rotas que não está mais lá" | `server/fullnode_api_doc.md` existe (último commit 04/08/2025); existe também `_v2` (20/04/2026); duas versões coexistem | `hacash/doc` |
| "LWMA" (issues `#44`, `#46`, `#48`) | o código atual usa ASERT (altura 738.654); "lwma" aparece 0 vezes | `difficulty.rs:9` |
| "`fullnodedev` tem o código da HIP-25" | o mantenedor disse que `fullnodedev` será arquivado | `fullnodedev#9`, 26/07/2026 |
| "17 issues em `fullnode`, 0/17 com etiqueta ou responsável" | confirmado (e 0/55 em toda a org) | `gh api search/issues` |
| "`fullnode` 1.2.5, 17/10/2026, muda a magia P2P" | confirmado | notas da release 1.2.5 |
| "a documentação usa a porta 8081" | o padrão do código e do `config.md` é 8082 | `base/src/api/config.rs:18` |
| "o README manda copiar `docs.loc/hacash.config.ini`" | a pasta não existe no clone; o `.gitignore` contém `*.loc/`. O zip da release traz o `hacash.config.ini` pronto, na raiz | clone e zip 1.2.5 de 21/10 |

### Erros no material oficial (achados em 21/10/2026)

Somam ao catálogo de rotas (seção 8.C) como proposta para a documentação. Nada foi aberto nem comentado.

| # | onde (URL) | o que diz | o que medimos em 21/10/2026 |
|---|---|---|---|
| 1 | `https://hacash.org/development`, link "All API Routes" | aponta para `https://github.com/hacash/fullnode/tree/main/src/server/api/routes.rs` | HTTP 404. As rotas são registradas em vários arquivos (seção 4, coluna "registro") |
| 2 | `https://github.com/hacash/doc/blob/main/build/build_compilation.md` (linha 32) | `git clone https://github.com/hacash/rust.git` | `hacash/rust` é legado (sem push desde 25/10/2024). O nó atual é `hacash/fullnode` |
| 3 | `https://github.com/hacash/doc/blob/main/README.md` (linha 14) | "Fullnode & PoWorker" → `https://github.com/hacash/rust/releases` | os binários atuais estão em `https://github.com/hacash/fullnode/releases` (1.2.5, 17/10/2026) |
| 4 | `https://hacash.org/run-full-node` | log de exemplo do nó Go `0.1.17(20231026.1)` | o nó atual é o Rust 1.2.5 (seção 2.1) |
| 5 | README do `fullnode` × `hacash.config.ini` do zip 1.2.5 | `boot_nodes` com 3 endereços em cada um | o 2º endereço difere entre os dois. Os 3 do zip responderam no teste da seção 2.1. ⚪ O 2º do README não foi testado sozinho; onde buscar: um nó com só esse endereço em `boot_nodes` |
| 6 | `https://hacashdao.org` (início, `/start`, `/resource`, `/community`), link "HIP Table" | aponta para `https://github.com/hacash/paper/blob/master/HIP/HIP-table.md` | essa cópia é de 24/05/2024 e lista só as HIPs 1 a 16. A atual está em `hacash/doc` (24/06/2026, 22 HIPs) |
| 7 | `https://rpcapi.hacash.org` (RPC pública usada pela comunidade e citada por ferramentas) | responde em HTTPS | o certificado (Let's Encrypt, válido até 20/11/2026) é emitido para `hacash.org` e lista `hacash.org`, `www`, `explorer` e `wallet` como nomes, não `rpcapi`. `curl https://rpcapi.hacash.org/query/latest` falha na verificação do certificado (curl código 60); `http://` puro responde 200. Conferido em 21/10/2026 de uma máquina. ⚪ Onde buscar: uma segunda rede e um navegador; `openssl s_client -connect rpcapi.hacash.org:443 -servername rpcapi.hacash.org` |

---

## 10. Lacunas (não medido), cada uma com endereço

> Estado em 21/10/2026. `⚪` = não medido. Cada linha diz onde buscar.

- ⚪ **Sincronia com validação completa** (`fast_sync = false`): tempo e disco não medidos. Onde buscar: repetir a rodada numa pasta nova com `HACASH_MODO=completo scripts/rodar-no.sh`.
- ⚪ **`/query/channel` com identificador real:** só foi testado o erro de formato. Onde buscar: página de canais do explorer (`https://explorer.hacash.org/`) para obter um id.
- ⚪ **Rotas de chave, assinatura e transmissão (10):** não chamadas por política. Onde buscar: rede de teste própria ou revisão de código. Não usar a mainnet.
- ⚪ **Bancos LevelDB/RocksDB:** não compilados. Onde buscar: README do `fullnode`, seção "Build the full node".
- ⚪ **Tag `1.2.5` (`710b4af`):** não compilada; o teste usou o commit `ce25368a`. O binário da release imprime a mesma versão e data de build, mas não o commit. Onde buscar: `HACASH_REF=1.2.5` numa pasta nova.
- ⚪ **Binário da release até a ponta:** o teste da seção 2.1 parou aos 60 s (altura 30.000). Tempo, disco e memória até a ponta não medidos. Onde buscar: repetir 2.1 sem parar.
- ⚪ **Pacotes da release para Windows e macOS:** não testados. Onde buscar: `https://github.com/hacash/fullnode/releases/tag/1.2.5`.
- ⚪ **SDK WASM:** não executado. Onde buscar: seção 3, "SDK oficial em WASM".
- ⚪ **`/query/contract/sandboxcall` sem parâmetros:** devolveu `ret 0` às 09:35 e erro de formato às 10:39. Causa não investigada. Onde buscar: `vm/src/api.rs:316`.
- ⚪ **Parâmetros de rota completos:** a lista em `api/rotas.json` vem de leitura estática. Onde buscar: o `arquivo:linha` de cada handler.
- ⚪ **HacashTalk:** `hacashtalk.com` não respondeu da máquina de teste. Onde buscar: navegador, ou outra rede. É a fonte do HIP-12 e de discussões de HIPs.
- ⚪ **Discord e Telegram:** não abertos (exigem conta). Conversas de grupos não entram aqui sem autorização. Onde buscar: convites em `hacashdao.org/community`.
- ⚪ **Quem mantém `hacash.community`:** não consta na página. Onde buscar: `github.com/HacashCommunity` (membros), `@HacashComm` no X.
- ⚪ **HIP-19, HIP-24:** não estão na tabela. Onde buscar: HacashTalk e Discord (canal de desenvolvimento).
- ⚪ **29 repositórios sem verificação de CONTRIBUTING/CI:** onde buscar: `gh api repos/hacash/<repo>/git/trees/HEAD?recursive=1`.

---

## 11. Glossário para tradução

| termo | significado | nota para tradução |
|---|---|---|
| HAC (ㄜ) | moeda da rede | manter sigla e símbolo |
| HACD | diamante digital, ativo minerado por leilão | manter sigla |
| HIP | *Hacash Improvement Proposal*, proposta de melhoria numerada | manter sigla |
| fullnode / nó completo | programa que valida e guarda toda a cadeia | traduzir "nó completo"; manter `fullnode` ao citar o repositório |
| fast sync | sincronia que pula a validação completa dos blocos históricos | traduzir "sincronia rápida" |
| mempool / pool de transações | fila de transações ainda não confirmadas | manter `mempool` |
| ASERT | algoritmo de ajuste de dificuldade em uso desde a altura 738.654 | manter |
| LWMA | média móvel linear ponderada; citada em issues; não está no código atual | manter |
| Fitsh | linguagem de contratos da HVM | manter |
| HVM | máquina virtual da Hacash | manter |
| x16rs | algoritmo de prova de trabalho | manter |
| Istanbul | atualização ativa na altura 765.432 | manter |
| canal de pagamento (L2) | camada 2 por canais | traduzir |
| RPC | interface HTTP do nó, em `127.0.0.1:8082` por padrão | manter |
| MCP | *Model Context Protocol*, protocolo para uma IA usar ferramentas | manter |
| ⚪ | marca de lacuna; sempre acompanhada de "onde buscar:" | manter o símbolo |
