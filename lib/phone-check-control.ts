/**
 * 查手机增强控制系统
 * 支持 AI 实时控制用户屏幕、控制权交接、身份伪装发消息等功能
 */

export type PhoneCheckControlAction =
  | { type: "swipe"; direction: "left" | "right" | "up" | "down" }
  | { type: "goHome" }
  | { type: "goBack" }
  | { type: "openApp"; appId: string }
  | { type: "openContact"; contactId: string; contactName?: string }
  | { type: "openNotes" }
  | { type: "typeText"; target: "notes" | "chat"; contactId?: string; content: string }
  | { type: "sendMessage"; contactId: string; contactName?: string; content: string }
  | { type: "wait"; ms: number; reason?: string }
  | { type: "releaseControl"; message?: string }
  | { type: "resumeControl" }
  | { type: "exit" };

export interface PhoneCheckControlSession {
  id: string;
  characterId: string;
  characterName: string;
  isActive: boolean;
  
  /** 当前执行的动作队列 */
  actionQueue: PhoneCheckControlAction[];
  currentActionIndex: number;
  
  /** 控制权状态 */
  controlState: "ai" | "user" | "transitioning";
  
  /** 用户在控制期间的操作记录 */
  userActions: UserControlAction[];
  
  /** AI 已发送的消息记录（用于查手机日志，不注入角色记忆） */
  sentMessages: SentMessageRecord[];
  
  /** 当前屏幕状态（用于 UI 同步） */
  currentScreen: {
    type: "home" | "app" | "chat" | "notes";
    appId?: string;
    contactId?: string;
  };
}

export interface UserControlAction {
  type: "type" | "navigate" | "send_message" | "back" | "home";
  timestamp: number;
  data: {
    content?: string;
    location?: string;
    contactId?: string;
    contactName?: string;
  };
}

export interface SentMessageRecord {
  id: string;
  contactId: string;
  contactName: string;
  content: string;
  timestamp: string;
  characterName: string; // 查手机的角色名
}

let currentSession: PhoneCheckControlSession | null = null;
const listeners = new Set<() => void>();

/**
 * 启动增强查手机会话
 */
export function startPhoneCheckControl(
  characterId: string,
  characterName: string
): string {
  const sessionId = `phone-check-control-${Date.now()}`;
  currentSession = {
    id: sessionId,
    characterId,
    characterName,
    isActive: true,
    actionQueue: [],
    currentActionIndex: 0,
    controlState: "ai",
    userActions: [],
    sentMessages: [],
    currentScreen: { type: "home" },
  };
  notifyListeners();
  return sessionId;
}

/**
 * 添加动作到队列
 */
export function enqueueActions(actions: PhoneCheckControlAction[]): void {
  if (!currentSession || !currentSession.isActive) return;
  currentSession.actionQueue.push(...actions);
  notifyListeners();
}

/**
 * 获取下一个待执行的动作
 */
export function dequeueNextAction(): PhoneCheckControlAction | null {
  if (!currentSession || !currentSession.isActive) return null;
  if (currentSession.controlState !== "ai") return null;
  if (currentSession.currentActionIndex >= currentSession.actionQueue.length) return null;
  
  const action = currentSession.actionQueue[currentSession.currentActionIndex];
  currentSession.currentActionIndex++;
  
  // 更新屏幕状态
  updateScreenState(action);
  
  notifyListeners();
  return action;
}

function updateScreenState(action: PhoneCheckControlAction): void {
  if (!currentSession) return;
  
  switch (action.type) {
    case "goHome":
      currentSession.currentScreen = { type: "home" };
      break;
    case "openApp":
      currentSession.currentScreen = { type: "app", appId: action.appId };
      break;
    case "openContact":
      currentSession.currentScreen = { type: "chat", contactId: action.contactId };
      break;
    case "openNotes":
      currentSession.currentScreen = { type: "notes" };
      break;
  }
}

