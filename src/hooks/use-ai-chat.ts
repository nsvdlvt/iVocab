// src/hooks/use-ai-chat.ts
"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type {
  AgentResultCard,
  AgentToolEvent,
  PendingConfirmation,
} from "@/lib/ai/agent/types";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolEvents?: AgentToolEvent[];
  confirmations?: PendingConfirmation[];
  cards?: AgentResultCard[];
}

export function useAiChat() {
  // Session-only memory: never persisted to localStorage, sessionStorage, IndexedDB, or DB.
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const counterRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessageItem[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const nextId = (prefix: string) => {
    counterRef.current += 1;
    return `${prefix}-${Date.now()}-${counterRef.current}`;
  };

  const runCompletion = useCallback(
    async (conversationHistory: ChatMessageItem[]) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsStreaming(true);
      setCurrentStatus("Đang phân tích yêu cầu...");
      setError(null);

      const aiMsgId = nextId("ai");
      let assistantAdded = false;
      const pendingEvents: AgentToolEvent[] = [];
      const pendingConfirmations: PendingConfirmation[] = [];
      const pendingCards: AgentResultCard[] = [];

      const ensureAssistantBubble = () => {
        if (!assistantAdded) {
          assistantAdded = true;
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              role: "assistant",
              content: "",
              toolEvents: [...pendingEvents],
              confirmations: [...pendingConfirmations],
              cards: [...pendingCards],
            },
          ]);
        }
      };

      const syncMetadataToBubble = () => {
        if (!assistantAdded) return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  toolEvents: [...pendingEvents],
                  confirmations: [...pendingConfirmations],
                  cards: [...pendingCards],
                }
              : m
          )
        );
      };

      try {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
          },
          body: JSON.stringify({
            messages: conversationHistory.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            stream: true,
          }),
          signal: controller.signal,
        });

        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
          const errPayload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(
            errPayload?.error ||
              "Không thể kết nối với Vocabee AI. Vui lòng thử lại."
          );
        }

        if (contentType.includes("text/event-stream") && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let accumulated = "";

          const processBlock = (rawBlock: string) => {
            const trimmedBlock = rawBlock.trim();
            if (!trimmedBlock) return;

            let eventName = "message";
            let dataStr = "";

            for (const line of trimmedBlock.split("\n")) {
              if (line.startsWith("event:")) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                dataStr = line.slice(5).trim();
              }
            }

            if (!dataStr) return;

            let parsed: {
              status?: string;
              delta?: string;
              reply?: string;
              error?: string;
              toolEvents?: AgentToolEvent[];
              confirmations?: PendingConfirmation[];
              cards?: AgentResultCard[];
              toolName?: string;
              displayName?: string;
            };
            try {
              parsed = JSON.parse(dataStr);
            } catch {
              return;
            }

            if (eventName === "status" && typeof parsed.status === "string") {
              setCurrentStatus(parsed.status);
            } else if (eventName === "tool_event" && parsed.displayName) {
              const evt: AgentToolEvent = {
                toolName: parsed.toolName || parsed.displayName,
                displayName: parsed.displayName,
                status: (parsed as AgentToolEvent).status || "running",
              };
              const idx = pendingEvents.findIndex(
                (e) => e.displayName === evt.displayName
              );
              if (idx >= 0) pendingEvents[idx] = evt;
              else pendingEvents.push(evt);
              syncMetadataToBubble();
            } else if (
              eventName === "confirmations" &&
              Array.isArray(parsed.confirmations)
            ) {
              for (const conf of parsed.confirmations) {
                if (!pendingConfirmations.some((c) => c.actionId === conf.actionId)) {
                  pendingConfirmations.push(conf);
                }
              }
              ensureAssistantBubble();
              syncMetadataToBubble();
            } else if (eventName === "cards" && Array.isArray(parsed.cards)) {
              for (const card of parsed.cards) {
                if (!pendingCards.some((c) => c.id === card.id)) {
                  pendingCards.push(card);
                }
              }
              ensureAssistantBubble();
              syncMetadataToBubble();
            } else if (eventName === "delta" && typeof parsed.delta === "string") {
              ensureAssistantBubble();
              accumulated += parsed.delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId ? { ...m, content: accumulated } : m
                )
              );
            } else if (eventName === "done") {
              ensureAssistantBubble();
              if (typeof parsed.reply === "string") {
                accumulated = parsed.reply;
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        content: accumulated,
                        toolEvents: Array.isArray(parsed.toolEvents)
                          ? parsed.toolEvents
                          : m.toolEvents,
                        confirmations: Array.isArray(parsed.confirmations)
                          ? parsed.confirmations
                          : m.confirmations,
                        cards: Array.isArray(parsed.cards)
                          ? parsed.cards
                          : m.cards,
                      }
                    : m
                )
              );
            } else if (eventName === "error") {
              throw new Error(
                parsed.error || "Không thể nhận phản hồi từ Vocabee AI. Vui lòng thử lại."
              );
            }
          };

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const blocks = buffer.split("\n\n");
            buffer = blocks.pop() || "";

            for (const block of blocks) {
              processBlock(block);
            }
          }

          if (buffer.trim()) {
            processBlock(buffer);
          }

          if (
            !accumulated.trim() &&
            pendingConfirmations.length === 0 &&
            pendingCards.length === 0 &&
            !controller.signal.aborted
          ) {
            throw new Error("Vocabee AI không trả về nội dung. Vui lòng thử lại.");
          }
        } else {
          const data = (await response.json()) as {
            success?: boolean;
            reply?: string;
            toolEvents?: AgentToolEvent[];
            confirmations?: PendingConfirmation[];
            cards?: AgentResultCard[];
            error?: string;
          };

          if (!data.success) {
            throw new Error(data.error || "Không thể nhận phản hồi từ Vocabee AI.");
          }

          assistantAdded = true;
          setMessages((prev) => [
            ...prev,
            {
              id: aiMsgId,
              role: "assistant",
              content: data.reply || "",
              toolEvents: data.toolEvents ?? [],
              confirmations: data.confirmations ?? [],
              cards: data.cards ?? [],
            },
          ]);
        }

        if (isMinimized || !isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (err: unknown) {
        if (
          controller.signal.aborted ||
          (err instanceof Error && err.name === "AbortError")
        ) {
          setMessages((prev) =>
            prev.filter((m) => !(m.id === aiMsgId && !m.content.trim()))
          );
          return;
        }

        setMessages((prev) =>
          prev.filter((m) => !(m.id === aiMsgId && !m.content.trim()))
        );

        const message =
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi kết nối với máy chủ AI.";
        setError(message);
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        setIsStreaming(false);
        setCurrentStatus(null);
      }
    },
    [isMinimized, isOpen]
  );

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return false;

      const userMsg: ChatMessageItem = {
        id: nextId("user"),
        role: "user",
        content: trimmed,
      };

      const nextMessages = [
        ...messagesRef.current.filter((m) => m.content.trim().length > 0),
        userMsg,
      ];
      setMessages(nextMessages);
      await runCompletion(nextMessages);
      return true;
    },
    [isStreaming, runCompletion]
  );

  const confirmAction = useCallback(
    async (confirmation: PendingConfirmation, messageId: string) => {
      if (isConfirming || isStreaming) return;
      setIsConfirming(true);
      setCurrentStatus("Đang lưu thay đổi...");

      try {
        const res = await fetch("/api/ai/chat/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: confirmation.token,
            actionId: confirmation.actionId,
            action: confirmation.action,
            decision: "confirm",
          }),
        });

        const data = (await res.json()) as {
          success?: boolean;
          message?: string;
          error?: string;
          actionUrl?: string;
        };

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Không thể thực hiện thao tác.");
        }

        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId || !m.confirmations) return m;
            return {
              ...m,
              confirmations: m.confirmations.map((c) =>
                c.actionId === confirmation.actionId
                  ? {
                      ...c,
                      status: "confirmed",
                      executedMessage: data.message,
                    }
                  : c
              ),
              cards: data.actionUrl
                ? [
                    ...(m.cards ?? []),
                    {
                      id: `result-${confirmation.actionId}`,
                      kind: "action_result",
                      title: "Thao tác hoàn tất",
                      subtitle: data.message,
                      actionUrl: data.actionUrl,
                    },
                  ]
                : m.cards,
            };
          })
        );

        toast.success(data.message || "Đã thực hiện thành công!");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Thao tác thất bại.";
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== messageId || !m.confirmations) return m;
            return {
              ...m,
              confirmations: m.confirmations.map((c) =>
                c.actionId === confirmation.actionId
                  ? { ...c, status: "failed", executedMessage: msg }
                  : c
              ),
            };
          })
        );
        toast.error(msg);
      } finally {
        setIsConfirming(false);
        setCurrentStatus(null);
      }
    },
    [isConfirming, isStreaming]
  );

  const cancelAction = useCallback(
    async (confirmation: PendingConfirmation, messageId: string) => {
      if (isConfirming) return;

      await fetch("/api/ai/chat/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: confirmation.token,
          actionId: confirmation.actionId,
          action: confirmation.action,
          decision: "cancel",
        }),
      }).catch(() => {});

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId || !m.confirmations) return m;
          return {
            ...m,
            confirmations: m.confirmations.map((c) =>
              c.actionId === confirmation.actionId
                ? {
                    ...c,
                    status: "cancelled",
                    executedMessage: "Đã hủy thao tác. Dữ liệu của bạn được giữ nguyên.",
                  }
                : c
            ),
          };
        })
      );
      toast.info("Đã hủy thao tác.");
    },
    [isConfirming]
  );

  const retryLastMessage = useCallback(async () => {
    if (isStreaming) return;
    const valid = messagesRef.current.filter((m) => m.content.trim().length > 0);
    let lastUserIdx = -1;
    for (let i = valid.length - 1; i >= 0; i--) {
      if (valid[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const retryHistory = valid.slice(0, lastUserIdx + 1);
    setMessages(retryHistory);
    await runCompletion(retryHistory);
  }, [isStreaming, runCompletion]);

  const restoreLastFailedMessage = useCallback((): string | null => {
    if (isStreaming) return null;
    const current = messagesRef.current;
    let lastUserIdx = -1;
    for (let i = current.length - 1; i >= 0; i--) {
      if (current[i].role === "user") {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return null;

    const text = current[lastUserIdx].content;
    setMessages(current.slice(0, lastUserIdx));
    setError(null);
    return text;
  }, [isStreaming]);

  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
    setCurrentStatus(null);
  }, []);

  const newChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setCurrentStatus(null);
    setUnreadCount(0);
  }, []);

  const openChat = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  }, []);

  const minimizeChat = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const closeChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsOpen(false);
    setIsMinimized(false);
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    setCurrentStatus(null);
    setUnreadCount(0);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  return {
    messages,
    isStreaming,
    currentStatus,
    isConfirming,
    error,
    isOpen,
    isMinimized,
    isExpanded,
    unreadCount,
    sendMessage,
    confirmAction,
    cancelAction,
    retryLastMessage,
    restoreLastFailedMessage,
    stopGenerating,
    newChat,
    openChat,
    minimizeChat,
    closeChat,
    toggleExpand,
  };
}
