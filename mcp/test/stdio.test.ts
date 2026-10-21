/**
 * stdio.test.ts — ponta a ponta como um cliente de IA real usa: processo filho `bun src/cli.ts` falando MCP por
 * stdio com um nó falso por HACASH_RPC_URL. Prova que a configuração por env chega, que as 8 ferramentas listam e que
 * URL malformada derruba o processo com mensagem clara em vez de subir meio quebrado.
 */
import { afterEach, describe, expect, it } from "bun:test";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { ALTURA } from "./fixtures.ts";
import { servidorFalso } from "./ajuda.ts";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");
const parar: (() => void)[] = [];
afterEach(() => { while (parar.length) parar.pop()!(); });

describe("stdio", () => {
  it("sobe pelo CLI, lista as 8 ferramentas e responde hacash_altura contra o nó de HACASH_RPC_URL", async () => {
    const s = servidorFalso({ "/query/latest": { corpo: ALTURA } });
    parar.push(s.parar);
    const t = new StdioClientTransport({ command: "bun", args: [CLI], env: { PATH: process.env.PATH ?? "", HACASH_RPC_URL: s.url } });
    const c = new Client({ name: "teste", version: "0" });
    await c.connect(t);
    try {
      expect((await c.listTools()).tools.length).toBe(8);
      const r = (await c.callTool({ name: "hacash_altura", arguments: {} })) as { content: { text: string }[] };
      expect(JSON.parse(r.content[0]!.text)).toMatchObject({ altura: ALTURA.height, no: s.url });
      expect(s.vistos.map((v) => `${v.metodo} ${v.caminho}`)).toEqual(["GET /query/latest"]);
    } finally {
      await c.close();
    }
  });
  it("HACASH_RPC_URL malformada: sai com código 2 e diz o nome da variável (sem repetir o valor)", async () => {
    const p = Bun.spawn(["bun", CLI], { env: { PATH: process.env.PATH ?? "", HACASH_RPC_URL: "https://usuario:SEGREDO@x.test" }, stderr: "pipe", stdout: "pipe" });
    const [codigo, err] = await Promise.all([p.exited, new Response(p.stderr).text()]);
    expect(codigo).toBe(2);
    expect(err).toContain("HACASH_RPC_URL");
    expect(err).not.toContain("SEGREDO");
  });
});
