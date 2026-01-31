# Consensus

AI Agent 多智能体共识系统

## 技术栈

-   **后端**: Bun + Hono + LangGraph + Anthropic/OpenAI
-   **前端**: React 19 + Vite + Tailwind CSS + ShadCN

## 快速开始

### 环境要求

-   Node.js >= 20
-   pnpm >= 8
-   Bun

### 安装

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件填入 API 密钥
```

### 开发

```bash
# 启动所有服务
pnpm dev:all

# 或分别启动
pnpm dev:server   # 后端
pnpm dev:frontend # 前端
```

### 构建

```bash
# 构建所有项目
pnpm build

# 或单独构建
pnpm build:server
pnpm build:frontend
```

## 命令速查

| 命令                | 说明                |
| ------------------- | ------------------- |
| `pnpm dev:all`      | 启动前后端          |
| `pnpm dev:server`   | 启动后端            |
| `pnpm dev:frontend` | 启动前端            |
| `pnpm build`        | 构建所有项目        |
| `pnpm type-check`   | TypeScript 类型检查 |

## 许可证

[MIT](./LICENSE)
