// lib/worldline-storage.ts
// 世界线（存档）系统：管理多个独立的平行世界，每个世界线拥有独立的好友列表、聊天记录、用户身份

import { kvGet, kvSet, registerKvMigration } from "./kv-db";

const WORLDLINES_KEY = "ai_phone_worldlines_v1";
const ACTIVE_WORLDLINE_KEY = "ai_phone_active_worldline_v1";
const WORLDLINE_MIGRATED_FLAG = "ai_phone_worldline_migrated_v1";

registerKvMigration(WORLDLINES_KEY);
registerKvMigration(ACTIVE_WORLDLINE_KEY);
registerKvMigration(WORLDLINE_MIGRATED_FLAG);

export const DEFAULT_WORLDLINE_ID = "worldline_default";

export type WorldLine = {
    id: string;
    name: string;
    description?: string; // 世界观描述（可选，会注入该世界线所有对话的全局背景）
    userIdentityId?: string; // 该世界线绑定的用户身份 ID
    createdAt: string;
    updatedAt: string;
    isDefault?: boolean; // 默认世界线标记（不可删除）
};

export const WORLDLINE_SWITCHED_EVENT = "worldline-switched";

function generateId(): string {
    return `worldline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * 加载所有世界线列表
 */
export function loadWorldLines(): WorldLine[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = kvGet(WORLDLINES_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as WorldLine[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

/**
 * 保存世界线列表
 */
export function saveWorldLines(worldLines: WorldLine[]): void {
    if (typeof window === "undefined") return;
    kvSet(WORLDLINES_KEY, JSON.stringify(worldLines));
}

/**
 * 获取当前激活的世界线 ID
 */
export function getActiveWorldLineId(): string {
    if (typeof window === "undefined") return DEFAULT_WORLDLINE_ID;
    try {
        const raw = kvGet(ACTIVE_WORLDLINE_KEY);
        return raw || DEFAULT_WORLDLINE_ID;
    } catch {
        return DEFAULT_WORLDLINE_ID;
    }
}

/**
 * 设置当前激活的世界线
 */
export function setActiveWorldLineId(worldLineId: string): void {
    if (typeof window === "undefined") return;
    const current = getActiveWorldLineId();
    if (current === worldLineId) return;
    
    kvSet(ACTIVE_WORLDLINE_KEY, worldLineId);
    
    // 触发世界线切换事件，通知应用刷新数据
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(WORLDLINE_SWITCHED_EVENT, { 
            detail: { from: current, to: worldLineId } 
        }));
    }
}

/**
 * 获取当前激活的世界线对象
 */
export function getActiveWorldLine(): WorldLine | null {
    const worldLines = loadWorldLines();
    const activeId = getActiveWorldLineId();
    return worldLines.find(w => w.id === activeId) || null;
}

/**
 * 创建新世界线
 */
export function createWorldLine(name: string, options?: {
    description?: string;
    userIdentityId?: string;
}): WorldLine {
    const now = new Date().toISOString();
    const worldLine: WorldLine = {
        id: generateId(),
        name: name.trim() || "新世界线",
        description: options?.description,
        userIdentityId: options?.userIdentityId,
        createdAt: now,
        updatedAt: now,
    };
    
    const worldLines = loadWorldLines();
    worldLines.push(worldLine);
    saveWorldLines(worldLines);
    
    return worldLine;
}

/**
 * 更新世界线信息
 */
export function updateWorldLine(id: string, updates: Partial<Pick<WorldLine, "name" | "description" | "userIdentityId">>): void {
    const worldLines = loadWorldLines();
    const index = worldLines.findIndex(w => w.id === id);
    if (index === -1) return;
    
    worldLines[index] = {
        ...worldLines[index],
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    saveWorldLines(worldLines);
}

/**
 * 删除世界线（默认世界线不可删除）
 */
export function deleteWorldLine(id: string): boolean {
    const worldLines = loadWorldLines();
    const target = worldLines.find(w => w.id === id);
    
    // 默认世界线不可删除
    if (!target || target.isDefault) return false;
    
    const filtered = worldLines.filter(w => w.id !== id);
    saveWorldLines(filtered);
    
    // 如果删除的是当前激活的世界线，切换到默认世界线
    if (getActiveWorldLineId() === id) {
        setActiveWorldLineId(DEFAULT_WORLDLINE_ID);
    }
    
    return true;
}

/**
 * 初始化世界线系统（首次使用时自动创建默认世界线）
 */
export function initializeWorldLines(): void {
    if (typeof window === "undefined") return;
    
    // 检查是否已经迁移过
    const migrated = kvGet(WORLDLINE_MIGRATED_FLAG);
    if (migrated) return;
    
    const worldLines = loadWorldLines();
    
    // 如果没有任何世界线，创建默认世界线
    if (worldLines.length === 0) {
        const defaultWorldLine: WorldLine = {
            id: DEFAULT_WORLDLINE_ID,
            name: "默认世界",
            description: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: true,
        };
        saveWorldLines([defaultWorldLine]);
        setActiveWorldLineId(DEFAULT_WORLDLINE_ID);
    } else {
        // 确保有默认世界线
        const hasDefault = worldLines.some(w => w.isDefault || w.id === DEFAULT_WORLDLINE_ID);
        if (!hasDefault && worldLines.length > 0) {
            worldLines[0].isDefault = true;
            worldLines[0].id = DEFAULT_WORLDLINE_ID;
            saveWorldLines(worldLines);
        }
    }
    
    // 标记已完成迁移
    kvSet(WORLDLINE_MIGRATED_FLAG, "1");
}

/**
 * 切换到指定世界线
 */
export function switchWorldLine(worldLineId: string): boolean {
    const worldLines = loadWorldLines();
    const target = worldLines.find(w => w.id === worldLineId);
    if (!target) return false;
    
    setActiveWorldLineId(worldLineId);
    return true;
}
