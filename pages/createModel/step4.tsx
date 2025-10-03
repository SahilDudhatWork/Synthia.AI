import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCreateAIModel } from '../../lib/useCreateAIModel';

const expertiseAreas = [
  { id: 'relationships', label: 'Relationships & Dating', emoji: '💑' },
  { id: 'emotions', label: 'Emotional Support', emoji: '💝' },
  { id: 'flirting', label: 'Flirting & Romance', emoji: '😘' },
  { id: 'lifestyle', label: 'Lifestyle & Hobbies', emoji: '🎨' },
  { id: 'travel', label: 'Travel & Adventure', emoji: '✈️' },
  { id: 'fitness', label: 'Health & Fitness', emoji: '💪' },
  { id: 'entertainment', label: 'Movies, Music & Fun', emoji: '🎬' },
  { id: 'self_growth', label: 'Self-Growth & Confidence', emoji: '🌟' }
];

export default function CreateModelStep4() {
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { onboardingData, updateOnboardingData } = useCreateAIModel();
  const { workspaceId } = router.query;

  // Initialize with saved data
  useEffect(() => {
    if (onboardingData.modelExpertise) {
      setSelectedExpertise(onboardingData.modelExpertise);
    }
  }, [onboardingData.modelExpertise]);

  const toggleExpertise = (expertiseId: string) => {
    setSelectedExpertise(prev => {
      if (prev.includes(expertiseId)) {
        return prev.filter(id => id !== expertiseId);
      } else if (prev.length < 4) {
        return [...prev, expertiseId];
      }
      return prev;
    });
  };

  const handleContinue = async () => {
    if (selectedExpertise.length === 0) return;

    setLoading(true);
    try {
      await updateOnboardingData({
        modelExpertise: selectedExpertise,
      });
      router.push({
        pathname: '/createModel/step5',
        query: { workspaceId }
      });
    } catch (error) {
      console.error('Error saving expertise areas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Expertise Areas - Synthia.AI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8">
          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white text-sm">Step 4 of 6</div>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '80%' }}></div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Expertise Areas
              </h1>
              <p className="text-gray-300 mb-4">
                What topics should your AI be knowledgeable about?
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-purple-300 text-sm">
                  Selected: <span className="font-bold">{selectedExpertise.length}/4</span>
                </div>
                {selectedExpertise.length > 0 && (
                  <div className="text-green-300 text-sm">
                    ✓ Ready to continue
                  </div>
                )}
              </div>
            </div>

            {/* Expertise Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {expertiseAreas.map((expertise) => (
                <button
                  key={expertise.id}
                  onClick={() => toggleExpertise(expertise.id)}
                  disabled={!selectedExpertise.includes(expertise.id) && selectedExpertise.length >= 4}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 text-center
                    ${selectedExpertise.includes(expertise.id)
                      ? 'bg-gradient-to-br from-blue-500 to-purple-500 border-blue-400 text-white scale-105 shadow-lg'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100`}
                >
                  <div className="text-3xl mb-3">{expertise.emoji}</div>
                  <div className="font-semibold text-sm leading-tight">
                    {expertise.label}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Expertise Preview */}
            {selectedExpertise.length > 0 && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-semibold mb-3">Your AI's Expertise:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedExpertise.map(expertiseId => {
                    const expertise = expertiseAreas.find(e => e.id === expertiseId);
                    return expertise ? (
                      <span
                        key={expertise.id}
                        className="bg-blue-500/30 text-blue-200 px-3 py-2 rounded-full text-sm border border-blue-500/50 flex items-center"
                      >
                        <span className="mr-2">{expertise.emoji}</span>
                        {expertise.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

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
                disabled={loading || selectedExpertise.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Continue to Response Style'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}