import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCreateAIModel } from '../../lib/useCreateAIModel';

const responseStyles = [
  { id: 'flirty', label: 'Flirty', description: 'Playful, teasing, and romantic', emoji: '😉' },
  { id: 'caring', label: 'Caring', description: 'Compassionate and empathetic', emoji: '🤗' },
  { id: 'casual', label: 'Casual', description: 'Relaxed and conversational', emoji: '😊' },
  { id: 'detailed', label: 'Detailed', description: 'Expressive and thoughtful replies', emoji: '💭' },
  { id: 'humorous', label: 'Humorous', description: 'Funny, witty, and lighthearted', emoji: '😂' },
  { id: 'mysterious', label: 'Mysterious', description: 'Intriguing and secretive with hints of depth', emoji: '🕵️' },
  { id: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic, positive, and engaging', emoji: '🎉' }
];

export default function CreateModelStep5() {
  const [selectedStyle, setSelectedStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { onboardingData, updateOnboardingData } = useCreateAIModel();
  const { workspaceId } = router.query;

  // Initialize with saved data
  useEffect(() => {
    if (onboardingData.modelResponseStyle) {
      setSelectedStyle(onboardingData.modelResponseStyle);
    }
  }, [onboardingData.modelResponseStyle]);

  const handleSelect = (styleId: string) => {
    setSelectedStyle(styleId);
  };

  const handleContinue = async () => {
    if (!selectedStyle) return;

    setLoading(true);
    try {
      await updateOnboardingData({
        modelResponseStyle: selectedStyle,
      });
      router.push({
        pathname: '/createModel/step6',
        query: { workspaceId }
      });
    } catch (error) {
      console.error('Error saving response style:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Response Style - Synthia.AI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8">
          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white text-sm">Step 5 of 6</div>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '83%' }}></div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Response Style
              </h1>
              <p className="text-gray-300">
                How should your AI communicate with you?
              </p>
            </div>

            {/* Response Style Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {responseStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => handleSelect(style.id)}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 text-center
                    ${selectedStyle === style.id
                      ? 'bg-gradient-to-br from-green-500 to-blue-500 border-green-400 text-white scale-105 shadow-lg'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="text-3xl mb-3">{style.emoji}</div>
                  <div className="font-semibold text-lg mb-2">
                    {style.label}
                  </div>
                  <div className="text-sm text-gray-200 opacity-90">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-xl font-semibold border border-white/10 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedStyle || loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Continue to Review'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}