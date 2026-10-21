# Roadmap

Open work on Hacash Base, split into small tasks anyone can pick up.
Versão em português: [ROADMAP.pt-BR.md](ROADMAP.pt-BR.md).

## How to pick a task

1. Choose an issue labeled [`good first issue`](https://github.com/enioxt/hacash-base/issues?q=is%3Aopen+label%3A%22good+first+issue%22) or [`help wanted`](https://github.com/enioxt/hacash-base/issues?q=is%3Aopen+label%3A%22help+wanted%22).
2. Comment "I'll take it" on the issue, so two people do not do the same work.
3. Open a small pull request that meets the issue's "Done when" list.
4. A maintainer reviews it. Small fixes may go back and forth once or twice.

Size is an estimate, not a measurement: **S** up to 2 hours · **M** up to 1 day · **L** more than 1 day.
The rules in [How to contribute](README.md#how-to-contribute) apply to every task: source and date for each claim, both languages kept in sync, never a key or seed in an issue or log.

## Now

- Review the Portuguese route map as a native speaker. [#3](https://github.com/enioxt/hacash-base/issues/3) · `translation` `good first issue` · S
- Review the English route map as a native speaker. [#4](https://github.com/enioxt/hacash-base/issues/4) · `translation` `docs` `good first issue` · S
- Write fix suggestions for the 7 errors in the official material. [#7](https://github.com/enioxt/hacash-base/issues/7) · `docs` `good first issue` · S
- Add a read-only MCP tool for the average fee. [#8](https://github.com/enioxt/hacash-base/issues/8) · `mcp` `good first issue` · S
- Test the fullnode README's second `boot_nodes` address on its own. [#13](https://github.com/enioxt/hacash-base/issues/13) · `node` `good first issue` · S
- Run the MCP tests and the route-map check in CI. [#14](https://github.com/enioxt/hacash-base/issues/14) · `tests` `good first issue` · S
- Translate `mcp/README.md` into English. [#5](https://github.com/enioxt/hacash-base/issues/5) · `docs` `translation` `mcp` `good first issue` · M
- Review the Chinese route map as a native speaker. [#1](https://github.com/enioxt/hacash-base/issues/1) · `translation` `help wanted` · M
- Review the Turkish route map as a native speaker. [#2](https://github.com/enioxt/hacash-base/issues/2) · `translation` `help wanted` · M

## Next

- Draft official-doc entries for the 20 routes missing from API doc v2. [#6](https://github.com/enioxt/hacash-base/issues/6) · `api-map` `docs` `help wanted` · M
- Check the query parameters in `api/rotas.json` against each handler. [#15](https://github.com/enioxt/hacash-base/issues/15) · `api-map` `tests` `help wanted` · M
- Prepare the MCP package for npm and the MCP registry, without publishing. [#10](https://github.com/enioxt/hacash-base/issues/10) · `mcp` `help wanted` · M
- Test the 1.2.5 release packages on Windows and macOS. [#12](https://github.com/enioxt/hacash-base/issues/12) · `node` `help wanted` · M
- Add an optional remote HTTP transport to the MCP server. [#9](https://github.com/enioxt/hacash-base/issues/9) · `mcp` `help wanted` · L
- Measure the release binary syncing to the chain tip. [#11](https://github.com/enioxt/hacash-base/issues/11) · `node` `help wanted` · L

## Later (no issue yet)

Open an issue first if you want to take one of these.

- Measure a full-validation sync (`fast_sync = false`): time and disk. · `node` · L
- Build tag `1.2.5` from source and compare it with commit `ce25368a`. · `node` · M
- Run the official WASM SDK and document one read-only example. · `docs` · M
- Add more read-only MCP tools (hashrate, recent blocks, diamond list). · `mcp` · M
- Find out why `/query/contract/sandboxcall` answered differently at two times. · `api-map` · S
- Write the 6-step scenario of `fullnode#61` as an integration test, as a contribution to `hacash/fullnode` after reading HIP-12. · `tests` · L
- Map each HIP to its code and activation height; locate HIP-19 and HIP-24. · `docs` · L
- Compare the Chinese sources with the English ones (white paper, `doc-chinese` and `doc`). · `translation` · M
- Add Turkish terms to the glossary (section 11 of `HACASH.md`). · `translation` · S
- Recount the licenses of the `hacash` repositories with one stated rule. · `docs` · S
