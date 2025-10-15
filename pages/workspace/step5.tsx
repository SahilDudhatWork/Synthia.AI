import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { markOnboardingComplete } from '../../lib/workspace';
import StepBar from '../../components/StepBar';
import Link from 'next/link';
import Image from 'next/image';

export default function WorkspaceComplete() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  

  useEffect(() => {
    const completeCreateAIModel = async () => {
      try {
        const { workspaceId } = router.query;

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/auth/login');
          return;
        }

        if (workspaceId && typeof workspaceId === 'string') {
          await markOnboardingComplete({ workspaceId });
          setWorkspaceId(workspaceId);
        } else {
          await markOnboardingComplete(user.id);
        }
      } catch (err) {
        console.error('Onboarding completion failed:', err);
        setError('Something went wrong while finalizing your setup.');
      } finally {
        setLoading(false);
      }
    };

    completeCreateAIModel();
  }, [router.query]);

  const dashboardLink = workspaceId
    ? `/dashboard?workspaceId=${workspaceId}`
    : '/dashboard';

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <p className="text-lg font-medium animate-pulse">{"Finalizing your setup..."}</p>
      </div>
    );
  }

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
              ? `/workspace/step4?workspaceId=${workspaceId}`
              : '/workspace/step4'
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
        <div className="w-full max-w-2xl space-y-6 px-2 sm:px-0">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-6 text-center">{"Welcome to Your Workspace!"}</h1>

          {/* Glass model container */}
          <div className="rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-6 text-lg space-y-6">
            <p className="text-center">{"Congratulations! Your workspace setup is complete."}</p>
            <p>{"Your personalized AI companion is now ready to assist you."}</p>
            <p>{"You can start chatting with your AI assistant and explore all the features."}</p>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-center font-semibold">{error}</div>
        )}

        {/* Navigation */}
        <div className="pt-4 flex justify-center w-full">
          <div className="w-full max-w-md">
            <Link
              href={dashboardLink || '#'}
              className="block text-center bg-rose-600 hover:bg-rose-700 px-8 py-3 rounded-[15px] font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/50"
            >
              {!dashboardLink ? 'Loading...' : 'Go to Dashboard'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}