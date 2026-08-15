"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import type { AppComponentProps } from "@/lib/desktop-shell-types";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "ai_phone_notes";

function loadNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveNotes(notes: Note[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function NotesApp({ onClose }: AppComponentProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    setNotes(loadNotes());
  }, []);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: "新备忘录",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveNotes(updated);
    setSelectedNote(newNote);
    setEditTitle(newNote.title);
    setEditContent(newNote.content);
    setIsEditing(true);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveNotes(updated);
    if (selectedNote?.id === id) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const saveEdit = () => {
    if (!selectedNote) return;
    const updated = notes.map((n) =>
      n.id === selectedNote.id
        ? { ...n, title: editTitle || "无标题", content: editContent, updatedAt: Date.now() }
        : n
    );
    setNotes(updated);
    saveNotes(updated);
    setSelectedNote(updated.find((n) => n.id === selectedNote.id) || null);
    setIsEditing(false);
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(true);
  };

  const backToList = () => {
    if (isEditing) {
      saveEdit();
    }
    setSelectedNote(null);
    setIsEditing(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(now.getTime() - 86400000).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return `今天 ${timeStr}`;
    if (isYesterday) return `昨天 ${timeStr}`;
    return date.toLocaleDateString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#f7f7f7]">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 h-14 bg-[#ededed] border-b border-[#d0d0d0]">
        {selectedNote && isEditing ? (
          <>
            <button
              onClick={backToList}
              className="flex items-center gap-1 text-[#576b95] text-base"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>备忘录</span>
            </button>
            <button
              onClick={saveEdit}
              className="text-[#576b95] text-base font-medium"
            >
              完成
            </button>
          </>
        ) : (
          <>
            <span className="text-lg font-medium">备忘录</span>
            <button
              onClick={createNote}
              className="text-[#576b95] flex items-center gap-1"
            >
              <Plus className="w-5 h-5" />
              <span className="text-base">新建</span>
            </button>
          </>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {selectedNote && isEditing ? (
          // 编辑视图
          <div className="p-4">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="标题"
              className="w-full text-2xl font-bold mb-4 bg-transparent border-none outline-none"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="内容"
              className="w-full min-h-[400px] text-base bg-transparent border-none outline-none resize-none"
            />
          </div>
        ) : notes.length === 0 ? (
          // 空状态
          <div className="flex flex-col items-center justify-center h-full text-[#999]">
            <div className="text-6xl mb-4">📝</div>
            <div className="text-base">还没有备忘录</div>
            <div className="text-sm mt-2">点击右上角"新建"开始记录</div>
          </div>
        ) : (
          // 列表视图
          <div className="p-4 space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-lg p-4 shadow-sm active:bg-[#f0f0f0] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => openNote(note)}
                  >
                    <div className="text-base font-medium mb-1 line-clamp-1">
                      {note.title}
                    </div>
                    <div className="text-sm text-[#999] mb-2 line-clamp-2">
                      {note.content || "无内容"}
                    </div>
                    <div className="text-xs text-[#999]">
                      {formatDate(note.updatedAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="text-[#999] hover:text-[#f56c6c] p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
