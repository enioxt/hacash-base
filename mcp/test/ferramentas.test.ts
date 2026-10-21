/**
 * ferramentas.test.ts — as 5 ferramentas MCP contra um nó falso (fixtures reais, ver fixtures.ts).
 *
 *  F1 hacash_altura      · F2 hacash_supply     · F3 hacash_saldo
 *  F4 hacash_diamante    · F5 hacash_transacao  · F6 hacash_bloco
 *  F7 hacash_ativo       · F8 hacash_canal
 *  Fixtures: gravações REAIS do fullnode 1.2.5 (ver cabeçalho de fixtures.ts); só as marcadas SINTÉTICAS não são.
 *  Para cada uma: caminho feliz (resposta normalizada + rota/consulta exatas), parâmetro inválido barrado
 *  ANTES de qualquer chamada ao nó, e erro do nó (ret=1) devolvido como erro explícito.
 */
import { afterEach, describe, expect, it } from "bun:test";
import {
  ALTURA, ATIVO, ATIVO_SEM_METADADOS, BLOCO, BLOCO_POR_HASH, CANAL, CANAL_ABERTO, CANAL_EM_DESAFIO, DIAMANTE, ENDERECO, ERRO_BLOCO_NAO_ENCONTRADO,
  ERRO_CANAL_NAO_ENCONTRADO, ERRO_DIAMANTE_INVALIDO, ERRO_TX_NAO_ENCONTRADA, HASH_BLOCO, HASH_TX, ID_CANAL, ID_CANAL_ABERTO, SALDO, SALDO_COM_NOMES,
  SALDO_FIN, SALDO_ZERADO, SUPPLY, TRANSACAO, TRANSACAO_PENDENTE, erroDoNo,
} from "./fixtures.ts";
import { chamar, conectar, servidorFalso } from "./ajuda.ts";

const parar: (() => void)[] = [];
afterEach(() => { while (parar.length) parar.pop()!(); });
async function com(rotas: Parameters<typeof servidorFalso>[0]) {
  const s = servidorFalso(rotas);
  parar.push(s.parar);
  return { s, c: await conectar(s.url) };
}

describe("F1 hacash_altura", () => {
  it("devolve altura e último diamante normalizados; 1 GET em /query/latest", async () => {
    const { s, c } = await com({ "/query/latest": { corpo: ALTURA } });
    const r = await chamar(c, "hacash_altura");
    expect(r.erro).toBe(false);
    expect(r.json).toMatchObject({ altura: ALTURA.height, ultimo_diamante_numero: ALTURA.diamond, rota: "/query/latest" });
    expect(s.vistos).toEqual([{ metodo: "GET", caminho: "/query/latest", query: {} }]);
  });
  it("resposta sem `height` numérico vira erro resposta_invalida (não inventa zero)", async () => {
    const { c } = await com({ "/query/latest": { corpo: { ret: 0, diamond: 1 } } });
    const r = await chamar(c, "hacash_altura");
    expect(r.erro).toBe(true);
    expect(r.json.erro).toBe("resposta_invalida");
  });
});

