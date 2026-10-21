/** ajuda.ts — servidor HTTP falso do fullnode (Bun.serve em porta livre) e cliente MCP em memória. */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { criarServidor } from "../src/servidor.ts";
import { ClienteRpc } from "../src/rpc.ts";

export type Visto = { metodo: string; caminho: string; query: Record<string, string> };
/** `penduradoAposPedaco`: responde 200, manda 1 pedaço de corpo e NUNCA fecha nem termina (servidor que trava no meio). */
export type Resposta = { status?: number; corpo: unknown; atrasoMs?: number; bruto?: string; penduradoAposPedaco?: boolean };

export function servidorFalso(rotas: Record<string, Resposta | (() => Resposta)>) {
  const vistos: Visto[] = [];
  let simultaneas = 0;
  let maxSimultaneas = 0;
  const srv = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(req) {
      const u = new URL(req.url);
      vistos.push({ metodo: req.method, caminho: u.pathname, query: Object.fromEntries(u.searchParams) });
      const r = rotas[u.pathname];
      if (!r) return new Response("not found", { status: 404 });
      const resp = typeof r === "function" ? r() : r;
      simultaneas++;
      maxSimultaneas = Math.max(maxSimultaneas, simultaneas);
      try {
        if (resp.penduradoAposPedaco) {
          const corpo = new ReadableStream<Uint8Array>({ start: (c) => { c.enqueue(new TextEncoder().encode('{"ret":0,"height":')); } });
          return new Response(corpo, { status: 200, headers: { "content-type": "application/json" } });
        }
        if (resp.atrasoMs) await new Promise((ok) => setTimeout(ok, resp.atrasoMs));
        return new Response(resp.bruto ?? JSON.stringify(resp.corpo), { status: resp.status ?? 200, headers: { "content-type": "application/json" } });
      } finally {
        simultaneas--;
      }
    },
  });
  return { url: `http://127.0.0.1:${srv.port}`, vistos, maxSimultaneas: () => maxSimultaneas, parar: () => srv.stop(true) };
}

export async function conectar(url: string, timeoutMs?: number) {
  const servidor = criarServidor({ HACASH_RPC_URL: url }, timeoutMs ? new ClienteRpc({ baseUrl: url, timeoutMs }) : undefined);
  const cliente = new Client({ name: "teste", version: "0" }, { capabilities: {} });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([servidor.connect(a), cliente.connect(b)]);
  return cliente;
}

export const texto = (r: unknown) => (r as { content: { text: string }[] }).content[0]!.text;
export const chamar = async (c: Client, name: string, args: Record<string, unknown> = {}) => {
  const r = await c.callTool({ name, arguments: args });
  return { erro: Boolean((r as { isError?: boolean }).isError), texto: texto(r), json: (() => { try { return JSON.parse(texto(r)); } catch { return null; } })() };
};
