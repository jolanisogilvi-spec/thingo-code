# Thingo Code

Thingo Code 是由 **Thingo** 开发的 AI 编程助手。它提供可视化对话、代码编辑、终端执行、文件浏览、Git 操作、技能、MCP 和自动化能力，并默认在本机运行。

> 兼容说明：当前发行包继续使用 `@openhands/agent-canvas`、`agent-canvas` 命令以及 `openhands` 后端协议值。这些名称只用于保持安装和 API 兼容，不代表产品身份。

## 从安装到第一次任务

1. **安装**：Windows 用户安装 Thingo Code 桌面包；开发者可使用 `npx @openhands/agent-canvas` 或源码启动。
2. **启动**：桌面版已经内置 Python 3.12、Node.js、`uv` 和后端依赖缓存，无需依赖本机 Python；npm/源码模式首次运行需要联网下载依赖。
3. **配置 LLM**：在“设置 → LLM”选择“Thingo 大模型聚合平台”，填入 API Key。默认模型是 `openai/deepseek-v4-flash`，端点为 `https://uniapi.thingo.com.cn/v1`。
4. **选择工作区**：只选择可信且需要代理访问的项目目录，并保留 Git 提交或备份。
5. **创建会话**：描述目标、约束和验收条件，然后在对话、文件、终端与 Git 区域审阅工作结果。

详细的安装、首次配置、常用功能及排障流程见[快速开始指南](./docs/GETTING_STARTED.md)。

## 环境要求

Windows 桌面安装包不需要预装 Node.js 或 Python。下列要求仅适用于 npm CLI 和源码开发：

- Node.js 22.12.0 或更高版本
- npm
- 直接运行源码或 npm CLI 时，可访问 npm 与 Python 包源的网络
- 一个可用的 LLM API 密钥或兼容模型服务

桌面构建和完整本地栈会通过 `uvx` 启动兼容的 Agent Server。桌面发行包在构建阶段会把固定版本的 Python 依赖预热到安装包内，安装后的首次启动不再现场下载；源码开发可以手动执行 `npm run prewarm-uv-cache` 达到同样效果。预热缓存按操作系统和 CPU 架构生成，不提交到源码仓库。

## 安装与启动

### 直接运行

```bash
npx @openhands/agent-canvas
```

启动完成后访问 [http://localhost:8000](http://localhost:8000)。

### 全局安装

```bash
npm install -g @openhands/agent-canvas
agent-canvas
```

### 从源码运行

```bash
npm install
npm run dev
```

开发模式默认启动前端、Agent Server、自动化服务与统一入口。只启动最小开发栈可使用：

```bash
npm run dev:minimal
```

## 第一次使用

1. 启动 Thingo Code 并打开浏览器页面。
2. 首次引导默认显示简体中文，可在“设置 → 应用”切换为 English。
3. 保持唯一的 Agent 为 **Thingo Code**。
4. 在 LLM 设置中选择“Thingo 大模型聚合平台”、默认 DeepSeek 模型并填写 API 密钥；也可在高级设置中填写获授权的其他模型 ID。
5. 选择本地工作目录或仓库。
6. 输入第一个任务并发送。新会话会自动携带 Thingo Code 身份提示。
7. 如需扩展能力，可继续配置技能、MCP、Secrets 和自动化。

旧版本保存的其他 Agent、Agent Profile 或 Cloud 配置不会被删除，但 Thingo Code 不再提供这些 Agent 的选择入口，也不会使用它们启动新会话。

## 常用命令

```bash
npm run dev
npm run build
npm run build:lib
npm run prewarm-uv-cache
npm run lint
npm test
npm run check-translation-completeness
npm run check-thingo-brand
```

## 文档

- [快速开始](./docs/GETTING_STARTED.md)：安装、首次 LLM 配置、工作区、常用功能与排障。
- [开发指南](./docs/DEVELOPMENT.md)：本地开发、构建、测试和环境变量。
- [架构](./docs/architecture.md)：系统边界、运行模式与发布结构。
- [自托管指南](./docs/SELF_HOSTING.md)：在受保护的服务器上运行。
- [全部文档索引](./docs/README.md)。

## 配置

常用环境变量：

- `VITE_BACKEND_BASE_URL`：本地 Agent Server 地址。
- `VITE_SESSION_API_KEY`：可选的会话认证密钥。
- `VITE_WORKING_DIR`：新会话默认工作目录。
- `VITE_ENABLE_BROWSER_TOOLS=false`：禁用新会话的浏览器工具。
- `VITE_BASE_PATH`：在子路径下部署前端。
- `VITE_DO_NOT_TRACK=1`：关闭默认遥测。

## 项目边界

本仓库负责 Thingo Code 的 React/TypeScript 前端、桌面壳、前端服务适配和本地栈启动。后端 Agent Server、TypeScript 客户端和扩展技能仍使用其真实的上游包名与 API 契约，以保证兼容性和许可证归属准确。

主要目录：

- `src/`：页面、组件、状态、前端 API 适配与内置提示。
- `electron/`：Thingo Code 桌面应用。
- `scripts/`：开发、构建与运行脚本。
- `docs/`：开发、自托管、架构和测试文档。
- `tests/`、`__tests__/`：单元测试与端到端测试。

## 许可证与上游组件

本项目遵循仓库中的 MIT License。Thingo Code 使用多个开源上游组件，包括 `@openhands/typescript-client`、`@openhands/extensions` 和兼容的 OpenHands Agent Server。上游名称、仓库链接、版权和许可证声明保持原样；它们是技术依赖，不是 Thingo Code 的产品身份。
