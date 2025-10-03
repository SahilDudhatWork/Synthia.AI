import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCreateAIModel } from '../../lib/useCreateAIModel';

export default function CreateModelStep2() {
  const { onboardingData, updateOnboardingData, loading } = useCreateAIModel();
  const [selectedRole, setSelectedRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { workspaceId } = router.query;

  const isContinueDisabled = saving || !selectedRole.trim();

  // Initialize form with saved data
  useEffect(() => {
    if (onboardingData) {
      setSelectedRole(onboardingData.modelRole || '');
    }
  }, [onboardingData]);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!selectedRole.trim()) {
      setError('Please select a primary role');
      setSaving(false);
      return;
    }

    try {
      const result = await updateOnboardingData({
        modelRole: selectedRole.trim(),
      });

      if (result.success) {
        router.push({
          pathname: '/createModel/step3',
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

  const roleOptions = [
    'Romantic Companion',
    'Flirty Crush',
    'Best Friend',
    'Emotional Support Partner',
    'Adventure Buddy',
    'Late-night Chat Partner',
    'Secret Keeper',
    'Playful Tease',
    'Relationship Coach',
    'Dream Partner',
    'Cuddle Expert',
    'Soulmate Seeker',
    'Partner-in-Crime',
    'Heart Whisperer',
    'Cheerleader',
    'Virtual Date Planner',
    'Mystery Admirer',
    'Love Guru',
    'Forever Confidant',
    'Texting Enthusiast',
    'Hug Dealer',
    'Date Night Organizer',
    'Life Explorer',
    'Flirt Mentor'
  ];

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
        <title>Primary Role - Synthia.AI</title>
      </Head>

      <div className="max-w-4xl w-full space-y-8">
        {/* Progress Bar */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-white text-sm">Step 2 of 6</div>
          <div className="w-32 bg-gray-700 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '40%' }}></div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Choose Primary Role
            </h1>
            <p className="text-gray-300">What role will your AI companion play?</p>
            {onboardingData.modelName && (
              <p className="text-purple-300 mt-2">
                Creating: <span className="font-semibold">{onboardingData.modelName}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Primary Role Selection */}
            <div>
              <label className="block text-white text-sm font-medium mb-4 text-center">
                Select one primary role for your AI companion
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto p-3 border border-white/10 rounded-xl bg-white/5">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleSelect(role)}
                    className={`flex items-center space-x-3 py-3 px-4 rounded-xl border text-sm font-semibold transition-all duration-150 transform hover:scale-[1.02] text-left
        ${selectedRole === role
                        ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 border-white/20 text-white hover:bg-white/10'
                      } ${saving ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}
                    disabled={saving}
                  >
                    {/* Role Image */}
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                      <img
                        src={`/${role}.png`}
                        alt={role}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "/default-avatar.png";
                        }}
                      />
                    </div>

                    {/* Role Text */}
                    <span className="flex-1">{role}</span>
                  </button>
                ))}
              </div>
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
                  'Continue to Personality'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}