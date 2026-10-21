# Hacash: single source of knowledge

> An open base, in English, about the Hacash network. Checked on **2026-10-21**: `hacash/fullnode` code at commit `ce25368a` (version 1.2.5), GitHub and sites consulted on the same day.
> **Rule:** each claim says where it came from (file:line, command or URL) and when. What was not measured shows `⚪` with **where to look**.
> This text organizes what already exists. It does not replace the code, the HIPs or the maintainers.
> Versão em português: [HACASH.pt-BR.md](HACASH.pt-BR.md). Routes in machine format: [`api/rotas.json`](api/rotas.json).

## Contents

1. What Hacash is
2. How to run a node (release package, tested; building in the appendix)
3. Repository map (33) and licenses
4. Node APIs (55 paths, measured)
5. Governance and channels
6. HIPs (improvement proposals)
7. Open issues and PRs (55 + 5) and how they are organized
8. Where to contribute (with first tasks for newcomers)
9. Divergences between sources
10. Gaps (not measured), each with an address
11. Glossary for translation

---

## 1. What Hacash is

> Measured on 2026-10-21. Code: `hacash/fullnode`, commit `ce25368a`, version 1.2.5.
> Each fact carries its source. `⚪` marks what was not measured, with "where to look".

Hacash is a proof-of-work (PoW) network with the coin **HAC** (symbol ㄜ) and **HACD**, a unique digital diamond obtained through a bidding auction; a one-way transfer of **BTC** (HIP-13) is planned and has not moved any BTC so far (`transferred_bitcoin = 0` in `/query/supply`, 2026-10-21). The full explanation belongs to the project and is not repeated here: whitepaper `https://hacash.org/whitepaper.pdf`, `https://hacash.org` and `https://hacash.money`. This section keeps only what we measured.

### State measured on 2026-10-21, 09:35

Local node in sync. The 5 responses were compared byte by byte with the public node (see section 2.2).

| measure | value | source |
|---|---|---|
| latest block height | 792,727 | `GET /query/latest` |
| HACD mined | 138,622 | `GET /query/latest` and `/query/supply` |
| HAC in circulation | 1,909,386.75 | `GET /query/supply` → `current_circulation` |
| HAC burned in fees | 1,634,517.69 | `GET /query/supply` → `burned_fee` |
| open payment channels | 26 (deposit 97,834.00 HAC) | `GET /query/supply` |
| contracts deployed / assets created | 11 / 8 | `GET /query/supply` → `contract_deploy_count`, `created_asset` |
| BTC moved through the bridge | 0 | `GET /query/supply` → `transferred_bitcoin` |
| block target | 300 s | `GET /status` → `block_target_seconds` |
| mining power | target 5.03 GH/s · real time 4.19 GH/s | `GET /query/hashrate` |
| last-day blocks by pool (288 blocks) | largest pool 146 (50.7%) | `GET /query/block/pools` |

### Measured in the code and on GitHub

- **Difficulty:** **ASERT** since height **738,654** (`mint/src/consensus/difficulty.rs:9`). The word "LWMA" does not appear in the 1.2.5 code (search over `*.rs` and `*.md`, 2026-10-21).
- **Istanbul:** active at height **765,432** (`hacash-params/src/lib.rs:164`, field `asset_alive_height`). Official text: `hacash/doc/tech/istanbul_upgrade.md`.
- **Latest version:** 1.2.5, from 2026-10-17. It changed the P2P "magic": 1.2.4 nodes do not connect to 1.2.5 nodes (release notes, `https://github.com/hacash/fullnode/releases/tag/1.2.5`). Six versions between 2026-09-22 and 2026-10-17 (1.2.0 to 1.2.5).
- **Who writes the code:** in `fullnode`, the main maintainer has 384 of the 398 commits listed by the contributors API (96.5%); three other accounts add up to 14 (`gh api repos/hacash/fullnode/contributors`, 2026-10-21).

---

## 2. How to run a node (tested on 2026-10-21)

> Test machine: Ubuntu 24.04, 8 cores, 15 GB RAM.
> Short path: download the release package, change 2 lines of the config and run (2.1). Building from source is in the appendix (2.3).
> The official walkthrough exists (`https://hacash.org/run-full-node`, "two steps"), but it shows the log of the Go node 0.1.17 (section 9).

### 2.1 Short path: download, change 2 lines, run

**1. Download** the 1.2.5 release package and check the hash:

```
curl -LO https://github.com/hacash/fullnode/releases/download/1.2.5/hacash_fullnode_ubuntu64.zip
sha256sum hacash_fullnode_ubuntu64.zip
# expected: 7cdaec926eef0b7b2bedb9583b402efca8d51840c6c77da0837a91fc7e01bad1
unzip hacash_fullnode_ubuntu64.zip -d hacash
```

- The zip has 7,504,517 bytes. The SHA-256 matches the `digest` that the GitHub API publishes for the file (2026-10-21).
- Contents: `hacash_fullnode_ubuntu`, `hacash_fullnode_ubuntu_16.04` and `hacash.config.ini` (951 bytes, dated 2026-09-06).

**2. Change 2 lines** of `hacash.config.ini`, for a light, read-only node:

| section | line in the zip | change to | why |
|---|---|---|---|
| `[engine]` | `fast_sync = false` | `fast_sync = true` | fast sync; skips full validation of historical blocks |
| `[p2p]` | `listen_port = 3337` | `listen_port = 0` | accepts no inbound connections (`node/src/transport.rs:124`) |

- No change needed: the RPC already listens only on `127.0.0.1` by default (`base/src/api/config.rs:17`), on port 8082.
- `[miner]` and `[diamond_miner]` ship with `enable` commented out; the default is off. The example values in those sections (reward address, bid password) have no effect.
- If port 8082 is already in use, also change `[server] listen_port` (in the test: 8093, because another node was on 8082).

**3. Run**, with no argument. The binary reads `hacash.config.ini` from its own folder and writes data to `./hacash_mainnet_data`, next to it:

```
cd hacash
chmod +x hacash_fullnode_ubuntu
HACASH_DB_SMALL_MACHINE=1 ./hacash_fullnode_ubuntu
```

Measured on 2026-10-21, as a normal user, inside a sandbox (`bwrap`, home folder hidden), stopped at 60 s:

| measure | value |
|---|---|
| version printed | `full node v1.2.5, build time: 2026/10/17 #1, database version: 1, backend: leveldb-sys` |
| API answering | 0.5 s (height 0) |
| first height above 0 | 14.5 s (height 9,049; sync arrives in batches of 10,000 blocks) |
| height after 60 s | 30,000 (3.78% of the tip, which was 792,752) |
| resident memory at 60 s | 38 MB (38,432 kB) |
| data folder size at 60 s | 10.9 MB |
| P2P peers within 60 s | 10 (all 3 `boot_nodes` in the file answered) |

- The `docs.loc/` folder that the `fullnode` README says to copy **is not in the zip**. What ships is `hacash.config.ini` itself, at the root, next to the binary. Whoever downloads the release does not hit the problem described in 2.3.3.
- The release binary uses the **LevelDB** database. A build with the default command in 2.3.2 uses `sled`.
- ⚪ The 60 s numbers are not comparable with those in 2.3.4 (12 min to the tip, 2.1 GB, 640 MB): the test stopped earlier. Where to look: repeat 2.1 without stopping and measure up to the tip.
- ⚪ The Windows and macOS packages were not tested. Where to look: `https://github.com/hacash/fullnode/releases/tag/1.2.5`.

### 2.2 Five real RPC calls (local node × public node `http://rpcapi.hacash.org`)

Measured on the built node (2.3), same version 1.2.5. The address and the transaction are public examples taken from the official documentation (`fullnode_api_doc_v2.md`); no address of ours was sent.
The public node was queried over plain `http://`, because its HTTPS certificate does not cover `rpcapi.hacash.org` (error 7 in section 9). Whatever is sent to it is readable on the network.
No key, no wallet, no broadcast.

