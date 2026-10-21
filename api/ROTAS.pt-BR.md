# API do nó Hacash: mapa de rotas

Outras línguas: [English](ROTAS.md) · [简体中文](ROTAS.zh.md) · [Türkçe](ROTAS.tr.md)

Mapa das 55 rotas HTTP do fullnode 1.2.5 da Hacash (commit `ce25368a`), gerado de [`rotas.json`](rotas.json) e medido em 2026-10-21. Com `debug_routes = false` (padrão) ficam 52 montadas. 10 rotas estão marcadas **NÃO EXECUTAR**: criam ou recebem chave privada, assinam, mudam estado ou transmitem, e não foram chamadas. As outras 45 foram chamadas contra um nó local. A API responde HTTP 200 mesmo em erro; o erro vem no corpo como `{"ret":1,"err":"..."}`.

**Classes de risco:** R0 leitura · R1 leitura com espera longa · R2 envolve chave privada · R3 muda estado ou transmite · R4 mineração · R5 depuração

## Nó e estado

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/` | GET | — | Página HTML de console do nó (altura, pares, pool de transações). | [`mint/src/api/console.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/console.rs#L12) | sim | sim · R0 leitura |
| `/_server_` | GET | — | Texto simples `Hacash Api Server`; mostra que o servidor da API está no ar. | [`server/src/http.rs:163`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/server/src/http.rs#L163) | não | sim · R0 leitura |
| `/status` | GET | — | Estado do nó: altura, id da chain, segundos-alvo por bloco, tempo no ar. | [`api/src/status.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/status.rs#L9) | não | sim · R0 leitura |
| `/pool_summary` | GET | — | Contadores do pool de transações por grupo. | [`api/src/pool.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L9) | não | sim · R0 leitura |
| `/vm/status` | GET | — | Se a máquina virtual está ligada, e a altura. | [`vm/src/api.rs:55`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L55) | não | sim · R0 leitura |

## Cadeia: altura, oferta, blocos, hashrate, taxa

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/query/latest` | GET | — | Altura do último bloco e quantidade de diamantes. | [`mint/src/api/query/supply.rs:40`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L40) | sim | sim · R0 leitura |
| `/query/supply` | GET | — | Números de oferta e circulação na altura mais recente (circulação, queimado, diamantes, totais de canal, ativos). | [`mint/src/api/query/supply.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L7) | sim | sim · R0 leitura |
| `/query/block/height/latest` | GET | — | Só a altura do último bloco. | [`api/src/chain.rs:24`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L24) | não | sim · R0 leitura |
| `/block_by_height` | GET | `height` | Resumo curto do bloco numa altura: altura, prefixo do hash, tamanho. | [`api/src/chain.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L7) | não | sim · R0 leitura |
| `/query/block/intro` | GET | `unit`, `hash`, `tx_hash_list`, `height` | Resumo de um bloco, por altura ou hash; lista de hashes de transação opcional. | [`mint/src/api/query/block.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L9) | sim | sim · R0 leitura |
| `/query/block/recents` | GET | `unit` | Lista dos blocos mais recentes. | [`mint/src/api/query/block.rs:189`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L189) | sim | sim · R0 leitura |
| `/query/block/views` | GET | `unit`, `limit`, `page`, `start`, `desc` | Lista de blocos (parâmetros `limit`, `page`, `start`, `desc`). | [`mint/src/api/query/block.rs:75`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L75) | sim | sim · R0 leitura |
| `/query/block/datas` | GET | `hexbody`, `base64body`, `confirm`, `start_height`, `limit`, `max_size` | Dados brutos de blocos a partir de uma altura (bytes; texto hex com `hexbody=true`). Não é JSON. | [`mint/src/api/query/block.rs:23`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L23) | sim | sim · R0 leitura |
| `/query/block/pools` | GET | — | Estatísticas de blocos por período (por exemplo `1d`); handler `block_pool_stats_handler`. | [`mint/src/api/query/block.rs:110`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L110) | não | sim · R0 leitura |
| `/query/hashrate` | GET | — | Hashrate da rede: valor-alvo e valor em tempo real. | [`mint/src/api/query/hashrate.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L7) | sim | sim · R0 leitura |
| `/query/hashrate/logs` | GET | `target`, `scale`, `days` | Histórico de hashrate (séries diárias). | [`mint/src/api/query/hashrate.rs:26`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L26) | sim | sim · R0 leitura |
| `/query/fee/average` | GET | `unit`, `extra9`, `burn90`, `consumption`, `tx_type` | Estimativa de taxa média para um tamanho de transação (`consumption`). | [`mint/src/api/query/channel.rs:49`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L49) | sim | sim · R0 leitura |

## Saldo, ativos, canais, transferências

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/query/balance` | GET | `unit`, `diamonds`, `assets`, `asset_meta`, `address`, `asset`, `coinkind` | Saldo de um endereço: HAC, diamantes, satoshi (e ativos). | [`mint/src/api/query/balance.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/balance.rs#L129) | sim | sim · R0 leitura |
| `/query/asset` | GET | `serial` | Dados de um ativo (token) por serial: ticker, nome, casas decimais, oferta. | [`mint/src/api/query/asset.rs:31`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/asset.rs#L31) | não | sim · R0 leitura |
| `/query/channel` | GET | `unit`, `id` | Estado de um canal de pagamento por id. | [`mint/src/api/query/channel.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L9) | sim | sim · R0 leitura |
| `/query/coin/transfer` | GET | `unit`, `coinkind`, `height`, `txposi`, `from`, `filter_from`, `to`, `filter_to` | Transferência encontrada numa altura e posição de transação (filtros por remetente, destinatário e tipo de moeda). | [`mint/src/api/transfer.rs:173`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L173) | sim | sim · R0 leitura |

## Diamantes (HACD)

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/query/diamond` | GET | `unit`, `name`, `number` | Um diamante por nome ou número: dono e dados. | [`mint/src/api/query/diamond.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L12) | sim | sim · R0 leitura |
| `/query/diamond/views` | GET | `unit`, `limit`, `page`, `start`, `desc`, `name` | Lista de diamantes (parâmetros `limit`, `page`, `start`, `desc`, `name`). | [`mint/src/api/query/diamond.rs:73`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L73) | sim | sim · R0 leitura |
| `/query/diamond/bidding` | GET | `unit`, `since`, `limit`, `number` | Lances atuais de diamantes. | [`mint/src/api/query/diamond.rs:279`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L279) | sim | sim · R0 leitura |
| `/query/diamond/engrave` | GET | `tx_hash`, `txposi`, `height` | Inscrições em diamantes, por hash de transação ou por altura e posição. | [`mint/src/api/query/diamond.rs:355`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L355) | sim | sim · R0 leitura |
| `/query/diamond/inscription_protocol_cost` | GET | `unit`, `action`, `name`, `from`, `to` | Custo de uma ação de inscrição (`action`: append, drop, edit, move). | [`mint/src/api/query/diamond.rs:244`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L244) | sim | sim · R0 leitura |
| `/query/diamond/inscription_protocol_cost/append` | GET | `unit`, `action`, `name`, `from`, `to` | Igual a `inscription_protocol_cost` com `action` fixo em append. | [`mint/src/api/query/diamond.rs:251`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L251) | não | sim · R0 leitura |
| `/query/diamond/inscription_protocol_cost/drop` | GET | `unit`, `action`, `name`, `from`, `to` | Igual a `inscription_protocol_cost` com `action` fixo em drop. | [`mint/src/api/query/diamond.rs:272`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L272) | não | sim · R0 leitura |
| `/query/diamond/inscription_protocol_cost/edit` | GET | `unit`, `action`, `name`, `from`, `to` | Igual a `inscription_protocol_cost` com `action` fixo em edit. | [`mint/src/api/query/diamond.rs:265`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L265) | não | sim · R0 leitura |
| `/query/diamond/inscription_protocol_cost/move` | GET | `unit`, `action`, `name`, `from`, `to` | Igual a `inscription_protocol_cost` com `action` fixo em move (exige `to`). | [`mint/src/api/query/diamond.rs:258`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L258) | não | sim · R0 leitura |

