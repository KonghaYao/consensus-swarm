/**
 * Code-Graph Server
 * 使用新的 @codegraph/agent 包
 */

import { consensusGraph } from './agent/consensus-graph.js';
import LGApp from '@langgraph-js/pure-graph/dist/adapter/hono';
import { logger } from 'hono/logger';

// 注册 graph（使用新的包）
import { registerGraph } from '@langgraph-js/pure-graph';
import { Hono } from 'hono';

registerGraph('consensusGraph', consensusGraph);

const app = new Hono()

// 日志中间件
app.use(logger());

app.route("/api/langgraph", LGApp)

export default {
  fetch: app.fetch,
  port: 8123,
};