| # | query | local | public | response |
|---|---|---|---|---|
| 1 | height: `GET /query/latest` | 200 · 0 ms | 200 · 378 ms | `{"ret":0,"height":792727,"diamond":138622}` |
| 2 | supply: `GET /query/supply` | 200 · 3 ms | 200 · 382 ms | 1,130 bytes; `current_circulation` 1909386.7536 |
| 3 | balance: `GET /query/balance?address=1AVRuFXNFi3rdMrPH4hdqSgFrEBnWisWaS&unit=mei` | 200 · 1 ms | 200 · 359 ms | `{"hacash":"1784.46320557","diamond":1,"satoshi":0}` |
| 4 | diamond: `GET /query/diamond?number=20001` | 200 · 1 ms | 200 · 369 ms | `name":"ZAKXMI"`, 506 bytes |
| 5 | transaction: `GET /query/transaction?hash=b563b525…cbb4&action=true&unit=mei` | 200 · 1 ms | 200 · 338 ms | block 583,881, fee 0.0001 HAC, 448 bytes |

- The 5 responses are **identical byte by byte** between local and public (`cmp`).
- The API returns **HTTP 200 even on error**. The error comes in the body: `{"ret":1,"err":"..."}`.
- Examples for every route, with SHA-256: [`api/rotas.json`](api/rotas.json).

### 2.3 Appendix: build from source

> For those who want the binary from source. The `fullnode` README, `build.md` and `config.md` already cover this; here are the measured numbers.
> Shortcut: [`scripts/rodar-no.sh`](scripts/rodar-no.sh) runs the 4 steps below.

#### 2.3.1 Prepare

1. Install stable Rust for your user only, with the official installer at <https://rustup.rs> (the test used the minimal profile; read what the installer does before accepting).
   Version used in the test: `rustc 1.99.1`. The project requires the 2024 edition (`fullnode` README).
2. `pkg-config` was **not** installed and the build passed with the default database (`sled`).
   The README asks for `build-essential pkg-config`. For `sled`, only the C compiler was needed.
   ⚪ The LevelDB and RocksDB databases were not tested. Where to look: `fullnode` README, section "Build the full node".

#### 2.3.2 Build

```
git clone https://github.com/hacash/fullnode
cd fullnode
cargo build --release -p app --bin fullnode
```

- Measured time: **3 min 24 s** on the first run; 2 min 33 s on a second from-scratch build by the script, with dependencies already downloaded (same machine).
- Binary: `target/release/fullnode`, 5,679,496 bytes.
- Version printed at startup: `full node v1.2.5, build time: 2026/10/17 #1, database version: 1, backend: sled`.
- Tested commit: `ce25368a`. ⚪ The `1.2.5` tag points to another commit (`710b4af`) and was not built here.

#### 2.3.3 Configure (lightest mode, read only)

The README says to copy `docs.loc/hacash.config.ini`.
That folder **does not exist in the clone**: `.gitignore` contains `*.loc/`. The same file ships ready in the release zip (2.1).
Use the minimal example from the README or from `config.md`. The file used in the tests:

```
[engine]
data_dir = /absolute/path/to/data
fast_sync = true

[p2p]
listen_ip = 127.0.0.1
listen_port = 0          ; 0 = no inbound connections
boot_nodes = <copy the boot_nodes line from the fullnode README or the zip's ini; the 2nd address differs, see section 9>

[server]
enable = true
listen_ip = 127.0.0.1    ; RPC on the local machine only
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

Notes from `config.md`:
- A relative file path is read from the executable's folder.
- An unknown key inside a known section **prevents startup**.
- `fast_sync = true` **skips full validation of historical blocks**.
- For a node that validates everything, use `fast_sync = false`. ⚪ Time not measured; where to look: section 10, first line.

#### 2.3.4 Run and measure

```
HACASH_DB_SMALL_MACHINE=1 ./target/release/fullnode /absolute/path/hacash.config.ini
```

| measure | value |
|---|---|
| time from height 0 to the tip (792,727 blocks) | about 12 min (`fast_sync = true`) |
| disk used by the `data` folder | 2.1 GB |
| resident memory after sync | about 640 MB |
| P2P peers at startup | 4 |
| sync warnings ("missing parent") | 0 (`fullnode#57` reports this warning at block 785,207; it did not reproduce here) |

---

## 3. Repository map and licenses

> Measured on 2026-10-21 with `gh api orgs/hacash/repos` and `contents` of each repository root.

- Official organization: `https://github.com/hacash`, created on 2019-01-02, with **33** public repositories.
- The organization has 7 public members. List: `https://github.com/orgs/hacash/people`.
- State = days since the last push on 2026-10-21: active ≤ 90 · stalled 91-365 · legacy > 365.
- Summary: **3 active, 7 stalled, 23 legacy**.
- Current node code: `fullnode` (Rust).
- On 2026-07-26 the maintainer said that `fullnodedev` "will be archived" (`fullnodedev#9`).
- The Go repositories (`core`, `miner`, `node`, `chain`, `service`…) are the previous generation.

### Licenses

- **19 of 33 have no LICENSE file and no license metadata. 14 are MIT.**
- No license: `fullnode`, `explorer`, `hascan`, `fullnodedev`, `fullnodetest`, `doc`, `doc-chinese`, `www`, `wallet`, `dao`, `explorer1`, `www1`, `wallet1`, `paper`, `x16rs` (fork), `pcwallet`, `blockmint`, `bitcoin` (fork), `web_base_framework`.
- The four most relevant for anyone who wants to reuse code or text: `fullnode`, `fullnodedev`, `explorer` and `doc`.
- Without a written license, copyright law generally applies by default ("all rights reserved"; general information, not legal advice, and it varies by country). Only the maintainer can say whether reuse is allowed.
- This base copies no code from those repositories. It cites paths and lines and describes the shape of the responses.

### Table

| repository | language | license | last push | days | state | open issues+PRs | note | description (GitHub) |
|---|---|---|---|---:|---|---:|---|---|
| `hacash/fullnode` | Rust | NO LICENSE | 2026-10-18 | 3 | active (≤90 d) | 19 |  | Hacash Fullnode Software and SDK |
| `hacash/explorer` | JavaScript | NO LICENSE | 2026-10-11 | 10 | active (≤90 d) | 5 |  | Hacash explorer with rust node |
| `hacash/hascan` | Rust | NO LICENSE | 2026-09-25 | 26 | active (≤90 d) | 0 |  | Hacash block scaner for explorer |
| `hacash/x16rs-sys` | C | MIT | 2026-07-12 | 101 | stalled (91-365 d) | 0 |  | x16rs c binding for rust |
| `hacash/fullnodedev` | Rust | NO LICENSE | 2026-07-11 | 102 | stalled (91-365 d) | 2 |  | hacash fullnode dev repo |
| `hacash/fullnodetest` | Rust | NO LICENSE | 2026-07-04 | 109 | stalled (91-365 d) | 0 |  |  |
| `hacash/doc` | n/a | NO LICENSE | 2026-06-27 | 116 | stalled (91-365 d) | 2 |  | documents |
| `hacash/doc-chinese` | n/a | NO LICENSE | 2026-05-14 | 160 | stalled (91-365 d) | 0 |  |  |
| `hacash/www` | Less | NO LICENSE | 2026-03-07 | 228 | stalled (91-365 d) | 2 |  | Hacash.org website |
| `hacash/wallet` | JavaScript | NO LICENSE | 2026-02-05 | 258 | stalled (91-365 d) | 0 |  | wallet with rust fullnode |
| `hacash/dao` | JavaScript | NO LICENSE | 2025-05-30 | 509 | legacy (>365 d) | 1 |  | HacashDAO.org |
| `hacash/node` | Go | MIT | 2025-01-10 | 649 | legacy (>365 d) | 2 |  |  |
| `hacash/miner` | Go | MIT | 2025-01-10 | 649 | legacy (>365 d) | 8 |  |  |
| `hacash/core` | Go | MIT | 2025-01-10 | 649 | legacy (>365 d) | 5 |  | Hacash  Core |
| `hacash/service` | Go | MIT | 2024-11-09 | 711 | legacy (>365 d) | 3 |  |  |
| `hacash/mint` | Go | MIT | 2024-11-09 | 711 | legacy (>365 d) | 0 |  |  |
| `hacash/rust` | C | MIT | 2024-10-25 | 726 | legacy (>365 d) | 5 |  | Rust Hacash Node and SDK |
| `hacash/explorer1` | JavaScript | NO LICENSE | 2024-07-23 | 820 | legacy (>365 d) | 2 |  | blockchain explorer |
| `hacash/www1` | HTML | NO LICENSE | 2024-06-22 | 851 | legacy (>365 d) | 0 |  | website |
| `hacash/wallet1` | JavaScript | NO LICENSE | 2024-06-07 | 866 | legacy (>365 d) | 0 |  | wallet |
| `hacash/paper` | n/a | NO LICENSE | 2024-05-24 | 880 | legacy (>365 d) | 1 |  | theoretical articles |
| `hacash/x16rs` | C | NO LICENSE | 2024-03-13 | 952 | legacy (>365 d) | 0 | fork | Golang X16RS |
| `hacash/jssdk` | Go | MIT | 2024-02-29 | 965 | legacy (>365 d) | 0 |  | Hacash SDK for javascript |
| `hacash/pcwallet` | Go | NO LICENSE | 2024-02-29 | 965 | legacy (>365 d) | 0 |  | offline wallet on pc |
| `hacash/cmdwallet` | Go | MIT | 2024-02-29 | 965 | legacy (>365 d) | 0 |  | Open Source Shell / Command Line Wallet |
| `hacash/channelpay` | Go | MIT | 2024-02-29 | 965 | legacy (>365 d) | 1 |  | Implementation of channel chain settlement network protocol. |
| `hacash/rustHacash` | C | MIT | 2024-02-29 | 965 | legacy (>365 d) | 1 |  | Hacash full node by Rust |
| `hacash/chain` | Go | MIT | 2024-01-06 | 1019 | legacy (>365 d) | 1 |  |  |
| `hacash/HVM` | Go | MIT | 2023-11-29 | 1057 | legacy (>365 d) | 0 |  | Hacash Contract Virtual Machine |
| `hacash/blockmint` | Go | NO LICENSE | 2022-05-15 | 1620 | legacy (>365 d) | 0 |  | Deprecated!!!  move to https://github.com/hacash/miner |
| `hacash/PaymentChannelChainNetServiceNodeRoutes` | n/a | MIT | 2021-08-07 | 1901 | legacy (>365 d) | 0 |  | Hacash payment channel service node register and routes |
| `hacash/bitcoin` | Go | NO LICENSE | 2020-05-08 | 2357 | legacy (>365 d) | 0 | fork | Golang (go) library for manipulating bitcoin (BTC) addresses |
| `hacash/web_base_framework` | JavaScript | NO LICENSE | 2019-04-12 | 2749 | legacy (>365 d) | 0 |  | web base framework |

