import { useRouter } from 'next/router';
import Image from 'next/image';

export default function NewWorkspace() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/workspace/step1');
  };

  const handleDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white px-4 relative">
      {/* Background image */}
      <Image
        src="/onboardingBG.jpg"
        alt="Assistant"
        fill
        sizes="100vw"
        className="absolute top-0 left-0 object-cover pointer-events-none"
        style={{ zIndex: 0, opacity: 0.9 }}
      />

      {/* Gradient overlay */}
      <div className="absolute top-0 left-0 w-full h-full"
        style={{
          background: "linear-gradient(to top, rgba(20,0,10,0.92) 0%, rgba(0,0,0,0.55) 30%, rgba(255,64,112,0.35) 100%)",
          zIndex: 1,
        }}
      />

      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg space-y-8 text-center z-10 px-2 sm:px-0">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Create a new workspace</h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-300">
          {"Let's set up your new workspace together!"}
        </p>

        <div className="pt-8 space-y-3 sm:space-y-4">
          <button
            onClick={handleStart}
            className="w-full max-w-xs bg-rose-600 hover:bg-rose-700 px-6 py-3 rounded-md font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-400/50"
          >
            {"To start"}
          </button>

          <button
            onClick={handleDashboard}
            className="w-full max-w-xs bg-white/10 hover:bg-rose-400/10 px-6 py-3 rounded-md font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-rose-300/30"
          >
            {"Return to Dashboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
