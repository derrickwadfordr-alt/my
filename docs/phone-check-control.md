# 查手机增强控制功能

## 功能概述

这是对原有「查手机」功能的增强版本，让 AI 角色可以**真实控制**用户的手机屏幕，而不仅仅是描述查看内容。

## 核心特性

### 1. 实时屏幕控制
- AI 的操作会实时反馈到用户屏幕
- 支持滑动、打开应用、切换聊天、输入文字等操作
- 用户能看到角色"真的在操作"

### 2. 身份伪装发消息
- AI 可以用用户身份发送消息
- 这些消息会被记录在查手机日志中
- 不会被角色误认为是用户说的话

### 3. 控制权交接
- AI 可以主动释放控制权
- 用户操作会被监听并记录
- 下次 AI 调用时会看到用户做了什么

### 4. 应用白名单
- 查手机时只显示生活应用（微信、备忘录、相册等）
- 元设定应用（工坊、设置）在提示词中被隐藏
- AI 不会问"工坊是什么"之类的出戏问题

### 5. 结构化指令输出
- AI 输出 JSON 格式的操作序列
- 系统解析后真实执行
- 而非纯文字描述

## 使用方法

### 启用功能

1. 打开「设置 → 工具箱 → 内部能力」
2. 找到「查手机（增强控制）」
3. 启用该能力

### AI 调用示例

AI 需要输出以下格式的 JSON 指令：

```json
{
  "actions": [
    {"type":"goHome"},
    {"type":"wait","ms":1000},
    {"type":"openApp","appId":"chat"},
    {"type":"wait","ms":1500},
    {"type":"openContact","contactId":"char_123","contactName":"小明"},
    {"type":"typeText","target":"chat","contactId":"char_123","content":"在吗"},
    {"type":"sendMessage","contactId":"char_123","contactName":"小明","content":"在吗"}
  ]
}
```

### 可用操作类型

| 操作 | 参数 | 说明 |
|-----|------|------|
| `swipe` | `direction` (left/right/up/down) | 滑动屏幕 |
| `goHome` | 无 | 返回主屏幕 |
| `goBack` | 无 | 返回上一页 |
| `openApp` | `appId` (chat/notes/photos/browser等) | 打开应用 |
| `openContact` | `contactId`, `contactName` | 打开某人的聊天 |
| `openNotes` | 无 | 打开备忘录 |
| `typeText` | `target` (notes/chat), `contactId`, `content` | 输入文字 |
| `sendMessage` | `contactId`, `contactName`, `content` | 用用户身份发消息 |
| `wait` | `ms`, `reason` | 等待（毫秒） |
| `releaseControl` | `message` | 释放控制权给用户 |
| `resumeControl` | 无 | 重新接管控制权 |
| `exit` | 无 | 退出查手机模式 |

### 控制权交接示例

```json
{
  "actions": [
    {"type":"openApp","appId":"notes"},
    {"type":"wait","ms":2000},
    {"type":"typeText","target":"notes","content":"你看到这段话的时候"},
    {"type":"wait","ms":1500},
    {"type":"releaseControl","message":"你自己继续写吧，我等会儿看"}
  ]
}
```

用户操作后，AI 下次调用时会收到：
```
【用户之前的操作】
[14:32] 用户输入了：，我
[14:32] 用户输入了：在
[14:32] 用户输入了：想你
[14:33] 用户返回主屏幕
```

### 身份伪装发消息示例

```json
{
  "actions": [
    {"type":"openContact","contactId":"char_abc","contactName":"小王"},
    {"type":"sendMessage","contactId":"char_abc","contactName":"小王","content":"明天有空吗？"}
  ]
}
```

这条消息会：
- 真的发送给小王
- 记录为"角色用用户身份发的"
- 不会让角色误以为是用户说的

### 查手机日志

AI 发送的消息会被记录：
```
【你发送的消息记录】
[14:30] 小明用{{user}}的身份给小王发送了：明天有空吗？
[14:35] 小明用{{user}}的身份给老板发送了：我明天请假
```

## 提示词适配

系统会在提示词中告诉 AI：

- 你在**真实控制**用户手机，不是描述
- 手机上只有生活应用，没有工坊、设置等
- 输出 JSON 操作序列，系统会解析执行
- 可以用 `sendMessage` 伪装身份发消息
- 可以用 `releaseControl` 让用户操作

## 技术架构

### 核心模块

- `lib/phone-check-control.ts` - 控制会话管理
- `lib/internal-capability-storage.ts` - 内部能力注册
- `lib/tool-executor.ts` - 工具执行逻辑
- `components/phone-check-overlay.tsx` - UI 叠加层
- `components/main-app.tsx` - 主应用集成

### 状态管理

会话状态包括：
- `controlState`: "ai" | "user" | "transitioning"
- `actionQueue`: 待执行的操作队列
- `userActions`: 用户操作记录
- `sentMessages`: AI 发送的消息记录

### UI 反馈

- AI 控制时：顶部显示红色提示条，屏幕半透明遮罩禁用用户操作
- 用户控制时：顶部显示绿色提示条，用户可自由操作
- 底部显示当前执行的操作（如"正在输入文字"）

## 注意事项

1. **操作要自然**：添加适当的 `wait` 操作，模拟真人思考和操作节奏
2. **先打开再操作**：输入文字或发消息前，确保已打开对应应用
3. **谨慎发送消息**：`sendMessage` 会真的发出去，AI 要理解这个操作的后果
4. **控制权交接**：释放控制权后要等待用户操作，不要立即结束
5. **应用 ID 正确**：确保 `appId` 和 `contactId` 正确，否则操作会失败

## 未来扩展

可能的增强方向：
- 支持更多应用（相册浏览、浏览器操作等）
- 手势识别（长按、双击等）
- 语音输入模拟
- 截图功能
- 更精细的权限控制