describe("F2 hacash_supply", () => {
  it("normaliza os campos principais e preserva o resto em `detalhes`, sem o `ret`", async () => {
    const { s, c } = await com({ "/query/supply": { corpo: SUPPLY } });
    const r = await chamar(c, "hacash_supply");
    expect(r.erro).toBe(false);
    expect(r.json).toMatchObject({
      altura: SUPPLY.latest_height,
      circulacao_atual_hac: SUPPLY.current_circulation,
      recompensa_blocos_acumulada_hac: SUPPLY.block_reward,
      queimado_taxas_hac: SUPPLY.burned_fee,
      queimado_lances_diamante_hac: SUPPLY.burned_diamond_bid,
      diamantes_cunhados: SUPPLY.minted_diamond,
      rota: "/query/supply",
    });
    expect(r.json.detalhes.channel_open_total).toBe(SUPPLY.channel_open_total);
    expect(r.json.detalhes.contract_deploy_count).toBe(SUPPLY.contract_deploy_count);
    expect(r.json.detalhes.ret).toBeUndefined();
    expect(r.json.detalhes.latest_height).toBeUndefined();
    expect(Object.keys(r.json.detalhes).length).toBe(Object.keys(SUPPLY).length - 1 - 6); // sem `ret` e sem os 6 campos promovidos (altura incluída)
    expect(s.vistos.length).toBe(1);
  });
  it("nó ocupado (`state changed`) vira erro transitório, sem retry", async () => {
    const { s, c } = await com({ "/query/supply": { corpo: erroDoNo("state changed") } });
    const r = await chamar(c, "hacash_supply");
    expect(r.erro).toBe(true);
    expect(r.json).toMatchObject({ erro: "no_recusou", transitorio: true, mensagem_do_no: "state changed" });
    expect(s.vistos.length).toBe(1);
  });
});

describe("F3 hacash_saldo", () => {
  it("manda address, normaliza hacash/diamantes/satoshi e não pede nomes por padrão", async () => {
    const { s, c } = await com({ "/query/balance": { corpo: SALDO } });
    const r = await chamar(c, "hacash_saldo", { endereco: ENDERECO });
    expect(r.erro).toBe(false);
    expect(r.json).toMatchObject({ endereco: ENDERECO, hacash_hac: "1784.46320557", diamantes: 1, satoshi: 0, rota: "/query/balance" });
    expect(r.json.nomes_diamantes).toBeUndefined();
    expect(r.json.hacash).toBeUndefined();
    expect(s.vistos[0]!.query).toEqual({ address: ENDERECO, unit: "mei" });
  });
  it("nó que ignora `unit` e responde em formato fin (gravação real sem unit): converte sem perda", async () => {
    const { c } = await com({ "/query/balance": { corpo: SALDO_FIN } });
    const r = await chamar(c, "hacash_saldo", { endereco: ENDERECO });
    expect(r.json.hacash_hac).toBe("1784.46320557"); // 178446320557:240 = 178446320557 × 10^(240−248)
  });
  it("com_nomes_diamantes=true pede diamonds=true e separa os nomes de 6 em 6 (SINTÉTICA)", async () => {
    const { s, c } = await com({ "/query/balance": { corpo: SALDO_COM_NOMES } });
    const r = await chamar(c, "hacash_saldo", { endereco: ENDERECO, com_nomes_diamantes: true });
    expect(r.json.nomes_diamantes).toEqual(["TZSXVM", "WTYUIA"]);
    expect(s.vistos[0]!.query).toEqual({ address: ENDERECO, unit: "mei", diamonds: "true" });
  });
  it("endereço sem saldo no estado volta zerado (SINTÉTICA) (o nó não erra; o README avisa)", async () => {
    const { c } = await com({ "/query/balance": { corpo: SALDO_ZERADO } });
    const r = await chamar(c, "hacash_saldo", { endereco: ENDERECO });
    expect(r.json).toMatchObject({ hacash_hac: "0", diamantes: 0, satoshi: 0 });
  });
  it("barra, sem chamar o nó: vazio, lista com vírgula, espaço, caractere fora do base58, curto demais", async () => {
    const { s, c } = await com({ "/query/balance": { corpo: SALDO } });
    for (const ruim of ["", `${ENDERECO},${ENDERECO}`, `${ENDERECO} `, "0OIl" + ENDERECO, "1abc", "x".repeat(80), "../../create/account"]) {
      const r = await chamar(c, "hacash_saldo", { endereco: ruim });
      expect(r.erro).toBe(true);
    }
    expect(s.vistos.length).toBe(0);
  });
  it("endereço que o nó recusa (erro real: `address … format invalid`, soma de verificação) volta como erro do nó", async () => {
    const { c } = await com({ "/query/balance": { corpo: erroDoNo("address 1TesteTesteTesteTesteTesteTeste3 format invalid") } });
    const r = await chamar(c, "hacash_saldo", { endereco: ENDERECO });
    expect(r.erro).toBe(true);
    expect(r.json.erro).toBe("no_recusou");
  });
});

