"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { 
    loadWorldLines, 
    getActiveWorldLineId, 
    switchWorldLine, 
    createWorldLine, 
    deleteWorldLine, 
    updateWorldLine,
    WORLDLINE_SWITCHED_EVENT,
    type WorldLine 
} from "@/lib/worldline-storage";
import { reloadChatStorage } from "@/lib/chat-storage";
import { resolveUserIdentity } from "@/lib/settings-storage";
import type { UserIdentity } from "@/components/settings/user-identity";
import { ChatFallbackAvatar } from "./chat-fallback-avatar";

type WorldLineSelectorProps = {
    onWorldLineChange?: () => void;
};

export function WorldLineSelector({ onWorldLineChange }: WorldLineSelectorProps) {
    const [worldLines, setWorldLines] = useState<WorldLine[]>([]);
    const [activeWorldLineId, setActiveWorldLineId] = useState<string>("");
    const [isOpen, setIsOpen] = useState(false);
    const [identity, setIdentity] = useState<UserIdentity | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingWorldLine, setEditingWorldLine] = useState<WorldLine | null>(null);
    const [newWorldLineName, setNewWorldLineName] = useState("");
    const [newWorldLineDesc, setNewWorldLineDesc] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    useEffect(() => {
        const handler = () => {
            loadData();
            onWorldLineChange?.();
        };
        window.addEventListener(WORLDLINE_SWITCHED_EVENT, handler);
        return () => window.removeEventListener(WORLDLINE_SWITCHED_EVENT, handler);
    }, [onWorldLineChange]);

    const loadData = () => {
        setWorldLines(loadWorldLines());
        setActiveWorldLineId(getActiveWorldLineId());
        setIdentity(resolveUserIdentity());
    };

    const handleSwitch = (worldLineId: string) => {
        if (worldLineId === activeWorldLineId) {
            setIsOpen(false);
            return;
        }
        switchWorldLine(worldLineId);
        setIsOpen(false);
        // 重新加载聊天存储，清空缓存并按新世界线过滤
        reloadChatStorage();
        loadData();
    };

    const handleCreate = () => {
        if (!newWorldLineName.trim()) return;
        createWorldLine(newWorldLineName, { description: newWorldLineDesc });
        setNewWorldLineName("");
        setNewWorldLineDesc("");
        setShowCreateModal(false);
        loadData();
    };

    const handleDelete = (worldLine: WorldLine) => {
        if (worldLine.isDefault) return;
        if (!confirm(`确定要删除世界线「${worldLine.name}」吗？\n\n删除后该世界线的所有数据（好友、聊天记录）将无法恢复。`)) return;
        deleteWorldLine(worldLine.id);
        loadData();
    };

    const handleEdit = (worldLine: WorldLine) => {
        setEditingWorldLine(worldLine);
        setNewWorldLineName(worldLine.name);
        setNewWorldLineDesc(worldLine.description || "");
        setShowEditModal(true);
    };

    const handleUpdateWorldLine = () => {
        if (!editingWorldLine || !newWorldLineName.trim()) return;
        updateWorldLine(editingWorldLine.id, {
            name: newWorldLineName,
            description: newWorldLineDesc,
        });
        setShowEditModal(false);
        setEditingWorldLine(null);
        setNewWorldLineName("");
        setNewWorldLineDesc("");
        loadData();
    };

    const activeWorldLine = worldLines.find(w => w.id === activeWorldLineId);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* 用户头像 + 世界线名称 */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-[10px] hover:opacity-80 transition-opacity"
                type="button"
            >
                <div className="w-[36px] h-[36px] rounded-full overflow-hidden bg-[var(--c-input)] flex items-center justify-center shrink-0">
                    {identity?.avatarUrl ? (
                        <img src={identity.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <ChatFallbackAvatar />
                    )}
                </div>
                <div className="flex flex-col whitespace-nowrap">
                    <div className="flex items-center gap-1">
                        <span className="ts-16 font-bold text-[var(--c-text-title)] leading-tight">
                            {identity?.name || "用户"}
                        </span>
                        <ChevronDown 
                            size={14} 
                            className={`text-[var(--c-icon)] transition-transform ${isOpen ? "rotate-180" : ""}`} 
                        />
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="w-[8px] h-[8px] rounded-full bg-[#2dd36f]"></span>
                        <span className="ts-10 text-[var(--c-icon)] font-medium">
                            {activeWorldLine?.name || "默认世界"}
                        </span>
                    </div>
                </div>
            </button>

            {/* 下拉菜单 */}
            {isOpen && (
                <div 
                    className="absolute top-full left-0 mt-2 w-[280px] bg-[var(--c-surface)] rounded-xl shadow-lg border border-[var(--c-border)] overflow-hidden z-50"
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                    <div className="px-4 py-3 border-b border-[var(--c-border)]">
                        <div className="ts-14 font-bold text-[var(--c-text-title)]">选择世界线</div>
                    </div>
                    
                    {worldLines.map((worldLine) => (
                        <div
                            key={worldLine.id}
                            className={`flex items-center justify-between px-4 py-3 hover:bg-[var(--c-hover)] cursor-pointer border-b border-[var(--c-border)] last:border-b-0 ${
                                worldLine.id === activeWorldLineId ? "bg-[var(--c-selected)]" : ""
                            }`}
                        >
                            <div 
                                className="flex-1 min-w-0"
                                onClick={() => handleSwitch(worldLine.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="ts-14 font-medium text-[var(--c-text-title)]">
                                        {worldLine.name}
                                    </span>
                                    {worldLine.isDefault && (
                                        <span className="ts-10 px-1.5 py-0.5 rounded bg-[var(--c-primary)] text-white">
                                            默认
                                        </span>
                                    )}
                                    {worldLine.id === activeWorldLineId && (
                                        <Check size={14} className="text-[var(--c-primary)]" />
                                    )}
                                </div>
                                {worldLine.description && (
                                    <div className="ts-12 text-[var(--c-text-secondary)] mt-1 line-clamp-2">
                                        {worldLine.description}
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2 ml-2">
                                {!worldLine.isDefault && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(worldLine);
                                            }}
                                            className="p-1 hover:bg-[var(--c-hover)] rounded"
                                            type="button"
                                            title="编辑"
                                        >
                                            <Edit2 size={14} className="text-[var(--c-icon)]" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(worldLine);
                                            }}
                                            className="p-1 hover:bg-[var(--c-hover)] rounded"
                                            type="button"
                                            title="删除"
                                        >
                                            <Trash2 size={14} className="text-[var(--c-danger)]" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={() => {
                            setShowCreateModal(true);
                            setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-[var(--c-hover)] text-[var(--c-primary)]"
                        type="button"
                    >
                        <Plus size={16} />
                        <span className="ts-14 font-medium">新建世界线</span>
                    </button>
                </div>
            )}

            {/* 新建世界线弹窗 */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowCreateModal(false)}>
                    <div 
                        className="bg-[var(--c-surface)] rounded-xl w-[90%] max-w-[400px] p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="ts-18 font-bold text-[var(--c-text-title)] mb-4">新建世界线</h3>
                        
                        <div className="mb-4">
                            <label className="block ts-12 text-[var(--c-text-secondary)] mb-2">世界线名称</label>
                            <input
                                type="text"
                                value={newWorldLineName}
                                onChange={(e) => setNewWorldLineName(e.target.value)}
                                placeholder="例如：平行世界A"
                                className="w-full px-3 py-2 bg-[var(--c-input)] text-[var(--c-text-title)] rounded-lg border border-[var(--c-border)] ts-14"
                                maxLength={20}
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block ts-12 text-[var(--c-text-secondary)] mb-2">
                                世界观描述（可选）
                            </label>
                            <textarea
                                value={newWorldLineDesc}
                                onChange={(e) => setNewWorldLineDesc(e.target.value)}
                                placeholder="描述这个世界的背景、时代、共同常识等..."
                                className="w-full px-3 py-2 bg-[var(--c-input)] text-[var(--c-text-title)] rounded-lg border border-[var(--c-border)] ts-14 resize-none"
                                rows={3}
                                maxLength={500}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewWorldLineName("");
                                    setNewWorldLineDesc("");
                                }}
                                className="flex-1 py-2 px-4 bg-[var(--c-input)] text-[var(--c-text-title)] rounded-lg ts-14 font-medium hover:opacity-80"
                                type="button"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newWorldLineName.trim()}
                                className="flex-1 py-2 px-4 bg-[var(--c-primary)] text-white rounded-lg ts-14 font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                            >
                                创建
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 编辑世界线弹窗 */}
            {showEditModal && editingWorldLine && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" onClick={() => setShowEditModal(false)}>
                    <div 
                        className="bg-[var(--c-surface)] rounded-xl w-[90%] max-w-[400px] p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="ts-18 font-bold text-[var(--c-text-title)] mb-4">编辑世界线</h3>
                        
                        <div className="mb-4">
                            <label className="block ts-12 text-[var(--c-text-secondary)] mb-2">世界线名称</label>
                            <input
                                type="text"
                                value={newWorldLineName}
                                onChange={(e) => setNewWorldLineName(e.target.value)}
                                placeholder="例如：平行世界A"
                                className="w-full px-3 py-2 bg-[var(--c-input)] text-[var(--c-text-title)] rounded-lg border border-[var(--c-border)] ts-14"
                                maxLength={20}
                                autoFocus
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block ts-12 text-[var(--c-text-secondary)] mb-2">
                                世界观描述（可选）
                            </label>
                            <textarea
                                value={newWorldLineDesc}
                                onChange={(e) => setNewWorldLineDesc(e.target.value)}
                                placeholder="描述这个世界的背景、时代、共同常识等..."
                                className="w-full px-3 py-2 bg-[var(--c-input)] text-[var(--c-text-title)] rounded-lg border border-[var(--c-border)] ts-14 resize-none"
                                rows={3}
                                maxLength={500}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingWorldLine(null);
                                    setNewWorldLineName("");
                                    setNewWorldLineDesc("");
                                }}
                                className="flex-1 py-2 px-4 bg-[var(--c-input)] text-[var(--c-text-title)] rounded-lg ts-14 font-medium hover:opacity-80"
                                type="button"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdateWorldLine}
                                disabled={!newWorldLineName.trim()}
                                className="flex-1 py-2 px-4 bg-[var(--c-primary)] text-white rounded-lg ts-14 font-medium hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
