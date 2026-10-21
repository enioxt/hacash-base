#!/usr/bin/env bash
# Teste rápido da validação de config do rodar-no.sh (não compila nem sobe nó).
# Uso: bash scripts/rodar-no.test.sh
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
base() { cat <<'INI'
[p2p]
listen_port = 0
[server]
enable = true
listen_ip = 127.0.0.1
listen_port = 8082
[miner]
; enable = true
[diamond_miner]
INI
}
ok=0; ruim=0
esperar() { # nome, status esperado (0 aceita, 1 recusa), arquivo, trecho esperado na mensagem
  local saida rc
  saida="$(bash "$AQUI/rodar-no.sh" --validar-config "$3" 2>&1)"; rc=$?
  if [ "$rc" = "$2" ] && { [ -z "${4:-}" ] || printf '%s' "$saida" | grep -q "$4"; }; then ok=$((ok+1)); echo "ok   $1"; else ruim=$((ruim+1)); echo "FALHA $1 (rc=$rc): $saida"; fi
}
base > "$TMP/ok.ini";                                   esperar "config boa é aceita" 0 "$TMP/ok.ini"
{ base; echo "[miner]"; echo "enable = false"; } > "$TMP/secao.ini"; esperar "seção repetida é recusada" 1 "$TMP/secao.ini" "repete seç"
base | sed 's/^listen_port = 0$/listen_port = 0\nlisten_port = 3337/' > "$TMP/chave.ini"; esperar "chave duplicada é recusada" 1 "$TMP/chave.ini" "repete chave"
base | sed 's/^; enable = true$/enable = true/' > "$TMP/minera.ini"; esperar "mineração ligada é recusada" 1 "$TMP/minera.ini" "mineração"
base | sed 's/^listen_ip = 127.0.0.1$/listen_ip = 0.0.0.0/' > "$TMP/ip.ini"; esperar "RPC fora da máquina é recusada" 1 "$TMP/ip.ini" "máquina local"
base | sed '/^listen_ip = 127.0.0.1$/d' > "$TMP/semip.ini"; esperar "RPC sem listen_ip é recusada" 1 "$TMP/semip.ini" "ausente"
base | sed '0,/^listen_port = 0$/s//listen_port = 3337/' > "$TMP/p2p.ini"; esperar "P2P de entrada é recusado" 1 "$TMP/p2p.ini" "P2P de entrada"
# --- clone pré-existente
R="$TMP/clone"; git init -q "$R"; git -C "$R" -c user.email=t@t -c user.name=t commit -q --allow-empty -m um; C1="$(git -C "$R" rev-parse HEAD)"
git -C "$R" -c user.email=t@t -c user.name=t commit -q --allow-empty -m dois; C2="$(git -C "$R" rev-parse HEAD)"
clone() { # nome, rc esperado, ref, trecho
  local saida rc; saida="$(bash "$AQUI/rodar-no.sh" --validar-clone "$R" "$3" 2>&1)"; rc=$?
  if [ "$rc" = "$2" ] && { [ -z "${4:-}" ] || printf '%s' "$saida" | grep -q "$4"; }; then ok=$((ok+1)); echo "ok   $1"; else ruim=$((ruim+1)); echo "FALHA $1 (rc=$rc): $saida"; fi
}
clone "clone no commit pedido é aceito" 0 "$C2"
clone "clone em outro commit é recusado" 1 "$C1" "não em"
clone "ref desconhecido é recusado" 1 "0000000000000000000000000000000000000001" "não conhece"
echo "$ok ok, $ruim falhas"; [ "$ruim" = 0 ]