describe("F4 hacash_diamante", () => {
  it("por nome: maiúsculas, rota /query/diamond?name=…&unit=mei, campos normalizados (gravação real do ZAKXMI, bid_fee em formato fin)", async () => {
    const { s, c } = await com({ "/query/diamond": { corpo: DIAMANTE } });
    const r = await chamar(c, "hacash_diamante", { nome: "zakxmi" });
    expect(r.erro).toBe(false);
    expect(s.vistos[0]!.query).toEqual({ name: "ZAKXMI", unit: "mei" });
    expect(r.json).toMatchObject({
      nome: "ZAKXMI",
      numero: 20001,
      dono: DIAMANTE.belong,
      minerador: DIAMANTE.miner,
      nascido: { altura: 179610, hash: DIAMANTE.born.hash },
      hash_anterior: DIAMANTE.prev_hash,
      taxa_lance_hac: "1", // "1:248" do nó = 1 HAC
      queima_media_lance: 10,
      inscricoes: [],
      itens_inscricao: [],
      rota: "/query/diamond",
    });
    expect(r.json.gene_vida).toBe(DIAMANTE.life_gene);
    expect(r.json.gene_visual).toBe(DIAMANTE.visual_gene);
    expect(r.json.taxa_lance).toBeUndefined();
  });
  it("inscrições presentes são repassadas como tipo/conteúdo (SINTÉTICA: a ZAKXMI real não tem inscrição)", async () => {
    const { c } = await com({ "/query/diamond": { corpo: { ...DIAMANTE, inscriptions: ["olá"], inscription_items: [{ engraved_type: 1, content: "olá" }] } } });
    const r = await chamar(c, "hacash_diamante", { numero: 20001 });
    expect(r.json.inscricoes).toEqual(["olá"]);
    expect(r.json.itens_inscricao).toEqual([{ tipo: 1, conteudo: "olá" }]);
  });
  it("por número: manda number=…", async () => {
    const { s, c } = await com({ "/query/diamond": { corpo: DIAMANTE } });
    const r = await chamar(c, "hacash_diamante", { numero: 1234 });
    expect(r.erro).toBe(false);
    expect(s.vistos[0]!.query).toEqual({ number: "1234", unit: "mei" });
  });
  it("barra, sem chamar o nó: nenhum dos dois, os dois, nome fora do alfabeto, nome curto, número 0/negativo/fracionário", async () => {
    const { s, c } = await com({ "/query/diamond": { corpo: DIAMANTE } });
    const ruins: Record<string, unknown>[] = [
      {}, { nome: "WTYUIA", numero: 1 }, { nome: "QQQQQQ" }, { nome: "WTYUI" }, { nome: "WTYUIAH" }, { numero: 0 }, { numero: -3 }, { numero: 1.5 }, { numero: 16777216 },
    ];
    for (const a of ruins) expect((await chamar(c, "hacash_diamante", a)).erro).toBe(true);
    expect(s.vistos.length).toBe(0);
  });
  it("nome que o nó recusa (erro real `invalid diamond name`): erro do nó, não nao_encontrado", async () => {
    const { c } = await com({ "/query/diamond": { corpo: ERRO_DIAMANTE_INVALIDO } });
    const r = await chamar(c, "hacash_diamante", { nome: "WTYUIA" });
    expect(r.json).toMatchObject({ erro: "no_recusou", mensagem_do_no: "invalid diamond name" });
  });
  it("diamante inexistente: erro nao_encontrado, com a mensagem do nó (SINTÉTICA: mensagem lida em diamond.rs:30-35)", async () => {
    const { c } = await com({ "/query/diamond": { corpo: erroDoNo("cannot find diamond") } });
    const r = await chamar(c, "hacash_diamante", { nome: "WTYUIA" });
    expect(r.erro).toBe(true);
    expect(r.json).toMatchObject({ erro: "nao_encontrado", mensagem_do_no: "cannot find diamond" });
  });
});

