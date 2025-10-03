import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import { useTranslations } from "next-intl";

interface Chat {
  id: string;
  title: string | null;
  created_at: string;
}

interface AIModel {
  id: string;
  name: string;
  role: string;
  config?: Record<string, any>;
}

interface PromptPanelProps {
  AIModel: AIModel;
  user: {
    id: string;
    email?: string;
  };
  workspaceId: string;
  onBack: () => void;
  onChatSelect: (chatId: string) => void;
}

export default function HistoryPage({
  AIModel,
  user,
  workspaceId,
  onBack,
  onChatSelect,
}: PromptPanelProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const t = useTranslations("AIModel");

  useEffect(() => {
    const loadChats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("chats")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .eq("workspace_id", workspaceId)
          .eq("ai_model_id", AIModel.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setChats(data || []);
      } catch (err) {
        console.error("Error loading chats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && AIModel && workspaceId) loadChats();
  }, [AIModel.id, user.id, workspaceId]);

  const handleChatSelect = (chatId: string) => {
    onChatSelect(chatId);
  };

  const toggleDropdown = (chatId: string) => {
    setActiveDropdown(activeDropdown === chatId ? null : chatId);
  };

  const startEditing = (chatId: string, currentTitle: string) => {
    setEditingChatId(chatId);
    setNewChatTitle(currentTitle || "");
    setActiveDropdown(null);
  };

  const cancelEditing = () => {
    setEditingChatId(null);
    setNewChatTitle("");
  };

  const saveChatTitle = async (chatId: string) => {
    if (!newChatTitle.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("chats")
        .update({ title: newChatTitle.trim() })
        .eq("id", chatId);

      if (error) throw error;

      setChats(
        chats.map((chat) =>
          chat.id === chatId ? { ...chat, title: newChatTitle.trim() } : chat
        )
      );
      setEditingChatId(null);
    } catch (err) {
      console.error("Error updating chat title:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error: messagesError } = await supabase
        .from("messages")
        .delete()
        .eq("chat_id", chatId);

      if (messagesError) throw messagesError;

      const { error: chatError } = await supabase
        .from("chats")
        .delete()
        .eq("id", chatId);

      if (chatError) throw chatError;

      setChats(chats.filter((chat) => chat.id !== chatId));
    } catch (err) {
      console.error("Error deleting chat:", err);
    }
  };

  // Group chats by date
  const groupChatsByDate = () => {
    const today = new Date();
    const grouped: Record<string, Chat[]> = {};

    chats.forEach((chat) => {
      const chatDate = new Date(chat.created_at);
      const diffTime = today.getTime() - chatDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      let groupKey: string;

      if (diffDays === 0) {
        groupKey = "Today";
      } else if (diffDays === 1) {
        groupKey = "Yesterday";
      } else if (diffDays <= 7) {
        groupKey = "Last 7 Days";
      } else if (diffDays <= 30) {
        groupKey = "Last 30 Days";
      } else {
        groupKey = chatDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(chat);
    });

    return grouped;
  };

  const groupedChats = groupChatsByDate();

  return (
    <div className="absolute inset-0 overflow-y-auto px-4 sm:px-12 z-10">
      <div className="relative flex w-full max-w-2xl flex-1 flex-col min-h-0 gap-6 pb-[250px] pt-[50px] sm:pb-[320px] sm:pt-[70px]">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-black">Loading...</div>
          </div>
        )}
        {!loading && chats.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-black/70">No chat history found</p>
          </div>
        )}
        {!loading && chats.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="flex flex-col gap-1">
                <h1 className="text-[16px] leading-[24px] font-medium text-black sm:text-[30px] sm:leading-[36px] sm:tracking-[-0.9px]">
                  {AIModel.name}
                </h1>
                <p className="text-[14px] leading-[20px] text-black/70 sm:text-[16px] sm:leading-[24px]">
                  {AIModel.role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="relative flex size-10 flex-none items-center justify-center gap-2 overflow-hidden rounded-full sm:size-14 sm:w-auto sm:px-4 hover:brightness-110 ring-1 ring-inset ring-white/20 backdrop-blur-xl"
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(255, 255, 255, 1), rgba(250, 245, 245, 1))",
                  }}
                />
                <div className="relative flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="stroke-2 size-5 transition-colors duration-300 sm:size-6 stroke-black"
                  >
                    <path
                      d="M22.7 13.5L20.7005 11.5L18.7 13.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C15.3019 3 18.1885 4.77814 19.7545 7.42909M12 7V12L15 14"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-[16px] leading-[24px] hidden transition-colors duration-300 sm:block text-black">
                    History
                  </span>
                </div>
              </button>
            </div>
            {Object.entries(groupedChats).map(([date, dateChats]) => {
              if (dateChats.length === 0) return null;

              return (
                <div key={date} className="flex flex-col gap-4">
                  <p className="text-[16px] leading-[24px] font-medium">{date}</p>
                  <div className="flex flex-col gap-3">
                    {dateChats.map((chat) => (
                      <div
                        key={chat.id}
                        className="group flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all duration-150 border-white/20 bg-white/40 hover:border-white/60 hover:bg-white"
                        onClick={() => !editingChatId && handleChatSelect(chat.id)}
                      >
                        {editingChatId === chat.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={newChatTitle}
                              onChange={(e) => setNewChatTitle(e.target.value)}
                              className="flex-1 bg-transparent text-black border-b border-white/50 focus:outline-none focus:border-white"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveChatTitle(chat.id);
                                if (e.key === "Escape") cancelEditing();
                              }}
                            />
                            <button
                              onClick={() => saveChatTitle(chat.id)}
                              className="text-black hover:text-green-400"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="text-black hover:text-red-400"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col gap-1 flex-1">
                              <p className="text-[17px] font-normal leading-[24px] text-black">
                                {chat.title || "Untitled Chat"}
                              </p>
                              <p className="text-[14px] font-normal leading-[20px] text-black/50">
                                {new Date(chat.created_at).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                            <div className="relative">
                              <button
                                type="button"
                                className="focus-visible:outline-none flex h-9 w-9 items-center justify-center rounded-lg p-2 outline-none hover:bg-white/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(chat.id);
                                }}
                              >
                                ⋮
                              </button>
                              {activeDropdown === chat.id && (
                                <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                  <div className="py-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditing(chat.id, chat.title || "");
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-white hover:bg-gray-700"
                                    >
                                      Rename
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setChatToDelete(chat.id);
                                        setShowDeleteModal(true);
                                        setActiveDropdown(null);
                                      }}
                                      className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-white mb-4">
              Delete Chat?
            </h3>
            <p className="text-white/70 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setChatToDelete(null);
                }}
                className="px-4 py-2 rounded-lg text-white hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (chatToDelete) {
                    await deleteChat(chatToDelete);
                    setShowDeleteModal(false);
                    setChatToDelete(null);
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500 text-black hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}