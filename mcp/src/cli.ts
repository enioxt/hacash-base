#!/usr/bin/env node
/** cli.ts — `mcp-hacash`: sobe o servidor MCP (stdio). Configuração: HACASH_RPC_URL. */
import { servir } from "./servidor.ts";
import { lerConfig } from "./rpc.ts";
import { VERSAO } from "./versao.ts";

const arg = process.argv[2];
if (arg === "--version" || arg === "-v") {
  console.log(VERSAO);
} else if (arg === "--help" || arg === "-h") {
  console.log("mcp-hacash — servidor MCP somente leitura para um fullnode Hacash.\nUso: HACASH_RPC_URL=http://127.0.0.1:8082 mcp-hacash\nFerramentas: hacash_altura, hacash_supply, hacash_saldo, hacash_diamante, hacash_transacao, hacash_bloco, hacash_ativo, hacash_canal.");
} else {
  try {
    lerConfig(); // falha cedo e com mensagem clara se HACASH_RPC_URL estiver malformada
  } catch (e) {
    console.error((e as Error).message);
    process.exit(2);
  }
  servir().catch((e) => {
    console.error("mcp-hacash: falha ao iniciar:", (e as Error).message);
    process.exit(1);
  });
}
