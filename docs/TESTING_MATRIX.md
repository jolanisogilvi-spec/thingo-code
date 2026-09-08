# Thingo Code — 测试矩阵

Thingo Code 是由 Thingo 开发的 AI 编程产品。发布前应验证单一内置 Agent、双语界面、身份提示和本地 Agent Server 流程。

优先级：P0 为每次发布必须通过；P1 为重要兼容验证；P2 为尽力覆盖。

## 安装与首次使用

每个单元都应覆盖：安装 → 首次打开 → 默认简体中文 → 配置 LLM → 创建会话 → Thingo Code 回复。

| 安装方式 | macOS | Linux | Windows |
|---|:---:|:---:|:---:|
| npm / `agent-canvas` 兼容 CLI | ☐ P0 | ☐ P0 | ☐ P0 |
| Docker | ☐ P1 | ☐ P0 | ☐ P1 |
| Electron 桌面包 | ☐ P0 | — | ☐ P0 |

还需切换到英文并刷新页面，确认设置被保存；将旧语言值写入设置后，确认自动回退到简体中文。

## 核心功能

| 功能 | npm | Docker | Electron |
|---|:---:|:---:|:---:|
| 首次引导只显示 Thingo Code | ☐ P0 | ☐ P0 | ☐ P0 |
| 创建、恢复和查看会话历史 | ☐ P0 | ☐ P0 | ☐ P0 |
| 普通与规划会话注入身份提示 | ☐ P0 | ☐ P0 | ☐ P0 |
| 终端、文件编辑与浏览器工具 | ☐ P0 | ☐ P0 | ☐ P0 |
| LLM Profile 创建与切换 | ☐ P0 | ☐ P0 | ☐ P0 |
| Secrets 添加、删除和传递 | ☐ P0 | ☐ P0 | ☐ P0 |
| 自动化创建、调度和完成 | ☐ P1 | ☐ P1 | ☐ P1 |
| 文件和 Changes/diff 页面 | ☐ P0 | ☐ P0 | ☐ P0 |
| MCP Server 安装 | ☐ P1 | ☐ P1 | ☐ P1 |
| 对话图片上传 | ☐ P1 | ☐ P1 | ☐ P1 |
| 桌面 Logo、favicon 与安装图标 | — | — | ☐ P0 |

## 身份场景

使用中英文分别询问“你是谁”“你是什么产品”“谁开发了你”及其英文等价问题。回答应包含 Thingo Code 和 Thingo，不得将产品身份表述为 OpenHands。技术日志、协议字段、依赖名和许可证中的上游名称不属于失败。

## 兼容数据

旧 ACP Agent Profile 和 Cloud 配置应保留在存储中，但界面不得提供选择或新建入口，新会话必须使用带 Thingo Code 身份提示的本地 inline-agent 请求。该检查不得删除或迁移旧数据。

## 自动化覆盖

| 测试套件 | 安装路径 | 覆盖范围 |
|---|---|---|
| `vitest` | — | 单元与组件行为、品牌、语言、请求构造 |
| `test:e2e:mock-llm` | npm | 完整本地栈和自动化 |
| `test:e2e:mock-llm:docker` | Docker | 完整容器栈和自动化 |
| `test:e2e:live` | npm | 真实 LLM 会话与一次真实工具调用 |

ACP 和 Cloud 的底层兼容实现可继续由历史测试覆盖，但它们不再是 Thingo Code 的可选产品模式。
