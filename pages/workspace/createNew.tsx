import { useRouter } from 'next/router';
import Image from 'next/image';


import {useTranslations} from 'next-intl';
import type {GetStaticPropsContext} from 'next';

export default function NewWorkspace() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/workspace/step1');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  // translations
  const t = useTranslations('workspace-createnew');


  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white px-4 relative">
      {/* Background image */}
      <Image
        src="/onboardingBG.jpg"
        alt="Assistant"
        fill
        className="absolute top-0 left-0 object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.9 }}
      />

      {/* Gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-full"
        style={{
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0, 0, 0, 0.5) 30%, rgba(128,128,128,1) 100%)",
          zIndex: 1,
        }}
      />

      <div className="w-full max-w-md space-y-8 text-center z-10">
        <h1 className="text-4xl font-bold">{t('createnewtitleh1')}</h1>

        <p className="text-xl text-gray-300">
          {t('subheading')}
        </p>

        <div className="pt-8 space-y-4">
          <button
            onClick={handleStart}
            className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md font-semibold text-lg transition-colors"
          >
            {t('tostartbtn')}
          </button>

          <button
            onClick={handleDashboard}
            className="w-full max-w-xs bg-white/10 hover:bg-white/15 px-6 py-3 rounded-md font-semibold text-lg transition-colors"
          >
            {t('returntodashboard')}
          </button>
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
