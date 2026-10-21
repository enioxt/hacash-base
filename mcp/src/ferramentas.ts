/**
 * ferramentas.ts — as 8 ferramentas MCP de LEITURA do Hacash. Cada uma = entrada validada (zod) + rota do fullnode
 * + consulta + normalização da resposta. Nenhuma assina, transmite nem toca chave.
 *
 * Fonte de cada rota: github.com/hacash/fullnode @ ce25368a038c5307ab71b5d81cd781cc54fe884d (lido em clone local;
 * linhas abaixo são desse commit). O formato da resposta vem do JSON montado pelo handler e foi conferido contra gravações
 * reais do fullnode 1.2.5 local (test/fixtures.ts).
 */
import { z } from "zod";
import { atomosEmDecimal, valorEmHac } from "./hac.ts";
import { ErroHacash, type RotaLeitura } from "./rpc.ts";

const ALFABETO_DIAMANTE = "WTYUIAHXVMEKBSZN"; // field/src/types/diamond.rs:73
const BASE58 = "[1-9A-HJ-NP-Za-km-z]";
const num = z.number();
const str = z.string();

/** Resposta do nó fora do formato lido no código → erro explícito (nunca chuta valor). */
function conferir<T extends z.ZodType>(esquema: T, corpo: unknown, no: string): z.infer<T> {
  const r = esquema.safeParse(corpo);
  if (!r.success) {
    const onde = r.error.issues[0]?.path.join(".") || "(raiz)";
    throw new ErroHacash("resposta_invalida", `a resposta do nó não tem o formato esperado (campo ${onde})`, { no });
  }
  return r.data;
}

/** Valor em HAC do nó → decimal; formato desconhecido é erro, não chute. */
function emHac(v: string, campo: string, no: string): string {
  const r = valorEmHac(v);
  if (r === null) throw new ErroHacash("resposta_invalida", `valor em HAC fora do formato conhecido (campo ${campo})`, { no });
  return r;
}

/** Pedimos `unit=mei`: o nó devolve HAC decimal exato ("1784.46320557") em vez de `mantissa:unidade` (amount.rs:276-289). */
const UNIDADE = { unit: "mei" } as const;

export type Contexto = { no: string };
export type Ferramenta = {
  nome: string;
  titulo: string;
  descricao: string;
  /** Forma da entrada exposta ao cliente MCP (JSON Schema). */
  forma: z.ZodRawShape;
  /** Validação completa (regras entre campos). Lança ZodError. */
  entrada: z.ZodType<Record<string, unknown>>;
  rota: RotaLeitura;
  /** Handler Rust que responde a rota (arquivo:linha no commit acima). */
  handler: string;
  consulta: (a: any) => Record<string, string>;
  normalizar: (corpo: Record<string, unknown>, a: any, ctx: Contexto) => Record<string, unknown>;
};

/* ───────────── hacash_altura ───────────── */
// handler: mint/src/api/query/supply.rs:40-58 (latest_handler); JSON: supply.rs:33-38 (latest_json); rota: mint/src/api/mod.rs:78
const EsqAltura = z.looseObject({ height: num, diamond: num });
const altura: Ferramenta = {
  nome: "hacash_altura",
  titulo: "Hacash: altura da blockchain",
  descricao:
    "Altura do último bloco da blockchain Hacash e número do último diamante (HACD) minerado, segundo o nó consultado. Só leitura.",
  forma: {},
  entrada: z.object({}),
  rota: "/query/latest",
  handler: "mint/src/api/query/supply.rs:40",
  consulta: () => ({}),
  normalizar(corpo, _a, ctx) {
    const d = conferir(EsqAltura, corpo, ctx.no);
    return { altura: d.height, ultimo_diamante_numero: d.diamond };
  },
};

