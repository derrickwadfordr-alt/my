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

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
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
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      background: "#f7f7f7",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        height: "56px",
        background: "#ededed",
        borderBottom: "1px solid #d0d0d0",
        flexShrink: 0,
      }}>
        {selectedNote && isEditing ? (
          <>
            <button type="button" onClick={backToList} style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#576b95",
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px",
            }}>
              <ChevronLeft size={20} />
              <span>备忘录</span>
            </button>
            <button type="button" onClick={saveEdit} style={{
              background: "none",
              border: "none",
              color: "#576b95",
              fontSize: "16px",
              fontWeight: 500,
              cursor: "pointer",
              padding: "8px 12px",
            }}>
              完成
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onClose} style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#576b95",
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px",
            }}>
              <ChevronLeft size={20} />
              <span>返回</span>
            </button>
            <span style={{ fontSize: "18px", fontWeight: 500 }}>备忘录</span>
            <button type="button" onClick={createNote} style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              color: "#576b95",
              fontSize: "16px",
              cursor: "pointer",
              padding: "8px",
            }}>
              <Plus size={20} />
              <span>新建</span>
            </button>
          </>
        )}
      </div>

      {/* 内容区域 */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
      }}>
        {selectedNote && isEditing ? (
          // 编辑视图
          <div style={{ padding: "16px" }}>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="标题"
              style={{
                width: "100%",
                fontSize: "24px",
                fontWeight: "bold",
                marginBottom: "16px",
                background: "transparent",
                border: "none",
                outline: "none",
                padding: "4px 0",
              }}
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="内容"
              style={{
                width: "100%",
                minHeight: "400px",
                fontSize: "16px",
                background: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                padding: "4px 0",
                lineHeight: "1.6",
              }}
            />
          </div>
        ) : notes.length === 0 ? (
          // 空状态
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#999",
          }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📝</div>
            <div style={{ fontSize: "16px" }}>还没有备忘录</div>
            <div style={{ fontSize: "14px", marginTop: "8px" }}>
              点击右上角"新建"开始记录
            </div>
          </div>
        ) : (
          // 列表视图
          <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => openNote(note)}
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: "16px",
                    fontWeight: 500,
                    marginBottom: "4px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {note.title}
                  </div>
                  <div style={{
                    fontSize: "14px",
                    color: "#999",
                    marginBottom: "8px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: "1.5",
                  }}>
                    {note.content || "无内容"}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => deleteNote(note.id, e)}
                  style={{
                    color: "#999",
                    background: "none",
                    border: "none",
                    padding: "8px",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
