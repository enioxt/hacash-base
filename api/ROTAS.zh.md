# Hacash 节点接口：路由表

其他语言: [English](ROTAS.md) · [Português (Brasil)](ROTAS.pt-BR.md) · [Türkçe](ROTAS.tr.md)

Hacash 全节点 1.2.5（commit `ce25368a`）共 55 个 HTTP 接口路由，由 [`rotas.json`](rotas.json) 生成，测量日期 2026-10-21。默认 `debug_routes = false` 时挂载 52 个。10 个路由标记为**不要执行**：它们创建或接收私钥、签名、改变状态或广播，未被调用。其余 45 个已在本地节点上调用。接口即使出错也返回 HTTP 200；错误在响应体中，形如 `{"ret":1,"err":"..."}`。

**风险等级:** R0 读取 · R1 读取，等待较久 · R2 涉及私钥 · R3 改变状态或广播 · R4 挖矿 · R5 调试

## 节点与状态

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/` | GET | — | 节点的 HTML console 页面（区块高度、对等节点、交易池）。 | [`mint/src/api/console.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/console.rs#L12) | 有 | 是 · R0 读取 |
| `/_server_` | GET | — | 纯文本 `Hacash Api Server`，表明接口服务已启动。 | [`server/src/http.rs:163`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/server/src/http.rs#L163) | 无 | 是 · R0 读取 |
| `/status` | GET | — | 节点状态：区块高度、chain id、出块目标秒数、uptime。 | [`api/src/status.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/status.rs#L9) | 无 | 是 · R0 读取 |
| `/pool_summary` | GET | — | 交易池按分组的计数。 | [`api/src/pool.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L9) | 无 | 是 · R0 读取 |
| `/vm/status` | GET | — | 虚拟机是否启用，以及区块高度。 | [`vm/src/api.rs:55`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L55) | 无 | 是 · R0 读取 |

## 区块链：区块高度、供应量、区块、算力、手续费

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/query/latest` | GET | — | 最新区块高度与钻石数量。 | [`mint/src/api/query/supply.rs:40`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L40) | 有 | 是 · R0 读取 |
| `/query/supply` | GET | — | 最新区块高度的供应量与流通数据（流通、销毁、钻石、通道合计、资产）。 | [`mint/src/api/query/supply.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/supply.rs#L7) | 有 | 是 · R0 读取 |
| `/query/block/height/latest` | GET | — | 仅返回最新区块高度。 | [`api/src/chain.rs:24`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L24) | 无 | 是 · R0 读取 |
| `/block_by_height` | GET | `height` | 指定区块高度的简要信息：区块高度、哈希前缀、大小。 | [`api/src/chain.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/chain.rs#L7) | 无 | 是 · R0 读取 |
| `/query/block/intro` | GET | `unit`, `hash`, `tx_hash_list`, `height` | 单个区块的概要（按区块高度或区块哈希）；可选交易哈希列表。 | [`mint/src/api/query/block.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L9) | 有 | 是 · R0 读取 |
| `/query/block/recents` | GET | `unit` | 最近区块列表。 | [`mint/src/api/query/block.rs:189`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L189) | 有 | 是 · R0 读取 |
| `/query/block/views` | GET | `unit`, `limit`, `page`, `start`, `desc` | 区块列表（参数 `limit`、`page`、`start`、`desc`）。 | [`mint/src/api/query/block.rs:75`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L75) | 有 | 是 · R0 读取 |
| `/query/block/datas` | GET | `hexbody`, `base64body`, `confirm`, `start_height`, `limit`, `max_size` | 从起始区块高度返回区块原始数据（字节；`hexbody=true` 时为十六进制文本）。不是 JSON。 | [`mint/src/api/query/block.rs:23`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L23) | 有 | 是 · R0 读取 |
| `/query/block/pools` | GET | — | 按周期（例如 `1d`）的区块统计；处理函数 `block_pool_stats_handler`。 | [`mint/src/api/query/block.rs:110`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/block.rs#L110) | 无 | 是 · R0 读取 |
| `/query/hashrate` | GET | — | 全网算力：目标值与实时值。 | [`mint/src/api/query/hashrate.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L7) | 有 | 是 · R0 读取 |
| `/query/hashrate/logs` | GET | `target`, `scale`, `days` | 算力历史（按日序列）。 | [`mint/src/api/query/hashrate.rs:26`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/hashrate.rs#L26) | 有 | 是 · R0 读取 |
| `/query/fee/average` | GET | `unit`, `extra9`, `burn90`, `consumption`, `tx_type` | 按交易大小（`consumption`）估算平均手续费。 | [`mint/src/api/query/channel.rs:49`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L49) | 有 | 是 · R0 读取 |

## 余额、资产、通道、转账

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/query/balance` | GET | `unit`, `diamonds`, `assets`, `asset_meta`, `address`, `asset`, `coinkind` | 地址余额：HAC、钻石、satoshi（以及资产）。 | [`mint/src/api/query/balance.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/balance.rs#L129) | 有 | 是 · R0 读取 |
| `/query/asset` | GET | `serial` | 按序号查询资产：ticker、名称、小数位、供应量。 | [`mint/src/api/query/asset.rs:31`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/asset.rs#L31) | 无 | 是 · R0 读取 |
| `/query/channel` | GET | `unit`, `id` | 按 id 查询支付通道状态。 | [`mint/src/api/query/channel.rs:9`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/channel.rs#L9) | 有 | 是 · R0 读取 |
| `/query/coin/transfer` | GET | `unit`, `coinkind`, `height`, `txposi`, `from`, `filter_from`, `to`, `filter_to` | 按区块高度与交易位置查询转账（可按发送方、接收方、币种过滤）。 | [`mint/src/api/transfer.rs:173`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L173) | 有 | 是 · R0 读取 |

## 钻石（HACD）

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/query/diamond` | GET | `unit`, `name`, `number` | 按名称或序号查询钻石：持有者及数据。 | [`mint/src/api/query/diamond.rs:12`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L12) | 有 | 是 · R0 读取 |
| `/query/diamond/views` | GET | `unit`, `limit`, `page`, `start`, `desc`, `name` | 钻石列表（参数 `limit`、`page`、`start`、`desc`、`name`）。 | [`mint/src/api/query/diamond.rs:73`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L73) | 有 | 是 · R0 读取 |
| `/query/diamond/bidding` | GET | `unit`, `since`, `limit`, `number` | 当前钻石竞拍。 | [`mint/src/api/query/diamond.rs:279`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L279) | 有 | 是 · R0 读取 |
| `/query/diamond/engrave` | GET | `tx_hash`, `txposi`, `height` | 钻石铭刻记录（按交易哈希，或按区块高度与交易位置）。 | [`mint/src/api/query/diamond.rs:355`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L355) | 有 | 是 · R0 读取 |
| `/query/diamond/inscription_protocol_cost` | GET | `unit`, `action`, `name`, `from`, `to` | 铭刻操作的费用（`action`：append、drop、edit、move）。 | [`mint/src/api/query/diamond.rs:244`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L244) | 有 | 是 · R0 读取 |
| `/query/diamond/inscription_protocol_cost/append` | GET | `unit`, `action`, `name`, `from`, `to` | 与 `inscription_protocol_cost` 相同，`action` 固定为 append。 | [`mint/src/api/query/diamond.rs:251`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L251) | 无 | 是 · R0 读取 |
| `/query/diamond/inscription_protocol_cost/drop` | GET | `unit`, `action`, `name`, `from`, `to` | 与 `inscription_protocol_cost` 相同，`action` 固定为 drop。 | [`mint/src/api/query/diamond.rs:272`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L272) | 无 | 是 · R0 读取 |
| `/query/diamond/inscription_protocol_cost/edit` | GET | `unit`, `action`, `name`, `from`, `to` | 与 `inscription_protocol_cost` 相同，`action` 固定为 edit。 | [`mint/src/api/query/diamond.rs:265`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L265) | 无 | 是 · R0 读取 |
| `/query/diamond/inscription_protocol_cost/move` | GET | `unit`, `action`, `name`, `from`, `to` | 与 `inscription_protocol_cost` 相同，`action` 固定为 move（需要 `to`）。 | [`mint/src/api/query/diamond.rs:258`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/diamond.rs#L258) | 无 | 是 · R0 读取 |

## 交易与模拟

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/query/transaction` | GET | `unit`, `hash`, `body`, `action`, `signature`, `description` | 按哈希查询交易：所在区块、手续费，可选动作、签名与描述。 | [`mint/src/api/query/tx.rs:50`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L50) | 有 | 是 · R0 读取 |
| `/util/transaction/check` | POST | `unit`, `set_fee`, `sign_address`, `body`, `signature`, `description`, `hexbody`; POST 请求体：十六进制的交易或区块 | 检查以十六进制 POST 的交易；不广播。 | [`mint/src/api/transaction.rs:312`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L312) | 有 | 是 · R0（POST 仅模拟或检查） |
| `/query/transaction/simulate` | POST | `gas_max`; POST 请求体：十六进制的交易或区块 | 模拟以十六进制 POST 的交易并返回结果；不广播。 | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | 无 | 是 · R0（POST 仅模拟或检查） |
| `/query/vm/estimate_gas` | POST | `gas_max`; POST 请求体：十六进制的交易或区块 | 与 `/query/transaction/simulate` 为同一处理函数（gas 估算路径）；POST，不广播。 | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | 无 | 是 · R0（POST 仅模拟或检查） |
| `/query/vm/simulate` | POST | `gas_max`; POST 请求体：十六进制的交易或区块 | 与 `/query/transaction/simulate` 为同一处理函数（虚拟机模拟路径）；POST，不广播。 | [`vm/src/api.rs:188`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L188) | 无 | 是 · R0（POST 仅模拟或检查） |

## 合约

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/query/contract/logs` | GET | `height`, `index`, `address` | 按区块高度、索引与地址查询合约日志。 | [`vm/src/api.rs:62`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L62) | 有 | 是 · R0 读取 |
| `/query/contract/sandboxcall` | GET | `contract`, `function`, `params`, `caller`, `gas_max` | 在 sandbox 中调用合约函数（`contract`、`function`、`params`、`caller`、`gas_max`）。 | [`vm/src/api.rs:316`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L316) | 有 | 是 · R0 读取 |
| `/query/contract/storage_fee` | GET | `charge_bytes` | 合约存储费用规则，及 `charge_bytes` 对应的费用。 | [`api/src/contract_storage.rs:14`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/contract_storage.rs#L14) | 无 | 是 · R0 读取 |

## 挖矿（读取）

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/query/miner/notice` | GET | `height`, `wait` | long-poll：在 `height` 之后等待新区块（最长 `wait`）。 | [`app/src/fullnode/miner_notice.rs:28`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/app/src/fullnode/miner_notice.rs#L28) | 有 | 是 · R1 读取，等待较久 |
| `/query/miner/pending` | GET | `detail`, `transaction`, `stuff`, `base64` | 矿工的待处理任务；挖矿关闭时返回错误。 | [`mint/src/api/miner.rs:10`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L10) | 有 | 是 · R4 读取；挖矿关闭时返回错误 |
| `/query/diamondminer/init` | GET | — | 钻石挖矿的初始数据；挖矿关闭时返回错误。 | [`mint/src/api/miner.rs:93`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L93) | 有 | 是 · R4 读取；挖矿关闭时返回错误 |
| `/miner/pending_replay` | GET | — | 矿工待重放项的数量（`pending_replay`）。 | [`mint/src/api/mod.rs:58`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/mod.rs#L58) | 无 | 是 · R4 读取；挖矿关闭时返回错误 |

## 私钥、签名、改变状态与广播（不要执行）

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/create/account` | GET | `quantity` | 创建账户，并在响应体中返回私钥。 | [`api/src/account.rs:7`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/account.rs#L7) | 有 | **不要执行** |
| `/create/coin/transfer` | GET | `fee`, `main_prikey`, `from_prikey`, `to_address`, `hacash`, `diamonds`, `satoshi`, `timestamp` | 构建转账；在 query 中接收私钥。 | [`mint/src/api/transfer.rs:233`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transfer.rs#L233) | 有 | **不要执行** |
| `/create/transaction` | POST | `unit`, `action`, `signature`, `description`, `hexbody`; POST 请求体：十六进制的交易或区块 | 根据 POST 请求体构建交易。 | [`mint/src/api/transaction.rs:99`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L99) | 有 | **不要执行** |
| `/util/transaction/sign` | POST | `unit`, `prikey`, `pubkey`, `sigdts`, `signature`, `description`, `hexbody`; POST 请求体：十六进制的交易或区块 | 对交易签名；接收私钥。 | [`mint/src/api/transaction.rs:367`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L367) | 有 | **不要执行** |
| `/operate/fee/raise` | POST | `fee`, `fee_prikey`, `hash`, `hexbody`; POST 请求体：十六进制的交易或区块 | 提高交易手续费；接收手续费私钥。 | [`mint/src/api/transaction.rs:451`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/transaction.rs#L451) | 有 | **不要执行** |
| `/operate/contract/logs/delete` | GET | `height`, `auth` | 删除合约日志（参数 `height`、`auth`）；会改变节点状态。 | [`vm/src/api.rs:122`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L122) | 有 | **不要执行** |
| `/submit/transaction` | POST | `only_insert_txpool`, `hexbody`; POST 请求体：十六进制的交易或区块 | 向网络广播交易（POST）。 | [`mint/src/api/query/tx.rs:129`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L129) | 有 | **不要执行** |
| `/submit/block` | POST | `hexbody`; POST 请求体：十六进制的交易或区块 | 向节点提交区块（POST）。 | [`mint/src/api/query/tx.rs:167`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/query/tx.rs#L167) | 有 | **不要执行** |
| `/submit/miner/success` | GET | `block_nonce`, `coinbase_nonce`, `height` | 矿工提交的挖矿结果（nonce）。 | [`mint/src/api/miner.rs:57`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L57) | 有 | **不要执行** |
| `/submit/diamondminer/success` | POST | `hexbody`; POST 请求体：十六进制的交易或区块 | 矿工提交的钻石挖矿结果（POST）。 | [`mint/src/api/miner.rs:113`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/mint/src/api/miner.rs#L113) | 有 | **不要执行** |

## 调试（默认关闭）

| 路由 | 方法 | 参数 | 返回内容 | Rust 处理函数（文件:行） | 官方文档中有吗？ | 可以安全调用吗？ |
|---|---|---|---|---|---|---|
| `/debug/contract/storage` | GET | `contract`, `key`, `kind` | 调试：读取合约存储（`contract`、`key`、`kind`）。 | [`vm/src/api.rs:442`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L442) | 无 | 调试 · R5；默认关闭（404） |
| `/debug/p2sh/scriptmh` | GET | `lockbox`, `codeconf`, `libs` | 调试：P2SH 脚本接口（`lockbox`、`codeconf`、`libs`）。 | [`vm/src/api.rs:526`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/vm/src/api.rs#L526) | 无 | 调试 · R5；默认关闭（404） |
| `/debug/pool_print` | GET | — | 调试：打印交易池。 | [`api/src/pool.rs:20`](https://github.com/hacash/fullnode/blob/ce25368a038c5307ab71b5d81cd781cc54fe884d/api/src/pool.rs#L20) | 无 | 调试 · R5；默认关闭（404） |

官方文档：[fullnode_api_doc_v2.md](https://github.com/hacash/doc/blob/main/server/fullnode_api_doc_v2.md)。对已有文档的路由，其参数说明比本表更完整。

本文件由 `scripts/gerar-mapa-rotas.ts` 根据 `api/rotas.json` 生成。如需修改，请改 JSON 或脚本，然后运行 `bun scripts/gerar-mapa-rotas.ts`；`--check` 在文件过期时失败。

Assisted translation; review by native speakers is welcome via issue or PR. 机器辅助翻译；欢迎母语者通过 issue 或 PR 审校。
