# Hacash Base

An open knowledge base and read-only tools for the Hacash network.

**For whom:** people who want to understand Hacash, run a node, or contribute to it.

Each claim in the knowledge base carries a source and a date, or a ⚪ with where to look.
Versão em português: [README.pt-BR.md](README.pt-BR.md).

## Start in 3 steps

1. Clone this repository.

   ```
   git clone https://github.com/enioxt/hacash-base
   cd hacash-base
   ```

2. Run a light node on Linux from the official 1.2.5 release: download, change 3 lines (fast sync, no inbound P2P, and pinning the RPC to this machine), run.

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

   This downloads and runs an executable: running the release means trusting its publisher (the `hacash` organization on GitHub). the SHA-256 check above ties the file to the one published by GitHub for release 1.2.5 (the same digest is on the release page and in `gh api repos/hacash/fullnode/releases/tags/1.2.5`); it does not prove who built it. If you do not want to run a binary from that publisher, skip this step: read the knowledge base only, or build from source after reading the code (alternative below). The `diff` compares only the safety-relevant lines of the config (it does not validate the whole file, and we did not audit the binary) with what release 1.2.5 must have after the `sed`: fast sync on, no inbound P2P, RPC on 127.0.0.1:8082, and no `enable` line under `[miner]` or `[diamond_miner]` (mining off). If `diff` prints anything, **the node does not start**: stop there, change nothing by hand, and open an issue with that output.

   The first 2 lines: `fast_sync = true` (fast sync) and `[p2p] listen_port = 0` (no inbound connections). The third `sed` writes `listen_ip = 127.0.0.1` under `[server]`, so the RPC listens on this machine only (port 8082; that is also the code's default, [`base/src/api/config.rs:17`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/base/src/api/config.rs#L17), commit `ce25368a`). Mining is off. The RPC has no authentication: open it to a network only behind a firewall or proxy.
   In the test (2026-10-21) the API answered in 0.5 s and the node had 30,000 blocks after 60 s. ⚪ Time to the tip with the release binary was not measured (section 2.1 of [HACASH.md](HACASH.md)).
   To build from source instead (Rust already installed, <https://rustup.rs>; the script installs nothing): `bash scripts/rodar-no.sh` (about 3 min to build, 12 min to sync, 2.1 GB of disk).

3. Query your node.

   ```
   curl -s http://127.0.0.1:8082/query/latest
   ```

   Expected shape (numbers from 2026-10-21; they change): `{"ret":0,"height":792751,"diamond":138627}`.

## Query with an AI (MCP)

A read-only MCP server in [`mcp/`](mcp/) answers 8 questions: height, supply, balance, diamond, transaction, block, asset and payment channel.
It is not on npm yet. From a clone of this repository:

```
cd mcp && bun install
claude mcp add hacash --scope user -e HACASH_RPC_URL=http://127.0.0.1:8082 -- bun "$PWD/src/cli.ts"
```

Then ask your AI, for example: "What is the current Hacash block height and the circulating supply?"

It does not sign, broadcast or create accounts. It only calls 8 `GET` routes, on the URL set in `HACASH_RPC_URL`. Read-only is not private: every query, including the address or hash you ask about, is sent to that URL (your local node by default; the public endpoint `rpcapi.hacash.org` is run by the community, with no guarantee from us, and only works over plain `http://`: its HTTPS certificate does not cover that name, checked 2026-10-21. So do not send it addresses or queries you want private; prefer your own node). `claude mcp add --scope user` saves the setting for your user; remove it with `claude mcp remove hacash`. Other clients (Codex, Claude Desktop): see [mcp/README.md](mcp/README.md).

## What is inside

| file | what it is |
|---|---|
| [HACASH.md](HACASH.md) · [HACASH.pt-BR.md](HACASH.pt-BR.md) | the whole knowledge base, 11 sections, English and Portuguese |
| [api/rotas.json](api/rotas.json) | the 55 node routes: method, parameters, Rust handler (`file:line`), risk, real example |
| [scripts/rodar-no.sh](scripts/rodar-no.sh) | alternative to step 2: builds from source and runs a read-only node; running it again reuses what exists and refuses a config that mines or opens the RPC |
| [mcp/](mcp/) | read-only MCP server (8 tools), with tests and its own README |
| [apresentacao/](apresentacao/) | short deck in English and Portuguese |
| [SECURITY.md](SECURITY.md) | what this project does not touch |

Sections of HACASH.md:

1. What Hacash is
2. Run a node
3. Repositories and licenses
4. Node API
5. Governance
6. HIPs
7. Issues and PRs
8. Where to contribute, with first tasks
9. Divergences
10. Gaps
11. Glossary

## Build script options (`scripts/rodar-no.sh`)

| variable | default | meaning |
|---|---|---|
| `HACASH_PASTA` | `$HOME/hacash` | working folder |
| `HACASH_MODO` | `leve` | `leve` = fast sync; `completo` = validate every block (time not measured) |
| `HACASH_RPC_PORTA` | `8082` | local HTTP port |
| `HACASH_REF` | `ce25368a` | `fullnode` commit or tag to build |

The RPC listens on `127.0.0.1` only. Mining and inbound P2P stay off.

## How to contribute

1. Measure before you write. Each claim needs a source (`file:line`, command or URL) and a date.
2. If you could not measure it, mark it `⚪` and say where to look.
3. Change both languages: `HACASH.md` and `HACASH.pt-BR.md` keep the same numbers and paths.
4. Open an issue or a small pull request in this repository.
5. Never paste a private key, seed or password in an issue, PR or log.

Changes to Hacash itself go to the Hacash repositories and follow HIP-12 (section 5 of `HACASH.md`).

## License

Our text, route catalog, scripts, short deck and MCP server code (`mcp/`): MIT ([LICENSE](LICENSE)). The test fixtures in `mcp/test/fixtures/` are recorded responses of a node to public read-only queries (factual output).
Hacash code belongs to its authors. 19 of the 33 `hacash` repositories had no license file on 2026-10-21 (section 3). This repository copies no code from them.