describe("F5 hacash_transacao", () => {
  it("tx confirmada (gravação real): normaliza, traz bloco e confirmações; sem `incluir_acoes` não pede action nem repassa ações", async () => {
    const { s, c } = await com({ "/query/transaction": { corpo: TRANSACAO } });
    const r = await chamar(c, "hacash_transacao", { hash: HASH_TX });
    expect(r.erro).toBe(false);
    expect(s.vistos[0]!.query).toEqual({ hash: HASH_TX, unit: "mei" });
    expect(r.json).toMatchObject({
      hash: HASH_TX,
      hash_com_taxa: TRANSACAO.hash_with_fee,
      tipo: 2,
      timestamp: TRANSACAO.timestamp,
      taxa_hac: "0.0001",
      taxa_recebida_hac: "0.0001",
      endereco_principal: TRANSACAO.main_address,
      numero_acoes: 1,
      pendente: false,
      bloco: { altura: 583881, timestamp: TRANSACAO.block.timestamp },
      confirmacoes: TRANSACAO.confirm,
      rota: "/query/transaction",
    });
    expect(r.json.acoes).toBeUndefined();
  });
  it("incluir_acoes=true pede action=true e devolve as ações como vieram (hash em maiúsculas é normalizado)", async () => {
    const { s, c } = await com({ "/query/transaction": { corpo: TRANSACAO } });
    const r = await chamar(c, "hacash_transacao", { hash: HASH_TX.toUpperCase(), incluir_acoes: true });
    expect(s.vistos[0]!.query).toEqual({ hash: HASH_TX, unit: "mei", action: "true" });
    expect(r.json.acoes).toEqual(TRANSACAO.actions);
    expect(r.json.acoes[0].hacash).toBe("15.9975414");
  });
  it("tx no txpool (SINTÉTICA): pendente=true, sem bloco nem confirmações", async () => {
    const { c } = await com({ "/query/transaction": { corpo: TRANSACAO_PENDENTE } });
    const r = await chamar(c, "hacash_transacao", { hash: HASH_TX });
    expect(r.json.pendente).toBe(true);
    expect(r.json.bloco).toBeUndefined();
    expect(r.json.confirmacoes).toBeUndefined();
  });
  it("barra, sem chamar o nó: hash curto, longo, não-hex, vazio", async () => {
    const { s, c } = await com({ "/query/transaction": { corpo: TRANSACAO } });
    for (const h of ["", "ab", "ab".repeat(31), "ab".repeat(33), "zz".repeat(32), `${HASH_TX}&body=1`]) {
      expect((await chamar(c, "hacash_transacao", { hash: h })).erro).toBe(true);
    }
    expect(s.vistos.length).toBe(0);
  });
  it("tx inexistente (erro real do nó): nao_encontrado", async () => {
    const { c } = await com({ "/query/transaction": { corpo: ERRO_TX_NAO_ENCONTRADA } });
    const r = await chamar(c, "hacash_transacao", { hash: HASH_TX });
    expect(r.json).toMatchObject({ erro: "nao_encontrado", mensagem_do_no: "transaction not found" });
  });
});

