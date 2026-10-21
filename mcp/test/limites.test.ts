/**
 * limites.test.ts — o que o servidor NÃO faz e como falha:
 *  L1 somente leitura (8 ferramentas, readOnlyHint, só GET, só as 8 rotas, nada de rota de escrita no código)
 *  L2 nó fora do ar / lento / lixo na resposta → erro explícito, sem retry
 *  L3 1 chamada por vez
 *  L4 configuração (HACASH_RPC_URL)
 */
import { afterEach, describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ClienteRpc, PADRAO_RPC_URL, ROTAS_LEITURA, lerConfig, TIMEOUT_MS } from "../src/rpc.ts";
import { ALTURA, ATIVO, BLOCO, CANAL, DIAMANTE, SALDO, SUPPLY, TRANSACAO, ENDERECO, HASH_TX } from "./fixtures.ts";
import { chamar, conectar, servidorFalso } from "./ajuda.ts";

const parar: (() => void)[] = [];
afterEach(() => { while (parar.length) parar.pop()!(); });
const falso = (rotas: Parameters<typeof servidorFalso>[0]) => { const s = servidorFalso(rotas); parar.push(s.parar); return s; };
const TODAS = { "/query/latest": { corpo: ALTURA }, "/query/supply": { corpo: SUPPLY }, "/query/balance": { corpo: SALDO }, "/query/diamond": { corpo: DIAMANTE }, "/query/transaction": { corpo: TRANSACAO }, "/query/block/intro": { corpo: BLOCO }, "/query/asset": { corpo: ATIVO }, "/query/channel": { corpo: CANAL } };

