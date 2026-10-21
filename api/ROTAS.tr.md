# Hacash node API: route haritası

Diğer diller: [English](ROTAS.md) · [Português (Brasil)](ROTAS.pt-BR.md) · [简体中文](ROTAS.zh.md)

Hacash fullnode 1.2.5 (commit `ce25368a`) için 55 HTTP route'unun haritası; [`rotas.json`](rotas.json) dosyasından üretildi, ölçüm tarihi 2026-10-21. `debug_routes = false` (varsayılan) iken 52 route mount edilir. 10 route **ÇALIŞTIRMAYIN** olarak işaretli: private key üretir veya alır, imzalar, state değiştirir ya da broadcast eder; çağrılmadılar. Diğer 45 route yerel bir node'a karşı çağrıldı. API hata durumunda da HTTP 200 döner; hata body içinde `{"ret":1,"err":"..."}` biçiminde gelir.

**Risk sınıfları:** R0 okuma · R1 uzun beklemeli okuma · R2 private key içerir · R3 state değiştirir veya broadcast eder · R4 mining · R5 debug

## Node ve durum

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/` | GET | — | Node'un HTML console sayfası (height, peers, transaction pool). | [`mint/src/api/console.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/console.rs#L12) | evet | evet · R0 okuma |
| `/_server_` | GET | — | Düz metin `Hacash Api Server`; API server'ın çalıştığını gösterir. | [`server/src/http.rs:163`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/server/src/http.rs#L163) | hayır | evet · R0 okuma |
| `/status` | GET | — | Node durumu: height, chain id, block target seconds, uptime. | [`api/src/status.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/status.rs#L9) | hayır | evet · R0 okuma |
| `/pool_summary` | GET | — | Gruba göre transaction pool sayıları. | [`api/src/pool.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L9) | hayır | evet · R0 okuma |
| `/vm/status` | GET | — | Virtual machine açık mı, ve height. | [`vm/src/api.rs:55`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L55) | hayır | evet · R0 okuma |

