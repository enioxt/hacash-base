/**
 * fixtures.ts — respostas do RPC do fullnode Hacash para os testes.
 *
 * REAIS (gravadas do fullnode 1.2.5 local, http://127.0.0.1:8082, ~792.7 mil blocos, em 21/10/2026; as 5 principais
 * conferidas como idênticas às do nó público rpcapi.hacash.org numa comparação anterior, ⚪ não refeita aqui). São as
 * respostas gravadas dessas chamadas, sem edição (a lista de SHA-256 está abaixo); o SHA-256 de cada arquivo é conferido
 * em test/fixtures.test.ts, então trocar um byte sem atualizar este cabeçalho quebra a suíte.
 *
 *   fixtures/altura.json     e8ffeab08ae8568bba8c5c4c1a494fac866d7656cd9188d11fd17b620340954b  (1_altura.L.json)   GET /query/latest
 *   fixtures/supply.json     3e39a722a7476c07473d493128f4e3711994d1f3ae91116b53b6ab4734c39e12  (2_supply.L.json)   GET /query/supply
 *   fixtures/saldo.json      85953b4b1473c850d7552c858dff667e2cedc4f07621051d0fc81163296b1aa4  (3_saldo.L.json)    GET /query/balance?address=ENDERECO&unit=mei
 *   fixtures/diamante.json   323a27b17a495a055baf98141566e47cfadeb3ec2a6b694e15c099481ad8942e  (4_diamante.L.json) GET /query/diamond?name=ZAKXMI  (sem unit: bid_fee em formato fin)
 *   fixtures/transacao.json  56bad390154289c4c0d480e7911000103854797870005869f92c072f392f065e  (5_tx.L.json)      GET /query/transaction?hash=HASH_TX&unit=mei&action=true
 *
 * Gravadas hoje por este pacote, no mesmo nó (sem unit, formato fin; e dois erros de negócio):
 *   fixtures/saldo-formato-fin.json          f4912799c914e0fae3ef1ffeb8d0155072c7bf7f63ff297acd38690469bb5ee8  GET /query/balance?address=ENDERECO
 *   fixtures/erro-diamante-invalido.json     a83d55344d7acc9ce9ecd5b818f3e8deed6425ffa269ecea053f6fd8360681ac  GET /query/diamond?name=QQQQQQ
 *   fixtures/erro-tx-nao-encontrada.json     9a44c504b394d50eb361ebd0d064d62e8f116ff66acef88ed56e97fb6c1035cb  GET /query/transaction?hash=00…00
 *
 * v0.2 — gravadas por este pacote em 21/10/2026 no mesmo nó (altura ~792,7 mil), com `curl` byte a byte:
 *   fixtures/bloco.json                        f30f2bc31a9eb9c0a171f5229e48607451d1b2fafb7dd1f36cd3eb253a7f4c41  GET /query/block/intro?height=583881&unit=mei&tx_hash_list=true
 *   fixtures/bloco-por-hash.json               e67553bb7c90b12b8129e0ff26af5f53fdd716773d691f565fc3ce502139853f  GET /query/block/intro?hash=HASH_BLOCO&unit=mei
 *   fixtures/erro-bloco-nao-encontrado.json    91b6e308a70fd7a794a385cb53efdfb58e052d15e2b5ca1fd74645ba15b2d27f  GET /query/block/intro?height=99999999&unit=mei
 *   fixtures/ativo.json                        82663840b4be105d2381d3ecfe1f5126b18f67493cfe2c6a64b85685fce3cb77  GET /query/asset?serial=2000
 *   fixtures/ativo-sem-metadados.json          c0052f474790ec56a216f39d16670a6734d1cde49f791d668825088c43e559fa  GET /query/asset?serial=2001
 *   fixtures/canal.json                        a59f4ab8ec35b3aa7e4ec0eea962fdd17c0c40d2f70e892e8ccf157d9058da59  GET /query/channel?id=42d9329160bf2bb23372dcce5f0476c0&unit=mei
 *   fixtures/canal-aberto.json                 7ab2e1a2ca87c46b61b7c7b6c3ff612bb65d03b6c19919da29671884441bb28d  GET /query/channel?id=cdfb81f2c55e814b03e1a33653666bc3&unit=mei
 *   fixtures/erro-canal-nao-encontrado.json    6fedfe2117bf8dccace21d41e97d099f9abf4fba140c557749672dab124a27e2  GET /query/channel?id=00…00&unit=mei
 * O bloco 583881 é o bloco da transação de transacao.json (o hash dela está no `tx_hash_list`). Os ids de canal foram
 * achados varrendo os blocos crus (`/query/block/datas`) atrás da ação ChannelOpen (kind 2, mint-core/src/action/channel.rs:6)
 * e confirmados um a um em `/query/channel`: um fechado por acordo com juros (status 2) e um aberto (status 0).
 *
 * Endereços e hashes aqui são públicos da blockchain (consulta pública do nó), sem vínculo com pessoa.
 *
 * SINTÉTICAS (marcadas): variações do formato real que o nó local não produz sem estado específico (várias
 * moedas-diamante, conta sem histórico, tx ainda no txpool). Seguem o formato dos handlers Rust lidos em
 * hacash/fullnode@ce25368a (mint/src/api/query/balance.rs:98-127 e :120-122, query/tx.rs:70-82).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const AQUI = join(import.meta.dir, "fixtures");
export const lerFixture = (nome: string): Record<string, any> => JSON.parse(readFileSync(join(AQUI, nome), "utf8"));

export const ALTURA = lerFixture("altura.json");
export const SUPPLY = lerFixture("supply.json");
export const SALDO = lerFixture("saldo.json");
export const SALDO_FIN = lerFixture("saldo-formato-fin.json");
export const DIAMANTE = lerFixture("diamante.json");
export const TRANSACAO = lerFixture("transacao.json");
export const ERRO_DIAMANTE_INVALIDO = lerFixture("erro-diamante-invalido.json");
export const ERRO_TX_NAO_ENCONTRADA = lerFixture("erro-tx-nao-encontrada.json");
export const BLOCO = lerFixture("bloco.json");
export const BLOCO_POR_HASH = lerFixture("bloco-por-hash.json");
export const ERRO_BLOCO_NAO_ENCONTRADO = lerFixture("erro-bloco-nao-encontrado.json");
export const ATIVO = lerFixture("ativo.json");
export const ATIVO_SEM_METADADOS = lerFixture("ativo-sem-metadados.json");
export const CANAL = lerFixture("canal.json");
export const CANAL_ABERTO = lerFixture("canal-aberto.json");
export const ERRO_CANAL_NAO_ENCONTRADO = lerFixture("erro-canal-nao-encontrado.json");

/** endereço consultado nas gravações de saldo (público) */
export const ENDERECO = "1AVRuFXNFi3rdMrPH4hdqSgFrEBnWisWaS";
export const HASH_TX = TRANSACAO.hash as string;
export const HASH_BLOCO = BLOCO.hash as string;
export const ID_CANAL = CANAL.id as string;
export const ID_CANAL_ABERTO = CANAL_ABERTO.id as string;