### Other accounts tied to the ecosystem (outside the `hacash` organization)

- `hacashcom` is a **user account** (type `User`, created on 2023-07-14). It has 8 repositories: 5 MIT and 3 without a license. It is also a public member of the `hacash` organization.
- `HacashCommunity` is an organization created on 2026-02-27. It has 3 repositories (`HACPool`, `HacashWallet`, `IVScore`), all without a license. It is tied to the `hacash.community` site.

### Official WASM SDK (for signing, adopt this one)

- `fullnode` ships an official WASM SDK. Code: `fullnode/sdk/` (README, 282 lines). Documentation: `https://github.com/hacash/doc/blob/main/server/sdk_doc.md`.
- Ready package: `hacash_wasm_sdk.zip` in release 1.2.5 (1,131,122 bytes, sha256 `ce404f9fe3f42679cac5f579679c82d6ca5ae80e93448095bbc89e28845f6cb0`). It is not on npm (search for "hacash" on 2026-10-21: 0 packages).
- **What it does:** 25 operations through a single JSON entry point, `sdk_invoke_json(operation_id, payload)`. Among them: build a transaction (`tx.build`), inspect and review (`tx.inspect`), prepare the signing request (`tx.prepare_signature`), attach and verify a signature (`tx.attach_signature`, `tx.verify`), decode and re-encode (`tx.decode`, `tx.encode`), estimate the fee (`tx.estimate_fee`), validate an address, convert amounts (`amount.parse`, `amount.format`), look up a diamond by name or serial (`diamond.lookup`) and read contract code (`vm.code`). All offline: "no VM execution, no node" (SDK README).
- **What it does not do:** it does not generate, receive or store private keys. "Private keys never cross the SDK boundary": the SDK hands out a `SigningRequest` (the digest to sign) and takes back a `SignatureProof`; the wallet does the signing. None of the 25 operations broadcasts to the network; broadcasting is still the node's `/submit/transaction` (risk R3, section 4).
- **Rule of this base:** for anything that signs, prefer the official SDK over writing one of our own (reason: its keys never cross the SDK boundary and it is maintained by the Hacash team).
- ⚪ The SDK was not executed in this round. Where to look: unzip it in a new folder and call operation 1 (`system.sdk_version`).

---

## 4. Node APIs (55 paths, measured)

> Measured on 2026-10-21: reading every `ApiRoute::` call in the code and calling a local 1.2.5 node at `127.0.0.1:8082`.
> Machine-readable file, with parameters and example responses: [`api/rotas.json`](api/rotas.json). Field names in that file are in Portuguese; see the key at the end of section 4.

### Count

- **55 paths** in the code = 54 `ApiRoute::` registrations + `/_server_` (built into `server/src/http.rs:163`).
- With `debug_routes = false` (default), **52** are mounted. The 3 `/debug/...` routes answer 404 (confirmed).
- **45 live calls**: 42 with HTTP 200 and 3 with 404 from the debug routes.
- Of the 42 with HTTP 200: at 09:35, 34 with data and 8 with an expected error in the body; at 10:39, 33 and 9.
- The difference is `/query/contract/sandboxcall` without parameters: it returned `ret 0` at 09:35 and a format error at 10:39. ⚪ Cause not investigated; where to look: `vm/src/api.rs:316`.
- **10 not called, by policy**: they create or receive a private key, sign, change state or broadcast. Marked "DO NOT RUN".
- **35 of the 55 paths appear in the official `fullnode_api_doc_v2.md` documentation** (`hacash/doc` repository, last commit 2026-04-20). Column "in official docs?" of the table: **35 yes / 20 no**.
- For the 35 documented ones, the official doc describes parameters and usage examples better than this table: read v2. What only this table has: the 20 missing ones, the handler, the risk class and the measured response.
- **20 do not appear**: `/status`, `/vm/status`, `/block_by_height`, `/query/block/height/latest`, `/pool_summary`, `/miner/pending_replay`, `/query/asset`, `/query/block/pools`, `/query/contract/storage_fee`, the 4 `/query/diamond/inscription_protocol_cost/{append,drop,edit,move}`, the 3 simulation routes (`/query/transaction/simulate`, `/query/vm/estimate_gas`, `/query/vm/simulate`), `/_server_` and the 3 debug routes.

### Points of attention

- `/query/miner/notice` **exists** (`app/src/fullnode/miner_notice.rs:21`). It is an async long-wait route and answers 200.
- Routes that take a **private key in the query string**: `/create/coin/transfer` (`main_prikey`), `/util/transaction/sign` (`prikey`), `/operate/fee/raise` (`fee_prikey`) (`mint/src/api/transaction.rs:369,453`, `mint/src/api/transfer.rs:235`).
- `/create/account` returns a key pair in the body (`api/src/account.rs`).
- The HTTP server has no authentication layer. The protection is listening on `127.0.0.1` only (default).
- Exception: the optional `auth` parameter of `/operate/contract/logs/delete` (`vm/src/api.rs:122-128`).
- `/query/miner/pending` and `/query/diamondminer/init` answer `{"ret":1,"err":"... not enabled"}` when mining is off.
- `/query/block/datas` returns **bytes**, not JSON. With `hexbody=true` it returns hex text (`mint/src/api/query/block.rs:29`).
- Port: both documentation versions (`fullnode_api_doc.md`, v1, linked from `hacash.org/development`, and `fullnode_api_doc_v2.md`, lines 19, 23 and 25) use `8081`.
- The code default (`base/src/api/config.rs:18`) and `config.md` use `8082` (checked on 2026-10-21).
- The API returns HTTP 200 even on error. The error comes in the body: `{"ret":1,"err":"..."}`.

### Risks

R0 read · R1 read with long wait · R2 involves a private key · R3 changes state or broadcasts · R4 mining · R5 debugging.

### Table