describe("F6 hacash_bloco", () => {
  it("por altura (gravação real do bloco 583881): normaliza e a lista de hashes contém a tx de transacao.json", async () => {
    const { s, c } = await com({ "/query/block/intro": { corpo: BLOCO } });
    const r = await chamar(c, "hacash_bloco", { altura: 583881, incluir_hashes_tx: true });
    expect(r.erro).toBe(false);
    expect(s.vistos).toEqual([{ metodo: "GET", caminho: "/query/block/intro", query: { height: "583881", unit: "mei", tx_hash_list: "true" } }]);
    expect(r.json).toMatchObject({
      altura: 583881,
      hash: HASH_BLOCO,
      hash_anterior: "000000000009f3f99f2fee0560fc13f795ec68cf08ddd08c1a536704a399213a",
      timestamp: 1726169459,
      versao: 1,
      raiz_merkle: BLOCO.mrklroot,
      nonce: 772242259,
      dificuldade: 3571407253,
      minerador: "18cjpz3nuvBq9tJxjYFePNZUst5rwtx7ww",
      recompensa_hac: "8",
      mensagem: "baokuai",
      numero_transacoes: 2,
      rota: "/query/block/intro",
    });
    expect(r.json.hashes_transacoes).toEqual(BLOCO.tx_hash_list);
    expect(r.json.hashes_transacoes).toContain(HASH_TX); // a tx gravada em transacao.json está neste bloco (bloco.altura 583881)
  });
  it("por hash (gravação real): manda hash em minúsculas, sem tx_hash_list, e não inventa a lista", async () => {
    const { s, c } = await com({ "/query/block/intro": { corpo: BLOCO_POR_HASH } });
    const r = await chamar(c, "hacash_bloco", { hash: HASH_BLOCO.toUpperCase() });
    expect(r.erro).toBe(false);
    expect(s.vistos[0]!.query).toEqual({ hash: HASH_BLOCO, unit: "mei" });
    expect(r.json).toMatchObject({ altura: 583881, hash: HASH_BLOCO, recompensa_hac: "8", numero_transacoes: 2 });
    expect(r.json.hashes_transacoes).toBeUndefined();
  });
  it("recompensa em formato fin (nó que ignora unit) vira decimal; bloco diferente do pedido é resposta_invalida", async () => {
    const { c } = await com({ "/query/block/intro": { corpo: { ...BLOCO_POR_HASH, reward: "8:248" } } });
    expect((await chamar(c, "hacash_bloco", { altura: 583881 })).json.recompensa_hac).toBe("8");
    const r = await chamar(c, "hacash_bloco", { altura: 583882 });
    expect(r.erro).toBe(true);
    expect(r.json.erro).toBe("resposta_invalida");
  });
  it("lista de hashes que não bate com o total de transações do bloco é resposta_invalida (não repassa lista torta)", async () => {
    const { c } = await com({ "/query/block/intro": { corpo: { ...BLOCO, tx_hash_list: [BLOCO.tx_hash_list[0]] } } });
    const r = await chamar(c, "hacash_bloco", { altura: 583881, incluir_hashes_tx: true });
    expect(r.json.erro).toBe("resposta_invalida");
  });
  it("barra, sem chamar o nó: nenhum dos dois, os dois, altura 0 (o handler trata 0 como ausente), negativa, fracionária, hash curto/não-hex", async () => {
    const { s, c } = await com({ "/query/block/intro": { corpo: BLOCO } });
    const ruins: Record<string, unknown>[] = [
      {}, { altura: 1, hash: HASH_BLOCO }, { altura: 0 }, { altura: -1 }, { altura: 1.5 }, { hash: "ab" }, { hash: "zz".repeat(32) }, { hash: `${HASH_BLOCO}&x=1` },
    ];
    for (const a of ruins) expect((await chamar(c, "hacash_bloco", a)).erro).toBe(true);
    expect(s.vistos.length).toBe(0);
  });
  it("bloco inexistente (erro real do nó): nao_encontrado", async () => {
    const { c } = await com({ "/query/block/intro": { corpo: ERRO_BLOCO_NAO_ENCONTRADO } });
    const r = await chamar(c, "hacash_bloco", { altura: 99999999 });
    expect(r.erro).toBe(true);
    expect(r.json).toMatchObject({ erro: "nao_encontrado", mensagem_do_no: "block query failed: block not found" });
  });
});

