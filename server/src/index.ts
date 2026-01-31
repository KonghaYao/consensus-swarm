/**
 * Code-Graph Server
 * 使用新的 @codegraph/agent 包
 */

import { consensusGraph } from './agent/consensus-graph.js';
import LGApp from '@langgraph-js/pure-graph/dist/adapter/hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// 注册 graph（使用新的包）
import { registerGraph } from '@langgraph-js/pure-graph';
import { Hono } from 'hono';
import agentsRoutes from './routes/agents.routes.js';

registerGraph('consensusGraph', consensusGraph);

const app = new Hono()

// 日志中间件
app.use(logger());

// CORS 中间件
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));

// 注册路由
app.route("/api/langgraph", LGApp);
app.route("/api/agents", agentsRoutes);

export default {
  fetch: app.fetch,
  port: 8123,
};
