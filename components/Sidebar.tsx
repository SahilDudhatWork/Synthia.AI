import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

type User = {
  id?: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
};

type SidebarProps = {
  user: User | null;
  activeWorkspaceId: string | null;
  setActiveWorkspaceId?: (id: string) => void;
  toggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  messages?: any;
};
interface Chat {
  id: string;
  title: string | null;
  created_at: string;
  modelImage?: string;
  modelName?: string;
  modelId?: string;
}

export default function Sidebar({
  user,
  activeWorkspaceId,
  setActiveWorkspaceId,
  toggleSidebar,
  isSidebarOpen,
  messages,
}: SidebarProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePanel, setActivePanel] = useState<
    "sidebar" | "history" | "inbox" | null
  >(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [AIModels, setAIModels] = useState<any[]>([]);
  const router = useRouter();
  const queryWorkspaceId = router.query.workspaceId as string | undefined;

  useEffect(() => {
    if (queryWorkspaceId && queryWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId?.(queryWorkspaceId);
    }
  }, [queryWorkspaceId, activeWorkspaceId, setActiveWorkspaceId]);

  const loadAllChats = async () => {
    if (!user?.id || !activeWorkspaceId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chats")
        .select("id, title, created_at, ai_model_id")
        .eq("user_id", user.id)
        .eq("workspace_id", activeWorkspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedChats = (data || []).map((chat) => {
        const model = AIModels.find((c) => c.id === chat.ai_model_id);
        return {
          ...chat,
          modelImage: model?.role ? `/${model.role}.png` : '/default-avatar.png',
          modelName: model?.name || "Unknown",
          modelId: model?.id || "Unknown",
        };
      });

      setChats(enrichedChats);
    } catch (err) {
      console.error("Error loading chats:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter((chat) =>
    chat.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedChats = groupChatsByDate(filteredChats);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("workspaces")
        .select("name, id, current_step, onboarding_complete")
        .eq("user_id", user.id);

      if (data) {
        setWorkspaces(data);
        if (data.length > 0 && setActiveWorkspaceId) {
          setActiveWorkspaceId(data[0].id);
          const { data: members } = await supabase
            .from("ai_models")
            .select("*");
          if (members) setAIModels(members);
        }
      }
    };

    fetchData();
  }, [router, user, setActiveWorkspaceId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lightColors = [
    { bg: "#E9D5FF", text: "#9333EA" }, // Purple
    { bg: "#FEF08A", text: "#CA8A04" }, // Yellow
    { bg: "#BAE6FD", text: "#0284C7" }, // Blue
    { bg: "#BBF7D0", text: "#16A34A" }, // Green
    { bg: "#FBCFE8", text: "#DB2777" }, // Pink
  ];

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  // Function to render no chats message
  const renderNoChatsMessage = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-24 h-24 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="size-8 stroke-2 text-gray-400"
        >
          <path
            d="M8 12H16M8 16H16M21 12C21 16.9706 16.9706 21 12 21C10.2289 21 8.56537 20.4743 7.15677 19.5607L3 20L4.43927 15.8432C3.52571 14.4346 3 12.7711 3 11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          ></path>
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No chats yet</h3>
      <p className="text-gray-500 text-sm mb-4">
        Start a conversation with an AI model to see your chat history here.
      </p>
    </div>
  );

  return (
    <>
      <div className="md:w-16 h-full z-40 flex flex-col md:items-center md:justify-between bg-gradient-to-r from-white to-neutral-200  md:bg-none md:bg-white md:relative absolute top-0 left-0 w-full items-start justify-start transition-transform duration-700 ease-in-out">
        <div className="md:hidden" onClick={toggleSidebar}>
          <div
            className="flex items-center justify-between gap-4 px-3 py-3"
            data-sentry-component="Header"
            data-sentry-source-file="header.tsx"
          >
            <button
              className="relative inline-flex items-center justify-center whitespace-nowrap font-medium outline-none transition-all focus-visible:outline-none disabled:pointer-events-none [&amp;_svg]:pointer-events-none [&amp;_svg]:size-5 [&amp;_svg]:shrink-0 active:scale-95 min-w-8 bg-transparent active:bg-black/10 before:pointer-events-none before:absolute before:inset-[-2px] before:rounded-full focus-visible:before:ring-2 focus-visible:before:ring-blue-500 h-8 w-8 rounded-full p-0 text-black hover:bg-black/10"
              type="button"
              aria-label="Left action"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-6 stroke-2 text-black stroke-black"
              >
                <path
                  d="M17 7L7 17M7 7L17 17"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
            </button>
            <div className="flex flex-1 flex-col items-center justify-center"></div>
            <div className="h-8 w-8"></div>
          </div>
        </div>
        <div className="custom-scrollbar md:px-1 py-4 px-4 md:w-auto w-full flex flex-1 flex-col gap-8 p-4 pt-2 md:flex-none md:gap-0 md:p-0">
          {/* Top Icons */}
          <div className="flex flex-col md:items-center items-start space-y-5">
            <div
              onClick={() =>
                setActivePanel(activePanel === "sidebar" ? null : "sidebar")
              }
              className="cursor-pointer overflow-hidden"
            >
              {workspaces.map((ws, idx) => {
                const letter = ws.name?.[0]?.toUpperCase() || "?";
                const { bg, text } = lightColors[idx % lightColors.length];
                const isActive = ws.id === activeWorkspaceId;
                if (!isActive) return null;
                return (
                  <div
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId?.(ws.id);
                      router.push(
                        {
                          pathname: router.pathname,
                          query: {
                            ...router.query,
                            workspaceId: ws.id,
                          },
                        },
                        undefined,
                        { shallow: true }
                      );
                    }}
                    className="group relative flex w-full items-center gap-3 rounded-xl md:p-3 p-0 hover:bg-black/5 cursor-pointer"
                  >
                    <div className="relative flex items-center gap-3">
                      <div
                        className={`pointer-events-none flex items-center justify-center overflow-hidden h-12 w-12 rounded-[8px] text-white`}
                        style={{ backgroundColor: bg }}
                      >
                        <p
                          className="text-[20px] leading-[28px] font-medium"
                          style={{ color: text }}
                        >
                          {letter}
                        </p>
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 h-12 w-12 rounded-[8px]"></div>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col md:hidden">
                        <p className="text-[16px] leading-[24px] font-medium truncate text-black">
                          {ws.name}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Workspaces */}
          <div className="flex flex-col md:items-center items-start md:space-y-4 space-y-0 md:gap-0 gap-2 md:mt-4 mt-0 md:h-[calc(100vh-200px)] overflow-auto justify-center">
            <Link
              href={`/dashboard?workspaceId=${activeWorkspaceId}`}
              className="flex items-center rounded-xl py-3 hover:bg-black/5 md:w-16 md:justify-center md:py-3 h-12 w-full justify-start gap-3 px-3 cursor-pointer"
              onClick={() => {
                setActivePanel(null);
                toggleSidebar?.();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-6 stroke-2 stroke-black"
              >
                <path
                  d="M12.9823 2.764C12.631 2.49075 12.4553 2.35412 12.2613 2.3016C12.0902 2.25526 11.9098 2.25526 11.7387 2.3016C11.5447 2.35412 11.369 2.49075 11.0177 2.764L4.23539 8.03912C3.78202 8.39175 3.55534 8.56806 3.39203 8.78886C3.24737 8.98444 3.1396 9.20478 3.07403 9.43905C3 9.70352 3 9.9907 3 10.5651V17.8C3 18.9201 3 19.4801 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21H8.2C8.48003 21 8.62004 21 8.727 20.9455C8.82108 20.8976 8.89757 20.8211 8.9455 20.727C9 20.62 9 20.48 9 20.2V13.6C9 13.0399 9 12.7599 9.10899 12.546C9.20487 12.3578 9.35785 12.2049 9.54601 12.109C9.75992 12 10.0399 12 10.6 12H13.4C13.9601 12 14.2401 12 14.454 12.109C14.6422 12.2049 14.7951 12.3578 14.891 12.546C15 12.7599 15 13.0399 15 13.6V20.2C15 20.48 15 20.62 15.0545 20.727C15.1024 20.8211 15.1789 20.8976 15.273 20.9455C15.38 21 15.52 21 15.8 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4801 21 18.9201 21 17.8V10.5651C21 9.9907 21 9.70352 20.926 9.43905C20.8604 9.20478 20.7526 8.98444 20.608 8.78886C20.4447 8.56806 20.218 8.39175 19.7646 8.03913L12.9823 2.764Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <p className="__className_e74534 text-[18px] leading-[28px] font-medium md:hidden text-[#191818]">
                Home
              </p>
            </Link>
            <div
              onClick={() => {
                setActivePanel(activePanel === "history" ? null : "history");
                loadAllChats();
              }}
              className="flex items-center rounded-xl py-3 hover:bg-black/5 md:w-16 md:justify-center md:py-3 h-12 w-full justify-start gap-3 px-3 cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-6 stroke-2 stroke-black"
              >
                <path
                  d="M7.99962 9.5H11.9996M7.99962 13H14.9996M12.4996 20C17.194 20 20.9996 16.1944 20.9996 11.5C20.9996 6.80558 17.194 3 12.4996 3C7.8052 3 3.99962 6.80558 3.99962 11.5C3.99962 12.45 4.15547 13.3636 4.443 14.2166C4.55119 14.5376 4.60529 14.6981 4.61505 14.8214C4.62469 14.9432 4.6174 15.0286 4.58728 15.1469C4.55677 15.2668 4.48942 15.3915 4.35472 15.6408L2.71906 18.6684C2.48575 19.1002 2.36909 19.3161 2.3952 19.4828C2.41794 19.6279 2.50337 19.7557 2.6288 19.8322C2.7728 19.9201 3.01692 19.8948 3.50517 19.8444L8.62619 19.315C8.78127 19.299 8.85881 19.291 8.92949 19.2937C8.999 19.2963 9.04807 19.3029 9.11586 19.3185C9.18478 19.3344 9.27145 19.3678 9.44478 19.4345C10.3928 19.7998 11.4228 20 12.4996 20Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <p className="__className_e74534 text-[18px] leading-[28px] font-medium md:hidden text-[#191818]">
                History
              </p>
            </div>
          </div>
          <div className="relative md:mt-0 mt-auto" ref={dropdownRef}>
            <Link
              href={`/settings?workspaceId=${activeWorkspaceId}`}
              className="flex items-center rounded-xl py-3 hover:bg-black/5 md:w-16 md:justify-center md:py-3 h-12 w-full justify-start gap-3 px-3 cursor-pointer"
              onClick={() => {
                setActivePanel(null);
                toggleSidebar?.();
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="size-6 stroke-2 stroke-black"
              >
                <path
                  d="M12.0005 15C13.6573 15 15.0005 13.6569 15.0005 12C15.0005 10.3431 13.6573 9 12.0005 9C10.3436 9 9.00049 10.3431 9.00049 12C9.00049 13.6569 10.3436 15 12.0005 15Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
                <path
                  d="M9.28957 19.3711L9.87402 20.6856C10.0478 21.0768 10.3313 21.4093 10.6902 21.6426C11.0492 21.8759 11.4681 22.0001 11.8962 22C12.3244 22.0001 12.7433 21.8759 13.1022 21.6426C13.4612 21.4093 13.7447 21.0768 13.9185 20.6856L14.5029 19.3711C14.711 18.9047 15.0609 18.5159 15.5029 18.26C15.9477 18.0034 16.4622 17.8941 16.9729 17.9478L18.4029 18.1C18.8286 18.145 19.2582 18.0656 19.6396 17.8713C20.021 17.6771 20.3379 17.3763 20.5518 17.0056C20.766 16.635 20.868 16.2103 20.8455 15.7829C20.823 15.3555 20.677 14.9438 20.4251 14.5978L19.5785 13.4344C19.277 13.0171 19.1159 12.5148 19.1185 12C19.1184 11.4866 19.281 10.9864 19.5829 10.5711L20.4296 9.40778C20.6814 9.06175 20.8275 8.65007 20.85 8.22267C20.8725 7.79528 20.7704 7.37054 20.5562 7C20.3423 6.62923 20.0255 6.32849 19.644 6.13423C19.2626 5.93997 18.833 5.86053 18.4074 5.90556L16.9774 6.05778C16.4667 6.11141 15.9521 6.00212 15.5074 5.74556C15.0645 5.48825 14.7144 5.09736 14.5074 4.62889L13.9185 3.31444C13.7447 2.92317 13.4612 2.59072 13.1022 2.3574C12.7433 2.12408 12.3244 1.99993 11.8962 2C11.4681 1.99993 11.0492 2.12408 10.6902 2.3574C10.3313 2.59072 10.0478 2.92317 9.87402 3.31444L9.28957 4.62889C9.0825 5.09736 8.73245 5.48825 8.28957 5.74556C7.84479 6.00212 7.33024 6.11141 6.81957 6.05778L5.38513 5.90556C4.95946 5.86053 4.52987 5.93997 4.14844 6.13423C3.76702 6.32849 3.45014 6.62923 3.23624 7C3.02206 7.37054 2.92002 7.79528 2.94251 8.22267C2.96499 8.65007 3.11103 9.06175 3.36291 9.40778L4.20957 10.5711C4.51151 10.9864 4.67411 11.4866 4.67402 12C4.67411 12.5134 4.51151 13.0137 4.20957 13.4289L3.36291 14.5922C3.11103 14.9382 2.96499 15.3499 2.94251 15.7773C2.92002 16.2047 3.02206 16.6295 3.23624 17C3.45036 17.3706 3.76727 17.6712 4.14864 17.8654C4.53001 18.0596 4.95949 18.1392 5.38513 18.0944L6.81513 17.9422C7.3258 17.8886 7.84034 17.9979 8.28513 18.2544C8.72966 18.511 9.08134 18.902 9.28957 19.3711Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></path>
              </svg>
              <p className="__className_e74534 text-[18px] leading-[28px] font-medium md:hidden text-[#191818]">
                Settings
              </p>
            </Link>

            {showDropdown && (
              <div className="absolute left-12 bottom-0 mb-2 w-32 bg-gray-800 rounded shadow-lg border border-gray-700 z-50">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        {activePanel === "sidebar" && (
          <div>
            <div
              onClick={() =>
                setActivePanel(activePanel === "sidebar" ? null : "sidebar")
              }
              className="fixed inset-0 md:inset-[0px_0px_0px_80px] z-50 bg-black/50"
              style={{ opacity: 1 }}
            ></div>
            <div className="fixed inset-y-0 z-50 flex w-full flex-col md:left-20 md:max-w-[24rem] overflow-hidden md:rounded-br-[24px] md:rounded-tr-[24px] bg-gradient-to-r from-white to-neutral-200 ring-1 ring-inset ring-white/10 [body:has(&)]:overflow-hidden transition-all">
              <div className="md:hidden" onClick={() => setActivePanel(null)}>
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <button
                    className="relative inline-flex items-center justify-center whitespace-nowrap font-medium outline-none transition-all focus-visible:outline-none disabled:pointer-events-none [&amp;_svg]:pointer-events-none [&amp;_svg]:size-5 [&amp;_svg]:shrink-0 active:scale-95 min-w-8 bg-transparent active:bg-black/10 before:pointer-events-none before:absolute before:inset-[-2px] before:rounded-full focus-visible:before:ring-2 focus-visible:before:ring-blue-500 h-8 w-8 rounded-full p-0 text-black hover:bg-black/10"
                    type="button"
                    onClick={() => {
                      setShowSidebar(!showSidebar);
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="size-6 stroke-2 text-black stroke-black"
                    >
                      <path
                        d="M14 18L8 12L14 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </button>
                  <div className="flex flex-1 flex-col items-center justify-center"></div>
                  <div className="h-8 w-8"></div>
                </div>
              </div>
              <div className="items-center justify-between px-4 pb-2 pt-6">
                <p className="text-black text-[30px] leading-[36px] font-medium tracking-[-0.9px]">
                  {messages?.aiModels?.workspaces}
                </p>
              </div>
              <div
                className="flex flex-1 flex-col overflow-y-auto"
                style={{ opacity: 1 }}
              >
                <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
                  <div className="flex h-full flex-col gap-4">
                    <div className="peer flex flex-col gap-1 rounded-2xl p-1 bg-white shadow-lg empty:hidden">
                      {workspaces.map((ws, idx) => {
                        const letter =
                          ws.name?.[0]?.toUpperCase() || "?";
                        const { bg, text } =
                          lightColors[idx % lightColors.length];
                        const isActive = ws.id === activeWorkspaceId;

                        return (
                          <div
                            key={ws.id}
                            onClick={() => {
                              setActiveWorkspaceId?.(ws.id);
                              router.push(
                                {
                                  pathname: router.pathname,
                                  query: {
                                    ...router.query,
                                    workspaceId: ws.id,
                                  },
                                },
                                undefined,
                                { shallow: true }
                              );
                              toggleSidebar?.();
                              setActivePanel(null);
                            }}
                            className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 hover:bg-black/5 ${isActive ? "bg-rose-500/5" : ""
                              } cursor-pointer`}
                          >
                            <div className="relative">
                              <div className="relative">
                                <div
                                  className={`pointer-events-none flex items-center justify-center overflow-hidden h-10 w-10 rounded-[8px] text-white`}
                                  style={{ backgroundColor: bg }}
                                >
                                  <p
                                    className="text-[20px] leading-[28px] font-medium"
                                    style={{ color: text }}
                                  >
                                    {letter}
                                  </p>
                                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 h-10 w-10 rounded-[8px]"></div>
                                </div>
                              </div>
                              {isActive ? (
                                <div className="absolute bottom-[-4px] right-[-4px] rounded-full bg-white p-0.5">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    stroke="none"
                                    className="size-4 text-rose-500"
                                  >
                                    <path
                                      d="M12 1C5.92487 1 1 5.92487 1 12C1 18.0751 5.92487 23 12 23C18.0751 23 23 18.0751 23 12C23 5.92487 18.0751 1 12 1ZM17.2071 9.70711C17.5976 9.31658 17.5976 8.68342 17.2071 8.29289C16.8166 7.90237 16.1834 7.90237 15.7929 8.29289L10.5 13.5858L8.20711 11.2929C7.81658 10.9024 7.18342 10.9024 6.79289 11.2929C6.40237 11.6834 6.40237 12.3166 6.79289 12.7071L9.79289 15.7071C10.1834 16.0976 10.8166 16.0976 11.2071 15.7071L17.2071 9.70711Z"
                                      fillRule="evenodd"
                                      clipRule="evenodd"
                                    ></path>
                                  </svg>
                                </div>
                              ) : null}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col">
                              <p className="text-[16px] leading-[24px] font-medium truncate text-black">
                                {ws.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="peer flex flex-col gap-1 rounded-2xl p-1 bg-white shadow-lg empty:hidden">
                      <div
                        onClick={() => router.push("/workspace/createNew")}
                        className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 hover:bg-black/5 active:bg-rose-500/5 cursor-pointer"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            className="size-6 stroke-2 stroke-black"
                          >
                            <path
                              d="M12 5V19M5 12H19"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            ></path>
                          </svg>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <p className="text-[16px] leading-[24px] font-medium truncate text-black">
                            Add workspace
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activePanel === "history" && (
          <div>
            <div
              onClick={() =>
                setActivePanel(activePanel === "history" ? null : "history")
              }
              className="fixed inset-0 md:inset-[0px_0px_0px_80px] z-50 bg-black/50"
              style={{ opacity: 1 }}
            ></div>
            <div className="fixed inset-0 md:inset-y-0 z-50 flex w-full flex-col md:left-20 md:max-w-[24rem] overflow-hidden md:rounded-br-[24px] md:rounded-tr-[24px] bg-gradient-to-r from-white  to-neutral-200 ring-1 ring-inset ring-white/10 [body:has(&amp;)]:overflow-hidden">
              <div className="md:hidden" onClick={() => setActivePanel(null)}>
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <button
                    className="relative inline-flex items-center justify-center whitespace-nowrap font-medium outline-none transition-all focus-visible:outline-none disabled:pointer-events-none [&amp;_svg]:pointer-events-none [&amp;_svg]:size-5 [&amp;_svg]:shrink-0 active:scale-95 min-w-8 bg-transparent active:bg-black/10 before:pointer-events-none before:absolute before:inset-[-2px] before:rounded-full focus-visible:before:ring-2 focus-visible:before:ring-blue-500 h-8 w-8 rounded-full p-0 text-black hover:bg-black/10"
                    type="button"
                    aria-label="Left action"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="size-6 stroke-2 text-black stroke-black"
                    >
                      <path
                        d="M14 18L8 12L14 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </button>
                  <div className="flex flex-1 flex-col items-center justify-center"></div>
                  <div className="h-8 w-8"></div>
                </div>
              </div>
              <div className="items-center justify-between px-4 pb-2 pt-6">
                <p className="text-black text-[30px] leading-[36px] font-medium tracking-[-0.9px]">
                  {messages?.aiModels?.history}
                </p>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
                  <div className="contents">
                    <div className="relative flex items-center">
                      <input
                        placeholder={messages?.aiModels?.search_chat}
                        className="h-8 w-full rounded-full bg-black/5 px-8 py-1 text-black placeholder:text-black/70 focus-visible:outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute left-0 flex h-8 w-8 items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          className="stroke-2 stroke-black size-[18px]"
                        >
                          <path
                            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                      </div>
                    </div>

                    {/* Show no chats message when there are no chats */}
                    {chats.length === 0 && !loading && (
                      renderNoChatsMessage()
                    )}

                    {loading ? (
                      <p className="text-[14px] leading-[20px] text-black/70 mt-4">
                        Loading chats...
                      </p>
                    ) : filteredChats.length === 0 && searchQuery ? (
                      <p className="text-[14px] leading-[20px] text-black/70 mt-4">
                        {messages?.aiModels?.chats_not_found} "{searchQuery}"
                      </p>
                    ) : filteredChats.length === 0 && chats.length > 0 ? (
                      <p className="text-[14px] leading-[20px] text-black/70 mt-4">
                        {messages?.aiModels?.no_chat}
                      </p>
                    ) : (
                      Object.entries(groupedChats).map(([group, chats]) => {
                        // Try to split month/range and year
                        const match = group.match(/^(.+?)\s(\d{4})$/);
                        const label = match ? match[1] : group; // e.g. "January"
                        const year = match ? match[2] : ""; // e.g. "2025"

                        return (
                          <div key={group} className="flex flex-col gap-3">
                            <p className="text-[16px] leading-[24px] font-medium text-black">
                              {label}
                              {year && <span className="ml-1">{year}</span>}
                            </p>

                            <div className="rounded-2xl p-1 bg-white shadow-lg empty:hidden">
                              {chats.map((chat) => (
                                <div
                                  key={chat.id}
                                  className="peer flex flex-col gap-1 "
                                >
                                  <div className="rounded-xl">
                                    <div
                                      role="button"
                                      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 hover:bg-black/5 active:bg-rose-500/5 cursor-pointer"
                                      onClick={() => {
                                        router.push(
                                          `/ai-model/${chat.modelId}?workspaceId=${activeWorkspaceId}&chatId=${chat.id}`
                                        );
                                        toggleSidebar?.();
                                        setActivePanel(null);
                                      }}
                                    >
                                      <img
                                        alt="AI Model"
                                        src={chat.modelImage}
                                        style={{
                                          padding: "5px",
                                        }}
                                        className="w-11 h-11 rounded-full object-cover"
                                      />
                                      <div className="flex min-w-0 flex-1 flex-col">
                                        <p className="text-[16px] leading-[24px] font-medium truncate text-black">
                                          {chat.title}
                                        </p>
                                        <p className="text-[14px] leading-[20px] truncate opacity-70 text-black">
                                          {new Date(
                                            chat.created_at
                                          ).toLocaleDateString("en-US", {
                                            day: "numeric",
                                            month: "long",
                                          })}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activePanel === "inbox" && (
          <div>
            <div
              onClick={() =>
                setActivePanel(activePanel === "inbox" ? null : "inbox")
              }
              className="fixed inset-0 md:inset-[0px_0px_0px_80px] z-50 bg-black/50"
              style={{ opacity: 1 }}
            ></div>
            <div className="fixed inset-0 md:inset-y-0 z-50 flex w-full flex-col md:left-20 md:max-w-96 overflow-hidden md:rounded-br-[24px] md:rounded-tr-[24px] bg-gradient-to-r from-white  to-neutral-200 ring-1 ring-inset ring-white/10 [body:has(&amp;)]:overflow-hidden">
              <div className="md:hidden" onClick={() => setActivePanel(null)}>
                <div className="flex items-center justify-between gap-4 px-3 py-3">
                  <button
                    className="relative inline-flex items-center justify-center whitespace-nowrap font-medium outline-none transition-all focus-visible:outline-none disabled:pointer-events-none [&amp;_svg]:pointer-events-none [&amp;_svg]:size-5 [&amp;_svg]:shrink-0 active:scale-95 min-w-8 bg-transparent active:bg-black/10 before:pointer-events-none before:absolute before:inset-[-2px] before:rounded-full focus-visible:before:ring-2 focus-visible:before:ring-blue-500 h-8 w-8 rounded-full p-0 text-black hover:bg-black/10"
                    type="button"
                    aria-label="Left action"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="size-6 stroke-2 text-black stroke-black"
                    >
                      <path
                        d="M14 18L8 12L14 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      ></path>
                    </svg>
                  </button>
                  <div className="flex flex-1 flex-col items-center justify-center"></div>
                  <div className="h-8 w-8"></div>
                </div>
              </div>
              <div className="items-center justify-between px-4 pb-2 pt-6">
                <p className="text-black text-[30px] leading-[36px] font-medium tracking-[-0.9px]">
                  {messages?.aiModels?.inbox}
                </p>
              </div>
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-1 flex-col gap-8 p-4 pt-2">
                  <div className="contents">
                    <div className="relative flex items-center">
                      <input
                        placeholder="Search chats..."
                        className="h-8 w-full rounded-full bg-black/5 px-8 py-1 placeholder:text-black/40 focus-visible:outline-none"
                        value=""
                      />
                      <div className="absolute left-0 flex h-8 w-8 items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          className="stroke-2 stroke-black size-[18px]"
                        >
                          <path
                            d="M21 21L16.65 16.65M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <p className="text-[16px] leading-[24px] font-medium text-black">
                        To-do
                      </p>
                      <div className="flex flex-col gap-4">
                        <div className="peer flex flex-col gap-1 rounded-2xl p-1 bg-white shadow-lg empty:hidden">
                          <div className="rounded-xl">
                            <div
                              role="button"
                              className="group relative flex w-full items-center gap-3 overflow-hidden rounded-xl p-3 hover:bg-black/5 active:bg-rose-500/5 cursor-pointer"
                            >
                              <div className="relative">
                                <div className="relative size-10 flex-none overflow-hidden rounded-full">
                                  <img alt="buddy" src="/benoit-square.webp" />
                                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10"></div>
                                </div>
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col">
                                <p className="text-[16px] leading-[24px] font-medium truncate text-black">
                                  12 new ideas
                                </p>
                                <p className="text-[14px] leading-[20px] truncate opacity-70 text-black">
                                  Ideas
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function groupChatsByDate(chats: any[]) {
  if (!chats || chats.length === 0) {
    return {};
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups: Record<string, any[]> = {};

  chats.forEach((chat) => {
    const chatDate = new Date(chat.created_at);
    const chatDay = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

    let groupKey = "";

    if (chatDay.getTime() === today.getTime()) {
      groupKey = "Today";
    } else if (chatDay.getTime() === yesterday.getTime()) {
      groupKey = "Yesterday";
    } else if (chatDay >= sevenDaysAgo) {
      groupKey = "Last 7 Days";
    } else if (chatDay >= thirtyDaysAgo) {
      groupKey = "Last 30 Days";
    } else {
      groupKey = chatDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(chat);
  });

  return groups;
}