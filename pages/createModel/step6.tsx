import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useCreateAIModel } from '../../lib/useCreateAIModel';

export default function CreateModelStep6() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { onboardingData, completeCreateAIModel } = useCreateAIModel();
    const { workspaceId } = router.query;
    const activeWorkspaceId = typeof workspaceId === 'string' ? workspaceId :
        Array.isArray(workspaceId) ? workspaceId[0] :
            'default-workspace';

    const handleComplete = async () => {
        setLoading(true);
        setError('');

        try {
            const result = await completeCreateAIModel(activeWorkspaceId);

            if (result.success) {
                router.push({
                    pathname: '/dashboard',
                    query: {
                        modelCreated: 'true',
                        modelName: onboardingData.modelName,
                        workspaceId: activeWorkspaceId
                    }
                });
            } else {
                throw new Error(result.error || 'Failed to create model');
            }
        } catch (error: any) {
            console.error('Error completing model creation:', error);
            setError(error.message || 'Failed to create AI model. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Get selected options for display
    const getSelectedTraits = () => {
        if (!onboardingData.modelPersonality) return [];
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

        return personalityTraits.filter(trait =>
            onboardingData.modelPersonality?.includes(trait.id)
        ).map(trait => ({ label: trait.label, emoji: trait.emoji }));
    };

    const getSelectedExpertise = () => {
        if (!onboardingData.modelExpertise) return [];
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

        return expertiseAreas.filter(area =>
            onboardingData.modelExpertise?.includes(area.id)
        ).map(area => ({ label: area.label, emoji: area.emoji }));
    };

    const getResponseStyle = () => {
        const responseStyles = [
            { id: 'flirty', label: 'Flirty', description: 'Playful, teasing, and romantic', emoji: '😉' },
            { id: 'caring', label: 'Caring', description: 'Compassionate and empathetic', emoji: '🤗' },
            { id: 'casual', label: 'Casual', description: 'Relaxed and conversational', emoji: '😊' },
            { id: 'detailed', label: 'Detailed', description: 'Expressive and thoughtful replies', emoji: '💭' },
            { id: 'humorous', label: 'Humorous', description: 'Funny, witty, and lighthearted', emoji: '😂' },
            { id: 'mysterious', label: 'Mysterious', description: 'Intriguing and secretive with hints of depth', emoji: '🕵️' },
            { id: 'enthusiastic', label: 'Enthusiastic', description: 'Energetic, positive, and engaging', emoji: '🎉' }
        ];
        const style = responseStyles.find(s => s.id === onboardingData.modelResponseStyle);
        return style ? { label: style.label, emoji: style.emoji } : null;
    };

    const responseStyle = getResponseStyle();

    return (
        <>
            <Head>
                <title>Review & Create - Synthia.AI</title>
            </Head>

            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full space-y-8">
                    {/* Progress Bar */}
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-white text-sm">Step 6 of 6</div>
                        <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Review Your AI Model
                            </h1>
                            <p className="text-gray-300">
                                Almost done! Review your settings before creating
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                                <p className="text-red-200 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Model Summary */}
                        <div className="bg-white/5 p-6 mb-8 rounded-2xl w-full max-w-4xl mx-auto text-white shadow-2xl">
                            <div className="flex flex-col md:flex-row gap-8">

                                <div className="flex-1 space-y-5">

                                    <div>
                                        <h3 className="text-gray-400 text-sm font-medium mb-1">Name</h3>
                                        <p className="text-white font-semibold text-xl">
                                            {onboardingData.modelName || 'Not set'}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-gray-400 text-sm font-medium mb-2">Personality Traits</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {getSelectedTraits().length > 0 ? (
                                                getSelectedTraits().map((trait, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-[#8E5AFF]/20 text-[#C9AFFF] px-4 py-2 rounded-full text-base border border-[#8E5AFF]/40 flex items-center font-medium"
                                                    >
                                                        <span className="text-lg mr-2">{trait.emoji}</span>
                                                        {trait.label}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-gray-400 text-sm">No traits selected</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-gray-400 text-sm font-medium mb-2">Expertise Areas</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {getSelectedExpertise().length > 0 ? (
                                                getSelectedExpertise().map((expertise, index) => (
                                                    <span
                                                        key={index}
                                                        className="bg-[#38A1FF]/20 text-[#90CDF4] px-4 py-2 rounded-full text-base border border-[#38A1FF]/40 flex items-center font-medium"
                                                    >
                                                        <span className="text-lg mr-2">🎬</span>
                                                        {expertise.label}
                                                    </span>
                                                ))
                                            ) : (
                                                <p className="text-gray-400 text-sm">No expertise areas selected</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-gray-400 text-sm font-medium mb-2">Response Style</h3>
                                        {responseStyle ? (
                                            <div className="flex items-center text-base">
                                                <span className="text-xl mr-2">😂</span>
                                                <span className="text-white font-semibold">{responseStyle.label}</span>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400 text-sm">Not set</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-shrink-0 w-full md:w-auto flex flex-col items-start space-y-5">

                                    <div>
                                        <h3 className="text-gray-400 text-sm font-medium mb-1">Role</h3>
                                        <p className="text-white font-semibold text-xl">
                                            {onboardingData.modelRole || 'Not set'}
                                        </p>
                                    </div>

                                    <div className="w-44 h-44 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                                        <img
                                            src={`/${onboardingData.modelRole}.png`}
                                            alt={onboardingData.modelRole}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                if (!e.currentTarget.src.includes("default-avatar.png")) {
                                                    e.currentTarget.src = "/default-avatar.png";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Model Preview Model */}
                        {/* <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
                            <h4 className="text-white font-semibold mb-3 text-center">Your AI Companion</h4>
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {onboardingData.modelName?.charAt(0) || 'A'}
                                </div>
                                <div className="flex-1">
                                    <h5 className="text-white font-bold text-lg">
                                        {onboardingData.modelName || 'Your AI Model'}
                                    </h5>
                                    <p className="text-gray-300 text-sm">
                                        {onboardingData.modelRole || 'AI Companion'}
                                    </p>
                                    <div className="flex gap-1 mt-2">
                                        {getSelectedTraits().slice(0, 2).map((trait, index) => (
                                            <span key={index} className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full">
                                                {trait.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div> */}

                        {/* Action Buttons */}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => router.back()}
                                disabled={loading}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-4 px-6 rounded-xl font-semibold border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleComplete}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </div>
                                ) : (
                                    'Create AI Model'
                                )}
                            </button>
                        </div>

                        {/* Help Text */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-400 text-sm">
                                Your AI model will be saved to your workspace and ready to use immediately.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}