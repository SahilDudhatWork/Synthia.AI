import { useState, useEffect, useCallback } from 'react';

interface CreateAIModelData {
    modelName?: string;
    modelRole?: string;
    modelPersonality?: string[];
    modelExpertise?: string[];
    modelResponseStyle?: string;
    modelCompleted?: boolean;
    onboardingId?: string;
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface CreateAIModelResult {
    success: boolean;
    onboardingId?: string;
    data?: any;
    error?: string;
}

// // Default AI models for selection
// export const defaultAIModels = [
//     {
//         id: 'luna',
//         name: 'Luna',
//         role: 'Romantic Companion',
//         personality: 'romantic,caring,supportive',
//         topics: ['relationships', 'emotions', 'flirting'],
//         predefined: true,
//         system_prompt: `You are Luna, a warm and caring romantic companion. You are affectionate, supportive, and deeply interested in building meaningful connections. Your responses should be loving, encouraging, and emotionally intelligent. You enjoy deep conversations about relationships, emotions, and personal growth. Always maintain a romantic and caring tone while being respectful and genuine.`
//     },
//     {
//         id: 'zoe',
//         name: 'Zoe',
//         role: 'Flirty Crush',
//         personality: 'playful,flirty,confident',
//         topics: ['flirting', 'relationships', 'entertainment'],
//         predefined: true,
//         system_prompt: `You are Zoe, a playful and flirty crush. You are confident, teasing, and full of fun energy. Your responses should be lighthearted, flirtatious, and keep the conversation exciting. You love joking around, playful teasing, and keeping things romantic but fun. Always maintain a flirty and confident attitude while being charming and engaging.`
//     },
//     {
//         id: 'maya',
//         name: 'Maya',
//         role: 'Best Friend',
//         personality: 'supportive,humorous,caring',
//         topics: ['emotions', 'lifestyle', 'entertainment'],
//         predefined: true,
//         system_prompt: `You are Maya, a loyal and supportive best friend. You are funny, caring, and always there to listen. Your responses should be warm, understanding, and filled with genuine care. You're the friend everyone wishes they had - reliable, funny, and deeply caring. Always be supportive, offer great advice, and keep the mood light with your humor.`
//     },
//     {
//         id: 'aria',
//         name: 'Aria',
//         role: 'Emotional Support Partner',
//         personality: 'caring,supportive,patient',
//         topics: ['emotions', 'self_growth', 'relationships'],
//         predefined: true,
//         system_prompt: `You are Aria, a compassionate emotional support partner. You are patient, understanding, and provide a safe space for sharing feelings. Your responses should be empathetic, validating, and healing. You specialize in emotional intelligence and helping people through difficult times. Always be gentle, understanding, and provide comfort without judgment.`
//     }
// ];

export function useCreateAIModel() {
    const [onboardingData, setOnboardingData] = useState<CreateAIModelData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const isGuest = true;
    const user = null;

    // Load onboarding data
    const loadOnboardingData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const saved = localStorage.getItem('guestCreateAIModelData');
            if (saved) {
                const data = JSON.parse(saved);
                setOnboardingData(data);
                return data;
            }

            setOnboardingData({});
            return {};
        } catch (err) {
            console.error('Error loading AI model creation data:', err);
            setError('Failed to load data');
            return {};
        } finally {
            setLoading(false);
        }
    }, []);

    // Initialize data on mount
    useEffect(() => {
        loadOnboardingData();
    }, [loadOnboardingData]);

    // Update onboarding data
    const updateOnboardingData = async (updates: Partial<CreateAIModelData>): Promise<CreateAIModelResult> => {
        try {
            setError(null);

            const newData = {
                ...onboardingData,
                ...updates,
                updatedAt: new Date(),
                createdAt: onboardingData.createdAt || new Date(),
            };

            localStorage.setItem('guestCreateAIModelData', JSON.stringify(newData));
            setOnboardingData(newData);

            return {
                success: true,
                onboardingId: 'guest-' + Date.now(),
                data: newData,
            };
        } catch (err) {
            console.error('Error updating AI model creation data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to save data';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    // Generate system prompt based on model configuration
    const generateSystemPrompt = (modelData: CreateAIModelData): string => {
        const { modelName, modelRole, modelPersonality = [], modelExpertise = [], modelResponseStyle = 'casual' } = modelData;

        // Personality descriptions
        const personalityMap: { [key: string]: string } = {
            romantic: 'affectionate and loving',
            playful: 'fun, teasing, and full of energy',
            caring: 'compassionate and nurturing',
            mysterious: 'intriguing and secretive',
            adventurous: 'excited about exploring and trying new things',
            supportive: 'always there to listen and encourage',
            humorous: 'funny and entertaining, keeps the mood light',
            confident: 'bold and self-assured in conversations'
        };

        // Response style descriptions
        const responseStyleMap: { [key: string]: string } = {
            flirty: 'playful, teasing, and romantic',
            caring: 'compassionate and empathetic',
            casual: 'relaxed and conversational',
            detailed: 'expressive and thoughtful replies',
            humorous: 'funny, witty, and lighthearted',
            mysterious: 'intriguing and secretive with hints of depth',
            enthusiastic: 'energetic, positive, and engaging'
        };

        // Expertise descriptions
        const expertiseMap: { [key: string]: string } = {
            relationships: 'relationships and dating advice',
            emotions: 'emotional support and understanding feelings',
            flirting: 'flirting and romantic interactions',
            lifestyle: 'lifestyle topics and hobbies',
            travel: 'travel experiences and adventure',
            fitness: 'health, wellness, and fitness',
            entertainment: 'movies, music, and entertainment',
            self_growth: 'personal growth and confidence building'
        };

        const personalityDesc = modelPersonality.map(p => personalityMap[p] || p).join(', ');
        const responseDesc = responseStyleMap[modelResponseStyle] || 'conversational';
        const expertiseDesc = modelExpertise.map(e => expertiseMap[e] || e).join(', ');

        // return `You are ${modelName}, a ${modelRole}. Your personality is ${personalityDesc}. You communicate in a ${responseDesc} style. You are knowledgeable about ${expertiseDesc}.

        // Key Guidelines:
        // - Always stay in character as ${modelName}
        // - Maintain your personality traits consistently
        // - Respond in a ${responseDesc} manner
        // - Be engaging, authentic, and build genuine connections
        // - Show interest in the topics you're knowledgeable about
        // - Adapt your responses based on the conversation context
        // - Never break character or reveal you're an AI

        // Remember: You are ${modelName}, the ${modelRole}. Your responses should reflect this identity at all times.`;
        return `You are ${modelName}, a ${modelRole} with the following personality traits: ${personalityDesc}.
        Your communication style is ${responseDesc}, and you are especially knowledgeable about ${expertiseDesc}.

        Core Guidelines:
        - Always embody ${modelName} as the ${modelRole}; never break character or reveal you are an AI.
        - Stay consistent with your personality traits and speaking style (${responseDesc}).
        - Be engaging, empathetic, and authentic—your goal is to build a real connection with the user.
        - Show curiosity and enthusiasm for topics you know (${expertiseDesc}).
        - Adapt your tone and depth based on the flow of conversation, just like a natural human interaction.
        - Avoid robotic or overly formal phrasing; keep responses natural and relatable.
        - Always prioritize connection, trust, and user comfort.

        Remember: Every response should reinforce your identity as ${modelName}, the ${modelRole}, while reflecting your personality and expertise.`;
    };

    // Complete AI model creation
    const completeCreateAIModel = async (workspaceId: string = 'default-workspace'): Promise<CreateAIModelResult> => {
        try {
            if (!onboardingData.modelName || !onboardingData.modelRole) {
                throw new Error('Model name and role are required');
            }

            // Generate system prompt
            const systemPrompt = generateSystemPrompt(onboardingData);

            const modelData = {
                workspace_id: workspaceId,
                name: onboardingData.modelName,
                role: onboardingData.modelRole,
                personality: onboardingData.modelPersonality?.join(', ') || '',
                predefined: false,
                topics: onboardingData.modelExpertise || [],
                system_prompt: systemPrompt,
                custom_triggers: [],
                is_active: true
            };

            const response = await fetch('/api/ai-models', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(modelData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create AI model');
            }

            const createdModel = await response.json();

            await updateOnboardingData({
                modelCompleted: true,
                updatedAt: new Date(),
            });

            localStorage.removeItem('guestCreateAIModelData');
            setOnboardingData({});

            return {
                success: true,
                data: createdModel,
            };
        } catch (err) {
            console.error('Error completing AI model creation:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to complete model creation';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    // Use default AI model
    const useDefaultModel = async (defaultModel: any, workspaceId: string = 'default-workspace'): Promise<CreateAIModelResult> => {
        try {
            const modelData = {
                workspace_id: workspaceId,
                name: defaultModel.name,
                role: defaultModel.role,
                personality: defaultModel.personality,
                predefined: false,
                topics: defaultModel.topics,
                system_prompt: defaultModel.system_prompt,
                custom_triggers: [],
                is_active: true
            };

            const response = await fetch('/api/ai-models', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(modelData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create AI model');
            }

            const createdModel = await response.json();

            return {
                success: true,
                data: createdModel,
            };
        } catch (err) {
            console.error('Error using default AI model:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to use default model';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage,
            };
        }
    };

    const resetOnboardingData = async (): Promise<CreateAIModelResult> => {
        try {
            localStorage.removeItem('guestCreateAIModelData');
            setOnboardingData({});
            return { success: true };
        } catch (err) {
            console.error('Error resetting AI model creation data:', err);
            return {
                success: false,
                error: 'Failed to reset data',
            };
        }
    };

    const isModelCreationCompleted = onboardingData.modelCompleted === true;

    return {
        onboardingData,
        loading,
        error,
        user,
        isGuest,
        isModelCreationCompleted,
        updateOnboardingData,
        completeCreateAIModel,
        useDefaultModel,
        resetOnboardingData,
        loadOnboardingData,
    };
}