/* ───────────── hacash_supply ───────────── */
// handler: mint/src/api/query/supply.rs:7-31 (supply_handler); JSON: mint/src/api/util/supply.rs:8-115 (supply_json); rota: mod.rs:79
// Valores em HAC saem do nó como f64 (hac238_to_unit, util/request.rs:16-18): precisão de ponto flutuante.
const EsqSupply = z.looseObject({
  latest_height: num,
  current_circulation: num,
  block_reward: num,
  burned_fee: num,
  burned_diamond_bid: num,
  minted_diamond: num,
});
const PROMOVIDOS = new Set(["ret", "latest_height", "current_circulation", "block_reward", "burned_fee", "burned_diamond_bid", "minted_diamond"]);
const supply: Ferramenta = {
  nome: "hacash_supply",
  titulo: "Hacash: oferta e circulação",
  descricao:
    "Oferta do Hacash segundo o nó: HAC em circulação, recompensa acumulada de blocos, HAC queimado (taxas e lances de diamante), diamantes cunhados e contadores de canais, inscrições e contratos (em `detalhes`). Valores em HAC como número de ponto flutuante do nó. Só leitura.",
  forma: {},
  entrada: z.object({}),
  rota: "/query/supply",
  handler: "mint/src/api/query/supply.rs:7",
  consulta: () => ({}),
  normalizar(corpo, _a, ctx) {
    const d = conferir(EsqSupply, corpo, ctx.no) as Record<string, unknown> & z.infer<typeof EsqSupply>;
    const detalhes = Object.fromEntries(Object.entries(d).filter(([k]) => !PROMOVIDOS.has(k)));
    return {
      altura: d.latest_height,
      circulacao_atual_hac: d.current_circulation,
      recompensa_blocos_acumulada_hac: d.block_reward,
      queimado_taxas_hac: d.burned_fee,
      queimado_lances_diamante_hac: d.burned_diamond_bid,
      diamantes_cunhados: d.minted_diamond,
      detalhes,
    };
  },
};

/* ───────────── hacash_saldo ───────────── */
// handler: mint/src/api/query/balance.rs:129-203 (balance_handler); item: balance.rs:98-127 (balance_item_json); rota: mod.rs:80
// O nó aceita até 200 endereços por chamada (balance.rs:146); aqui é 1 por vez (limite deste servidor).
// Endereço desconhecido NÃO é erro: o nó devolve zeros (balance.rs:165-168, unwrap_or_default).
const ENDERECO_RE = new RegExp(`^${BASE58}{26,40}$`);
const EntradaSaldo = z.object({
  endereco: z.string().regex(ENDERECO_RE, "endereço Hacash em base58 (um só, sem espaço nem vírgula)"),
  com_nomes_diamantes: z.boolean().default(false),
});
const EsqSaldo = z.looseObject({
  list: z.array(z.looseObject({ hacash: str, diamond: num, satoshi: num, diamonds: str.optional() })).length(1),
});
const saldo: Ferramenta = {
  nome: "hacash_saldo",
  titulo: "Hacash: saldo de um endereço",
  descricao:
    "Saldo público de UM endereço Hacash: HAC (formato do nó e decimal), quantidade de diamantes (HACD) e satoshis. Endereço sem histórico volta zerado (o nó não diferencia de conta vazia). Só leitura; não pede nem aceita chave.",
  forma: EntradaSaldo.shape,
  entrada: EntradaSaldo,
  rota: "/query/balance",
  handler: "mint/src/api/query/balance.rs:129",
  consulta: (a: z.infer<typeof EntradaSaldo>) => ({ address: a.endereco, ...UNIDADE, ...(a.com_nomes_diamantes ? { diamonds: "true" } : {}) }),
  normalizar(corpo, a: z.infer<typeof EntradaSaldo>, ctx) {
    const item = conferir(EsqSaldo, corpo, ctx.no).list[0]!;
    const saida: Record<string, unknown> = {
      endereco: a.endereco,
      hacash_hac: emHac(item.hacash, "hacash", ctx.no),
      diamantes: item.diamond,
      satoshi: item.satoshi,
    };
    if (a.com_nomes_diamantes) {
      const nomes = item.diamonds ?? "";
      if (nomes.length % 6 !== 0) throw new ErroHacash("resposta_invalida", "lista de nomes de diamante fora do formato (campo diamonds)", { no: ctx.no });
      saida.nomes_diamantes = nomes.match(/.{6}/g) ?? [];
    }
    return saida;
  },
};

