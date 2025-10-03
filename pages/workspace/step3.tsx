import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { getWorkspace, saveStepData } from "../../lib/workspace";
import StepBar from "../../components/StepBar";
import { useTranslations } from "next-intl";
import type { GetStaticPropsContext } from "next";
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

  const t = useTranslations("workspace-step3");
  const w = useTranslations("workspace");

  const interestOptions = [
    t("interests.music"),
    t("interests.movies"),
    t("interests.fitness"),
    t("interests.technology"),
    t("interests.art"),
    t("interests.travel"),
    t("interests.food"),
    t("interests.sports")
  ];

  const goalOptions = [
    t("goals.companionship"),
    t("goals.learning"),
    t("goals.stressRelief"),
    t("goals.productivity"),
    t("goals.entertainment"),
    t("goals.creativity")
  ];

  return (
    <div className="min-h-screen flex flex-col text-white px-4 relative">
      {/* Background image */}
      <Image
        src="/onboardingBGNew.jpg"
        alt="Workspace Background"
        fill
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
            "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0, 0, 0, 0.5) 30%, rgba(128,128,128,1) 100%)",
          zIndex: 1,
        }}
      />

      <div className="z-10 h-screen text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-4xl font-semibold mb-2">{t("titleh1")}</h1>
          <p className="text-white/65 mb-6">{t("subheading")}</p>

          {/* Glass model container */}
          <div className="w-full max-w-md rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-6">
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="space-y-8">
                {/* Interests */}
                <div>
                  <label className="text-white-300 font-semibold mb-2 block">
                    {t("interestsLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {interestOptions.map((interest) => (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-[15px] ${
                          interests.includes(interest)
                            ? "bg-white text-black font-semibold"
                            : "bg-white/10 text-white hover:bg-white/20"
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
                    {t("goalsLabel")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {goalOptions.map((goal) => (
                      <button
                        type="button"
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        className={`px-4 py-2 rounded-[15px] ${
                          goals.includes(goal)
                            ? "bg-white text-black font-semibold"
                            : "bg-white/10 text-white hover:bg-white/20"
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
                    className={`w-full bg-blue-600 px-4 py-2 rounded-[18px] font-semibold transition ${
                      isSubmitting || interests.length === 0 || goals.length === 0
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? w("loading") : w("btnContinue")}
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

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default,
    },
  };
}