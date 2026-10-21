/** fixtures.test.ts — as gravações reais não mudam sem o cabeçalho de fixtures.ts mudar (SHA-256 conferido). */
import { describe, expect, it } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SHA: Record<string, string> = {
  "altura.json": "e8ffeab08ae8568bba8c5c4c1a494fac866d7656cd9188d11fd17b620340954b",
  "supply.json": "3e39a722a7476c07473d493128f4e3711994d1f3ae91116b53b6ab4734c39e12",
  "saldo.json": "85953b4b1473c850d7552c858dff667e2cedc4f07621051d0fc81163296b1aa4",
  "diamante.json": "323a27b17a495a055baf98141566e47cfadeb3ec2a6b694e15c099481ad8942e",
  "transacao.json": "56bad390154289c4c0d480e7911000103854797870005869f92c072f392f065e",
  "saldo-formato-fin.json": "f4912799c914e0fae3ef1ffeb8d0155072c7bf7f63ff297acd38690469bb5ee8",
  "erro-diamante-invalido.json": "a83d55344d7acc9ce9ecd5b818f3e8deed6425ffa269ecea053f6fd8360681ac",
  "erro-tx-nao-encontrada.json": "9a44c504b394d50eb361ebd0d064d62e8f116ff66acef88ed56e97fb6c1035cb",
  "bloco.json": "f30f2bc31a9eb9c0a171f5229e48607451d1b2fafb7dd1f36cd3eb253a7f4c41",
  "bloco-por-hash.json": "e67553bb7c90b12b8129e0ff26af5f53fdd716773d691f565fc3ce502139853f",
  "erro-bloco-nao-encontrado.json": "91b6e308a70fd7a794a385cb53efdfb58e052d15e2b5ca1fd74645ba15b2d27f",
  "ativo.json": "82663840b4be105d2381d3ecfe1f5126b18f67493cfe2c6a64b85685fce3cb77",
  "ativo-sem-metadados.json": "c0052f474790ec56a216f39d16670a6734d1cde49f791d668825088c43e559fa",
  "canal.json": "a59f4ab8ec35b3aa7e4ec0eea962fdd17c0c40d2f70e892e8ccf157d9058da59",
  "canal-aberto.json": "7ab2e1a2ca87c46b61b7c7b6c3ff612bb65d03b6c19919da29671884441bb28d",
  "erro-canal-nao-encontrado.json": "6fedfe2117bf8dccace21d41e97d099f9abf4fba140c557749672dab124a27e2",
};

describe("fixtures reais", () => {
  for (const [arq, sha] of Object.entries(SHA)) {
    it(`${arq} bate com o SHA-256 gravado`, () => {
      expect(createHash("sha256").update(readFileSync(join(import.meta.dir, "fixtures", arq))).digest("hex")).toBe(sha);
    });
  }
});