## Transações e simulação

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/query/transaction` | GET | `unit`, `hash`, `body`, `action`, `signature`, `description` | Uma transação por hash: bloco, taxa e, opcionalmente, ações, assinatura e descrição. | [`mint/src/api/query/tx.rs:50`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L50) | sim | sim · R0 leitura |
| `/util/transaction/check` | POST | `unit`, `set_fee`, `sign_address`, `body`, `signature`, `description`, `hexbody`; corpo do POST: transação ou bloco em hex | Confere uma transação enviada em hex (POST); não transmite. | [`mint/src/api/transaction.rs:312`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L312) | sim | sim · R0 (o POST só simula ou confere) |
| `/query/transaction/simulate` | POST | `gas_max`; corpo do POST: transação ou bloco em hex | Simula uma transação enviada em hex (POST) e informa o resultado; não transmite. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | não | sim · R0 (o POST só simula ou confere) |
| `/query/vm/estimate_gas` | POST | `gas_max`; corpo do POST: transação ou bloco em hex | Mesmo handler de `/query/transaction/simulate` (caminho da estimativa de gas); POST, não transmite. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | não | sim · R0 (o POST só simula ou confere) |
| `/query/vm/simulate` | POST | `gas_max`; corpo do POST: transação ou bloco em hex | Mesmo handler de `/query/transaction/simulate` (caminho da simulação da VM); POST, não transmite. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | não | sim · R0 (o POST só simula ou confere) |

## Contratos

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/query/contract/logs` | GET | `height`, `index`, `address` | Logs de contrato por altura, índice e endereço. | [`vm/src/api.rs:62`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L62) | sim | sim · R0 leitura |
| `/query/contract/sandboxcall` | GET | `contract`, `function`, `params`, `caller`, `gas_max` | Chama uma função de contrato num sandbox (`contract`, `function`, `params`, `caller`, `gas_max`). | [`vm/src/api.rs:316`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L316) | sim | sim · R0 leitura |
| `/query/contract/storage_fee` | GET | `charge_bytes` | Regras da taxa de armazenamento de contrato e o valor para `charge_bytes`. | [`api/src/contract_storage.rs:14`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/contract_storage.rs#L14) | não | sim · R0 leitura |

## Mineração (leitura)

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/query/miner/notice` | GET | `height`, `wait` | Long-poll: espera novidade depois de `height` (até `wait`). | [`app/src/fullnode/miner_notice.rs:28`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/app/src/fullnode/miner_notice.rs#L28) | sim | sim · R1 leitura com espera longa |
| `/query/miner/pending` | GET | `detail`, `transaction`, `stuff`, `base64` | Trabalho pendente para mineradores; responde erro com a mineração desligada. | [`mint/src/api/miner.rs:10`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L10) | sim | sim · R4 leitura; dá erro com a mineração desligada |
| `/query/diamondminer/init` | GET | — | Dados iniciais para minerador de diamantes; responde erro com a mineração desligada. | [`mint/src/api/miner.rs:93`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L93) | sim | sim · R4 leitura; dá erro com a mineração desligada |
| `/miner/pending_replay` | GET | — | Contagem de itens de replay pendentes do minerador (`pending_replay`). | [`mint/src/api/mod.rs:58`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/mod.rs#L58) | não | sim · R4 leitura; dá erro com a mineração desligada |

## Chave, assinatura, mudança de estado e transmissão (NÃO EXECUTAR)

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/create/account` | GET | `quantity` | Cria uma conta e DEVOLVE UMA CHAVE PRIVADA no corpo. | [`api/src/account.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/account.rs#L7) | sim | **NÃO EXECUTAR** |
| `/create/coin/transfer` | GET | `fee`, `main_prikey`, `from_prikey`, `to_address`, `hacash`, `diamonds`, `satoshi`, `timestamp` | Monta uma transferência; recebe chave privada na query string. | [`mint/src/api/transfer.rs:233`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L233) | sim | **NÃO EXECUTAR** |
| `/create/transaction` | POST | `unit`, `action`, `signature`, `description`, `hexbody`; corpo do POST: transação ou bloco em hex | Monta uma transação a partir do corpo do POST. | [`mint/src/api/transaction.rs:99`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L99) | sim | **NÃO EXECUTAR** |
| `/util/transaction/sign` | POST | `unit`, `prikey`, `pubkey`, `sigdts`, `signature`, `description`, `hexbody`; corpo do POST: transação ou bloco em hex | Assina uma transação; recebe chave privada. | [`mint/src/api/transaction.rs:367`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L367) | sim | **NÃO EXECUTAR** |
| `/operate/fee/raise` | POST | `fee`, `fee_prikey`, `hash`, `hexbody`; corpo do POST: transação ou bloco em hex | Aumenta a taxa de uma transação; recebe a chave privada da taxa. | [`mint/src/api/transaction.rs:451`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L451) | sim | **NÃO EXECUTAR** |
| `/operate/contract/logs/delete` | GET | `height`, `auth` | Apaga logs de contrato (parâmetros `height`, `auth`); muda o estado do nó. | [`vm/src/api.rs:122`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L122) | sim | **NÃO EXECUTAR** |
| `/submit/transaction` | POST | `only_insert_txpool`, `hexbody`; corpo do POST: transação ou bloco em hex | Transmite uma transação à rede (POST). | [`mint/src/api/query/tx.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L129) | sim | **NÃO EXECUTAR** |
| `/submit/block` | POST | `hexbody`; corpo do POST: transação ou bloco em hex | Envia um bloco ao nó (POST). | [`mint/src/api/query/tx.rs:167`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L167) | sim | **NÃO EXECUTAR** |
| `/submit/miner/success` | GET | `block_nonce`, `coinbase_nonce`, `height` | Resultado de mineração (nonces) enviado por um minerador. | [`mint/src/api/miner.rs:57`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L57) | sim | **NÃO EXECUTAR** |
| `/submit/diamondminer/success` | POST | `hexbody`; corpo do POST: transação ou bloco em hex | Resultado de mineração de diamante enviado por um minerador (POST). | [`mint/src/api/miner.rs:113`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L113) | sim | **NÃO EXECUTAR** |

## Depuração (desligada por padrão)

| rota | método | parâmetros | o que devolve | handler Rust (arquivo:linha) | está na doc oficial? | seguro de chamar? |
|---|---|---|---|---|---|---|
| `/debug/contract/storage` | GET | `contract`, `key`, `kind` | Depuração: lê o armazenamento de um contrato (`contract`, `key`, `kind`). | [`vm/src/api.rs:442`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L442) | não | depuração · R5; desligada por padrão (404) |
| `/debug/p2sh/scriptmh` | GET | `lockbox`, `codeconf`, `libs` | Depuração: rota de script P2SH (`lockbox`, `codeconf`, `libs`). | [`vm/src/api.rs:526`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L526) | não | depuração · R5; desligada por padrão (404) |
| `/debug/pool_print` | GET | — | Depuração: imprime o pool de transações. | [`api/src/pool.rs:20`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L20) | não | depuração · R5; desligada por padrão (404) |

Documentação oficial: [fullnode_api_doc_v2.md](https://github.com/hacash/doc/blob/main/server/fullnode_api_doc_v2.md). Ela descreve os parâmetros das rotas documentadas melhor que esta tabela.

Este arquivo é gerado por `scripts/gerar-mapa-rotas.ts` a partir de `api/rotas.json`. Para mudar, edite o JSON ou o script e rode `bun scripts/gerar-mapa-rotas.ts`; `--check` falha se algum arquivo estiver desatualizado.
