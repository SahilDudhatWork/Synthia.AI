import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { getWorkspace, saveStepData } from '../../lib/workspace';
import StepBar from '../../components/StepBar';
import Image from 'next/image';

export default function WorkspaceStep4() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState('');
  const [personalityType, setPersonalityType] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/auth/login');

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
        setPersonalityType(workspace.personality_type || '');
        setAge(workspace.age?.toString() || '');
        setGender(workspace.gender || '');
      }
    });
  }, [router.query]);

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
          personality_type: personalityType,
          age: age ? parseInt(age) : null,
          gender: gender,
        },
        5 // Mark as complete
      );

      // Redirect to completion page
      router.push(`/workspace/step5?workspaceId=${workspaceId}`);
    } catch (error) {
      console.error('Error saving step data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const personalityOptions = [
    'Introvert',
    'Extrovert',
    'Ambivert',
    'Analytical',
    'Creative',
  ];

  const genderOptions = [
    'Male',
    'Female',
    'Non-binary',
    'Prefer not to say',
  ];

  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];

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
        progress={100}
        stepsLeft={0}
        onBack={() =>
          router.push(
            workspaceId
              ? `/workspace/step3?workspaceId=${workspaceId}`
              : '/workspace/step3'
          )
        }
      />

      {/* Gradient overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full backdrop-blur-xl bg-black/20"
        style={{
          background: "linear-gradient(to top, rgba(20,0,10,0.92) 0%, rgba(0,0,0,0.55) 30%, rgba(255,64,112,0.35) 100%)",
          zIndex: 1,
        }}
      />

      <div className="z-10 h-screen text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2">{'Personality & Profile'}</h1>
          <p className="text-sm sm:text-base md:text-lg text-white/65 mb-6">{'Complete your profile setup'}</p>

          {/* Glass model container */}
          <div className="w-full max-w-md rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-6">
            <form onSubmit={handleSubmit} className="w-full space-y-6">
              <div className="space-y-8">
                {/* Personality Type */}
                <div>
                  <label className="text-white-300 font-semibold mb-2 block">
                    {"What's your personality type? *"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {personalityOptions.map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setPersonalityType(type)}
                        className={`px-4 py-2 rounded-[15px] ${
                          personalityType === type
                            ? 'bg-rose-500 text-white font-semibold'
                            : 'bg-white/10 text-white hover:bg-rose-400/20'
                        } transition-colors duration-200`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age Group */}
                <div>
                  <label className="text-white-300 font-semibold mb-2 block">
                    {"What's your age group? *"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ageGroups.map((ageGroup) => (
                      <button
                        type="button"
                        key={ageGroup}
                        onClick={() => setAge(ageGroup)}
                        className={`px-4 py-2 rounded-[15px] ${
                          age === ageGroup
                            ? 'bg-rose-500 text-white font-semibold'
                            : 'bg-white/10 text-white hover:bg-rose-400/20'
                        } transition-colors duration-200`}
                      >
                        {ageGroup}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-white-300 font-semibold mb-2 block">
                    {"What's your gender? *"}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {genderOptions.map((genderOption) => (
                      <button
                        type="button"
                        key={genderOption}
                        onClick={() => setGender(genderOption)}
                        className={`px-4 py-2 rounded-[15px] ${
                          gender === genderOption
                            ? 'bg-rose-500 text-white font-semibold'
                            : 'bg-white/10 text-white hover:bg-rose-400/20'
                        } transition-colors duration-200`}
                      >
                        {genderOption}
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
                    disabled={isSubmitting || !personalityType || !age || !gender}
                    className={`w-full bg-rose-600 px-4 py-2 rounded-[18px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-400/50 ${
                      isSubmitting || !personalityType || !age || !gender
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-rose-700'
                    }`}
                  >
                    {isSubmitting ? 'Loading...' : 'Complete Setup'}
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