# Security

The scripts and the MCP tools in this repository are read only: they do not sign, broadcast or create accounts. This is a statement about our code, not a security audit of the Hacash node or of its release binary. Português abaixo.

- It never asks for a private key, seed or password. If someone asks in its name, it is not us.
- The script runs the node RPC on `127.0.0.1` only, with mining and inbound P2P off.
- Routes that create keys, sign, change state or broadcast are listed in `api/rotas.json` with `"executar": false`. Do not call them on mainnet.
- The node HTTP server has no authentication. Do not expose port 8082 to the internet.

Report a problem in this repository through a private GitHub security advisory.
Problems in the Hacash node go to the Hacash maintainers (section 5 of `HACASH.md`).

## Português

Os scripts e as ferramentas MCP deste repositório são só de leitura: não assinam, não transmitem e não criam conta. Isto vale para o nosso código; não é auditoria de segurança do nó da Hacash nem do binário da release.

- Ele nunca pede chave privada, seed ou senha. Se alguém pedir em nome dele, não somos nós.
- O script deixa a RPC do nó só em `127.0.0.1`, com mineração e P2P de entrada desligados.
- Rotas que criam chave, assinam, mudam estado ou transmitem estão em `api/rotas.json` com `"executar": false`. Não as chame na mainnet.
- O servidor HTTP do nó não tem autenticação. Não exponha a porta 8082 à internet.

Relate problema deste repositório por um aviso de segurança privado do GitHub.
Problemas no nó Hacash vão para os mantenedores da Hacash (seção 5 do `HACASH.pt-BR.md`).