## Chain: height, supply, block, hashrate, fee

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/query/latest` | GET | — | Son block height ve HACD sayısı. | [`mint/src/api/query/supply.rs:40`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L40) | evet | evet · R0 okuma |
| `/query/supply` | GET | — | Son height'taki supply ve circulation rakamları (circulation, burned, HACD, channel toplamları, asset). | [`mint/src/api/query/supply.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L7) | evet | evet · R0 okuma |
| `/query/block/height/latest` | GET | — | Sadece son block height. | [`api/src/chain.rs:24`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L24) | hayır | evet · R0 okuma |
| `/block_by_height` | GET | `height` | Bir height'taki block özeti: height, hash prefix, size. | [`api/src/chain.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L7) | hayır | evet · R0 okuma |
| `/query/block/intro` | GET | `unit`, `hash`, `tx_hash_list`, `height` | Tek bir block'un özeti (height veya hash ile); isteğe bağlı transaction hash listesi. | [`mint/src/api/query/block.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L9) | evet | evet · R0 okuma |
| `/query/block/recents` | GET | `unit` | En son block'ların listesi. | [`mint/src/api/query/block.rs:189`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L189) | evet | evet · R0 okuma |
| `/query/block/views` | GET | `unit`, `limit`, `page`, `start`, `desc` | Block listesi (parametreler `limit`, `page`, `start`, `desc`). | [`mint/src/api/query/block.rs:75`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L75) | evet | evet · R0 okuma |
| `/query/block/datas` | GET | `hexbody`, `base64body`, `confirm`, `start_height`, `limit`, `max_size` | Başlangıç height'ından ham block verisi (bytes; `hexbody=true` ile hex metin). JSON değil. | [`mint/src/api/query/block.rs:23`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L23) | evet | evet · R0 okuma |
| `/query/block/pools` | GET | — | Periyoda göre block istatistikleri (örneğin `1d`); handler `block_pool_stats_handler`. | [`mint/src/api/query/block.rs:110`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L110) | hayır | evet · R0 okuma |
| `/query/hashrate` | GET | — | Network hashrate: hedef ve gerçek zamanlı değer. | [`mint/src/api/query/hashrate.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L7) | evet | evet · R0 okuma |
| `/query/hashrate/logs` | GET | `target`, `scale`, `days` | Hashrate geçmişi (günlük seri). | [`mint/src/api/query/hashrate.rs:26`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L26) | evet | evet · R0 okuma |
| `/query/fee/average` | GET | `unit`, `extra9`, `burn90`, `consumption`, `tx_type` | Transaction boyutuna (`consumption`) göre ortalama fee tahmini. | [`mint/src/api/query/channel.rs:49`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L49) | evet | evet · R0 okuma |

## Balance, asset, channel, transfer

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/query/balance` | GET | `unit`, `diamonds`, `assets`, `asset_meta`, `address`, `asset`, `coinkind` | Bir address'in balance'ı: HAC, HACD, satoshi (ve asset). | [`mint/src/api/query/balance.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/balance.rs#L129) | evet | evet · R0 okuma |
| `/query/asset` | GET | `serial` | Serial ile asset (token) verisi: ticker, name, decimals, supply. | [`mint/src/api/query/asset.rs:31`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/asset.rs#L31) | hayır | evet · R0 okuma |
| `/query/channel` | GET | `unit`, `id` | Id ile bir payment channel'ın durumu. | [`mint/src/api/query/channel.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L9) | evet | evet · R0 okuma |
| `/query/coin/transfer` | GET | `unit`, `coinkind`, `height`, `txposi`, `from`, `filter_from`, `to`, `filter_to` | Bir height ve transaction konumunda bulunan transfer (gönderen, alıcı ve coin türüne göre filtre). | [`mint/src/api/transfer.rs:173`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L173) | evet | evet · R0 okuma |

## HACD

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/query/diamond` | GET | `unit`, `name`, `number` | İsim veya numara ile bir HACD: owner ve veri. | [`mint/src/api/query/diamond.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L12) | evet | evet · R0 okuma |
| `/query/diamond/views` | GET | `unit`, `limit`, `page`, `start`, `desc`, `name` | HACD listesi (parametreler `limit`, `page`, `start`, `desc`, `name`). | [`mint/src/api/query/diamond.rs:73`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L73) | evet | evet · R0 okuma |
| `/query/diamond/bidding` | GET | `unit`, `since`, `limit`, `number` | Güncel HACD bid'leri. | [`mint/src/api/query/diamond.rs:279`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L279) | evet | evet · R0 okuma |
| `/query/diamond/engrave` | GET | `tx_hash`, `txposi`, `height` | HACD inscription'ları (transaction hash veya height ve konum ile). | [`mint/src/api/query/diamond.rs:355`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L355) | evet | evet · R0 okuma |
| `/query/diamond/inscription_protocol_cost` | GET | `unit`, `action`, `name`, `from`, `to` | Bir inscription işleminin maliyeti (`action`: append, drop, edit, move). | [`mint/src/api/query/diamond.rs:244`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L244) | evet | evet · R0 okuma |
| `/query/diamond/inscription_protocol_cost/append` | GET | `unit`, `action`, `name`, `from`, `to` | `inscription_protocol_cost` ile aynı, `action` append'e sabit. | [`mint/src/api/query/diamond.rs:251`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L251) | hayır | evet · R0 okuma |
| `/query/diamond/inscription_protocol_cost/drop` | GET | `unit`, `action`, `name`, `from`, `to` | `inscription_protocol_cost` ile aynı, `action` drop'a sabit. | [`mint/src/api/query/diamond.rs:272`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L272) | hayır | evet · R0 okuma |
| `/query/diamond/inscription_protocol_cost/edit` | GET | `unit`, `action`, `name`, `from`, `to` | `inscription_protocol_cost` ile aynı, `action` edit'e sabit. | [`mint/src/api/query/diamond.rs:265`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L265) | hayır | evet · R0 okuma |
| `/query/diamond/inscription_protocol_cost/move` | GET | `unit`, `action`, `name`, `from`, `to` | `inscription_protocol_cost` ile aynı, `action` move'a sabit (`to` gerekir). | [`mint/src/api/query/diamond.rs:258`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L258) | hayır | evet · R0 okuma |

