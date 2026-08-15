"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { Character } from "@/lib/character-types";

type CheckPhoneNotesPageProps = {
  character: Character;
  onBack: () => void;
};

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

export function CheckPhoneNotesPage({
  character,
  onBack,
}: CheckPhoneNotesPageProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(loadNotes());
    setLoaded(true);
  }, []);

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
    <div
      className="cp-notes-module"
      style={{
        background: "#fffced",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <header
        style={{
          padding: "var(--cp-appbar-safe-top) 24px 12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            style={{
              background: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={20} color="#111" strokeWidth={2} />
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{
              fontSize: "12px",
              color: "#666",
              padding: "8px 12px",
            }}>
              {character.name} 正在查看
            </div>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, padding: "0 16px 48px", overflowY: "auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", margin: "0 8px 20px" }}>
          <h1
            style={{
              fontSize: "calc(36px*var(--app-text-scale,1))",
              fontWeight: 900,
              fontStyle: "italic",
              color: "#111",
              margin: 0,
              letterSpacing: 0,
              lineHeight: 1,
            }}
          >
            Memos
          </h1>
          <div
            style={{
              maxWidth: "100%",
              fontSize: "calc(12px*var(--app-text-scale,1))",
              lineHeight: 1.65,
              color: "#777",
              fontStyle: "italic",
            }}
          >
            用户的真实备忘录
          </div>
        </div>

        {!loaded && (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "#999",
              fontSize: "calc(14px*var(--app-text-scale,1))",
              fontStyle: "italic",
            }}
          >
            加载中...
          </div>
        )}

        {loaded && notes.length === 0 && (
          <div className="cp-empty-copy">
            <p>用户还没有创建备忘录</p>
            <span>备忘录是空的</span>
          </div>
        )}

        {loaded && notes.length > 0 && (
          <div>
            {notes.map((note) => {
              return (
                <article
                  key={note.id}
                  style={{
                    marginBottom: "20px",
                    background: "#fff",
                    padding: "20px 18px 30px",
                    borderRadius: "16px",
                    boxShadow: "0 10px 30px rgba(60, 45, 20, 0.075)",
                    border: "1px solid #f9f9f9",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "-8px",
                      right: "-8px",
                      width: "54px",
                      height: "20px",
                      background: "#fae389",
                      transform: "rotate(10deg)",
                      zIndex: 10,
                      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      opacity: 0.55,
                      borderRadius: "2px",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#4CAF50",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "calc(14px*var(--app-text-scale,1))",
                          fontWeight: 800,
                        }}
                      >
                        我
                      </div>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontSize: "calc(12px*var(--app-text-scale,1))",
                            fontWeight: 700,
                            color: "#111",
                          }}
                        >
                          用户备忘录
                        </span>
                        <span style={{ fontSize: "calc(10px*var(--app-text-scale,1))", color: "#999" }}>
                          {formatDate(note.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: "10px" }}>
                    {note.title && (
                      <h2
                        style={{
                          fontSize: "calc(20px*var(--app-text-scale,1))",
                          fontWeight: 800,
                          color: "#111",
                          margin: 0,
                          lineHeight: 1.3,
                          position: "relative",
                          display: "inline-block",
                        }}
                      >
                        <span style={{ position: "relative", zIndex: 1 }}>
                          {note.title}
                          <span
                            style={{
                              position: "absolute",
                              bottom: "2px",
                              left: 0,
                              right: 0,
                              height: "8px",
                              background: "rgba(250, 227, 137, 0.8)",
                              zIndex: -1,
                            }}
                          />
                        </span>
                      </h2>
                    )}
                  </div>

                  <p
                    style={{
                      fontSize: "calc(13px*var(--app-text-scale,1))",
                      color: "#666",
                      lineHeight: 1.95,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {note.content}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
