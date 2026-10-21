#!/usr/bin/env bun
/**
 * gerar-mapa-rotas.ts — gera o mapa de rotas da API do nó Hacash em 4 línguas a partir de api/rotas.json.
 *
 *   bun scripts/gerar-mapa-rotas.ts           escreve api/ROTAS.md (EN), ROTAS.pt-BR.md, ROTAS.zh.md, ROTAS.tr.md
 *   bun scripts/gerar-mapa-rotas.ts --check   não escreve; sai com 1 se algum arquivo estiver desatualizado
 *
 * Os números (rotas, método, parâmetros, handler, risco, doc oficial) vêm SÓ do JSON. Os textos fixos e a
 * descrição de 1 linha de cada rota ficam nos dicionários abaixo (en, pt, zh, tr). Sem dependências.
 *
 * Termos: ZH segue a doc-chinese oficial (全节点, 钻石, 接口, 私钥, 区块高度, 余额 e outros que ela usa);
 * TR usa HACD e node como a comunidade escreve; termo sem fonte fica em inglês. ZH e TR: tradução assistida.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type L = "en" | "pt" | "zh" | "tr";
const LANGS: L[] = ["en", "pt", "zh", "tr"];
const ARQUIVO: Record<L, string> = { en: "ROTAS.md", pt: "ROTAS.pt-BR.md", zh: "ROTAS.zh.md", tr: "ROTAS.tr.md" };
const NOME: Record<L, string> = { en: "English", pt: "Português (Brasil)", zh: "简体中文", tr: "Türkçe" };

interface Rota {
  metodo: string; caminho: string; registro: string; handler: string; handler_nome: string;
  parametros_query: string[]; corpo: string | null; na_doc_v2: boolean; risco: string; executar: boolean;
  exemplo?: { http?: number };
}
interface Json { sobre: string; fonte_codigo: string; medido_em: string; total: number; rotas: Rota[] }

const RAIZ = join(import.meta.dir, "..");
const JSON_PATH = join(RAIZ, "api", "rotas.json");
const DOC_OFICIAL = "https://github.com/hacash/doc/blob/main/server/fullnode_api_doc_v2.md";

// ---------------------------------------------------------------- grupos (cada rota em exatamente 1)
interface Grupo { id: string; titulo: Record<L, string>; rotas: string[] }
const GRUPOS: Grupo[] = [
  { id: "node", titulo: { en: "Node and status", pt: "Nó e estado", zh: "节点与状态", tr: "Node ve durum" },
    rotas: ["/", "/_server_", "/status", "/pool_summary", "/vm/status"] },
  { id: "chain", titulo: { en: "Chain: height, supply, blocks, hashrate, fee", pt: "Cadeia: altura, oferta, blocos, hashrate, taxa", zh: "区块链：区块高度、供应量、区块、算力、手续费", tr: "Chain: height, supply, block, hashrate, fee" },
    rotas: ["/query/latest", "/query/supply", "/query/block/height/latest", "/block_by_height", "/query/block/intro", "/query/block/recents", "/query/block/views", "/query/block/datas", "/query/block/pools", "/query/hashrate", "/query/hashrate/logs", "/query/fee/average"] },
  { id: "account", titulo: { en: "Balance, assets, channels, transfers", pt: "Saldo, ativos, canais, transferências", zh: "余额、资产、通道、转账", tr: "Balance, asset, channel, transfer" },
    rotas: ["/query/balance", "/query/asset", "/query/channel", "/query/coin/transfer"] },
  { id: "diamond", titulo: { en: "Diamonds (HACD)", pt: "Diamantes (HACD)", zh: "钻石（HACD）", tr: "HACD" },
    rotas: ["/query/diamond", "/query/diamond/views", "/query/diamond/bidding", "/query/diamond/engrave", "/query/diamond/inscription_protocol_cost", "/query/diamond/inscription_protocol_cost/append", "/query/diamond/inscription_protocol_cost/drop", "/query/diamond/inscription_protocol_cost/edit", "/query/diamond/inscription_protocol_cost/move"] },
  { id: "tx", titulo: { en: "Transactions and simulation", pt: "Transações e simulação", zh: "交易与模拟", tr: "Transaction ve simulation" },
    rotas: ["/query/transaction", "/util/transaction/check", "/query/transaction/simulate", "/query/vm/estimate_gas", "/query/vm/simulate"] },
  { id: "contract", titulo: { en: "Contracts", pt: "Contratos", zh: "合约", tr: "Contract" },
    rotas: ["/query/contract/logs", "/query/contract/sandboxcall", "/query/contract/storage_fee"] },
  { id: "mining", titulo: { en: "Mining (read)", pt: "Mineração (leitura)", zh: "挖矿（读取）", tr: "Mining (okuma)" },
    rotas: ["/query/miner/notice", "/query/miner/pending", "/query/diamondminer/init", "/miner/pending_replay"] },
  { id: "write", titulo: { en: "Keys, signing, state change and broadcast (DO NOT RUN)", pt: "Chave, assinatura, mudança de estado e transmissão (NÃO EXECUTAR)", zh: "私钥、签名、改变状态与广播（不要执行）", tr: "Key, signing, state change ve broadcast (ÇALIŞTIRMAYIN)" },
    rotas: ["/create/account", "/create/coin/transfer", "/create/transaction", "/util/transaction/sign", "/operate/fee/raise", "/operate/contract/logs/delete", "/submit/transaction", "/submit/block", "/submit/miner/success", "/submit/diamondminer/success"] },
  { id: "debug", titulo: { en: "Debug (off by default)", pt: "Depuração (desligada por padrão)", zh: "调试（默认关闭）", tr: "Debug (varsayılan kapalı)" },
    rotas: ["/debug/contract/storage", "/debug/p2sh/scriptmh", "/debug/pool_print"] },
];

// ---------------------------------------------------------------- descrição de 1 linha por rota: [en, pt, zh, tr]
const DESC: Record<string, [string, string, string, string]> = {
  "/": ["HTML console page of the node (height, peers, transaction pool).", "Página HTML de console do nó (altura, pares, pool de transações).", "节点的 HTML console 页面（区块高度、对等节点、交易池）。", "Node'un HTML console sayfası (height, peers, transaction pool)."],
  "/_server_": ["Plain-text banner `Hacash Api Server`; shows the API server is up.", "Texto simples `Hacash Api Server`; mostra que o servidor da API está no ar.", "纯文本 `Hacash Api Server`，表明接口服务已启动。", "Düz metin `Hacash Api Server`; API server'ın çalıştığını gösterir."],
  "/status": ["Node status: height, chain id, block target seconds, uptime.", "Estado do nó: altura, id da chain, segundos-alvo por bloco, tempo no ar.", "节点状态：区块高度、chain id、出块目标秒数、uptime。", "Node durumu: height, chain id, block target seconds, uptime."],
  "/pool_summary": ["Transaction pool counters by group.", "Contadores do pool de transações por grupo.", "交易池按分组的计数。", "Gruba göre transaction pool sayıları."],
  "/vm/status": ["Whether the virtual machine is enabled, and the height.", "Se a máquina virtual está ligada, e a altura.", "虚拟机是否启用，以及区块高度。", "Virtual machine açık mı, ve height."],
  "/query/latest": ["Latest block height and number of diamonds.", "Altura do último bloco e quantidade de diamantes.", "最新区块高度与钻石数量。", "Son block height ve HACD sayısı."],
  "/query/supply": ["Supply and circulation figures at the latest height (circulation, burned, diamonds, channel totals, assets).", "Números de oferta e circulação na altura mais recente (circulação, queimado, diamantes, totais de canal, ativos).", "最新区块高度的供应量与流通数据（流通、销毁、钻石、通道合计、资产）。", "Son height'taki supply ve circulation rakamları (circulation, burned, HACD, channel toplamları, asset)."],
  "/query/block/height/latest": ["Latest block height only.", "Só a altura do último bloco.", "仅返回最新区块高度。", "Sadece son block height."],
  "/block_by_height": ["Short block summary at a height: height, hash prefix, size.", "Resumo curto do bloco numa altura: altura, prefixo do hash, tamanho.", "指定区块高度的简要信息：区块高度、哈希前缀、大小。", "Bir height'taki block özeti: height, hash prefix, size."],
  "/query/block/intro": ["Summary of one block, by height or hash; optional transaction hash list.", "Resumo de um bloco, por altura ou hash; lista de hashes de transação opcional.", "单个区块的概要（按区块高度或区块哈希）；可选交易哈希列表。", "Tek bir block'un özeti (height veya hash ile); isteğe bağlı transaction hash listesi."],
  "/query/block/recents": ["List of the most recent blocks.", "Lista dos blocos mais recentes.", "最近区块列表。", "En son block'ların listesi."],
  "/query/block/views": ["List of blocks (parameters `limit`, `page`, `start`, `desc`).", "Lista de blocos (parâmetros `limit`, `page`, `start`, `desc`).", "区块列表（参数 `limit`、`page`、`start`、`desc`）。", "Block listesi (parametreler `limit`, `page`, `start`, `desc`)."],
  "/query/block/datas": ["Raw block data from a start height (bytes; hex text with `hexbody=true`). Not JSON.", "Dados brutos de blocos a partir de uma altura (bytes; texto hex com `hexbody=true`). Não é JSON.", "从起始区块高度返回区块原始数据（字节；`hexbody=true` 时为十六进制文本）。不是 JSON。", "Başlangıç height'ından ham block verisi (bytes; `hexbody=true` ile hex metin). JSON değil."],
  "/query/block/pools": ["Block statistics per period (for example `1d`); handler `block_pool_stats_handler`.", "Estatísticas de blocos por período (por exemplo `1d`); handler `block_pool_stats_handler`.", "按周期（例如 `1d`）的区块统计；处理函数 `block_pool_stats_handler`。", "Periyoda göre block istatistikleri (örneğin `1d`); handler `block_pool_stats_handler`."],
  "/query/hashrate": ["Network hashrate: target and real-time values.", "Hashrate da rede: valor-alvo e valor em tempo real.", "全网算力：目标值与实时值。", "Network hashrate: hedef ve gerçek zamanlı değer."],
  "/query/hashrate/logs": ["Hashrate history (daily series).", "Histórico de hashrate (séries diárias).", "算力历史（按日序列）。", "Hashrate geçmişi (günlük seri)."],
  "/query/fee/average": ["Average fee estimate for a transaction size (`consumption`).", "Estimativa de taxa média para um tamanho de transação (`consumption`).", "按交易大小（`consumption`）估算平均手续费。", "Transaction boyutuna (`consumption`) göre ortalama fee tahmini."],
  "/query/balance": ["Balance of an address: HAC, diamonds, satoshi (and assets).", "Saldo de um endereço: HAC, diamantes, satoshi (e ativos).", "地址余额：HAC、钻石、satoshi（以及资产）。", "Bir address'in balance'ı: HAC, HACD, satoshi (ve asset)."],
  "/query/asset": ["Data of an asset (token) by serial: ticker, name, decimals, supply.", "Dados de um ativo (token) por serial: ticker, nome, casas decimais, oferta.", "按序号查询资产：ticker、名称、小数位、供应量。", "Serial ile asset (token) verisi: ticker, name, decimals, supply."],
  "/query/channel": ["State of a payment channel by id.", "Estado de um canal de pagamento por id.", "按 id 查询支付通道状态。", "Id ile bir payment channel'ın durumu."],
  "/query/coin/transfer": ["Transfer found at a height and transaction position (filters by sender, receiver and coin kind).", "Transferência encontrada numa altura e posição de transação (filtros por remetente, destinatário e tipo de moeda).", "按区块高度与交易位置查询转账（可按发送方、接收方、币种过滤）。", "Bir height ve transaction konumunda bulunan transfer (gönderen, alıcı ve coin türüne göre filtre)."],
  "/query/diamond": ["One diamond by name or number: owner and data.", "Um diamante por nome ou número: dono e dados.", "按名称或序号查询钻石：持有者及数据。", "İsim veya numara ile bir HACD: owner ve veri."],
  "/query/diamond/views": ["List of diamonds (parameters `limit`, `page`, `start`, `desc`, `name`).", "Lista de diamantes (parâmetros `limit`, `page`, `start`, `desc`, `name`).", "钻石列表（参数 `limit`、`page`、`start`、`desc`、`name`）。", "HACD listesi (parametreler `limit`, `page`, `start`, `desc`, `name`)."],
  "/query/diamond/bidding": ["Current diamond bids.", "Lances atuais de diamantes.", "当前钻石竞拍。", "Güncel HACD bid'leri."],
  "/query/diamond/engrave": ["Diamond inscriptions, by transaction hash or by height and transaction position.", "Inscrições em diamantes, por hash de transação ou por altura e posição.", "钻石铭刻记录（按交易哈希，或按区块高度与交易位置）。", "HACD inscription'ları (transaction hash veya height ve konum ile)."],
  "/query/diamond/inscription_protocol_cost": ["Cost of an inscription action (`action`: append, drop, edit, move).", "Custo de uma ação de inscrição (`action`: append, drop, edit, move).", "铭刻操作的费用（`action`：append、drop、edit、move）。", "Bir inscription işleminin maliyeti (`action`: append, drop, edit, move)."],
  "/query/diamond/inscription_protocol_cost/append": ["Same as `inscription_protocol_cost` with `action` fixed to append.", "Igual a `inscription_protocol_cost` com `action` fixo em append.", "与 `inscription_protocol_cost` 相同，`action` 固定为 append。", "`inscription_protocol_cost` ile aynı, `action` append'e sabit."],
  "/query/diamond/inscription_protocol_cost/drop": ["Same as `inscription_protocol_cost` with `action` fixed to drop.", "Igual a `inscription_protocol_cost` com `action` fixo em drop.", "与 `inscription_protocol_cost` 相同，`action` 固定为 drop。", "`inscription_protocol_cost` ile aynı, `action` drop'a sabit."],
  "/query/diamond/inscription_protocol_cost/edit": ["Same as `inscription_protocol_cost` with `action` fixed to edit.", "Igual a `inscription_protocol_cost` com `action` fixo em edit.", "与 `inscription_protocol_cost` 相同，`action` 固定为 edit。", "`inscription_protocol_cost` ile aynı, `action` edit'e sabit."],
  "/query/diamond/inscription_protocol_cost/move": ["Same as `inscription_protocol_cost` with `action` fixed to move (needs `to`).", "Igual a `inscription_protocol_cost` com `action` fixo em move (exige `to`).", "与 `inscription_protocol_cost` 相同，`action` 固定为 move（需要 `to`）。", "`inscription_protocol_cost` ile aynı, `action` move'a sabit (`to` gerekir)."],
  "/query/transaction": ["One transaction by hash: block, fee, and optionally actions, signature and description.", "Uma transação por hash: bloco, taxa e, opcionalmente, ações, assinatura e descrição.", "按哈希查询交易：所在区块、手续费，可选动作、签名与描述。", "Hash ile bir transaction: block, fee ve isteğe bağlı action, signature, description."],
  "/util/transaction/check": ["Checks a transaction sent in hex (POST); does not broadcast.", "Confere uma transação enviada em hex (POST); não transmite.", "检查以十六进制 POST 的交易；不广播。", "Hex gönderilen transaction'ı kontrol eder (POST); broadcast etmez."],
  "/query/transaction/simulate": ["Simulates a transaction sent in hex (POST) and reports the result; does not broadcast.", "Simula uma transação enviada em hex (POST) e informa o resultado; não transmite.", "模拟以十六进制 POST 的交易并返回结果；不广播。", "Hex gönderilen transaction'ı simüle eder (POST) ve sonucu bildirir; broadcast etmez."],
  "/query/vm/estimate_gas": ["Same handler as `/query/transaction/simulate` (gas estimate path); POST, does not broadcast.", "Mesmo handler de `/query/transaction/simulate` (caminho da estimativa de gas); POST, não transmite.", "与 `/query/transaction/simulate` 为同一处理函数（gas 估算路径）；POST，不广播。", "`/query/transaction/simulate` ile aynı handler (gas estimate yolu); POST, broadcast etmez."],
  "/query/vm/simulate": ["Same handler as `/query/transaction/simulate` (VM simulation path); POST, does not broadcast.", "Mesmo handler de `/query/transaction/simulate` (caminho da simulação da VM); POST, não transmite.", "与 `/query/transaction/simulate` 为同一处理函数（虚拟机模拟路径）；POST，不广播。", "`/query/transaction/simulate` ile aynı handler (VM simulation yolu); POST, broadcast etmez."],
  "/query/contract/logs": ["Contract logs by height, index and address.", "Logs de contrato por altura, índice e endereço.", "按区块高度、索引与地址查询合约日志。", "Height, index ve address ile contract log'ları."],
  "/query/contract/sandboxcall": ["Calls a contract function in a sandbox (`contract`, `function`, `params`, `caller`, `gas_max`).", "Chama uma função de contrato num sandbox (`contract`, `function`, `params`, `caller`, `gas_max`).", "在 sandbox 中调用合约函数（`contract`、`function`、`params`、`caller`、`gas_max`）。", "Bir contract function'ı sandbox'ta çağırır (`contract`, `function`, `params`, `caller`, `gas_max`)."],
  "/query/contract/storage_fee": ["Contract storage fee rules and the fee for `charge_bytes`.", "Regras da taxa de armazenamento de contrato e o valor para `charge_bytes`.", "合约存储费用规则，及 `charge_bytes` 对应的费用。", "Contract storage fee kuralları ve `charge_bytes` için fee."],
  "/query/miner/notice": ["Long-poll: waits for news after `height` (up to `wait`).", "Long-poll: espera novidade depois de `height` (até `wait`).", "long-poll：在 `height` 之后等待新区块（最长 `wait`）。", "Long-poll: `height` sonrası yenilik bekler (en fazla `wait`)."],
  "/query/miner/pending": ["Pending work for miners; answers an error when mining is off.", "Trabalho pendente para mineradores; responde erro com a mineração desligada.", "矿工的待处理任务；挖矿关闭时返回错误。", "Miner'lar için bekleyen iş; mining kapalıyken hata döner."],
  "/query/diamondminer/init": ["Initial data for a diamond miner; answers an error when mining is off.", "Dados iniciais para minerador de diamantes; responde erro com a mineração desligada.", "钻石挖矿的初始数据；挖矿关闭时返回错误。", "HACD miner için başlangıç verisi; mining kapalıyken hata döner."],
  "/miner/pending_replay": ["Count of pending replay items of the miner (`pending_replay`).", "Contagem de itens de replay pendentes do minerador (`pending_replay`).", "矿工待重放项的数量（`pending_replay`）。", "Miner'ın bekleyen replay öğe sayısı (`pending_replay`)."],
  "/create/account": ["Creates an account and RETURNS A PRIVATE KEY in the body.", "Cria uma conta e DEVOLVE UMA CHAVE PRIVADA no corpo.", "创建账户，并在响应体中返回私钥。", "Hesap oluşturur ve body'de PRIVATE KEY DÖNDÜRÜR."],
  "/create/coin/transfer": ["Builds a transfer; takes a private key in the query string.", "Monta uma transferência; recebe chave privada na query string.", "构建转账；在 query 中接收私钥。", "Transfer oluşturur; query string'de private key alır."],
  "/create/transaction": ["Builds a transaction from the POST body.", "Monta uma transação a partir do corpo do POST.", "根据 POST 请求体构建交易。", "POST body'den transaction oluşturur."],
  "/util/transaction/sign": ["Signs a transaction; takes a private key.", "Assina uma transação; recebe chave privada.", "对交易签名；接收私钥。", "Transaction'ı imzalar; private key alır."],
  "/operate/fee/raise": ["Raises the fee of a transaction; takes a fee private key.", "Aumenta a taxa de uma transação; recebe a chave privada da taxa.", "提高交易手续费；接收手续费私钥。", "Transaction fee'sini artırır; fee private key alır."],
  "/operate/contract/logs/delete": ["Deletes contract logs (parameters `height`, `auth`); changes node state.", "Apaga logs de contrato (parâmetros `height`, `auth`); muda o estado do nó.", "删除合约日志（参数 `height`、`auth`）；会改变节点状态。", "Contract log'larını siler (parametreler `height`, `auth`); node durumunu değiştirir."],
  "/submit/transaction": ["Broadcasts a transaction to the network (POST).", "Transmite uma transação à rede (POST).", "向网络广播交易（POST）。", "Transaction'ı ağa broadcast eder (POST)."],
  "/submit/block": ["Submits a block to the node (POST).", "Envia um bloco ao nó (POST).", "向节点提交区块（POST）。", "Node'a block gönderir (POST)."],
  "/submit/miner/success": ["Mining result (nonces) submitted by a miner.", "Resultado de mineração (nonces) enviado por um minerador.", "矿工提交的挖矿结果（nonce）。", "Miner'ın gönderdiği mining sonucu (nonce)."],
  "/submit/diamondminer/success": ["Diamond mining result submitted by a miner (POST).", "Resultado de mineração de diamante enviado por um minerador (POST).", "矿工提交的钻石挖矿结果（POST）。", "Miner'ın gönderdiği HACD mining sonucu (POST)."],
  "/debug/contract/storage": ["Debug: reads contract storage (`contract`, `key`, `kind`).", "Depuração: lê o armazenamento de um contrato (`contract`, `key`, `kind`).", "调试：读取合约存储（`contract`、`key`、`kind`）。", "Debug: contract storage okur (`contract`, `key`, `kind`)."],
  "/debug/p2sh/scriptmh": ["Debug: P2SH script route (`lockbox`, `codeconf`, `libs`).", "Depuração: rota de script P2SH (`lockbox`, `codeconf`, `libs`).", "调试：P2SH 脚本接口（`lockbox`、`codeconf`、`libs`）。", "Debug: P2SH script route'u (`lockbox`, `codeconf`, `libs`)."],
  "/debug/pool_print": ["Debug: prints the transaction pool.", "Depuração: imprime o pool de transações.", "调试：打印交易池。", "Debug: transaction pool'u yazdırır."],
};

// ---------------------------------------------------------------- textos fixos por língua
interface Ui {
  titulo: string; outras: string; intro: (n: { total: number; versao: string; commit: string; data: string; montadas: number; nao: number; chamadas: number }) => string;
  cab: string[]; sim: string; nao: string; naoExecutar: string; body: string;
  seguro: Record<"r0get" | "r0post" | "r1" | "r4" | "r5", string>;
  legendaTitulo: string; risco: Record<string, string>; rodape: string[];
}
const UI: Record<L, Ui> = {
  en: {
    titulo: "Hacash node API: route map",
    outras: "Other languages",
    intro: (n) => `Map of the ${n.total} HTTP routes of the Hacash fullnode ${n.versao} (commit \`${n.commit}\`), generated from [\`rotas.json\`](rotas.json) and measured on ${n.data}. With \`debug_routes = false\` (default) ${n.montadas} are mounted. ${n.nao} routes are marked **DO NOT RUN**: they create or receive a private key, sign, change state or broadcast, and were not called. The other ${n.chamadas} were called against a local node. The API answers HTTP 200 even on error; the error comes in the body as \`{"ret":1,"err":"..."}\`.`,
    cab: ["route", "method", "parameters", "what it returns", "Rust handler (file:line)", "in the official docs?", "safe to call?"],
    sim: "yes", nao: "no", naoExecutar: "**DO NOT RUN**", body: "POST body: transaction or block, hex",
    seguro: { r0get: "yes · R0 read", r0post: "yes · R0 (POST only simulates or checks)", r1: "yes · R1 read, long wait", r4: "yes · R4 read; error if mining is off", r5: "debug · R5; off by default (404)" },
    legendaTitulo: "Risk classes", risco: { R0: "read", R1: "read with a long wait", R2: "involves a private key", R3: "changes state or broadcasts", R4: "mining", R5: "debugging" },
    rodape: [`Official documentation: [fullnode_api_doc_v2.md](${DOC_OFICIAL}). It describes the parameters of the documented routes better than this table.`, "This file is generated by `scripts/gerar-mapa-rotas.ts` from `api/rotas.json`. To change it, edit the JSON or the script, then run `bun scripts/gerar-mapa-rotas.ts`; `--check` fails if a file is out of date."],
  },
  pt: {
    titulo: "API do nó Hacash: mapa de rotas",
    outras: "Outras línguas",
    intro: (n) => `Mapa das ${n.total} rotas HTTP do fullnode ${n.versao} da Hacash (commit \`${n.commit}\`), gerado de [\`rotas.json\`](rotas.json) e medido em ${n.data}. Com \`debug_routes = false\` (padrão) ficam ${n.montadas} montadas. ${n.nao} rotas estão marcadas **NÃO EXECUTAR**: criam ou recebem chave privada, assinam, mudam estado ou transmitem, e não foram chamadas. As outras ${n.chamadas} foram chamadas contra um nó local. A API responde HTTP 200 mesmo em erro; o erro vem no corpo como \`{"ret":1,"err":"..."}\`.`,
    cab: ["rota", "método", "parâmetros", "o que devolve", "handler Rust (arquivo:linha)", "está na doc oficial?", "seguro de chamar?"],
    sim: "sim", nao: "não", naoExecutar: "**NÃO EXECUTAR**", body: "corpo do POST: transação ou bloco em hex",
    seguro: { r0get: "sim · R0 leitura", r0post: "sim · R0 (o POST só simula ou confere)", r1: "sim · R1 leitura com espera longa", r4: "sim · R4 leitura; dá erro com a mineração desligada", r5: "depuração · R5; desligada por padrão (404)" },
    legendaTitulo: "Classes de risco", risco: { R0: "leitura", R1: "leitura com espera longa", R2: "envolve chave privada", R3: "muda estado ou transmite", R4: "mineração", R5: "depuração" },
    rodape: [`Documentação oficial: [fullnode_api_doc_v2.md](${DOC_OFICIAL}). Ela descreve os parâmetros das rotas documentadas melhor que esta tabela.`, "Este arquivo é gerado por `scripts/gerar-mapa-rotas.ts` a partir de `api/rotas.json`. Para mudar, edite o JSON ou o script e rode `bun scripts/gerar-mapa-rotas.ts`; `--check` falha se algum arquivo estiver desatualizado."],
  },
  zh: {
    titulo: "Hacash 节点接口：路由表",
    outras: "其他语言",
    intro: (n) => `Hacash 全节点 ${n.versao}（commit \`${n.commit}\`）共 ${n.total} 个 HTTP 接口路由，由 [\`rotas.json\`](rotas.json) 生成，测量日期 ${n.data}。默认 \`debug_routes = false\` 时挂载 ${n.montadas} 个。${n.nao} 个路由标记为**不要执行**：它们创建或接收私钥、签名、改变状态或广播，未被调用。其余 ${n.chamadas} 个已在本地节点上调用。接口即使出错也返回 HTTP 200；错误在响应体中，形如 \`{"ret":1,"err":"..."}\`。`,
    cab: ["路由", "方法", "参数", "返回内容", "Rust 处理函数（文件:行）", "官方文档中有吗？", "可以安全调用吗？"],
    sim: "有", nao: "无", naoExecutar: "**不要执行**", body: "POST 请求体：十六进制的交易或区块",
    seguro: { r0get: "是 · R0 读取", r0post: "是 · R0（POST 仅模拟或检查）", r1: "是 · R1 读取，等待较久", r4: "是 · R4 读取；挖矿关闭时返回错误", r5: "调试 · R5；默认关闭（404）" },
    legendaTitulo: "风险等级", risco: { R0: "读取", R1: "读取，等待较久", R2: "涉及私钥", R3: "改变状态或广播", R4: "挖矿", R5: "调试" },
    rodape: [`官方文档：[fullnode_api_doc_v2.md](${DOC_OFICIAL})。对已有文档的路由，其参数说明比本表更完整。`, "本文件由 `scripts/gerar-mapa-rotas.ts` 根据 `api/rotas.json` 生成。如需修改，请改 JSON 或脚本，然后运行 `bun scripts/gerar-mapa-rotas.ts`；`--check` 在文件过期时失败。", "Assisted translation; review by native speakers is welcome via issue or PR. 机器辅助翻译；欢迎母语者通过 issue 或 PR 审校。"],
  },
  tr: {
    titulo: "Hacash node API: route haritası",
    outras: "Diğer diller",
    intro: (n) => `Hacash fullnode ${n.versao} (commit \`${n.commit}\`) için ${n.total} HTTP route'unun haritası; [\`rotas.json\`](rotas.json) dosyasından üretildi, ölçüm tarihi ${n.data}. \`debug_routes = false\` (varsayılan) iken ${n.montadas} route mount edilir. ${n.nao} route **ÇALIŞTIRMAYIN** olarak işaretli: private key üretir veya alır, imzalar, state değiştirir ya da broadcast eder; çağrılmadılar. Diğer ${n.chamadas} route yerel bir node'a karşı çağrıldı. API hata durumunda da HTTP 200 döner; hata body içinde \`{"ret":1,"err":"..."}\` biçiminde gelir.`,
    cab: ["route", "method", "parametreler", "ne döndürür", "Rust handler (dosya:satır)", "resmi dokümanda var mı?", "çağırmak güvenli mi?"],
    sim: "evet", nao: "hayır", naoExecutar: "**ÇALIŞTIRMAYIN**", body: "POST body: hex transaction veya block",
    seguro: { r0get: "evet · R0 okuma", r0post: "evet · R0 (POST sadece simüle eder veya kontrol eder)", r1: "evet · R1 okuma, uzun bekleme", r4: "evet · R4 okuma; mining kapalıyken hata döner", r5: "debug · R5; varsayılan kapalı (404)" },
    legendaTitulo: "Risk sınıfları", risco: { R0: "okuma", R1: "uzun beklemeli okuma", R2: "private key içerir", R3: "state değiştirir veya broadcast eder", R4: "mining", R5: "debug" },
    rodape: [`Resmi doküman: [fullnode_api_doc_v2.md](${DOC_OFICIAL}). Dokümante edilmiş route'ların parametrelerini bu tablodan daha iyi anlatır.`, "Bu dosya `api/rotas.json` içinden `scripts/gerar-mapa-rotas.ts` ile üretilir. Değiştirmek için JSON'u veya script'i düzenleyin ve `bun scripts/gerar-mapa-rotas.ts` çalıştırın; `--check` güncel olmayan dosyada hata verir.", "Assisted translation; review by native speakers is welcome via issue or PR. Yardımlı çeviri; ana dili konuşanların issue veya PR ile yapacağı inceleme memnuniyetle karşılanır."],
  },
};

// ---------------------------------------------------------------- geração
function carregar(): Json {
  const j = JSON.parse(readFileSync(JSON_PATH, "utf-8")) as Json;
  const falta: string[] = [];
  const todas = new Set(j.rotas.map((r) => r.caminho));
  const noGrupo = GRUPOS.flatMap((g) => g.rotas);
  for (const c of todas) if (!noGrupo.includes(c)) falta.push(`sem grupo: ${c}`);
  for (const c of noGrupo) if (!todas.has(c)) falta.push(`grupo cita rota que não está no JSON: ${c}`);
  if (new Set(noGrupo).size !== noGrupo.length) falta.push("rota repetida em grupos");
  for (const c of todas) if (!DESC[c] || DESC[c].some((t) => !t || !t.trim())) falta.push(`sem descrição nas 4 línguas: ${c}`);
  for (const c of Object.keys(DESC)) if (!todas.has(c)) falta.push(`descrição de rota que não está no JSON: ${c}`);
  if (j.rotas.length !== j.total) falta.push(`JSON diz total=${j.total}, mas tem ${j.rotas.length} rotas`);
  if (falta.length) { console.error("ERRO:\n  " + falta.join("\n  ")); process.exit(2); }
  return j;
}

const celula = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

function seguroDe(r: Rota, u: Ui): string {
  if (!r.executar) return u.naoExecutar;
  if (r.risco === "R1") return u.seguro.r1;
  if (r.risco === "R4") return u.seguro.r4;
  if (r.risco === "R5") return u.seguro.r5;
  return r.metodo === "POST" ? u.seguro.r0post : u.seguro.r0get;
}

function gerar(j: Json, lang: L): string {
  const u = UI[lang];
  const idx = LANGS.indexOf(lang);
  const versao = (/fullnode\s+(\d+\.\d+\.\d+)/.exec(j.sobre) ?? [])[1] ?? "?";
  const commitCompleto = (/tree\/([0-9a-f]{40})/.exec(j.fonte_codigo) ?? [])[1] ?? "";
  const base = j.fonte_codigo.replace("/tree/", "/blob/");
  const nao = j.rotas.filter((r) => !r.executar).length;
  const montadas = j.total - j.rotas.filter((r) => r.risco === "R5").length;
  const data = j.medido_em.slice(0, 10);
  const porCaminho = new Map(j.rotas.map((r) => [r.caminho, r]));
  const out: string[] = [];
  out.push(`# ${u.titulo}`, "");
  out.push(`${u.outras}: ` + LANGS.filter((l) => l !== lang).map((l) => `[${NOME[l]}](${ARQUIVO[l]})`).join(" · "), "");
  out.push(u.intro({ total: j.total, versao, commit: commitCompleto.slice(0, 8), data, montadas, nao, chamadas: j.total - nao }), "");
  out.push(`**${u.legendaTitulo}:** ` + Object.keys(u.risco).map((k) => `${k} ${u.risco[k]}`).join(" · "), "");
  for (const g of GRUPOS) {
    out.push(`## ${g.titulo[lang]}`, "");
    out.push(`| ${u.cab.join(" | ")} |`, `|${u.cab.map(() => "---").join("|")}|`);
    for (const c of g.rotas) {
      const r = porCaminho.get(c)!;
      const params = [r.parametros_query.length ? r.parametros_query.map((p) => `\`${p}\``).join(", ") : "", r.corpo ? u.body : ""].filter(Boolean).join("; ") || "—";
      const m = /^(.+?):(\d+)(.*)$/.exec(r.handler);
      const handler = m ? `[\`${m[1]}:${m[2]}\`](${base}/${m[1]}#L${m[2]})${m[3]}` : `\`${r.handler}\``;
      out.push("| " + [`\`${r.caminho}\``, r.metodo, params, DESC[c][idx], handler, r.na_doc_v2 ? u.sim : u.nao, seguroDe(r, u)].map(celula).join(" | ") + " |");
    }
    out.push("");
  }
  for (const linha of u.rodape) out.push(linha, "");
  return out.join("\n").replace(/\n+$/, "\n");
}

function main() {
  const check = process.argv.includes("--check");
  const j = carregar();
  let ruim = 0;
  for (const lang of LANGS) {
    const caminho = join(RAIZ, "api", ARQUIVO[lang]);
    const novo = gerar(j, lang);
    const linhas = novo.split("\n").filter((l) => l.startsWith("| `/")).length;
    if (check) {
      const atual = existsSync(caminho) ? readFileSync(caminho, "utf-8") : null;
      if (atual !== novo) { ruim++; console.error(`DESATUALIZADO: api/${ARQUIVO[lang]}`); }
      else console.log(`ok  api/${ARQUIVO[lang]}: ${linhas} rotas`);
    } else {
      writeFileSync(caminho, novo);
      console.log(`escrito api/${ARQUIVO[lang]}: ${linhas} rotas`);
    }
  }
  if (check && ruim) { console.error(`${ruim} arquivo(s) fora de sincronia com api/rotas.json; rode: bun scripts/gerar-mapa-rotas.ts`); process.exit(1); }
}
main();
