"use client";

import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import {
  getCurrentPhoneCheckSession,
  subscribePhoneCheckMode,
  exitPhoneCheckMode,
  executeNextAction,
  recordUserAction,
  type PhoneCheckAction,
} from "@/lib/phone-check-mode";

interface PhoneCheckOverlayProps {
  onOpenApp?: (appId: string) => void;
  onOpenChat?: (contactId: string) => void;
  onSendMessage?: (contactId: string, content: string) => void;
}

export function PhoneCheckOverlay({
  onOpenApp,
  onOpenChat,
  onSendMessage,
}: PhoneCheckOverlayProps) {
  const [session, setSession] = useState(() => getCurrentPhoneCheckSession());
  const [currentAction, setCurrentAction] = useState<PhoneCheckAction | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribePhoneCheckMode(() => {
      setSession(getCurrentPhoneCheckSession());
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!session?.isActive) {
      setCurrentAction(null);
      setIsAnimating(false);
      return;
    }

    // 开始执行动作序列
    executeActionSequence();
  }, [session]);

  const executeActionSequence = async () => {
    if (!session?.isActive) return;

    const action = executeNextAction();
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
    }, 500);
  };

  const handleAction = async (action: PhoneCheckAction): Promise<void> => {
    switch (action.type) {
      case "swipe":
        // 播放滑动动画
        await new Promise((resolve) => setTimeout(resolve, 600));
        break;

      case "openApp":
        if (onOpenApp) onOpenApp(action.appId);
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "openChat":
        if (onOpenChat) onOpenChat(action.contactId);
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "openNotes":
        if (onOpenApp) onOpenApp("notes");
        await new Promise((resolve) => setTimeout(resolve, 800));
        break;

      case "typeInNotes":
        // 模拟打字动画
        await new Promise((resolve) => setTimeout(resolve, action.content.length * 100));
        break;

      case "sendMessage":
        if (onSendMessage) onSendMessage(action.contactId, action.content);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        break;

      case "wait":
        await new Promise((resolve) => setTimeout(resolve, action.ms));
        break;

      case "exit":
        exitPhoneCheckMode();
        break;
    }
  };

  const handleForceExit = () => {
    exitPhoneCheckMode();
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
    if (!session?.userControlGranted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        recordUserAction({
          type: "type",
          timestamp: Date.now(),
          data: { content: e.key },
        });
      }
    };

    const handleNavigation = () => {
      recordUserAction({
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
  }, [session?.userControlGranted]);

  // 严格检查：必须有 session 且处于激活状态且有实际内容
  if (!session) return null;
  if (!session.isActive) return null;
  
  // 如果没有动作、没有用户控制、也没有正在执行的动画，说明是空 session，不显示
  const hasContent = session.actions.length > 0 || session.userControlGranted || currentAction || isAnimating;
  if (!hasContent) {
    return null;
  }

  // 额外安全检查：如果既不是用户控制，也没有待执行的动作，强制退出
  const isUserControl = session.userControlGranted;
  if (!isUserControl && session.actions.length === 0 && !currentAction && !isAnimating) {
    return null;
  }

  return (
    <>
      {/* 半透明遮罩 - 只在 AI 控制时禁用用户操作 */}
      {!isUserControl && (
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
      {currentAction && isAnimating && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[10000] bg-black/80 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
          {getActionDescription(currentAction)}
        </div>
      )}
    </>
  );
}

function getActionDescription(action: PhoneCheckAction): string {
  switch (action.type) {
    case "swipe":
      return `向${action.direction === "left" ? "左" : action.direction === "right" ? "右" : action.direction === "up" ? "上" : "下"}滑动`;
    case "openApp":
      return "打开应用";
    case "openChat":
      return "打开聊天";
    case "openNotes":
      return "打开备忘录";
    case "typeInNotes":
      return "正在输入...";
    case "sendMessage":
      return "发送消息";
    case "wait":
      return "查看中...";
    case "exit":
      return "退出查手机模式";
    default:
      return "";
  }
}
