# Changelog

## 0.2.0 (2026-10-21)
- 3 ferramentas novas, somente leitura, só `GET`: `hacash_bloco` (`/query/block/intro`, por altura ou hash, lista de hashes opcional; o 1.2.5 não tem `/query/block` puro), `hacash_ativo` (`/query/asset`, ticker, nome, casas e oferta em átomos e decimal exato; o nó não expõe o emissor nesta rota) e `hacash_canal` (`/query/channel`, estado, os dois lados em HAC exato, distribuição e chegada final com juros, desafio).
- Lista fechada passa de 5 para 8 rotas. `block not found` e `channel not found` viram `nao_encontrado`.
- 27 testes novos (62 → 89), com 8 fixtures novas gravadas do fullnode 1.2.5 local (SHA-256 conferido) e 1 sintética marcada (canal em desafio). Provado ao vivo por stdio contra o nó local.

## 0.1.0 (2026-10-21)
- Primeira versão, não publicada: 5 ferramentas somente leitura (`hacash_altura`, `hacash_supply`, `hacash_saldo`, `hacash_diamante`, `hacash_transacao`) sobre o RPC HTTP de um fullnode (`HACASH_RPC_URL`, padrão `http://127.0.0.1:8082`).
- Rotas em lista fechada, 1 chamada por vez, prazo total de 10 s por chamada (cancela o leitor do corpo), sem retry, erro explícito.
- Fixtures = gravações reais do fullnode 1.2.5 (SHA-256 conferido na suíte). Pede `unit=mei` e entende também `mantissa:unidade`.