/** SINTÉTICA: `diamonds=true` com 2 diamantes (nomes concatenados sem separador, balance.rs:120-122) */
export const SALDO_COM_NOMES = { ret: 0, list: [{ ...SALDO.list[0], diamond: 2, diamonds: "TZSXVMWTYUIA" }] };
/** SINTÉTICA: conta sem histórico, balance.unwrap_or_default() (balance.rs:165-168) → zeros, não erro */
export const SALDO_ZERADO = { ret: 0, list: [{ hacash: "0", diamond: 0, satoshi: 0 }] };
/** SINTÉTICA: tx ainda no txpool (query/tx.rs:70-82): `pending: true`, sem `block` nem `confirm`, nem `actions` */
export const TRANSACAO_PENDENTE = (() => {
  const { block: _b, confirm: _c, actions: _a, ...resto } = TRANSACAO;
  return { ...resto, pending: true };
})();

/** SINTÉTICA: canal em desafio (status 1) — o nó local não tem nenhum hoje; forma lida em mint/src/api/util/channel.rs:52-80 */
export const CANAL_EM_DESAFIO = {
  ...CANAL_ABERTO,
  status: 1,
  challenging: { launch_height: 300000, assert_bill_auto_number: 7, assert_address_is_left_or_right: true, assert_bill: { address: CANAL_ABERTO.left.address, hacash: "1.5", satoshi: 0 } },
};

/** forma do erro de negócio: mint/src/api/util/request.rs:86-88; mensagens reais em ERRO_* acima */
export const erroDoNo = (err: string) => ({ ret: 1, err });
