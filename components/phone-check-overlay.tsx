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

    // 执行动作
    await handleAction(action);

    // 继续执行下一个动作
    if (animationTimeoutRef.current) {
      window.clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = window.setTimeout(() => {
      executeActionSequence();
    }, 300);
  };

  const handleAction = async (action: PhoneCheckControlAction): Promise<void> => {
    switch (action.type) {
      case "swipe":
        // 播放滑动动画
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
        if (onOpenApp && action.appId) onOpenApp(action.appId);
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "openContact":
        if (onOpenChat && action.contactId) onOpenChat(action.contactId);
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "openNotes":
        if (onNavigate) onNavigate("/notes");
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "typeText":
        // 输入文字的动画效果
        await new Promise((resolve) => setTimeout(resolve, 500 + (action.content?.length || 0) * 50));
        break;

      case "sendMessage":
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
      return "打开聊天";
    case "openNotes":
      return "打开备忘录";
    case "typeText":
      return "输入文字";
    case "sendMessage":
      return "发送消息";
    case "wait":
      return action.reason || "查看中...";
    case "releaseControl":
      return "释放控制权";
    case "resumeControl":
      return "重新接管";
    case "exit":
      return "退出查手机模式";
    default:
      return "";
  }
}
