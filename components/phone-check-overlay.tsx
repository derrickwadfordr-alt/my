"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import {
  getCurrentControlSession,
  subscribePhoneCheckControl,
  exitPhoneCheckControl,
  dequeueNextAction,
  recordUserControlAction,
  type PhoneCheckControlAction,
} from "@/lib/phone-check-control";

interface PhoneCheckOverlayProps {
  onOpenApp?: (appId: string) => void;
  onOpenChat?: (contactId: string) => void;
  onSendMessage?: (contactId: string, content: string) => void;
  onNavigate?: (path: string) => void;
}

export function PhoneCheckOverlay({
  onOpenApp,
  onOpenChat,
  onSendMessage,
  onNavigate,
}: PhoneCheckOverlayProps) {
  const [session, setSession] = useState(() => getCurrentControlSession());
  const [currentAction, setCurrentAction] = useState<PhoneCheckControlAction | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);
  const [touchRipples, setTouchRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  useEffect(() => {
    const unsubscribe = subscribePhoneCheckControl(() => {
      setSession(getCurrentControlSession());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!session?.isActive || session.controlState !== "ai") {
      setCurrentAction(null);
      setIsAnimating(false);
      return;
    }

    // 开始执行动作序列
    executeActionSequence();
  }, [session]);

  const executeActionSequence = async () => {
    if (!session?.isActive || session.controlState !== "ai") return;

    const action = dequeueNextAction();
    if (!action) return;

    setCurrentAction(action);
    setIsAnimating(true);

    // 执行动作（带容错）
    try {
      await handleAction(action);
    } catch (error) {
      console.error("[PhoneCheckControl] Action execution failed:", error);
      // 出错后继续执行下一个动作，避免卡死
    }

    // 继续执行下一个动作
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = window.setTimeout(() => {
      executeActionSequence();
    }, 300);
  };

  const showTouchRipple = (x?: number, y?: number) => {
    const rippleX = x ?? Math.random() * window.innerWidth;
    const rippleY = y ?? Math.random() * window.innerHeight;
    const id = Date.now();
    setTouchRipples(prev => [...prev, { id, x: rippleX, y: rippleY }]);
    setTimeout(() => {
      setTouchRipples(prev => prev.filter(r => r.id !== id));
    }, 800);
  };

  const handleAction = async (action: PhoneCheckControlAction): Promise<void> => {
    switch (action.type) {
      case "swipe":
        // 滑动不显示特效，避免塑料感
        await new Promise((resolve) => setTimeout(resolve, 600));
        break;

      case "goHome":
        if (onNavigate) onNavigate("/");
        await new Promise((resolve) => setTimeout(resolve, 500));
        break;

      case "goBack":
        if (typeof window !== "undefined") window.history.back();
        await new Promise((resolve) => setTimeout(resolve, 500));
        break;

      case "openApp":
        // 打开应用显示点击特效
        showTouchRipple();
        if (onOpenApp && action.appId) onOpenApp(action.appId);
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "openContact":
        // 打开聊天显示点击特效
        showTouchRipple();
        if (onOpenChat && action.contactId) onOpenChat(action.contactId);
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "openNotes":
        showTouchRipple();
        if (onNavigate) onNavigate("/notes");
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "typeText":
        // 输入文字的动画效果（模拟真实打字速度，带犹豫）
        const text = action.content || "";
        const baseDelay = 100; // 每个字符基础延时
        const hesitationChance = 0.15; // 15%概率停顿思考
        for (let i = 0; i < text.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, baseDelay + Math.random() * 100));
          if (Math.random() < hesitationChance) {
            await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
          }
        }
        break;

      case "sendMessage":
        // 发送消息显示点击特效
        showTouchRipple();
        if (onSendMessage && action.contactId && action.content) {
          const { recordSentMessage } = await import("@/lib/phone-check-control");
          recordSentMessage(action.contactId, action.contactName || action.contactId, action.content);
          onSendMessage(action.contactId, action.content);
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break;

      case "wait":
        await new Promise((resolve) => setTimeout(resolve, action.ms || 1000));
        break;

      case "releaseControl":
        const { releaseControlToUser } = await import("@/lib/phone-check-control");
        releaseControlToUser(action.message);
        break;

      case "resumeControl":
        const { resumeAIControl } = await import("@/lib/phone-check-control");
        resumeAIControl();
        break;

      case "exit":
        exitPhoneCheckControl();
        break;
    }
  };

  const handleForceExit = () => {
    exitPhoneCheckControl();
  };

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        window.clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // 监听用户在控制期间的操作
  useEffect(() => {
    if (!session || session.controlState !== "user") return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        recordUserControlAction({
          type: "type",
          timestamp: Date.now(),
          data: { content: e.key },
        });
      }
    };

    const handleNavigation = () => {
      recordUserControlAction({
        type: "navigate",
        timestamp: Date.now(),
        data: { location: window.location.pathname },
      });
    };

    window.addEventListener("keypress", handleKeyPress);
    window.addEventListener("popstate", handleNavigation);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
      window.removeEventListener("popstate", handleNavigation);
    };
  }, [session?.controlState]);

  // 严格检查：必须有 session 且处于激活状态
  if (!session?.isActive) return null;

  const isUserControl = session.controlState === "user";
  const isAIControl = session.controlState === "ai";

  return (
    <>
      {/* 半透明遮罩 - 只在 AI 控制时禁用用户操作 */}
      {isAIControl && (
        <div
          className="fixed inset-0 z-[9999] bg-black/20 pointer-events-auto"
          style={{ touchAction: "none" }}
        />
      )}

      {/* 顶部提示条 */}
      <div className="fixed top-0 left-0 right-0 z-[10000] bg-gradient-to-b from-black/60 to-transparent pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            {isUserControl ? (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {session.characterName} 放开了控制权
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {session.characterName} 正在查看你的手机
                </span>
              </>
            )}
          </div>
          <button
            onClick={handleForceExit}
            className="text-white/80 hover:text-white p-1 rounded-full bg-white/10 backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 触摸波纹特效 */}
      {touchRipples.map((ripple) => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-[9998]"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="w-16 h-16 rounded-full border-2 border-white/40 animate-ping" />
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-white/10 animate-pulse" />
        </div>
      ))}

      {/* 动作提示 */}
      {currentAction && isAnimating && isAIControl && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000] bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          {getActionDescription(currentAction)}
        </div>
      )}
    </>
  );
}

function getActionDescription(action: PhoneCheckControlAction): string {
  switch (action.type) {
    case "swipe":
      return `向${action.direction === "left" ? "左" : action.direction === "right" ? "右" : action.direction === "up" ? "上" : "下"}滑动`;
    case "goHome":
      return "返回主屏幕";
    case "goBack":
      return "返回上一页";
    case "openApp":
      return "打开应用";
    case "openContact":
      return `打开聊天${action.contactName ? ` · ${action.contactName}` : ""}`;
    case "openNotes":
      return "打开备忘录";
    case "typeText":
      const previewText = action.content ? action.content.slice(0, 15) : "";
      return `打字${previewText ? ` · ${previewText}${action.content && action.content.length > 15 ? "..." : ""}` : "中..."}`;
    case "sendMessage":
      return `发送${action.contactName ? ` 给 ${action.contactName}` : "消息"}`;
    case "wait":
      return action.reason || "查看中...";
    case "releaseControl":
      return "放开控制";
    case "resumeControl":
      return "重新接管";
    case "exit":
      return "退出查手机";
    default:
      return "";
  }
}
