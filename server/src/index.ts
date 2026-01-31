/**
 * Code-Graph Server
 * 使用新的 @codegraph/agent 包
 */

import { consensusGraph } from './agent/consensus-graph.js';
import LGApp from '@langgraph-js/pure-graph/dist/adapter/hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/serve-static';
import { join } from 'path';

// 注册 graph（使用新的包）
import { registerGraph } from '@langgraph-js/pure-graph';
import { Hono } from 'hono';
import agentsRoutes from './routes/agents.routes.js';

registerGraph('consensusGraph', consensusGraph);

const app = new Hono()

// 日志中间件
app.use(logger());

// CORS 中间件 - 允许开发环境的前端地址和生产环境的同源请求
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8123'],
  credentials: true,
}));

// API 路由（优先匹配）
app.route("/api/langgraph", LGApp);
app.route("/api/agents", agentsRoutes);

// 静态文件服务 - 提供前端构建产物
// 使用绝对路径避免路径解析问题
const frontendDist = join(process.cwd(), 'server', 'dist', 'frontend');

app.use('/*', serveStatic({
  root: frontendDist,
  onFound: (path, c) => {
    c.header('Cache-Control', 'public, max-age=3600');
  }
}));

// SPA fallback - 对于非 API 路由，返回 index.html
app.get('*', async (c) => {
  const indexPath = join(frontendDist, 'index.html');
  const html = await Bun.file(indexPath).text();
  return c.html(html);
});

export default {
  fetch: app.fetch,
  port: 8123,
};
