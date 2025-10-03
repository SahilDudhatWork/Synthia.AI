import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { markOnboardingComplete } from '../../lib/workspace';
import StepBar from '../../components/StepBar';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { GetStaticPropsContext } from 'next';
import Image from 'next/image';

export default function WorkspaceComplete() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');

  const t = useTranslations('workspace-step5');
  const w = useTranslations('workspace');

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
        setError(t('error.wentwrong'));
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
        <p className="text-lg font-medium animate-pulse">{t('finalizing')}</p>
      </div>
    );
  }

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
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0, 0, 0, 0.5) 30%, rgba(128,128,128,1) 100%)",
          zIndex: 1,
        }}
      />

      <div className="z-10 h-screen text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          <h1 className="text-5xl font-semibold mb-6 text-center">{t('titleh1')}</h1>

          {/* Glass model container */}
          <div className="rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-6 text-lg space-y-6">
            <p className="text-center">{t('congratulations')}</p>
            <p>{t('setupComplete')}</p>
            <p>{t('readyToStart')}</p>
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
              className="block text-center bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-[15px] font-semibold text-lg transition-colors"
            >
              {!dashboardLink ? w('loading') : t('gotoDashboard')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: GetStaticPropsContext) {
  return {
    props: {
      messages: (await import(`../../messages/${locale}.json`)).default
    }
  };
}