import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import AIPromptPanel from "../../components/PromptPanel/AIPromptPanel";
import LoadingSpinner from "../../components/LoadingSpinner";
import HistoryPage from "../../components/PromptPanel/HistoryPage";
import { GetServerSidePropsContext } from "next";
import { useAppContext } from "../../lib/AppContext";

interface AIModel {
    id: string;
    workspace_id: string;
    name: string;
    role: string;
    personality: string;
    predefined?: boolean;
    topics?: string[];
    custom_triggers?: string[];
    created_at?: string;
    updated_at?: string;
    is_active?: boolean;
    config?: Record<string, any>;
}

const AIPromptPage = () => {
    const router = useRouter();
    const { setBackgroundColor } = useAppContext();
    const { id, workspaceId, chatId, view, initialMessage } = router.query;

    const [user, setUser] = useState<any>(null);
    const [AIModel, setAIModel] = useState<AIModel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => setBackgroundColor("#ffffff"), [setBackgroundColor]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            try {
                // Get authenticated user
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) {
                    router.push("/auth/login");
                    return;
                }
                setUser(user);

                if (!workspaceId) {
                    setError("Workspace ID is required");
                    setLoading(false);
                    return;
                }

                if (!id) {
                    setError("AI Model ID is required");
                    setLoading(false);
                    return;
                }

                // Verify workspace access
                const { data: workspace, error: workspaceError } = await supabase
                    .from("workspaces")
                    .select("id, user_id")
                    .eq("id", workspaceId)
                    .single();

                if (workspaceError || !workspace) {
                    setError("Workspace not found");
                    setLoading(false);
                    return;
                }
                if (workspace.user_id !== user.id) {
                    setError("Access denied");
                    setLoading(false);
                    return;
                }

                // Load AI model by ID
                const { data: aiModels, error: aiModelsError } = await supabase
                    .from("ai_models")
                    .select("*")
                    .eq("id", id)
                    .eq("is_active", true)
                    .or(`workspace_id.eq.${workspaceId},workspace_id.is.null`);

                if (aiModelsError || !aiModels || aiModels.length === 0) {
                    setError("AI model not found");
                    setLoading(false);
                    return;
                }

                // Prefer user-created model if exists, otherwise fallback to static one
                const aiModel = aiModels.find(m => m.workspace_id === workspaceId)
                    || aiModels.find(m => m.workspace_id === null);


                setAIModel(aiModel);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Failed to load AI model");
            } finally {
                setLoading(false);
            }
        };

        if (id && workspaceId) loadData();
    }, [id, workspaceId, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
                <p className="ml-4 text-gray-600">Loading AI model...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!user || !AIModel || !workspaceId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    // Render components using only your table fields
    if (view === "history") {
        return (
            <HistoryPage
                AIModel={AIModel}
                user={user}
                workspaceId={workspaceId as string}
                onBack={() => router.push({ pathname: "/dashboard", query: { workspaceId } })}
                onChatSelect={(chatId: string) => router.push({
                    pathname: `/ai-model/${AIModel.id}`,
                    query: { workspaceId, chatId }
                })}
            />
        );
    }

    return (
        <AIPromptPanel
            AIModel={AIModel}
            user={user}
            workspaceId={workspaceId as string}
            initialView={view === "history" ? "history" : chatId ? "chat" : "default"}
            initialChatId={chatId as string | undefined}
            initialMessage={initialMessage as string | undefined}
        />
    );
};

export default AIPromptPage;

// Server-side props for translations
export async function getServerSideProps({ locale }: GetServerSidePropsContext) {
    return {
        props: {
            messages: (await import(`../../messages/${locale}.json`)).default,
        },
    };
}