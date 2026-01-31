# GitHub Actions 配置说明

## 概述

项目使用 GitHub Actions 进行持续集成和自动构建 Docker 镜像。

## Workflows

### 1. CI Workflow (`ci.yml`)

**触发条件**: Push 到 `main`/`develop` 分支，或 Pull Request

**任务**:
- Type Check - TypeScript 类型检查
- Lint - 代码风格检查（如果配置了）
- Test - 运行测试
- Build - 构建前端和后端
- Docker Build - 测试 Docker 镜像构建（不推送）

### 2. Docker Build Workflow (`docker-build.yml`)

**触发条件**:
- Push 到 `main` 分支
- 创建版本标签（如 `v1.0.0`）
- 手动触发（workflow_dispatch）

**任务**:
- 构建多架构 Docker 镜像（linux/amd64, linux/arm64）
- 推送到 GitHub Container Registry (GHCR)

## 首次配置

### 1. 启用 GitHub Container Registry

在 GitHub 仓库设置中：

```
Settings → Actions → General → Workflow permissions
→ 选择 "Read and write permissions"
→ 保存
```

### 2. 修改镜像仓库路径

编辑 `.github/workflows/docker-build.yml`:

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}  # 自动使用 your-org/consensus
```

如果你的仓库名不是 `consensus`，需要手动指定：

```yaml
env:
  REGISTRY: ghcr.io
  IMAGE_NAME: your-org/your-image-name
```

### 3. （可选）配置自定义标签

编辑 `docker-build.yml` 中的 `tags` 部分：

```yaml
tags: |
  type=ref,event=branch
  type=ref,event=pr
  type=semver,pattern={{version}}
  type=semver,pattern={{major}}.{{minor}}
  type=semver,pattern={{major}}
  type=raw,value=latest,enable={{is_default_branch}}
  # 自定义标签
  type=raw,value=stable,enable={{is_default_branch}}
```

## 使用方式

### 自动构建

```bash
# 推送到 main 分支 -> 自动构建并打上 latest 标签
git push origin main

# 创建版本标签 -> 自动构建并打上版本标签
git tag v1.0.0
git push origin v1.0.0
```

### 手动触发

1. 访问 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Build and Push Docker Image"
4. 点击 "Run workflow" 按钮

## 拉取镜像

```bash
# 登录到 GHCR（如果是私有仓库）
echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u USERNAME --password-stdin

# 或使用 GitHub Personal Access Token
docker login ghcr.io -u your-username -p your-token

# 拉取镜像
docker pull ghcr.io/your-org/consensus:latest
```

## 镜像标签说明

| 标签 | 说明 | 示例 |
|------|------|------|
| `latest` | main 分支的最新构建 | `ghcr.io/your-org/consensus:latest` |
| `main` | main 分支的最新构建 | `ghcr.io/your-org/consensus:main` |
| `v1.0.0` | 完整版本号 | `ghcr.io/your-org/consensus:v1.0.0` |
| `v1.0` | 主.次版本 | `ghcr.io/your-org/consensus:v1.0` |
| `v1` | 主版本 | `ghcr.io/your-org/consensus:v1` |

## 权限设置

Workflow 需要以下权限：

```yaml
permissions:
  contents: read      # 读取仓库内容
  packages: write     # 写入包（推送镜像）
```

这些权限已在 `docker-build.yml` 中配置。

## 故障排除

### 1. 推送失败：Permission Denied

**原因**: Workflow 没有写入包的权限

**解决**: Settings → Actions → General → Workflow permissions → 选择 "Read and write permissions"

### 2. 构建缓存问题

**解决**: 在 workflow 中清除缓存：
```yaml
- name: Clear cache
  run: |
    rm -rf ~/.cache/docker-buildx
```

### 3. 多架构构建失败

**原因**: QEMU 模拟器问题

**解决**: 确保使用最新的 `docker/setup-buildx-action@v3`

## 参考资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Docker Metadata Action](https://github.com/docker/metadata-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