/**
 * AI 释放控制权给用户
 */
export function releaseControlToUser(message?: string): void {
  if (!currentSession || !currentSession.isActive) return;
  currentSession.controlState = "user";
  currentSession.userActions = [];
  notifyListeners();
  
  // 可选：显示 AI 的留言
  if (message && typeof window !== "undefined") {
    console.log(`[PhoneCheckControl] ${currentSession.characterName}: ${message}`);
  }
}

/**
 * AI 重新接管控制权
 */
export function resumeAIControl(): void {
  if (!currentSession || !currentSession.isActive) return;
  currentSession.controlState = "ai";
  notifyListeners();
}

/**
 * 记录用户在控制期间的操作
 */
export function recordUserControlAction(action: UserControlAction): void {
  if (!currentSession || currentSession.controlState !== "user") return;
  currentSession.userActions.push(action);
  notifyListeners();
}

/**
 * 获取用户操作记录（供 AI 工具读取）
 */
export function getUserControlActions(): UserControlAction[] {
  return currentSession?.userActions ?? [];
}

/**
 * 清空用户操作记录
 */
export function clearUserControlActions(): void {
  if (!currentSession) return;
  currentSession.userActions = [];
  notifyListeners();
}

/**
 * 记录 AI 以用户身份发送的消息
 */
export function recordSentMessage(
  contactId: string,
  contactName: string,
  content: string
): void {
  if (!currentSession) return;
  
  const record: SentMessageRecord = {
    id: `sent-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    contactId,
    contactName,
    content,
    timestamp: new Date().toISOString(),
    characterName: currentSession.characterName,
  };
  
  currentSession.sentMessages.push(record);
  notifyListeners();
}

/**
 * 获取已发送消息记录
 */
export function getSentMessages(): SentMessageRecord[] {
  return currentSession?.sentMessages ?? [];
}

/**
 * 获取当前会话
 */
export function getCurrentControlSession(): PhoneCheckControlSession | null {
  return currentSession;
}

/**
 * 检查是否处于查手机模式
 */
export function isPhoneCheckControlActive(): boolean {
  return currentSession?.isActive ?? false;
}

/**
 * 获取当前屏幕状态
 */
export function getCurrentScreen() {
  return currentSession?.currentScreen ?? null;
}

/**
 * 退出查手机模式
 */
export function exitPhoneCheckControl(): void {
  if (!currentSession) return;
  currentSession.isActive = false;
  currentSession = null;
  notifyListeners();
}

/**
 * 订阅状态变化
 */
export function subscribePhoneCheckControl(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

/**
 * 格式化用户操作记录为文本（供 AI 读取）
 */
export function formatUserActionsForAI(): string {
  const actions = getUserControlActions();
  if (actions.length === 0) return "用户没有进行任何操作。";
  
  const lines = actions.map((action) => {
    const time = new Date(action.timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    
    switch (action.type) {
      case "type":
        return `[${time}] 用户输入了：${action.data.content}`;
      case "send_message":
        return `[${time}] 用户发送了消息给 ${action.data.contactName || action.data.contactId}：${action.data.content}`;
      case "navigate":
        return `[${time}] 用户切换到：${action.data.location}`;
      case "back":
        return `[${time}] 用户点击了返回`;
      case "home":
        return `[${time}] 用户返回主屏幕`;
      default:
        return `[${time}] 用户进行了操作`;
    }
  });
  
  return lines.join("\n");
}

/**
 * 生成查手机日志条目（记录 AI 发送的消息，不注入角色记忆）
 */
export function generateCheckPhoneLog(): string {
  const messages = getSentMessages();
  if (messages.length === 0) return "";
  
  const lines = messages.map((msg) => {
    const time = new Date(msg.timestamp).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `[${time}] ${msg.characterName}用{{user}}的身份给${msg.contactName}发送了：${msg.content}`;
  });
  
  return lines.join("\n");
}
