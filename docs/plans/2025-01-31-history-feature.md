# History 功能集成计划

## 概述

在 Web Chat 应用中集成历史记录（History）功能，允许用户查看、搜索和切换到之前的对话。

## 技术栈

- **框架**: React 19 + TypeScript
- **UI 组件**: Radix UI (Sheet, Button, ScrollArea, Input)
- **样式**: Tailwind CSS 4
- **图标**: lucide-react
- **SDK**: @langgraph-js/sdk/react

## 架构设计

### 1. 组件结构

```
ChatPage
├── ChatHeader (添加历史记录按钮)
└── HistorySidebar (新增)
    ├── Header (标题 + 新建对话按钮)
    ├── SearchBar (搜索输入框)
    ├── HistoryList (滚动列表)
    │   └── HistoryItem (单个历史记录项)
    └── Footer (统计信息)
```

### 2. useChat Hook API

根据 `@langgraph-js/sdk/react`，使用以下 API：

```typescript
const {
  historyList,              // Thread[] - 历史对话列表
  currentChatId,            // string - 当前对话 ID
  refreshHistoryList,       // () => Promise<void> - 刷新历史列表
  toHistoryChat,            // (thread: Thread) => Promise<void> - 切换到历史对话
  createNewChat,            // () => Promise<void> - 创建新对话
  deleteHistoryChat,        // (thread: Thread) => Promise<void> - 删除历史对话
} = useChat();
```

### 3. 数据结构

```typescript
interface Thread {
  thread_id: string;
  created_at: string;
  updated_at: string;
  status?: 'idle' | 'busy' | 'interrupted' | 'error';
  metadata?: Record<string, any>;
}
```

## UI/UX 设计

### 布局方案

**方案 A: 侧边抽屉（推荐）**
- 使用 Radix UI Sheet 组件
- 从右侧滑出
- 宽度: 320-400px
- 遮罩层点击关闭

**方案 B: 侧边栏**
- 固定在左侧
- 可折叠/展开
- 需要调整主聊天区域布局

### HistoryItem 设计

```tsx
<div className="flex items-start gap-3 p-3 hover:bg-secondary rounded-lg cursor-pointer transition-colors">
  <Avatar type="bot" src={agent.avatar} />
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between mb-1">
      <span className="font-medium text-sm truncate">对话标题</span>
      <span className="text-xs text-muted-foreground">2小时前</span>
    </div>
    <p class="text-xs text-muted-foreground line-clamp-2">
      最后一条消息预览...
    </p>
    <div className="flex items-center gap-2 mt-1">
      <Badge variant="outline" className="text-xs">
        {agentCount} Agents
      </Badge>
      <Badge variant={statusColor} className="text-xs">
        {statusText}
      </Badge>
    </div>
  </div>
</div>
```

### 交互流程

1. **打开历史记录**
   - 点击 ChatHeader 中的"历史记录"按钮
   - 侧边栏从右侧滑出
   - 自动刷新历史列表（如果需要）

2. **切换对话**
   - 点击历史记录项
   - 调用 `toHistoryChat(thread)`
   - 关闭侧边栏
   - 主区域加载选中对话

3. **新建对话**
   - 点击顶部"新建对话"按钮
   - 调用 `createNewChat()`
   - 关闭侧边栏
   - 返回初始化表单（如果配置了）

4. **删除对话**
   - HistoryItem 右侧显示删除按钮（hover 显示）
   - 点击后确认删除
   - 刷新列表

## 实现步骤

### Phase 1: 基础组件（核心功能）

1. **创建 HistorySidebar 组件**
   - 文件: `src/components/chat/HistorySidebar.tsx`
   - 使用 Radix UI Sheet
   - 集成 useChat API
   - 实现基础列表展示

2. **实现 HistoryItem 组件**
   - 文件: `src/components/chat/HistoryItem.tsx`
   - 显示对话信息
   - 支持 active 状态
   - 时间格式化

3. **集成到 ChatPage**
   - 添加显示/隐藏状态
   - 在 ChatHeader 添加按钮
   - 连接交互逻辑

### Phase 2: 增强功能

1. **搜索功能**
   - 添加搜索输入框
   - 实现客户端搜索（过滤 thread_id 或 metadata）

2. **状态筛选**
   - 添加状态标签切换（全部/进行中/已完成）
   - 过滤列表显示

3. **时间排序**
   - 按更新时间排序
   - 支持升序/降序切换

### Phase 3: 优化体验

1. **加载状态**
   - 列表加载骨架屏
   - 下拉刷新

2. **空状态**
   - 无历史记录时的提示
   - 引导用户开始新对话

3. **性能优化**
   - 虚拟滚动（如果历史记录很多）
   - 图片懒加载

## 技术细节

### 1. 时间格式化

```typescript
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 小于 1 分钟
  if (diff < 60000) return '刚刚';

  // 小于 1 小时
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;

  // 小于 1 天
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;

  // 小于 7 天
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  // 其他情况显示完整日期
  return date.toLocaleDateString();
}
```

### 2. 状态标识

```typescript
function getStatusInfo(status?: string) {
  switch (status) {
    case 'idle':
      return { label: '已完成', color: 'bg-green-500' };
    case 'busy':
      return { label: '进行中', color: 'bg-blue-500' };
    case 'interrupted':
      return { label: '已中断', color: 'bg-yellow-500' };
    case 'error':
      return { label: '错误', color: 'bg-red-500' };
    default:
      return { label: '未知', color: 'bg-gray-500' };
  }
}
```

### 3. 搜索实现

```typescript
const [searchQuery, setSearchQuery] = useState('');

const filteredList = useMemo(() => {
  if (!searchQuery) return historyList;

  const query = searchQuery.toLowerCase();
  return historyList.filter(thread =>
    thread.thread_id.toLowerCase().includes(query) ||
    thread.metadata?.topic?.toLowerCase().includes(query)
  );
}, [historyList, searchQuery]);
```

## 文件清单

### 新建文件

```
src/components/chat/
├── HistorySidebar.tsx       # 主组件
├── HistoryItem.tsx          # 历史记录项组件
└── index.ts                 # 导出（更新）
```

### 修改文件

```
src/pages/ChatPage.tsx       # 集成 HistorySidebar
src/components/chat/ChatHeader.tsx  # 添加历史记录按钮
src/components/chat/index.ts        # 导出新组件
```

## 依赖检查

确保以下依赖已安装：

```json
{
  "@radix-ui/react-sheet": "^1.x",  // 抽屉组件
  "@radix-ui/react-scroll-area": "^1.x",  // 滚动区域
  "lucide-react": "^0.x",  // 图标
  "date-fns": "^3.x"  // 时间处理（可选）
}
```

## 测试计划

1. **功能测试**
   - 打开/关闭侧边栏
   - 显示历史列表
   - 切换对话
   - 新建对话
   - 搜索功能

2. **边界情况**
   - 空历史列表
   - 搜索无结果
   - 加载失败
   - 网络错误

3. **性能测试**
   - 大量历史记录（100+）
   - 频繁切换对话

## 后续扩展

- 导出对话记录
- 对话标签管理
- 对话分组（按时间/标签）
- 对话统计信息
- 对话分享功能
