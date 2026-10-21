/**
 * hac.ts — converte o formato `fin` do nó (`mantissa:unidade`) em HAC decimal, em texto, sem float.
 * Regra: valor × 10^(unidade − 248) HAC; 1:248 = 1 HAC (hacash/fullnode field/src/types/amount.rs:15-24).
 */
export function finParaHac(fin: string): string | null {
  const m = /^(-?)(\d+):(\d{1,3})$/.exec(fin);
  if (!m) return null;
  const unidade = Number(m[3]);
  if (unidade > 255) return null;
  const mantissa = BigInt(m[2]!);
  if (mantissa === 0n) return "0";
  const sinal = m[1]!;
  const exp = unidade - 248;
  if (exp >= 0) return sinal + (mantissa * 10n ** BigInt(exp)).toString();
  const digitos = mantissa.toString().padStart(-exp + 1, "0");
  const corte = digitos.length + exp;
  const inteira = digitos.slice(0, corte);
  const fracao = digitos.slice(corte).replace(/0+$/, "");
  return sinal + inteira + (fracao ? "." + fracao : "");
}

/**
 * Valor de HAC como o nó devolve → HAC decimal em texto. Com `unit=mei` o nó manda decimal ("1784.46320557",
 * gravado em 21/10 no fullnode 1.2.5); sem `unit` manda `mantissa:unidade` ("178446320557:240"). Aceita os dois;
 * qualquer outra forma devolve null (nunca chuta).
 */
export function valorEmHac(v: string): string | null {
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  return finParaHac(v);
}

/**
 * Quantidade inteira em átomos de um ativo → decimal em texto, sem float: átomos ÷ 10^casas.
 * Semântica: mint-core/src/action/asset.rs:13 ("supply {} atoms, {} decimals"). Entrada fora de forma → null.
 */
export function atomosEmDecimal(atomos: string, casas: number): string | null {
  if (!/^\d+$/.test(atomos) || !Number.isInteger(casas) || casas < 0 || casas > 16) return null;
  const n = BigInt(atomos).toString();
  if (casas === 0) return n;
  const digitos = n.padStart(casas + 1, "0");
  const inteira = digitos.slice(0, -casas);
  const fracao = digitos.slice(-casas).replace(/0+$/, "");
  return inteira + (fracao ? "." + fracao : "");
}
