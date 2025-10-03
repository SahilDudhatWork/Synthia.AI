
import { supabase } from './supabaseClient';

export interface WorkspaceData {
    id?: string;
    user_id: string;

    // Onboarding progress
    current_step?: number;
    onboarding_complete?: boolean;

    // User static info
    name?: string;
    age?: number;
    gender?: string;
    interests?: string[]; // e.g. music, movies, fitness
    goals?: string[]; // e.g. companionship, learning, stress relief
    personality_type?: string; // introvert, extrovert, etc.

    // General preferences
    preferred_communication?: string[]; // chat, voice, video
    privacy_level?: string; // high, medium, low
    memory_enabled?: boolean;

    created_at?: string;
    updated_at?: string;

    [key: string]: any; // Allow flexible partial updates
}


export async function getWorkspace({
    userId,
    workspaceId,
}: {
    userId?: string;
    workspaceId?: string;
}): Promise<WorkspaceData | null> {
    let query = supabase.from('workspaces').select('*');

    if (workspaceId) {
        query = query.eq('id', workspaceId);
    } else if (userId) {
        query = query.eq('user_id', userId);
    } else {
        console.error('Either userId or workspaceId must be provided.');
        return null;
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching workspace:', error);
        return null;
    }

    return data ?? null;
}

export async function saveStepData(
    {
        userId,
        workspaceId
    }: {
        userId?: string;
        workspaceId?: string;
    },
    stepData: Partial<WorkspaceData>,
    nextStep: number
): Promise<{ error?: any }> {
    let query = supabase
        .from('workspaces')
        .update({
            ...stepData,
            current_step: nextStep,
            updated_at: new Date().toISOString()
        });

    if (workspaceId) {
        query = query.eq('id', workspaceId);
    } else if (userId) {
        query = query.eq('user_id', userId);
    } else {
        console.error('Either userId or workspaceId must be provided.');
        return { error: 'Missing identifier' };
    }

    const { error } = await query;

    if (error) {
        console.error('Error saving step data:', error);
        return { error };
    }

    return {};
}

export async function markOnboardingComplete(identifier: string | { workspaceId: string }) {
    const update = { onboarding_complete: true };

    if (typeof identifier === 'string') {
        return supabase.from('workspaces').update(update).eq('user_id', identifier);
    } else {
        return supabase.from('workspaces').update(update).eq('id', identifier.workspaceId);
    }
}

// FIXED: Pass string userId directly
export async function markCompleted(userId: string) {
    return markOnboardingComplete(userId);
}
