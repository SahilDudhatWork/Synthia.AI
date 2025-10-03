import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCreateAIModel } from '../../lib/useCreateAIModel';

const personalityTraits = [
  { id: 'romantic', label: 'Romantic', description: 'Affectionate and loving', emoji: '💖' },
  { id: 'playful', label: 'Playful', description: 'Fun, teasing, and full of energy', emoji: '😄' },
  { id: 'caring', label: 'Caring', description: 'Compassionate and nurturing', emoji: '🤗' },
  { id: 'mysterious', label: 'Mysterious', description: 'Intriguing and secretive', emoji: '🕵️' },
  { id: 'adventurous', label: 'Adventurous', description: 'Excited about exploring and trying new things', emoji: '🌍' },
  { id: 'supportive', label: 'Supportive', description: 'Always there to listen and encourage', emoji: '💪' },
  { id: 'humorous', label: 'Humorous', description: 'Funny and entertaining, keeps the mood light', emoji: '😂' },
  { id: 'confident', label: 'Confident', description: 'Bold and self-assured in conversations', emoji: '🔥' }
];

export default function CreateModelStep3() {
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { onboardingData, updateOnboardingData } = useCreateAIModel();
  const { workspaceId } = router.query;

  // Initialize with saved data
  useEffect(() => {
    if (onboardingData.modelPersonality) {
      setSelectedTraits(onboardingData.modelPersonality);
    }
  }, [onboardingData.modelPersonality]);

  const toggleTrait = (traitId: string) => {
    setSelectedTraits(prev => {
      if (prev.includes(traitId)) {
        return prev.filter(id => id !== traitId);
      } else if (prev.length < 3) {
        return [...prev, traitId];
      }
      return prev;
    });
  };

  const handleContinue = async () => {
    if (selectedTraits.length === 0) return;

    setLoading(true);
    try {
      await updateOnboardingData({
        modelPersonality: selectedTraits,
      });
      router.push({
        pathname: '/createModel/step4',
        query: { workspaceId }
      });
    } catch (error) {
      console.error('Error saving personality traits:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Personality Traits - Synthia.AI</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-8">
          {/* Progress Bar */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-white text-sm">Step 3 of 6</div>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                Personality Traits
              </h1>
              <p className="text-gray-300 mb-4">
                Choose up to 3 core personality traits that define your AI
              </p>
              <div className="flex items-center justify-center space-x-4">
                <div className="text-purple-300 text-sm">
                  Selected: <span className="font-bold">{selectedTraits.length}/3</span>
                </div>
                {selectedTraits.length > 0 && (
                  <div className="text-green-300 text-sm">
                    ✓ Ready to continue
                  </div>
                )}
              </div>
            </div>

            {/* Traits Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {personalityTraits.map((trait) => (
                <button
                  key={trait.id}
                  onClick={() => toggleTrait(trait.id)}
                  disabled={!selectedTraits.includes(trait.id) && selectedTraits.length >= 3}
                  className={`p-6 rounded-xl border-2 transition-all transform hover:scale-105 text-left
                    ${selectedTraits.includes(trait.id)
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 text-white scale-105 shadow-lg'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100`}
                >
                  <div className="text-2xl mb-3">{trait.emoji}</div>
                  <div className="font-semibold text-lg mb-2">
                    {trait.label}
                  </div>
                  <div className="text-sm text-gray-200 opacity-90">
                    {trait.description}
                  </div>
                </button>
              ))}
            </div>

            {/* Selected Traits Preview */}
            {selectedTraits.length > 0 && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <h3 className="text-white font-semibold mb-3">Your AI's Personality:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTraits.map(traitId => {
                    const trait = personalityTraits.find(t => t.id === traitId);
                    return trait ? (
                      <span
                        key={trait.id}
                        className="bg-purple-500/30 text-purple-200 px-3 py-2 rounded-full text-sm border border-purple-500/50 flex items-center"
                      >
                        <span className="mr-2">{trait.emoji}</span>
                        {trait.label}
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
                disabled={loading || selectedTraits.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Continue to Expertise'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}