"registration" is where the route is mounted. "handler" is the function that answers. Responses are from 2026-10-21, 10:39. IP addresses of P2P peers were omitted.

| method | route | registration | handler | in official docs? | risk | call | response (summary) |
|---|---|---|---|---|---|---|---|
| GET | `/` | `mint/src/api/mod.rs:55` | `mint/src/api/console.rs:12` | yes | R0 | run | 200 · 458 B · `<html><head><title>Hacash node console</title></head><body> <h3>Hacash…` |
| GET | `/_server_` | `server/src/http.rs:163` | `server/src/http.rs:163` | no | R0 | run | 200 · 17 B · `Hacash Api Server` |
| GET | `/block_by_height` | `api/src/chain.rs:38` | `api/src/chain.rs:7` | no | R0 | run | 200 · 44 B · `{"height":1000,"hash":"0017696a","size":131}` |
| GET | `/create/account` | `api/src/account.rs:39` | `api/src/account.rs:7` | yes | R2 | **DO NOT RUN** | - |
| GET | `/create/coin/transfer` | `mint/src/api/mod.rs:124` | `mint/src/api/transfer.rs:233` | yes | R2 | **DO NOT RUN** | - |
| POST | `/create/transaction` | `mint/src/api/mod.rs:116` | `mint/src/api/transaction.rs:99` | yes | R2 | **DO NOT RUN** | - |
| GET | `/debug/contract/storage` | `vm/src/api.rs:593` | `vm/src/api.rs:442` | no | R5 | run | 404 (debug_routes = false) |
| GET | `/debug/p2sh/scriptmh` | `vm/src/api.rs:594` | `vm/src/api.rs:526` | no | R5 | run | 404 (debug_routes = false) |
| GET | `/debug/pool_print` | `api/src/pool.rs:32` | `api/src/pool.rs:20` | no | R5 | run | 404 (debug_routes = false) |
| GET | `/miner/pending_replay` | `mint/src/api/mod.rs:58` | `mint/src/api/mod.rs:58` | no | R4 | run | 200 · 20 B · `{"pending_replay":0}` |
| GET | `/operate/contract/logs/delete` | `vm/src/api.rs:590` | `vm/src/api.rs:122` | yes | R3 | **DO NOT RUN** | - |
| POST | `/operate/fee/raise` | `mint/src/api/mod.rs:119` | `mint/src/api/transaction.rs:451` | yes | R3 | **DO NOT RUN** | - |
| GET | `/pool_summary` | `api/src/pool.rs:31` | `api/src/pool.rs:9` | no | R0 | run | 200 · 23 B · `{"group0":1,"group1":0}` |
| GET | `/query/asset` | `mint/src/api/mod.rs:81` | `mint/src/api/query/asset.rs:31` | no | R0 | run | 200 · 123 B · `{"ret":0,"asset":{"serial":"2000","decimal":8,"name":"hacds","ticket":…` |
| GET | `/query/balance` | `mint/src/api/mod.rs:80` | `mint/src/api/query/balance.rs:129` | yes | R0 | run | 200 · 69 B · `{"ret":0,"list":[{"hacash":"1784.46320557","diamond":1,"satoshi":0}]}` |
| GET | `/query/block/datas` | `mint/src/api/mod.rs:111` | `mint/src/api/query/block.rs:23` | yes | R0 | run | 200 · 1128 B · `(hex) 0100000c187c006ad87db800000000007526778f036ac4d02ea2c2ea4f9ee82b…` |
| GET | `/query/block/height/latest` | `api/src/chain.rs:41` | `api/src/chain.rs:24` | no | R0 | run | 200 · 25 B · `{"ret":0,"height":792745}` |
| GET | `/query/block/intro` | `mint/src/api/mod.rs:110` | `mint/src/api/query/block.rs:9` | yes | R0 | run | 200 · 434 B · `{"ret":0,"hash":"000000000055722910338ec8ac6b5933adc8c1fba7b8094f32638…` |
| GET | `/query/block/pools` | `mint/src/api/mod.rs:113` | `mint/src/api/query/block.rs:110` | no | R0 | run | 200 · 1501 B · `{"ret":0,"latest_height":792745,"periods":[{"key":"1d","blocks":288,"t…` |
| GET | `/query/block/recents` | `mint/src/api/mod.rs:114` | `mint/src/api/query/block.rs:189` | yes | R0 | run | 200 · 2385 B · `{"ret":0,"list":[{"height":792745,"hash":"00000000006a220d108ac3a3beab…` |
| GET | `/query/block/views` | `mint/src/api/mod.rs:112` | `mint/src/api/query/block.rs:75` | yes | R0 | run | 200 · 409 B · `{"ret":0,"latest_height":792745,"list":[{"height":1,"hash":"001e231cb0…` |
| GET | `/query/channel` | `mint/src/api/mod.rs:106` | `mint/src/api/query/channel.rs:9` | yes | R0 | run | 200 · 43 B · `{"ret":1,"err":"channel id format invalid"}` |
| GET | `/query/coin/transfer` | `mint/src/api/mod.rs:125` | `mint/src/api/transfer.rs:173` | yes | R0 | run | 200 · 400 B · `{"ret":0,"tx_hash":"d951dff1daac2b4549c4d97365806ea6847324c987dd68ec22…` |
| GET | `/query/contract/logs` | `vm/src/api.rs:589` | `vm/src/api.rs:62` | yes | R0 | run | 200 · 20 B · `{"ret":0,"end":true}` |
| GET | `/query/contract/sandboxcall` | `vm/src/api.rs:583` | `vm/src/api.rs:316` | yes | R0 | run | 200 · 49 B · `{"ret":1,"err":"contract address format invalid"}` |
| GET | `/query/contract/storage_fee` | `api/src/contract_storage.rs:99` | `api/src/contract_storage.rs:14` | no | R0 | run | 200 · 541 B · `{"ret":0,"enabled":true,"rule_version":1,"activation_height":0,"head_h…` |
| GET | `/query/diamond` | `mint/src/api/mod.rs:82` | `mint/src/api/query/diamond.rs:12` | yes | R0 | run | 200 · 506 B · `{"ret":0,"name":"ZAKXMI","belong":"1EZEiGKCPiJR6itGqVjXvRn95QLBdpxBKX"…` |
| GET | `/query/diamond/bidding` | `mint/src/api/mod.rs:83` | `mint/src/api/query/diamond.rs:279` | yes | R0 | run | 200 · 35 B · `{"ret":0,"number":138627,"list":[]}` |
| GET | `/query/diamond/engrave` | `mint/src/api/mod.rs:85` | `mint/src/api/query/diamond.rs:355` | yes | R0 | run | 200 · 135 B · `{"ret":0,"list":[{"action":"inscription","diamonds":"BMABAT","inscript…` |
| GET | `/query/diamond/inscription_protocol_cost` | `mint/src/api/mod.rs:86` | `mint/src/api/query/diamond.rs:244` | yes | R0 | run | 200 · 40 B · `{"ret":0,"action":"append","cost":"0:0"}` |
| GET | `/query/diamond/inscription_protocol_cost/append` | `mint/src/api/mod.rs:90` | `mint/src/api/query/diamond.rs:251` | no | R0 | run | 200 · 40 B · `{"ret":0,"action":"append","cost":"0:0"}` |
| GET | `/query/diamond/inscription_protocol_cost/drop` | `mint/src/api/mod.rs:102` | `mint/src/api/query/diamond.rs:272` | no | R0 | run | 200 · 40 B · `{"ret":0,"action":"drop","cost":"2:247"}` |
| GET | `/query/diamond/inscription_protocol_cost/edit` | `mint/src/api/mod.rs:98` | `mint/src/api/query/diamond.rs:265` | no | R0 | run | 200 · 40 B · `{"ret":0,"action":"edit","cost":"1:247"}` |
| GET | `/query/diamond/inscription_protocol_cost/move` | `mint/src/api/mod.rs:94` | `mint/src/api/query/diamond.rs:258` | no | R0 | run | 200 · 44 B · `{"ret":1,"err":"query 'to' cannot be empty"}` |
| GET | `/query/diamond/views` | `mint/src/api/mod.rs:84` | `mint/src/api/query/diamond.rs:73` | yes | R0 | run | 200 · 293 B · `{"ret":0,"latest_number":138626,"list":[{"name":"NHMYYM","number":1,"b…` |
| GET | `/query/diamondminer/init` | `mint/src/api/mod.rs:70` | `mint/src/api/miner.rs:93` | yes | R4 | run | 200 · 43 B · `{"ret":1,"err":"diamond miner not enabled"}` |
| GET | `/query/fee/average` | `mint/src/api/mod.rs:107` | `mint/src/api/query/channel.rs:49` | yes | R0 | run | 200 · 72 B · `{"ret":0,"purity":"6024000000","purity_unit":232,"feasible":"72288:239…` |
| GET | `/query/hashrate` | `mint/src/api/mod.rs:108` | `mint/src/api/query/hashrate.rs:7` | yes | R0 | run | 200 · 237 B · `{"ret":0,"target":{"rate":5565781627.738558,"show":"5.57GH/s","unit":"…` |
| GET | `/query/hashrate/logs` | `mint/src/api/mod.rs:109` | `mint/src/api/query/hashrate.rs:26` | yes | R0 | run | 200 · 4471 B · `{"ret":0,"day200":[19489014627,74116421937,18846375819,64783245373,215…` |
| GET | `/query/latest` | `mint/src/api/mod.rs:78` | `mint/src/api/query/supply.rs:40` | yes | R0 | run | 200 · 42 B · `{"ret":0,"height":792745,"diamond":138626}` |
| GET | `/query/miner/notice` | `app/src/fullnode/miner_notice.rs:21` | `app/src/fullnode/miner_notice.rs:28` | yes | R1 | run | 200 · 25 B · `{"ret":0,"height":792745}` |
| GET | `/query/miner/pending` | `mint/src/api/mod.rs:64` | `mint/src/api/miner.rs:10` | yes | R4 | run | 200 · 35 B · `{"ret":1,"err":"miner not enabled"}` |
| GET | `/query/supply` | `mint/src/api/mod.rs:79` | `mint/src/api/query/supply.rs:7` | yes | R0 | run | 200 · 1131 B · `{"ret":0,"latest_height":792745,"current_circulation":1909434.29047568…` |
| GET | `/query/transaction` | `mint/src/api/mod.rs:115` | `mint/src/api/query/tx.rs:50` | yes | R0 | run | 200 · 448 B · `{"ret":0,"hash":"b563b525d5a840f14c2f1d7da52a1eb3f7ee7357e784af8b68d0b…` |
| POST | `/query/transaction/simulate` | `vm/src/api.rs:586` | `vm/src/api.rs:188` | no | R0 | run | 200 · 117 B · `{"ret":1,"success":false,"err":"simulation transaction body is empty",…` |
| POST | `/query/vm/estimate_gas` | `vm/src/api.rs:587` | `vm/src/api.rs:188` | no | R0 | run | 200 · 117 B · `{"ret":1,"success":false,"err":"simulation transaction body is empty",…` |
| POST | `/query/vm/simulate` | `vm/src/api.rs:588` | `vm/src/api.rs:188` | no | R0 | run | 200 · 117 B · `{"ret":1,"success":false,"err":"simulation transaction body is empty",…` |
| GET | `/status` | `api/src/status.rs:80` | `api/src/status.rs:9` | no | R0 | run | 200 · 247 B · `{"height":792745,"chain_id":0,"block_target_seconds":300,"uptime":4600…` |
| POST | `/submit/block` | `mint/src/api/mod.rs:118` | `mint/src/api/query/tx.rs:167` | yes | R3 | **DO NOT RUN** | - |
| POST | `/submit/diamondminer/success` | `mint/src/api/mod.rs:73` | `mint/src/api/miner.rs:113` | yes | R4 | **DO NOT RUN** | - |
| GET | `/submit/miner/success` | `mint/src/api/mod.rs:67` | `mint/src/api/miner.rs:57` | yes | R4 | **DO NOT RUN** | - |
| POST | `/submit/transaction` | `mint/src/api/mod.rs:117` | `mint/src/api/query/tx.rs:129` | yes | R3 | **DO NOT RUN** | - |
| POST | `/util/transaction/check` | `mint/src/api/mod.rs:120` | `mint/src/api/transaction.rs:312` | yes | R0 | run | 200 · 42 B · `{"ret":1,"err":"transaction body invalid"}` |
| POST | `/util/transaction/sign` | `mint/src/api/mod.rs:121` | `mint/src/api/transaction.rs:367` | yes | R2 | **DO NOT RUN** | - |
| GET | `/vm/status` | `vm/src/api.rs:582` | `vm/src/api.rs:55` | no | R0 | run | 200 · 40 B · `{"ret":0,"vm":"enabled","height":792745}` |