/* ───────────── hacash_diamante ───────────── */
// handler: mint/src/api/query/diamond.rs:12-71 (diamond_handler; `number` > 0 tem precedência sobre `name`, :15,:23);
// JSON: mint/src/api/util/diamond.rs:55-97 (diamond_detail_json); rota: mod.rs:82. Número = Uint3 (field/src/types/diamond.rs:14) → até 16777215.
const NOME_RE = new RegExp(`^[${ALFABETO_DIAMANTE}${ALFABETO_DIAMANTE.toLowerCase()}]{6}$`);
const FormaDiamante = {
  nome: z.string().regex(NOME_RE, `nome de 6 letras do alfabeto ${ALFABETO_DIAMANTE}`).optional(),
  numero: z.number().int().min(1).max(16_777_215).optional(),
};
const EntradaDiamante = z.object(FormaDiamante).refine((a) => (a.nome === undefined) !== (a.numero === undefined), {
  message: "informe `nome` OU `numero` (exatamente um)",
});
const EsqDiamante = z.looseObject({
  name: str,
  belong: str,
  inscriptions: z.array(str),
  inscription_items: z.array(z.looseObject({ engraved_type: num, content: str })),
  number: num,
  miner: str,
  born: z.looseObject({ height: num, hash: str }),
  prev_hash: str,
  bid_fee: str,
  average_bid_burn: num,
  life_gene: str,
  visual_gene: str,
});
const diamante: Ferramenta = {
  nome: "hacash_diamante",
  titulo: "Hacash: dados de um diamante (HACD)",
  descricao:
    "Dados públicos de UM diamante Hacash (HACD) por nome de 6 letras (alfabeto WTYUIAHXVMEKBSZN) OU por número: dono atual, minerador, bloco de nascimento, lance, genes e inscrições. Só leitura.",
  forma: FormaDiamante,
  entrada: EntradaDiamante,
  rota: "/query/diamond",
  handler: "mint/src/api/query/diamond.rs:12",
  consulta: (a: z.infer<typeof EntradaDiamante>): Record<string, string> => (a.nome !== undefined ? { name: a.nome.toUpperCase(), ...UNIDADE } : { number: String(a.numero), ...UNIDADE }),
  normalizar(corpo, _a, ctx) {
    const d = conferir(EsqDiamante, corpo, ctx.no);
    return {
      nome: d.name,
      numero: d.number,
      dono: d.belong,
      minerador: d.miner,
      nascido: { altura: d.born.height, hash: d.born.hash },
      hash_anterior: d.prev_hash,
      taxa_lance_hac: emHac(d.bid_fee, "bid_fee", ctx.no),
      queima_media_lance: d.average_bid_burn,
      gene_vida: d.life_gene,
      gene_visual: d.visual_gene,
      inscricoes: d.inscriptions,
      itens_inscricao: d.inscription_items.map((i) => ({ tipo: i.engraved_type, conteudo: i.content })),
    };
  },
};

/* ───────────── hacash_transacao ───────────── */
// handler: mint/src/api/query/tx.rs:50-127 (transaction_query_handler; txpool primeiro, :70-82, depois a cadeia);
// JSON: mint/src/api/util/tx.rs:88-158 (transaction_fields_json) no envelope de tx.rs:160-187; rota: mod.rs:115.
// Não pedimos `body` nem `signature` (bytes brutos e assinaturas): só o resumo e, se pedido, as ações (`action=true`).
const EntradaTransacao = z.object({
  hash: z.string().regex(/^[0-9a-fA-F]{64}$/, "hash da transação: 64 caracteres hexadecimais"),
  incluir_acoes: z.boolean().default(false),
});
const EsqTransacao = z.looseObject({
  hash: str,
  hash_with_fee: str,
  type: num,
  timestamp: num,
  fee: str,
  fee_got: str,
  main_address: str,
  action: num,
  gas_max: num.optional(),
  pending: z.boolean().optional(),
  block: z.looseObject({ height: num, timestamp: num }).optional(),
  confirm: num.optional(),
  actions: z.array(z.unknown()).optional(),
});
const transacao: Ferramenta = {
  nome: "hacash_transacao",
  titulo: "Hacash: consulta de transação",
  descricao:
    "Resumo público de UMA transação Hacash pelo hash (64 hex): tipo, taxa, endereço principal, número de ações e, se já confirmada, bloco e confirmações; `pendente: true` se ainda está no pool do nó. Com `incluir_acoes` traz as ações como o nó as descreve. Só leitura; não transmite nem assina nada.",
  forma: EntradaTransacao.shape,
  entrada: EntradaTransacao,
  rota: "/query/transaction",
  handler: "mint/src/api/query/tx.rs:50",
  consulta: (a: z.infer<typeof EntradaTransacao>) => ({ hash: a.hash.toLowerCase(), ...UNIDADE, ...(a.incluir_acoes ? { action: "true" } : {}) }),
  normalizar(corpo, a: z.infer<typeof EntradaTransacao>, ctx) {
    const d = conferir(EsqTransacao, corpo, ctx.no);
    const saida: Record<string, unknown> = {
      hash: d.hash,
      hash_com_taxa: d.hash_with_fee,
      tipo: d.type,
      timestamp: d.timestamp,
      taxa_hac: emHac(d.fee, "fee", ctx.no),
      taxa_recebida_hac: emHac(d.fee_got, "fee_got", ctx.no),
      endereco_principal: d.main_address,
      numero_acoes: d.action,
      pendente: d.pending === true,
    };
    if (d.gas_max !== undefined) saida.gas_max = d.gas_max;
    if (d.block) saida.bloco = { altura: d.block.height, timestamp: d.block.timestamp };
    if (d.confirm !== undefined) saida.confirmacoes = d.confirm;
    if (a.incluir_acoes && d.actions) saida.acoes = d.actions;
    return saida;
  },
};

