#!/usr/bin/env bash
# rodar-no.sh - compila e roda um nó Hacash (fullnode) só de leitura, na sua máquina.
#
# Os 4 passos da seção 2 de HACASH.pt-BR.md:
#   1. preparar (confere que cargo/Rust e o compilador C já estão instalados; não instala nada)
#   2. compilar (git clone + cargo build)
#   3. configurar (RPC só em 127.0.0.1, sem mineração, sem conexão P2P de entrada)
#   4. rodar e provar saúde (GET /query/latest)
#
# Pode rodar de novo: cada passo pula o que já existe, e uma config existente só é aceita se for só de leitura
# (RPC explícita em 127.0.0.1, sem mineração, sem P2P de entrada); senão o script para sem subir o nó.
# Não cria carteira, não pede chave, não minera, não transmite nada.
#
# Variáveis (todas opcionais):
#   HACASH_PASTA      pasta de trabalho            (padrão: $HOME/hacash)
#   HACASH_MODO       leve | completo              (padrão: leve)
#                     leve     = fast_sync = true  + HACASH_DB_SMALL_MACHINE=1
#                     completo = fast_sync = false (valida todos os blocos; tempo não medido)
#   HACASH_RPC_PORTA  porta HTTP local             (padrão: 8082)
#   HACASH_REF        commit ou tag do fullnode    (padrão: ce25368a, o commit testado)
#   HACASH_ESPERA     segundos de espera pela RPC  (padrão: 120)
set -euo pipefail

PASTA="${HACASH_PASTA:-$HOME/hacash}"
MODO="${HACASH_MODO:-leve}"
PORTA="${HACASH_RPC_PORTA:-8082}"
REF="${HACASH_REF:-ce25368a038c5307ab71b5d81cd781cc54fe884d}"
ESPERA="${HACASH_ESPERA:-120}"

FONTE="$PASTA/fullnode"
BIN="$FONTE/target/release/fullnode"
NO="$PASTA/node"
CONF="$NO/hacash.config.ini"
PIDF="$NO/node.pid"
LOG="$NO/node.log"
RPC="http://127.0.0.1:$PORTA"

