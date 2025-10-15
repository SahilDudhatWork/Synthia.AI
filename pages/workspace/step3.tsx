import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { getWorkspace, saveStepData } from "../../lib/workspace";
import StepBar from "../../components/StepBar";
import Image from "next/image";

export default function WorkspaceStep3() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push("/auth/login");

      const idFromQuery = router.query.workspaceId as string;
      let workspace;

      if (idFromQuery) {
        setWorkspaceId(idFromQuery);
        workspace = await getWorkspace({ workspaceId: idFromQuery });
      } else {
        workspace = await getWorkspace({ userId: user.id });
        if (workspace?.id) setWorkspaceId(workspace.id);
      }

      if (workspace) {
        setInterests(workspace.interests || []);
        setGoals(workspace.goals || []);
      }
    });
  }, [router.query]);

  const toggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!workspaceId) {
      setIsSubmitting(false);
      return;
    }

    try {
      await saveStepData(
        { workspaceId },
        {
          interests: interests,
          goals: goals,
        },
        4
      );

      router.push(`/workspace/step4?workspaceId=${workspaceId}`);
    } catch (error) {
      console.error("Error saving step data:", error);
    } finally {
      setIsSubmitting(false);
    }
  };



  const interestOptions = [
    "Music",
    "Movies",
    "Fitness",
    "Technology",
    "Art",
    "Travel",
    "Food",
    "Sports",
  ];

  const goalOptions = [
    "Companionship",
    "Learning",
    "Stress Relief",
    "Productivity",
    "Entertainment",
    "Creativity",
  ];

  return (
    <div className="min-h-screen flex flex-col text-white px-4 relative">
      {/* Background image */}
      <Image
        src="/onboardingBG.jpg"
        alt="Workspace Background"
        fill
        sizes="100vw"
        className="absolute top-0 left-0 object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.9 }}
      />

      {/* Step Bar */}
      <StepBar
        progress={70}
        stepsLeft={1}
        onBack={() =>
          router.push(
            workspaceId
              ? `/workspace/step2?workspaceId=${workspaceId}`
              : "/workspace/step2"
          )
        }
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

      <div className="z-10 h-screen text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">{"Interests & Goals"}</h1>
          <p className="text-sm sm:text-base md:text-lg text-white/65 mb-6">{"Tell us about your preferences"}</p>

          {/* Glass model container */}
          <div className="w-full max-w-md rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-6">
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="space-y-8">
                {/* Interests */}
                <div>
                  <label className="text-white-300 font-semibold mb-2 block">
                    {"What are your main interests? *"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-[15px] ${interests.includes(interest)
                            ? "bg-rose-500 text-white font-semibold"
                            : "bg-white/10 text-white hover:bg-rose-400/20"
                          } transition-colors duration-200`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <label className="text-white-300 font-semibold mb-2 block">
                    {"What are your primary goals? *"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-4 py-2 rounded-[15px] ${goals.includes(goal)
                            ? "bg-rose-500 text-white font-semibold"
                            : "bg-white/10 text-white hover:bg-rose-400/20"
                          } transition-colors duration-200`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-10 flex justify-between w-full">
                <div className="mt-2 w-full">
                  <button
                    type="submit"
                    disabled={isSubmitting || interests.length === 0 || goals.length === 0}
                    className={`w-full bg-rose-600 px-4 py-2 rounded-[18px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-400/50 ${isSubmitting || interests.length === 0 || goals.length === 0
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
      </div>
    </div>
  );
}