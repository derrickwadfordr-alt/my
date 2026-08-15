/**
 * 查手机模式控制器
 * AI 角色调用"查手机"工具时，接管用户屏幕，自动执行滑动、点击、输入等操作
 */

export type PhoneCheckAction =
  | { type: "swipe"; direction: "left" | "right" | "up" | "down" }
  | { type: "openApp"; appId: string }
  | { type: "openChat"; contactId: string }
  | { type: "openNotes" }
  | { type: "typeInNotes"; content: string }
  | { type: "sendMessage"; contactId: string; content: string }
  | { type: "wait"; ms: number }
  | { type: "exit" };

export interface PhoneCheckSession {
  id: string;
  characterId: string;
  characterName: string;
  actions: PhoneCheckAction[];
  currentActionIndex: number;
  isActive: boolean;
  /** 是否暂时释放控制权给用户 */
  userControlGranted: boolean;
  /** 用户在控制期间的操作记录 */
  userActions: UserAction[];
}

export interface UserAction {
  type: "type" | "navigate" | "send_message" | "other";
  timestamp: number;
  data: {
    content?: string;
    location?: string;
    contactId?: string;
  };
}

let currentSession: PhoneCheckSession | null = null;
const listeners = new Set<() => void>();

export function startPhoneCheckMode(characterId: string, characterName: string): string {
  const sessionId = `phone-check-${Date.now()}`;
  currentSession = {
    id: sessionId,
    characterId,
    characterName,
    actions: [],
    currentActionIndex: 0,
    isActive: true,
    userControlGranted: false,
    userActions: [],
  };
  notifyListeners();
  return sessionId;
}

/** AI 释放控制权给用户 */
export function grantUserControl(): void {
  if (!currentSession) return;
  currentSession.userControlGranted = true;
  currentSession.userActions = [];
  notifyListeners();
}

/** AI 重新接管控制权 */
export function revokeUserControl(): void {
  if (!currentSession) return;
  currentSession.userControlGranted = false;
  notifyListeners();
}

/** 记录用户在控制期间的操作 */
export function recordUserAction(action: UserAction): void {
  if (!currentSession || !currentSession.userControlGranted) return;
  currentSession.userActions.push(action);
  notifyListeners();
}

/** 获取用户操作记录（供 AI 工具读取） */
export function getUserActions(): UserAction[] {
  return currentSession?.userActions ?? [];
}

/** 清空用户操作记录 */
export function clearUserActions(): void {
  if (!currentSession) return;
  currentSession.userActions = [];
  notifyListeners();
}

export function addPhoneCheckAction(action: PhoneCheckAction): void {
  if (!currentSession) return;
  currentSession.actions.push(action);
  notifyListeners();
}

export function getCurrentPhoneCheckSession(): PhoneCheckSession | null {
  return currentSession;
}

export function isPhoneCheckModeActive(): boolean {
  return currentSession?.isActive ?? false;
}

export function exitPhoneCheckMode(): void {
  if (!currentSession) return;
  currentSession.isActive = false;
  currentSession = null;
  notifyListeners();
}

export function subscribePhoneCheckMode(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}

/**
 * 执行下一个动作
 */
export function executeNextAction(): PhoneCheckAction | null {
  if (!currentSession || !currentSession.isActive) return null;
  if (currentSession.currentActionIndex >= currentSession.actions.length) {
    // 所有动作执行完毕，退出查手机模式
    exitPhoneCheckMode();
    return null;
  }
  const action = currentSession.actions[currentSession.currentActionIndex];
  currentSession.currentActionIndex++;
  notifyListeners();
  return action;
}