### How to call

```
curl -s http://127.0.0.1:8082/query/latest
curl -s "http://127.0.0.1:8082/query/diamond?name=ZAKXMI"
```

The parameters of each route are in `api/rotas.json`, field `parametros_query`.
They come from static reading of the code. ⚪ A parameter read through another path may be missing; where to look: the handler's `file:line`.

### Key for `api/rotas.json`

| field | meaning |
|---|---|
| `metodo` | HTTP method |
| `caminho` | path |
| `registro` | where the route is mounted (`file:line`) |
| `handler`, `handler_nome` | function that answers (`file:line`, name) |
| `parametros_query` | query-string parameters read by the handler |
| `corpo` | what the POST body carries, if any |
| `na_doc_v2` | appears in `fullnode_api_doc_v2.md` |
| `risco` | risk class (R0 to R5) |
| `executar` | `false` = do not run (key, signature, state change or broadcast) |
| `motivo` | why it must not run |
| `exemplo` | real call: `chamada`, `http`, `bytes`, `ms`, `sha256`, `resposta`, `medido_em` |
| `nota` | remark about the route |

---

## 5. Governance and channels

> Pages opened on 2026-10-21.

### How the community describes its governance

Source: `https://hacashdao.org/community` (HTTP 200 on 2026-10-21).

- "Hacash has no founders and no team". Development is driven by the community.
- Whoever proposes an improvement gets a **HIP** number if the proposal is formally discussed.
- "Market and exchange topics are discussed on HacashTalk and Telegram; technical topics mostly on Discord."
- There is no incentive token, no premine and no dedicated team.
- Funding comes from community fundraising, started on HacashTalk.

### Development flow

Source: `https://hacash.org/development` (HTTP 200).

- Core changes follow the HIP process.
- HIP-12 (HacashTalk forum, 2023-02) defines application groups, a preparatory core review and a decision-and-merge group.
- Discussion starts on Discord and is then formalized on GitHub.

### Channels

| channel | URL | checked on 2026-10-21 | maintainer / owner |
|---|---|---|---|
| Development guide | `https://hacash.org/development` | 200 | ⚪ where to look: `hacash/www` repository (public org members: section 3) |
| HacashDAO, community directory | `https://hacashdao.org/community` | 200 | the page lists each channel's owners by nickname; identity not verified |
| Discord | `https://discord.com/invite/evtt4bDfKu` and `https://discord.gg/6wH9KJeDFC` | ⚪ not opened (requires an account) | see the HacashDAO row |
| Telegram | `https://t.me/hacash` · `https://t.me/hacashhacd` · `https://t.me/HacashCom` | ⚪ not opened | see the HacashDAO row |
| HacashTalk forum | `https://hacashtalk.com/` | **no response** from the test machine (curl: code 000) | ⚪ where to look: open it in a browser; HIP-12 and several HIPs are discussed there |
| hacash.community portal | `https://hacash.community/` | 200 | ⚪ no maintainer named on the page; where to look: `github.com/HacashCommunity` (3 repositories, org created on 2026-02-27) and X `@HacashComm`; subdomains `wallet.`, `webwallet.`, `explorer.`, `pool.hacash.community` |
| Official explorer | `https://explorer.hacash.org/` | 200 | `hacash/explorer` repository (active, no license) |
| Official GitHub | `https://github.com/hacash` | 200 | main maintainer with 96.5% of `fullnode` commits; other public members in section 3 |
| X (Twitter) | `@HacashDAO`, `@HacashCom`, `@HacashOrg` and 10 other accounts listed on `hacashdao.org/community` | ⚪ not opened | where to look: the list on `hacashdao.org/community` |

### Remarks

