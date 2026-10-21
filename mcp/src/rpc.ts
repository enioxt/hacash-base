/**
 * rpc.ts — cliente HTTP do RPC do fullnode Hacash. SOMENTE LEITURA por construção:
 *  - só GET, só as 8 rotas de ROTAS_LEITURA (lista fechada; qualquer outra rota é recusada antes de abrir conexão);
 *  - 1 chamada por vez (fila), 1 tentativa por chamada (sem retry), timeout de 10 s cobrindo conexão e corpo;
 *  - corpo limitado a 1 MiB; URL do nó validada (http/https, sem credencial, sem query, sem fragmento).
 * O nó responde HTTP 200 com {"ret":1,"err":"..."} em erro de negócio (hacash/fullnode mint/src/api/util/request.rs:86-88);
 * isto vira ErroHacash("no_recusou" | "nao_encontrado").
 */

/** Porta HTTP padrão do fullnode: hacash/fullnode config.md:90 (`listen_port` do servidor HTTP = 8082; HTTP vem desligado, `server.enable`). */
export const PADRAO_RPC_URL = "http://127.0.0.1:8082";
export const TIMEOUT_MS = 10_000;
export const MAX_CORPO_BYTES = 1024 * 1024;

/** As únicas rotas que este pacote chama. Registro das rotas: hacash/fullnode mint/src/api/mod.rs:78-82,106,110,115. */
export const ROTAS_LEITURA = [
  "/query/latest",
  "/query/supply",
  "/query/balance",
  "/query/diamond",
  "/query/transaction",
  "/query/block/intro",
  "/query/asset",
  "/query/channel",
] as const;
export type RotaLeitura = (typeof ROTAS_LEITURA)[number];

export type CodigoErro =
  | "rota_proibida"
  | "no_inacessivel"
  | "timeout"
  | "http"
  | "resposta_invalida"
  | "resposta_grande"
  | "no_recusou"
  | "nao_encontrado";

export class ErroHacash extends Error {
  constructor(
    public readonly codigo: CodigoErro,
    mensagem: string,
    public readonly extra: Record<string, unknown> = {},
  ) {
    super(mensagem);
    this.name = "ErroHacash";
  }
}

export type Config = { baseUrl: string; timeoutMs: number };

