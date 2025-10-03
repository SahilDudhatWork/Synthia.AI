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
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const d = useTranslations("dashboard");
  const a = useTranslations("AIModels");

  // Get workspaceId from URL query parameter
  const queryWorkspaceId = router.query?.workspaceId as string | undefined;

  useEffect(() => {
    setBackgroundColor("#fff7d9");
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

  const displayName = user?.user_metadata?.name || user?.email || "User";
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId);

  return (
    <>
      <div className="relative w-full h-full">
        <div className="absolute inset-0 h-80">
          <div className="absolute inset-0 bg-[radial-gradient(88.55%_105.05%_at_50.04%_-5.05%,_#FFF3C6_0%,_rgba(255,243,198,0)_100%)]"></div>
          <div className="absolute inset-0 bg-[url('/noise.png')] bg-[length:128px_128px] bg-repeat opacity-25 mix-blend-overlay"></div>
        </div>
        <div
          className="flex h-full w-full flex-1 flex-col items-center justify-center bg-[#F6F9FF] rounded-lg"
          ref={contentRef}
        >
          {isInitialLoading ? (
            <div className="flex h-full w-full items-center justify-center">
              <LoadingSpinner size="lg" color="primary" />
            </div>
          ) : (
            <div className="relative w-full max-w-7xl mx-auto items-center gap-12 px-4 py-5 md:px-16 md:py-14 flex flex-col">
              <h1 className="text-3xl sm:text-4xl text-[#713f12] text-center">
                <span className="font-bold">
                  Hii roys 
                  <br />
                  {activeWorkspace?.name || displayName}'s
                </span>{" "}
                <span className="italic font-cursive font-bold">
                  {d("workspace")}
                </span>
              </h1>
              {/* <MessageInputForm
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                loading={loading}
              /> */}
              {error && (
                <p className="text-center text-sm text-red-400">{error}</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-16 w-90% !gap-y-7">
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