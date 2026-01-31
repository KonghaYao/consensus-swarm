# Submessages 侧边栏功能 - 实现计划

## 目标

在 Chat 工具消息中添加可点击的 submessages 指示器，点击后在右侧固定侧边栏中展示所有 submessages 的详细内容。侧边栏应"占有位置"（推开主内容）而不是覆盖式弹窗。

## 背景

- `ToolMessage.tsx` 只展示最后一个 submessage (`message.sub_messages?.at(-1)`)
- 没有可点击的 UI 元素来查看所有 submessages
- 消息数据结构已包含 `sub_messages?: RenderMessage[]` 属性

## 实现方案

### 1. 创建 SubmessagesDrawerContext（状态管理）

**文件**: `frontend/src/contexts/SubmessagesDrawerContext.tsx`

新建一个独立的 Context 来管理 submessages 侧边栏状态。

```typescript
interface SubmessagesDrawerContextValue {
  open: boolean;
  submessages: RenderMessage[] | null;
  agentName: string | null;
  agentAvatar: string | null;
  openDrawer: (submessages: RenderMessage[], agentName: string, agentAvatar: string) => void;
  closeDrawer: () => void;
}
```

### 2. 创建 SubmessagesDrawer 组件

**文件**: `frontend/src/components/chat/SubmessagesDrawer.tsx`

固定定位的侧边栏组件：
- 使用 `fixed right-0 top-0` 定位
- 响应式宽度：移动端全宽，桌面端 320px/384px/450px
- 使用 `translate-x-0` / `translate-x-full` 实现滑入/滑出动画
- 头部显示 Agent 头像、名称和 submessage 数量
- 内容区域使用 ScrollArea，每个 submessage 以卡片形式展示

### 3. 修改 ToolMessage 组件

**文件**: `frontend/src/components/chat/ToolMessage.tsx`

在现有代码基础上添加：
- 导入 `useSubmessagesDrawer` hook 和 Badge 组件
- 检查 `message.sub_messages` 数量
- 添加可点击的 Badge 显示 submessage 数量
- 点击时调用 `openDrawer()` 打开侧边栏

```typescript
{hasSubmessages && (
  <div className="pt-1">
    <Badge
      variant="secondary"
      className="cursor-pointer hover:bg-secondary/80 transition-colors"
      onClick={() => openDrawer(submessages, agentName, avatarSrc)}
    >
      <MessageSquare className="w-3 h-3 mr-1" />
      {submessages.length} submessage{submessages.length > 1 ? 's' : ''}
    </Badge>
  </div>
)}
```

### 4. 修改 ChatPage 布局

**文件**: `frontend/src/pages/ChatPage.tsx`

让主内容区根据侧边栏状态动态调整宽度：
- 导入 `useSubmessagesDrawer` hook
- 获取 `open: submessagesOpen` 状态
- 为主内容区添加动态类名：`submessagesOpen && 'mr-80 md:mr-96 lg:mr-[450px]'`
- 添加 `transition-all duration-300` 实现平滑过渡

### 5. 集成到 App

**文件**: `frontend/src/App.tsx`

- 导入 `SubmessagesDrawerProvider` 和 `SubmessagesDrawer`
- 在现有 Provider 内部嵌套新的 Provider
- 在组件树根部放置 `SubmessagesDrawer` 组件

## 需要修改的文件

### 新建文件
1. `frontend/src/contexts/SubmessagesDrawerContext.tsx` - Context 和 Provider
2. `frontend/src/components/chat/SubmessagesDrawer.tsx` - 侧边栏组件

### 修改文件
1. `frontend/src/App.tsx` - 添加 Provider 和 Drawer 组件
2. `frontend/src/components/chat/ToolMessage.tsx` - 添加 Badge 触发器
3. `frontend/src/pages/ChatPage.tsx` - 添加动态布局调整

## UI 设计

### Badge（触发器）
- 位置：ToolMessage 最后一行下方
- 样式：Secondary variant，带 hover 效果
- 图标：MessageSquare (lucide-react)
- 文本：显示数量（如 "3 submessages"）

### 侧边栏布局
```
┌─────────────────────────────┐
│ Header (h-14)               │
│ ├─ Agent Avatar + Name      │
│ ├─ Submessage count         │
│ └─ Close button (X)         │
├─────────────────────────────┤
│ Scrollable Content          │
│ ┌─────────────────────────┐ │
│ │ Submessage 1 (1/3)      │ │
│ │ ├─ Mini avatar          │ │
│ │ ├─ Agent name           │ │
│ │ └─ Content (markdown)   │ │
│ ├─────────────────────────┤ │
│ │ Submessage 2 (2/3)      │ │
│ │ └─ ...                  │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 交互行为
1. 点击 Badge → 侧边栏滑入，主内容区被"推开"（添加右边距）
2. 点击 X 按钮 → 侧边栏滑出，主内容区恢复原始宽度
3. 所有动画使用 300ms 过渡

## 关键实现细节

### 侧边栏定位
```tsx
<div
  className={cn(
    'fixed right-0 top-0 h-full bg-background border-l shadow-lg',
    'transition-transform duration-300 ease-in-out z-40',
    'w-full sm:w-80 md:w-96 lg:w-[450px]',
    open ? 'translate-x-0' : 'translate-x-full'
  )}
>
```

### 主内容区动态边距
```tsx
<div
  className={cn(
    'flex-1 flex flex-col bg-white transition-all duration-300',
    submessagesOpen && 'mr-80 md:mr-96 lg:mr-[450px]'
  )}
>
```

## 响应式设计

| 断点 | 侧边栏宽度 | 主内容区右边距 |
|------|-----------|---------------|
| 基础（移动端） | 100% | - |
| sm (640px+) | 320px | 320px |
| md (768px+) | 384px | 384px |
| lg (1024px+) | 450px | 450px |

## 测试验证

- [x] Badge 在有 submessages 时正确显示
- [x] Badge 显示正确的数量
- [x] 点击 Badge 打开右侧侧边栏
- [x] 侧边栏显示所有 submessages（按顺序）
- [x] 侧边栏可通过 X 按钮关闭
- [x] 主内容区在侧边栏打开时被"推开"
- [x] 内容溢出时可滚动
- [x] 响应式布局正常工作
- [x] 平滑过渡动画效果
- [x] 无 TypeScript 编译错误

## 实现日期

2025-01-31

## 实现状态

✅ 已完成