describe("F7 hacash_ativo", () => {
  it("serial 2000 (gravação real, HACDS): ticker, nome, casas e oferta em átomos e em decimal exato", async () => {
    const { s, c } = await com({ "/query/asset": { corpo: ATIVO } });
    const r = await chamar(c, "hacash_ativo", { serial: 2000 });
    expect(r.erro).toBe(false);
    expect(s.vistos).toEqual([{ metodo: "GET", caminho: "/query/asset", query: { serial: "2000" } }]);
    expect(r.json).toMatchObject({
      serial: "2000",
      metadados: true,
      ticker: "HACDS",
      nome: "hacds",
      casas_decimais: 8,
      oferta_atomos: "5963298700000000",
      oferta: "59632987", // 5963298700000000 átomos ÷ 10^8 (mint-core/src/action/asset.rs:13: "supply {} atoms, {} decimals")
      rota: "/query/asset",
    });
    expect(r.json.emissor).toBeUndefined(); // o nó não expõe o emissor nesta rota (asset.rs:14-28); não inventamos
  });
  it("serial como texto acima de 2^53 chega ao nó sem perder dígito; oferta fracionária sai exata", async () => {
    const grande = "2305843009213693951"; // Fold64::MAX (field/src/types/fold64.rs:22) = 2^61 − 1
    const { s, c } = await com({ "/query/asset": { corpo: { ret: 0, asset: { serial: grande, decimal: 3, name: "x", ticket: "X", supply: "1000001", metadata: true } } } });
    const r = await chamar(c, "hacash_ativo", { serial: grande });
    expect(s.vistos[0]!.query).toEqual({ serial: grande });
    expect(r.json).toMatchObject({ serial: grande, oferta_atomos: "1000001", oferta: "1000.001" });
  });
  it("serial sem metadados (gravação real, 2001): não é erro, volta metadados=false com nota, sem ticker inventado", async () => {
    const { c } = await com({ "/query/asset": { corpo: ATIVO_SEM_METADADOS } });
    const r = await chamar(c, "hacash_ativo", { serial: "2001" });
    expect(r.erro).toBe(false);
    expect(r.json).toMatchObject({ serial: "2001", metadados: false });
    expect(r.json.ticker).toBeUndefined();
    expect(r.json.oferta).toBeUndefined();
    expect(typeof r.json.nota).toBe("string");
  });
  it("resposta para outro serial que não o pedido é resposta_invalida", async () => {
    const { c } = await com({ "/query/asset": { corpo: ATIVO } });
    expect((await chamar(c, "hacash_ativo", { serial: 2001 })).json.erro).toBe("resposta_invalida");
  });
  it("barra, sem chamar o nó: ausente, negativo, fracionário, texto não numérico, acima de 2^61 − 1", async () => {
    const { s, c } = await com({ "/query/asset": { corpo: ATIVO } });
    for (const v of [undefined, -1, 1.5, "", "12a", "0x10", "2305843009213693952", "1".repeat(25)]) {
      expect((await chamar(c, "hacash_ativo", v === undefined ? {} : { serial: v })).erro).toBe(true);
    }
    expect(s.vistos.length).toBe(0);
  });
});