## Transaction ve simulation

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/query/transaction` | GET | `unit`, `hash`, `body`, `action`, `signature`, `description` | Hash ile bir transaction: block, fee ve isteğe bağlı action, signature, description. | [`mint/src/api/query/tx.rs:50`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L50) | evet | evet · R0 okuma |
| `/util/transaction/check` | POST | `unit`, `set_fee`, `sign_address`, `body`, `signature`, `description`, `hexbody`; POST body: hex transaction veya block | Hex gönderilen transaction'ı kontrol eder (POST); broadcast etmez. | [`mint/src/api/transaction.rs:312`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L312) | evet | evet · R0 (POST sadece simüle eder veya kontrol eder) |
| `/query/transaction/simulate` | POST | `gas_max`; POST body: hex transaction veya block | Hex gönderilen transaction'ı simüle eder (POST) ve sonucu bildirir; broadcast etmez. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | hayır | evet · R0 (POST sadece simüle eder veya kontrol eder) |
| `/query/vm/estimate_gas` | POST | `gas_max`; POST body: hex transaction veya block | `/query/transaction/simulate` ile aynı handler (gas estimate yolu); POST, broadcast etmez. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | hayır | evet · R0 (POST sadece simüle eder veya kontrol eder) |
| `/query/vm/simulate` | POST | `gas_max`; POST body: hex transaction veya block | `/query/transaction/simulate` ile aynı handler (VM simulation yolu); POST, broadcast etmez. | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | hayır | evet · R0 (POST sadece simüle eder veya kontrol eder) |

## Contract

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/query/contract/logs` | GET | `height`, `index`, `address` | Height, index ve address ile contract log'ları. | [`vm/src/api.rs:62`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L62) | evet | evet · R0 okuma |
| `/query/contract/sandboxcall` | GET | `contract`, `function`, `params`, `caller`, `gas_max` | Bir contract function'ı sandbox'ta çağırır (`contract`, `function`, `params`, `caller`, `gas_max`). | [`vm/src/api.rs:316`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L316) | evet | evet · R0 okuma |
| `/query/contract/storage_fee` | GET | `charge_bytes` | Contract storage fee kuralları ve `charge_bytes` için fee. | [`api/src/contract_storage.rs:14`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/contract_storage.rs#L14) | hayır | evet · R0 okuma |

## Mining (okuma)

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/query/miner/notice` | GET | `height`, `wait` | Long-poll: `height` sonrası yenilik bekler (en fazla `wait`). | [`app/src/fullnode/miner_notice.rs:28`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/app/src/fullnode/miner_notice.rs#L28) | evet | evet · R1 okuma, uzun bekleme |
| `/query/miner/pending` | GET | `detail`, `transaction`, `stuff`, `base64` | Miner'lar için bekleyen iş; mining kapalıyken hata döner. | [`mint/src/api/miner.rs:10`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L10) | evet | evet · R4 okuma; mining kapalıyken hata döner |
| `/query/diamondminer/init` | GET | — | HACD miner için başlangıç verisi; mining kapalıyken hata döner. | [`mint/src/api/miner.rs:93`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L93) | evet | evet · R4 okuma; mining kapalıyken hata döner |
| `/miner/pending_replay` | GET | — | Miner'ın bekleyen replay öğe sayısı (`pending_replay`). | [`mint/src/api/mod.rs:58`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/mod.rs#L58) | hayır | evet · R4 okuma; mining kapalıyken hata döner |

## Key, signing, state change ve broadcast (ÇALIŞTIRMAYIN)

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/create/account` | GET | `quantity` | Hesap oluşturur ve body'de PRIVATE KEY DÖNDÜRÜR. | [`api/src/account.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/account.rs#L7) | evet | **ÇALIŞTIRMAYIN** |
| `/create/coin/transfer` | GET | `fee`, `main_prikey`, `from_prikey`, `to_address`, `hacash`, `diamonds`, `satoshi`, `timestamp` | Transfer oluşturur; query string'de private key alır. | [`mint/src/api/transfer.rs:233`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L233) | evet | **ÇALIŞTIRMAYIN** |
| `/create/transaction` | POST | `unit`, `action`, `signature`, `description`, `hexbody`; POST body: hex transaction veya block | POST body'den transaction oluşturur. | [`mint/src/api/transaction.rs:99`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L99) | evet | **ÇALIŞTIRMAYIN** |
| `/util/transaction/sign` | POST | `unit`, `prikey`, `pubkey`, `sigdts`, `signature`, `description`, `hexbody`; POST body: hex transaction veya block | Transaction'ı imzalar; private key alır. | [`mint/src/api/transaction.rs:367`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L367) | evet | **ÇALIŞTIRMAYIN** |
| `/operate/fee/raise` | POST | `fee`, `fee_prikey`, `hash`, `hexbody`; POST body: hex transaction veya block | Transaction fee'sini artırır; fee private key alır. | [`mint/src/api/transaction.rs:451`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L451) | evet | **ÇALIŞTIRMAYIN** |
| `/operate/contract/logs/delete` | GET | `height`, `auth` | Contract log'larını siler (parametreler `height`, `auth`); node durumunu değiştirir. | [`vm/src/api.rs:122`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L122) | evet | **ÇALIŞTIRMAYIN** |
| `/submit/transaction` | POST | `only_insert_txpool`, `hexbody`; POST body: hex transaction veya block | Transaction'ı ağa broadcast eder (POST). | [`mint/src/api/query/tx.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L129) | evet | **ÇALIŞTIRMAYIN** |
| `/submit/block` | POST | `hexbody`; POST body: hex transaction veya block | Node'a block gönderir (POST). | [`mint/src/api/query/tx.rs:167`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L167) | evet | **ÇALIŞTIRMAYIN** |
| `/submit/miner/success` | GET | `block_nonce`, `coinbase_nonce`, `height` | Miner'ın gönderdiği mining sonucu (nonce). | [`mint/src/api/miner.rs:57`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L57) | evet | **ÇALIŞTIRMAYIN** |
| `/submit/diamondminer/success` | POST | `hexbody`; POST body: hex transaction veya block | Miner'ın gönderdiği HACD mining sonucu (POST). | [`mint/src/api/miner.rs:113`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L113) | evet | **ÇALIŞTIRMAYIN** |

## Debug (varsayılan kapalı)

| route | method | parametreler | ne döndürür | Rust handler (dosya:satır) | resmi dokümanda var mı? | çağırmak güvenli mi? |
|---|---|---|---|---|---|---|
| `/debug/contract/storage` | GET | `contract`, `key`, `kind` | Debug: contract storage okur (`contract`, `key`, `kind`). | [`vm/src/api.rs:442`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L442) | hayır | debug · R5; varsayılan kapalı (404) |
| `/debug/p2sh/scriptmh` | GET | `lockbox`, `codeconf`, `libs` | Debug: P2SH script route'u (`lockbox`, `codeconf`, `libs`). | [`vm/src/api.rs:526`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L526) | hayır | debug · R5; varsayılan kapalı (404) |
| `/debug/pool_print` | GET | — | Debug: transaction pool'u yazdırır. | [`api/src/pool.rs:20`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L20) | hayır | debug · R5; varsayılan kapalı (404) |

Resmi doküman: [fullnode_api_doc_v2.md](https://github.com/hacash/doc/blob/main/server/fullnode_api_doc_v2.md). Dokümante edilmiş route'ların parametrelerini bu tablodan daha iyi anlatır.

Bu dosya `api/rotas.json` içinden `scripts/gerar-mapa-rotas.ts` ile üretilir. Değiştirmek için JSON'u veya script'i düzenleyin ve `bun scripts/gerar-mapa-rotas.ts` çalıştırın; `--check` güncel olmayan dosyada hata verir.

Assisted translation; review by native speakers is welcome via issue or PR. Yardımlı çeviri; ana dili konuşanların issue veya PR ile yapacağı inceleme memnuniyetle karşılanır.
