/** hac.test.ts — conversão do formato `fin` do nó (`mantissa:unidade`) para HAC decimal. Regra: field/src/types/amount.rs:15-24 (valor × 10^(unidade−248) HAC; 1:248 = 1 HAC). */
import { describe, expect, it } from "bun:test";
import { finParaHac, valorEmHac } from "../src/hac.ts";

describe("finParaHac", () => {
  it("âncora: 1:248 = 1 HAC", () => { expect(finParaHac("1:248")).toBe("1"); });
  it("unidades menores dividem: 549:244 = 0.0549 HAC (exemplo do próprio amount.rs:17)", () => { expect(finParaHac("549:244")).toBe("0.0549"); });
  it("unidades maiores multiplicam", () => { expect(finParaHac("125:250")).toBe("12500"); });
  it("zero e negativo", () => { expect(finParaHac("0:0")).toBe("0"); expect(finParaHac("-5:247")).toBe("-0.5"); });
  it("sem perda em mantissa grande (BigInt, não float)", () => { expect(finParaHac("123456789012345678901234567890:248")).toBe("123456789012345678901234567890"); });
  it("zero à direita da fração sai", () => { expect(finParaHac("1200:245")).toBe("1.2"); });
  it("lixo devolve null (nunca chuta)", () => { for (const x of ["", "abc", "1:", ":248", "1:999", "1.5:248", "1:2:3"]) expect(finParaHac(x)).toBeNull(); });
});

describe("valorEmHac (formatos reais do fullnode 1.2.5)", () => {
  it("decimal com unit=mei passa como veio", () => { expect(valorEmHac("1784.46320557")).toBe("1784.46320557"); expect(valorEmHac("0.0001")).toBe("0.0001"); expect(valorEmHac("1")).toBe("1"); });
  it("fin sem unit converte: gravação real 178446320557:240 = 1784.46320557 e 1:244 = 0.0001", () => {
    expect(valorEmHac("178446320557:240")).toBe("1784.46320557");
    expect(valorEmHac("1:244")).toBe("0.0001");
    expect(valorEmHac("159975414:241")).toBe("15.9975414");
  });
  it("lixo devolve null", () => { for (const x of ["", "abc", "1,5", "ㄜ1", "1e5"]) expect(valorEmHac(x)).toBeNull(); });
});