1. There is more than one documentation source: `hacash.org`, `hacashdao.org`, `hacash.community`, the `hacash/doc` repository and `hacash/doc-chinese`.
2. The HIP table in the `hacash/doc` repository is out of date (see section 6).
3. This round did **not** find a maintainer in charge of bringing the groups together. HacashDAO says it wants to do it ("bring these scattered entities together"). Before proposing anything, talk to it.

---

## 6. HIPs (improvement proposals)

> Official table, with names, documents and discussion: `https://github.com/hacash/doc/blob/main/HIP/HIP-table.md` (last commit 2026-06-24; read on 2026-10-21). This base does not copy the table; below is only what we measured on top of it.

- The official table lists 22 HIPs (1 to 23; 19 is missing). Official legend: implemented · approved · under discussion. Count: 7 implemented, 1 approved, 14 under discussion.

| HIP | the official table says | what we measured | date and source |
|---|---|---|---|
| 23 (Istanbul) | under discussion | **active** since height 765,432 (around 2026-07-19, estimated from the height); the code treats it as active | `hacash-params/src/lib.rs:164`; height 792,727 on 2026-10-21 |
| 25 (HACD staking) | not in the table | exists only as third-party PRs: `hacash/fullnodedev#7` (draft, 20 files, actions 37/38) and `hacash/rust#13` (120 files, +8,647 lines, actions 34/35); search for "staking" in `fullnode` `*.rs`: 0 files; mainnet activation not defined | `gh api` and code search, 2026-10-21 |
| 19 | not in the table | mentioned in `fullnode#6` ("what happened to HIP19?") | ⚪ where to look: HacashTalk and Discord (development channel) |
| 24 | not in the table | ⚪ not searched | where to look: HacashTalk and Discord |
| the whole table | — | `hacashdao.org` links to another copy, in `hacash/paper` (last commit 2024-05-24, only HIPs 1 to 16) | section 9, error 6 |

- Issue `hacash/doc#1` is the register for requesting a new HIP number (3 comments, last activity on 2026-05-27).
- HIP-23 has its own document set in `hacash/doc/HIP/protocol/hip-23/`: specification, threat model, invariants, traceability matrix, audit findings and a wallet checklist. Do not redo it.

---

## 7. Open issues and PRs and how they are organized

> Measured on 2026-10-21 with `gh api search/issues?q=org:hacash+is:open`: **55 issues and 5 PRs** open across 16 repositories.

### Organization for newcomers

- 0 of 55 issues have a label. 0 of 55 have an assignee.
- None of the 4 checked repositories has `CONTRIBUTING.md`, issue templates, `SECURITY.md`, CODE_OF_CONDUCT or a `.github` folder with a CI workflow.
- The 4 checked: `fullnode` (by clone), `fullnodedev`, `explorer` and `doc` (by API).
- ⚪ The other 29 repositories were not checked. Where to look: section 10, last line.

### Maintainer response

- 23 of the 55 issues have at least one comment from an organization member.
- 24 are answered or show no symptom today and **could be closed** by the maintainer.

### Triage

Criteria in the table below. **LEG** is a 5th class added here, because 18 issues come from old Go repositories.

| class | meaning | count |
|---|---|---:|
| BPT | good first task: small scope, verifiable, no consensus decision | 4 |
| MANT | needs a maintainer: consensus, governance, security, site | 12 |
| DUP | duplicate or already covered by something that exists | 5 |
| SR | no reproduction or not an actionable task (usage question, empty body) | 16 |
| LEG | Go legacy / 2020-2024, candidate for closing | 18 |
| **total** | | **55** |

In the central `fullnode` repository (17 issues): 1 BPT, 8 MANT, 3 DUP, 5 SR.

Related groups:
- difficulty: `#44`, `#46`, `#48`;
- HACD auction: `#21`, `#40`, `#58`, `#61` and PR `#60`;
- network/explorer freeze: `#33`, `explorer#2`, `explorer#4`, `#57`;
- GPU miner: `fullnode#55` and `fullnodedev#9`;
- 6 facets of the same 2021 *data race* report: `chain#2`, `core#2`, `core#3`, `miner#13`, `miner#14`, `service#2`.

### Open PRs

| PR | title | measured state |
|---|---|---|
| `fullnode#59` | Fix zero-window boot replay root advancement | +23/−1 in `chain/src/tree.rs`; 0 comments; the PR's regression test passes (see section 8) |
| `fullnode#60` | [Example] Prevent strategic invalid HACD bids | +145/−3, 5 files, 1 new test; local mempool policy only, does not change consensus |
| `fullnodedev#7` | HIP-25 HACD staking port (draft) | +684/−11, 20 files; no `/query/staking/*` RPC, no ported tests; conflict (`dirty`); repository will be archived |
| `rust#13` | HIP-25 reference: HACD staking | +8,647/−356, 120 files, 35 commits, 5 comments; self-audit "PASS" in the text, no independent review |
| `rust#8` | Support CORS policy for requests | +3/−0, 3 comments; `rust` repository without a push since 2024-10-25 |

### The 55 issues

Author omitted. `resp.` = there is a comment from an organization member. `closable` = judgment of this base; only the maintainer closes.

