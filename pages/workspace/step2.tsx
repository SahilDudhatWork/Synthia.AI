import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { getWorkspace, saveStepData } from '../../lib/workspace';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { GetStaticPropsContext } from 'next';
import StepBar from '../../components/StepBar';

export default function WorkspaceStep2() {
  const router = useRouter();
  const [workspaceId, setWorkspaceId] = useState('');
  const [preferredCommunication, setPreferredCommunication] = useState<string[]>([]);
  const [privacyLevel, setPrivacyLevel] = useState('');
  const [memoryEnabled, setMemoryEnabled] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useTranslations('workspace-step2');
  const w = useTranslations('workspace');

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return router.push('/auth/login');

      const existingWorkspaceId = router.query.workspaceId as string;
      let workspace;

      if (existingWorkspaceId) {
        setWorkspaceId(existingWorkspaceId);
        workspace = await getWorkspace({ workspaceId: existingWorkspaceId });
      } else {
        workspace = await getWorkspace({ userId: user.id });
        if (workspace?.id) setWorkspaceId(workspace.id);
      }

      if (workspace) {
        setPreferredCommunication(workspace.preferred_communication || []);
        setPrivacyLevel(workspace.privacy_level || '');
        setMemoryEnabled(workspace.memory_enabled ?? null);
      }
    });
  }, [router.query]);

  const toggleCommunication = (method: string) => {
    setPreferredCommunication(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
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
          preferred_communication: preferredCommunication,
          privacy_level: privacyLevel,
          memory_enabled: memoryEnabled,
        },
        3
      );

      router.push(`/workspace/step3?workspaceId=${workspaceId}`);
    } catch (error) {
      console.error('Error saving step data:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const communicationOptions = ['chat', 'voice', 'video'];
  const privacyOptions = ['high', 'medium', 'low'];

  return (
    <div className="min-h-screen flex flex-col text-white px-4 relative onboarding">
      {/* Background image */}
      <Image
        src="/onboardingBGNew.jpg"
        alt="Workspace Background"
        fill
        className="absolute top-0 left-0 object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.9 }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute top-0 left-0 w-full h-full backdrop-blur-xl bg-black/20"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 10%, rgba(0, 0, 0, 0.5) 30%, rgba(128,128,128,1) 100%)',
          zIndex: 1,
        }}
      />

      {/* Step Bar */}
      <StepBar
        progress={40}
        stepsLeft={3}
        onBack={() =>
          router.push(
            workspaceId
              ? `/workspace/step1?workspaceId=${workspaceId}`
              : '/workspace/step1'
          )
        }
      />

      <div className="flex flex-col items-center justify-center flex-grow z-10">
        <h1 className="text-4xl font-semibold mb-2">{t('titleh1')}</h1>
        <p className="text-gray-400 mb-6">{t('subheading')}</p>

        {/* Glass model container */}
        <div className="w-full max-w-md rounded-xl bg-white/10 border border-white/20 backdrop-blur-lg shadow-2xl shadow-black/30 p-6">
          <form className="w-full space-y-6" onSubmit={handleSubmit}>
            {/* Preferred Communication */}
            <div>
              <label className="text-white-300 font-semibold mb-2 block">{t('communicationLabel')}</label>
              <div className="flex flex-wrap gap-2">
                {communicationOptions.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleCommunication(method)}
                    className={`px-4 py-2 rounded-[15px] capitalize ${preferredCommunication.includes(method)
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      } transition-colors duration-200`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Level */}
            <div>
              <label className="text-white-300 font-semibold mb-2 block">{t('privacyLabel')}</label>
              <div className="flex flex-wrap gap-2">
                {privacyOptions.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPrivacyLevel(level)}
                    className={`px-4 py-2 rounded-[15px] capitalize ${privacyLevel === level
                        ? 'bg-white text-black font-semibold'
                        : 'bg-white/10 text-white hover:bg-white/20'
                      } transition-colors duration-200`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Memory Enabled */}
            <div>
              <label className="text-white-300 font-semibold mb-2 block">{t('memoryLabel')}</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setMemoryEnabled(true)}
                  className={`px-6 py-2 rounded-[15px] ${memoryEnabled === true
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/10'
                    }`}
                >
                  {t('yes')}
                </button>
                <button
                  type="button"
                  onClick={() => setMemoryEnabled(false)}
                  className={`px-6 py-2 rounded-[15px] ${memoryEnabled === false
                      ? 'bg-white text-black font-semibold'
                      : 'bg-white/10'
                    }`}
                >
                  {t('no')}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div className="mt-10 flex justify-between w-full">
              <div className="mt-2 w-full">
                <button
                  type="submit"
                  disabled={!preferredCommunication.length || !privacyLevel || memoryEnabled === null || isSubmitting}
                  className={`w-full bg-blue-600 px-4 py-2 rounded-[18px] font-semibold transition ${!preferredCommunication.length || !privacyLevel || memoryEnabled === null || isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-blue-700'
                    }`}
                >
                  {isSubmitting ? w('loading') : w('btnContinue')}
                </button>
              </div>
            </div>
          </form>
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