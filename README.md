# Consensus

AI Agent 多智能体共识系统 - 使用 LangGraph 实现多智能体结构化讨论和共识达成。

## 技术栈

-   **后端**: Bun + Hono + LangGraph + Anthropic/OpenAI
-   **前端**: React 19 + Vite + Tailwind CSS + ShadCN
-   **容器**: Docker + Docker Compose

## 功能特性

- 多智能体角色扮演和观点表达
- 结构化讨论流程（讨论 → 投票 → 检查共识 → 总结）
- 实时聊天界面，支持流式响应
- Agent 配置管理（创建、编辑、删除）
- 会议历史记录
- 投票追踪和共识检查

## 快速开始

### 方式一：使用 Docker（推荐）

#### 环境要求
- Docker
- Docker Compose

#### 选项 A: 使用预构建镜像（推荐）

```bash
# 1. 拉取镜像
docker pull ghcr.io/your-org/consensus:latest

# 2. 配置环境变量
cat > .env << EOF
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=  # optional
EOF

# 3. 运行容器
docker run -d \
  --name consensus \
  -p 8123:8123 \
  --env-file .env \
  -v consensus-data:/app/.langgraph_api \
  ghcr.io/your-org/consensus:latest

# 4. 访问应用
# 前端 + 后端: http://localhost:8123
```

#### 选项 B: 使用 Docker Compose

```bash
# 1. 克隆仓库
git clone <repository-url>
cd consensus

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 OPENAI_API_KEY

# 3. 修改 docker-compose.yml 使用预构建镜像
# 将 image: ghcr.io/your-org/consensus:latest 替换 build: .

# 4. 启动服务
docker-compose up -d

# 5. 访问应用
# 前端 + 后端: http://localhost:8123
# API 端点: http://localhost:8123/api/*
```

#### 选项 C: 本地构建

```bash
# 1. 克隆仓库
git clone <repository-url>
cd consensus

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 OPENAI_API_KEY

# 3. 构建并启动
docker-compose up -d --build

# 4. 访问应用
# 前端 + 后端: http://localhost:8123
```

#### Docker 命令

```bash
# 查看日志
docker-compose logs -f
# 或
docker logs -f consensus

# 停止服务
docker-compose down
# 或
docker stop consensus && docker rm consensus

# 重新构建并启动
docker-compose up -d --build

# 清理数据卷（慎用！）
docker-compose down -v

# 进入容器
docker exec -it consensus sh
```

#### 可用的 Docker 镜像标签

- `latest` - 最新的 main 分支构建
- `v1.0.0` - 特定版本
- `v1.0` - 次版本
- `v1` - 主版本
- `main` - main 分支的最新构建

### 方式二：本地开发

#### 环境要求
- Node.js >= 20
- pnpm >= 10
- Bun

#### 安装

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件填入 API 密钥
```

#### 开发

```bash
# 启动所有服务
pnpm dev:all

# 或分别启动
pnpm dev:server   # 后端 (端口 8123)
pnpm dev:frontend # 前端 (端口 5173)
```

#### 构建

```bash
# 构建所有项目
pnpm build

# 或单独构建
pnpm build:server
pnpm build:frontend

# 类型检查
pnpm type-check
```

## 项目结构

```
consensus/
├── server/              # 后端 (Bun + Hono + LangGraph)
│   ├── src/
│   │   ├── agent/      # Agent 逻辑和图
│   │   ├── config/     # Agent 配置
│   │   ├── routes/     # API 路由
│   │   └── utils/      # 工具函数
├── frontend/           # 前端 (React + Vite)
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       └── lib/
├── docs/               # 额外文档
├── Dockerfile          # Docker 构建文件
└── docker-compose.yml  # Docker Compose 配置
```

## 命令速查

| 命令                   | 说明                      |
| ---------------------- | ------------------------- |
| `docker-compose up -d` | 使用 Docker 启动          |
| `pnpm dev:all`         | 启动前后端                |
| `pnpm dev:server`      | 启动后端                  |
| `pnpm dev:frontend`    | 启动前端                  |
| `pnpm build`           | 构建所有项目              |
| `pnpm type-check`      | TypeScript 类型检查       |
| `pnpm test`            | 运行测试                  |

## 配置说明

### 环境变量

| 变量名               | 必填 | 说明                              |
| -------------------- | ---- | --------------------------------- |
| `OPENAI_API_KEY`     | 是   | OpenAI API 密钥                   |
| `OPENAI_BASE_URL`    | 否   | 自定义 API 基础 URL               |
| `SQLITE_DATABASE_URL`| 否   | SQLite 数据库路径（默认: `./.langgraph_api/langgraph.db`） |
| `DATABASE_URL`       | 否   | PostgreSQL 连接字符串（可选）      |
| `DATABASE_NAME`      | 否   | PostgreSQL 数据库名（可选）        |

### Agent 配置

Agent 角色配置文件位于 `server/src/config/agents/`，每个配置包含：

- `role`: 角色名称、描述、视角、系统提示词
- `model`: 提供商、模型名称、是否启用思考模式
- `tools`: 启用的工具（搜索、代码执行等）

详细说明请参考 [AGENTS.md](AGENTS.md)

## 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

## 文档

- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [AGENTS.md](AGENTS.md) - Agent 配置说明
- [DESIGN.md](DESIGN.md) - 设计文档
- [CHANGELOG.md](CHANGELOG.md) - 变更日志
- [SECURITY.md](SECURITY.md) - 安全政策

## 许可证

[MIT](./LICENSE)