/* ───────────── hacash_bloco ───────────── */
// handler: mint/src/api/query/block.rs:9-21 (block_intro_handler; `height` > 0 tem precedência sobre `hash`, :12-16);
// JSON: mint/src/api/util/block.rs:43-88 (block_intro_json); busca: util/block.rs:90-114 (hash de 64 hex ou altura); rota: mod.rs:110.
// O mod.rs NÃO registra `/query/block` puro no 1.2.5: a rota de bloco por altura/hash é `/query/block/intro`.
// `transaction` = total de transações SEM a coinbase (util/block.rs:74); `tx_hash_list` também pula a coinbase (:81).
const FormaBloco = {
  altura: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
  hash: z.string().regex(/^[0-9a-fA-F]{64}$/, "hash do bloco: 64 caracteres hexadecimais").optional(),
  incluir_hashes_tx: z.boolean().default(false),
};
const EntradaBloco = z.object(FormaBloco).refine((a) => (a.altura === undefined) !== (a.hash === undefined), {
  message: "informe `altura` (a partir de 1) OU `hash` (exatamente um)",
});
const EsqBloco = z.looseObject({
  hash: str,
  version: num,
  height: num,
  timestamp: num,
  mrklroot: str,
  prevhash: str,
  nonce: num,
  difficulty: num,
  miner: str,
  reward: str,
  message: str,
  transaction: num,
  tx_hash_list: z.array(str).optional(),
});
const bloco: Ferramenta = {
  nome: "hacash_bloco",
  titulo: "Hacash: dados de um bloco",
  descricao:
    "Cabeçalho público de UM bloco Hacash por `altura` OU `hash` (64 hex): hash, hash anterior, horário, minerador, recompensa em HAC (decimal exato), mensagem do minerador, dificuldade, nonce e número de transações (sem contar a coinbase). Com `incluir_hashes_tx` traz a lista dos hashes das transações, para consultar cada uma em hacash_transacao. Só leitura.",
  forma: FormaBloco,
  entrada: EntradaBloco,
  rota: "/query/block/intro",
  handler: "mint/src/api/query/block.rs:9",
  consulta: (a: z.infer<typeof EntradaBloco>): Record<string, string> => ({
    ...(a.altura !== undefined ? { height: String(a.altura) } : { hash: a.hash!.toLowerCase() }),
    ...UNIDADE,
    ...(a.incluir_hashes_tx ? { tx_hash_list: "true" } : {}),
  }),
  normalizar(corpo, a: z.infer<typeof EntradaBloco>, ctx) {
    const d = conferir(EsqBloco, corpo, ctx.no);
    if (a.altura !== undefined ? d.height !== a.altura : d.hash.toLowerCase() !== a.hash!.toLowerCase()) {
      throw new ErroHacash("resposta_invalida", "o nó devolveu um bloco diferente do pedido", { no: ctx.no });
    }
    const saida: Record<string, unknown> = {
      altura: d.height,
      hash: d.hash,
      hash_anterior: d.prevhash,
      timestamp: d.timestamp,
      versao: d.version,
      raiz_merkle: d.mrklroot,
      nonce: d.nonce,
      dificuldade: d.difficulty,
      minerador: d.miner,
      recompensa_hac: emHac(d.reward, "reward", ctx.no),
      mensagem: d.message,
      numero_transacoes: d.transaction,
    };
    if (a.incluir_hashes_tx) {
      const lista = d.tx_hash_list;
      if (!lista || lista.length !== d.transaction) {
        throw new ErroHacash("resposta_invalida", "a lista de hashes do bloco não bate com o número de transações (campo tx_hash_list)", { no: ctx.no });
      }
      saida.hashes_transacoes = lista;
    }
    return saida;
  },
};