describe("F8 hacash_canal", () => {
  it("canal fechado por acordo (gravação real): estado, os dois lados, distribuição e chegada final com juros", async () => {
    const { s, c } = await com({ "/query/channel": { corpo: CANAL } });
    const r = await chamar(c, "hacash_canal", { id: ID_CANAL.toUpperCase() });
    expect(r.erro).toBe(false);
    expect(s.vistos).toEqual([{ metodo: "GET", caminho: "/query/channel", query: { id: ID_CANAL, unit: "mei" } }]);
    expect(r.json).toMatchObject({
      id: ID_CANAL,
      estado: { codigo: 2, descricao: "fechado_por_acordo" },
      aberto_na_altura: 36428,
      fechado_na_altura: 147481,
      versao_reuso: 1,
      bloqueio_arbitragem_blocos: 5000,
      atribuicao_juros: 0,
      esquerda: { endereco: "1XM8UEAZKQx2Gj9LEooDrEXKWqBujzQ8e", hac: "504.99", satoshi: 0 },
      direita: { endereco: "1GURE1FjfwA8dZwpLerPxjSdose4emCReA", hac: "539.9999", satoshi: 0 },
      distribuicao: { esquerda: { hac: "504.99", satoshi: 0 }, direita: { hac: "539.9999", satoshi: 0 } },
      chegada_final: { esquerda: { hac: "510.5727479397", satoshi: 0 }, direita: { hac: "545.969688172928", satoshi: 0 } },
      rota: "/query/channel",
    });
    expect(r.json.desafio).toBeUndefined();
  });
  it("canal aberto (gravação real): estado aberto, fechado_na_altura null, sem distribuição", async () => {
    const { c } = await com({ "/query/channel": { corpo: CANAL_ABERTO } });
    const r = await chamar(c, "hacash_canal", { id: ID_CANAL_ABERTO });
    expect(r.json).toMatchObject({
      id: ID_CANAL_ABERTO,
      estado: { codigo: 0, descricao: "aberto" },
      aberto_na_altura: 274651,
      fechado_na_altura: null,
      esquerda: { endereco: "12fEmV9HBRZfnfhypxmtW82TNHbCiHfkzU", hac: "1", satoshi: 0 },
      direita: { endereco: "1FMjXxS9PjHAsEez583gYXBfh6j98QDdYR", hac: "1", satoshi: 0 },
    });
    expect(r.json.distribuicao).toBeUndefined();
    expect(r.json.chegada_final).toBeUndefined();
  });
  it("canal em desafio (SINTÉTICA, forma de util/channel.rs:52-80): desafio com lado e valor afirmados", async () => {
    const { c } = await com({ "/query/channel": { corpo: CANAL_EM_DESAFIO } });
    const r = await chamar(c, "hacash_canal", { id: ID_CANAL_ABERTO });
    expect(r.json.estado).toEqual({ codigo: 1, descricao: "em_desafio" });
    expect(r.json.desafio).toEqual({
      altura_inicio: 300000, numero_conta_afirmada: 7, lado_afirmado: "esquerda",
      conta_afirmada: { endereco: CANAL_ABERTO.left.address, hac: "1.5", satoshi: 0 },
    });
  });
  it("estado desconhecido ou id diferente do pedido é resposta_invalida", async () => {
    const { c } = await com({ "/query/channel": { corpo: { ...CANAL_ABERTO, status: 9 } } });
    expect((await chamar(c, "hacash_canal", { id: ID_CANAL_ABERTO })).json.erro).toBe("resposta_invalida");
    expect((await chamar(c, "hacash_canal", { id: ID_CANAL })).json.erro).toBe("resposta_invalida");
  });
  it("barra, sem chamar o nó: vazio, curto, longo, não-hex, com sufixo", async () => {
    const { s, c } = await com({ "/query/channel": { corpo: CANAL } });
    for (const id of ["", "ab", "ab".repeat(15), "ab".repeat(17), "zz".repeat(16), `${ID_CANAL}&unit=fin`]) {
      expect((await chamar(c, "hacash_canal", { id })).erro).toBe(true);
    }
    expect(s.vistos.length).toBe(0);
  });
  it("canal inexistente (erro real do nó): nao_encontrado", async () => {
    const { c } = await com({ "/query/channel": { corpo: ERRO_CANAL_NAO_ENCONTRADO } });
    const r = await chamar(c, "hacash_canal", { id: "00".repeat(16) });
    expect(r.json).toMatchObject({ erro: "nao_encontrado", mensagem_do_no: "channel not found" });
  });
});