export function lerConfig(env: Record<string, string | undefined> = process.env): Config {
  const bruto = (env.HACASH_RPC_URL ?? "").trim();
  if (!bruto) return { baseUrl: PADRAO_RPC_URL, timeoutMs: TIMEOUT_MS };
  let u: URL;
  try {
    u = new URL(bruto);
  } catch {
    throw new Error("HACASH_RPC_URL inválida: use http(s)://host:porta (o valor não é repetido aqui porque pode conter segredo)");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("HACASH_RPC_URL inválida: só http ou https");
  if (u.username || u.password) throw new Error("HACASH_RPC_URL inválida: sem usuário/senha na URL");
  if (u.search || u.hash) throw new Error("HACASH_RPC_URL inválida: sem query nem fragmento (token na URL fica em log e em histórico)");
  return { baseUrl: u.origin + u.pathname.replace(/\/+$/, ""), timeoutMs: TIMEOUT_MS };
}

const NAO_ENCONTRADO = new Set([
  "cannot find diamond", // query/diamond.rs:30-35,49-54,59-64
  "transaction not found", // query/tx.rs:97
  "transaction not found in the block", // query/tx.rs:114
  "cannot find block by transaction ptr", // query/tx.rs:106
  "block query failed: block not found", // query/block.rs:19 + util/block.rs:106
  "channel not found", // query/channel.rs:35
]);

type Opcoes = { baseUrl: string; timeoutMs?: number; fetchImpl?: typeof fetch };

export class ClienteRpc {
  readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;
  private fila: Promise<unknown> = Promise.resolve();

  constructor(o: Opcoes) {
    this.baseUrl = o.baseUrl;
    this.timeoutMs = o.timeoutMs ?? TIMEOUT_MS;
    this.fetchImpl = o.fetchImpl ?? fetch;
  }

  /** GET numa das rotas de leitura (ROTAS_LEITURA). Serializa: a próxima só começa quando a anterior termina (ou falha). */
  get(rota: string, consulta: Record<string, string>): Promise<Record<string, unknown>> {
    if (!(ROTAS_LEITURA as readonly string[]).includes(rota)) {
      return Promise.reject(new ErroHacash("rota_proibida", "rota fora da lista de leitura deste servidor", { rota }));
    }
    const rodar = () => this.executar(rota, consulta);
    const p = this.fila.then(rodar, rodar);
    this.fila = p.catch(() => undefined);
    return p;
  }

  /**
   * UM prazo total por chamada (conexão + corpo), imposto por Promise.race: o AbortSignal derruba o fetch, mas não
   * garante interromper um leitor de corpo já obtido (achado de revisão). Ao estourar, o prazo cancela o leitor
   * e aborta o fetch, e rejeita com erro explícito. Assim a promessa SEMPRE assenta em ≤ timeoutMs e a fila não prende.
   */
  private async executar(rota: string, consulta: Record<string, string>): Promise<Record<string, unknown>> {
    const url = new URL(this.baseUrl + rota);
    for (const [k, v] of Object.entries(consulta)) url.searchParams.set(k, v);
    const no = this.baseUrl;
    const ctl = new AbortController();
    const estado: { fase: "conexao" | "corpo"; leitor?: ReadableStreamDefaultReader<Uint8Array> } = { fase: "conexao" };
    let timer: ReturnType<typeof setTimeout> | undefined;
    const prazo = new Promise<never>((_, rejeitar) => {
      timer = setTimeout(() => {
        void estado.leitor?.cancel().catch(() => undefined);
        ctl.abort();
        const s = this.timeoutMs / 1000;
        rejeitar(
          new ErroHacash("timeout", estado.fase === "corpo" ? `tempo esgotado lendo o corpo da resposta do nó (${s} s)` : `o nó não respondeu em ${s} s`, { no }),
        );
      }, this.timeoutMs);
    });
    const trabalho = this.buscar(url, no, ctl, estado);
    trabalho.catch(() => undefined); // se o prazo vencer, a falha tardia do trabalho não vira rejeição sem dono
    try {
      return await Promise.race([trabalho, prazo]);
    } finally {
      clearTimeout(timer);
    }
  }

  private async buscar(
    url: URL,
    no: string,
    ctl: AbortController,
    estado: { fase: "conexao" | "corpo"; leitor?: ReadableStreamDefaultReader<Uint8Array> },
  ): Promise<Record<string, unknown>> {
    let resp: Response;
    try {
      resp = await this.fetchImpl(url, { method: "GET", signal: ctl.signal, headers: { accept: "application/json" }, redirect: "error" });
    } catch {
      throw new ErroHacash("no_inacessivel", "não consegui falar com o nó (fora do ar, porta fechada ou HTTP desligado: server.enable)", { no });
    }
    if (resp.status !== 200) {
      await resp.body?.cancel().catch(() => undefined);
      throw new ErroHacash("http", `o nó respondeu HTTP ${resp.status}`, { no, status: resp.status });
    }
    estado.fase = "corpo";
    const texto = await this.lerCorpo(resp, no, estado);
    let corpo: unknown;
    try {
      corpo = JSON.parse(texto);
    } catch {
      throw new ErroHacash("resposta_invalida", "a resposta do nó não é JSON", { no });
    }
    if (typeof corpo !== "object" || corpo === null || Array.isArray(corpo) || typeof (corpo as { ret?: unknown }).ret !== "number") {
      throw new ErroHacash("resposta_invalida", "a resposta do nó não tem o campo numérico `ret`", { no });
    }
    const obj = corpo as Record<string, unknown>;
    if (obj.ret !== 0) {
      const errBruto = typeof obj.err === "string" ? obj.err : "(sem mensagem)";
      // Só código e mensagem curta chegam ao cliente: o texto do nó é limitado e sem caracteres de controle.
      const err = errBruto.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 120);
      const codigo: CodigoErro = NAO_ENCONTRADO.has(err) ? "nao_encontrado" : "no_recusou";
      throw new ErroHacash(codigo, `o nó recusou a consulta: ${err}`, { no, mensagem_do_no: err, ...(err === "state changed" ? { transitorio: true } : {}) });
    }
    return obj;
  }

  private async lerCorpo(resp: Response, no: string, estado: { leitor?: ReadableStreamDefaultReader<Uint8Array> }): Promise<string> {
    const leitor = resp.body?.getReader();
    if (!leitor) return "";
    estado.leitor = leitor; // o prazo total cancela este leitor se estourar
    const partes: Uint8Array[] = [];
    let total = 0;
    try {
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_CORPO_BYTES) {
          await leitor.cancel().catch(() => undefined);
          throw new ErroHacash("resposta_grande", `a resposta do nó passou de ${MAX_CORPO_BYTES} bytes`, { no });
        }
        partes.push(value);
      }
    } catch (e) {
      if (e instanceof ErroHacash) throw e;
      throw new ErroHacash("no_inacessivel", "a conexão com o nó caiu no meio da resposta", { no });
    }
    return new TextDecoder().decode(Buffer.concat(partes));
  }
}
