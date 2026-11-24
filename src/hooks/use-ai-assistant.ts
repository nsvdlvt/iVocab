// src/hooks/use-ai-assistant.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PendingConfirmation, AgentToolEvent } from "@/lib/ai/agent/types";
import { toast } from "sonner";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  toolEvents?: AgentToolEvent[];
  confirmation?: PendingConfirmation | null;
}

const INITIAL_WELCOME_MESSAGE: ChatMessageItem = {
  id: "welcome-message",
  role: "assistant",
  content:
    "Xin chào! Tôi là **Vocabee AI Assistant**. Tôi có thể giúp bạn quản lý từ vựng, theo dõi tiến độ và giải đáp các câu hỏi về việc học.",
  timestamp: "Vừa xong",
};

export function useAiAssistant() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentToolStatus, setCurrentToolStatus] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const msgCounter = useRef<number>(0);
  const currentAbortControllerRef = useRef<AbortController | null>(null);

  // Sync current user ID & load conversation
  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function checkUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const uid = session?.user?.id ?? null;
        if (!isMounted) return;
        setCurrentUserId(uid);

        if (uid) {
          const storageKey = `vocabee_chat_history_${uid}`;
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw) as ChatMessageItem[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
                return;
              }
            }
          } catch {
            // ignore localStorage error
          }
          setMessages([INITIAL_WELCOME_MESSAGE]);
        } else {
          setMessages([INITIAL_WELCOME_MESSAGE]);
        }
      } catch {
        // ignore auth error
      }
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUid = session?.user?.id ?? null;
      if (nextUid !== currentUserId) {
        setCurrentUserId(nextUid);
        if (nextUid) {
          const storageKey = `vocabee_chat_history_${nextUid}`;
          try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
              const parsed = JSON.parse(raw) as ChatMessageItem[];
              if (Array.isArray(parsed) && parsed.length > 0) {
                setMessages(parsed);
                return;
              }
            }
          } catch {
            // ignore
          }
          setMessages([INITIAL_WELCOME_MESSAGE]);
        } else {
          setMessages([INITIAL_WELCOME_MESSAGE]);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [currentUserId]);

  // Persist messages whenever they change
  useEffect(() => {
    if (currentUserId && messages.length > 0) {
      const storageKey = `vocabee_chat_history_${currentUserId}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages.slice(-50)));
      } catch {
        // ignore quota error
      }
    }
  }, [messages, currentUserId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      msgCounter.current += 1;
      const userMsg: ChatMessageItem = {
        id: `user-${Date.now()}-${msgCounter.current}`,
        role: "user",
        content: trimmed,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setIsLoading(true);
      setCurrentToolStatus("Đang phân tích yêu cầu...");

      if (currentAbortControllerRef.current) {
        currentAbortControllerRef.current.abort();
      }
      const controller = new AbortController();
      currentAbortControllerRef.current = controller;

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
          },
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "";

        // Handle SSE stream response
        if (contentType.includes("text/event-stream") && response.body) {
          msgCounter.current += 1;
          const aiMsgId = `ai-${Date.now()}-${msgCounter.current}`;
          const initialAiMsg: ChatMessageItem = {
            id: aiMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            toolEvents: [],
            confirmation: null,
          };

          setMessages((prev) => [...prev, initialAiMsg]);

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() || "";

            for (const block of blocks) {
              const trimmedBlock = block.trim();
              if (!trimmedBlock) continue;

              let eventName = "message";
              let dataStr = "";

              for (const line of trimmedBlock.split("\n")) {
                if (line.startsWith("event: ")) {
                  eventName = line.slice(7).trim();
                } else if (line.startsWith("data: ")) {
                  dataStr = line.slice(6).trim();
                }
              }

              if (!dataStr) continue;

              try {
                const parsedData = JSON.parse(dataStr);

                if (eventName === "status" && parsedData.status) {
                  setCurrentToolStatus(parsedData.status);
                } else if (eventName === "tool_event") {
                  setMessages((prev) =>
                    prev.map((msg) => {
                      if (msg.id !== aiMsgId) return msg;
                      const prevEvents = msg.toolEvents || [];
                      const existingIdx = prevEvents.findIndex(
                        (e) => e.toolName === parsedData.toolName
                      );
                      let nextEvents: AgentToolEvent[];
                      if (existingIdx >= 0) {
                        nextEvents = [...prevEvents];
                        nextEvents[existingIdx] = parsedData;
                      } else {
                        nextEvents = [...prevEvents, parsedData];
                      }
                      return { ...msg, toolEvents: nextEvents };
                    })
                  );
                } else if (eventName === "text_delta" && parsedData.delta) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId
                        ? { ...msg, content: msg.content + parsedData.delta }
                        : msg
                    )
                  );
                } else if (eventName === "done") {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMsgId
                        ? {
                            ...msg,
                            content: parsedData.reply || msg.content,
                            toolEvents: parsedData.toolEvents || msg.toolEvents,
                            confirmation: parsedData.confirmation || msg.confirmation,
                          }
                        : msg
                    )
                  );
                } else if (eventName === "error") {
                  throw new Error(parsedData.error || "Không thể nhận phản hồi từ AI.");
                }
              } catch (parseErr) {
                // Ignore parse chunk errors
                if (parseErr instanceof Error && parseErr.message.includes("Không thể nhận")) {
                  throw parseErr;
                }
              }
            }
          }
        } else {
          // Standard JSON fallback
          const data = await response.json();

          if (!response.ok || !data.success) {
            throw new Error(data?.error || "Không thể nhận phản hồi từ AI Assistant.");
          }

          msgCounter.current += 1;
          const aiMsg: ChatMessageItem = {
            id: `ai-${Date.now()}-${msgCounter.current}`,
            role: "assistant",
            content: data.reply || "",
            timestamp: new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            toolEvents: data.toolEvents,
            confirmation: data.confirmation,
          };

          setMessages((prev) => [...prev, aiMsg]);
        }

        // If minimized, increment unread badge
        if (isMinimized || !isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err: unknown) {
        if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
          return;
        }

        msgCounter.current += 1;
        const errorText =
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi kết nối với máy chủ AI.";

        const errAssistantMsg: ChatMessageItem = {
          id: `ai-err-${Date.now()}-${msgCounter.current}`,
          role: "assistant",
          content: `⚠️ **Lỗi:** ${errorText}\nVui lòng thử lại hoặc làm rõ thêm yêu cầu của bạn.`,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };

        setMessages((prev) => [...prev, errAssistantMsg]);
      } finally {
        if (currentAbortControllerRef.current === controller) {
          currentAbortControllerRef.current = null;
        }
        setIsLoading(false);
        setCurrentToolStatus(null);
      }
    },
    [messages, isLoading, isMinimized, isOpen]
  );

  const confirmAction = useCallback(
    async (confirmation: PendingConfirmation, messageId: string) => {
      setIsLoading(true);
      setCurrentToolStatus("Đang thực hiện thao tác...");

      try {
        const response = await fetch("/api/ai/chat/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: confirmation.token,
            action: confirmation.action,
            targetId: confirmation.targetId,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data?.error || "Không thể thực hiện thao tác.");
        }

        // Update message confirmation status
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId && msg.confirmation) {
              return {
                ...msg,
                confirmation: {
                  ...msg.confirmation,
                  status: "confirmed",
                  executedMessage: data.message,
                },
              };
            }
            return msg;
          })
        );

        toast.success(data.message || "Thao tác đã được thực hiện thành công!");

        // Add confirmation reply
        msgCounter.current += 1;
        const successMsg: ChatMessageItem = {
          id: `ai-confirmed-${Date.now()}-${msgCounter.current}`,
          role: "assistant",
          content: `✅ **Thành công:** ${data.message}`,
          timestamp: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
        setMessages((prev) => [...prev, successMsg]);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Thao tác thất bại.";
        toast.error(msg);
      } finally {
        setIsLoading(false);
        setCurrentToolStatus(null);
      }
    },
    []
  );

  const cancelAction = useCallback(
    (confirmation: PendingConfirmation, messageId: string) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.confirmation) {
            return {
              ...msg,
              confirmation: {
                ...msg.confirmation,
                status: "cancelled",
              },
            };
          }
          return msg;
        })
      );

      msgCounter.current += 1;
      const cancelNotice: ChatMessageItem = {
        id: `ai-cancelled-${Date.now()}-${msgCounter.current}`,
        role: "assistant",
        content: `Đã hủy thao tác "${confirmation.title}". Dữ liệu của bạn được giữ nguyên an toàn.`,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, cancelNotice]);
      toast.info("Đã hủy thao tác.");
    },
    []
  );

  const clearConversation = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    if (currentUserId) {
      try {
        localStorage.removeItem(`vocabee_chat_history_${currentUserId}`);
      } catch {
        // ignore
      }
    }
    toast.success("Đã xóa hội thoại.");
  }, [currentUserId]);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const restoreChat = useCallback(() => {
    setIsMinimized(false);
    setIsOpen(true);
    setUnreadCount(0);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const abortCurrentRequest = useCallback(() => {
    if (currentAbortControllerRef.current) {
      currentAbortControllerRef.current.abort();
      currentAbortControllerRef.current = null;
      setIsLoading(false);
      setCurrentToolStatus(null);
    }
  }, []);

  return {
    messages,
    isLoading,
    currentToolStatus,
    isOpen,
    isMinimized,
    isExpanded,
    unreadCount,
    sendMessage,
    abortCurrentRequest,
    confirmAction,
    cancelAction,
    clearConversation,
    openChat,
    closeChat,
    minimizeChat,
    restoreChat,
    toggleExpand,
  };
}
