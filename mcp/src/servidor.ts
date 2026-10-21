/**
 * servidor.ts — servidor MCP stdio do Hacash, SOMENTE LEITURA: 8 ferramentas sobre o RPC HTTP de um fullnode.
 * Sem assinatura, sem broadcast, sem chave, sem estado em disco. A URL do nó vem de HACASH_RPC_URL.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { FERRAMENTAS, type Ferramenta } from "./ferramentas.ts";
import { ClienteRpc, ErroHacash, lerConfig } from "./rpc.ts";
import { NOME, VERSAO } from "./versao.ts";

type Resposta = { isError?: boolean; content: { type: "text"; text: string }[] };
const json = (v: unknown, isError = false): Resposta => ({ ...(isError ? { isError: true } : {}), content: [{ type: "text", text: JSON.stringify(v, null, 2) }] });

export async function executar(f: Ferramenta, bruto: unknown, rpc: ClienteRpc): Promise<Resposta> {
  const no = rpc.baseUrl;
  const entrada = f.entrada.safeParse(bruto ?? {});
  if (!entrada.success) {
    return json({ erro: "parametro_invalido", mensagem: entrada.error.issues.map((i) => `${i.path.join(".") || "entrada"}: ${i.message}`).join("; ") }, true);
  }
  try {
    const corpo = await rpc.get(f.rota, f.consulta(entrada.data));
    return json({ ...f.normalizar(corpo, entrada.data, { no }), no, rota: f.rota });
  } catch (e) {
    if (e instanceof ErroHacash) return json({ erro: e.codigo, mensagem: e.message, ...e.extra, no: (e.extra.no as string | undefined) ?? no }, true);
    return json({ erro: "interno", mensagem: "falha inesperada ao consultar o nó", no }, true);
  }
}

export function criarServidor(env: Record<string, string | undefined> = process.env, rpc?: ClienteRpc): McpServer {
  const cliente = rpc ?? new ClienteRpc(lerConfig(env)); // replicavel-ok: o nó vem de HACASH_RPC_URL (lerConfig); nada de ambiente fixo aqui
  const server = new McpServer({ name: NOME, version: VERSAO });
  for (const f of FERRAMENTAS) {
    server.registerTool(
      f.nome,
      {
        title: f.titulo,
        description: f.descricao,
        inputSchema: f.forma,
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      },
      (args: unknown) => executar(f, args, cliente),
    );
  }
  return server;
}

export async function servir(): Promise<void> {
  await criarServidor().connect(new StdioServerTransport());
}