/* ───────────── hacash_ativo ───────────── */
// handler: mint/src/api/query/asset.rs:31-56 (asset_query_handler); JSON: asset.rs:14-28 (asset_meta_json); rota: mod.rs:81.
// Serial = Fold64 (field/src/types/fold64.rs:22): 0 a 2^61 − 1; acima, o nó responde `serial out of range` (asset.rs:37).
// Serial sem registro (ou com mais de 16 casas) NÃO é erro: o nó devolve `metadata:false` (asset.rs:17-18,27).
// O emissor existe no estado (AssetSmelt.issuer, field/src/types/asset.rs:106) mas esta rota não o devolve.
const SERIAL_MAX = (1n << 61n) - 1n;
const FormaAtivo = {
  serial: z
    .union([z.number().int().min(0).max(Number.MAX_SAFE_INTEGER), z.string().regex(/^\d{1,19}$/, "serial: número inteiro em texto decimal")])
    .refine((v) => BigInt(v) <= SERIAL_MAX, "serial acima de 2^61 − 1 (limite Fold64 do nó)")
    .describe("serial do ativo (inteiro; acima de 2^53 mande como texto para não perder dígito)"),
};
const EntradaAtivo = z.object(FormaAtivo);
const EsqAtivo = z.looseObject({
  asset: z.looseObject({
    serial: str,
    metadata: z.boolean(),
    decimal: num.optional(),
    name: str.optional(),
    ticket: str.optional(),
    supply: str.optional(),
  }),
});
const ativo: Ferramenta = {
  nome: "hacash_ativo",
  titulo: "Hacash: dados de um ativo (token) por serial",
  descricao:
    "Metadados públicos de UM ativo emitido na Hacash, pelo `serial`: ticker, nome, casas decimais e oferta total (em átomos e em decimal exato). Serial sem registro volta `metadados: false` (o nó não diferencia ativo inexistente de ativo com mais de 16 casas). O nó não informa o emissor nesta consulta. Só leitura.",
  forma: FormaAtivo,
  entrada: EntradaAtivo,
  rota: "/query/asset",
  handler: "mint/src/api/query/asset.rs:31",
  consulta: (a: z.infer<typeof EntradaAtivo>) => ({ serial: BigInt(a.serial).toString() }),
  normalizar(corpo, a: z.infer<typeof EntradaAtivo>, ctx) {
    const d = conferir(EsqAtivo, corpo, ctx.no).asset;
    const pedido = BigInt(a.serial).toString();
    if (d.serial !== pedido) throw new ErroHacash("resposta_invalida", "o nó devolveu outro serial que não o pedido", { no: ctx.no });
    if (!d.metadata) {
      return {
        serial: d.serial,
        metadados: false,
        nota: "o nó não tem metadados para este serial: ativo não registrado ou com mais de 16 casas decimais (asset.rs:17-27). Não é erro e não prova que o serial existe.",
      };
    }
    if (d.decimal === undefined || d.name === undefined || d.ticket === undefined || d.supply === undefined) {
      throw new ErroHacash("resposta_invalida", "ativo com metadata=true sem decimal/name/ticket/supply", { no: ctx.no });
    }
    const oferta = atomosEmDecimal(d.supply, d.decimal);
    if (oferta === null) throw new ErroHacash("resposta_invalida", "oferta do ativo fora do formato conhecido (campo supply)", { no: ctx.no });
    return {
      serial: d.serial,
      metadados: true,
      ticker: d.ticket,
      nome: d.name,
      casas_decimais: d.decimal,
      oferta_atomos: d.supply,
      oferta,
    };
  },
};

