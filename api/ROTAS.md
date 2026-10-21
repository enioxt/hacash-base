# Hacash node API: route map

Other languages: [Português (Brasil)](ROTAS.pt-BR.md) · [简体中文](ROTAS.zh.md) · [Türkçe](ROTAS.tr.md)

Map of the 55 HTTP routes of the Hacash fullnode 1.2.5 (commit `ce25368a`), generated from [`rotas.json`](rotas.json) and measured on 2026-10-21. With `debug_routes = false` (default) 52 are mounted. 10 routes are marked **DO NOT RUN**: they create or receive a private key, sign, change state or broadcast, and were not called. The other 45 were called against a local node. The API answers HTTP 200 even on error; the error comes in the body as `{"ret":1,"err":"..."}`.

**Risk classes:** R0 read · R1 read with a long wait · R2 involves a private key · R3 changes state or broadcasts · R4 mining · R5 debugging

## Node and status

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/` | GET | — | HTML console page of the node (height, peers, transaction pool). | [`mint/src/api/console.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/console.rs#L12) | yes | yes · R0 read |
| `/_server_` | GET | — | Plain-text banner `Hacash Api Server`; shows the API server is up. | [`server/src/http.rs:163`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/server/src/http.rs#L163) | no | yes · R0 read |
| `/status` | GET | — | Node status: height, chain id, block target seconds, uptime. | [`api/src/status.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/status.rs#L9) | no | yes · R0 read |
| `/pool_summary` | GET | — | Transaction pool counters by group. | [`api/src/pool.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L9) | no | yes · R0 read |
| `/vm/status` | GET | — | Whether the virtual machine is enabled, and the height. | [`vm/src/api.rs:55`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L55) | no | yes · R0 read |

## Chain: height, supply, blocks, hashrate, fee

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/query/latest` | GET | — | Latest block height and number of diamonds. | [`mint/src/api/query/supply.rs:40`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L40) | yes | yes · R0 read |
| `/query/supply` | GET | — | Supply and circulation figures at the latest height (circulation, burned, diamonds, channel totals, assets). | [`mint/src/api/query/supply.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L7) | yes | yes · R0 read |
| `/query/block/height/latest` | GET | — | Latest block height only. | [`api/src/chain.rs:24`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L24) | no | yes · R0 read |
| `/block_by_height` | GET | `height` | Short block summary at a height: height, hash prefix, size. | [`api/src/chain.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L7) | no | yes · R0 read |
| `/query/block/intro` | GET | `unit`, `hash`, `tx_hash_list`, `height` | Summary of one block, by height or hash; optional transaction hash list. | [`mint/src/api/query/block.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L9) | yes | yes · R0 read |
| `/query/block/recents` | GET | `unit` | List of the most recent blocks. | [`mint/src/api/query/block.rs:189`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L189) | yes | yes · R0 read |
| `/query/block/views` | GET | `unit`, `limit`, `page`, `start`, `desc` | List of blocks (parameters `limit`, `page`, `start`, `desc`). | [`mint/src/api/query/block.rs:75`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L75) | yes | yes · R0 read |
| `/query/block/datas` | GET | `hexbody`, `base64body`, `confirm`, `start_height`, `limit`, `max_size` | Raw block data from a start height (bytes; hex text with `hexbody=true`). Not JSON. | [`mint/src/api/query/block.rs:23`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L23) | yes | yes · R0 read |
| `/query/block/pools` | GET | — | Block statistics per period (for example `1d`); handler `block_pool_stats_handler`. | [`mint/src/api/query/block.rs:110`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L110) | no | yes · R0 read |
| `/query/hashrate` | GET | — | Network hashrate: target and real-time values. | [`mint/src/api/query/hashrate.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L7) | yes | yes · R0 read |
| `/query/hashrate/logs` | GET | `target`, `scale`, `days` | Hashrate history (daily series). | [`mint/src/api/query/hashrate.rs:26`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L26) | yes | yes · R0 read |
| `/query/fee/average` | GET | `unit`, `extra9`, `burn90`, `consumption`, `tx_type` | Average fee estimate for a transaction size (`consumption`). | [`mint/src/api/query/channel.rs:49`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L49) | yes | yes · R0 read |

## Balance, assets, channels, transfers

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/query/balance` | GET | `unit`, `diamonds`, `assets`, `asset_meta`, `address`, `asset`, `coinkind` | Balance of an address: HAC, diamonds, satoshi (and assets). | [`mint/src/api/query/balance.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/balance.rs#L129) | yes | yes · R0 read |
| `/query/asset` | GET | `serial` | Data of an asset (token) by serial: ticker, name, decimals, supply. | [`mint/src/api/query/asset.rs:31`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/asset.rs#L31) | no | yes · R0 read |
| `/query/channel` | GET | `unit`, `id` | State of a payment channel by id. | [`mint/src/api/query/channel.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L9) | yes | yes · R0 read |
| `/query/coin/transfer` | GET | `unit`, `coinkind`, `height`, `txposi`, `from`, `filter_from`, `to`, `filter_to` | Transfer found at a height and transaction position (filters by sender, receiver and coin kind). | [`mint/src/api/transfer.rs:173`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L173) | yes | yes · R0 read |

## Diamonds (HACD)

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/query/diamond` | GET | `unit`, `name`, `number` | One diamond by name or number: owner and data. | [`mint/src/api/query/diamond.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L12) | yes | yes · R0 read |
| `/query/diamond/views` | GET | `unit`, `limit`, `page`, `start`, `desc`, `name` | List of diamonds (parameters `limit`, `page`, `start`, `desc`, `name`). | [`mint/src/api/query/diamond.rs:73`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L73) | yes | yes · R0 read |
| `/query/diamond/bidding` | GET | `unit`, `since`, `limit`, `number` | Current diamond bids. | [`mint/src/api/query/diamond.rs:279`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L279) | yes | yes · R0 read |
| `/query/diamond/engrave` | GET | `tx_hash`, `txposi`, `height` | Diamond inscriptions, by transaction hash or by height and transaction position. | [`mint/src/api/query/diamond.rs:355`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L355) | yes | yes · R0 read |
| `/query/diamond/inscription_protocol_cost` | GET | `unit`, `action`, `name`, `from`, `to` | Cost of an inscription action (`action`: append, drop, edit, move). | [`mint/src/api/query/diamond.rs:244`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L244) | yes | yes · R0 read |
| `/query/diamond/inscription_protocol_cost/append` | GET | `unit`, `action`, `name`, `from`, `to` | Same as `inscription_protocol_cost` with `action` fixed to append. | [`mint/src/api/query/diamond.rs:251`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L251) | no | yes · R0 read |
| `/query/diamond/inscription_protocol_cost/drop` | GET | `unit`, `action`, `name`, `from`, `to` | Same as `inscription_protocol_cost` with `action` fixed to drop. | [`mint/src/api/query/diamond.rs:272`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L272) | no | yes · R0 read |
| `/query/diamond/inscription_protocol_cost/edit` | GET | `unit`, `action`, `name`, `from`, `to` | Same as `inscription_protocol_cost` with `action` fixed to edit. | [`mint/src/api/query/diamond.rs:265`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L265) | no | yes · R0 read |
| `/query/diamond/inscription_protocol_cost/move` | GET | `unit`, `action`, `name`, `from`, `to` | Same as `inscription_protocol_cost` with `action` fixed to move (needs `to`). | [`mint/src/api/query/diamond.rs:258`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L258) | no | yes · R0 read |