validar_config() {
  local CONF="$1" PLANA DUP SECS SIP PP
  # Config existente não é confiada às cegas: o script só sobe o nó se ela for "só de leitura".
  # Lê "secao.chave=valor" (sem comentários) e recusa: mineração ligada, RPC fora de 127.0.0.1,
  # porta P2P de entrada aberta.
  PLANA="$(awk -F= '
    /^[ \t]*[;#]/ { next }
    /^[ \t]*\[/ { gsub(/[][ \t\r]/, "", $0); sec=$0; next }
    NF>=2 { k=$1; v=$2; gsub(/[ \t\r]/, "", k); gsub(/[ \t\r]/, "", v); sub(/[;#].*/, "", v); print sec "." k "=" v }
  ' "$CONF")"
  # Chave repetida ou seção repetida: não sabemos qual valor o nó vai ler, então recusa.
  DUP="$(printf '%s\n' "$PLANA" | { grep -v '^$' || true; } | cut -d= -f1 | sort | uniq -d | head -3 | tr '\n' ' ')"
  [ -z "$DUP" ] || falha "$CONF repete chave(s): $DUP; deixe uma de cada ou apague a config para recriá-la."
  SECS="$(grep -E '^[[:space:]]*\[' "$CONF" | tr -d ' \t\r' | sort | uniq -d | head -3 | tr '\n' ' ')"
  [ -z "$SECS" ] || falha "$CONF repete seção(ões): $SECS; deixe uma de cada ou apague a config para recriá-la."
  val() { printf '%s\n' "$PLANA" | { grep -m1 "^$1=" || true; } | cut -d= -f2-; }  # chave ausente = resposta vazia (não é erro)
  [ "$(val miner.enable)" != true ] || falha "$CONF liga a mineração ([miner] enable = true); este script só roda nó de leitura. Apague a config para recriá-la."
  [ "$(val diamond_miner.enable)" != true ] || falha "$CONF liga a mineração de diamantes ([diamond_miner] enable = true); apague a config para recriá-la."
  [ "$(val server.enable)" = true ] || falha "$CONF não liga a RPC ([server] enable = true); apague a config para recriá-la."
  SIP="$(val server.listen_ip)"
  [ "$SIP" = 127.0.0.1 ] || falha "$CONF não fixa a RPC na máquina local ([server] listen_ip = 127.0.0.1; encontrado: ${SIP:-ausente}); corrija a linha ou apague a config para recriá-la."
  PP="$(val p2p.listen_port)"
  [ "$PP" = 0 ] || falha "$CONF aceita conexões P2P de entrada ([p2p] listen_port = ${PP:-padrão}); apague a config para recriá-la."
}

# Clone pré-existente: só serve se estiver exatamente no commit pedido (HACASH_REF); senão para.
validar_clone() {
  local dir="$1" ref="$2" alvo atual
  alvo="$(git -C "$dir" rev-parse --verify --quiet "${ref}^{commit}")" || falha "o clone $dir não conhece o commit/tag $ref (HACASH_REF); apague o clone ou escolha outro HACASH_REF."
  atual="$(git -C "$dir" rev-parse HEAD)"
  [ "$atual" = "$alvo" ] || falha "o clone $dir está em ${atual:0:8}, não em ${alvo:0:8} (HACASH_REF=$ref); rode 'git -C $dir checkout $ref' ou apague o clone."
}

passo() { printf '\n[%s] %s\n' "$1" "$2"; }
falha() { printf 'ERRO: %s\n' "$1" >&2; exit 1; }

# Uso só para teste: bash rodar-no.sh --validar-config ARQUIVO  (valida e sai; não compila nem sobe nada)
if [ "${1:-}" = "--validar-config" ]; then
  [ -f "${2:-}" ] || falha "uso: rodar-no.sh --validar-config ARQUIVO.ini"
  validar_config "$2"
  echo "config aceita: $2"
  exit 0
fi

if [ "${1:-}" = "--validar-clone" ]; then
  [ -d "${2:-}/.git" ] && [ -n "${3:-}" ] || falha "uso: rodar-no.sh --validar-clone PASTA REF"
  validar_clone "$2" "$3"
  echo "clone aceito: $2 em $3"
  exit 0
fi

case "$MODO" in
  leve) FAST_SYNC=true ;;
  completo) FAST_SYNC=false ;;
  *) falha "HACASH_MODO deve ser 'leve' ou 'completo' (recebido: $MODO)" ;;
esac
[[ "$PORTA" =~ ^[0-9]+$ ]] || falha "HACASH_RPC_PORTA deve ser número (recebido: $PORTA)"
command -v curl >/dev/null || falha "curl não encontrado"
command -v git >/dev/null || falha "git não encontrado"
mkdir -p "$PASTA" "$NO"

# ---------------------------------------------------------------- 1. preparar
passo 1/4 "preparar"
if [ -x "$HOME/.cargo/bin/cargo" ]; then export PATH="$HOME/.cargo/bin:$PATH"; fi
command -v cargo >/dev/null || falha "cargo (Rust) não encontrado. Este script não instala Rust: instale pelo caminho oficial, https://rustup.rs, e rode de novo. Sem Rust, use o binário da release (passo 2 do README)."
command -v cc >/dev/null || falha "compilador C não encontrado; no Ubuntu: sudo apt install build-essential"
echo "ok: $(cargo --version)"

# ---------------------------------------------------------------- 2. compilar
passo 2/4 "compilar"
if [ ! -d "$FONTE/.git" ]; then
  git clone https://github.com/hacash/fullnode "$FONTE"
  git -C "$FONTE" checkout --quiet "$REF"   # fixa o commit testado (HACASH_REF, padrão ce25368a); sem isso o clone ficaria no ramo padrão
else
  validar_clone "$FONTE" "$REF"
  echo "clone já existe em $FONTE, no commit pedido ($(git -C "$FONTE" rev-parse --short HEAD)); não mexo nele."
fi
if [ ! -x "$BIN" ]; then
  echo "compilando (cerca de 3 a 4 min numa máquina de 8 núcleos)..."
  ( cd "$FONTE" && cargo build --release -p app --bin fullnode )
else
  echo "binário já existe: $BIN"
fi
[ -x "$BIN" ] || falha "binário não foi gerado: $BIN"

# ---------------------------------------------------------------- 3. configurar
passo 3/4 "configurar"
if [ ! -f "$CONF" ]; then
  # Os nós de partida vêm do README oficial do fullnode; não copiamos endereços para cá.
  BOOT="$(grep -m1 -E '^boot_nodes *=' "$FONTE/README.md" | sed -E 's/^boot_nodes *= *//')" || true
  [ -n "$BOOT" ] || falha "não achei a linha boot_nodes no README do fullnode"
  cat > "$CONF" <<INI
; gerado por hacash-base/scripts/rodar-no.sh em $(date -Iseconds) - modo $MODO
[engine]
data_dir = $NO/data
fast_sync = $FAST_SYNC

[p2p]
listen_ip = 127.0.0.1
listen_port = 0
boot_nodes = $BOOT

[server]
enable = true
listen_ip = 127.0.0.1
listen_port = $PORTA
debug_routes = false

[mint]
chain_id = 0
diamond_form = true

[miner]
enable = false

[diamond_miner]
enable = false

[vm]
log_enable = false
INI
  echo "config criada: $CONF"
else
  echo "config já existe, mantida como está: $CONF"
  validar_config "$CONF"
  grep -qE "^listen_port *= *$PORTA\b" "$CONF" || echo "aviso: a config existente não usa a porta $PORTA; a prova de saúde vai usar $RPC."
fi

# ---------------------------------------------------------------- 4. rodar e provar saúde
passo 4/4 "rodar"
rodando=false
if [ -f "$PIDF" ] && kill -0 "$(cat "$PIDF")" 2>/dev/null; then
  rodando=true
  echo "nó já está rodando (pid $(cat "$PIDF"))."
elif curl -s -m 3 -o /dev/null "$RPC/status"; then
  falha "a porta $PORTA já responde, mas não por um nó iniciado daqui; escolha outra com HACASH_RPC_PORTA"
fi
if [ "$rodando" = false ]; then
  if [ "$MODO" = leve ]; then
    nohup env HACASH_DB_SMALL_MACHINE=1 "$BIN" "$CONF" >>"$LOG" 2>&1 &
  else
    nohup "$BIN" "$CONF" >>"$LOG" 2>&1 &
  fi
  echo $! > "$PIDF"
  echo "nó iniciado (pid $(cat "$PIDF")); log em $LOG"
fi

resposta=""
for _ in $(seq 1 "$ESPERA"); do
  resposta="$(curl -s -m 3 "$RPC/query/latest" || true)"
  case "$resposta" in *'"ret":0'*) break ;; esac
  kill -0 "$(cat "$PIDF")" 2>/dev/null || falha "o nó parou; veja as últimas linhas de $LOG"
  sleep 1
done
case "$resposta" in
  *'"ret":0'*) ;;
  *) falha "a RPC não respondeu em ${ESPERA}s em $RPC/query/latest; veja $LOG" ;;
esac

printf '\nSAÚDE OK: GET %s/query/latest -> %s\n' "$RPC" "$resposta"
case "$resposta" in
  *'"height":0,'*) echo "A RPC responde; a sincronia ainda não começou. Rode de novo em 1 min para ver a altura subir." ;;
  *) echo "A altura sobe até a ponta da rede. No modo leve, a sincronia completa levou cerca de 12 min no teste." ;;
esac
echo "Para parar: kill \$(cat $PIDF)"
