import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCreateAIModel } from '../../lib/useCreateAIModel';

export default function CreateModelStep1() {
  const { onboardingData, updateOnboardingData, loading } = useCreateAIModel();
  const [modelName, setModelName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { workspaceId } = router.query;

  const isContinueDisabled = saving || !modelName.trim();

  // Initialize form with saved data
  useEffect(() => {
    if (onboardingData) {
      setModelName(onboardingData.modelName || '');
    }
  }, [onboardingData]);

  const handleInputChange = (value: string) => {
    setModelName(value);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!modelName.trim()) {
      setError('Please enter model name');
      setSaving(false);
      return;
    }

    try {
      const result = await updateOnboardingData({
        modelName: modelName.trim(),
      });

      if (result.success) {
        router.push({
          pathname: '/createModel/step2',
          query: { workspaceId },
        });
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error: any) {
      console.error('Error saving model data:', error);
      setError(error.message || 'Failed to save data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 font-inter">
      <Head>
        <title>Model Name - Synthia.AI</title>
      </Head>

      <div className="max-w-2xl w-full space-y-8">
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-white text-sm">Step 1 of 6</div>
          <div className="w-32 bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '20%' }}></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Choose a Name
            </h1>
            <p className="text-gray-300">Give your AI companion a unique name</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Model Name */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-150 text-lg text-center"
                placeholder="Enter a unique name for your AI"
                disabled={saving}
                maxLength={50}
                autoFocus
              />
              <div className="text-right text-gray-400 text-xs mt-2">
                {modelName.length}/50 characters
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-gray-400 text-sm">
                Choose a name that reflects your AI companion's personality
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-xl font-semibold border border-white/10 transition-all disabled:opacity-50"
                disabled={saving}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isContinueDisabled}
                className={`flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]
                  ${isContinueDisabled ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
              >
                {saving ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Continue to Role'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}