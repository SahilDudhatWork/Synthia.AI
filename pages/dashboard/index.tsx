import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import ProtectedRoute from "../../components/ProtectedRoute";
import AIModel from "../../components/AIModels";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
import { useAppContext } from "../../lib/AppContext";

function Dashboard() {
  const { setBackgroundColor } = useAppContext();
  const [user, setUser] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [AIModels, setAIModels] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayNameText, setDisplayNameText] = useState<string | null>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const d = useTranslations("dashboard");
  const a = useTranslations("AIModels");

  // Get workspaceId from URL query parameter
  const queryWorkspaceId = router.query?.workspaceId as string | undefined;

  // Palette aligned with `components/Sidebar.tsx`
  const lightColors = [
    { bg: "#E9D5FF", text: "#9333EA" }, // Purple
    { bg: "#FEF08A", text: "#CA8A04" }, // Yellow
    { bg: "#BAE6FD", text: "#0284C7" }, // Blue
    { bg: "#BBF7D0", text: "#16A34A" }, // Green
    { bg: "#FBCFE8", text: "#DB2777" }, // Pink
  ];

  // Determine active theme based on active workspace position
  const activeIndex = workspaces.findIndex((ws) => ws.id === activeWorkspaceId);
  const theme = lightColors[(activeIndex === -1 ? 0 : activeIndex) % lightColors.length];

  // Keep global background white (only top gradient is themed)
  useEffect(() => {
    setBackgroundColor("#ffffff");
  }, [setBackgroundColor]);

  // Fetch user and workspaces data
  useEffect(() => {
    const fetchUserAndWorkspaces = async () => {
      setIsInitialLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return router.push("/auth/login");
        setUser(user);

        try {
          const { data: userData } = await supabase
            .from("users")
            .select("avatar_url, name")
            .eq("id", user.id)
            .single();
          if (userData) {
            setProfileImage(userData.avatar_url || null);
            if (userData.name) setDisplayNameText(userData.name);
          }
        } catch (e) { }

        const { data } = await supabase
          .from("workspaces")
          .select("name, id, current_step, onboarding_complete")
          .eq("user_id", user.id);

        if (data && data.length > 0) {
          setWorkspaces(data);

          // Set active workspace: use URL parameter if available, otherwise use first workspace
          const workspaceId = queryWorkspaceId || data[0]?.id;
          setActiveWorkspaceId(workspaceId);
        } else {
          router.push("/workspace/step1");
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchUserAndWorkspaces();
  }, [router, queryWorkspaceId]);

  // Fetch AI models when activeWorkspaceId changes
  useEffect(() => {
    const fetchAIModels = async () => {
      if (!activeWorkspaceId) return;

      try {
        const { data: aiModels, error: aiError } = await supabase
          .from("ai_models")
          .select("*")
          .eq("is_active", true)
          .or(`workspace_id.eq.${activeWorkspaceId},workspace_id.is.null`);

        if (aiError) {
          console.error("Error fetching AI models:", aiError);
          setError("Failed to load AI models.");
        } else {
          setAIModels(aiModels || []);
        }
      } catch (err) {
        console.error("Error fetching AI models:", err);
        setError("Failed to load AI models.");
      }
    };

    fetchAIModels();
  }, [activeWorkspaceId]); // This will run every time activeWorkspaceId changes

  // Handle URL workspaceId changes
  useEffect(() => {
    if (queryWorkspaceId && queryWorkspaceId !== activeWorkspaceId) {
      setActiveWorkspaceId(queryWorkspaceId);
    }
  }, [queryWorkspaceId, activeWorkspaceId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        // Remove showDropdown related code since it's not used anymore
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddClick = () => {
    router.push({
      pathname: '/createModel/step1',
      query: { workspaceId: activeWorkspaceId }
    });
  };

  const displayName = displayNameText || user?.user_metadata?.name || "User";
  const getInitial = () => {
    if (displayName) return displayName[0].toUpperCase();
    return "U";
  };
  // const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const greetingEmoji = hour < 12 ? "☀️" : hour < 18 ? "🌤️" : "🌙";
  const activeWorkspaceName = workspaces.find((ws) => ws.id === activeWorkspaceId)?.name || "";

  return (
    <>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 h-80 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                `radial-gradient(88.55% 105.05% at 50.04% -5.05%, ${theme.bg} 0%, rgba(237,233,254,0) 100%)`,
            }}
          ></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] bg-[length:128px_128px] bg-repeat opacity-25 mix-blend-overlay"></div>
        </div>
        {/* Bottom subtle gradient */}
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                `radial-gradient(88.55% 105.05% at 50.04% 105.05%, ${theme.bg} 0%, rgba(237,233,254,0) 100%)`,
              opacity: 0.6,
            }}
          ></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] bg-[length:128px_128px] bg-repeat opacity-20 mix-blend-overlay"></div>
        </div>
        <div
          className="flex h-full w-full flex-1 flex-col items-center justify-center rounded-lg"
          ref={contentRef}
        >
          {isInitialLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingSpinner size="lg" color="primary" />
            </div>
          ) : (
            <div className="relative w-full max-w-7xl mx-auto items-center gap-12 px-4 py-5 md:px-16 md:py-14 flex flex-col">
              <div className="w-full self-stretch flex items-center justify-center gap-6 md:gap-8">
                <div className="flex text-center items-center gap-4 md:gap-5 min-w-0">
                  <div className="flex min-w-0 flex-col items-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {activeWorkspaceName && (
                        <span
                          className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide text-gray-700 bg-white/70"
                          style={{ borderColor: theme.text }}
                        >
                          Workspace: {activeWorkspaceName}
                        </span>
                      )}
                    </div>
                    <div>
                      <h1
                        className="mt-2 text-2xl sm:text-4xl font-extrabold tracking-tight text-center truncate"
                        style={{ color: theme.text }}
                        title={`${greeting}, ${displayName}`}
                      >
                        <span className="mr-2 text-2xl sm:text-4xl font-bold" aria-hidden>
                          {greetingEmoji}
                        </span>
                        {greeting}, {displayName}
                      </h1>
                    </div>
                    <p className="mt-2 text-sm sm:text-base text-gray-600 leading-6 max-w-2xl text-center">
                      Find your perfect match, one conversation at a time.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="text-center text-sm text-red-400">{error}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-16 w-90% !gap-y-7 mt-8">
                {AIModels.map((model, index) => (
                  <AIModel
                    key={model.id}
                    member={model}
                    workspaceId={activeWorkspaceId!}
                  />
                ))}
                {/* Add Model Button */}
                <AIModel
                  workspaceId={activeWorkspaceId}
                  isAddModel={true}
                  onAddClick={handleAddClick}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default ProtectedRoute(Dashboard);

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default,
    },
  };
}