/* ───────────── hacash_canal ───────────── */
// handler: mint/src/api/query/channel.rs:9-47 (channel_handler; id = 16 bytes em hex, :11-17); JSON: mint/src/api/util/channel.rs:23-127
// (channel_json; `challenging` em :52-80, `distribution`/`final_arrival` com juros em :82-124); rota: mod.rs:106.
// Estados: field/src/types/channel.rs:140-143 (0 aberto, 1 em desafio, 2 fechado por acordo, 3 fechado por arbitragem).
const ESTADOS_CANAL = ["aberto", "em_desafio", "fechado_por_acordo", "fechado_por_arbitragem"] as const;
const EntradaCanal = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{32}$/, "id do canal: 32 caracteres hexadecimais (16 bytes)"),
});
const Conta = z.looseObject({ address: str, hacash: str, satoshi: num });
const HacSat = z.looseObject({ hacash: str, satoshi: num });
const EsqCanal = z.looseObject({
  id: str,
  status: num,
  open_height: num,
  close_height: num,
  reuse_version: num,
  arbitration_lock: num,
  interest_attribution: num,
  left: Conta,
  right: Conta,
  challenging: z
    .looseObject({ launch_height: num, assert_bill_auto_number: num, assert_address_is_left_or_right: z.boolean(), assert_bill: Conta })
    .optional(),
  distribution: z.looseObject({ left: HacSat, right: HacSat }).optional(),
  final_arrival: z.looseObject({ left: HacSat, right: HacSat }).optional(),
});
const canal: Ferramenta = {
  nome: "hacash_canal",
  titulo: "Hacash: estado de um canal de pagamento",
  descricao:
    "Estado público de UM canal de pagamento Hacash pelo `id` (32 hex): aberto, em desafio ou fechado; alturas de abertura e fechamento; endereço e HAC (decimal exato) e satoshis de cada lado; se fechado, a distribuição e o valor final com juros; se em desafio, o lado e o valor afirmados. Só leitura.",
  forma: EntradaCanal.shape,
  entrada: EntradaCanal,
  rota: "/query/channel",
  handler: "mint/src/api/query/channel.rs:9",
  consulta: (a: z.infer<typeof EntradaCanal>) => ({ id: a.id.toLowerCase(), ...UNIDADE }),
  normalizar(corpo, a: z.infer<typeof EntradaCanal>, ctx) {
    const d = conferir(EsqCanal, corpo, ctx.no);
    if (d.id.toLowerCase() !== a.id.toLowerCase()) throw new ErroHacash("resposta_invalida", "o nó devolveu outro canal que não o pedido", { no: ctx.no });
    const descricao = ESTADOS_CANAL[d.status];
    if (descricao === undefined) throw new ErroHacash("resposta_invalida", `estado de canal desconhecido (${d.status})`, { no: ctx.no });
    const conta = (c: z.infer<typeof Conta>, campo: string) => ({ endereco: c.address, hac: emHac(c.hacash, campo, ctx.no), satoshi: c.satoshi });
    const hs = (c: z.infer<typeof HacSat>, campo: string) => ({ hac: emHac(c.hacash, campo, ctx.no), satoshi: c.satoshi });
    const saida: Record<string, unknown> = {
      id: d.id,
      estado: { codigo: d.status, descricao },
      aberto_na_altura: d.open_height,
      fechado_na_altura: d.close_height === 0 ? null : d.close_height,
      versao_reuso: d.reuse_version,
      bloqueio_arbitragem_blocos: d.arbitration_lock,
      atribuicao_juros: d.interest_attribution,
      esquerda: conta(d.left, "left.hacash"),
      direita: conta(d.right, "right.hacash"),
    };
    if (d.challenging) {
      saida.desafio = {
        altura_inicio: d.challenging.launch_height,
        numero_conta_afirmada: d.challenging.assert_bill_auto_number,
        lado_afirmado: d.challenging.assert_address_is_left_or_right ? "esquerda" : "direita",
        conta_afirmada: conta(d.challenging.assert_bill, "challenging.assert_bill.hacash"),
      };
    }
    if (d.distribution) saida.distribuicao = { esquerda: hs(d.distribution.left, "distribution.left"), direita: hs(d.distribution.right, "distribution.right") };
    if (d.final_arrival) saida.chegada_final = { esquerda: hs(d.final_arrival.left, "final_arrival.left"), direita: hs(d.final_arrival.right, "final_arrival.right") };
    return saida;
  },
};

export const FERRAMENTAS: readonly Ferramenta[] = [altura, supply, saldo, diamante, transacao, bloco, ativo, canal];
