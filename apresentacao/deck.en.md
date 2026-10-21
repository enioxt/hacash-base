# EGOS × Hacash

## 1. What we offer

EGOS is a Brazilian project that builds AI systems. Our rule: measure before claiming.

We offer Hacash three small, open, reviewable contributions: documentation, a starter map of issues, and a read-only AI connector to the node.

## 2. What we saw in the community

Measured 21 Oct 2026:

- Talk: Discord, Telegram, X.
- Docs: 3 sites, 2 repositories.
- 20 of 55 node API routes missing from the v2 doc.
- 55 open issues, none labeled.

HacashDAO's community page already asks to bring these groups together.

## 3. What is ready today

- Knowledge base in English and Portuguese: 11 sections, every claim dated, sourced.
- MCP server: 5 queries, 62 tests, checked live against the node.
- Fullnode 1.2.5, synced to block 792,727.
- API map: 55 routes, each with source line and risk class.

## 4. How it works

```
Hacash fullnode 1.2.5
(your own node, or a community node)
        │
        ▼
MCP server: 5 read-only queries
height · supply · balance · diamond · transaction
        │
        ▼
AI client
Claude Code, Claude Desktop, Codex, local agents
```

Each answer names the node and the route it came from. Bad input stops before it reaches the node. Errors come back as errors, never as made-up data.

## 5. What we propose

Three small contributions:

1. Docs in English, Chinese and Turkish, starting with the API route map.
2. Starter map of the 55 open issues, with suggested labels.
3. The MCP server (MIT) in an official Hacash repository, if maintainers want it.

## 6. What we do not do

- We do not hold private keys.
- We do not sign or broadcast transactions.
- We do not create a token or ask for funds.

The MCP is read-only: private keys should never leave anyone's machine. No exclusivity, no parallel task system.

## 7. How it starts

1. The maintainers review this offer and choose the channel.
2. One small pull request.
3. We iterate in public, following the HIP-12 workflow. GitHub and the HIPs stay the source.

## 8. Next step

Which channel and format do you prefer: a GitHub issue, Discord or X?

Build in your language, read in any language.

- Web: egos.ia.br
- GitHub: github.com/enioxt
- X: x.com/anoineim (Enio)