## Transactions and simulation

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/query/transaction` | GET | `unit`, `hash`, `body`, `action`, `signature`, `description` | One transaction by hash: block, fee, and optionally actions, signature and description. | [`mint/src/api/query/tx.rs:50`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L50) | yes | yes · R0 read |
| `/util/transaction/check` | POST | `unit`, `set_fee`, `sign_address`, `body`, `signature`, `description`, `hexbody`; POST body: transaction or block, hex | Checks a transaction sent in hex (POST); does not broadcast. | [`mint/src/api/transaction.rs:312`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L312) | yes | yes · R0 (POST only simulates or checks) |
| `/query/transaction/simulate` | POST | `gas_max`; POST body: transaction or block, hex | Simulates a transaction sent in hex (POST) and reports the result; does not broadcast. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | no | yes · R0 (POST only simulates or checks) |
| `/query/vm/estimate_gas` | POST | `gas_max`; POST body: transaction or block, hex | Same handler as `/query/transaction/simulate` (gas estimate path); POST, does not broadcast. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | no | yes · R0 (POST only simulates or checks) |
| `/query/vm/simulate` | POST | `gas_max`; POST body: transaction or block, hex | Same handler as `/query/transaction/simulate` (VM simulation path); POST, does not broadcast. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | no | yes · R0 (POST only simulates or checks) |

## Contracts

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/query/contract/logs` | GET | `height`, `index`, `address` | Contract logs by height, index and address. | [`vm/src/api.rs:62`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L62) | yes | yes · R0 read |
| `/query/contract/sandboxcall` | GET | `contract`, `function`, `params`, `caller`, `gas_max` | Calls a contract function in a sandbox (`contract`, `function`, `params`, `caller`, `gas_max`). | [`vm/src/api.rs:316`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L316) | yes | yes · R0 read |
| `/query/contract/storage_fee` | GET | `charge_bytes` | Contract storage fee rules and the fee for `charge_bytes`. | [`api/src/contract_storage.rs:14`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/contract_storage.rs#L14) | no | yes · R0 read |

## Mining (read)

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/query/miner/notice` | GET | `height`, `wait` | Long-poll: waits for news after `height` (up to `wait`). | [`app/src/fullnode/miner_notice.rs:28`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/app/src/fullnode/miner_notice.rs#L28) | yes | yes · R1 read, long wait |
| `/query/miner/pending` | GET | `detail`, `transaction`, `stuff`, `base64` | Pending work for miners; answers an error when mining is off. | [`mint/src/api/miner.rs:10`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L10) | yes | yes · R4 read; error if mining is off |
| `/query/diamondminer/init` | GET | — | Initial data for a diamond miner; answers an error when mining is off. | [`mint/src/api/miner.rs:93`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L93) | yes | yes · R4 read; error if mining is off |
| `/miner/pending_replay` | GET | — | Count of pending replay items of the miner (`pending_replay`). | [`mint/src/api/mod.rs:58`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/mod.rs#L58) | no | yes · R4 read; error if mining is off |

## Keys, signing, state change and broadcast (DO NOT RUN)

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/create/account` | GET | `quantity` | Creates an account and RETURNS A PRIVATE KEY in the body. | [`api/src/account.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/account.rs#L7) | yes | **DO NOT RUN** |
| `/create/coin/transfer` | GET | `fee`, `main_prikey`, `from_prikey`, `to_address`, `hacash`, `diamonds`, `satoshi`, `timestamp` | Builds a transfer; takes a private key in the query string. | [`mint/src/api/transfer.rs:233`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L233) | yes | **DO NOT RUN** |
| `/create/transaction` | POST | `unit`, `action`, `signature`, `description`, `hexbody`; POST body: transaction or block, hex | Builds a transaction from the POST body. | [`mint/src/api/transaction.rs:99`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L99) | yes | **DO NOT RUN** |
| `/util/transaction/sign` | POST | `unit`, `prikey`, `pubkey`, `sigdts`, `signature`, `description`, `hexbody`; POST body: transaction or block, hex | Signs a transaction; takes a private key. | [`mint/src/api/transaction.rs:367`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L367) | yes | **DO NOT RUN** |
| `/operate/fee/raise` | POST | `fee`, `fee_prikey`, `hash`, `hexbody`; POST body: transaction or block, hex | Raises the fee of a transaction; takes a fee private key. | [`mint/src/api/transaction.rs:451`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L451) | yes | **DO NOT RUN** |
| `/operate/contract/logs/delete` | GET | `height`, `auth` | Deletes contract logs (parameters `height`, `auth`); changes node state. | [`vm/src/api.rs:122`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L122) | yes | **DO NOT RUN** |
| `/submit/transaction` | POST | `only_insert_txpool`, `hexbody`; POST body: transaction or block, hex | Broadcasts a transaction to the network (POST). | [`mint/src/api/query/tx.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L129) | yes | **DO NOT RUN** |
| `/submit/block` | POST | `hexbody`; POST body: transaction or block, hex | Submits a block to the node (POST). | [`mint/src/api/query/tx.rs:167`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L167) | yes | **DO NOT RUN** |
| `/submit/miner/success` | GET | `block_nonce`, `coinbase_nonce`, `height` | Mining result (nonces) submitted by a miner. | [`mint/src/api/miner.rs:57`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L57) | yes | **DO NOT RUN** |
| `/submit/diamondminer/success` | POST | `hexbody`; POST body: transaction or block, hex | Diamond mining result submitted by a miner (POST). | [`mint/src/api/miner.rs:113`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L113) | yes | **DO NOT RUN** |

## Debug (off by default)

| route | method | parameters | what it returns | Rust handler (file:line) | in the official docs? | safe to call? |
|---|---|---|---|---|---|---|
| `/debug/contract/storage` | GET | `contract`, `key`, `kind` | Debug: reads contract storage (`contract`, `key`, `kind`). | [`vm/src/api.rs:442`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L442) | no | debug · R5; off by default (404) |
| `/debug/p2sh/scriptmh` | GET | `lockbox`, `codeconf`, `libs` | Debug: P2SH script route (`lockbox`, `codeconf`, `libs`). | [`vm/src/api.rs:526`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L526) | no | debug · R5; off by default (404) |
| `/debug/pool_print` | GET | — | Debug: prints the transaction pool. | [`api/src/pool.rs:20`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L20) | no | debug · R5; off by default (404) |

Official documentation: [fullnode_api_doc_v2.md](https://github.com/hacash/doc/blob/main/server/fullnode_api_doc_v2.md). It describes the parameters of the documented routes better than this table.

This file is generated by `scripts/gerar-mapa-rotas.ts` from `api/rotas.json`. To change it, edit the JSON or the script, then run `bun scripts/gerar-mapa-rotas.ts`; `--check` fails if a file is out of date.