describe("L1 somente leitura", () => {
  it("lista exatamente as 8 ferramentas, todas readOnlyHint e sem openWorld de escrita", async () => {
    const s = falso(TODAS);
    const c = await conectar(s.url);
    const { tools } = await c.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(["hacash_altura", "hacash_ativo", "hacash_bloco", "hacash_canal", "hacash_diamante", "hacash_saldo", "hacash_supply", "hacash_transacao"]);
    for (const t of tools) {
      expect(t.annotations?.readOnlyHint).toBe(true);
      expect(t.annotations?.destructiveHint).not.toBe(true);
    }
  });
  it("chamando as 8, o nó só vê GET nas 8 rotas de leitura, uma vez cada", async () => {
    const s = falso(TODAS);
    const c = await conectar(s.url);
    await chamar(c, "hacash_altura");
    await chamar(c, "hacash_supply");
    await chamar(c, "hacash_saldo", { endereco: ENDERECO });
    await chamar(c, "hacash_diamante", { nome: "WTYUIA" });
    await chamar(c, "hacash_transacao", { hash: HASH_TX });
    await chamar(c, "hacash_bloco", { altura: 583881 });
    await chamar(c, "hacash_ativo", { serial: 2000 });
    await chamar(c, "hacash_canal", { id: CANAL.id });
    expect(s.vistos.map((v) => `${v.metodo} ${v.caminho}`)).toEqual([
      "GET /query/latest", "GET /query/supply", "GET /query/balance", "GET /query/diamond", "GET /query/transaction",
      "GET /query/block/intro", "GET /query/asset", "GET /query/channel",
    ]);
    expect([...ROTAS_LEITURA].sort()).toEqual(["/query/asset", "/query/balance", "/query/block/intro", "/query/channel", "/query/diamond", "/query/latest", "/query/supply", "/query/transaction"]);
  });
  it("o cliente RPC recusa, sem abrir conexão, qualquer rota fora das 8 (escrita, conta, assinatura, admin)", async () => {
    const s = falso({ "/create/account": { corpo: { ret: 0 } } });
    const rpc = new ClienteRpc({ baseUrl: s.url });
    for (const rota of ["/create/account", "/util/transaction/sign", "/submit/transaction", "/submit/block", "/create/transaction", "/operate/fee/raise", "/query/latest/../../create/account", "/query/latest?x=1", "//evil/query/latest"]) {
      await expect(rpc.get(rota, {})).rejects.toMatchObject({ codigo: "rota_proibida" });
    }
    expect(s.vistos.length).toBe(0);
  });
  it("o código-fonte do pacote não cita rota de escrita nem manuseia chave/assinatura/POST", () => {
    const dir = join(import.meta.dir, "..", "src");
    const proibidos = [/\/create\//, /\/submit\//, /\/util\/transaction/, /\/operate\//, /\/miner\//, /method:\s*["']POST/i, /private_?key/i, /\bsign(ing)?\b.*key/i, /mnemonic|\bseed\b/i];
    for (const f of readdirSync(dir).filter((n) => n.endsWith(".ts"))) {
      const src = readFileSync(join(dir, f), "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("/*"));
      for (const re of proibidos) expect(src.some((l) => re.test(l))).toBe(false);
    }
  });
});

describe("L2 falhas do nó viram erro explícito, sem retry", () => {
  it("nó fora do ar → no_inacessivel", async () => {
    const s = falso({}); const url = s.url; s.parar(); // porta fechada
    const c = await conectar(url);
    const r = await chamar(c, "hacash_altura");
    expect(r.erro).toBe(true);
    expect(r.json).toMatchObject({ erro: "no_inacessivel" });
  });
  it("nó lento → timeout, 1 tentativa só", async () => {
    const s = falso({ "/query/latest": { corpo: ALTURA, atrasoMs: 400 } });
    const c = await conectar(s.url, 60);
    const t0 = Date.now();
    const r = await chamar(c, "hacash_altura");
    expect(r.json).toMatchObject({ erro: "timeout" });
    expect(Date.now() - t0).toBeLessThan(350);
    expect(s.vistos.length).toBe(1);
  });
  it("o timeout padrão é de 10 s", () => { expect(TIMEOUT_MS).toBe(10_000); });
  it("HTTP 500 → http, com o status; 404 também (rota desabilitada no nó)", async () => {
    const s = falso({ "/query/latest": { status: 500, corpo: "x" } });
    const c = await conectar(s.url);
    expect((await chamar(c, "hacash_altura")).json).toMatchObject({ erro: "http", status: 500 });
    expect((await chamar(c, "hacash_supply")).json).toMatchObject({ erro: "http", status: 404 });
    expect(s.vistos.length).toBe(2);
  });
  it("corpo que não é JSON → resposta_invalida", async () => {
    const s = falso({ "/query/latest": { corpo: null, bruto: "<html>proxy</html>" } });
    const c = await conectar(s.url);
    expect((await chamar(c, "hacash_altura")).json).toMatchObject({ erro: "resposta_invalida" });
  });
  it("corpo gigante (> 1 MiB) → resposta_grande, sem ler tudo", async () => {
    const s = falso({ "/query/latest": { corpo: null, bruto: JSON.stringify({ ret: 0, lixo: "x".repeat(1_200_000) }) } });
    const c = await conectar(s.url);
    expect((await chamar(c, "hacash_altura")).json).toMatchObject({ erro: "resposta_grande" });
  });
  it("a mensagem de erro não vaza credencial da URL nem o caminho de rede interno além da origem", async () => {
    const s = falso({}); const url = s.url; s.parar();
    const c = await conectar(url);
    const r = await chamar(c, "hacash_altura");
    expect(r.texto).not.toContain("@");
    expect(r.json.no).toBe(url);
  });
});

describe("L2c erro do nó repassado ao cliente", () => {
  it("mensagem do nó é cortada em 120 caracteres e sem caracteres de controle; nada do corpo além disso", async () => {
    const longo = "x".repeat(500) + "\n\u0007fim";
    const s = falso({ "/query/latest": { corpo: { ret: 1, err: longo, segredo: "NAO-DEVE-APARECER" } } });
    const rpc = new ClienteRpc({ baseUrl: s.url, timeoutMs: 500 });
    const e = await rpc.get("/query/latest", {}).catch((x) => x);
    expect(e).toMatchObject({ codigo: "no_recusou" });
    expect(String(e.message).length).toBeLessThan(160);
    expect(JSON.stringify(e)).not.toContain("NAO-DEVE-APARECER");
    expect(String(e.message)).not.toMatch(/[\u0000-\u001f]/);
  });
});

describe("L2a redirecionamento", () => {
  it("o nó configurado responde 302 para outro destino: o cliente NÃO segue (erro explícito, o destino não é chamado)", async () => {
    let chamadoDestino = 0;
    const destino = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => { chamadoDestino++; return Response.json(ALTURA); } });
    const origem = Bun.serve({ port: 0, hostname: "127.0.0.1", fetch: () => new Response(null, { status: 302, headers: { location: `http://127.0.0.1:${destino.port}/query/latest` } }) });
    parar.push(() => { origem.stop(true); destino.stop(true); });
    const rpc = new ClienteRpc({ baseUrl: `http://127.0.0.1:${origem.port}`, timeoutMs: 500 });
    await expect(rpc.get("/query/latest", {})).rejects.toMatchObject({ codigo: "no_inacessivel" });
    expect(chamadoDestino).toBe(0);
  });
});

describe("L2b corpo que trava no meio (achado de revisão)", () => {
  it("servidor real manda 1 pedaço e não fecha: rejeita em ≤ timeout com erro explícito e a chamada seguinte funciona", async () => {
    let n = 0;
    const s = falso({ "/query/latest": () => (++n === 1 ? { corpo: null, penduradoAposPedaco: true } : { corpo: ALTURA }) });
    const rpc = new ClienteRpc({ baseUrl: s.url, timeoutMs: 80 });
    const t0 = Date.now();
    await expect(rpc.get("/query/latest", {})).rejects.toMatchObject({ codigo: "timeout" });
    expect(Date.now() - t0).toBeLessThan(400);
    expect((await rpc.get("/query/latest", {})).height).toBe(ALTURA.height);
  });
  it("leitor que IGNORA o abort (stream sem ligação com o AbortSignal): o prazo total ainda libera, com a mensagem do corpo", async () => {
    let cancelado = false;
    const fetchTravado = (async () =>
      new Response(
        new ReadableStream<Uint8Array>({
          start: (c) => { c.enqueue(new TextEncoder().encode('{"ret":0,')); },
          pull: () => new Promise<void>(() => {}), // nunca resolve, não olha sinal nenhum
          cancel: () => { cancelado = true; },
        }),
        { status: 200 },
      )) as unknown as typeof fetch;
    const rpc = new ClienteRpc({ baseUrl: "http://no.teste", timeoutMs: 60, fetchImpl: fetchTravado });
    const t0 = Date.now();
    const e = await rpc.get("/query/latest", {}).catch((x) => x);
    expect(e).toMatchObject({ codigo: "timeout" });
    expect(String(e.message)).toContain("tempo esgotado lendo o corpo");
    expect(Date.now() - t0).toBeLessThan(400);
    expect(cancelado).toBe(true); // o leitor foi cancelado, não largado aberto
  });
  it("a fila não prende: 3 chamadas em fila, a 1ª trava no meio, a 2ª e a 3ª respondem", async () => {
    let n = 0;
    const s = falso({ "/query/latest": () => (++n === 1 ? { corpo: null, penduradoAposPedaco: true } : { corpo: ALTURA }) });
    const rpc = new ClienteRpc({ baseUrl: s.url, timeoutMs: 80 });
    const rs = await Promise.allSettled([rpc.get("/query/latest", {}), rpc.get("/query/latest", {}), rpc.get("/query/latest", {})]);
    expect(rs.map((r) => r.status)).toEqual(["rejected", "fulfilled", "fulfilled"]);
  });
  it("pelo MCP: a ferramenta devolve erro `timeout` e a ferramenta seguinte responde", async () => {
    let n = 0;
    const s = falso({ "/query/latest": () => (++n === 1 ? { corpo: null, penduradoAposPedaco: true } : { corpo: ALTURA }) });
    const c = await conectar(s.url, 80);
    expect((await chamar(c, "hacash_altura")).json).toMatchObject({ erro: "timeout" });
    expect((await chamar(c, "hacash_altura")).erro).toBe(false);
  });
});

describe("L3 uma chamada por vez", () => {
  it("5 chamadas disparadas juntas chegam ao nó em fila (no máximo 1 simultânea)", async () => {
    const s = falso({ "/query/latest": { corpo: ALTURA, atrasoMs: 25 } });
    const c = await conectar(s.url);
    const rs = await Promise.all([1, 2, 3, 4, 5].map(() => chamar(c, "hacash_altura")));
    expect(rs.every((r) => !r.erro)).toBe(true);
    expect(s.vistos.length).toBe(5);
    expect(s.maxSimultaneas()).toBe(1);
  });
  it("uma chamada que falha não trava a fila", async () => {
    let n = 0;
    const s = falso({ "/query/latest": () => (++n === 1 ? { status: 500, corpo: "x" } : { corpo: ALTURA }) });
    const c = await conectar(s.url);
    const [a, b] = await Promise.all([chamar(c, "hacash_altura"), chamar(c, "hacash_altura")]);
    expect(a.erro).toBe(true);
    expect(b.erro).toBe(false);
  });
});

describe("L4 configuração", () => {
  it("sem HACASH_RPC_URL usa o nó local padrão http://127.0.0.1:8082 (porta HTTP do fullnode, config.md:90)", () => {
    expect(PADRAO_RPC_URL).toBe("http://127.0.0.1:8082");
    expect(lerConfig({}).baseUrl).toBe("http://127.0.0.1:8082");
    expect(lerConfig({ HACASH_RPC_URL: "  " }).baseUrl).toBe("http://127.0.0.1:8082");
  });
  it("aceita http/https, tira a barra final, mantém prefixo de proxy", () => {
    expect(lerConfig({ HACASH_RPC_URL: "https://no.exemplo.test/" }).baseUrl).toBe("https://no.exemplo.test");
    expect(lerConfig({ HACASH_RPC_URL: "https://no.exemplo.test/hacash/" }).baseUrl).toBe("https://no.exemplo.test/hacash");
  });
  it("recusa esquema estranho, credencial na URL, query e fragmento", () => {
    for (const ruim of ["ftp://x.test", "file:///etc/passwd", "javascript:1", "https://user:senha@x.test", "https://x.test/?token=1", "https://x.test/#a", "não é url"]) {
      expect(() => lerConfig({ HACASH_RPC_URL: ruim })).toThrow(/HACASH_RPC_URL/);
    }
  });
  it("com prefixo de proxy, a chamada vai para prefixo + rota", async () => {
    const s = falso({ "/hacash/query/latest": { corpo: ALTURA } });
    const rpc = new ClienteRpc({ baseUrl: `${s.url}/hacash` });
    expect((await rpc.get("/query/latest", {})).height).toBe(ALTURA.height);
  });
});
