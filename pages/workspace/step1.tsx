import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { getWorkspace, saveStepData } from "../../lib/workspace";
import Image from "next/image";
import StepBar from "../../components/StepBar";

export default function WorkspaceStep1() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push("/auth/login");
      setUserId(user.id);

      const existingWorkspaceId = router.query.workspaceId as string;

      if (existingWorkspaceId) {
        const workspace = await getWorkspace({
          workspaceId: existingWorkspaceId,
        });

        if (workspace) {
          setWorkspaceId(workspace.id);
          setName(workspace.name || "");
        }
      }
    });
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!name.trim()) {
      setError("Workspace name is required.");
      setIsSubmitting(false);
      return;
    }

    const trimmedName = name.trim();
    let newWorkspaceId = workspaceId;

    try {
      if (!workspaceId) {
        const { data: newWorkspace, error: createError } = await supabase
          .from("workspaces")
          .insert([
            {
              user_id: userId,
              name: trimmedName,
              current_step: 1,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating workspace:", createError);
          setError("Failed to create workspace. Please try again.");
          return;
        }

        newWorkspaceId = newWorkspace.id;
        setWorkspaceId(newWorkspaceId);
      } else {
        await saveStepData(
          { workspaceId },
          { name: trimmedName },
          2
        );
      }

      router.push(`/workspace/step2?workspaceId=${newWorkspaceId}`);
    } catch (err) {
      console.error("Error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col text-white px-4 onboarding">
      {/* Background image */}
      <Image
        src="/onboardingBG.jpg"
        alt="Workspace Background"
        fill
        sizes="100vw"
        className="absolute top-0 left-0 object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.9 }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full backdrop-blur-xl bg-black/20"
        style={{
          background:
            "linear-gradient(to top, rgba(20,0,10,0.92) 0%, rgba(0,0,0,0.55) 30%, rgba(255,64,112,0.35) 100%)",
          zIndex: 1,
        }}
      />

      {/* Step Bar */}
      <StepBar progress={10} stepsLeft={4} />

      {/* Main content */}
      <div
        className="relative flex flex-col items-center justify-center flex-grow w-full"
        style={{ zIndex: 10 }}
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl mb-6 text-center mx-auto font-semibold">
          {"What would you like to call your workspace?"}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center w-full max-w-sm"
        >
          {/* Glass model */}
          <div className="relative w-full rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-4">
            <input
              id="workspaceName"
              name="workspaceName"
              type="text"
              placeholder=" "
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="peer block w-full appearance-none bg-transparent px-4 pt-7 pb-2 rounded-lg text-white placeholder-transparent focus:outline-none"
            />
            <label
              htmlFor="workspaceName"
              className="absolute left-4 top-2 text-white/60 text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-white/70 peer-focus:top-2 peer-focus:text-sm peer-focus:text-white/70"
            >
              {"Enter your workspace name"}
            </label>
            {error && (
              <div className="text-red-500 mt-1 text-sm text-center">
                {error}
              </div>
            )}
          </div>

          <div className="mt-10 flex justify-between w-full max-w-md">
            <div className="mt-10 w-full">
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className={`w-full bg-rose-600 px-4 py-2 rounded-[18px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-400/50 ${
                  isSubmitting || !name.trim()
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-rose-700"
                }`}
              >
                {isSubmitting ? "Loading..." : "Continue"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}