| issue | class | resp. | closable | note |
|---|---|---|---|---|
| `chain#2` | LEG | N | N | facet 1/6 of the same data race log (Go, 2021); repo without a push since 2024-01 |
| `channelpay#4` | SR | N | N | usage question with screenshots; no steps |
| `core#2` | LEG | N | N | facet 2/6 data races (Go 2021) |
| `core#3` | LEG | N | N | facet 3/6 data races (Go 2021) |
| `core#7` | LEG | Y | Y | Go 1.16 build (2024); maintainer answered on 2024-04-01 |
| `core#8` | MANT | Y | N | economics questions (BTC bridge, price imbalance); needs a protocol decision |
| `core#9` | SR | N | N | body is a single period; no content |
| `dao#1` | SR | Y | Y | person wants to join the team; not a task; shows the missing entry door (no CONTRIBUTING) |
| `doc#1` | MANT | Y | N | HIP numbering register; should be pinned; HIP-table.md is out of date (active HIP-23 shows as "under discussion") |
| `doc#2` | DUP | N | Y | asks for an average-fee API; GET /query/fee/average already exists (fullnode/mint/src/api/mod.rs:107; doc v2 §3.9) |
| `explorer#2` | SR | N | N | "explorer stopped"; hosted-service failure, no diagnosis; cluster with explorer#4 and fullnode#33 |
| `explorer#3` | BPT | N | N | HACD count on screen (3) differs from the tx hash (6); reproducible via /query/transaction + HTML |
| `explorer#4` | DUP | N | N | repeats explorer#2 (freeze) |
| `explorer#6` | BPT | Y | Y | value is historical by design (maintainer answer); UI label missing |
| `explorer#7` | BPT | Y | Y | average formula: count HACD minus 30,000 (maintainer answer); document it in the UI |
| `explorer1#3` | LEG | Y | Y | 2020, old explorer |
| `explorer1#10` | LEG | Y | Y | 2020, old rpcapi; the example showed sensitive data in a URL |
| `fullnode#6` | MANT | Y | Y | 2025-02: validation divergence and fork; maintainer: fixed in 0.2.5; keep as history |
| `fullnode#11` | BPT | N | N | question: is diamhash the txhash? answer by reading x16rs::mine_diamond and document lifegene |
| `fullnode#12` | SR | N | N | invalid hash at block 635119, no version/log |
| `fullnode#15` | SR | N | N | OpenCL panic on a 2024-02 binary; no reproduction |
| `fullnode#21` | MANT | Y | Y | miners repeat a diamond; maintainer: fixed in 0.2.14 |
| `fullnode#28` | MANT | N | N | asks for an address blocklist HIP; governance decision; this base takes no position |
| `fullnode#33` | DUP | Y | Y | network/explorer frozen; maintainer: upgrade to 1.0.0; same cluster as explorer#2 |
| `fullnode#40` | MANT | N | N | auction rule (8 HAC beats 30 HAC); needs a maintainer explanation |
| `fullnode#41` | SR | N | Y | does not reproduce today: hacash.org/whitepaper.pdf answers 200 application/pdf 1,763,282 B (2026-10-21) |
| `fullnode#44` | MANT | Y | Y | difficulty; maintainer: fixed in 1.0.0; the algorithm today is ASERT (mint/src/consensus/difficulty.rs:9) |
| `fullnode#46` | MANT | Y | Y | asks for LWMA; maintainer: LWMA in 1.0.1; today ASERT since height 738,654 |
| `fullnode#47` | SR | N | N | mined HACD does not show; no version/log/address |
| `fullnode#48` | DUP | N | Y | repeats fullnode#46 (where is LWMA?); the community answered with a fullnodedev commit |
| `fullnode#55` | DUP | N | N | repeats fullnodedev#9 (community GPU miner) |
| `fullnode#57` | SR | Y | Y | sync stalled; maintainer: delete blocks and upgrade to 1.2.1; the full sync on 1.2.5 done for this base did not reproduce it (see section 2.3.4) |
| `fullnode#58` | MANT | Y | Y | proposal for a cap/adjustment in the auction; maintainer declined with 2 reasons |
| `fullnode#61` | MANT | N | N | strategic invalid bid; has example PR #60; touches mempool/consensus |
| `fullnodedev#9` | MANT | Y | N | request for official integration of the GPU miner; maintainer: fullnodedev will be archived |
| `miner#12` | LEG | N | N | 2021, duplicate diamond (Go) |
| `miner#13` | LEG | N | N | facet 4/6 data races |
| `miner#14` | LEG | N | N | facet 5/6 data races |
| `miner#19` | LEG | N | N | 2021, missing blocks in the pool miner |
| `miner#24` | LEG | Y | Y | does not compile (Go, 2023) |
| `miner#25` | SR | Y | Y | question about the autobid flag |
| `miner#27` | LEG | Y | Y | miner_worker does not start, 2022 |
| `miner#28` | LEG | N | N | missing -lOpenCL at link time (Go, 2024) |
| `node#2` | SR | Y | Y | question about the pool front end |
| `node#12` | LEG | Y | Y | Go node does not sync (2025-01) |
| `paper#5` | SR | N | N | promotion of a HIP-17 chess app; not a task |
| `rust#4` | LEG | N | N | Windows 7 without ProcessPrng (the new Rust toolchain does not support Win7) |
| `rust#10` | SR | N | N | insufficient balance error on auto-bid; looks like incorrect use |
| `rust#12` | SR | N | N | congestion report, no metric |
| `rustHacash#1` | SR | N | N | title "upgrade x16rs.c to rs", empty body |
| `service#1` | LEG | Y | Y | 2020, request for clarification of the Go API |
| `service#2` | LEG | N | N | facet 6/6 data races |
| `service#5` | LEG | Y | Y | 2023, use of quoteFee |
| `www#6` | SR | N | Y | does not reproduce today: certificate valid until 2026-11-20 (Let's Encrypt) |
| `www#8` | MANT | N | N | opened by the author of this base on 09-06: a merged menu entry is not live; the URL redirects |

---

## 8. Where to contribute

> Assessed on 2026-10-21. Nothing was commented or opened on the Hacash GitHub.
> The first three fronts already have evidence ready. The others are recorded with the reason.

### A. Independent review of `fullnode#59` (node recovery)

Evidence measured on 2026-10-21:
1. The PR test (`cargo test -p chain --lib zero_window_linear_replay_advances_and_preserves_roll_order`) **passes** on the PR branch (1 passed).
2. The same test **fails without the fix**, on top of the current `main` (`ce25368a`), with the exact PR message: `scheduled root must advance above 0, got 0`.
3. With the fix applied on the current `main`, **49 of 49 tests** of the `chain` library pass. The file `chain/src/tree.rs` did not change between the PR base (`76aa835`) and `main`.
4. The case setup is valid: `unstable_block = 0` is only rejected when `fast_sync = true` (`app/src/fullnode/config.rs:269`). The default is 4.
5. Not reproduced: the `SIGKILL` crash test described in the PR (the script is not in the PR). The PR does not mention `#57`.

Why: minimal cost, low risk, objective evidence and no opinion on protocol.

### B. Review and adversarial scenario for `fullnode#61` + PR `#60` (invalid HACD bids)

The PR is local mempool policy, not consensus. Another node or a miner can ignore it.

Code reading:
- `TxPool::take` copies (`node/src/txpool.rs:158-162`). So the revalidation in the PR's `node/src/submit.rs` does not lose transactions.
- There is one new test (`reserved_bid_uses_highest_usable_fee_for_address`). It covers only the `reserved_bid` helper.
- **There is no test** for the exemption of the mint transaction itself, for the revalidation of older transactions from the same address, or for the 6-step scenario in issue `#61`.

Proposed contribution:
- Write that scenario as an engine integration test. The table in the issue is already the script.
- Write a threat note comparing local mempool × consensus rule, without choosing the solution.
- This also helps issues `#21`, `#40` and `#58` (all about the auction).

Unproven hypothesis: that the `#61` attack works on mainnet (a testnet run is missing).

### C. API route catalog for the documentation (`hacash/doc`)

- 20 of the 55 paths in the code do not appear in the v2 documentation (section 4).
- There are two documentation versions: v1 linked from the site, v2 newer.
- The documented port (8081) differs from the code default (8082).
- The `fullnode` README says to copy a folder that `.gitignore` excludes (`docs.loc/`). The release zip ships the file ready (section 2.1).

Deliverable: the catalog in [`api/rotas.json`](api/rotas.json), with `file:line` source, risk and example response, as an update proposal.
It is the safe base for any future MCP or SDK: it separates what reads, what touches keys and what broadcasts.

### Assessed and not recommended now

- **HIP-25 (`fullnodedev#7`, `rust#13`).** `fullnodedev` "will be archived", per the maintainer (2026-07-26). Staking does not exist in `fullnode`. `rust#13` has 120 files and the audit is the author's own. Reviewing now would be work on code whose target repository is being retired. Trigger to reopen: HIP-25 being proposed against `fullnode`.
- **CORS (`rust#8`).** The PR is in the `rust` repository (no push since 2024-10-25). The current `fullnode` has no CORS handling (code search: 0 hits). Risk hypothesis, not tested: the server has no authentication and some routes take a private key in the URL. Opening CORS widely on the node would let any page open in the browser read those responses. Safer path: an allow-list of origins on the node itself or a proxy in front. The decision belongs to the maintainer.
- **Address blocklist governance (`fullnode#28`).** It is a political decision about freezing third-party funds. This base takes no position.
- **Token, buyback, own wallet, new explorer.** Out of scope. The official explorer answers 200.

### First tasks for newcomers

Estimated size: S = up to 2 h · M = up to 1 day · L = more than 1 day. It is an estimate, not a measurement.
Before commenting or opening a PR, read HIP-12 (section 5) and check that the issue is still open.

| task | what to do | why | size |
|---|---|---|---|
| `explorer#3` (BPT) | reproduce the gap between the HACD count on screen (3) and in the transaction hash (6) with `/query/transaction` | visible bug, verifiable with one RPC call, does not touch consensus | S |
| `explorer#6` (BPT) | propose a UI label saying the value is historical | the maintainer already answered; only text is missing | S |
| `explorer#7` (BPT) | document in the UI the average formula (HACD minus 30,000) | the maintainer already gave the formula | S |
| `fullnode#11` (BPT) | answer whether diamhash is the txhash, by reading `x16rs::mine_diamond`, and document lifegene | unanswered question; the deliverable is text with a code citation | M |
| `doc#2` (DUP) | comment that `GET /query/fee/average` already exists, with the example from `api/rotas.json` | closes a question with a route that already exists | S |
| `fullnode#41`, `www#6` (SR) | comment the 2026-10-21 measurement: the PDF answers 200; the certificate is valid until 2026-11-20 | helps the maintainer close what does not reproduce | S each |
| PR `fullnode#59` | review it with the evidence in 8.A (the test fails without the fix and passes with it) | evidence ready, low risk, no protocol opinion | S to M |
| PR `fullnode#60` / `fullnode#61` | write the issue's 6-step scenario as an integration test (8.B) | the main case has no test; also helps `#21`, `#40`, `#58` | L |
| route catalog | propose updating the v2 documentation with `api/rotas.json` (8.C) | 20 of the 55 paths are undocumented; port 8081 × 8082 | M |

---

## 9. Divergences between sources (corrected in this round)

> Checked on 2026-10-21.

| claim (origin) | what was measured | source |
|---|---|---|
| "53 HTTP routes" (earlier informal count) | **55 paths**: 54 `ApiRoute::` registrations + `/_server_`. 52 mounted by default | code reading; `server/src/http.rs:163` |
| "the docs mention `/query/miner/notice`, which is not in the code" | it exists in `app/src/fullnode/miner_notice.rs:21` and answers 200 | local test |
| "4 repositories without a license" | **19 of 33** without LICENSE; 14 MIT | `gh api` + `contents`, 2026-10-21 |
| "`hacashcom` is a parallel organization" | it is a user account (`type=User`) and a public member of the `hacash` org | `gh api users/hacashcom` |
| "issue `#57` and PR `#59` are about sync" | the PR does not mention `#57`; different symptoms (boot replay with `unstable_block=0` × "missing parent" warning); the maintainer answered `#57` with "delete the blocks and use 1.2.1" | PR body; comment on `#57` |
| "the guide points to a routes file that is no longer there" | `server/fullnode_api_doc.md` exists (last commit 2025-08-04); `_v2` also exists (2026-04-20); two versions coexist | `hacash/doc` |
| "LWMA" (issues `#44`, `#46`, `#48`) | the current code uses ASERT (height 738,654); "lwma" appears 0 times | `difficulty.rs:9` |
| "`fullnodedev` has the HIP-25 code" | the maintainer said `fullnodedev` will be archived | `fullnodedev#9`, 2026-07-26 |
| "17 issues in `fullnode`, 0/17 with a label or assignee" | confirmed (and 0/55 across the org) | `gh api search/issues` |
| "`fullnode` 1.2.5, 2026-10-17, changes the P2P magic" | confirmed | 1.2.5 release notes |
| "the documentation uses port 8081" | the code and `config.md` default is 8082 | `base/src/api/config.rs:18` |
| "the README says to copy `docs.loc/hacash.config.ini`" | the folder does not exist in the clone; `.gitignore` contains `*.loc/`. The release zip ships `hacash.config.ini` ready, at the root | clone and 1.2.5 zip of 2026-10-21 |

### Errors in the official material (found on 2026-10-21)

They add to the route catalog (section 8.C) as a proposal for the documentation. Nothing was opened or commented.

| # | where (URL) | what it says | what we measured on 2026-10-21 |
|---|---|---|---|
| 1 | `https://hacash.org/development`, link "All API Routes" | points to `https://github.com/hacash/fullnode/tree/main/src/server/api/routes.rs` | HTTP 404. Routes are registered across several files (section 4, column "registration") |
| 2 | `https://github.com/hacash/doc/blob/main/build/build_compilation.md` (line 32) | `git clone https://github.com/hacash/rust.git` | `hacash/rust` is legacy (no push since 2024-10-25). The current node is `hacash/fullnode` |
| 3 | `https://github.com/hacash/doc/blob/main/README.md` (line 14) | "Fullnode & PoWorker" → `https://github.com/hacash/rust/releases` | current binaries are at `https://github.com/hacash/fullnode/releases` (1.2.5, 2026-10-17) |
| 4 | `https://hacash.org/run-full-node` | sample log from the Go node `0.1.17(20231026.1)` | the current node is Rust 1.2.5 (section 2.1) |
| 5 | `fullnode` README × `hacash.config.ini` in the 1.2.5 zip | `boot_nodes` with 3 addresses in each | the 2nd address differs between the two. All 3 in the zip answered in the section 2.1 test. ⚪ The README's 2nd address was not tested alone; where to look: a node with only that address in `boot_nodes` |
| 6 | `https://hacashdao.org` (home, `/start`, `/resource`, `/community`), link "HIP Table" | points to `https://github.com/hacash/paper/blob/master/HIP/HIP-table.md` | that copy is from 2024-05-24 and lists only HIPs 1 to 16. The current one is in `hacash/doc` (2026-06-24, 22 HIPs) |
| 7 | `https://rpcapi.hacash.org` (public RPC used by the community and cited by tools) | answers on HTTPS | the certificate (Let's Encrypt, valid until 2026-11-20) is issued to `hacash.org` and lists `hacash.org`, `www`, `explorer` and `wallet` as names, not `rpcapi`. `curl https://rpcapi.hacash.org/query/latest` fails certificate verification (curl code 60); plain `http://` answers 200. Checked on 2026-10-21 from one machine. ⚪ Where to look: a second network and a browser; `openssl s_client -connect rpcapi.hacash.org:443 -servername rpcapi.hacash.org` |

---

## 10. Gaps (not measured), each with an address

> State on 2026-10-21. `⚪` = not measured. Each line says where to look.

- ⚪ **Sync with full validation** (`fast_sync = false`): time and disk not measured. Where to look: repeat the round in a new folder with `HACASH_MODO=completo scripts/rodar-no.sh`.
- ⚪ **`/query/channel` with a real id:** only the format error was tested. Where to look: the explorer's channel page (`https://explorer.hacash.org/`) to get an id.
- ⚪ **Key, signature and broadcast routes (10):** not called, by policy. Where to look: your own testnet or code review. Do not use mainnet.
- ⚪ **LevelDB/RocksDB databases:** not built. Where to look: `fullnode` README, section "Build the full node".
- ⚪ **Tag `1.2.5` (`710b4af`):** not built; the test used commit `ce25368a`. The release binary prints the same version and build date, but not the commit. Where to look: `HACASH_REF=1.2.5` in a new folder.
- ⚪ **Release binary up to the tip:** the section 2.1 test stopped at 60 s (height 30,000). Time, disk and memory up to the tip not measured. Where to look: repeat 2.1 without stopping.
- ⚪ **Release packages for Windows and macOS:** not tested. Where to look: `https://github.com/hacash/fullnode/releases/tag/1.2.5`.
- ⚪ **WASM SDK:** not executed. Where to look: section 3, "Official WASM SDK".
- ⚪ **`/query/contract/sandboxcall` without parameters:** returned `ret 0` at 09:35 and a format error at 10:39. Cause not investigated. Where to look: `vm/src/api.rs:316`.
- ⚪ **Complete route parameters:** the list in `api/rotas.json` comes from static reading. Where to look: each handler's `file:line`.
- ⚪ **HacashTalk:** `hacashtalk.com` did not answer from the test machine. Where to look: a browser, or another network. It is the source of HIP-12 and of HIP discussions.
- ⚪ **Discord and Telegram:** not opened (they require an account). Group conversations do not enter here without authorization. Where to look: invites on `hacashdao.org/community`.
- ⚪ **Who maintains `hacash.community`:** not stated on the page. Where to look: `github.com/HacashCommunity` (members), `@HacashComm` on X.
- ⚪ **HIP-19, HIP-24:** not in the table. Where to look: HacashTalk and Discord (development channel).
- ⚪ **29 repositories without a CONTRIBUTING/CI check:** where to look: `gh api repos/hacash/<repo>/git/trees/HEAD?recursive=1`.

---

## 11. Glossary for translation

| term | meaning | translation note |
|---|---|---|
| HAC (ㄜ) | the network's coin | keep acronym and symbol |
| HACD | digital diamond, an asset mined through auction | keep acronym |
| HIP | *Hacash Improvement Proposal*, a numbered improvement proposal | keep acronym |
| fullnode / full node | program that validates and stores the whole chain | translate as "full node"; keep `fullnode` when citing the repository |
| fast sync | sync that skips full validation of historical blocks | translate as "fast sync" |
| mempool / transaction pool | queue of not yet confirmed transactions | keep `mempool` |
| ASERT | difficulty adjustment algorithm in use since height 738,654 | keep |
| LWMA | linearly weighted moving average; mentioned in issues; not in the current code | keep |
| Fitsh | HVM contract language | keep |
| HVM | Hacash virtual machine | keep |
| x16rs | proof-of-work algorithm | keep |
| Istanbul | upgrade active at height 765,432 | keep |
| payment channel (L2) | layer 2 built on channels | translate |
| RPC | the node's HTTP interface, at `127.0.0.1:8082` by default | keep |
| MCP | *Model Context Protocol*, a protocol for an AI to use tools | keep |
| ⚪ | gap marker; always paired with "where to look:" | keep the symbol |
