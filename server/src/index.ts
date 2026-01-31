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

const app = new Hono();

// 日志中间件
app.use(logger());

// CORS 中间件 - 允许开发环境的前端地址和生产环境的同源请求
app.use(
    '*',
    cors({
        origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:8123'],
        credentials: true,
    }),
);

// API 路由（优先匹配）
app.route('/api/langgraph', LGApp);
app.route('/api/agents', agentsRoutes);

// 静态文件服务 - 提供前端构建产物
// 前端文件路径：{process.cwd()}/server/dist/frontend/
const frontendDist = join(process.cwd(), 'server', 'dist', 'frontend');

// 静态资源服务 - 手动处理以避免 serveStatic 的问题
app.get('/assets/*', async (c) => {
    const filePath = c.req.path;
    const fullPath = join(frontendDist, filePath);

    try {
        const file = Bun.file(fullPath);
        const content = await file.arrayBuffer();

        // 设置正确的 MIME 类型
        const ext = filePath.split('.').pop();
        const mimeTypes: Record<string, string> = {
            js: 'application/javascript',
            css: 'text/css',
            html: 'text/html',
            svg: 'image/svg+xml',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/gif',
            ico: 'image/x-icon',
            woff: 'font/woff',
            woff2: 'font/woff2',
            ttf: 'font/ttf',
            eot: 'application/vnd.ms-fontobject',
        };

        const mimeType = mimeTypes[ext || ''] || 'application/octet-stream';

        return new Response(content, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=3600',
            },
        });
    } catch (error) {
        return c.text('File not found', 404);
    }
});

// favicon
app.get('/vite.svg', async (c) => {
    const fullPath = join(frontendDist, '/vite.svg');
    const file = Bun.file(fullPath);
    return new Response(file);
});

// 根路径和所有其他路由 - 返回 index.html（SPA 路由）
app.get('*', async (c) => {
    const indexPath = join(frontendDist, 'index.html');
    const html = await Bun.file(indexPath).text();
    return c.html(html);
});

export default {
    fetch: app.fetch,
    port: 8123,
    hostname: '0.0.0.0',
};
