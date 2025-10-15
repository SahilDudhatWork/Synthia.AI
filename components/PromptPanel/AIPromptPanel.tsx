import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import HistoryPage from "./HistoryPage";
import MessageInputForm from "../../components/MessageInputForm";
import { sendMessage } from "../../utils/sendMessage";

interface AIModel {
  id: string;
  workspace_id: string;
  name: string;
  role: string;
  personality: string;
  predefined: boolean;
  topics?: string[];
  custom_triggers?: string[];
  system_prompt?: string;
  config?: Record<string, any>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// User interface
interface User {
  id: string;
  email?: string;
}

// Message interface
interface Message {
  id: string;
  created_at: string;
  prompt: string | null;
  response: string | null;
  loading?: boolean;
}

const AIPromptPanel = ({
  AIModel,
  user,
  workspaceId,
  initialView,
  initialChatId,
  initialMessage,
}: {
  AIModel: AIModel;
  user: User;
  workspaceId: string;
  initialView?: "default" | "chat" | "history";
  initialChatId?: string;
  initialMessage?: string;
}) => {
  const router = useRouter();
  const [view, setView] = useState<"default" | "chat" | "history">(
    initialView || "default"
  );
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialMessage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showModal &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setShowModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  // Handle query chatId changes
  useEffect(() => {
    const { chatId: queryChatId } = router.query;
    if (queryChatId && typeof queryChatId === "string" && queryChatId !== chatId) {
      setChatId(queryChatId);
      setView("chat");
    }
  }, [router.query, chatId]);

  // Load messages for a chat
  useEffect(() => {
    if (view === "chat" && chatId && chatId !== "new") {
      const loadMessages = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from("messages")
            .select("id, created_at, prompt, response")
            .eq("chat_id", chatId)
            .order("created_at");
          if (error) throw error;
          setMessages(data || []);
        } catch (err) {
          console.error("Error loading messages:", err);
          setError("Failed to load messages");
        } finally {
          setLoading(false);
          setTimeout(() => {
            chatRef.current?.scrollTo({
              top: chatRef.current.scrollHeight,
              behavior: "smooth",
            });
          }, 150);
        }
      };
      loadMessages();
    } else if (view === "chat" && chatId === "new") {
      setMessages([]);
      setLoading(false);
    }
  }, [view, chatId]);

  // Send message
  const handleSend = async (customMessage?: string, uploadedFiles?: string[]) => {
    let message = (customMessage || input).trim();
    if (!message && (!uploadedFiles || uploadedFiles.length === 0)) return;

    if (uploadedFiles && uploadedFiles.length > 0) {
      const fileContext = uploadedFiles.join("\n");
      message = `${message}\n${fileContext}`;
    }

    setInput("");
    setLoading(true);
    setError(null);

    const tempId = `temp-${Date.now()}`;
    const created_at = new Date().toISOString();
    const newTempMessage: Message = {
      id: tempId,
      created_at,
      prompt: message,
      response: null,
      loading: true,
    };
    setMessages((prev) => [...prev, newTempMessage]);
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);

    try {
      const result = await sendMessage({
        message,
        userId: user.id,
        workspaceId,
        AIModelId: AIModel.id,
        chatId: chatId || "new",
        systemPrompt: AIModel.system_prompt,
      });

      if (result) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...result.message, loading: false } : m))
        );
        setChatId(result.chatId);

        const currentUrl = new URL(window.location.href);
        const pathname = currentUrl.pathname;
        const queryParams = new URLSearchParams(currentUrl.search);
        queryParams.set("chatId", result.chatId);
        const newUrl = `${pathname}?${queryParams.toString()}`;
        window.history.pushState({}, "", newUrl);

        if (view === "default") setView("chat");

        setTimeout(() => {
          chatRef.current?.scrollTo({
            top: chatRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      } else {
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Send failed:", err);
      setError("Something went wrong.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    setView("chat");
    setChatId(chatId);
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, chatId },
      },
      undefined,
      { shallow: true }
    );
  };

  const handleBack = () => {
    setView("default");
    setChatId(null);
    setMessages([]);
    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, chatId: undefined },
      },
      undefined,
      { shallow: true }
    );
  };

  const renderDefaultContent = () => (
    <div className="flex flex-col items-center justify-center text-center gap-4 p-4 h-full">
      <div
        style={{ backgroundColor: AIModel.config?.bg || "#ffffff" }}
        className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center overflow-hidden shadow-md p-2.5"
      >
        <img
          src={AIModel.role ? `/${AIModel.role}.png` : "/default-avatar.png"}
          alt="AI Model Avatar"
          className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center overflow-hidden rounded-full relative z-10"
        />
      </div>
      <div>
        <p className="text-lg sm:text-xl text-black">
          Hi, I'm <span className="font-bold">{AIModel.name}</span> 👋
        </p>
        {AIModel.personality && (
          <p className="text-lg sm:text-xl text-black">
            I'm a mix of {AIModel.personality} 💖
          </p>
        )}
        {AIModel.topics && AIModel.topics.length > 0 && (
          <p className="text-lg sm:text-xl text-black">
            Ask me about {AIModel.topics.join(", ")} 🌍
          </p>
        )}
        <p className="text-lg sm:text-xl text-black">
          How can I help you today? 😊
        </p>
      </div>
    </div>
  );

  const renderHistoryContent = () => (
    <HistoryPage
      AIModel={AIModel}
      user={user}
      workspaceId={workspaceId}
      onBack={handleBack}
      onChatSelect={handleChatSelect}
    />
  );

  const renderContent = () => {
    switch (view) {
      case "default":
        return renderDefaultContent();
      case "chat":
        return (
          <>
            <div className="flex items-center gap-4 rounded-lg sticky top-0 z-20 bg-white/20 ring-1 ring-inset ring-white/20 backdrop-blur-2xl w-1/5 p-4">
              <div
                style={{ backgroundColor: AIModel.config?.bg || "#ffffff" }}
                className="relative w-[80px] h-[80px] rounded-full overflow-hidden flex items-center justify-center"
              >
                <div className="w-[60px] h-[60px] flex items-center justify-center overflow-hidden rounded-full">
                  <img
                    src={AIModel.role ? `/${AIModel.role}.png` : "/default-avatar.png"}
                    alt={AIModel.name}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-800">{AIModel.name}</h3>
                <p className="text-sm text-gray-600">{AIModel.role}</p>
              </div>
            </div>
            <div
              className="absolute inset-0 overflow-y-auto px-4 sm:px-12 z-0"
              ref={chatRef}
              style={{ overflowAnchor: "auto" }}
            >
              <div className="relative flex w-full flex-1 flex-col sm:gap-2 pb-[250px] pt-[50px] sm:pb-[320px] sm:pt-[120px]">
                {error && (
                  <div className="text-center text-red-400 text-sm p-2 bg-red-900/30 rounded">
                    {error}
                  </div>
                )}
                {messages.map((message) => (
                  <div key={message.id} className="group flex flex-col gap-2">
                    {/* Prompt */}
                    {message.prompt && (
                      <div className="flex justify-end">
                        <div className="flex flex-col gap-2 max-w-[70%]">
                          <div className="flex items-start gap-3">
                            <div className="px-4 py-3 bg-[#F8FAFC] text-black/80 rounded-[24px_4px_24px_24px]">
                              <p className="text-[16px] leading-[24px] whitespace-pre-wrap break-words">
                                {message.prompt}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Response */}
                    <div className="flex justify-start">
                      <div className="flex flex-col gap-4 py-3 max-w-[70%] text-black z-10">
                        {message.loading ? (
                          <div className="text-black/70 px-4 animate-pulse">
                            .....
                          </div>
                        ) : (
                          message.response && (
                            <div className="bg-neutral-100 rounded-[4px_24px_24px_24px] px-4 py-3">
                              <div className="whitespace-pre-wrap break-words text-[16px] leading-[24px]">
                                {message.response}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );
      case "history":
        return renderHistoryContent();
      default:
        return null;
    }
  };

  const hexToRgba = (hex: string, alpha: number): string => {
    hex = hex.replace("#", "");
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) return "rgba(0,0,0,0.5)";
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className="flex h-screen">
      <div
        className="flex-1 relative overflow-hidden rounded-[20px] border-2 border-white/40 m-2"
        style={{
          background: `linear-gradient(to bottom, ${hexToRgba(
            AIModel.config?.bg || "#ffffff",
            0.5
          )}, #F9FAFB)`,
        }}
      >
        <div className="relative flex h-full flex-col justify-between gap-8 p-4 sm:p-12 w-full transition-all duration-500">
          {renderContent()}

          {(view === "default" || view === "chat") && (
            <div
              className={`absolute inset-x-4 bottom-4 sm:inset-x-12 sm:bottom-10 flex flex-col gap-4 z-20`}
            >
              <MessageInputForm
                input={input}
                setInput={setInput}
                onSubmit={handleSend}
                loading={loading}
                isChatModel={true}
                userId={user.id}
                workspaceId={workspaceId}
                chatId={chatId}
              />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px] backdrop-blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default AIPromptPanel;